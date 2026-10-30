/* Galvanic compatibility screening, ordinal seawater series after ASTM G82 and EPA seawater table.
   Deliberately does not invent single-electrode voltages or certify a pair as safe. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Increasing value = more noble in a seawater-based engineering series; NOT volts.
const series=[['Magnesium',2],['Zinc / galvanized steel',6],['Aluminum alloys',14],['Carbon and low alloy steel',29],['Cast iron',31],['Stainless 410 / 304 / 316 · ACTIVE',36],['Lead / tin',44],['Yellow brass',50],['Copper and red brass',61],['Bronze / Cu-Ni',64],['Nickel / nickel alloys · active',70],['Nickel / nickel alloys · passive',83],['Stainless 410 / 304 / 316 · PASSIVE',86],['Titanium',91],['Silver',94],['Graphite',98]];
function rank(m,passive=true){const g=m.group||'',n=(m.name||'').toLowerCase();
 if(g==='Plastic'||/nylon|acetal|uhmw|pom|ptfe|delrin/.test(n))return null;
 if(g==='Magnesium'||/magnesium|\baz31\b|\baz91\b/.test(n))return 2;
 if(/zinc|galvaniz/.test(n))return 6;
 if(g==='Aluminum')return /2024|7050|7075/.test(n)?13:14;
 if(g==='Cast iron')return 31;
 if(g==='Carbon steel'||g==='Alloy steel'||g==='Tool steel')return 29;
 if(g==='Stainless steel')return passive?86:36;
 if(g==='Titanium')return 91;
 if(g==='Nickel alloy')return passive?83:70;
 if(g==='Cobalt alloy')return 76;
 if(g==='Copper alloy')return /c110|c101|c145|c172|c260|c360|brass/.test(n)?(/brass|c260|c360/.test(n)?50:61):64;
 return null;}
function mount(host,db){if(!host)return;const metals=db.materials.filter(m=>rank(m)!==null);
 host.innerHTML=`<h2>Galvanic corrosion · dissimilar metals</h2><p class="subtitle">Seawater-series screening of two <b>electrically connected metals</b>. Only metal alloys in your Materials database appear; nonconductive plastics are excluded. This is an <b>ordinal chart, not a table of fixed electrical potentials</b>.</p>
 <div class="galvanic-grid"><div><label for="galvaA">Material A</label><select id="galvaA">${metals.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></div>
 <div><label for="galvaB">Material B</label><select id="galvaB">${metals.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></div>
 <div><label for="galvaMoist">Environment</label><select id="galvaMoist"><option value="seawater">Seawater / chloride-rich water</option><option value="fresh">Fresh water / damp</option><option value="dry">Dry, nonconductive contact</option></select></div>
 <div><label for="galvaRatio">Cathode area relative to anode</label><select id="galvaRatio"><option value="1">Similar exposed areas</option><option value=".1">Small cathode, large anode</option><option value="10">Large cathode, small anode</option></select></div>
 <div><label for="galvaPassive">Stainless and nickel surface state</label><select id="galvaPassive"><option value="passive">Passive (intact film)</option><option value="active">Active (crevice/film breakdown)</option></select></div></div>
 <div id="galvaResult" role="status" aria-live="polite"></div><h3>Relative galvanic series · typical seawater ordering</h3><div class="galvanic-series" id="galvaSeries"></div>
 <div class="ref-callout"><strong>Interpreting the comparison</strong><p>The more active metal tends to be the <b>anode</b> (corrodes preferentially), while the more noble metal tends to be the cathode. Higher cathode/anode exposed area ratios can greatly increase anode attack. Wet electrical continuity, protective films, oxygen, temperature and electrolyte chemistry control the actual result. Even a close pair is <b>not guaranteed safe</b>. Stainless steel can shift position when its passive film breaks down; titanium, copper, and nickel have environment-dependent behavior.</p></div>
 <p class="sourcehint">Sources: <a href="https://store.astm.org/g0082-98r09.html" target="_blank" rel="noopener noreferrer">ASTM G82 — galvanic-series guide ↗</a> · <a href="https://www.epa.gov/sites/default/files/2020-02/documents/corrosion_its_detection_and_control_in_injection_wells-aug1987.pdf" target="_blank" rel="noopener noreferrer">U.S. EPA seawater galvanic series ↗</a>. Relative positions are simplified; no single galvanic potential or universally safe compatibility threshold exists.</p>`;
 const $=id=>host.querySelector('#'+id),a=$('galvaA'),b=$('galvaB');
 a.value=metals.find(m=>m.group==='Aluminum')?.id||metals[0]?.id||'';
 b.value=metals.find(m=>m.group==='Stainless steel')?.id||metals[1]?.id||'';
 function render(){const A=db.materials.find(m=>m.id===a.value),B=db.materials.find(m=>m.id===b.value);if(!A||!B)return;
 const pass=$('galvaPassive').value==='passive',ra=rank(A,pass),rb=rank(B,pass),gap=Math.abs(ra-rb),dry=$('galvaMoist').value==='dry';
 const anode=ra<rb?A:rb<ra?B:null,cathode=ra>rb?A:rb>ra?B:null;
 let label;if(dry)label='No sustained galvanic current expected in dry, nonconductive contact';else if(ra===rb)label='Similar series position; assess other corrosion mechanisms';else if(gap>=40)label='High galvanic-coupling concern under conductive wet conditions';else if(gap>=18)label='Appreciable galvanic-coupling concern';else label='Closer galvanic-series positions; risk still depends on exposure';
 const ratio=+$('galvaRatio').value;
 $('galvaResult').innerHTML=`<div class="ref-callout"><strong>${esc(label)}</strong><p>${anode?`<b>Likely anodic (preferential attack):</b> ${esc(anode.name)}<br><b>Likely cathodic:</b> ${esc(cathode.name)}.`:'The materials have the same approximate placement in this simplified series.'} ${!dry&&ratio>1?'A relatively <b>large cathode</b> can make local anodic attack more severe.':''}${!dry&&ratio<1?'A <b>small cathode / large anode</b> is often less severe, but not assured safe.':''}${dry?'A moisture film, condensation or conductive contamination can change this quickly.':''}</p><p class="help">Comparison uses rank order only, not a voltage difference. Actual anodic current cannot be calculated from this chart.</p></div>`;
 const rows=series.map(([name,r])=>`<div class="galvanic-row"><span>${esc(name)}</span><div class="galvanic-bar"><i style="width:${Math.max(2,r)}%"></i></div></div>`).join('');
 $('galvaSeries').innerHTML=`<div class="galvanic-axis"><span>Active / anodic</span><span>Noble / cathodic</span></div>${rows}`;
 }
 for(const el of host.querySelectorAll('select'))el.addEventListener('change',render);render();
}
window.MachiningDeskGalvanic={mount,rank,series};
})();
