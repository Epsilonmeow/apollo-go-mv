import * as THREE from '../vendor/three.module.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);},fract=x=>x-Math.floor(x);
const INK=0x080d12,BONE=0xeeeadd,LIME=0xc6f16a,ORANGE=0xf86b3d;
const ROLES=['RETRO','FIDO','GUIDANCE','CONTROL','TELCOM','GNC','EECOM','SURGEON'];
const NAMES=['RETURN','POSITION','GUIDANCE','PROPULSION','CABIN','CSM CONTROL','CSM SYSTEMS','CREW'];
const SUBS=['ASCENT / RENDEZVOUS','SURFACE REFERENCE','STATE / REFERENCE','DPS SAFE / APS AVAILABLE','OXYGEN / CO₂ REMOVAL','CSM ATTITUDE / CONTROL AUTHORITY','FUEL CELLS / LIFE SUPPORT','COMMUNICATION / REPORT'];
function box(x,y,z,material){return new THREE.Mesh(new THREE.BoxGeometry(x,y,z),material);}
function line(points,material){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);}
function rod(a,b,r,material,n=8){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),n),material);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o;}
function curve(points,r,material){return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,r,5,false),material);}
function panelTexture(width,height){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=4;return{canvas,c:canvas.getContext('2d'),texture};}

