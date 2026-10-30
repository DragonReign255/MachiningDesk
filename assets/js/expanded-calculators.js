/* V1.12.5 supplementary engineering estimators.
 * User-supplied measured constants required for tool-life extrapolation.
 * No displayed result is a certified tool, press-fit or machine limit.
 */
(()=>{'use strict';
 const calculators=[
  ['tool_life','Tool Life Comparison','Taylor tool-life extrapolation from actual tool/material data'],
  ['cycle','Straight-Cut Cycle Time','Cutting/approach/rapid motion and tool-change estimate'],
  ['chamfer_geometry','Chamfer Geometry','Height and top width of a chamfer from face angle'],
  ['sinebar','Sine Bar','Gauge-block stack height for a desired angle'],
  ['drillpoint','Drill Point Length','Conical tip-length allowance from point angle'],
  ['pressfit','Press Fit Screening','Elastic hub/shaft pressure and approximate insertion force']
 ];
 const handles=id=>calculators.some(x=>x[0]===id);
 const src=(url,name)=>`<p class="sourcehint">Reference background: <a href="${url}" rel="noopener noreferrer" target="_blank">${name} ↗</a></p>`;
 function form(id,{inp,sel,units}){
  if(id==='tool_life')return `<h2>Tool Life Comparison</h2><p class="subtitle">Enter a <b>measured or manufacturer-published</b> reference tool life and speed for the <em>same tool, workpiece, feed, and engagement</em>. Taylor's exponent must come from comparable test data. The default exponent is only an illustrative placeholder.</p><div class="formgrid">${inp('tl_v0','Reference cutting speed (SFM)',350)}${inp('tl_t0','Observed life at reference speed (min)',30)}${inp('tl_v','Alternative cutting speed (SFM)',400)}${inp('tl_n','Empirical Taylor exponent n · sample only',.25)}</div><p class="sourcehint">Taylor model: v × Tⁿ = C; assumes unchanged feed, DOC, wear criterion and tool grade. Input values are demonstrations until replaced with actual measurements.</p>${src('https://www.iscar.com/Catalogs/Publication/english_1/Cutting_tools_user_guide/Cutting_tools_user_guide.pdf','ISCAR tool-life reference')}`;
  if(id==='cycle')return `<h2>Straight-Cut Cycle Time</h2><p class="subtitle">Simple operations only. Does not parse G-code, account for cutter compensation, acceleration, dwell, canned cycles or servo dynamics.</p><div class="formgrid">${inp('ct_length','Cutting travel per pass (in)',5)}${inp('ct_approach','Feed approach per pass (in)',.5,'0')}${inp('ct_feed','Programmed feed (IPM)',20)}${inp('ct_passes','Number of cutting passes',3)}${inp('ct_rapidDist','Total rapid distance (in)',15,'0')}${inp('ct_rapid','Assumed effective rapid (IPM)',400)}${inp('ct_changes','Tool changes',1,'0')}${inp('ct_tooltime','Seconds per tool change',6,'0')}</div><p class="sourcehint">Total = ((cut travel + feed approach) × passes) / feed + rapid distance / effective rapid + tool changes × seconds / 60. Rapid is assumed average achievable speed, not machine nominal G00.</p>`;
  if(id==='chamfer_geometry')return `<h2>Chamfer Geometry</h2><p class="subtitle">Specify chamfer width measured horizontally from the sharp theoretical corner and angle from the top surface.</p><div class="formgrid">${inp('ch_width','Radial / horizontal width (in)',.05)}${inp('ch_angle','Angle relative to top surface (degrees)',45)}</div><p class="sourcehint">Axial depth = horizontal width × tan(angle). This is geometric face/edge geometry, not a tool-centerline offset. For a countersink use the Countersink calculator instead.</p>`;
  if(id==='sinebar')return `<h2>Sine Bar</h2><p class="subtitle">Nominal center-to-center roller spacing and desired inclination.</p><div class="formgrid">${inp('si_length','Roller center distance (in)',5)}${inp('si_angle','Target angle (degrees)',15)}</div><p class="sourcehint">Nominal gauge-block stack = roller spacing × sin(angle). Verify sine-bar geometry and gauge-block wear; compound-angle setups require more than one sine calculation.</p>`;
  if(id==='drillpoint')return `<h2>Drill Point Length</h2><p class="subtitle">Calculate the extra travel beyond a cylindrical-hole depth needed to advance an ideal conical drill tip.</p><div class="formgrid">${inp('dp_diameter','Drill diameter (in)',.5)}${sel('dp_point','Point angle',[['118','118°'],['135','135°'],['140','140°'],['90','90°'],['custom','Custom']])}${inp('dp_customAngle','Custom included angle · degrees',118)}</div><p class="sourcehint">Ideal point length = D / [2 tan(included angle / 2)]. Split-point and flat-tip drills can depart significantly from this result. Program additional breakthrough only with safe stock/fixture clearance.</p>`;
  if(id==='pressfit')return `<h2>Press Fit Screening</h2><p class="subtitle">Elastic <b>solid shaft into thick-walled hub</b> approximation, using an unrestrained, open-ended plane-stress model. This is not a reliable assembly-force or safety-limit prediction without material and geometric verification.</p><div class="formgrid">${inp('pf_diameter','Shaft diameter (in)',1)}${inp('pf_hubOD','Hub outside diameter (in)',2)}${inp('pf_interference','Diametral interference (in)',.001)}${inp('pf_length','Engagement length (in)',1)}${inp('pf_shaftE','Shaft elastic modulus (psi)',30000000)}${inp('pf_hubE','Hub elastic modulus (psi)',10000000)}${inp('pf_shaftNu','Shaft Poisson ratio',.3)}${inp('pf_hubNu','Hub Poisson ratio',.33)}${inp('pf_mu','Assumed friction coefficient',.15)}</div><p class="sourcehint">Uses ideal Lamé thick-wall elastic displacement. Surface finish, heating, hub yielding, knurling, tolerances, axial constraint and geometry can dominate. Verify with engineering analysis or a controlled test for critical assemblies.</p>`;
  return null;
 }
 function calculate(id,{v,f,units,prefs,L,out,warn,err,read}){
  const finite=(...a)=>a.every(x=>Number.isFinite(x));
  if(id==='tool_life'){
    const v0=v('tl_v0'),v1=v('tl_v'),t0=v('tl_t0'),n=v('tl_n');
    if(!finite(v0,v1,t0,n)||v0<=0||v1<=0||t0<=0||n<.05||n>.8||t0>1e6)return err('Enter valid speeds, observed life and empirical exponent (0.05–0.8).');
    const t=t0*Math.pow(v0/v1,1/n);
    if(!Number.isFinite(t)||t>1e7)return err('Extrapolated life exceeds the practical calculation range. Check the exponent and speed change.');
    return `<div class="outputgrid">${out('Alternative speed',f(units==='mm'?v1*.3048:v1,1)+(units==='mm'?' m/min':' SFM'))}${out('Estimated comparable tool life',f(t,2)+' minutes')}${out('Life relative to baseline',f(t/t0*100,1)+'%')}${out('Speed difference',f((v1/v0-1)*100,1)+'%')}</div>${warn('Empirical extrapolation ONLY. Tool failure can occur earlier or by another wear mechanism. This model cannot set a safe cutting speed and must be calibrated for the same tool and material.')}`;
  }
  if(id==='cycle'){
    const l=v('ct_length'),ap=v('ct_approach'),fd=v('ct_feed'),passes=v('ct_passes'),rapid=v('ct_rapidDist'),rv=v('ct_rapid'),changes=v('ct_changes'),secs=v('ct_tooltime');
    if(!finite(l,ap,fd,passes,rapid,rv,changes,secs)||l<=0||fd<=0||rv<=0||passes<1||passes>10000||!Number.isInteger(passes)||changes<0||!Number.isInteger(changes)||[ap,rapid,secs].some(x=>x<0))return err('Enter positive feed and an integer number of passes, with nonnegative approach, rapid and change time.');
    const c=(l+ap)*passes/fd,r=rapid/rv,t=changes*secs/60,total=c+r+t;
    return `<div class="outputgrid">${out('Feed-motion time',f(c*60,1)+' sec')}${out('Rapid time',f(r*60,1)+' sec')}${out('Tool change time',f(t*60,1)+' sec')}${out('Total simplified cycle',f(total*60,1)+' sec / '+f(total,2)+' min')}</div>${warn('Travel acceleration, corners, tool offsets, machine delays, dwell, loading and real postprocessed paths are excluded.')}`;
  }
  if(id==='chamfer_geometry'){
    const w=v('ch_width'),theta=v('ch_angle');if(!finite(w,theta)||w<=0||theta<=0||theta>=90)return err('Width must be positive and angle strictly between 0 and 90 degrees.');
    const h=w*Math.tan(theta*Math.PI/180),s=Math.hypot(w,h);
    return `<div class="outputgrid">${out('Axial depth',L(h*25.4))}${out('Horizontal width',L(w*25.4))}${out('Sloped face length',L(s*25.4))}</div>${warn('Ideal sharp-edge geometry. Tool radius, corner break allowance and cutter angle error are not included.')}`;
  }
  if(id==='sinebar'){
    const l=v('si_length'),theta=v('si_angle');if(!finite(l,theta)||l<=0||Math.abs(theta)>=90)return err('Enter a positive roller spacing and an angle between -90 and 90 degrees.');
    return `<div class="outputgrid">${out('Signed gauge-block stack height',L(l*Math.sin(theta*Math.PI/180)*25.4))}${out('Roller center spacing',L(l*25.4))}${out('Angle',f(theta,4)+'°')}</div>${warn('Negative height means reverse the direction of tilt; actual stacks must be arranged appropriately. Verify roll centers and setup.')}`;
  }
  if(id==='drillpoint'){
    const d=v('dp_diameter'),theta=read('dp_point')||NaN,custom=document.getElementById('eg_dp_point').value==='custom',angle=custom?v('dp_customAngle'):theta;
    if(!finite(d,angle)||d<=0||angle<=0||angle>=180)return err('Enter a positive diameter and included point angle between 0 and 180°.');
    const h=d/(2*Math.tan(angle*Math.PI/360));
    return `<div class="outputgrid">${out('Ideal drill point length',L(h*25.4))}${out('Included angle',f(angle,2)+'°')}${out('Programmed clearance check','Verify stock and fixture below hole')}</div>${warn('Nominal conical geometry only: actual cutting-lip profile, split point and breakthrough allowance vary by cutter.')}`;
  }
  if(id==='pressfit'){
    const d=v('pf_diameter'),od=v('pf_hubOD'),inter=v('pf_interference'),len=v('pf_length'),Es=v('pf_shaftE'),Eh=v('pf_hubE'),ns=v('pf_shaftNu'),nh=v('pf_hubNu'),mu=v('pf_mu');
    if(!finite(d,od,inter,len,Es,Eh,ns,nh,mu)||d<=0||od<=d*1.05||inter<=0||len<=0||Es<=0||Eh<=0||Math.abs(ns)>=.5||Math.abs(nh)>=.5||mu<0||mu>1)return err('Check shaft/hub dimensions (hub OD > shaft Ø), positive elastic moduli, valid Poisson ratios, interference, length, and friction (0–1).');
    const a=d/2,b=od/2,b2=b*b,a2=a*a;
    const compliance=(1-ns)/Es+((b2+a2)/(b2-a2)+nh)/Eh;
    const p=inter/(d*compliance),hoop=p*(b2+a2)/(b2-a2),force=mu*p*Math.PI*d*len;
    const stress=prefs.pressure==='MPa'?p*.006894757:p,hoopS=prefs.pressure==='MPa'?hoop*.006894757:hoop;
    const fUnit=prefs.force==='N'?force*4.448221615:force;
    return `<div class="outputgrid">${out('Elastic contact pressure',f(stress,1)+' '+prefs.pressure)}${out('Bore hoop stress · ideal',f(hoopS,1)+' '+prefs.pressure)}${out('Approximate insertion friction',f(fUnit,1)+' '+prefs.force)}${out('Radial interference',L(inter/2*25.4))}</div>${warn('This is NOT a guaranteed safe fit, hub-yield check, or certified assembly force. Assumes concentric smooth cylindrical members and a uniform interface. Compare bore hoop stress against a verified material allowable with appropriate safety factor; assembly can fail before the estimate. Thermal, surface and end effects excluded.')}`;
  }
  return err('Unknown engineering calculator.');
 }
 window.MachiningDeskExpanded={calculators,handles,form,calculate};
})();
