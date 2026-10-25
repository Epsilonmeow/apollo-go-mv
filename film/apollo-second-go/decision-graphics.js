import {SECOND_CUES,SECOND_CLOSE,INTRO,DURATION,clamp} from './timing.js';
const W=1920,H=1080,INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d',TAU=Math.PI*2;
const mix=(a,b,p)=>a+(b-a)*p,out=p=>1-Math.pow(1-clamp(p),4),smooth=p=>{p=clamp(p);return p*p*(3-2*p);},frac=x=>x-Math.floor(x);
const MODES=['path','path','guidance','control','systems','path','systems','systems'];
export function decisionAt(t){
 if(t<SECOND_CUES[0].call){let shot=t<113.4?'return':t<115?'question':'assemble';return {name:shot,mode:'return',world:shot==='return',progress:clamp((t-111.8)/(SECOND_CUES[0].call-111.8)),hit:0,intro:shot};}
 const assemble=SECOND_CUES.at(-1).end;
 if(t>=assemble){const hit=Math.exp(-Math.max(0,t-SECOND_CLOSE.go)*12)*(t>=SECOND_CLOSE.go?1:0);return {name:t<SECOND_CLOSE.go?'collective-ready':'collective-action',mode:'collective',progress:clamp((t-SECOND_CLOSE.go)/(DURATION-SECOND_CLOSE.go)),hit,world:t>=SECOND_CLOSE.go,collective:true,assemble};}
 let index=0;for(let i=0;i<SECOND_CUES.length;i++)if(t>=SECOND_CUES[i].call)index=i;
 const cue=SECOND_CUES[index],next=SECOND_CUES[index+1]?.call??SECOND_CLOSE.start;
 const roleIndex=index%8,round=Math.floor(index/8)+1;
 return {name:cue.role.toLowerCase()+'-'+round,mode:MODES[roleIndex],world:roleIndex===2&&(round===1)||roleIndex===3&&round===1,index:roleIndex,round,cue,progress:clamp((t-cue.call)/(next-cue.call)),p:out((t-cue.go)/.3),hit:t<cue.go?0:Math.exp(-(t-cue.go)*13),age:t-cue.call,after:t-cue.go};
}
export function createDecisionGraphics(){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');let fg=BONE,bg=INK,ac=LIME;
 const text=(s,x,y,size=20,col=fg,weight=500,align='left',alpha=1)=>{c.save();c.globalAlpha=alpha;c.font=`${weight} ${size}px ${size>32?'Archivo':'Consolas'},sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);c.restore();};
 const line=(ps,col=fg,w=2,alpha=1,amount=1)=>{c.save();c.globalAlpha=alpha;c.lineWidth=w;c.strokeStyle=col;c.beginPath();const n=clamp(amount)*(ps.length-1);c.moveTo(...ps[0]);for(let i=1;i<=Math.floor(n);i++)c.lineTo(...ps[i]);if(n<ps.length-1){let k=Math.floor(n);c.lineTo(mix(ps[k][0],ps[k+1][0],n-k),mix(ps[k][1],ps[k+1][1],n-k));}c.stroke();c.restore();};
 const rect=(x,y,w,h,col=fg,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.fillRect(x,y,w,h);c.restore();};
 const circle=(x,y,r,col=fg,w=2,a=1)=>{c.save();c.globalAlpha=a;c.lineWidth=w;c.strokeStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.restore();};
 const dot=(x,y,r=4,col=ac,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();};
 const arrow=(x,y,u,v,col=ac,w=3)=>{line([[x,y],[u,v]],col,w);let a=Math.atan2(v-y,u-x);line([[u-12*Math.cos(a-.5),v-12*Math.sin(a-.5)],[u,v],[u-12*Math.cos(a+.5),v-12*Math.sin(a+.5)]],col,w);};
 const notes=(rows,x,y,col=fg)=>rows.forEach((s,i)=>text(s,x,y+i*25,17,col,450,'left',.75));
 function ticks(x,y,width){for(let i=0;i<=width;i+=22)line([[x+i,y],[x+i,y+(i%110?5:13)]],fg,1,.34);}
 function wave(x,y,len,t,amp,col=fg){const ps=[];for(let i=0;i<=150;i++){const u=i/150;ps.push([x+u*len,y+Math.sin(u*24-t*3)*Math.sin(u*7+1)*amp]);}line(ps,col,2,.7);}
 function lm(x,y,scale=1,angle=0,col=fg){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);const paths=[ [[-34,-18],[-38,-45],[-18,-64],[22,-64],[38,-42],[34,-18]], [[-40,-18],[40,-18],[48,4],[43,29],[-43,29],[-48,4],[-40,-18]], [[-28,-43],[-13,-54],[-13,-30],[-28,-43]], [[13,-54],[28,-43],[13,-30],[13,-54]], [[-12,29],[-12,40],[-23,57],[23,57],[12,40],[12,29]], [[-43,-5],[-75,57],[-103,78]],[[-36,28],[-75,57],[-80,78]], [[43,-5],[75,57],[103,78]],[[36,28],[75,57],[80,78]],[[-115,80],[-78,80]],[[78,80],[115,80]] ];paths.forEach(p=>line(p,col,1.5/scale));c.restore();}
 function orbitalCSM(x,y,s=1,col=fg){c.save();c.translate(x,y);c.scale(s,s);line([[-62,-26],[34,-26],[57,-16],[57,16],[34,26],[-62,26],[-62,-26]],col,2);line([[57,-16],[87,0],[57,16]],col,2);line([[-62,-16],[-78,-10],[-94,-23],[-94,23],[-78,10],[-62,16]],col,2);for(let i=0;i<6;i++)line([[-52+i*13,-26],[-52+i*13,26]],col,1,.35);c.restore();}
 function ledger(t){let x=88;for(const [i,q] of SECOND_CUES.entries()){const done=t>=q.go,j=i%8,row=Math.floor(i/8),yy=985+row*12;line([[x+j*216,yy],[x+j*216+180,yy]],done?ac:fg,done?4:1,done?1:.22);if(row===0)text(q.role,x+j*216,1031,15,done?ac:fg,500,'left',done?1:.4);} }
 function frame(s,t){
  if(s.world){const g=c.createLinearGradient(0,0,1250,0);g.addColorStop(0,'rgba(8,13,18,.96)');g.addColorStop(.56,'rgba(8,13,18,.84)');g.addColorStop(1,'rgba(8,13,18,0)');c.fillStyle=g;c.fillRect(0,0,1300,H);}
  else rect(0,0,W,H,bg);
  if(s.cue){text(s.cue.role,84,97,26,ac,650);text('FLIGHT / GO–NO GO FOR LANDING',1832,96,16,fg,500,'right',.63);line([[84,122],[1836,122]],fg,1,.2);}
  ledger(t);
 }
 function impact(s){if(!s.cue||s.after<0)return;const a=1-smooth((s.after-.22)/.28);if(a<=0)return;const dx=24*Math.exp(-s.after*16);rect(1586-dx,151,250,123,ac,a);text('GO',1817-dx,251,117,bg,900,'right',a);line([[46,151],[46,914]],ac,7,a);}
 function title(s,sub){text(s,83,224,79,fg,850);text(sub,87,267,19,fg,500,'left',.7);}
 function intro(t,s){
  if(s.intro==='return'){text('THE FLIGHT',82,170,76,fg,850);text('COMES BACK AS DATA.',84,246,65,fg,850);notes(['STATE VECTOR / TRACKING','ATTITUDE / CONTROL RESPONSE','CONSUMPTION / REMAINING CAPABILITY'],86,343);let a=s.anchors?.downlink;const x=a?.visible?a.x*W:1260,y=a?.visible?a.y*H:450;line([[x,y],[960,530],[840,530],[840,660],[86,660]],ac,2,.7,clamp((t-111.8)/1.6));for(let i=0;i<6;i++){const u=frac((t-111.8)*.7+i/6);dot(mix(910,110,u),660,3,ac);}text('NEW CONDITIONS. A NEW DECISION.',86,913,35,ac,700);}
  else if(s.intro==='question'){title('TAKE IT AROUND.','THE SAME VEHICLE. A CHANGING FLIGHT.');const cx=1000,cy=590;for(let i=0;i<8;i++){const a=-2.9+i*.77,x=cx+Math.cos(a)*325,y=cy+Math.sin(a)*235;const q=clamp((t-113.4)*3-i*.16);line([[cx,cy],[mix(cx,x,q),mix(cy,y,q)]],fg,2,.5);circle(x,y,8,ac,2,q);text(SECOND_CUES[i].role,x,y-23,19,fg,600,'center',q);}lm(cx,cy,.85,0,fg);text('CONTINUE?',86,901,102,ac,850);}
  else {title('EVIDENCE, THEN ACTION.','OBSERVATION → JUDGMENT → PERMISSION');const x=150,y=550;for(let j=0;j<3;j++){const u=out((t-115)/.55-j*.35);line([[x+j*550,y-130],[x+j*550,y+150]],fg,2,.35);wave(x+j*550,y,440,t,40*(1-j*.3),j===2?ac:fg);text(['MEASURE','COMPARE','DECIDE'][j],x+j*550,y+240,52,j===2?ac:fg,800);arrow(x+j*550+390,y+95,x+j*550+460,y+95,ac,3);rect(x+j*550,y+185,440*u,3,ac);}notes(['ACTUAL BEHAVIOR','CONTINUOUSLY REASSESSED'],86,341);}
 }
 function retro(s,t){
  title('KEEP THE RETURN OPEN.','RETRO / ABORT GEOMETRY REMAINS PART OF THE DESCENT');const p=s.p,split=out(s.age/.4),x=930,y=567;
  const incoming=[[110,387],[350,425],[650,492],[x,y]],down=[[x,y],[1130,652],[1410,725],[1810,772]],up=[[x,y],[1150,367],[1450,306],[1800,335]];
  line(incoming,fg,5,1,split);line(down,fg,2,.23);line(up,fg,2,.23);line(up,ac,3,.9,p);line(down,ac,10,1,p);dot(x,y,12,fg);circle(x,y,28,fg,1,.4);
  for(let j=0;j<9;j++){const u=j/8;line([[1150+u*640,367-50*Math.sin(u*2.5)],[1150+u*640,405-50*Math.sin(u*2.5)]],fg,1,.28*p);}
  notes(['ABORT INITIATION','ASCENT TRAJECTORY','INTERCEPT CONDITIONS'],86,704);text('ASCENT / RENDEZVOUS',1420,272,20,ac,550);text('DESCENT CONTINUES',1440,832,25,ac,650);text('OPTIONS SURVIVE THE DECISION.',86,928,44,ac,800);
 }
 function fido(s,t){
  title('MEASURE THE DIFFERENCE.','FIDO / TRACKED STATE AGAINST THE EXPECTED FLIGHT');const p=s.p;
  c.save();c.translate(190,580);c.rotate(-.1);const points=[];for(let i=0;i<=100;i++)points.push([i*15,60*Math.sin(i/37)]);
  for(let sign of [-1,1])line(points.map(([x,y])=>[x,y+sign*125]),fg,1,.22);
  for(let sign of [-1,1])line(points.map(([x,y])=>[x,y+sign*125]),ac,5,.82,p);
  line(points,fg,2,.6);for(let j=0;j<18;j++){let u=j/18,x=u*1500,y=60*Math.sin(u*100/37),d=(Math.sin(j*2.9)*27+Math.cos(j)*17)*1;line([[x,y],[x,y+d]],ac,2,.65);dot(x,y+d,4,ac);}
  for(let j=0;j<4;j++){let x=220+j*380;line([[x,160],[x,215]],fg,1,.35);text('Δr / Δv',x,244,16,fg,500,'center',.6);}text('EXPECTED STATE',5,-49,18,fg);text('TRACKING UPDATES',1100,159,18,ac);ticks(0,292,1500);c.restore();
  rect(90,318,405*p,6,ac);notes(['GROUND TRACKING','POSITION / VELOCITY','RESIDUALS / FLIGHT CORRIDOR'],86,365);text('THE MOTION CHECKS OUT.',86,925,53,ac,800);
 }
 function guidance(s,t){
  title('THREE WAYS TO KNOW.','GUIDANCE / INDEPENDENT NAVIGATION COMPARISON');const p=s.p;const ys=[410,565,720],names=['PGNS / PRIMARY GUIDANCE','AGS / ABORT GUIDANCE','MSFN / GROUND TRACKING'];
  for(let j=0;j<3;j++){const y=ys[j];text(names[j],86,y-40,18,fg,550);line([[87,y],[610,y],[780,565]],fg,2,.25);const points=[];for(let i=0;i<=55;i++){let u=i/55;points.push([90+u*510,y+Math.sin(u*16+j*.9)*14]);}line(points,j===1?ORANGE:ac,2,.75);dot(mix(90,610,frac(t*.65+j*.3)),y,4,ac);line([[610,y],[780,565]],ac,3,.8,p);}
  circle(780,565,28,ac,3,p);text('AGREEMENT',86,858,62,ac,850);notes(['r, v → COMPARE → CONTINUE','LANDING RADAR / STATE UPDATES'],87,905);
 }
 function control(s,t){
  title('COMMAND BECOMES MOTION.','CONTROL / RESPONSE OF THE VEHICLE');const p=s.p;
  const nodes=[[100,385],[650,385],[650,705],[100,705],[100,385]];line(nodes,fg,2,.3);line(nodes,ac,5,1,p);
  text('ATTITUDE COMMAND',103,345,19,fg,650);text('MEASURED RESPONSE',103,751,19,fg,650);
  const cx=375,cy=545;circle(cx,cy,112,fg,1,.25);const a=mix(-.5,-.13,p);arrow(cx,cy,cx+Math.sin(a)*180,cy-Math.cos(a)*180,ORANGE,4);arrow(cx,cy,cx-23,cy-178,ac,2);lm(cx,cy,.7,a,fg);
  for(let j=0;j<4;j++){const r=frac(t*.65+j/4)*4,k=Math.floor(r);dot(mix(nodes[k][0],nodes[k+1][0],r-k),mix(nodes[k][1],nodes[k+1][1],r-k),5,ac,p);}
  notes(['ROTATION / RATE','CONTROL AUTHORITY','RESPONSE CONFIRMED'],87,823);text('THE LOOP CLOSES.',86,943,52,ac,850);
 }
 function telmu(s,t){
  title('KEEP EAGLE ALIVE.','TELMU / LUNAR MODULE ELECTRICAL AND ENVIRONMENTAL SYSTEMS');const p=s.p;lm(960,590,2.05,0,fg);
  const rows=[['ELECTRICAL POWER','BATTERIES → DC BUSES',360,420,-1],['CABIN ENVIRONMENT','OXYGEN / CO₂ REMOVAL',360,710,-1],['THERMAL CONTROL','COOLANT → SUBLIMATOR',1570,420,1],['TELEMETRY','SYSTEM STATE → GROUND',1570,710,1]];
  rows.forEach(([name,small,x,y,side],i)=>{text(name,x,y-51,25,fg,650,'center');text(small,x,y-19,16,fg,450,'center',.7);const dest=[960+side*145,590+(i%2?73:-67)],ps=[[x,y],[x-side*150,y],[dest[0],y],dest];line(ps,fg,2,.3);line(ps,ac,4,1,p);for(let j=0;j<6;j++)dot(x-110+j*43,y+53,3,ac,clamp(p*2-j*.17));});
  text('CAPABILITY, UNDER LOAD.',86,932,58,ac,850);notes(['CONSUMPTION','REMAINING SUPPLY','SYSTEM LIMITS'],89,325);
 }
 function gnc(s,t){
  title('THE OTHER HALF OF RETURN.','GNC / COLUMBIA KEEPS ITS GUIDANCE AND CONTROL CAPABILITY');const p=s.p;
  const cy=1460;for(let r of [660,810,870]){c.save();c.beginPath();c.rect(0,290,W,585);c.clip();circle(1020,cy,r,fg,1,.25);c.restore();}
  const a=-2.0+frac(t*.018)*.2,x=1020+Math.cos(a)*810,y=cy+Math.sin(a)*810;orbitalCSM(x,y,1.9,fg);
  const ascent=[[1450,839],[1430,655],[1220,470],[980,427],[x+130,y]];line(ascent,fg,2,.25);line(ascent,ac,4,1,p);lm(1450,839,.36,0,fg);
  text('COLUMBIA',x-135,y-105,33,fg,800);text('EAGLE / EVENTUAL ASCENT',1370,902,18,fg,550);notes(['CSM GUIDANCE','ATTITUDE / MANEUVER CAPABILITY','RENDEZVOUS SUPPORT'],86,346);text('TWO VEHICLES. ONE MISSION.',86,942,54,ac,850);
 }
 function eecom(s,t){
  title('COLUMBIA STAYS READY.','EECOM / COMMAND AND SERVICE MODULE RESOURCES');const p=s.p;orbitalCSM(1450,500,2.3,fg);
  const rows=[['H₂ + O₂','FUEL CELLS','DC POWER'],['O₂ SUPPLY','CABIN / SUITS','CREW ENVIRONMENT'],['HEAT LOAD','COOLANT LOOP','RADIATORS']];
  rows.forEach((r,j)=>{const y=400+j*175;for(let k=0;k<3;k++){const x=85+k*365;rect(x,y+41,268,3,fg,.25);rect(x,y+41,268*clamp(p*1.5-k*.16),5,ac);text(r[k],x,y,22,fg,650);if(k<2)arrow(x+275,y+43,x+329,y+43,ac,2);}text(['REACTION → OUTPUT','SUPPLY → LIFE SUPPORT','TRANSFER → REJECTION'][j],86,y+89,15,fg,400,'left',.62);});
  text('RETURN REQUIRES ENDURANCE.',86,947,53,ac,850);
 }
 function surgeon(s,t){
  title('PEOPLE COMPLETE THE SYSTEM.','SURGEON / THE CREW REMAINS PART OF EVERY DECISION');const p=s.p;
  const cols=[345,960,1575],names=['ARMSTRONG','ALDRIN','COLLINS'];cols.forEach((x,j)=>{circle(x,440,62,fg,2,.55);line([[x-90,715],[x-83,575],[x-53,529],[x+53,529],[x+83,575],[x+90,715]],fg,2,.55);text(names[j],x,789,26,fg,700,'center');text(j<2?'EAGLE':'COLUMBIA',x,823,16,fg,500,'center',.6);line([[x,853],[x,880],[960,880]],ac,4,.8,p);for(let k=0;k<6;k++)line([[x-160+k*64,344],[x-160+k*64,356]],fg,1,.3);});
  // An authored speech/observation trace, not a fabricated ECG or vital-sign readout.
  wave(120,626,1660,t,23,ac);text('BIOMEDICAL MONITORING / CREW REPORTS / WORKLOAD',86,315,18,fg,500);text('THREE PEOPLE. STILL ONE FLIGHT.',86,954,54,ac,850);
 }
 function collective(s,t){
  const go=t>=SECOND_CLOSE.go,p=out((t-SECOND_CLOSE.go)/.65);
  if(!go&&t<s.assemble+1.8){title('EIGHT JUDGMENTS.','ONE FLIGHT DIRECTOR / ONE DECISION');for(let i=0;i<8;i++){const x=115+i*215;line([[x,420],[x,620],[960,790]],ac,2,.7);text(SECOND_CUES[i].role,x,381,17,fg,550,'center');dot(mix(x,960,clamp((t-s.assemble)*.7)),mix(620,790,clamp((t-s.assemble)*.7)),4,ac);}text('FLIGHT',960,857,66,fg,850,'center');}
  else if(!go){title('ONE VOICE TO EAGLE.','THE DECISION TRAVELS THROUGH CAPCOM');const q=out((t-s.assemble-1.8)/1.6);for(let j=0;j<3;j++){const x=150+j*610;text(['FLIGHT','CAPCOM','EAGLE'][j],x,560,67,j===2?ac:fg,850);text(['COLLECT','COMMUNICATE','ACT'][j],x,614,20,fg,500);if(j<2){line([[x+365,535],[x+535,535]],fg,2,.25);arrow(x+365,535,x+365+170*clamp(q*2-j),535,ac,5);}}text('GO / NO-GO FOR LANDING',86,906,55,ac,850);}
  else{rect(0,0,W,9,ac,Math.exp(-(t-SECOND_CLOSE.go)*9));text('GO FOR',80,178,87,fg,850);text('LANDING.',78,299,130,ac,900);line([[85,360],[650,360]],ac,4,.9,p);notes(['FLIGHT → CAPCOM → EAGLE','THE DESCENT CONTINUES'],85,405);text('EVERY JUDGMENT MOVES WITH THEM.',85,928,37,fg,700);}
 }
 function retroNext(s,t){
  title('HEIGHT IS NOT ENOUGH.','RETRO / DESCENT RATE CHANGES THE OPTIONS');const p=s.p;
  line([[270,330],[270,820],[1770,820]],fg,2,.65);text('HEIGHT',270,312,18,fg);text('DESCENT RATE',1770,855,18,fg,500,'right');
  const boundary=[];for(let i=0;i<=80;i++){let u=i/80;boundary.push([300+u*1430,765-380*u*u]);}line(boundary,ORANGE,3,.8);
  for(let j=0;j<7;j++){let x=430+j*190,y=715-270*Math.pow(j/7,2);line([[x,y],[x-40,y-135]],fg,1,.18);}
  let x=mix(820,1140,p),y=mix(470,495,p);circle(x,y,22,ac,3);dot(x,y,6,ac);arrow(x,y,x-250,y-132,ac,4);text('CURRENT STATE',x+38,y-22,20,fg,600);text('ABORT CAPABILITY',1460,405,20,ORANGE,650);notes(['ALTITUDE + VERTICAL VELOCITY','NOT A SINGLE THRESHOLD','RETURN GEOMETRY UPDATED'],86,907);
 }
 function fidoNext(s,t){
  title('THE NEXT STATE FOLLOWS.','FIDO / POSITION AND VELOCITY BECOME A PREDICTION');const p=s.p;
  const ps=[];for(let i=0;i<=100;i++){let u=i/100;ps.push([130+u*1640,405+u*120+u*u*190]);}line(ps,fg,2,.3);line(ps,ac,7,1,.42+.58*p);
  const x=130+.42*1640,y=405+.42*120+.42*.42*190;circle(x,y,24,fg,2);arrow(x,y,x+165,y+45,ac,4);text('r NOW',x-30,y-48,30,fg,650);text('v NOW',x+167,y+29,20,ac,650);
  for(let j=1;j<=5;j++){const u=.42+j*.103,xx=130+u*1640,yy=405+u*120+u*u*190;line([[xx,yy-90],[xx,yy+90]],fg,1,.25);dot(xx,yy,5,ac,clamp(p*6-j+1));text('t + Δt',xx,yy+125,16,fg,500,'center',.65);}
  text('OBSERVED PAST → POSSIBLE FUTURE',86,931,52,ac,850);
 }
 function guidanceNext(s,t){
  title('DIFFERENCE HAS MEANING.','GUIDANCE / COMPARE THE SOURCES, THEN ACCEPT THE STATE');const p=s.p,cx=960,cy=600;
  const ends=[[1510,440],[1543,469],[1488,476]],names=['PGNS','AGS','MSFN'];for(let j=0;j<3;j++){const col=j===1?ORANGE:ac;arrow(300,750,...ends[j],col,j?2:4);text(names[j],j===2?1405:ends[j][0]+32,j===2?550:ends[j][1]+(j-1)*34,22,col,650);}
  c.save();c.setLineDash([5,10]);circle(1510,460,95,fg,1,.45);c.restore();
  ends.forEach(([x,y],j)=>line([[x,y],[1660+j*37,y+170],[1660+j*37,760+j*21],[1100,812]],j===1?ORANGE:ac,3,.85,p));
  circle(1100,812,19,ac,5,p);text('SMALL DIFFERENCES',87,392,48,fg,800);text('ARE STILL INFORMATION.',87,451,48,fg,800);text('CONSISTENT STATE',1150,868,36,ac,750,'left',p);notes(['PRIMARY GUIDANCE','BACKUP GUIDANCE','GROUND TRACKING'],87,839);
 }
 function controlNext(s,t){
  title('WHAT WILL REMAIN?','CONTROL / ACTUAL PERFORMANCE PROJECTED INTO THE REST OF THE DESCENT');const p=s.p;
  line([[170,334],[170,823],[1780,823]],fg,2,.5);text('PROPELLANT REMAINING',172,309,18,fg);text('VELOCITY CHANGE ACHIEVED → REQUIRED',1780,857,18,fg,500,'right');
  const actual=[[200,380],[390,421],[590,483],[790,531],[920,560]],future=[[920,560],[1190,629],[1450,689],[1700,751]];line(actual,fg,5);line(future,fg,2,.2);line(future,ac,6,1,p);
  for(const [x,y] of actual)dot(x,y,5,fg);line([[920,325],[920,815]],fg,1,.3);text('NOW',920,305,19,fg,550,'center');text('PROJECTED MARGIN',1300,596,23,ac,650);line([[1699,751],[1699,810]],ORANGE,8,.9,p);
  notes(['MEASURED CONSUMPTION','ACHIEVED PERFORMANCE','REMAINING CAPABILITY'],87,911);
 }
 function telmuNext(s,t){
  title('HEAT MUST LEAVE.','TELMU / CONTINUOUS WORK REQUIRES CONTINUOUS HEAT REJECTION');const p=s.p,ps=[[160,565],[650,565],[650,390],[1240,390],[1240,700],[650,700],[650,565]];
  line(ps,fg,2,.3);line(ps,ac,6,1,p);for(let j=0;j<7;j++){let u=frac(t*.6+j/7)*(ps.length-1),k=Math.floor(u);dot(mix(ps[k][0],ps[k+1][0],u-k),mix(ps[k][1],ps[k+1][1],u-k),5,ac);}
  text('EQUIPMENT / CREW',85,489,27,fg,700);text('COOLANT LOOP',720,350,29,fg,700);text('SUBLIMATOR',1330,570,39,fg,800);
  for(let j=0;j<5;j++){const y=620+j*24;arrow(1370,y,1740+20*p,y,ac,2);}text('HEAT → SPACE',1540,799,20,ac,650);notes(['FLOW','HEAT TRANSFER','TEMPERATURE LIMITS'],87,844);text('WORK CAN CONTINUE.',800,937,62,ac,850);
 }
 function gncNext(s,t){
  title('KEEP AN INTERCEPT POSSIBLE.','GNC / GUIDANCE AND CONTROL IN THE ORBITING CSM');const p=s.p;
  const orbit=[];for(let i=0;i<=140;i++){let a=-Math.PI+i/140*Math.PI*1.4;orbit.push([1000+Math.cos(a)*740,630+Math.sin(a)*230]);}line(orbit,fg,2,.5);
  orbitalCSM(980,400,1.6,fg);lm(880,790,.55,0,fg);const route=[[880,790],[1180,740],[1450,585],[1510,500]];line(route,ac,5,.9,p);circle(1510,500,27,ac,2,p);line([[1510,500],[1650,365]],fg,1,.4);text('RELATIVE GEOMETRY',1470,325,24,fg,650);
  notes(['ATTITUDE CONTROL','MANEUVER READINESS','RENDEZVOUS SUPPORT'],87,331);text('THE RETURN IS STILL AHEAD.',86,934,59,ac,850);
 }
 function eecomNext(s,t){
  title('RESOURCES BECOME TIME.','EECOM / THE CSM MUST SUPPORT WHAT COMES NEXT');const p=s.p;
  const names=['FUEL-CELL REACTANTS','OXYGEN SUPPLY'];for(let j=0;j<2;j++){const y=410+j*170;text(names[j],86,y-23,26,fg,650);const w=1480,used=230+j*70;rect(87,y+12,w,33,fg,.12);rect(87,y+12,used,33,fg,.65);rect(87+used,y+12,(w-used)*p,33,ac,.8);line([[87+used,y-10],[87+used,y+65]],fg,2,.7);text('USED',87,y+91,16,fg);text('SUPPLY FOR THE REMAINING MISSION',87+used+28,y+91,16,ac,650);}
  text('HEAT LOAD',86,762,26,fg,650);text('COOLANT',660,762,26,fg,650);text('HEAT REJECTION',1260,762,26,fg,650);arrow(285,749,600,749,ac,4);arrow(850,749,1190,749,ac,4);text('CONTINUOUS TRANSFER → RADIATORS',87,832,18,ac,600);
  text('READY TO WAIT. READY TO RETURN.',86,948,53,ac,850);
 }
 function surgeonNext(s,t){
  title('THEY ARE STILL WORKING.','SURGEON / OBSERVATION OF PEOPLE, ALONGSIDE OBSERVATION OF MACHINES');const p=s.p;
  for(const [j,x] of [420,960,1500].entries()){text(['EAGLE','EAGLE','COLUMBIA'][j],x,376,20,fg,600,'center');circle(x,482,49,fg,2,.6);line([[x-72,675],[x-70,580],[x-45,546],[x+45,546],[x+70,580],[x+72,675]],fg,2,.6);line([[x,735],[x,820],[960,820]],ac,5,.9,p);text(['ARMSTRONG','ALDRIN','COLLINS'][j],x,719,23,fg,650,'center');}
  text('CREW REPORTS + BIOMEDICAL OBSERVATION',960,897,26,ac,700,'center');text('THE HUMAN PART OF GO.',86,959,50,ac,850);
 }
 const functions=[retro,fido,guidance,control,telmu,gnc,eecom,surgeon];
 const secondFunctions=[retroNext,fidoNext,guidanceNext,controlNext,telmuNext,gncNext,eecomNext,surgeonNext];
 function render(t,s=decisionAt(t)){
  c.clearRect(0,0,W,H);const light=s.index===1||s.index===4||s.index===6;fg=light?INK:BONE;bg=light?BONE:INK;ac=light?'#3f5920':LIME;
  c.save();frame(s,t);if(s.intro)intro(t,s);else if(s.collective)collective(s,t);else {c.save();const k=1+s.hit*.012;c.translate(960,540);c.scale(k,k);c.translate(-960,-540);(s.round===2?secondFunctions:functions)[s.index](s,t);c.restore();impact(s);}c.restore();
 }
 return {canvas,render};
}
