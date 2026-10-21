/* External-thread three-wire measurement. Uses simplified axial-section formula.
   M = E + W(1+csc(A/2)) - (P/2)cot(A/2).
   This neglects lead-angle, wire deformation and measuring force corrections.
*/
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const num=id=>{let v=$(id).value;return v.trim()===''?NaN:(window.MachiningDeskInputs?.parse(v,id)??Number(v))};
const ok=v=>Number.isFinite(v)&&v>0;
const show=(x,n=5)=>Number.isFinite(x)?x.toLocaleString('en-US',{minimumFractionDigits:n,maximumFractionDigits:n}):'—';
let ready=false;
function terms(){const sys=$('threadSystem').value,major=num('threadMajor'),input=num('threadPitch');if(!ok(major)||!ok(input))return null;
 const p=sys!=='metric'?1/input:input/25.4, D=sys!=='metric'?major:major/25.4;
 const a=$('wireAngle').value==='custom'?num('wireCustomAngle'):Number($('wireAngle').value);
 const starts=num('wireStarts');if(!ok(p)||!ok(D)||!Number.isFinite(a)||a<10||a>120||!Number.isInteger(starts)||starts<1||starts>24||D<=.25*p)return null;
 const half=a*Math.PI/360,wireBest=p/(2*Math.cos(half));
 const actualWire=num('wireDiameter'),wire=ok(actualWire)?(sys!=='metric'?actualWire:actualWire/25.4):wireBest;
 if(!ok(wire)||wire>D*2)return null;
 const factor=1+1/Math.sin(half),pitchFactor=.5/Math.tan(half),term=wire*factor-p*pitchFactor;
 // Basic pitch diameter is defined for ISO/Unified 60° form only; it is not a tolerance limit.
 const basic=Math.abs(a-60)<1e-8?D-.649519052838*p:Math.abs(a-55)<1e-8?D-.640327*p:(Math.abs(a-29)<1e-8||Math.abs(a-30)<1e-8)?D-.5*p:NaN;
 const explicit=num('wireTargetPd');const target=ok(explicit)?(sys!=='metric'?explicit:explicit/25.4):basic;
 const measured=num('wireMeasured'),M=ok(measured)?(sys!=='metric'?measured:measured/25.4):NaN;
 const actualPd=Number.isFinite(M)?M-term:NaN;
 const leadAngle=Number.isFinite(target)&&target>0?Math.atan(starts*p/(Math.PI*target))*180/Math.PI:NaN;
 return {sys,major:D,p,a,starts,wireBest,wire,actualPd,target,measured:M,term,leadAngle,hasActualWire:ok(actualWire),hasTarget:ok(explicit),rangeMin:.505182*p,rangeMax:1.010363*p};
}
function displayDim(x,sys,dec=5){return Number.isFinite(x)?show(x*(sys!=='metric'?1:25.4),sys!=='metric'?dec:Math.max(3,dec-2))+' '+(sys!=='metric'?'in':'mm'):'—';}
function box(label,text){return `<div class="outmetric"><small>${label}</small><strong>${text}</strong></div>`}
function render(){if(!ready)return;const o=$('wireOutput'),t=terms();document.querySelectorAll('.wireUnit').forEach(el=>el.textContent=$('threadSystem').value==='un'?'in':'mm');$('wireCustomAngleBox').classList.toggle('hidden',$('wireAngle').value!=='custom');
 if(!t){o.innerHTML='<div class="info err">Enter a valid nominal major diameter, pitch, number of starts (1–24), wire size and included angle (10–120°). Choose a wire that fits the thread grooves.</div>';return}
 const {sys,wireBest,wire,actualPd,target,measured,term,leadAngle,p,a}=t;
 const targetM=Number.isFinite(target)?target+term:NaN;
 let warnings=[];
 if(a===60&&(wire<t.rangeMin||wire>t.rangeMax))warnings.push('Wire diameter is outside Pratt & Whitney’s theoretical 60° wire seating limits (0.505182–1.010363 × pitch).');
 if(a!==60&&Math.abs(wire/wireBest-1)>.15)warnings.push('Wire is substantially different from best size. Check actual flank contact; wire-seating limits vary by thread form.');
 if(Number.isFinite(leadAngle)&&leadAngle>5)warnings.push(`Calculated lead angle is ${show(leadAngle,2)}°. The simplified formula omits a potentially significant helix/lead-angle correction.`);
 if(a===29||a===30)warnings.push('Basic reference target assumes a general-purpose Acme (29°) or ISO trapezoidal (30°) profile, not Stub Acme. Check clearance, flank contact, actual thread limits and specified tolerance class.');
 if(a!==60&&$('threadSeries').value!=='custom')warnings.push('Selected Unified/ISO pitch-series names describe 60° fastener threads; for other profiles confirm the nominal diameter and pitch correspond to a valid Whitworth/Acme/trapezoidal designation.');
 if(!t.hasActualWire)warnings.push('Using ideal calculated best-size wire. Enter the actual calibrated wire diameter for a real measurement.');
 if(!Number.isFinite(target))warnings.push('No theoretical basic target is known for the selected custom angle; enter the drawing-specified pitch diameter.');
 if(Number.isFinite(actualPd)&&actualPd<=0)warnings.push('The measurement implies a nonpositive pitch diameter. Check units, pitch and wire size.');
 let heading=Number.isFinite(actualPd)&&actualPd>0?box('Calculated pitch diameter from actual micrometer reading',displayDim(actualPd,sys,6)):box('Expected measurement over wires (target)',displayDim(targetM,sys,6));
 o.innerHTML=`<div class="threadresult"><small>${Number.isFinite(actualPd)?'External-thread pitch diameter':'Theoretical over-wire target'} · ${a}° included angle</small><strong>${displayDim(Number.isFinite(actualPd)&&actualPd>0?actualPd:targetM,sys,6)}</strong><small>${Number.isFinite(actualPd)?'Calculated from the entered over-wire measurement':'Supply a micrometer reading to determine actual pitch diameter'}</small></div>
 <div class="outputgrid">
  ${box('Best wire diameter',displayDim(wireBest,sys,6))}
  ${box('Wire diameter used',displayDim(wire,sys,6))}
  ${box('Thread pitch',displayDim(p,sys,6))}
  ${box(t.hasTarget?'Drawing target pitch diameter':'Theoretical basic pitch diameter',displayDim(target,sys,6))}
  ${box('Target measurement over wires',displayDim(targetM,sys,6))}
  ${box('Measured pitch diameter',displayDim(actualPd>0?actualPd:NaN,sys,6))}
  ${box('Measured – target pitch diameter',Number.isFinite(actualPd)&&Number.isFinite(target)?`${actualPd>=target?'+':'−'}${displayDim(Math.abs(actualPd-target),sys,6)}`:'—')}
  ${box('Lead angle at target pitch Ø',Number.isFinite(leadAngle)?show(leadAngle,3)+'°':'—')}
 </div>
 <p class="sourcehint"><b>Axial-section geometry:</b> M = E + W × (1 + csc(θ/2)) − (P/2) × cot(θ/2). For 60° threads, E = M − 3W + 0.8660254P. Best wire = P ÷ [2 cos(θ/2)].</p>
 ${warnings.length?'<div class="info warn" role="status">'+warnings.map(x=>'<p style="margin:5px 0">'+x+'</p>').join('')+'</div>':'<div class="info">Geometric results only. Final accept/reject requires the specified thread class and calibrated measurement procedure.</div>'}`;
}
function init(){if(ready){render();return}ready=true;
 for(const id of ['wireStarts','wireCustomAngle','wireDiameter','wireMeasured','wireTargetPd'])$(id).addEventListener('input',render);
 $('wireAngle').addEventListener('change',()=>{$('wireDiameter').value='';$('wireTargetPd').value='';render()});
 $('wireBest').addEventListener('click',()=>{const t=terms();if(t){$('wireDiameter').value=String(+(t.wireBest*(t.sys!=='metric'?1:25.4)).toFixed(t.sys!=='metric'?7:5));render()}});
 $('wireClear').addEventListener('click',()=>{$('wireDiameter').value='';$('wireMeasured').value='';$('wireTargetPd').value='';render()});
 render();}
window.MachiningDeskThreeWire={init,render};
})();
