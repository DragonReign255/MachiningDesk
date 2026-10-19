/* Machining Desk — calculators, navigation, reference charts, and local database. */
(()=>{
'use strict';
const KEY='machiningDeskTechnology';
const $=id=>document.getElementById(id);
const copy=x=>JSON.parse(JSON.stringify(x));
const fmt=(x,d=1)=>Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
const safeNum=(v)=>v===''||v===null?NaN:Number(v);
const uid=()=>`item_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
const OPS={mill:'Milling',turn:'Turning',drill:'Drilling'};
const SUBS=['carbide','hss'];
const {freshData,makeRanges,oldFactoryRange}=window.MachiningDeskDefaults;
const maker=window.MachiningDeskManufacturer;
const {NUMBER_SIZES,LETTER_SIZES,UN_DATA,METRIC_DATA}=window.MachiningDeskReferences;
function validLibrary(x){return x&&typeof x==='object'&&['machines','tools','materials','coatings'].every(k=>Array.isArray(x[k]))}
let db=freshData();try{let old=JSON.parse(localStorage.getItem(KEY)||'null');if(validLibrary(old))db=old}catch{}
// Add requested machine presets without discarding locally edited machines or materials.
{const defaults=freshData().machines;db.machines=db.machines.filter(m=>m.id!=='vf4');for(const preset of defaults)if(!db.machines.some(m=>m.id===preset.id))db.machines.push(preset);let u=db.machines.find(m=>m.id==='umc750ss');if(u&&u.rpm===15000&&String(u.note).includes('Illustrative')){u.rpm=12000;u.maxFeed=833;u.note='Updated to standard Haas-listed 12000 RPM configuration; verify options.';}for(const t of freshData().tools){if(!db.tools.some(old=>old.id===t.id)){db.tools.push(t);for(const mat of db.materials){mat.ranges=mat.ranges||{};const baseline=mat.ranges[t.op==='mill'?'chamfer':'drill_ream']||{carbide:[120,250],hss:[30,65]};mat.ranges[t.id]={carbide:baseline.carbide.map(v=>Math.max(1,Math.round(v*t.factor))),hss:baseline.hss.map(v=>Math.max(1,Math.round(v*t.factor)))}}}}let st=db.machines.find(m=>m.id==='st20y');if(st&&st.liveRpm==null){st.liveRpm=4000;st.liveHp=0;st.secondaryRpm=6000;st.secondaryHp=0;st.note+=' Driven and secondary spindle horsepower must be entered before power-utilization checks.';}}
// Consolidate substrate-specific drill types into one tool type with substrate selection.
// Preserve a historical solid-carbide drilling range before discarding the redundant entry.
{
 let aluminumMigrationDone=false;
 try{aluminumMigrationDone=localStorage.getItem('machiningDeskMigration130')==='done'}catch{}
 const removed=new Set(['drill_carbide','drill_ream_hss','drill_ream_carbide']);
 for(const mat of db.materials){
  mat.ranges=mat.ranges||{};
  const old=mat.ranges.drill_carbide;
  if(old?.carbide?.length===2 && mat.ranges.drill_twist){
   if(mat.group!=='Aluminum')mat.ranges.drill_twist.carbide=old.carbide.slice();
   mat.rangeSources=mat.rangeSources||{};
   if(mat.rangeSources.drill_carbide?.carbide){mat.rangeSources.drill_twist={...(mat.rangeSources.drill_twist||{}),carbide:mat.rangeSources.drill_carbide.carbide};}
  }
  for(const id of removed){delete mat.ranges[id];if(mat.rangeSources)delete mat.rangeSources[id];}
  if(mat.group==='Aluminum' && /^mat_[012]$/.test(mat.id)){
   for(const t of db.tools.filter(t=>!removed.has(t.id)&&t.op!=='drill'))if(mat.ranges[t.id] && mat.rangeSources?.[t.id]?.carbide!=='custom' && !aluminumMigrationDone){
    mat.ranges[t.id].carbide=[Math.round(800*t.factor),Math.round(1500*t.factor)];mat.rangeSources=mat.rangeSources||{};
    mat.rangeSources[t.id]={...(mat.rangeSources[t.id]||{}),carbide:'shop-aluminum'};
   }
  }
 }
 db.tools=db.tools.filter(t=>!removed.has(t.id));
 const renamed=db.tools.find(t=>t.id==='drill_twist');if(renamed)renamed.name='Twist drill';
 const reamer=db.tools.find(t=>t.id==='drill_ream');if(reamer)reamer.name='Chucking reamer';
 for(const m of db.machines){if(Array.isArray(m.toolIds))m.toolIds=[...new Set(m.toolIds.map(id=>id==='drill_carbide'?'drill_twist':id.startsWith('drill_ream_')?'drill_ream':id))];}
 try{if(!aluminumMigrationDone){localStorage.setItem(KEY,JSON.stringify(db));localStorage.setItem('machiningDeskMigration130','done')}}catch{}
}
const standardGroups=['Aluminum','Carbon steel','Alloy steel','Stainless steel','Tool steel','Cast iron','Titanium','Copper alloy','Plastic','Other'];
const coatingSuggestions={tib2:['Aluminum'],uncoated:['Aluminum','Copper alloy','Plastic','Titanium','Cast iron'],tin:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Cast iron','Titanium'],ticn:['Carbon steel','Alloy steel','Tool steel','Cast iron','Stainless steel'],tialn:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],altin:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],alcrn:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],zrn:['Aluminum','Copper alloy'],dlc:['Aluminum','Copper alloy','Plastic']};
for(const c of freshData().coatings)if(!db.coatings.some(x=>x.id===c.id))db.coatings.push(copy(c));
for(const c of db.coatings)if(!Array.isArray(c.groups))c.groups=coatingSuggestions[c.id]?.slice()||[];
function materialGroups(){return [...new Set([...standardGroups,...db.materials.map(m=>m.group).filter(Boolean)])];}
function isCoatingRecommended(coat,mat){return !!coat&&!!mat&&Array.isArray(coat.groups)&&coat.groups.includes(mat.group)}
// Upgrade unchanged factory defaults in existing local libraries; NEVER overwrite edited ranges.
// Source metadata survives later edits and is reset to 'custom' when any range is changed.
let hasStoredLibrary=false;try{hasStoredLibrary=Boolean(localStorage.getItem(KEY))}catch{}
if(hasStoredLibrary){
 let changed=false;
 const defaults=freshData();
 for(const m of db.materials){let factory=defaults.materials.find(a=>a.id===m.id);if(!factory)continue;
  m.rangeSources=m.rangeSources||{};
  for(const id of ['flat','drill_twist']){
   const before=m.ranges?.[id]?.carbide,legacy=oldFactoryRange(m.id,id),latest=factory.ranges?.[id]?.carbide;
   if(!before||!latest||!legacy)continue;
   if(before.length===2&&before.every((v,i)=>Math.abs(Number(v)-legacy[i])<.00001)){
    m.ranges[id].carbide=latest.slice();m.rangeSources[id]={...(m.rangeSources[id]||{}),carbide:factory.rangeSources[id]?.carbide||'estimate'};changed=true;
   }else if(before.every((v,i)=>Math.abs(Number(v)-latest[i])<.00001) && factory.rangeSources[id]){
    m.rangeSources[id]={...(m.rangeSources[id]||{}),carbide:factory.rangeSources[id].carbide};
   }else if(!m.rangeSources[id]?.carbide){m.rangeSources[id]={...(m.rangeSources[id]||{}),carbide:'custom'};}
  }
 }
 if(changed){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
}
let saves=[];try{let v=JSON.parse(localStorage.getItem('machiningDeskSetups')||'[]');if(Array.isArray(v))saves=v.slice(0,75).map(s=>{if(s.values?.calcTool==='drill_carbide')s.values.calcTool='drill_twist';if(['drill_ream_hss','drill_ream_carbide'].includes(s.values?.calcTool))s.values.calcTool='drill_ream';return s})}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch{alert('Could not save database: storage is unavailable or full. Export a backup.');return false}}
function persistSaves(){try{localStorage.setItem('machiningDeskSetups',JSON.stringify(saves))}catch{alert('Saved setups could not be stored.')}}
function item(k,id){return db[k].find(x=>x.id===id)}
function setOptions(el,things,previous,group){el.replaceChildren();let groups={};for(const x of things){let parent=el;if(group){let key=group(x);if(!groups[key]){let o=document.createElement('optgroup');o.label=key;groups[key]=o;el.append(o)}parent=groups[key]}let op=document.createElement('option');op.value=x.id;op.textContent=x.name;parent.append(op)}if(previous&&things.some(x=>x.id===previous))el.value=previous}
function number(id){return safeNum($(id).value)}
function validPositive(n){return Number.isFinite(n)&&n>0}
let units='in';
const LEN_IDS=new Set(['calcDiameter','calcLoad','calcRdoc','calcAdoc','calcHoleDepth','calcPriorHole','calcGrooveWidth']);
const convertFromBase=(id,v)=>units==='mm'?(LEN_IDS.has(id)?v*25.4:id==='calcSpeed'?v*.3048:v):v;
const convertToBase=(id,v)=>units==='mm'?(LEN_IDS.has(id)?v/25.4:id==='calcSpeed'?v/.3048:v):v;
function numShow(v,places=5){return Number.isFinite(v)?String(+v.toFixed(places)):''}
function setCalc(id,inchesOrSfm){$(id).value=numShow(convertFromBase(id,inchesOrSfm),units==='mm'?5:6)}
function getCalc(id){return convertToBase(id,safeNum($(id).value))}
function isMetric(){return units==='mm'}
function prettyLen(v,dec=4){return fmt(isMetric()?v*25.4:v,isMetric()?Math.max(2,dec-1):dec)}
function pctSetRdoc(){const d=getCalc('calcDiameter'),r=getCalc('calcRdoc');$('calcRdocPct').value=d>0&&Number.isFinite(r)?numShow(100*r/d,2):'';}
function pctApplyRdoc(){const d=getCalc('calcDiameter'),pct=safeNum($('calcRdocPct').value);if(d>0&&Number.isFinite(pct))setCalc('calcRdoc',d*pct/100);}
function setUnits(target){if(target===units)return;const old=units;let vals={};for(const id of [...LEN_IDS,'calcSpeed']){let x=safeNum($(id).value);if(Number.isFinite(x))vals[id]=old==='mm'?(LEN_IDS.has(id)?x/25.4:x/.3048):x;}
 units=target;try{localStorage.setItem('machiningDeskUnits',units)}catch{};for(const [id,v] of Object.entries(vals))setCalc(id,v);
 $('unitImperial').setAttribute('aria-pressed',String(units==='in'));$('unitMetric').setAttribute('aria-pressed',String(units==='mm'));document.querySelectorAll('.ulen').forEach(e=>e.textContent=units);
 $('rdocUnit').textContent=units;$('adocUnit').textContent=units;document.querySelectorAll('.wireUnit').forEach(el=>el.textContent=$('threadSystem').value==='un'?'in':'mm');$('resultSpeedLabel').textContent=isMetric()?'m/min':'SFM';$('resultFeedLabel').textContent=isMetric()?'mm/min':'IPM';$('resultPowerLabel').textContent=isMetric()?'Power · kW':'Power · HP';$('resultChipLabel').textContent=op==='mill'?(isMetric()?'mm/tooth':'IPT'):(isMetric()?'mm/rev':'IPR');$('mrrLabel').textContent=isMetric()?'Material removal · cm³/min':'Material removal · in³/min';$('iprLabel').textContent=isMetric()?'Feed / revolution · mm':'Feed / revolution · IPR';$('speedLabel').textContent=isMetric()?'Cutting speed (m/min)':'Cutting speed (SFM)';
 if(OPS[route]){updateToolFields();calculate()};if(route==='db')convertDbEditor(old,target);if(route==='drillchart')renderDrills();if(route==='threads')renderThread();}
let dbGroup='all';let route='home',op='mill',drafts={},dbTab='machines',dbId=null,rangeTab='mill',working=null;
function snapshotCalc(){let x={};for(const id of ['calcMachine','calcSpindle','calcTool','calcSubstrate','calcCoating','calcMaterial','calcDiameter','calcTeeth','calcSpeed','calcLoad','calcRdoc','calcAdoc','calcHoleDepth','calcPriorHole','calcGrooveWidth','rpmOverride','feedOverride'])x[id]=LEN_IDS.has(id)||id==='calcSpeed'?String(getCalc(id)):$(id).value;for(const id of ['calcSlot','calcThin','calcHsm','calcClamp'])x[id]=$(id).checked;return x}
function restoreCalc(s){if(!s)return;for(const [id,v] of Object.entries(s))if($(id)){if($(id).type==='checkbox')$(id).checked=Boolean(v);else if($(id).tagName==='SELECT'){if([...$(id).options].some(o=>o.value===v))$(id).value=v}else if(LEN_IDS.has(id)||id==='calcSpeed')setCalc(id,Number(v));else $(id).value=v}}
function navigate(where){
 if(where==='threewire')where='threads';
 if(where!=='home'&&where!=='db'&&where!=='drillchart'&&where!=='threads'&&where!=='codes'&&!OPS[where])return;
 if(OPS[route])drafts[route]=snapshotCalc();route=where;
 $('homePage').classList.toggle('hidden',where!=='home');$('calculatorPage').classList.toggle('hidden',!OPS[where]);$('databasePage').classList.toggle('hidden',where!=='db');$('drillChartPage').classList.toggle('hidden',where!=='drillchart');$('threadsPage').classList.toggle('hidden',where!=='threads');$('codesPage').classList.toggle('hidden',where!=='codes');
 document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('current',b.classList.contains('navbtn')&&b.dataset.route===where));
 if(OPS[where]){op=where;$('operationTitle').textContent=OPS[where];rebuildCalc(drafts[where]);renderSaves();}
 if(where==='db')renderDb();if(where==='drillchart'){showChart(chartTab);renderDrills();}if(where==='threads'){initThreads();showThreadMode($('threadSide').value);}if(where==='codes')window.MachiningDeskHaasCodes?.render(db.machines);window.scrollTo({top:0,behavior:'instant'});
}
function showThreadMode(mode){
 const external=mode==='external';$('threadSide').value=external?'external':'internal';
 $('showInternalThreads').classList.toggle('active',!external);$('showExternalThreads').classList.toggle('active',external);
 $('showInternalThreads').setAttribute('aria-pressed',String(!external));$('showExternalThreads').setAttribute('aria-pressed',String(external));
 $('threeWireSection').classList.toggle('hidden',!external);
 if(!external){$('enableThreeWire').checked=false;$('threeWirePanel').classList.add('hidden');}
 else if($('enableThreeWire').checked)window.MachiningDeskThreeWire?.init();
 renderThread();
}
$('showInternalThreads').addEventListener('click',()=>showThreadMode('internal'));
$('showExternalThreads').addEventListener('click',()=>showThreadMode('external'));
$('enableThreeWire').addEventListener('change',()=>{
 let active=$('enableThreeWire').checked;$('threeWirePanel').classList.toggle('hidden',!active);
 if(active)window.MachiningDeskThreeWire?.init();
});
let chartTab='drills';
function showChart(tab){chartTab=tab==='screws'?'screws':'drills';let drill=chartTab==='drills';
 $('drillChartPanel').classList.toggle('hidden',!drill);$('capHeadPanel').classList.toggle('hidden',drill);
 $('showDrillChart').classList.toggle('active',drill);$('showCapChart').classList.toggle('active',!drill);
 $('showDrillChart').setAttribute('aria-pressed',String(drill));$('showCapChart').setAttribute('aria-pressed',String(!drill));
 if(!drill)window.MachiningDeskHardware?.render();
}
$('showDrillChart').addEventListener('click',()=>showChart('drills'));
$('showCapChart').addEventListener('click',()=>showChart('screws'));
function toolCompatible(m,t){return m&&t&&Array.isArray(m.ops)&&m.ops.includes(t.op)&&(!Array.isArray(m.toolIds)||!m.toolIds.length||m.toolIds.includes(t.id))}
function spindleCaps(m,s){if(s==='secondary')return {rpm:Number(m?.secondaryRpm)||0,hp:Number(m?.secondaryHp)||0,desc:'Secondary spindle'};if(s==='live')return {rpm:Number(m?.liveRpm)||0,hp:Number(m?.liveHp)||0,desc:'Live tooling'};return {rpm:Number(m?.rpm)||0,hp:Number(m?.hp)||0,desc:'Main spindle'};}
function refreshSpindle(saved){let m=item('machines',$('calcMachine').value);let available=[{id:'main',name:'Main spindle'}];if(m?.secondaryRpm>0&&op!=='mill')available.push({id:'secondary',name:'Secondary spindle'});if(m?.liveRpm>0&&op!=='turn')available.push({id:'live',name:'Live-tool spindle'});
 if(op==='mill'&&m?.ops.includes('turn'))available=available.filter(x=>x.id==='live');
 let preferred=saved&&available.some(x=>x.id===saved)?saved:op==='mill'&&m?.ops.includes('turn')?'live':'main';setOptions($('calcSpindle'),available,preferred);$('spindleBox').classList.toggle('hidden',available.length<=1&&!m?.ops?.includes('turn'));}
function rebuildCalc(draft){if(!draft){$('rpmOverride').value='100';$('feedOverride').value='100';}else {for(const key of ['rpmOverride','feedOverride'])$(key).value=draft[key]??'100';}for(const key of ['rpmOverride','feedOverride'])$(key+'Display').value=$(key).value+'%';let old=draft||snapshotCalc();setOptions($('calcMachine'),db.machines.filter(m=>Array.isArray(m.ops)&&m.ops.includes(op)),old.calcMachine);let m=item('machines',$('calcMachine').value);setOptions($('calcTool'),db.tools.filter(t=>t.op===op&&toolCompatible(m,t)),old.calcTool);setOptions($('calcCoating'),db.coatings,old.calcCoating);setOptions($('calcMaterial'),db.materials,old.calcMaterial,m=>m.group||'Other');updateCoatingOptions();
 refreshSpindle(old.calcSpindle);if(draft){restoreCalc(draft)}else{setToolDefaults();}
 updateToolFields();if(!draft)recommendSpeed();calculate();}
function updateCoatingOptions(){
 const material=item('materials',$('calcMaterial').value);
 const chosen=$('calcCoating').value;
 const coatings=db.coatings.slice().sort((a,b)=>Number(isCoatingRecommended(b,material))-Number(isCoatingRecommended(a,material)));
 setOptions($('calcCoating'),coatings,chosen);
 for(const opt of $('calcCoating').options){let coat=item('coatings',opt.value);opt.textContent=(isCoatingRecommended(coat,material)?'✓ ':'')+coat.name;}
}
function machineChanged(){let previous=$('calcTool').value;let m=item('machines',$('calcMachine').value);setOptions($('calcTool'),db.tools.filter(t=>t.op===op&&toolCompatible(m,t)),previous);setToolDefaults();refreshSpindle($('calcSpindle').value);updateToolFields();recommendSpeed();calculate()}
function setToolDefaults(){let t=item('tools',$('calcTool').value),m=item('machines',$('calcMachine').value);if(!t)return;setCalc('calcDiameter',t.d||.5);$('calcTeeth').value=t.teeth||4;setCalc('calcLoad',(t.load||.004)*(m?.manual?m.feedFactor||.22:1));$('calcSlot').checked=false;$('calcThin').checked=false;$('calcHsm').checked=false;
 let r=op==='turn'?.06:op==='mill'?(t.id==='saw'?.0625:Math.max(.001,(t.d||.5)*.35)):0;setCalc('calcRdoc',r);
 setCalc('calcAdoc',op==='mill'?(t.id==='saw'?.75:Math.min(.25,Math.max(.001,(t.d||.5)*.5))):.05);setCalc('calcHoleDepth',Math.max(.1,(t.d||.375)*3));setCalc('calcPriorHole',Math.max(.0001,(t.d||.5)*.96));setCalc('calcGrooveWidth',.125);pctSetRdoc();recommendFeed();}

function referenceForCurrent(){return maker?.lookup($('calcMaterial').value,$('calcTool').value,$('calcSubstrate').value,getCalc('calcDiameter'),$('calcSlot').checked)||null;}
function recommendFeed(){let t=item('tools',$('calcTool').value),m=item('machines',$('calcMachine').value),r=referenceForCurrent();if(!t)return;
 let base=t.load||.004;
 // Source per-tooth and per-revolution feeds differ; never divide drill feeds by flute count.
 if(r&&Number.isFinite(r.feed))base=r.feed;
 if(m?.manual)base*=m.feedFactor||.22;
 setCalc('calcLoad',base);
 const e=$('feedSource');if(e){let isRef=!!r;e.innerHTML=isRef?`<b>Haas tool-series starting ${r.feedUnit}</b>: ${fmt(isMetric()?base*25.4:base,isMetric()?4:5)} ${isMetric()?'mm':'in'} (${esc(r.basis)}). <a href="${maker.SOURCES[r.source].url}" target="_blank" rel="noopener noreferrer">Source chart ↗</a>${getCalc('calcDiameter')<r.minDiameter||getCalc('calcDiameter')>r.maxDiameter?' · Outside published tool diameter range: end value used; verify.':''}`:`Estimated default from editable tool library; not a manufacturer-verified feed.${m?.manual?' Manual-machine reduction applied.':''}`;}}
function recommended(){let t=item('tools',$('calcTool').value),m=item('materials',$('calcMaterial').value),c=item('coatings',$('calcCoating').value),machine=item('machines',$('calcMachine').value),sub=$('calcSubstrate').value;if(!t||!m||!c)return null;let entry=m.ranges?.[t.id]?.[sub];if(!Array.isArray(entry)||entry.length!==2||!entry.every(validPositive))return null;
 const makerRef=referenceForCurrent(),source=m.rangeSources?.[t.id]?.[sub];
 const verified=Boolean(makerRef&&source===makerRef.source&&m.group!=='Aluminum');
 const r=verified?[Math.round(makerRef.sfm*.85),makerRef.sfm]:entry;
 // Published values are already tied to specific cutting tool configurations; arbitrary coating factors are not manufacturer-certified.
 const coatingFactor=(verified||m.group==='Aluminum')?1:c.factor;
 const multiplier=coatingFactor*(machine?.manual?machine.speedFactor||.25:1);
 return {min:r[0]*multiplier,max:r[1]*multiplier,base:r,material:m,tool:t,coating:c,reference:verified?makerRef:null,source:verified?maker.SOURCES[makerRef.source]:null};}
function recommendSpeed(){let r=recommended();if(r){setCalc('calcSpeed',Math.round(r.min+(r.max-r.min)*(op==='mill'&&$('calcHsm').checked?.75:.5)))}else $('calcSpeed').value='';updateRecommendation()}
function updateRecommendation(){let r=recommended();let e=$('materialRange');if(!r){e.textContent='No speed-range entry for this material/tool combination. Add one in Database → Materials.';return;}
 const unit=isMetric()?'m/min':'SFM',min=isMetric()?r.min*.3048:r.min,max=isMetric()?r.max*.3048:r.max;
 if(r.reference){e.innerHTML=`<b>Manufacturer-derived starting band:</b> ${fmt(min,0)}–${fmt(max,0)} ${unit}; published tool-series target ${fmt(isMetric()?r.reference.sfm*.3048:r.reference.sfm,0)} ${unit}. The 85% lower end is an app safety margin, not a published range. <a href="${r.source.url}" target="_blank" rel="noopener noreferrer">${esc(r.source.name)} ↗</a>. Approximate material class; <b>other cutter/coating geometries need separate data</b>.${item('machines',$('calcMachine').value)?.manual?' Manual-machine reduction applied.':''}`;}
 else {e.textContent=`${r.tool.name} · ${$('calcSubstrate').selectedOptions[0]?.textContent||'Tool'} · ${r.coating.name}: ${fmt(min,0)}–${fmt(max,0)} ${unit}. Engineering estimate or user-edited range—not directly validated for this cutter/material combination.${item('machines',$('calcMachine').value)?.manual?' Manual-machine reduction applied.':''}`;}}
function updateToolFields(){
 let t=item('tools',$('calcTool').value),mill=op==='mill',turn=op==='turn',drill=op==='drill';
 $('teethBox').classList.toggle('hidden',!mill);$('rdocBox').classList.toggle('hidden',drill);$('adocBox').classList.toggle('hidden',!mill);
 $('holeDepthBox').classList.toggle('hidden',!drill);$('priorHoleBox').classList.toggle('hidden',!(drill&&t?.ream));$('grooveWidthBox').classList.toggle('hidden',!(turn&&t?.groove));
 $('diameterLabel').textContent=turn?`Workpiece diameter at cut (${units})`:`Cutting diameter (${units})`;
 $('loadLabel').textContent=mill?`Programmed chip load (${isMetric()?'mm/tooth':'IPT'})`:t?.thread?`Thread lead (${isMetric()?'mm/rev':'in/rev'})`:`Feed per revolution (${isMetric()?'mm/rev':'IPR'})`;
 $('rdocLabel').textContent=turn?'RDOC · Radial depth of cut':t?.id==='saw'?'RDOC · Kerf width':'RDOC · Radial width of cut';
 $('adocLabel').innerHTML=(t?.id==='saw'?'ADOC · Radial saw engagement':'ADOC · Axial depth of cut')+' (<span id="adocUnit">'+units+'</span>)';
 $('slotWrap').classList.toggle('hidden',!(mill&&t?.slot));$('thinWrap').classList.toggle('hidden',!(mill&&t?.thin));$('hsmWrap').classList.toggle('hidden',!(mill&&t?.hsm));
 if(!t?.slot)$('calcSlot').checked=false;if(!t?.thin)$('calcThin').checked=false;if(!t?.hsm)$('calcHsm').checked=false;
 $('calcRdoc').disabled=$('calcRdocPct').disabled=Boolean(mill&&$('calcSlot').checked);
 if(mill&&t?.slot&&$('calcSlot').checked&&t.id!=='saw')setCalc('calcRdoc',getCalc('calcDiameter'));
 let ae=getCalc('calcRdoc'),d=getCalc('calcDiameter');let allowThin=mill&&t?.thin&&!$('calcSlot').checked&&ae>0&&d>0&&ae<d/2;
 $('calcThin').disabled=!allowThin;if(!allowThin)$('calcThin').checked=false;
 let allowHsm=mill&&t?.hsm&&!$('calcSlot').checked;$('calcHsm').disabled=!allowHsm;if(!allowHsm)$('calcHsm').checked=false;
 pctSetRdoc();updateResultFields();
 $('cutterHelp').textContent=t?.note||'Adjust cutter parameters to suit your tool. Verify axial cutting-edge engagement against the actual cutter geometry.';updateRecommendation();
}
function updateResultFields(){
 let milling=op==='mill',drilling=op==='drill',threading=op==='turn'&&Boolean(item('tools',$('calcTool').value)?.thread);
 $('resultChipLabel').textContent=milling?(isMetric()?'mm/tooth':'IPT'):(isMetric()?'mm/rev':'IPR');
 $('resultIprBox').classList.toggle('hidden',!milling);
 $('resultTimeBox').classList.toggle('hidden',!drilling);
 $('resultPowerBox').classList.toggle('hidden',threading);
 $('resultMrrBox').classList.toggle('hidden',threading);
 $('resultUtilBox').classList.toggle('hidden',threading);
}
function updateResultFlag(count,invalid=false){let bar=document.querySelector('.resultbar');bar.classList.toggle('warning',count>0&&!invalid);bar.classList.toggle('invalid',invalid);$('expandResults').dataset.warningCount=String(count);updateExpandTitle()}
function updateExpandTitle(){let open=!$('expandedResults').classList.contains('hidden'),n=Number($('expandResults').dataset.warningCount||0);$('expandResults').textContent=(n?`${n} notices · `:'')+`Details ${open?'▴':'▾'}`}
function calculate(){let t=item('tools',$('calcTool').value),m=item('machines',$('calcMachine').value),mat=item('materials',$('calcMaterial').value);let d=getCalc('calcDiameter'),sfm=getCalc('calcSpeed'),load=getCalc('calcLoad'),teeth=number('calcTeeth'),rdoc=getCalc('calcRdoc'),adoc=getCalc('calcAdoc'),pre=getCalc('calcPriorHole'),gw=getCalc('calcGrooveWidth');let spindle=spindleCaps(m,$('calcSpindle').value);let warnings=[];
 let numbers=[d,sfm,load];if(op==='mill')numbers.push(teeth,rdoc,adoc);if(op==='turn')numbers.push(rdoc);if(op==='drill'){numbers.push(getCalc('calcHoleDepth'));if(t?.ream)numbers.push(pre);}if(t?.groove)numbers.push(gw);
 const clear=message=>{for(const id of ['resultSfm','resultRpm','resultIpm','resultHp','resultIpt','resultMrr','resultUtil','resultIpr','resultTime'])$(id).textContent='—';$('resultNotes').className='notices bad';$('resultNotes').textContent=message;$('summaryText').textContent=message;$('calcNotes').textContent='Check all numeric inputs and your database values.';updateResultFlag(0,true);};
 if(!t||!m||!mat){clear('Add a compatible machine, cutter type, and material in the database.');return}
 if(numbers.some(x=>!Number.isFinite(x))||numbers.some(x=>x<=0)||d>100||sfm>100000||load>10||(op==='mill'&&(!Number.isInteger(teeth)||teeth>500||rdoc>d&&t.id!=='saw'))||(op==='turn'&&rdoc>=d/2)||(op==='drill'&&t.ream&&pre>=d)){clear('Enter valid positive parameters. Milling RDOC cannot exceed cutter diameter, turning RDOC must be less than half the workpiece diameter, and reamer pre-hole must be smaller than the reamer.');return}
 if(op==='mill'&&t.id==='saw'&&rdoc<=0){clear('Enter a positive saw kerf width.');return}
 if(!spindle.rpm){clear('This spindle is not configured with a valid RPM maximum. Set it in Database → Machines.');return;}let baseRpm=12*sfm/(Math.PI*d),nominalRpm=$('calcClamp').checked?Math.min(baseRpm,spindle.rpm):baseRpm;
 const rpmPct=Number($('rpmOverride').value)/100,feedPct=Number($('feedOverride').value)/100;
 let requestedRpm=nominalRpm*rpmPct,rpm=$('calcClamp').checked?Math.min(requestedRpm,spindle.rpm):requestedRpm;
 let actualSfm=rpm*Math.PI*d/12,fz=load,chipMultiplier=1;
 if($('calcClamp').checked&&requestedRpm>spindle.rpm)warnings.push('RPM override limited by the selected machine’s spindle maximum.');
 if(rpm===0&&feedPct>0)warnings.push('Spindle is stopped while feed override is nonzero: do not engage the tool with the spindle stopped.');

 if(op==='mill'&&$('calcThin').checked&&t.thin){let ratio=rdoc/d;if(ratio>0&&ratio<.5){let maxChipFactor=1/Math.sqrt(1-Math.pow(1-2*ratio,2));chipMultiplier=Math.min(3,maxChipFactor);fz=load*chipMultiplier;if(maxChipFactor>3)warnings.push('Chip-thinning compensation was capped at 3×; verify chip thickness near extremely low engagement.')}}
 if(op==='mill'&&$('calcHsm').checked){if(rdoc/d>.4)warnings.push('HSM normally assumes controlled, relatively low radial engagement; selected RDOC may be too high.');warnings.push('HSM selects an upper-range SFM starting point; it does not generate constant-engagement toolpaths or justify automatically increasing chip load.');}
 let feed=nominalRpm*(op==='mill'?fz*teeth:load)*feedPct;if(op==='mill'){let modifier=Number(t.feedFactor)||1;if($('calcSlot').checked&&t.slot){let ref=recommended()?.reference;modifier*=.65;if(ref?.slotProfile){warnings.push('Full-width slotting: source-specific slotting SFM target plus an additional conservative 65% feed multiplier. This extra feed reduction is an app estimate, not a manufacturer requirement.');}else{warnings.push('Full-width slotting: feed reduced to 65% of nominal as a conservative estimate. Confirm chip evacuation, axial engagement and toolmaker guidance.')}}if(m?.manual)warnings.push('Manual machine: conservative tool load and cutting-speed factors are applied at setup.');feed*=Math.max(.05,Math.min(1,modifier));if(modifier<1&&!(t.slot&&$('calcSlot').checked))warnings.push('Specialized cutter feed multiplier applied.');}let mrr=0,power=0;
 if(op==='mill'){mrr=feed*rdoc*adoc;if(t.id==='ball')warnings.push('Ball nose tip contact speed varies with engagement; RPM uses nominal diameter.');if(t.id==='chamfer')warnings.push('Chamfer cutter uses nominal diameter; contact diameter can be much smaller.');if(t.id==='saw')warnings.push('Saw power calculation uses kerf width × radial engagement as an approximation.');}
 else if(op==='turn'){if(t.groove){mrr=Math.PI*(d-rdoc)*gw*feed;warnings.push('Grooving/parting power assumes radial feeding and average diameter during the cut.');}else if(t.thread){mrr=NaN;power=NaN;warnings.push('Threading MRR and cutting power are not estimated; successive infeed passes remove different cross sections.');}else mrr=Math.PI*(d-rdoc)*rdoc*feed;}
 else{mrr=Math.PI/4*(d*d-(t.ream?pre*pre:0))*feed;if(number('calcHoleDepth')/d>(t.maxDepthRatio||4))warnings.push('Deep hole: verify chip evacuation, coolant, peck strategy, and drill length-to-diameter capability.');if(t.id==='drill_spot'||t.id==='drill_center'||t.id==='drill_countersink')warnings.push('Nominal cylindrical MRR overestimates conical cuts.');}
 if(Number.isFinite(mrr))power=mrr*mat.unitHp;
 if(rpm===0&&feed>0){power=NaN;mrr=NaN;warnings.push('Power and material-removal estimates are invalid with zero spindle speed and nonzero feed.');}
 let util=spindle.hp>0?power/spindle.hp*100:NaN;
 if(baseRpm>spindle.rpm)warnings.push($('calcClamp').checked?'Recommended RPM is capped at the machine’s entered maximum.':'Unmodified recommended RPM exceeds the machine’s entered maximum.');
 if(rpm>spindle.rpm)warnings.push('Overridden spindle RPM exceeds the machine’s configured limit.');
 if(rpm>0&&feed>0){const chipRatio=feedPct*nominalRpm/rpm;if(chipRatio>1.5)warnings.push('Effective feed per tooth/revolution is '+fmt(chipRatio,2)+'× the baseline at this spindle speed. Verify tooth load to avoid tool damage.');else if(chipRatio<.5)warnings.push('Effective feed per tooth/revolution is below half the baseline; rubbing may occur.');}
 if(feed>m.maxFeed)warnings.push('Calculated feed exceeds the machine’s entered maximum feed.');
 if(Number.isFinite(util)){if(util>100)warnings.push('Estimated cutting power exceeds the entered nominal spindle horsepower.');else if(util>75)warnings.push('Power is near nominal machine rating; check the spindle torque/power curve.');}
 let r=recommended();if(r&&(sfm<r.min||sfm>r.max))warnings.push('Requested SFM is outside the selected material/tool starting band.');
 if(op==='mill'&&rdoc/d<.25&&!$('calcThin').checked&&t.thin)warnings.push('At low radial engagement, chip thinning may make actual maximum chip thickness lower than programmed IPT.');
 if(!isCoatingRecommended(item('coatings',$('calcCoating').value),mat))warnings.push('Selected coating is not marked recommended for this material family. Consult the cutter manufacturer; recommendation is application-dependent.');
 if(!(spindle.hp>0))warnings.push(spindle.desc+' horsepower has not been verified or entered. Power usage cannot be assessed; edit the machine database.');
 if(!Number.isFinite(rpm)||!Number.isFinite(feed)||(!Number.isFinite(power)&&!t.thread&&rpm>0)||feed>1e9||power>1e9){clear('This combination is outside the supported calculation range.');return}
 $('resultSfm').textContent=fmt(isMetric()?actualSfm*.3048:actualSfm,0);$('resultRpm').textContent=fmt(rpm,0);$('resultIpm').textContent=fmt(isMetric()?feed*25.4:feed,2);$('resultHp').textContent=fmt(isMetric()?power*.745699872:power,2);$('resultIpt').textContent=rpm>0?fmt((feed/rpm/(op==='mill'?teeth:1))*(isMetric()?25.4:1),isMetric()?3:4):'—';$('resultMrr').textContent=fmt(isMetric()?mrr*16.387064:mrr,3);$('resultUtil').textContent=fmt(util,1)+(Number.isFinite(util)?'%':'');$('resultIpr').textContent=rpm>0?fmt(feed/rpm*(isMetric()?25.4:1),isMetric()?3:4):'—';$('resultTime').textContent=op==='drill'&&feed>0?fmt(getCalc('calcHoleDepth')/feed*60,1):'—';
 $('resultNotes').textContent=warnings.length?warnings.join(' '):'Within entered nominal machine limits. The selected tool/material combination and spindle power still require shop verification.';$('resultNotes').className='notices'+(warnings.length?' alert':'');updateResultFlag(warnings.length);
 $('summaryText').innerHTML=`<div class="hintcard"><b>Machine:</b> ${esc(m.name)}<br><b>Tool:</b> ${esc(t.name)}<br><b>Work material:</b> ${esc(mat.name)}<br><b>Spindle:</b> ${esc(spindle.desc)}<br><b>Tool diameter:</b> ${prettyLen(d,4)} ${units}</div>`;
 $('calcNotes').innerHTML=`<div class="hintcard"><b>Overrides:</b> RPM and feed are percentages of their independently recommended values; effective chip load changes when their percentages differ.<br><b>Speed:</b> ${isMetric()?'RPM = 1000 × m/min ÷ (π × D mm).':'RPM = 12 × SFM / (π × D in).'}<br><b>Feed:</b> Recommended RPM × ${op==='mill'?'flutes × target '+(isMetric()?'mm/tooth':'IPT')+(chipMultiplier>1?' × '+fmt(chipMultiplier,2)+' thinning factor':''):'target feed/rev'} × feed override; spindle override is independent.<br><b>Power:</b> material removal (in³/min) × ${fmt(mat.unitHp,2)} estimated hp/(in³/min).<br><b>Source:</b> ${r?.source?esc(r.source.name)+' (tool-series approximation)':'editable engineering estimates / custom library'}.${op==='turn'?'<br><b>Turning:</b> constant-RPM estimate, not CSS mode.':''}</div>`;
 }
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function saveSetup(){if(!item('machines',$('calcMachine').value)||!item('tools',$('calcTool').value))return;let name=prompt('Save setup as:',`${OPS[op]} · ${$('calcTool').selectedOptions[0]?.textContent||'Tool'}`);if(name===null||!name.trim())return;saves.unshift({id:uid(),name:name.trim().slice(0,85),op,values:snapshotCalc()});saves=saves.slice(0,75);persistSaves();renderSaves();$('saveFeedback').textContent='Saved in this browser.'}
function renderSaves(){let host=$('setupList');host.replaceChildren();let entries=saves.filter(s=>s.op===op);if(!entries.length){host.textContent='No saved setups for this operation.';host.className='help';return}for(const s of entries){let row=document.createElement('div');row.className='btnrow';row.style.cssText='padding:8px 0;border-top:1px solid var(--edge)';let n=document.createElement('span');n.style.cssText='font-size:12px;flex:1;min-width:100px';n.textContent=s.name;let load=document.createElement('button');load.className='btn';load.type='button';load.textContent='Load';load.addEventListener('click',()=>{rebuildCalc(s.values);$('saveFeedback').textContent='Loaded saved setup.'});let del=document.createElement('button');del.className='btn danger';del.type='button';del.textContent='×';del.title='Delete saved setup';del.addEventListener('click',()=>{saves=saves.filter(e=>e.id!==s.id);persistSaves();renderSaves()});row.append(n,load,del);host.append(row)} }
function dbText(id,title,value='',type='text',config=''){return `<div><label for="${id}">${esc(title)}</label><input id="${id}" type="${type}" value="${esc(value)}" ${config}></div>`}
function dbTextarea(id,title,value=''){return `<div class="full"><label for="${id}">${esc(title)}</label><textarea id="${id}">${esc(value)}</textarea></div>`}
function dbEditorFactor(id,tab=dbTab){if(id==='editFeed'&&tab==='machines')return 25.4;
 if(['editSecondaryHp','editLiveHp'].includes(id))return .745699872;
 if(id==='editHp'&&tab==='machines')return .745699872;
 if(id==='editHp'&&tab==='materials')return .745699872/16.387064;
 if(['editDiameter','editLoad','editNeckDiameter','editNoseRadius','editStickout'].includes(id)&&tab==='tools')return 25.4;
 return 1;}
function dbNum(id){const raw=number(id);return isMetric()?raw/dbEditorFactor(id):raw;}
function dbLabels(){for(const id of ['editDiameter','editLoad','editHp','editFeed','editSecondaryHp','editLiveHp','editNeckDiameter','editNoseRadius','editStickout']){
 const label=$('dbEditor').querySelector(`label[for="${id}"]`);if(!label)continue;
 let str={'editDiameter':'Default cutting diameter','editLoad':'Default chip load or feed/rev','editFeed':'Maximum feed','editSecondaryHp':'Power','editLiveHp':'Power','editHp':dbTab==='machines'?'Nominal main spindle power':'Estimated specific cutting power'}[id];
 let u=id==='editFeed'?(isMetric()?'mm/min':'IPM'):id==='editHp'&&dbTab==='materials'?(isMetric()?'kW/(cm³/min)':'hp/(in³/min)'):['editHp','editSecondaryHp','editLiveHp'].includes(id)?(isMetric()?'kW':'hp'):(isMetric()?'mm':'in');label.textContent=`${str} (${u})`;}
 if(dbTab==='materials'){let hdr=$('dbEditor').querySelector('h3');if(hdr&&hdr.textContent.includes('SFM'))hdr.textContent=isMetric()?'Cutting speed ranges (m/min) by cutter type':'SFM ranges by cutter type';}
}
function convertDbEditor(old,target,skipRanges=false){const factorNew=target==='mm'?1:-1;for(const id of ['editDiameter','editLoad','editHp','editFeed','editSecondaryHp','editLiveHp','editNeckDiameter','editNoseRadius','editStickout']){
 const input=$(id);if(!input||!$('dbEditor').contains(input))continue;const scale=dbEditorFactor(id);let val=safeNum(input.value);if(Number.isFinite(val))input.value=numShow(factorNew===1?val*scale:val/scale,6);
 }
 if(!skipRanges)document.querySelectorAll('.rangeVal').forEach(i=>{let v=safeNum(i.value);if(Number.isFinite(v))i.value=numShow(factorNew===1?v*.3048:v/.3048,4)});
 dbLabels();}
function renderDb(){dbGroup='all';renderDbGroups();document.querySelectorAll('[data-db]').forEach(b=>b.classList.toggle('active',b.dataset.db===dbTab));$('dbSearch').value='';if(!db[dbTab].some(e=>e.id===dbId))dbId=db[dbTab][0]?.id||null;renderDbList();renderEditor();}
function machineGroup(x){return x.category||((x.ops||[]).includes('mill')&&(x.ops||[]).includes('turn')?'millturn':(x.ops||[]).includes('turn')?'lathe':'mill')}
function renderDbGroups(){let host=$('dbGroups');host.replaceChildren();if(!['machines','tools','materials'].includes(dbTab)){host.classList.add('hidden');return}host.classList.remove('hidden');let groups=dbTab==='machines'?[['all','All'],['mill','Mills'],['lathe','Lathes'],['millturn','Mill-Turns']]:dbTab==='tools'?[['all','All'],['mill','Milling'],['turn','Turning'],['drill','Drilling']]:[['all','All'],...materialGroups().filter(g=>db.materials.some(x=>x.group===g)).map(g=>[g,g])];for(const [id,name] of groups){let b=document.createElement('button');b.type='button';b.className='minitab'+(dbGroup===id?' active':'');b.textContent=name;b.addEventListener('click',()=>{dbGroup=id;renderDbGroups();renderDbList()});host.append(b)}}
function renderDbList(){let q=$('dbSearch').value.toLowerCase().trim();let host=$('dbList');host.replaceChildren();for(const x of db[dbTab].filter(v=>v.name.toLowerCase().includes(q)&&(dbGroup==='all'||(dbTab==='machines'?machineGroup(v):dbTab==='tools'?v.op:dbTab==='materials'?(v.group||'Other'):null)===dbGroup))){let b=document.createElement('button');b.type='button';b.className='dbitem'+(dbId===x.id?' active':'');b.textContent=x.name;let sub=document.createElement('small');sub.textContent=dbTab==='machines'?(x.ops||[]).map(v=>OPS[v]).join(' · '):dbTab==='tools'?OPS[x.op]:dbTab==='materials'?x.group:('SFM × '+fmt(x.factor,2));b.append(sub);b.addEventListener('click',()=>{dbId=x.id;renderDbList();renderEditor()});host.append(b)}if(!host.children.length)host.textContent='No matching entries.'}
function renderEditor(){let x=item(dbTab,dbId);let box=$('dbEditor');$('dbFlash').textContent='';$('dbFlash').className='flash';$('deleteEntry').disabled=!x;$('duplicateEntry').disabled=!x;$('duplicateEntry').textContent=dbTab==='materials'?'Copy':'Duplicate';if(!x){$('editorTitle').textContent='No entry selected';box.innerHTML='<p>Add an entry to get started.</p>';working=null;return}working=copy(x);rangeTab='mill';$('editorTitle').textContent='Edit '+({machines:'machine',tools:'tool type',materials:'material',coatings:'coating'}[dbTab]);renderWorking();}
function renderWorking(){let x=working;let html='';if(dbTab==='machines'){
 html=`<div class="formgrid">${dbText('editName','Machine name',x.name)}<div><label for="editMachineCategory">Machine type</label><select id="editMachineCategory"><option value="mill" ${machineGroup(x)==='mill'?'selected':''}>Mill</option><option value="lathe" ${machineGroup(x)==='lathe'?'selected':''}>Lathe</option><option value="millturn" ${machineGroup(x)==='millturn'?'selected':''}>Mill-Turn</option></select></div>${dbText('editRpm','Main spindle RPM',x.rpm,'number','min="1" max="200000" step="1"')}${dbText('editHp','Nominal spindle power (hp)',x.hp,'number','min="0.1" step="any"')}${dbText('editFeed','Maximum feed (IPM)',x.maxFeed,'number','min="1" step="any"')}${dbTextarea('editNote','Notes',x.note)}</div><hr class="sectionline"><h3 id="extraSpindleHeading">Additional spindles (mill-turn machines)</h3><div class="machine-spindles" id="extraSpindles"><div class="spindlecard"><h3>Main spindle</h3><p class="help">RPM and horsepower configured above.</p></div><div class="spindlecard"><h3>Secondary spindle</h3>${dbText('editSecondaryRpm','Maximum RPM',x.secondaryRpm||0,'number','min="0" step="1"')}${dbText('editSecondaryHp','Power (hp)',x.secondaryHp||0,'number','min="0" step="any"')}</div><div class="spindlecard"><h3>Live-tool spindle</h3>${dbText('editLiveRpm','Maximum RPM',x.liveRpm||0,'number','min="0" step="1"')}${dbText('editLiveHp','Power (hp)',x.liveHp||0,'number','min="0" step="any"')}</div></div><p class="help">Set additional power to 0 if not verified; the calculator will not show a false power utilization percentage. A sub-spindle may be an optional add-on.</p><hr class="sectionline"><h3>Available operations</h3><p class="help">Available operations are limited by the selected machine type.</p><div class="btnrow">${Object.keys(OPS).map(k=>`<label class="check"><input class="editOp" type="checkbox" value="${k}" ${(x.ops||[]).includes(k)?'checked':''}>${OPS[k]}</label>`).join('')}</div><hr class="sectionline"><h3>Compatible cutter types</h3><label class="check"><input id="editAllTools" type="checkbox" ${!x.toolIds?.length?'checked':''}>Use all cutter types for selected operations</label><p class="help">For example, disable incompatible cutter types for a particular machine.</p><div id="machineTools" class="toolchecks"></div>`;
 }else if(dbTab==='tools'){
 html=`<div class="formgrid">${dbText('editName','Cutter type name',x.name)}<div><label for="editOpSelect">Operation</label><select id="editOpSelect">${Object.entries(OPS).map(([k,v])=>`<option value="${k}" ${x.op===k?'selected':''}>${v}</option>`).join('')}</select></div>${dbText('editDiameter','Default cutting diameter (in)',x.d,'number','min="0.0001" step="any"')}${dbText('editTeeth','Default flutes / teeth',x.teeth,'number','min="1" max="500" step="1"')}${dbText('editLoad','Default chip load or feed/rev (in)',x.load,'number','min="0.000001" step="any"')}${dbText('editFactor','Starting SFM factor for new materials',x.factor,'number','min="0.01" max="3" step="any"')}${dbTextarea('editNote','Tool notes',x.note)}</div><div id="toolGeometry" class="formgrid"></div><hr class="sectionline"><h3>Milling controls</h3><div class="btnrow">${[['slot','Slotting'],['thin','Chip thinning'],['hsm','HSM']].map(([k,n])=>`<label class="check"><input class="toolFlag" data-flag="${k}" type="checkbox" ${x[k]?'checked':''} ${x.op!=='mill'?'disabled':''}>${n}</label>`).join('')}</div><hr class="sectionline"><h3>Special cutting geometry</h3><div class="btnrow"><label class="check"><input class="toolFlag" data-flag="groove" type="checkbox" ${x.groove?'checked':''}>Grooving / parting</label><label class="check"><input class="toolFlag" data-flag="thread" type="checkbox" ${x.thread?'checked':''}>Single-point threading</label><label class="check"><input class="toolFlag" data-flag="ream" type="checkbox" ${x.ream?'checked':''}>Reamer</label></div><p class="help">Adding a tool type will create SFM rows for it in every existing material, using that material's first available ranges and the tool's SFM factor. Review these estimates afterward.</p>`;
 }else if(dbTab==='materials'){
 html=`<div class="formgrid">${dbText('editName','Material designation',x.name)}<div><label for="editGroup">Material family</label><select id="editGroup">${materialGroups().map(g=>`<option ${x.group===g?'selected':''}>${g}</option>`).join('')}</select></div>${dbText('editHp','Estimated specific cutting power · hp/(in³/min)',x.unitHp,'number','min="0.001" step="any"')}${dbTextarea('editNote','Notes / condition / temper',x.note)}</div><hr class="sectionline"><h3>SFM ranges by cutter type</h3><p class="dbintro muted">Baseline <b>uncoated</b> starting ranges, grouped by machining operation. Both carbide and high-speed steel (HSS) are editable. Ranges are not certified manufacturer data.</p><div class="minitabrow">${Object.entries(OPS).map(([k,v])=>`<button type="button" class="minitab ${rangeTab===k?'active':''}" data-range="${k}">${v}</button>`).join('')}</div><div id="rangeTable"></div>`;
 }else if(dbTab==='coatings'){
 html=`<div class="formgrid">${dbText('editName','Coating name',x.name)}${dbText('editFactor','Illustrative SFM multiplier',x.factor,'number','min="0.01" max="3" step="any"')}${dbTextarea('editNote','Coating notes',x.note)}</div><hr class="sectionline"><h3>Recommended workpiece material families</h3><p class="subtitle">Select families this coating is suitable for. These are advisory and will be highlighted on the machining calculator. Actual coating recommendations depend on cutter grade and application.</p><div class="toolchecks">${materialGroups().filter(g=>g!=='Other').map(g=>`<label class="check"><input type="checkbox" class="coatGroup" value="${esc(g)}" ${(x.groups||[]).includes(g)?'checked':''}>${esc(g)}</label>`).join('')}</div><p class="sourcehint">Baseline selection informed by <a href="https://www.harveytool.com/resources/tool-coatings" target="_blank" rel="noopener noreferrer">Harvey Tool coating guidance</a>. Generic chemistry alone cannot guarantee suitability.</p><div class="info" style="margin-top:16px">Multiplier 1.00 = unchanged SFM range. Coating multipliers are simplified placeholders, not manufacturer-validated factors. Suitability can depend heavily on alloy and coating chemistry.</div>`;
 }
 $('dbEditor').innerHTML=html;
 if(dbTab==='machines'){applyMachineCategory();$('editMachineCategory').addEventListener('change',applyMachineCategory);renderMachineTools();$('editAllTools').addEventListener('change',renderMachineTools);document.querySelectorAll('.editOp').forEach(c=>c.addEventListener('change',renderMachineTools));}
 if(dbTab==='tools'){renderToolGeometry();$('editOpSelect').addEventListener('change',renderToolGeometry);$('editOpSelect').addEventListener('change',()=>{let isMill=$('editOpSelect').value==='mill';document.querySelectorAll('.toolFlag').forEach(c=>{if(['slot','thin','hsm'].includes(c.dataset.flag))c.disabled=!isMill})});}
 if(dbTab==='materials'){renderRangeTable();document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{captureRanges();rangeTab=b.dataset.range;document.querySelectorAll('[data-range]').forEach(b2=>b2.classList.toggle('active',b2.dataset.range===rangeTab));renderRangeTable()}));}if(isMetric())convertDbEditor('in','mm',true);else dbLabels();
 }
function applyMachineCategory(){let k=$('editMachineCategory').value;let opts=k==='mill'?['mill','drill']:k==='lathe'?['turn','drill']:['mill','turn','drill'];document.querySelectorAll('.editOp').forEach(c=>{c.disabled=!opts.includes(c.value);if(c.disabled)c.checked=false});if(k==='lathe')document.querySelector('.editOp[value="turn"]').checked=true;if(k==='mill')document.querySelector('.editOp[value="mill"]').checked=true;if(k==='millturn')for(const c of document.querySelectorAll('.editOp'))c.checked=true;$('extraSpindles').classList.toggle('hidden',k!=='millturn');$('extraSpindleHeading').classList.toggle('hidden',k!=='millturn');renderMachineTools()}
function renderToolGeometry(){let opNow=$('editOpSelect').value;let box=$('toolGeometry');let x=working;box.innerHTML=opNow==='mill'?`${dbText('editToolFeedFactor','Tool feed multiplier (0.1–1)',x.feedFactor??1,'number','min="0.1" max="1" step="0.05"')}${dbText('editAngle','Included angle (degrees, form cutters)',x.angle||60,'number','min="1" max="179" step="any"')}${dbText('editNeckDiameter','Neck diameter (in, form cutters)',x.neckDiameter||x.d*.5,'number','min="0.0001" step="any"')}`:opNow==='turn'?`${dbText('editNoseRadius','Nose radius (in)',x.noseRadius||.03125,'number','min="0" step="any"')}${dbText('editStickout','Tool overhang (in)',x.stickout||2,'number','min="0.01" step="any"')}`:`${dbText('editPointAngle','Point angle (degrees)',x.pointAngle||118,'number','min="1" max="179" step="any"')}${dbText('editMaxDepthRatio','Suggested maximum depth / diameter',x.maxDepthRatio||4,'number','min="0.1" step="any"')}`;if(isMetric()){for(const id of ['editNeckDiameter','editNoseRadius','editStickout']){let el=$(id);if(el)el.value=numShow(Number(el.value)*25.4,5)}}}
function renderMachineTools(){let host=$('machineTools');let selectedOps=[...document.querySelectorAll('.editOp:checked')].map(c=>c.value);let all=$('editAllTools').checked;host.replaceChildren();for(const t of db.tools.filter(t=>selectedOps.includes(t.op))){let label=document.createElement('label');label.className='check';let check=document.createElement('input');check.type='checkbox';check.className='machineTool';check.value=t.id;check.checked=all||working.toolIds?.includes(t.id);check.disabled=all;let text=document.createTextNode(t.name);label.append(check,text);host.append(label)}host.classList.toggle('hidden',all);}
function renderRangeTable(){let host=$('rangeTable');host.innerHTML='<div class="rangewrap"><table><thead><tr><th>Cutter type</th><th>Carbide low</th><th>Carbide high</th><th>HSS low</th><th>HSS high</th></tr></thead><tbody id="rangeBody"></tbody></table></div>';
 let body=$('rangeBody');for(const t of db.tools.filter(v=>v.op===rangeTab)){let r=working.ranges?.[t.id]||{carbide:['',''],hss:['','']};let row=document.createElement('tr');let c=document.createElement('td');c.textContent=t.name;row.append(c);for(const s of SUBS)for(const v of r[s]||['','']){let td=document.createElement('td');let inp=document.createElement('input');inp.type='number';inp.min='1';inp.max='100000';inp.step='any';inp.value=isMetric()&&v!==''?numShow(Number(v)*.3048,4):v;inp.className='rangeVal';inp.dataset.tool=t.id;inp.dataset.sub=s;inp.dataset.bound=String(td.dataset.bound||((row.querySelectorAll('input').length)%2));inp.setAttribute('aria-label',`${t.name} ${s} ${row.querySelectorAll('input').length%2?'maximum':'minimum'} ${isMetric()?'m/min':'SFM'}`);td.append(inp);row.append(td)}body.append(row)} }
function captureRanges(){if(dbTab!=='materials'||!working)return;working.ranges=working.ranges||{};document.querySelectorAll('.rangeVal').forEach(inp=>{let id=inp.dataset.tool,s=inp.dataset.sub,b=Number(inp.dataset.bound);let x=working.ranges[id]||(working.ranges[id]={carbide:[0,0],hss:[0,0]});x[s]=x[s]||[0,0];let parsed=Number(inp.value)/(isMetric()?.3048:1);if(Number.isFinite(parsed)&&Math.abs(parsed-Number(x[s][b]))>0.0002){working.rangeSources=working.rangeSources||{};working.rangeSources[id]={...(working.rangeSources[id]||{}),[s]:'custom'};}x[s][b]=parsed;});}
function dbFeedback(s,error=false){$('dbFlash').textContent=s;$('dbFlash').className='flash '+(error?'error':'success')}
function saveEditor(e){e.preventDefault();if(!working)return;let x=copy(working),name=$('editName').value.trim();if(!name){dbFeedback('Enter a name.',true);return}x.name=name.slice(0,140);x.note=($('editNote')?.value||'').trim().slice(0,1000);
 if(dbTab==='machines'){let rpm=number('editRpm'),hp=dbNum('editHp'),feed=dbNum('editFeed');let ops=[...document.querySelectorAll('.editOp:checked')].map(c=>c.value);if(!validPositive(rpm)||rpm>200000||!validPositive(hp)||!validPositive(feed)||!ops.length){dbFeedback('Set positive RPM, horsepower and feed values, and select at least one operation.',true);return}x.category=$('editMachineCategory').value;x.rpm=Math.round(rpm);x.hp=hp;x.maxFeed=feed;x.ops=ops;if(x.category!=='millturn'){x.secondaryRpm=0;x.secondaryHp=0;x.liveRpm=0;x.liveHp=0;}for(const key of ['Secondary','Live']){let rv=number('edit'+key+'Rpm'),hv=dbNum('edit'+key+'Hp');if(!Number.isFinite(rv)||!Number.isFinite(hv)||rv<0||rv>200000||hv<0||hv>10000){dbFeedback('Enter valid secondary/live spindle values. Use zero when not fitted or not verified.',true);return;}if(x.category==='millturn'){x[key.toLowerCase()+'Rpm']=Math.round(rv);x[key.toLowerCase()+'Hp']=hv;}}if($('editAllTools').checked)x.toolIds=[];else{ x.toolIds=[...document.querySelectorAll('.machineTool:checked')].map(c=>c.value);if(!x.toolIds.length){dbFeedback('Select at least one compatible cutter type or enable all cutter types.',true);return}}}
 else if(dbTab==='tools'){let d=dbNum('editDiameter'),teeth=number('editTeeth'),load=dbNum('editLoad'),factor=number('editFactor');if(!validPositive(d)||d>100||!Number.isInteger(teeth)||teeth<1||teeth>500||!validPositive(load)||load>10||!validPositive(factor)||factor>3){dbFeedback('Check diameter, integer tooth count, chip load and SFM factor.',true);return}x.d=d;x.teeth=teeth;x.load=load;x.factor=factor;delete x.flute;delete x.useFlute;x.op=$('editOpSelect').value;if(x.op==='mill'){x.feedFactor=number('editToolFeedFactor');x.angle=number('editAngle');x.neckDiameter=dbNum('editNeckDiameter');if(!(x.feedFactor>=.1&&x.feedFactor<=1&&x.angle>0&&x.angle<180&&x.neckDiameter>0)){dbFeedback('Check milling tool geometry and feed multiplier.',true);return;}}else if(x.op==='turn'){x.noseRadius=dbNum('editNoseRadius');x.stickout=dbNum('editStickout');}else{x.pointAngle=number('editPointAngle');x.maxDepthRatio=number('editMaxDepthRatio');} for(const k of ['slot','thin','hsm','groove','thread','ream'])x[k]=Boolean(document.querySelector(`[data-flag="${k}"]`)?.checked);if(x.op!=='mill'){x.slot=x.thin=x.hsm=false;}if(x.op!=='turn'){x.groove=x.thread=false;}if(x.op!=='drill'){x.ream=false;}if(x.groove&&x.thread){dbFeedback('A cutter type cannot be both a grooving tool and a threading tool.',true);return}}
 else if(dbTab==='materials'){captureRanges();x=copy(working);x.name=name.slice(0,140);x.group=$('editGroup').value;x.unitHp=dbNum('editHp');x.note=$('editNote').value.trim().slice(0,1000);if(!validPositive(x.unitHp)||x.unitHp>100){dbFeedback('Enter a positive specific-power constant.',true);return}for(const t of db.tools){let r=x.ranges?.[t.id];if(!r){dbFeedback(`Missing speed ranges for ${t.name}.`,true);return}for(const s of SUBS){let a=r[s];if(!Array.isArray(a)||a.length!==2||!a.every(validPositive)||a[0]>a[1]||a[1]>100000){dbFeedback(`Invalid ${s} range for ${t.name}. Enter positive min ≤ max.`,true);return}}}}
 else if(dbTab==='coatings'){x.groups=[...document.querySelectorAll('.coatGroup:checked')].map(el=>el.value);x.factor=number('editFactor');if(!validPositive(x.factor)||x.factor>3){dbFeedback('Multiplier must be between 0 and 3.',true);return}}
 let pos=db[dbTab].findIndex(x=>x.id===dbId);if(pos<0)return;db[dbTab][pos]=x;working=copy(x);persist();renderDbList();dbFeedback('Saved. Changes now apply to the calculators.');}
function newEntry(){let x;if(dbTab==='machines')x={id:uid(),name:'New machine',category:dbGroup==='all'?'mill':dbGroup,ops:['mill','drill'],rpm:8000,hp:15,maxFeed:300,toolIds:[],secondaryRpm:0,secondaryHp:0,liveRpm:0,liveHp:0,note:''};else if(dbTab==='tools')x={id:uid(),name:'New cutter type',op:dbGroup==='all'?'mill':dbGroup,factor:1,d:.5,teeth:4,load:.004,slot:false,thin:false,hsm:false,note:''};else if(dbTab==='materials'){let original=db.materials[0];x={id:uid(),name:'New material',group:dbGroup==='all'?'Other':dbGroup,unitHp:1,note:'Illustrative ranges; replace with verified tooling data.',ranges:{}};for(const t of db.tools){let base=original?.ranges?.[t.id]||{carbide:[200,400],hss:[50,90]};x.ranges[t.id]=copy(base)}}else x={id:uid(),name:'New coating',factor:1,groups:[],note:''};db[dbTab].push(x);dbId=x.id;persist();renderDbList();renderEditor();}
function duplicateEntry(){let x=item(dbTab,dbId);if(!x)return;if(dbTab==='materials'){openMaterialCopy(x);return;}let n=copy(x);n.id=uid();n.name=x.name+' (copy)';db[dbTab].push(n);dbId=n.id;persist();renderDbList();renderEditor();}
let materialCopyId=null;
function openMaterialCopy(m){materialCopyId=m.id;$('copyMaterialFrom').textContent='From: '+m.name;$('copyMaterialName').value=m.name+' (copy)';$('copyScale').value='1';$('copyError').textContent='';let sel=$('copyMaterialCategory');sel.replaceChildren();for(const g of materialGroups()){let el=document.createElement('option');el.value=g;el.textContent=g;sel.append(el)}const other=document.createElement('option');other.value='__new__';other.textContent='+ New category…';sel.append(other);sel.value=m.group||'Other';$('copyNewCategoryWrap').classList.add('hidden');$('copyNewCategory').value='';$('materialCopyLayer').classList.remove('hidden');$('copyMaterialName').focus();}
function closeMaterialCopy(){materialCopyId=null;$('materialCopyLayer').classList.add('hidden')}
$('copyMaterialCategory').addEventListener('change',()=>$('copyNewCategoryWrap').classList.toggle('hidden',$('copyMaterialCategory').value!=='__new__'));
document.querySelectorAll('[data-close-copy]').forEach(b=>b.addEventListener('click',closeMaterialCopy));
$('materialCopyForm').addEventListener('submit',e=>{e.preventDefault();const src=item('materials',materialCopyId);if(!src)return;const name=$('copyMaterialName').value.trim();const selected=$('copyMaterialCategory').value;const group=(selected==='__new__'?$('copyNewCategory').value:selected).trim();const scale=number('copyScale');
 if(!name||!group||!(scale>0&&scale<=100)||db.materials.length>=500){$('copyError').textContent='Provide a new name, material category, and positive scale up to 100.';return;}
 const n=copy(src);n.id=uid();n.name=name.slice(0,140);n.group=group.slice(0,60);n.rangeSources={};for(const [id,vals] of Object.entries(n.ranges||{})){for(const sub of SUBS){if(!Array.isArray(vals[sub]))continue;vals[sub]=vals[sub].map(v=>Math.max(1,Math.round(Number(v)*scale)));}n.rangeSources[id]={carbide:'custom',hss:'custom'};}
 if(Object.values(n.ranges).some(o=>SUBS.some(sub=>o[sub]?.some(v=>v>100000)))){$('copyError').textContent='Scaled SFM exceeds the supported 100,000 SFM limit.';return;}
 db.materials.push(n);dbId=n.id;dbGroup='all';persist();closeMaterialCopy();renderDb();dbId=n.id;renderDbList();renderEditor();dbFeedback('Material copied. All SFM ranges multiplied by '+scale+' and rounded; multiplier was not saved.');
});
function deleteEntry(){let x=item(dbTab,dbId);if(!x)return;if(db[dbTab].length<=1){dbFeedback('Keep at least one entry in each category.',true);return}if(!confirm(`Delete "${x.name}"? This also removes it from the calculators.`))return;db[dbTab]=db[dbTab].filter(v=>v.id!==dbId);if(dbTab==='tools'){for(const m of db.machines)if(Array.isArray(m.toolIds))m.toolIds=m.toolIds.filter(id=>id!==dbId);for(const mat of db.materials)if(mat.ranges)delete mat.ranges[dbId];}dbId=db[dbTab][0]?.id||null;persist();renderDbList();renderEditor();}
function inferRangesForTool(t){for(const m of db.materials){m.ranges=m.ranges||{};if(!m.ranges[t.id]){let base=m.ranges[Object.keys(m.ranges)[0]]||{carbide:[200,450],hss:[50,90]};m.ranges[t.id]={carbide:base.carbide.map(n=>Math.max(1,Math.round(n*t.factor))),hss:base.hss.map(n=>Math.max(1,Math.round(n*t.factor)))}}}}
function fileDownload(filename,obj){let url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));let link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function safeImportedData(d){if(!validLibrary(d))throw Error('File is not a Machining Desk database.');if(Object.values(d).some(a=>!Array.isArray(a)||a.length>500))throw Error('Database too large.');for(const key of ['machines','tools','materials','coatings']){let ids=new Set();for(const x of d[key]){if(!x||typeof x.id!=='string'||typeof x.name!=='string'||!x.name||ids.has(x.id))throw Error(`Invalid ${key} entries.`);ids.add(x.id)}}if(d.machines.some(x=>!Array.isArray(x.ops)||!validPositive(Number(x.rpm))||!validPositive(Number(x.hp))||!validPositive(Number(x.maxFeed))))throw Error('Invalid machine limits.');if(d.tools.some(x=>!OPS[x.op]||!validPositive(Number(x.d))||!validPositive(Number(x.teeth))||!validPositive(Number(x.load))||!validPositive(Number(x.factor))))throw Error('Invalid cutter types.');if(d.materials.some(x=>!validPositive(Number(x.unitHp))||!x.ranges||typeof x.ranges!=='object'))throw Error('Invalid materials.');if(d.coatings.some(x=>!validPositive(Number(x.factor))))throw Error('Invalid coatings.');return d}
// Drill-chart and thread-calculator code below is intentionally independent from the technology library.
// Standard drill bit diameters (inches): number, letter, fractional, metric.


function gcd(a,b){while(b){let c=a%b;a=b;b=c}return a}
function fractionName(n,denom=64){let whole=Math.floor(n/denom),rem=n%denom;if(!rem)return String(whole)+'"';let g=gcd(rem,denom);return (whole?whole+' ':'')+rem/g+'/'+denom/g+'"'}
const chartDrills=(()=>{let a=[];
 for(let i=1;i<=80;i++)a.push({name:'#'+i,in:NUMBER_SIZES[i-1],type:'number'});
 for(let i=0;i<26;i++)a.push({name:String.fromCharCode(65+i),in:LETTER_SIZES[i],type:'letter'});
 for(let i=1;i<=64;i++)a.push({name:fractionName(i),in:i/64,type:'fraction'});
 for(let i=1;i<=508;i++)a.push({name:numShow(i/20,2)+' mm',in:i/508,type:'metric'});
 return a.sort((x,y)=>x.in-y.in||x.type.localeCompare(y.type));})();
const tapDrills=(()=>{let a=[...chartDrills];for(let i=65;i<=192;i+=2)a.push({name:fractionName(i),in:i/64,type:'fraction'});for(let i=255;i<=800;i+=5)a.push({name:numShow(i/10,1)+' mm',in:i/254,type:'metric'});return a.sort((x,y)=>x.in-y.in)} )();
function renderDrills(){let q=$('drillSearch').value.trim().toLowerCase().replace(/\s+/g,''),cat=$('drillFilter').value;let drills=chartDrills.filter(x=>(cat==='all'||x.type===cat)&&(!q||[x.name.toLowerCase().replace(/\s+/g,''),x.in.toFixed(4),String(+(x.in*25.4).toFixed(2)),x.type].some(s=>s.includes(q))));
 $('drillCount').textContent=`${drills.length} of ${chartDrills.length} drill sizes`;let t=$('drillRows');t.replaceChildren();const fragment=document.createDocumentFragment();for(const d of drills){let row=document.createElement('tr');for(const v of [d.name,({number:'Number',letter:'Letter',fraction:'Fractional',metric:'Metric'})[d.type],d.in.toFixed(4),(d.in*25.4).toFixed(3)]){let td=document.createElement('td');td.textContent=v;row.append(td)}fragment.append(row)}t.append(fragment);}
// Unified thread series; the large-diameter UN entries are constant-pitch
// thread options, not UNF/UNEF. The UNEF presets below follow ASME B1.1.

// ISO 261 metric coarse and fine pitches through M64, plus common DIN 13
// special fine pitches. In the interface, the largest standard fine pitch is
// grouped under Fine, and smaller fine pitches under Extra fine. ISO 261 itself
// does not define a separate extra-fine family.

function threadChoices(){
 let series=$('threadSeries').value,sys=$('threadSystem').value;
 if(series==='custom')return [];
 if(sys==='un'){
  let index=({coarse:2,fine:3,extra:4})[series];
  let choices=UN_DATA.filter(x=>x[index]!=null).map(x=>{
   let label=series==='coarse'?'UNC':series==='extra'&&x[1]<=1.6875?'UNEF':x[1]>1.5?'UN (constant pitch)': 'UNF';
   return {major:x[1],pitch:x[index],name:`${x[0]}-${x[index]} ${label}`};
  });
  if(series==='coarse')choices.unshift({major:.060,pitch:64,name:'#0-64 UNS (special-purpose)'});
  return choices;
 }
 let choices=[];
 for(let x of METRIC_DATA){
  let pitches=series==='coarse'?(x[1]==null?[]:[x[1]]):series==='fine'?x[2].slice(0,1):x[2].slice(1);
  for(const pitch of pitches){
   let extra=series==='extra'?' · finer pitch':'';
   choices.push({major:x[0],pitch,name:`M${x[0]} × ${pitch}${extra}`});
  }
 }
 return choices;
}
let threadsOpened=false;function initThreads(){if(!threadsOpened){threadsOpened=true;rebuildThreadPresets(false);$ ('threadPreset').value=String(threadChoices().findIndex(t=>t.major===.25&&t.pitch===20));loadThreadPreset();}renderThread()}
function rebuildThreadPresets(keep){let choices=threadChoices(),prev=$('threadPreset').value;$('threadPreset').replaceChildren();for(let i=0;i<choices.length;i++){let opt=document.createElement('option');opt.value=String(i);opt.textContent=choices[i].name;$('threadPreset').append(opt)}if(keep&&prev&&Number(prev)<choices.length)$('threadPreset').value=prev;
 $('threadPresetBox').classList.toggle('hidden',$('threadSeries').value==='custom');$('threadMajorUnit').textContent=$('threadSystem').value==='un'?'in':'mm';$('threadPitchLabel').textContent=$('threadSystem').value==='un'?'Threads per inch (TPI)':'Thread pitch (mm/rev)';
 if($('threadSeries').value==='custom'){ $('threadMajor').readOnly=false;$('threadPitch').readOnly=false;if(!safeNum($('threadMajor').value))$('threadMajor').value=$('threadSystem').value==='un'?'.25':'10';if(!safeNum($('threadPitch').value))$('threadPitch').value=$('threadSystem').value==='un'?'20':'1.5';}
 else{ $('threadMajor').readOnly=true;$('threadPitch').readOnly=true;if(choices.length)loadThreadPreset();}}
function loadThreadPreset(){let x=threadChoices()[Number($('threadPreset').value)];if(!x)return;$('threadMajor').value=x.major;$('threadPitch').value=x.pitch;renderThread()}
function nearestDrill(d,inSystem){let entries=tapDrills.filter(x=>inSystem?(x.type!=='metric'):x.type==='metric');return entries.reduce((best,x)=>!best||Math.abs(x.in-d)<Math.abs(best.in-d)?x:best,null)}
function threadValue(label,val){return `<div class="outmetric"><small>${esc(label)}</small><strong>${esc(val)}</strong></div>`}
function lengthPair(v){return `${fmt(isMetric()?v*25.4:v,isMetric()?3:4)} ${units}`}
function renderThread(){let side=$('threadSide').value,sys=$('threadSystem').value,major=safeNum($('threadMajor').value),pitchVal=safeNum($('threadPitch').value),percent=safeNum($('threadPercent').value);let out=$('threadOutput');if($('enableThreeWire').checked&&side==='external')window.MachiningDeskThreeWire?.render();$('tapControls').classList.toggle('hidden',side==='external');$('threadAnswerTitle').textContent=side==='external'?'External turning diameters':'Tap drill sizing';
 let valid=major>0&&pitchVal>0&&Number.isFinite(major)&&Number.isFinite(pitchVal)&&major<=(sys==='un'?3:76.2)&&pitchVal<10000;
 if(side==='internal'&&(!Number.isFinite(percent)||percent<10||percent>100))valid=false;
 let majorIn=sys==='un'?major:major/25.4, pitchIn=sys==='un'?1/pitchVal:pitchVal/25.4;
 if(!valid||!Number.isFinite(pitchIn)||pitchIn<=0||pitchIn*1.226869>=majorIn){out.innerHTML='<div class="info err">Enter a valid major diameter and pitch. Pitch must be small enough for a positive thread minor diameter. Target thread percentage must be 10–100%.</div>';return}
 let pitchDia=majorIn-.6495190528*pitchIn,externalMinor=majorIn-1.226869*pitchIn,internalMinor=majorIn-1.082532*pitchIn;
 let lead=sys==='un'?`${fmt(pitchVal,4)} TPI`:`${fmt(pitchVal,3)} mm`;
 if(side==='external'){
 out.innerHTML=`<div class="threadresult"><small>Theoretical basic external minor diameter</small><strong>${lengthPair(externalMinor)}</strong><small>For a single-start 60° thread; tolerance class and tool nose radius not included.</small></div><div class="outputgrid">${threadValue('Nominal major diameter',lengthPair(majorIn))}${threadValue('Basic pitch diameter',lengthPair(pitchDia))}${threadValue('Radial thread depth',lengthPair((majorIn-externalMinor)/2))}${threadValue('Pitch',sys==='un'?`${fmt(1/pitchVal,5)} in`:`${fmt(pitchVal,4)} mm`)}</div><p class="sourcehint">These are <b>basic theoretical</b> diameters. Final major/minor limits depend on class of fit and allowances; check the drawing and thread standard before turning to size.</p>`;return;}
 let type=$('threadTapType').value;
 // Haas 2024 machining reference: inch cut .01299 × % / TPI; form .0068 × % / TPI.
 // Metric cut % × pitch / 76.98; form % × pitch / 147.06.
 let hole=sys==='un'?(major-(type==='form'?.0068:.01299)*percent/pitchVal):(major-percent*pitchVal/(type==='form'?147.06:76.98));hole= sys==='un'?hole:hole/25.4;
 if(hole<=0||!Number.isFinite(hole)){out.innerHTML='<div class="info err">Calculated tap drill diameter is not positive. Adjust thread engagement or pitch.</div>';return;}
 let closestUS=nearestDrill(hole,true),closestMM=nearestDrill(hole,false),selected=nearestDrill(hole,!isMetric());let errPct=x=>`${x.in>=hole?'+':'−'}${fmt(Math.abs(x.in-hole)*(isMetric()?25.4:1),isMetric()?3:4)} ${units}`;
 out.innerHTML=`<div class="threadresult"><small>${type==='form'?'Form / roll':'Cutting'} tap · ${percent}% target · Calculated drill diameter</small><strong>${lengthPair(hole)}</strong><small>${fmt(hole,5)} in / ${fmt(hole*25.4,3)} mm</small></div><div class="outputgrid">${threadValue('Closest '+(isMetric()?'metric':'inch')+' drill',selected.name)}${threadValue('Difference from target',errPct(selected))}${threadValue('Nearest imperial drill',closestUS.name+' · '+closestUS.in.toFixed(4)+' in')}${threadValue('Nearest metric drill',closestMM.name+' · '+fmt(closestMM.in*25.4,2)+' mm')}${threadValue('Basic internal minor Ø',lengthPair(internalMinor))}${threadValue('Basic pitch Ø',lengthPair(pitchDia))}</div><p class="sourcehint">${type==='form'?'Form taps require ductile material and a tap-specific predrill. A drill sized for a cutting tap is too small.':'Cutting tap drill is an estimated target; the chosen drill changes actual thread engagement.'} Larger nominal drill sizes shown are reference series, not a guarantee of stock availability.</p>`;
}
// UI wiring for the reference utilities
$('unitImperial').addEventListener('click',()=>setUnits('in'));$('unitMetric').addEventListener('click',()=>setUnits('mm'));
$('drillSearch').addEventListener('input',renderDrills);$('drillFilter').addEventListener('change',renderDrills);

$('threadSystem').addEventListener('change',()=>{rebuildThreadPresets(false);let wanted=$('threadSystem').value==='un'?threadChoices().findIndex(t=>t.major===.25):threadChoices().findIndex(t=>t.major===10);if(wanted>=0){$('threadPreset').value=String(wanted);loadThreadPreset()}renderThread()});
$('threadSeries').addEventListener('change',()=>{rebuildThreadPresets(false);renderThread()});
$('threadPreset').addEventListener('change',loadThreadPreset);
for(const id of ['threadMajor','threadPitch','threadPercent'])$(id).addEventListener('input',renderThread);
$('threadTapType').addEventListener('change',()=>{$('threadPercent').value=$('threadTapType').value==='form'?'65':'75';renderThread()});

// Listeners
 document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
 $('expandResults').addEventListener('click',()=>{let open=$('expandedResults').classList.toggle('hidden');$('expandResults').setAttribute('aria-expanded',String(!open));updateExpandTitle()});
 $('calcMachine').addEventListener('change',machineChanged);$('calcSpindle').addEventListener('change',calculate);
 $('calcTool').addEventListener('change',()=>{setToolDefaults();updateToolFields();recommendSpeed();calculate()});
 for(const id of ['calcSubstrate','calcCoating','calcMaterial'])$(id).addEventListener('change',()=>{if(id==='calcMaterial')updateCoatingOptions();recommendFeed();recommendSpeed();calculate()});
 for(const id of ['calcDiameter','calcTeeth','calcSpeed','calcLoad','calcAdoc','calcHoleDepth','calcPriorHole','calcGrooveWidth','calcClamp'])$(id).addEventListener('input',()=>{if(id==='calcDiameter'&&$('calcSlot').checked&&item('tools',$('calcTool').value)?.id!=='saw')setCalc('calcRdoc',getCalc('calcDiameter'));if(id==='calcDiameter')pctSetRdoc();if(id==='calcDiameter')recommendFeed();calculate()});
 for(const id of ['calcRdoc','calcSlot','calcThin','calcHsm'])$(id).addEventListener('input',()=>{updateToolFields();if(id==='calcHsm'||id==='calcSlot')recommendSpeed();calculate()});$('calcRdocPct').addEventListener('input',()=>{let raw=$('calcRdocPct').value;pctApplyRdoc();updateToolFields();$('calcRdocPct').value=raw;calculate()});
 // Text-type numeric inputs support the native selection API. A double-click selects the entire value on the FIRST double-click, including unfocused fields.
 $('calculatorPage').addEventListener('dblclick',event=>{const input=event.target.closest('input[id^="calc"]');if(input&&input.type==='text'&&!input.disabled&&!input.readOnly){input.focus();input.select();event.preventDefault();}});
 for(const id of ['rpmOverride','feedOverride'])$(id).addEventListener('input',()=>{$(id+'Display').value=$(id).value+'%';calculate()});
 $('saveSetup').addEventListener('click',saveSetup);
 document.querySelectorAll('[data-db]').forEach(b=>b.addEventListener('click',()=>{dbTab=b.dataset.db;dbId=null;renderDb()}));
 $('dbSearch').addEventListener('input',renderDbList);
 $('dbForm').addEventListener('submit',e=>{let oldOp=item('tools',dbId)?.op;let oldId=dbId;saveEditor(e);if(dbTab==='tools'&&item('tools',oldId)&&$('dbFlash').classList.contains('success')){inferRangesForTool(item('tools',oldId));persist();}});
 $('addEntry').addEventListener('click',()=>{newEntry();if(dbTab==='tools'){inferRangesForTool(item('tools',dbId));persist()}});
 $('duplicateEntry').addEventListener('click',()=>{duplicateEntry();if(dbTab==='tools'){inferRangesForTool(item('tools',dbId));persist()}});
 $('deleteEntry').addEventListener('click',deleteEntry);
 $('exportData').addEventListener('click',()=>fileDownload('machining-desk-database.json',{...db,savedSetups:saves}));
 $('importData').addEventListener('click',()=>$('importFile').click());
 $('importFile').addEventListener('change',async e=>{let file=e.target.files?.[0];if(!file)return;try{let obj=safeImportedData(JSON.parse(await file.text()));if(!confirm('Import this database and replace your current data? Export a backup first if needed.'))return;db={machines:obj.machines,tools:obj.tools,materials:obj.materials,coatings:obj.coatings};if(Array.isArray(obj.savedSetups)){saves=obj.savedSetups.filter(s=>s&&OPS[s.op]&&s.values&&typeof s.name==='string').slice(0,75);persistSaves()}persist();dbId=null;renderDb();alert('Database imported.')}catch(err){alert('Import failed: '+err.message)}finally{e.target.value=''}});
 $('resetDatabase').addEventListener('click',()=>{if(!confirm('Restore all default database entries? This replaces your current database. Saved cutting setups are not deleted. Export a backup first if needed.'))return;db=freshData();persist();dbId=null;renderDb()});
 // Optionally migrate only user-created machines/materials from the earlier standalone app. Do not alter its storage.
 try{if(!localStorage.getItem(KEY)){let previous=JSON.parse(localStorage.getItem('machiningDeskData')||'null');if(previous){for(const m of previous.machines||[]){if(!m||!m.id||!m.name)continue;db.machines.push({id:uid(),name:m.name,ops:m.kind==='lathe'?['turn','drill']:['mill','drill'],rpm:Number(m.rpm)||8000,hp:Number(m.hp)||15,maxFeed:300,toolIds:[],note:'Imported from the earlier Machining Desk app; verify spindle and feed limits.'})}for(const mm of previous.materials||[]){if(!mm?.name)continue;const cl=Math.max(1,Number(mm.sfmCarbide)||250),hs=Math.max(1,Number(mm.sfmHss)||80);db.materials.push({id:uid(),name:mm.name,group:'Other',unitHp:Number(mm.unitHp)||1,note:'Imported older material. Ranges are generated around the former single-speed values.',ranges:makeRanges(cl*.8,cl*1.2,hs*.8,hs*1.2,db.tools)})}persist()}}}catch{}
 navigate('home');renderSaves();try{if(localStorage.getItem('machiningDeskUnits')==='mm')setUnits('mm')}catch{}
})();
