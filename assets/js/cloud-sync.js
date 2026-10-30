/* Machining Desk V1.12.2 — local-first, revision-checked two-way synchronization.
 * A durable IndexedDB merge baseline enables three-way comparison, including
 * record-level merging for Technology Database entries and saved setups.
 * Conflicts are never resolved by silently overwriting another device.
 * No server-side secrets belong in this file.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.MachiningDeskCloudConfig || {};
  const available = /^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(String(config.url || '').trim()) &&
    /^sb_publishable_|^eyJ/.test(String(config.publishableKey || '').trim());
  const status = $('cloudStatus');
  const PREFIX = /^(?:machiningDesk|md-)/;
  const EXCLUDE = /^(?:md-cloud-|md-coating-family-|md-threaded-fasteners-default-|machiningDeskMigration|machiningDeskData$)/;
  const DATABASE_KEY = 'machiningDeskTechnology';
  const SNAPSHOT_VERSION = 1;
  const APP_VERSION = '1.12.3';
  const INTERVAL_MS = 45000;
  const NO_VALUE = Symbol('absent');
  const equal = (x, y) => {
    if (x === y) return true;
    if (x === NO_VALUE || y === NO_VALUE || x === null || y === null || typeof x !== typeof y) return false;
    if (typeof x !== 'object') return false;
    if (Array.isArray(x) !== Array.isArray(y)) return false;
    if (Array.isArray(x)) return x.length === y.length && x.every((v, i) => equal(v, y[i]));
    const keys = Object.keys(x), other = Object.keys(y);
    return keys.length === other.length && keys.every(k => Object.hasOwn(y, k) && equal(x[k], y[k]));
  };
  const jsonObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const cloudSetting = id => 'md-cloud-enabled-' + id;
  const legacyRevision = id => 'md-cloud-revision-v1-' + id;

  let client = null, user = null, base = null, busy = false, auto = false;
  let sessionGeneration = 0, sdkPromise = null, nextSync = null, periodic = null;
  let pending = null, needsReload = false, applying = false, currentStatus = '';

  function notice(message, error = false) {
    currentStatus = message;
    status.textContent = message;
    status.classList.toggle('error', error);
    $('cloudBanner')?.classList.toggle('hidden', !needsReload);
    $('openCloud').classList.toggle('cloud-attention', !!pending || needsReload);
    $('openCloud').title = pending ? 'Cloud sync needs conflict review' : needsReload ? 'Cloud sync is ready; reload needed' : 'Private cloud synchronization';
  }
  function ownKey(k) { return PREFIX.test(k) && !EXCLUDE.test(k) && !k.startsWith('sb-'); }
  function keys() { return Object.keys(localStorage).filter(ownKey).sort(); }
  function current() {
    const data = Object.create(null);
    for (const k of keys()) data[k] = localStorage.getItem(k);
    const db = window.MachiningDeskIntegration?.getDb?.();
    if (db) data[DATABASE_KEY] = JSON.stringify(db);
    return { schema: SNAPSHOT_VERSION, appVersion: APP_VERSION, savedAt: new Date().toISOString(), data };
  }
  function valid(value) {
    if (!jsonObject(value) || value.schema !== SNAPSHOT_VERSION || !jsonObject(value.data)) return false;
    if (typeof value.data[DATABASE_KEY] !== 'string') return false;
    if (Object.entries(value.data).some(([k,v]) => !ownKey(k) || typeof v !== 'string')) return false;
    try { const d = JSON.parse(value.data[DATABASE_KEY]); return jsonObject(d) &&
      ['machines', 'materials', 'tools', 'coatings'].every(k => Array.isArray(d[k])); }
    catch { return false; }
  }
  function exportFile(body, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.append(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1800);
  }
  function database() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB is unavailable. Automatic synchronization requires browser storage.'));
      const req = indexedDB.open('machining-desk-cloud-sync', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('bases')) db.createObjectStore('bases', {keyPath: 'userId'});
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', {keyPath: 'id'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || Error('Cloud sync storage could not be opened.'));
    });
  }
  async function storeGet(store, key) {
    const db = await database();
    try { return await new Promise((resolve,reject) => {
      const tx=db.transaction(store,'readonly'), req=tx.objectStore(store).get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    }); } finally { db.close(); }
  }
  async function storePut(store, item) {
    const db = await database();
    try { await new Promise((resolve,reject) => {
      const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(item);
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error || Error('Database transaction aborted.'));
    }); } finally { db.close(); }
  }
  async function remember(revision, payload) {
    if (!user || !Number.isInteger(Number(revision)) || Number(revision) < 1 || !valid(payload)) throw Error('Invalid synchronization baseline.');
    const next = {userId:user.id,revision:Number(revision),payload};
    await storePut('bases',next);
    base = next;
    localStorage.setItem(legacyRevision(user.id),String(revision));
  }
  async function saveBackup(snapshot, reason) {
    if (!user || !valid(snapshot)) return;
    await storePut('backups',{id:user.id+'|'+Date.now()+'|'+Math.random().toString(16).slice(2),userId:user.id,when:new Date().toISOString(),reason,payload:snapshot});
    // Retain six recent safety copies per account to bound browser storage usage.
    const db=await database();
    try {await new Promise((resolve,reject)=>{
      const tx=db.transaction('backups','readwrite'),store=tx.objectStore('backups');
      const req=store.getAll();
      req.onsuccess=()=>{
        const excess=(req.result||[]).filter(x=>x.userId===user.id).sort((a,b)=>b.when.localeCompare(a.when)).slice(6);
        for(const item of excess)store.delete(item.id);
      };
      req.onerror=()=>reject(req.error);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Could not save safety backup.'));
    });}finally{db.close();}
  }
  function apply(payload) {
    if (!valid(payload)) throw Error('Invalid downloaded data; your local database was not modified.');
    applying = true;
    try {
      for (const key of keys()) if (!Object.hasOwn(payload.data,key)) localStorage.removeItem(key);
      for (const [key,value] of Object.entries(payload.data)) if (ownKey(key)) localStorage.setItem(key,value);
    } finally { applying = false; }
  }
  function controls() {
    $('cloudSession').classList.toggle('hidden',!user);
    $('cloudAuth').classList.toggle('hidden',!!user);
    $('cloudIdentity').textContent=user?.email||'';
    for (const id of ['cloudUpload','cloudDownload','cloudSignOut','cloudSyncNow']) $(id).disabled=busy||!user;
    for (const id of ['cloudSignIn','cloudSignUp']) $(id).disabled=busy||!available;
    $('cloudAutoSync').disabled=busy||!user||needsReload;
    $('cloudAutoSync').checked=!!auto;
    $('cloudSyncNow').classList.toggle('hidden',!user);
    $('cloudConflictBox').classList.toggle('hidden',!pending);
    $('cloudReload').classList.toggle('hidden',!needsReload);
    $('cloudBanner').classList.toggle('hidden',!needsReload);
  }
  function queue(delay = 1700) {
    if (!auto || !user || busy || pending || needsReload || !navigator.onLine) return;
    clearTimeout(nextSync); nextSync=setTimeout(()=>runSync(),delay);
  }
  function loadSdk() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    if (sdkPromise) return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script'); s.async=true;
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(Error('Supabase library failed to load.'));
      s.onerror=()=>reject(Error('Supabase library unavailable offline. Local editing still works.'));
      document.head.append(s);
    }).catch(e=>{sdkPromise=null;throw e;});
    return sdkPromise;
  }
  async function cloudRow(cached = false) {
    const columns=cached&&base?'revision,updated_at':'revision,payload,updated_at';
    const {data,error}=await client.from('md_cloud_snapshots').select(columns).eq('user_id',user.id).maybeSingle();
    if (error) throw error;
    if (data && !Number.isInteger(Number(data.revision))) throw Error('Cloud revision is invalid. Local data was not changed.');
    if (cached && data && base && Number(data.revision) === base.revision) return {...data,payload:base.payload};
    if (cached && data && base) return cloudRow(false);
    if (data && !valid(data.payload)) throw Error('Cloud data is invalid or uses a newer format. Local data was not changed.');
    return data||null;
  }
  async function cloudSave(expected,payload) {
    if (!valid(payload)) throw Error('Incomplete or invalid database. Nothing was uploaded.');
    const {data,error}=await client.rpc('md_save_snapshot',{p_expected:expected,p_payload:payload});
    if (error) throw error;
    return data?.ok ? Number(data.revision) : null;
  }
  function prepare(payload) {return {schema:SNAPSHOT_VERSION,appVersion:APP_VERSION,savedAt:new Date().toISOString(),data:payload};}
  function decode(raw) {
    if (raw===NO_VALUE || typeof raw!=='string'|| !/^[\s]*[\[{]/.test(raw)) return raw;
    try { const o=JSON.parse(raw); return o!==null && typeof o==='object'?o:raw; } catch { return raw; }
  }
  function encode(value) { return typeof value==='string'?value:JSON.stringify(value); }
  function choiceId(path) {return JSON.stringify(path);}
  const labelOf = path => path.map((p,i)=>i===0?({machiningDeskTechnology:'Technology Database',machiningDeskSetups:'Saved setups'}[p]||p):String(p)).join(' › ');
  function mergeValue(b,l,r,path,conflicts,choices) {
    if (equal(l,r)) return l;
    if (equal(l,b)) return r;
    if (equal(r,b)) return l;
    if (jsonObject(l) && jsonObject(r) && (jsonObject(b)||b===NO_VALUE)) {
      const result=Object.create(null);
      for(const key of new Set([...Object.keys(b===NO_VALUE?{}:b),...Object.keys(l),...Object.keys(r)])) {
        if(key==='__proto__'||key==='constructor'||key==='prototype') continue;
        const v=mergeValue(b===NO_VALUE?NO_VALUE:(Object.hasOwn(b,key)?b[key]:NO_VALUE),
          Object.hasOwn(l,key)?l[key]:NO_VALUE,Object.hasOwn(r,key)?r[key]:NO_VALUE,[...path,key],conflicts,choices);
        if(v!==NO_VALUE)result[key]=v;
      }
      return result;
    }
    if(Array.isArray(l)&&Array.isArray(r)&& (Array.isArray(b)||b===NO_VALUE)) {
      const before=b===NO_VALUE?[]:b;
      const identified=arr=>arr.every(o=>jsonObject(o)&&typeof o.id==='string'&&o.id.length);
      if(identified(l)&&identified(r)&&identified(before)) {
        const bm=new Map(before.map(x=>[x.id,x])),lm=new Map(l.map(x=>[x.id,x])),rm=new Map(r.map(x=>[x.id,x]));
        const result=[];
        for(const id of new Set([...lm.keys(),...rm.keys(),...bm.keys()])){
          const v=mergeValue(bm.has(id)?bm.get(id):NO_VALUE,lm.has(id)?lm.get(id):NO_VALUE,rm.has(id)?rm.get(id):NO_VALUE,[...path,id],conflicts,choices);
          if(v!==NO_VALUE)result.push(v);
        }
        return result;
      }
      // Scalar favorites may be updated independently on separate devices.
      const primitives=arr=>arr.every(x=>typeof x==='string'||typeof x==='number');
      if(primitives(l)&&primitives(r)&&primitives(before)) {
        const result=[];
        for(const id of new Set([...before,...l,...r])) {
          const v=mergeValue(before.includes(id),l.includes(id),r.includes(id),[...path,String(id)],conflicts,choices);
          if(v)result.push(id);
        }
        return result;
      }
    }
    const id=choiceId(path), decision=choices?.[id];
    if(decision==='local')return l;
    if(decision==='cloud')return r;
    conflicts.push({id,label:labelOf(path),local:l,remote:r});
    return l; // Placeholder; a result with unresolved conflicts is never written.
  }
  function mergeSnapshots(original,local,remote,choices) {
    const b=original?.data||{}, l=local.data, r=remote.data;
    const result=Object.create(null), conflicts=[];
    for(const key of new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])) {
      if(!ownKey(key))continue;
      const bv=Object.hasOwn(b,key)?b[key]:NO_VALUE,
        lv=Object.hasOwn(l,key)?l[key]:NO_VALUE,rv=Object.hasOwn(r,key)?r[key]:NO_VALUE;
      let v;
      // Structured application records can merge property-by-property.
      const decoded=[bv,lv,rv].map(decode);
      if(decoded.some(x=>x!==NO_VALUE&&typeof x==='object') && decoded.every(x=>x===NO_VALUE||typeof x==='object')) {
        v=mergeValue(...decoded,[key],conflicts,choices);
        if(v!==NO_VALUE)v=encode(v);
      } else v=mergeValue(bv,lv,rv,[key],conflicts,choices);
      if(v!==NO_VALUE)result[key]=v;
    }
    return {payload:prepare(result),conflicts};
  }
  function preview(v){if(v===NO_VALUE)return '(deleted)';const s=typeof v==='string'?v:JSON.stringify(v);return (s?.length>240?s.slice(0,240)+'…':s)||'(empty)';}
  function presentConflicts() {
    const host=$('cloudConflictList'); host.replaceChildren();
    if(!pending)return;
    $('cloudConflictSummary').textContent=`${pending.merge.conflicts.length} conflicting setting(s) were edited on both devices. Choose which value to keep for each. Nothing has been overwritten.`;
    for(const [i,c] of pending.merge.conflicts.entries()) {
      const line=document.createElement('div');line.className='cloud-conflict-item';
      const title=document.createElement('strong');title.textContent=(i+1)+'. '+c.label;
      const selector=document.createElement('select');selector.dataset.conflictId=c.id;
      for(const [value,label] of [['','Choose a version…'],['local','Keep this device'],['cloud','Keep cloud']]) {
        const option=document.createElement('option');option.value=value;option.textContent=label;selector.append(option);
      }
      const localValue=document.createElement('div');localValue.textContent='This device: '+preview(c.local);
      const cloudValue=document.createElement('div');cloudValue.textContent='Cloud: '+preview(c.remote);
      const details=document.createElement('details'); const summary=document.createElement('summary');summary.textContent='Compare values';
      details.append(summary,localValue,cloudValue);
      line.append(title,selector,details);host.append(line);
    }
    controls();
  }
  async function perform(action) {
    if(busy)return;
    busy=true;controls();
    try {await action();} catch(e) {
      console.error('Machining Desk cloud',e);
      notice((!navigator.onLine?'Offline — changes remain on this device. ':'')+(e.message||String(e)),true);
    } finally {busy=false;controls();}
  }
  async function onSession(nextUser) {
    const uid=nextUser?.id||null;
    if(uid===user?.id)return;
    sessionGeneration++;clearTimeout(nextSync);
    window.dispatchEvent(new Event('machiningdesk:cloud-user'));
    user=nextUser;pending=null;needsReload=false;base=null;auto=false;
    window.dispatchEvent(new Event('machiningdesk:cloud-user'));
    controls();
    if(!user){notice('Cloud connection ready. Sign in to sync your devices.');return;}
    const generation=sessionGeneration;
    try {
      base=await storeGet('bases',user.id);
      if(generation!==sessionGeneration)return;
      auto=localStorage.getItem(cloudSetting(user.id))==='1' && !!base;
      const row=await cloudRow();
      if(generation!==sessionGeneration)return;
      const extra=row?`Cloud revision ${row.revision}.`:'No cloud backup yet.';
      notice(`Signed in. ${extra} ${auto?'Automatic sync is on.':'Automatic sync is off.'}`);
      controls();
      if(auto)queue(1000);
    } catch(e){auto=false;notice('Signed in. Cloud status unavailable: '+(e.message||e),true);controls();}
  }
  async function initialize() {
    if(!available){notice('Cloud URL or publishable key is not configured. Local use is unaffected.');return;}
    const sdk=await loadSdk();
    client=sdk.createClient(config.url.trim().replace(/\/$/,''),config.publishableKey.trim(),
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    client.auth.onAuthStateChange((_,session)=>setTimeout(()=>onSession(session?.user||null),0));
    const {data,error}=await client.auth.getUser();
    if(error&&!/session missing/i.test(error.message||''))throw error;
    await onSession(data?.user||null);
  }
  async function sign(mode) {
    const email=$('cloudEmail').value.trim(),password=$('cloudPassword').value;
    if(!email||!password){notice('Enter email and password.',true);return;}
    await perform(async()=>{
      if(!client)await initialize();
      const {data,error}=mode==='signup'?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      $('cloudPassword').value='';
      if(mode==='signup'&&!data.session){notice('Check your email for the confirmation link, then sign in.');return;}
      await onSession(data?.user||data?.session?.user||null);
    });
  }
  async function startAuto() {
    if(!user||!client)return;
    await perform(async()=>{
      const row=await cloudRow(), local=current();
      if(!valid(local))throw Error('Local Technology Database is incomplete. Auto sync was not enabled.');
      if(!base) {
        if(row) {
          if(!equal(row.payload.data,local.data)){
            notice('To start automatic sync, first choose Download cloud or Upload this device. They differ, so nothing was overwritten.',true);
            auto=false;return;
          }
          await remember(row.revision,row.payload);
        } else {
          if(!confirm('Start automatic sync? This device’s current database will become the initial cloud copy.'))return;
          const rev=await cloudSave(0,local);
          if(!rev)throw Error('A cloud backup was created elsewhere. Review it before enabling sync.');
          await remember(rev,local);
        }
      }
      auto=true;localStorage.setItem(cloudSetting(user.id),'1');
      notice('Automatic synchronization enabled. Local changes are saved immediately; cloud updates are checked periodically.');
      queue(300);
    });
    if(auto)queue(300);
  }
  function stopAuto() {auto=false;clearTimeout(nextSync);if(user)localStorage.removeItem(cloudSetting(user.id));notice('Automatic sync paused. Local changes will be kept until you sync manually.');controls();}
  async function upload() {
    if(!user)return;
    if(!confirm('Replace the CLOUD backup with this device’s current data? This does not merge edits made elsewhere. Use Sync now when automatic sync has been initialized.'))return;
    await perform(async()=>{
      const local=current();if(!valid(local))throw Error('Incomplete local database. Upload cancelled.');
      const row=await cloudRow();
      if(base&&row&&row.revision!==base.revision)throw Error('Cloud was updated elsewhere. Use Sync now to merge or resolve conflicts before uploading.');
      if(row&&!equal(row.payload.data,local.data)) {
        if(!confirm('The cloud contains different data. Save a backup of the cloud and explicitly replace it with this device?'))return;
        exportFile(row.payload,'machining-desk-cloud-before-overwrite-'+new Date().toISOString().slice(0,10)+'.json');
      }
      const rev=await cloudSave(row?.revision||0,local);
      if(!rev)throw Error('Cloud changed during upload. Nothing was overwritten. Use Sync now.');
      await remember(rev,local);
      pending=null;
      notice(`Uploaded successfully (revision ${rev}). ${auto?'Automatic sync is on.':'Enable automatic sync to keep devices updated.'}`);
    });
  }
  async function download() {
    if(!user)return;
    await perform(async()=>{
      const row=await cloudRow();if(!row){notice('No cloud backup exists yet. Upload from your original device.');return;}
      if(!confirm(`Replace THIS DEVICE’s Machining Desk data with cloud revision ${row.revision}? Your current data will be exported first. Unsynced local edits will be replaced.`))return;
      const local=current();
      if(valid(local)){
        await saveBackup(local,'manual restore');
        exportFile(local,'machining-desk-before-restore-'+new Date().toISOString().slice(0,10)+'.json');
      }
      await remember(row.revision,row.payload);
      apply(row.payload);
      pending=null; needsReload=true;
      notice('Cloud data restored. Reload to apply the updated Technology Database.');
    });
  }
  async function syncAttempt(choices=null) {
    if(!user||!client||needsReload)return;
    if(!base){notice('This device has no synchronization baseline. Use Upload or Download once before enabling automatic sync.',true);auto=false;localStorage.removeItem(cloudSetting(user.id));return;}
    // A new snapshot is captured after each network response to avoid overwriting edits made while awaiting network.
    for(let attempt=0;attempt<3;attempt++) {
      const local=current();if(!valid(local))throw Error('Local database validation failed. No data was uploaded.');
      const row=await cloudRow(true);
      if(!equal(current().data,local.data)){choices=null;continue;}
      if(!row){notice('Cloud backup is missing. Sync paused so your local data is protected.',true);stopAuto();return;}
      const {payload,conflicts}=mergeSnapshots(base.payload,local,row.payload,choices);
      if(conflicts.length) {
        pending={local,row,merge:{payload,conflicts},baseline:base};
        presentConflicts();notice(`${conflicts.length} conflicting edit(s) need a choice. Open Cloud → Resolve conflicts.`,true);
        return;
      }
      if(!valid(payload))throw Error('Merged data failed validation. No data was changed.');
      if(!equal(current().data,local.data)){choices=null;continue;}
      const changeCloud=!equal(payload.data,row.payload.data);
      const changeLocal=!equal(payload.data,local.data);
      let newRevision=row.revision;
      if(changeCloud){newRevision=await cloudSave(row.revision,payload);if(!newRevision){choices=null;continue;}}
      if(changeLocal){
        await saveBackup(local,'before automatic merge');
        // A page reload is required: the in-memory Database must not remain stale.
        if(!equal(current().data,local.data)){
          // Cloud write may already have succeeded, but nothing local was overwritten.
          notice('Data changed during synchronization; reload this page to reconcile safely.',true);
          needsReload=true;return;
        }
      }
      const authoritative=changeCloud?payload:row.payload;
      await remember(newRevision,authoritative);
      if(changeLocal){apply(authoritative);needsReload=true;
        notice(`Cloud data merged (revision ${newRevision}). Reload Machining Desk to apply the changes.`);
      } else notice(`Synchronized successfully (cloud revision ${newRevision}).`);
      pending=null;controls();return;
    }
    throw Error('Cloud changed repeatedly during sync. Your local data is intact. Retry shortly.');
  }
  async function runSync(choices=null) {
    if(busy||pending&&!choices)return;
    await perform(async()=>{
      if(choices&&pending){
        // Reject a stale conflict decision if either side changed while the dialog was open.
        const newer=await cloudRow();
        if(!newer||newer.revision!==pending.row.revision||!equal(current().data,pending.local.data)){
          pending=null;notice('Data changed while reviewing conflicts. Rechecking both versions…');
          await syncAttempt();return;
        }
        pending=null;
      }
      await syncAttempt(choices);
    });
  }
  async function exportSafetyBackup(){
    await perform(async()=>{
      if(!user)return;
      const db=await database();
      let entries;
      try {entries=await new Promise((resolve,reject)=>{
        const tx=db.transaction('backups','readonly'),req=tx.objectStore('backups').getAll();
        req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
      });} finally {db.close();}
      const last=entries.filter(x=>x.userId===user.id).sort((a,b)=>b.when.localeCompare(a.when))[0];
      if(!last){notice('No automatic safety backup on this device yet. Use Database → Export to back up now.');return;}
      exportFile(last.payload,'machining-desk-safety-backup-'+last.when.slice(0,10)+'.json');
      notice('The most recent local safety backup was downloaded.');
    });
  }
  function attachChangeDetection() {
    // LocalStorage has no same-tab storage event. The wrapper catches app writes.
    const origSet=Storage.prototype.setItem,origRemove=Storage.prototype.removeItem;
    Storage.prototype.setItem=function(key,value){
      const before=this===localStorage?this.getItem(String(key)):null;
      const result=origSet.call(this,key,value);
      if(!applying&&this===localStorage&&ownKey(String(key))&&before!==String(value))queue();
      return result;
    };
    Storage.prototype.removeItem=function(key){
      const before=this===localStorage?this.getItem(String(key)):null;
      const result=origRemove.call(this,key);
      if(!applying&&this===localStorage&&ownKey(String(key))&&before!==null)queue();
      return result;
    };
    window.addEventListener('storage',e=>{
      if(e.key===DATABASE_KEY && window.MachiningDeskIntegration?.getDb && e.newValue!==JSON.stringify(window.MachiningDeskIntegration.getDb())) {
        needsReload=true;clearTimeout(nextSync);
        notice('Another Machining Desk tab changed the local database. Reload to avoid editing an out-of-date copy.',true);
        controls();return;
      }
      if(e.key===null||ownKey(e.key))queue(900);
    });
    window.addEventListener('online',()=>queue(700));
    window.addEventListener('focus',()=>queue(1000));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue(900);});
    periodic=setInterval(()=>queue(100),INTERVAL_MS);
  }
  $('openCloud').addEventListener('click',()=>{
    $('cloudLayer').classList.remove('hidden');
    if(available&&!client)perform(initialize);
    if(!available)notice('Cloud setup is required. Your existing database stays local.');
    controls();
  });
  document.querySelectorAll('[data-cloud-close]').forEach(el=>el.addEventListener('click',()=> $('cloudLayer').classList.add('hidden')));
  $('cloudSignIn').addEventListener('click',()=>sign('signin'));
  $('cloudSignUp').addEventListener('click',()=>sign('signup'));
  $('cloudUpload').addEventListener('click',upload);
  $('cloudDownload').addEventListener('click',download);
  $('cloudSyncNow').addEventListener('click',()=>runSync());
  $('cloudSafetyBackup').addEventListener('click',exportSafetyBackup);
  $('cloudAutoSync').addEventListener('change',ev=>ev.target.checked?startAuto():stopAuto());
  $('cloudResolve').addEventListener('click',()=>{
    if(!pending)return;
    const decisions={};
    for(const field of $('cloudConflictList').querySelectorAll('select')){
      if(!field.value){notice('Choose a version for every conflicting item before continuing.',true);field.focus();return;}
      decisions[field.dataset.conflictId]=field.value;
    }
    runSync(decisions);
  });
  $('cloudReload').addEventListener('click',()=>location.reload());
  $('cloudBannerReload').addEventListener('click',()=>location.reload());
  $('cloudBannerOpen').addEventListener('click',()=>$('openCloud').click());
  $('cloudSignOut').addEventListener('click',()=>perform(async()=>{
    if(!client)return;
    const {error}=await client.auth.signOut();if(error)throw error;
    await onSession(null);
    notice('Signed out. Your local data remains on this device.');
  }));
  attachChangeDetection(); controls();
  // Restore saved sessions automatically, even if the Cloud panel is never opened.
  if(available&&navigator.onLine)setTimeout(async()=>{await perform(initialize);if(auto)queue(500);},250);
  // Expose testable, non-privileged diagnostics (no credentials or user data).
  window.MachiningDeskCloudStatus=()=>({signedIn:!!user,automatic:auto,needsReload,conflicts:pending?.merge.conflicts.length||0,revision:base?.revision||null});
  // Reuse the existing authenticated Supabase connection for the community library.
  // The SDK client contains only browser-safe publishable credentials; authorization
  // is enforced by server-side Row Level Security and the review RPC.
  window.MachiningDeskCloudAccess={
    getClient:()=>client,
    getUser:()=>user,
    ensureReady:async()=>{if(!client && available)await initialize();return {client,user};}
  };
  window.addEventListener('machiningdesk:cloud-access-request',()=>window.dispatchEvent(new Event('machiningdesk:cloud-status')));
})();