// Independent control-room architecture. The arrangement is an authored
// spatial diagram, not a reconstruction of actual controller seat positions.
// The score supplies consensus; animation never invents a telemetry reading.
export function createControlSpace(){
  const scene=new THREE.Scene();scene.background=new THREE.Color(INK);scene.fog=new THREE.Fog(INK,42,95);
  const camera=new THREE.PerspectiveCamera(58,16/9,.025,160);let aspect=16/9;
  const bone=new THREE.MeshStandardMaterial({color:0xb5b7a9,roughness:.72,metalness:.14});
  const graphite=new THREE.MeshStandardMaterial({color:0x222d30,roughness:.78,metalness:.18});
  const dark=new THREE.MeshStandardMaterial({color:0x0c1519,roughness:.9,metalness:.1});
  const metal=new THREE.MeshStandardMaterial({color:0x7f9394,roughness:.46,metalness:.5});
  const seatMaterial=new THREE.MeshStandardMaterial({color:0x34413e,roughness:.94});
  const floorMaterial=new THREE.MeshStandardMaterial({color:0x1c292c,roughness:.84,metalness:.08});
  const keyMaterial=new THREE.MeshStandardMaterial({color:0xd0cdbc,roughness:.85});
  const orangeMaterial=new THREE.MeshStandardMaterial({color:ORANGE,roughness:.74,emissive:ORANGE,emissiveIntensity:.06});
  const lineMaterial=new THREE.LineBasicMaterial({color:0x87938d,transparent:true,opacity:.24});
  const circuitMaterial=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.28});
  const lampMaterial=new THREE.MeshBasicMaterial({color:BONE});
  const statusMaterial=new THREE.MeshBasicMaterial({color:LIME});
  const ambient=new THREE.HemisphereLight(0xc5d2c9,0x0a1418,.82);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xf1ecd9,2.4);key.position.set(-14,24,15);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-29,right:29,top:29,bottom:-29,near:1,far:80});key.shadow.normalBias=.025;key.shadow.bias=-.0001;scene.add(key,key.target);key.target.position.set(0,0,-2);
  const fill=new THREE.DirectionalLight(0x9cbcc0,.65);fill.position.set(17,13,-15);scene.add(fill);
  const floor=box(48,.5,43,floorMaterial);floor.position.set(0,-.3,-.8);floor.receiveShadow=true;scene.add(floor);
  // Broad terraces, short stairs and exposed desk feet make three ranks read
  // as a working room instead of a flat arrangement of repeated boxes.
  const deckHeights=[0,.42,.84],rowZ=[-7,.3,7.6],xs=[-16,-11.6,-7.2,-2.8,2.8,7.2,11.6,16];
  for(let row=1;row<3;row++){
    const slab=box(42,deckHeights[row],7.3,floorMaterial);slab.position.set(0,deckHeights[row]/2,rowZ[row]+.5);slab.receiveShadow=true;scene.add(slab);
    for(let j=0;j<3;j++){const step=box(2.1,.14,1.0,floorMaterial);step.position.set(0,deckHeights[row]-.35+j*.14,rowZ[row]-3.35-j*.30);step.receiveShadow=true;scene.add(step);}
  }
  for(const x of [-23,23]){const wall=box(.45,14,41,dark);wall.position.set(x,6.5,-1);scene.add(wall);for(let i=0;i<8;i++){const fin=box(.28,10,.22,graphite);fin.position.set(x*.98,5,-18+i*5);scene.add(fin);}}
  const frontWall=box(46,14,.5,dark);frontWall.position.set(0,6.5,-20);scene.add(frontWall);
  for(const z of [-13,-1,11]){
    const beam=box(45,.25,.36,graphite);beam.position.set(0,12,z);scene.add(beam);
    for(const x of [-15,-5,5,15]){const housing=box(7,.18,.65,graphite);housing.position.set(x,11.86,z);scene.add(housing);const light=box(6.5,.04,.3,lampMaterial);light.position.set(x,11.74,z);scene.add(light);}
  }
  const screens=NAMES.map(()=>panelTexture(768,480));
  const aux=panelTexture(384,256),board=panelTexture(2048,640);
  const screenMaterials=new Map();
  function screenMesh(texture,w,h){if(!screenMaterials.has(texture.uuid))screenMaterials.set(texture.uuid,new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));return new THREE.Mesh(new THREE.PlaneGeometry(w,h),screenMaterials.get(texture.uuid));}
  function monitor(texture,w,h){const g=new THREE.Group();const casing=box(w+.18,h+.18,.48,graphite);g.add(casing);const face=screenMesh(texture,w,h);face.position.z=.246;g.add(face);const brow=box(w+.25,.06,.22,dark);brow.position.set(0,h/2+.08,.22);g.add(brow);return g;}
  const stations=[],diodes=[],screenCenters=[];
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
    const id=row*8+col,deck=deckHeights[row],g=new THREE.Group();g.position.set(xs[col],deck,rowZ[row]);scene.add(g);
    const top=box(3.9,.14,2.4,bone);top.position.set(0,.95,.15);top.castShadow=true;top.receiveShadow=true;g.add(top);
    for(const x of [-1.66,1.66]){const side=box(.16,.86,1.85,graphite);side.position.set(x,.43,.02);g.add(side);const foot=box(.38,.08,2.05,dark);foot.position.set(x,.05,.06);g.add(foot);}
    const back=box(3.48,.69,.27,graphite);back.position.set(0,.54,-.82);g.add(back);
    // A deep sloping instrument cabinet joins the displays into a console;
    // their faces are inset in one machine, rather than standalone PCs.
    const cabinetPoints=[[-1.83,.98,.02],[1.83,.98,.02],[1.83,2.13,-.28],[-1.83,2.13,-.28],[-1.83,.98,-1.03],[1.83,.98,-1.03],[1.83,2.13,-1.03],[-1.83,2.13,-1.03]],cabinetFaces=[[0,1,2,3],[1,5,6,2],[5,4,7,6],[4,0,3,7],[3,2,6,7]],cabinetVertices=[];
    for(const f of cabinetFaces)for(const ids of [[f[0],f[1],f[2]],[f[0],f[2],f[3]]])for(const i of ids)cabinetVertices.push(...cabinetPoints[i]);
    const cabinetGeometry=new THREE.BufferGeometry();cabinetGeometry.setAttribute('position',new THREE.Float32BufferAttribute(cabinetVertices,3));cabinetGeometry.computeVertexNormals();const cabinet=new THREE.Mesh(cabinetGeometry,bone);g.add(cabinet);
    for(const x of [-1.82,1.82])g.add(rod(V(x,.99,.06),V(x,2.15,-.25),.035,metal));
    const primary=monitor(screens[col].texture,1.63,1.02);primary.position.set(-.63,1.58,-.25);primary.rotation.x=-.19;g.add(primary);
    const secondary=monitor(aux.texture,.94,.65);secondary.position.set(.91,1.40,-.21);secondary.rotation.x=-.2;g.add(secondary);
    const keyboard=box(1.56,.065,.52,graphite);keyboard.position.set(-.64,1.07,.80);keyboard.rotation.x=-.08;g.add(keyboard);
    for(let r=0;r<4;r++)for(let c=0;c<11;c++){const k=box(.105,.026,.075,(r===3&&c>7)?orangeMaterial:keyMaterial);k.position.set(-1.31+c*.132,1.118+r*.006,.61+r*.105);g.add(k);}
    const switchPanel=box(.90,.05,.38,graphite);switchPanel.position.set(.92,1.065,.83);g.add(switchPanel);
    for(let j=0;j<4;j++){const toggle=rod(V(.63+j*.19,1.1,.82),V(.63+j*.19,1.23,.78),.018,metal,6);g.add(toggle);const lamp=box(.075,.025,.055,j===3?orangeMaterial:statusMaterial);lamp.position.set(.63+j*.19,1.105,.96);lamp.userData.indicator=true;g.add(lamp);diodes.push({lamp,index:col,row});}
    // A handset and its coiled cord give the foreground communication panel
    // a recognizable action point without invented faces or hand animation.
    const handset=new THREE.Group();handset.position.set(1.56,1.16,.08);handset.rotation.y=-.25;g.add(handset);
    const handle=box(.14,.12,.64,dark);handset.add(handle);for(const z of [-.36,.36]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.12,14),dark);cap.rotation.z=Math.PI/2;cap.position.z=z;handset.add(cap);}
    const cordPoints=[];for(let i=0;i<=40;i++){const u=i/40;cordPoints.push(V(1.60+Math.sin(u*TAU*5)*.045,1.09-u*.32,.36+u*.56));}g.add(curve(cordPoints,.012,dark));
    const nameplate=box(1.22,.07,.025,dark);nameplate.position.set(-.64,1.00,1.365);g.add(nameplate);
    const chair=new THREE.Group();chair.position.set(.12,.0,2.10);chair.rotation.y=(col%3-1)*.10;g.add(chair);
    const cushion=box(.98,.16,.80,seatMaterial);cushion.position.y=.52;chair.add(cushion);
    const chairBack=box(.94,.78,.16,seatMaterial);chairBack.position.set(0,.96,.38);chairBack.rotation.x=.08;chair.add(chairBack);
    chair.add(rod(V(0,.12,0),V(0,.50,0),.055,metal));
    for(let n=0;n<5;n++){const a=n/5*TAU,end=V(Math.cos(a)*.58,.08,Math.sin(a)*.58);chair.add(rod(V(0,.12,0),end,.028,metal));const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.07,8),dark);wheel.rotation.z=Math.PI/2;wheel.position.copy(end);chair.add(wheel);}
    for(const x of [-.56,.56]){chair.add(rod(V(x,.59,-.12),V(x,.85,-.12),.025,metal));const arm=box(.12,.07,.60,graphite);arm.position.set(x,.86,.03);chair.add(arm);}
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    screenCenters.push(V(xs[col]-.63,deck+1.58,rowZ[row]-.25));stations.push(g);
  }
  // Geometry in a console never changes during the score. Combine its fixed
  // parts by material so hundreds of keys, castors and cabinet faces do not
  // become hundreds of draw calls. The small indicators stay independently
  // addressable, and screen textures continue to update on the shared mesh.
  scene.updateMatrixWorld(true);
  const batches=new Map(),fixedMeshes=[];
  for(const station of stations)station.traverse(object=>{
    if(!object.isMesh||object.userData.indicator)return;
    let batch=batches.get(object.material.uuid);if(!batch){batch={material:object.material,positions:[],normals:[],uvs:[],indices:[]};batches.set(object.material.uuid,batch);}
    const p=object.geometry.attributes.position,n=object.geometry.attributes.normal,uv=object.geometry.attributes.uv,index=object.geometry.index,offset=batch.positions.length/3,nm=new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
    for(let i=0;i<p.count;i++){const point=V(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(object.matrixWorld),normal=V(n.getX(i),n.getY(i),n.getZ(i)).applyMatrix3(nm).normalize();batch.positions.push(point.x,point.y,point.z);batch.normals.push(normal.x,normal.y,normal.z);batch.uvs.push(uv?.getX(i)||0,uv?.getY(i)||0);}
    for(let i=0;i<(index?index.count:p.count);i++)batch.indices.push(offset+(index?index.getX(i):i));fixedMeshes.push(object);
  });
  for(const o of fixedMeshes)o.removeFromParent();
  for(const batch of batches.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(batch.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(batch.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(batch.uvs,2));g.setIndex(batch.indices);g.computeBoundingSphere();const m=new THREE.Mesh(g,batch.material);m.castShadow=true;m.receiveShadow=true;scene.add(m);}
  const boardHousing=box(29.3,9.70,.48,graphite);boardHousing.position.set(0,7,-19.42);scene.add(boardHousing);
  const boardMesh=screenMesh(board.texture,28.3,28.3*640/2048);boardMesh.position.set(0,7,-19.15);scene.add(boardMesh);
  for(const x of [-19,19]){const sideBoard=monitor(screens[x<0?5:6].texture,5,3.12);sideBoard.position.set(x,6.5,-18.9);sideBoard.rotation.y=x<0?.18:-.18;scene.add(sideBoard);}
  // An optional under-console signal view exposes the same branching paths
  // later seen as the complete room; these lines carry communication, not power.
  const circuit=new THREE.Group();scene.add(circuit);const routes=[],packets=[];
  for(let i=0;i<24;i++){
    const row=Math.floor(i/8),col=i%8,start=V(xs[col],deckHeights[row]+.13,rowZ[row]+.4),a=V(xs[col],deckHeights[row]+.13,rowZ[row]+3.2),b=V(0,deckHeights[row]+.13,rowZ[row]+3.2),end=V(0,.13,-17);
    const points=[start,a,b,end];circuit.add(line(points,circuitMaterial));routes.push(points);
    const packet=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),statusMaterial);circuit.add(packet);packets.push(packet);
  }
  const result=new THREE.Group();scene.add(result);const resultRays=[];
  for(let i=0;i<8;i++){const a=V(xs[i],1.6,-7),b=V(xs[i]*.6,4,-13),d=V(0,5,-19);const ray=line(new THREE.QuadraticBezierCurve3(a,b,d).getPoints(50),new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:0}));result.add(ray);resultRays.push(ray);}

  function drawScreens(t,consensus,mode,voiceMode){
    const text=(c,s,x,y,size=22,color='#eeeadd',weight=500)=>{c.fillStyle=color;c.font=`${weight} ${size}px ${size>31?'Archivo':'Consolas'},sans-serif`;c.fillText(s,x,y);};
    const stroke=(c,points,color='#c6f16a',width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();};
    const circle=(c,x,y,r,color='#eeeadd')=>{c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();};
    for(let i=0;i<8;i++){
      const {c,texture}=screens[i],ready=consensus>=(i+1)/8,accent=ready?'#c6f16a':'#eeeadd',voice=i===0&&voiceMode,kind=voice?0:[6,1,2,3,4,8,5,7][i];
      c.fillStyle='#07100f';c.fillRect(0,0,768,480);text(c,voice?'VOICE':ROLES[i],32,55,34,accent,700);text(c,voice?'ONE TRANSMISSION PATH':SUBS[i],32,91,18,'#aebbb0');stroke(c,[[32,110],[734,110]],'#45584e',1);
      text(c,ready?'CHECKED':'REVIEW',557,55,24,ready?'#c6f16a':'#f86b3d',650);
      if(kind===0){const ps=[];for(let n=0;n<=180;n++){const x=n/180;ps.push([36+x*698,220+Math.sin(x*76-t*7)*Math.sin(x*23+t)*37]);}stroke(c,ps,'#c6f16a',3);text(c,'EAGLE  →  CAPCOM  →  FLIGHT',36,345,25);text(c,'TRANSMIT / LISTEN / ACKNOWLEDGE',36,405,17,'#aebbb0');}
      if(kind===1){circle(c,270,263,78,'#aebbb0');c.strokeStyle='#45584e';c.beginPath();c.ellipse(270,263,180,99,-.2,0,TAU);c.stroke();const a=t*.06,x=270+Math.cos(a)*180,y=263+Math.sin(a)*99;c.fillStyle=accent;c.fillRect(x-6,y-6,12,12);text(c,'CSM',x+15,y,21,accent);c.fillRect(334,285,10,10);stroke(c,[[344,290],[520,326]],accent,2);text(c,'SURFACE FIX',489,369,23,accent);text(c,'ORBIT PHASE / RETURN PATH',38,440,25,accent);}
      if(kind===2){for(let n=0;n<3;n++){let y=165+n*82;text(c,['REFERENCE','LANDED STATE','UPDATE'][n],36,y,22);stroke(c,[[244,y-10],[472,y-10],[600,250]],accent,2);circle(c,600,250,35,accent);}text(c,'LANDED STATE / GUIDANCE REFERENCE',36,432,21,accent);}
      if(kind===3){text(c,'DPS',38,170,24);text(c,'SHUTDOWN',400,170,28,accent);stroke(c,[[40,205],[718,205]],'#45584e',2);text(c,'APS / RCS',38,273,24);text(c,ready?'AVAILABLE':'CHECK',400,273,28,accent);stroke(c,[[40,310],[718,310]],'#45584e',2);text(c,'INDEPENDENT RETURN CAPABILITY',38,414,23,accent);}
      if(kind===4){const ps=[[145,180],[580,180],[580,330],[145,330],[145,180]];stroke(c,ps,accent,3);text(c,'LM CABIN',263,270,32,accent);text(c,'O₂',64,171,25);text(c,'CO₂ REMOVAL',421,383,21);const u=fract(t*.17),k=Math.floor(u*4),v=u*4-k,a=ps[k],b=ps[k+1];c.fillStyle='#c6f16a';c.fillRect(mix(a[0],b[0],v)-6,mix(a[1],b[1],v)-6,12,12);text(c,'BATTERIES / COOLING / RETURN RESERVE',38,442,18,'#aebbb0');}
      if(kind===5){for(let n=0;n<3;n++){let y=165+n*73;stroke(c,[[46,y],[230,y],[400,240]],accent,3);text(c,'FUEL CELL',44,y-15,18);c.strokeStyle=accent;c.strokeRect(230,y-24,80,48);}stroke(c,[[400,240],[680,240]],accent,4);text(c,'DC BUSES',465,210,24);text(c,'CSM POWER / LIFE SUPPORT',38,425,26,accent);}
      if(kind===6){circle(c,166,260,60,accent);circle(c,598,185,25,'#aebbb0');stroke(c,[[166,200],[270,130],[432,120],[598,185]],accent,3);stroke(c,[[166,320],[390,320],[598,210]],'#45584e',2);text(c,'ASCENT',91,371,24);text(c,'RENDEZVOUS',480,272,21);text(c,'KEEP THE RETURN OPEN',38,440,25,accent);}
      if(kind===7){for(let n=0;n<3;n++){let x=115+n*240;circle(c,x,230,43,accent);text(c,['LM / TWO','CSM / ONE','CONTINUE'][n],x-58,326,22);if(n<2)stroke(c,[[x+43,230],[x+194,230]],accent,3);}text(c,'CREW CONDITION / CAPACITY',38,425,25,accent);}
      if(kind===8){stroke(c,[[160,180],[608,180],[608,326],[160,326],[160,180]],accent,3);text(c,'COMMAND',258,167,24);text(c,'RESPONSE',263,368,24);text(c,'CSM ATTITUDE / CONTROL',38,435,24,accent);const u=fract(t*.2),k=Math.floor(u*4),ps=[[160,180],[608,180],[608,326],[160,326],[160,180]],a=ps[k],b=ps[k+1];c.fillStyle='#c6f16a';c.fillRect(mix(a[0],b[0],u*4-k)-6,mix(a[1],b[1],u*4-k)-6,12,12);}
      texture.needsUpdate=true;
    }
    {const {c,texture}=aux;c.fillStyle='#0a1517';c.fillRect(0,0,384,256);text(c,'LOOP / CHECK',24,38,22);for(let n=0;n<5;n++){const y=74+n*31;stroke(c,[[24,y],[347,y]],n<Math.floor(consensus*5)?'#c6f16a':'#46554e',3);text(c,['VOICE','STATE','POWER','CREW','RETURN'][n],24,y-7,13);}texture.needsUpdate=true;}
    {const {c,texture}=board;c.fillStyle='#071014';c.fillRect(0,0,2048,640);text(c,'EAGLE / SURFACE',70,65,52,'#eeeadd',750);text(c,consensus>=.999?'STAY':'POST-LANDING CHECK',70,155,76,consensus>=.999?'#c6f16a':'#eeeadd',800);stroke(c,[[70,190],[1970,190]],'#48615a',2);
      const left=310,right=1600,cy=340;circle(c,left,cy,72,'#eeeadd');circle(c,right,cy,40,'#c6f16a');text(c,'EARTH',240,452,35);text(c,'EAGLE',1540,432,35,'#c6f16a');stroke(c,[[382,cy],[1560,cy]],'#89a480',4);for(let n=0;n<12;n++){const u=fract(t*.13+n/12);c.fillStyle='#c6f16a';c.fillRect(mix(1560,382,u)-4,cy-4,8,8);}text(c,'REPORT → REVIEW → DECIDE',630,301,37,'#c6f16a',600);text(c,'CONTINUOUS COMMUNICATION',650,396,25,'#aebbb0');
      for(let i=0;i<8;i++){const x=72+i*242,ready=consensus>=(i+1)/8;stroke(c,[[x,510],[x+205,510]],ready?'#c6f16a':'#46554e',ready?8:3);text(c,NAMES[i],x,555,24,ready?'#c6f16a':'#aebbb0');}text(c,mode==='release'&&consensus>=.999?'THE WORK HOLDS.':'EVERY LOCAL CHECK / ONE SHARED DECISION',70,615,30,'#eeeadd',600);texture.needsUpdate=true;}
  }
  function projected(point){const q=point.clone().project(camera);return{x:(q.x+1)/2,y:(1-q.y)/2,visible:q.z>-1&&q.z<1&&Math.abs(q.x)<1.3&&Math.abs(q.y)<1.3};}
  function cameraTo(p,look,fov=58,roll=0){camera.position.copy(p);camera.up.set(0,1,0);camera.lookAt(look);camera.rotateZ(roll);camera.fov=fov;camera.aspect=aspect;camera.updateProjectionMatrix();}
  function move(a,b,la,lb,q,fa=58,fb=fa,ra=0,rb=ra){cameraTo(a.clone().lerp(b,q),la.clone().lerp(lb,q),mix(fa,fb,q),mix(ra,rb,q));}
  function update(raw,options={}){
    const t=Number.isFinite(raw)?raw:184,mode=options.mode||'focus',q=clamp(options.progress||0),s=smooth(q),consensus=clamp(options.consensus||0),hit=clamp(options.hit||0),view=options.view;
    const activeIndex=Number.isFinite(options.activeIndex)?Math.max(0,Math.min(7,Math.round(options.activeIndex))):Math.min(7,Math.floor(consensus*8));
    const voiceMode=options.communication===true||(mode==='focus'&&!Number.isFinite(options.activeIndex)&&consensus===0);
    drawScreens(t,consensus,mode,voiceMode);circuit.visible=view==='circuit'||mode==='rows';result.visible=mode==='room'||mode==='release';
    for(let i=0;i<packets.length;i++){const path=routes[i],u=fract(t*.32+i*.127),k=Math.min(2,Math.floor(u*3)),v=u*3-k;packets[i].position.copy(path[k]).lerp(path[k+1],v);packets[i].scale.setScalar(.8+hit*.65);}
    for(const d of diodes)d.lamp.visible=consensus>=(d.index+1)/8||d.index===0;
    for(let i=0;i<resultRays.length;i++)resultRays[i].material.opacity=consensus>=(i+1)/8?.09+.10*hit:0;
    ambient.intensity=.82+(mode==='release'?.22*s:0);fill.intensity=.65+(mode==='release'?.25*s:0);
    const selected=Number.isFinite(options.station)?Math.max(0,Math.min(23,Math.round(options.station))):8+activeIndex,station=stations[selected].position,screen=screenCenters[selected];
    if(mode==='focus'&&view==='circuit')move(V(1.7,3.6,14.5),V(.7,2.2,9),V(0,.8,5),V(0,.5,-2),s,60,70,-.025,.015);
    else if(mode==='focus')move(station.clone().add(V(2.25,2.18,3.45)),station.clone().add(V(1.35,1.89,2.3)),screen.clone().add(V(-.30,.04,0)),screen.clone().add(V(-.18,.02,0)),s,54,53,.035,-.015);
    else if(mode==='rows'&&view==='aisle')move(V(0,3.6,14.3),V(0,3.0,-6),V(.4,2.3,-8),V(0,3.9,-20),s,69,68,-.018,.018);
    else if(mode==='rows')move(V(15,4.2,12.6),V(4.4,3.2,2.6),V(5,1.6,-3.8),V(-3,2.2,-8),s,62,65,.025,-.025);
    else if(mode==='room'&&view==='high')move(V(-18,9.6,17.8),V(-12,10.7,15.5),V(1,2,-2),V(1,3,-7),s,63,65,-.018,0);
    else if(mode==='room')move(V(15,7.3,17.5),V(6.8,8.3,16),V(-1,3,-8),V(-1,3.6,-10),s,61,63,.015,0);
    else move(V(5,7.2,14),V(0,10.5,20.5),V(0,4,-10),V(0,3.4,-7),s,59,66,.01,0);
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    return{stage:'ground-control/'+mode,mode,progress:q,consensus,activeIndex,activeRole:ROLES[activeIndex],station:selected,anchors:{screen:projected(screen),console:projected(station.clone().add(V(0,1,.7))),board:projected(V(0,7,-19.15)),center:projected(V(0,2.1,-1)),channel:projected(station.clone().add(V(1.56,1.16,.08))),earth:projected(V(-9.85,6.85,-19.1)),eagle:projected(V(7.95,6.85,-19.1))}};
  }
  function resize(w,h){aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();}
  update(184);return{scene,camera,update,resize};
}
