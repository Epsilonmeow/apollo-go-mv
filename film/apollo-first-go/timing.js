import {ATTACKS as PREFIX_ATTACKS,clamp,mix,smooth} from '../apollo-go/timing.js';
export {clamp,mix,smooth};
export const DURATION=88;
export const PREP_START=46,PREP_END=67.5066;
export const PREP_CUTS=[46,47.961,50.0063,52.4209,54.8154,56.8707,58.9361,61.6798,64.4136,66.2993,67.5066];
export function prepProgress(t){const phases=[0,.09,.19,.29,.39,.49,.59,.72,.84,.93,1];for(let i=0;i<10;i++)if(t<PREP_CUTS[i+1])return mix(phases[i],phases[i+1],clamp((t-PREP_CUTS[i])/(PREP_CUTS[i+1]-PREP_CUTS[i])));return 1;}
// Speech cue provenance and listener status: audio-cues.json. Never quantized to musical beats.
export const CUES=[{"role":"RETRO","call":72.38,"go":72.8792,"end":73.64},{"role":"FIDO","call":73.64,"go":74.163,"end":75.04},{"role":"GUIDANCE","call":75.04,"go":75.8404,"end":76.4},{"role":"CONTROL","call":76.4,"go":77.0443,"end":77.79},{"role":"TELMU","call":77.79,"go":78.4611,"end":79.22},{"role":"GNC","call":79.22,"go":79.9095,"end":80.6},{"role":"EECOM","call":80.6,"go":81.2397,"end":82.14},{"role":"SURGEON","call":82.14,"go":82.6011,"end":83.62}];
export const CLOSE={"call":84.94,"go":85.6853,"end":86.94};
export const ATTACKS=[...PREFIX_ATTACKS,...[46.5841,46.9333,47.2726,47.6118,47.961,48.3002,48.6494,49.3379,49.6771,50.0063,50.3655,50.7147,51.054,51.3932,52.0717,52.4209,52.7601,53.0993,53.4485,53.7977,54.127,54.8154,55.1546,55.5138,56.1923,56.5215,56.8707,57.5592,57.8984,58.2476,58.5968,58.9361,59.2952,59.6145,60.3029,60.6322,60.9914,61.3206,61.6798,62.3683,63.0467,63.7351,64.0844,64.4136,64.7728,65.102,65.7805,66.2993,66.6385,67.1574,67.5066,67.8458,68.5342,69.2227,69.9011,70.2503,70.5796,71.268,71.6272,71.9664,72.3156,72.6449,72.9841,73.3333,74.0118,74.351,74.7002,75.0395,75.3787,75.7279,76.0671,76.7655,77.1048,77.454,77.7932,78.1324,78.4717,78.8209,79.5093,79.8385,80.1778,80.527,80.8662,81.2054,81.5646,82.2531,82.5923,82.9315,83.2807,83.62,84.2984,84.9868,85.4857,85.8449,86.3637,87.0322,87.7306]];
export function pulseAt(t){let p=0;for(const a of ATTACKS){const d=t-a;if(d>=0&&d<.16)p=Math.max(p,Math.exp(-d*26));}return p;}
export function goPulse(t){let p=0;for(const a of [...CUES.map(c=>c.go),CLOSE.go]){const d=t-a;if(d>=0&&d<.3)p=Math.max(p,Math.exp(-d*21));}return p;}
