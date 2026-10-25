import * as THREE from '../vendor/three.module.js';
import {createDescent} from '../apollo-descent/descent.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-Math.pow(1-clamp(x),3),fract=x=>x-Math.floor(x);
const hash=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
const BONE=0xeeeadd,LIME=0xc6f16a,ORANGE=0xf86b3d;
function line(points,material){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);}
function setLine(object,points){const a=object.geometry.attributes.position;for(let i=0;i<points.length;i++)a.setXYZ(i,points[i].x,points[i].y,points[i].z);a.needsUpdate=true;object.geometry.computeBoundingSphere();}

// The geometry continues the approved descent environment. All distances are
// authored scene coordinates, never Apollo telemetry. A camera/mode is selected
// by the master score; no unverified voice time is encoded in this module.
export function createDecisionSpace(){
  const base=createDescent();base.update(111.8);
  const {scene,camera}=base;
  const world=scene.children.find(o=>o.isGroup&&o.children.some(g=>g.isGroup&&g.children.some(c=>c.isInstancedMesh)));
  const terrain=world?.children.find(o=>o.isGroup&&o.children.some(c=>c.isInstancedMesh));
  const craft=world?.children.find(o=>o.isGroup&&o.children.some(c=>c.isGroup&&c.children.length>100));
  const lm=craft?.children.find(o=>o.isGroup&&o.children.length>100);
  const sun=world?.children.find(o=>o.isDirectionalLight&&o.castShadow);
  const oldDownlink=world?.children.find(o=>o.isGroup&&o.children.filter(c=>c.isLine).length===5&&o.children.filter(c=>c.isMesh).length===9);
  if(!world||!terrain||!craft||!lm||!sun||!oldDownlink)throw new Error('Decision space cannot locate the preserved descent geometry.');
  const basePosition=craft.position.clone(),baseRotation=craft.rotation.clone();
  const initialCamera=camera.position.clone(),initialQuaternion=camera.quaternion.clone(),initialFov=camera.fov;
  const terrainGeometry=terrain.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.geometry.parameters.width===1000)?.geometry;
  if(!terrainGeometry)throw new Error('Decision space cannot find the near terrain height field.');
  // The first chapter's close terrain ends at a 500-unit half-width. Extend
  // that same field once for this journey, with a welded outer boundary and
  // broad features farther downrange. The approved entry keeps its old mesh.
  const originalTerrainMeshes=terrain.children.filter(o=>o.isMesh&&!o.isInstancedMesh);
  const extendedTerrain=new THREE.Group();terrain.add(extendedTerrain);
  const craters=[[-80,80,48,11],[-8,5,36,8.5],[88,-100,64,14],[160,-260,40,10],[-190,-165,85,17],[255,30,77,15],[-285,225,90,16],[15,305,56,13],[350,-470,91,22],[490,-640,124,27],[-220,-490,100,19],[160,-760,140,30]];
  for(let i=0;i<80;i++)craters.push([(hash(i*7+1)-.5)*840,(hash(i*7+2)-.5)*840,3+hash(i*7+3)*14,1+hash(i*7+4)*3.6]);
  function height(x,z,extended=true){
    let h=-(x*x+z*z)/20000+1.7*Math.sin(x*.015)*Math.cos(z*.021)+.27*Math.sin(x*.11+z*.07)+.13*Math.sin(x*.49-z*.31);
    for(let i=0;i<craters.length;i++){if(!extended&&i>=8&&i<12)continue;const [cx,cz,r,d]=craters[i],u=Math.hypot(x-cx,z-cz)/r;if(u>1.6)continue;if(u<1)h-=d*Math.pow(1-u*u,1.45);h+=d*.28*Math.exp(-Math.pow((u-1.015)/.14,2));}return h;
  }
  function makeTerrain(size,segments,inner=false){
    const g=new THREE.PlaneGeometry(size,size,segments,segments);g.rotateX(-Math.PI/2);const positions=g.attributes.position,colors=[];
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getZ(i);let y=height(x,z);
      if(inner&&(Math.abs(x)===1000||Math.abs(z)===1000)){
        const vertical=Math.abs(x)===1000,a=vertical?z:x,lo=Math.floor(a/20)*20,r=(a-lo)/20;
        y=vertical?mix(height(x,lo),height(x,lo+20),r):mix(height(lo,z),height(lo+20,z),r);
      }
      positions.setY(i,y);const variation=.59+hash(x*.23+z*.51)*.14+.045*Math.sin(x*.025+z*.018),color=new THREE.Color(0x92958c).multiplyScalar(variation);colors.push(color.r,color.g,color.b);
    }
    if(!inner){const indices=[],source=g.index.array;for(let i=0;i<source.length;i+=3){let outside=false;for(let j=0;j<3;j++){const k=source[i+j];if(Math.abs(positions.getX(k))>1000.01||Math.abs(positions.getZ(k))>1000.01)outside=true;}if(outside)indices.push(source[i],source[i+1],source[i+2]);}g.setIndex(indices);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,originalTerrainMeshes[0].material);m.receiveShadow=true;extendedTerrain.add(m);
  }
  makeTerrain(5000,250);makeTerrain(2000,500,true);
  const originalRocks=terrain.children.find(o=>o.isInstancedMesh),rockPose=new THREE.Object3D(),rockMatrix=new THREE.Matrix4();
  const rocks=new THREE.InstancedMesh(originalRocks.geometry,originalRocks.material,originalRocks.count+620);rocks.castShadow=true;rocks.receiveShadow=true;extendedTerrain.add(rocks);
  for(let i=0;i<originalRocks.count;i++){
    originalRocks.getMatrixAt(i,rockMatrix);rockMatrix.decompose(rockPose.position,rockPose.quaternion,rockPose.scale);
    rockPose.position.y+=height(rockPose.position.x,rockPose.position.z)-height(rockPose.position.x,rockPose.position.z,false);rockPose.updateMatrix();rocks.setMatrixAt(i,rockPose.matrix);
  }
  for(let i=0;i<620;i++){
    const x=hash(i*19+6001)*850-120,z=-280-hash(i*19+6002)*650,s=.3+Math.pow(hash(i*19+6003),3)*2.8;
    rockPose.position.set(x,height(x,z)+s*.28,z);rockPose.rotation.set(hash(i+6010)*3,hash(i+6020)*TAU,hash(i+6030)*3);rockPose.scale.set(s*1.3,s*.72,s);rockPose.updateMatrix();rocks.setMatrixAt(originalRocks.count+i,rockPose.matrix);
  }
  // Tangent follows the prior camera chapter; the endpoint is still in flight.
  const path=new THREE.CubicBezierCurve3(basePosition,basePosition.clone().add(V(78,-22,-118)),basePosition.clone().add(V(185,-32,-253)),basePosition.clone().add(V(265,-44,-365)));
  const guides=new THREE.Group();world.add(guides);
  const lime=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.82});
  const white=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.48});
  const quiet=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.15});
  const orange=new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.83});
  const pathGroup=new THREE.Group();guides.add(pathGroup);
  const allPoints=path.getPoints(360);
  const planned=line(allPoints,new THREE.LineDashedMaterial({color:BONE,transparent:true,opacity:.30,dashSize:2,gapSize:2}));planned.computeLineDistances();pathGroup.add(planned);
  const travelled=line(allPoints,lime);pathGroup.add(travelled);
  const gateGroup=new THREE.Group();pathGroup.add(gateGroup);
  for(let i=0;i<22;i++){
    const u=i/24,p=path.getPoint(u),t=path.getTangent(u),side=V(-t.z,0,t.x).normalize();
    const rung=line([p.clone().addScaledVector(side,-4.1),p.clone().addScaledVector(side,4.1)],quiet);rung.userData.u=u;gateGroup.add(rung);
  }
  const future=new THREE.Group();guides.add(future);
  const futureMaterial=new THREE.MeshBasicMaterial({color:LIME,transparent:true,opacity:.75});
  const futureDot=new THREE.Mesh(new THREE.OctahedronGeometry(.68,0),futureMaterial);future.add(futureDot);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2,s=3.5;future.add(line([V(Math.cos(a)*s,0,Math.sin(a)*s),V(Math.cos(a)*s,1.4,Math.sin(a)*s)],lime));
  }
  const reference=new THREE.Group();guides.add(reference);
  const axes=[];
  for(const d of [V(1,0,0),V(0,1,0),V(0,0,1)]){const l=line([d.clone().multiplyScalar(-6),d.clone().multiplyScalar(8)],quiet);reference.add(l);axes.push(l);}
  const referenceArc=line(Array.from({length:97},(_,i)=>{const a=i/96*TAU;return V(Math.cos(a)*8,0,Math.sin(a)*8);}),white);reference.add(referenceArc);
  const bodyAxes=new THREE.Group();guides.add(bodyAxes);
  for(const [d,m]of [[V(1,0,0),orange],[V(0,1,0),lime],[V(0,0,1),white]])bodyAxes.add(line([d.clone().multiplyScalar(-5),d.clone().multiplyScalar(7)],m));
  const commandVector=new THREE.ArrowHelper(V(0,1,0),V(),12,ORANGE,1.0,.35);guides.add(commandVector);
  const velocityVector=new THREE.ArrowHelper(V(1,0,0),V(),19,LIME,1.15,.42);guides.add(velocityVector);
  for(const arrow of [commandVector,velocityVector]){arrow.line.material.transparent=true;arrow.line.material.opacity=.85;arrow.cone.material.transparent=true;arrow.cone.material.opacity=.85;}
  // Sighting geometry and state transfer are separate objects: the former
  // touches the visible terrain, the latter travels away toward the ground.
  const sighting=new THREE.Group();guides.add(sighting);
  const sightLines=Array.from({length:3},(_,i)=>{const o=line([V(),V()],i===0?lime:quiet);sighting.add(o);return o;});
  const surfaceMarks=Array.from({length:3},(_,i)=>{const o=line(Array.from({length:49},()=>V()),i===0?lime:quiet);sighting.add(o);return o;});
  const samples=Array.from({length:9},(_,i)=>{const o=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),new THREE.MeshBasicMaterial({color:i%3===0?LIME:BONE}));sighting.add(o);return o;});
  const transfer=new THREE.Group();guides.add(transfer);
  const links=Array.from({length:5},(_,i)=>{const o=line([V(),V(),V()],i===2?lime:quiet);transfer.add(o);return o;});
  const packets=Array.from({length:12},(_,i)=>{const o=new THREE.Mesh(new THREE.OctahedronGeometry(.36,0),new THREE.MeshBasicMaterial({color:i%3===0?LIME:BONE}));transfer.add(o);return o;});
  const systemSpine=new THREE.Group();guides.add(systemSpine);
  const systemPoints=[V(-5,1.2,0),V(-5,3.6,0),V(-5,6.4,0),V(0,6.4,0),V(5,6.4,0),V(5,3.6,0),V(5,1.2,0)];
  systemSpine.add(line(systemPoints,white));
  const systemNodes=systemPoints.map((p,i)=>{const o=new THREE.Mesh(new THREE.OctahedronGeometry(i===3?.3:.2,0),new THREE.MeshBasicMaterial({color:i===3?ORANGE:LIME}));o.position.copy(p);systemSpine.add(o);return o;});
  const branchPoints=[V(-1.75,4.9,.85),V(0,1.7,0),V(-1.28,5.37,.26)];
  for(let i=0;i<3;i++)systemSpine.add(line([systemPoints[i*2],branchPoints[i]],quiet));
  const release=new THREE.Group();guides.add(release);
  const releaseLines=Array.from({length:8},()=>{const o=line(Array.from({length:49},()=>V()),quiet);release.add(o);return o;});
  const releasePackets=Array.from({length:8},()=>{const o=new THREE.Mesh(new THREE.OctahedronGeometry(.44,0),new THREE.MeshBasicMaterial({color:LIME}));release.add(o);return o;});
  const activeNames=['return','path','guidance','control','systems','collective'];
  let aspect=16/9;
  const p=V(),target=V(),direction=V(),surface=V(),ahead=V(),linkEnd=V();
  function projected(point){const q=point.clone().project(camera);return{x:(q.x+1)/2,y:(1-q.y)/2,visible:q.z>-1&&q.z<1&&Math.abs(q.x)<1.3&&Math.abs(q.y)<1.3};}
  function cameraTo(position,look,fov,roll){camera.position.copy(position);camera.up.set(0,1,0);camera.lookAt(look);camera.rotateZ(roll);camera.fov=fov;camera.aspect=aspect;camera.updateProjectionMatrix();}
  function cameraLerp(a,b,la,lb,q,fa=58,fb=fa,ra=0,rb=ra){cameraTo(a.clone().lerp(b,q),la.clone().lerp(lb,q),mix(fa,fb,q),mix(ra,rb,q));}
  function update(raw,options={}){
    const t=Math.max(111.8,Number.isFinite(raw)?raw:111.8),mode=activeNames.includes(options.mode)?options.mode:'return';
    const q=clamp(Number.isFinite(options.progress)?options.progress:0),s=smooth(q),hit=clamp(options.hit||0),elapsed=t-111.8;
    // A fixed flight clock avoids a backward jump when a new speaker starts.
    const flight=clamp(elapsed/42)*.86;
    base.update(111.8);
    for(const g of world.children)if(g.isGroup&&g!==craft&&g!==terrain&&g!==guides)g.visible=false;
    guides.visible=true;terrain.visible=true;craft.visible=true;
    extendedTerrain.visible=elapsed>0;originalRocks.visible=elapsed===0;for(const m of originalTerrainMeshes)m.visible=elapsed===0;
    path.getPoint(flight,p);path.getTangent(flight,direction);direction.normalize();
    craft.position.copy(p);craft.rotation.set(mix(baseRotation.x,.095,flight),mix(baseRotation.y,.67,flight),mix(baseRotation.z,.06,flight));
    // A judgment hit settles a small command correction; it never restarts
    // the engine or invents a repeated burn for each controller response.
    if(mode==='control'){craft.rotation.z+=.08*(1-out(q/.48));craft.rotation.x+=.055*(1-out(q/.48));}
    craft.updateMatrixWorld(true);target.copy(p).add(V(0,3.1,0));
    surface.set(p.x,height(p.x,p.z),p.z);path.getPoint(Math.min(.98,flight+.2),ahead);
    travelled.geometry.setDrawRange(0,Math.max(2,Math.round(flight*361)));
    gateGroup.children.forEach(o=>{o.visible=o.userData.u>flight-.04&&o.userData.u<flight+.34;});
    future.position.copy(ahead);futureDot.scale.setScalar(1+hit*.32);
    pathGroup.visible=mode==='path'||mode==='guidance'||mode==='collective';future.visible=mode==='path'||mode==='guidance';
    reference.visible=mode==='control';bodyAxes.visible=mode==='control';reference.position.copy(target);bodyAxes.position.copy(target);bodyAxes.rotation.copy(craft.rotation);
    commandVector.visible=mode==='control';commandVector.position.copy(target);commandVector.setDirection(V(0,1,0).applyEuler(craft.rotation).normalize());commandVector.setLength(10+hit*1.4,1,.35);
    velocityVector.visible=mode==='path'||mode==='guidance';velocityVector.position.copy(target);velocityVector.setDirection(direction);velocityVector.setLength(18+hit*1.4,1.15,.42);
    sighting.visible=mode==='guidance';
    for(let i=0;i<3;i++){
      const ground=V(p.x+12+i*12,0,p.z-24-i*15);ground.y=height(ground.x,ground.z)+.35;
      setLine(sightLines[i],[p.clone().add(V(0,1.2,0)),ground]);
      setLine(surfaceMarks[i],Array.from({length:49},(_,j)=>{const a=j/48*TAU,r=5+i*2,x=ground.x+Math.cos(a)*r,z=ground.z+Math.sin(a)*r;return V(x,height(x,z)+.35,z);}));
      for(let j=0;j<3;j++){const u=fract(t*.75+j/3);samples[i*3+j].position.copy(ground).lerp(target,u);}
    }
    transfer.visible=mode==='return'||mode==='systems';
    linkEnd.copy(p).add(V(-90,65,12));const linkStart=p.clone().add(V(-1,5.5,0)),mid=linkStart.clone().add(V(-30,24,7));
    for(let i=0;i<5;i++)setLine(links[i],[linkStart,mid.clone().add(V(-i+2,i-2,(i-2)*1.4)),linkEnd.clone().add(V(-i*3,i*2,i*1.6))]);
    for(let i=0;i<packets.length;i++){const u=fract(t*.46+i/packets.length);packets[i].position.copy(u<.4?linkStart.clone().lerp(mid,u/.4):mid.clone().lerp(linkEnd,(u-.4)/.6));}
    systemSpine.visible=mode==='systems';systemSpine.position.copy(p);systemSpine.rotation.copy(craft.rotation);
    for(let i=0;i<systemNodes.length;i++)systemNodes[i].scale.setScalar(1+(1-Math.abs(fract(t*.55-i*.16)*2-1))*.35+hit*.2);
    release.visible=mode==='collective'&&q<.46;
    for(let i=0;i<8;i++){
      const angle=i/8*TAU,origin=p.clone().add(V(Math.cos(angle)*70,28+Math.sin(angle)*28,Math.sin(angle)*40));
      const bend=p.clone().add(V(Math.cos(angle)*26,17+Math.sin(angle)*10,Math.sin(angle)*15));
      const curve=new THREE.QuadraticBezierCurve3(origin,bend,target);setLine(releaseLines[i],curve.getPoints(48));
      releasePackets[i].position.copy(curve.getPoint(out(q/.38)));releasePackets[i].scale.setScalar(mix(.9,.2,smooth(q/.45)));
    }
    if(elapsed>0){sun.target.position.copy(surface);sun.position.copy(surface).add(V(-220,75,150));sun.target.updateMatrixWorld();}
    if(mode==='return'){
      const move=p.clone().sub(basePosition);
      cameraLerp(initialCamera.clone().add(move),p.clone().add(V(-67,47,71)),basePosition.clone().add(V(-23,17,3)).add(move),p.clone().add(V(-27,19,-2)),s,initialFov,60,.02,-.035);
      if(elapsed===0){camera.position.copy(initialCamera);camera.quaternion.copy(initialQuaternion);camera.fov=initialFov;camera.aspect=aspect;camera.updateProjectionMatrix();oldDownlink.visible=true;transfer.visible=false;}
    }else if(mode==='path'&&options.round===2){
      cameraLerp(p.clone().add(V(64,60,42)),p.clone().add(V(48,49,31)),p.clone().add(V(12,-3,-26)),p.clone().add(V(16,-5,-35)),s,60,58,.035,-.025);
    }else if(mode==='path'){
      cameraLerp(p.clone().add(V(-52,83,95)),p.clone().add(V(-40,65,76)),p.clone().add(V(24,-2,-27)),p.clone().add(V(33,-5,-41)),s,59,59,-.07,.015);
    }else if(mode==='guidance'&&options.round===2){
      cameraLerp(p.clone().add(V(24,36,-39)),p.clone().add(V(20,30,-31)),p.clone().add(V(-4,-12,-3)),p.clone().add(V(-2,-16,-5)),s,60,57,-.02,.035);
    }else if(mode==='guidance'){
      cameraLerp(p.clone().add(V(-34,28,47)),p.clone().add(V(-26,21,36)),p.clone().add(V(8,-13,-18)),p.clone().add(V(12,-18,-25)),s,56,55,.025,-.035);
    }else if(mode==='control'&&options.round===2){
      cameraLerp(p.clone().add(V(-13,10,-17)),p.clone().add(V(-10,8.5,-15)),target.clone().add(V(4.3,1,0)),target.clone().add(V(3.7,.7,0)),s,58,56,.03,-.01);
    }else if(mode==='control'){
      cameraLerp(p.clone().add(V(12,10,18)),p.clone().add(V(9,8.5,16)),target.clone().add(V(-4.8,1,0)),target.clone().add(V(-4.3,.7,0)),s,58,56,-.04,.015);
    }else if(mode==='systems'&&options.round===2){
      cameraLerp(p.clone().add(V(13,9,-20)),p.clone().add(V(11,7.5,-17)),target.clone().add(V(5.5,1,0)),target.clone().add(V(4.5,.8,0)),s,55,54,-.035,.025);
    }else if(mode==='systems'){
      cameraLerp(p.clone().add(V(-14,9,20)),p.clone().add(V(-11,7.5,17)),target.clone().add(V(-6.5,1,0)),target.clone().add(V(-5.5,.8,0)),s,55,54,.035,-.025);
    }else{
      // All local decisions release one shared trajectory. The camera drops
      // beside Eagle, exposing solid terrain rushing past at different depths.
      const acceleration=out((q-.12)/.88);
      cameraLerp(p.clone().add(V(-44,44,64)),p.clone().add(V(-14,7,23)),p.clone().add(V(6,-7,-18)),p.clone().add(V(72,-34,-100)),acceleration,60,69,-.035,.018);
      pathGroup.visible=q<.55;
    }
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    return{stage:'second-decision/'+mode,mode,progress:q,flightProgress:flight,altitudeAboveAuthoredTerrain:p.y-surface.y,cameraAltitudeAboveAuthoredTerrain:camera.position.y-height(camera.position.x,camera.position.z),anchors:{spacecraft:projected(target),engine:projected(lm.localToWorld(V(0,1.3,0))),velocity:projected(target.clone().addScaledVector(direction,18)),surface:projected(surface),target:projected(ahead),downlink:projected(linkEnd),command:projected(target.clone().add(V(0,12,0)))}};
  }
  function resize(w,h){aspect=w/h;base.resize(w,h);}
  update(111.8,{mode:'return',progress:0});
  return{scene,camera,update,resize,dispose:()=>base.dispose()};
}
