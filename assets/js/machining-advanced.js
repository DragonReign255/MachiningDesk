/* Machining Desk: simplified static stiffness and geometric finish estimates.
 * Shop planning aids, NOT chatter stability, tool failure or acceptance predictions.
 */
(()=>{'use strict';
const show=(n,p=3)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:p}):'—';
const fmt=(num,metric,p=4)=>show(num*(metric?25.4:1),p)+(metric?' mm':' in');
const metricForce=(n,metric)=>show(n*(metric?4.448221615:1),1)+(metric?' N':' lbf');
const box=(name,value)=>`<div class="outmetric"><small>${name}</small><strong>${value}</strong></div>`;
function render(data){const {op,t,forceLbf,feed,rpm,d,rdoc,teeth,stickout,barDiameter,noseRadius,barMaterial,barInsertMaterial,units}=data;
 const metric=units==='mm',cutForce=Number(forceLbf);
 let parts=['<h3>Tool stiffness and finish · engineering estimates</h3>'];
 if(op==='mill'){
  const E=document.getElementById('calcSubstrate')?.value==='carbide'?75e6:30e6;
  const I=Math.PI*Math.pow(d,4)/64;
  const valid=stickout>0&&d>0&&Number.isFinite(cutForce)&&cutForce>=0;
  const delta=valid?cutForce*Math.pow(stickout,3)/(3*E*I):NaN;
  const stress=valid?32*cutForce*stickout/(Math.PI*Math.pow(d,3)):NaN;
  const flutePerTooth=rpm>0?feed/rpm/Math.max(1,teeth):NaN;
  parts.push('<div class="outputgrid">'+box('Estimated transverse force · equivalent',metricForce(cutForce,metric))+box('Ideal solid-tool tip deflection',fmt(delta,metric,6))+box('Ideal cantilever bending stress',show(metric?stress*.00689476:stress,2)+(metric?' MPa':' psi'))+box('Unsupported length / diameter',show(stickout/d,2)+':1')+'</div>');
  parts.push('<p class="sourcehint">Static cantilever approximation: δ = FL³/(3EI), I = πd⁴/64. Uses nominal tool diameter as a solid shank, and power-derived equivalent tangential force as a proxy for transverse load. Real flute cores, holders, dynamic forces, entry angle, cutting direction and chip thickness are NOT modeled. Treat deflection as a screening estimate, not a dimensional prediction.</p>');
  if(t?.id==='ball'&&rdoc>0&&rdoc<d){const h=rdoc*rdoc/(4*d);parts.push('<div class="outputgrid">'+box('Ball-nose surface cusp · approx.',fmt(h,metric,6))+'</div><p class="sourcehint">Geometric small-stepover scallop estimate h ≈ s²/(8R), where s is radial stepover and R is ball radius. Only valid if RDOC represents surface stepover across adjacent passes; actual finish also depends on tilt, runout, feed per tooth and toolpath.</p>');}
  else parts.push('<p class="sourcehint">Surface finish cannot be predicted reliably from milling feed alone without edge geometry, stepover/toolpath, runout and the specific surface orientation. Current estimated feed per tooth: '+fmt(flutePerTooth,metric,5)+'.</p>');
 }
 if(op==='turn'){
  if(t?.id==='turn_bore'){
   const E=barMaterial==='carbide'?80e6:30e6,I=Math.PI*Math.pow(barDiameter,4)/64;
   // Insert substrate affects likely cutting-edge force, not shank stiffness. Modifier is a planning heuristic.
   const insertFactors={carbide:1,hss:1.15,cermet:.95,cbn:1.05,pcd:.90};
   const insertFactor=insertFactors[barInsertMaterial]||1,forceEstimate=cutForce*insertFactor;
   const insertName={carbide:'Carbide',hss:'High-speed steel (HSS)',cermet:'Cermet',cbn:'Cubic boron nitride (CBN)',pcd:'Polycrystalline diamond (PCD)'}[barInsertMaterial]||'Carbide';
   const valid=stickout>0&&barDiameter>0&&Number.isFinite(cutForce)&&cutForce>=0;
   const delta=valid?forceEstimate*Math.pow(stickout,3)/(3*E*I):NaN;
   const ratio=stickout/barDiameter;
   const maxRatio=barMaterial==='carbide'?6:barMaterial==='damped'?8:4;
   let risk=ratio>maxRatio?'Elevated':ratio>maxRatio*.75?'Caution':'Lower geometry-based risk';
   parts.push('<div class="outputgrid">'+box('Boring bar Ø',fmt(barDiameter,metric))+box('Bar shank material / insert', (barMaterial==='carbide'?'Carbide':barMaterial==='damped'?'Damped steel-core model':'Steel')+' / '+insertName)+box('Estimated side-load proxy',metricForce(forceEstimate,metric))+box('Stickout / shank diameter',show(ratio,2)+':1')+box('Ideal static tip deflection',fmt(delta,metric,6))+box('Indicative vibration risk',risk)+'</div>');
   parts.push(`<p class="sourcehint">Static bar estimate δ = FL³/(3EI). Rough screening ratios: steel ≤4D; carbide ≤6D; damped bars sometimes support longer overhang, subject to manufacturer rating. Current ${show(ratio,2)}D. <b>This is NOT a stability-lobe/chatter prediction</b>; stiffness of the holder, cutting direction, damping, speed, insert edge and machine dynamics determine actual chatter. Damped-bar deflection assumes steel stiffness and does not model damping. Insert-material multiplier '+show(insertFactor,2)+'× is only an illustrative force sensitivity assumption, <b>not a verified cutting-force correction</b>; insert geometry, edge preparation and chip thickness usually matter more. The selected insert does not alter bar elastic modulus.</p>`);
  }
  if(!t?.thread){const f=rpm>0?feed/rpm:NaN;const r=noseRadius;
   const theoreticalRa=f>0&&r>0?f*f/(32*r):NaN;
   const theoreticalRz=f>0&&r>0?f*f/(8*r):NaN;
   parts.push('<div class="outputgrid">'+box('Geometric Ra (approx.)',show(theoreticalRa*(metric?25400:1e6),2)+(metric?' μm':' μin'))+box('Geometric peak-to-valley height',show(theoreticalRz*(metric?25400:1e6),2)+(metric?' μm':' μin'))+box('Effective feed per revolution',fmt(f,metric,5))+box('Insert nose radius',fmt(r,metric,4))+'</div>');
   parts.push('<p class="sourcehint">Ideal turned-profile approximation: Ra ≈ f²/(32r), peak-to-valley height ≈ f²/(8r). The latter is not a guaranteed standardized measured Rz. Tool nose radius and feed assumed constant. Chatter, nose edge prep, built-up edge, runout and chip deformation can markedly worsen finish.</p>');
  }else parts.push('<p class="sourcehint">Single-point threading finish and stiffness require tool-nose geometry and individual infeed passes; geometric roughness estimate disabled.</p>');
 }
 if(op==='drill')parts.push('<p class="sourcehint">Drilled hole surface finish depends on drill margins, lips, runout, hole guidance, coolant, workholding and the finishing process. A reliable Ra/Rz estimate cannot be derived from RPM and IPR alone. Axial drill thrust and drill bending are not calculated from the existing power coefficient.</p>');
 return `<section class="advanced-estimates">${parts.join('')}</section>`;
}
window.MachiningDeskAdvanced={render};
})();
