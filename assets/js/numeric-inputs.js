/* Machining Desk: fractional shop dimensions, numbered/letter drills, AWG measuring wires. */
(()=>{'use strict';
const FRACTIONS={'½':.5,'¼':.25,'¾':.75,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875,'⅙':1/6,'⅓':1/3,'⅔':2/3,'⅚':5/6,'⅕':.2,'⅖':.4,'⅗':.6,'⅘':.8,'⅟':NaN};
const drillIds=new Set(['calcDiameter','calcPriorHole','drillSearch']);
function fractionValue(value){let s=String(value??'').trim().replace(/[−–]/g,'-').replace(/[“”″]/g,'').replace(/\binches?\b|\bin\b/gi,'').trim();if(!s)return NaN;
 if(/^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?$/i.test(s))return Number(s);
 const sign=s.startsWith('-')?-1:1;if(/^[+\-]/.test(s))s=s.slice(1).trim();
 const glyph=s.match(/^(\d+)?\s*([½¼¾⅛⅜⅝⅞⅙⅓⅔⅚⅕⅖⅗⅘])$/);if(glyph)return sign*((Number(glyph[1])||0)+FRACTIONS[glyph[2]]);
 // Mixed shop fractions can be written 1 3/8, 1-3/8 or 1+3/8.
 const mixed=s.match(/^(\d+(?:\.\d+)?)\s*[-+ ]\s*(\d+)\s*\/\s*(\d+)$/);
 if(mixed&&Number(mixed[3])>0)return sign*(Number(mixed[1])+Number(mixed[2])/Number(mixed[3]));
 const simple=s.match(/^(\d+)\s*\/\s*(\d+)$/);if(simple&&Number(simple[2])>0)return sign*Number(simple[1])/Number(simple[2]);return NaN;}
function parse(raw,id=''){const s=String(raw??'').trim();if(!s)return NaN;const inputId=String(id);
 if(drillIds.has(inputId)){
  const ref=window.MachiningDeskReferences;if(ref){const n=s.match(/^#\s*(\d{1,2})$/i);if(n){const i=Number(n[1]);if(i>=1&&i<=80)return ref.NUMBER_SIZES[i-1]*(document.getElementById('unitMetric')?.getAttribute('aria-pressed')==='true'?25.4:1);}if(/^[a-z]$/i.test(s))return ref.LETTER_SIZES[s.toUpperCase().charCodeAt(0)-65]*(document.getElementById('unitMetric')?.getAttribute('aria-pressed')==='true'?25.4:1);}
 }
 if(inputId==='wireDiameter'){
  const m=s.match(/^(?:awg\s*)?#\s*(\d{1,2})$/i)||s.match(/^awg\s*(\d{1,2})$/i);if(m){const gauge=Number(m[1]);if(gauge>=0&&gauge<=40){let inSize=.005*Math.pow(92,(36-gauge)/39);return document.getElementById('threadSystem')?.value==='metric'?inSize*25.4:inSize;}}
 }
 return fractionValue(s);}
function converted(raw,id){const v=parse(raw,id);if(!Number.isFinite(v))return null;let label=null;
 if(/^\s*#\s*\d+\s*$/i.test(raw)&&id==='wireDiameter'||/^\s*awg\s*#?\s*\d+\s*$/i.test(raw)&&id==='wireDiameter')label='AWG wire';
 else if(drillIds.has(id)&&(/^\s*#\s*\d+/i.test(raw)||/^\s*[a-z]\s*$/i.test(raw)))label='Drill gauge';
 else if(/[\/¼½¾⅛⅜⅝⅞⅙⅓⅔⅚⅕⅖⅗⅘]/.test(raw))label='Fraction';
 return label?{value:v,label}:null;}
function enhanceInputs(root=document){const fields=[];if(root instanceof HTMLInputElement)fields.push(root);if(root.querySelectorAll)fields.push(...root.querySelectorAll('input[type="number"],#calculatorPage input[type="text"]'));for(const input of fields){if(input.type==='number'){input.type='text';input.inputMode='decimal';input.dataset.numericInput='true';input.setAttribute('autocomplete','off');}else if(input.closest('#calculatorPage')&&input.type==='text')input.dataset.numericInput='true';}}
function preview(input){const previous=input.parentElement?.querySelector(`.md-numeric-preview[data-for="${CSS.escape(input.id)}"]`);if(previous)previous.remove();let conv=converted(input.value,input.id);if(!conv&&input.dataset.lastFraction&&Number.isFinite(fractionValue(input.dataset.lastFraction))&&Math.abs(Number(input.value)-Number(fractionValue(input.dataset.lastFraction).toFixed(4)))<1e-9)conv={label:input.dataset.lastFraction.trim()+' →',value:Number(input.value),fractional:true};if(!conv)return;const hint=document.createElement('div');hint.className='md-numeric-preview';hint.dataset.for=input.id;hint.textContent=conv.fractional?`${conv.label} ${Number(conv.value).toFixed(4)}`:`${conv.label}: ${Number(conv.value).toFixed(4)} ${input.id==='wireDiameter'?(document.getElementById('threadSystem')?.value==='metric'?'mm':'in'):(document.getElementById('unitMetric')?.getAttribute('aria-pressed')==='true'?'mm':'in')}`;input.insertAdjacentElement('afterend',hint);}
enhanceInputs();const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)enhanceInputs(n)});observer.observe(document.body,{subtree:true,childList:true});
document.addEventListener('input',ev=>{const el=ev.target;if(el instanceof HTMLInputElement&&el.id)preview(el);});
document.addEventListener('change',ev=>{const el=ev.target;if(!(el instanceof HTMLInputElement)||el.type!=='text'||el.dataset.numericInput!=='true')return;const raw=el.value,conversion=converted(raw,el.id);const n=parse(raw,el.id);if(/[\/¼½¾⅛⅜⅝⅞⅙⅓⅔⅚⅕⅖⅗⅘]/.test(raw)&&Number.isFinite(n)){el.value=n.toFixed(4);el.dataset.lastFraction=raw;const old=el.parentElement?.querySelector(`.md-numeric-preview[data-for="${CSS.escape(el.id)}"]`);if(old)old.remove();const label=document.createElement('div');label.className='md-numeric-preview';label.dataset.for=el.id;label.textContent=raw.trim()+' → '+el.value;el.insertAdjacentElement('afterend',label);el.dispatchEvent(new Event('input',{bubbles:true}));return;}if(conversion)preview(el);},true);
window.MachiningDeskInputs={parse,fractionValue,enhanceInputs};
})();
