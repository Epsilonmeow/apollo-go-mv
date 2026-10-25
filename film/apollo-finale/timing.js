import {pulseAt as previousPulse} from '../apollo-stay/timing.js';
export {clamp,mix,smooth,goPulse,CUES,CLOSE,PREP_END,prepProgress} from '../apollo-stay/timing.js';
export const DURATION=252.720544217687;
export const VIDEO_DURATION=15164/60;
const clamp=v=>Math.max(0,Math.min(1,v));
const out=v=>1-Math.pow(1-clamp(v),4);
// Original-song cue candidates with independent waveform matches; see audio-cues.json for uncertainty.
export const FINALE_CUES=[{"role":"RETRO","call":215.0354,"hit":215.5155,"end":215.8755,"has_role_call":true},{"role":"FIDO","call":216.387,"hit":216.979,"end":217.339,"has_role_call":true},{"role":"GUIDANCE","call":217.767,"hit":218.4748,"end":218.8348,"has_role_call":true},{"role":"CONTROL","call":219.067,"hit":219.6871,"end":220.0471,"has_role_call":true},{"role":"TELCOM","call":220.447,"hit":221.0369,"end":221.3969,"has_role_call":true},{"role":"GNC","call":221.8519,"hit":222.3798,"end":222.7398,"has_role_call":true},{"role":"EECOM","call":223.2196,"hit":223.827,"end":224.187,"has_role_call":true},{"role":"SURGEON","call":224.5871,"hit":225.2609,"end":225.6209,"has_role_call":true},{"role":"RETRO","call":225.9497,"hit":226.6144,"end":226.9744,"has_role_call":true},{"role":"FIDO","call":227.2586,"hit":227.9189,"end":228.2789,"has_role_call":true},{"role":"GUIDANCE","call":228.6861,"hit":229.4051,"end":229.7651,"has_role_call":true},{"role":"CONTROL","call":230.0715,"hit":230.7335,"end":231.0935,"has_role_call":true},{"role":"RETRO","call":231.5051,"hit":231.9536,"end":232.3136,"has_role_call":true},{"role":"FIDO","call":232.8451,"hit":233.4374,"end":233.7974,"has_role_call":true},{"role":"GUIDANCE","call":234.2251,"hit":234.5905,"end":234.8245,"has_role_call":true},{"role":"CONTROL","call":234.8395,"hit":235.1351,"end":235.4055,"has_role_call":true},{"role":"GO","call":235.4205,"hit":235.4205,"end":235.7005,"has_role_call":false},{"role":"GO","call":235.8161,"hit":235.8161,"end":236.0961,"has_role_call":false},{"role":"GO","call":236.2088,"hit":236.2088,"end":236.4888,"has_role_call":false},{"role":"GO","call":236.6259,"hit":236.6259,"end":236.9659,"has_role_call":false}];
export const OUTRO_SHOTS=[
 [237.12,'receiver','ground','receiver'],[239.3,'network','ground','network'],
 [241.48,'surface','orbit','surface'],[243.6,'link','link'],[245.67,'whole','whole'],
 [247.6671,'finale','finale']
];
export function finaleAt(t){
 let hit=0;for(const q of FINALE_CUES){const d=t-q.hit;if(d>=0&&d<.45)hit=Math.max(hit,Math.exp(-d*16));}
 if(t>=OUTRO_SHOTS[0][0]){let i=0;for(let j=0;j<OUTRO_SHOTS.length;j++)if(t>=OUTRO_SHOTS[j][0])i=j;
  const [start,name,mode,view]=OUTRO_SHOTS[i],end=OUTRO_SHOTS[i+1]?.[0]??DURATION;
  return{name,world:true,mode,view,start,end,age:t-start,progress:clamp((t-start)/(end-start)),consensus:1,hit:name==='finale'?Math.exp(-(t-start)*13):hit,index:-1,phase:'outro'};
 }
 let i=0;for(let j=0;j<FINALE_CUES.length;j++)if(t>=FINALE_CUES[j].call)i=j;
 const cue=FINALE_CUES[i],after=t-cue.hit,end=FINALE_CUES[i+1]?.call??OUTRO_SHOTS[0][0];
 const mode=i<8?(i===5?'orbit':null):i<12?['orbit','orbit','link','orbit'][i-8]:['ground','orbit','link','whole'][(i-12)%4];
 const view=i===5?'craft':i===9||i===11?'surface':i===12?'receiver':undefined;
 return{name:i<8?cue.role.toLowerCase():'converge-'+(i-8),cue,index:i,phase:i<8?'assemble':'converge',world:!!mode,mode,view,after,
  start:cue.call,end,age:t-cue.call,progress:clamp((t-cue.call)/(end-cue.call)),p:out(after/.26),consensus:Math.min(1,FINALE_CUES.filter(q=>q.hit<=t).length/8),hit};
}
const ATTACKS=[214.9315,215.61,215.9592,216.6376,216.9868,217.3261,218.0145,218.3637,218.7029,219.551,219.9002,220.2395,221.0875,221.4467,222.1351,222.4844,222.8136,223.1528,223.512,223.8512,224.1905,224.5397,225.0485,225.5474,225.8966,226.2259,226.5651,226.9342,227.6027,228.2912,228.6404,228.9896,229.3188,229.678,230.3664,230.8653,231.2145,232.0526,232.4118,233.0902,233.4395,233.7887,234.1079,234.4771,234.8163,235.1755,235.844,236.1832,236.5224,236.9016,237.2109,237.5701,237.8993,238.5878,239.2662,239.6154,239.9546,240.3138,240.6431,241.3315,241.8503,242.1796,242.7084,243.0476,243.3868,244.0753,244.4245,244.7537,245.093,245.4422,245.7814,246.1206,246.8091,247.3179,247.6671];
export function pulseAt(t){if(t<214.8)return previousPulse(t);let p=0;for(const a of ATTACKS){const d=t-a;if(d>=0&&d<.16)p=Math.max(p,Math.exp(-d*26));}return p;}
