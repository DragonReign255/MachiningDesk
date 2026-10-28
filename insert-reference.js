/* Turning insert identification: general ISO 1832 / ANSI B212 position decoder.
   Manufacturer suffixes and edge details are not standardized. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const shapes={C:['80° rhombic (diamond)',80],D:['55° rhombic',55],V:['35° rhombic',35],T:['60° triangular',60],S:['90° square',90],W:['80° trigon',80],R:['Round',360],K:['55° parallelogram',55],L:['90° rectangular',90],P:['Pentagonal',108],O:['Octagonal',135],H:['Hexagonal',120]};
const clearance={N:'0° (negative, potentially two-sided)',A:'3°',B:'5°',C:'7°',P:'11°',D:'15°',E:'20°',F:'25°',G:'30°'};
const tolerance={A:'Precision ground; check IC/thickness/corner tolerance table',C:'Precision ground; tighter than molded in many sizes',G:'Ground accuracy class; tolerance is size-dependent',H:'High precision; ground; size-dependent',J:'Precision ground; geometry dependent',K:'Medium precision; reference catalog',M:'Common pressed/molded tolerance; size-dependent',U:'Utility / pressed tolerance; size-dependent',E:'Ground special tolerance',F:'Ground special tolerance'};
const config={G:'Cylindrical through-hole; chipbreaker on both faces',M:'Cylindrical through-hole; chipbreaker on one face',A:'Plain faces; through-hole',N:'Plain faces; without through-hole',T:'Countersunk clamping hole; one-sided chipbreaker (catalog-dependent)',W:'Countersunk hole; chipbreaker on both faces (catalog-dependent)',C:'Countersunk hole; no chipbreaker (catalog-dependent)',R:'Chipbreaker / retaining configuration depends on catalog',P:'Clamping-hole/face combination; verify maker'};
const I=(n)=>Number(n).toFixed(4);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function row(n,code,detail){return `<tr><th>${n}</th><td><b>${escape(code)}</b></td><td>${escape(detail)}</td></tr>`}
function decode(value){const input=value.toUpperCase().replace(/[\s-]+/g,'');const match=input.match(/^([A-Z]{4})(\d{2}\.\d{2}|[0-9T]{6}|[0-9T]{3})(.*)$/);
 if(!match)return '<div class="info err">Enter four letters followed by a three-digit ANSI code (CNMG432), or six digits for ISO (CNMG120408).</div>';
 const letters=match[1],nums=match[2],suffix=match[3];const parts=letters.split('');const metric=nums.length===6,inch=nums.length===3||/^\d{2}\.\d{2}$/.test(nums);
 let size='Not resolved: numeric designation must contain 3 ANSI or 6 ISO characters.',thick='—',radius='—';
 if(inch){const [a,b,c]=nums.length===3?[nums[0],nums[1],nums[2]]:[nums[0],nums.slice(1,4),nums[4]];size='Nominal inscribed circle: '+I(Number(a)/8)+' in ('+I(Number(a)/8*25.4)+' mm), for common turning shapes';thick='Thickness: '+I(Number(b)/16)+' in ('+I(Number(b)/16*25.4)+' mm)';radius='Nose radius: '+I(Number(c)/64)+' in ('+I(Number(c)/64*25.4)+' mm)';}
 if(metric){const [a,b,c]=[nums.slice(0,2),nums.slice(2,4),nums.slice(4,6)];const knownIC=nominalIC[parts[0]]?.[a];size=knownIC?'ISO size code '+a+': nominal IC '+knownIC.toFixed(3)+' mm ('+I(knownIC/25.4)+' in) for '+parts[0]+' shape.':'ISO size code '+a+': IC and cutting-edge length depend on shape. Verify size using the maker’s dimensional table.';const mmTable={'01':1.59,'02':2.38,'03':3.18,'04':4.76,'05':5.56,'06':6.35,'07':7.94,'08':8.0,'09':9.52,'12':12.7,'T2':2.78,'T3':3.97};const tt=mmTable[b];thick='ISO thickness code '+b+(tt?' ≈ '+tt+' mm ('+I(tt/25.4)+' in)':' — read corresponding ISO 1832 thickness chart');let rr=Number(c)/10;radius='Nose radius: '+(Number.isFinite(rr)?rr.toFixed(2)+' mm ('+I(rr/25.4)+' in)':'ISO radius code '+c);}
 return `<p class="subtitle">Decoded <strong>${escape(input)}</strong> as <strong>${inch?'ANSI/inch':metric?'ISO metric':'unrecognized numeric length'}</strong> standard. Designations vary for non-turning inserts.</p><div class="tableclip"><table><thead><tr><th>Field</th><th>Symbol</th><th>Meaning</th></tr></thead><tbody>${row('1 · Shape',parts[0],shapes[parts[0]]?.[0]||'Special shape; consult catalog')}${row('2 · Clearance',parts[1],clearance[parts[1]]||'Not in common clearance legend')}${row('3 · Tolerance',parts[2],tolerance[parts[2]]||'Check ISO tolerance table')}${row('4 · Hole / chipbreaker',parts[3],config[parts[3]]||'Manufacturer / additional standard detail required')}${row('5 · Size',inch?nums[0]:nums.slice(0,2),size)}${row('6 · Thickness',inch?nums.length===3?nums[1]:nums.slice(1,4):nums.slice(2,4),thick)}${row('7 · Nose radius',inch?nums[nums.length-1]:nums.slice(4,6),radius)}${row('8+ · Suffix',suffix||'—',suffix?'Grade, chipbreaker, edge prep, handedness or supplier code; consult manufacturer.':'No supplier-specific suffix supplied.')}</tbody></table></div><p class="sourcehint">ANSI numeric codes are commonly in eighths (IC), sixteenths (thickness) and sixty-fourths (nose radius). Some insert shapes use a different size definition; ISO thickness and edge-length symbols are lookup codes, not simply millimeter values. This decoding is informative, not a compatibility certificate.</p>`;
}
const list=(obj)=>Object.entries(obj).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]);
function miniTable(title,entries){return `<h3>${title}</h3><div class="tableclip"><table><thead><tr><th>Code</th><th>Meaning</th></tr></thead><tbody>${entries.map(([k,v])=>row('',k,v)).join('')}</tbody></table></div>`;}
/* Shape-dependent, callout-annotated SVG engineering sketches. The artwork is illustrative:
   ISO/ANSI defines designation geometry, but exact hole diameters, chipbreakers,
   edge preparations and tolerances require the insert manufacturer's drawing. */
