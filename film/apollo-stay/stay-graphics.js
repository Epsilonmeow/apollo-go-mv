import {STAY_CUES} from './timing.js';
const W=1920,H=1080,INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d',TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p,fract=v=>v-Math.floor(v),out=v=>1-Math.pow(1-clamp(v),4),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function createStayGraphics(){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');let fg=BONE,bg=INK,ac=LIME;
 const text=(s,x,y,size=20,col=fg,weight=500,align='left',alpha=1)=>{c.save();c.globalAlpha=alpha;c.font=`${weight} ${size>0?size:20}px ${size>32?'Archivo':'Consolas'},sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);c.restore();};
 const rect=(x,y,w,h,col=fg,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.fillRect(x,y,w,h);c.restore();};
 const line=(ps,col=fg,w=2,a=1,p=1)=>{c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...ps[0]);const n=clamp(p)*(ps.length-1);for(let i=1;i<=Math.floor(n);i++)c.lineTo(...ps[i]);if(n<ps.length-1){let k=Math.floor(n);c.lineTo(mix(ps[k][0],ps[k+1][0],n-k),mix(ps[k][1],ps[k+1][1],n-k));}c.stroke();c.restore();};
 const circle=(x,y,r,col=fg,w=2,a=1)=>{c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.restore();};
 const dot=(x,y,r=4,col=ac,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();};
 const arrow=(x,y,xx,yy,col=ac,w=3)=>{line([[x,y],[xx,yy]],col,w);let a=Math.atan2(yy-y,xx-x);line([[xx-13*Math.cos(a-.5),yy-13*Math.sin(a-.5)],[xx,yy],[xx-13*Math.cos(a+.5),yy-13*Math.sin(a+.5)]],col,w);};
 const notes=(rows,x,y,col=fg,a=.7)=>rows.forEach((r,i)=>text(r,x,y+i*26,17,col,500,'left',a));
 function stream(ps,t,col=ac,amount=1,n=6){line(ps,col,3,.7,amount);for(let i=0;i<n;i++){let u=fract(t*.6+i/n)*(ps.length-1),k=Math.floor(u),q=u-k;dot(mix(ps[k][0],ps[k+1][0],q),mix(ps[k][1],ps[k+1][1],q),4,col,amount);}}
 function lm(x,y,s=1,angle=0,col=fg){c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);for(const p of [[[-34,-18],[-38,-45],[-18,-64],[22,-64],[38,-42],[34,-18]],[[-40,-18],[40,-18],[48,4],[43,29],[-43,29],[-48,4],[-40,-18]],[[-27,-43],[-13,-54],[-13,-30],[-27,-43]],[[13,-54],[28,-43],[13,-30],[13,-54]],[[-12,29],[-12,40],[-23,57],[23,57],[12,40],[12,29]],[[-43,-5],[-75,57],[-103,78]],[[43,-5],[75,57],[103,78]],[[-115,80],[-78,80]],[[78,80],[115,80]]])line(p,col,1.6/s);c.restore();}
 function csm(x,y,s=1,angle=0,col=fg){c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);line([[-62,-26],[34,-26],[57,-16],[87,0],[57,16],[34,26],[-62,26],[-62,-26]],col,2);line([[57,-16],[57,16]],col,1);line([[-62,-16],[-78,-10],[-94,-23],[-94,23],[-78,10],[-62,16]],col,2);for(let i=0;i<6;i++)line([[-52+i*13,-26],[-52+i*13,26]],col,1,.35);c.restore();}
 function head(a,b){text(a,78,212,76,fg,850);if(b)text(b,83,259,20,fg,500,'left',.72);}
 function lower(a,b){text(a,77,867,72,fg,850);if(b)text(b,82,921,24,ac,600);}
 function shade(side=false){const g=c.createLinearGradient(0,0,side?1120:0,side?0:H);g.addColorStop(0,'rgba(8,13,18,.91)');g.addColorStop(side?.72:.26,side?'rgba(8,13,18,.77)':'rgba(8,13,18,0)');g.addColorStop(side?1:.67,'rgba(8,13,18,0)');if(!side)g.addColorStop(1,'rgba(8,13,18,.93)');c.fillStyle=g;c.fillRect(0,0,side?1150:W,H);}
 function frame(s,t){text(s.cue?s.cue.role:'APOLLO 11 / AFTER TOUCHDOWN',81,73,s.cue?25:18,s.cue?ac:fg,650);text('T1 / STAY–NO STAY',1838,73,17,fg,500,'right',.7);line([[81,100],[1839,100]],fg,1,.18);if(s.cue){for(let i=0;i<8;i++){let x=86+i*217,done=t>=STAY_CUES[i].hit;line([[x,982],[x+182,982]],done?ac:fg,done?5:1,done?1:.22);text(STAY_CUES[i].role,x,1024,16,done?ac:fg,550,'left',done?1:.48);}}else{text('REPORT → REVIEW → DECIDE',82,1015,16,fg,500,'left',.65);text('SURFACE / ORBIT / GROUND',1838,1015,16,fg,500,'right',.65);}}
 function impact(s){if(!s.cue||s.after<0||s.index===7)return;const a=1-smooth((s.after-.25)/.45),x=1838-25*Math.exp(-s.after*18);rect(x-359,137,359,127,ac,a);text('STAY',x-16,246,106,bg,900,'right',a);rect(0,0,W,7,ac,a);}
 function report(t,s){
  text('THE REPORT',79,192,83,fg,850);text('TRAVELS HOME.',79,284,83,ac,850);const p=out(s.age/1.7),ps=[[1110,590],[1170,418],[1455,418],[1455,195],[1820,195]];line(ps,fg,1,.3);stream(ps,t,ac,p,7);circle(1110,590,18,ac,2,p);text('EAGLE',1140,630,18,ac,600);text('EARTH',1820,163,21,fg,600,'right');notes(['SURFACE REPORT','TRACKING / TELEMETRY','VOICE RETURN'],85,822);text('ARRIVAL MUST BE KNOWN.',1838,929,31,fg,700,'right');
 }
 function chatter(t,s){
  head('KEEP THE CHANNEL CLEAR.','A ROOM FULL OF WORK / A CONTROLLED VOICE LOOP');const p=smooth((s.age-.15)/1.25);
  for(let j=0;j<8;j++){const y=348+j*70,yy=mix(y,591,p),x=170+j*15,ps=[];for(let i=0;i<=100;i++){const u=i/100,amp=25*(1-p)+5;ps.push([x+u*1000,yy+Math.sin(u*65-t*7+j)*Math.sin(u*17+j*.2)*amp]);}line(ps,j===3?ac:fg,j===3?4:1,j===3?1:.55*(1-p));text(STAY_CUES[j].role,86,y+5,17,fg,600,'left',1-p*.8);}
  line([[1200,591],[1435,591]],ac,5,1,p);circle(1550,591,82,ac,4,p);text('VOICE',1550,603,27,ac,650,'center',p);notes(['ONE SPEAKER','CLEAR ACKNOWLEDGMENT','TELEMETRY CONTINUES'],1378,760,fg,p);text('LISTEN.',83,932,88,ac,850,'left',p);
 }
 function alive(t,s,compact=false){
  if(!compact)head('LANDED. STILL WORKING.','THE ENGINE STOPS / THE ENVIRONMENT DOES NOT');else head('STAY TAKES RESOURCES.','TELCOM / LUNAR MODULE ENVIRONMENT AND ELECTRICAL LOAD');
  const cx=compact?1010:965,cy=540;lm(cx,cy,2.2,0,fg);const p=compact?s.p:out(s.age/.55);
  const paths=[[[120,380],[570,380],[570,490],[cx-90,490]],[[120,740],[600,740],[600,590],[cx-95,590]],[[cx+95,500],[1390,500],[1390,381],[1790,381]],[[cx+95,590],[1390,590],[1390,740],[1790,740]]];
  const names=[['OXYGEN','CABIN / SUITS'],['ELECTRICAL POWER','BATTERIES → DC BUSES'],['CO₂ REMOVAL','CABIN ATMOSPHERE'],['COOLING','HEAT → SPACE']];
  paths.forEach((ps,j)=>{line(ps,fg,2,.25);stream(ps,t+j*.1,ac,clamp(p*1.4-j*.1),5);const x=j<2?85:1450,y=j%2?690:330;text(names[j][0],x,y,29,fg,750);text(names[j][1],x,y+31,17,fg,500,'left',.7);});
  text(compact?'SURFACE WORK + A RETURN RESERVE':'CONTINUOUS LOAD / CONTINUOUS SUPPORT',84,934,46,ac,800);if(compact)notes(['SUPPLY','CONSUMPTION','RESERVE'],85,517);
 }
 function returnOption(t,s){
  head('KEEP THE WAY BACK.','SURFACE OPERATIONS STILL DEPEND ON RETURN CAPABILITY');
  const cx=1080,cy=1020,r=640;const arc=[];for(let i=0;i<=110;i++){let a=-Math.PI+i/110*Math.PI;arc.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}line(arc,fg,2,.4);
  const a=-1.1+(s.progress-.5)*.18,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;csm(x,y,.65,a+Math.PI/2,fg);text('COLUMBIA / IN ORBIT',x-140,y-62,20,fg,550);
  lm(630,790,.7,0,fg);line([[470,850],[790,850]],fg,3,.7);text('EAGLE / ON THE SURFACE',440,899,19,fg,600);
  const ps=[[655,766],[790,660],[1010,558],[x-80,y+15]];line(ps,fg,2,.2);line(ps,ac,5,1,out(s.age/.8));notes(['ASCENT CAPABILITY','RENDEZVOUS GEOMETRY','RESOURCES TO RETURN'],85,373);text('STAY DOES NOT CLOSE THIS PATH.',85,959,49,ac,800);
 }
 function choice(t,s){
  head('A NEW QUESTION.','TOUCHDOWN CONFIRMED / POST-LANDING CONDITION UNDER REVIEW');const p=out(s.age/.65),cx=780,cy=568;
  lm(390,560,1.3,0,fg);line([[220,705],[570,705]],fg,3,.6);arrow(565,570,cx,570,fg,4);
  const stay=[[cx,cy],[1010,cy],[1205,390],[1710,390]],leave=[[cx,cy],[1010,cy],[1205,758],[1710,758]];line(stay,ac,4,1,p);line(leave,ORANGE,3,.75,p);dot(cx,cy,10,fg);
  text('STAY',1210,352,74,ac,850);text('CONTINUE SURFACE WORK',1214,438,20,fg,550);text('NO STAY',1210,719,65,fg,850);text('PREPARE TO LEAVE',1214,807,20,ORANGE,550);text('THE RETURN OPTION REMAINS.',85,949,48,fg,800);
 }
 function invitation(t,s){
  text('STAY',73,345,206,fg,900);text('/ NO STAY',77,500,140,fg,900);text('ALL FLIGHT CONTROLLERS',88,574,24,fg,600);
  for(let i=0;i<8;i++){const a=out(s.age/.38-i*.19),x=1080+(i%2)*410,y=327+Math.floor(i/2)*140;line([[x,y+33],[x+280,y+33]],fg,2,.25);rect(x,y+31,280*a,4,ac);text(STAY_CUES[i].role,x,y,31,fg,700,'left',a);}
  line([[88,713],[1834,713]],fg,1,.2);text('ONE MORE SHARED DECISION.',85,932,62,ac,850);notes(['FLIGHT / COLLECT THE JUDGMENTS','CAPCOM / COMMUNICATE THE RESULT'],87,770);
 }
 function retro(t,s){
  head('LEAVING REMAINS POSSIBLE.','RETRO / ASCENT AND RETURN OPTIONS');const p=s.p;
  line([[175,788],[1745,788]],fg,2,.4);lm(350,705,.75,0,fg);text('SURFACE',220,838,21,fg,600);const arc=[];for(let i=0;i<=70;i++){let u=i/70;arc.push([410+u*1240,705-390*Math.sin(u*Math.PI*.55)]);}line(arc,fg,2,.2);line(arc,ac,6,1,p);csm(1660,318,.8,-.08,fg);circle(1660,318,66,ac,2,p);text('RETURN WINDOW',1320,442,30,ac,700,'left',p);notes(['EARLY ASCENT','CSM POSITION','INTERCEPT GEOMETRY'],85,350);text('THE EXIT STAYS OPEN.',85,929,58,ac,850);
 }
 function fido(t,s){
  head('ONE HAS STOPPED.','FIDO / A FIXED SURFACE POINT AND A MOVING ORBITER');const p=s.p,cx=1080,cy=610;
  circle(cx,cy,208,fg,2,.4);const ellipse=[];for(let i=0;i<=150;i++){let a=i/150*TAU;ellipse.push([cx+Math.cos(a)*555,cy+Math.sin(a)*235]);}line(ellipse,fg,2,.3);const a=-1.1+s.progress*.28,xx=cx+Math.cos(a)*555,yy=cy+Math.sin(a)*235;csm(xx,yy,.55,.12,fg);
  const sx=cx-145,sy=cy+145;dot(sx,sy,8,fg);lm(sx,sy-.8*80,.4,0,fg);text('SURFACE FIX',sx-226,sy+56,19,fg,600);line([[sx,sy],[xx,yy]],ac,4,.8,p);text('ORBIT PHASE',xx+30,yy+65,23,ac,650);notes(['EAGLE / LANDED STATE','COLUMBIA / CONTINUING ORBIT','POSITION → POSSIBLE MEETING'],85,355);text('THE OTHER KEEPS MOVING.',85,933,54,ac,850);
 }
 function guidance(t,s){
  head('KEEP A REFERENCE.','GUIDANCE / THE FLIGHT STATE SURVIVES TOUCHDOWN');const p=s.p;
  const cx=408,cy=564;circle(cx,cy,145,fg,1,.25);arrow(cx,cy,cx,cy-194,ac,4);arrow(cx,cy,cx+220,cy,fg,3);arrow(cx,cy,cx-110,cy+125,fg,2);text('LOCAL VERTICAL',cx-87,cy-218,17,ac,550);text('ATTITUDE',85,788,28,fg,700);text('POSITION',330,788,28,fg,700);text('VELOCITY',580,788,28,fg,700);
  for(let i=0;i<3;i++){const x=87+i*247;line([[x,820],[x+160,820]],fg,2,.25);line([[x,820],[x+160,820]],ac,5,1,p);text(['REFERENCE VALID','LANDED STATE','MOTION ASSESSED'][i],x,857,15,fg,500);}
  text('READY FOR THE NEXT FLIGHT.',85,935,43,ac,850);
 }
 function control(t,s){
  fg=INK;bg=BONE;ac='#40620c';rect(0,0,W,H,bg);frame(s,t);head('SAFE BELOW. READY ABOVE.','CONTROL / INDEPENDENT DESCENT AND ASCENT SYSTEMS');const p=s.p;
  lm(950,565,2.9,0,fg);const up=[[1038,391],[1290,391],[1290,350],[1735,350]],down=[[1062,631],[1300,631],[1300,729],[1735,729]];
  line(up,fg,2,.3);line(up,ac,5,1,p);line(down,fg,3,.6);text('APS / RCS',1370,311,43,fg,800);text('LEAVE IF REQUIRED',1375,398,21,ac,650,'left',p);text('DPS / SHUTDOWN',1370,691,36,fg,800);text('SURFACE SAFING',1375,777,21,fg,550);notes(['SEPARATE PROPULSION','SEPARATE PROPELLANT','A RETURN CAPABILITY'],85,399,fg);text('STOPPING ONE ENGINE IS NOT STOPPING THE SHIP.',85,934,41,fg,800);impact(s);
 }
 function gnc(t,s){
  head('COLUMBIA HOLDS ITS PART.','GNC / COMMAND MODULE GUIDANCE AND CONTROL');const p=s.p,cx=1060,cy=572;
  csm(cx,cy,2.4,-.08,fg);for(let r of [215,275])circle(cx,cy,r,fg,1,.24);const a=-2.0+Math.sin(s.age*2)*.035;arrow(cx,cy,cx+Math.cos(a)*340,cy+Math.sin(a)*340,ac,4);text('ATTITUDE REFERENCE',cx-12,cy-334,18,ac,600);
  const ps=[[150,440],[530,440],[530,765],[150,765],[150,440]];line(ps,fg,2,.3);stream(ps,t,ac,p,5);text('COMMAND',153,408,21,fg,600);text('MEASURED RESPONSE',153,813,19,fg,600);text('CONTROL AUTHORITY',1400,640,26,ac,700,'left',p);notes(['ATTITUDE','MANEUVER READINESS','ORBITING PARTNER'],1400,711);text('THE MISSION STILL HAS TWO VEHICLES.',85,936,47,ac,850);
 }
 function eecom(t,s){
  head('SUPPORT THE WAIT.','EECOM / COLUMBIA POWER AND LIFE SUPPORT');const p=s.p;
  const rows=[['H₂ + O₂','FUEL CELLS','DC POWER'],['O₂ SUPPLY','CABIN / SUITS','CREW'],['HEAT LOAD','COOLANT','RADIATORS']];
  for(let j=0;j<3;j++){const y=425+j*158;rows[j].forEach((name,i)=>{const x=85+i*239;text(name,x,y,21,fg,600);rect(x,y+25,181,3,fg,.24);rect(x,y+25,181*clamp(p*1.3-i*.15),5,ac);if(i<2)arrow(x+190,y+26,x+225,y+26,ac,2);});text(['REACTION → SUPPLY','LIFE SUPPORT CONTINUES','HEAT TRANSFER CONTINUES'][j],85,y+81,16,fg,500,'left',.7);}
  text('WAIT. RENDEZVOUS. RETURN.',85,943,48,ac,850);
 }
 function surgeon(t,s){
  if(s.after<0){text('THREE PEOPLE.',78,208,72,fg,850);text('ONE CONTINUING MISSION.',82,270,31,fg,700);const names=['ARMSTRONG','ALDRIN','COLLINS'];for(let i=0;i<3;i++){const y=388+i*140;circle(109,y-10,20,fg,2,.7);text(names[i],150,y,25,fg,650);text(i===2?'COLUMBIA / ORBIT':'EAGLE / SURFACE',150,y+35,16,fg,500,'left',.7);}text('CREW CONDITION / CAPACITY TO CONTINUE',85,936,23,fg,600);}
  else {const p=out(s.after/.2);text('STAY.',77,913,191,ac,900,'left',p);text('THE WORK CONTINUES.',1837,920,39,fg,800,'right',p);rect(0,0,W,7,ac,Math.exp(-s.after*9));}
 }
 function render(t,s){
  c.clearRect(0,0,W,H);fg=BONE;bg=INK;ac=LIME;
  if(s.world){shade(s.name==='guidance'||s.name==='eecom'||s.name==='surgeon');}else rect(0,0,W,H,bg);
  if(s.name==='eecom'){const g=c.createLinearGradient(0,0,0,445);g.addColorStop(0,'rgba(8,13,18,.98)');g.addColorStop(.61,'rgba(8,13,18,.96)');g.addColorStop(1,'rgba(8,13,18,0)');c.fillStyle=g;c.fillRect(0,0,W,445);}
  frame(s,t);
  if(s.name==='report')report(t,s);
  else if(s.name==='chatter')chatter(t,s);
  else if(s.name==='listen'){lower('ONE VOICE AT A TIME.','EAGLE → CAPCOM → FLIGHT');notes(['TRANSMIT','LISTEN','ACKNOWLEDGE'],83,160);}
  else if(s.name==='room'){lower('ONE ROOM. MANY TASKS.','ATTENTION RETURNS TO THE FLIGHT');}
  else if(s.name==='standby'){text('T1',76,244,163,fg,900);text('STAND BY.',85,304,38,ac,750);lower('THE FIRST STAY DECISION.','SURFACE CONDITION / CREW / RETURN CAPABILITY');}
  else if(s.name==='alive')alive(t,s);
  else if(s.name==='return')returnOption(t,s);
  else if(s.name==='choice')choice(t,s);
  else if(s.name==='invitation')invitation(t,s);
  else if(s.index===0)retro(t,s);
  else if(s.index===1)fido(t,s);
  else if(s.index===2)guidance(t,s);
  else if(s.index===3){control(t,s);return;}
  else if(s.index===4)alive(t,s,true);
  else if(s.index===5)gnc(t,s);
  else if(s.index===6)eecom(t,s);
  else if(s.index===7)surgeon(t,s);
  impact(s);
 }
 return{canvas,render};
}
