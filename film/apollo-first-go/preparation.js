import * as THREE from '../vendor/three.module.js';
import {createLunar} from '../apollo-go/lunar.js';

// Preparation is a reusable visual score in normalized time. It does not assert
// that mission hardware was powered by the later controllers' GO responses.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,q)=>a+(b-a)*q;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const ease=x=>1-Math.pow(1-clamp(x),3);
const INK=0x080d12,BONE=0xeeeadd,LIME=0xc6f16a,ORANGE=0xf86b3d;
const PHASES=[
  {start:0,end:.09,name:'eagle-orbital-continuation'},
  {start:.09,end:.19,name:'antenna-tracking'},
  {start:.19,end:.29,name:'sealed-cabin'},
  {start:.29,end:.39,name:'descent-engine-gimbal'},
  {start:.39,end:.49,name:'reaction-control'},
  {start:.49,end:.59,name:'reference-frame'},
  {start:.59,end:.72,name:'two-spacecraft'},
  {start:.72,end:.84,name:'lunar-approach'},
  {start:.84,end:.93,name:'telemetry-return'},
  {start:.93,end:1,name:'ready-for-poll'},
];
function line(points,material){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);}
function tube(a,b,r,material){
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),material);
  o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return o;
}
function box(x,y,z,m){return new THREE.Mesh(new THREE.BoxGeometry(x,y,z),m);}
function edge(o,m){o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,25),m));return o;}
function circular(radius,axis='z',count=100,start=0,end=TAU){
  return Array.from({length:count+1},(_,i)=>{const a=mix(start,end,i/count),x=Math.cos(a)*radius,y=Math.sin(a)*radius;return axis==='x'?V(0,x,y):axis==='y'?V(x,0,y):V(x,y,0);});
}

