import {pulseAt as prefixPulse} from '../apollo-second-go/timing.js';
export {clamp,mix,smooth,goPulse,CUES,CLOSE,PREP_END,prepProgress} from '../apollo-second-go/timing.js';
export const DURATION=184;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
// Movie clock: historical radio is edited in the song. These are shot and
// physical-action beats, not a reconstructed continuous mission clock.
export const SHOTS=[
 [144,'forward','approach',true],
 [146.0181,'look','terrain',true],
 [148.4127,'rough','terrain',true,'hazard'],
 [150.16,'across','divert',true],
 [152.10,'alarm-1202','divert',false],
 [153.4777,'restart','divert',false],
 [155.08,'continue','divert',true,'low'],
 [157.3,'crew','terrain',true],
 [159.1634,'control','brake',false],
 [161.16,'drift','brake',true],
 [162.10,'alarm-1201','brake',false],
 [164.34,'protected','brake',false],
 [167.02,'committed','brake',true,'ground'],
 [168.2,'probe','contact',true],
 [169.05,'load','contact',true],
 [170.58,'shutdown','landed',true,'close'],
 [172.65,'still','landed',true,'close'],
 [175.04,'houston','landed',true,'close'],
 [178.31,'base','landed',true],
 [180.82,'landed','landed',true],
];
export const WORD_HITS=[152.10,155.08,156.30,160.40,162.10,167.02,168.20,170.58,175.04,178.31,180.82];
export function landingAt(t){
 let i=0;for(let j=0;j<SHOTS.length;j++)if(t>=SHOTS[j][0])i=j;
 const [start,name,mode,world,view]=SHOTS[i],end=SHOTS[i+1]?.[0]??DURATION;
 const age=t-start,progress=clamp(age/(end-start));
 let hit=0;for(const a of WORD_HITS){const d=t-a;if(d>=0&&d<.45)hit=Math.max(hit,Math.exp(-d*15));}
 // Ground contact follows continuous approach. Pads settle before shutdown;
 // shutdown's edited spoken report is not presented as a switch command.
 const flightProgress=clamp((t-144)/(168.2-144));
 const contactProgress=clamp((t-168.2)/1.8);
 const engineOff=smooth((t-170.58)/.52);
 const cameraProgress=t>=178.31?clamp((t-178.31)/(184-178.31)):t>=170.58?clamp((t-170.58)/(178.31-170.58)):t>=168.2?clamp((t-168.2)/(170.58-168.2)):progress;
 return {index:i,start,end,name,mode,world,view,age,progress,cameraProgress,hit,flightProgress,contactProgress,engineOff,
  landedProgress:clamp((t-170)/14),guides:!['crew','committed','probe','load','shutdown','still','houston','base','landed'].includes(name)};
}
export function pulseAt(t){if(t<144)return prefixPulse(t);let p=0;for(const a of ATTACKS){let d=t-a;if(d>=0&&d<.15)p=Math.max(p,Math.exp(-d*27));}return p;}
const ATTACKS=[144.312,144.6413,145.3197,145.6689,146.0181,146.3374,146.6866,147.0458,147.3751,147.7442,148.0635,148.4127,148.742,149.0912,149.7896,150.2984,150.6177,150.9769,151.6653,152.1841,152.5433,153.0721,153.4014,154.2594,154.5887,154.9279,155.2771,155.8059,156.1451,156.4644,156.9932,157.3125,157.6617,158.0209,158.5297,159.2082,159.737,160.0662,160.4254,160.7646,161.2735,161.6327,162.1515,162.6204,163.1692,163.5184,164.0172,164.3565,164.6957,165.2245,165.5637,165.9229,166.2621,166.761,167.1102,167.4395,167.9583,168.2975,168.6567,168.9859,169.4948,170.263,170.742,171.0712,171.3905,172.0889,172.7673,173.4558,174.1442,174.8426,175.5211,176.1995,178.2549,178.5143,178.9333,179.6218,180.9887,181.6871,182.3655,183.044,183.7324];
