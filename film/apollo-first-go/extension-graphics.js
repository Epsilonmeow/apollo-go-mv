import {clamp,smooth,mix,CUES,CLOSE,PREP_END,DURATION} from './timing.js';
const INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',DIM='#97a6ac',ORANGE='#f86b3d';
const phases=[
 [0,.09,'TWO VEHICLES.','ONE FLIGHT.',['EAGLE / LUNAR MODULE','COLUMBIA / COMMAND + SERVICE MODULE','INDEPENDENT SYSTEMS / SHARED MISSION']],
 [.09,.19,'KEEP THE','LINK.',['TRACKING ANTENNA','POINTING → RECEIVED SIGNAL','S-BAND / VOICE / RANGING']],
 [.19,.29,'A WORLD','INSIDE.',['PRESSURE BOUNDARY','HATCH / SEAL / CABIN','CREW DEPENDS ON THE ENCLOSURE']],
 [.29,.39,'DIRECT','THE FORCE.',['COMMAND → ACTUATOR → GIMBAL','THRUST VECTOR ≠ VELOCITY VECTOR','TORQUE / ATTITUDE / TRAJECTORY']],
 [.39,.49,'TURN.','THEN HOLD.',['REACTION CONTROL','OPPOSED JETS / MOMENT ARM','ANGULAR RATE → ATTITUDE']],
 [.49,.59,'AGREE ON','DIRECTION.',['BODY FRAME / INERTIAL FRAME','ATTITUDE ERROR → CONTROL ACTION','REFERENCE → COMMAND → RESPONSE']],
 [.59,.72,'DIFFERENT','DESTINATIONS.',['EAGLE → DESCENT','COLUMBIA → LUNAR ORBIT','TWO VEHICLES / ONE RETURN']],
 [.72,.84,'MAKE ROOM','FOR THE MOON.',['APPROACH GEOMETRY','STATE VECTOR / [r, v]','A SMALL CRAFT / A LARGE WORLD']],
 [.84,.93,'SEND BACK','WHAT WE KNOW.',['MEASUREMENT → TELEMETRY','SPACECRAFT → GROUND','OBSERVE / ESTIMATE / ASSESS']],
 [.93,1.001,'READY TO','ASK.',['VEHICLE STATUS / CREW STATUS','FLIGHT DIRECTOR LOOP','THE DECISION BELONGS TO PEOPLE']]
];
export function createExtensionGraphics(){
 const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const c=canvas.getContext('2d');
 function text(s,x,y,size=20,col=BONE,weight=600,outline=false){c.fillStyle=col;c.font=`${weight} ${size}px ${size<30?'monospace':'Archivo'}`;if(outline){c.strokeStyle=INK;c.lineWidth=3;c.lineJoin='round';c.strokeText(s,x,y);}c.fillText(s,x,y);}
 function path(ps,col=DIM,width=1,alpha=1){c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=width;c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();c.globalAlpha=1;}
 function dot(x,y,r=5,col=LIME){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 function circle(x,y,r,col=DIM,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();}
 function cross(x,y,col=LIME){path([[x-10,y],[x+10,y]],col);path([[x,y-10],[x,y+10]],col);}
 function prep(t,u,opts){
  const i=phases.findIndex(p=>u>=p[0]&&u<p[1]),ph=phases[Math.max(0,i)],q=clamp((u-ph[0])/(ph[1]-ph[0]));
  const x=i===1||i===3?1070:76;const y=i===7?744:190;
  const pop=Math.exp(-q*32);c.save();c.translate(x,y);c.scale(1+pop*.025,1+pop*.025);text(ph[2],0,0,i===7?78:84,BONE,850);text(ph[3],0,95,i===7?78:84,BONE,850);c.restore();
  ph[4].forEach((s,k)=>text(s,80,910+k*29,18,k===1?LIME:BONE,500,true));
  text('APOLLO 11',80,64,18,DIM);text('PREPARING FOR DESCENT',1390,64,18,DIM);
  // Small relational marks move with the current physical question; no invented telemetry.
  if(i===3){path([[1110,530],[1380,530],[1380,650]],LIME,2);cross(1380,650);text('CONTROL COMMAND',1120,507,17,LIME);text('GIMBAL RESPONSE',1410,656,17,DIM);dot(mix(1110,1380,(q*2)%1),530);}
  if(i===4){text('τ = r × F',1330,880,35,LIME);path([[1340,760],[1510,760],[1510,830]],DIM,1,.8);text('MOMENT → ROTATION',1340,738,17,DIM);}
  if(i===5){text('BODY → REFERENCE',1200,850,22,LIME);for(let k=0;k<3;k++){const y=900+k*30;path([[1240,y],[1740,y]],DIM,1,.6);dot(mix(1240,1740,clamp(q*1.6)),y,4,k===0?ORANGE:LIME);}}
  if(i===8){path([[940,810],[1250,810],[1250,900],[1750,900]],LIME,2,.7);let d=(q*2)%1*900;let px=d<310?940+d:d<400?1250:1250+d-400,py=d<310?810:d<400?810+d-310:900;dot(px,py,7);text('DOWNLINK',1530,870,20,LIME);}
 }
 function listen(t,start,end){
  const q=clamp((t-start)/(end-start));c.fillStyle=INK;c.fillRect(0,0,1920,1080);
  if(t<69.12){text('FLIGHT',80,285,196,BONE,850);text('CONTROLLERS.',80,475,166,BONE,850);}
  else if(t<70.25){text('GO /',80,285,196,LIME,850);text('NO GO?',80,475,166,BONE,850);}
  else{text('POWERED',80,285,160,BONE,850);text('DESCENT.',80,475,166,LIME,850);}
  const roles=['RETRO','FIDO','GUIDANCE','CONTROL','TELMU','GNC','EECOM','SURGEON'];
  roles.forEach((r,i)=>{const x=120+i*225,y=795+(i%2)*70;circle(x,y,13,DIM,2);text(r,x-38,y+60,17,DIM);path([[x,y-15],[x,615]],DIM,1,.35);if(q>i/10)dot(x,615,4,LIME);});
  path([[120,615],[1750,615]],LIME,2);text('STATUS → JUDGMENT → PERMISSION',82,1000,25,LIME);text('ONE VOICE LOOP / EIGHT DIFFERENT QUESTIONS',80,92,19,DIM);
 }
 function collective(t,opts){
  const q=clamp((t-CLOSE.go)/(DURATION-CLOSE.go)),hit=Math.exp(-Math.max(0,t-CLOSE.go)*18);
  const done=CUES.filter(x=>t>=x.go);done.forEach((item,i)=>{const x=86+i*224;path([[x,998],[x+160,998]],LIME,3);text(item.role,x,1041,18,LIME);dot(x+150,982,4);});
  const p=smooth(q*2.3);
  if(q<.44){text('WE ARE',80,230,125,BONE,850);text('GO.',76,430,235,LIME,900);text('FOR POWERED DESCENT',88,500,31,BONE,750);}
  else{text('ONE',78,235,120,BONE,850);text('ACTION.',78,366,120,LIME,850);}
  const nodes=[['FLIGHT',320,730],['CAPCOM',940,730],['EAGLE',1570,730]];
  nodes.forEach(([n,x,y],i)=>{circle(x,y,27,i<=Math.floor(p*2)?LIME:DIM,2+hit*2);text(n,x-58,y+70,25,BONE,700);if(i<2){path([[x+30,y],[nodes[i+1][1]-30,y]],DIM,1,.8);const a=clamp(p*2-i);path([[x+30,y],[mix(x+30,nodes[i+1][1]-30,a),y]],LIME,4);}});
  text('ASSESS',265,678,16,DIM);text('COMMUNICATE',870,678,16,DIM);text('EXECUTE',1522,678,16,DIM);
 }
 function render(t,opts={}){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,1920,1080);
  if(opts.collective)collective(t,opts);else if(opts.listen)listen(t,PREP_END,opts.pollStart||72);else prep(t,clamp(opts.u||0),opts);
 }
 return {canvas,render};
}
