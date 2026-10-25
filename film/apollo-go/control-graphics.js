// Deterministic, authored control-room graphics. All curves and diagrams are
// symbolic relationships; no invented telemetry is presented as flight data.
const W=1920,H=1080,TAU=Math.PI*2;
const INK='#080d12',BONE='#eeeadd',LIME='#c6f16a',ORANGE='#f86b3d';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,q)=>a+(b-a)*q;
const frac=x=>x-Math.floor(x);
const ease=x=>1-Math.pow(1-clamp(x),3);
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const roles=['RETRO','FIDO','GUIDANCE','CONTROL','TELMU','GNC','EECOM','SURGEON'];

export function createControlGraphics(){
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const c=canvas.getContext('2d');
  let fg=BONE,bg=INK,accent=LIME,showGo=true;
  const line=(x,y,u,v,w=2,col=fg,alpha=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=col;c.lineWidth=w;c.globalAlpha=alpha;c.stroke();c.globalAlpha=1;};
  function path(points,w=2,col=fg,amount=1,alpha=1){
    let total=0;const ds=[];
    for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);ds.push(d);total+=d;}
    let remain=total*clamp(amount),last=points[0];c.beginPath();c.moveTo(...last);
    for(let i=1;i<points.length&&remain>0;i++){const a=points[i-1],b=points[i],q=Math.min(1,remain/ds[i-1]);last=[mix(a[0],b[0],q),mix(a[1],b[1],q)];c.lineTo(...last);remain-=ds[i-1];}
    c.strokeStyle=col;c.lineWidth=w;c.globalAlpha=alpha;c.stroke();c.globalAlpha=1;return last;
  }
  function arc(x,y,r,a,b,w=2,col=fg,alpha=1){c.beginPath();c.arc(x,y,r,a,b);c.strokeStyle=col;c.lineWidth=w;c.globalAlpha=alpha;c.stroke();c.globalAlpha=1;}
  function disc(x,y,r,col=fg,alpha=1){c.fillStyle=col;c.globalAlpha=alpha;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.globalAlpha=1;}
  function rect(x,y,w,h,col=fg,alpha=1){c.globalAlpha=alpha;c.fillStyle=col;c.fillRect(x,y,w,h);c.globalAlpha=1;}
  function txt(s,x,y,size=20,col=fg,weight=500,align='left',alpha=1){c.font=`${weight} ${size}px ${size>36?'Archivo, sans-serif':'Consolas, "Courier New", monospace'}`;c.textAlign=align;c.fillStyle=col;c.globalAlpha=alpha;c.fillText(s,x,y);c.globalAlpha=1;}
  function notes(list,x,y,col=fg,step=23,alpha=.7){list.forEach((s,i)=>txt(s,x,y+i*step,15,col,400,'left',alpha));}
  function arrow(x,y,u,v,col=accent,w=3,head=14){line(x,y,u,v,w,col);const a=Math.atan2(v-y,u-x);line(u,v,u-head*Math.cos(a-.5),v-head*Math.sin(a-.5),w,col);line(u,v,u-head*Math.cos(a+.5),v-head*Math.sin(a+.5),w,col);}
  function cross(x,y,r=9,col=fg,w=1){line(x-r,y,x+r,y,w,col);line(x,y-r,x,y+r,w,col);}
  function polygon(ps,col=fg,fill=null,w=2){c.beginPath();c.moveTo(...ps[0]);for(const p of ps.slice(1))c.lineTo(...p);c.closePath();if(fill){c.fillStyle=fill;c.fill();}c.strokeStyle=col;c.lineWidth=w;c.stroke();}
  function ruler(x,y,len,angle=0,col=fg){c.save();c.translate(x,y);c.rotate(angle);for(let k=0;k<=len;k+=18)line(k,0,k,k%90===0?13:5,1,col,.6);c.restore();}
  function monoStack(list,x,y,q,col=fg){for(let i=0;i<list.length;i++){const a=clamp((q-.025*i)*6);txt(list[i],x+18*(1-a),y+i*22,15,col,400,'left',a*.72);}}
  function stamp(q,x=1530,y=875,size=208){
    if(!showGo)return;
    const p=clamp((q-.67)/.14);if(!p)return;
    c.save();c.translate(x,y);c.rotate(-.065*(1-ease(p)));c.scale(1+.3*(1-ease(p)),1+.3*(1-ease(p)));txt('GO',0,0,size,accent,900,'center');
    rect(-size*.77,22,size*1.54,6,accent);txt('FLIGHT READINESS',0,55,15,fg,500,'center',p);c.restore();
  }
  function roleTitle(role,q,x,y,size=160,align='left'){
    const p=ease(q/.2);c.save();c.beginPath();c.rect(0,0,W,H);c.clip();txt(role,x+(1-p)*110,y,size,fg,850,align);c.restore();
  }
  function bead(points,s,col=accent,r=6){
    const n=points.length-1,p=frac(s)*n,i=Math.floor(p),q=p-i;disc(mix(points[i][0],points[i+1][0],q),mix(points[i][1],points[i+1][1],q),r,col);
  }
  function projected(x,y,z,rot=.4,scale=1,cx=960,cy=540){
    const xx=x*Math.cos(rot)+z*Math.sin(rot),zz=-x*Math.sin(rot)+z*Math.cos(rot),d=1+zz*.0006;return[cx+xx*scale/d,cy+y*scale/d];
  }
  function lmWire(cx,cy,s=1,angle=0,col=fg){
    c.save();c.translate(cx,cy);c.rotate(angle);c.scale(s,s);
    polygon([[-76,-73],[-54,-160],[54,-160],[76,-73]],col,bg,3);
    polygon([[-82,-65],[-112,-27],[-112,50],[112,50],[112,-27],[82,-65]],col,bg,3);
    polygon([[-62,-145],[-10,-145],[-43,-99]],col,col,1);polygon([[10,-145],[62,-145],[43,-99]],col,col,1);
    polygon([[-24,-103],[24,-103],[24,-63],[-24,-63]],col,bg,2);
    for(const k of [-1,1]){
      path([[k*80,18],[k*175,145],[k*131,43],[k*101,-10]],3,col);
      line(k*151,147,k*199,147,5,col);line(k*44,-160,k*52,-201,2,col);line(k*32,-190,k*71,-190,2,col);
      for(let i=0;i<5;i++)line(k*(87+i*5),-26,k*(87+i*5),44,1,col,.4);
    }
    path([[-19,52],[-35,94],[35,94],[19,52]],2,col);for(let n=0;n<7;n++)line(-20,60+n*12,20,60+n*12,2,col);
    line(-21,-60,-21,138,2,col);line(21,-60,21,138,2,col);c.restore();
  }
  function csmWire(cx,cy,s=1,angle=0,col=fg){
    c.save();c.translate(cx,cy);c.rotate(angle);c.scale(s,s);
    polygon([[-165,-65],[-20,-65],[93,0],[-20,65],[-165,65]],col,bg,3);
    line(-20,-65,-20,65,2,col);line(-157,-65,-157,65,1,col);
    polygon([[-165,-32],[-204,-44],[-204,44],[-165,32]],col,bg,3);
    for(let n=0;n<10;n++)line(-143+n*11,-62,-143+n*11,62,1,col,.3);
    for(const v of [-1,1]){path([[-110,v*65],[-110,v*97],[-92,v*97]],3,col);line(-117,v*85,-103,v*85,3,col);}
    polygon([[7,-36],[38,-17],[13,-17]],col,col,1);line(91,0,120,0,3,col);c.restore();
  }

  function radio(t){
    const q=clamp(t/2),spread=ease(q/.72);
    roleTitle('FLIGHT',q,74,350,278);
    txt('A QUESTION CROSSES THE DISTANCE.',85,410,22,fg,500);
    const x0=125,y0=690,x1=1720;
    for(let k=0;k<7;k++)arc(x0,y0,70+k*69+frac(t*.75)*67,-.8,.8,1,fg,.12+(.6-k*.07)*clamp(q*5));
    const points=[];for(let x=x0;x<=x1;x+=4){const env=Math.exp(-Math.pow((x-mix(x0,x1,spread))/155,2));const v=Math.sin(x*.105-t*17)*Math.sin(x*.037)*env*112;points.push([x,y0+v]);}
    path(points,3,accent,ease(q/.25));
    disc(x0,y0,10,fg);cross(x1,y0,19,accent,2);line(x1,y0-90,x1,y0+90,1,fg,.45);
    notes(['VOICE / UPLINK','GROUND → SPACECRAFT','S-BAND COMMUNICATION'],85,920);
    notes(['MISSION CONTROL','FLIGHT DIRECTOR',showGo?'READINESS POLL':'MISSION PREPARATION'],1450,220);
    ruler(500,780,900);txt('LISTEN.',1110,1015,154,fg,850);
    if(q>.7){txt(showGo?'GO / NO GO':'VOICE / TELEMETRY',1718,835,28,accent,600,'right');for(let k=0;k<8;k++){const x=470+k*145;line(x,80,x,98,2,fg,.5);}}
  }
  function retro(q,t){
    roleTitle('RETRO',q,65,220,192);
    const cx=690,cy=1230,r=660;
    arc(cx,cy,r,Math.PI*1.05,Math.PI*1.95,5,fg);arc(cx,cy,r+28,Math.PI*1.05,Math.PI*1.95,1,fg,.35);
    for(let k=0;k<22;k++){const a=Math.PI*1.08+k*.12,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;line(x,y,cx+Math.cos(a)*(r-20),cy+Math.sin(a)*(r-20),1,fg,.45);}
    const a=[],b=[],old=[];for(let i=0;i<=140;i++){const u=i/140;a.push([120+u*1570,550-235*Math.sin(u*2.6)]);b.push([120+u*1570,550-235*Math.sin(u*2.6)+smooth((u-.45)/.55)*260]);old.push([120+u*1570,550-235*Math.sin(u*2.6)-smooth((u-.45)/.55)*120]);}
    c.setLineDash([8,11]);path(old,2,fg,1,.25);path(a,2,fg,1,.48);c.setLineDash([]);
    const tip=path(b,8,accent,ease(q/.56));cross(...tip,14,accent,2);
    const ix=120+1570*.48,iy=550-235*Math.sin(.48*2.6);disc(ix,iy,11,fg);arrow(ix,iy,ix-100*ease(q/.35),iy-140*ease(q/.35),ORANGE,5);
    txt('Δv',ix-125,iy-163,62,ORANGE,800);txt('BURN CHANGES THE PATH',1040,625,24);
    monoStack(['ABORT TRAJECTORY / RETURN PATH','BURN DURATION / CONTINGENCY','r = POSITION VECTOR','v = VELOCITY VECTOR','Δv = VELOCITY CHANGE'],85,320,q);
    notes(['BURN DIRECTION','ORBITAL ENERGY','ABORT / RETURN'],1270,280);
    txt('ONE IMPULSE.',88,992,106,fg,850);stamp(q,1610,946,208);
  }
  function fido(q,t){
    roleTitle('FIDO',q,1880,290,306,'right');
    c.save();c.translate(100,240);c.rotate(-.12);
    const q2=smooth((q-.25)/.5);
    for(let k=-5;k<=5;k++){
      const ps=[];for(let i=0;i<=90;i++){const u=i/90;ps.push([u*1630,570-Math.sin(u*2.4)*330+k*36*(1-u*q2*.82)]);}
      path(ps,k===0?6:1,k===0?accent:fg,ease(q/.28),k===0?1:.17);
      if(k===-5||k===5)txt(k===-5?'PREDICTED CORRIDOR':'TRACKING UPDATES',1030,ps[58][1]-16,15,fg,500,'left',.8);
    }
    const xx=mix(220,1220,ease(q/.6)),yy=570-Math.sin(xx/1630*2.4)*330;
    disc(xx,yy,11,accent);cross(xx,yy,25,fg,1);
    for(let k=0;k<8;k++){const x=120+k*175,y=570-Math.sin(x/1630*2.4)*330;line(x,y+25,x,y+75,1,fg,.45);txt(k===7?'ARRIVAL':'TRACK',x,y+96,12,fg,500,'center',.6);}
    c.restore();
    notes(['FLIGHT DYNAMICS','STATE VECTOR / GROUND TRACK','RANGE TO SITE / DESCENT PATH','PREDICTION IS UPDATED','AS NEW OBSERVATIONS ARRIVE'],95,200);
    txt('WHERE NEXT?',70,1050,108,fg,850);stamp(q,1570,954,200);
    ruler(70,920,700);txt('MEASUREMENT → PREDICTION',80,888,22);
  }
  function guidance(q,t){
    roleTitle('GUIDANCE',q,-10,205,210);
    const ox=920,oy=665,cohere=smooth((q-.15)/.53);
    line(430,oy,1530,oy,2,fg,.5);line(ox,285,ox,950,2,fg,.5);
    for(let k=0;k<18;k++){line(470+k*56,oy-6,470+k*56,oy+6,1,fg,.45);line(ox-6,330+k*31,ox+6,330+k*31,1,fg,.45);}
    const observed=[1370,365],estimated=[mix(1140,1370,cohere),mix(580,365,cohere)];
    arrow(ox,oy,...observed,fg,4);arrow(ox,oy,...estimated,accent,7);
    c.setLineDash([6,7]);line(...observed,...estimated,3,ORANGE);c.setLineDash([]);
    arc(...observed,34,0,TAU,2,fg);cross(...estimated,20,accent,3);
    txt('OBSERVATION',1370,320,17,fg,500,'center');txt('STATE ESTIMATE',1080,785,20,accent,500);
    const r=Math.hypot(estimated[0]-observed[0],estimated[1]-observed[1]);
    txt('RESIDUAL',1490,510,19,ORANGE,500);line(1475,535,1475+Math.max(4,r*.8),535,9,ORANGE);
    monoStack(['x = [r, v]','MEASURED − PREDICTED','INERTIAL ALIGNMENT','RADAR UPDATE','GUIDANCE COMPUTER','PROGRAM STATUS'],90,350,q);
    if(q>.45){arrow(ox,oy,ox-180*ease((q-.45)/.3),oy+150*ease((q-.45)/.3),accent,8);txt('STEER',560,934,81,accent,800);}
    txt('KNOW. THEN STEER.',70,1034,87,fg,850);stamp(q,1675,930,177);
  }
  function control(q,t){
    roleTitle('CONTROL',q,75,230,192);
    const a=mix(-.38,.02,smooth(q/.72)),cx=1000,cy=640;
    c.save();c.translate(cx,cy);c.rotate(.08);c.setLineDash([9,11]);arc(0,0,300,-2.75,.45,2,fg,.35);c.setLineDash([]);
    for(let k=0;k<31;k++){const b=-2.75+k*.104;line(Math.cos(b)*293,Math.sin(b)*293,Math.cos(b)*(k%5===0?275:284),Math.sin(b)*(k%5===0?275:284),1,fg,.65);}
    arrow(0,0,360,0,fg,2);arrow(0,0,0,-360,fg,2);txt('BODY X',375,4,16);txt('BODY Z',12,-369,16);c.restore();
    lmWire(cx,cy,1.53,a);
    const thrust=1-smooth((q-.5)/.22);
    for(const s of [-1,1]){
      const px=cx+s*147,py=cy-170;
      for(let n=0;n<8;n++)line(px+s*(20+n*14),py+(n%3-1)*7,px+s*(29+n*14),py+(n%3-1)*7,2,accent,thrust*(.8-n*.07));
    }
    txt('ATTITUDE',95,451,74,fg,850);txt('REACTION CONTROL',95,495,22,fg);
    monoStack(['LM / EAGLE','LM ATTITUDE','DESCENT THRUST / ENGINE GIMBAL','REACTION JETS','ROTATION → ALIGNMENT'],95,580,q);
    txt('τ = r × F',1460,400,48,fg,650);
    if(q>.58){cross(cx,cy,30,accent,4);txt('ALIGNED',1070,1025,68,accent,800);}
    stamp(q,1665,920,190);
  }
  function telmu(q,t){
    roleTitle('TELMU',q,90,220,220);
    const rails=[{y:390,col:accent,name:'ELECTRICAL POWER',parts:['DESCENT BATTERIES','DC BUS','LM LOADS']},{y:620,col:fg,name:'OXYGEN',parts:['SUPPLY','REGULATION','CABIN']},{y:850,col:ORANGE,name:'THERMAL CONTROL',parts:['WATER / GLYCOL','HEAT EXCHANGE','CIRCULATION']}];
    for(let r=0;r<rails.length;r++){
      const row=rails[r],shift=90*(1-ease((q-r*.06)/.25));
      txt(row.name,90,row.y-72,18,row.col,500);line(70,row.y,1850,row.y,1,row.col,.2);
      const points=[[90+shift,row.y],[520,row.y],[630,row.y-25],[1000,row.y-25],[1110,row.y],[1640,row.y]];
      path(points,5,row.col,ease((q-r*.05)/.4));
      for(let k=0;k<6;k++)bead(points,t*.6+k/6,row.col,4);
      for(let j=0;j<3;j++){
        const x=200+j*590;disc(x,row.y,9,bg);arc(x,row.y,9,0,TAU,2,row.col);
        txt(row.parts[j],x-35,row.y+49,16,fg,500);
        for(let v=0;v<6;v++)line(x-40+v*13,row.y-18,x-40+v*13,row.y-30-(v%2)*8,1,row.col,.5);
      }
      if(r===2){path([[1640,row.y],[1710,row.y],[1710,row.y+78],[180,row.y+78],[180,row.y]],2,row.col,1,.4);}
    }
    notes(['LM / EAGLE','LM DC BUS / BATTERY LOAD','CABIN PRESSURE / COOLANT LOOP'],1220,125);
    txt('KEEP THE CABIN ALIVE.',85,1040,70,fg,850);stamp(q,1710,284,168);
  }
  function gnc(q,t){
    roleTitle('GNC',q,85,297,330);
    const cx=1180,cy=610,angle=mix(.7,.05,smooth((q-.1)/.65));
    for(let ring=0;ring<3;ring++){
      c.save();c.translate(cx,cy);c.rotate((ring-1)*.72+angle*(ring===1?1:-.35));c.scale(1,ring===1?.4:.83);
      arc(0,0,260+ring*43,0,TAU,ring===1?4:1,ring===1?accent:fg,ring===1?1:.5);
      for(let i=0;i<36;i++){const a=i/36*TAU;line(Math.cos(a)*(260+ring*43),Math.sin(a)*(260+ring*43),Math.cos(a)*(252+ring*43),Math.sin(a)*(252+ring*43),1,fg,.6);}
      c.restore();
    }
    csmWire(cx+27,cy,1.18,angle);
    for(const [dx,dy,name] of [[430,0,'X'],[0,-376,'Y'],[-200,220,'Z']]){arrow(cx,cy,cx+dx,cy+dy,fg,2);txt('REF '+name,cx+dx+12,cy+dy+8,16);}
    monoStack(['CSM / COLUMBIA','GUIDANCE, NAVIGATION & CONTROL','CSM ATTITUDE / INERTIAL PLATFORM','SERVICE PROPULSION','REACTION CONTROL','INERTIAL FRAME → BODY FRAME'],90,440,q);
    txt('R · v',105,810,94,accent,700);txt('SAME VECTOR. NEW FRAME.',85,1018,76,fg,850);stamp(q,1690,975,170);
  }
  function eecom(q,t){
    roleTitle('EECOM',q,85,245,218);
    txt('COMMAND / SERVICE MODULE',93,294,19,fg,500);
    const y=562,react=ease((q-.18)/.46);
    txt('2H₂',115,y,124,fg,800);txt('+',380,y,100,fg,600);txt('O₂',490,y,124,fg,800);
    arrow(725,y-39,1010,y-39,accent,7,24);
    const resultX=mix(1100,1030,react);txt('2H₂O',resultX,y,126,fg,800,'left',react);
    notes(['HYDROGEN','REACTANT SUPPLY'],118,650);notes(['OXYGEN','REACTANT SUPPLY'],492,650);
    line(725,610,1320,610,1,fg,.5);line(725,595,725,610,1,fg,.5);line(1320,595,1320,610,1,fg,.5);
    txt('FUEL CELL / REACTION OUTPUTS',805,654,14,fg,500);
    const out=[[1320,610],[1440,610],[1440,770],[1710,770]];
    path(out,5,accent,react);txt('ELECTRICAL POWER',1417,830,21,accent,600);
    path([[1320,610],[1580,610],[1580,340],[1790,340]],3,ORANGE,react);txt('HEAT',1655,304,36,ORANGE,750);
    path([[1320,610],[1320,925],[1010,925]],3,fg,react);txt('WATER',935,968,31,fg,650);
    for(let i=0;i<6;i++)bead(out,t*.7+i/6,accent,5);
    monoStack(['CSM POWER / FUEL CELLS','CHEMICAL ENERGY → ELECTRICAL ENERGY','OXYGEN SUPPLY','ENVIRONMENTAL CONTROL'],90,795,q);
    stamp(q,1710,1004,164);
  }
  function surgeon(q,t){
    roleTitle('SURGEON',q,80,207,190);
    const crew=[['COMMANDER',510],['LUNAR MODULE PILOT',960],['COMMAND MODULE PILOT',1410]];
    for(let k=0;k<3;k++){
      const [name,x]=crew[k],appear=ease((q-k*.07)/.3),yy=510;
      c.save();c.translate(x,yy+65*(1-appear));c.scale(appear,appear);
      arc(0,0,103,Math.PI*.9,Math.PI*2.1,4,fg);path([[-99,32],[-88,99],[-52,125],[52,125],[88,99],[99,32]],4,fg);
      polygon([[-73,-24],[-56,-62],[56,-62],[73,-24],[67,45],[-67,45]],fg,bg,3);
      line(-53,128,-112,169,3,fg);line(53,128,112,169,3,fg);line(-42,148,42,148,3,accent);
      for(let j=0;j<5;j++)line(-51+j*25,135,-51+j*25,147,1,fg,.5);
      c.restore();txt(name,x,734,15,fg,500,'center',appear);
      const ps=[];for(let n=0;n<=90;n++){const u=n/90;ps.push([x-165+u*330,828+Math.sin(u*TAU*2-t*2.5-k)*17]);}
      path(ps,2,k===0?accent:fg,appear,.7);txt('RESPIRATION / TELEMETRY',x,880,13,fg,400,'center',appear*.7);
    }
    notes(['CREW CONDITION','ECG / HEART RATE','BIOMEDICAL LINK','FLIGHT SURGEON ASSESSMENT'],84,300);
    txt('HUMANS, INSIDE.',83,1042,95,fg,850);stamp(q,1725,318,157);
  }
  function converge(t){
    const q=clamp((t-16.4)/1.6),build=ease(q/.82);
    txt('ONE',590,190,151,fg,900);txt('MISSION.',585,339,156,fg,900);
    txt('FLIGHT',82,164,66,fg,850);txt('MISSION CONTROL',85,210,17,fg,500);
    const center=[815,650],csm=[1430,365],lm=[1460,790];
    for(let k=0;k<8;k++){
      const sy=306+k*83;
      const destination=k===3||k===4?lm:k===5||k===6?csm:center;
      const ps=[[330,sy],[420+k*17,sy],[620+k*18,mix(sy,destination[1],.55)],[destination[0]-190,destination[1]],[destination[0]-115,destination[1]]];
      path(ps,k===3?4:1.5,k===3||k===4?accent:fg,build,k===3||k===4?1:.48);
      if(build>.3)for(let j=0;j<2;j++)bead(ps,t*.55+j*.5,k===3||k===4?accent:fg,3.5);
      txt(roles[k],85,sy+6,23,fg,650);
      if(showGo)txt('GO',252,sy+6,16,accent,700);
      else{cross(287,sy,5,accent,1);}
    }
    for(const [target,col] of [[csm,fg],[lm,accent]]){
      const ps=[center,[1035,650],[1120,target[1]],[target[0]-190,target[1]]];
      path(ps,3,col,build,.85);if(build>.4)bead(ps,t*.45,col,5);
    }
    arc(...center,44,0,TAU*build,3,accent);cross(...center,14,fg,2);
    txt('SHARED STATE',center[0],center[1]+74,14,fg,500,'center');
    csmWire(...csm,.83,-.18);lmWire(...lm,.74,.04);
    txt('COLUMBIA',1430,190,31,fg,800,'center');txt('CSM / ORBIT',1430,226,16,fg,500,'center');
    txt('EAGLE',1460,575,37,accent,800,'center');txt('LM / DESCENT',1460,610,16,fg,500,'center');
    notes(['GNC / EECOM','ATTITUDE / POWER','CONSUMABLES'],1670,355,fg,20,.72);
    notes(['CONTROL / TELMU','THRUST / ATTITUDE','CABIN / POWER'],1670,768,fg,20,.72);
    txt(showGo?'EIGHT JUDGMENTS. ONE DESCENT COMMITMENT.':'EIGHT CONTROLLERS. TWO SPACECRAFT.',595,1034,29,fg,650);
    ruler(595,975,1060);arc(1600,1450,410,Math.PI*1.1,Math.PI*1.84,2,fg,.35);
  }
  function later(t){
    if(t>=25&&t<28)return;
    let top='',bottom='';
    if(t<21.8){top='LUNAR ORBIT → POWERED DESCENT';bottom='GUIDANCE / NAVIGATION / CONTROL';}
    else if(t<25){top='EAGLE';bottom='ASCENT STAGE / DESCENT STAGE';}
    else if(t<31){top='THE SURFACE IS NOT A DIAGRAM.';bottom='TERRAIN / CLEARANCE / CONTROL';}
    else if(t<33.3){top='A CLEAR PATCH.';bottom='DESCENT / TRANSLATION / ATTITUDE';}
    else if(t<35.65){top='THE LAST DISTANCE.';bottom='LANDING GEAR / CONTACT';}
    else{top='TRANQUILITY';bottom='THE EAGLE HAS LANDED.';}
    txt(top,76,96,t>=35.65?54:25,BONE,750);
    line(78,118,190,118,3,LIME);txt(bottom,78,1000,17,BONE,500,'left',.8);
    if(t<21.8){for(let k=0;k<8;k++){const x=80+k*106;txt(roles[k],x,1040,11,LIME,500);}}
    if(t>=35.65){const p=ease((t-35.65)/.8);txt('CONTACT',1838,1000,24,LIME,700,'right',p);}
  }
  function render(storyTime,opts={}){
    const t=Number.isFinite(storyTime)?Math.max(0,storyTime):0;
    c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.setLineDash([]);c.clearRect(0,0,W,H);
    fg=BONE;bg=INK;accent=LIME;showGo=opts.showGo!==false;
    if(t>=18){later(t);return canvas;}
    // Two sharp reversals are editorial cuts, not a constant glowing HUD.
    const idx=Math.min(7,Math.max(0,Math.floor((t-2)/1.8))),q=clamp((t-(2+idx*1.8))/1.8);
    if(t>=2&&t<16.4&&(idx===1||idx===3||idx===5)){fg=INK;bg=BONE;accent='#426b12';}
    rect(0,0,W,H,bg);
    const external=clamp(opts.pulse||0),hit=(t>=2&&t<16.4?Math.exp(-q*65):0)+external*.5;
    c.save();c.translate(W/2,H/2);c.scale(1+hit*.013,1+hit*.013);c.translate(-W/2,-H/2);
    if(t<2)radio(t);
    else if(t<16.4)[retro,fido,guidance,control,telmu,gnc,eecom,surgeon][idx](q,t);
    else converge(t);
    c.restore();
    // Small registration marks belong to the changing drafting surface. They
    // do not introduce a persistent frame, dashboard or fake instrument data.
    for(const [x,y] of [[27,29],[1892,29],[27,1051],[1892,1051]])cross(x,y,7,fg,1);
    if(opts.go===true&&t>=2&&t<16.4)stamp(.9,1710,1000,150);
    return canvas;
  }
  render(0);return{canvas,render};
}
