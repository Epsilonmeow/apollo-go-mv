import {clamp,mix,smooth} from './timing.js';
const W=1920,H=1080,INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',MUTED='#829197',ORANGE='#f86b3d';
const seats=[['RETRO','ABORT / RETURN',160,230],['FIDO','TRAJECTORY',540,230],['GUIDANCE','STATE / PROGRAM',160,450],['CONTROL','LM ATTITUDE',540,450],['TELMU','LM POWER / ECS',160,670],['GNC','CSM ATTITUDE',540,670],['EECOM','CSM POWER / ECS',160,890],['SURGEON','CREW CONDITION',540,890]];
export function createMissionGraphics(){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');
 const text=(s,x,y,size=20,color=BONE,weight=500)=>{c.fillStyle=color;c.font=`${weight} ${size}px ${size<28?'monospace':'Archivo'}`;c.fillText(s,x,y);};
 function path(ps,color=MUTED,width=1,alpha=1){c.strokeStyle=color;c.lineWidth=width;c.globalAlpha=alpha;c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();c.globalAlpha=1;}
 function circle(x,y,r,color=LIME,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();}
 function tick(x,y,len=12){path([[x-len,y],[x+len,y]],LIME);path([[x,y-len],[x,y+len]],LIME);}
 function header(s,n){text('APOLLO 11',64,62,19,MUTED);text(s,1300,62,18,MUTED);text(n,1778,62,18,LIME);path([[64,90],[1856,90]],MUTED,1,.4);}
 function micro(x,y,lines){lines.forEach((l,i)=>text(l,x,y+i*27,17,MUTED));}
 function travel(t,a,b,y,color=LIME){const p=(t%1+1)%1;path([[a,y],[b,y]],MUTED);c.fillStyle=color;c.fillRect(mix(a,b,p)-6,y-4,12,8);}
 function diagram(t){
  const s=t-31.8476;
  if(s<2.754){
   // A voice loop is a shared communication path, not an electronic power switch.
   const p=clamp(s/2.754);c.save();
   header('MISSION CONTROL / VOICE LOOP','01');
   text('LISTEN.',64,376,190,BONE,850);
   text('ONE CHANNEL. MANY JUDGMENTS.',75,436,24,LIME);
   const center=710;
   for(let i=0;i<200;i++){const x=72+i*8.9,en=Math.exp(-Math.pow((i/200-(s*.28)%1)/.17,2));const v=Math.sin(i*.69-s*8)*Math.sin(i*.17+s*3)*en;path([[x,center-v*160],[x,center+v*160]],i%7===0?LIME:MUTED,i%7===0?3:1,.25+.75*en);}
   path([[72,center],[1848,center]],BONE,1,.4);
   micro(76,894,['FLIGHT DIRECTOR LOOP','MISSION STATUS → DECISION','DOWNLINK / GROUND / CREW']);
   text('HOUSTON',1432,900,44,BONE,700);text('EAGLE / VOICE LINK',1432,940,20,MUTED);
   c.restore();
  }else if(s<5.8168){
   const p=clamp((s-2.754)/3.0628);header('JUDGMENTS CONVERGE','02');
   text('MANY',920,310,164,BONE,850);text('MINDS.',920,484,164,BONE,850);
   const reveal=clamp(p*1.5);seats.forEach(([name,sub,x,y],i)=>{const a=smooth(clamp(reveal*1.4-i*.06));c.globalAlpha=a;text(name,x,y,36,i%3===0?LIME:BONE,750);text(sub,x,y+32,15,MUTED);c.globalAlpha=1;
    const sx=x+210,sy=y-10,h=840-sx,v=720-sy;
    path([[sx,sy],[840,sy],[840,720]],MUTED,1,a*.7);
    const d=((s*.72+i*.13)%1)*(h+Math.abs(v));
    const px=d<h?sx+d:840,py=d<h?sy:sy+Math.sign(v)*(d-h);
    c.globalAlpha=a;circle(px,py,4,LIME,2);c.globalAlpha=1;
   });
   circle(840,720,18,LIME,3);path([[860,720],[1280,720],[1280,780]],LIME,3,clamp(p*2));
   text('FLIGHT',1130,855,70,BONE,750);text('INFORMATION → ASSESSMENT',1032,900,17,MUTED);
  }else if(s<8.5606){
   const p=clamp((s-5.8168)/2.7438);header('COMMAND PATH','03');
   text('ONE',68,323,202,BONE,850);text('DECISION.',68,526,202,BONE,850);
   micro(80,613,['FLIGHT: INTEGRATE STATUS','CAPCOM: SPEAK TO THE CREW','CREW: OBSERVE / EXECUTE / REPORT']);
   const nodes=[['FLIGHT',160,850],['CAPCOM',850,850],['EAGLE',1520,850]];
   nodes.forEach(([n,x,y],i)=>{tick(x,y,22);text(n,x-62,y+78,29,i===2?LIME:BONE,700);if(i<2)travel(s*.7+i*.3,x+28,nodes[i+1][1]-28,y);});
   const x=mix(160,1520,p);c.fillStyle=LIME;c.fillRect(x-4,838,8,24);
   text('S-BAND',1408,732,19,MUTED);text('UPLINK',1408,762,19,LIME);
   path([[1780,800],[1800,850],[1780,900]],LIME,2);
  }
 }
 function space(t){
  const s=t-16.922;
  if(s<3.2621){header('EARTH / MOON','02');const a=1-smooth((s-2.2)/.8);c.globalAlpha=a;text('A WORLD',70,840,150,BONE,850);text('AWAY.',70,1008,150,BONE,850);c.globalAlpha=1;micro(1500,150,['EARTH-CENTERED','DEPARTURE VECTOR','INJECTION → COAST']);}
  else if(s<6.6843){header('THE SPACE BETWEEN','03');text('384,400',76,190,77,BONE,750);text('KM / MEAN EARTH–MOON DISTANCE',82,229,17,MUTED);micro(80,875,['RANGE ≠ ALTITUDE','POSITION ≠ ATTITUDE','TRAJECTORY = STATE + FORCE']);path([[80,958],[1830,958]],MUTED,1,.4);for(let i=0;i<70;i++)path([[80+i*25,950],[80+i*25,966+(i%5===0?8:0)]],MUTED,1,.5);}
  else if(s<10.4558){header('APOLLO CONTROL','04');text('APOLLO',74,260,148,BONE,850);text('11',78,405,148,LIME,850);micro(80,858,['MISSION ELAPSED','102 HOURS','JULY 1969']);text('VOICE / DOWNLINK',1485,976,18,MUTED);}
  else{header('A SIGNAL ACROSS THE VOID','05');text('HERE.',72,200,82,BONE,800);text('THERE.',1500,940,82,LIME,800);micro(80,870,['GROUND NETWORK','SPACECRAFT TRANSPONDER','VOICE + TRACKING + DATA']);}
 }
 function orbital(t){
  const s=t-40.4082;header('LUNAR ORBIT / PREPARATION','06');
  if(s<2.7437){text('ONE',80,250,138,BONE,850);text('TRAJECTORY.',80,400,138,BONE,850);micro(84,828,['COLUMBIA / CSM','EAGLE / LM','SAME MISSION. DIFFERENT SYSTEMS.']);}
  else{text('STAND BY.',70,946,151,BONE,850);text('THE NEXT DECISION CHANGES THE FLIGHT.',83,1000,23,LIME);}
  // These are qualitative navigation datums; no fabricated historical telemetry.
  circle(1410,540,174,MUTED);path([[1180,540],[1640,540]],MUTED,1,.5);path([[1410,310],[1410,770]],MUTED,1,.5);tick(1410+160*Math.cos(s*.25),540+70*Math.sin(s*.25),10);text('STATE VECTOR / [r, v]',1330,830,18,MUTED);
 }
 function render(t,opts={}){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);c.globalAlpha=1;
  if(t>=31.8476&&t<40.4082){c.fillStyle=INK;c.fillRect(0,0,W,H);diagram(t);}else if(t>=40.4082)orbital(t);else if(t>=16.922)space(t);
  const p=opts.pulse||0;if(p>.05){c.fillStyle=LIME;c.globalAlpha=p*.65;c.fillRect(0,H-4,W,4);c.globalAlpha=1;}
 }
 return {canvas,render};
}
