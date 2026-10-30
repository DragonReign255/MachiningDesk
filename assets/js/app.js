/* Machining Desk — calculators, navigation, reference charts, and local database. */
(()=>{
'use strict';
const KEY='machiningDeskTechnology';
const $=id=>document.getElementById(id);
const copy=x=>JSON.parse(JSON.stringify(x));
const fmt=(x,d=1)=>Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
const safeNum=(v,id='')=>v===''||v===null?NaN:(window.MachiningDeskInputs?.parse(v,id)??Number(v));
const uid=()=>`item_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
const OPS={mill:'Milling',turn:'Turning',drill:'Drilling'};
const SUBS=window.MachiningDeskDefaults.SUB_IDS;
const SUBSTRATES=window.MachiningDeskDefaults.SUBSTRATES;
const FACTORY_COAT_IDS=new Set(['uncoated','tin','ticn','tialn','altin','alcrn','tib2','zrn','dlc']);
const COMPATIBLE_COATINGS={carbide:null,hss:['uncoated','tin','ticn','tialn','altin'],hssco:['uncoated','tin','ticn','tialn','altin'],cermet:['uncoated','tin','ticn','tialn'],ceramic:['uncoated'],cbn:['uncoated'],pcd:['uncoated']};
const ensureSubstrateRanges=window.MachiningDeskDefaults.ensureSubstrateRanges;
const {freshData,makeRanges,oldFactoryRange}=window.MachiningDeskDefaults;
const maker=window.MachiningDeskManufacturer;
const {NUMBER_SIZES,LETTER_SIZES,UN_DATA,METRIC_DATA}=window.MachiningDeskReferences;
function validLibrary(x){return x&&typeof x==='object'&&['machines','tools','materials','coatings'].every(k=>Array.isArray(x[k]))}
let db=freshData();try{let old=JSON.parse(localStorage.getItem(KEY)||'null');if(validLibrary(old))db=old}catch{}
// v1.9.1: add the new factory AlSi10Mg to existing browser databases without
// resetting any user-edited machines, cutters, materials, or coating records.
// Skip if the user already has a material named AlSi10Mg (custom ID).
{
 const preset=freshData().materials.find(m=>m.id==='mat_22');
 if(preset&&!db.materials.some(m=>m.id==='mat_22'||/\bAlSi10Mg\b/i.test(m.name||''))){
  db.materials.push(copy(preset));
  try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}
 }
}
// v1.11.5: merge additional factory engineering grades into existing local libraries without touching edits.
if(window.MachiningDeskExtendedMaterials?.merge(db)){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
// Add requested machine presets without discarding locally edited machines or materials.
{const defaults=freshData().machines;db.machines=db.machines.filter(m=>m.id!=='vf4');for(const preset of defaults)if(!db.machines.some(m=>m.id===preset.id))db.machines.push(preset);let u=db.machines.find(m=>m.id==='umc750ss');if(u&&u.rpm===15000&&String(u.note).includes('Illustrative')){u.rpm=12000;u.maxFeed=833;u.note='Updated to standard Haas-listed 12000 RPM configuration; verify options.';}for(const t of freshData().tools){if(!db.tools.some(old=>old.id===t.id)){db.tools.push(t);for(const mat of db.materials){mat.ranges=mat.ranges||{};const baseline=mat.ranges[t.op==='mill'?'chamfer':'drill_ream']||{carbide:[120,250],hss:[30,65]};mat.ranges[t.id]={carbide:baseline.carbide.map(v=>Math.max(1,Math.round(v*t.factor))),hss:baseline.hss.map(v=>Math.max(1,Math.round(v*t.factor)))}}}}let st=db.machines.find(m=>m.id==='st20y');if(st){st.liveRpm=st.liveRpm||4000;st.liveHp=st.liveHp||12;st.secondaryRpm=st.secondaryRpm||6000;st.secondaryHp=st.secondaryHp||8;st.spindleOptionsNote='A2-5 finishing sub-spindle: 8 hp user-provided provisional rating. 12-station BMT65 live tooling: Haas lists 12 hp/4,000 RPM. Confirm installed options.';}}
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
const standardGroups=['Aluminum','Carbon steel','Alloy steel','Stainless steel','Tool steel','Cast iron','Titanium','Copper alloy','Nickel alloy','Magnesium','Cobalt alloy','Plastic','Other'];
const coatingSuggestions={tib2:['Aluminum'],uncoated:['Aluminum','Copper alloy','Plastic','Titanium','Cast iron'],tin:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Cast iron','Titanium'],ticn:['Carbon steel','Alloy steel','Tool steel','Cast iron','Stainless steel'],tialn:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],altin:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],alcrn:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],zrn:['Aluminum','Copper alloy'],dlc:['Aluminum','Copper alloy','Plastic']};
for(const c of freshData().coatings)if(!db.coatings.some(x=>x.id===c.id))db.coatings.push(copy(c));
for(const m of db.machines)if(m.id==='manuallathe'&&m.rpm===2000)m.rpm=1500;
for(const m of db.machines)if(m.id==='vf4ss'&&m.name==='Haas VF-4SS · example')m.name='Haas VF-4SS';
for(const m of db.machines)if(m.codeList===undefined)m.codeList=/^Haas\b/i.test(m.name)?(/\bUMC\b/i.test(m.name)?'umc':(/\bST-|\bTL-/i.test(m.name)?'st':'vf')):'none';
for(const c of db.coatings)if(!Array.isArray(c.groups))c.groups=coatingSuggestions[c.id]?.slice()||[];
// New workpiece families need sensible coating families. Add only on first migration;
// any later user changes are retained. Tool/substrate maker advice still supersedes these flags.
try{if(!localStorage.getItem('md-coating-family-1115')){
 const newGroups={uncoated:['Magnesium'],tib2:['Magnesium'],zrn:['Magnesium'],tialn:['Nickel alloy','Cobalt alloy'],altin:['Nickel alloy','Cobalt alloy'],alcrn:['Nickel alloy','Cobalt alloy']};
 for(const coat of db.coatings){const add=newGroups[coat.id]||[];coat.groups=[...new Set([...(coat.groups||[]),...add])];}
 localStorage.setItem('md-coating-family-1115','done');
}}catch{}
// v1.11.0: preserve custom percentages while upgrading unchanged legacy manual presets.
for(const m of db.machines){
 if(m.manual){if(m.speedFactor==null||Math.abs(m.speedFactor-.25)<1e-8)m.speedFactor=.8;if(m.feedFactor==null||Math.abs(m.feedFactor-.22)<1e-8)m.feedFactor=.8;}
 else{if(m.speedFactor==null)m.speedFactor=1;if(m.feedFactor==null)m.feedFactor=1;}
}
ensureSubstrateRanges(db);
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
let latestCutSnapshot=null;
let saves=[];try{let v=JSON.parse(localStorage.getItem('machiningDeskSetups')||'[]');if(Array.isArray(v))saves=v.slice(0,75).map(s=>{if(s.values?.calcTool==='drill_carbide')s.values.calcTool='drill_twist';if(['drill_ream_hss','drill_ream_carbide'].includes(s.values?.calcTool))s.values.calcTool='drill_ream';return s})}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch{alert('Could not save database: storage is unavailable or full. Export a backup.');return false}}
function persistSaves(){try{localStorage.setItem('machiningDeskSetups',JSON.stringify(saves))}catch{alert('Saved setups could not be stored.')}}
function item(k,id){return db[k].find(x=>x.id===id)}
function setOptions(el,things,previous,group){el.replaceChildren();let groups={};for(const x of things){let parent=el;if(group){let key=group(x);if(!groups[key]){let o=document.createElement('optgroup');o.label=key;groups[key]=o;el.append(o)}parent=groups[key]}let op=document.createElement('option');op.value=x.id;op.textContent=x.name;parent.append(op)}if(previous&&things.some(x=>x.id===previous))el.value=previous}
function number(id){return safeNum($(id).value,id)}
function validPositive(n){return Number.isFinite(n)&&n>0}
let units='in';
const UNIT_PREF_KEY='machiningDeskUnitPreferences1111';
const UNIT_DEFAULT={length:'in',force:'lbf',pressure:'psi',torque:'lbft',power:'hp'};
let unitPrefs={...UNIT_DEFAULT};try{let stored=JSON.parse(localStorage.getItem(UNIT_PREF_KEY)||'null');if(stored&&typeof stored==='object')for(const k of Object.keys(UNIT_DEFAULT))if(typeof stored[k]==='string')unitPrefs[k]=stored[k];}catch{}
const getUnitPrefs=()=>({...unitPrefs,length:units});
function unitNumber(n,type){switch(type){case 'force':return unitPrefs.force==='N'?n*4.4482216152605:n;case 'torque':return unitPrefs.torque==='Nm'?n*1.35581794833:n;case 'power':return unitPrefs.power==='kW'?n*.745699872:n;case 'pressure':return unitPrefs.pressure==='MPa'?n*.006894757293:n;default:return n;}}
function unitSymbol(type){return {force:unitPrefs.force==='N'?'N':'lbf',torque:unitPrefs.torque==='Nm'?'N·m':'lbf·ft',power:unitPrefs.power==='kW'?'kW':'hp',pressure:unitPrefs.pressure==='MPa'?'MPa':'psi'}[type]||'';}

const LEN_IDS=new Set(['calcPeck','calcDiameter','calcLoad','calcRdoc','calcAdoc','calcHoleDepth','calcPriorHole','calcGrooveWidth','calcStickout','calcBarDiameter','calcNoseRadius','cskPilot','cskCutDiameter','cskDepth']);
const convertFromBase=(id,v)=>units==='mm'?(LEN_IDS.has(id)?v*25.4:id==='calcSpeed'?v*.3048:v):v;
const convertToBase=(id,v)=>units==='mm'?(LEN_IDS.has(id)?v/25.4:id==='calcSpeed'?v/.3048:v):v;
function numShow(v,places=5){return Number.isFinite(v)?String(+v.toFixed(places)):''}
function setCalc(id,inchesOrSfm){$(id).value=numShow(convertFromBase(id,inchesOrSfm),units==='mm'?5:6)}
function getCalc(id){return convertToBase(id,safeNum($(id).value,id))}
function isMetric(){return units==='mm'}
function prettyLen(v,dec=4){return fmt(isMetric()?v*25.4:v,isMetric()?Math.max(2,dec-1):dec)}
function pctSetRdoc(){const d=getCalc('calcDiameter'),r=getCalc('calcRdoc');$('calcRdocPct').value=d>0&&Number.isFinite(r)?numShow(100*r/d,2):'';}
function pctApplyRdoc(){const d=getCalc('calcDiameter'),pct=safeNum($('calcRdocPct').value);if(d>0&&Number.isFinite(pct))setCalc('calcRdoc',d*pct/100);}
function setUnits(target){if(target===units)return;const old=units;let vals={};for(const id of [...LEN_IDS,'calcSpeed']){let x=safeNum($(id).value);if(Number.isFinite(x))vals[id]=old==='mm'?(LEN_IDS.has(id)?x/25.4:x/.3048):x;}
 units=target;try{localStorage.setItem('machiningDeskUnits',units)}catch{};for(const [id,v] of Object.entries(vals))setCalc(id,v);
 $('unitLength').value=units;document.querySelectorAll('.ulen').forEach(e=>e.textContent=units);
 $('rdocUnit').textContent=units;$('adocUnit').textContent=units;document.querySelectorAll('.wireUnit').forEach(el=>el.textContent=$('threadSystem').value==='un'?'in':'mm');$('resultSpeedLabel').textContent=isMetric()?'m/min':'SFM';$('resultFeedLabel').textContent=isMetric()?'mm/min':'IPM';$('resultPowerLabel').textContent='Power · '+unitSymbol('power');$('resultChipLabel').textContent=op==='mill'?(isMetric()?'mm/tooth':'IPT'):(isMetric()?'mm/rev':'IPR');$('mrrLabel').textContent=isMetric()?'Material removal · cm³/min':'Material removal · in³/min';$('iprLabel').textContent=isMetric()?'Feed / revolution · mm':'Feed / revolution · IPR';$('speedLabel').textContent=isMetric()?'Cutting speed (m/min)':'Cutting speed (SFM)';
 if(OPS[route]){updateToolFields();calculate()};if(route==='db')convertDbEditor(old,target);if(route==='drillchart'){renderDrills();window.MachiningDeskCharts?.render();}if(route==='threads')renderThread();window.dispatchEvent(new CustomEvent('machiningdesk:units',{detail:{previous:old,units:target}}));}
let dbGroup='all';let route='home',op='mill',drafts={},dbTab='machines',dbId=null,rangeTab='mill',rangeSubstrate='carbide',working=null;
let peckCustom=false;
let nonSlotRdoc=NaN; // Absolute radial engagement, kept separately from the 100% slotting override.
const MD_DRAFT_KEY='machiningDeskLastMachining170',MD_MAT_KEY='machiningDeskSharedMaterial170';
let sharedMaterial='';try{const p=JSON.parse(localStorage.getItem(MD_DRAFT_KEY)||'{}');if(p&&typeof p==='object')drafts=p;sharedMaterial=localStorage.getItem(MD_MAT_KEY)||'';}catch{}
function rememberMachining(){if(!OPS[route])return;drafts[route]=snapshotCalc();if($('calcMaterial').value){sharedMaterial=$('calcMaterial').value;for(const saved of Object.values(drafts))if(saved)saved.calcMaterial=sharedMaterial;}try{localStorage.setItem(MD_DRAFT_KEY,JSON.stringify(drafts));if(sharedMaterial)localStorage.setItem(MD_MAT_KEY,sharedMaterial);}catch{}}

function snapshotCalc(){let x={};for(const id of ['calcMachine','calcSpindle','calcTool','calcPassMode','calcSubstrate','calcCoating','calcMaterial','calcPeck','calcDiameter','calcTeeth','calcSpeed','calcLoad','calcRdoc','calcAdoc','calcHoleDepth','calcPriorHole','calcGrooveWidth','calcStickout','calcBarDiameter','calcBarMaterial','calcBarInsertMaterial','calcNoseRadius','cskAngle','cskPilot','cskCutDiameter','cskDepth','rpmOverride','feedOverride'])x[id]=LEN_IDS.has(id)||id==='calcSpeed'?String(getCalc(id)):$(id).value;for(const id of ['calcSlot','calcThin','calcHsm','calcClamp'])x[id]=$(id).checked;if(item('tools',$('calcTool').value)?.tap)x.threadSignature=JSON.stringify(threadConfig());x.nonSlotRdoc=Number.isFinite(nonSlotRdoc)?nonSlotRdoc:undefined;x.peckCustom=peckCustom;return x}
function restoreCalc(s){if(!s)return;peckCustom=Boolean(s.peckCustom);if(Number.isFinite(Number(s.nonSlotRdoc))&&Number(s.nonSlotRdoc)>0)nonSlotRdoc=Number(s.nonSlotRdoc);for(const [id,v] of Object.entries(s))if($(id)){if($(id).type==='checkbox')$(id).checked=Boolean(v);else if($(id).tagName==='SELECT'){if([...$(id).options].some(o=>o.value===v))$(id).value=v}else if(LEN_IDS.has(id)||id==='calcSpeed')setCalc(id,Number(v));else $(id).value=v}}
function navigate(where){
 if(where==='threewire')where='threads';
 if(where!=='home'&&where!=='db'&&where!=='drillchart'&&where!=='threads'&&where!=='codes'&&where!=='calculators'&&!OPS[where])return;
 if(OPS[route])rememberMachining();route=where;
 $('homePage').classList.toggle('hidden',where!=='home');$('calculatorPage').classList.toggle('hidden',!OPS[where]);$('databasePage').classList.toggle('hidden',where!=='db');$('drillChartPage').classList.toggle('hidden',where!=='drillchart');$('threadsPage').classList.toggle('hidden',where!=='threads');$('codesPage').classList.toggle('hidden',where!=='codes');$('calculatorsPage').classList.toggle('hidden',where!=='calculators');
 document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('current',b.classList.contains('navbtn')&&b.dataset.route===where));
 if(OPS[where]){op=where;$('operationTitle').textContent=OPS[where];rebuildCalc(drafts[where]);if(where==='drill'&&item('tools',$('calcTool').value)?.tap&&drafts[where]?.threadSignature!==JSON.stringify(threadConfig())){syncedThreadTool();recommendSpeed();calculate();}if(sharedMaterial&&[...$('calcMaterial').options].some(o=>o.value===sharedMaterial)&&$('calcMaterial').value!==sharedMaterial){chooseMaterialSelector(sharedMaterial);updateCoatingOptions();recommendFeed();recommendSpeed();calculate();}renderSaves();}
 if(where==='db')renderDb();if(where==='drillchart'){window.MachiningDeskCharts?.render();renderDrills();}if(where==='calculators')window.MachiningDeskCalculators?.render();if(where==='threads'){initThreads();showThreadMode($('threadSide').value);}if(where==='codes')window.MachiningDeskHaasCodes?.render(db.machines);window.scrollTo({top:0,behavior:'instant'});
}
function showThreadMode(mode){
 const external=mode==='external';$('threadSide').value=external?'external':'internal';
 $('showInternalThreads').classList.toggle('active',!external);$('showExternalThreads').classList.toggle('active',external);
 $('showInternalThreads').setAttribute('aria-pressed',String(!external));$('showExternalThreads').setAttribute('aria-pressed',String(external));
 $('threeWireSection').classList.toggle('hidden',!external);$('threeWireToggleLocation').classList.toggle('hidden',!external);
 if(!external){$('enableThreeWire').checked=false;$('threeWirePanel').classList.add('hidden');}
 else if($('enableThreeWire').checked)window.MachiningDeskThreeWire?.init();
 renderThread();persistThreads();
}
$('showInternalThreads').addEventListener('click',()=>showThreadMode('internal'));
$('showExternalThreads').addEventListener('click',()=>showThreadMode('external'));
$('enableThreeWire').addEventListener('change',()=>{
 let active=$('enableThreeWire').checked;$('threeWirePanel').classList.toggle('hidden',!active);
 if(active){$('wireAngle').value=['bsw','bsp'].includes($('threadSystem').value)?'55':$('threadSystem').value==='acme'?'29':'60';window.MachiningDeskThreeWire?.init();}persistThreads();
});
let chartTab='drills';
function showChart(tab){chartTab=tab;let drill=chartTab==='drills';
 $('drillChartPanel').classList.toggle('hidden',!drill);$('capHeadPanel').classList.toggle('hidden',tab!=='screws');
 $('showDrillChart').classList.toggle('active',drill);$('showCapChart').classList.toggle('active',!drill);
 $('showDrillChart').setAttribute('aria-pressed',String(drill));$('showCapChart').setAttribute('aria-pressed',String(!drill));
 if(!drill&&tab==='screws')window.MachiningDeskHardware?.render();
}
$('showDrillChart').addEventListener('click',()=>showChart('drills'));
$('showCapChart').addEventListener('click',()=>showChart('screws'));
function toolCompatible(m,t){return m&&t&&Array.isArray(m.ops)&&m.ops.includes(t.op)&&(!Array.isArray(m.toolIds)||!m.toolIds.length||m.toolIds.includes(t.id))}
function spindleCaps(m,s){if(s==='secondary')return {rpm:Number(m?.secondaryRpm)||0,hp:Number(m?.secondaryHp)||0,desc:'Secondary spindle'};if(s==='live')return {rpm:Number(m?.liveRpm)||0,hp:Number(m?.liveHp)||0,desc:'Live tooling'};return {rpm:Number(m?.rpm)||0,hp:Number(m?.hp)||0,desc:'Main spindle'};}
function refreshSpindle(saved){let m=item('machines',$('calcMachine').value);let available=[{id:'main',name:'Main spindle'}];if(m?.secondaryRpm>0&&op!=='mill')available.push({id:'secondary',name:'Secondary spindle'});if(m?.liveRpm>0&&op!=='turn')available.push({id:'live',name:'Live-tool spindle'});
 if(op==='mill'&&m?.ops.includes('turn'))available=available.filter(x=>x.id==='live');
 let preferred=saved&&available.some(x=>x.id===saved)?saved:op==='mill'&&m?.ops.includes('turn')?'live':'main';setOptions($('calcSpindle'),available,preferred);$('spindleBox').classList.toggle('hidden',available.length<=1&&!m?.ops?.includes('turn'));}
function chooseMaterialSelector(selected){
 const select=$('calcMaterial'),family=$('calcMaterialFamily');
 if(!family){setOptions(select,db.materials,selected,m=>m.group||'Other');return;}
 const current=db.materials.find(m=>m.id===selected)||db.materials[0];
 const families=materialGroups().filter(g=>db.materials.some(m=>m.group===g));
 family.replaceChildren();for(const g of families){const option=document.createElement('option');option.value=g;option.textContent=g;family.append(option);}
 family.value=current?.group||families[0]||'';
 setOptions(select,db.materials.filter(m=>m.group===family.value),current?.id);
}
function rebuildCalc(draft){if(!draft){$('rpmOverride').value='100';$('feedOverride').value='100';$('calcPassMode').value='general';peckCustom=false;}else {for(const key of ['rpmOverride','feedOverride'])$(key).value=draft[key]??'100';}for(const key of ['rpmOverride','feedOverride'])$(key+'Display').value=$(key).value+'%';let old=draft||snapshotCalc();setOptions($('calcMachine'),db.machines.filter(m=>Array.isArray(m.ops)&&m.ops.includes(op)),old.calcMachine);let m=item('machines',$('calcMachine').value);setOptions($('calcTool'),db.tools.filter(t=>t.op===op&&toolCompatible(m,t)),old.calcTool);setOptions($('calcCoating'),db.coatings,old.calcCoating);chooseMaterialSelector(old.calcMaterial);updateCoatingOptions();
 refreshSpindle(old.calcSpindle);if(draft){restoreCalc(draft);updateCoatingOptions()}else{setToolDefaults();}
 if(!draft||!Number.isFinite(nonSlotRdoc))nonSlotRdoc=getCalc('calcRdoc');updateToolFields();refreshPeck(!draft);substrateInfo();if(!draft)recommendSpeed();lastDiameterValue=getCalc('calcDiameter');calculate();}
function updateCoatingOptions(){
 const material=item('materials',$('calcMaterial').value);
 const chosen=$('calcCoating').value;
 const allowed=COMPATIBLE_COATINGS[$('calcSubstrate').value];const coatings=db.coatings.filter(c=>!allowed||allowed.includes(c.id)||!FACTORY_COAT_IDS.has(c.id)).sort((a,b)=>Number(b.id==='uncoated')-Number(a.id==='uncoated')||Number(isCoatingRecommended(b,material))-Number(isCoatingRecommended(a,material)));
 setOptions($('calcCoating'),coatings,chosen);
 for(const opt of $('calcCoating').options){let coat=item('coatings',opt.value);opt.textContent=(coat.id==='uncoated'?'Default · ':(isCoatingRecommended(coat,material)?'✓ ':''))+coat.name;}
}
function machineChanged(){let previous=$('calcTool').value;let m=item('machines',$('calcMachine').value);setOptions($('calcTool'),db.tools.filter(t=>t.op===op&&toolCompatible(m,t)),previous);setToolDefaults();refreshSpindle($('calcSpindle').value);updateToolFields();recommendSpeed();calculate()}
function threadConfig(){let state={};try{state=JSON.parse(localStorage.getItem(THREAD_SAVE)||'{}')||{};}catch{}const sys=state.threadSystem||$('threadSystem').value||'un';let major=Number(state.threadMajor||$('threadMajor').value),pitch=Number(state.threadPitch||$('threadPitch').value);if(!(major>0&&pitch>0)){major=.25;pitch=20;}const inch=INCH_THREADS.has(sys);return {system:sys,major:inch?major:major/25.4,pitch:inch?1/pitch:pitch/25.4,side:state.threadSide||$('threadSide').value||'internal',type:state.threadTapType||$('threadTapType').value||'cut',percent:Number(state.threadPercent)||75};}
function syncedThreadTool(){const tool=item('tools',$('calcTool').value);if(!(tool?.tap||tool?.threadMill))return false;const v=threadConfig();if(tool.tap){setCalc('calcDiameter',v.major);setCalc('calcLoad',v.pitch);}return true;}
function setToolDefaults(){let t=item('tools',$('calcTool').value),m=item('machines',$('calcMachine').value);if(!t)return;if(t.preferredSubstrate&&SUBS.includes(t.preferredSubstrate))$('calcSubstrate').value=t.preferredSubstrate;updateCoatingOptions();if(t.preferredCoating&&[...$('calcCoating').options].some(o=>o.value===t.preferredCoating))$('calcCoating').value=t.preferredCoating;setCalc('calcDiameter',t.d||.5);$('calcTeeth').value=t.teeth||4;setCalc('calcLoad',t.load||.004);$('calcSlot').checked=false;$('calcThin').checked=false;$('calcHsm').checked=false;
 let r=op==='turn'?.06:op==='mill'?(t.id==='saw'?.0625:Math.max(.001,(t.d||.5)*.35)):0;setCalc('calcRdoc',r);nonSlotRdoc=r;
 setCalc('calcAdoc',op==='mill'?(t.id==='saw'?.75:Math.min(.5,Math.max(.001,(t.d||.5)*.5))):.05);setCalc('calcHoleDepth',Math.max(.1,(t.d||.375)*3));setCalc('calcPriorHole',Math.max(.0001,(t.d||.5)*.96));setCalc('calcGrooveWidth',.125);pctSetRdoc();recommendFeed();peckCustom=false;refreshPeck(true);if(t.tap)syncedThreadTool();setCalc('calcStickout',t.stickout||(op==='mill'?Math.max(.6,(t.d||.5)*3):op==='turn'?2:Math.max(.75,(t.d||.5)*4)));setCalc('calcBarDiameter',t.barDiameter||.75);setCalc('calcNoseRadius',t.noseRadius||.03125);$('calcBarMaterial').value=t.barMaterial||'steel';$('calcBarInsertMaterial').value=t.insertMaterial||'carbide';if(t.id==='drill_countersink')resetCountersink();}

function substrateInfo(){const sub=SUBSTRATES.find(s=>s.id===$('calcSubstrate').value);if(!sub)return;const t=item('tools',$('calcTool').value),mat=item('materials',$('calcMaterial').value);const special=['hssco','cermet','ceramic','cbn','pcd'].includes(sub.id);const range=mat?.ranges?.[t?.id]?.[sub.id];
 $('substrateHint').textContent=sub.note+(special&&!Array.isArray(range)?' No automatic SFM recommendation for this cutter/material combination; enter one in Database → Materials if manufacturer data supports it.':'');
 if(!Array.isArray(range))$('substrateHint').classList.add('warning-text');else $('substrateHint').classList.remove('warning-text');
}
function modeFactor(){return $('calcPassMode').value==='rough'?1.18:$('calcPassMode').value==='finish'?.65:1;}
function applyPassMode(){
 const mode=$('calcPassMode').value,t=item('tools',$('calcTool').value);if(!t)return;
 if(op==='mill'&&t.id!=='saw'){
  const d=getCalc('calcDiameter');if(d>0){const pct=mode==='rough'?45:mode==='finish'?12:35;let r=Math.max(.001,d*pct/100);nonSlotRdoc=r;if(!$('calcSlot').checked)setCalc('calcRdoc',r);}
 }else if(op==='turn'&&!t.thread&&!t.groove){const d=getCalc('calcDiameter'),depth=mode==='rough'?.075:mode==='finish'?.012:.045;if(d>0)setCalc('calcRdoc',Math.min(depth,d*.12));}
 recommendFeed();recommendSpeed();updateToolFields();calculate();
}
function suggestedPeck(){
 const t=item('tools',$('calcTool').value),mat=item('materials',$('calcMaterial').value),d=getCalc('calcDiameter');if(!(d>0)||!t)return NaN;
 const sub=$('calcSubstrate').value,grp=mat?.group||'',sticky=['Aluminum','Stainless steel','Copper alloy','Plastic'].includes(grp);
 if(t.id==='drill_twist'){
  // Only conventional twist drills; general chip-clearing heuristic in tool diameters.
  const carbideLike=sub==='carbide',ratio=carbideLike?(sticky?1.0:1.7):(sticky?.35:.65);
  return Math.max(.01,Math.min(1.25,d*ratio));
 }
 if(t.id==='turn_part'){
  // Parting: retract frequency rather than cutting engagement. Smaller pecks on gummy stock.
  const size=Math.min(1.6,Math.max(.5,Math.sqrt(d/2))),base=sticky?.055:.105;
  return Math.max(.015,Math.min(.25,base*size*(sub==='hss'?.7:1)));
 }
 return NaN;
}
function refreshPeck(force=false){
 const t=item('tools',$('calcTool').value),visible=t&&(t.id==='turn_part'||t.id==='drill_twist');$('peckBox').classList.toggle('hidden',!visible);if(!visible)return;
 const p=suggestedPeck();if(Number.isFinite(p)&&(force||!peckCustom||!(getCalc('calcPeck')>0)))setCalc('calcPeck',p);
 $('peckHint').textContent=t.id==='turn_part'?'Suggested periodic radial retract spacing for chip control (not radial DOC or a predictor of cutting power). Confirm insert maker recommendations; interrupted feeds can damage some inserts.':'Approximate chip-clearing peck (Q) for a conventional twist drill; depends on diameter, substrate and work material. Through-tool coolant and drill geometry may allow no peck. HSS generally uses shorter pecks.';
}
function referenceForCurrent(){return maker?.lookup($('calcMaterial').value,$('calcTool').value,$('calcSubstrate').value,getCalc('calcDiameter'),$('calcSlot').checked)||null;}
function recommendFeed(){let t=item('tools',$('calcTool').value),m=item('machines',$('calcMachine').value),r=referenceForCurrent();if(!t)return;
 let base=t.load||.004;
 // Source per-tooth and per-revolution feeds differ; never divide drill feeds by flute count.
 if(r&&Number.isFinite(r.feed))base=r.feed;else if(op==='drill'&&!t.tap){const d=getCalc('calcDiameter'),ref=t.d||.375;if(d>0&&ref>0)base=(t.load||.004)*Math.max(.35,Math.min(2.5,Math.pow(d/ref,.65)));} if(t.tap)base=threadConfig().pitch;
 if(!t.tap)base*=modeFactor();
 if(!t.tap)base*=Number.isFinite(Number(m?.feedFactor))?Number(m.feedFactor):m?.manual?.8:1;
 setCalc('calcLoad',base);
 const e=$('feedSource');if(e){let isRef=!!r;e.innerHTML=isRef?`<b>Haas tool-series starting ${r.feedUnit}</b>: ${fmt(isMetric()?base*25.4:base,isMetric()?4:5)} ${isMetric()?'mm':'in'} (${esc(r.basis)}). <a href="${maker.SOURCES[r.source].url}" target="_blank" rel="noopener noreferrer">Source chart ↗</a>${getCalc('calcDiameter')<r.minDiameter||getCalc('calcDiameter')>r.maxDiameter?' · Outside published tool diameter range: end value used; verify.':''}`:`Estimated size-adjusted default from editable tool library; not a manufacturer-verified feed.${m?.manual?' Manual-machine multiplier applied.':''}`;}}
function recommended(){let t=item('tools',$('calcTool').value),m=item('materials',$('calcMaterial').value),c=item('coatings',$('calcCoating').value),machine=item('machines',$('calcMachine').value),sub=$('calcSubstrate').value;if(!t||!m||!c)return null;let entry=m.ranges?.[t.id]?.[sub];if(!Array.isArray(entry)||entry.length!==2||!entry.every(validPositive))return null;
 const makerRef=referenceForCurrent(),source=m.rangeSources?.[t.id]?.[sub];
 const verified=Boolean(makerRef&&source===makerRef.source&&m.group!=='Aluminum');
 const r=verified?[Math.round(makerRef.sfm*.85),makerRef.sfm]:entry;
 // Published values are already tied to specific cutting tool configurations; arbitrary coating factors are not manufacturer-certified.
 const coatingFactor=(verified||m.group==='Aluminum')?1:c.factor;
 const multiplier=coatingFactor*(Number.isFinite(Number(machine?.speedFactor))?Number(machine.speedFactor):machine?.manual?.8:1);
 return {min:r[0]*multiplier,max:r[1]*multiplier,base:r,material:m,tool:t,coating:c,reference:verified?makerRef:null,source:verified?maker.SOURCES[makerRef.source]:null};}
function recommendSpeed(){let r=recommended();if(r){setCalc('calcSpeed',Math.round(r.min+(r.max-r.min)*(op==='mill'&&$('calcHsm').checked?.75:$('calcPassMode').value==='rough'?.36:$('calcPassMode').value==='finish'?.72:.5)))}else $('calcSpeed').value='';updateRecommendation()}
function updateRecommendation(){let r=recommended();let e=$('materialRange');if(!r){e.textContent='No speed-range entry for this material/tool combination. Add one in Database → Materials.';return;}
 const unit=isMetric()?'m/min':'SFM',min=isMetric()?r.min*.3048:r.min,max=isMetric()?r.max*.3048:r.max;
 if(r.reference){e.innerHTML=`<b>Manufacturer-derived starting band:</b> ${fmt(min,0)}–${fmt(max,0)} ${unit}; published tool-series target ${fmt(isMetric()?r.reference.sfm*.3048:r.reference.sfm,0)} ${unit}. The 85% lower end is an app safety margin, not a published range. <a href="${r.source.url}" target="_blank" rel="noopener noreferrer">${esc(r.source.name)} ↗</a>. Approximate material class; <b>other cutter/coating geometries need separate data</b>.${item('machines',$('calcMachine').value)?.manual?' Manual-machine reduction applied.':''}`;}
 else {e.textContent=`${r.tool.name} · ${$('calcSubstrate').selectedOptions[0]?.textContent||'Tool'} · ${r.coating.name}: ${fmt(min,0)}–${fmt(max,0)} ${unit}. Engineering estimate or user-edited range—not directly validated for this cutter/material combination.${item('machines',$('calcMachine').value)?.manual?' Manual-machine reduction applied.':''}`;}}
function resetCountersink(){
 try{const saved=JSON.parse(localStorage.getItem('machiningDeskCountersink1111')||'null');if(saved&&window.MachiningDeskCountersink.valid(saved.cutter,saved.angle,saved.pilot,saved.cut)){
 setCalc('calcDiameter',saved.cutter);$('cskAngle').value=String(saved.angle);setCalc('cskPilot',saved.pilot);setCalc('cskCutDiameter',saved.cut);syncCountersink('diameter');return;}}catch{}
 const d=getCalc('calcDiameter'),pilot=Math.max(.001,Math.min(.25,d*.5));$('cskAngle').value='90';setCalc('cskPilot',pilot);setCalc('cskCutDiameter',Math.max(pilot,Math.min(d,pilot+(d-pilot)*.5)));syncCountersink('diameter');}
function syncCountersink(changed){const calc=window.MachiningDeskCountersink,d=getCalc('calcDiameter'),angle=safeNum($('cskAngle').value),pilot=getCalc('cskPilot');if(!(calc&&d>0))return;
if(changed==='depth'){const depth=getCalc('cskDepth'),cut=calc.diameter(d,angle,pilot,depth);if(Number.isFinite(cut))setCalc('cskCutDiameter',cut);}
else {const cut=getCalc('cskCutDiameter'),depth=calc.depth(d,angle,pilot,cut);if(Number.isFinite(depth))setCalc('cskDepth',depth);}
const depth=getCalc('cskDepth'),cut=getCalc('cskCutDiameter');const good=calc.valid(d,angle,pilot,cut)&&depth>=0&&Number.isFinite(depth);
if(good)try{localStorage.setItem('machiningDeskCountersink1111',JSON.stringify({cutter:d,angle,pilot,cut,depth}));}catch{}
$('cskHint').classList.toggle('csk-invalid',!good);$('cskHint').textContent=good?'Calculated axial depth '+prettyLen(depth,5)+' '+units+' · Contact Ø '+prettyLen(cut,5)+' '+units+'. Tool max Ø '+prettyLen(d,5)+' '+units+'. Verify actual cutter included angle and Z datum.':'Check geometry: angle 0–180°, 0 ≤ pilot Ø ≤ cut Ø ≤ cutter Ø. Too-deep cuts exceed the cutter diameter.';
}
function updateToolFields(){
 let t=item('tools',$('calcTool').value),mill=op==='mill',turn=op==='turn',drill=op==='drill';
 $('passModeBox').classList.toggle('hidden',drill);$('teethBox').classList.toggle('hidden',!mill);$('drillNotationHelp').classList.toggle('hidden',!drill);$('stickoutBox').classList.toggle('hidden',!(mill||(turn&&t?.id==='turn_bore')));$('boringBarBox').classList.toggle('hidden',!(turn&&t?.id==='turn_bore'));$('noseRadiusBox').classList.toggle('hidden',!turn||Boolean(t?.thread));$('rdocBox').classList.toggle('hidden',drill||t?.id==='turn_part');$('adocBox').classList.toggle('hidden',!mill);
 $('countersinkBox').classList.toggle('hidden',t?.id!=='drill_countersink');$('holeDepthBox').classList.toggle('hidden',!drill||t?.id==='drill_countersink');$('priorHoleBox').classList.toggle('hidden',!(drill&&t?.ream));$('grooveWidthBox').classList.toggle('hidden',!(turn&&t?.groove));
 $('diameterLabel').textContent=turn?`Workpiece diameter at cut (${units})`:`Cutting diameter (${units})`;
 $('loadLabel').textContent=mill?`Programmed chip load (${isMetric()?'mm/tooth':'IPT'})`:t?.thread?`Thread lead (${isMetric()?'mm/rev':'in/rev'})`:`Feed per revolution (${isMetric()?'mm/rev':'IPR'})`;
 $('rdocLabel').textContent=turn?'RDOC · Radial depth of cut':t?.id==='saw'?'RDOC · Kerf width':'RDOC · Radial width of cut';
 $('adocLabel').innerHTML=(t?.id==='saw'?'ADOC · Radial saw engagement':'ADOC · Axial depth of cut')+' (<span id="adocUnit">'+units+'</span>)';
 $('slotWrap').classList.toggle('hidden',!(mill&&t?.slot));$('thinWrap').classList.toggle('hidden',!(mill&&t?.thin));$('hsmWrap').classList.toggle('hidden',!(mill&&t?.hsm));
 if(!t?.slot)$('calcSlot').checked=false;if(!t?.thin)$('calcThin').checked=false;if(!t?.hsm)$('calcHsm').checked=false;
 $('calcRdoc').disabled=$('calcRdocPct').disabled=Boolean(mill&&$('calcSlot').checked);refreshPeck();
 if(mill&&t?.slot&&$('calcSlot').checked&&t.id!=='saw')setCalc('calcRdoc',getCalc('calcDiameter')); // Save original non-slot engagement in nonSlotRdoc
 let ae=getCalc('calcRdoc'),d=getCalc('calcDiameter');let allowThin=mill&&t?.thin&&!$('calcSlot').checked&&ae>0&&d>0&&ae<d/2;
 $('calcThin').disabled=!allowThin;if(!allowThin)$('calcThin').checked=false;
 let allowHsm=mill&&t?.hsm&&!$('calcSlot').checked;$('calcHsm').disabled=!allowHsm;if(!allowHsm)$('calcHsm').checked=false;
 pctSetRdoc();if(t?.id==='drill_countersink')syncCountersink('diameter');updateResultFields();
 $('cutterHelp').textContent=(t?.tap?('Linked Threading setting: '+threadConfig().system.toUpperCase()+' · '+fmt(threadConfig().major,3)+' in nominal, '+fmt(threadConfig().pitch,4)+' in/rev lead. Update the Threading page to change pitch; select tap again to re-sync. '):'')+(t?.note||'Adjust cutter parameters to suit your tool. Verify axial cutting-edge engagement against the actual cutter geometry.');updateRecommendation();substrateInfo();
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
function updateExpandTitle(){let open=!$('expandedResults').classList.contains('hidden'),n=Number($('expandResults').dataset.warningCount||0);$('expandResults').textContent=(n?`${n} notices · `:'')+`Advanced ${open?'▴':'▾'}`}
function calculate(){let t=item('tools',$('calcTool').value),m=item('machines',$('calcMachine').value),mat=item('materials',$('calcMaterial').value);let d=getCalc('calcDiameter'),sfm=getCalc('calcSpeed'),load=getCalc('calcLoad'),teeth=number('calcTeeth'),rdoc=getCalc('calcRdoc'),adoc=getCalc('calcAdoc'),pre=getCalc('calcPriorHole'),gw=getCalc('calcGrooveWidth');let spindle=spindleCaps(m,$('calcSpindle').value);let warnings=[];
 const finishChipRisk=op==='turn'&&$('calcPassMode').value==='finish'&&(['Aluminum','Stainless steel','Copper alloy','Plastic'].includes(mat?.group)||/1018|1215|mild|low.carbon/i.test(mat?.name||''));
 $('passModeHint').classList.toggle('warning-text',finishChipRisk);
 $('passModeHint').textContent=finishChipRisk?'Chip-wrap warning: a light finish pass in this stringy material can make long chips that wrap around the chuck. Select suitable chipbreaking geometry and maintain safe chip evacuation.':'Changing strategy updates recommended SFM, chip load and radial engagement; adjust individual values afterward.';
 let csk=t?.id==='drill_countersink',cskCut=getCalc('cskCutDiameter'),cskPilot=getCalc('cskPilot'),cskDepth=getCalc('cskDepth'),cskAngle=safeNum($('cskAngle').value);let numbers=[d,sfm,load];if(op==='mill')numbers.push(teeth,rdoc,adoc);if(op==='turn'&&t?.id!=='turn_part')numbers.push(rdoc);if(op==='drill'){numbers.push(csk?Math.max(cskDepth,0.0000001):getCalc('calcHoleDepth'));if(t?.ream)numbers.push(pre);}if(t?.groove)numbers.push(gw);
 const clear=message=>{latestCutSnapshot=null;window.dispatchEvent(new Event('machiningdesk:calculation'));if($('advancedMachiningDetails'))$('advancedMachiningDetails').innerHTML='';for(const id of ['resultSfm','resultRpm','resultIpm','resultHp','resultIpt','resultMrr','resultUtil','resultIpr','resultTime'])$(id).textContent='—';$('resultNotes').className='notices bad';$('resultNotes').textContent=message;$('summaryText').textContent=message;$('calcNotes').textContent='Check all numeric inputs and your database values.';updateResultFlag(0,true);};
 if($('spindleCurveDetails'))$('spindleCurveDetails').innerHTML='';if($('cuttingForceDetails'))$('cuttingForceDetails').innerHTML='';
 if(!t||!m||!mat){clear('Add a compatible machine, cutter type, and material in the database.');return}
 if(csk&&(!window.MachiningDeskCountersink?.valid(d,cskAngle,cskPilot,cskCut)||!Number.isFinite(cskDepth))){clear('Countersink geometry invalid. Top cut Ø must be between pilot Ø and maximum cutter Ø; included angle must be between 0 and 180 degrees.');return}
 if(numbers.some(x=>!Number.isFinite(x))||numbers.some(x=>x<=0)||d>100||sfm>100000||load>10||(op==='mill'&&(!Number.isInteger(teeth)||teeth>500||rdoc>d&&t.id!=='saw'))||(op==='turn'&&t?.id!=='turn_part'&&rdoc>=d/2)||(op==='drill'&&t.ream&&pre>=d)){clear('Enter valid positive parameters. Milling RDOC cannot exceed cutter diameter, turning RDOC must be less than half the workpiece diameter, and reamer pre-hole must be smaller than the reamer.');return}
 if((t.id==='turn_part'||t.id==='drill_twist')&&(!(getCalc('calcPeck')>0)||getCalc('calcPeck')>100)){clear('Enter a valid positive peck distance or reset it to the suggested value.');return}
 if(!Array.isArray(mat.ranges?.[t.id]?.[$('calcSubstrate').value]))warnings.push('Selected substrate/tool/workpiece combination has no supported starting speed band. Use verified manufacturer data before cutting.');
 if(op==='mill'&&t.id==='saw'&&rdoc<=0){clear('Enter a positive saw kerf width.');return}
 if(!spindle.rpm){clear('This spindle is not configured with a valid RPM maximum. Set it in Database → Machines.');return;}let effectiveD=csk?cskCut:d;let baseRpm=12*sfm/(Math.PI*effectiveD),nominalRpm=$('calcClamp').checked?Math.min(baseRpm,spindle.rpm):baseRpm;
 const rpmPct=Number($('rpmOverride').value)/100,feedPct=Number($('feedOverride').value)/100;
 let requestedRpm=nominalRpm*rpmPct,rpm=$('calcClamp').checked?Math.min(requestedRpm,spindle.rpm):requestedRpm;
 let actualSfm=rpm*Math.PI*effectiveD/12,fz=load,chipMultiplier=1;
 if($('calcClamp').checked&&requestedRpm>spindle.rpm)warnings.push('RPM override limited by the selected machine’s spindle maximum.');
 if(rpm===0&&feedPct>0)warnings.push('Spindle is stopped while feed override is nonzero: do not engage the tool with the spindle stopped.');

 if(finishChipRisk){warnings.push('CHIP-WRAP HAZARD: finishing this stringy material with a shallow depth or low feed may create continuous chips that wrap around the rotating chuck or workpiece. Use a suitable chipbreaker, adequate feed, and guarded chip evacuation; never reach into a running machine.');}
 if(op==='mill'&&$('calcThin').checked&&t.thin){let ratio=rdoc/d;if(ratio>0&&ratio<.5){let maxChipFactor=1/Math.sqrt(1-Math.pow(1-2*ratio,2));chipMultiplier=Math.min(3,maxChipFactor);fz=load*chipMultiplier;if(maxChipFactor>3)warnings.push('Chip-thinning compensation was capped at 3×; verify chip thickness near extremely low engagement.')}}
 if(op==='mill'&&$('calcHsm').checked){if(rdoc/d>.4)warnings.push('HSM normally assumes controlled, relatively low radial engagement; selected RDOC may be too high.');warnings.push('HSM selects an upper-range SFM starting point; it does not generate constant-engagement toolpaths or justify automatically increasing chip load.');}
 let feed=nominalRpm*(op==='mill'?fz*teeth:load)*feedPct;if(op==='mill'){let modifier=Number(t.feedFactor)||1;if($('calcSlot').checked&&t.slot){let ref=recommended()?.reference;modifier*=.65;if(ref?.slotProfile){warnings.push('Full-width slotting: source-specific slotting SFM target plus an additional conservative 65% feed multiplier. This extra feed reduction is an app estimate, not a manufacturer requirement.');}else{warnings.push('Full-width slotting: feed reduced to 65% of nominal as a conservative estimate. Confirm chip evacuation, axial engagement and toolmaker guidance.')}}if(t.threadMill){const th=threadConfig();if(th.system==='npt'||th.system==='bsp')warnings.push('Pipe-thread taper is not modeled: helical toolpath requires geometry-specific verification.');const f=th.side==='internal'?(th.major-d)/th.major:(th.major+d)/th.major;if(!(f>0)){warnings.push('Thread mill diameter must be smaller than the internal thread diameter.');}else{feed*=f;warnings.push('Feed is adjusted to tool CENTERLINE for '+th.side+' thread milling (nominal diameter '+fmt(isMetric()?th.major*25.4:th.major,3)+' '+units+'). Helical lead '+fmt(isMetric()?th.pitch*25.4:th.pitch,4)+' '+units+' per revolution (single start). Program proper helical motion with CAM; RPM/feed alone do not generate a safe thread path.');}if(t.threadMill==='multi')warnings.push('Multi-point thread mill requires matching cutter tooth pitch and adequate axial engagement.');}if(m?.manual)warnings.push('Manual-machine feed and speed recommendation multipliers have been applied (editable in Database → Machines).');feed*=Math.max(.05,Math.min(1,modifier));if(modifier<1&&!(t.slot&&$('calcSlot').checked))warnings.push('Specialized cutter feed multiplier applied.');}let mrr=0,power=0;
 if(op==='mill'){mrr=feed*rdoc*adoc;if(t.id==='ball')warnings.push('Ball nose tip contact speed varies with engagement; RPM uses nominal diameter.');if(t.id==='chamfer')warnings.push('Chamfer cutter uses nominal diameter; contact diameter can be much smaller.');if(t.id==='saw')warnings.push('Saw power calculation uses kerf width × radial engagement as an approximation.');if(t.threadMill)warnings.push('Thread-mill removal estimate assumes rectangular engagement; actual V-form removal and multi-tooth contact differ.');}
 else if(op==='turn'){if(t.groove){mrr=Math.PI*(t.id==='turn_part'?d:(d-rdoc*.5))*gw*feed;warnings.push('Grooving/parting power estimates radial material removal from cut diameter, groove width and feed; the peck distance controls only retract frequency.');}else if(t.thread){mrr=NaN;power=NaN;warnings.push('Threading MRR and cutting power are not estimated; successive infeed passes remove different cross sections.');}else mrr=Math.PI*(d-rdoc)*rdoc*feed;}
 else{mrr=csk?(cskDepth>0?window.MachiningDeskCountersink.volume(cskAngle,cskPilot,cskCut,cskDepth)*feed/cskDepth:0):Math.PI/4*(d*d-(t.ream?pre*pre:0))*feed;if(t.tap){mrr=NaN;warnings.push('Rigid tapping: synchronized feed uses thread lead. Torque uses an empirical estimate and is NOT a certified tap safe torque.');}if(!csk&&number('calcHoleDepth')/d>(t.maxDepthRatio||4))warnings.push('Deep hole: verify chip evacuation, coolant, peck strategy, and drill length-to-diameter capability.');if(t.id==='drill_spot'||t.id==='drill_center')warnings.push('Nominal cylindrical MRR overestimates conical cuts.');}
 if(Number.isFinite(mrr))power=mrr*mat.unitHp; if(t.tap){const tc=threadConfig();const group=mat.group||'';const base=group==='Aluminum'?.065:group==='Stainless steel'?.205:group==='Copper alloy'?.085:.155;const tqNm=base*Math.pow(d*25.4,2)*(load*25.4)*(tc.type==='form'?1.5:1)*(tc.percent/65);const approxHp=tqNm*rpm/9549.3/.745699872;power=approxHp;warnings.push('Tap torque estimate: '+fmt(isMetric()?tqNm:tqNm*.737562,2)+' '+(isMetric()?'N·m':'lbf·ft')+'. Empirical heuristic; verify tap model, length, hole material and manufacturer torque values.');}
 if(rpm===0&&feed>0){power=NaN;mrr=NaN;warnings.push('Power and material-removal estimates are invalid with zero spindle speed and nonzero feed.');}
 let curveApi=window.MachiningDeskSpindles;
 let curveKind=$('calcSpindle').value||'main';
 let curveAvailable=curveApi?.available(m,curveKind,rpm);
 let util=Number.isFinite(curveAvailable)&&curveAvailable>0?power/curveAvailable*100:spindle.hp>0?power/spindle.hp*100:NaN;
 let forceLbf=Number.isFinite(power)&&actualSfm>0?33000*power/actualSfm:NaN;
 let torqueFtLb=Number.isFinite(power)&&rpm>0?5252.113*power/rpm:NaN;
 let efficiency=Number(m.driveEfficiency)||.85, idleHp=Number(m.idleHp);if(!Number.isFinite(idleHp)||idleHp<0)idleHp=0;
 let estimatedMotorHp=Number.isFinite(power)&&efficiency>0&&efficiency<=1?power/efficiency+idleHp:NaN;
 if(baseRpm>spindle.rpm)warnings.push($('calcClamp').checked?'Recommended RPM is capped at the machine’s entered maximum.':'Unmodified recommended RPM exceeds the machine’s entered maximum.');
 if(rpm>spindle.rpm)warnings.push('Overridden spindle RPM exceeds the machine’s configured limit.');
 if(rpm>0&&feed>0){const chipRatio=feedPct*nominalRpm/rpm;if(chipRatio>1.5)warnings.push('Effective feed per tooth/revolution is '+fmt(chipRatio,2)+'× the baseline at this spindle speed. Verify tooth load to avoid tool damage.');else if(chipRatio<.5)warnings.push('Effective feed per tooth/revolution is below half the baseline; rubbing may occur.');}
 if(feed>m.maxFeed)warnings.push('Calculated feed exceeds the machine’s entered maximum feed.');
 if((m.powerRatingBasis||(/^Haas\b/i.test(m.name)?'peak':'unspecified'))==='peak'&&Number.isFinite(curveAvailable)&&power>curveAvailable*.5)warnings.push('Estimated cutting load exceeds the approximate continuous power (50% of assumed short-term Haas peak rating). Check actual spindle specifications and allowable duty cycle.');
 if(Number.isFinite(curveAvailable)&&power>curveAvailable)warnings.push('Estimated net cutting power exceeds modeled spindle power at this RPM.');
 if(Number.isFinite(util)){if(util>100)warnings.push('Estimated cutting power exceeds the entered nominal spindle horsepower.');else if(util>75)warnings.push('Power is near nominal machine rating; check the spindle torque/power curve.');}
 if(curveApi&&$('spindleCurveDetails')){$('spindleCurveDetails').innerHTML=curveApi.diagram(m,curveKind,{rpm,hp:power},units)}
 if($('cuttingForceDetails')){$('cuttingForceDetails').innerHTML=`<h3>Estimated cutting forces and motor demand</h3><div class="outputgrid"><div class="outmetric"><small>Effective tangential cutting force</small><strong>${fmt(unitNumber(forceLbf,'force'),1)} ${unitSymbol('force')}</strong></div><div class="outmetric"><small>Net cutting torque</small><strong>${fmt(unitNumber(torqueFtLb,'torque'),2)} ${unitSymbol('torque')}</strong></div><div class="outmetric"><small>Approximate motor-equivalent load</small><strong>${fmt(unitNumber(estimatedMotorHp,'power'),2)} ${unitSymbol('power')}</strong></div></div><p class="sourcehint">Tangential/equivalent resultant = net cutting power × 33,000 / actual surface speed (ft/min), not measured force. For drills, this is a torque-equivalent cutting-edge force, <b>not axial drilling thrust</b>. Turning/milling force components depend on geometry, edge radius, depth and cutting direction. The motor-equivalent load assumes ${fmt(efficiency*100,0)}% drive efficiency plus ${fmt(idleHp,2)} hp configured idle/auxiliary draw; estimates are not live spindle-load readings. Thin chips, tool wear and machine losses may increase real demand.</p>`;}
 if($('advancedMachiningDetails'))$('advancedMachiningDetails').innerHTML=window.MachiningDeskAdvanced?.render({op,t,mat,forceLbf,rpm,feed,d,rdoc,adoc,teeth,load,units,stickout:getCalc('calcStickout'),barDiameter:getCalc('calcBarDiameter'),noseRadius:getCalc('calcNoseRadius'),barMaterial:$('calcBarMaterial').value,barInsertMaterial:$('calcBarInsertMaterial').value,unitPrefs:getUnitPrefs()})||'';
 let r=recommended();if(r&&(sfm<r.min||sfm>r.max))warnings.push('Requested SFM is outside the selected material/tool starting band.');
 if(op==='mill'&&rdoc/d<.25&&!$('calcThin').checked&&t.thin)warnings.push('At low radial engagement, chip thinning may make actual maximum chip thickness lower than programmed IPT.');
 if(!isCoatingRecommended(item('coatings',$('calcCoating').value),mat))warnings.push('Selected coating is not marked recommended for this material family. Consult the cutter manufacturer; recommendation is application-dependent.');
 if(!(spindle.hp>0))warnings.push(spindle.desc+' horsepower has not been verified or entered. Power usage cannot be assessed; edit the machine database.');
 if(!Number.isFinite(rpm)||!Number.isFinite(feed)||(!Number.isFinite(power)&&!t.thread&&rpm>0)||feed>1e9||power>1e9){clear('This combination is outside the supported calculation range.');return}
 latestCutSnapshot={
  machineId:m.id,machineName:m.name,spindle:$('calcSpindle').value||'main',spindleName:spindle.desc,
  operation:op,materialId:mat.id,materialName:mat.name,materialFamily:mat.group||'',
  toolId:t.id,toolName:t.name,substrate:$('calcSubstrate').value,coating:$('calcCoating').selectedOptions[0]?.textContent||'',
  strategy:$('calcPassMode').value,
  diameterIn:d,flutes:teeth,programmedSfm:sfm,actualSfm,rpm,feedIpm:feed,chipLoadIn:load,
  rdocIn:op==='mill'||op==='turn'&&t.id!=='turn_part'?rdoc:null,
  adocIn:op==='mill'?adoc:null,holeDepthIn:op==='drill'?getCalc('calcHoleDepth'):null,
  peckIn:t.id==='drill_twist'||t.id==='turn_part'?getCalc('calcPeck'):null,
  grooveWidthIn:t.groove?gw:null,
  rpmOverridePct:Number($('rpmOverride').value),feedOverridePct:Number($('feedOverride').value),
  mrrIn3Min:Number.isFinite(mrr)?mrr:null,netCuttingHp:Number.isFinite(power)?power:null,motorEquivalentHp:Number.isFinite(estimatedMotorHp)?estimatedMotorHp:null,
  spindleRatedHp:spindle.hp,availableHpAtRpm:Number.isFinite(curveAvailable)?curveAvailable:null,
  predictedLoadPct:Number.isFinite(util)?util:null,
  chipThinningEnabled:op==='mill'&&$('calcThin').checked,slottingEnabled:op==='mill'&&$('calcSlot').checked,
  unitHp:mat.unitHp,driveEfficiency:efficiency,idleHp,
  collectedAt:new Date().toISOString()
 };
 window.dispatchEvent(new Event('machiningdesk:calculation'));
 $('resultSfm').textContent=fmt(isMetric()?actualSfm*.3048:actualSfm,0);$('resultRpm').textContent=fmt(rpm,0);$('resultIpm').textContent=fmt(isMetric()?feed*25.4:feed,2);$('resultHp').textContent=fmt(unitNumber(power,'power'),2);$('resultIpt').textContent=rpm>0?fmt((feed/rpm/(op==='mill'?teeth:1))*(isMetric()?25.4:1),isMetric()?3:4):'—';$('resultMrr').textContent=fmt(isMetric()?mrr*16.387064:mrr,3);$('resultUtil').textContent=fmt(util,1)+(Number.isFinite(util)?'%':'');$('resultIpr').textContent=rpm>0?fmt(feed/rpm*(isMetric()?25.4:1),isMetric()?3:4):'—';$('resultTime').textContent=op==='drill'&&feed>0?fmt((csk?cskDepth:getCalc('calcHoleDepth'))/feed*60,1):'—';
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
 if(['editSecondaryHp','editLiveHp','editIdleHp'].includes(id))return .745699872;
 if(id==='editHp'&&tab==='machines')return .745699872;
 if(id==='editHp'&&tab==='materials')return .745699872/16.387064;
 if(['editDiameter','editLoad','editNeckDiameter','editNoseRadius','editStickout'].includes(id)&&tab==='tools')return 25.4;
 return 1;}
function dbPowerField(id){return ['editSecondaryHp','editLiveHp','editIdleHp'].includes(id)||id==='editHp'&&['machines','materials'].includes(dbTab);}
function dbNum(id){const raw=number(id);
 if(dbPowerField(id))return raw/((unitPrefs.power==='kW'?.745699872:1)*(id==='editHp'&&dbTab==='materials'&&isMetric()?1/16.387064:1));
 return isMetric()?raw/dbEditorFactor(id):raw;
}
function applyDbPreferenceDisplay(){
 for(const id of ['editHp','editSecondaryHp','editLiveHp','editIdleHp']){const input=$(id);if(!input||!$('dbEditor').contains(input)||!dbPowerField(id))continue;const val=safeNum(input.value);if(Number.isFinite(val)&&unitPrefs.power==='kW')input.value=numShow(val*.745699872,6);}
 for(const id of ['editYield','editTensile']){const input=$(id);if(!input||!$('dbEditor').contains(input))continue;const val=safeNum(input.value);if(Number.isFinite(val)&&unitPrefs.pressure==='psi')input.value=numShow(val*145.0377377,4);}
 dbLabels();
}
function changeDbPreferences(old,newer){
 if(dbTab==='machines'||dbTab==='materials'){
  const ratio=(newer.power==='kW'?.745699872:1)/(old.power==='kW'?.745699872:1);
  for(const id of ['editHp','editSecondaryHp','editLiveHp','editIdleHp']){const inp=$(id);if(inp&&$('dbEditor').contains(inp)){const val=safeNum(inp.value);if(Number.isFinite(val))inp.value=numShow(val*ratio,6);}}
  const stressRatio=(newer.pressure==='psi'?145.0377377:1)/(old.pressure==='psi'?145.0377377:1);
  if(dbTab==='materials')for(const id of ['editYield','editTensile']){const inp=$(id);if(inp){const val=safeNum(inp.value);if(Number.isFinite(val))inp.value=numShow(val*stressRatio,4);}}
  dbLabels();
 }
}

function dbLabels(){for(const id of ['editDiameter','editLoad','editHp','editFeed','editSecondaryHp','editLiveHp','editIdleHp','editNeckDiameter','editNoseRadius','editStickout']){
 const label=$('dbEditor').querySelector(`label[for="${id}"]`);if(!label)continue;
 let str={'editDiameter':'Default cutting diameter','editLoad':'Default chip load or feed/rev','editFeed':'Maximum feed','editSecondaryHp':'Power','editLiveHp':'Power','editIdleHp':'Idle/auxiliary power','editHp':dbTab==='machines'?'Nominal main spindle power':'Estimated specific cutting power'}[id];
 let u=id==='editFeed'?(isMetric()?'mm/min':'IPM'):id==='editHp'&&dbTab==='materials'?((unitPrefs.power==='kW'?'kW':'hp')+(isMetric()? '/(cm³/min)':'/(in³/min)')):['editHp','editSecondaryHp','editLiveHp','editIdleHp'].includes(id)?(unitPrefs.power==='kW'?'kW':'hp'):(isMetric()?'mm':'in');label.textContent=`${str} (${u})`;}
 if(dbTab==='materials'){for(const id of ['editYield','editTensile']){const label=$('dbEditor').querySelector(`label[for="${id}"]`);if(label)label.textContent=(id==='editYield'?'Yield strength':'Ultimate tensile strength')+' ('+unitPrefs.pressure+')';}let hdr=$('dbEditor').querySelector('h3');if(hdr&&hdr.textContent.includes('SFM'))hdr.textContent=isMetric()?'Cutting speed ranges (m/min) by cutter type':'SFM ranges by cutter type';}
}
function convertDbEditor(old,target,skipRanges=false){const factorNew=target==='mm'?1:-1;for(const id of ['editDiameter','editLoad','editHp','editFeed','editSecondaryHp','editLiveHp','editIdleHp','editNeckDiameter','editNoseRadius','editStickout']){
 const input=$(id);if(!input||!$('dbEditor').contains(input))continue;const scale=dbPowerField(id)?(id==='editHp'&&dbTab==='materials'?1/16.387064:1):dbEditorFactor(id);let val=safeNum(input.value);if(Number.isFinite(val))input.value=numShow(factorNew===1?val*scale:val/scale,6);
 }
 if(!skipRanges)document.querySelectorAll('.rangeVal').forEach(i=>{let v=safeNum(i.value);if(Number.isFinite(v))i.value=numShow(factorNew===1?v*.3048:v/.3048,4)});
 dbLabels();}
function renderDb(){window.MachiningDeskCharts?.favoriteEditor();dbGroup='all';renderDbGroups();document.querySelectorAll('[data-db]').forEach(b=>b.classList.toggle('active',b.dataset.db===dbTab));$('dbSearch').value='';if(!db[dbTab].some(e=>e.id===dbId))dbId=db[dbTab][0]?.id||null;renderDbList();renderEditor();}
function machineGroup(x){return x.category||((x.ops||[]).includes('mill')&&(x.ops||[]).includes('turn')?'millturn':(x.ops||[]).includes('turn')?'lathe':'mill')}
function renderDbGroups(){let host=$('dbGroups');host.replaceChildren();if(!['machines','tools','materials'].includes(dbTab)){host.classList.add('hidden');return}host.classList.remove('hidden');let groups=dbTab==='machines'?[['all','All'],['mill','Mills'],['lathe','Lathes'],['millturn','Mill-Turns']]:dbTab==='tools'?[['all','All'],['mill','Milling'],['turn','Turning'],['drill','Drilling']]:[['all','All'],...materialGroups().filter(g=>db.materials.some(x=>x.group===g)).map(g=>[g,g])];for(const [id,name] of groups){let b=document.createElement('button');b.type='button';b.className='minitab'+(dbGroup===id?' active':'');b.textContent=name;b.addEventListener('click',()=>{dbGroup=id;renderDbGroups();renderDbList()});host.append(b)}}
function renderDbList(){let q=$('dbSearch').value.toLowerCase().trim();let host=$('dbList');host.replaceChildren();for(const x of db[dbTab].filter(v=>[v.name,v.manufacturer,v.partNumber,v.grade,v.insertCode,v.holderModel].some(s=>String(s||'').toLowerCase().includes(q))&&(dbGroup==='all'||(dbTab==='machines'?machineGroup(v):dbTab==='tools'?v.op:dbTab==='materials'?(v.group||'Other'):null)===dbGroup))){let b=document.createElement('button');b.type='button';b.className='dbitem'+(dbId===x.id?' active':'');b.textContent=x.name;let sub=document.createElement('small');sub.textContent=dbTab==='machines'?(x.ops||[]).map(v=>OPS[v]).join(' · '):dbTab==='tools'?([OPS[x.op],x.manufacturer,x.partNumber,x.grade].filter(Boolean).join(' · ')):dbTab==='materials'?x.group:('SFM × '+fmt(x.factor,2));b.append(sub);b.addEventListener('click',()=>{dbId=x.id;renderDbList();renderEditor()});host.append(b)}if(!host.children.length)host.textContent='No matching entries.'}
function renderEditor(){let x=item(dbTab,dbId);let box=$('dbEditor');$('dbFlash').textContent='';$('dbFlash').className='flash';$('deleteEntry').disabled=!x;$('duplicateEntry').disabled=!x;$('duplicateEntry').textContent='Copy';if(!x){$('editorTitle').textContent='No entry selected';box.innerHTML='<p>Add an entry to get started.</p>';working=null;return}working=copy(x);rangeTab='mill';$('editorTitle').textContent='Edit '+({machines:'machine',tools:'tool type',materials:'material',coatings:'coating'}[dbTab]);renderWorking();}
function renderWorking(){let x=working;let html='';if(dbTab==='machines'){
 html=`<div class="formgrid">${dbText('editName','Machine name',x.name)}<div><label for="editMachineCategory">Machine type</label><select id="editMachineCategory"><option value="mill" ${machineGroup(x)==='mill'?'selected':''}>Mill</option><option value="lathe" ${machineGroup(x)==='lathe'?'selected':''}>Lathe</option><option value="millturn" ${machineGroup(x)==='millturn'?'selected':''}>Mill-Turn</option></select></div>${dbText('editRpm','Main spindle RPM',x.rpm,'number','min="1" max="200000" step="1"')}${dbText('editHp','Nominal spindle power (hp)',x.hp,'number','min="0.1" step="any"')}${dbText('editFeed','Maximum feed (IPM)',x.maxFeed,'number','min="1" step="any"')}${dbText('editSpeedFactor','Recommended cutting speed multiplier',x.speedFactor??(x.manual?.8:1),'number','min="0.05" max="2" step="0.05"')}${dbText('editMachineFeedFactor','Recommended chip feed multiplier',x.feedFactor??(x.manual?.8:1),'number','min="0.05" max="2" step="0.05"')}<div class="full"><label class="check"><input type="checkbox" id="editManual" ${x.manual?'checked':''}>Manual machine (80% initial recommendation for new manual presets)</label><p class="help">Both factors are applied to starting recommendations; CNC defaults 100%, manual defaults 80%. User-entered chip loads and SFM remain editable. Rigid tapping always uses its exact thread lead.</p></div><div><label for="editCodeList">G / M code library</label><select id="editCodeList">${[['none','None'],['vf','VF · Haas mill'],['umc','UMC · Haas five-axis'],['st','ST · Haas lathe']].map(([v,n])=>`<option value="${v}" ${x.codeList===v?'selected':''}>${n}</option>`).join('')}</select><p class="help">Only assigned machines appear in the Haas Codes page. Choose None for manuals and generic machines.</p></div><div><label for="editRatingBasis">Horsepower rating basis</label><select id="editRatingBasis"><option value="peak" ${(x.powerRatingBasis||(/^Haas\b/i.test(x.name)?'peak':'unspecified'))==='peak'?'selected':''}>Short-term peak · show ~50% continuous guidance</option><option value="continuous" ${x.powerRatingBasis==='continuous'?'selected':''}>Continuous rating</option><option value="unspecified" ${(x.powerRatingBasis||(!/^Haas\b/i.test(x.name)?'unspecified':'peak'))==='unspecified'?'selected':''}>Unverified · no continuous rating</option></select></div>${dbText('editEfficiency','Estimated drive efficiency (fraction)',x.driveEfficiency??.85,'number','min="0.05" max="1" step="0.01"')}${dbText('editIdleHp','Estimated idle/auxiliary power (hp)',x.idleHp??0,'number','min="0" max="100" step="0.1"')}${dbTextarea('editNote','Notes',x.note)}</div><hr class="sectionline"><h3 id="extraSpindleHeading">Mill-turn spindle options</h3><div class="machine-spindles" id="extraSpindles"><div class="spindlecard"><h3>A2-5 finishing sub-spindle</h3><div class="formgrid">${dbText('editSecondaryRpm','Maximum RPM',x.secondaryRpm||0,'number','min="0" step="1"')}${dbText('editSecondaryHp','Rated power (hp) · provisional 8',x.secondaryHp||0,'number','min="0" step="any"')}</div><p class="help">The 8 hp sub-spindle rating is user-provided and has not been confirmed against the installed spindle option.</p></div><div class="spindlecard"><h3>12-station BMT65 live tooling</h3><div class="formgrid">${dbText('editLiveRpm','Maximum RPM',x.liveRpm||0,'number','min="0" step="1"')}${dbText('editLiveHp','Rated power (hp) · 12',x.liveHp||0,'number','min="0" step="any"')}</div><p class="help">4,000 RPM and 12 hp configuration; verify installed option.</p></div></div><p class="help">The main spindle is configured above. Separate main, sub, and live power/torque graphs remain below.</p><hr class="sectionline"><h3>Available operations</h3><p class="help">Available operations are limited by the selected machine type.</p><div class="btnrow">${Object.keys(OPS).map(k=>`<label class="check"><input class="editOp" type="checkbox" value="${k}" ${(x.ops||[]).includes(k)?'checked':''}>${OPS[k]}</label>`).join('')}</div><hr class="sectionline"><h3>Compatible cutter types</h3><label class="check"><input id="editAllTools" type="checkbox" ${!x.toolIds?.length?'checked':''}>Use all cutter types for selected operations</label><p class="help">For example, disable incompatible cutter types for a particular machine.</p><div id="machineTools" class="toolchecks"></div>`;
 html+=window.MachiningDeskSpindles?.editorHTML(x)||'';
 }else if(dbTab==='tools'){
 html=`<div class="formgrid">${dbText('editName','Cutter type name',x.name)}<div><label for="editOpSelect">Operation</label><select id="editOpSelect">${Object.entries(OPS).map(([k,v])=>`<option value="${k}" ${x.op===k?'selected':''}>${v}</option>`).join('')}</select></div>${dbText('editDiameter','Default cutting diameter (in)',x.d,'number','min="0.0001" step="any"')}${dbText('editTeeth','Default flutes / teeth',x.teeth,'number','min="1" max="500" step="1"')}${dbText('editLoad','Default chip load or feed/rev (in)',x.load,'number','min="0.000001" step="any"')}${dbText('editFactor','Starting SFM factor for new materials',x.factor,'number','min="0.01" max="3" step="any"')}${dbTextarea('editNote','Tool notes',x.note)}</div><details class="community-preview" open><summary>Manufacturer-specific tool record · optional</summary><div class="formgrid">${dbText('editManufacturer','Manufacturer',x.manufacturer||'')}${dbText('editPartNumber','Exact manufacturer part number',x.partNumber||'')}${dbText('editGrade','Insert or tool grade',x.grade||'')}${dbText('editInsertCode','Insert designation',x.insertCode||'')}${dbText('editHolderModel','Holder designation',x.holderModel||'')}<div><label for="editPreferredSubstrate">Preferred substrate</label><select id="editPreferredSubstrate"><option value="">Choose manually</option>${SUBSTRATES.map(s=>`<option value="${s.id}" ${x.preferredSubstrate===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div><label for="editPreferredCoating">Preferred coating</label><select id="editPreferredCoating"><option value="">Choose manually</option>${db.coatings.map(s=>`<option value="${s.id}" ${x.preferredCoating===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div><label for="editSourceBasis">Specification origin</label><select id="editSourceBasis">${[['user','User-entered / unverified'],['manufacturer','Verified against linked manufacturer document'],['shop','Shop-tested observation']].map(([id,name])=>`<option value="${id}" ${x.sourceBasis===id?'selected':''}>${name}</option>`).join('')}</select></div>${dbText('editToolSource','Manufacturer specification URL · HTTPS',x.sourceUrl||'','url','maxlength="500"')}</div><p class="help">Source and grade are descriptive only; the program does not automatically validate manufacturer part numbers or invent feed/speed recommendations. Pick exact inserts, holders and substrate only after checking the maker’s catalog. Stored with personal tool and cloud backup.</p></details><div id="toolGeometry" class="formgrid"></div><hr class="sectionline"><h3>Milling controls</h3><div class="btnrow">${[['slot','Slotting'],['thin','Chip thinning'],['hsm','HSM']].map(([k,n])=>`<label class="check"><input class="toolFlag" data-flag="${k}" type="checkbox" ${x[k]?'checked':''} ${x.op!=='mill'?'disabled':''}>${n}</label>`).join('')}</div><hr class="sectionline"><h3>Special cutting geometry</h3><div class="btnrow"><label class="check"><input class="toolFlag" data-flag="groove" type="checkbox" ${x.groove?'checked':''}>Grooving / parting</label><label class="check"><input class="toolFlag" data-flag="thread" type="checkbox" ${x.thread?'checked':''}>Single-point threading</label><label class="check"><input class="toolFlag" data-flag="ream" type="checkbox" ${x.ream?'checked':''}>Reamer</label></div><p class="help">Adding a tool type will create SFM rows for it in every existing material, using that material's first available ranges and the tool's SFM factor. Review these estimates afterward.</p>`;
 }else if(dbTab==='materials'){
 html=`<div class="formgrid">${dbText('editName','Material designation',x.name)}<div><label for="editGroup">Material family</label><select id="editGroup">${materialGroups().map(g=>`<option ${x.group===g?'selected':''}>${g}</option>`).join('')}</select></div>${dbText('editHp','Estimated specific cutting power · hp/(in³/min)',x.unitHp,'number','min="0.001" step="any"')}${dbText('editDensity','Density (g/cm³)',x.properties?.density??'','number','min="0.01" step="any"')}${dbText('editModulus','Elastic modulus (GPa)',x.properties?.modulus??'','number','min="0.01" step="any"')}${dbText('editExpansion','Thermal expansion (µm/m·K)',x.properties?.alpha??'','number','min="0" step="any"')}${dbText('editYield','Yield strength (MPa)',x.properties?.yieldMpa??'','number','min="0" step="any"')}${dbText('editTensile','Ultimate tensile strength (MPa)',x.properties?.tensileMpa??'','number','min="0" step="any"')}${dbText('editHardness','Hardness (scale and value, e.g. HB 197)',x.properties?.hardness??'','text')}${dbText('editConductivity','Thermal conductivity (W/m·K)',x.properties?.conductivity??'','number','min="0" step="any"')}${dbTextarea('editNote','Notes / condition / temper',x.note)}</div><p class="help">Optional property overrides populate the live Material Properties chart. Empty fields use labeled typical estimates, not guaranteed grade data.</p><hr class="sectionline"><h3>SFM ranges by cutter type</h3><p class="dbintro muted">Baseline <b>uncoated</b> starting ranges, grouped by machining operation. Select a substrate below; additional materials are estimated where appropriate, and unsupported combinations remain blank. Ranges are not certified manufacturer data.</p><div class="minitabrow">${Object.entries(OPS).map(([k,v])=>`<button type="button" class="minitab ${rangeTab===k?'active':''}" data-range="${k}">${v}</button>`).join('')}</div><div class="full" style="margin:14px 0"><label for="rangeSubstrate">Cutting tool substrate</label><select id="rangeSubstrate">${SUBSTRATES.map(s=>`<option value="${s.id}" ${rangeSubstrate===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><p class="help">Empty low/high values mean no generic recommendation. Fill both from verified toolmaker data to enable a previously unsupported pairing.</p></div><div id="rangeTable"></div>`;
 }else if(dbTab==='coatings'){
 html=`<div class="formgrid">${dbText('editName','Coating name',x.name)}${dbText('editFactor','Illustrative SFM multiplier',x.factor,'number','min="0.01" max="3" step="any"')}${dbTextarea('editNote','Coating notes',x.note)}</div><hr class="sectionline"><h3>Recommended workpiece material families</h3><p class="subtitle">Select families this coating is suitable for. These are advisory and will be highlighted on the machining calculator. Actual coating recommendations depend on cutter grade and application.</p><div class="toolchecks">${materialGroups().filter(g=>g!=='Other').map(g=>`<label class="check"><input type="checkbox" class="coatGroup" value="${esc(g)}" ${(x.groups||[]).includes(g)?'checked':''}>${esc(g)}</label>`).join('')}</div><p class="sourcehint">Baseline selection informed by <a href="https://www.harveytool.com/resources/tool-coatings" target="_blank" rel="noopener noreferrer">Harvey Tool coating guidance</a>. Generic chemistry alone cannot guarantee suitability.</p><div class="info" style="margin-top:16px">Multiplier 1.00 = unchanged SFM range. Coating multipliers are simplified placeholders, not manufacturer-validated factors. Suitability can depend heavily on alloy and coating chemistry.</div>`;
 }
 $('dbEditor').innerHTML=html;
 if(dbTab==='machines'){applyMachineCategory();$('editMachineCategory').addEventListener('change',applyMachineCategory);$('editManual').addEventListener('change',()=>{const target=$('editManual').checked?.8:1;const old=target===.8?1:.8;for(const id of ['editSpeedFactor','editMachineFeedFactor'])if(Math.abs(Number($(id).value)-old)<.000001)$(id).value=String(target);});renderMachineTools();$('editAllTools').addEventListener('change',renderMachineTools);document.querySelectorAll('.editOp').forEach(c=>c.addEventListener('change',renderMachineTools));}
 if(dbTab==='tools'){renderToolGeometry();$('editOpSelect').addEventListener('change',renderToolGeometry);$('editOpSelect').addEventListener('change',()=>{let isMill=$('editOpSelect').value==='mill';document.querySelectorAll('.toolFlag').forEach(c=>{if(['slot','thin','hsm'].includes(c.dataset.flag))c.disabled=!isMill})});}
 if(dbTab==='materials'){renderRangeTable();$('rangeSubstrate').addEventListener('change',()=>{captureRanges();rangeSubstrate=$('rangeSubstrate').value;renderRangeTable();});document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{captureRanges();rangeTab=b.dataset.range;document.querySelectorAll('[data-range]').forEach(b2=>b2.classList.toggle('active',b2.dataset.range===rangeTab));renderRangeTable()}));}if(isMetric())convertDbEditor('in','mm',true);applyDbPreferenceDisplay();
 }
function applyMachineCategory(){let k=$('editMachineCategory').value;let opts=k==='mill'?['mill','drill']:k==='lathe'?['turn','drill']:['mill','turn','drill'];document.querySelectorAll('.editOp').forEach(c=>{c.disabled=!opts.includes(c.value);if(c.disabled)c.checked=false});if(k==='lathe')document.querySelector('.editOp[value="turn"]').checked=true;if(k==='mill')document.querySelector('.editOp[value="mill"]').checked=true;if(k==='millturn')for(const c of document.querySelectorAll('.editOp'))c.checked=true;$('extraSpindles').classList.toggle('hidden',k!=='millturn');$('extraSpindleHeading').classList.toggle('hidden',k!=='millturn');renderMachineTools()}
function renderToolGeometry(){let opNow=$('editOpSelect').value;let box=$('toolGeometry');let x=working;box.innerHTML=opNow==='mill'?`${dbText('editToolFeedFactor','Tool feed multiplier (0.1–1)',x.feedFactor??1,'number','min="0.1" max="1" step="0.05"')}${dbText('editAngle','Included angle (degrees, form cutters)',x.angle||60,'number','min="1" max="179" step="any"')}${dbText('editNeckDiameter','Neck diameter (in, form cutters)',x.neckDiameter||x.d*.5,'number','min="0.0001" step="any"')}`:opNow==='turn'?`${dbText('editNoseRadius','Nose radius (in)',x.noseRadius||.03125,'number','min="0" step="any"')}${x.id==='turn_bore'?dbText('editStickout','Boring bar overhang (in)',x.stickout||2,'number','min="0.01" step="any"'):''}`:`${dbText('editPointAngle','Point angle (degrees)',x.pointAngle||118,'number','min="1" max="179" step="any"')}${dbText('editMaxDepthRatio','Suggested maximum depth / diameter',x.maxDepthRatio||4,'number','min="0.1" step="any"')}`;if(isMetric()){for(const id of ['editNeckDiameter','editNoseRadius','editStickout']){let el=$(id);if(el)el.value=numShow(Number(el.value)*25.4,5)}}}
function renderMachineTools(){let host=$('machineTools');let selectedOps=[...document.querySelectorAll('.editOp:checked')].map(c=>c.value);let all=$('editAllTools').checked;host.replaceChildren();for(const t of db.tools.filter(t=>selectedOps.includes(t.op))){let label=document.createElement('label');label.className='check';let check=document.createElement('input');check.type='checkbox';check.className='machineTool';check.value=t.id;check.checked=all||working.toolIds?.includes(t.id);check.disabled=all;let text=document.createTextNode(t.name);label.append(check,text);host.append(label)}host.classList.toggle('hidden',all);}
function renderRangeTable(){
 const sub=rangeSubstrate,caption=SUBSTRATES.find(s=>s.id===sub)?.name||sub;
 const host=$('rangeTable');host.innerHTML=`<div class="rangewrap"><table><thead><tr><th>Cutter type</th><th>${esc(caption)} low</th><th>${esc(caption)} high</th></tr></thead><tbody id="rangeBody"></tbody></table></div>`;
 const body=$('rangeBody');for(const t of db.tools.filter(v=>v.op===rangeTab)){
  const r=working.ranges?.[t.id]||{},row=document.createElement('tr'),title=document.createElement('td');title.textContent=t.name;row.append(title);
  for(let b=0;b<2;b++){const td=document.createElement('td'),inp=document.createElement('input'),v=r[sub]?.[b];inp.type='number';inp.min='1';inp.max='100000';inp.step='any';inp.value=Number.isFinite(v)?(isMetric()?numShow(v*.3048,4):v):'';inp.placeholder='—';inp.className='rangeVal';inp.dataset.tool=t.id;inp.dataset.sub=sub;inp.dataset.bound=String(b);inp.setAttribute('aria-label',`${t.name} ${caption} ${b?'maximum':'minimum'} ${isMetric()?'m/min':'SFM'}`);td.append(inp);row.append(td)}body.append(row);
 }
}
function captureRanges(){if(dbTab!=='materials'||!working)return;working.ranges=working.ranges||{};
 const byTool={};document.querySelectorAll('.rangeVal').forEach(inp=>{const t=inp.dataset.tool,sub=inp.dataset.sub;if(!byTool[t])byTool[t]={sub,values:[null,null]};byTool[t].values[Number(inp.dataset.bound)]=inp.value.trim()===''?null:Number(inp.value)/(isMetric()?.3048:1);});
 for(const [id,data] of Object.entries(byTool)){
  const r=working.ranges[id]||(working.ranges[id]={});const [lo,hi]=data.values,sub=data.sub;
  const previous=r[sub];const unchanged=lo===null&&hi===null?!Array.isArray(previous):Array.isArray(previous)&&Math.abs(lo-previous[0])<.002&&Math.abs(hi-previous[1])<.002;
  if(unchanged)continue;
  if(lo===null&&hi===null){if(sub!=='carbide'&&sub!=='hss'){r[sub]=null;working.rangeSources=working.rangeSources||{};working.rangeSources[id]={...(working.rangeSources[id]||{}),[sub]:'custom-disabled'};}else delete r[sub];continue;}
  r[sub]=[lo,hi];working.rangeSources=working.rangeSources||{};working.rangeSources[id]={...(working.rangeSources[id]||{}),[sub]:'custom'};
 }
}
function dbFeedback(s,error=false){$('dbFlash').textContent=s;$('dbFlash').className='flash '+(error?'error':'success')}
function saveEditor(e){e.preventDefault();if(!working)return;let x=copy(working),name=$('editName').value.trim();if(!name){dbFeedback('Enter a name.',true);return}x.name=name.slice(0,140);x.note=($('editNote')?.value||'').trim().slice(0,1000);
 if(dbTab==='machines'){let rpm=number('editRpm'),hp=dbNum('editHp'),feed=dbNum('editFeed');let ops=[...document.querySelectorAll('.editOp:checked')].map(c=>c.value);if(!validPositive(rpm)||rpm>200000||!validPositive(hp)||!validPositive(feed)||!ops.length){dbFeedback('Set positive RPM, horsepower and feed values, and select at least one operation.',true);return}const sf=number('editSpeedFactor'),ff=number('editMachineFeedFactor');if(!(sf>=.05&&sf<=2&&ff>=.05&&ff<=2)){dbFeedback('Feed and speed multipliers must be between 0.05 and 2.00.',true);return;}x.speedFactor=sf;x.feedFactor=ff;x.manual=$('editManual').checked;x.category=$('editMachineCategory').value;x.codeList=$('editCodeList').value;x.rpm=Math.round(rpm);x.hp=hp;x.maxFeed=feed;x.ops=ops;if(x.category!=='millturn'){x.secondaryRpm=0;x.secondaryHp=0;x.liveRpm=0;x.liveHp=0;}for(const key of ['Secondary','Live']){let rv=number('edit'+key+'Rpm'),hv=dbNum('edit'+key+'Hp');if(!Number.isFinite(rv)||!Number.isFinite(hv)||rv<0||rv>200000||hv<0||hv>10000){dbFeedback('Enter valid secondary/live spindle values. Use zero when not fitted or not verified.',true);return;}if(x.category==='millturn'){x[key.toLowerCase()+'Rpm']=Math.round(rv);x[key.toLowerCase()+'Hp']=hv;}}const cApi=window.MachiningDeskSpindles;
 if(cApi){for(const kind of ['main','secondary','live']){const el=$('curve_'+kind);if(!el)continue;const f=cApi.rated(x,kind);try{const sampled=cApi.parse(el.value,f.rpm,f.hp);if(sampled)x[f.field]=sampled;else delete x[f.field];}catch(error){dbFeedback(kind+' spindle curve: '+error.message,true);return;}}}
 x.powerRatingBasis=$('editRatingBasis')?.value||'unspecified';x.driveEfficiency=Number($('editEfficiency')?.value||.85);x.idleHp=dbNum('editIdleHp');if(!(x.driveEfficiency>.05&&x.driveEfficiency<=1)||!(x.idleHp>=0&&x.idleHp<=100)){dbFeedback('Enter valid drive efficiency (0.05–1) and idle power (0–100 hp).',true);return;}
 if($('editAllTools').checked)x.toolIds=[];else{ x.toolIds=[...document.querySelectorAll('.machineTool:checked')].map(c=>c.value);if(!x.toolIds.length){dbFeedback('Select at least one compatible cutter type or enable all cutter types.',true);return}}}
 else if(dbTab==='tools'){let d=dbNum('editDiameter'),teeth=number('editTeeth'),load=dbNum('editLoad'),factor=number('editFactor');if(!validPositive(d)||d>100||!Number.isInteger(teeth)||teeth<1||teeth>500||!validPositive(load)||load>10||!validPositive(factor)||factor>3){dbFeedback('Check diameter, integer tooth count, chip load and SFM factor.',true);return}x.manufacturer=($('editManufacturer')?.value||'').trim().slice(0,100);x.partNumber=($('editPartNumber')?.value||'').trim().slice(0,140);x.grade=($('editGrade')?.value||'').trim().slice(0,100);x.insertCode=($('editInsertCode')?.value||'').trim().slice(0,90);x.holderModel=($('editHolderModel')?.value||'').trim().slice(0,100);x.preferredSubstrate=SUBS.includes($('editPreferredSubstrate')?.value)?$('editPreferredSubstrate').value:'';x.preferredCoating=db.coatings.some(c=>c.id===$('editPreferredCoating')?.value)?$('editPreferredCoating').value:'';x.sourceBasis=['user','manufacturer','shop'].includes($('editSourceBasis')?.value)?$('editSourceBasis').value:'user';x.sourceUrl=($('editToolSource')?.value||'').trim().slice(0,500);if(x.sourceUrl&&!/^https:\/\/[^\s/]+\.[^\s/]+(?:\/[^\s]*)?$/i.test(x.sourceUrl)){dbFeedback('Tool source must be an HTTPS URL, or left empty.',true);return;}if(x.sourceBasis==='manufacturer'&&!x.sourceUrl){dbFeedback('Manufacturer-verified records require a source URL.',true);return;}x.d=d;x.teeth=teeth;x.load=load;x.factor=factor;delete x.flute;delete x.useFlute;x.op=$('editOpSelect').value;if(x.op==='mill'){x.feedFactor=number('editToolFeedFactor');x.angle=number('editAngle');x.neckDiameter=dbNum('editNeckDiameter');if(!(x.feedFactor>=.1&&x.feedFactor<=1&&x.angle>0&&x.angle<180&&x.neckDiameter>0)){dbFeedback('Check milling tool geometry and feed multiplier.',true);return;}}else if(x.op==='turn'){x.noseRadius=dbNum('editNoseRadius');if($('editStickout'))x.stickout=dbNum('editStickout');}else{x.pointAngle=number('editPointAngle');x.maxDepthRatio=number('editMaxDepthRatio');} for(const k of ['slot','thin','hsm','groove','thread','ream'])x[k]=Boolean(document.querySelector(`[data-flag="${k}"]`)?.checked);if(x.op!=='mill'){x.slot=x.thin=x.hsm=false;}if(x.op!=='turn'){x.groove=x.thread=false;}if(x.op!=='drill'){x.ream=false;}if(x.groove&&x.thread){dbFeedback('A cutter type cannot be both a grooving tool and a threading tool.',true);return}}
 else if(dbTab==='materials'){captureRanges();x=copy(working);x.name=name.slice(0,140);x.group=$('editGroup').value;x.unitHp=dbNum('editHp');x.note=$('editNote').value.trim().slice(0,1000);
 if(x.group!==working.group)for(const t of db.tools){const ranges=x.ranges?.[t.id],sources=x.rangeSources?.[t.id];if(!ranges||!sources)continue;for(const sub of SUBS.slice(2))if(sources[sub]==='estimated-substrate'){delete ranges[sub];delete sources[sub];}}
 if(!validPositive(x.unitHp)||x.unitHp>100){dbFeedback('Enter a positive specific-power constant.',true);return}x.properties={};for(const [id,k] of [['editDensity','density'],['editModulus','modulus'],['editExpansion','alpha'],['editYield','yieldMpa'],['editTensile','tensileMpa'],['editConductivity','conductivity']]){const input=$(id);if(input?.value?.trim()){const entered=Number(input.value),value=(k==='yieldMpa'||k==='tensileMpa')&&unitPrefs.pressure==='psi'?entered/145.0377377:entered;if(!Number.isFinite(value)||value<0||(value===0&&k!=='alpha')||value>1e6){dbFeedback('Invalid '+k+' property value.',true);return}x.properties[k]=value;}}if($('editHardness')?.value?.trim())x.properties.hardness=$('editHardness').value.trim().slice(0,65);ensureSubstrateRanges({materials:[x],tools:db.tools});for(const t of db.tools){let r=x.ranges?.[t.id];if(!r){dbFeedback(`Missing speed ranges for ${t.name}.`,true);return}for(const s of SUBS){let a=r[s];if(s!=='carbide'&&s!=='hss'&&!a)continue;if(!Array.isArray(a)||a.length!==2||!a.every(validPositive)||a[0]>a[1]||a[1]>100000){dbFeedback(`Invalid ${s} range for ${t.name}. Enter positive min ≤ max.`,true);return}}}}
 else if(dbTab==='coatings'){x.groups=[...document.querySelectorAll('.coatGroup:checked')].map(el=>el.value);x.factor=number('editFactor');if(!validPositive(x.factor)||x.factor>3){dbFeedback('Multiplier must be between 0 and 3.',true);return}}
 let pos=db[dbTab].findIndex(x=>x.id===dbId);if(pos<0)return;db[dbTab][pos]=x;working=copy(x);persist();renderDbList();if(dbTab==='materials')renderRangeTable();dbFeedback('Saved. Changes now apply to the calculators.');}
function newEntry(){let x;if(dbTab==='machines')x={id:uid(),name:'New machine',category:dbGroup==='all'?'mill':dbGroup,ops:['mill','drill'],rpm:8000,hp:15,maxFeed:300,speedFactor:1,feedFactor:1,codeList:'none',toolIds:[],secondaryRpm:0,secondaryHp:0,liveRpm:0,liveHp:0,note:''};else if(dbTab==='tools')x={id:uid(),name:'New cutter type',op:dbGroup==='all'?'mill':dbGroup,factor:1,d:.5,teeth:4,load:.004,slot:false,thin:false,hsm:false,note:''};else if(dbTab==='materials'){let original=db.materials[0];x={id:uid(),name:'New material',group:dbGroup==='all'?'Other':dbGroup,unitHp:1,note:'Illustrative ranges; replace with verified tooling data.',ranges:{}};for(const t of db.tools){let base=original?.ranges?.[t.id]||{carbide:[200,400],hss:[50,90]};x.ranges[t.id]={carbide:copy(base.carbide),hss:copy(base.hss)}}}else x={id:uid(),name:'New coating',factor:1,groups:[],note:''};db[dbTab].push(x);if(dbTab==='materials')ensureSubstrateRanges(db);dbId=x.id;persist();renderDbList();renderEditor();}
function duplicateEntry(){let x=item(dbTab,dbId);if(!x)return;if(dbTab==='materials'){openMaterialCopy(x);return;}openGenericCopy(x);}
let genericCopyId=null,genericCopyTab=null;
function genericCopyField(k,label,value,kind='number',step='any'){return `<div><label for="copyGeneric_${k}">${esc(label)}</label><input id="copyGeneric_${k}" type="${kind}" ${kind==='number'?'step="'+step+'"':''} value="${esc(value??'')}" required></div>`;}
function openGenericCopy(src){genericCopyId=src.id;genericCopyTab=dbTab;let fields=genericCopyField('name','New name',src.name+' (copy)','text');
 if(dbTab==='machines'){
  fields+=genericCopyField('rpm','Main spindle maximum RPM',src.rpm, 'number','1')+genericCopyField('hp','Main spindle power (hp)',src.hp)+genericCopyField('maxFeed','Maximum feed (IPM)',src.maxFeed)+genericCopyField('speedFactor','Cutting speed multiplier',src.speedFactor??(src.manual?.8:1))+genericCopyField('feedFactor','Recommended feed multiplier',src.feedFactor??(src.manual?.8:1));
  if(machineGroup(src)==='millturn')fields+=genericCopyField('secondaryRpm','Secondary maximum RPM',src.secondaryRpm??0,'number','1')+genericCopyField('secondaryHp','Secondary power (hp)',src.secondaryHp??0)+genericCopyField('liveRpm','Live-tool maximum RPM',src.liveRpm??0,'number','1')+genericCopyField('liveHp','Live-tool power (hp)',src.liveHp??0);
  fields+=`<p class="help full">Machine type (${esc(machineGroup(src))}) and associated G/M code library (${esc(src.codeList||'none')}) are inherited. Change code-library assignment later in the main editor.</p>`;
 }else if(dbTab==='tools'){
  fields+=genericCopyField('d','Default diameter (in)',src.d)+genericCopyField('teeth','Flutes / teeth',src.teeth,'number','1')+genericCopyField('load','Default feed per tooth or revolution (in)',src.load)+genericCopyField('factor','SFM factor',src.factor);
  if(src.op==='mill')fields+=genericCopyField('feedFactor','Tool feed multiplier',src.feedFactor??1)+genericCopyField('angle','Included angle (degrees)',src.angle??60)+genericCopyField('neckDiameter','Neck diameter (in)',src.neckDiameter??Math.max(.001,src.d*.5));
  if(src.op==='turn')fields+=genericCopyField('noseRadius','Nose radius (in)',src.noseRadius??.03125)+genericCopyField('stickout','Overhang (in)',src.stickout??2);
  if(src.op==='drill')fields+=genericCopyField('pointAngle','Drill point angle (degrees)',src.pointAngle??118)+genericCopyField('maxDepthRatio','Max depth / diameter',src.maxDepthRatio??4);
  fields+=`<div class="full"><strong>Cutting flags (within inherited ${esc(OPS[src.op])} type)</strong><div class="toolchecks">${[['slot','Slotting'],['thin','Chip thinning'],['hsm','High-speed machining'],['groove','Grooving'],['thread','Threading'],['ream','Reamer']].filter(([k])=>src.op==='mill'?['slot','thin','hsm'].includes(k):src.op==='turn'?['groove','thread'].includes(k):k==='ream').map(([k,label])=>`<label class="check"><input type="checkbox" data-copy-flag="${k}" ${src[k]?'checked':''}>${label}</label>`).join('')}</div></div><p class="help full">Tool operation (${esc(OPS[src.op])}) cannot be changed in this copy dialog.</p>`;
 }else if(dbTab==='coatings')fields+=genericCopyField('factor','Coating SFM multiplier',src.factor)+`<div class="full"><strong>Recommended workpiece material families</strong><div class="toolchecks">${materialGroups().filter(g=>g!=='Other').map(g=>`<label class="check"><input type="checkbox" class="copyCoatGroup" value="${esc(g)}" ${(src.groups||[]).includes(g)?'checked':''}>${esc(g)}</label>`).join('')}</div></div>`;
 $('genericCopyTitle').textContent='Copy '+({machines:'machine',tools:'tool type',coatings:'coating'}[dbTab]);$('genericCopyFrom').textContent='From: '+src.name;
 $('genericCopyFields').innerHTML=fields;$('genericCopyError').textContent='';$('genericCopyLayer').classList.remove('hidden');$('copyGeneric_name').focus();$('copyGeneric_name').select();
}
function closeGenericCopy(){$('genericCopyLayer').classList.add('hidden');genericCopyId=null;genericCopyTab=null;}
document.querySelectorAll('[data-close-generic]').forEach(b=>b.addEventListener('click',closeGenericCopy));
$('genericCopyForm').addEventListener('submit',e=>{
 e.preventDefault();const tab=genericCopyTab,src=item(tab,genericCopyId);if(!src)return;
 if(db[tab].length>=500){$('genericCopyError').textContent='Maximum 500 entries per category.';return;}
 const x=copy(src),name=$('copyGeneric_name').value.trim();if(!name){$('genericCopyError').textContent='Enter a name.';return;}
 x.id=uid();x.name=name.slice(0,140);if(tab==='machines'){for(const kind of ['main','secondary','live']){const api=window.MachiningDeskSpindles, field=api?.rated(src,kind)?.field;if(field)x[field]=copy(api.points(src,kind));}x.allowCustomCurve=true;}const inputs=[...$('genericCopyFields').querySelectorAll('input[type=number]')];
 for(const field of inputs){const k=field.id.replace('copyGeneric_',''),n=Number(field.value);const zero=['secondaryRpm','secondaryHp','liveRpm','liveHp','noseRadius'].includes(k);const int=['rpm','secondaryRpm','liveRpm','teeth'].includes(k);
  if(field.value===''||!Number.isFinite(n)||n<(zero?0:0.00000001)||(int&&!Number.isInteger(n))||n>1000000){$('genericCopyError').textContent='Enter valid nonnegative settings; RPM and teeth must be integers.';return;}x[k]=n;}
 if(tab==='coatings')x.groups=[...$('genericCopyFields').querySelectorAll('.copyCoatGroup:checked')].map(n=>n.value);if(tab==='tools'){for(const n of $('genericCopyFields').querySelectorAll('[data-copy-flag]'))x[n.dataset.copyFlag]=n.checked;if(x.neckDiameter!=null&&x.neckDiameter<=0||x.angle!=null&&(x.angle<=0||x.angle>=180)||x.factor<=0||x.factor>3||x.feedFactor!=null&&(x.feedFactor<.1||x.feedFactor>1)||x.d<=0||x.teeth<1||x.load<=0){$('genericCopyError').textContent='Tool parameters are outside valid ranges.';return;}}
 if(tab==='machines'&&(!(x.speedFactor>=.05&&x.speedFactor<=2&&x.feedFactor>=.05&&x.feedFactor<=2))){$('genericCopyError').textContent='Machine feed and speed multipliers must be between 0.05 and 2.00.';return;}
 if(tab==='machines'&&(!(x.rpm>0&&x.hp>0&&x.maxFeed>0))){$('genericCopyError').textContent='Main spindle ratings must be positive.';return;}
 if(tab==='coatings'&&(!(x.factor>0&&x.factor<=3))){$('genericCopyError').textContent='Coating factor must be positive and ≤3.';return;}
 db[tab].push(x);if(tab==='tools')for(const mat of db.materials){mat.ranges=mat.ranges||{};if(!mat.ranges[x.id]){const baseline=mat.ranges[src.id]||{carbide:[200,400],hss:[50,90]};mat.ranges[x.id]=copy(baseline);mat.rangeSources=mat.rangeSources||{};mat.rangeSources[x.id]=Object.fromEntries(SUBS.filter(s=>Array.isArray(mat.ranges[x.id][s])).map(s=>[s,'custom']));}}
 dbId=x.id;persist();closeGenericCopy();renderDb();dbId=x.id;renderDbList();renderEditor();dbFeedback('Copied. Type and operation inherited from the source; changes saved.');
});
let materialCopyId=null;
function openMaterialCopy(m){materialCopyId=m.id;$('copyMaterialFrom').textContent='From: '+m.name;$('copyMaterialName').value=m.name+' (copy)';$('copyScale').value='1';$('copyError').textContent='';let sel=$('copyMaterialCategory');sel.replaceChildren();for(const g of materialGroups()){let el=document.createElement('option');el.value=g;el.textContent=g;sel.append(el)}const other=document.createElement('option');other.value='__new__';other.textContent='+ New category…';sel.append(other);sel.value=m.group||'Other';$('copyNewCategoryWrap').classList.add('hidden');$('copyNewCategory').value='';$('materialCopyLayer').classList.remove('hidden');$('copyMaterialName').focus();}
function closeMaterialCopy(){materialCopyId=null;$('materialCopyLayer').classList.add('hidden')}
$('copyMaterialCategory').addEventListener('change',()=>$('copyNewCategoryWrap').classList.toggle('hidden',$('copyMaterialCategory').value!=='__new__'));
document.querySelectorAll('[data-close-copy]').forEach(b=>b.addEventListener('click',closeMaterialCopy));
$('materialCopyForm').addEventListener('submit',e=>{e.preventDefault();const src=item('materials',materialCopyId);if(!src)return;const name=$('copyMaterialName').value.trim();const selected=$('copyMaterialCategory').value;const group=(selected==='__new__'?$('copyNewCategory').value:selected).trim();const scale=number('copyScale');
 if(!name||!group||!(scale>0&&scale<=100)||db.materials.length>=500){$('copyError').textContent='Provide a new name, material category, and positive scale up to 100.';return;}
 const n=copy(src);n.id=uid();n.name=name.slice(0,140);n.group=group.slice(0,60);n.rangeSources={};for(const [id,vals] of Object.entries(n.ranges||{})){for(const sub of SUBS){if(!Array.isArray(vals[sub]))continue;vals[sub]=vals[sub].map(v=>Math.max(1,Math.round(Number(v)*scale)));}n.rangeSources[id]=Object.fromEntries(SUBS.filter(s=>Array.isArray(vals[s])).map(s=>[s,'custom']));}
 if(Object.values(n.ranges).some(o=>SUBS.some(sub=>o[sub]?.some(v=>v>100000)))){$('copyError').textContent='Scaled SFM exceeds the supported 100,000 SFM limit.';return;}
 db.materials.push(n);dbId=n.id;dbGroup='all';persist();closeMaterialCopy();renderDb();dbId=n.id;renderDbList();renderEditor();dbFeedback('Material copied. All SFM ranges multiplied by '+scale+' and rounded; multiplier was not saved.');
});
function deleteEntry(){let x=item(dbTab,dbId);if(!x)return;if(db[dbTab].length<=1){dbFeedback('Keep at least one entry in each category.',true);return}if(!confirm(`Delete "${x.name}"? This also removes it from the calculators.`))return;db[dbTab]=db[dbTab].filter(v=>v.id!==dbId);if(dbTab==='tools'){for(const m of db.machines)if(Array.isArray(m.toolIds))m.toolIds=m.toolIds.filter(id=>id!==dbId);for(const mat of db.materials)if(mat.ranges)delete mat.ranges[dbId];}dbId=db[dbTab][0]?.id||null;persist();renderDbList();renderEditor();}
function inferRangesForTool(t){for(const m of db.materials){m.ranges=m.ranges||{};if(!m.ranges[t.id]){let base=m.ranges[Object.keys(m.ranges)[0]]||{carbide:[200,450],hss:[50,90]};m.ranges[t.id]={carbide:base.carbide.map(n=>Math.max(1,Math.round(n*t.factor))),hss:base.hss.map(n=>Math.max(1,Math.round(n*t.factor)))}}}ensureSubstrateRanges(db);}
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

// Common nominal series. Pipe designations are nominal sizes, not actual major diameters.
const INCH_THREADS=new Set(['un','bsw','bsp','npt','acme']);
const PIPE_SIZES={bsp:[['1/8',.383,28],['1/4',.518,19],['3/8',.656,19],['1/2',.825,14],['3/4',1.041,14],['1',1.309,11],['1-1/4',1.65,11],['1-1/2',1.882,11],['2',2.347,11]],npt:[['1/8',.405,27],['1/4',.540,18],['3/8',.675,18],['1/2',.840,14],['3/4',1.050,14],['1',1.315,11.5],['1-1/4',1.660,11.5],['1-1/2',1.900,11.5],['2',2.375,11.5]]};
const WHIT_SIZES=[['1/8',.125,40,40],['3/16',.1875,24,32],['1/4',.25,20,26],['5/16',.3125,18,22],['3/8',.375,16,20],['7/16',.4375,14,18],['1/2',.5,12,16],['9/16',.5625,12,16],['5/8',.625,11,14],['3/4',.75,10,12],['7/8',.875,9,11],['1',1,8,10]];
const ACME_SIZES=[[.25,16],[.375,12],[.5,10],[.625,8],[.75,6],[.875,6],[1,5],[1.25,5],[1.5,4],[1.75,4],[2,4]];
function threadChoices(){
 const series=$('threadSeries').value,sys=$('threadSystem').value;
 if(series==='custom')return [];
 if(sys==='un'){const index={coarse:2,fine:3,extra:4}[series];let choices=UN_DATA.filter(x=>x[index]!=null).map(x=>({major:x[1],pitch:x[index],name:`${x[0]}-${x[index]} ${series==='coarse'?'UNC':series==='fine'?'UNF':'UNEF/UN'}`}));if(series==='coarse')choices.unshift({major:.060,pitch:64,name:'#0-64 UNS (special)'});return choices;}
 if(sys==='metric'){let choices=[];for(const x of METRIC_DATA){let pitches=series==='coarse'?(x[1]==null?[]:[x[1]]):series==='fine'?x[2].slice(0,1):x[2].slice(1);for(const pitch of pitches)choices.push({major:x[0],pitch,name:`M${x[0]} × ${pitch}${series==='extra'?' (fine pitch)':''}`});}return choices;}
 if(sys==='bsw')return series==='extra'?[]:WHIT_SIZES.map(([label,major,coarse,fine])=>({major,pitch:series==='fine'?fine:coarse,name:`${label}–${series==='fine'?fine:coarse} ${series==='fine'?'BSF':'BSW'}`}));
 if(sys==='bsp'||sys==='npt')return series==='extra'?[]:(PIPE_SIZES[sys]||[]).map(([n,major,pitch])=>({major,pitch,name:`${n} ${sys==='bsp'?(series==='fine'?'BSPT (R)':'BSPP (G)'):(series==='fine'?'NPTF · dryseal nominal':'NPT')} · ${pitch} TPI`}));
 if(sys==='acme')return series==='coarse'?ACME_SIZES.map(([major,pitch])=>({major,pitch,name:`${major}–${pitch} ACME`})):[];
 return [];
}
let threadsOpened=false;
const THREAD_SAVE='machiningDeskThreading170';
function persistThreads(){const values={};for(const id of ['threadSide','threadSystem','threadSeries','threadPreset','threadMajor','threadPitch','threadPercent','threadTapType','enableThreeWire','wireAngle','wireStarts','wireCustomAngle','wireDiameter','wireMeasured','wireTargetPd']){const el=$(id);if(el)values[id]=el.type==='checkbox'?el.checked:el.value;}try{localStorage.setItem(THREAD_SAVE,JSON.stringify(values));}catch{}}
function threadSeriesName(sys,value,label){const labels={bsp:{coarse:'BSPP · Parallel (G)',fine:'BSPT · Taper (R)',extra:'Not applicable'},npt:{coarse:'NPT · Standard',fine:'NPTF · Dryseal',extra:'Not applicable'},bsw:{coarse:'BSW · Coarse',fine:'BSF · Fine',extra:'Not applicable'},acme:{coarse:'General purpose',fine:'Not applicable',extra:'Not applicable'}};return labels[sys]?.[value]||label;}
function threadRadioUI(){for(const [id,container] of [['threadSystem','threadSystemButtons'],['threadSeries','threadSeriesButtons']]){const select=$(id),host=$(container);host.innerHTML='';for(const o of select.options){let label=document.createElement('label');label.className='thread-radio';let inp=document.createElement('input');inp.type='checkbox';inp.checked=o.value===select.value;const sys=$('threadSystem').value;const inactive=id==='threadSeries'&&(sys==='acme'?['fine','extra'].includes(o.value):['bsw','bsp','npt'].includes(sys)&&o.value==='extra');inp.disabled=inactive;inp.setAttribute('aria-label',threadSeriesName(sys,o.value,o.textContent));inp.addEventListener('change',()=>{if(!inp.checked){inp.checked=true;return;}select.value=o.value;select.dispatchEvent(new Event('change',{bubbles:true}));});label.append(inp,document.createTextNode(id==='threadSeries'?threadSeriesName($('threadSystem').value,o.value,o.textContent):o.textContent));if(inp.disabled)label.classList.add('is-disabled');host.append(label);}}}
function syncThreadRadio(){threadRadioUI();}
function initThreads(){if(!threadsOpened){threadsOpened=true;let state={};try{state=JSON.parse(localStorage.getItem(THREAD_SAVE)||'{}')||{};}catch{}for(const id of ['threadSystem','threadSeries'])if(state[id]&&[...$(id).options].some(o=>o.value===state[id]))$(id).value=state[id];window.__mdLastThreadSystem=$('threadSystem').value;threadRadioUI();rebuildThreadPresets(false);if(!Object.keys(state).length){let found=threadChoices().findIndex(x=>x.major===.25&&x.pitch===20);if(found>=0)$('threadPreset').value=String(found);loadThreadPreset();}else{for(const [id,value] of Object.entries(state))if($(id)&&!['threadSystem','threadSeries'].includes(id)){if($(id).type==='checkbox')$(id).checked=Boolean(value);else if($(id).tagName==='SELECT'&&[...$(id).options].some(x=>x.value===value))$(id).value=value;else if(!['SELECT'].includes($(id).tagName))$(id).value=value;}const match=threadChoices().findIndex(x=>Math.abs(x.major-Number(state.threadMajor))<.00001&&Math.abs(x.pitch-Number(state.threadPitch))<.0001);if(match>=0){$('threadPreset').value=String(match);}else if(state.threadSeries!=='custom'&&threadChoices().length){$('threadPreset').value=String(Math.max(0,Math.min(threadChoices().length-1,Number(state.threadPreset)||0)));loadThreadPreset();}}syncThreadRadio();}renderThread();}
function rebuildThreadPresets(keep=true,priorMajor){const oldMajor=Number(priorMajor??$('threadMajor').value),choices=threadChoices();$('threadPreset').replaceChildren();for(let i=0;i<choices.length;i++){let o=document.createElement('option');o.value=String(i);o.textContent=choices[i].name;$('threadPreset').append(o);}const inch=INCH_THREADS.has($('threadSystem').value);$('threadPresetBox').classList.toggle('hidden',$('threadSeries').value==='custom');$('threadMajorUnit').textContent=inch?'in':'mm';$('threadPitchLabel').textContent=inch?'Threads per inch (TPI)':'Thread pitch (mm/rev)';const custom=$('threadSeries').value==='custom';$('threadMajor').readOnly=!custom;$('threadPitch').readOnly=!custom;if(custom){if(!(Number($('threadMajor').value)>0))$('threadMajor').value=inch?'.25':'10';if(!(Number($('threadPitch').value)>0))$('threadPitch').value=inch?'20':'1.5';}else if(choices.length){let ix=keep&&Number.isFinite(oldMajor)?choices.findIndex(x=>Math.abs(x.major-oldMajor)<1e-6):-1;if(ix<0&&Number.isFinite(oldMajor))ix=choices.reduce((best,x,i)=>Math.abs(x.major-oldMajor)<Math.abs(choices[best]?.major-oldMajor)?i:best,0);if(ix<0)ix=0;$('threadPreset').value=String(ix);loadThreadPreset();}else $('threadPresetBox').classList.add('hidden');syncThreadRadio();}
function loadThreadPreset(){const x=threadChoices()[Number($('threadPreset').value)];if(!x)return;$('threadMajor').value=x.major;$('threadPitch').value=x.pitch;renderThread();}
function renderSpecialThread(){const sys=$('threadSystem').value,inch=INCH_THREADS.has(sys),major=Number($('threadMajor').value),tpi=Number($('threadPitch').value),side=$('threadSide').value;if(!(major>0&&tpi>0)){ $('threadOutput').innerHTML='<div class="info err">Enter a positive nominal thread diameter and threads per inch.</div>';return;}const P=1/tpi,ang=({bsw:55,bsp:55,npt:60,acme:29})[sys]||60;const depth=ang===55?.640327*P:ang===29?.5*P:.6134345*P;const E=major-(ang===55?.640327*P:ang===29?.5*P:.649519*P);let info='';if(sys==='bsp'||sys==='npt')info='Pipe threads use nominal pipe sizes and may be tapered. Major diameter is approximately tabulated, and actual gauge-plane dimensions and tap drills depend on the standard, tolerance and engagement position. Do not use these values as inspection limits.';else if(sys==='acme')info='ACME 29°: basic pitch diameter and depth are approximate general-purpose geometric values; clearance, root flats, class, and exact tool profile are not modeled.';else info='Whitworth 55°: basic rounded-crest/root geometric approximations only; consult BS 84 limits and allowances.';$('threadOutput').innerHTML=`<div class="threadresult"><small>${sys.toUpperCase()} · ${ang}° included angle · ${side==='external'?'external':'internal'}</small><strong>${lengthPair(major)}</strong></div><div class="outputgrid">${threadValue('Nominal diameter',lengthPair(major))}${threadValue('Threads per inch',fmt(tpi,3)+' TPI')}${threadValue('Axial pitch',lengthPair(P))}${threadValue('Approx. basic pitch Ø',lengthPair(E))}${threadValue('Approx. radial depth',lengthPair(depth))}</div><p class="info warn">${info} ${side==='internal'?'No generic tap-drill recommendation is provided for these forms.':''}</p>`;if($('enableThreeWire').checked&&side==='external')window.MachiningDeskThreeWire?.render();}
function nearestDrill(d,inSystem){let entries=tapDrills.filter(x=>inSystem?(x.type!=='metric'):x.type==='metric');return entries.reduce((best,x)=>!best||Math.abs(x.in-d)<Math.abs(best.in-d)?x:best,null)}
function threadValue(label,val){return `<div class="outmetric"><small>${esc(label)}</small><strong>${esc(val)}</strong></div>`}
function lengthPair(v){return `${fmt(isMetric()?v*25.4:v,isMetric()?3:4)} ${units}`}
function renderThread(){if(!['un','metric'].includes($('threadSystem').value)){renderSpecialThread();return;}let side=$('threadSide').value,sys=$('threadSystem').value,major=safeNum($('threadMajor').value),pitchVal=safeNum($('threadPitch').value),percent=safeNum($('threadPercent').value);let out=$('threadOutput');if($('enableThreeWire').checked&&side==='external')window.MachiningDeskThreeWire?.render();$('tapControls').classList.toggle('hidden',side==='external');$('threadAnswerTitle').textContent=side==='external'?'External turning diameters':'Tap drill sizing';
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
// Reapply size-dependent default engagement and drill feed without overwriting custom axial cuts.
let lastDiameterValue=NaN;
function onToolDiameterChanged(){
 const current=getCalc('calcDiameter'),tool=item('tools',$('calcTool').value);if(!(current>0)||!tool)return;
 const previous=lastDiameterValue;
 if(op==='mill'){
  // Preserve the absolute programmed radial DOC; only the displayed percentage changes.
  if(!$('calcSlot').checked)nonSlotRdoc=getCalc('calcRdoc');
  if(previous>0&&Number.isFinite(previous)){
    const oldDefault=tool.id==='saw'?.75:Math.min(.5,Math.max(.001,previous*.5));
    if(Math.abs(getCalc('calcAdoc')-oldDefault)<1e-5){const now=tool.id==='saw'?.75:Math.min(.5,Math.max(.001,current*.5));setCalc('calcAdoc',now);}
  }
 }else if(op==='drill'&&!tool.tap){recommendFeed();if(tool.ream)setCalc('calcPriorHole',current*.96);}
 lastDiameterValue=current;
}
// UI wiring for the reference utilities
// Units dialog: selections are staged until Apply, and stored independently of the database.
const unitsLayer=$('unitsLayer'),unitSelect={length:'unitLength',force:'unitForce',pressure:'unitPressure',torque:'unitTorque',power:'unitPower'};
let focusBeforeUnits=null;
function closeUnits(){unitsLayer.classList.add('hidden');focusBeforeUnits?.focus?.();}
$('openUnits').addEventListener('click',()=>{focusBeforeUnits=document.activeElement;for(const [k,id] of Object.entries(unitSelect))$(id).value=k==='length'?units:unitPrefs[k];unitsLayer.classList.remove('hidden');$('unitLength').focus();});
unitsLayer.querySelectorAll('[data-units-close]').forEach(b=>b.addEventListener('click',closeUnits));
$('unitsForm').addEventListener('submit',ev=>{ev.preventDefault();let old={...unitPrefs,length:units};const next={};for(const [k,id] of Object.entries(unitSelect))next[k]=$(id).value;unitPrefs={...unitPrefs,...next};try{localStorage.setItem(UNIT_PREF_KEY,JSON.stringify(unitPrefs));}catch{};if(next.length!==units)setUnits(next.length);if(OPS[route]){ $('resultPowerLabel').textContent='Power · '+unitSymbol('power');calculate(); }if(route==='drillchart')window.MachiningDeskCharts?.render();window.dispatchEvent(new CustomEvent('machiningdesk:unit-preferences',{detail:{previous:old,current:getUnitPrefs()}}));closeUnits();});
unitsLayer.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeUnits()}});
window.addEventListener('machiningdesk:unit-preferences',event=>{if(route==='db')changeDbPreferences(event.detail.previous,event.detail.current);});
$('drillSearch').addEventListener('input',renderDrills);$('drillFilter').addEventListener('change',renderDrills);

$('threadSystem').addEventListener('change',()=>{const oldMajor=Number($('threadMajor').value),oldSys=window.__mdLastThreadSystem||'un';if(INCH_THREADS.has(oldSys)!==INCH_THREADS.has($('threadSystem').value))$('threadMajor').value=String(INCH_THREADS.has(oldSys)?oldMajor*25.4:oldMajor/25.4);window.__mdLastThreadSystem=$('threadSystem').value;if($('threadSystem').value==='acme'&&!['coarse','custom'].includes($('threadSeries').value)||['bsw','bsp','npt'].includes($('threadSystem').value)&&$('threadSeries').value==='extra')$('threadSeries').value='coarse';rebuildThreadPresets(true);syncThreadRadio();if($('enableThreeWire').checked){$('wireAngle').value=['bsw','bsp'].includes($('threadSystem').value)?'55':$('threadSystem').value==='acme'?'29':'60';$('wireDiameter').value='';$('wireMeasured').value='';$('wireTargetPd').value='';}renderThread();persistThreads();});
$('threadSeries').addEventListener('change',()=>{rebuildThreadPresets(true);syncThreadRadio();renderThread();persistThreads();});
$('threadPreset').addEventListener('change',()=>{loadThreadPreset();persistThreads();});
for(const id of ['threadMajor','threadPitch','threadPercent'])$(id).addEventListener('input',()=>{renderThread();persistThreads();});
$('threadTapType').addEventListener('change',()=>{$('threadPercent').value=$('threadTapType').value==='form'?'65':'75';renderThread();persistThreads();});
['threadSide','wireAngle','wireStarts','wireCustomAngle','wireDiameter','wireMeasured','wireTargetPd','enableThreeWire'].forEach(id=>$(id)?.addEventListener('change',persistThreads));
// Listeners
 document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
 $('expandResults').addEventListener('click',()=>{let open=$('expandedResults').classList.toggle('hidden');$('expandResults').setAttribute('aria-expanded',String(!open));updateExpandTitle()});
 $('calcMachine').addEventListener('change',machineChanged);$('calcSpindle').addEventListener('change',calculate);
 $('calcTool').addEventListener('change',()=>{setToolDefaults();if($('calcTool').value==='drill_countersink')resetCountersink();if($('calcPassMode').value!=='general')applyPassMode();updateToolFields();refreshPeck(true);recommendSpeed();lastDiameterValue=getCalc('calcDiameter');calculate()});
 $('calcPassMode').addEventListener('change',applyPassMode);
 $('calcPeck').addEventListener('input',()=>{peckCustom=true;calculate();});
for(const id of ['cskAngle','cskPilot','cskCutDiameter','cskDepth'])$(id).addEventListener('input',()=>{syncCountersink(id==='cskDepth'?'depth':'diameter');calculate()});
 $('resetPeck').addEventListener('click',()=>{peckCustom=false;refreshPeck(true);calculate();rememberMachining();});
 $('calcMaterialFamily').addEventListener('change',()=>{let family=$('calcMaterialFamily').value;const available=db.materials.filter(m=>m.group===family);setOptions($('calcMaterial'),available,available[0]?.id);sharedMaterial=$('calcMaterial').value;updateCoatingOptions();recommendFeed();recommendSpeed();calculate()});
 for(const id of ['calcSubstrate','calcCoating','calcMaterial'])$(id).addEventListener('change',()=>{if(id==='calcMaterial'){sharedMaterial=$('calcMaterial').value;updateCoatingOptions();}if(id==='calcSubstrate'){$('calcCoating').value='uncoated';updateCoatingOptions();}substrateInfo();refreshPeck();recommendFeed();recommendSpeed();calculate()});
 for(const id of ['calcDiameter','calcTeeth','calcSpeed','calcLoad','calcAdoc','calcHoleDepth','calcPriorHole','calcGrooveWidth','calcStickout','calcBarDiameter','calcNoseRadius','calcClamp'])$(id).addEventListener('input',()=>{if(id==='calcDiameter')onToolDiameterChanged();if(id==='calcDiameter'&&$('calcSlot').checked&&item('tools',$('calcTool').value)?.id!=='saw')setCalc('calcRdoc',getCalc('calcDiameter'));if(id==='calcDiameter')pctSetRdoc();if(id==='calcDiameter'){recommendFeed();refreshPeck();if($('calcTool').value==='drill_countersink')syncCountersink('diameter');}calculate()});
 for(const id of ['calcRdoc','calcSlot','calcThin','calcHsm'])$(id).addEventListener('input',()=>{
   if(id==='calcSlot'){if($('calcSlot').checked){const r=getCalc('calcRdoc');if(Number.isFinite(r)&&r>0)nonSlotRdoc=r;}else{const r=nonSlotRdoc;if(Number.isFinite(r)&&r>0)setCalc('calcRdoc',r);}}
   if(id==='calcRdoc'&&!$('calcSlot').checked){const r=getCalc('calcRdoc');if(Number.isFinite(r)&&r>0)nonSlotRdoc=r;}
   updateToolFields();if(id==='calcHsm'||id==='calcSlot')recommendSpeed();calculate()});
 $('calcRdocPct').addEventListener('input',()=>{let raw=$('calcRdocPct').value;pctApplyRdoc();if(!$('calcSlot').checked)nonSlotRdoc=getCalc('calcRdoc');updateToolFields();$('calcRdocPct').value=raw;calculate()});
 ['calcBarMaterial','calcBarInsertMaterial'].forEach(id=>$(id).addEventListener('change',()=>{calculate();rememberMachining();}));
 // One delegated listener covers dynamically created numeric/text inputs everywhere, including Database and engineering calculators.
 document.addEventListener('dblclick',event=>{let target=event.target;if(!(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement)||target.disabled||target.readOnly||!['number','text','search','tel','url'].includes(target.type))return;target.focus();try{target.select();}catch{}event.preventDefault();});
 for(const id of ['rpmOverride','feedOverride'])$(id).addEventListener('input',()=>{$(id+'Display').value=$(id).value+'%';calculate()});
 document.querySelectorAll('[data-override]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.override,slider=$(id),old=Number(slider.value);slider.value=b.dataset.reset==='true'?'100':String(Math.max(0,Math.min(200,old+Number(b.dataset.step))));slider.dispatchEvent(new Event('input',{bubbles:true}));}));
 document.querySelector('#calculatorPage')?.addEventListener('input',()=>queueMicrotask(rememberMachining));document.querySelector('#calculatorPage')?.addEventListener('change',()=>queueMicrotask(rememberMachining));
 $('resetCutterParams')?.addEventListener('click',()=>{setToolDefaults();updateToolFields();recommendSpeed();calculate();rememberMachining();});
 $('resetMachineParams')?.addEventListener('click',()=>{$('calcPassMode').value='general';$('calcSubstrate').value='carbide';$('calcCoating').value='uncoated';$('calcSlot').checked=false;$('calcThin').checked=false;$('calcHsm').checked=false;recommendFeed();recommendSpeed();calculate();rememberMachining();});
 $('resetThreadParams')?.addEventListener('click',()=>{$('threadSystem').value='un';$('threadSeries').value='coarse';$('threadTapType').value='cut';$('threadPercent').value='75';rebuildThreadPresets(false,.25);const found=threadChoices().findIndex(x=>Math.abs(x.major-.25)<.00001&&x.pitch===20);if(found>=0){$('threadPreset').value=String(found);loadThreadPreset();}syncThreadRadio();renderThread();persistThreads();});
 $('saveSetup').addEventListener('click',saveSetup);
 document.querySelectorAll('[data-db]').forEach(b=>b.addEventListener('click',()=>{dbTab=b.dataset.db;dbId=null;renderDb()}));
 $('dbSearch').addEventListener('input',renderDbList);
 $('dbEditor').addEventListener('input',event=>{if(!event.target.matches('textarea[id^="curve_"]'))return;const kind=event.target.id.replace('curve_',''),m={...working,rpm:Number($('editRpm')?.value)||0,hp:dbNum('editHp'),secondaryRpm:Number($('editSecondaryRpm')?.value)||0,secondaryHp:dbNum('editSecondaryHp'),liveRpm:Number($('editLiveRpm')?.value)||0,liveHp:dbNum('editLiveHp')};const api=window.MachiningDeskSpindles;const view=$('curvePreview_'+kind);if(!view)return;try{const r=api.rated(m,kind);const p=api.parse(event.target.value,r.rpm,r.hp);if(p)m[r.field]=p;else delete m[r.field];view.innerHTML=api.diagram(m,kind,null,units)}catch(err){view.textContent=err.message;}});
 $('dbForm').addEventListener('submit',e=>{let oldOp=item('tools',dbId)?.op;let oldId=dbId;saveEditor(e);if(dbTab==='tools'&&item('tools',oldId)&&$('dbFlash').classList.contains('success')){inferRangesForTool(item('tools',oldId));persist();}});
 $('addEntry').addEventListener('click',()=>{newEntry();if(dbTab==='tools'){inferRangesForTool(item('tools',dbId));persist()}});
 $('duplicateEntry').addEventListener('click',()=>duplicateEntry());
 $('deleteEntry').addEventListener('click',deleteEntry);
 $('exportData').addEventListener('click',()=>fileDownload('machining-desk-database.json',{...db,savedSetups:saves}));
 $('importData').addEventListener('click',()=>$('importFile').click());
 $('importFile').addEventListener('change',async e=>{let file=e.target.files?.[0];if(!file)return;try{let obj=safeImportedData(JSON.parse(await file.text()));if(!confirm('Import this database and replace your current data? Export a backup first if needed.'))return;db={machines:obj.machines,tools:obj.tools,materials:obj.materials,coatings:obj.coatings,chartFavorites:Array.isArray(obj.chartFavorites)?obj.chartFavorites:undefined};window.MachiningDeskExtendedMaterials?.merge(db);ensureSubstrateRanges(db);for(const m of db.machines){if(m.speedFactor==null)m.speedFactor=m.manual?.8:1;if(m.feedFactor==null)m.feedFactor=m.manual?.8:1;}if(Array.isArray(obj.savedSetups)){saves=obj.savedSetups.filter(s=>s&&OPS[s.op]&&s.values&&typeof s.name==='string').slice(0,75);persistSaves()}persist();dbId=null;renderDb();alert('Database imported.')}catch(err){alert('Import failed: '+err.message)}finally{e.target.value=''}});
 $('resetDatabase').addEventListener('click',()=>{if(!confirm('Restore all default database entries? This replaces your current database. Saved cutting setups are not deleted. Export a backup first if needed.'))return;db=freshData();persist();dbId=null;renderDb()});
 // Optionally migrate only user-created machines/materials from the earlier standalone app. Do not alter its storage.
 try{if(!localStorage.getItem(KEY)){let previous=JSON.parse(localStorage.getItem('machiningDeskData')||'null');if(previous){for(const m of previous.machines||[]){if(!m||!m.id||!m.name)continue;db.machines.push({id:uid(),name:m.name,ops:m.kind==='lathe'?['turn','drill']:['mill','drill'],rpm:Number(m.rpm)||8000,hp:Number(m.hp)||15,maxFeed:300,toolIds:[],note:'Imported from the earlier Machining Desk app; verify spindle and feed limits.'})}for(const mm of previous.materials||[]){if(!mm?.name)continue;const cl=Math.max(1,Number(mm.sfmCarbide)||250),hs=Math.max(1,Number(mm.sfmHss)||80);db.materials.push({id:uid(),name:mm.name,group:'Other',unitHp:Number(mm.unitHp)||1,note:'Imported older material. Ranges are generated around the former single-speed values.',ranges:makeRanges(cl*.8,cl*1.2,hs*.8,hs*1.2,db.tools)})}persist()}}}catch{}
 function importCommunity(category,record,sourceId,approvedAt){
   if(!['machines','tools','materials','coatings'].includes(category))throw Error('Unsupported community entry category.');
   if(!record||typeof record.name!=='string'||!record.name.trim()||!sourceId||typeof sourceId!=='string')throw Error('Invalid community entry.');
   if(db[category].some(x=>x.communitySourceId===sourceId))return 'Already in your personal library.';
   if(db[category].length>=500)throw Error('Personal database is full (500 entries per category).');
   const x=copy(record);
   x.id=uid();x.name=x.name.slice(0,140);x.communitySourceId=sourceId;
   x.communityApprovedAt=typeof approvedAt==='string'?approvedAt:'';
   x.note=((x.note||'').slice(0,700)+'\nCommunity reviewed entry — verify the exact tooling and machine specifications before use.').trim();
   if(category==='machines'){
     // Tool IDs from somebody else's library do not map to our local cutter IDs.
     x.toolIds=[];x.codeList=['none','vf','umc','st'].includes(x.codeList)?x.codeList:'none';
     if(!Array.isArray(x.ops)||!x.ops.every(o=>OPS[o])||!(Number(x.rpm)>0&&Number(x.hp)>0&&Number(x.maxFeed)>0))throw Error('Invalid machine specifications.');
   } else if(category==='tools') {
     if(!OPS[x.op]||!(Number(x.d)>0&&Number(x.teeth)>0&&Number(x.load)>0&&Number(x.factor)>0))throw Error('Invalid cutting tool data.');
   } else if(category==='materials') {
     if(!(Number(x.unitHp)>0)||!x.ranges||typeof x.ranges!=='object')throw Error('Invalid material data.');
   } else if(!(Number(x.factor)>0))throw Error('Invalid coating data.');
   db[category].push(x);
   if(category==='tools')inferRangesForTool(x);
   if(category==='materials')ensureSubstrateRanges(db);
   if(!persist())throw Error('Could not save personal database.');
   dbId=x.id;dbGroup='all';
   if(route==='db'){dbTab=category;renderDb();}
   return 'Added '+x.name+' to your personal database. Review its values in Database before machining.';
 }
 window.MachiningDeskIntegration={getCutSnapshot:()=>latestCutSnapshot?copy(latestCutSnapshot):null,getUnits:()=>units,getUnitPrefs,getDb:()=>db,saveDb:()=>persist(),importCommunity,showChart,showDrills:renderDrills,selectDbTab:(tab)=>{dbTab=tab;dbId=null;renderDb()},openDbEntry:(tab,id)=>{if(!db[tab]?.some(x=>x.id===id))return false;dbTab=tab;dbId=id;navigate('db');return true;},navigate};navigate('home');$('resultPowerLabel').textContent='Power · '+unitSymbol('power');renderSaves();try{if(unitPrefs.length==='mm'||(!localStorage.getItem(UNIT_PREF_KEY)&&localStorage.getItem('machiningDeskUnits')==='mm'))setUnits('mm')}catch{}
})();
