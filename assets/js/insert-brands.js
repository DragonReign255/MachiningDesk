/* Machining Desk multi-manufacturer insert reference.
 ISO/ANSI standard geometries are decoded from designation; proprietary families and grades
 are NOT universally decodable. Unknowns can be stored as user-specified physical profiles.
 Source families: manufacturers' public catalogs linked within UI. */
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const MANUFACTURERS=[
['any','Auto / any maker','https://www.sandvik.coromant.com/'],
['kennametal','Kennametal','https://www.kennametal.com/'],
['iscar','ISCAR','https://www.iscar.com/'],
['haas','Haas Tooling','https://www.haastooling.com/'],
['sandvik','Sandvik Coromant','https://www.sandvik.coromant.com/'],
['seco','Seco Tools','https://www.secotools.com/'],
['walter','Walter','https://www.walter-tools.com/'],
['mitsubishi','Mitsubishi Materials','https://www.mmc-carbide.com/'],
['tungaloy','Tungaloy','https://tungaloy.com/'],
['kyocera','Kyocera','https://www.kyocera-unimerco.com/'],
['sumitomo','Sumitomo Electric','https://www.sumitool.com/'],
['korloy','Korloy','https://www.korloy.com/'],
['other','Other / user catalog','']];
const known=[
// vendor, regex, family, category, description, source
['iscar',/^(ICP|ICK|ICM|ICN|ICG|HCP|FCP|QCP|IHP)(?:\s|\d|[-])/,'SUMOCHAM exchangeable drill head','drilling','Replaceable drill head with two cutting lips and holder-specific back seat; geometry depends on suffix.','https://www.iscar.com/en-az/products/hole-making/drilling/sumocham-indexable-heads/head-variety'],
['iscar',/^(DGN|DGNC|DGNM|GTN|GTR|GTL|GFN|PENTA)(?:\s|\d|[-])/,'ISCAR grooving / parting','parting','Self-grip and groove-turn insert families have maker-specific seat and chipbreaker shapes.','https://www.iscar.com/Catalogs/Publication/english_1/FACE_GROOVING_LINES_CATALOG_22/FACE_GROOVING_LINES_CATALOG_22.pdf'],
['haas',/^(HCI[- ]|HCI\d)/,'Haas cut-off insert','parting','HCI carbide parting/cutoff insert. Match exact cutting width, seat and grade to Haas catalog.','https://www.haastooling.com/p/02-0494'],
['haas',/^(HSNP|HRNP|HCSHF|HSHF|HRPP|HAPN|HSPP|HLNP)(?:\s|\d|[-]|$)/,'Haas proprietary face/shoulder/high-feed milling','milling','Haas cutter-family code. Shape and edge geometry are family-specific; a standardized ISO size decoder cannot fully identify it.','https://www.haastooling.com/c/milling-inserts'],
['haas',/^(0?2[- ]0\d{3,4}|HID)/,'Haas indexable drill center/periphery insert','drilling','Most Haas indexable drills have DIFFERENT center and periphery inserts; confirm side by exact part number.','https://www.haastooling.com/c/indexable-drill-inserts'],
['kennametal',/^(KSEM|KTIP|KDE|KSU)(?:\s|\d|[-]|$)/,'Kennametal modular drill tip','drilling','Replaceable drilling tip. Seat, point angle and diameter require the part catalog.','https://www.kennametal.com/'],
['kennametal',/^(EDCT|EC\d|EDPT)(?:\s|\d|[-]|$)/,'Kennametal Mill 1-10 / Mill 1-14 insert','milling','Indexable shoulder milling insert; precise chipbreaker, radius and dimensions are in the maker data sheet.','https://www.kennametal.com/us/en/products/p.mill-1-10-carbide-insert-edct-ld-light-machining.3959611.html'],
['sandvik',/^880[- ]/,'Sandvik CoroDrill 880 center / peripheral insert','drilling','CoroDrill 880 uses different central/peripheral inserts; the exact geometry and seat code matter.','https://www.sandvik.coromant.com/en-us/product-details?c=A880-D1250P38-03'],
['sandvik',/^(N123|N151|QD[- ])/,'Sandvik CoroCut parting / grooving','grooving','CoroCut insert geometry, rail style and grades depend on exact product code.','https://www.sandvik.coromant.com/'],
['any',/^(WCMX|SPMG|SPGT|SOMT|WCMT|SCMT|XCMT|CCMT)(?:\d)/,'ISO-style indexable drill insert','drilling','Standard-coded drill insert; physical cutter location and chipbreaker are application and brand specific.','https://www.haastooling.com/c/indexable-drill-inserts']
];
const savedKey='machiningDeskInsertUserSpecs1115';let profiles={};try{const x=JSON.parse(localStorage.getItem(savedKey)||'{}');if(x&&typeof x==='object')profiles=x}catch{}
const profileKey=(brand,category,code)=>`${brand}|${category}|${code.trim().toUpperCase().replace(/\s+/g,'')}`;
let brand='any',ownDrilling=false,drillInput='ICP 120',root=null;
function category(){if(ownDrilling)return 'drilling';const active=root?.querySelector('[data-insert-family].primary');return active?.dataset.insertFamily||'turning';}
function code(){return (ownDrilling?root.querySelector('#mdDrillCode')?.value:root.querySelector('#insertCodeInput')?.value||root.querySelector('#specialInsertCode')?.value)||'';}
function findKnown(code,brand){return known.find(([b,re])=>(brand==='any'||b==='any'||b===brand)&&re.test(code.toUpperCase().trim()))|| (brand!=='any'?known.find(([b,re])=>(b===brand||b==='any')&&re.test(code.toUpperCase().trim())):null);}
function svgDrill(series,variant,diameter,source){
 const v=variant.toUpperCase();const flat=/FCP/.test(v),concave=/HCP/.test(v),indexable=/880|HID|02-0|WCMX|SPMG|SCMT|SOMT|WCMT/.test(v),tip=/ICP|ICK|ICM|ICN|ICG|FCP|HCP|QCP|KSEM|KTIP/.test(v);
 let shape=indexable?'<path d="M124 100 L213 100 L226 114 L220 196 L119 196 Z" fill="none" class="id-edge"/><circle cx="171" cy="149" r="12" class="id-hole"/>':
  `<path d="M120 165 L145 108 ${flat?'L230 108':concave?'Q184 148 230 108':'L184 72 L230 108'} L248 165 L219 193 L149 193 Z" class="id-edge"/><path d="M134 160 L177 135 L225 160" fill="none" class="id-chip"/>`;
 const side=indexable?'<path d="M123 125 L245 125 L245 160 L123 160 Z" class="id-edge"/>':'<path d="M126 110 L245 110 L258 160 L111 160 Z" class="id-edge"/>';
 return `<div class="insert-diagram-grid insert-branded-drawings"><figure class="insert-drawing"><svg viewBox="0 0 520 285" role="img" aria-label="${E(series)} representative plan silhouette with seat callouts"><text x="15" y="23" class="id-figure-header">TOP · ${E(series)}</text>${shape}<path d="M183 70 L290 48 H308" class="id-leader"/><text x="310" y="47" class="id-label">${indexable?'Center / periphery':'Cutting geometry'}</text><path d="M220 164 L298 178" class="id-leader"/><text x="305" y="180" class="id-label">${indexable?'Clamping hole / seat':'Holder-specific mounting'}</text><path d="M123 213 H244 M123 208 V220 M244 208 V220" class="id-dimension"/><text x="20" y="249" class="id-label">Diameter ${diameter?E(diameter)+' mm':'not decoded'} · inspect actual product drawing</text></svg><figcaption>${tip?'Exchangeable tip with manufacturer-specific seat and cutting lip details.':indexable?'Replaceable center or peripheral insert (not interchangeable).':'Representative geometry only.'} <b>Do not machine from this schematic.</b></figcaption></figure>
 <figure class="insert-drawing"><svg viewBox="0 0 520 285" role="img" aria-label="${E(series)} representative side profile"><text x="15" y="23" class="id-figure-header">SIDE · SEAT AND CUTTING EDGE</text>${side}<path d="M255 125 L332 74" class="id-leader"/><text x="335" y="69" class="id-label">${E(flat?'Nearly flat drill lip':concave?'Concave / self-centering lip':indexable?'Screw-clamped seat':'Drill lip / edge prep')}</text><path d="M185 160 L324 215" class="id-leader"/><text x="328" y="220" class="id-label">Relief, thickness: catalog</text></svg><figcaption>${E(source)}. Details of chipbreaker, relief angle and point angle are NOT inferred without the exact manufacturer drawing.</figcaption></figure></div>`;
}
function mountDrill(){ownDrilling=true;
 const nav=root.querySelectorAll('[data-insert-family]');nav.forEach(b=>{b.classList.remove('primary');b.setAttribute('aria-pressed','false')});root.querySelector('[data-insert-family="drilling"]')?.classList.add('primary');
 const body=root.querySelector('#insertFamilyBody');body.innerHTML=`<h2>Indexable drill inserts and exchangeable drill heads</h2><p class="subtitle">Identify a drill head, peripheral insert, center insert or modular tip. Unlike turning, many drill heads use maker-specific designations.</p><label for="mdDrillCode">Drill insert / head designation</label><input id="mdDrillCode" type="text" value="${E(drillInput)}" spellcheck="false" autocomplete="off" placeholder="ICP 120, WCMX060308, 880-0604…"><div class="insert-special-examples">${['ICP 120','HCP 120','FCP 120','WCMX060308','880-0604W06H-P-GM','KSEM','02-0045'].map(c=>`<button type="button" class="btn" data-drill-example="${E(c)}">${E(c)}</button>`).join('')}</div><div id="mdDrillExplanation"></div>
 <p class="sourcehint">See <a href="https://www.iscar.com/en-az/products/hole-making/drilling/sumocham-indexable-heads/head-variety" target="_blank" rel="noopener noreferrer">ISCAR drilling-head variants ↗</a>, <a href="https://www.haastooling.com/c/indexable-drill-inserts" target="_blank" rel="noopener noreferrer">Haas center/periphery insert distinctions ↗</a>, or the exact maker's datasheet.</p>`;
 body.querySelectorAll('[data-drill-example]').forEach(b=>b.addEventListener('click',()=>{body.querySelector('#mdDrillCode').value=b.dataset.drillExample;drillInput=b.dataset.drillExample;updateDrill()}));
 body.querySelector('#mdDrillCode').addEventListener('input',()=>{drillInput=body.querySelector('#mdDrillCode').value;updateDrill()});updateDrill();
}
function updateDrill(){const target=root?.querySelector('#mdDrillExplanation');if(!target)return;const val=code().trim(),info=findKnown(val,brand);const match=val.toUpperCase().match(/^(?:ICP|ICK|ICM|ICN|ICG|HCP|FCP|QCP)[- ]?(\d{2,3})(?:\D|$)/);
 const dia=match?(+match[1]/(match[1].length===3?10:1)).toFixed(1):'';
 const series=info?.[2]||'Maker-specific indexable drill insert / head';
 target.innerHTML=`<div class="ref-callout"><strong>${E(series)}</strong><p>${E(info?.[4]||'No verified product-level match. Select a maker and consult its exact catalog; a known prefix cannot establish the insert’s dimensions, grade, chipbreaker or physical shape.')}</p>${dia?`<p>Nominal head diameter interpreted as ${E(dia)} mm (verify with ISCAR head designation).</p>`:''}</div>${info?svgDrill(series,val,dia,info[5]):'<p class="insert-brand-warning">No product silhouette available until a manufacturer family or user-confirmed geometry is supplied.</p>'}`;updateBrand();}
