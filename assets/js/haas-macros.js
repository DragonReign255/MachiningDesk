/* Haas macro-variable reference for NGC mills (VF / UMC) and NGC lathes (ST).
 * Summarizes the variable tables published in the Haas mill / lathe operator manuals.
 * A listed range is NOT a promise that an individual variable is writable or unused.
 * Haas documentation: /service/online-operator-s-manuals/{mill,lathe}-operator-s-manual/{mill,lathe}---macros.html
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const DOCS={mill:'https://www.haascnc.com/service/online-operator-s-manuals/mill-operator-s-manual/mill---macros.html',lathe:'https://www.haascnc.com/service/online-operator-s-manuals/lathe-operator-s-manual/lathe---macros.html'};
// Rows: NGC # variable or range | legacy # variable or range | Haas function (paraphrased).
const local=`#0|#0|Undefined / not-a-number sentinel (read-only)
#1–#33|#1–#33|G65 local arguments and variables; nested per G65 call`;
const millUser=`#10000–#10146|#100–#146|Persistent general-purpose globals
#10147–#10199|#147–#199|Probe result variables when probing is installed
#10200–#10399|—|Persistent general-purpose globals
#10400–#10499|—|Persistent general-purpose globals
#10500–#10549|#500–#549|Persistent general-purpose globals
#10550–#10599|#550–#599|Probe calibration when probing is installed
#10600–#10699|#600–#699|Persistent general-purpose globals (verify option reservations)
#10700–#10799|—|Listed by Haas as general-purpose; verify against legacy hidden reservations
#10800–#10999|#800–#999|Persistent general-purpose globals`;
const latheUser=`#10000–#10199|#100–#199|Persistent general-purpose globals
#10200–#10399|—|Persistent general-purpose globals
#10400–#10499|—|Persistent general-purpose globals
#10500–#10549|#500–#549|Persistent general-purpose globals
#10550–#10580|#550–#580|Probe calibration when probing is installed
#10581–#10699|#581–#699|Persistent general-purpose globals; check installed options
#10800–#10999|#800–#999|Persistent general-purpose globals`;
const protectedShared=`#700–#749|#700–#749|Legacy hidden control / machine-use variables; do not use
#709|#709|Fixture clamp input (legacy alias); do not write
#10709|#709|Fixture clamp input (NGC); do not use as a general-purpose variable
#6001–#6999|#6001–#6999|Reserved by Haas for control functions — do not assign
#6001–#6250|same|Legacy settings access; do not assign arbitrary values
#6198|#6198|NGC control identifier; read-only
#6996–#6997|same|Parameter and parameter-bit selection (advanced control reference)
#6998–#6999|same|Selected parameter and bit values; read-only
#9000–#9015|#9000–#9015|Axis thermal compensation accumulator / reserved
#9016–#9031|#9016–#9031|Spindle thermal compensation / reserved
#3003|#3003|Single-block override; changes machine operating behavior
#3004|#3004|Feed Hold / feed override / exact stop override; safety-critical`;
const commonSystem=`#1064–#1068|#1064–#1068|Peak observed load on X, Y, Z, A and B axes
#1080–#1087|#1080–#1087|Raw analog-to-digital inputs (legacy)
#1090–#1098|#1090–#1098|Filtered analog inputs; #1098 spindle load on applicable vector drives
#1264–#1268|#1264–#1268|Peak observed load on C, U, V, W and T axes
#1601–#1800|same|Tool flute counts (tool indexes 1–200)
#1801–#2000|same|Tool vibration maxima (tool indexes 1–200)
#3000|#3000|Raise a programmed user alarm (#3000=n)
#3001|#3001|Millisecond timer
#3002|#3002|Hour timer
#3006|#3006|Program stop with message (#3006=1 (MESSAGE))
#3011|#3011|Date (year, month, day)
#3012|#3012|Time (hour, minute, second)
#3020|#3020|Power-on timer
#3021|#3021|Cycle-start timer
#3022|#3022|Feed timer
#3023|#3023|Current part timer
#3024|#3024|Last completed part timer
#3025|#3025|Previous part timer
#3026|#3026|Current tool number (read-only)
#3027|#3027|Spindle speed (read-only)
#3030|#3030|Single-block active status/control
#3032|#3032|Block-delete state
#3033|#3033|Optional-stop state
#3196|#3196|Cell safety timer
#3201–#3400|same|Actual diameters for tool positions 1–200
#3401–#3600|same|Programmable coolant positions, tool positions 1–200
#3901|#3901|M30 counter 1
#3902|#3902|M30 counter 2
#4000–#4099|same|Previously active G-code modal-group values
#4101–#4126|same|Address words from previous block (e.g. #4124 = X)
#4132|—|Current active work-offset identifier (including sub-offset)
#5001–#5006|same|End position of previous executed block
#5021–#5026|same|Current machine-coordinate position
#5041–#5046|same|Current work-coordinate position
#5061–#5069|same|Last skip-signal position (axes X through W)
#5081–#5086|same|Current tool offset values
#5401–#5500|same|Per-tool feed timers (seconds)
#5501–#5600|same|Per-tool overall timers (seconds)
#5601–#5699|same|Tool-life monitor limits
#5701–#5800|same|Tool-life counters
#5801–#5900|same|Highest recorded tool loads
#5901–#6000|same|Tool-load limits
#8500|same|Advanced Tool Management (ATM) group identifier
#8501–#8505|same|ATM group remaining life / available counts and times
#8510–#8515|same|ATM next-tool ID, remaining life, counts and times
#8550–#8564|same|ATM selected tool geometry, wear, loading and life data
#20000–#29999|—|Control setting values
#30000–#39999|—|Control parameter values; protected/option-dependent
#32014|—|Machine serial number
#56701–#56900|—|Per-tool maximum spindle speed`;
const io=`#11000–#11255|—|256 discrete inputs (read-only); control/option-dependent
#12000–#12255|—|256 discrete outputs (many are machine-reserved)
#13000–#13063|—|Analog input channels (read-only)
#13013|—|Coolant level, if sensor is present`;
const work=`#5201–#5206|same|G52 local coordinate shifts
#5221–#5226|same|G54 work offset (X Y Z A B C)
#5241–#5246|same|G55 work offset (X Y Z A B C)
#5261–#5266|same|G56 work offset (X Y Z A B C)
#5281–#5286|same|G57 work offset (X Y Z A B C)
#5301–#5306|same|G58 work offset (X Y Z A B C)
#5321–#5326|same|G59 work offset (X Y Z A B C)
#7001–#7006|same|Additional work offset G154 P1 / G110
#7021–#7026|same|Additional work offset G154 P2 / G111
#7041–#7386|same|Additional work offsets G154 P3–P20
#14001–#14006|—|NGC additional work offset G154 P1
#14021–#14026|—|NGC additional work offset G154 P2
#14041–#14386|—|NGC additional work offsets G154 P3–P20
#14401–#14406|—|NGC additional work offset G154 P21
#14421–#15966|—|NGC additional work offsets G154 P22–P99`;
const millSpecific=`#2001–#2200|same|Tool length geometry offsets 1–200
#2201–#2400|same|Tool length wear offsets 1–200
#2401–#2600|same|Tool radius / diameter geometry offsets 1–200
#2601–#2800|same|Tool radius / diameter wear offsets 1–200
#5011–#5019|—|Present skip signal in machine coordinates (X–W)
#5051–#5056|—|Tool Center Point Control / Dynamic Work Offset calculations
#3028|#3028|Number of pallets loaded on receiver
#3034|—|Safe Run state
#7501–#7506|same|Pallet priorities
#7601–#7606|same|Pallet status
#7701–#7706|same|Assigned part-program numbers on pallets
#7801–#7806|same|Pallet usage counts
#6198|same|NGC/CF identification flag (Haas manual)
#6601|same|NGC/CF identification flag (Haas manual)
#50001–#50200|—|Tool type records
#50201–#50400|—|Tool material records
#50401–#50600|—|Tool offset point records
#50601–#50800|—|Estimated tool RPM records
#50801–#51000|—|Estimated tool feed-rate records
#51001–#51200|—|Tool pitch values
#51201–#51400|—|VPS estimated RPM records
#51401–#51600|—|VPS work materials
#51601–#51800|—|VPS feed-rate records
#51801–#52000|—|Approximate tool length / probe length
#52001–#52200|—|Approximate tool / probe diameter
#52201–#52400|—|Edge measure height
#52401–#52600|—|Tool tolerance
#52601–#52800|—|Probe type`;
const latheSpecific=`#2001–#2050|same|X-axis tool shift offsets
#2051–#2100|same|Y-axis tool shift offsets
#2101–#2150|same|Z-axis tool shift offsets
#2201–#2250|same|Tool nose-radius wear offsets
#2301–#2350|same|Tool tip orientation
#2701–#2750|same|X-axis tool wear offsets
#2751–#2800|same|Y-axis tool wear offsets
#2801–#2850|same|Z-axis tool wear offsets
#2901–#2950|same|Tool nose-radius wear offsets (Haas table)
#50001–#50200|—|Tool type records
#50201–#50400|—|Tool material records
#50401–#50600|—|Tool offset point
#50601–#50800|—|Estimated RPM
#50801–#51000|—|Estimated feed rate
#51001–#51200|—|Offset pitch
#51201–#51400|—|VPS estimated RPM
#51401–#51600|—|Work material
#51601–#51800|—|VPS feed rate
#51801–#52000|—|Approximate X probe length
#52001–#52200|—|Approximate Y probe length
#52201–#52400|—|Approximate Z probe length
#52401–#52600|—|Approximate probe diameter
#52601–#52800|—|Edge measure height
#52801–#53000|—|Tool tolerance
#53201–#53400|—|Probe type
#53401–#53600|—|Live tool radius
#53601–#53800|—|Live tool radius wear
#53801–#54000|—|X geometry
#54001–#54200|—|Y geometry
#54201–#54400|—|Z geometry
#54401–#54600|—|Diameter geometry
#54601–#54800|—|Tool tip
#54801–#55000|—|X geometry wear
#55001–#55200|—|Y geometry wear
#55201–#55400|—|Z geometry wear
#55401–#55600|—|Diameter wear
#62500–#62509|—|Current RPM of spindle(s) 1, 2 and 3
#62510–#62519|—|Spindle loads 1, 2 and 3
#62520–#62529|—|Surface speeds for spindle(s)
#62530–#62539|—|Chip load values for spindle(s)
#62540–#62549|—|Spindle override values
#62590|—|Feed override
#62591|—|Rapid override
#62592|—|Commanded feed rate
#62593|—|Active feed rate
#62742–#62745|—|Safe axis loads (X Y Z B)
#62746|—|Active tool
#62747|—|Rapid override
#62748|—|Slow rapid override
#62749|—|Slow rapid distance
#62750|—|Completed part count
#6198|same|NGC/CF identification flag`; 
function parseRows(text,category){return text.split('\n').filter(Boolean).map(row=>{let [variable,legacy,name]=row.split('|');const nums=(variable.match(/\d+/g)||[]).map(Number);let start=nums[0]??-1,end=nums.length>=2?nums[1]:start;const multi=/\s*\/\s*/.test(variable);if(multi){end=start;}return {variable,legacy:legacy==='same'?variable:legacy,name,category,start,end,multi}})}
const baseSystem=parseRows(commonSystem,'system').map(x=>({...x,category:x.start>=20000||x.start===32014?'protected':x.category}));
function getRows(family){const m=family!=='lathe';return [
 ...parseRows(local,'local'),...localDetails(),...parseRows(m?millUser:latheUser,'user').map(x=>({...x,category:/probe|hidden|verify/i.test(x.name)?'probe':x.category})),
 ...parseRows(protectedShared,'protected'),...baseSystem,
 ...parseRows(io,'io'),...parseRows(work,'offset'),...parseRows(m?millSpecific:latheSpecific,'offset').map(x=>({...x,category:x.start>=50000?'system':x.category}))
 ].sort((a,b)=>a.start-b.start||a.end-b.end)}
