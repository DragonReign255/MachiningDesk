/* Machining Desk V1.12.4: feature proposals, one-person-one-vote, bug reports,
 * and an offline-readable feature roadmap. All moderation enforced in Supabase RLS.
 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const R=[
    ['V1.12.3','Community ideas & voting, private issue reports, spindle-load observations','Complete'],
    ['V1.12.4','Report inaccuracies from charts/calculators and filter material families','Complete'],
    ['Next','Global search for materials, G/M codes, charts, and calculators','Planned'],
    ['Next','Integrate cutting calculations, deflection and machine load into one consistent model','Planned'],
    ['Later','Manufacturer-specific saved cutters and insert/holder geometry','Proposed'],
    ['Later','Calibration analysis using repeated spindle observations and known load baselines','Proposed'],
    ['Later','Additional calculators and validated reference charts','Proposed']
  ];
  let client=null,user=null,admin=false,ideas=[],ownVotes=new Set(),reports=[],reportContext='';
  const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
  const btn=(text,fn,cls='btn')=>{const n=el('button',text,cls);n.type='button';n.addEventListener('click',fn);return n;};
  function status(msg,error=false){const node=$('communityStatus');node.textContent=msg;node.classList.toggle('error',error);}
  function reportError(err){console.error('Community feedback',err);status(err?.message||String(err),true);}
  function cleanLine(s,max){return String(s||'').trim().slice(0,max);}
  function renderRoadmap(){const list=$('communityRoadmapList');list.replaceChildren();for(const [release,title,state]of R){const card=el('article','','community-entry'),head=el('div','','community-entry-head');head.append(el('strong',title),el('span',state,'community-tag'));card.append(head,el('small',release,'community-subtext'));list.append(card);}}
  async function loadIdeas(){
    const [a,b]=await Promise.all([
      client.from('md_ideas').select('id,user_id,category,title,description,status,planned_version,owner_note,vote_count,submitted_at').order('submitted_at',{ascending:false}).limit(200),
      client.from('md_idea_votes').select('idea_id').eq('user_id',user.id).limit(300)
    ]);
    if(a.error)throw a.error;if(b.error)throw b.error;
    ideas=a.data||[];ownVotes=new Set((b.data||[]).map(v=>v.idea_id));renderIdeas();
  }
  function renderIdeas(){const root=$('communityIdeasList');root.replaceChildren();let q=$('ideasSearch').value.toLowerCase().trim();let sorted=ideas.filter(i=>(i.title+' '+i.description+' '+i.category).toLowerCase().includes(q));
    if($('ideasSort').value==='votes')sorted.sort((a,b)=>Number(b.vote_count)-Number(a.vote_count)||Date.parse(b.submitted_at)-Date.parse(a.submitted_at));
    else sorted.sort((a,b)=>Date.parse(b.submitted_at)-Date.parse(a.submitted_at));
    if(!sorted.length){root.append(el('p','No matching ideas. Submit the first one.','help'));return;}
    for(const idea of sorted){const card=el('article','','community-entry'),head=el('div','','community-entry-head');head.append(el('strong',idea.title),el('span',`${idea.status.replaceAll('_',' ')} · ${idea.category}`,'community-tag'));card.append(head,el('p',idea.description,'community-description'));
      if(idea.planned_version)card.append(el('p','Release: '+idea.planned_version,'sourcehint'));
      if(idea.owner_note)card.append(el('p','Owner: '+idea.owner_note,'help'));
      const actions=el('div','','btnrow');const voted=ownVotes.has(idea.id);actions.append(btn(`${voted?'▲ Voted':'△ Vote'} · ${idea.vote_count||0}`,()=>vote(idea.id,voted),voted?'btn primary':'btn'));
      if(idea.user_id===user.id)actions.append(el('small','Your suggestion','community-subtext'));
      card.append(actions);
      if(admin){const opts=el('div','','community-review-controls');const select=el('select');
        for(const [key,label]of [['submitted','Submitted'],['under_review','Under review'],['planned','Planned'],['in_progress','In progress'],['completed','Completed'],['declined','Declined']]){const o=el('option',label);o.value=key;select.append(o);}select.value=idea.status;
        const version=el('input');version.type='text';version.value=idea.planned_version||'';version.maxLength=32;version.placeholder='Release e.g. V1.12.4';version.setAttribute('aria-label','Planned/completed version');
        const note=el('input');note.type='text';note.maxLength=1000;note.value=idea.owner_note||'';note.placeholder='Review note';note.setAttribute('aria-label','Owner review note');
        opts.append(select,version,note,btn('Save status',()=>saveIdea(idea.id,select.value,version.value,note.value),'btn'));card.append(opts);
      }
      root.append(card);
    }
  }
  async function vote(id,currently){try{
    const req=currently?client.from('md_idea_votes').delete().eq('idea_id',id).eq('user_id',user.id):client.from('md_idea_votes').insert({idea_id:id,user_id:user.id});
    const {error}=await req;if(error)throw error;
    await loadIdeas();status(currently?'Vote removed.':'Vote recorded. Each account has one vote per idea.');
  }catch(e){reportError(e);}}
  async function saveIdea(id,newStatus,version,note){try{
    if(!admin)throw Error('Not authorized.');
    const {error}=await client.from('md_ideas').update({status:newStatus,planned_version:cleanLine(version,32),owner_note:cleanLine(note,1000),updated_at:new Date().toISOString()}).eq('id',id);
    if(error)throw error;await loadIdeas();status('Idea status updated.');
  }catch(e){reportError(e);}}
  async function createIdea(e){e.preventDefault();try{
    if(!client||!user)throw Error('Sign in to submit ideas.');
    const title=cleanLine($('ideaTitle').value,140),description=cleanLine($('ideaDescription').value,4000);
    if(title.length<5||description.length<20)throw Error('Enter a title (5+ characters) and description (20+ characters).');
    const {error}=await client.from('md_ideas').insert({user_id:user.id,category:$('ideaCategory').value,title,description});
    if(error)throw error;$('communityIdeaForm').reset();await loadIdeas();status('Idea submitted. Other users can now vote for it.');
  }catch(err){reportError(err);}}
  async function loadReports(){
    const {data,error}=await client.from('md_community_reports').select('id,user_id,category,location,title,details,status,owner_note,created_at,app_version').order('created_at',{ascending:false}).limit(200);
    if(error)throw error;reports=data||[];renderReports();
  }
  function renderReports(){const mine=$('communityReportsList'),queue=$('communityOwnerReportsList');mine.replaceChildren();queue.replaceChildren();
    const make=(r,ownerReview)=>{const card=el('article','','community-entry'),head=el('div','','community-entry-head');head.append(el('strong',r.title),el('span',r.status.replaceAll('_',' '),'community-tag'));card.append(head,el('p',r.details,'community-description'),el('small',`${r.category} · ${r.location||'Location unknown'} · ${new Date(r.created_at).toLocaleDateString()} · ${r.app_version||'unknown version'}`,'community-subtext'));
      if(r.owner_note)card.append(el('p','Reviewer: '+r.owner_note,'help'));
      if(ownerReview){const select=el('select');for(const key of ['submitted','under_review','resolved','declined']){const o=el('option',key.replaceAll('_',' '));o.value=key;select.append(o);}select.value=r.status;
        const note=el('textarea');note.placeholder='Owner notes';note.maxLength=1000;note.value=r.owner_note||'';
        card.append(select,note,btn('Save review',()=>saveReport(r.id,select.value,note.value)));
      }return card;};
    const my=reports.filter(r=>r.user_id===user.id);if(!my.length)mine.append(el('p','No reports from your account.','help'));else for(const r of my)mine.append(make(r,false));
    $('communityOwnerReports').classList.toggle('hidden',!admin);
    if(admin){const pending=reports.filter(r=>r.status!=='resolved'&&r.status!=='declined');if(!pending.length)queue.append(el('p','No open reports.','help'));for(const r of pending)queue.append(make(r,true));}
  }
  // Error reports never silently transmit input values. Snapshot is optional,
  // previewed and appended only when the user explicitly checks the box.
  function snapshot(container){
    if(!container)return '';
    const items=[];
    for(const element of container.querySelectorAll('input, select')){
      if(items.length>=20)break;
      if(!element.id||element.disabled||element.type==='hidden'||element.type==='password'||element.type==='email'||element.type==='file'||element.type==='search'||element.type==='textarea')continue;
      if(/(notes|email|password|secret|token|private|auth|user|cloud|macro|submit|sourceurl)/i.test(element.id))continue;
      if(element.closest('[hidden],.hidden'))continue;
      let value='';
      if(element.type==='checkbox')value=element.checked?'On':'Off';
      else if(element.tagName==='SELECT')value=element.selectedOptions[0]?.textContent?.trim()||element.value;
      else if(element.type==='number'||element.type==='range')value=element.value;
      else continue;
      if(!value)continue;
      const labels=element.labels;
      const label=(labels?.[0]?.textContent||element.id).replace(/\s+/g,' ').trim().slice(0,80);
      items.push(`${label}: ${String(value).replace(/[\r\n]/g,' ').slice(0,90)}`);
    }
    return items.join('\n');
  }
  function sourceContext(source){
    const type=String(source||'engineering');let name='',location='',category='calculation',area=null;
    if(type==='chart'){
      const selected=window.MachiningDeskCharts?.current?.();
      name=selected?.name||'Reference chart';location='Charts → '+name;category='technical_data';
      area=$('extraChartPanel');
      if(selected?.id==='drills')area=$('drillChartPanel');
      else if(selected?.id==='screws')area=$('capHeadPanel');
    }else if(type==='engineering'){
      name=$('engineeringForm')?.querySelector('h2')?.textContent?.replace('↻','').trim()||'Engineering calculator';
      location='Calculators → '+name;area=$('engineeringForm');
    }else if(type==='machining'){
      name=$('operationTitle')?.textContent?.trim()||'Machining';
      location=name+' → Cutting calculator';area=$('calculatorPage')?.querySelector('.calcgrid');
    }else if(type==='threading'){
      name=$('threadSide')?.value==='external'?'External threading':'Internal tapping';
      location='Threading → '+name;area=$('threadSizingPanel');
    }
    const lines=snapshot(area);
    return {category,location:location.slice(0,140),title:(category==='technical_data'?'Incorrect reference: ':'Calculation issue: ')+name,inputs:lines};
  }
  function prefillReport(ctx){
    const data=ctx||{};
    $('bugCategory').value=['technical_data','calculation','bug','other'].includes(data.category)?data.category:'bug';
    $('bugLocation').value=cleanLine(data.location,140);
    $('bugTitle').value=cleanLine(data.title,140);
    reportContext=cleanLine(data.inputs,1600);
    const box=$('bugContextBox'),preview=$('bugContextPreview'),include=$('bugIncludeContext');
    include.checked=false;preview.textContent=reportContext||'No applicable numeric or selection inputs on this page.';
    box.classList.toggle('hidden',!reportContext);
    $('bugDetails').focus();
    status('Report page selected. Describe the issue, verify any optional input snapshot, and sign in if needed.');
  }
  async function reportFromPage(source){
    const ctx=sourceContext(source);
    const community=window.MachiningDeskCommunity;
    if(!community?.openReport){status('Community reporting is not available. Reload the app.',true);return;}
    try{await community.openReport(ctx);}catch(err){reportError(err);}
  }
  for(const [id,source]of [['reportCharts','chart'],['reportEngineering','engineering'],['reportMachining','machining'],['reportThreading','threading']]){
    $(id)?.addEventListener('click',()=>reportFromPage(source));
  }
  async function createReport(e){e.preventDefault();try{
    if(!client||!user)throw Error('Sign in to report a problem.');
    const title=cleanLine($('bugTitle').value,140),location=cleanLine($('bugLocation').value,140);
    const text=cleanLine($('bugDetails').value,4000);
    const optIn=$('bugIncludeContext').checked&&!$('bugContextBox').classList.contains('hidden');
    const attachment=optIn&&reportContext?'\n\n[Optional technical input snapshot — reviewed by reporter]\n'+reportContext:'';
    const details=cleanLine(text,Math.max(0,4000-attachment.length))+attachment;
    if(title.length<5||details.length<15)throw Error('Enter a title and sufficient detail to reproduce or verify the issue.');
    const {error}=await client.from('md_community_reports').insert({user_id:user.id,category:$('bugCategory').value,location,title,details,app_version:'1.12.4'});
    if(error)throw error;$('communityBugForm').reset();reportContext='';$('bugContextBox').classList.add('hidden');$('bugContextPreview').textContent='';await loadReports();status('Report sent privately to owner review.');
  }catch(err){reportError(err);}}
  async function saveReport(id,newStatus,note){try{
    if(!admin)throw Error('Not authorized.');
    const {error}=await client.from('md_community_reports').update({status:newStatus,owner_note:cleanLine(note,1000),updated_at:new Date().toISOString()}).eq('id',id);
    if(error)throw error;await loadReports();status('Report reviewed.');
  }catch(e){reportError(e);}}
  async function load(mode,ctx){client=ctx.client;user=ctx.user;admin=ctx.admin;
    if(mode==='roadmap'){renderRoadmap();return;}
    if(mode==='ideas')await loadIdeas();else if(mode==='reports')await loadReports();
  }
  $('communityIdeaForm')?.addEventListener('submit',createIdea);
  $('communityBugForm')?.addEventListener('submit',createReport);
  $('ideasSort')?.addEventListener('change',renderIdeas);
  $('ideasSearch')?.addEventListener('input',renderIdeas);
  window.MachiningDeskFeedback={load,renderRoadmap,prefillReport,reportFromPage,sourceContext};
})();