function updateBrand(){const node=root?.querySelector('#mdInsertBrandOutput');if(!node)return;const val=code().trim(),fam=category(),profile=profiles[profileKey(brand,fam,val)],info=findKnown(val,brand);const match=MANUFACTURERS.find(x=>x[0]===brand);const domain=match?.[2]||'',search=domain?`https://www.google.com/search?q=${encodeURIComponent('site:'+new URL(domain).hostname+' "'+val+'" insert')}`:'';
 node.innerHTML=`<div class="insert-brand-summary"><strong>${E(match?.[1]||'Unknown maker')}</strong> · ${E(val||'Enter a code')} · ${E(fam)}<p class="help">${info?`Recognized product family: <b>${E(info[2])}</b>. ${E(info[4])}`:'Not matched to a verified maker-specific family. ISO geometry may still be decoded by the standard chart above. Brand/grade and chipbreaker are NOT confirmed.'}</p>${profile?`<p class="help"><b>User-saved physical dimensions:</b> ${E(profile.shape)}; width/IC ${E(profile.width)} mm, thickness ${E(profile.thick)} mm, corner radius ${E(profile.radius)} mm. These were entered manually and are not manufacturer-verified.</p>`:''}
 <p class="help">${info?`<a href="${E(info[5])}" target="_blank" rel="noopener noreferrer">Family reference ↗</a> · `:''}${domain?`<a href="${E(domain)}" target="_blank" rel="noopener noreferrer">Manufacturer catalog ↗</a> · <a href="${E(search)}" target="_blank" rel="noopener noreferrer">Search exact catalog code ↗</a>`:'Select a maker to search its official catalog.'}</p></div>
 <details class="insert-user-entry" ${profile?'open':''}><summary>Save confirmed dimensions for this manufacturer / insert</summary><p class="help">For any brand or proprietary part number, enter values from its catalog. Profiles are stored only on this device; they cannot be verified automatically. Select the actual physical shape instead of assuming the code is standardized.</p><div class="insert-user-specs">
 <div><label for="insertUserShape">Physical profile</label><select id="insertUserShape">${[['','Unknown / no drawing'],['T','Triangle'],['S','Square'],['C','80° diamond'],['D','55° diamond'],['V','35° diamond'],['R','Round'],['L','Rectangle'],['P','Pentagon'],['groove','Grooving blade'],['head','Exchangeable drill head']].map(([c,n])=>`<option value="${c}" ${profile?.shape===c?'selected':''}>${n}</option>`).join('')}</select></div>
 ${[['width','Nominal width / IC (mm)'],['thick','Thickness (mm)'],['radius','Corner radius (mm)'],['angle','Included angle (°)']].map(([k,label])=>`<div><label for="insertUser${k}">${label}</label><input id="insertUser${k}" type="number" min="0" step="any" value="${E(profile?.[k]??'')}"></div>`).join('')}</div>
 <div class="btnrow" style="margin-top:10px"><button id="insertUserSave" type="button" class="btn primary">Save physical profile</button><button id="insertUserDelete" type="button" class="btn">Clear profile</button></div></details>
 ${profile?.shape?profileSVG(profile,val):''}</div>`;
 node.querySelector('#insertUserSave').addEventListener('click',()=>{const p={shape:node.querySelector('#insertUserShape').value};for(const k of ['width','thick','radius','angle']){const v=+node.querySelector('#insertUser'+k).value;if(v>0&&Number.isFinite(v))p[k]=v;}if(!p.shape)return alert('Choose a verified physical shape before saving.');profiles[profileKey(brand,fam,val)]=p;persist();updateBrand();});
 node.querySelector('#insertUserDelete').addEventListener('click',()=>{delete profiles[profileKey(brand,fam,val)];persist();updateBrand();});
}
function persist(){try{localStorage.setItem(savedKey,JSON.stringify(profiles))}catch{alert('Insert profiles could not be stored. Export database separately.');}}
function profileSVG(profile,name){const sh=profile.shape,w=profile.width||0;let path='';let n;
 if(sh==='R')path='<circle cx="218" cy="115" r="68" class="id-edge"/>';
 else if(sh==='groove')path='<path d="M180 183 L180 67 H256 V183 Z" class="id-edge"/>';
 else if(sh==='head')path='<path d="M154 146 L179 76 L218 46 L257 76 L282 146 L246 178 H188 Z" class="id-edge"/>';
 else{n={T:3,S:4,C:4,D:4,V:4,L:4,P:5}[sh]||4;const a=(Math.PI*2)/n;const coords=[];for(let i=0;i<n;i++){let x=Math.sin(i*a)*67,y=-Math.cos(i*a)*67;if(['C','D','V'].includes(sh))x*=sh==='V'?.54:sh==='D'?.75:.94;if(sh==='L')x*=1.6;coords.push(`${218+x},${118+y}`);}path=`<polygon points="${coords.join(' ')}" class="id-edge"/>`;}
 return `<figure class="insert-drawing"><svg viewBox="0 0 520 260" role="img" aria-label="User-entered physical outline for ${E(name)}"><text x="14" y="25" class="id-figure-header">USER-CONFIRMED PROFILE · NOT CATALOG-VERIFIED</text>${path}<path d="M145 218 H288" class="id-dimension"/><text x="16" y="245" class="id-label">Width / IC ${w?E(w)+' mm':'not supplied'} · thickness ${E(profile.thick||'unknown')} mm · r ${E(profile.radius||'unknown')} mm</text></svg><figcaption>Proportions illustrate the specified shape; mounting hole, rake face, chipbreaker and tolerances require the real part drawing.</figcaption></figure>`;
}
function install(){const base=window.MachiningDeskInserts?.mount;if(!base)return;
 window.MachiningDeskInserts.mount=function(){base();root=document.getElementById('insertExplorer');if(!root)return;
 const into=root.querySelector('.insert-family-intro');into?.insertAdjacentHTML('beforeend',`<div class="insert-brand-panel"><div class="insert-brand-controls"><div><label for="mdInsertBrand">Manufacturer</label><select id="mdInsertBrand">${MANUFACTURERS.map(([id,label])=>`<option value="${id}" ${brand===id?'selected':''}>${E(label)}</option>`).join('')}</select></div><p class="help">Standard ISO / ANSI insert geometry works across manufacturers. Proprietary part numbers and physical chipbreaker shapes need exact maker data. No online catalog API is assumed.</p></div></div>`);
 const tabs=root.querySelector('.insert-family-tabs');tabs?.insertAdjacentHTML('beforeend','<button class="btn" type="button" data-insert-family="drilling" aria-pressed="false">Drilling / exchangeable heads</button>');
 root.querySelector('#insertLookup')?.insertAdjacentHTML('afterend','<div id="mdInsertBrandOutput" class="insert-brand-panel" aria-live="polite"></div>');
 root.querySelector('#mdInsertBrand')?.addEventListener('change',e=>{brand=e.target.value; if(ownDrilling)updateDrill();else updateBrand()});
 root.querySelector('[data-insert-family="drilling"]')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();mountDrill()},true);
 for(const b of root.querySelectorAll('[data-insert-family]:not([data-insert-family="drilling"])'))b.addEventListener('click',()=>{ownDrilling=false;setTimeout(updateBrand,0)});
 root.querySelector('#insertLookup')?.addEventListener('submit',e=>{const c=root.querySelector('#insertLookupCode')?.value.trim().toUpperCase()||'';if(/^(ICP|ICK|ICM|ICN|ICG|HCP|FCP|QCP|IHP|KSEM|KTIP|880[- ]|WCMX|WCMT|SOMT|SPMG|SPGT|0?2[- ]0\d{3,4})/.test(c)){e.preventDefault();e.stopImmediatePropagation();drillInput=c;mountDrill();}else{ownDrilling=false;setTimeout(updateBrand,0);}},true);
 root.addEventListener('input',e=>{if(e.target?.id==='insertCodeInput'||e.target?.id==='specialInsertCode')setTimeout(updateBrand,0)});
 root.addEventListener('click',e=>{const div=e.target.closest?.('.insert-code-strip > div');if(!div)return;const parent=div.parentElement;const idx=Array.from(parent.children).indexOf(div)+1;const anchor=document.getElementById('insertPos'+idx);if(anchor){anchor.scrollIntoView({behavior:'smooth',block:'start'});anchor.classList.add('insert-reference-highlight');setTimeout(()=>anchor.classList.remove('insert-reference-highlight'),1400);}},true);
 updateBrand();
 };
}
install();
window.MachiningDeskInsertBrands={manufacturers:MANUFACTURERS,known,findKnown,profiles};
})();
