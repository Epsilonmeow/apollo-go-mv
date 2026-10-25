import {pulseAt as prefixPulse} from '../apollo-landing/timing.js';
export {clamp,mix,smooth,goPulse,CUES,CLOSE,PREP_END,prepProgress} from '../apollo-landing/timing.js';
export const DURATION=214.8;
const clamp=v=>Math.max(0,Math.min(1,v)),out=v=>1-Math.pow(1-clamp(v),4);
export const STAY_CUES=[{"role":"RETRO","call":204.02,"hit":204.7515,"end":205.12},{"role":"FIDO","call":205.38,"hit":206.2024,"end":206.52},{"role":"GUIDANCE","call":206.76,"hit":207.5259,"end":207.86},{"role":"CONTROL","call":208.12,"hit":208.7136,"end":209.12},{"role":"TELCOM","call":209.5,"hit":210.2829,"end":210.66},{"role":"GNC","call":210.88,"hit":211.7506,"end":212.12},{"role":"EECOM","call":212.26,"hit":212.9871,"end":213.32},{"role":"SURGEON","call":213.58,"hit":214.3019,"end":214.6}];
export const SHOTS=[
 [184,'report','moon','landed'],
 [186.48,'chatter',false,'focus'],
 [188.65,'listen','control','focus','screen'],
 [190.90,'standby','control','rows','aisle'],
 [193.04,'room','control','room','high'],
 [195.02,'alive',false,'focus'],
 [197.25,'return',false,'focus'],
 [199.4,'choice',false,'focus'],
 [201.26,'invitation',false,'focus'],
];
export function stayAt(t){
 const done=STAY_CUES.filter(q=>t>=q.hit).length,consensus=done/8;
 if(t<STAY_CUES[0].call){let i=0;for(let j=0;j<SHOTS.length;j++)if(t>=SHOTS[j][0])i=j;
  const [start,name,world,mode,view]=SHOTS[i],end=SHOTS[i+1]?.[0]??STAY_CUES[0].call;
  return{name,world,mode,view,age:t-start,start,end,progress:clamp((t-start)/(end-start)),cameraProgress:1,consensus:0,hit:0};
 }
 let index=0;for(let i=0;i<STAY_CUES.length;i++)if(t>=STAY_CUES[i].call)index=i;
 const cue=STAY_CUES[index],end=STAY_CUES[index+1]?.call??DURATION,age=t-cue.call,after=t-cue.hit;
 const world=index===2?'moon':index>=6?'control':false;
 return {name:cue.role.toLowerCase(),cue,index,activeIndex:index,world,mode:index===7?'release':'focus',view:index===2?'close':'screen',cameraProgress:.24+.14*clamp(age/(end-cue.call)),
  start:cue.call,end,age,after,progress:clamp(age/(end-cue.call)),p:out(after/.27),consensus,hit:after<0?0:Math.exp(-after*15)};
}
export function pulseAt(t){if(t<184)return prefixPulse(t);let p=0;for(const a of ATTACKS){const d=t-a;if(d>=0&&d<.16)p=Math.max(p,Math.exp(-d*26));}return p;}
const ATTACKS=[184.4209,185.0993,185.7878,186.4862,187.8531,188.5315,189.2299,189.9084,190.5868,190.9261,191.2753,191.9737,192.293,192.6522,193.0014,193.3306,194.0091,194.6975,195.0567,195.3959,195.7451,196.0644,196.4036,196.7628,197.4512,197.9601,198.2993,198.8181,199.1673,199.5066,200.195,200.5442,200.8834,201.2227,201.5619,201.9111,202.2603,202.9288,203.4476,203.7868,204.2957,204.6349,204.9741,205.6825,206.0118,206.361,206.7002,207.0494,207.3986,207.7478,208.4263,208.9351,209.2744,209.7932,210.1424,210.4816,211.1701,211.4993,211.8485,212.1778,212.527,212.8862,213.2254,213.5646,213.8839,214.5723];
