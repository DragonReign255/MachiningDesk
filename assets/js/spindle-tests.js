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
  function render(){const list=$('spindleTestsList');if(!list)return;
    const {snap,m}=machine();$('spindleTestsMachineName').textContent=m?.name||'No compatible machine';
    $('saveSpindleTest').disabled=!snap||!m||!(snap.rpm>0)||!(snap.feedIpm>0)||!Number.isFinite(snap.netCuttingHp);
    const model=$('spindleHistoricalEstimate');
    const trend=historicalEstimate(m,snap);
    if(model)model.textContent=trend?`Historical controller peak estimate: ${fmt(trend.loadPct)}% at this modeled cutting demand, derived from ${trend.count} saved runs on the same spindle, operation and material family (median controller/model ratio ${fmt(trend.ratio,2)}×; entered idle load removed before comparison). Approximate indicator only; does NOT alter net cutting horsepower or manufacturer power curves.`:
      'Historical load estimate needs at least 3 saved measurements for the selected spindle, operation, and material family. Machine/controller load percentages cannot be converted directly to horsepower.';
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
    const target=app().getDb().machines.find(x=>x.id===m.id);
    if(!target){message('Machine could not be found. No observation saved.',true);return;}
    const test={...snap,id:globalThis.crypto?.randomUUID?.()||`test_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      name:`${snap.machineName} · ${fmt(peak)}% @ ${fmt(snap.rpm,0)} RPM`,
      capturedAt:new Date().toISOString(),measuredPeakPct:peak,idleLoadPct:idle,
      note:$('spindleTestNotes').value.trim().slice(0,600)};
    if(!Array.isArray(target.loadTests))target.loadTests=[];
    target.loadTests.push(test);
    if(target.loadTests.length>150)target.loadTests.splice(0,target.loadTests.length-150);
    if(!app().saveDb()){target.loadTests.pop();message('Unable to save. Export your database and check browser storage.',true);return;}
    $('spindlePeakPct').value='';$('spindleIdlePct').value='';$('spindleTestNotes').value='';
    message('Saved to '+target.name+'. This measurement will synchronize through your private cloud account when automatic sync is enabled.');render();
  }
  $('saveSpindleTest')?.addEventListener('click',save);
  window.addEventListener('machiningdesk:calculation',render);
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,30)));
  $('calcMachine')?.addEventListener('change',()=>setTimeout(render,30));
  $('calcSpindle')?.addEventListener('change',()=>setTimeout(render,30));
  render();
  window.MachiningDeskSpindleTests={render,save,ratio,historicalEstimate};
})();
