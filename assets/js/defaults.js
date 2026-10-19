/* Machining Desk — editable factory library; sourced entries identify specific tool series. */
(()=>{
'use strict';
const makeTools=()=>[
 {id:'flat',name:'Flat end mill',op:'mill',factor:1,d:.5,teeth:4,load:.004,slot:true,thin:true,hsm:true,note:'General-purpose flat-end milling.'},
 {id:'ball',name:'Ball nose end mill',op:'mill',factor:.75,d:.5,teeth:4,load:.003,slot:false,thin:true,hsm:true,note:'Ball nose tip has zero surface speed at the center; effective cutting diameter changes with contact geometry.'},
 {id:'bull',name:'Bull / hog nose end mill',op:'mill',factor:.9,d:.5,teeth:4,load:.004,slot:true,thin:true,hsm:true,note:'Corner radius is not explicitly modeled.'},
 {id:'rough',name:'Roughing / serrated end mill',op:'mill',factor:.83,d:.5,teeth:4,load:.006,slot:true,thin:true,hsm:true,note:'Chip breaker geometry can change cutting forces.'},
 {id:'face',name:'Face mill',op:'mill',factor:1,d:2,teeth:5,load:.006,slot:false,thin:true,hsm:false,note:'Effective entering angle and insert geometry are not modeled.'},
 {id:'chamfer',name:'Chamfer mill',op:'mill',factor:.8,d:.5,teeth:3,load:.003,slot:false,thin:false,hsm:false,note:'Use actual contact diameter for precise SFM calculations.'},
 {id:'saw',name:'Slitting / slotting saw',op:'mill',factor:.6,d:3,teeth:48,load:.001,slot:false,thin:false,hsm:false,note:'RDOC is the saw kerf width; ADOC is the radial cutting engagement. Confirm saw-specific parameters.'},
 {id:'dovetail',name:'Dovetail cutter',op:'mill',factor:.48,d:.75,teeth:6,load:.0015,slot:false,thin:false,hsm:false,useFlute:true,flute:.20,angle:60,neckDiameter:.375,feedFactor:.55,note:'Special form cutter: speed based on maximum cutting diameter; conservative feed. Pre-clear slot and check neck clearance, included angle and toolmaker data.'},
 {id:'turn_ext',name:'External turning tool',op:'turn',factor:1,d:2,teeth:1,load:.008,note:'Diameter is the workpiece diameter at the cut.'},
 {id:'turn_bore',name:'Boring bar',op:'turn',factor:.85,d:1,teeth:1,load:.005,note:'Diameter is the machined bore diameter. Boring bar overhang strongly influences stability.'},
 {id:'turn_groove',name:'Grooving tool',op:'turn',factor:.7,d:2,teeth:1,load:.003,groove:true,note:'Feed is radial and RDOC is radial travel. Use the tool width to estimate removal.'},
 {id:'turn_part',name:'Parting tool',op:'turn',factor:.65,d:2,teeth:1,load:.002,groove:true,note:'Power depends on cutter width and instantaneous cutting diameter.'},
 {id:'turn_thread',name:'Single-point threading tool',op:'turn',factor:.55,d:2,teeth:1,load:.05,thread:true,note:'Feed per revolution is thread lead. Power and MRR are not estimated for threading.'},
 {id:'drill_twist',name:'Twist drill',op:'drill',factor:.52,d:.375,teeth:2,load:.006,note:'Use manufacturer drilling charts; feed depends strongly on drill diameter and point geometry.'},
 {id:'drill_insert',name:'Indexable insert drill',op:'drill',factor:.62,d:1,teeth:2,load:.009,note:'Refer to insert manufacturer for chip-load and cutting speed.'},
 {id:'drill_spot',name:'Spot drill',op:'drill',factor:.55,d:.25,teeth:2,load:.003,note:'Power uses nominal cylinder volume and overestimates a conical spot operation.'},
 {id:'drill_center',name:'Center drill',op:'drill',factor:.5,d:.125,teeth:2,load:.002,note:'Cutting diameter varies along the taper; values are rough estimates.'},
 {id:'drill_ream',name:'Chucking reamer',op:'drill',factor:.43,d:.5,teeth:6,load:.008,ream:true,note:'An existing hole diameter is required for reasonable removal-rate estimates.'},
 {id:'drill_countersink',name:'Countersink',op:'drill',factor:.48,d:.5,teeth:3,load:.003,note:'Use contact diameter and taper geometry for precise feeds, speeds and horsepower.'}
];
const stockMaterials=[
 ['6061-T6 aluminum','Aluminum',800,1500,180,350,.32],['7075-T6 aluminum','Aluminum',800,1500,130,275,.35],['2024-T3 aluminum','Aluminum',800,1500,120,250,.39],
 ['AISI 1018 steel','Carbon steel',275,525,70,120,1.05],['AISI 1045 steel','Carbon steel',220,480,50,105,1.2],['AISI 1215 steel','Carbon steel',320,650,90,160,.95],
 ['AISI 4140 steel · annealed','Alloy steel',220,500,45,100,1.35],['AISI 4140 steel · prehardened','Alloy steel',160,340,35,75,1.55],['AISI 4340 steel · annealed','Alloy steel',180,410,40,90,1.35],
 ['AISI 304 stainless steel','Stainless steel',140,310,35,75,1.65],['AISI 316 stainless steel','Stainless steel',115,275,30,65,1.75],['17-4 PH stainless steel · annealed','Stainless steel',120,300,30,70,1.65],
 ['S7 tool steel · annealed','Tool steel',170,360,35,75,1.5],['D2 tool steel · annealed','Tool steel',100,250,25,60,1.65],
 ['Gray cast iron','Cast iron',250,550,65,120,1.2],['Ti-6Al-4V titanium alloy','Titanium',85,190,20,45,1.65],
 ['C110 copper','Copper alloy',250,700,90,280,.5],['C360 free-cutting brass','Copper alloy',500,1200,170,420,.45],['C93200 bearing bronze','Copper alloy',220,600,85,210,.7],
 ['Nylon 6/6','Plastic',300,950,170,450,.11],['Acetal (POM / Delrin)','Plastic',400,1100,220,540,.12],['UHMW polyethylene','Plastic',250,650,125,360,.1]
];
function makeRanges(loC,hiC,loH,hiH,tools){let ranges={};for(const t of tools){let factor=Number.isFinite(t.factor)?t.factor:1;ranges[t.id]={carbide:[Math.round(loC*factor),Math.round(hiC*factor)],hss:[Math.round(loH*factor),Math.round(hiH*factor)]}}return ranges}
const toolsForFactoryAl=makeTools();
function applyPublishedDefaults(materials){
 for(const m of materials){
  m.rangeSources={};
  if(m.group==='Aluminum')for(const tool of toolsForFactoryAl.filter(t=>t.op!=='drill')){if(m.ranges[tool.id])m.ranges[tool.id].carbide=[Math.round(800*tool.factor),Math.round(1500*tool.factor)];}
  for(const t of ['flat','drill_twist']){
   let r=window.MachiningDeskManufacturer?.lookup(m.id,t,'carbide',.5,false);
   if(!r)continue;
   // The source publishes a single target, not a range: derive a conservative 85–100% starting band.
   m.ranges[t].carbide=m.group==='Aluminum'&&t!=='drill_twist'?[800,1500]:[Math.round(.85*r.sfm),r.sfm];
   m.rangeSources[t]={carbide:m.group==='Aluminum'&&t!=='drill_twist'?'shop-aluminum':r.source};
  }
  m.note+=' Manufacturer-based references apply to specified tool series only; aluminum carbide starting band is a user shop preference of 800–1500 SFM.';
 }
 return materials;
}
function freshData(){const tools=makeTools();return {machines:[
 {id:'vf1',name:'Haas VF-1',ops:['mill','drill'],rpm:8100,hp:30,maxFeed:500,toolIds:[],note:'Standard listed Haas spindle maximum rating; confirm installed options and duty cycle.'},
 {id:'vf5xt',name:'Haas VF-5/40XT',ops:['mill','drill'],rpm:8100,hp:30,maxFeed:500,toolIds:[],note:'Haas standard 40-taper configuration; verify installed spindle.'},
 {id:'vf4ss',name:'Haas VF-4SS · example',ops:['mill','drill'],rpm:12000,hp:30,maxFeed:800,toolIds:[],note:'Illustrative values only. Confirm the specific machine spindle option.'},
 {id:'umc750ss',name:'Haas UMC-750SS',ops:['mill','drill'],rpm:12000,hp:30,maxFeed:833,toolIds:[],note:'Current Haas listed standard spindle, 12000 rpm. Older configurations or optional spindles vary.'},
 {id:'st20y',name:'Haas ST-20Y',ops:['turn','drill','mill'],rpm:4000,hp:20,secondaryRpm:6000,secondaryHp:0,liveRpm:4000,liveHp:0,maxFeed:500,toolIds:[],note:'Main 20 hp / 4000 rpm; optional sub 6000 rpm; live tools 4000 rpm (Haas current spec). Sub and live tool horsepower NOT verified: enter before relying on horsepower utilization.'},
 {id:'manualmill',name:'Manual vertical mill',ops:['mill','drill'],rpm:2000,hp:2,maxFeed:12,manual:true,speedFactor:.25,feedFactor:.22,toolIds:[],note:'Conservative example for manual equipment, not a rated spindle specification. Modify for your machine.'},
 {id:'manuallathe',name:'Manual engine lathe',ops:['turn','drill'],rpm:2000,hp:2,maxFeed:10,manual:true,speedFactor:.25,feedFactor:.22,toolIds:[],note:'Conservative example for manual equipment. Maximum RPM set to 2000 as requested; check actual lathe.'},
 {id:'generalmill',name:'Generic milling machine',ops:['mill','drill'],rpm:8000,hp:15,maxFeed:250,toolIds:[],note:'Replace example limits with machine manual values.'},
 {id:'generallathe',name:'Generic CNC lathe',ops:['turn','drill'],rpm:3500,hp:15,maxFeed:200,toolIds:[],note:'Example main spindle. Stationary drilling in a lathe uses workpiece rotation.'}
 ],tools,materials:applyPublishedDefaults(stockMaterials.map(([name,group,cl,ch,hl,hh,unitHp],i)=>({id:'mat_'+i,name,group,unitHp,note:'Unsupported tool combinations use illustrative starting ranges. Check temper, tool grade and coolant.',ranges:makeRanges(cl,ch,hl,hh,tools)}))),coatings:[
 {id:'uncoated',name:'Uncoated',groups:['Aluminum','Copper alloy','Plastic','Titanium','Cast iron'],factor:1,note:'Baseline of material SFM tables.'},
 {id:'tin',name:'TiN · Titanium nitride',groups:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Cast iron','Titanium'],factor:1.04,note:'Coating benefit depends on workpiece material, grade and application.'},
 {id:'ticn',name:'TiCN · Titanium carbonitride',groups:['Carbon steel','Alloy steel','Tool steel','Cast iron','Stainless steel'],factor:1.06,note:'Coating benefit depends on workpiece material, grade and application.'},
 {id:'tialn',name:'TiAlN · Titanium aluminum nitride',groups:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],factor:1.08,note:'Common for some high-temperature steel applications; not a universal improvement.'},
 {id:'altin',name:'AlTiN · Aluminum titanium nitride',groups:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Titanium','Cast iron'],factor:1.1,note:'Common for some high-temperature steel applications; not a universal improvement.'},
 {id:'alcrn',name:'AlCrN · Aluminum chromium nitride',groups:['Carbon steel','Alloy steel','Stainless steel','Tool steel','Cast iron','Titanium'],factor:1.08,note:'Suitability depends on cutting and material conditions.'},
 {id:'tib2',name:'TiB₂ · Titanium diboride',groups:['Aluminum'],factor:1,note:'Harvey Tool recommends TiB₂ for non-abrasive aluminum alloys. Coating suitability is cutter-specific; do not automatically increase SFM.'},
 {id:'zrn',name:'ZrN · Zirconium nitride',groups:['Aluminum','Copper alloy'],factor:1.04,note:'Often considered for nonferrous machining; depends on tool manufacturer.'},
 {id:'dlc',name:'DLC · Diamond-like carbon',groups:['Aluminum','Copper alloy','Plastic'],factor:1.07,note:'Generally more appropriate to some nonferrous materials than steel; verify compatibility.'}
 ]}}

function oldFactoryRange(matId,toolId){let idx=Number(String(matId).replace('mat_',''));let row=stockMaterials[idx];let t=makeTools().find(t=>t.id===toolId);if(!row||!t)return null;return [Math.round(row[2]*t.factor),Math.round(row[3]*t.factor)];}
window.MachiningDeskDefaults={freshData,makeRanges,oldFactoryRange};
})();
