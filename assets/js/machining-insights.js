/* Shared read-only engineering audit / calculator launch controls.
 * Does not alter RPM, feeds, cutting power, machine power curves, or safety warnings.
 */
(()=>{'use strict';
const app=()=>window.MachiningDeskIntegration,el=document.getElementById('advancedMachiningDetails');
if(!el)return;
function fmt(v,p=2){return Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:p}):'—';}
function current(){const s=app()?.getCutSnapshot?.();if(!s)return;const tool=app()?.getDb()?.tools.find(t=>t.id===s.toolId);let area=document.getElementById('machiningInsights');if(!area){area=document.createElement('section');area.id='machiningInsights';area.className='machining-insights advanced-estimates';el.after(area);}
 const units=app()?.getUnits?.()||'in';const pref=app()?.getUnitPrefs?.()||{};
 const f=units==='mm'?25.4:1,rm=s.mrrIn3Min??NaN;
 const cutter=tool?.manufacturer&&tool?.partNumber?`${tool.manufacturer} · ${tool.partNumber}`:'No exact manufacturer tool linked';
 const modelLimit=s.availableHpAtRpm!=null?`~${fmt(s.availableHpAtRpm,1)} hp (approx. curve at current RPM)`:'Not configured for this RPM';
 area.replaceChildren();let h=document.createElement('h3');h.textContent='Linked machining models · audit and transfer';area.append(h);
 const holder=document.createElement('div');holder.className='outputgrid';const results=[
 ['Material removal rate',Number.isFinite(rm)?fmt(rm*(units==='mm'?16.387064:1),3)+(units==='mm'?' cm³/min':' in³/min'):'Not modeled'],
 ['Net cutting estimate',fmt(s.netCuttingHp)+' hp'],
 ['Motor-equivalent estimate',fmt(s.motorEquivalentHp)+' hp'],
 ['Approx. available spindle power',modelLimit],
 ['Current effective chip load',fmt((s.rpm>0?s.feedIpm/s.rpm/(s.operation==='mill'?s.flutes:1):NaN)*f,units==='mm'?4:5)+(units==='mm'?' mm':' in')],
 ['Exact tool record',cutter]
 ];
 for(const [name,value] of results){const div=document.createElement('div');div.className='outmetric';const title=document.createElement('small'),val=document.createElement('strong');title.textContent=name;val.textContent=value;div.append(title,val);holder.append(div);}area.append(holder);
 if(tool?.sourceUrl&&/^https:\/\//i.test(tool.sourceUrl)){const para=document.createElement('p');para.className='sourcehint';const a=document.createElement('a');a.href=tool.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Manufacturer/source document ↗';para.append(a);area.append(para);}
 const launch=document.createElement('div');launch.className='btnrow';const entries=[['torque','Cutting torque'],['deflection','Tool deflection'],['surface','Surface finish'],['cycle','Cycle time'],['tool_life','Tool life']];for(const [id,label] of entries){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent='↗ '+label;b.addEventListener('click',()=>{app()?.navigate('calculators');window.MachiningDeskCalculators?.openFromCut?.(id,s);});launch.append(b);}area.append(launch);
 const note=document.createElement('p');note.className='sourcehint';note.textContent='The buttons transfer the CURRENT machine and cutting inputs to the corresponding engineering estimator. Net cutting horsepower, input-motor power and controller spindle-load % are different quantities. Force and finish models remain simplified and unverified; measured load calibration is only a diagnostic comparison.';area.append(note);
}
window.addEventListener('machiningdesk:calculation',current);
window.addEventListener('machiningdesk:units',current);window.addEventListener('machiningdesk:unit-preferences',current);
})();
