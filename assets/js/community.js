/* Machining Desk V1.12.2: reviewed community library.
 * Private devices remain local-first; shared entries never silently modify
 * a personal Technology Database. All approval authorization lives in Supabase.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TYPES = {materials:'Materials',tools:'Tool types',machines:'Machines',coatings:'Coatings',spindle_tests:'Spindle load measurements'};
  const API = () => window.MachiningDeskCloudAccess;
  let client=null, user=null, admin=false, loaded=false, busy=false, mode='browse';
  let approved=[], mine=[], pending=[];
  const denyKeys = /(?:password|secret|token|private|macro|credential|email|user_id|auth|api[_-]?key)/i;
  const recordSize = value => new Blob([JSON.stringify(value)]).size;
  function message(text, error=false) {
    const el=$('communityStatus'); el.textContent=text;
    el.classList.toggle('error',error);
  }
  const online=()=>navigator.onLine;
  const errorText=e=>e?.message || String(e);
  function report(e) {
    console.error('Machining Desk community',e);
    const msg=errorText(e);
    message((!online()?'Offline. Your personal library still works. ':'')+
      (/relation .* does not exist|PGRST205|42P01/.test(msg)?'Community database is not installed. Run supabase/community-v1.12.2.sql first.':msg),true);
  }
  function clear(el){el.replaceChildren();}
  function element(type,className,text){const node=document.createElement(type);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function button(label,handler,className='btn'){const b=element('button',className,label);b.type='button';b.addEventListener('click',handler);return b;}
  function labelTime(raw){const d=new Date(raw);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString();}
  function sourceLink(url) {if(!/^https:\/\/[^\s]+$/i.test(url||''))return null;const a=element('a','','Source ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  const safeString = s => String(s??'').replace(/[<>\u0000-\u001f]/g,c=>c==='<'?'‹':c==='>'?'›':' ').slice(0,4000);
  // Only expected entry fields are shared. In particular, macro programs,
  // authentication details and personal/private metadata are never submitted.
  const allowed = {
    machines: new Set('name ops rpm hp maxFeed toolIds manual category speedFactor feedFactor codeList powerRatingBasis driveEfficiency idleHp secondaryRpm secondaryHp liveRpm liveHp note spindleOptionsNote powerCurves curves curveLocked spindleCurves'.split(' ')),
    tools: new Set('name op d teeth load factor note substrate coating material maxRpm stickout geometry type family tap threadMill millingType turnType pointAngle tipAngle noseRadius fluteCount numberOfTeeth coatingId'.split(' ')),
    materials: new Set('name group unitHp ranges rangeSources note density elasticModulus thermalExpansion conductivity thermalConductivity yieldStrength tensileStrength hardness hardnessScale poissonsRatio properties'.split(' ')),
    coatings: new Set('name groups factor note'.split(' ')),
    spindle_tests: new Set('name machineName spindleName operation materialName materialFamily toolName substrate coating strategy diameterIn flutes programmedSfm actualSfm rpm feedIpm chipLoadIn rdocIn adocIn holeDepthIn peckIn grooveWidthIn rpmOverridePct feedOverridePct netCuttingHp motorEquivalentHp spindleRatedHp availableHpAtRpm predictedLoadPct chipThinningEnabled slottingEnabled unitHp driveEfficiency idleHp measuredPeakPct idleLoadPct comparisonRatioPct capturedAt note'.split(' '))
  };
  function clean(value,depth=0) {
    if(depth>12)throw Error('Record is too deeply nested.');
    if(value===null||typeof value==='boolean')return value;
    if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Record includes an invalid number.');return value;}
    if(typeof value==='string')return safeString(value);
    if(Array.isArray(value)){if(value.length>700)throw Error('Record contains too many entries.');return value.map(x=>clean(x,depth+1));}
    if(typeof value!=='object')throw Error('Unsupported record content.');
    const result=Object.create(null);
    for(const [k,v] of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(k)||denyKeys.test(k))continue;
      if(k.length>90)continue;
      result[k]=clean(v,depth+1);
    }
    return result;
  }
  const positive = v=>Number.isFinite(Number(v))&&Number(v)>0;
  function formatRecord(category,raw) {
    if(!Object.hasOwn(TYPES,category)||!raw||Array.isArray(raw)||typeof raw!=='object')throw Error('Unknown entry type.');
    const fields=allowed[category], input=Object.create(null);
    for(const [k,v] of Object.entries(raw))if(fields.has(k))input[k]=v;
    const x=clean(input);
    if(typeof x.name!=='string'||!x.name.trim()||x.name.length>140)throw Error('Entry needs a valid name.');
    if(category==='machines'&&(!Array.isArray(x.ops)||!x.ops.every(o=>['mill','turn','drill'].includes(o))||!positive(x.rpm)||!positive(x.hp)||!positive(x.maxFeed)))throw Error('Machine RPM, HP, feed and operations must be valid.');
    if(category==='tools'&&(!['mill','turn','drill'].includes(x.op)||!positive(x.d)||!positive(x.teeth)||!positive(x.load)||!positive(x.factor)))throw Error('Tool diameter, teeth, chip load and factors must be valid.');
    if(category==='materials'&&(!positive(x.unitHp)||!x.ranges||typeof x.ranges!=='object'||Array.isArray(x.ranges)))throw Error('Material cutting-power coefficient and SFM tables are required.');
    if(category==='spindle_tests'&&(!positive(x.rpm)||!positive(x.measuredPeakPct)||Number(x.measuredPeakPct)>300||!['mill','turn','drill'].includes(x.operation)))throw Error('Spindle test needs RPM, operation, and measured load percentage.');
    if(category==='coatings'&&!positive(x.factor))throw Error('Coating factor must be positive.');
    if(recordSize(x)>60000)throw Error('Entry exceeds the 60 KB submission limit.');
    return x;
  }
  async function connect() {
    if(!online())throw Error('The community library requires an internet connection. Local machining still works.');
    if(!API())throw Error('Cloud integration was not loaded. Reload Machining Desk.');
    const res=await API().ensureReady();
    client=res.client;user=res.user;
    if(!client||!user)throw Error('Sign in through Cloud first, then reopen Community.');
    const check=await client.from('md_community_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(check.error)throw check.error;
    admin=!!check.data;
    $('communityReviewTab').classList.toggle('hidden',!admin);
    if(!admin&&mode==='review')mode='browse';
    $('communityWho').textContent=(user.email||'Signed in')+(admin?' · Administrator':'');
    return true;
  }
  function tabs(){document.querySelectorAll('[data-community-tab]').forEach(b=>b.classList.toggle('active',b.dataset.communityTab===mode));
    for(const name of ['browse','submit','mine','review','ideas','reports','roadmap'])$('community'+name[0].toUpperCase()+name.slice(1)).classList.toggle('hidden',name!==mode);}
  async function open(){ $('communityLayer').classList.remove('hidden'); await refresh(); }
  function close(){ $('communityLayer').classList.add('hidden'); }
  async function withBusy(fn){if(busy)return;busy=true;$('communityRefresh').disabled=true;try{await fn();}catch(e){report(e);}finally{busy=false;$('communityRefresh').disabled=false;}}
  async function refresh(){await withBusy(async()=>{
    await connect(); await load(mode); message(`Community library connected${admin?' · administrator review enabled':''}. Approved records are never added without your permission.`);
  });}
  async function load(name){
    if(name==='browse'){
      const res=await client.from('md_community_entries').select('submission_id,category,name,record,evidence_url,approved_at').order('approved_at',{ascending:false}).limit(200);
      if(res.error)throw res.error; approved=res.data||[]; renderBrowse();
    } else if(name==='submit')renderSubmit();
    else if(name==='mine'){
      const res=await client.from('md_community_submissions').select('id,name,category,status,submitted_at,reviewed_at,reviewer_note').eq('user_id',user.id).order('submitted_at',{ascending:false}).limit(100);
      if(res.error)throw res.error;mine=res.data||[]; renderMine();
    }else if(['ideas','reports','roadmap'].includes(name))await window.MachiningDeskFeedback?.load?.(name,{client,user,admin});
    else if(name==='review'&&admin){
      const res=await client.from('md_community_submissions').select('id,name,category,record,submitter_note,evidence_url,submitted_at').eq('status','pending').order('submitted_at',{ascending:true}).limit(100);
      if(res.error)throw res.error;pending=res.data||[];renderReview();
    }
  }
  async function switchTab(which){if(!['browse','submit','mine','review','ideas','reports','roadmap'].includes(which)||which==='review'&&!admin)return;
    mode=which;tabs();await withBusy(async()=>{await connect();await load(which);message('Community '+which+' ready.');});}
  function makeCard(item,adminControls=false) {
    const wrap=element('article','community-entry');
    const title=element('div','community-entry-head');
    title.append(element('strong','',item.name),element('span','community-tag',TYPES[item.category]||item.category));
    wrap.append(title);
    const info=element('small','community-subtext',adminControls?'Submitted '+labelTime(item.submitted_at):'Approved '+labelTime(item.approved_at));wrap.append(info);
    if(item.evidence_url){const link=sourceLink(item.evidence_url);if(link)wrap.append(link);}
    const detail=element('details','community-preview');detail.append(element('summary','','Inspect full parameters (JSON)'));
    const code=element('pre','',JSON.stringify(item.record,null,2));detail.append(code);wrap.append(detail);
    return wrap;
  }
  function renderBrowse(){const root=$('communityApprovedList');clear(root);
    const category=$('communityBrowseCategory').value,search=$('communityBrowseSearch').value.toLowerCase().trim();
    const shown=approved.filter(x=>(category==='all'||x.category===category)&&x.name.toLowerCase().includes(search));
    $('communityApprovedCount').textContent=`${shown.length} match(es) · ${approved.length} recently approved`;
    if(!shown.length){root.append(element('p','help','No approved entries match your search yet.'));return;}
    const db=window.MachiningDeskIntegration?.getDb?.();
    for(const item of shown){const card=makeCard(item);
      const already=item.category==='spindle_tests'?true:db?.[item.category]?.some(x=>x.communitySourceId===item.submission_id);
      const importButton=button(item.category==='spindle_tests'?'Reviewed observation · read only':already?'Already added':'Add personal copy',()=>importEntry(item));
      importButton.disabled=!!already;card.append(importButton);root.append(card);
    }
  }
  function selectedLocal(){const category=$('communitySubmitCategory').value,id=$('communitySubmitEntry').value;
    if(category==='spindle_tests'){const machines=window.MachiningDeskIntegration?.getDb?.()?.machines||[];const found=machines.flatMap(m=>(m.loadTests||[]).map(test=>({machine:m,test}))).find(x=>x.test.id===id);return {category,entry:found?{...found.test,name:`${found.machine.name} · ${Math.round(found.test.measuredPeakPct)}% @ ${Math.round(found.test.rpm)} RPM`}:null};}
    
    return {category,entry:window.MachiningDeskIntegration?.getDb?.()?.[category]?.find(x=>x.id===id)};}
  function renderSubmit(){const db=window.MachiningDeskIntegration?.getDb?.();const category=$('communitySubmitCategory').value;
    const previous=$('communitySubmitEntry').value,select=$('communitySubmitEntry');clear(select);
    const availableEntries=category==='spindle_tests'?(db?.machines||[]).flatMap(m=>(m.loadTests||[]).map(test=>({id:test.id,name:`${m.name} · ${test.measuredPeakPct}% @ ${Math.round(test.rpm)} RPM`}))):db?.[category]||[];
    for(const x of availableEntries){const opt=element('option','',x.name);opt.value=x.id;select.append(opt);}
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    const {entry}=selectedLocal();$('communitySubmitPreview').textContent=entry?JSON.stringify(formatRecord(category,entry),null,2):'No entries to submit.';
    $('communitySubmitButton').disabled=!entry;
  }
  async function submit(){await withBusy(async()=>{
    await connect();const {category,entry}=selectedLocal();if(!entry)throw Error('Select a local entry.');
    if(!$('communityShareConsent').checked)throw Error('Confirm you reviewed the shared record and source information.');
    const record=formatRecord(category,entry); const url=$('communitySourceURL').value.trim();
    if(url&&!/^https:\/\/[^\s]+$/i.test(url))throw Error('Source must be a valid HTTPS URL.');
    const note=$('communitySubmissionNote').value.trim();if(note.length>2000)throw Error('Notes exceed 2,000 characters.');
    if(!confirm(`Submit “${record.name}” for owner review? Only the parameters shown in the preview will be shared; this does not modify the approved library.`))return;
    const {error}=await client.from('md_community_submissions').insert({user_id:user.id,category,name:record.name,record,evidence_url:url,submitter_note:note,status:'pending'});
    if(error)throw error;
    $('communitySubmissionNote').value='';$('communityShareConsent').checked=false;
    message('Submission queued for owner review. Your personal library is unchanged.');
    mode='mine';tabs();await load('mine');
  });}
  function renderMine(){const root=$('communityMineList');clear(root);
    if(!mine.length){root.append(element('p','help','You have not submitted any records yet.'));return;}
    for(const item of mine){const card=element('article','community-entry');const head=element('div','community-entry-head');head.append(element('strong','',item.name),element('span','community-tag',item.status));card.append(head);
      card.append(element('small','',TYPES[item.category]+' · '+labelTime(item.submitted_at)));
      if(item.reviewer_note)card.append(element('p','help','Reviewer: '+item.reviewer_note));root.append(card);
    }
  }
  function renderReview(){const root=$('communityReviewList');clear(root);
    $('communityPendingCount').textContent=`${pending.length} pending review(s)`;
    if(!pending.length){root.append(element('p','help','No pending submissions.'));return;}
    for(const item of pending){const card=makeCard(item,true);if(item.submitter_note)card.append(element('p','help','Submitter notes: '+item.submitter_note));
      const box=element('div','community-review-controls'),note=element('textarea');note.placeholder='Reviewer notes (optional, visible to submitter)';note.maxLength=2000;box.append(note);
      const actions=element('div','btnrow');actions.append(
        button('Approve',()=>decide(item,true,note.value),'btn primary'),
        button('Reject',()=>decide(item,false,note.value),'btn danger'));
      box.append(actions);card.append(box);root.append(card);
    }
  }
  async function decide(item,approve,notes){await withBusy(async()=>{
    await connect();if(!admin)throw Error('Not an administrator.');
    const action=approve?'APPROVE':'REJECT';
    if(!confirm(`${action} “${item.name}”? ${approve?'The exact submitted record will become available for users to import.':'The record will not be published.'}`))return;
    const {data,error}=await client.rpc('md_decide_submission',{p_submission_id:item.id,p_approve:approve,p_reviewer_note:notes.trim()});
    if(error)throw error;if(!data?.ok)throw Error('Could not complete review.');
    message(`${item.name} ${approve?'approved and published':'rejected'}.`);await load('review');
  });}
  function importEntry(item){try{
    const integration=window.MachiningDeskIntegration;
    if(!integration?.importCommunity)throw Error('This version does not support community import.');
    const cleanRecord=formatRecord(item.category,item.record);
    if(!confirm(`Add an independent PERSONAL copy of “${item.name}”? It will join your locally saved ${TYPES[item.category].toLowerCase()} and synchronize through your private cloud account. Verify all parameters before cutting.`))return;
    const result=integration.importCommunity(item.category,cleanRecord,item.submission_id,item.approved_at);
    message(result);renderBrowse();
  }catch(e){report(e);}}
  // Explicitly opt in to submitting a saved spindle observation. No record leaves
  // the personal database until the user reviews the preview and confirms.
  window.MachiningDeskCommunity={openReport:async ctx=>{
    mode='reports';tabs();$('communityLayer').classList.remove('hidden');
    await refresh();
    window.MachiningDeskFeedback?.prefillReport?.(ctx);
    $('communityBugForm')?.scrollIntoView({block:'nearest',behavior:'instant'});
  },openSpindleTest:async id=>{
    await open();
    if(!user)return;
    mode='submit';tabs();
    $('communitySubmitCategory').value='spindle_tests';
    renderSubmit();
    if([...$('communitySubmitEntry').options].some(o=>o.value===id))$('communitySubmitEntry').value=id;
    renderSubmit();
    $('communitySubmitPreview').closest('details')?.setAttribute('open','');
    $('communitySourceURL').value='';$('communitySubmissionNote').value='';
    $('communityShareConsent').checked=false;
    message('Review the exact cutting parameters before submitting. No observations are published automatically.');
  }};
  $('openCommunity').addEventListener('click',open);
  document.querySelectorAll('[data-community-close]').forEach(x=>x.addEventListener('click',close));
  document.querySelectorAll('[data-community-tab]').forEach(x=>x.addEventListener('click',()=>switchTab(x.dataset.communityTab)));
  $('communityRefresh').addEventListener('click',refresh);
  $('communityBrowseCategory').addEventListener('change',renderBrowse);
  $('communityBrowseSearch').addEventListener('input',renderBrowse);
  $('communitySubmitCategory').addEventListener('change',renderSubmit);
  $('communitySubmitEntry').addEventListener('change',renderSubmit);
  $('communitySubmitButton').addEventListener('click',submit);
  window.addEventListener('machiningdesk:cloud-user',()=>{
    // On sign-out, hide the previous user's private submission/review data
    // immediately. Never leave a former owner's queue visible in this tab.
    const latest=API()?.getUser?.();
    if(!latest || (user && latest.id!==user.id)){
      client=null;user=null;admin=false;approved=[];mine=[];pending=[];
      mode='browse';tabs();
      $('communityReviewTab').classList.add('hidden');
      for(const id of ['communityApprovedList','communityMineList','communityReviewList'])clear($(id));
      $('communityWho').textContent='Sign in via Cloud to contribute or browse.';
    }
    if(!$('communityLayer').classList.contains('hidden'))setTimeout(refresh,50);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('communityLayer').classList.contains('hidden'))close();});
  tabs();
  window.MachiningDeskCommunityTest={formatRecord,renderBrowse};
})();
