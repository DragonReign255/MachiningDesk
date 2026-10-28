/* Specialized parting, grooving, and milling insert identification (v1.11.3).
   Manufacturer series are deliberately not decoded as if ISO turning numbers.
   Dimensions are stated only where the designation or an identified catalog item supports them. */
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'—';
const dim=n=>Number.isFinite(n)?`${fmt(n,2)} mm (${fmt(n/25.4,4)} in)`:'Verify manufacturer drawing';
const examples={parting:['GFN 3 IC20','MGMN300-M','N123G2-0300-0002-GF H13A'],grooving:['MGMN200-G','GFN 3W IC354','N123G2-0300-0002-GF H13A'],milling:['APKT1604PDR-76 IC928','SEKT1204AFR','RDKW1204']};
const defaults={parting:examples.parting[0],grooving:examples.grooving[0],milling:examples.milling[0]};
const shapeData={A:['85° parallelogram',85],C:['80° rhombic',80],D:['55° rhombic',55],V:['35° rhombic',35],S:['Square',90],R:['Round',360],T:['Triangle',60],W:['Trigon',80],O:['Octagon',135],P:['Pentagon',108],H:['Hexagon',120],X:['Special / maker-defined',null]};
const clearance={N:0,A:3,B:5,C:7,P:11,D:15,E:20,F:25,G:30};
const holeText={T:'Hole / clamp configuration T; check catalog',W:'Hole / clamp configuration W; check catalog',M:'Clamping configuration M; check catalog',N:'No central hole in typical N configuration',A:'Clamp configuration A; check catalog',G:'Hole / face configuration G; check catalog'};
function decode(raw,family){
 const input=String(raw??'').trim().toUpperCase().replace(/\s+/g,' ');
 if(!input)return {valid:false,error:'Enter an insert designation.'};
 if(family==='milling')return decodeMill(input);
 const compact=input.replace(/\s/g,'');
 const result={valid:true,category:family,raw:input,series:'',width:null,radius:null,grade:'',form:'',length:null,chip:'',geometry:'Parting/grooving insert geometry',mount:'Toolholder-specific',source:'',message:'Insert body depth, seat size, rake, edge preparation, and coating are catalog-dependent.'};
 let m=input.match(/^GFN\s*(\d+(?:\.\d+)?)([A-Z]?)(?:\s+([A-Z0-9-]+))?$/);
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
 return {valid:false,error:'Supported examples: GFN 3 IC20, MGMN300-M, N123G2-0300-0002-GF H13A. Other proprietary inserts require the maker’s catalog.'};
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
  rows=[['Insert family',d.series],['Application',d.category==='parting'?'Parting off':'Radial grooving'],['Cutting width · CW',dim(d.width)],['Corner radius · RE',dim(d.radius)],['Chipformer / suffix',d.chip||'Not stated'],['Grade',d.grade||'Not specified'],['Insert seating / hand','Not safely determined without holder and maker data'],['Blade depth / overall length','Not determined from this designation'],['Coating, substrate, tolerances','Check catalog for the exact grade and insert part number']];
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
 ${label(15,65,'Insert height / seat','Not coded in series')}<path class="id-leader" d="M174 67 L122 140"/>
 ${label(335,66,'Rake & chipformer','Maker / grade specific')}<path class="id-leader" d="M360 78 L251 150"/>
 ${label(320,295,'Mounting interface','Holder-specific form')}<path class="id-leader" d="M358 274 L311 229"/>
 <path class="id-centerline" d="M130 248 H430"/>`;
 return svgFrame('SIDE VIEW · SEAT & RAKE',body,'Insert height, clamping seat, rake and relief are schematic, not inferred from the width code.');}
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
 const sh=d.shape;
 if(sh==='A')return '217,127 335,127 371,248 253,248';
 if(sh==='S')return '221,126 352,126 352,258 221,258';
 if(sh==='C'||sh==='D'||sh==='V')return '285,107 368,192 285,277 202,192';
 if(sh==='T')return '285,111 378,263 192,263';
 if(sh==='W')return '286,106 328,169 367,201 317,227 294,273 248,242 208,213 252,162';
 if(sh==='O')return '252,120 316,120 356,160 356,222 316,262 252,262 211,222 211,160';
 if(sh==='P')return '285,113 370,180 340,263 235,263 201,180';
 if(sh==='H')return '250,128 321,128 366,193 321,257 250,257 205,193';
 if(sh==='R')return Array.from({length:32},(_,i)=>`${Math.round(285+83*Math.cos(2*Math.PI*i/32))},${Math.round(193+83*Math.sin(2*Math.PI*i/32))}`).join(' ');
 return '218,127 345,121 365,257 230,263';
}
function millSVG(d,which){
 const angle=d.angle===360?'Round / N/A':Number.isFinite(d.angle)?d.angle+'°':'Catalog-dependent';
 const rad=dim(d.radius),th=dim(d.s),ic=dim(d.ic),edge=d.edgeLength?dim(d.edgeLength):'Size code '+d.size+'; verify';
 if(which==='top'){
 const poly=millShape(d);
 const body=`<polygon points="${poly}" class="id-edge"/><circle cx="285" cy="192" r="53" class="id-ic"/>
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
 <div class="ref-callout"><strong>Interpretation and compatibility</strong><p>${family==='milling'?'Four-position ISO-style prefixes help identify shape, clearance and clamp style. Milling size numbers often specify an edge-length or series code rather than a literal inscribed-circle diameter. Chipbreakers, grades and exact dimensions differ by manufacturer.':'Parting and grooving insert designation systems are often proprietary. Width can be decoded for supported GFN, MGMN and N123 series, but correct holder seat, corner radius, insert length, left/right hand and tolerances require the exact catalog item.'}</p></div>`;
 const input=target.querySelector('#specialInsertCode'),output=target.querySelector('#specialInsertResult');
 const update=()=>{const d=decode(input.value,family);if(!d.valid){output.innerHTML=`<div class="info err">${E(d.error)}</div>`;return;}
  output.innerHTML=`<div class="insert-diagram-info"><strong>${E(d.raw)}</strong><span>${E(d.series)}</span><span>${family==='milling'?`Angle ${E(d.angle===360?'Round / N/A':Number.isFinite(d.angle)?d.angle+'°':'Verify')}`:`CW ${E(dim(d.width))}`}</span></div>
  <div class="insert-diagram-grid">${['top','side','corner'].map(i=>technicalSVG(d,i)).join('')}</div><h3>Designation and technical specification</h3>${detailRows(d)}
  <p class="sourcehint">${E(d.message)} <a href="${E(d.source)}" target="_blank" rel="noopener noreferrer">Manufacturer / catalog reference ↗</a></p><p class="sourcehint">Drawings are schematic orientation and callout references, <b>not dimensioned production drawings</b>. Confirm holder compatibility, edge count, tolerance class, chipbreaker, exact dimensions, grade, coating and feed ranges with the actual manufacturer's catalog.</p>`;
 };
 target.querySelectorAll('[data-special-example]').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.dataset.specialExample;defaults[family]=input.value;update();input.focus();}));
 input.addEventListener('input',()=>{defaults[family]=input.value;update()});update();
}
window.MachiningDeskSpecialInserts={mount,decode,examples};
})();