// Official Haas G65 address mapping for every local macro argument.
// Entries 10/12/14-16 and 27-33 are accessible via repeated I/J/K arguments.
const G65_ARGS=['A','B','C','I','J','K','D','E','F','I (alternate)','H','K (alternate)','M','J (alternate)','K (alternate)','I (alternate)','Q','R','S','T','U','V','W','X','Y','Z','K (alternate)','I (alternate)','J (alternate)','K (alternate)','I (alternate)','J (alternate)','K (alternate)'];
function localDetails(){return G65_ARGS.map((addr,i)=>({variable:'#'+(i+1),legacy:'#'+(i+1),name:'Local G65 variable · '+(addr.includes('alternate')?'repeated '+addr.replace(' (alternate)','')+' argument':addr+' argument'),category:'local',start:i+1,end:i+1}));}
const labels={local:'Local · G65',user:'User globals',probe:'Probe / option',system:'Machine / system',offset:'Tool / work offsets',io:'Inputs / outputs',protected:'Reserved / caution'};
let selectedMachine=null,mode='variables',selectedEntry=null;
function selectTab(value){mode=value;for(const kind of ['variables','programs']){const btn=$('macroSub'+kind),p=$('macro'+kind+'Panel');btn?.classList.toggle('active',kind===mode);btn?.setAttribute('aria-pressed',String(kind===mode));p?.classList.toggle('hidden',kind!==mode)}}
function family(){return selectedMachine?.codeList==='st'?'lathe':'mill'}
const containsVar=(entry,num)=>entry.start<=num&&num<=entry.end&&(entry.variable.indexOf('/')<0||entry.start===num);
function showDetails(entry,searchNum){selectedEntry=entry;const p=$('macroVariableDetails');p.replaceChildren();p.classList.remove('hidden');
 const h=document.createElement('h3');h.textContent=entry.variable+' — '+entry.name;p.append(h);
 const add=(label,value)=>{const q=document.createElement('p');const b=document.createElement('strong');b.textContent=label+': ';q.append(b,document.createTextNode(value));p.append(q)};
 add('Classification',labels[entry.category]);add('Legacy Haas / Classic reference',entry.legacy);
 if(Number.isFinite(searchNum)&&containsVar(entry,searchNum)&&entry.start!==entry.end)add('Selected variable',`#${searchNum} is within ${entry.variable}`);
 let extra=entry.category==='user'?'Globals retain values across power cycles. Confirm the selected variable is not already assigned by probing, automation, or another macro.':entry.category==='local'?'Local #1–#33 are passed through G65 addresses (for example A→#1, B→#2, C→#3, X→#24, Z→#26).':entry.category==='protected'?'This is not a general-purpose storage location. Writing to system variables can affect machine safety or offsets.':entry.category==='probe'?'Probe and machine-option variables may be written by factory routines. Treat them as reserved when the option is fitted.':entry.category==='io'?'Verify I/O mapping for the installed machine and control before using any input or output. Some outputs can actuate equipment.':'These are machine-related variables, not user-storage macros. Read/write permission depends on the Haas control and installed options.';
 const note=document.createElement('p');note.className='sourcehint';note.textContent=extra;p.append(note);
 const a=document.createElement('a');a.href=DOCS[family()];a.target='_blank';a.rel='noopener noreferrer';a.className='btn';a.textContent='Learn more on Haas ↗';p.append(a);p.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function draw(){if(!selectedMachine)return;const rows=getRows(family()),q=$('macroSearch').value.trim().toLowerCase(),cat=$('macroCategory').value;let num=null;if(/^#?\d+$/.test(q)){num=Number(q.replace('#',''));if((num>=100&&num<=199)||(num>=500&&num<=699)||(num>=800&&num<=999))num+=10000;}
 const filtered=rows.filter(x=>(cat==='all'||x.category===cat)&&(!q||(num!==null?containsVar(x,num):(x.variable+' '+x.legacy+' '+x.name+' '+labels[x.category]).toLowerCase().includes(q))));
 const body=$('macroVariableRows');body.replaceChildren();for(const entry of filtered){const tr=document.createElement('tr');const code=document.createElement('td');const button=document.createElement('button');button.type='button';button.className='code-link';button.textContent=entry.variable;button.addEventListener('click',()=>showDetails(entry,num));code.append(button);const what=document.createElement('td');what.textContent=entry.name;what.className='codeclick';what.addEventListener('click',()=>showDetails(entry,num));const use=document.createElement('td');const tag=document.createElement('span');tag.className='macro-category macro-'+entry.category;tag.textContent=labels[entry.category];use.append(tag);tr.append(code,what,use);body.append(tr)}
 $('macroCount').textContent=`${filtered.length} reference entries${q?' matching':''} · ${rows.length} total (${family()==='lathe'?'ST lathe':'VF / UMC mill'})`;
 if(selectedEntry && !filtered.includes(selectedEntry)){$('macroVariableDetails').classList.add('hidden')}
}
function activeMacros(){if(!selectedMachine)return [];if(!Array.isArray(selectedMachine.macroPrograms))selectedMachine.macroPrograms=[];return selectedMachine.macroPrograms}
function saveDb(){const result=window.MachiningDeskIntegration?.saveDb?.();if(result===false)throw Error('Database could not be saved.');}
function clearEditor(){const f=$('macroProgramForm');f.reset();$('macroProgramOldId').value='';$('macroProgramError').textContent='';$('macroProgramSave').textContent='Save macro';$('macroProgramCancel').classList.add('hidden')}
function renderPrograms(){const body=$('macroProgramRows');body.replaceChildren();if(!selectedMachine)return;const q=$('macroProgramSearch').value.trim().toLowerCase(),all=activeMacros(),matches=all.filter(m=>('O'+m.number+' '+m.name+' '+m.args+' '+m.note).toLowerCase().includes(q)).sort((a,b)=>a.number-b.number);for(const m of matches){const row=document.createElement('tr'),one=document.createElement('td'),two=document.createElement('td'),three=document.createElement('td');one.textContent='O'+String(m.number).padStart(4,'0');two.textContent=m.name;const edit=document.createElement('button');edit.type='button';edit.className='btn ghost';edit.textContent='Edit';edit.addEventListener('click',()=>{$('macroProgramOldId').value=String(m.number);$('macroProgramNumber').value=m.number;$('macroProgramName').value=m.name;$('macroProgramArgs').value=m.args||'';$('macroProgramNote').value=m.note||'';$('macroProgramSave').textContent='Update macro';$('macroProgramCancel').classList.remove('hidden');$('macroProgramError').textContent='';$('macroProgramNumber').focus()});const remove=document.createElement('button');remove.type='button';remove.className='btn ghost';remove.textContent='Remove';remove.addEventListener('click',()=>{if(!confirm('Remove O'+m.number+' from this reference list? The real CNC program is not affected.'))return;selectedMachine.macroPrograms=activeMacros().filter(x=>x.number!==m.number);saveDb();renderPrograms()});three.append(edit,document.createTextNode(' '),remove);row.append(one,two,three);if(m.args||m.note){const desc=document.createElement('small');desc.textContent=[m.args,m.note].filter(Boolean).join(' — ');two.append(document.createElement('br'),desc);}body.append(row)}$('macroProgramCount').textContent=`${matches.length} saved program${matches.length===1?'':'s'} for this machine${q?' matching':''}`}
function storeProgram(event){event.preventDefault();if(!selectedMachine)return;const n=Number($('macroProgramNumber').value),name=$('macroProgramName').value.trim(),args=$('macroProgramArgs').value.trim(),note=$('macroProgramNote').value.trim(),old=$('macroProgramOldId').value;const error=$('macroProgramError');if(!Number.isInteger(n)||n<1||n>99999||!name){error.textContent='Enter a program number from 1 to 99999 and a name.';return}if(name.length>100||args.length>250||note.length>1500){error.textContent='Name, arguments, or notes are too long.';return}if(activeMacros().some(x=>x.number===n&&String(x.number)!==old)){error.textContent='That O program number is already listed for this machine.';return}
 if(old)selectedMachine.macroPrograms=activeMacros().filter(x=>String(x.number)!==old);activeMacros().push({number:n,name,args,note});saveDb();clearEditor();renderPrograms();}
function render(machine){selectedMachine=machine||null; if(!machine)return;const guide=$('macroMachineNotice');guide.textContent=`${family()==='lathe'?'ST lathe':'VF / UMC mill'} — Haas Next Generation Control reference. Exact available variables depend on control generation, options, probing and machine configuration. Read/modify control variables only after checking the machine manual.`; $('macroManualLink').href=DOCS[family()];selectedEntry=null;$('macroVariableDetails').classList.add('hidden');draw();clearEditor();renderPrograms()}
$('macroSearch').addEventListener('input',draw);$('macroCategory').addEventListener('change',draw);
$('macroSearchClear').addEventListener('click',()=>{$('macroSearch').value='';$('macroCategory').value='all';draw();$('macroSearch').focus()});
$('macroSubvariables').addEventListener('click',()=>selectTab('variables'));
$('macroSubprograms').addEventListener('click',()=>selectTab('programs'));
$('macroProgramForm').addEventListener('submit',storeProgram);
$('macroProgramCancel').addEventListener('click',clearEditor);
$('macroProgramSearch').addEventListener('input',renderPrograms);
for(const [key,tab] of [['codes','codeModeCodes'],['macros','codeModeMacros']])$(tab).addEventListener('click',()=>{const macros=key==='macros';$('codeTables').classList.toggle('hidden',macros);$('codeDetails').classList.add('hidden');$('macroPanel').classList.toggle('hidden',!macros);$('codeModeCodes').classList.toggle('active',!macros);$('codeModeMacros').classList.toggle('active',macros);$('codeModeCodes').setAttribute('aria-pressed',String(!macros));$('codeModeMacros').setAttribute('aria-pressed',String(macros));if(macros)draw()});
window.MachiningDeskHaasMacros={render};
})();
