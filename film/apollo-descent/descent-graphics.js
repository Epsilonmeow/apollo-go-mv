// Transparent graphics for the authored 88–111.8 s descent continuation.
// Every pose is a pure function of song time; anchors are normalized camera projections.
import {drawEngineering} from './engineering-graphics.js';
const W=1920,H=1080,TAU=Math.PI*2;
const INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d',DIM='#a4afb0';
const CUTS=[88,90.4644,92.5197,94.5950,96.6503,98.6957,100.7610,102.8063,104.8916,106.9370,108.9823,111.0476,111.8];
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-Math.pow(1-clamp(x),3),frac=x=>x-Math.floor(x);

export function createDescentGraphics(){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d');
 let t=88,q=0,stage=0,detail={};
 function txt(s,x,y,size=18,col=BONE,weight=500,alpha=1,align='left'){
  c.save();c.globalAlpha*=alpha;c.textAlign=align;c.font=`${weight} ${size}px ${size>=27?'Archivo, sans-serif':'Consolas, monospace'}`;
  c.lineJoin='round';c.strokeStyle=INK;c.lineWidth=size>34?6:3;c.strokeText(s,x,y);c.fillStyle=col;c.fillText(s,x,y);c.restore();
 }
 function line(x,y,u,v,col=DIM,width=1,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();c.restore();}
 function path(ps,col=LIME,width=2,amount=1,alpha=1){
  const lengths=ps.slice(1).map((p,i)=>Math.hypot(p[0]-ps[i][0],p[1]-ps[i][1]));
  let remain=lengths.reduce((a,b)=>a+b,0)*clamp(amount);c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...ps[0]);
  for(let i=1;i<ps.length&&remain>0;i++){const r=Math.min(1,remain/(lengths[i-1]||1));c.lineTo(mix(ps[i-1][0],ps[i][0],r),mix(ps[i-1][1],ps[i][1],r));remain-=lengths[i-1];}c.stroke();c.restore();
 }
 function dot(x,y,r=4,col=LIME,alpha=1){c.save();c.globalAlpha*=alpha;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
 function arc(x,y,r,a,b,col=DIM,width=1,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.arc(x,y,r,a,b);c.stroke();c.restore();}
 function arrow(x,y,u,v,col=LIME,width=2,head=12,amount=1){
  const ex=mix(x,u,clamp(amount)),ey=mix(y,v,clamp(amount));line(x,y,ex,ey,col,width);const a=Math.atan2(v-y,u-x);line(ex,ey,ex-head*Math.cos(a-.43),ey-head*Math.sin(a-.43),col,width);line(ex,ey,ex-head*Math.cos(a+.43),ey-head*Math.sin(a+.43),col,width);
 }
 function anchor(name,fallback){const a=detail.anchors?.[name];return a&&a.visible!==false&&Number.isFinite(a.x)&&Number.isFinite(a.y)?[a.x*W,a.y*H]:fallback;}
 function brackets(x,y,w,h,col=LIME,amount=1){const d=14*clamp(amount);for(const [xx,yy,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){line(xx,yy,xx+sx*d,yy,col,2);line(xx,yy,xx,yy+sy*d,col,2);}}
 function notes(rows,x,y,col=DIM,step=27,alpha=1){rows.forEach((s,i)=>txt(s,x,y+step*i,16,i===0?BONE:col,500,alpha));}
 function flow(ps,phase,col=LIME,size=4){const n=clamp(phase)*(ps.length-1),i=Math.min(ps.length-2,Math.floor(n)),r=n-i;dot(mix(ps[i][0],ps[i+1][0],r),mix(ps[i][1],ps[i+1][1],r),size,col);}
 function localEntrance(start,width=.25){return out((t-start)/width);}
 function edgeRule(x,y,w=340,col=DIM){line(x,y,x+w,y,col,1,.45);for(let i=0;i<9;i++)line(x+i*w/8,y,x+i*w/8,y+(i%4?4:9),col,1,.5);}

 function framing(){
  const quiet=stage>=5&&stage<=8;
  txt('EAGLE / LUNAR MODULE',76,62,17,BONE,600,quiet?.62:.85);
  txt(stage>=10?'SPACECRAFT → GROUND':'POWERED DESCENT',1844,62,17,stage>=10?LIME:DIM,500,quiet?.58:.85,'right');
  const terms=['ACT','DIRECT','FLY','OBSERVE','RETURN'],active=stage<2?0:stage<4?1:stage<9?2:stage<10?3:4;
  terms.forEach((s,i)=>{const x=78+i*116;txt(s,x,1034,13,i===active?LIME:DIM,500,i>active?.25:.66);if(i<4)line(x+62,1029,x+95,1029,i<active?LIME:DIM,1,.35);});
  // This is an authored section progression, deliberately without numerical telemetry.
  const x=1446,y=1031;for(let i=0;i<12;i++)line(x+i*34,y,x+i*34+21,y,i<=stage?LIME:DIM,i===stage?3:1,i<=stage?.7:.22);
 }

 function execute(){
  const p=out(q*1.7),craft=anchor('spacecraft',[1190,530]);
  // The eight approvals collapse into one instruction path; the previous panel is gone in 0.45 s.
  if(t<88.45){const z=smooth((t-88)/.45);c.save();c.globalAlpha=1-z;for(let i=0;i<8;i++){const x=mix(90+i*225,82,z),y=mix(988,824,z);line(x,y,x+160*(1-z),y,LIME,2);dot(x,y-14*(1-z),3,LIME);}c.restore();}
  const a=localEntrance(88.05);c.save();c.translate(-35*(1-a),0);txt('POWERED',76,202,75,BONE,850,a);txt('DESCENT.',76,287,75,LIME,850,a);c.restore();
  const command=[[82,525],[420,525],[520,440],[Math.max(600,craft[0]-90),craft[1]]];
  txt('PERMISSION',82,465,18,DIM);txt('EXECUTION',334,465,18,LIME,650);
  arrow(231,459,312,459,LIME,2,9,out(q*4));path(command,LIME,3,p,.7);flow(command,clamp((q-.15)*1.6),LIME,6);
  if(q>.25)brackets(craft[0]-25,craft[1]-25,50,50,LIME,out((q-.25)*4));
  const rows=['GUIDANCE COMMAND','CONTROL RESPONSE','ENGINE / VEHICLE MOTION'];rows.forEach((s,i)=>{const k=out((q-i*.17)*5);txt(s,82,664+i*42,22,i===2?LIME:BONE,600,k);line(62,650+i*42,62,674+i*42,LIME,2,k);});
  notes(['ONE VEHICLE / ONE CONTINUOUS BURN','THROTTLE / GIMBAL / ATTITUDE'],82,876,DIM,27,localEntrance(89.1));
 }

 function engine(){
  const thrust=anchor('thrust',[1190,760]),p=out(q*2.2);
  txt('GOOD START.',76,193,68,BONE,850,localEntrance(CUTS[1]));
  txt('KEEP IT GOING.',80,242,28,LIME,700,localEntrance(91.05));
  const feeds=[['FUEL',82,425,BONE],['OXIDIZER',82,533,ORANGE]];
  feeds.forEach(([s,x,y,col],i)=>{txt(s,x,y-22,18,col,650);const ps=[[x,y],[292,y],[362,480]];path(ps,col,2,out((q-i*.12)*3),.9);for(let k=0;k<3;k++)flow(ps,frac(q*1.4+k/3),col,3);});
  brackets(349,455,36,50,LIME,p);txt('CHAMBER',410,453,19,BONE);txt('MASS FLOW → THRUST',82,645,27,LIME,650,p);
  const route=[[377,480],[490,480],[600,610],[thrust[0]-45,thrust[1]]];path(route,LIME,2,p,.6);flow(route,p,LIME,5);
  notes(['DESCENT PROPULSION SYSTEM','PRESSURIZATION / FEED / COMBUSTION','GIMBAL / THROTTLE'],82,845,DIM,28,p);
 }

 function attitude(){
  const p=out(q*2),x=150,y=550,r=116,angle=mix(-.48,-.05,smooth(q));
  txt('STEADY.',76,193,77,BONE,850,localEntrance(CUTS[2]));
  txt('DIRECT THE FORCE.',80,245,27,LIME,700,p);
  // The error arc narrows while the command vector becomes a held direction.
  arc(x,y,r,-Math.PI/2-.48,-Math.PI/2-.05,DIM,1,.5);
  const a0=-Math.PI/2+angle;arc(x,y,r,a0,-Math.PI/2-.05,LIME,4,.8);
  arrow(x,y,x+Math.sin(angle)*154,y-Math.cos(angle)*154,LIME,3,13);
  line(x,y,x+126,y,BONE,1,.6);line(x,y,x,y+85,BONE,1,.6);
  txt('BODY AXES',83,702,17,DIM);txt('THRUST DIRECTION',83,734,19,LIME);
  txt('COMMAND → RESPONSE',83,830,22,BONE,600);notes(['ATTITUDE / ANGULAR RATE','CONTROL TORQUE','THRUST VECTOR ≠ VELOCITY'],83,879,DIM,27,p);
  const force=anchor('thrust',[1120,660]);const ps=[[390,733],[510,733],[force[0]-55,force[1]]];path(ps,LIME,1,p,.45);dot(force[0]-55,force[1],4,LIME,p);
 }

 function consequence(){
  const p=out(q*2),x=80,y=380;
  txt('FORCE.',76,192,73,BONE,850,localEntrance(CUTS[3]));
  txt('BECOMES CHANGE.',80,247,32,LIME,750,p);
  // Each term moves into the next relationship, rather than acting as a fixed equation slide.
  const terms=[['Fₜ / m',x,y],['aₜ',x+258,y+108],['Δv',x+80,y+244]];
  terms.forEach(([s,xx,yy],i)=>{const a=out((q-i*.16)*4);txt(s,xx,yy,58,i===2?LIME:BONE,750,a);});
  path([[246,362],[340,362],[340,424]],LIME,3,clamp((q-.05)*3));
  path([[335,503],[335,562],[217,562]],LIME,3,clamp((q-.27)*3));
  const vel=anchor('velocity',[1210,420]);const ps=[[228,607],[520,607],[680,475],[vel[0],vel[1]]];path(ps,LIME,3,clamp((q-.46)*2.5),.7);flow(ps,clamp((q-.46)*2.5),LIME,6);
  txt('THRUST CONTRIBUTION',82,748,17,DIM);txt('dv/dt = g + Fₜ/m',82,801,29,BONE,600,p);txt('dr/dt = v',82,844,29,LIME,600,p);
  notes(['ACCELERATION CHANGES VELOCITY','VELOCITY CHANGES POSITION'],82,925,DIM,27,p);
 }

 function leaveDiagram(){
  const p=smooth(q),vel=anchor('velocity',[1280,400]);
  // The final term exits its former typesetting position and joins the projected flight path.
  const x=mix(160,vel[0],p),y=mix(500,vel[1],p);
  c.save();c.globalAlpha=1-p*.9;txt('Δv',x,y,mix(60,25,p),LIME,750);c.restore();
  txt('A DIFFERENT',80,188,46,BONE,800,1-smooth((q-.65)/.35));txt('PATH.',80,248,66,LIME,850,1-smooth((q-.65)/.35));
  const ps=[[80,570],[280,570],[480,500],[650,405],[vel[0],vel[1]]];path(ps,LIME,2,1,.55*(1-p));
  txt('POSITION r',82,873,20,BONE,600);txt('VELOCITY v',82,904,20,LIME,600);txt('GRAVITY CURVES THE FLIGHT',82,957,17,DIM);
  txt('LUNAR REFERENCE / VEHICLE STATE',1840,924,16,DIM,500,.8,'right');
 }

 function world(){
  // The first lunar reveal is intentionally mostly unoccupied space.
  const p=out(q*2);txt('LUNAR REFERENCE',80,145,20,BONE,650,p);edgeRule(80,169,270,DIM);
  txt('r  POSITION',80,212,17,DIM);txt('v  VELOCITY',80,243,17,LIME);
  txt('MOTION HAS A FRAME.',1840,932,25,BONE,700,p,'right');
  txt('SPACECRAFT / MOON',1840,969,16,DIM,500,p,'right');
 }

 function velocity(){
  const x=145,y=827,p=out(q*2);txt('VELOCITY / COMPONENTS',80,699,17,BONE,600,p);
  arrow(x,y,x+248,y,LIME,2,10,p);arrow(x,y,x,y+119,ORANGE,2,10,p);
  const dx=205,dy=mix(37,83,smooth(q));arrow(x,y,x+dx,y+dy,BONE,3,11,p);
  c.save();c.setLineDash([4,8]);line(x+dx,y,x+dx,y+dy,DIM,1,.5);line(x,y+dy,x+dx,y+dy,DIM,1,.5);c.restore();
  txt('ALONG TRACK',186,797,16,LIME,500,p);txt('TOWARD SURFACE',179,971,16,ORANGE,500,p);
  txt('ONE VECTOR / TWO COMPONENTS',80,743,16,DIM,500,p);
  txt('LUNAR SURFACE FRAME',1840,952,16,DIM,500,.72,'right');
 }

 function overTerrain(){
  // No screen-filling grid: a compact state trace creates the next prediction while terrain flies past.
  const x=1430,y=175,p=out(q*2);txt('STATE → PREDICTION',1840,135,20,BONE,650,p,'right');
  const ps=[[x,y],[x+170,y],[x+280,y+62],[x+410,y+70]];path(ps,LIME,2,p,.75);flow(ps,p,LIME,4);
  txt('r , v',x,221,21,LIME,650);txt('PROPAGATE',x+230,285,15,DIM);
  notes(['GRAVITY / THRUST','POSITION / DIRECTION / SPEED'],82,922,DIM,27,.8);
  txt('THE SURFACE MOVES THROUGH THE FRAME.',1840,969,17,DIM,500,.8,'right');
 }

 function observe(){
  const p=out(q*2),a=anchor('surface',[1340,785]);
  txt('MOTION → OBSERVATION',82,167,28,BONE,700,p);
  const ps=[[82,236],[420,236],[570,310],[a[0],a[1]]];path(ps,DIM,1,p,.4);
  // An open pair of brackets denotes an observation region, not a lock/landing target.
  brackets(a[0]-38,a[1]-20,76,40,DIM,p);
  txt('TERRAIN IN THE VIEW',82,215,16,DIM,500,p);
  notes(['RELATIVE MOTION','INSTRUMENT MEASUREMENT','STATE ESTIMATE'],82,851,DIM,31,p);
  for(let i=0;i<3;i++){const y=840+i*31;line(62,y,62,y+15,i<q*4?LIME:DIM,2,.8);}
  txt('OBSERVE → ESTIMATE',1840,967,17,LIME,500,p,'right');
 }

 function radar(){
  const p=out(q*2),a=anchor('radar',[1120,690]),surface=anchor('surface',[1290,840]);
  txt('LANDING RADAR',82,170,38,BONE,800,p);txt('MEASUREMENT DURING DESCENT',83,209,16,DIM,500,p);
  const rows=[['RANGE','GEOMETRY'],['DOPPLER','VELOCITY COMPONENTS']];
  rows.forEach((row,i)=>{const y=365+i*156,k=out((q-i*.2)*3);txt(row[0],82,y,29,LIME,750,k);arrow(82,y+27,374,y+27,LIME,2,10,k);txt(row[1],82,y+75,17,BONE,600,k);});
  const ps=[[430,444],[560,444],[a[0],a[1]]];path(ps,DIM,1,p,.48);dot(a[0],a[1],4,LIME,p);
  // Four beam identities remain diagrammatic; no numerical readings or acquisition confirmation.
  const names=['RANGE BEAM','VELOCITY BEAMS'];notes(names,82,814,DIM,28,p);
  txt('MEASURE → UPDATE STATE',82,927,25,LIME,700,out((q-.4)*3));
  if(q>.48){const r=out((q-.48)*3);path([[surface[0],surface[1]],[580,880],[440,927]],LIME,1,r,.5);flow([[surface[0],surface[1]],[580,880],[440,927]],r,LIME,4);}
 }

 function downlink(){
  const p=out(q*1.5),from=anchor('downlink',anchor('spacecraft',[1230,520]));
  txt('MAKE THE STATE',80,180,48,BONE,800,p);txt('TRAVEL.',80,241,68,LIME,850,p);
  const target=[240,435],ps=[from,[from[0]-.15*W,from[1]-100],[620,435],target];
  path(ps,DIM,1,1,.42);path(ps,LIME,3,p,.85);
  for(let k=0;k<3;k++){const f=clamp((q-.13*k)*1.8);if(f>0)flow(ps,f,k===1?BONE:LIME,5);}
  const labels=['VEHICLE STATE','GUIDANCE STATE','SYSTEM STATUS'];
  labels.forEach((s,i)=>{const r=out((q-i*.14)*4),y=569+i*61;txt(s,82,y,21,i===1?LIME:BONE,650,r);line(82,y+14,410,y+14,DIM,1,.4*r);const boxX=mix(440,530,out(q));brackets(boxX,y-21,64,31,i===1?LIME:DIM,r);for(let k=0;k<5;k++)line(boxX+10+k*9,y-13,boxX+10+k*9,y+2,i===1?LIME:BONE,k%2?1:2,.7*r);});
  txt('TELEMETRY / S-BAND DOWNLINK',82,827,18,DIM);txt('SPACECRAFT → GROUND → PEOPLE',82,933,25,LIME,700,out((q-.35)*3));
  arc(target[0],target[1],26,-2.7,-.45,LIME,2,p);dot(target[0],target[1],4,LIME,p);
 }

 function receiving(){
  const p=out(q*1.5),y=430;
  txt('BACK TO',80,180,53,BONE,800);txt('THE ROOM.',80,248,68,LIME,850);
  txt('RECEIVE / INTERPRET / ASSESS',82,316,18,DIM);
  path([[1780,y],[1080,y],[740,y],[330,y]],LIME,2,p,.75);flow([[1780,y],[1080,y],[740,y],[330,y]],p,LIME,6);
  brackets(82,391,216,78,LIME,p);txt('FLIGHT',103,441,32,BONE,750);
  // Stop at a receiving lead. The next spoken poll belongs to the following segment.
  line(82,650,595,650,DIM,1,.4);txt('NEW STATE.',82,725,40,BONE,800);txt('NEW JUDGMENT.',82,779,40,LIME,800,smooth(q));
  txt('MISSION CONTROL / VOICE LOOP',82,932,17,DIM);dot(610,650,5,LIME,.5+.5*Math.sin(q*Math.PI));
 }

 function render(time,opts={}){
  t=Number.isFinite(time)?time:88;detail=opts;c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,W,H);
  if(t<88||t>111.8)return {stage:-1,progress:0};
  stage=Math.min(CUTS.length-2,Math.max(0,CUTS.findIndex((v,i)=>i<CUTS.length-1&&t>=v&&t<CUTS[i+1])));
  if(t===111.8)stage=11;q=clamp((t-CUTS[stage])/(CUTS[stage+1]-CUTS[stage]));
  drawEngineering(c,t,detail);
  framing();[execute,engine,attitude,consequence,leaveDiagram,world,velocity,overTerrain,observe,radar,downlink,receiving][stage]();
  // A short directional edge impulse belongs to the cut, rather than flashing the whole frame.
  const hit=Math.max(Math.exp(-(t-CUTS[stage])*22),clamp(opts.pulse||0)*.45);
  if(hit>.01)line(stage%2?1845:75,89,stage%2?1845:75,89+94*hit,LIME,3,hit*.65);
  return {stage,progress:q,cut:CUTS[stage]};
 }
 return {canvas,render,dispose(){canvas.width=0;canvas.height=0;}};
}
