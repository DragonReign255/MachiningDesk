/* Specialized parting, grooving, and milling insert identification (v1.11.4).
   Manufacturer series are deliberately not decoded as if ISO turning numbers.
   Dimensions are stated only where the designation or an identified catalog item supports them. */
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?(Number(n)+1e-9).toFixed(d):'—';
const dim=n=>Number.isFinite(n)?`${fmt(n,2)} mm (${fmt(n/25.4,4)} in)`:'Verify manufacturer drawing';
const examples={parting:['GTN 5 IC354','HCI-4R HU30','GFN 3 IC20','MGMN300-M','N123G2-0300-0002-GF H13A'],grooving:['GTN 5 IC354','MGMN200-G','HCI-4R HU30','GFN 3W IC354','N123G2-0300-0002-GF H13A'],milling:['APKT1604PDR-76 IC928','SEKT1204AFR','RDKW1204']};
const defaults={parting:examples.parting[0],grooving:examples.grooving[0],milling:examples.milling[0]};
const shapeData={A:['85° parallelogram',85],B:['82° parallelogram',82],K:['55° parallelogram',55],
 C:['80° rhombic',80],D:['55° rhombic',55],E:['75° rhombic',75],M:['86° rhombic',86],V:['35° rhombic',35],
 S:['Square',90],L:['Rectangle',90],R:['Round',360],T:['Triangle',60],W:['Trigon',80],
 O:['Octagon',135],P:['Pentagon',108],H:['Hexagon',120],X:['Special / maker-defined',null]};
