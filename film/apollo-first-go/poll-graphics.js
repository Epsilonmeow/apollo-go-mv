// Eight judgments, eight different geometric consequences. The caller owns timing.
const W=1920,H=1080,TAU=Math.PI*2;
const INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d';
const ROLES=['RETRO','FIDO','GUIDANCE','CONTROL','TELMU','GNC','EECOM','SURGEON'];
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,p)=>a+(b-a)*p;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-Math.pow(1-clamp(x),3);
const frac=x=>x-Math.floor(x);
const DEFAULT_CUES=ROLES.map((role,i)=>({role,call:72+i*1.8,go:72.58+i*1.8,end:73.8+i*1.8}));

export function createPollGraphics(){
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const c=canvas.getContext('2d');let fg=BONE,bg=INK,ac=LIME;
  function line(x,y,u,v,w=2,col=fg,alpha=1){c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();c.restore();}
  function path(ps,w=2,col=fg,amount=1,alpha=1){
    let total=0;const ds=[];for(let i=1;i<ps.length;i++){const d=Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]);ds.push(d);total+=d;}
    let remain=total*clamp(amount);c.save();c.strokeStyle=col;c.lineWidth=w;c.globalAlpha=alpha;c.beginPath();c.moveTo(...ps[0]);
    for(let i=1;i<ps.length&&remain>0;i++){const q=Math.min(1,remain/(ds[i-1]||1));c.lineTo(mix(ps[i-1][0],ps[i][0],q),mix(ps[i-1][1],ps[i][1],q));remain-=ds[i-1];}
    c.stroke();c.restore();
  }
  function rect(x,y,w,h,col=fg,alpha=1){c.save();c.globalAlpha=alpha;c.fillStyle=col;c.fillRect(x,y,w,h);c.restore();}
  function text(s,x,y,size=20,col=fg,weight=500,align='left',alpha=1){c.save();c.font=`${weight} ${size}px ${size>34?'Archivo, sans-serif':'Consolas, monospace'}`;c.textAlign=align;c.fillStyle=col;c.globalAlpha=alpha;c.fillText(s,x,y);c.restore();}
  function arc(x,y,r,a=0,b=TAU,w=2,col=fg,alpha=1){c.save();c.globalAlpha=alpha;c.lineWidth=w;c.strokeStyle=col;c.beginPath();c.arc(x,y,r,a,b);c.stroke();c.restore();}
  function dot(x,y,r=5,col=ac,alpha=1){c.save();c.globalAlpha=alpha;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
  function cross(x,y,r=13,col=fg,w=2){line(x-r,y,x+r,y,w,col);line(x,y-r,x,y+r,w,col);}
  function arrow(x,y,u,v,col=ac,w=4,head=15){line(x,y,u,v,w,col);const a=Math.atan2(v-y,u-x);line(u,v,u-head*Math.cos(a-.43),v-head*Math.sin(a-.43),w,col);line(u,v,u-head*Math.cos(a+.43),v-head*Math.sin(a+.43),w,col);}
  function poly(ps,fill=bg,col=fg,w=2){c.beginPath();c.moveTo(...ps[0]);for(const p of ps.slice(1))c.lineTo(...p);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(col){c.strokeStyle=col;c.lineWidth=w;c.stroke();}}
  function notes(list,x,y,col=fg,step=25,alpha=.72){list.forEach((s,i)=>text(s,x,y+i*step,16,col,400,'left',alpha));}
  function brackets(x,y,w,h,col=ac,amount=1){const d=19*amount;for(const [xx,yy,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){line(xx,yy,xx+sx*d,yy,4,col);line(xx,yy,xx,yy+sy*d,4,col);}}
  function check(x,y,p=1,col=ac,size=20){path([[x-size*.65,y],[x-size*.12,y+size*.5],[x+size,y-size*.75]],4,col,p);}
  function leader(label,x,y,u,v,col=fg){path([[x,y],[x+24,y],[u,v]],1,col,1,.6);text(label,x,y-10,15,col);}
  function bead(ps,s,col=ac,r=5){let n=frac(s)*(ps.length-1),i=Math.floor(n),q=n-i;dot(mix(ps[i][0],ps[i+1][0],q),mix(ps[i][1],ps[i+1][1],q),r,col);}
  function ticks(x,y,len,step=20,col=fg){for(let j=0;j<=len;j+=step)line(x+j,y,x+j,y+(j%(step*5)===0?10:4),1,col,.35);}

  function icon(i,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);
    if(i===0){path([[-18,14],[0,0],[17,-15]],2,col);path([[0,0],[18,14]],2,col);}
    else if(i===1){arc(0,0,14,0,TAU,2,col);dot(0,0,3,col);line(-23,0,23,0,1,col);}
    else if(i===2){arrow(-18,17,17,-17,col,2,8);line(-18,-9,17,-17,1,col);}
    else if(i===3){poly([[-10,-15],[10,-15],[16,12],[-16,12]],null,col,2);line(0,-25,0,24,1,col);}
    else if(i===4){for(let j=0;j<3;j++)arc((j-1)*13,0,10,0,TAU,1.7,col);}
    else if(i===5){poly([[-16,-9],[2,-19],[19,-9],[1,1]],null,col,1.7);path([[-16,-9],[-16,12],[1,22],[19,11],[19,-9]],1.7,col);line(1,1,1,22,1.7,col);}
    else if(i===6){for(let j=-1;j<=1;j++)line(j*10,-17,j*10,17,2,col);line(-26,0,-12,0,2,col);line(12,0,26,0,2,col);}
    else{for(let j=-1;j<=1;j++){arc(j*15,-7,5,0,TAU,1.5,col);path([[j*15-7,12],[j*15-7,5],[j*15+7,5],[j*15+7,12]],1.5,col);}}
    c.restore();
  }
  function trace(cues,t,active){
    rect(0,944,W,136,bg,.96);line(80,944,1840,944,1,fg,.21);
    const start=118,step=211;
    for(let i=0;i<8;i++){
      const cue=cues.find(q=>q.role===ROLES[i]),done=cue&&t>=cue.go;
      const p=done?out((t-cue.go)/.35):0,x=start+i*step;
      if(i<7)line(x+31,987,x+step-31,987,1,done?ac:fg,done?.55:.12);
      icon(i,x,987,.65+p*.17,done?ac:fg);
      text(ROLES[i],x,1034,16,done?ac:fg,done?700:400,'center',done?1:.33);
      if(active===i)rect(x-34,1050,68,3,ac);
      if(done)dot(x+26,971,3,ac);
    }
    text('DECISIONS → FLIGHT',1840,1063,12,fg,400,'right',.5);
  }
  function heading(role,body){
    text(role,78,126,89,fg,850);text(body,83,172,17,fg,500,'left',.65);
    line(80,201,1840,201,1,fg,.25);text('MISSION CONTROL',1470,88,16,fg,500,'right',.65);
  }
  function stamp(dt){
    if(dt<0||dt>.48)return;
    const p=out(dt/.14),a=1-smooth((dt-.3)/.18);
    c.save();c.translate(1790,159);c.scale(1+.28*(1-p),1+.28*(1-p));
    rect(-210,-132,228,142,ac,a);text('GO',-2,-5,139,INK,900,'right',a);c.restore();
  }
  function outcome(s,x,y,p,col=ac,size=61){if(p<=0)return;c.save();c.beginPath();c.rect(x,y-size-8,1650*p,size+20);c.clip();text(s,x,y,size,col,850);c.restore();}

  function retro(a,p,t){
    heading('RETRO','CONTINGENCY / A RETURN PATH REMAINS AVAILABLE');
    const cx=350,cy=1080;arc(cx,cy,420,3.3,6.12,2,fg,.44);arc(cx,cy,438,3.3,6.12,1,fg,.18);
    const incoming=[[100,678],[310,573],[520,495],[740,435],[970,402]];
    const descent=[[970,402],[1130,435],[1285,508],[1430,622],[1570,777]];
    const abort=[[970,402],[1110,334],[1280,303],[1470,330],[1735,442]];
    path(incoming,6,fg,out(a*3));c.setLineDash([9,14]);path(abort,3,fg,1,.35);c.setLineDash([]);
    path(descent,3,fg,1,.22);path(abort,3,ac,p,.83);path(descent,9,ac,p);
    dot(970,402,12,fg);arc(970,402,25,0,TAU,1,fg,.5);
    for(let j=0;j<7;j++){const f=j/6;line(1130+f*420,435+f*320,1148+f*420,425+f*320,1,fg,.4);}
    if(p){bead(descent,.03+p*.7,ac,10);check(1755,440,p,ac,17);}
    text('ABORT OPTION',1440,278,20,fg,650);text('POWERED DESCENT',1190,728,21,ac,650);
    leader('DECISION POINT',705,347,970,402);notes(['RETURN TRAJECTORY','BURN DIRECTION','ENGINE AVAILABILITY','ABORT / CONTINUE'],83,291);
    notes(['THE ROUTE FORWARD','THE OPTION TO RETURN'],1520,548);ticks(83,850,550);
    outcome('A WAY BACK. A WAY FORWARD.',83,907,p,ac,59);
  }
  function fido(a,p,t){
    heading('FIDO','OBSERVATION / PREDICTION / CORRIDOR');
    c.save();c.translate(160,725);c.rotate(-.11);
    const center=[];for(let i=0;i<=120;i++){const u=i/120;center.push([u*1540,-280*Math.sin(u*1.75)]);}
    const spread=mix(128,23,p);
    for(let j=-3;j<=3;j++){const ps=center.map(([x,y],k)=>[x,y+j*spread/3*(.4+k/120*.6)]);path(ps,j===0?5:1,j===0?ac:fg,1,j===0?1:.22);}
    for(let j=0;j<16;j++){
      const u=j/18,x=u*1540,base=-280*Math.sin(u*1.75),off=(Math.sin(j*2.4)*70+Math.cos(j*.8)*50)*(1-p);
      line(x,base+off,x,base,1,fg,.45);cross(x,base+off,7,fg,1);dot(x,base,3,ac,p);
    }
    const tip=center[98];brackets(tip[0]-44,tip[1]-44,88,88,ac,p);arrow(tip[0],tip[1],tip[0]+160,tip[1]-32,ac,5);
    text('OBSERVED STATE',120,-137,16,fg);text('PROPAGATED STATE',1000,-370,16,fg);text('PREDICTED CORRIDOR',1010,-173,18,ac,600);
    ticks(0,100,1510);c.restore();
    notes(['POSITION / VELOCITY','TRACKING UPDATES','CONSISTENT FLIGHT PATH'],85,285);text('r, v',1500,390,116,fg,700);
    outcome('THE TRACK AGREES.',85,905,p,ac,69);
  }
  function guidance(a,p,t){
    heading('GUIDANCE','THE ERROR BECOMES A CORRECTION');
    const end=[1290,500];
    for(let row=0;row<7;row++)for(let col=0;col<12;col++){
      const x=90+col*83,y=315+row*70,dx=(end[0]-x)*.055,dy=(end[1]-y)*.055;
      arrow(x,y,x+dx*(1-p*.78),y+dy*(1-p*.78),fg,1,5);
    }
    const ox=1000,oy=645,target=[1520,371],old=[mix(1390,1520,p),mix(595,371,p)];
    arrow(ox,oy,...target,fg,2,15);arrow(ox,oy,...old,ac,8,21);
    line(...old,...target,4,ORANGE);arc(...target,47,0,TAU,2,fg,.5);cross(...target,18,fg,2);
    if(p>.25){const d=out((p-.25)/.75);arrow(ox,oy,ox-195*d,oy+169*d,ac,8,21);}
    text('STATE ESTIMATE',1330,700,17,ac,500);leader('RESIDUAL',1560,540,...old,ORANGE);
    notes(['MEASURED − PREDICTED','INERTIAL ALIGNMENT','STATE VECTOR CHECK','GUIDANCE COMPUTER'],90,827,fg,24,.68);
    text('STEERING VECTOR',1130,824,44,ac,800);text('Δr → a',1160,900,56,fg,650);
  }
  function control(a,p,t){
    heading('CONTROL','LUNAR MODULE / THE COMMAND BECOMES ATTITUDE');
    const x=1030,y=571,angle=mix(-.57,0,p),r=270;
    c.setLineDash([8,12]);line(x,270,x,885,2,fg,.4);c.setLineDash([]);
    for(let j=0;j<37;j++){const aa=Math.PI+j*Math.PI/36;line(x+Math.cos(aa)*r,y+Math.sin(aa)*r,x+Math.cos(aa)*(r-(j%6===0?17:7)),y+Math.sin(aa)*(r-(j%6===0?17:7)),1,fg,.5);}
    c.save();c.translate(x,y);c.rotate(angle);
    poly([[-100,-160],[100,-160],[126,-60],[84,30],[-84,30],[-126,-60]],bg,fg,4);
    for(let j=-3;j<=3;j++)line(j*22,-145,j*25,-70,1,fg,.35);
    poly([[-38,32],[-78,131],[78,131],[38,32]],bg,fg,4);arc(0,22,14,0,TAU,3,ac);
    arrow(0,230,0,-235,ac,8,23);line(-140,0,140,0,2,fg,.5);
    c.restore();
    brackets(x-153,y-202,306,369,ac,p);if(p>.6){check(x+186,y-160,out((p-.6)/.4),ac,30);}
    const torque=(1-p)*80;arrow(x-325,y+155,x-325+torque,y+155-torque,ORANGE,4);
    notes(['EAGLE / LM','ENGINE GIMBAL','REACTION JETS','ATTITUDE ERROR','THRUST DIRECTION'],85,306);
    notes(['COMMANDED AXIS','BODY AXIS','ROTATION SETTLES'],1480,459);text('τ = r × F',1430,650,42,fg,600);
    outcome('ALIGN. HOLD.',85,908,p,ac,87);
  }
  function telmu(a,p,t){
    heading('TELMU','LUNAR MODULE / THREE INDEPENDENT SYSTEMS');
    const rows=[{x:420,y:525,name:'OXYGEN',sub:'SUPPLY → CABIN',col:fg},{x:965,y:525,name:'COOLING',sub:'WATER / GLYCOL',col:ORANGE},{x:1510,y:525,name:'POWER',sub:'BATTERY → DC BUS',col:ac}];
    for(let i=0;i<3;i++){
      const z=rows[i],v=out(clamp(p*1.45-i*.16)),r=mix(175,145,p);
      arc(z.x,z.y,r,.13,TAU-.13,4,z.col);line(z.x+r*Math.cos(.13),z.y-r*Math.sin(.13),z.x+r*Math.cos(.13)+mix(45,0,v),z.y+r*Math.sin(.13)*mix(-1,1,v),5,z.col);
      for(let j=0;j<16;j++){const aa=j/16*TAU;line(z.x+Math.cos(aa)*(r+20),z.y+Math.sin(aa)*(r+20),z.x+Math.cos(aa)*(r+27),z.y+Math.sin(aa)*(r+27),1,z.col,.45);}
      text(z.name,z.x,z.y+15,39,z.col,800,'center');text(z.sub,z.x+(i===1?0:20),723,17,fg,500,i===1?'center':'left');
      if(i===0){arc(z.x-58,z.y+90,10,0,TAU,2,z.col);arc(z.x-40,z.y+90,10,0,TAU,2,z.col);}
      if(i===1){for(let j=0;j<4;j++)path([[z.x-65+j*35,z.y+55],[z.x-80+j*35,z.y+80],[z.x-63+j*35,z.y+108]],2,z.col);}
      if(i===2){for(let j=0;j<3;j++){line(z.x-65+j*45,z.y+63,z.x-65+j*45,z.y+108,3,z.col);line(z.x-51+j*45,z.y+75,z.x-51+j*45,z.y+95,2,z.col);}}
      const aa=t*1.9-i*.8;dot(z.x+Math.cos(aa)*r,z.y+Math.sin(aa)*r,6,z.col,v);
      const route=i===0?[[z.x,700],[z.x,810],[785,810]]:i===1?[[z.x+115,650],[z.x+210,700],[z.x+210,754],[1000,754],[1000,775]]:[[z.x,700],[z.x,810],[1135,810]];
      path(route,4,z.col,v);if(v>.5)bead(route,t*.65,z.col,6);
    }
    const join=out(clamp((p-.12)/.7));
    if(join>0){brackets(785,775,350,70,ac,join);text('CABIN / CREW',960,820,31,ac,800,'center',join);}
    notes(['CABIN PRESSURE','REGULATION'],259,287);notes(['HEAT EXCHANGE','CIRCULATION'],804,287);notes(['ELECTRICAL LOAD','DISTRIBUTION'],1349,287);
    outcome('ONE CABIN. SUSTAINED.',85,911,p,ac,61);
  }
  function gnc(a,p,t){
    heading('GNC','COMMAND / SERVICE MODULE / A STABLE REFERENCE');
    const yaw=mix(.75,0,p),pitch=mix(-.34,.12,p);
    const project=(x,y,z)=>{const xx=x*Math.cos(yaw)-z*Math.sin(yaw),zz=x*Math.sin(yaw)+z*Math.cos(yaw),yy=y*Math.cos(pitch)-zz*Math.sin(pitch);return[1140+xx+zz*.38,578+yy-zz*.24];};
    const vertices=[];for(const x of [-160,160])for(const y of [-160,160])for(const z of [-160,160])vertices.push([x,y,z]);
    for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if(vertices[i].filter((v,k)=>v!==vertices[j][k]).length===1)line(...project(...vertices[i]),...project(...vertices[j]),2,fg,.7);
    for(const [i,xyz] of [[0,[380,0,0]],[1,[0,-325,0]],[2,[0,0,330]]]){const end=project(...xyz);arrow(1140,578,...end,ac,4,14);text(['X','Y','Z'][i],end[0]+14,end[1]-10,22,ac,700);}
    c.setLineDash([5,8]);path([[780,695],[1140,578],[1530,476]],2,fg,1,.35);c.setLineDash([]);
    for(let j=0;j<5;j++){const err=(1-p)*55;line(1740,355+j*80,1740-err*(j%2?1:-1),355+j*80,7,ORANGE);dot(1740,355+j*80,3,fg);}
    brackets(875,316,535,500,ac,p);text('BODY FRAME',1160,847,20,ac,700,'center');text('RATE DAMPING',1695,793,16,fg,500,'center');
    notes(['COLUMBIA / CSM','INERTIAL PLATFORM','ATTITUDE REFERENCE','SERVICE PROPULSION','REACTION CONTROL'],85,300);text('R · v',90,641,121,fg,700);
    outcome('A FRAME THAT HOLDS.',85,911,p,ac,64);
  }
  function eecom(a,p,t){
    heading('EECOM','COMMAND / SERVICE MODULE / ENERGY CONVERSION');
    const x=915,y=537;
    const feeds=[[[120,363],[380,363],[550,455],[770,455]],[[120,716],[380,716],[550,620],[770,620]]];
    const outputs=[[[1060,457],[1230,457],[1360,332],[1730,332]],[[1060,535],[1330,535],[1730,535]],[[1060,615],[1230,615],[1360,749],[1730,749]]];
    for(let k=0;k<2;k++){path(feeds[k],5,fg,1,.65);text(k?'O₂':'H₂',120,k?669:321,84,fg,800);for(let j=0;j<5;j++)bead(feeds[k],t*.45+j/5,fg,5);}
    for(let j=0;j<12;j++){const xx=780+j*23;rect(xx,388,9,294,j%2?fg:ac,.65);line(xx,380,xx+20,360,1,fg,.5);}
    for(let k=0;k<3;k++){
      const col=[ac,fg,ORANGE][k];path(outputs[k],k===0?8:4,col,p);
      if(p)for(let j=0;j<5;j++)bead(outputs[k],t*(.7+k*.13)+j/5,col,5);
      text(['ELECTRICAL POWER','WATER','HEAT'][k],1730,[290,492,706][k],26,col,700,'right');check(1770,[332,535,749][k],p,col,18);
    }
    text('FUEL CELL',x,735,26,fg,700,'center');text('2H₂ + O₂ → 2H₂O',x,785,23,fg,500,'center');
    notes(['REACTANT SUPPLY','ELECTROCHEMICAL CONVERSION'],120,837);notes(['LOAD / SUPPLY','CONSUMABLES','ENVIRONMENT'],1460,853,fg,23);
    outcome('THE BALANCE CLOSES.',680,910,p,ac,60);
  }
  function surgeon(a,p,t){
    heading('SURGEON','THREE PEOPLE / THE CONDITION TO CONTINUE');
    const crew=[{x:400,name:'ARMSTRONG',craft:'EAGLE',role:'COMMANDER'},{x:960,name:'ALDRIN',craft:'EAGLE',role:'LUNAR MODULE PILOT'},{x:1520,name:'COLLINS',craft:'COLUMBIA',role:'COMMAND MODULE PILOT'}];
    for(let j=0;j<3;j++){
      const z=crew[j],v=out(clamp(p*1.6-j*.2)),y=430;
      arc(z.x,y,67,0,TAU,3,fg);path([[z.x-153,y+208],[z.x-138,y+136],[z.x-83,y+109],[z.x-44,y+94]],3,fg);path([[z.x+44,y+94],[z.x+83,y+109],[z.x+138,y+136],[z.x+153,y+208]],3,fg);
      path([[z.x-42,y+32],[z.x-39,y+75],[z.x,y+95],[z.x+39,y+75],[z.x+42,y+32]],2,fg,1,.35);
      const ps=[];for(let k=0;k<=100;k++){const u=k/100;const pulse=Math.exp(-Math.pow((u-.48)/.055,2))*-44+Math.exp(-Math.pow((u-.54)/.035,2))*23;ps.push([z.x-170+u*340,682+pulse]);}
      path(ps,2,fg,1,.36);path(ps,3,ac,v);brackets(z.x-188,335,376,396,ac,v);check(z.x+160,370,v,ac,19);
      text(z.name,z.x,285,33,fg,800,'center');text(z.role,z.x,774,15,fg,500,'center');text(z.craft,z.x,809,17,ac,650,'center');
      text('CREW CONDITION',z.x,853,14,fg,500,'center',.65);
    }
    outcome('PEOPLE. READY.',85,915,p,ac,61);
  }

  function converge(cues,t,p,transparent){
    if(transparent)c.clearRect(0,0,W,H);
    else{c.fillStyle=INK;c.fillRect(0,0,W,H);}
    fg=BONE;bg=INK;ac=LIME;
    const flight=[800,510],capcom=[1180,510],eagle=[1610,510];
    for(let i=0;i<8;i++){
      const y=250+i*75,x=145;icon(i,x,y,.8,ac);text(ROLES[i],x+50,y+6,18,fg,650);
      const ps=[[360,y],[460+i*17,y],[610+i*13,510],[flight[0]-60,510]];
      path(ps,1.5,fg,1,.34);path(ps,2.5,ac,p,.85);
    }
    for(const [name,[x,y],r] of [['FLIGHT',flight,58],['CAPCOM',capcom,42],['EAGLE',eagle,52]]){
      arc(x,y,r,0,TAU,3,ac);text(name,x,y+110,24,fg,800,'center');cross(x,y,12,ac,2);
    }
    arrow(flight[0]+64,510,capcom[0]-48,510,ac,5,17);arrow(capcom[0]+48,510,eagle[0]-59,510,ac,5,17);
    notes(['COLLECTIVE JUDGMENT','FLIGHT DIRECTOR'],730,721);notes(['VOICE TO THE CREW','CAPSULE COMMUNICATOR'],1090,721);notes(['CLEARANCE RECEIVED','POWERED DESCENT'],1510,721);
    outcome('ONE DECISION. FORWARD.',675,884,p,ac,65);
  }

  const painters=[retro,fido,guidance,control,telmu,gnc,eecom,surgeon];
  function render(raw,opts={}){
    const t=Number(raw)||0;
    const supplied=Array.isArray(opts.cues)&&opts.cues.length?opts.cues:DEFAULT_CUES;
    const cues=supplied.map((q,i)=>({role:String(q.role||ROLES[i]||'').toUpperCase(),call:Number(q.call),go:Number(q.go),end:Number(q.end)})).filter(q=>Number.isFinite(q.call)&&Number.isFinite(q.go)).sort((a,b)=>a.call-b.call);
    for(let i=0;i<cues.length;i++)if(!Number.isFinite(cues[i].end))cues[i].end=cues[i+1]?.call??cues[i].go+.8;
    const last=cues[cues.length-1],completed=cues.filter(q=>t>=q.go).length;
    let current=cues[0];for(const cue of cues)if(t>=cue.call)current=cue;
    const index=Math.max(0,ROLES.indexOf(current.role));
    const collective=typeof opts.collective==='number'?clamp(opts.collective):opts.collective===true?1:t>=last.end?smooth((t-last.end)/.8):0;
    if(collective>0||t>=last.end){converge(cues,t,collective,!!opts.transparent);return{stage:'collective-clearance',progress:collective,completed};}
    const light=index===1||index===6;
    fg=light?INK:BONE;bg=light?BONE:INK;ac=light?'#38551c':LIME;
    c.globalAlpha=1;c.setTransform(1,0,0,1,0,0);c.fillStyle=bg;c.fillRect(0,0,W,H);
    const a=clamp((t-current.call)/Math.max(.1,current.go-current.call));
    const p=t>=current.go?out((t-current.go)/Math.max(.22,Math.min(.65,current.end-current.go))):0;
    // A GO first changes the diagram; typography is a short consequence of that hit.
    c.save();painters[index](a,p,t);c.restore();
    trace(cues,t,index);stamp(t-current.go);
    return{stage:current.role.toLowerCase(),progress:p,completed};
  }
  return{canvas,render};
}
