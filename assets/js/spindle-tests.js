/* Machining Desk V1.12.3: local-first, machine-specific observed spindle-load tests.
 * Controller load % is not electrical input power or measured spindle horsepower.
 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const app=()=>window.MachiningDeskIntegration;
  const fmt=(n,d=1)=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-US',{maximumFractionDigits:d}):'—';
  function message(msg,err=false){const el=$('spindleTestsStatus');if(!el)return;el.textContent=msg;el.classList.toggle('error',err);}
  function machine(){const snap=app()?.getCutSnapshot?.();return {snap,m:app()?.getDb?.()?.machines?.find(x=>x.id===snap?.machineId)};}
  const node=(tag,text='',cls='')=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;return el;};
  function ratio(test){const measured=Number(test.measuredPeakPct)-Number(test.idleLoadPct||0),pred=Number(test.predictedLoadPct);return pred>0&&measured>0?measured/pred:null;}
  function historicalEstimate(machine,snap){
    if(!machine||!snap||!Number.isFinite(snap.predictedLoadPct)||snap.predictedLoadPct<=0)return null;
    const ratios=(machine.loadTests||[]).filter(t=>t.spindle===snap.spindle&&t.operation===snap.operation&&t.materialFamily===snap.materialFamily)
      .map(t=>({p:Number(t.measuredPeakPct)-(t.idleLoadPct==null?0:Number(t.idleLoadPct)),q:Number(t.predictedLoadPct)}))
      .filter(x=>Number.isFinite(x.p)&&Number.isFinite(x.q)&&x.p>0&&x.q>0)
      .map(x=>x.p/x.q).filter(x=>x>=.15&&x<=8).sort((a,b)=>a-b);
    if(ratios.length<3)return null;
    const half=ratios.length>>1,median=ratios.length%2?ratios[half]:(ratios[half-1]+ratios[half])/2;
    return {count:ratios.length,ratio:median,loadPct:median*snap.predictedLoadPct};
  }
  // Robust empirical controller-load comparison from saved cuts ONLY. Never a certified
  // conversion to horsepower or a substitute for machine load limits.
  const median=sorted=>{if(!sorted.length)return NaN;const s=[...sorted].sort((a,b)=>a-b),k=Math.floor(s.length/2);return s.length%2?s[k]:(s[k-1]+s[k])/2;};
  function calibration(machine,snap){
    if(!machine||!snap||!(snap.rpm>0)||!(snap.predictedLoadPct>0))return null;
    const candidates=(machine.loadTests||[]).filter(t=>t.spindle===snap.spindle&&t.operation===snap.operation&&t.materialFamily===snap.materialFamily&&
      Number(t.rpm)>snap.rpm*.65&&Number(t.rpm)<snap.rpm*1.55&&Number(t.predictedLoadPct)>0);
    const rows=candidates.map(t=>{const measured=Number(t.measuredPeakPct)-(t.idleLoadPct===null||t.idleLoadPct===''?0:Number(t.idleLoadPct));
       const ratio=measured/Number(t.predictedLoadPct);return {test:t,ratio,measured};})
      .filter(x=>Number.isFinite(x.ratio)&&x.ratio>.15&&x.ratio<8&&x.measured>0);
    if(rows.length<5)return {count:rows.length,minimum:5,ready:false};
    const factors=rows.map(x=>x.ratio),factor=median(factors),mad=median(factors.map(x=>Math.abs(x-factor))),scatter=mad/factor;
    const idle=median(rows.map(x=>Number(x.test.idleLoadPct||0)).filter(Number.isFinite));
    const predicted=Number(snap.predictedLoadPct)*factor+idle;
    const powerRatios=rows.map(x=>{const t=x.test,net=Number(t.measuredPowerKw)-Number(t.measuredIdleKw||0),modeled=Number(t.netCuttingHp)*.745699872;
       return t.measuredPowerKw!=null&&t.measuredPowerKw!==''&&net>0&&modeled>0?net/modeled:NaN;})
      .filter(x=>Number.isFinite(x)&&x>.15&&x<8);
    const stable=rows.length>=8&&scatter<=.2;
    return {ready:true,count:rows.length,factor,scatter,idle,predicted,stable,modeledPct:snap.predictedLoadPct,kwCount:powerRatios.length,kwFactor:powerRatios.length>=3?median(powerRatios):null};
  }
  function render(){const list=$('spindleTestsList');if(!list)return;
    const {snap,m}=machine();$('spindleTestsMachineName').textContent=m?.name||'No compatible machine';
    $('saveSpindleTest').disabled=!snap||!m||!(snap.rpm>0)||!(snap.feedIpm>0)||!Number.isFinite(snap.netCuttingHp);
    const model=$('spindleHistoricalEstimate');
    const trend=historicalEstimate(m,snap);
    if(model)model.textContent=trend?`Historical controller peak estimate: ${fmt(trend.loadPct)}% at this modeled cutting demand, derived from ${trend.count} saved runs on the same spindle, operation and material family (median controller/model ratio ${fmt(trend.ratio,2)}×; entered idle load removed before comparison). Approximate indicator only; does NOT alter net cutting horsepower or manufacturer power curves.`:
      'Historical load estimate needs at least 3 saved measurements for the selected spindle, operation, and material family. Machine/controller load percentages cannot be converted directly to horsepower.';
    const detail=$('spindleCalibrationSummary'),modelCheck=calibration(m,snap);
    if(detail)detail.textContent=!modelCheck?'No valid current cut to compare against saved machine observations.':
      !modelCheck.ready?`${modelCheck.count||0} comparable cut(s) at roughly similar RPM. At least 5 actual readings from this machine/spindle/operation/material family are needed for a diagnostic comparison.`:
      `Observed-controller trend (${modelCheck.count} comparable runs): nominal ${fmt(modelCheck.modeledPct)}% → empirically indicated ${fmt(modelCheck.predicted)}% (includes median entered idle load). Median load/model factor ${fmt(modelCheck.factor,2)}×; median relative scatter ${fmt(modelCheck.scatter*100,1)}%. ${modelCheck.stable?'Moderate repeatability across these tests; still unverified.':'PRELIMINARY — wide scatter or fewer than eight observations.'} ${modelCheck.kwFactor===null?'No measured-power cross-check yet (3 matched kW readings required).':`Measured kW delta / modeled net cutting kW: ${fmt(modelCheck.kwFactor,2)}× from ${modelCheck.kwCount} records; measurement location and display semantics need confirmation.`} Controller load % is not horsepower. This trend does not change the spindle curve, safety limits, feed, or SFM.`;
    list.replaceChildren();const rows=[...(m?.loadTests||[])].reverse();
    if(!rows.length){list.append(node('p','No saved measurements for this machine. The first valid measurement will be stored in this machine’s personal database and private cloud backup.','help'));return;}
    for(const test of rows.slice(0,15)){
      const card=node('article','','community-entry');
      const head=node('div','','community-entry-head');head.append(node('strong',`${fmt(test.measuredPeakPct)}% observed · ${fmt(test.rpm,0)} RPM`),node('span',test.spindleName||test.spindle||'main','community-tag'));card.append(head);
      card.append(node('small',`${new Date(test.capturedAt).toLocaleString()} · ${test.operation} · ${test.materialName} · ${test.toolName}`,'community-subtext'));
      const pred=Number(test.predictedLoadPct),calc=Number(test.netCuttingHp);
      card.append(node('p',`Feed ${fmt(test.feedIpm,2)} IPM · net cutting estimate ${fmt(calc,2)} hp · modeled spindle utilization ${Number.isFinite(pred)?fmt(pred)+'%':'not available'}.`,'help'));
      const r=ratio(test);
      if(r!==null)card.append(node('p',`Controller indication relative to model: ${fmt(r,2)}× (after subtracting entered idle load). This ratio is diagnostic, NOT a verified horsepower calibration.`,'sourcehint'));
      if(test.measuredPowerKw!=null)card.append(node('p',`Displayed spindle power: ${fmt(test.measuredPowerKw,2)} kW loaded · ${test.measuredIdleKw==null?'idle not measured':fmt(test.measuredIdleKw,2)+' kW unloaded'}. Controller-reported kW may differ from power at the cutting edge.`, 'help'));
      if(test.note)card.append(node('p',test.note,'help'));
      const details=node('details','','community-preview');details.append(node('summary','View saved cutting parameters'));
      details.append(node('pre',JSON.stringify(test,null,2)));card.append(details);
      const btns=node('div','','btnrow');
      const send=node('button','Submit for owner review','btn');send.type='button';send.addEventListener('click',()=>{if(window.MachiningDeskCommunity?.openSpindleTest)window.MachiningDeskCommunity.openSpindleTest(test.id);else message('Community module not available.',true);});btns.append(send);
      const del=node('button','Delete record','btn danger');del.type='button';del.addEventListener('click',()=>{
        if(!confirm('Delete this machine’s saved spindle-load measurement? It will also be removed from your private cloud on the next sync.'))return;
        const current=app()?.getDb?.()?.machines.find(x=>x.id===m.id);if(!current)return;
        current.loadTests=(current.loadTests||[]).filter(x=>x.id!==test.id);
        app().saveDb();message('Measurement deleted.');render();
      });btns.append(del);card.append(btns);list.append(card);
    }
    if(rows.length>15)list.append(node('p',`Showing 15 of ${rows.length} saved measurements. All are stored in the machine database and included in backups.`,'help'));
  }
  function save(){const {snap,m}=machine();
    if(!snap||!m||!Number.isFinite(snap.netCuttingHp)||!(snap.rpm>0)||!(snap.feedIpm>0)){message('Current cutting calculation is invalid or incomplete; no observation saved.',true);return;}
    const peak=Number($('spindlePeakPct').value),rawIdle=$('spindleIdlePct').value.trim(),idle=rawIdle===''?null:Number(rawIdle);
    if(!Number.isFinite(peak)||peak<=0||peak>300||$('spindlePeakPct').value.trim()===''){message('Peak controller load must be greater than 0% and no more than 300%.',true);return;}
    if(rawIdle!==''&&(!Number.isFinite(idle)||idle<0||idle>=peak)){message('Unloaded load must be nonnegative and less than the observed peak.',true);return;}
    const powerRaw=$('spindlePowerKw')?.value.trim()||'',idlePowerRaw=$('spindleIdleKw')?.value.trim()||'';
    const powerKw=powerRaw===''?null:Number(powerRaw),idleKw=idlePowerRaw===''?null:Number(idlePowerRaw);
    if(powerRaw!==''&&(!Number.isFinite(powerKw)||powerKw<=0||powerKw>1000)){message('Displayed kW must be positive and below 1,000 kW.',true);return;}
    if(idlePowerRaw!==''&&(powerKw===null||!Number.isFinite(idleKw)||idleKw<0||idleKw>=powerKw)){message('Enter positive cutting kW before unloaded kW; unloaded kW must be less than cutting kW.',true);return;}
    const target=app().getDb().machines.find(x=>x.id===m.id);
    if(!target){message('Machine could not be found. No observation saved.',true);return;}
    const test={...snap,id:globalThis.crypto?.randomUUID?.()||`test_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      name:`${snap.machineName} · ${fmt(peak)}% @ ${fmt(snap.rpm,0)} RPM`,
      capturedAt:new Date().toISOString(),measuredPeakPct:peak,idleLoadPct:idle,measuredPowerKw:powerKw,measuredIdleKw:idleKw,
      note:$('spindleTestNotes').value.trim().slice(0,600)};
    if(!Array.isArray(target.loadTests))target.loadTests=[];
    target.loadTests.push(test);
    if(target.loadTests.length>150)target.loadTests.splice(0,target.loadTests.length-150);
    if(!app().saveDb()){target.loadTests.pop();message('Unable to save. Export your database and check browser storage.',true);return;}
    $('spindlePeakPct').value='';$('spindleIdlePct').value='';$('spindlePowerKw').value='';$('spindleIdleKw').value='';$('spindleTestNotes').value='';
    message('Saved to '+target.name+'. This measurement will synchronize through your private cloud account when automatic sync is enabled.');render();
  }
  $('saveSpindleTest')?.addEventListener('click',save);
  window.addEventListener('machiningdesk:calculation',render);
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,30)));
  $('calcMachine')?.addEventListener('change',()=>setTimeout(render,30));
  $('calcSpindle')?.addEventListener('change',()=>setTimeout(render,30));
  render();
  window.MachiningDeskSpindleTests={render,save,ratio,historicalEstimate,calibration};
})();
