import {FINALE_CUES} from './timing.js';
const W=1920,H=1080,INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d',TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p,fract=v=>v-Math.floor(v),out=v=>1-Math.pow(1-clamp(v),4);
const ROLES=['RETRO','FIDO','GUIDANCE','CONTROL','TELCOM','GNC','EECOM','SURGEON'];
export function createFinaleGraphics(){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');let fg=BONE,bg=INK,ac=LIME;
 function text(str,x,y,size=20,col=fg,weight=500,align='left',alpha=1){c.save();c.globalAlpha=alpha;c.font=`${weight} ${size}px ${size>32?'Archivo':'Consolas'},sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(str,x,y);c.restore();}
 function rect(x,y,w,h,col=fg,alpha=1){c.save();c.globalAlpha=alpha;c.fillStyle=col;c.fillRect(x,y,w,h);c.restore();}
 function path(points,col=fg,width=2,alpha=1,p=1){c.save();c.globalAlpha=alpha;c.lineWidth=width;c.strokeStyle=col;c.beginPath();c.moveTo(...points[0]);const n=clamp(p)*(points.length-1);for(let i=1;i<=Math.floor(n);i++)c.lineTo(...points[i]);if(n<points.length-1){let k=Math.floor(n);c.lineTo(mix(points[k][0],points[k+1][0],n-k),mix(points[k][1],points[k+1][1],n-k));}c.stroke();c.restore();}
 function circle(x,y,r,col=fg,width=2,alpha=1){c.save();c.globalAlpha=alpha;c.lineWidth=width;c.strokeStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.restore();}
 function dot(x,y,r=5,col=ac,alpha=1){c.save();c.globalAlpha=alpha;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
 function arrow(x,y,xx,yy,col=ac,width=3,alpha=1){path([[x,y],[xx,yy]],col,width,alpha);const a=Math.atan2(yy-y,xx-x);path([[xx-14*Math.cos(a-.5),yy-14*Math.sin(a-.5)],[xx,yy],[xx-14*Math.cos(a+.5),yy-14*Math.sin(a+.5)]],col,width,alpha);}
 function packet(ps,t,p=1,col=ac,n=6){path(ps,col,4,.8,p);for(let i=0;i<n;i++){const u=fract(t*.65+i/n)*(ps.length-1),k=Math.floor(u),f=u-k;dot(mix(ps[k][0],ps[k+1][0],f),mix(ps[k][1],ps[k+1][1],f),4,col,p);}}
 function notes(rows,x,y,a=.7){rows.forEach((str,i)=>text(str,x,y+i*26,17,fg,500,'left',a));}
 function head(a,b){text(a,77,210,75,fg,850);if(b)text(b,83,258,20,fg,550,'left',.72);}
 function footer(a,b){text(a,82,915,48,ac,800);if(b)text(b,85,953,18,fg,500,'left',.7);}
 function shade(s){const top=c.createLinearGradient(0,0,0,H);top.addColorStop(0,'rgba(8,13,18,.94)');top.addColorStop(.28,'rgba(8,13,18,.70)');top.addColorStop(.4,'rgba(8,13,18,.12)');top.addColorStop(.58,'rgba(8,13,18,0)');top.addColorStop(.73,'rgba(8,13,18,0)');top.addColorStop(.83,'rgba(8,13,18,.80)');top.addColorStop(1,'rgba(8,13,18,.96)');c.fillStyle=top;c.fillRect(0,0,W,H);if(s.name==='finale'){const low=c.createLinearGradient(0,680,0,H);low.addColorStop(0,'rgba(8,13,18,0)');low.addColorStop(.6,'rgba(8,13,18,.85)');low.addColorStop(1,'rgba(8,13,18,1)');c.fillStyle=low;c.fillRect(0,680,W,400);}}
 function frame(t,s){
  text(s.phase==='assemble'?ROLES[s.index]:'APOLLO 11 / A SHARED ARRIVAL',82,72,s.phase==='assemble'?24:18,s.phase==='assemble'?ac:fg,650);
  text(s.phase==='assemble'?'LOCAL CAPABILITY → SHARED ACTION':s.phase==='converge'?'EAGLE / COLUMBIA / EARTH':'JULY 1969',1838,72,17,fg,500,'right',.7);path([[82,100],[1838,100]],fg,1,.18);
  if(s.phase==='assemble'){for(let i=0;i<8;i++){const x=90+i*220,ready=t>=FINALE_CUES[i].hit;dot(x,1009,ready?6:3,ready?ac:fg,ready?1:.3);if(i<7)path([[x+12,1009],[x+205,1009]],ready?ac:fg,ready?3:1,ready?.9:.22);text(ROLES[i],x,1051,15,ready?ac:fg,550,'left',ready?1:.5);}}
  else {text(s.phase==='converge'?'EVERY ANSWER JOINS THE SAME MISSION.':'GO! — PUBLIC SERVICE BROADCASTING',83,1028,16,fg,500,'left',.65);}
 }
 function kick(s){if(!s.cue||s.after<0)return;const a=clamp(1-(s.after-.20)/.44);if(a===0)return;rect(W-334,129,252,123,ac,a);text('GO',W-105,236,107,bg,900,'right',a);rect(0,0,W,7,ac,a);}
 function craft(x,y,scale=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);path([[-74,-30],[25,-30],[63,0],[25,30],[-74,30],[-74,-30]],fg,2);path([[-74,-18],[-90,-9],[-113,-25],[-113,25],[-90,9],[-74,18]],fg,2);for(let i=0;i<5;i++)path([[-60+i*16,-30],[-60+i*16,30]],fg,1,.35);path([[25,-30],[25,30]],fg,2);c.restore();}
 function lander(x,y,k=1){c.save();c.translate(x,y);c.scale(k,k);path([[-34,-25],[-34,-56],[-15,-74],[21,-74],[38,-52],[38,-25],[-34,-25]],fg,2);path([[-48,-25],[48,-25],[48,28],[-48,28],[-48,-25]],fg,2);for(const side of [-1,1])path([[side*44,-8],[side*68,48],[side*96,76],[side*121,76]],fg,2);path([[-16,28],[-29,52],[29,52],[16,28]],fg,2);c.restore();}
 function retro(t,s){
  head('PREDICT A POSSIBLE FUTURE.','TRAJECTORY / INITIAL STATE / AVAILABLE OPTIONS');
  const p=s.p;dot(320,690,12,fg);text('HERE',270,747,24,fg,650);
  for(let j=0;j<7;j++){const pts=[];for(let i=0;i<=90;i++){const u=i/90;pts.push([320+u*1320,690-300*Math.sin(u*Math.PI*.69)+(j-3)*u*u*64]);}path(pts,j===3?ac:fg,j===3?6:1,j===3?1:.27,j===3?Math.max(.04,p):out(s.age/.5));if(j===3){const n=Math.floor(p*90);circle(...pts[n],19,ac,3,p);}}
  notes(['POSITION','VELOCITY','ENGINE CAPABILITY','AVAILABLE TIME'],87,348);text('OPTION',1668,405,24,ac,650,'left',p);footer('A DECISION CAN LOOK AHEAD.','TRAJECTORY OPTIONS / SURFACE STATE / ORBITAL PARTNER');
 }
 function fido(t,s){
  head('TWO STATES. ONE GEOMETRY.','POSITION / VELOCITY / RELATIVE MOTION');const p=s.p;
  const a=-1.12+s.age*.17,cx=1060,cy=570,rx=600,ry=200,ps=[];for(let i=0;i<=160;i++){const q=i/160*TAU;ps.push([cx+Math.cos(q)*rx,cy+Math.sin(q)*ry]);}path(ps,fg,2,.35);circle(cx,cy,164,fg,2,.35);
  const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry,vx=-rx*Math.sin(a),vy=ry*Math.cos(a),vlen=Math.hypot(vx,vy),dx=vx/vlen*115,dy=vy/vlen*115;craft(x,y,.55,Math.atan2(vy,vx));dot(967,675,10,fg);lander(967,637,.42);path([[967,675],[x,y]],ac,5,1,p);arrow(x,y,x+dx,y+dy,ac,3,p);text('V',x+dx+17,y+dy-10,24,ac,600);text('r',mix(x,967,.5)-30,mix(y,675,.5),32,ac,600,'left',p);
  notes(['EAGLE / FIXED SURFACE POINT','COLUMBIA / ORBITING STATE','SEPARATION + RELATIVE MOTION'],84,350);text('CSM',x-34,y-55,18,fg,650);footer('KNOW WHERE EACH PART IS.');
 }
 function guidance(t,s){
  fg=INK;bg=BONE;ac='#40620c';rect(0,0,W,H,bg);frame(t,s);head('TURN A REFERENCE INTO ACTION.','GUIDANCE / MEASURED STATE → REQUIRED CHANGE');const p=s.p,cx=980,cy=560,angle=mix(-.59,0,p);
  for(let j=0;j<3;j++){const a=angle+[-Math.PI/2,0,2.34][j],len=[228,330,230][j];arrow(cx,cy,cx+Math.cos(a)*len,cy+Math.sin(a)*len,j===0?ac:fg,j===0?5:2);text(['VERTICAL','HORIZONTAL','CROSS AXIS'][j],cx+Math.cos(a)*(len+30),cy+Math.sin(a)*(len+30)-(j===1?25:0),17,j===0?ac:fg,550,'center');}
  circle(cx,cy,158,fg,1,.25);dot(cx,cy,9,fg);const ps=[[164,565],[540,565],[540,662],[810,662]];path(ps,fg,2,.25);packet(ps,t,p,ac,4);notes(['OBSERVATION','STATE ESTIMATE','REFERENCE FRAME'],85,349);text('MEASURED',151,529,24,fg,650);text('REQUIRED',1408,529,24,fg,650);arrow(1235,564,1730,564,ac,5,p);footer('THE COORDINATES BECOME A CHOICE.');kick(s);
 }
 function control(t,s){
  head('CLOSE THE LOOP.','COMMAND / ACTUATOR / RESPONSE / MEASUREMENT');const p=s.p;
  const nodes=[[160,460,'COMMAND'],[670,460,'ACTUATOR'],[1290,460,'RESPONSE'],[670,740,'MEASUREMENT']];
  for(const [x,y,name]of nodes){text(name,x,y-42,28,fg,700);path([[x,y],[x+230,y]],fg,5,.35);}
  const lines=[[[390,460],[610,460]],[[900,460],[1230,460]],[[1518,460],[1720,460],[1720,740],[920,740]],[[670,740],[270,740],[270,485]]];lines.forEach((ps,i)=>packet(ps,t+i*.1,clamp(p*1.6-i*.2),ac,4));
  const offset=40*(1-p);for(let i=0;i<5;i++){const x=1040+i*32;path([[x,420-offset],[x,500+offset]],fg,1,.22);}
  text('REQUEST',84,349,18,fg,600);text('OBSERVED RESULT',1290,801,18,fg,600);footer('ACTION RETURNS AS INFORMATION.');
 }
 function telcom(t,s){
  head('KEEP A HABITABLE SPACE.','EAGLE / ENVIRONMENT + ELECTRICAL SUPPORT');const p=s.p;lander(1030,585,1.9);
  const rows=[['O₂','ATMOSPHERE',340],['DC','ELECTRICAL LOAD',515],['HEAT','THERMAL CONTROL',690]];
  rows.forEach(([name,label,y],i)=>{text(name,110,y+35,66,fg,800);text(label,330,y+29,21,fg,650);const ps=[[565,y+20],[745,y+20],[745,550+i*45],[900,550+i*45]];path(ps,fg,2,.2);packet(ps,t+i*.12,clamp(p*1.4-i*.15),ac,4);});
  const ps=[[1130,585],[1510,585],[1510,350],[1770,350]];packet(ps,t,p,ac,5);text('CO₂ REMOVAL',1405,680,27,fg,700);text('RETURN RESERVE',1405,727,21,fg,600);text('CABIN',974,449,21,ac,650);footer('A SMALL VOLUME. A COMPLETE ENVIRONMENT.');
 }
 function gnc(t,s){
  head('THE ORBITING PARTNER.', 'COLUMBIA / ATTITUDE + CONTROL AUTHORITY');
  notes(['MEASURE ATTITUDE','COMPARE WITH COMMAND','CONTROL THE RESPONSE'],85,342);const x=178,y=612,r=114;circle(x,y,r,fg,1,.3);const a=-.7+s.age*.13;arrow(x,y,x+Math.cos(a)*r,y+Math.sin(a)*r,ac,5,s.p);text('CSM',x,y+158,22,ac,650,'center');footer('ONE MISSION CONTINUES IN ORBIT.');
 }
 function eecom(t,s){
  head('CHEMISTRY BECOMES CAPABILITY.','COLUMBIA / FUEL CELLS');const p=s.p;
  text('2H₂',100,540,116,fg,850);text('+',382,540,85,fg,600);text('O₂',510,540,116,fg,850);arrow(735,500,1060,500,ac,7,p);text('2H₂O',1160,540,116,fg,850,'left',p);
  const branch=[[895,500],[895,735],[1740,735]];packet(branch,t,p,ac,6);text('ELECTRICITY',1090,706,31,ac,750,'left',p);text('+ HEAT',1530,706,31,fg,700,'left',p);text('WATER',1166,598,22,fg,550,'left',p);
  notes(['REACTANTS','ELECTROCHEMICAL CONVERSION','POWER / WATER / THERMAL LOAD'],85,335);footer('SUPPLY IS A PROCESS.');
 }
 function surgeon(t,s){
  head('THREE PEOPLE INSIDE THE SYSTEM.','CREW / TWO ON THE SURFACE / ONE IN ORBIT');const p=s.p,rows=[['ARMSTRONG','EAGLE',490],['ALDRIN','EAGLE',970],['COLLINS','COLUMBIA',1450]];
  rows.forEach(([name,ship,x],i)=>{circle(x,510,64,fg,3);path([[x-103,700],[x-103,645],[x-60,606],[x+60,606],[x+103,645],[x+103,700]],fg,3);text(name,x,772,30,fg,750,'center');text(ship,x,814,18,fg,550,'center');if(i<2)path([[x+100,558],[x+380,558]],ac,7,1,p);dot(x,560,10,ac,p);});
  footer('ALL THE WORK HAS SOMEONE AT ITS CENTRE.');
 }
 function anchored(a,label,dx=20,dy=-24){if(!a?.visible)return;const x=a.x*W,y=a.y*H;const tx=x+dx,ty=y+dy;if(tx<90||tx>1770||ty<300||ty>850)return;circle(x,y,11,ac,2,.9);path([[x,y],[tx,ty]],ac,1,.8);const lx=tx+(dx<0?-5:5),ly=ty-6,align=dx<0?'right':'left';c.save();c.font='650 18px Consolas,sans-serif';c.textAlign=align;c.strokeStyle=INK;c.lineWidth=5;c.lineJoin='round';c.strokeText(label,lx,ly);c.restore();text(label,lx,ly,18,fg,650,align);}
 function converge(t,s){
  const n=s.index-8;const lines=n<4?[
   ['A PATH CAN BE CALCULATED.','TRAJECTORY / CONTINUING ORBIT'],['A PLACE CAN BE KNOWN.','THE LANDED POINT / A MOVING PARTNER'],
   ['A DISTANCE CAN BE CROSSED.','VOICE + TELEMETRY / TWO DIRECTIONS'],['A WORLD CAN BE REACHED.','EAGLE / TRANQUILITY BASE']
  ][n]:n<8?[['MEASURE.','AN OBSERVATION ENTERS THE SYSTEM'],['DECIDE.','A LOCAL ANSWER JOINS THE OTHERS'],['ACT.','THE PARTS BECOME A COMMON EFFORT'],['TOGETHER.','A SHARED ARRIVAL']][n-4]:[['HERE.','EARTH / A WORLD OF SUPPORT'],['THERE.','EAGLE + COLUMBIA'],['CONNECTED.','VOICE / TELEMETRY / UNDERSTANDING'],['TOGETHER.','ONE SHARED ARRIVAL']][Math.min(3,n-8)];
  head(...lines);anchored(s.anchors?.eagle,'EAGLE',55,44);anchored(s.anchors?.csm,'COLUMBIA',55,-30);anchored(s.anchors?.earth,'EARTH',-95,-25);
  footer(n<4?'THE SAME MISSION, SEEN AT A GREATER SCALE.':'MANY ANSWERS. ONE ACTION.');
 }
 function outro(t,s){
  if(s.name==='receiver'){head('A SIGNAL IS NEVER ALONE.','ANTENNA / RECEIVER / TRACKING / COMMUNICATION');notes(['COLLECT','RECEIVE','ROUTE','UNDERSTAND'],85,354);footer('A PHYSICAL LINK TO A DISTANT CREW.');}
  else if(s.name==='network'){head('IT TAKES A WORLD.','GROUND STATIONS / CONTROL ROOM / FLIGHT CREW');footer('DISTANT PLACES BECOME ONE WORKING SYSTEM.');}
  else if(s.name==='surface'){head('TO REACH ANOTHER.','EAGLE / TRANQUILITY BASE');anchored(s.anchors?.eagle,'LANDED',65,35);anchored(s.anchors?.csm,'COLUMBIA / ORBIT',60,-40);footer('THE DISTANCE IS REAL. SO IS THE ARRIVAL.');}
  else if(s.name==='link'){head('FROM MANY HANDS.','OBSERVATION → JUDGMENT → COMMUNICATION → ACTION');anchored(s.anchors?.earth,'EARTH',-80,40);anchored(s.anchors?.eagle,'EAGLE',60,-30);footer('WORK TRAVELS FARTHER THAN ANY ONE PERSON.');}
  else if(s.name==='whole'){head('ONE SHARED ARRIVAL.','EARTH / COLUMBIA / EAGLE');anchored(s.anchors?.earth,'EARTH',-90,-35);anchored(s.anchors?.moon,'MOON',70,-30);footer('APOLLO 11 / JULY 1969');}
  else {const k=1+.055*Math.exp(-s.age*13);c.save();c.translate(74,916);c.scale(k,k);text('APOLLO 11',7,-131,38,ac,750);text('A WORLD AWAY.',0,0,129,fg,900);text('MANY HANDS. ONE SHARED ARRIVAL.',10,50,22,fg,650);c.restore();rect(0,0,W,8,ac,Math.exp(-s.age*9));}
 }
 function render(t,s){
  c.clearRect(0,0,W,H);fg=BONE;bg=INK;ac=LIME;if(s.world)shade(s);else rect(0,0,W,H,bg);frame(t,s);
  if(s.phase==='outro')outro(t,s);
  else if(s.phase==='converge')converge(t,s);
  else if(s.index===0)retro(t,s);else if(s.index===1)fido(t,s);else if(s.index===2){guidance(t,s);return;}
  else if(s.index===3)control(t,s);else if(s.index===4)telcom(t,s);else if(s.index===5)gnc(t,s);else if(s.index===6)eecom(t,s);else surgeon(t,s);
  kick(s);
 }
 return{canvas,render};
}
