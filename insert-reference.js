/* Turning insert identification: general ISO 1832 / ANSI B212 position decoder.
   Manufacturer suffixes and edge details are not standardized. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const shapes={H:['120° hexagon',120],O:['135° octagon',135],P:['108° pentagon',108],S:['90° square',90],T:['60° triangle',60],C:['80° rhombic (diamond)',80],D:['55° rhombic',55],E:['75° rhombic',75],M:['86° rhombic',86],V:['35° rhombic',35],W:['80° trigon',80],L:['90° rectangle',90],A:['85° parallelogram',85],B:['82° parallelogram',82],K:['55° parallelogram',55],R:['Round',360]};
const shapeNote='I is a Roman numeral marking an ISO shape category, not a standard insert shape letter. For an I-prefixed proprietary insert, the manufacturer drawing is required.';
const normalize=s=>String(s??'').trim().toUpperCase().replace(/[\s-]+/g,'');
/* ANSI legacy formats: TPG321 / TNG222 omit position four (N), RPG42 is a two-digit round insert. */
function parseMark(raw){
 const input=normalize(raw);
 let m=input.match(/^TT-?(\d{3})(?:([A-Z0-9]+))?$/);
 if(m)return {input,kind:'tt',size:m[1],grade:m[2]||''};
 m=input.match(/^([A-Z]{4})(\d{2}\.\d{2}|[0-9T]{6}|[0-9T]{3})(.*)$/);
 if(m)return {input,kind:'standard',letters:m[1],nums:m[2],suffix:m[3],abbreviated:false};
 m=input.match(/^([A-Z]{3})(\d{3})(.*)$/);
 if(m&&m[2].length===3)return {input,kind:'standard',letters:m[1]+'N',nums:m[2],suffix:m[3],abbreviated:true};
 m=input.match(/^(RPG)(\d{2})(.*)$/);
 if(m)return {input,kind:'round-short',letters:m[1]+'N',nums:m[2],suffix:m[3]};
 return null;
}
function dimensionsOf(mark){
 if(mark.kind==='tt'){
  const [a,b,c]=mark.size.split('').map(Number);
  return {ic:a*25.4/8,thick:b*25.4/16,radius:c*25.4/64,iso:false,sizeCode:String(a),thickCode:String(b),radCode:String(c)};
 }
 const sh=mark.letters[0],nums=mark.nums,iso=nums.length===6;
 const sizeCode=iso?nums.slice(0,2):nums[0];
 const thickCode=iso?nums.slice(2,4):nums.length===2?nums[1]:nums.includes('.')?nums.slice(1,4):nums[1];
 const radCode=iso?nums.slice(4,6):nums.length===2?'ROUND':nums[nums.length-1];
 const ic=iso?nominalIC[sh]?.[sizeCode]:Number(sizeCode)*25.4/8;
 const thick=iso?isoThick[thickCode]:Number(thickCode)*25.4/16;
 const radius=nums.length===2?ic/2:iso?Number(radCode)/10:Number(radCode)*25.4/64;
 return {ic:Number.isFinite(ic)?ic:null,thick:Number.isFinite(thick)?thick:null,radius:Number.isFinite(radius)?radius:null,iso,sizeCode,thickCode,radCode};
}
const clearance={N:'0° (negative, potentially two-sided)',A:'3°',B:'5°',C:'7°',P:'11°',D:'15°',E:'20°',F:'25°',G:'30°'};
const tolerance={A:'Precision ground; check IC/thickness/corner tolerance table',C:'Precision ground; tighter than molded in many sizes',G:'Ground accuracy class; tolerance is size-dependent',H:'High precision; ground; size-dependent',J:'Precision ground; geometry dependent',K:'Medium precision; reference catalog',M:'Common pressed/molded tolerance; size-dependent',U:'Utility / pressed tolerance; size-dependent',E:'Ground special tolerance',F:'Ground special tolerance'};
const config={G:'Cylindrical through-hole; chipbreaker on both faces',M:'Cylindrical through-hole; chipbreaker on one face',A:'Plain faces; through-hole',N:'Plain faces; without through-hole',T:'Countersunk clamping hole; one-sided chipbreaker (catalog-dependent)',W:'Countersunk hole; chipbreaker on both faces (catalog-dependent)',C:'Countersunk hole; no chipbreaker (catalog-dependent)',R:'Chipbreaker / retaining configuration depends on catalog',P:'Clamping-hole/face combination; verify maker'};
const I=(n)=>Number(n).toFixed(4);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function row(n,code,detail){return `<tr><th>${n}</th><td><b>${escape(code)}</b></td><td>${escape(detail)}</td></tr>`}
function decode(value){
 const mark=parseMark(value);
 if(!mark)return '<div class="info err">Enter a valid insert code (TPG321, TNG222, RPG42, CNMG432, CNMG120408, or TT-221). Proprietary parting, grooving and milling codes are also searchable above.</div>';
 const d=parseInsert(value);
 if(!d)return '<div class="info err">Unrecognized designation. Verify the catalog number.</div>';
 const unsupported=!shapes[d.shape];
 const legacy=mark.abbreviated?'Three-letter ANSI shorthand (fourth position N assumed). ':mark.kind==='round-short'?'Legacy two-digit ANSI round insert. ':mark.kind==='tt'?'Proprietary TT series; not an ISO/ANSI four-position designation. ':'';
 const size=Number.isFinite(d.ic)?dimension(d.ic):'ISO size code '+d.sizeCode+' — dimension requires manufacturer lookup';
 const thick=Number.isFinite(d.thick)?dimension(d.thick):'Thickness code '+d.thickCode+' — verify manufacturer drawing';
 const rad=Number.isFinite(d.radius)?dimension(d.radius):'Verify manufacturer drawing';
 const parts=d.letters;
 const specialTT=mark.kind==='tt';
 const body=[
  row('1 · Shape',d.shape,shapes[d.shape]?.[0]||(d.shape==='I'?shapeNote:'Not a verified ISO shape letter — manufacturer drawing required')),
  row('2 · Clearance',specialTT?'—':parts[1],specialTT?'Positive 7° rake stated by seller; relief/clearance not established':clearance[parts[1]]||'Other/special clearance; verify'),
  row('3 · Tolerance',specialTT?'—':parts[2],specialTT?'Proprietary series':tolerance[parts[2]]||'Tolerance class not decoded'),
  row('4 · Hole / face',specialTT?'TT':mark.kind==='round-short'?'—':parts[3],specialTT?'Seller specifies a through-hole and chipbreaker; hole dimension varies with size':mark.kind==='round-short'?'Not established by abbreviated RPG42; verify seller drawing':config[parts[3]]||'Maker-specific or other ISO specification'),
  row('5 · IC / size',d.sizeCode,size),
  row('6 · Thickness',d.thickCode,thick),
  row('7 · Nose radius',d.radCode,rad),
  row('8+ · Suffix / grade',d.suffix||'—',d.suffix?'Grade, chipbreaker or coating must be verified with the maker':'Not specified')
 ];
 return `<p class="subtitle"><strong>${escape(d.input)}</strong> · ${escape(legacy+(specialTT?'Seller-specific':'ISO / ANSI dimensional code'))}${unsupported?' <strong>Shape not verified.</strong>':''}</p><div class="tableclip"><table><thead><tr><th>Field</th><th>Symbol</th><th>Decoded meaning</th></tr></thead><tbody>${body.join('')}</tbody></table></div><p class="sourcehint">${specialTT?'TT series: 7° rake and chipbreaker are seller-listed and must not be mistaken for the ISO relief angle.':mark.kind==='round-short'?'RPG42: full-round nose radius equals half of the nominal inscribed-circle diameter.':'ANSI: IC commonly uses eighths, thickness sixteenths, nose radius sixty-fourths. ISO size depends on shape.'} Catalog geometry, coating, cutting data, exact hole and edge treatment require the original tooling manufacturer.</p>${unsupported?`<p class="info err">${escape(shapeNote)}</p>`:''}`;
}
const list=(obj)=>Object.entries(obj).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]);
function miniTable(title,entries){return `<h3>${title}</h3><div class="tableclip"><table><thead><tr><th>Code</th><th>Meaning</th></tr></thead><tbody>${entries.map(([k,v])=>row('',k,v)).join('')}</tbody></table></div>`;}
/* Shape-dependent, callout-annotated SVG engineering sketches. The artwork is illustrative:
   ISO/ANSI defines designation geometry, but exact hole diameters, chipbreakers,
   edge preparations and tolerances require the insert manufacturer's drawing. */
