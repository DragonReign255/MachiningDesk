/* v1.11.5 additional engineering grades. All SFM ranges are analogy-based shop STARTING estimates,
   NOT manufacturer-qualified tool/grade data. Conditions and density/strength values are typical only.
   Reference classes: Kennametal machining-data tables, TIMET grade datasheets,
   ASM/MatWeb material property overviews. Verify the exact material and cutting tool. */
(()=>{'use strict';
const specs=[
// id, name, group, analog, range ratio, density, E, alpha, yield, tensile, hardness, conductivity
['al5052','5052-H32 aluminum','Aluminum','mat_0',.88,2.68,70,23.8,193,228,'HB 60',138],
['al5083','5083-H116 aluminum','Aluminum','mat_0',.83,2.66,71,23.7,215,305,'HB 75',117],
['al6063','6063-T6 aluminum','Aluminum','mat_0',1,2.70,69,23.5,214,241,'HB 73',201],
['al7050','7050-T7451 aluminum','Aluminum','mat_1',.86,2.83,72,23.5,455,524,'HB 150',157],
['alMIC6','MIC-6 cast aluminum tool plate','Aluminum','mat_0',.82,2.70,71,23,105,166,'HB 65',138],
['alA356','A356-T6 cast aluminum','Aluminum','mat_22',.86,2.68,72,21.5,207,276,'HB 80',151],
['al319','319 cast aluminum','Aluminum','mat_22',.73,2.79,75,21,165,230,'HB 80',110],
['steel1008','AISI 1008 low-carbon steel','Carbon steel','mat_3',1.05,7.87,205,12.2,170,305,'HB 95',52],
['steel1020','AISI 1020 steel · normalized','Carbon steel','mat_3',1.0,7.87,205,12.0,350,420,'HB 120',51],
['steel1040','AISI 1040 steel · normalized','Carbon steel','mat_4',1.02,7.85,205,12,415,620,'HB 175',49],
['steel1144','AISI 1144 stressproof steel','Carbon steel','mat_5',.88,7.85,200,12,690,825,'HB 215',47],
['steel12L14','AISI 12L14 free-machining steel','Carbon steel','mat_5',1.15,7.87,200,12,415,540,'HB 160',48],
['steel4130','AISI 4130 steel · normalized','Alloy steel','mat_6',1.07,7.85,205,12.2,435,670,'HB 190',42],
['steel4142','AISI 4142 steel · prehardened','Alloy steel','mat_7',.88,7.85,205,12.2,690,900,'HRC 28–32',42],
['steel4150','AISI 4150 steel · annealed','Alloy steel','mat_6',.88,7.85,205,12.2,380,720,'HB 200',42],
['steel8620','AISI 8620 carburizing steel · normalized','Alloy steel','mat_6',1.0,7.85,205,12,385,635,'HB 175',46],
['steel9310','AISI 9310 steel · annealed','Alloy steel','mat_8',.88,7.85,205,12,440,760,'HB 210',39],
['st303','303 free-machining stainless · annealed','Stainless steel','mat_9',1.28,7.93,193,17.3,240,620,'HB 160',16],
['st310','310 stainless steel · annealed','Stainless steel','mat_9',.83,7.98,200,15.9,210,520,'HB 160',14],
['st321','321 stainless steel · annealed','Stainless steel','mat_9',.87,8.0,193,16.6,205,515,'HB 170',16],
['st410','410 stainless steel · annealed','Stainless steel','mat_11',1.05,7.75,200,10,275,480,'HB 170',25],
['st420','420 stainless steel · annealed','Stainless steel','mat_11',.88,7.74,200,10.3,350,650,'HB 205',24],
['st440c','440C stainless steel · annealed','Stainless steel','mat_11',.74,7.65,200,10.1,450,760,'HB 245',24],
['st15-5','15-5 PH stainless · H1025','Stainless steel','mat_11',.85,7.78,197,10.8,965,1069,'HRC 35',17],
['st2205','2205 duplex stainless · annealed','Stainless steel','mat_10',.76,7.8,200,13,450,620,'HB 260',19],
['st2507','2507 super duplex stainless · annealed','Stainless steel','mat_10',.64,7.8,200,13,550,800,'HB 290',17],
['tsA2','A2 tool steel · annealed','Tool steel','mat_13',1.13,7.86,207,11.5,450,750,'HB 235',24],
['tsO1','O1 tool steel · annealed','Tool steel','mat_12',1.05,7.82,205,12,420,700,'HB 230',29],
['tsH13','H13 tool steel · annealed','Tool steel','mat_12',.91,7.8,210,11.5,420,720,'HB 210',25],
['tsP20','P20 mold steel · prehardened','Tool steel','mat_7',.91,7.8,205,12.5,700,890,'HRC 28–34',30],
['tsM2','M2 high-speed steel · annealed','Tool steel','mat_13',.73,8.15,220,11,380,680,'HB 255',23],
['ciDuctile','Ductile iron ASTM A536 65-45-12','Cast iron','mat_14',.78,7.1,165,11.4,310,448,'HB 170',36],
['ciClass40','Gray iron ASTM A48 Class 40','Cast iron','mat_14',.89,7.2,120,11,0,276,'HB 210',43],
['tiGrade2','Titanium Grade 2 · annealed','Titanium','mat_15',1.2,4.51,105,8.6,275,345,'HB 160',16.4],
['tiGrade5','Ti-6Al-4V Grade 5 · annealed','Titanium','mat_15',1,4.43,114,8.6,830,900,'HRC 33–36',6.7],
['tiGrade9','Ti-3Al-2.5V Grade 9 · annealed','Titanium','mat_15',1.06,4.48,100,9,620,760,'HB 245',8],
['tiGrade23','Ti-6Al-4V ELI Grade 23','Titanium','mat_15',.98,4.43,114,8.6,795,860,'HRC 30–35',6.7],
['cu101','C10100 oxygen-free copper','Copper alloy','mat_16',.98,8.94,117,16.5,70,220,'HB 40–55',390],
['cu145','C14500 tellurium copper','Copper alloy','mat_16',1.25,8.94,117,16.5,260,330,'HB 75–95',320],
['cu172','C17200 beryllium copper · AT','Copper alloy','mat_18',.66,8.26,128,17,200,450,'HB 150',105],
['cu260','C26000 cartridge brass · H02','Copper alloy','mat_17',.81,8.53,110,20,250,395,'HB 85',120],
['cu464','C46400 naval brass','Copper alloy','mat_17',.71,8.41,100,20,240,450,'HB 100',110],
['cu510','C51000 phosphor bronze','Copper alloy','mat_18',.74,8.85,110,17,320,520,'HB 110',65],
['cu630','C63000 aluminum bronze','Copper alloy','mat_18',.65,7.58,115,16,380,690,'HB 170',39],
['cu954','C95400 aluminum bronze','Copper alloy','mat_18',.68,7.5,110,16,220,586,'HB 170',59],
['cu905','C90500 tin bronze','Copper alloy','mat_18',.94,8.8,100,18,124,250,'HB 75',60],
['ni625','Inconel 625 · annealed','Nickel alloy','mat_15',.48,8.44,205,12.8,415,830,'HB 220',9.8],
['ni718','Inconel 718 · solution treated','Nickel alloy','mat_15',.38,8.19,200,13,550,965,'HB 270',11.4],
['niMonel400','Monel 400 · annealed','Nickel alloy','mat_10',.58,8.8,179,14,170,480,'HB 130',22],
['niHastC276','Hastelloy C-276 · annealed','Nickel alloy','mat_15',.38,8.89,205,11.2,355,790,'HB 195',10],
['mgAZ31','AZ31B magnesium alloy','Magnesium','mat_0',.58,1.77,45,26,200,260,'HB 49',76],
['mgAZ91','AZ91D magnesium casting','Magnesium','mat_0',.55,1.81,45,26,160,230,'HB 65',72],
['coStellite6','Stellite 6 cobalt alloy · cast','Cobalt alloy','mat_15',.38,8.44,210,12,450,850,'HRC 38–46',14]
];
const links={Aluminum:'https://www.aluminum.org/',Titanium:'https://www.timet.com/documents/datasheets/',
'Nickel alloy':'https://www.specialmetals.com/', 'Copper alloy':'https://copper.org/', 'Stainless steel':'https://www.atlassteels.com.au/',
'Carbon steel':'https://www.kennametal.com/', 'Alloy steel':'https://www.kennametal.com/', 'Tool steel':'https://www.kennametal.com/',
'Magnesium':'https://www.matweb.com/', 'Cobalt alloy':'https://www.matweb.com/'};
function merge(db){if(!db?.materials?.length||!db.tools?.length)return false;let added=0;
 for(const [code,name,group,analog,scale,density,modulus,alpha,yieldMpa,tensileMpa,hardness,conductivity] of specs){
  const id='eng_'+code;if(db.materials.some(m=>m.id===id||m.name.toLowerCase()===name.toLowerCase()))continue;
  const base=db.materials.find(m=>m.id===analog)||db.materials[0];const ranges={},rangeSources={};
  for(const t of db.tools){const r=base.ranges?.[t.id];if(!r)continue;const x={};for(const substrate of ['carbide','hss'])if(Array.isArray(r[substrate]))x[substrate]=r[substrate].map(v=>Math.max(1,Math.round(v*scale)));if(Object.keys(x).length){ranges[t.id]=x;rangeSources[t.id]=Object.fromEntries(Object.keys(x).map(k=>[k,'analogue-estimate']));}}
  db.materials.push({id,name,group,unitHp:Math.max(.05,+(Number(base.unitHp||1)/Math.max(.55,scale)).toFixed(3)),ranges,rangeSources,
   properties:{density,modulus,alpha,yieldMpa,tensileMpa,hardness,conductivity},
   note:`${group==='Magnesium'?'CAUTION: magnesium chips and fines can ignite; follow combustible-metal machining, fire and coolant procedures. ':group==='Nickel alloy'?'Work-hardening/heat-resistant alloy: low-speed/tool-specific data required. ':''}Representative ${name} condition; strength/hardness vary with exact temper and stock form. All SFM bands are scaled analog-class starting ESTIMATES (×${scale}), not verified grade/toolmaker feeds and speeds. Compare with the specific manufacturer's cutter, coating and material chart. General reference: ${links[group]||'https://www.matweb.com/'}`});added++;
 }
 return added>0;
}
const preset=window.MachiningDeskDefaults;
const baseFresh=preset.freshData;
preset.freshData=function(){const db=baseFresh();merge(db);const add={uncoated:['Magnesium'],tib2:['Magnesium'],zrn:['Magnesium'],tialn:['Nickel alloy','Cobalt alloy'],altin:['Nickel alloy','Cobalt alloy'],alcrn:['Nickel alloy','Cobalt alloy']};for(const c of db.coatings)c.groups=[...new Set([...(c.groups||[]),...(add[c.id]||[])])];return db;};
window.MachiningDeskExtendedMaterials={merge,specs};
})();