export function createPreparation(){
  // The original constructor remains the single source of the detailed Eagle.
  // Extract fresh objects by their verified structure, not world-space names
  // or a private browser API. No original instance or file is modified.
  const source=createLunar();source.update(21.65);
  const sourceGroups=source.scene.children.filter(o=>o.isGroup);
  const surface=sourceGroups.find(g=>g.children.some(o=>o.isGroup&&o.children.length>100));
  const lander=surface?.children.find(o=>o.isGroup&&o.children.length>100);
  const orbit=sourceGroups.find(g=>g!==surface&&g.children.some(o=>o.geometry?.type==='SphereGeometry'));
  const moon=orbit?.children.find(o=>o.geometry?.type==='SphereGeometry');
  const orbitalLander=orbit?.children.find(o=>o.isGroup&&o.children.length>100);
  if(!lander||!moon||!orbitalLander)throw new Error('The preserved Apollo model structure has changed; preparation cannot locate Eagle and Moon.');
  const startPosition=orbitalLander.position.clone(),startRotation=orbitalLander.rotation.clone();
  const initialCamera=source.camera.position.clone(),initialQuaternion=source.camera.quaternion.clone(),initialFov=source.camera.fov;
  const scene=new THREE.Scene();scene.background=new THREE.Color(INK);
  const camera=new THREE.PerspectiveCamera(initialFov,16/9,.025,1800);
  const craftSpace=new THREE.Group();craftSpace.position.copy(startPosition);craftSpace.scale.setScalar(.5);scene.add(craftSpace);
  lander.removeFromParent();lander.position.set(0,0,0);lander.scale.setScalar(1);lander.rotation.copy(startRotation);craftSpace.add(lander);
  moon.removeFromParent();scene.add(moon);
  const orbitGrid=orbit.children.find(o=>o.isGroup&&o!==orbitalLander&&o.children.length===11);
  if(orbitGrid){orbitGrid.removeFromParent();scene.add(orbitGrid);}
  const bone=new THREE.MeshStandardMaterial({color:BONE,roughness:.62,metalness:.25});
  const metal=new THREE.MeshStandardMaterial({color:0x929da0,roughness:.52,metalness:.5});
  const graphite=new THREE.MeshStandardMaterial({color:0x20282c,roughness:.78,metalness:.28});
  const black=new THREE.MeshBasicMaterial({color:0x04070a});
  const silverLine=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.55});
  const datumMaterial=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.8});
  const quietMaterial=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.2});
  const orangeLine=new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.85,depthTest:false});
  scene.add(new THREE.HemisphereLight(0xc6d1da,INK,.54));
  const sun=new THREE.DirectionalLight(0xf6f0df,3.6);sun.position.copy(startPosition).add(V(-42,28,35));scene.add(sun);scene.add(sun.target);sun.target.position.copy(startPosition);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:150});sun.shadow.bias=-.00018;sun.shadow.normalBias=.025;sun.shadow.radius=2;
  const fill=new THREE.DirectionalLight(0x7f9fa8,.25);fill.position.set(35,14,-40);scene.add(fill);
  const engineFill=new THREE.PointLight(0xc6d1da,0,9,2);engineFill.position.copy(startPosition).add(V(0,-.6,2.5));scene.add(engineFill);

  // Columbia uses a separate visual language: conical command module, ribbed
  // service module, four RCS clusters, and the open service-propulsion bell.
  const columbia=new THREE.Group();craftSpace.add(columbia);
  const service=edge(new THREE.Mesh(new THREE.CylinderGeometry(1.65,1.65,4.15,48),metal),silverLine);service.position.y=.2;columbia.add(service);
  const capsule=edge(new THREE.Mesh(new THREE.CylinderGeometry(.35,1.76,2.2,36),bone),silverLine);capsule.position.y=3.35;columbia.add(capsule);
  const shield=new THREE.Mesh(new THREE.CylinderGeometry(1.77,1.72,.21,48),graphite);shield.position.y=2.16;columbia.add(shield);
  const docking=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.32,24),graphite);docking.position.y=4.61;columbia.add(docking);
  const dockingRim=new THREE.Mesh(new THREE.TorusGeometry(.34,.035,6,28),metal);dockingRim.rotation.x=Math.PI/2;dockingRim.position.y=4.79;columbia.add(dockingRim);
  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.44,.95,1.9,32,1,true),graphite);nozzle.position.y=-2.85;columbia.add(nozzle);
  const nozzleRim=new THREE.Mesh(new THREE.TorusGeometry(.95,.04,6,36),metal);nozzleRim.rotation.x=Math.PI/2;nozzleRim.position.y=-3.8;columbia.add(nozzleRim);
  const darkThroat=new THREE.Mesh(new THREE.CircleGeometry(.52,24),black);darkThroat.rotation.x=Math.PI/2;darkThroat.position.y=-2.28;columbia.add(darkThroat);
  for(let i=0;i<32;i++){
    const a=i/32*TAU,x=Math.cos(a)*1.66,z=Math.sin(a)*1.66;columbia.add(line([V(x,-1.84,z),V(x,2.13,z)],i%4===0?silverLine:quietMaterial));
    if(i%8===0){
      const p=V(Math.cos(a)*1.9,.8,Math.sin(a)*1.9),cluster=box(.42,.35,.42,bone);cluster.position.copy(p);columbia.add(cluster);
      for(const d of [V(0,1,0),V(0,-1,0),V(Math.cos(a+.8),0,Math.sin(a+.8)),V(Math.cos(a-.8),0,Math.sin(a-.8))]){
        const n=new THREE.Mesh(new THREE.CylinderGeometry(.045,.12,.25,8,1,true),graphite);n.position.copy(p).addScaledVector(d,.28);n.quaternion.setFromUnitVectors(V(0,-1,0),d);columbia.add(n);
      }
    }
  }
  for(let i=0;i<4;i++){
    const a=i*TAU/4+.32,band=new THREE.Mesh(new THREE.CylinderGeometry(1.673,1.673,.55,48,1,true,a,.67),graphite);band.position.y=-.5;columbia.add(band);
  }
  for(const a of [-.36,.36]){
    const w=box(.42,.42,.035,black);w.position.set(Math.sin(a)*1.05,3.47,Math.cos(a)*1.0);w.rotation.x=-.55;w.rotation.y=a;columbia.add(w);edge(w,silverLine);
  }
  const cmDish=new THREE.Group();cmDish.position.set(1.5,-1.5,.8);cmDish.rotation.z=-.65;columbia.add(cmDish);
  cmDish.add(tube(V(),V(0,1.1,0),.035,metal));
  for(const x of [-.33,.33])for(const z of [-.33,.33]){
    const d=new THREE.Mesh(new THREE.ConeGeometry(.31,.18,20,1,true),metal);d.position.set(x,1.1,z);d.rotation.x=Math.PI;cmDish.add(d);
  }
  columbia.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});

  // Isolate the existing bell and lip at their hinge so gimbal motion is rigid.
  const enginePivot=new THREE.Group();enginePivot.position.set(0,1.7,0);lander.add(enginePivot);
  const engineParts=lander.children.filter(o=>o.isMesh&&((o.geometry.type==='CylinderGeometry'&&Math.abs(o.position.y-1.3)<.001)||(o.geometry.type==='TorusGeometry'&&Math.abs(o.position.y-.9)<.001)||(o.geometry.type==='CircleGeometry'&&Math.abs(o.position.y-1.5)<.001)));
  for(const o of engineParts){o.removeFromParent();o.position.y-=1.7;enginePivot.add(o);}
  const gimbalRing=new THREE.Mesh(new THREE.TorusGeometry(.42,.045,7,32),metal);gimbalRing.rotation.x=Math.PI/2;gimbalRing.position.y=1.7;lander.add(gimbalRing);
  const actuatorA=tube(V(.7,1.9,.2),V(.35,1.1,.2),.035,bone),actuatorB=tube(V(-.65,1.9,-.2),V(-.3,1.1,-.2),.035,bone);lander.add(actuatorA,actuatorB);
  // Thrust points upward toward the vehicle, opposite the downward exhaust.
  // Render this explanatory vector over the bell so its direction stays clear.
  const bellAxis=line([V(0,-2.3,0),V(0,1.7,0)],orangeLine);enginePivot.add(bellAxis);bellAxis.position.y=-1.7;bellAxis.renderOrder=9;
  const engineDatum=new THREE.Group();engineDatum.position.y=1.7;lander.add(engineDatum);
  for(const axis of ['x','z'])engineDatum.add(line(circular(.9,axis,70,Math.PI*.72,Math.PI*1.28),quietMaterial));
  const thrustTip=new THREE.Mesh(new THREE.ConeGeometry(.13,.36,10),new THREE.MeshBasicMaterial({color:ORANGE,depthTest:false}));thrustTip.position.y=-.18;thrustTip.renderOrder=10;enginePivot.add(thrustTip);
  const plumeMaterial=new THREE.MeshBasicMaterial({color:0xd5ddd4,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
  const plume=new THREE.Mesh(new THREE.ConeGeometry(1.2,4,32,1,true),plumeMaterial);plume.position.y=-2.8;enginePivot.add(plume);
  const antenna=lander.children.find(o=>o.isGroup&&Math.abs(o.position.y-5.37)<.001);
  const antennaRest=antenna?.rotation.clone();
  const antennaPath=line([V(-1.28,5.37,.26),V(-7,11,6),V(-24,18,14)],datumMaterial);lander.add(antennaPath);
  const antennaTarget=new THREE.Group();antennaTarget.position.set(-7,11,6);lander.add(antennaTarget);
  for(const axis of ['x','y','z'])antennaTarget.add(line(circular(.35,axis,24),quietMaterial));
  const signalDots=[];
  for(let i=0;i<9;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.045,6,4),new THREE.MeshBasicMaterial({color:LIME}));lander.add(dot);signalDots.push(dot);}

  const jets=[];
  for(const x of [-1.75,1.75])for(const z of [-.85,.85]){
    const direction=V(Math.sign(x),0,Math.sign(z)*.18).normalize();
    const j=new THREE.Mesh(new THREE.ConeGeometry(.14,.9,12,1,true),new THREE.MeshBasicMaterial({color:BONE,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));
    j.position.set(x,4.9,z);j.position.addScaledVector(direction,.85);j.quaternion.setFromUnitVectors(V(0,-1,0),direction);lander.add(j);jets.push(j);
  }
  const reference=new THREE.Group();reference.position.y=3.2;craftSpace.add(reference);
  const bodyAxes=new THREE.Group();bodyAxes.position.y=3.2;lander.add(bodyAxes);
  for(const [axis,col] of [['x',datumMaterial],['y',quietMaterial],['z',silverLine]]){
    reference.add(line(circular(4.4,axis,120),col));
    const direction=axis==='x'?V(1,0,0):axis==='y'?V(0,1,0):V(0,0,1);
    bodyAxes.add(line([direction.clone().multiplyScalar(-4),direction.clone().multiplyScalar(5)],col));
    for(let i=0;i<24;i++){
      const a=i/24*TAU,p=axis==='x'?V(0,Math.cos(a),Math.sin(a)):axis==='y'?V(Math.cos(a),0,Math.sin(a)):V(Math.cos(a),Math.sin(a),0);
      reference.add(line([p.clone().multiplyScalar(4.28),p.clone().multiplyScalar(4.45)],quietMaterial));
    }
  }
  const cabinContour=new THREE.Group();lander.add(cabinContour);
  cabinContour.add(line([V(-.5,3.28,1.22),V(-.5,4.23,1.22),V(.5,4.23,1.22),V(.5,3.28,1.22),V(-.5,3.28,1.22)],datumMaterial));
  const sealProbe=line([V(-.5,3.28,1.25),V(.5,3.28,1.25)],datumMaterial);cabinContour.add(sealProbe);
  // Separate trajectories express two vehicles sharing a mission. They are
  // graphic guides, not a plotted flight ephemeris or literal laser beams.
  const routeGroup=new THREE.Group();craftSpace.add(routeGroup);
  const lmRoute=[],cmRoute=[];
  for(let i=0;i<=150;i++){const p=i/150;lmRoute.push(V(p*38-20,-p*p*12+6,-p*27));cmRoute.push(V(p*46-22,8+Math.sin(p*2.6)*6,-p*38-8));}
  const lmTrail=line(lmRoute,datumMaterial),cmTrail=line(cmRoute,quietMaterial);routeGroup.add(lmTrail,cmTrail);
  const telemetry=new THREE.Group();craftSpace.add(telemetry);
  const packetLines=[];
  for(let i=0;i<7;i++){
    const ps=[V(-1.2+i*.09,5.5+i*.09,.2),V(-6-i*.32,8+i*.5,5+i*.8),V(-20-i*1.2,12+i*.5,20+i*2)];
    const wire=line(ps,i===3?datumMaterial:quietMaterial);telemetry.add(wire);packetLines.push(ps);
    const dot=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),new THREE.MeshBasicMaterial({color:i===3?LIME:BONE}));telemetry.add(dot);wire.userData.packet=dot;
  }
  const committed=new THREE.Group();craftSpace.add(committed);
  const descentPoints=Array.from({length:121},(_,i)=>{const p=i/120;return V(8+11*p,-5-5*p*p,-11-16*p);});
  committed.add(line(descentPoints,new THREE.LineDashedMaterial({color:BONE,transparent:true,opacity:.27,dashSize:.5,gapSize:.35})));
  committed.children[0].computeLineDistances();
  const activeDescent=line(descentPoints,datumMaterial);committed.add(activeDescent);
  const descentDot=new THREE.Mesh(new THREE.OctahedronGeometry(.17,0),new THREE.MeshBasicMaterial({color:LIME}));committed.add(descentDot);

  function world(p){return p.clone().multiplyScalar(.5).add(startPosition);}
  function positionCamera(pos,target,fov=50,roll=0){camera.position.copy(world(pos));camera.up.set(0,1,0);camera.lookAt(world(target));camera.rotateZ(roll);camera.fov=fov;camera.updateProjectionMatrix();}
  function interpolateCamera(a,b,lookA,lookB,q,fovA=50,fovB=fovA,rollA=0,rollB=rollA){positionCamera(a.clone().lerp(b,q),lookA.clone().lerp(lookB,q),mix(fovA,fovB,q),mix(rollA,rollB,q));}
  function poseActuator(mesh,start,end){mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(V(0,1,0),end.clone().sub(start).normalize());mesh.scale.y=start.distanceTo(end)/.873;}

  function update(raw,opts={}){
    const u=clamp(Number.isFinite(raw)?raw:0),phase=PHASES.find(p=>u>=p.start&&u<p.end)||PHASES[PHASES.length-1],q=clamp((u-phase.start)/(phase.end-phase.start)),s=smooth(q);
    const commitActive=Number.isFinite(opts.commit),commit=commitActive?clamp(opts.commit):0;
    // Every property is assigned from time: direct seeking never inherits the
    // result of a previous camera chapter, particle update or mechanism state.
    craftSpace.position.copy(startPosition);lander.position.set(0,0,0);
    const entryRotation=1-smooth(u/.09);lander.rotation.set(startRotation.x*entryRotation,startRotation.y*entryRotation,startRotation.z*entryRotation);
    const separation=smooth((u-.59)/.25);
    columbia.position.set(mix(-10,-28,separation),mix(8,16,separation),mix(-8,-32,separation));columbia.rotation.set(.05,.25,mix(-.42,-.25,separation));
    columbia.visible=u>=.48;
    reference.visible=u>=.49&&u<.59;bodyAxes.visible=reference.visible;
    cabinContour.visible=u>=.19&&u<.29;sealProbe.position.y=mix(0,.95,ease(q));
    engineDatum.visible=u>=.29&&u<.39;bellAxis.visible=engineDatum.visible;thrustTip.visible=engineDatum.visible;
    engineFill.intensity=engineDatum.visible?18:0;engineFill.position.copy(world(V(0,-1,5)));plume.visible=false;plumeMaterial.opacity=0;committed.visible=false;
    const gimbal=u>=.29&&u<.39?Math.sin(q*TAU*.8)*.12:0;enginePivot.rotation.set(gimbal*.45,0,gimbal);
    const gpA=V(.35,-.6,.2).applyEuler(enginePivot.rotation).add(V(0,1.7,0));
    const gpB=V(-.3,-.6,-.2).applyEuler(enginePivot.rotation).add(V(0,1.7,0));
    poseActuator(actuatorA,V(.7,1.9,.2),gpA);poseActuator(actuatorB,V(-.65,1.9,-.2),gpB);
    antennaPath.visible=u>=.09&&u<.19;antennaTarget.visible=antennaPath.visible;
    if(antenna&&antennaRest){antenna.rotation.copy(antennaRest);antenna.rotation.y+=u>=.09&&u<.19?mix(-.25,.12,ease(q)):0;}
    for(let i=0;i<signalDots.length;i++){
      const p=(u*22+i/9)%1;signalDots[i].visible=antennaPath.visible;signalDots[i].position.copy(V(-1.28,5.37,.26).lerp(V(-24,18,14),p));
    }
    for(let i=0;i<jets.length;i++)jets[i].visible=u>=.39&&u<.49&&q<.62&&((Math.floor(q*14)+i)%3===0);
    if(u>=.39&&u<.49){lander.rotation.z=mix(-.39,.015,s);lander.rotation.y=mix(.47,.14,s);}
    if(u>=.49&&u<.59){lander.rotation.set(mix(-.16,0,s),mix(.3,0,s),mix(.12,0,s));reference.rotation.set(0,0,0);}
    routeGroup.visible=u>=.59&&u<.84;lmTrail.geometry.setDrawRange(0,Math.floor(151*ease((u-.59)/.18)));cmTrail.geometry.setDrawRange(0,Math.floor(151*ease((u-.59)/.18)));
    if(u>=.59){const a=smooth((u-.59)/.25);lander.position.set(mix(0,8,a),mix(0,-5,a),mix(0,-11,a));lander.rotation.set(-.1,mix(.47,.15,a),-.18);}
    telemetry.visible=u>=.84;telemetry.position.copy(lander.position);telemetry.rotation.copy(lander.rotation);telemetry.children.forEach(o=>{if(o.userData.packet){const i=telemetry.children.indexOf(o)/2,ps=packetLines[i],p=(u*16+i*.13)%1;o.userData.packet.position.copy(p<.3?ps[0].clone().lerp(ps[1],p/.3):ps[1].clone().lerp(ps[2],(p-.3)/.7));}});
    sun.target.position.copy(world(lander.position.clone().add(V(0,2,0))));sun.position.copy(sun.target.position).add(V(-42,28,35));sun.target.updateMatrixWorld();
    if(orbitGrid)orbitGrid.visible=u<.09||u>=.59;
    if(u<.09){
      const end=world(V(6.5,6.8,12.5)),look=world(V(-.3,3.2,0));
      camera.position.copy(initialCamera).lerp(end,s);camera.quaternion.copy(initialQuaternion);
      const endCamera=new THREE.PerspectiveCamera();endCamera.position.copy(end);endCamera.lookAt(look);camera.quaternion.slerp(endCamera.quaternion,s);camera.fov=mix(initialFov,51,s);camera.updateProjectionMatrix();
    }else if(u<.19){
      interpolateCamera(V(-4.5,7.1,5.1),V(-2.7,6.65,3.1),V(-1.28,5.5,.26),V(-1.28,5.55,.26),s,54,48,-.08,.035);
    }else if(u<.29){
      interpolateCamera(V(-2.5,4.7,5.7),V(.65,3.8,3.6),V(-.1,4.0,1.05),V(0,3.75,1.15),s,55,49,.04,-.03);
    }else if(u<.39){
      interpolateCamera(V(3.4,.3,4.2),V(1.8,.45,2.9),V(0,1.25,0),V(0,1.18,0),s,61,55,-.08,.08);
    }else if(u<.49){
      interpolateCamera(V(4.2,5.4,2.8),V(8.2,6.8,9.8),V(1.7,4.9,.8),V(0,3.2,0),s,56,52,.07,-.06);
    }else if(u<.59){
      interpolateCamera(V(8.2,6.8,9.8),V(6.5,8.8,15.8),V(0,3.2,0),V(0,3.2,0),s,52,53,-.06,.02);
    }else if(u<.72){
      interpolateCamera(V(6.5,8.8,15.8),V(37,27,52),V(0,3.2,0),V(-7,4,-8),s,53,58,.02,-.055);
    }else if(u<.84){
      // The vehicles become small against lunar curvature: a deliberate scale
      // release after intimate mechanisms, rather than another object orbit.
      interpolateCamera(V(37,27,52),V(72,60,111),V(-7,4,-8),V(-43,-34,-44),s,58,52,-.055,-.10);
    }else if(u<.93){
      const p=lander.position;interpolateCamera(V(-2.2,6.6,3.1).add(p),V(-18,13,23).add(p),V(-1.2,5.5,.2).add(p),V(-8,8,7).add(p),s,54,62,.06,-.08);
    }else{
      const p=lander.position;interpolateCamera(V(-18,13,23).add(p),V(19,18,33),V(-8,8,7).add(p),V(-6,5,-4),s,62,54,-.08,0);
    }
    if(commitActive){
      const travel=smooth(commit),idx=Math.min(119,Math.floor(travel*120)),blend=travel*120-idx;
      lander.position.copy(descentPoints[idx]).lerp(descentPoints[idx+1],blend);
      lander.rotation.set(mix(-.1,-.035,ease(commit)),.15,mix(-.18,-.055,ease(commit)));
      columbia.visible=true;columbia.position.set(-28,16,-32);columbia.rotation.set(.05,.25,-.25);
      reference.visible=false;bodyAxes.visible=commit<.32;engineDatum.visible=false;bellAxis.visible=false;thrustTip.visible=false;cabinContour.visible=false;
      antennaPath.visible=false;antennaTarget.visible=false;for(const d of signalDots)d.visible=false;
      for(let i=0;i<jets.length;i++)jets[i].visible=commit<.2&&Math.floor(commit*55+i)%3===0;
      enginePivot.rotation.set(.015,0,-.055*smooth((commit-.12)/.22));
      poseActuator(actuatorA,V(.7,1.9,.2),V(.35,-.6,.2).applyEuler(enginePivot.rotation).add(V(0,1.7,0)));
      poseActuator(actuatorB,V(-.65,1.9,-.2),V(-.3,-.6,-.2).applyEuler(enginePivot.rotation).add(V(0,1.7,0)));
      plume.visible=commit>.16;plumeMaterial.opacity=.065*ease((commit-.16)/.18);plume.scale.y=mix(.6,1,ease((commit-.16)/.3));
      engineFill.intensity=1.2*ease((commit-.16)/.18);
      routeGroup.visible=false;telemetry.visible=false;committed.visible=true;
      activeDescent.geometry.setDrawRange(0,Math.max(2,Math.floor(121*travel)));descentDot.position.copy(lander.position);
      if(orbitGrid)orbitGrid.visible=true;
      positionCamera(V(mix(20,19,travel),16,mix(42,40,travel)),V(-2,1,-15),58,-.035);
      sun.target.position.copy(world(lander.position.clone().add(V(0,2,0))));sun.position.copy(sun.target.position).add(V(-42,28,35));sun.target.updateMatrixWorld();
      engineFill.position.copy(world(lander.position.clone().add(V(0,-1,5))));
    }
    return {phase:commitActive?'descent-commitment':phase.name,phaseIndex:PHASES.indexOf(phase),phaseProgress:commitActive?commit:q,normalizedTime:u,eagle:world(lander.position).toArray(),columbia:world(columbia.position).toArray(),boundaries:PHASES.map(p=>p.start)};
  }
  function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
  function dispose(){
    const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);});
    for(const g of gs)g.dispose();for(const m of ms)m.dispose();source.dispose();
  }
  update(0);return{scene,camera,update,resize,dispose};
}
