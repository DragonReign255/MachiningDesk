/* Steel-only approximate hardness conversion, sampled from public E140-reference summaries.
   These are interpolated engineering estimates, not ASTM-certified conversion tables. */
(()=>{'use strict';
const limits={HRC:[20,65],HRB:[40,100],HRA:[55,84],HBW:[105,740],HV:[110,850]};
const cols=["HRC","HRB","HRA","HBW","HV"];
// Columns are HV, HRC, HRB, HRA, HBW. Null = not an established conversion at that hardness.
const rows=[
[110,null,62,null,105],[125,null,72,null,120],[150,null,80,null,143],
[160,null,81,50,153],[184,null,88,54,176],[196,null,91,56,190],
[213,15,94,57.5,205],[238,20,97,60.5,222],[254,23,100,62,240],
[272,26,null,63.3,258],[302,30,null,65.3,286],[336,34,null,67.4,319],
[354,36,null,68.4,336],[392,40,null,70.4,371],[446,45,null,73.1,421],
[513,50,null,75.9,475],[595,55,null,78.5,560],[697,60,null,81.2,654],
[832,65,null,83.9,739]
];
const hvFrom=(scale,val)=>{const idx={HV:0,HRC:1,HRB:2,HRA:3,HBW:4}[scale];if(scale==='HV')return val;const ordered=rows.filter(r=>r[idx]!=null).sort((a,b)=>a[idx]-b[idx]);if(val<ordered[0][idx]||val>ordered.at(-1)[idx])return NaN;for(let i=1;i<ordered.length;i++){const a=ordered[i-1],b=ordered[i];if(val<=b[idx])return a[0]+(b[0]-a[0])*(val-a[idx])/(b[idx]-a[idx]);}return NaN;};
const fromHV=(scale,hv)=>{const idx={HV:0,HRC:1,HRB:2,HRA:3,HBW:4}[scale];if(scale==='HV')return hv;const relevant=rows.filter(r=>r[idx]!=null);if(hv<relevant[0][0]||hv>relevant.at(-1)[0])return NaN;for(let i=1;i<relevant.length;i++){const a=relevant[i-1],b=relevant[i];if(hv<=b[0])return a[idx]+(b[idx]-a[idx])*(hv-a[0])/(b[0]-a[0]);}return NaN;};
const saved=()=>{try{return JSON.parse(localStorage.getItem('machiningDeskHardness170')||'null')}catch{return null}};
function render(host){let state=saved()||{scales:['HRC','HV','HBW'],scale:'HRC',value:40};const allowed=(n)=>cols.map(c=>`<option value="${c}" ${n===c?'selected':''}>${c}</option>`).join('');host.innerHTML=`<h2>Hardness conversion</h2><p class="subtitle">Enter a value in any row; the other selected scales update. Set a row to None to hide that conversion.</p><div id="hardnessRows" class="hardness-rows">${[0,1,2].map(i=>`<div class="hardness-row"><label for="hardScale${i}">Scale ${i+1}</label><select id="hardScale${i}"><option value="">None</option>${allowed(state.scales?.[i]||'')}</select><input type="number" id="hardValue${i}" step="any" placeholder="Hardness" aria-label="Hardness reading ${i+1}"></div>`).join('')}</div><div id="hardnessMessage" class="sourcehint" role="status"></div><p class="sourcehint">Approximate interpolation for <b>carbon/alloy/tool steels only</b>. ASTM E140 conversions depend on material and heat treatment; outputs are <b>not suitable for acceptance testing</b>. Rockwell B and C have different practical operating ranges. Reference: <a href="https://store.astm.org/e0140-12be01.html" target="_blank" rel="noopener noreferrer">ASTM E140 steel conversion tables ↗</a>. Approximate samples are not a licensed reproduction of ASTM tables.</p>`;
 const selects=[0,1,2].map(i=>host.querySelector('#hardScale'+i)),boxes=[0,1,2].map(i=>host.querySelector('#hardValue'+i)),msg=host.querySelector('#hardnessMessage');
 const store=(index,value)=>{try{localStorage.setItem('machiningDeskHardness170',JSON.stringify({scales:selects.map(x=>x.value),scale:selects[index]?.value||'HRC',value}))}catch{}};
 function convert(index){let scale=selects[index].value,value=Number(boxes[index].value);if(!scale||boxes[index].value.trim()===''){msg.textContent='Enter a hardness value to convert.';boxes.forEach((b,i)=>{if(i!==index)b.value=''});return;}let [lo,hi]=limits[scale];if(!Number.isFinite(value)||value<lo||value>hi){msg.innerHTML=`<span class="flash error">${scale} must be between ${lo} and ${hi} for this converter.</span>`;boxes.forEach((b,i)=>{if(i!==index)b.value=''});return;}
 const hv=hvFrom(scale,value);if(!Number.isFinite(hv)){msg.textContent='This hardness cannot be converted reliably using the available steel reference points.';boxes.forEach((b,i)=>{if(i!==index)b.value=''});return;}
 let unavailable=[];for(let i=0;i<3;i++){if(i===index)continue;const target=selects[i].value;if(!target){boxes[i].value='';continue;}const converted=fromHV(target,hv),range=limits[target];if(!Number.isFinite(converted)||converted<range[0]||converted>range[1]){boxes[i].value='';boxes[i].placeholder='Out of range';unavailable.push(target);}else{boxes[i].placeholder='Hardness';boxes[i].value=String(Number(converted.toFixed(1)));}}
 msg.innerHTML=unavailable.length?`<span class="flash error">Outside the supported conversion range for ${unavailable.join(', ')}; those outputs are intentionally blank.</span>`:'Estimated equivalent hardness for non-austenitic steel. Verify against the correct alloy-specific test standard.';store(index,value);
 }
 for(let i=0;i<3;i++){boxes[i].addEventListener('input',()=>convert(i));selects[i].addEventListener('change',()=>{const chosen=selects[i].value;if(chosen)for(let k=0;k<3;k++)if(k!==i&&selects[k].value===chosen)selects[k].value='';let active=boxes.findIndex(b=>b.value.trim()!=='');if(active<0)active=i;convert(active)});}
 let source=selects.findIndex(x=>x.value===state.scale);if(source<0)source=selects.findIndex(x=>x.value);if(source>=0){boxes[source].value=String(state.value??40);convert(source);}else msg.textContent='Select at least one hardness scale.';
}
window.MachiningDeskHardness={render,limits};
})();
