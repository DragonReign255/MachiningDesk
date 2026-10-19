/* Socket head cap screw reference: ASME B18.3 / ISO 4762; tabulated by NORAMARK.
   inch arrays: name, head diameter, head height, close clearance drill, free drill,
   counterbore diameter (inch). Metric arrays: name, head diameter, head height,
   fine clearance, medium clearance, counterbore diameter (mm).
*/
(()=>{'use strict';
const inch=[
 ['#2',.140,.086,'#43 · .0890','#41 · .0960',.1875],['#3',.161,.099,'#37 · .1040','#35 · .1100',.21875],
 ['#4',.183,.112,'#32 · .1160','#30 · .1285',.21875],['#5',.205,.125,'#30 · .1285','#29 · .1360',.25],
 ['#6',.226,.138,'#27 · .1440','#25 · .1495',.28125],['#8',.270,.164,'#18 · .1695','#16 · .1770',.3125],
 ['#10',.312,.190,'#9 · .1960','#7 · .2010',.375],['1/4',.375,.250,'F · .2570','H · .2660',.4375],
 ['5/16',.469,.312,'P · .3230','Q · .3320',.53125],['3/8',.562,.375,'W · .3860','X · .3970',.625],
 ['7/16',.656,.438,'29/64 · .4531','15/32 · .4688',.71875],['1/2',.750,.500,'33/64 · .5156','17/32 · .5313',.8125],
 ['5/8',.938,.625,'41/64 · .6406','43/64 · .6719',1],['3/4',1.125,.750,'49/64 · .7656','51/64 · .7969',1.1875],
 ['7/8',1.312,.875,'57/64 · .8906','59/64 · .9219',1.375],['1',1.5,1,'1-1/64 · 1.0156','1-3/64 · 1.0469',1.625]
];
const metric=[['M3',5.5,3,3.2,3.4,6.5],['M4',7,4,4.3,4.5,8],['M5',8.5,5,5.3,5.5,10],['M6',10,6,6.4,6.6,11],['M8',13,8,8.4,9,15],['M10',16,10,10.5,11,18],['M12',18,12,13,13.5,20],['M16',24,16,17,17.5,26],['M20',30,20,21,22,33],['M24',36,24,25,26,40]];
function render(){const sys=document.getElementById('screwSeries').value,q=document.getElementById('screwSearch').value.trim().toLowerCase(),host=document.getElementById('screwRows');host.replaceChildren();const data=sys==='inch'?inch:metric;
for(const [size,h,hgt,close,free,bore] of data){if(!size.toLowerCase().includes(q))continue;const tr=document.createElement('tr');const len=v=>sys==='inch'?(v.toFixed(4)+' in / '+(v*25.4).toFixed(2)+' mm'):(Number(v).toFixed(2)+' mm / '+(v/25.4).toFixed(4)+' in');for(const val of [size,len(h),len(hgt),typeof close==='string'?close:len(close),typeof free==='string'?free:len(free),len(bore),len(hgt)]){const td=document.createElement('td');td.textContent=val;tr.append(td)}host.append(tr)}if(!host.children.length){const row=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=7;cell.textContent='No matching screw sizes.';row.append(cell);host.append(row);}}
for(const id of ['screwSeries','screwSearch'])document.getElementById(id).addEventListener(id==='screwSeries'?'change':'input',render);render();
window.MachiningDeskHardware={render};
})();