const nominalIC={C:{'06':6.35,'09':9.525,'12':12.7,'16':15.875},D:{'07':6.35,'11':9.525,'15':12.7},V:{'11':6.35,'16':9.525},W:{'06':9.525,'08':12.7},S:{'09':9.525,'12':12.7},T:{'16':9.525},L:{'12':12.7}};
const isoThick={'01':1.59,'02':2.38,'03':3.18,'04':4.76,'05':5.56,'06':6.35,'07':7.94,'09':9.52,'T2':2.78,'T3':3.97};
const clearanceDegrees={N:0,A:3,B:5,C:7,P:11,D:15,E:20,F:25,G:30};
function parseInsert(raw){
 const input=String(raw||'').toUpperCase().replace(/[\s-]+/g,'');
 const match=input.match(/^([A-Z]{4})(\d{2}\.\d{2}|[0-9T]{6}|[0-9T]{3})(.*)$/);
 if(!match)return null;
 const letters=match[1],nums=match[2],iso=nums.length===6;
 const sh=letters[0],sizeCode=iso?nums.slice(0,2):nums[0];
 const thickCode=iso?nums.slice(2,4):(nums.includes('.')?nums.slice(1,4):nums[1]);
 const radCode=iso?nums.slice(4,6):nums[nums.length-1];
 let ic=iso?nominalIC[sh]?.[sizeCode]:Number(sizeCode)*25.4/8;
 let thick=iso?isoThick[thickCode]:Number(thickCode)*25.4/16;
 let radius=iso?Number(radCode)/10:Number(radCode)*25.4/64;
 if(!Number.isFinite(ic))ic=null;
 if(!Number.isFinite(thick))thick=null;
 if(!Number.isFinite(radius))radius=null;
 const alpha=clearanceDegrees[letters[1]];
 const hole=letters[3]!=='N' && letters[3]!=='R' && letters[3]!=='P';
 const countersink='TWC'.includes(letters[3]);
 const chip=letters[3]==='G'||letters[3]==='W'?'both':letters[3]==='M'||letters[3]==='T'?'one':'none/unspecified';
 return {input,letters,nums,iso,shape:sh,angle:shapes[sh]?.[1],alpha,ic,thick,radius,hole,countersink,chip,suffix:match[3],sizeCode,thickCode,radCode};
}
const number=(n,d=2)=>Number.isFinite(n)?Number(n).toFixed(d):'—';
const dimension=(n)=>Number.isFinite(n)?`${number(n,2)} mm / ${number(n/25.4,4)} in`:'Not resolved from this code';
const vfmt=(p)=>`${number(p[0],2)},${number(p[1],2)}`;
function polygonForShape(sh,angle){
 // Relative contour coordinates; axis-aligned diamond vertices imply the specified sharp corner angle.
 if('CDVK'.includes(sh)){
  const a=(angle||80)*Math.PI/360;
  const r=Math.min(54,112*Math.sin(a));
  const w=r/Math.cos(a),h=r/Math.sin(a);
  return [[0,-h],[w,0],[0,h],[-w,0]];
 }
 if(sh==='S')return [[-84,-84],[84,-84],[84,84],[-84,84]];
 if(sh==='L')return [[-104,-66],[104,-66],[104,66],[-104,66]];
 if(sh==='T')return [[0,-108],[94,54],[-94,54]];
 if(sh==='W')return [[0,-105],[37,-48],[88,-25],[60,6],[49,63],[0,79],[-49,63],[-60,6],[-88,-25],[-37,-48]];
 if(sh==='P')return Array.from({length:5},(_,i)=>[90*Math.sin(i*2*Math.PI/5),-90*Math.cos(i*2*Math.PI/5)]);
 if(sh==='O')return Array.from({length:8},(_,i)=>[93*Math.sin((i+.5)*2*Math.PI/8),-93*Math.cos((i+.5)*2*Math.PI/8)]);
 if(sh==='H')return Array.from({length:6},(_,i)=>[94*Math.sin(i*2*Math.PI/6),-94*Math.cos(i*2*Math.PI/6)]);
 if(sh==='R')return Array.from({length:48},(_,i)=>[86*Math.sin(i*2*Math.PI/48),-86*Math.cos(i*2*Math.PI/48)]);
 return [[-80,-80],[80,-80],[80,80],[-80,80]];
}
function mainSketch(d){
 const pts=polygonForShape(d.shape,d.angle),cx=301,cy=177;
 const contour=pts.map(([x,y])=>vfmt([cx+x,cy+y])).join(' ');
 const inside=(pts.some(p=>p[0]<-120)||pts.some(p=>p[0]>120))?30:45;
 const minDist=Math.min(...pts.map((p,i)=>{const q=pts[(i+1)%pts.length],ax=p[0],ay=p[1],bx=q[0],by=q[1];return Math.abs(ax*by-bx*ay)/Math.hypot(bx-ax,by-ay)||50;}));
 const radius=Math.min(52,minDist*0.96);
 const [tipX,tipY]=[cx+pts[0][0],cy+pts[0][1]];
 const nominalAngle=d.angle&&d.shape!=='R'?`${d.angle}°`:'Round / N/A';
 const icText=Number.isFinite(d.ic)?`${number(d.ic)} mm (${number(d.ic/25.4,4)} in)`:'Size code '+d.sizeCode+' · verify';
 const noseText=Number.isFinite(d.radius)?`${number(d.radius,2)} mm (${number(d.radius/25.4,4)} in)`:'Verify radius';
 const holeText=d.hole?(d.countersink?'Countersunk hole':'Clamping hole'):'No specified hole';
 const hole=d.hole?`<circle cx="${cx}" cy="${cy}" r="15" class="id-hole"/>${d.countersink?`<circle cx="${cx}" cy="${cy}" r="23" class="id-csink"/>`:''}`:'';
 // True acute-angle arc for rhombic outlines, general illustrative arc for polygonal shapes.
 let arc='';
 if(d.shape!=='R'&&pts.length>2){const v=pts[0],a=pts[pts.length-1],b=pts[1],scale=26;
  let va=[a[0]-v[0],a[1]-v[1]],vb=[b[0]-v[0],b[1]-v[1]];
  va=va.map(k=>k/Math.hypot(...va));vb=vb.map(k=>k/Math.hypot(...vb));
  const q1=[tipX+va[0]*scale,tipY+va[1]*scale],q2=[tipX+vb[0]*scale,tipY+vb[1]*scale];
  arc=`<path d="M${vfmt(q1)} Q${vfmt([tipX,tipY])} ${vfmt(q2)}" class="id-angle-arc"/>`;
 }
 return `<figure class="insert-drawing insert-drawing-main"><svg viewBox="0 0 520 348" role="img" aria-label="Top view of ${escape(d.input)} with labelled included angle, IC, nose radius and hole configuration">
 <defs><marker id="idArrowA" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto-start-reverse"><path d="M1 1 L6 3.5 L1 6" fill="none" stroke="currentColor" stroke-width="1.1"/></marker></defs>
 <text x="16" y="24" class="id-figure-header">TOP VIEW · ${escape(d.shape)} ${escape(shapes[d.shape]?.[0]||'Special shape')}</text>
 <circle cx="${cx}" cy="${cy}" r="${radius.toFixed(2)}" class="id-ic"/>
 <polygon points="${contour}" class="id-edge"/>${hole}${arc}
 <line x1="${cx-radius}" x2="${cx+radius}" y1="${cy}" y2="${cy}" class="id-dimension" marker-start="url(#idArrowA)" marker-end="url(#idArrowA)"/>
 <path d="M${tipX} ${tipY} L187 76 L165 76" class="id-leader"/>
 <text x="16" y="67" class="id-label"><tspan font-weight="700">ε · included angle</tspan><tspan x="16" dy="17">${escape(nominalAngle)}</tspan></text>
 <path d="M${cx-radius} ${cy} L180 156 L165 156" class="id-leader"/>
 <text x="16" y="143" class="id-label"><tspan font-weight="700">Ø IC · inscribed circle</tspan><tspan x="16" dy="17">${escape(icText)}</tspan></text>
 <path d="M${cx} ${cy} L183 237 L165 237" class="id-leader"/>
 <text x="16" y="225" class="id-label"><tspan font-weight="700">Hole / clamp (code ${escape(d.letters[3])})</tspan><tspan x="16" dy="17">${escape(holeText)}</tspan></text>
 <path d="M${tipX} ${tipY} L185 314 L165 314" class="id-leader"/>
 <text x="16" y="296" class="id-label"><tspan font-weight="700">rε · corner radius</tspan><tspan x="16" dy="17">${escape(noseText)}</tspan></text>
 </svg><figcaption>Solid outline = selected insert shape. Dashed circle = inscribed circle. Corner arc = nominal included angle. Dimensions are nominal when the code can be resolved; drawing is not to scale.</figcaption></figure>`;
}
function sideSketch(d){
 const t=d.thick,alpha=Number.isFinite(d.alpha)?d.alpha:null;
 const slant=Number.isFinite(alpha)?Math.tan(alpha*Math.PI/180)*87:0;
 const top=92,bottom=181,l=115,r=359;
 const profile=`M${l} ${top} H${r} L${(r-slant).toFixed(1)} ${bottom} H${(l+slant).toFixed(1)} Z`;
 const tText=Number.isFinite(t)?dimension(t):'Thickness code '+d.thickCode+' · verify';
 const alphaText=alpha===null?'Special clearance / verify':alpha+'°';
 const hole=d.hole?`<path d="M230 ${top+3} V${bottom-3} M244 ${top+3} V${bottom-3}" class="id-internal"/>${d.countersink?`<path d="M213 ${top+1} L230 ${top+22} M262 ${top+1} L244 ${top+22}" class="id-internal"/>`:''}`:'';
 const topChip=d.chip==='one'||d.chip==='both'?`<path d="M149 ${top} l12 7 12 -7 M307 ${top} l12 7 12 -7" class="id-chip"/>`:'';
 const botChip=d.chip==='both'?`<path d="M157 ${bottom} l12 -7 12 7 M289 ${bottom} l12 -7 12 7" class="id-chip"/>`:'';
 return `<figure class="insert-drawing"><svg viewBox="0 0 520 310" role="img" aria-label="Side view for ${escape(d.input)} showing ${escape(alphaText)} clearance, thickness ${escape(tText)}, through-hole and chipbreaker side">
 <text x="16" y="24" class="id-figure-header">SIDE VIEW · CLEARANCE &amp; THICKNESS</text>
 <path d="${profile}" class="id-edge"/>${hole}${topChip}${botChip}
 <path d="M97 ${top-6} V${bottom+8}" class="id-centerline"/>
 <path d="M${l} ${top} V${bottom}" class="id-angle-arc"/>
 <path d="M${l+5} ${bottom-22} L${l+slant} ${bottom}" class="id-leader"/>
 <text x="16" y="70" class="id-label"><tspan font-weight="700">α · relief / clearance</tspan><tspan x="16" dy="17">${escape(alphaText)} · code ${escape(d.letters[1])}</tspan></text>
 <path d="M${l} ${top} L185 75" class="id-leader"/>
 <path d="M${r+18} ${top} V${bottom} M${r+10} ${top} H${r+26} M${r+10} ${bottom} H${r+26}" class="id-dimension"/>
 <text x="${r+34}" y="${(top+bottom)/2-4}" class="id-symbol">s</text>
 <text x="16" y="236" class="id-label"><tspan font-weight="700">s · thickness</tspan><tspan x="16" dy="17">${escape(tText)}</tspan></text>
 <path d="M175 193 L175 210" class="id-leader"/>
 <text x="265" y="239" class="id-label"><tspan font-weight="700">Hole &amp; chipbreaker · ${escape(d.letters[3])}</tspan><tspan x="265" dy="17">${escape(d.chip==='both'?'Both faces':d.chip==='one'?'One face':'None / not specified')}</tspan></text>
 </svg><figcaption>Face shape, clearance and chipbreaker are schematic. Hole diameter, countersink included angle, rake and land geometry are manufacturer-specific.</figcaption></figure>`;
}
function cornerSketch(d){
 const r=Number.isFinite(d.radius)?dimension(d.radius):'Radius not resolved';
 const angle=d.shape==='R'?'Round insert':Number.isFinite(d.angle)?`${d.angle}° nose included angle`:'Unspecified nose angle';
 const ang=d.shape==='R'?90:(Number.isFinite(d.angle)?Math.min(160,d.angle):90);
 const half=ang*Math.PI/360,ox=236,oy=76,L=142,q=28,arcR=54;
 const vx=Math.sin(half),vy=Math.cos(half);
 const leftFar=[ox-L*vx,oy+L*vy],rightFar=[ox+L*vx,oy+L*vy];
 const leftNear=[ox-q*vx,oy+q*vy],rightNear=[ox+q*vx,oy+q*vy];
 const leftArc=[ox-arcR*vx,oy+arcR*vy],rightArc=[ox+arcR*vx,oy+arcR*vy];
 return `<figure class="insert-drawing"><svg viewBox="0 0 520 310" role="img" aria-label="Enlarged ${escape(d.shape)} insert cutting corner showing nominal included angle ${escape(angle)} and radius ${escape(r)}">
 <text x="16" y="24" class="id-figure-header">ENLARGED CUTTING CORNER · RADIUS &amp; ANGLE</text>
 <path d="M${vfmt(leftFar)} L${vfmt(leftNear)} Q${ox} ${oy} ${vfmt(rightNear)} L${vfmt(rightFar)}" class="id-edge id-corner-edge"/>
 <path d="M${vfmt(leftNear)} L${ox} ${oy} L${vfmt(rightNear)}" class="id-centerline"/>
 <path d="M${vfmt(leftArc)} Q${ox} ${oy+arcR*1.22} ${vfmt(rightArc)}" class="id-angle-arc"/>
 <path d="M${ox+3} ${oy+q+2} L351 116" class="id-leader"/>
 <text x="354" y="104" class="id-label"><tspan font-weight="700">rε · nose radius</tspan><tspan x="354" dy="18">${escape(Number.isFinite(d.radius)?number(d.radius,2)+' mm':'Verify')}</tspan></text>
 <text x="16" y="254" class="id-label"><tspan font-weight="700">ε · included angle</tspan><tspan x="16" dy="18">${escape(angle)}</tspan></text>
 <text x="255" y="254" class="id-label"><tspan font-weight="700">Nominal corner radius</tspan><tspan x="255" dy="18">${escape(r)}</tspan></text>
 </svg><figcaption>The corner angle changes with the insert designation. Radius is a labelled nominal value; shape, edge hone and wiper geometry are schematic.</figcaption></figure>`;
}
function sketches(d){
 const tags=[['1 · Shape',d.shape],['2 · Clearance',d.letters[1]],['3 · Tolerance',d.letters[2]],['4 · Hole / face',d.letters[3]],['5 · Size',d.sizeCode],['6 · Thickness',d.thickCode],['7 · Radius',d.radCode]];
 return `<div class="insert-diagram-info"><strong>${escape(d.input)}</strong><span>Insert ${escape(d.shape)} · ${escape(shapes[d.shape]?.[0]||'Unknown shape')}</span><span>ε ${d.shape==='R'?'round':Number.isFinite(d.angle)?d.angle+'°':'verify'}</span><span>α ${Number.isFinite(d.alpha)?d.alpha+'°':'verify'}</span></div><div class="insert-code-strip" aria-label="Designation fields">${tags.map(([title,value])=>`<div><small>${escape(title)}</small><b>${escape(value)}</b></div>`).join('')}</div><div class="insert-diagram-grid">${mainSketch(d)}${sideSketch(d)}${cornerSketch(d)}</div><p class="sourcehint">Tolerance class ${escape(d.letters[2])} is identified by the code but numerical tolerances vary with insert size and shape. Grade, coating, cutting-edge honing, exact hole size, rake and proprietary chipbreaker geometry are not encoded in these seven standard fields.</p>${d.ic===null?'<p class="sourcehint">Exact inscribed-circle dimension for this ISO size/shape combination is not included in the verified lookup; consult the insert manufacturer.</p>':''}`;
}
let turningInputCode='CNMG432';
function mountTurning(){const target=$('insertFamilyBody');if(!target)return;
 target.innerHTML=`<h2>Decode an insert designation</h2><p class="subtitle">Try <b>CNMG432</b>, <b>CNMG120408</b>, <b>WNMG432</b> or <b>DCMT21.51</b> (common ANSI and ISO forms).</p><label for="insertCodeInput">Insert marking / catalog number</label><input id="insertCodeInput" type="text" autocapitalize="characters" value="${escape(turningInputCode)}" placeholder="CNMG432 or CNMG120408"><div id="insertSketches"></div><div id="insertDecoded" aria-live="polite"></div><div class="insert-reference-grid">${miniTable('Shape · position 1',list(shapes))}${miniTable('Relief angle · position 2',list(clearance))}${miniTable('Tolerance · position 3',list(tolerance))}${miniTable('Hole / chipbreaker · position 4',list(config))}</div><h3>ISO workpiece material groups</h3><div class="tableclip"><table><thead><tr><th>Class</th><th>Workpiece group</th><th>Typical insert behavior</th></tr></thead><tbody>${[['P','Steels','Versatile edge; chip control'],['M','Stainless steels','Tough grades, sharp edges, heat resistance'],['K','Cast irons','Wear-resistant grades; often dry cutting'],['N','Nonferrous (Al, Cu)','Very sharp polished edges'],['S','Titanium / heat-resistant superalloys','High toughness and heat management'],['H','Hardened steels','Hard grades / ceramics / CBN as application requires']].map(([k,a,b])=>`<tr><th>${k}</th><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div><h3>Insert code positions</h3><p>1 Shape · 2 Relief angle · 3 Tolerance · 4 Configuration · 5 Size · 6 Thickness · 7 Corner radius · 8+ Manufacturer or optional specification. The number group uses different formats for ANSI and ISO.</p><div class="ref-callout"><strong>Examples and insert selection</strong><p>CNMG 432 = 80° diamond, 0° relief, M tolerance, double-face chipbreaker/hole, commonly 0.5000-in IC, 0.1875-in thickness, 0.03125-in nose radius. CCMT is a 7°-clearance positive insert; WNMG is an 80° trigon. Smaller entering angles can reduce radial force but change chip geometry; negative inserts are generally robust and often reversible. Check seat/holder compatibility, handedness, chipbreaker, edge prep, grade and coating.</p></div><p class="sourcehint"><b>Do not infer from the code alone:</b> insert grade/carbide chemistry, coating, exact tolerance limits, wiper geometry, chipbreaker rake, workpiece ISO class (P/M/K/N/S/H), max cutting speed, feed/depth-of-cut operating envelope, or manufacturer torque/clamping recommendations. Get those from the insert manufacturer's data sheet. Reference: <a href="https://www.machiningdoctor.com/isoturn/" target="_blank" rel="noopener noreferrer">ISO/ANSI insert identification and dimensional conventions ↗</a>.</p>`;
 const update=()=>{turningInputCode=$('insertCodeInput').value;const d=parseInsert(turningInputCode);$('insertSketches').innerHTML=d?sketches(d):'<p class="info">Enter a complete insert designation to display dimensioned drawings.</p>';$('insertDecoded').innerHTML=decode($('insertCodeInput').value);};$('insertCodeInput').addEventListener('input',update);update();}
