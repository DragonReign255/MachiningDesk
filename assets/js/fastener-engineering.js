/* Preliminary fastener preload and tapped-thread engagement estimator.
   Based on T=KFD and simplified thread shear-area screening; NOT joint design. */
(()=>{'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(n,p=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:p}):'—';
const grades={
 'sae2':{name:'SAE J429 Grade 2 (≤¾ in; illustrative)',proof:379,yield:393,ultimate:510,E:205000,series:'un'},
 'sae5':{name:'SAE J429 Grade 5 (≤1 in)',proof:586,yield:635,ultimate:827,E:205000,series:'un'},
 'sae8':{name:'SAE J429 Grade 8 (≤1½ in)',proof:827,yield:896,ultimate:1034,E:205000,series:'un'},
 'm46':{name:'ISO 898-1 class 4.6',proof:225,yield:240,ultimate:400,E:205000,series:'metric'},
 'm88':{name:'ISO 898-1 class 8.8 (≤ M16)',proof:580,yield:640,ultimate:800,E:205000,series:'metric'},
 'm109':{name:'ISO 898-1 class 10.9',proof:830,yield:940,ultimate:1040,E:205000,series:'metric'},
 'm129':{name:'ISO 898-1 class 12.9',proof:970,yield:1100,ultimate:1220,E:205000,series:'metric'},
 'a270':{name:'ISO 3506 A2-70 stainless (illustrative minimum)',proof:450,yield:450,ultimate:700,E:193000,series:'metric'}
};
const references={nasa:'https://ntrs.nasa.gov/api/citations/19900009424/downloads/19900009424.pdf',nasaTorque:'https://www.nasa.gov/wp-content/uploads/2025/06/mechanicalfastenertorqueguidelines.pdf',iso:'https://www.bossard.com/global-en/-/media/bossard-group/website/documents/technical-resources/en/f-009-en.pdf'};
const presets=window.MachiningDeskReferences;
let host,lib,state={system:'un',series:'coarse',size:'0.5',major:0.5,pitch:13,grade:'sae5',boltMaterial:'grade',hostMaterial:'mat_0',engagement:0.75,k:0.20,target:65,sf:2};
function persist(){try{localStorage.setItem('md-fastener-v190',JSON.stringify(state));}catch{}}
function readState(){try{let old=JSON.parse(localStorage.getItem('md-fastener-v190')||'null');if(old&&typeof old==='object')state={...state,...old};}catch{}}
function field(name,label,value,opts={}){let el=opts.options?`<select id="ft${name}">${opts.options.map(([v,t])=>`<option value="${E(v)}" ${String(v)===String(value)?'selected':''}>${E(t)}</option>`).join('')}</select>`:`<input id="ft${name}" type="number" step="any" inputmode="decimal" value="${E(value)}" ${opts.min?`min="${opts.min}"`:''}>`;return `<div><label for="ft${name}">${label}</label>${el}</div>`}
const standardSets=()=>state.system==='un'?presets.UN_DATA.map(r=>({name:r[0],d:r[1],coarse:r[2],fine:r[3],extra:r[4]})):presets.METRIC_DATA.map(r=>({name:'M'+r[0],d:r[0],coarse:r[1],fine:r[2]?.[0],extra:r[2]?.[1]}));
function standardPitch(row){const p=row?.[state.series]||row?.coarse||row?.fine;return p||null}
function refreshPreset(){const rows=standardSets();const index=rows.findIndex(r=>String(r.d)===String(state.size));const hit=rows[index]||rows.find(r=>state.system==='un'?r.d===.5:r.d===8)||rows[0];if(!hit)return;state.size=String(hit.d);state.major=hit.d;const pitch=standardPitch(hit);if(pitch)state.pitch=pitch;}
function draw(){const metric=state.system==='metric';const rows=standardSets();const opts=rows.map(r=>[r.d,r.name]);opts.push(['custom','Custom diameter and pitch']);const gradeOpts=Object.entries(grades).filter(([k,v])=>v.series===state.system).map(([k,v])=>[k,v.name]);if(!gradeOpts.some(v=>v[0]===state.grade))state.grade=gradeOpts[0][0];
 const mats=lib.materials.map(m=>[m.id,m.name]);const bolts=[['grade','Selected standardized steel/stainless grade'],...mats.map(([id,n])=>[id,'Database: '+n])];
 host.innerHTML=`<h2>Threaded fasteners · strength & torque</h2><p class="subtitle">Size/grade reference and <strong>preliminary</strong> torque/preload estimate for a bolt threaded into a selected material. Includes a simplified tapped-hole stripping screen; it is not a guaranteed safe torque or certified joint design.</p>
 <label>Thread system</label><div class="fastener-choice" role="radiogroup" aria-label="Thread system"><label><input type="radio" name="fastSystem" value="un" ${!metric?'checked':''}>UNC / UNF / UNEF · inch</label><label><input type="radio" name="fastSystem" value="metric" ${metric?'checked':''}>ISO metric M</label></div>
 <label>Pitch series</label><div class="fastener-choice" role="radiogroup" aria-label="Pitch series">${[['coarse','Coarse'],['fine','Fine'],['extra','Extra fine'],['custom','Custom']].map(([v,t])=>`<label><input type="radio" name="fastSeries" value="${v}" ${state.series===v?'checked':''}>${t}</label>`).join('')}</div>
 <div class="fastener-controls">${field('Size','Nominal thread size',state.series==='custom'?'custom':state.size,{options:opts})}${field('Major','Major thread diameter ('+(metric?'mm':'in')+')',state.major,{min:'.001'})}${field('Pitch',metric?'Pitch (mm/rev)':'Threads per inch (TPI)',state.pitch,{min:'.001'})}${field('Grade','Steel fastener grade / class',state.grade,{options:gradeOpts})}${field('BoltMaterial','Fastener material',state.boltMaterial,{options:bolts})}${field('HostMaterial','Internal thread / tapped material',state.hostMaterial,{options:mats})}${field('Engagement','Full thread engagement ('+(metric?'mm':'in')+')',state.engagement,{min:'.001'})}${field('K','Assumed nut factor K · dimensionless',state.k,{min:'.01'})}${field('Target','Requested proof-load preload (%)',state.target,{min:'1'})}${field('SF','Minimum thread-stripping factor',state.sf,{min:'1'})}</div>
 <div class="btnrow" style="margin-top:14px"><button class="btn" id="ftReset" type="button">Reset joint assumptions</button></div>
 <div id="ftOut" class="fastener-stats" aria-live="polite"></div>
 <p class="sourcehint"><b>Standards basis:</b> SAE J429 / ISO 898-1 grade property references and Unified/ISO 60° thread stress-area approximation. See <a href="${references.iso}" target="_blank" rel="noopener noreferrer">Bossard fastener properties ↗</a>, <a href="${references.nasa}" target="_blank" rel="noopener noreferrer">NASA Fastener Design Manual ↗</a>, and <a href="${references.nasaTorque}" target="_blank" rel="noopener noreferrer">NASA torque guidelines ↗</a>. The material property defaults are approximate and may be unsuitable for design.</p>`;
 for(const el of host.querySelectorAll('input[name="fastSystem"]'))el.addEventListener('change',()=>{state.system=el.value;state.series='coarse';state.grade=el.value==='un'?'sae5':'m88';state.size=el.value==='un'?'0.5':'8';refreshPreset();state.engagement=state.system==='un'?.75:18;draw();calc();persist();});
 for(const el of host.querySelectorAll('input[name="fastSeries"]'))el.addEventListener('change',()=>{state.series=el.value;if(state.series!=='custom')refreshPreset();draw();calc();persist();});
 for(const id of ['Size','Major','Pitch','Grade','BoltMaterial','HostMaterial','Engagement','K','Target','SF']){let el=document.getElementById('ft'+id);el.addEventListener('change',()=>{let key=id[0].toLowerCase()+id.slice(1);if(id==='Size'){state.size=el.value;if(el.value==='custom')state.series='custom';else refreshPreset();draw();}else{state[key]=el.type==='number'?Number(el.value):el.value;if(id==='Major'||id==='Pitch'){state.series='custom';host.querySelector('input[name="fastSeries"][value="custom"]').checked=true;}}calc();persist()});if(el.type==='number')el.addEventListener('input',()=>{state[id[0].toLowerCase()+id.slice(1)]=Number(el.value);calc();});}
 document.getElementById('ftReset').addEventListener('click',()=>{let sys=state.system;state={system:sys,series:'coarse',size:sys==='un'?'0.5':'8',grade:sys==='un'?'sae5':'m88',boltMaterial:'grade',hostMaterial:'mat_0',engagement:sys==='un'?.75:18,k:.2,target:65,sf:2};refreshPreset();draw();calc();persist();});
}
function outMetric(name,val){return `<div class="outmetric"><small>${E(name)}</small><strong>${E(val)}</strong></div>`;}
function calc(){const display=document.getElementById('ftOut');if(!display)return;
const metric=state.system==='metric',d=metric?Number(state.major):Number(state.major)*25.4,p=metric?Number(state.pitch):25.4/Number(state.pitch),Le=metric?Number(state.engagement):Number(state.engagement)*25.4;
const k=Number(state.k),target=Number(state.target),sf=Number(state.sf),grade=grades[state.grade];const hostMat=lib.materials.find(m=>m.id===state.hostMaterial),boltMat=lib.materials.find(m=>m.id===state.boltMaterial);
const hostProps=hostMat?window.MachiningDeskMaterialProperties.get(hostMat):null,boltProps=boltMat?window.MachiningDeskMaterialProperties.get(boltMat):null;
const isCustom=!!boltProps,proof=grade?.proof,sy=isCustom?Number(boltProps.yieldMpa):grade?.yield,su=isCustom?Number(boltProps.tensileMpa):grade?.ultimate,elasticModulus=isCustom?Number(boltProps.modulus)*1000:grade?.E;
const hostYield=Number(hostProps?.yieldMpa),boltProof=isCustom?.9*sy:proof;
const errors=[];if(![d,p,Le,k,target,sf].every(Number.isFinite)||d<=0||p<=0||p>=d*.5||Le<=0||k<=0||target<=0||target>100||sf<1)errors.push('Enter a positive diameter/pitch, nonzero engagement, nut factor, 1–100% proof-load target, and a thread safety factor ≥ 1.');if(!Number.isFinite(sy)||sy<=0||!Number.isFinite(su)||su<=0||!Number.isFinite(boltProof)||boltProof<=0||!Number.isFinite(elasticModulus)||elasticModulus<=0)errors.push('Bolt material strength/modulus missing or unsuitable. Enter verified properties in Database.');if(!Number.isFinite(hostYield)||hostYield<=0)errors.push('Tapped material has no meaningful tensile yield-strength estimate. Supply verified thread shear data / yield values instead.');
if(errors.length){display.innerHTML='<div class="fastener-warning">'+errors.map(E).join('<p>')+'</div>';return;}
// Tensile stress area: metric equivalent of A_s=pi/4 (d - 0.9382 P)^2; valid for 60-degree threads only.
const as=Math.PI/4*(d-.9382*p)**2,dp=d-.64952*p,di=d-1.08253*p;
// Thread shear: effective area = pi * mean pitch diameter * engaged length * 0.5;
// This is a deliberately simplified screening assumption, not ASME B1.1 / VDI 2230 strip capacity.
const aShear=Math.PI*dp*Le*.5;
const boltShear=.57735*sy*aShear,hostShear=.57735*hostYield*aShear;
const proofForce=as*boltProof,yieldForce=as*sy,ultimateForce=as*su,hostCeiling=hostShear/sf,boltStripCeiling=boltShear/sf;
const preload=Math.min(proofForce*target/100,hostCeiling,boltStripCeiling),limit=preload===hostCeiling?'Tapped material thread-stripping screen':preload===boltStripCeiling?'External bolt thread-stripping screen':'Requested proof-load fraction';
const torqueNm=k*d/1000*preload,boltYieldStrain=sy/elasticModulus;
const hostAssumed=hostProps?.basis||'unknown',boltAssumed=boltProps?.basis||'grade specification';
const unitTorque=metric?fmt(torqueNm,2)+' N·m':fmt(torqueNm*8.85074579,1)+' lbf·in ('+fmt(torqueNm*.737562,2)+' lbf·ft)';
const force=v=>metric?fmt(v,0)+' N':fmt(v*.224809,0)+' lbf';
display.innerHTML=`<div class="outputgrid">${outMetric('Preliminary tightening torque ceiling',unitTorque)}${outMetric('Estimated achieved preload',force(preload))}${outMetric('Limiting assumption',limit)}${outMetric('Bolt tensile stress area',metric?fmt(as,2)+' mm²':fmt(as/645.16,5)+' in²')}${outMetric('Proof load · bolt',force(proofForce))}${outMetric('Yield load · bolt',force(yieldForce))}${outMetric('Tensile failure load · nominal',force(ultimateForce))}${outMetric('Estimated elastic yield strain',fmt(boltYieldStrain*100,3)+'%')}${outMetric('Bolt minimum yield stress',fmt(sy,0)+' MPa')}${outMetric('Ultimate tensile stress',fmt(su,0)+' MPa')}${outMetric('Thread shear area · simplified',fmt(aShear,1)+' mm²')}${outMetric('Internal thread stripping screen / SF',force(hostCeiling))}${outMetric('External thread stripping screen / SF',force(boltStripCeiling))}${outMetric('Theoretical pitch / minor Ø',fmt(dp,2)+' / '+fmt(di,2)+' mm')}</div>
<div class="fastener-warning"><strong>NOT a certified safe torque:</strong> This preliminary ceiling assumes T = K × F × d with K=${fmt(k,3)}, ~50% effective 60° thread shear area and safety factor ${fmt(sf,2)} on stripping. A different finish, oil, washer, thread tolerance, insert, engagement, blind-hole bottoming, or plastic creep can change allowable torque dramatically. No head failure, bending, combined loading, fatigue, bearing stress, preload scatter or temperature effects are modeled. ASTM/ISO grade limits vary by diameter. <b>Check bolt and threaded-hole manufacturer data, actual grip and joint requirements before tightening.</b><p>Input property provenance: tapped material — ${E(hostAssumed)}; bolt — ${E(boltAssumed)}. Typical handbook values for a named alloy/condition are <b>not</b> minimum guaranteed design allowables. Bolt proof limit here is ${isCustom?'a 90% yield proxy (not certified proof strength)':'a reference grade value'}.</p></div>`;
}
function mount(el,data){host=el;lib=data;readState();if(!['un','metric'].includes(state.system))state.system='un';draw();calc();}
window.MachiningDeskFasteners={mount};
})();
