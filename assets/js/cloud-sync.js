/* Machining Desk v1.12.0: explicit local-first Supabase cloud backups.
 * A single per-user revisioned snapshot, with compare-and-swap SQL writes.
 * This first release deliberately does NOT enable silent automatic merging.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.MachiningDeskCloudConfig || {};
  const available = /^https:\/\/[\w.-]+\.supabase\.co\/?$/.test((config.url||'').trim()) &&
    !!(config.publishableKey||'').trim();
  const status = $('cloudStatus'), emailInput = $('cloudEmail'), passInput = $('cloudPassword');
  let client = null, user = null, revision = null, busy = false, sdkPromise = null;
  const cacheKey = 'md-cloud-revision-v1';
  let remoteRevision = null;
  function knownRevision(){if(!user)return null;const x=Number(localStorage.getItem(cacheKey+'-'+user.id));return Number.isInteger(x)&&x>=0?x:null;}
  function rememberRevision(value){revision=value;if(user)localStorage.setItem(cacheKey+'-'+user.id,String(value));}
  const localPrefix = /^machiningDesk|^md-/;
  const excluded = /^md-cloud-|^md-coating-family-|^md-threaded-fasteners-default-|^machiningDeskMigration|^machiningDeskData$/;
  function notify(message,error=false){status.textContent=message;status.classList.toggle('error',error)}
  function controls(){
    $('cloudSession').classList.toggle('hidden',!user);
    $('cloudAuth').classList.toggle('hidden',!!user);
    $('cloudIdentity').textContent=user?.email||'';
    $('cloudUpload').disabled=busy||!user;
    $('cloudDownload').disabled=busy||!user;
    $('cloudSignOut').disabled=busy||!user;
    $('cloudSignIn').disabled=busy||!available;
    $('cloudSignUp').disabled=busy||!available;
  }
  function ownKeys(){return Object.keys(localStorage).filter(k=>localPrefix.test(k)&&!excluded.test(k)&&!k.startsWith('sb-')).sort();}
  function snapshot(){
    const data={};
    for(const key of ownKeys())data[key]=localStorage.getItem(key);
    const currentDb=window.MachiningDeskIntegration?.getDb?.();
    if(currentDb)data.machiningDeskTechnology=JSON.stringify(currentDb);
    return {schema:1,appVersion:'1.12.0',savedAt:new Date().toISOString(),data};
  }
  function valid(payload){
    if(!payload||payload.schema!==1||!payload.data||typeof payload.data!=='object'||Array.isArray(payload.data))return false;
    if(typeof payload.data.machiningDeskTechnology!=='string')return false;
    try {const d=JSON.parse(payload.data.machiningDeskTechnology);return ['machines','tools','materials','coatings'].every(k=>Array.isArray(d[k]));}catch{return false;}
  }
  function downloadFile(body,name){
    const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();
    setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1200);
  }
  function loadSdk(){
    if(window.supabase?.createClient)return Promise.resolve(window.supabase);
    if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.async=true;
      script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('Supabase library did not load.'));
      script.onerror=()=>reject(new Error('Could not load the sign-in library. Check your internet connection.'));
      document.head.appendChild(script);
    }).catch(e=>{sdkPromise=null;throw e;});
    return sdkPromise;
  }
  async function initialize(){
    if(!available){notify('Cloud sync has not been configured. The app continues to work locally.');return;}
    const sdk=await loadSdk();
    client=sdk.createClient(config.url.trim().replace(/\/$/,''),config.publishableKey.trim(),{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data,error}=await client.auth.getUser();
    if(error&&!/session missing/i.test(error.message||''))notify('Sign-in session could not be restored: '+error.message,true);
    user=data?.user||null;revision=knownRevision();
    client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;revision=knownRevision();controls();});
    controls();
    if(user)await refreshRevision();
    else notify('Cloud connection ready. Sign in or create an account.');
  }
  async function refreshRevision(){
    if(!client||!user)return;
    const {data,error}=await client.from('md_cloud_snapshots').select('revision,updated_at').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    remoteRevision=data?.revision??0;
    notify(data?`Signed in. Cloud backup revision ${remoteRevision} (${new Date(data.updated_at).toLocaleString()}). ${revision===null?'This device has no synchronization history: download before uploading.':revision===remoteRevision?'This device is up to date with that revision.':'Cloud has newer data than this device; upload will be blocked.'}`:'Signed in. No cloud backup yet. Upload this device to start.');
  }
  async function task(action){
    if(busy)return;busy=true;controls();
    try{await action();}catch(e){console.error('Machining Desk cloud',e);notify(e.message||String(e),true);}
    finally{busy=false;controls();}
  }
  async function auth(mode){
    const email=emailInput.value.trim(),password=passInput.value;
    if(!email||!password){notify('Enter your email and password.',true);return;}
    await task(async()=>{
      if(!client)await initialize();
      const {data,error}=mode==='signup'?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      passInput.value='';
      if(mode==='signup'&&!data.session){notify('Account created. Check your email for the confirmation link, then sign in.');return;}
      user=data.user||data.session?.user;controls();await refreshRevision();
    });
  }
  async function upload(){
    if(!user)return;
    if(!confirm('Upload this device’s current Machining Desk data to your private cloud backup? The cloud version will be replaced only if nobody has changed it since you last checked.'))return;
    await task(async()=>{
      // Fetch latest revision, but never silently accept a newer revision than was previously seen.
      await refreshRevision();
      if(revision===null&&remoteRevision!==0)throw Error('This device has never synchronized with this account. Download the cloud version first; no data was overwritten.');
      const before=revision===null?0:revision;
      const body=snapshot();
      if(!valid(body))throw Error('Local Technology Database is incomplete. Nothing was uploaded.');
      const {data,error}=await client.rpc('md_save_snapshot',{p_expected:before,p_payload:body});
      if(error)throw error;
      if(!data?.ok){notify('Cloud data changed on another device. Nothing was overwritten. Download and inspect the cloud data before deciding which version to keep.',true);await refreshRevision();return;}
      rememberRevision(Number(data.revision));
      notify(`Cloud backup uploaded successfully (revision ${revision}).`);
    });
  }
  async function download(){
    if(!user)return;
    await task(async()=>{
      const {data,error}=await client.from('md_cloud_snapshots').select('revision,payload,updated_at').eq('user_id',user.id).maybeSingle();
      if(error)throw error;
      if(!data){notify('No cloud backup exists yet. Upload from your first device.');return;}
      if(!valid(data.payload))throw Error('Cloud backup has an unsupported format. Local data was not changed.');
      const incomingRevision=Number(data.revision);
      if(!confirm(`Download cloud revision ${incomingRevision} (${new Date(data.updated_at).toLocaleString()}) and REPLACE this device’s machining data and settings? A JSON backup of the current device will be downloaded first.`))return;
      const backup=snapshot();
      if(valid(backup))downloadFile(backup,'machining-desk-before-cloud-restore-'+new Date().toISOString().slice(0,10)+'.json');
      const incoming=data.payload.data;
      // Retain local-only credentials and migration markers. Clear only known sync keys.
      for(const key of ownKeys())if(!(key in incoming))localStorage.removeItem(key);
      for(const [key,value] of Object.entries(incoming)){
        if(!localPrefix.test(key)||excluded.test(key)||typeof value!=='string')continue;
        localStorage.setItem(key,value);
      }
      rememberRevision(incomingRevision);
      notify('Cloud data restored. Reloading Machining Desk…');
      setTimeout(()=>location.reload(),1500);
    });
  }
  $('openCloud').addEventListener('click',()=>{
    $('cloudLayer').classList.remove('hidden');
    if(available&&!client)task(initialize);
    else if(!available)notify('Cloud setup is required. See CLOUD-SETUP.md. No local data was changed.');
    controls();
  });
  document.querySelectorAll('[data-cloud-close]').forEach(x=>x.addEventListener('click',()=> $('cloudLayer').classList.add('hidden')));
  $('cloudSignIn').addEventListener('click',()=>auth('signin'));
  $('cloudSignUp').addEventListener('click',()=>auth('signup'));
  $('cloudUpload').addEventListener('click',upload);
  $('cloudDownload').addEventListener('click',download);
  $('cloudSignOut').addEventListener('click',()=>task(async()=>{const {error}=await client.auth.signOut();if(error)throw error;user=null;revision=null;notify('Signed out. Your local data is unchanged.');}));
  controls();
})();
