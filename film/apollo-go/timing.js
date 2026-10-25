// Source 00:00–00:46 of the user's local Go! file; no rearranged music.
export const DURATION = 46;
export const CUTS = [0, 2, 3.865, 5.73, 7.595, 9.46, 11.325, 13.19, 15.055, 16.922, 20.1841, 23.6063, 27.3778, 31.8476, 34.6014, 37.6644, 40.4082, 43.1519];
// Measured positive spectral-flux peaks, not claimed to be verified downbeats.
export const ATTACKS = [17.1011,17.4404,17.7796,18.1288,18.458,19.1465,19.4857,19.8349,20.1841,20.5234,20.8626,21.2018,21.8902,22.2395,22.5787,22.9279,23.2671,23.6063,23.9456,24.634,24.9932,25.3324,26.0209,26.3501,26.6893,27.3778,27.727,28.0662,28.4154,28.7546,29.1138,29.4431,30.1215,30.4608,30.81,31.4984,31.8476,32.1868,32.8753,33.5537,34.2422,34.6014,34.9306,35.619,35.9583,36.3075,36.8163,37.6644,38.3429,38.702,39.0413,39.3805,39.7297,40.4082,41.0966,41.4458,41.795,42.4834,43.1519,43.8404,44.1796,44.5388,44.878,45.2172,45.8957];
export const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix = (a,b,t)=>a+(b-a)*t;
export const smooth = x=>{x=clamp(x);return x*x*(3-2*x);};
export function pulseAt(t){let p=0;for(const a of ATTACKS){const d=t-a;if(d>=0&&d<.16)p=Math.max(p,Math.exp(-d*26));}return p;}
