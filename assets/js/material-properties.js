/* Grade-condition workshop reference estimates. Not mill test certificates or design allowables. */
(()=>{'use strict';
const rows={
 mat_0:[2.70,68.9,23.6,275,310,'HB 95',167],mat_1:[2.81,71.7,23.5,503,572,'HB 150',130],mat_2:[2.78,73.1,23.2,325,470,'HB 120',121],
 mat_3:[7.87,205,12,370,440,'HB 120–180',51],mat_4:[7.85,205,12,310,565,'HB 170–210',49],mat_5:[7.87,200,12,415,525,'HB 140–190',49],
 mat_6:[7.85,205,12.3,415,655,'HB 180–220',42],mat_7:[7.85,205,12.3,655,850,'HRC 25–32',42],mat_8:[7.85,205,12.3,470,745,'HB 200–250',44],
 mat_9:[8.00,193,17.3,205,515,'HB 130–190',16],mat_10:[8.00,193,16.0,205,515,'HB 130–190',16],mat_11:[7.80,196,10.8,725,1000,'HRC 25–35',18],
 mat_12:[7.83,207,12,380,615,'HB 190–240',28],mat_13:[7.70,210,11,400,740,'HB 200–255',20],mat_14:[7.20,110,11,140,200,'HB 150–260',46],
 mat_15:[4.43,114,8.6,880,950,'HRC 33–39',6.7],mat_16:[8.94,117,16.5,69,220,'HB 40–65',390],mat_17:[8.49,97,20.5,125,340,'HB 75–100',115],mat_18:[8.93,100,18,125,240,'HB 60–110',45],
 mat_19:[1.14,2.4,85,65,85,'Shore D 75–85',.25],mat_20:[1.41,2.8,105,65,70,'Rockwell M 80–95',.31],mat_21:[.93,.8,145,20,30,'Shore D 60–70',.4],
 // EOS EOS M 290 30 µm, laser powder bed fusion as manufactured.
 // 270/450 MPa = XY orientation; 115 HBW, density 2.67, conductivity 100-110 W/m·K.
 mat_22:[2.67,70,20,270,450,'HBW 115',105]
};
const groups={Aluminum:[2.7,70,23,200,300,'HB 60–160',150],'Carbon steel':[7.85,205,12,300,450,'HB 120–220',48],'Alloy steel':[7.85,205,12,450,700,'HB 180–300',42],'Stainless steel':[7.9,193,16,215,525,'HB 130–250',16],'Tool steel':[7.8,205,12,400,700,'HB 180–260',24],'Cast iron':[7.2,110,11,0,200,'HB 150–260',46],Titanium:[4.43,114,8.6,800,900,'HRC 30–40',7],'Copper alloy':[8.7,110,18,100,250,'HB 50–150',110],Plastic:[1.2,2,100,30,60,'Shore D 60–90',.3]};
const keys=['density','modulus','alpha','yieldMpa','tensileMpa','hardness','conductivity'];
function get(m){const src=rows[m.id]||groups[m.group];const data={};for(let i=0;i<keys.length;i++){const k=keys[i];const own=m.properties?.[k];data[k]=own!==undefined&&own!==null&&own!==''?own:src?.[i]??null;}data.basis=String(m.id).startsWith('eng_')?'New library · grade/condition estimates':keys.some(k=>m.properties?.[k]!==undefined&&m.properties?.[k]!==null&&m.properties?.[k]!=='')?'User override + typical estimates':rows[m.id]?'Typical grade/condition estimates':src?'Family-level estimate':'Unknown';return data;}
window.MachiningDeskMaterialProperties={get,keys};
})();