const clearance={N:0,A:3,B:5,C:7,P:11,D:15,E:20,F:25,G:30};
const holeText={T:'Hole / clamp configuration T; check catalog',W:'Hole / clamp configuration W; check catalog',M:'Clamping configuration M; check catalog',N:'No central hole in typical N configuration',A:'Clamp configuration A; check catalog',G:'Hole / face configuration G; check catalog'};
function decode(raw,family){
 const input=String(raw??'').trim().toUpperCase().replace(/\s+/g,' ');
 if(!input)return {valid:false,error:'Enter an insert designation.'};
 if(family==='milling')return decodeMill(input);
 const compact=input.replace(/\s/g,'');
 const result={valid:true,category:family,raw:input,series:'',width:null,radius:null,grade:'',form:'',length:null,chip:'',geometry:'Parting/grooving insert geometry',mount:'Toolholder-specific',source:'',substrate:'',coating:'',message:'Insert body depth, seat size, rake, edge preparation, and coating are catalog-dependent.'};
 // Official Haas HCI cut-off inserts: the R designates rounded cutting profile, not a generic ISO radius code.
 let m=compact.match(/^HCI-?(\d+(?:\.\d+)?)([A-Z]?)(?:HU30)?$/);
 if(m){const width=Number(m[1]);if(![2,3,4].includes(width))return {valid:false,error:'HCI cut-off size not in verified Haas 2/3/4 mm family.'};
  result.series='Haas HCI cut-off';result.form='Carbide cut-off insert · R profile';result.width=width;
  result.grade=compact.includes('HU30')?'HU30':'HU30 (Haas catalog example)';result.substrate='Carbide';
  result.source='https://www.haastooling.com/p/02-0494';result.chip='R cutting profile';
  if(width===4){result.length=10.8;result.radius=.25;result.message='Verified Haas HCI-4R HU30: CW 4.0 mm, insert length 10.8 mm, corner radius 0.25 mm, carbide. Dimensions of the 2/3 mm family must be checked separately.';}
  else result.message='Haas HCI carbide cut-off family, nominal width from size; precise corner radius and length require the specific Haas part drawing.';
  return result;
 }
 // ISCAR T-CUT GTN is a self-grip neutral parting / grooving family, not an ISO four-letter insert.
 m=compact.match(/^GT([NRL])-?(\d+(?:\.\d+)?)([A-Z]?)(?:-?(\d+)D)?(?:IC-?(\d+))?$/);
 if(m){const size=Number(m[2]);const known={2:[.087,.006],3:[.118,.012],4:[.161,.008],4.8:[.188,.011],5:[.201,.011],6:[.250,.014],8:[.315,.016],9:[.375,.018]};
  const entry=known[size];if(!entry)return {valid:false,error:'GTN size not found in verified ISCAR Self-Grip table.'};
  result.series='ISCAR GT'+m[1]+' · T-CUT Self-Grip';result.form='Neutral / right / left '+(family==='parting'?'parting':'grooving')+' insert';
  result.width=(size===3&&m[3]==='W'?.122:entry[0])*25.4;result.radius=(size===3&&m[3]==='W'?.008:entry[1])*25.4;
  result.grade=m[5]?'IC'+m[5]:'';result.chip=m[3]||'T-CUT';result.substrate='Carbide';
  result.coating=result.grade==='IC354'?'PVD coated (IC354)':'';result.source='https://www.traverscanada.com/product/iscar-6091664-parting-grooving-insert-19-533-451';
  result.message='ISCAR nominal series table: cutting width and corner radius are supplied from catalog dimensions (not inferred as integer millimeters). Confirm T-CUT versus F-CUT holder compatibility, hand and special suffixes.';
  if(size===5 && m[1]==='N' && (!m[3]||m[3]==='')){result.width=5.08;result.radius=.2794;}
  return result;
 }
 m=input.match(/^GFN\s*(\d+(?:\.\d+)?)([A-Z]?)(?:\s+([A-Z0-9-]+))?$/);
 if(m){result.series='Iscar GFN / Self-Grip';result.width=+m[1];if(result.width<=0||result.width>15)return {valid:false,error:'GFN width is not in a reasonable millimeter range.'};result.form='Single-end parting/grooving insert (GFN family)';result.chip=m[2]||'Catalog-dependent';result.grade=m[3]||'';
 // Some vendor examples publish a corner radius; it is not encoded in the series width.
 if(/^GFN\s*3(?:\s+|$)/.test(input)&&/\bIC20\b/.test(input)){result.radius=.2;result.source='https://webshop.iscarusa.com/catalogue/product/1947172';result.message='Nominal GFN 3 IC20 catalog example: width 3.0 mm, corner radius 0.2 mm. Other GFN styles and grades can differ.';}
 else if(/^GFN\s*3W(?:\s+|$)/.test(input)&&/\bIC354\b/.test(input)){result.radius=.2;result.source='https://webshop.iscar.co.uk/catalogue/product/1949551';result.message='GFN 3W IC354 catalog example: width 3.0 mm, corner radius 0.2 mm.';}
 else {result.source='https://webshop.iscarusa.com/catalogue/product/1947172';result.message='GFN nominal groove width follows the size in millimeters; nose radius, rake and chipformer depend on grade and style.';}
 return result;}
 m=compact.match(/^MGMN(\d{3})(?:-([A-Z0-9]+))?(?:([A-Z0-9]+))?$/);
 if(m){result.series='MGMN (supplier-specific insert family)';result.width=Number(m[1])/100;result.form='Grooving / parting insert';result.chip=m[2]||'Supplier-specific';result.grade=m[3]||'';result.source='https://cuttermall.com/en/products/grooving/mgmn/';result.message='MGMN width-code examples: 200 = 2.0 mm, 300 = 3.0 mm, 400 = 4.0 mm. Corner radius, cutting-edge count and physical seat dimensions depend on the manufacturer.';return result;}
 m=input.match(/^N123([A-Z0-9]{2})-(\d{4})-(\d{4})-([A-Z0-9]+)(?:\s+([A-Z0-9]+))?$/);
 if(m){result.series='Sandvik CoroCut N123';result.width=Number(m[2])/100;result.form='CoroCut-family parting/grooving insert';result.chip=m[4];result.grade=m[5]||'';result.source='https://epublications.sandvik.coromant.com/frontend/catalogs/1248966/1/pdf/complete.pdf';result.message=`N123 ${m[1]} is a seat/variant identifier. The ${m[2]} group gives ${fmt(result.width,2)} mm cutting width for this catalog family; ${m[3]} and ${m[4]} require the family catalog. Verify hand, width tolerances and corner radius.`;return result;}
 return {valid:false,error:'Supported families include GTN-5 IC354, HCI-4R, GFN 3 IC20, MGMN300-M, and N123G2-0300-0002-GF. Unrecognized proprietary codes require the maker’s catalog.'};
}
function decodeMill(input){
 const m=input.match(/^([A-Z]{4})\s*([0-9]{2})([0-9T]{2})([A-Z0-9-]*?)(?:\s+([A-Z0-9-]+))?$/);
 if(!m)return {valid:false,error:'Enter a milling insert designation such as APKT1604PDR, SEKT1204AFR, or RDKW1204. Exact chipbreaker/grade suffixes vary.'};
 const code=m[1],shape=code[0],alpha=clearance[code[1]],feature=code[3],size=m[2],thickness=m[3];
 if(!shapeData[shape])return {valid:false,error:'Shape code not recognized by the milling-insert reference. Consult the insert catalog.'};
 const d={valid:true,category:'milling',raw:input,code,size,thickness,shape,angle:shapeData[shape][1],shapeLabel:shapeData[shape][0],alpha,feature,
 suffix:m[4]||'',grade:m[5]||'',width:null,radius:null,ic:null,s:null,edgeLength:null,series:'ISO-style indexable milling insert',source:'https://www.ingersoll-imc.com/product-family/3378143',
 message:'ISO-style prefix indicates shape, clearance, tolerance and hole/face configuration. Numeric size and thickness positions are codes: exact dimensions, rake face and grade must come from the insert maker.'};
 if(code==='APKT'&&size==='16'&&thickness==='04'){
  d.source='https://www.penntoolco.com/66715897/';
  d.message='APKT 1604 is a common 85°-parallelogram milling series with 11° clearance. Dimensions differ between manufacturers; do not read “16” as exact edge length or “04” as an exact thickness.';
  if(input.replace(/\s+/g,'').includes('APKT1604PDR-76IC928')){d.ic=9.45;d.s=5.30;d.radius=.8;d.edgeLength=17.3;d.message='Catalog example: Iscar APKT1604PDR-76 IC928. Dimensions are for this specific product, not every APKT 1604 insert.';}
 }
 if(code==='SEKT'&&size==='12'&&thickness==='04'){
  d.source='https://www.ingersoll-imc.com/product-family/3378143';
  if(input.replace(/\s+/g,'')==='SEKT1204AFR'){d.ic=12.7;d.s=5.08;d.radius=.762;d.message='Catalog example: Ingersoll SEKT1204AFR (0.500-in IC, 0.200-in thickness, 0.030-in corner radius). Do not assume identical dimensions across makers.';}
 }
 return d;
}
function detailRows(d){let rows;
 if(d.category==='milling'){
  rows=[['Insert family',d.series],['Shape · code '+d.shape,d.shapeLabel],['Clearance · code '+d.code[1],Number.isFinite(d.alpha)?d.alpha+'°':'Check manufacturer'],['Tolerance · code '+d.code[2],'Tolerance class; permissible deviations depend on geometry and size'],['Clamp / face · code '+d.feature,holeText[d.feature]||'Catalog-specific hole/face type'],['Size · '+d.size,d.edgeLength?dim(d.edgeLength)+' · catalog-specific effective edge length':'Nominal size code; actual cutting-edge length / IC depend on series'],['Thickness · '+d.thickness,Number.isFinite(d.s)?dim(d.s):'Thickness code, not a literal thickness in mm'],['Inscribed circle · IC',dim(d.ic)],['Corner radius · rε',dim(d.radius)],['Suffix / chipbreaker',d.suffix||'Not provided'],['Grade',d.grade||'Not provided']];
 }else{
  rows=[['Insert family',d.series],['Application',d.category==='parting'?'Parting off':'Radial grooving'],['Cutting width · CW',dim(d.width)],['Corner radius · RE',dim(d.radius)],['Chipformer / suffix',d.chip||'Not stated'],['Grade',d.grade||'Not specified'],['Insert seating / hand','Not safely determined without holder and maker data'],['Overall length',Number.isFinite(d.length)?dim(d.length):'Not determined from this designation'],['Substrate',d.substrate||'Verify manufacturer'],['Coating',d.coating||'Verify manufacturer grade'],['Other tolerances','Check catalog for the exact grade and insert part number']];
 }
 return `<div class="tableclip insert-spec-table"><table><thead><tr><th>Dimension / property</th><th>Decoded detail</th></tr></thead><tbody>${rows.map(([k,v])=>`<tr><th>${E(k)}</th><td>${E(v)}</td></tr>`).join('')}</tbody></table></div>`;
}
function technicalSVG(d,which){return d.category==='milling'?millSVG(d,which):slotSVG(d,which);}
function svgFrame(title,body,caption){return `<figure class="insert-drawing insert-special-drawing"><svg viewBox="0 0 540 345" role="img" aria-label="${E(title)}: ${E(caption)}"><text x="18" y="25" class="id-figure-header">${E(title)}</text>${body}</svg><figcaption>${E(caption)}</figcaption></figure>`;}
function label(x,y,head,detail){return `<text x="${x}" y="${y}" class="id-label"><tspan font-weight="700">${E(head)}</tspan><tspan x="${x}" dy="17">${E(detail)}</tspan></text>`;}
function slotSVG(d,which){
 const w=dim(d.width),rad=Number.isFinite(d.radius)?dim(d.radius):'Verify';const isPart=d.category==='parting';
 if(which==='top'){
 const body=`<path class="id-edge" d="M250 267 L250 133 Q250 120 262 120 H312 Q324 120 324 133 V267 Z"/>
 <path class="id-centerline" d="M287 72 V291"/><path class="id-chip" d="M260 146 Q287 132 312 146"/>
 <path class="id-dimension" d="M250 91 H324 M250 86 V107 M324 86 V107"/>
 ${label(21,65,'CW · cutting width',w)}<path class="id-leader" d="M195 68 H224 L287 91"/>
 ${label(21,179,'RE · cutting corner',rad)}<path class="id-leader" d="M182 181 H209 L250 126"/>
 ${label(363,154,'Cutting tip','Symmetric front edge')}<path class="id-leader" d="M326 124 L353 138"/>
 ${label(360,265,'Feed direction',isPart?'Radial to centerline':'Radial to groove depth')}<path class="id-leader" d="M324 232 H352"/><path d="M287 210 V154 l-7 12 m7-12 l7 12" class="id-angle-arc"/>`;
 return svgFrame('TOP VIEW · CUTTING TIP',body,'CW width is decoded from the series; actual chamfers, corner details, chipformer and seat are manufacturer-specific.');}
 if(which==='side'){
 const body=`<path class="id-edge" d="M138 239 L138 147 Q141 129 167 122 L343 146 L347 227 L231 239 Z"/>
 <path class="id-chip" d="M148 142 Q194 155 218 148 Q240 142 256 153"/>
 <path class="id-dimension" d="M123 126 V239 M118 126 H133 M118 239 H133"/>
 ${label(15,65,'Insert length / body',Number.isFinite(d.length)?dim(d.length):'See manufacturer drawing')}<path class="id-leader" d="M174 67 L122 140"/>
 ${label(335,66,'Rake & chipformer','Maker / grade specific')}<path class="id-leader" d="M360 78 L251 150"/>
 ${label(320,295,'Mounting interface','Holder-specific form')}<path class="id-leader" d="M358 274 L311 229"/>
 <path class="id-centerline" d="M130 248 H430"/>`;
 return svgFrame('SIDE VIEW · SEAT & RAKE',body,'Clamping seat, rake and relief are schematic. Length is stated only when verified from an exact catalog item.');}
 const body=`<path d="M126 78 H423 V261 H126 Z" class="id-edge"/><path d="M126 108 H423" class="id-centerline"/>
 <path d="M256 78 V225 H295 V78" class="id-edge"/><path d="M256 225 H295" class="id-chip"/>
 <path d="M256 55 H295 M256 51 V66 M295 51 V66" class="id-dimension"/>
 ${label(15,38,'Groove / kerf width',w)}<path d="M210 41 H236 L275 55" class="id-leader"/>
 ${label(15,198,'Front-end radius',rad)}<path d="M145 203 H218 L256 225" class="id-leader"/>
 ${label(345,190,'Engagement depth',isPart?'To cutoff center':'Set by operation')}<path d="M295 220 L334 181" class="id-leader"/>
 ${label(325,299,'Workpiece','Schematic cross-section')}`;
 return svgFrame(isPart?'WORKPIECE · PARTING KERF':'WORKPIECE · GROOVE PROFILE',body,'Width is insert cutting width, not a suggested feed or safe maximum plunge depth.');
}
function millShape(d){
 const sh=d.shape,angle=d.angle;
 const xy=[];
 if('CDEMV'.includes(sh)){
  const h=85,w=h*Math.tan(angle*Math.PI/360);
  xy.push([0,-h],[w,0],[0,h],[-w,0]);
 }else if('ABK'.includes(sh)){
  const h=130,w=155,dx=h/Math.tan(angle*Math.PI/180);
  xy.push([-w/2+dx/2,-h/2],[w/2+dx/2,-h/2],[w/2-dx/2,h/2],[-w/2-dx/2,h/2]);
 }else if(sh==='S')xy.push([-70,-70],[70,-70],[70,70],[-70,70]);
 else if(sh==='L')xy.push([-100,-54],[100,-54],[100,54],[-100,54]);
 else if(sh==='T')xy.push([0,-92],[80,46],[-80,46]);
 else if(sh==='W'){for(let i=0;i<6;i++){const r=i%2?56.8:87,a=i*Math.PI/3;xy.push([r*Math.sin(a),-r*Math.cos(a)]);}}
 else if('OPH'.includes(sh)){const n={O:8,P:5,H:6}[sh];for(let i=0;i<n;i++){const a=(i+(n===8?.5:0))*2*Math.PI/n;xy.push([83*Math.sin(a),-83*Math.cos(a)]);}}
 else if(sh==='R'){for(let i=0;i<64;i++){const a=i*2*Math.PI/64;xy.push([82*Math.sin(a),-82*Math.cos(a)]);}}
 else return null;
 return xy;
}
function millSVG(d,which){
 const angle=d.angle===360?'Round / N/A':Number.isFinite(d.angle)?d.angle+'°':'Catalog-dependent';
 const rad=dim(d.radius),th=dim(d.s),ic=dim(d.ic),edge=d.edgeLength?dim(d.edgeLength):'Size code '+d.size+'; verify';
 if(which==='top'){
 const points=millShape(d);
 const poly=points?.map(([x,y])=>`${(285+x).toFixed(2)},${(192+y).toFixed(2)}`).join(' ')||'';
 const icr=points?Math.min(...points.map((p,i)=>{const q=points[(i+1)%points.length];return Math.abs(p[0]*q[1]-p[1]*q[0])/Math.hypot(q[0]-p[0],q[1]-p[1]);})):0;
 const body=`${points?`<polygon points="${poly}" class="id-edge"/><circle cx="285" cy="192" r="${icr.toFixed(2)}" class="id-ic"/>`:'<text x="194" y="190" class="id-label">Special shape: verify maker</text>'}
 ${d.feature==='N'?'':'<circle cx="285" cy="192" r="17" class="id-hole"/><circle cx="285" cy="192" r="23" class="id-csink"/>'}
 <path d="M195 111 H241 L260 138" class="id-leader"/>${label(15,90,'Shape / corner angle',d.shapeLabel+' · '+angle)}
 <path d="M207 169 H229 L242 191" class="id-leader"/>${label(14,156,'IC · inscribed circle',ic)}
 <path d="M310 192 L403 179" class="id-leader"/>${label(388,157,'Clamp / hole',holeText[d.feature]||'See maker catalog')}
 <path d="M347 249 L388 279" class="id-leader"/>${label(334,301,'rε · corner',rad)}`;
 return svgFrame('PLAN VIEW · INDEXABLE MILLING INSERT',body,'Plan profile changes with the decoded shape. Dashed IC is conceptual where size cannot be verified; orientation and hole geometry are schematic.');}
 if(which==='side'){
  const alpha=Number.isFinite(d.alpha)?d.alpha:null;const shift=alpha===null?0:Math.min(25,Math.tan(alpha*Math.PI/180)*83);
  const body=`<path class="id-edge" d="M157 121 H381 L${381-shift} 215 H${157+shift} Z"/><path class="id-internal" d="M258 122 V212 M277 122 V212"/>
  <path class="id-dimension" d="M403 121 V215 M397 121 H414 M397 215 H414"/>
  <path class="id-leader" d="M180 113 L120 76"/>${label(15,68,'α · clearance',alpha===null?'Verify':alpha+'° · code '+d.code[1])}
  <path class="id-leader" d="M403 170 L456 151"/>${label(386,118,'s · thickness',th)}
  <path class="id-leader" d="M269 215 L333 270"/>${label(294,292,'Hole / seat',holeText[d.feature]||'Catalog drawing required')}`;
  return svgFrame('SIDE VIEW · THICKNESS & CLEARANCE',body,'Relief angle comes from position 2 where standardized. Clamping hole, rake and edge prep need the manufacturer drawing.');
 }
 const body=`<path class="id-edge" d="M185 250 L271 105 Q283 90 299 108 L384 250"/>
 <path class="id-centerline" d="M236 185 L283 105 L330 185"/>
 <path class="id-angle-arc" d="M254 160 Q284 183 312 160"/>
 <path class="id-leader" d="M290 127 L363 87"/>${label(364,68,'Included angle',angle)}
 <path class="id-leader" d="M286 111 L198 72"/>${label(17,60,'rε · corner radius',rad)}
 <path class="id-leader" d="M343 216 L390 253"/>${label(316,278,'Edge / size code',edge)}`;
 return svgFrame('CUTTING CORNER · EDGE DETAILS',body,'Included angle is nominal for the identified profile. Cutting-edge length, radius and wiper land are catalog-dependent unless an exact verified item is entered.');
}
const categoryLabels={parting:'Parting inserts',grooving:'Grooving inserts',milling:'Indexable milling inserts'};
function mount(target,family){
 if(!target||!examples[family])return;
 target.innerHTML=`<div class="insert-special-head"><h3>${categoryLabels[family]}</h3><p class="subtitle">Decode common insert-series markings. Select a sample or enter your own catalog designation.</p></div>
 <label for="specialInsertCode">Insert designation</label><input id="specialInsertCode" type="text" autocapitalize="characters" spellcheck="false" autocomplete="off" value="${E(defaults[family])}" placeholder="Insert series / number / grade">
 <div class="insert-special-examples" aria-label="Example insert codes">${examples[family].map(v=>`<button type="button" class="btn" data-special-example="${E(v)}">${E(v)}</button>`).join('')}</div><div id="specialInsertResult" aria-live="polite"></div>
 <div class="ref-callout"><strong>Interpretation and compatibility</strong><p>${family==='milling'?'Four-position ISO-style prefixes help identify shape, clearance and clamp style. Milling size numbers often specify an edge-length or series code rather than a literal inscribed-circle diameter. Chipbreakers, grades and exact dimensions differ by manufacturer.':'Parting and grooving insert designation systems are often proprietary. The reference recognizes ISCAR GTN, Haas HCI, GFN, MGMN and N123 series, but correct holder seat, corner radius, insert length, left/right hand and tolerances require the exact catalog item.'}</p></div>`;
 const input=target.querySelector('#specialInsertCode'),output=target.querySelector('#specialInsertResult');
 const update=()=>{const d=decode(input.value,family);if(!d.valid){output.innerHTML=`<div class="info err">${E(d.error)}</div>`;return;}
  output.innerHTML=`<div class="insert-diagram-info"><strong>${E(d.raw)}</strong><span>${E(d.series)}</span><span>${family==='milling'?`Angle ${E(d.angle===360?'Round / N/A':Number.isFinite(d.angle)?d.angle+'°':'Verify')}`:`CW ${E(dim(d.width))}`}</span></div>
  <div class="insert-diagram-grid">${['top','side','corner'].map(i=>technicalSVG(d,i)).join('')}</div><h3>Designation and technical specification</h3>${detailRows(d)}
  <p class="sourcehint">${E(d.message)} <a href="${E(d.source)}" target="_blank" rel="noopener noreferrer">Manufacturer / catalog reference ↗</a></p><p class="sourcehint">Drawings are schematic orientation and callout references, <b>not dimensioned production drawings</b>. Confirm holder compatibility, edge count, tolerance class, chipbreaker, exact dimensions, grade, coating and feed ranges with the actual manufacturer's catalog.</p>`;
 };
 target.querySelectorAll('[data-special-example]').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.dataset.specialExample;defaults[family]=input.value;update();input.focus();}));
 input.addEventListener('input',()=>{defaults[family]=input.value;update()});update();
}
window.MachiningDeskSpecialInserts={mount,decode,examples,setDefault:(family,code)=>{if(defaults[family]!==undefined)defaults[family]=code;}};
})();
