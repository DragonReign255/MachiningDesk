/* Shared countersink geometry, V1.11.1. Linear truncated-cone model. */
(()=>{'use strict';
const rad=Math.PI/180;
function valid(cutter,angle,pilot,cut){return [cutter,angle,pilot,cut].every(Number.isFinite)&&cutter>0&&angle>0&&angle<180&&pilot>=0&&cut>=pilot&&cut<=cutter&&cut>0;}
function depth(cutter,angle,pilot,cut){if(!valid(cutter,angle,pilot,cut))return NaN;return (cut-pilot)/(2*Math.tan(angle*rad/2));}
function diameter(cutter,angle,pilot,depth){if(![cutter,angle,pilot,depth].every(Number.isFinite)||cutter<=0||angle<=0||angle>=180||pilot<0||pilot>=cutter||depth<0)return NaN;return pilot+2*depth*Math.tan(angle*rad/2);}
function volume(angle,pilot,cut,depth){if(![angle,pilot,cut,depth].every(Number.isFinite)||depth<=0||cut<pilot||pilot<0)return NaN;return Math.PI*depth*(cut*cut+cut*pilot-2*pilot*pilot)/12;}
window.MachiningDeskCountersink={valid,depth,diameter,volume};
})();