let currentFamily='turning';
function mount(){const root=$('insertExplorer');if(!root)return;
 root.innerHTML=`<div class="insert-family-intro"><h2>Insert identification &amp; technical drawings</h2><p class="subtitle">Choose the insert application. Drawings and callouts follow the entered insert code; manufacturer-specific features are marked rather than guessed.</p><div class="insert-family-tabs" role="group" aria-label="Insert application">${[['turning','Turning'],['parting','Parting'],['grooving','Grooving'],['milling','Milling']].map(([key,label])=>`<button class="btn${key===currentFamily?' primary':''}" type="button" data-insert-family="${key}" aria-pressed="${key===currentFamily}">${label}</button>`).join('')}</div></div><div id="insertFamilyBody"></div>`;
 const render=()=>{root.querySelectorAll('[data-insert-family]').forEach(b=>{const active=b.dataset.insertFamily===currentFamily;b.classList.toggle('primary',active);b.setAttribute('aria-pressed',String(active));});if(currentFamily==='turning')mountTurning();else window.MachiningDeskSpecialInserts?.mount($('insertFamilyBody'),currentFamily);};
 root.querySelectorAll('[data-insert-family]').forEach(b=>b.addEventListener('click',()=>{currentFamily=b.dataset.insertFamily;render()}));render();}
window.MachiningDeskInserts={mount,decode,parseInsert,sketches};
})();
