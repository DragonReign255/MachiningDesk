/* Haas G and M code reference, based on Haas online operator manuals (2026).
 * Short descriptions are paraphrases, not verbatim manufacturer text.
 * Machine software generation, purchased options and actual configuration control applicability.
 */
(()=>{'use strict';
const MILL_G=`00|Rapid positioning
01|Linear feed motion
02|Clockwise circular interpolation
03|Counterclockwise circular interpolation
04|Dwell
09|One-block exact stop
10|Program offsets
12|Clockwise circular pocket
13|Counterclockwise circular pocket
17|Select XY plane
18|Select XZ plane
19|Select YZ plane
20|Inch mode
21|Metric mode
28|Return to machine zero
29|Return from reference point
31|Feed until skip signal
35|Automatic tool diameter probing
36|Automatic work offset probing
37|Automatic tool offset probing
40|Cancel cutter compensation
41|Cutter compensation left
42|Cutter compensation right
43|Positive tool length compensation
44|Negative tool length compensation
47|Engrave text
49|Cancel tool length compensation
50|Cancel scaling
51|Enable scaling
52|Local coordinate offset
53|Use machine coordinates for this block
54|Work offset 1
55|Work offset 2
56|Work offset 3
57|Work offset 4
58|Work offset 5
59|Work offset 6
60|Unidirectional positioning
61|Exact stop mode
64|Cancel exact stop mode
65|Macro program call
68|Coordinate rotation
69|Cancel rotation
70|Bolt-hole circle
71|Bolt-hole arc
72|Bolt holes along angle
73|High-speed chip-breaking peck cycle
74|Reverse rigid tapping
76|Fine boring cycle
77|Back boring cycle
80|Cancel canned cycle
81|Drilling canned cycle
82|Spot drilling / dwell canned cycle
83|Full-retract peck drilling
84|Rigid tapping
85|Feed-in/feed-out boring
86|Bore and stop spindle
89|Bore, dwell, bore out
90|Absolute positioning
91|Incremental positioning
92|Shift coordinate system
93|Inverse time feed mode
94|Feed per minute mode
95|Feed per revolution mode
98|Return to initial Z height in cycle
99|Return to R plane in cycle
100|Cancel mirror image
101|Enable mirror image
103|Limit block lookahead
107|Cylindrical mapping
136|Automatic work offset center probing
141|3D+ cutter compensation
143|Five-axis tool length compensation
150|General-purpose pocket milling
154|Additional work offsets P1–P99
156|Broaching canned cycle
167|Change control setting
174|Counterclockwise non-vertical rigid tap
184|Clockwise non-vertical rigid tap
187|Control motion accuracy / smoothing
234|Tool center point control (TCPC)
253|Orient spindle to feature coordinate system
254|Dynamic work offset (DWO)
255|Cancel dynamic work offset
266|Visible-axis linear rapid percentage
268|Enable feature coordinate system
269|Disable feature coordinate system
390|Absolute positioning command
391|Incremental positioning command`;
const LATHE_G=`00|Rapid positioning
01|Linear feed motion
02|Clockwise circular interpolation
03|Counterclockwise circular interpolation
04|Dwell
09|One-block exact stop
10|Program offsets
12|Clockwise circular pocket (live tooling)
13|Counterclockwise circular pocket (live tooling)
14|Swap main and secondary spindle
15|Cancel secondary spindle swap
17|Select XY plane
18|Select XZ plane
19|Select YZ plane
20|Inch mode
21|Metric mode
28|Return to machine zero
29|Return from reference point
31|Skip-function feed
32|Synchronized thread-cutting motion
40|Cancel tool nose compensation
41|Tool nose compensation left
42|Tool nose compensation right
43|Positive tool length compensation
47|Text engraving
50|Maximum spindle RPM (CSS clamp)
51|Global coordinate offset
52|Local coordinate offset
53|Use machine coordinates for this block
54|Work offset 1
55|Work offset 2
56|Work offset 3
57|Work offset 4
58|Work offset 5
59|Work offset 6
61|Exact stop modal
64|Cancel exact stop mode
65|Macro subprogram call
68|Coordinate rotation
69|Cancel rotation
70|Finishing canned cycle
71|OD / ID rough turning cycle
72|Face roughing cycle
73|Irregular path stock-removal cycle
74|Face grooving canned cycle
75|OD / ID grooving canned cycle
76|Multiple-pass threading cycle
80|Cancel canned cycle
81|Axial drilling cycle
82|Spot drill / dwell cycle
83|Peck drilling cycle
84|Rigid tapping cycle
85|Boring cycle
86|Boring with spindle stop
89|Bore and dwell cycle
90|OD / ID simple turning cycle
92|Simple threading cycle
94|End-facing cycle
95|Face rigid tapping with live tooling
96|Constant surface speed (CSS)
97|Constant RPM mode
98|Feed per minute mode
99|Feed per revolution mode
100|Cancel mirror image
101|Enable mirror image
103|Limit block lookahead
105|Servo bar feeder cycle
107|Cylindrical mapping
112|XY-to-XC interpolation
113|Cancel XY-to-XC interpolation
154|Additional work offsets P1–P99
156|Broaching canned cycle
167|Change control setting
170|Cancel radius/diameter override
171|Radius programming override
172|Diameter programming override
184|Left-hand reverse tapping
186|Reverse live-tool rigid tapping
187|Control motion accuracy / smoothing
195|Forward live-tool radial tapping
196|Reverse live-tool radial tapping
198|Disable synchronous spindles
199|Engage synchronous spindles
200|Index on the fly
211|Manual tool setting
212|Automatic tool setting
241|Radial drilling cycle
242|Radial spot drilling
243|Radial peck drilling
245|Radial boring
246|Radial bore and stop
249|Radial bore and dwell`;
const MILL_M=`00|Program stop
01|Optional stop
02|End program
03|Spindle clockwise
04|Spindle counterclockwise
05|Stop spindle
06|Automatic tool change
07|Shower coolant on
08|Flood coolant on
09|Flood coolant off
10|Engage fourth-axis brake (option)
11|Release fourth-axis brake (option)
12|Engage fifth-axis brake (option)
13|Release fifth-axis brake (option)
16|Tool change
19|Orient spindle
29|Set output relay / M-Fin
30|End program and reset
31|Chip conveyor forward
33|Chip conveyor stop
34|Increment programmable coolant nozzle
35|Decrement programmable coolant nozzle
36|Pallet part ready
39|Rotate tool turret (where equipped)
41|Low gear override
42|High gear override
46|Conditional program jump
48|Verify loaded pallet program
50|Pallet change sequence
59|Turn output relay on
69|Turn output relay off
70|Clamp workholding
71|Unclamp workholding
73|Tool air blast on
74|Tool air blast off
75|Set probing reference point
78|Alarm if skip signal found
79|Alarm if skip signal not found
80|Automatic door open
81|Automatic door close
82|Tool unclamp
83|Automatic air gun on
84|Automatic air gun off
86|Tool clamp
88|Through-spindle coolant on
89|Through-spindle coolant off
90|Fixture clamp input on
91|Fixture clamp input off
95|Sleep mode
96|Conditional jump if no input
97|Local subprogram call
98|Subprogram call
99|Return from subprogram / loop
104|Tool probe arm extend
105|Tool probe arm retract
109|Interactive user input
116|Vise air blast on
117|Vise air blast off
130|Display media
131|Cancel display media
138|Spindle speed variation on
139|Spindle speed variation off
158|Mist condenser on
159|Mist condenser off
160|Cancel PulseJet
161|Continuous PulseJet
162|Single PulseJet event
163|Modal PulseJet
180|Automatic window open
181|Automatic window close
199|Pallet / part load or end program
300|Automatic part loader sequence`;
const LATHE_M=`00|Program stop
01|Optional stop
02|End program
03|Main spindle clockwise
04|Main spindle counterclockwise
05|Main spindle stop
08|Coolant on
09|Coolant off
10|Main chuck clamp
11|Main chuck unclamp
12|Air jet on
13|Air jet off
14|Main spindle C-axis brake on
15|Main spindle C-axis brake off
17|Turret index forward
18|Turret index reverse
19|Orient main spindle
21|Tailstock advance
22|Tailstock retract
23|Thread chamfer on
24|Thread chamfer off
30|End program and reset
31|Chip auger forward
33|Chip auger stop
35|Parts catcher part-off position
36|Parts catcher on
37|Parts catcher off
38|Spindle speed variation on
39|Spindle speed variation off
41|Low gear
42|High gear
59|Output relay on
69|Output relay off
78|Alarm if skip signal found
79|Alarm if skip signal not found
85|Automatic door open
86|Automatic door close
88|High-pressure coolant on
89|High-pressure coolant off
90|Fixture clamp input on
91|Fixture clamp input off
95|Sleep mode
96|Conditional jump
97|Local subprogram call
98|Subprogram call
99|Subprogram return / loop
104|Probe arm extend
105|Probe arm retract
109|Interactive user input
110|Secondary chuck clamp
111|Secondary chuck unclamp
112|Secondary spindle air blast on
113|Secondary spindle air blast off
114|Secondary spindle brake on
115|Secondary spindle brake off
119|Secondary spindle orient
130|Display media
131|Cancel media display
133|Live tool spindle forward
134|Live tool spindle reverse
135|Live tool spindle stop
138|Spindle speed variation on
139|Spindle speed variation off
143|Secondary spindle clockwise
144|Secondary spindle counterclockwise
145|Secondary spindle stop
146|Steady rest clamp
147|Steady rest unclamp
158|Mist condenser on
159|Mist condenser off
170|Engage fourth-axis brake
171|Release fourth-axis brake
174|Main chuck pressure adjustment
175|Sub-spindle chuck pressure adjustment
214|Live tool brake on
215|Live tool brake off
219|Live tool orient
299|APL / part load or program end
300|APL / robot sequence
334|P-cool increment
335|P-cool decrement
373|Tool air blast on
374|Tool air blast off
388|Through-spindle coolant on
389|Through-spindle coolant off`;
const PARMS={
 G00:'X Y Z or X Z B C — target axis positions; G90/G91 modes apply on mills.',
 G01:'X Y Z (and other axes), F — destination and feedrate.',
 G02:'X Y Z, I J K or R, F — circular feed motion (plane-dependent).',
 G03:'X Y Z, I J K or R, F — circular feed motion (plane-dependent).',
 G04:'P — dwell duration; Haas also supports X in some modes. Check time units.',
 G10:'L P X Y Z R — offset number and values; meanings depend on L selection.',
 G28:'Axis addresses — intermediate reference / machine-zero return. Check incremental mode before use.',
 G40:'Cancel active cutter or tool-nose compensation; no required operands.',
 G41:'D — diameter or tool-nose compensation register; motion and plane must be valid.',
 G42:'D — diameter or tool-nose compensation register; motion and plane must be valid.',
 G43:'H — tool length offset number, typically with Z.',
 G53:'X Y Z or X Z — non-modal positions in machine coordinates.',
 G65:'P — macro program number; optional arguments A–Z, L repeat count.',
 G71:'MILL: I J K L defines a bolt-hole arc; LATHE: P/Q profile blocks, D or I/K, F, U/W finishing stock.',
 G70:'MILL: I J L define a bolt-hole circle; LATHE: P and Q reference finishing profile blocks.',
 G72:'MILL: I J K L bolt-hole line; LATHE: P/Q profile blocks, roughing in facing direction.',
 G73:'MILL: Z R Q F and optional hole coordinates; LATHE: U/W/P/Q etc. irregular stock profile.',
 G74:'MILL: Z R F for reverse tapping; LATHE: X/Z/I/K/D/F for face grooving.',
 G75:'LATHE: X/Z/I/K/D/F depending OD/ID grooving mode.',
 G76:'MILL: Z R F and optional boring shift; LATHE: X/Z/K/D/F/I/A/P/Q depending threading strategy.',
 G80:'Cancel canned cycle; no required operands.',
 G81:'Z R F and optional X/Y hole location; L repeats in incremental mode.',
 G82:'Z R P F; P supplies dwell at hole bottom.',
 G83:'Z R Q F with optional I J K or P depending peck behavior / control.',
 G84:'Z R F, optional J/P — rigid tapping. Feed must match pitch and spindle.',
 G90:'MILL: absolute coordinates (modal); LATHE: X/Z/I/K/F simple turning cycle.',
 G91:'Incremental positioning on mills; axis values are relative to current position.',
 G92:'MILL: work coordinate shift; LATHE: X/Z/F threading cycle.',
 G94:'MILL: feed per minute; LATHE: X/Z/F end-face turning cycle.',
 G95:'MILL: feed per revolution; LATHE: face rigid tapping with live tool.',
 G96:'LATHE: S specifies constant surface speed (SFM or m/min). Set G50 spindle limit.',
 G97:'LATHE: S sets fixed spindle RPM.',
 G98:'MILL: return to initial point of canned cycle; LATHE: feed per minute mode.',
 G99:'MILL: return to R plane in canned cycle; LATHE: feed per revolution mode.',
 G103:'P — limit block lookahead; P0 restores normal lookahead.',
 G154:'P1–P99 — extended work offset selection.',
 G187:'P / E values affect smoothness and machining tolerance (controls/options differ).',
 G199:'LATHE: synchronous spindle control; requires compatible spindle equipment.',
 G234:'H — tool length offset; controls tool center point during simultaneous rotary machining. Only with supported 5-axis options.',
 G254:'After selecting work offset and indexing rotary axes, enable DWO for 3+2 positioning; cancel G255 before further rotary motion.',
 G255:'Cancel G254 dynamic work offset.',
 M00:'Unconditional pause until Cycle Start.',M01:'Pause only if Optional Stop enabled.',
 M03:'S — spindle speed in RPM (or per G96 on lathes); M03 starts clockwise.',M04:'S — spindle speed, reverse rotation.',
 M06:'T — select a tool and run the tool changer.',M08:'Coolant on; no required operands.',M09:'Coolant off; no required operands.',
 M10:'MILL: fourth-axis brake clamp; LATHE: chuck clamp (verify jaw mode, configuration and interlocks).',
 M11:'MILL: fourth-axis brake release; LATHE: main chuck unclamp (dangerous if unsupported workholding).',
 M19:'Optional R or P orientation parameters, depending control / machine.',
 M30:'Stop/reset main program; no required operands.',
 M88:'MILL: through-spindle coolant on; LATHE: high-pressure coolant on (where installed).',
 M89:'MILL: through-spindle coolant off; LATHE: high-pressure coolant off.',
 M97:'P — local subroutine N-label in the same program; L optional repeats.',
 M98:'P — external O-program number; L optional repetitions.',
 M99:'Return from subroutine, or loop at program end; P for sequence label return on some controls.',
 M109:'P — user-input variable / prompt format; check Haas manual.',
 M110:'Secondary spindle chuck clamp (sub-spindle option).',M111:'Secondary spindle chuck unclamp (sub-spindle option).',
 M133:'P — live tool RPM; forward rotation (on Haas live-tool lathes).',
 M134:'P — live tool RPM; reverse rotation (on Haas live-tool lathes).',
 M135:'Stop live-tool spindle; no required operands.',
 M143:'S — secondary spindle RPM, forward.',M144:'S — secondary spindle RPM, reverse.',
 M145:'Secondary spindle stop.',
};
// Haas G/M addresses can mean completely different things on a mill and a lathe.
// Keep summaries family-specific to avoid sending a lathe operator milling parameters.
// Common modal and fixed-cycle words; machine-specific overrides follow.
Object.assign(PARMS,{
 G09:'Non-modal exact stop for this move; no address words required beyond the current motion.',
 G12:'I — first cutter offset / circle radius; K — final diameter-related value; Q — step-over; D — cutter compensation register; F — feed. Check exact Haas syntax.',
 G13:'I, K, Q, D and F apply to circular pocket machining as in G12, with opposite direction.',
 G17:'Select X-Y circular interpolation plane; no required arguments.',G18:'Select X-Z circular interpolation plane; no required arguments.',G19:'Select Y-Z circular interpolation plane; no required arguments.',
 G20:'Set inch programming units. No required arguments.',G21:'Set metric programming units. No required arguments.',
 G29:'Axis addresses specify return point after G28; verify use of intermediate reference.',
 G31:'Axis endpoints and F feed — feed until probe skip signal or programmed limit.',
 G35:'Automatic tool diameter probing; typically axis location and probing parameters vary by package.',
 G36:'Automatic work-offset probing; parameters are probing-system-specific.',
 G37:'Automatic tool length probing; parameters are probing-system-specific.',
 G44:'H — negative tool length offset number; use only where required by tool setup.',
 G47:'P — engraving method; E — text character, I/J — spacing; check Haas control examples.',
 G49:'Cancel tool length compensation; no required arguments.',
 G50:'MILL: cancel scaling (no operands); LATHE: S spindle speed limit (RPM).',
 G51:'X/Y/Z — center of scale; P — scale multiplier. Exact syntax depends on modal mode.',
 G52:'X/Y/Z — local work offset, relative to selected work coordinate.',
 G54:'Select stored G54 work coordinate offset; no required arguments.',
 G55:'Select stored G55 work coordinate offset; no required arguments.',
 G56:'Select stored G56 work coordinate offset; no required arguments.',
 G57:'Select stored G57 work coordinate offset; no required arguments.',
 G58:'Select stored G58 work coordinate offset; no required arguments.',
 G59:'Select stored G59 work coordinate offset; no required arguments.',
 G60:'Position all axes in one direction to reduce backlash; supply axis target positions.',
 G61:'Exact stop modal mode (G64 to cancel); no required arguments.',
 G64:'Cancel modal exact stop / restore continuous motion; no required arguments.',
 G68:'X/Y (rotation center) and R (angle) for coordinate rotation in active plane.',
 G69:'Cancel G68 coordinate rotation; no required arguments.',
 G85:'Z/R/F — boring depth, clearance and feed. Feed both inward and outward.',
 G86:'Z/R/F — bore to depth and stop spindle before rapid retract.',
 G89:'Z/R/P/F — bore with dwell P at bottom then feed retract.',
 G100:'Cancel mirror image; no required operands.',
 G101:'X/Y/Z or axis addresses select axes to mirror; verify precise Haas control syntax.',
 G107:'Cylindrical mapping: feed and mapped axis address words; verify diameter input and live-tool options.',
 G136:'Automatic work offset center measurement; probe setup and offset target required.',
 G141:'3D cutter compensation for supported 5-axis programs; D register and motion apply.',
 G143:'H tool-length register for five-axis compensation where installed.',
 G150:'P pocket definition / Q stepover / R retract / D offset / F feed — consult Haas manual for full arguments.',
 G156:'Broaching canned cycle: movement and step parameters vary; use the linked Haas page.',
 G167:'P — setting number, Q — new setting value; requires permitted control access.',
 G174:'Non-vertical rigid tapping: Z/R/F and appropriate rotary/tool axes; verify Haas control.',
 G184:'Reverse non-vertical rigid tapping: Z/R/F and appropriate rotary/tool axes; verify Haas control.',
 G187:'P — smoothing mode, E — tolerance for smoothing; verify units and modes.',
 M02:'End program without automatic reset to start; no required operands.',
 M05:'Stop active main spindle; no required operands.',
 M07:'Shower coolant on where installed.',
 M09:'Turn coolant off; no required operands.',
 M17:'LATHE: turret index forward; do not call until tool clearance verified.',
 M18:'LATHE: turret index reverse; do not call until tool clearance verified.',
 M31:'Conveyor forward on machines with chip auger/conveyor option.',
 M33:'Stop chip conveyor / auger.',
 M34:'MILL: increment position of programmable coolant nozzle.',
 M35:'MILL: decrement programmable coolant nozzle; LATHE: parts catcher code may differ.',
 M41:'Select low spindle gear (where equipped).', M42:'Select high spindle gear (where equipped).',
 M59:'P — output relay number to turn on, depending accessory and machine.',
 M69:'P — output relay number to turn off.',
 M78:'Trigger alarm if probe skip signal found during programmed move.',
 M79:'Trigger alarm if probe skip signal not found during programmed move.',
 M80:'MILL: automatic door open (option).', M81:'MILL: automatic door close (option).',
 M95:'Program sleep mode; H and M optionally specify wait time depending control.',
 M96:'P — sequence/line number to jump to; Q — conditional input signal, control-dependent.',
 M104:'Activate automatic tool-probe arm (where fitted).',M105:'Retract automatic tool-probe arm (where fitted).',
 M138:'Activate spindle speed variation (where option installed).',M139:'Deactivate spindle speed variation.'
});
const LATHE_PARAMETERS={
 G50:'S — maximum spindle RPM clamp when G96 constant surface speed is active.',
 G70:'P — first block of finished contour; Q — last block of finished contour; uses profile from previous roughing cycle.',
 G71:'P and Q — start/end N blocks of roughing contour; D — radial depth per pass; U/W — X (diameter)/Z finish stock; I/K — radial/axial rough allowance; F — cutting feed. Haas also allows S and T.',
 G72:'P/Q — contour N blocks; D — roughing depth; U/W — finishing allowances; F — feed. Haas cycle uses facing-direction roughing.',
 G73:'P/Q — contour N blocks; I/K — X/Z roughing allowance, D — passes; U/W — finish stock; F — feed. Confirm syntax for this control.',
 G74:'X/Z — final groove position; I/K or D — peck depth depending cycle syntax; F — feed per rev with G99.',
 G75:'X/Z — final groove position; I/K or D — peck depths; F — grooving feed.',
 G76:'X/Z — final thread endpoint; K — radial thread height; D — first depth; F — thread lead; A/I/P/Q are optional threading-shape or finishing controls.',
 G90:'X/Z — target dimensions; I — taper in X, if applicable; F — cutting feed. Simple OD/ID turning canned cycle.',
 G92:'X/Z — thread endpoint; F — thread lead in length/revolution; I — optional taper.',
 G94:'X/Z — endpoint; K — optional face-taper parameter; F — feed. Simple facing canned cycle.',
 G95:'Live-tool face rigid tapping; verify installed live-tool option and required feed/position addresses.',
 G96:'S — constant surface speed in SFM (G20) or m/min (G21). Set a maximum RPM with G50.',
 G97:'S — fixed main spindle RPM.',
 G98:'Feed per minute mode (IPM or mm/min); no required arguments.',
 G99:'Feed per spindle revolution mode (IPR or mm/rev); no required arguments.',
 G14:'Swap main/secondary spindle commands where the machine supports this option.',
 G199:'Synchronize main and secondary spindles; secondary spindle option required.',
 G241:'X and radial live-tool axis positions, Z/R/F; consult Haas radial-drilling cycle page.',
 G83:'Z, R, Q, F for axial peck drilling; I/J/K or P available on some modes.',
 M10:'Main chuck clamp. Verify machine chuck-clamping configuration and workpiece retention.',
 M11:'Main chuck unclamp; do not call without safe part support.',
 M88:'High-pressure coolant ON where equipped.', M89:'High-pressure coolant OFF.',
 M110:'Secondary chuck clamp; secondary-spindle option required.',M111:'Secondary chuck unclamp; ensure part support.',
 M133:'P — live-tool RPM in forward rotation.',M134:'P — live-tool RPM in reverse rotation.',M135:'Stop live tooling.',
 M143:'S — secondary-spindle RPM forward.',M144:'S — secondary-spindle RPM reverse.',M145:'Stop secondary spindle.',
 M119:'P or R — secondary spindle orientation as supported by control; verify Haas manual.'
};
const MILL_PARAMETERS={
 G70:'I/J — circle center offset, L — number of bolt holes; confirm current-cycle drilling behavior.',
 G71:'I/J — arc center offset, K — arc angle, L — number of holes; use with active drilling canned cycle.',
 G72:'I/J — incremental hole spacing, K — angle, L — hole count; use with active drilling canned cycle.',
 G73:'Z/R/Q/F — peck drill depth, R plane, peck amount and cutting feed.',
 G74:'Z/R/F — reverse rigid-tap depth, R plane and pitch-synchronized feed.',
 G76:'Z/R/F — boring depth, R plane, feed; additional boring shift coordinates can apply.',
 G90:'Absolute coordinate programming mode; no required arguments.',
 G91:'Incremental coordinate programming mode; no required arguments.',
 G92:'Shift coordinate system; axis words indicate shift.',
 G94:'Feed per minute mode (IPM or mm/min).',
 G95:'Feed per revolution mode (IPR or mm/rev).',
 G98:'Return to initial Z plane after a canned cycle.',
 G99:'Return to programmed R plane after a canned cycle.',
 G234:'H — tool length offset for simultaneous 5-axis Tool Center Point Control (TCPC); supported machine and setup required.',
 G254:'Dynamic Work Offset (DWO) for 3+1/3+2 indexed work. Select offset and complete rotary motion before activation; cancel with G255 before rotary motion.',
 M10:'Clamp the fourth-axis brake, on applicable equipped mills.',M11:'Release the fourth-axis brake, on applicable equipped mills.',
 M88:'Through-spindle coolant on (TSC equipment required).',M89:'Through-spindle coolant off.',
};
function paramFor(code,family){return (family==='lathe'?LATHE_PARAMETERS:MILL_PARAMETERS)[code] || PARMS[code] || null;}
const millExtras=new Map([['G'+234,'five'],['G253','five'],['G254','five'],['G255','five'],['G268','five'],['G269','five'],['G390','five'],['G391','five'],['G143','five'],['G141','five'],['G174','five'],['G184','five'],['G266','five']]);
const gMillAdditional=['110','111','112','113','114','115','116','117','118','119','120','121','122','123','124','125','126','127','128','129'].map((n,i)=>['G'+n,`Additional work offset ${i+7}`]);
const gLatheAdditional=['110','111','114','115','116','117','118','119','120','121','122','123','124','125','126','127','128','129'].map((n,i)=>['G'+n,`Additional work offset ${i+7}`]);
function parse(raw,letter){return raw.trim().split('\n').map(row=>{const p=row.indexOf('|');return {code:letter+row.slice(0,p),name:row.slice(p+1)}})}
function makeCodes(raw,letter,extras=[]){const map=new Map(parse(raw,letter).map(x=>[x.code,x]));for(const [code,name] of extras)map.set(code,{code,name});return [...map.values()].sort((a,b)=>Number(a.code.slice(1))-Number(b.code.slice(1)))}
const lists={mill:{g:makeCodes(MILL_G,'G',gMillAdditional),m:makeCodes(MILL_M,'M')},lathe:{g:makeCodes(LATHE_G,'G',gLatheAdditional),m:makeCodes(LATHE_M,'M')}};
// Only assign five-axis-specific codes where a five-axis machine has been selected.
const isHaas=m=>['vf','umc','st'].includes(m.codeList??(/^Haas\b/i.test(m.name)?(m.id==='st20y'?'st':/UMC/i.test(m.name)?'umc':'vf'):'none'));
const machineFamily=m=>(m.codeList==='st'?'lathe':'mill');
const isFive=m=>m.codeList==='umc';
let selected=null,store=[];
const $=id=>document.getElementById(id);
function url(family,entry){const code=entry.code;return `https://www.haascnc.com/service/codes-settings.type%3D${code[0].toLowerCase()}code.machine%3D${family}.value%3D${code}.html`;}
function select(code,family,kind){const entry=store.find(x=>x.code===code&&x.family===family&&x.kind===kind);if(!entry)return;const info=$('codeDetails');info.replaceChildren();info.classList.remove('hidden');const title=document.createElement('h2');title.textContent=entry.code+' — '+entry.name;const blurb=document.createElement('p');blurb.textContent=entry.name+'. '+(paramFor(entry.code,family)?'Operation and parameters are summarized below.':'Refer to Haas documentation for the full command behavior and accepted address words.');const details=document.createElement('p');details.className='subtitle';details.textContent=paramFor(entry.code,family)||'The exact operands are machine/control specific; the Haas manual is authoritative.';const link=document.createElement('a');link.className='btn primary';link.textContent='Learn more on Haas ↗';link.href=url(family,entry);link.target='_blank';link.rel='noopener noreferrer';info.append(title,blurb,details,link);info.scrollIntoView({block:'nearest',behavior:'smooth'});}
function table(family,kind,list){const search=$(kind+'CodeSearch').value.toLowerCase().trim(),body=$(kind+'CodeRows');body.replaceChildren();const matches=list.filter(x=>(x.code+' '+x.name+' '+(paramFor(x.code,family)||'')).toLowerCase().includes(search));for(const entry of matches){const tr=document.createElement('tr');const tdCode=document.createElement('td');const tdName=document.createElement('td');const button=document.createElement('button');button.type='button';button.className='code-link';button.textContent=entry.code;button.setAttribute('aria-label','Details for '+entry.code+' '+entry.name);button.addEventListener('click',()=>select(entry.code,family,kind));tdCode.append(button);tdName.textContent=entry.name;tdName.className='codeclick';tdName.addEventListener('click',()=>select(entry.code,family,kind));tr.append(tdCode,tdName);body.append(tr)}$(kind+'CodeCount').textContent=`${matches.length} codes${search?' matching':' listed'}`;}
function refresh(){const m=store.find(x=>x.machineId===$('codeMachine').value)?.machine;
 const notice=$('codeNotice');$('codeDetails').classList.add('hidden');if(!m||!isHaas(m)){notice.textContent='This machine has no Haas code library. Select a configured Haas CNC machine.';$('codeTables').classList.add('hidden');return}
 const family=machineFamily(m),five=isFive(m);const excludedLathe=new Set(['G234','G254','G255','G268','G269','G390','G391']);const g=lists[family].g.filter(x=>family==='lathe'?!excludedLathe.has(x.code):(!millExtras.has(x.code)||five));const mList=lists[family].m;
 store=store.filter(x=>x.machine);
 for(const kind of ['g','m'])for(const entry of kind==='g'?g:mList)store.push({...entry,machineId:m.id,family,kind});
 notice.textContent=`${family==='lathe'?'Haas lathe / ST-20Y-compatible reference':'Haas mill reference'}${five?' · includes UMC/5-axis codes':''}. Not a verified machine-specific code dump. Installed control version and options determine actual availability; verify at the machine. Optional codes are included for reference.`;
 $('codeTables').classList.remove('hidden');table(family,'g',g);table(family,'m',mList);
}
function render(machines){const prev=$('codeMachine').value;const sel=$('codeMachine');sel.replaceChildren();store=machines.map(machine=>({machineId:machine.id,machine}));for(const m of machines.filter(isHaas)){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;sel.append(o)}if(machines.some(x=>x.id===prev&&isHaas(x)))sel.value=prev;else sel.value=machines.find(x=>x.id==='st20y'&&isHaas(x))?.id||machines.find(isHaas)?.id||'';refresh()}
$('codeMachine').addEventListener('change',refresh);
for(const kind of ['g','m'])$(kind+'CodeSearch').addEventListener('input',()=>{let m=store.find(x=>x.machineId===$('codeMachine').value)?.machine;if(m&&isHaas(m)){let family=machineFamily(m);table(family,kind,store.filter(x=>x.kind===kind&&x.family===family));}});
window.MachiningDeskHaasCodes={render};
})();