const nominalIC={
 C:{'06':6.35,'09':9.525,'12':12.7,'16':15.875},D:{'07':6.35,'11':9.525,'15':12.7},
 E:{'09':9.525,'12':12.7,'16':15.875},M:{'09':9.525,'12':12.7,'16':15.875},
 V:{'11':6.35,'16':9.525},W:{'06':9.525,'08':12.7},S:{'09':9.525,'12':12.7},
 T:{'11':6.35,'16':9.525,'22':12.7},R:{'06':6.35,'09':9.525,'12':12.7,'16':15.875},
 L:{'12':12.7}};
const isoThick={'01':1.59,'02':2.38,'03':3.18,'04':4.76,'05':5.56,'06':6.35,'07':7.94,'09':9.52,'T2':2.78,'T3':3.97};
const clearanceDegrees={N:0,A:3,B:5,C:7,P:11,D:15,E:20,F:25,G:30};
function parseInsert(raw){
 const mark=parseMark(raw);if(!mark)return null;
 const dd=dimensionsOf(mark);
 if(mark.kind==='tt'){
  return {input:mark.input,letters:'TTT?',nums:mark.size,iso:false,shape:'T',angle:60,alpha:null,
    ...dd,radius:(Number(mark.size[2])===1?.015:Number(mark.size[2])===2?.032:Number(mark.size[2])/64)*25.4,hole:true,countersink:false,chip:'one',suffix:mark.grade||'TTIM proprietary family',markKind:'tt',
    specialNote:'TT series uses 7° positive rake, not a verified 7° side clearance. Check exact hole/grade with the maker.'};
 }
 const sh=mark.letters[0],code=mark.letters[3];
 const unknown=!shapes[sh];
 return {input:mark.input,letters:mark.letters,nums:mark.nums,iso:dd.iso,shape:sh,angle:shapes[sh]?.[1],
  alpha:clearanceDegrees[mark.letters[1]],...dd,
  ic:unknown?null:dd.ic,thick:unknown?null:dd.thick,radius:unknown?null:dd.radius,
  hole:mark.kind==='round-short'?null:code==='N'?false:code==='R'||code==='P'?null:true,
  countersink:'TWC'.includes(code),chip:code==='G'||code==='W'?'both':code==='M'||code==='T'?'one':'none/unspecified',
  suffix:mark.suffix||'',markKind:mark.kind,abbreviated:!!mark.abbreviated,
  specialNote:unknown?(sh==='I'?shapeNote:'Unsupported insert shape code; real contour cannot be inferred.'):mark.kind==='round-short'?'RPG42 is a legacy two-digit round insert code. The presence and dimensions of a clamping hole are not established by these two digits.':''};
}
const number=(n,d=2)=>Number.isFinite(n)?(Number(n)+1e-9).toFixed(d):'—';
const dimension=(n)=>Number.isFinite(n)?`${number(n,2)} mm / ${number(n/25.4,4)} in`:'Not resolved from this code';
const vfmt=(p)=>`${number(p[0],2)},${number(p[1],2)}`;
function polygonForShape(sh,angle){
 // All contours are representative, with characteristic included angles and distinguishable profiles.
 if('CDEMV'.includes(sh)){
  const h=97,w=h*Math.tan((angle||80)*Math.PI/360);
  return [[0,-h],[w,0],[0,h],[-w,0]];
 }
 if('ABK'.includes(sh)){
  // Parallelograms have an offset top and bottom edge; they are NOT diamonds.
  const a=(angle||85)*Math.PI/180;const height=118;
  const dx=height/Math.tan(a);
  const w=164;
  return [[-w/2+dx/2,-height/2],[w/2+dx/2,-height/2],[w/2-dx/2,height/2],[-w/2-dx/2,height/2]];
 }
 if(sh==='S')return [[-82,-82],[82,-82],[82,82],[-82,82]];
 if(sh==='L')return [[-106,-61],[106,-61],[106,61],[-106,61]];
 if(sh==='T')return [[0,-112],[97,56],[-97,56]];
 if(sh==='W'){
  // A six-corner trigon: three 80-degree cutting noses, three secondary indents.
  const outer=99,inner=64.6;
  return Array.from({length:6},(_,i)=>{const r=i%2?inner:outer,a=i*Math.PI/3;return [r*Math.sin(a),-r*Math.cos(a)];});
 }
 if(sh==='P')return Array.from({length:5},(_,i)=>[94*Math.sin(i*2*Math.PI/5),-94*Math.cos(i*2*Math.PI/5)]);
 if(sh==='O')return Array.from({length:8},(_,i)=>[95*Math.sin((i+.5)*2*Math.PI/8),-95*Math.cos((i+.5)*2*Math.PI/8)]);
 if(sh==='H')return Array.from({length:6},(_,i)=>[95*Math.sin(i*2*Math.PI/6),-95*Math.cos(i*2*Math.PI/6)]);
 if(sh==='R')return Array.from({length:64},(_,i)=>[91*Math.sin(i*2*Math.PI/64),-91*Math.cos(i*2*Math.PI/64)]);
 return null; // Never invent a square silhouette for an unknown shape (e.g. proprietary I).
}
function mainSketch(d){
 const pts=polygonForShape(d.shape,d.angle),cx=301,cy=177;
 if(!pts)return unknownShapeSketch(d);
 const contour=pts.map(([x,y])=>vfmt([cx+x,cy+y])).join(' ');
 const inside=(pts.some(p=>p[0]<-120)||pts.some(p=>p[0]>120))?30:45;
 const minDist=Math.min(...pts.map((p,i)=>{const q=pts[(i+1)%pts.length],ax=p[0],ay=p[1],bx=q[0],by=q[1];return Math.abs(ax*by-bx*ay)/Math.hypot(bx-ax,by-ay)||50;}));
 const radius=Math.min(52,minDist*0.96);
 const [tipX,tipY]=[cx+pts[0][0],cy+pts[0][1]];
 const nominalAngle=d.angle&&d.shape!=='R'?`${d.angle}°`:'Round / N/A';
 const icText=Number.isFinite(d.ic)?`${number(d.ic)} mm (${number(d.ic/25.4,4)} in)`:'Size code '+d.sizeCode+' · verify';
 const noseText=Number.isFinite(d.radius)?`${number(d.radius,2)} mm (${number(d.radius/25.4,4)} in)`:'Verify radius';
 const holeText=d.hole===true?(d.countersink?'Countersunk hole':'Clamping hole'):d.hole===false?'No hole indicated':'Hole detail unknown';
 const hole=d.hole===true?`<circle cx="${cx}" cy="${cy}" r="15" class="id-hole"/>${d.countersink?`<circle cx="${cx}" cy="${cy}" r="23" class="id-csink"/>`:''}`:'';
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
 <path d="M${tipX} ${tipY} L185 278 L165 278" class="id-leader"/>
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
 const hole=d.hole===true?`<path d="M230 ${top+3} V${bottom-3} M244 ${top+3} V${bottom-3}" class="id-internal"/>${d.countersink?`<path d="M213 ${top+1} L230 ${top+22} M262 ${top+1} L244 ${top+22}" class="id-internal"/>`:''}`:'';
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
 if(d.shape==='R')return roundCornerSketch(d);
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
function unknownShapeSketch(d){
 return `<figure class="insert-drawing"><svg viewBox="0 0 520 310" role="img" aria-label="Unknown shape ${escape(d.shape)}; no reliable geometric drawing"><text x="16" y="24" class="id-figure-header">TOP VIEW · NONSTANDARD SHAPE</text><rect x="199" y="67" width="180" height="165" rx="14" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 7"/><text x="268" y="163" font-size="60" fill="currentColor">?</text><text x="16" y="259" class="id-label">No verified ISO profile for ${escape(d.shape)}.</text></svg><figcaption>${escape(d.specialNote||'Manufacturer drawing required.')}</figcaption></figure>`;
}
function roundCornerSketch(d){
 const r=Number.isFinite(d.radius)?dimension(d.radius):'Nominal radius not resolved';
 return `<figure class="insert-drawing"><svg viewBox="0 0 520 310" role="img" aria-label="Round insert full-radius profile ${escape(r)}"><text x="16" y="24" class="id-figure-header">ROUND CUTTING EDGE · FULL PROFILE</text><circle cx="242" cy="150" r="82" class="id-edge"/><path d="M242 150 H324 M242 150 H160" class="id-dimension"/><circle cx="242" cy="150" r="3" fill="currentColor"/> <path d="M298 91 L376 65" class="id-leader"/><text x="362" y="50" class="id-label">r = IC / 2</text><text x="16" y="271" class="id-label">Full-round cutting edge · nominal radius ${escape(r)}</text></svg><figcaption>Round inserts have no corner included angle; the nominal cutting radius is half the inscribed-circle diameter. Actual edge preparation is maker-specific.</figcaption></figure>`;
}
function shapeGallery(){
 return `<details class="insert-shape-index"><summary>Standard insert shape library · 16 illustrated profiles</summary><p class="subtitle">All 16 ISO 1832 shape letters have a plan-view sketch. Select one to preview that profile using the current size and clearance fields.</p><div class="insert-shape-gallery">${Object.entries(shapes).map(([code,[desc,ang]])=>{
 const pts=polygonForShape(code,ang),poly=pts.map(([x,y])=>`${(x*.25+40).toFixed(1)},${(y*.25+36).toFixed(1)}`).join(' ');
 return `<button type="button" class="insert-shape-item" data-insert-shape="${code}" title="${escape(desc)}"><svg viewBox="0 0 80 72" role="img" aria-label="${escape(desc)}"><polygon points="${poly}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg><b>${code}</b><small>${escape(desc)}</small></button>`;}).join('')}</div><p class="sourcehint"><b>About “I”:</b> I is a Roman numeral identifying a class of shapes in ISO 1832, not a designated insert shape letter. A supplier-specific “I” code needs a catalog drawing.</p></details>`;
}
function sketches(d){
 const tags=d.markKind==='tt'?[['Series','TT'],['Size code',d.sizeCode],['Thickness code',d.thickCode],['Radius code',d.radCode],['Holder family','TTIM']]:[['1 · Shape',d.shape],['2 · Clearance',d.letters[1]],['3 · Tolerance',d.letters[2]],['4 · Hole / face',d.letters[3]],['5 · Size',d.sizeCode],['6 · Thickness',d.thickCode],['7 · Radius',d.radCode]];
 return `<div class="insert-diagram-info"><strong>${escape(d.input)}</strong><span>Insert ${escape(d.shape)} · ${escape(shapes[d.shape]?.[0]||'Unknown shape')}</span><span>ε ${d.shape==='R'?'round':Number.isFinite(d.angle)?d.angle+'°':'verify'}</span><span>α ${Number.isFinite(d.alpha)?d.alpha+'°':'verify'}</span></div><div class="insert-code-strip" aria-label="Designation fields">${tags.map(([title,value])=>`<div><small>${escape(title)}</small><b>${escape(value)}</b></div>`).join('')}</div><div class="insert-diagram-grid">${mainSketch(d)}${sideSketch(d)}${cornerSketch(d)}</div>${d.specialNote?`<p class="sourcehint">${escape(d.specialNote)}</p>`:''}<p class="sourcehint">${d.markKind==='tt'?'TT-221 belongs to a proprietary triangular-insert family; it is not a seven-position ISO/ANSI designation. Check TTIM holder compatibility.':`Tolerance class ${escape(d.letters[2])} is identified by the code but numerical tolerances vary with insert size and shape. Grade, coating, cutting-edge honing, exact hole size, rake and proprietary chipbreaker geometry are not encoded in these seven standard fields.`}</p>${d.ic===null?'<p class="sourcehint">Exact inscribed-circle dimension for this ISO size/shape combination is not included in the verified lookup; consult the insert manufacturer.</p>':''}`;
}
let turningInputCode='CNMG432';
function mountTurning(){const target=$('insertFamilyBody');if(!target)return;
 target.innerHTML=`<h2>Decode an insert designation</h2><p class="subtitle">Try <b>TPG321</b>, <b>TNG222</b>, <b>RPG42</b>, <b>TT-221</b>, <b>CNMG432</b>, or <b>DCMT21.51</b>. Three-letter ANSI and proprietary TT-family codes are supported.</p><label for="insertCodeInput">Insert marking / catalog number</label><input id="insertCodeInput" type="text" autocapitalize="characters" value="${escape(turningInputCode)}" placeholder="CNMG432 or CNMG120408"><div class="insert-special-examples" aria-label="Turning insert examples">${["TPG321","TNG222","RPG42","TT-221","ENMG432","CNMG432"].map(v=>`<button type="button" class="btn" data-turning-example="${v}">${v}</button>`).join('')}</div><div id="insertSketches"></div><div id="insertDecoded" aria-live="polite"></div>${shapeGallery()}<div class="insert-reference-grid">${miniTable('Shape · position 1',list(shapes))}${miniTable('Relief angle · position 2',list(clearance))}${miniTable('Tolerance · position 3',list(tolerance))}${miniTable('Hole / chipbreaker · position 4',list(config))}</div><h3>ISO workpiece material groups</h3><div class="tableclip"><table><thead><tr><th>Class</th><th>Workpiece group</th><th>Typical insert behavior</th></tr></thead><tbody>${[['P','Steels','Versatile edge; chip control'],['M','Stainless steels','Tough grades, sharp edges, heat resistance'],['K','Cast irons','Wear-resistant grades; often dry cutting'],['N','Nonferrous (Al, Cu)','Very sharp polished edges'],['S','Titanium / heat-resistant superalloys','High toughness and heat management'],['H','Hardened steels','Hard grades / ceramics / CBN as application requires']].map(([k,a,b])=>`<tr><th>${k}</th><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div><h3>Insert code positions</h3><p>1 Shape · 2 Relief angle · 3 Tolerance · 4 Configuration · 5 Size · 6 Thickness · 7 Corner radius · 8+ Manufacturer or optional specification. The number group uses different formats for ANSI and ISO.</p><div class="ref-callout"><strong>Examples and insert selection</strong><p>CNMG 432 = 80° diamond, 0° relief, M tolerance, double-face chipbreaker/hole, commonly 0.5000-in IC, 0.1875-in thickness, 0.03125-in nose radius. CCMT is a 7°-clearance positive insert; WNMG is an 80° trigon. Smaller entering angles can reduce radial force but change chip geometry; negative inserts are generally robust and often reversible. Check seat/holder compatibility, handedness, chipbreaker, edge prep, grade and coating.</p></div><p class="sourcehint"><b>Do not infer from the code alone:</b> insert grade/carbide chemistry, coating, exact tolerance limits, wiper geometry, chipbreaker rake, workpiece ISO class (P/M/K/N/S/H), max cutting speed, feed/depth-of-cut operating envelope, or manufacturer torque/clamping recommendations. Get those from the insert manufacturer's data sheet. Reference: <a href="https://www.machiningdoctor.com/isoturn/" target="_blank" rel="noopener noreferrer">ISO/ANSI insert identification and dimensional conventions ↗</a>.</p>`;
 const update=()=>{turningInputCode=$('insertCodeInput').value;const d=parseInsert(turningInputCode);$('insertSketches').innerHTML=d?sketches(d):'<p class="info">Enter a complete insert designation to display dimensioned drawings.</p>';$('insertDecoded').innerHTML=decode($('insertCodeInput').value);};$('insertCodeInput').addEventListener('input',update);target.querySelectorAll('[data-turning-example]').forEach(b=>b.addEventListener('click',()=>{$('insertCodeInput').value=b.dataset.turningExample;update();}));target.querySelectorAll('[data-insert-shape]').forEach(b=>b.addEventListener('click',()=>{const m=parseMark($('insertCodeInput').value);$('insertCodeInput').value=b.dataset.insertShape+(m?.kind==='standard'?m.letters.slice(1):'NMG')+(m?.kind==='standard'?m.nums:'432');update();$('insertCodeInput').focus();}));update();}
let currentFamily='turning';
function mount(){const root=$('insertExplorer');if(!root)return;
 root.innerHTML=`<div class="insert-family-intro"><h2>Insert identification &amp; technical drawings</h2><p class="subtitle">Choose the insert application. Drawings and callouts follow the entered insert code; manufacturer-specific features are marked rather than guessed.</p><div class="insert-family-tabs" role="group" aria-label="Insert application">${[['turning','Turning'],['parting','Parting'],['grooving','Grooving'],['milling','Milling']].map(([key,label])=>`<button class="btn${key===currentFamily?' primary':''}" type="button" data-insert-family="${key}" aria-pressed="${key===currentFamily}">${label}</button>`).join('')}</div></div><form id="insertLookup" class="insert-universal-search"><label for="insertLookupCode">Identify any insert</label><div><input id="insertLookupCode" type="text" placeholder="GTN 5 IC354, HCI-4R, TPG321, APKT1604…" spellcheck="false" autocomplete="off"><button class="btn primary" type="submit">Identify</button></div><small>Automatically chooses Turning, Parting, Grooving, or Milling.</small></form><div id="insertFamilyBody"></div>`;
 const render=()=>{root.querySelectorAll('[data-insert-family]').forEach(b=>{const active=b.dataset.insertFamily===currentFamily;b.classList.toggle('primary',active);b.setAttribute('aria-pressed',String(active));});if(currentFamily==='turning')mountTurning();else window.MachiningDeskSpecialInserts?.mount($('insertFamilyBody'),currentFamily);};
 root.querySelectorAll('[data-insert-family]').forEach(b=>b.addEventListener('click',()=>{currentFamily=b.dataset.insertFamily;render()}));
 root.querySelector('#insertLookup').addEventListener('submit',e=>{e.preventDefault();const code=root.querySelector('#insertLookupCode').value.trim().toUpperCase();if(!code)return;
  const compact=normalize(code);
  currentFamily=/^(GFN|GTN|GTL|GTR|HCI)/.test(compact)?'parting':/^(MGMN|N123|HGMN)/.test(compact)?'grooving':/^(APKT|SEKT|RDKW|SEHT|RCKT|ADKT)/.test(compact)?'milling':'turning';
  if(currentFamily==='turning')turningInputCode=code;else window.MachiningDeskSpecialInserts?.setDefault(currentFamily,code);
  render();});render();}
window.MachiningDeskInserts={mount,decode,parseInsert,sketches};
})();
