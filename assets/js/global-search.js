/* V1.12.5 keyboard-accessible, offline index of the currently available app data.
 * Searches only local app data; query text is never sent to an external service.
 */
(()=>{'use strict';
 const integration=()=>window.MachiningDeskIntegration;
 const charts=()=>window.MachiningDeskCharts?.charts||[];
 const calc=()=>window.MachiningDeskCalculators?.catalog||[];
 const codes=()=>window.MachiningDeskHaasCodes?.searchIndex?.()||[];
 const getDb=()=>integration()?.getDb?.()||{};
 const routes=[['home','Home','Machining Desk overview'],['mill','Milling','Speeds feeds endmills'],['turn','Turning','Lathe turning boring grooving parting'],['drill','Drilling','Drills tapping reaming countersinking'],['threads','Threading','TPI taps threading three wire'],['db','Database','Materials machines tools coatings'],['drillchart','Charts','Engineering references'],['calculators','Calculators','Engineering estimators'],['codes','Haas Codes','G M codes macros']];
 const btn=document.createElement('button');btn.id='globalSearchButton';btn.type='button';btn.className='appearance-trigger';btn.innerHTML='<i aria-hidden="true" style="font-style:normal;font-size:1.25rem;line-height:1">⌕</i> <span>Search</span> <kbd>Ctrl K</kbd>';btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-controls','globalSearchLayer');
 const controls=document.querySelector('.header-actions');controls?.prepend(btn);
 const layer=document.createElement('div');layer.id='globalSearchLayer';layer.className='global-search-layer hidden';layer.innerHTML=`<div class="global-search-backdrop" data-search-close></div><section class="card global-search-box" role="dialog" aria-modal="true" aria-labelledby="globalSearchHeading"><div class="global-search-head"><div><div class="eyebrow">Offline reference index</div><h2 id="globalSearchHeading">Search Machining Desk</h2></div><button class="btn ghost" type="button" data-search-close aria-label="Close search">×</button></div><label for="globalSearchInput" class="sr-only">Search pages, materials, calculators, tools and codes</label><input id="globalSearchInput" type="search" autocomplete="off" placeholder="Try 4140, CNMG432, G76, tool life, gear…" spellcheck="false"><div id="globalSearchResults" role="listbox" aria-label="Search results"></div><p class="help">Search your installed charts, calculators, machines, tools and materials. No web request is made. Enter opens the highlighted result; Esc closes.</p></section>`;
 document.body.append(layer);
 const $=id=>document.getElementById(id);const input=$('globalSearchInput'),results=$('globalSearchResults');let open=false,selected=0,visible=[],lastFocus=null;
 function items(){let rows=[];
  for(const [route,name,extra] of routes)rows.push({type:'page',title:name,search:extra,detail:'Page',act:()=>integration()?.navigate(route)});
  for(const ch of charts())rows.push({type:'chart',title:ch.name,search:ch.group+' '+ch.keys,detail:'Chart · '+ch.group,act:()=>{integration()?.navigate('drillchart');window.MachiningDeskCharts?.select?.(ch.id)}});
  for(const [id,name,desc] of calc())rows.push({type:'calculator',title:name,search:desc,detail:'Calculator',act:()=>{integration()?.navigate('calculators');window.MachiningDeskCalculators?.choose?.(id)}});
  for(const key of ['materials','tools','machines','coatings'])for(const obj of getDb()[key]||[]){const more=[obj.group,obj.manufacturer,obj.partNumber,obj.grade,obj.insertCode,obj.note,obj.ops?.join(' ')].filter(Boolean).join(' ');rows.push({type:key,title:obj.name,search:more,detail:({materials:'Material',tools:'Tool',machines:'Machine',coatings:'Coating'})[key]+' · '+(obj.group||obj.op||obj.manufacturer||''),act:()=>integration()?.openDbEntry?.(key,obj.id)});}
  for(const c of codes())rows.push({type:'code',title:c.code+' · '+c.name,search:c.name,detail:'Haas G/M code',act:()=>{integration()?.navigate('codes');window.MachiningDeskHaasCodes?.openCode?.(c.code)}});
  return rows;
 }
 function relevance(row,query){const title=row.title.toLowerCase(),hay=(row.title+' '+row.search+' '+row.detail).toLowerCase(),words=query.split(/\s+/).filter(Boolean);if(!words.every(s=>hay.includes(s)))return -1;let score=0;for(const word of words){if(title===word)score+=120;else if(title.startsWith(word))score+=80;else if(title.includes(word))score+=50;else score+=14;}return score+(row.type==='page'?5:0);}
 function dynamicInsert(q){if(!/^[a-z]{2,5}[-\s]*[0-9][a-z0-9.\s-]{1,26}$/i.test(q)||!/[0-9]/.test(q))return null;return {type:'insert',title:'Identify insert: '+q.toUpperCase(),search:'',detail:'Insert decoder · manufacturer-specific verification',act:()=>{integration()?.navigate('drillchart');window.MachiningDeskCharts?.select?.('inserts');const field=$('insertLookupCode')||$('insertCodeInput');if(field){field.value=q.toUpperCase();const form=$('insertLookup');if(form)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));else field.dispatchEvent(new Event('input',{bubbles:true}));}}};}
 function draw(){const q=input.value.trim().toLowerCase();const all=items();visible=q?all.map(row=>({row,score:relevance(row,q)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||a.row.title.localeCompare(b.row.title)).slice(0,34).map(x=>x.row):all.filter(row=>['page','calculator'].includes(row.type)).slice(0,20);
  if(q){const insert=dynamicInsert(q);if(insert&&!visible.some(r=>r.type==='insert'))visible.push(insert);}
  selected=0;results.replaceChildren();if(!visible.length){const p=document.createElement('p');p.className='help';p.textContent='Nothing found in your installed reference library.';results.append(p);return;}
  visible.forEach((row,i)=>{const el=document.createElement('button');el.type='button';el.className='global-search-result';el.setAttribute('role','option');el.setAttribute('aria-selected',i===selected?'true':'false');let title=document.createElement('strong'),meta=document.createElement('small');title.textContent=row.title;meta.textContent=row.detail;el.append(title,meta);el.addEventListener('click',()=>pick(i));results.append(el)});
 }
 function highlight(){Array.from(results.querySelectorAll('[role=option]')).forEach((x,i)=>x.setAttribute('aria-selected',i===selected?'true':'false'));results.querySelectorAll('[role=option]')[selected]?.scrollIntoView?.({block:'nearest'});}
 function pick(index){const row=visible[index];if(!row)return;close();row.act();}
 function show(){if(open)return;lastFocus=document.activeElement;layer.classList.remove('hidden');open=true;input.value='';draw();input.focus();}
 function close(){if(!open)return;open=false;layer.classList.add('hidden');lastFocus?.focus?.();}
 btn.addEventListener('click',show);layer.querySelectorAll('[data-search-close]').forEach(b=>b.addEventListener('click',close));input.addEventListener('input',draw);
 input.addEventListener('keydown',ev=>{if(ev.key==='ArrowDown'){selected=Math.min(visible.length-1,selected+1);highlight();ev.preventDefault();}if(ev.key==='ArrowUp'){selected=Math.max(0,selected-1);highlight();ev.preventDefault();}if(ev.key==='Enter'){ev.preventDefault();pick(selected);}if(ev.key==='Escape'){ev.preventDefault();close();}});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&open){ev.preventDefault();close();return;}if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'&&!ev.altKey){ev.preventDefault();show();}});
 window.MachiningDeskSearch={show,close,search:q=>{show();input.value=q;draw();return visible.map(x=>x.title);}};
})();
