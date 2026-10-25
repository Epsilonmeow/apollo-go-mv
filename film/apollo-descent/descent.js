import * as THREE from '../vendor/three.module.js';
import {createPreparation} from '../apollo-first-go/preparation.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const CUTS=[88,90.4644,92.5197,94.5950,96.6503,98.6957,100.7610,102.8063,104.8916,106.9370,108.9823,111.0476,111.8];
const NAMES=['commitment-continues','engine-under-load','attitude-changes-force','force-bends-flight','inside-the-trajectory','lunar-scale-release','terrain-relative-flight','crater-rim-crossing','surface-closes','range-and-range-rate','measurements-return','next-decision'];
const BONE=0xeeeadd,LIME=0xc6f16a,ORANGE=0xf86b3d;
function line(ps,mat){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(ps),mat);}
function circle(center,r,yfn,n=120){return Array.from({length:n+1},(_,i)=>{const a=i/n*TAU,x=center.x+Math.cos(a)*r,z=center.z+Math.sin(a)*r;return V(x,yfn(x,z),z);});}

// This camera score continues the approved vehicle, then exchanges orbital
// coordinates for an authored, curved terrain field. It is a scale transition,
// not a claim that these rendered coordinates reproduce Apollo telemetry.
export function createDescent(){
  const previous=createPreparation();previous.update(1,{commit:1});
  const scene=previous.scene,camera=previous.camera;
  camera.near=.025;camera.far=2800;camera.updateProjectionMatrix();
  const originalChildren=scene.children.slice();
  const craftSpace=originalChildren.find(o=>o.isGroup&&o.children.some(c=>c.isGroup&&c.children.length>100));
  const originalLM=craftSpace?.children.find(o=>o.isGroup&&o.children.length>100);
  if(!originalLM)throw new Error('Descent cannot locate the approved Eagle model.');
  const originalMoon=originalChildren.find(o=>o.geometry?.type==='SphereGeometry');
  const baseCamera=camera.position.clone(),baseQuaternion=camera.quaternion.clone();
  const baseCraft=originalLM.getWorldPosition(V());
  const world=new THREE.Group();scene.add(world);world.visible=false;
  const craft=new THREE.Group();world.add(craft);
  const lm=originalLM.clone(true);lm.position.set(0,0,0);lm.rotation.set(0,0,0);lm.scale.setScalar(1);craft.add(lm);
  const engine=lm.children.find(o=>o.isGroup&&Math.abs(o.position.y-1.7)<.001&&o.children.some(c=>c.geometry?.type==='CylinderGeometry'));
  const enginePlume=engine?.children.find(o=>o.geometry?.type==='ConeGeometry'&&o.material?.transparent);
  if(enginePlume){enginePlume.material=enginePlume.material.clone();enginePlume.material.opacity=.023;}
  const legacyPlumeMaterial=enginePlume?.material;
  const moon=originalMoon?.clone();if(moon){moon.position.set(-240,-245,-600);moon.scale.setScalar(3.5);world.add(moon);}
  world.add(new THREE.HemisphereLight(0xc6d1da,0x080d12,.55));
  const sunlight=new THREE.DirectionalLight(0xf6f0df,3.6);world.add(sunlight,sunlight.target);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);Object.assign(sunlight.shadow.camera,{left:-110,right:110,top:110,bottom:-110,near:1,far:650});sunlight.shadow.bias=-.00002;sunlight.shadow.normalBias=.25;
  const fill=new THREE.DirectionalLight(0x7f9fa8,.25);fill.position.set(35,30,-40);world.add(fill);
  const engineLight=new THREE.PointLight(0xd5ddd4,1.5,10,2);craft.add(engineLight);engineLight.position.set(0,.3,2.5);
  const lime=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.82});
  const quiet=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.19});
  const orange=new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.8});
  const white=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.63});
  const relation=new THREE.Group();world.add(relation);
  const thrust=new THREE.ArrowHelper(V(0,1,0),V(),12,ORANGE,1.2,.46),velocity=new THREE.ArrowHelper(V(1,0,0),V(),18,LIME,1.25,.5);relation.add(thrust,velocity);
  for(const arrow of [thrust,velocity]){arrow.line.material.transparent=true;arrow.line.material.opacity=.9;arrow.cone.material.transparent=true;arrow.cone.material.opacity=.95;}
  const bodyDatum=new THREE.Group();craft.add(bodyDatum);bodyDatum.position.y=3;
  for(let a=0;a<3;a++){
    const ps=[];for(let i=0;i<=100;i++){const q=i/100*TAU;ps.push(a===0?V(0,Math.cos(q)*7,Math.sin(q)*7):a===1?V(Math.cos(q)*7,0,Math.sin(q)*7):V(Math.cos(q)*7,Math.sin(q)*7,0));}bodyDatum.add(line(ps,a===1?lime:quiet));
  }
  // Position, velocity and thrust are distinct geometrical objects. The path
  // is progressively revealed; it is never another engine switching on.
  const curve=new THREE.CubicBezierCurve3(V(-115,104,155),V(-40,92,75),V(85,66,-65),V(180,37,-220));
  const route=new THREE.Group();world.add(route);
  const routePoints=curve.getPoints(320);
  const routeGhost=line(routePoints,new THREE.LineDashedMaterial({color:BONE,transparent:true,opacity:.22,dashSize:2,gapSize:2}));routeGhost.computeLineDistances();route.add(routeGhost);
  const activeRoute=line(routePoints,lime);route.add(activeRoute);
  const arcMarks=new THREE.Group();route.add(arcMarks);
  for(let i=0;i<28;i++){
    const p=curve.getPoint(i/27),t=curve.getTangent(i/27),across=V(-t.z,0,t.x).normalize();
    arcMarks.add(line([p.clone().addScaledVector(across,-2.2),p.clone().addScaledVector(across,2.2)],quiet));
  }
  const trajectoryPlane=new THREE.Group();world.add(trajectoryPlane);
  for(let i=-6;i<=6;i++){
    trajectoryPlane.add(line([V(-150,54,i*32),V(230,54,i*32)],quiet));
    trajectoryPlane.add(line([V(i*32,54,-260),V(i*32,54,220)],quiet));
  }
  // The engineering profile supplies the flat reference first. A restrained
  // spatial grid appears only when the camera travels into that reference.
  const planeMaterial=quiet.clone();planeMaterial.opacity=.085;
  for(const guide of trajectoryPlane.children)guide.material=planeMaterial;

  // Broad curvature and a separately sampled foreground make the horizon,
  // crater rims and near rocks move at genuinely different angular speeds.
  const terrain=new THREE.Group();world.add(terrain);
  const craters=[[-80,80,48,11],[-8,5,36,8.5],[88,-100,64,14],[160,-260,40,10],[-190,-165,85,17],[255,30,77,15],[-285,225,90,16],[15,305,56,13]];
  for(let i=0;i<80;i++)craters.push([(hash(i*7+1)-.5)*840,(hash(i*7+2)-.5)*840,3+hash(i*7+3)*14,1+hash(i*7+4)*3.6]);
  const height=(x,z)=>{
    let h=-(x*x+z*z)/20000+1.7*Math.sin(x*.015)*Math.cos(z*.021)+.27*Math.sin(x*.11+z*.07)+.13*Math.sin(x*.49-z*.31);
    for(const [cx,cz,r,d]of craters){const u=Math.hypot(x-cx,z-cz)/r;if(u>1.6)continue;if(u<1)h-=d*Math.pow(1-u*u,1.45);h+=d*.28*Math.exp(-Math.pow((u-1.015)/.14,2));}
    return h;
  };
  const terrainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  function makeTerrain(size,segments,omit){
    const geometry=new THREE.PlaneGeometry(size,size,segments,segments);geometry.rotateX(-Math.PI/2);
    const p=geometry.attributes.position,cols=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i);p.setY(i,height(x,z));
      const variation=.59+hash(x*.23+z*.51)*.14+.045*Math.sin(x*.025+z*.018);
      const c=new THREE.Color(0x92958c).multiplyScalar(variation);cols.push(c.r,c.g,c.b);
    }
    if(omit){const ix=geometry.index.array,out=[];for(let i=0;i<ix.length;i+=3){const x=(p.getX(ix[i])+p.getX(ix[i+1])+p.getX(ix[i+2]))/3,z=(p.getZ(ix[i])+p.getZ(ix[i+1])+p.getZ(ix[i+2]))/3;if(Math.abs(x)>omit||Math.abs(z)>omit)out.push(ix[i],ix[i+1],ix[i+2]);}geometry.setIndex(out);}
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,terrainMaterial);mesh.receiveShadow=true;terrain.add(mesh);
  }
  makeTerrain(5000,250,500);makeTerrain(1000,320,0);
  const rockGeometry=new THREE.IcosahedronGeometry(1,0),rockMaterial=new THREE.MeshStandardMaterial({color:0x686c63,roughness:1,flatShading:true});
  const rocks=new THREE.InstancedMesh(rockGeometry,rockMaterial,680),dummy=new THREE.Object3D();rocks.receiveShadow=true;rocks.castShadow=true;
  for(let i=0;i<680;i++){
    const x=(hash(i*13+2)-.5)*800,z=(hash(i*13+3)-.5)*800,s=.35+Math.pow(hash(i*13+4),3)*2.4;
    dummy.position.set(x,height(x,z)+s*.28,z);dummy.rotation.set(hash(i+4)*3,hash(i+8)*TAU,hash(i+11)*3);dummy.scale.set(s*1.3,s*.72,s);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  terrain.add(rocks);
  const radar=new THREE.Group();world.add(radar);
  const radarLines=[];
  for(let i=0;i<4;i++){const l=line([V(),V()],i===0?lime:quiet);l.frustumCulled=false;radar.add(l);radarLines.push(l);}
  const footprint=new THREE.Group();radar.add(footprint);
  const footprintRing=line(Array.from({length:65},()=>V()),lime);footprintRing.frustumCulled=false;footprint.add(footprintRing);
  const samplingDots=[];
  for(let i=0;i<12;i++){const d=new THREE.Mesh(new THREE.OctahedronGeometry(.38,0),new THREE.MeshBasicMaterial({color:i%4===0?LIME:BONE}));radar.add(d);samplingDots.push(d);}
  const downlink=new THREE.Group();world.add(downlink);
  const uplinkWires=[];
  for(let i=0;i<5;i++){const l=line([V(),V(),V()],i===2?lime:quiet);l.frustumCulled=false;downlink.add(l);uplinkWires.push(l);}
  const packets=[];
  for(let i=0;i<9;i++){const d=new THREE.Mesh(new THREE.OctahedronGeometry(.38,0),new THREE.MeshBasicMaterial({color:i%3===0?LIME:BONE}));downlink.add(d);packets.push(d);}
  const rangeGuides=new THREE.Group();world.add(rangeGuides);
  for(const k of [0,1,2]){
    const [x,z,r]=craters[k];rangeGuides.add(line(circle(V(x,0,z),r*1.03,(a,b)=>height(a,b)+.3),k===2?lime:quiet));
  }
  let aspect=16/9;
  const p=V(),target=V(),thrustDirection=V(),velDirection=V(),surfacePoint=V(),radarPoint=V(),downlinkPoint=V();
  const setCamera=(pos,look,fov=54,roll=0)=>{camera.position.copy(pos);camera.up.set(0,1,0);camera.lookAt(look);camera.rotateZ(roll);camera.fov=fov;camera.aspect=aspect;camera.updateProjectionMatrix();};
  function cameraMotion(a,b,lookA,lookB,s,fovA=54,fovB=fovA,rollA=0,rollB=rollA){setCamera(a.clone().lerp(b,s),lookA.clone().lerp(lookB,s),mix(fovA,fovB,s),mix(rollA,rollB,s));}
  function projected(point){const q=point.clone().project(camera);return{x:(q.x+1)/2,y:(1-q.y)/2,visible:q.z>-1&&q.z<1&&Math.abs(q.x)<1.3&&Math.abs(q.y)<1.3};}
  function update(raw,opts={}){
    const t=Math.max(88,Math.min(111.8,Number.isFinite(raw)?raw:88));
    let stage=0;for(let i=1;i<CUTS.length-1;i++)if(t>=CUTS[i])stage=i;
    const q=clamp((t-CUTS[stage])/(CUTS[stage+1]-CUTS[stage])),s=smooth(q);
    for(const o of originalChildren)o.visible=stage===0;
    world.visible=stage>0;
    if(stage===0){
      previous.update(1,{commit:1});
      const push=smooth((t-88.2395)/(90.4644-88.2395));
      originalLM.position.add(V(3.4*push,-1.1*push,-4.8*push));
      camera.position.copy(baseCamera).lerp(baseCraft.clone().add(V(13,8,23)),push*.24);camera.quaternion.copy(baseQuaternion);camera.fov=58;camera.aspect=aspect;camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const craftPos=originalLM.getWorldPosition(V());
      return{stage:NAMES[0],stageIndex:0,progress:q,anchors:{spacecraft:projected(craftPos),thrust:projected(craftPos),surface:projected(V(0,-35,-30))}};
    }
    const travel=clamp((t-90.4644)/(111.8-90.4644));
    const flight=clamp(.08+travel*.81);curve.getPoint(flight,p);craft.position.copy(p);
    // A restrained sustained braking attitude; the force acts against the
    // horizontal travel, while still having an upward component.
    craft.rotation.set(mix(.28,.15,travel),mix(.35,.55,travel),mix(.40,.15,travel));
    if(stage===2){craft.rotation.x=mix(.42,.24,s);craft.rotation.z=mix(.58,.33,s);}
    if(engine)engine.rotation.set(.015+Math.sin(t*.7)*.008,0,-.045);
    if(enginePlume){enginePlume.visible=false;enginePlume.scale.set(1,.7,1);legacyPlumeMaterial.opacity=.01;}
    engineLight.intensity=stage===1?13:1.5;
    craft.updateMatrixWorld(true);
    target.copy(p).add(V(0,3.1,0));
    thrustDirection.set(0,1,0).applyEuler(craft.rotation).normalize();
    curve.getTangent(flight,velDirection).normalize();
    thrust.position.copy(target);thrust.setDirection(thrustDirection);thrust.setLength(stage===1?8:12,1.1,.43);
    velocity.position.copy(target);velocity.setDirection(velDirection);velocity.setLength(mix(21,13,travel),1.3,.5);
    relation.visible=stage>=1&&stage<=4;velocity.visible=stage>=2;
    bodyDatum.visible=stage===2;
    route.visible=stage===3||stage===4||stage===5;trajectoryPlane.visible=stage===4;
    activeRoute.geometry.setDrawRange(0,Math.max(2,Math.floor(321*flight)));
    if(moon)moon.visible=stage<5;
    terrain.visible=stage>=5;rangeGuides.visible=stage===8||stage===9;
    radar.visible=stage===9;downlink.visible=stage>=10;
    surfacePoint.set(p.x,height(p.x,p.z),p.z);
    radarPoint.copy(surfacePoint).add(V(8,0,-16));radarPoint.y=height(radarPoint.x,radarPoint.z)+.4;
    downlinkPoint.copy(p).add(V(-90,65,12));
    sunlight.target.position.copy(stage>=5?surfacePoint:target);sunlight.position.copy(sunlight.target.position).add(stage>=5?V(-220,75,150):V(-165,150,190));sunlight.target.updateMatrixWorld();
    if(stage===1){
      // The change of scale lands on the bell, with trusses passing in front
      // of it rather than presenting a disconnected engine illustration.
      cameraMotion(lm.localToWorld(V(1.8,-2.5,1.8)),lm.localToWorld(V(1.2,-1.7,1.2)),lm.localToWorld(V(0,1.15,0)),lm.localToWorld(V(0,1.25,0)),s,52,50,-.10,.055);
    }else if(stage===2){
      cameraMotion(p.clone().add(V(8,7,13)),p.clone().add(V(15,10,22)),target.clone().add(V(-3,1,-3)),target.clone().add(V(-4,1,-3)),s,58,59,.08,-.05);
    }else if(stage===3){
      cameraMotion(p.clone().add(V(42,75,70)),p.clone().add(V(16,52,48)),p.clone().add(V(24,-1,-30)),p.clone().add(V(22,-1,-30)),s,56,58,-.18,.06);
    }else if(stage===4){
      const forward=velDirection.clone();
      cameraMotion(p.clone().add(V(15,12,38)),p.clone().addScaledVector(forward,25).add(V(6,5,18)),p.clone().addScaledVector(forward,70),p.clone().addScaledVector(forward,130),s,62,66,.06,-.10);
    }else if(stage===5){
      // Scale release: the globe has become solid, raking-lit terrain. The
      // vehicle and the far horizon remain in the same moving camera frame.
      cameraMotion(p.clone().add(V(-34,22,58)),p.clone().add(V(-26,15,46)),p.clone().add(V(30,-39,-55)),p.clone().add(V(42,-42,-75)),s,62,59,-.055,.025);
    }else if(stage===6){
      cameraMotion(p.clone().add(V(-13,5,19)),p.clone().add(V(-9,2,16)),p.clone().add(V(9,-6,-18)),p.clone().add(V(14,-8,-24)),s,62,63,.035,-.025);
    }else if(stage===7){
      cameraMotion(p.clone().add(V(26,8,-34)),p.clone().add(V(21,7,-30)),p.clone().add(V(-12,-17,14)),p.clone().add(V(-16,-20,19)),s,60,59,-.06,.03);
    }else if(stage===8){
      // Low-forward observer: the foreground rim crosses quickly, while the
      // distant slope drifts. The vehicle remains high above the ground.
      cameraMotion(p.clone().add(V(-2,-11,10)),p.clone().add(V(0,-15,6)),p.clone().add(V(55,-53,-95)),p.clone().add(V(72,-59,-125)),s,67,67,-.07,.015);
    }else if(stage===9){
      cameraMotion(p.clone().add(V(-34,28,38)),p.clone().add(V(-24,23,32)),p.clone().add(V(3,-24,-8)),p.clone().add(V(5,-26,-11)),s,57,54,.04,-.025);
    }else if(stage===10){
      cameraMotion(p.clone().add(V(-11,11,18)),p.clone().add(V(-30,23,35)),p.clone().add(V(-9,11,0)),p.clone().add(V(-17,15,2)),s,58,59,-.04,.02);
    }else{
      cameraMotion(p.clone().add(V(-30,23,35)),p.clone().add(V(-44,32,48)),p.clone().add(V(-17,15,2)),p.clone().add(V(-23,17,3)),s,59,60,.02,.02);
    }
    const beamStart=p.clone().add(V(0,1.1,0));
    for(let i=0;i<4;i++){
      const a=i/4*TAU+.22,beamEnd=radarPoint.clone().add(V(Math.cos(a)*(i?14:0),0,Math.sin(a)*(i?14:0)));beamEnd.y=height(beamEnd.x,beamEnd.z)+.28;
      radarLines[i].geometry.attributes.position.setXYZ(0,beamStart.x,beamStart.y,beamStart.z);radarLines[i].geometry.attributes.position.setXYZ(1,beamEnd.x,beamEnd.y,beamEnd.z);radarLines[i].geometry.attributes.position.needsUpdate=true;
      for(let j=0;j<3;j++){const d=samplingDots[i*3+j],v=(t*1.2+j/3+i*.09)%1;d.position.copy(beamEnd).lerp(beamStart,v);d.scale.setScalar(.6+.5*Math.sin(v*Math.PI));}
    }
    const ring=footprintRing.geometry.attributes.position;
    for(let i=0;i<ring.count;i++){const a=i/(ring.count-1)*TAU,r=14,x=radarPoint.x+Math.cos(a)*r,z=radarPoint.z+Math.sin(a)*r;ring.setXYZ(i,x,height(x,z)+.35,z);}ring.needsUpdate=true;
    const linkStart=p.clone().add(V(-1,5.5,0));
    for(let i=0;i<5;i++){
      const mid=linkStart.clone().add(V(-28-i,22+i,5+i)),end=downlinkPoint.clone().add(V(-i*3,i*2,i*1.6));
      const a=uplinkWires[i].geometry.attributes.position;a.setXYZ(0,linkStart.x,linkStart.y,linkStart.z);a.setXYZ(1,mid.x,mid.y,mid.z);a.setXYZ(2,end.x,end.y,end.z);a.needsUpdate=true;
    }
    for(let i=0;i<packets.length;i++){const u=(t*.46+i/packets.length)%1,mid=linkStart.clone().add(V(-30,24,7));packets[i].position.copy(u<.4?linkStart.clone().lerp(mid,u/.4):mid.lerp(downlinkPoint,(u-.4)/.6));}
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    return{stage:NAMES[stage],stageIndex:stage,progress:q,flightProgress:flight,altitudeAboveAuthoredTerrain:p.y-surfacePoint.y,cameraAltitudeAboveAuthoredTerrain:camera.position.y-height(camera.position.x,camera.position.z),anchors:{spacecraft:projected(target),engine:projected(lm.localToWorld(V(0,1.3,0))),thrust:projected(target.clone().addScaledVector(thrustDirection,12)),velocity:projected(target.clone().addScaledVector(velDirection,18)),surface:projected(surfacePoint),radar:projected(radarPoint),downlink:projected(downlinkPoint)}};
  }
  function resize(w,h){aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();}
  function dispose(){
    const geometries=new Set(),materials=new Set();world.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();previous.dispose();
  }
  update(88);return{scene,camera,update,resize,dispose};
}
