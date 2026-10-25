// Original engineering linework, not a reproduction of a flight-plan plate or telemetry.
const BONE='#eeeadd',LIME='#c6f16a',INK='#080d12';
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};

export function drawEngineering(c,t,detail={}){
 if(t<92.5197||t>=98.6957)return;
 const entrance=smooth((t-92.5197)/.28),exit=1-smooth((t-98.15)/.5457);
 c.save();c.globalAlpha*=entrance*exit;c.lineJoin='round';c.lineCap='round';
 function line(ps,col=BONE,w=1,alpha=.3,amount=1){
  const lens=ps.slice(1).map((p,i)=>Math.hypot(p[0]-ps[i][0],p[1]-ps[i][1]));let remaining=lens.reduce((a,b)=>a+b,0)*clamp(amount);
  c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...ps[0]);
  for(let i=1;i<ps.length&&remaining>0;i++){const p=Math.min(1,remaining/(lens[i-1]||1));c.lineTo(mix(ps[i-1][0],ps[i][0],p),mix(ps[i-1][1],ps[i][1],p));remaining-=lens[i-1];}c.stroke();c.restore();
 }
 function text(s,x,y,col=BONE,alpha=.5,align='left'){
  c.save();c.globalAlpha*=alpha;c.textAlign=align;c.font='500 14px Consolas, monospace';c.lineWidth=3;c.strokeStyle=INK;c.strokeText(s,x,y);c.fillStyle=col;c.fillText(s,x,y);c.restore();
 }
 function dot(x,y,col=LIME,r=3,alpha=.8){c.save();c.globalAlpha*=alpha;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();}
 function arrow(x,y,u,v,col=BONE,alpha=.35){line([[x,y],[u,v]],col,1,alpha);const a=Math.atan2(v-y,u-x);line([[u-9*Math.cos(a-.45),v-9*Math.sin(a-.45)],[u,v],[u-9*Math.cos(a+.45),v-9*Math.sin(a+.45)]],col,1,alpha);}
 function arc(x,y,r,a,b,alpha=.25){c.save();c.globalAlpha*=alpha;c.strokeStyle=BONE;c.lineWidth=1;c.beginPath();c.arc(x,y,r,a,b);c.stroke();c.restore();}
 function lm(x,y,scale,angle=0,alpha=.4){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
  // Faceted ascent cabin, distinct descent stage, bell, landing struts and pads.
  const shapes=[
   [[-32,-19],[-38,-44],[-18,-67],[22,-65],[40,-42],[33,-19],[-32,-19]],
   [[-34,-20],[36,-20],[47,-6],[43,28],[-45,28],[-47,-7],[-34,-20]],
   [[-27,-45],[-11,-57],[-12,-33],[-27,-45]],[[9,-56],[28,-44],[10,-33],[9,-56]],
   [[-17,-18],[-17,6],[17,6],[17,-18]],
   [[-10,28],[-10,37],[-20,54],[20,54],[10,37],[10,28]],
   [[-43,-7],[-72,54],[-102,72]],[[-34,27],[-72,54],[-81,75]],
   [[43,-7],[72,54],[102,72]],[[34,27],[72,54],[81,75]],
   [[-114,77],[-80,77]],[[80,77],[114,77]],
   [[22,-65],[29,-94]],[[18,-85],[40,-85]],
  ];
  shapes.forEach(s=>line(s,BONE,1/Math.max(.5,scale),alpha));
  for(let i=0;i<4;i++)line([[-17,34+i*10],[0,34+i*10]],BONE,.8/Math.max(.5,scale),alpha*.7);
  c.restore();
 }
 if(t<94.595){
  const p=smooth((t-92.5197)/(94.595-92.5197));
  const x=1490,y=284,angle=mix(-.36,-.035,p);
  // Local horizontal is fixed in the lunar reference; body axes move with the vehicle.
  line([[1135,423],[1810,423]],BONE,1,.31);text('LOCAL HORIZONTAL',1810,447,BONE,.46,'right');
  lm(x-160,y-18,.65,-.36,.12);lm(x,y,.94,angle,.55);
  const ax=[x+Math.sin(angle)*154,y-Math.cos(angle)*154];
  arrow(x,y,...ax,LIME,.55);arrow(x,y,x+Math.cos(angle)*112,y+Math.sin(angle)*112,BONE,.3);
  text('BODY AXES',1642,163,BONE,.52);line([[1633,168],[1588,168],ax],BONE,1,.23);
  const eye=[x+27*Math.cos(angle)+45*Math.sin(angle),y+27*Math.sin(angle)-45*Math.cos(angle)];
  const sight=[1748,mix(376,423,p)];line([eye,sight],BONE,1,.34);dot(...sight,LIME,2,.65);
  text('LINE OF SIGHT',1726,298,BONE,.5,'right');line([[1734,306],[1754,320],[sight[0],sight[1]-9]],BONE,1,.22);
  arc(x,y,132,-Math.PI/2-.36,-Math.PI/2+angle,.28);
  line([[x,426],[x,435]],LIME,1,.45);text('REFERENCE / VEHICLE / VIEW',1138,122,BONE,.36);
 }else{
  const p=clamp((t-94.595)/(96.6503-94.595)),release=smooth((t-96.6503)/(98.6957-96.6503));
  const fade=1-release*.86,x=1152,y=486;
  line([[x,155],[x,y],[1810,y]],BONE,1,.28*fade);
  text('ALTITUDE',1152,133,BONE,.45*fade);text('DOWNRANGE',1810,511,BONE,.45*fade,'right');
  // A nonuniform, unnumbered profile conveys direction, not invented measurements.
  const curve=[];for(let i=0;i<=42;i++){const u=i/42;curve.push([1182+598*u,190+39*u+194*u*u]);}
  c.save();c.setLineDash([4,9]);line(curve,BONE,1,.21*fade);c.restore();
  const reveal=smooth(p*1.4);line(curve,LIME,1.8,.48*(1-release),reveal);
  for(const [u,a] of [[.12,-.42],[.45,-.24],[.8,-.08]]){
   const idx=Math.floor(u*42),pt=curve[idx];lm(pt[0],pt[1]-35,.27,a,.27*fade*clamp((p-u*.65)*4));
   line([[pt[0],pt[1]+8],[pt[0],y]],BONE,.8,.1*fade);
  }
  line([[1153,480],[1240,477],[1284,466],[1325,474],[1381,468],[1424,473],[1480,462],[1534,472],[1585,466],[1644,470],[1702,464],[1810,469]],BONE,1,.18*fade);
  text('BRAKING / CONTINUOUS THRUST',1183,560,BONE,.35*fade);
  if(t<96.6503){const u=reveal,xx=1182+598*u,yy=190+39*u+194*u*u;dot(xx,yy,LIME,3,.75);}
  else{
   const a=detail.anchors?.velocity,valid=a&&a.visible!==false&&Number.isFinite(a.x)&&Number.isFinite(a.y);
   const target=valid?[a.x*1920,a.y*1080]:[930,620],start=curve[curve.length-1];
   // The profile leaves its little axes: its continuation is now a projected spatial vector.
   const bridge=[start,[1730,474],[1538,542],[mix(1320,target[0],release),mix(570,target[1],release)],target];
   line(bridge,LIME,1.5,.47,release);const n=release*(bridge.length-1),i=Math.min(bridge.length-2,Math.floor(n)),f=n-i;
   dot(mix(bridge[i][0],bridge[i+1][0],f),mix(bridge[i][1],bridge[i+1][1],f),LIME,3,.7);
  }
 }
 c.restore();
}
