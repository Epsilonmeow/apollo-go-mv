const W=1920,H=1080,INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d',TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p,smooth=v=>{v=clamp(v);return v*v*(3-2*v);},out=v=>1-Math.pow(1-clamp(v),4),fract=v=>v-Math.floor(v);
export function createLandingGraphics(){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');let fg=BONE,bg=INK;
 const text=(s,x,y,size=20,col=fg,weight=500,align='left',alpha=1)=>{c.save();c.globalAlpha=alpha;c.font=`${weight} ${size}px ${size>32?'Archivo':'Consolas'},sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);c.restore();};
 const rect=(x,y,w,h,col=fg,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.fillRect(x,y,w,h);c.restore();};
 const line=(ps,col=fg,w=2,a=1,p=1)=>{if(ps.length<2)return;c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...ps[0]);const n=clamp(p)*(ps.length-1);for(let i=1;i<=Math.floor(n);i++)c.lineTo(...ps[i]);if(n<ps.length-1){const k=Math.floor(n);c.lineTo(mix(ps[k][0],ps[k+1][0],n-k),mix(ps[k][1],ps[k+1][1],n-k));}c.stroke();c.restore();};
 const circle=(x,y,r,col=fg,w=2,a=1)=>{c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.restore();};
 const dot=(x,y,r=4,col=LIME,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();};
 const arrow=(x,y,xx,yy,col=LIME,w=3)=>{line([[x,y],[xx,yy]],col,w);const a=Math.atan2(yy-y,xx-x);line([[xx-12*Math.cos(a-.5),yy-12*Math.sin(a-.5)],[xx,yy],[xx-12*Math.cos(a+.5),yy-12*Math.sin(a+.5)]],col,w);};
 const notes=(rows,x,y,col=fg,a=.75)=>rows.forEach((s,i)=>text(s,x,y+i*26,17,col,500,'left',a));
 function lm(x,y,scale=1,angle=0,col=fg){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);for(const p of [[[-34,-18],[-38,-45],[-18,-64],[22,-64],[38,-42],[34,-18]],[[-40,-18],[40,-18],[48,4],[43,29],[-43,29],[-48,4],[-40,-18]],[[-28,-43],[-13,-54],[-13,-30],[-28,-43]],[[13,-54],[28,-43],[13,-30],[13,-54]],[[-12,29],[-12,40],[-23,57],[23,57],[12,40],[12,29]],[[-43,-5],[-75,57],[-103,78]],[[-36,28],[-75,57],[-80,78]],[[43,-5],[75,57],[103,78]],[[36,28],[75,57],[80,78]],[[-115,80],[-78,80]],[[78,80],[115,80]]])line(p,col,1.5/scale);c.restore();}
 function shade(){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(8,13,18,.64)');g.addColorStop(.25,'rgba(8,13,18,0)');g.addColorStop(.63,'rgba(8,13,18,0)');g.addColorStop(1,'rgba(8,13,18,.8)');c.fillStyle=g;c.fillRect(0,0,W,H);}
 function frame(s){text('APOLLO 11 / EAGLE',80,73,18,fg,650);text(s.world?'POWERED DESCENT → SURFACE':'LUNAR MODULE / GUIDANCE COMPUTER',1840,73,16,fg,500,'right',.67);line([[80,96],[1840,96]],fg,1,.18);for(let j=0;j<9;j++)rect(80+j*15,1005,6,6,j<=Math.floor(s.flightProgress*8)?LIME:fg,j<=Math.floor(s.flightProgress*8)?.85:.22);text(s.name==='landed'?'SURFACE / STAY':s.engineOff>=1?'ENGINE OFF / SURFACE':'OBSERVE / DECIDE / CONTROL',1840,1017,16,fg,500,'right',.65);}
 function heading(a,b,sub){text(a,78,850,76,fg,850);if(b)text(b,78,931,76,LIME,850);if(sub)text(sub,83,975,19,fg,500,'left',.72);}
 function leader(s,key,label,x,y,col=LIME){const a=s.anchors?.[key];if(!a?.visible)return;const xx=a.x*W,yy=a.y*H;if(xx<45||xx>1875||yy<110||yy>960)return;circle(xx,yy,12,col,1,.8);const join=x<xx?x+175:x-25;line([[xx,yy],[join,y+15],[x,y+15]],col,1,.7,out(s.age/.4));text(label,x,y,17,col,550);}
 function bracket(x,y,w,h,col=LIME,a=1){const d=22;for(const [xx,yy,sx,sy]of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])line([[xx+d*sx,yy],[xx,yy],[xx,yy+d*sy]],col,2,a);}
 function go(t,at=155.08,word='GO'){const age=t-at;if(age<0||age>.9)return;const a=1-smooth((age-.35)/.55),x=1838-32*Math.exp(-age*19);rect(x-275,140,275,128,LIME,a);text(word,x-20,247,112,INK,900,'right',a);rect(0,0,W,7,LIME,a);}
 function flightTrace(t,s,x=1490,y=465){circle(x,y,155,fg,1,.2);const path=[[x-122,y-87],[x-46,y-60],[x+12,y-13],[x+91,y+73]];line(path,fg,2,.3);const u=fract((t-144)*.18);const xx=mix(x-110,x+90,u),yy=mix(y-79,y+73,u);lm(xx,yy,.22,-.1,LIME);line([[x-130,y+98],[x+130,y+98]],fg,1,.4);text('DESCENT CONTINUES',x,y+210,19,fg,600,'center');text('NAVIGATION / GUIDANCE / CONTROL',x,y+245,14,fg,500,'center',.65);}
 function alarm(t,s,second=false){
  const a=out(s.age/.16),code=second?'1201':'1202';
  text('PROGRAM ALARM',80,185,32,ORANGE,750);text(code,65,425,246,fg,900);text(second?'VAC AREAS':'CORE SETS',88,478,25,ORANGE,650);text('NO FREE WORKSPACE',88,517,19,fg,500,'left',.7);
  // A visual queue, not a fabricated memory-capacity readout.
  const labels=['NAVIGATION','GUIDANCE','THROTTLE / ATTITUDE','DISPLAY'];
  for(let j=0;j<4;j++){const y=645+j*62;for(let k=0;k<7;k++){const x=90+k*145,arrive=out((s.age-.035*k-.045*j)/.18);rect(x,y,126,34,fg,.08);rect(x,y,126*arrive,34,k>4?ORANGE:fg,(.18+.1*k)*a);line([[x,y+34],[x+126,y+34]],k>4?ORANGE:fg,2,.75);}text(labels[j],90,y-11,15,fg,550);}
  text('NEW WORK ARRIVES.',780,269,53,fg,850);text('OLD WORK HAS NOT FINISHED.',780,330,40,fg,800);notes(['READACCS → SERVICER','EXECUTIVE / JOB SCHEDULING','WAITLIST / TIMED TASKS'],785,387);flightTrace(t,s,1545,640);
  rect(80,950,1760,5,ORANGE,.8);text('CAPACITY EXHAUSTED. FLIGHT IN PROGRESS.',80,917,36,ORANGE,750);
 }
 function restart(t,s,second=false){
  const p=out(s.age/.65);text(second?'STATE SURVIVES.':'RESTART PROTECTION',80,206,78,fg,850);text(second?'NECESSARY WORK RETURNS.':'RECOVER THE WORK THAT MATTERS.',85,259,25,LIME,650);
  const ys=[408,529,650],labels=['NAVIGATION STATE','GUIDANCE PROGRESS','CONTROL OUTPUT'];
  for(let j=0;j<3;j++){const y=ys[j];text(labels[j],85,y-31,18,fg,600);line([[85,y],[505,y],[720,529]],fg,2,.2);line([[85,y],[505,y],[720,529]],LIME,4,.9,second?1:clamp(p*1.7-j*.15));for(let k=0;k<9;k++){const x=90+k*44;rect(x,y+17,26,13,second?LIME:fg,k<6?.6:.18);}dot(505,y,6,LIME);}
  bracket(662,471,116,116,LIME,p);text('RESTART',720,627,18,LIME,650,'center');text('BAILOUT',720,449,16,fg,500,'center',.6);
  const ps=[[778,529],[1035,529],[1035,414],[1335,414],[1335,641],[1660,641]];line(ps,fg,2,.25);line(ps,LIME,6,1,p);for(let j=0;j<5;j++){let q=fract(t*.55+j/5)*(ps.length-1),k=Math.floor(q);dot(mix(ps[k][0],ps[k+1][0],q-k),mix(ps[k][1],ps[k+1][1],q-k),5,LIME,p);}
  text('LATEST NECESSARY JOBS',1040,372,22,fg,650);text('SERVICER',1400,596,36,LIME,800);notes(['NAVIGATE','GUIDE','THROTTLE / ATTITUDE','DISPLAY'],1440,710);
  for(let j=0;j<6;j++){const xx=100+j*76,yy=820+55*p;rect(xx,yy,47*(1-p),6,ORANGE,.8*(1-p));}text('UNFINISHED OLD INSTANCES',85,811,16,ORANGE,500,'left',1-p*.65);text('CONTINUE FROM PROTECTED PROGRESS',85,939,42,fg,800);
 }
 function control(t,s){
  fg=INK;bg=BONE;rect(0,0,W,H,bg);frame(s);text('P66',77,249,141,fg,900);text('DESCENT RATE CONTROL',86,296,21,fg,600);
  const p=out(s.age/.6);text('PILOT',90,459,55,fg,850);notes(['ATTITUDE','DESIRED DESCENT RATE'],93,505,fg,.7);text('COMPUTER',715,459,55,fg,850);notes(['MEASURED MOTION','THROTTLE COMMAND'],718,505,fg,.7);text('VEHICLE',1390,459,55,fg,850);notes(['THRUST','CHANGING VELOCITY'],1393,505,fg,.7);
  arrow(302,430,650,430,fg,5);arrow(1090,430,1322,430,fg,5);line([[1593,566],[1593,744],[935,744],[935,566]],fg,3,.7,p);text('MEASURE → COMPARE → CORRECT',1220,790,23,fg,650,'center');
  lm(398,755,.92,-.17,fg);arrow(398,812,360,620,ORANGE,5);arrow(410,748,590,748,fg,3);text('ATTITUDE CHANGES ACCELERATION',87,955,44,fg,800);text('a_z = (T/m) cos θ − g_Moon',88,348,19,fg,500,'left',.65);text('HORIZONTAL MOTION / VERTICAL MOTION',1390,865,17,fg,500,'center',.7);if(t>=160.40){const a=out((t-160.40)/.15);rect(1130,145,710,100,INK,a);text('IF NO RECURRENCE → GO',1810,210,34,LIME,750,'right',a);}
 }
 function render(t,s){
  c.clearRect(0,0,W,H);fg=BONE;bg=INK;
  if(!s.world)rect(0,0,W,H,bg);else shade();frame(s);
  if(s.name==='forward'){heading('THE SURFACE','IS NO LONGER ABSTRACT.','RANGE CLOSES / TERRAIN RESOLVES');notes(['TRAJECTORY → TERRAIN','COMPUTED TARGET → VISIBLE GROUND'],82,156);}
  else if(s.name==='look'){
   const cx=965,cy=520;line([[cx-180,cy],[cx-40,cy]],fg,1,.45);line([[cx+40,cy],[cx+180,cy]],fg,1,.45);line([[cx,cy-130],[cx,cy-30]],fg,1,.45);line([[cx,cy+30],[cx,cy+130]],fg,1,.45);
   for(let i=-4;i<=4;i++){line([[1205,350+i*40],[1205+(i%2?14:25),350+i*40]],fg,1,.7);}notes(['WINDOW / LANDING POINT', 'GUIDANCE MARKS A TARGET.', 'THE CREW READS THE TERRAIN.'],81,157);heading('LOOK.','CHOOSE.','RANGE / SLOPE / ROCKS / SHADOWS');
  }
  else if(s.name==='rough'){heading('A TARGET','IS NOT YET A LANDING SITE.','ROCKS / CRATER RIM / LOCAL SLOPE');leader(s,'hazard','ROUGH GROUND',1290,295,ORANGE);notes(['VISUAL ASSESSMENT','CONTINUE FORWARD'],83,161);}
  else if(s.name==='across'){heading('KEEP MOVING.','CLEAR THE ROUGH GROUND.','LESS BRAKING → FORWARD MOTION REMAINS');leader(s,'target','OPEN GROUND',1340,278);notes(['ATTITUDE → THRUST DIRECTION','ACCELERATION → VELOCITY'],83,163);}
  else if(s.name==='alarm-1202')alarm(t,s);
  else if(s.name==='restart')restart(t,s);
  else if(s.name==='continue'){heading('THE COMPUTER RECOVERS.','THE FLIGHT CONTINUES.','PROTECTED STATE / NECESSARY WORK / CONTINUED CONTROL');go(t);if(t>=156.30)text('GO ON THAT ALARM?',1838,208,35,fg,750,'right',out((t-156.30)/.18));}
  else if(s.name==='crew'){heading('EYES ON THE GROUND.','HANDS ON THE FLIGHT.','ARMSTRONG / TERRAIN & ATTITUDE · ALDRIN / HEIGHT & RATES');for(let j=0;j<7;j++)line([[1480+j*42,743],[1480+j*42,743+(j%3?12:22)]],fg,1,.5);text('FIXED TERRAIN / RELATIVE MOTION',1837,792,16,fg,500,'right',.7);}
  else if(s.name==='control')control(t,s);
  else if(s.name==='drift'){heading('TAKE OUT','THE FORWARD MOTION.','TILT → HORIZONTAL DECELERATION');leader(s,'velocity','DRIFT',1290,280);notes(['VERTICAL RATE ≠ HORIZONTAL SPEED','ONE APPROACH / TWO COMPONENTS'],84,162);}
  else if(s.name==='alarm-1201')alarm(t,s,true);
  else if(s.name==='protected')restart(t,s,true);
  else if(s.name==='committed'){heading('GO.','STAY WITH THE DESCENT.','NECESSARY WORK CONTINUES');go(t,167.02);}
  else if(s.name==='probe'){
   text('CONTACT',80,213,92,LIME,900);text('PROBE → SIGNAL',86,262,23,fg,550);leader(s,'probe','FIRST CONTACT',1305,700);notes(['THREE CONTACT PROBES','FEET STILL ABOVE THE SURFACE'],85,905);go(t,168.20);
  }
  else if(s.name==='load'){
   const down=t>=170;text(down?'LOAD':'SETTLE',80,213,92,fg,900);text('FOOTPAD → SURFACE',86,262,23,LIME,550);leader(s,'footpad',down?'WEIGHT TRANSFERS':'CLOSING THE GAP',1305,700);notes(down?['DESCENT ENDS','LANDING GEAR TAKES THE LOAD']:['CONTROLLED DESCENT','APPROACHING FOOTPAD CONTACT'],85,905);
  }
  else if(s.name==='shutdown'){
   text('SHUTDOWN',79,219,102,fg,900);const p=out(s.age/.4);line([[86,277],[660,277]],fg,3,.3);line([[86,277],[660-574*p,277]],ORANGE,6,.9);notes(['DESCENT ENGINE / OFF','THRUST CEASES','SURFACE DUST CLEARS'],85,863);text('FROM POWERED FLIGHT TO REST',1840,942,22,LIME,600,'right');
  }
  else if(s.name==='still'){text('STILL.',79,220,118,fg,900);notes(['NO FORWARD TRAVEL','NO FURTHER DESCENT','FOOTPRINT / SHADOW / SURFACE'],85,860);text('MOTION HAS BECOME A PLACE.',1840,942,30,LIME,750,'right');}
  else if(s.name==='houston'){text('HOUSTON,',79,218,104,fg,900);line([[86,272],[620,272]],LIME,3,.9,out(s.age/.55));text('EAGLE → CAPCOM → EARTH',86,318,18,fg,500,'left',.7);}
  else if(s.name==='base'){text('TRANQUILITY',79,199,91,fg,850);text('BASE HERE.',80,294,91,fg,850);text('A DESTINATION BECOMES A PLACE.',85,950,28,LIME,650);}
  else if(s.name==='landed'){
   const a=out(s.age/.2);text('THE EAGLE',78,197,91,fg,850,'left',a);text('HAS LANDED.',78,300,105,LIME,900,'left',a);line([[85,353],[690,353]],LIME,3,.8,out(s.age/.6));text('SEA OF TRANQUILITY / 20 JULY 1969',86,397,18,fg,500,'left',.8*a);text('HUMANITY HAS ARRIVED.',1840,949,32,fg,700,'right',smooth((s.age-.55)/1.5));
  }
 }
 return{canvas,render};
}
