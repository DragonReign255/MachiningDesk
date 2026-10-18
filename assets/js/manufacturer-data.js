/* Manufacturer-published tool-series cutting parameters. Inch base units.
   IMPORTANT: A chart for a specific tool series does not certify an arbitrary tool.
   Each mapping is by APPROXIMATE material family and hardness, not exact grade.
   Conservative ranges (85–100% of published target) are program-derived, not published bands.
*/
(()=>{
'use strict';
const SOURCES={
  hsAm2:{name:'Haas Tooling HSAM2 aluminum end mill · slot/side cutting',url:'https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/milling/end_mills/speeds-and-feeds/End%20Mills%2003-3052%20to%203062%2C%20HSAM2%2C%20Speeds%20and%20Feeds.pdf'},
  htPm:{name:'Haas Tooling HTPM end mill · slotting tables',url:'https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/milling/end_mills/speeds-and-feeds/End%20Mills%2C%2003-3076%20to%2003-3095%2C%20HTPM%2C%20Speeds%20and%20Feeds%2C%20Inch.pdf'},
  carbideDrill:{name:'Haas Tooling general-purpose carbide drills · diameter-dependent feeds',url:'https://www.haascnc.com/content/dam/haascnc/ecommerce-assets/linedrawings/holemaking/carbide_drills/speed-n-feeds/Carbide%20Drills%2C%20General%20Purpose%2C%20Speeds%20and%20Feeds%2C%20Inch.pdf'}
};
const millD=[.125,.1875,.25,.375,.5,.625,.75];
const steelD=[.25,.375,.5,.625,.75];
// Factory material IDs, deliberately grouped by manufacturer material classifications.
// fz is inch/tooth; fn is inch/revolution (NOT inch/tooth).
const MILL={
  '0':{source:'hsAm2',side:3000,slot:2000,diameters:millD,fz:[.001,.002,.003,.0045,.006,.0066,.0075]},
  '1':{source:'hsAm2',side:3000,slot:2000,diameters:millD,fz:[.001,.002,.003,.0045,.006,.0066,.0075]},
  '2':{source:'hsAm2',side:3000,slot:2000,diameters:millD,fz:[.001,.002,.003,.0045,.006,.0066,.0075]},
  '3':{source:'htPm',side:550,slot:550,diameters:steelD,fz:[.0006,.0015,.0019,.0021,.0026]},
  '4':{source:'htPm',side:550,slot:550,diameters:steelD,fz:[.0006,.0015,.0019,.0021,.0026]},
  '5':{source:'htPm',side:550,slot:550,diameters:steelD,fz:[.0006,.0015,.0019,.0021,.0026]},
  '6':{source:'htPm',side:550,slot:550,diameters:steelD,fz:[.0006,.0015,.0019,.0021,.0026]},
  '7':{source:'htPm',side:385,slot:385,diameters:steelD,fz:[.0006,.0015,.0019,.0021,.0026]},
  '8':{source:'htPm',side:550,slot:550,diameters:steelD,fz:[.0006,.0015,.0019,.0021,.0026]},
  '9':{source:'htPm',side:485,slot:485,diameters:steelD,fz:[.0005,.0013,.0015,.0018,.0022]},
  '10':{source:'htPm',side:485,slot:485,diameters:steelD,fz:[.0005,.0013,.0015,.0018,.0022]},
  '11':{source:'htPm',side:350,slot:350,diameters:steelD,fz:[.0007,.0019,.0022,.0024,.003]},
  '12':{source:'htPm',side:230,slot:230,diameters:steelD,fz:[.0004,.0011,.0013,.0015,.0018]},
  '13':{source:'htPm',side:230,slot:230,diameters:steelD,fz:[.0004,.0011,.0013,.0015,.0018]},
  '14':{source:'htPm',side:405,slot:405,diameters:steelD,fz:[.0008,.0019,.0023,.0026,.0032]},
  '15':{source:'htPm',side:190,slot:190,diameters:steelD,fz:[.0006,.0017,.002,.0022,.0027]},
  '16':{source:'hsAm2',side:1150,slot:880,diameters:millD,fz:[.0008,.0014,.002,.004,.005,.0055,.006]},
  '17':{source:'hsAm2',side:1150,slot:880,diameters:millD,fz:[.0008,.0014,.002,.004,.005,.0055,.006]},
  '18':{source:'hsAm2',side:1150,slot:880,diameters:millD,fz:[.0008,.0014,.002,.004,.005,.0055,.006]}
};
const drillD=[.125,.1875,.25,.315,.375,.5,.625,.75];
// Haas table uses feeds by drill DIAMETER, not number of drill cutting edges.
const carbideDrillProfiles={
  '3':[329,[.00355,.0043,.0067,.0075,.00905,.0102,.0128,.01375]],
  '4':[329,[.00355,.0043,.0067,.0075,.00905,.0102,.0128,.01375]],
  '5':[329,[.00355,.0043,.0067,.0075,.00905,.0102,.0128,.01375]],
  '6':[329,[.00355,.0043,.0067,.0075,.00905,.0102,.0128,.01375]],
  '7':[263,[.00355,.0043,.0067,.0087,.0087,.0087,.0087,.009]],
  '8':[329,[.00355,.0043,.0067,.0075,.00905,.0102,.0128,.01375]],
  '9':[148,[.00275,.00395,.0051,.0067,.0075,.0087,.0087,.0098]],
  '10':[148,[.00275,.00395,.0051,.0067,.0075,.0087,.0087,.0098]],
  '11':[230,[.00355,.0043,.0067,.0075,.00905,.0102,.0128,.01375]],
  '12':[230,[.00275,.00395,.0051,.0067,.0075,.0087,.0087,.0098]],
  '13':[132,[.0021,.00395,.0051,.0067,.0075,.0087,.0087,.0098]],
  '14':[329,[.00435,.0059,.0073,.0091,.0114,.0122,.0142,.01535]]
};
function lerpDiam(d,dx,values){if(!Number.isFinite(d)||d<=0)return null;if(d<=dx[0])return values[0];if(d>=dx[dx.length-1])return values[values.length-1];let hi=dx.findIndex(v=>v>=d),lo=hi-1;return values[lo]+(values[hi]-values[lo])*(d-dx[lo])/(dx[hi]-dx[lo]);}
function lookup(matId,toolId,substrate,d,slot){if(substrate!=='carbide')return null;const k=/^mat_(\d+)$/.exec(matId)?.[1];if(!k)return null;
 if(toolId==='flat'&&MILL[k]){let p=MILL[k];return {kind:'milling',source:p.source,sfm:slot?p.slot:p.side,feed:lerpDiam(d,p.diameters,p.fz),feedUnit:'IPT',minDiameter:p.diameters[0],maxDiameter:p.diameters.at(-1),slotProfile:p.source==='hsAm2',basis:'Material-group approximation; published for the specific Haas tool series and listed engagement.'};}
 if(toolId==='drill_carbide'&&carbideDrillProfiles[k]){let p=carbideDrillProfiles[k];return {kind:'drilling',source:'carbideDrill',sfm:p[0],feed:lerpDiam(d,drillD,p[1]),feedUnit:'IPR',minDiameter:drillD[0],maxDiameter:drillD.at(-1),slotProfile:false,basis:'Material hardness-group approximation; intended for general-purpose Haas carbide drills.'};}
 return null;}
window.MachiningDeskManufacturer={SOURCES,lookup};
})();
