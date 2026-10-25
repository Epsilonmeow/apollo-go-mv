import * as THREE from '../vendor/three.module.js';
import {createDecisionSpace} from '../apollo-second-go/decision-space.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const fract=x=>x-Math.floor(x),hash=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
const BONE=0xeeeadd,LIME=0xc6f16a,ORANGE=0xf86b3d;
function line(points,material){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);}
function setLine(object,points){const a=object.geometry.attributes.position;points.forEach((p,i)=>a.setXYZ(i,p.x,p.y,p.z));a.needsUpdate=true;object.geometry.computeBoundingSphere();}

// This geometry accepts the score's independent flight, contact and camera
// clocks. It does not turn a voice timestamp into fabricated flight telemetry.
export function createLandingSpace(){
  const base=createDecisionSpace();base.update(144,{mode:'collective',progress:1});
  const {scene,camera}=base;
  const world=scene.children.find(o=>o.isGroup&&o.children.some(g=>g.isGroup&&g.children.some(c=>c.isInstancedMesh)));
  const terrain=world?.children.find(o=>o.isGroup&&o.children.some(c=>c.isInstancedMesh));
  const craft=world?.children.find(o=>o.isGroup&&o.children.some(c=>c.isGroup&&c.children.length>100));
  const lm=craft?.children.find(o=>o.isGroup&&o.children.length>100);
  const sun=world?.children.find(o=>o.isDirectionalLight&&o.castShadow);
  if(!terrain||!craft||!lm||!sun)throw new Error('Landing space cannot locate preserved Eagle or lunar terrain.');
  const entryPosition=craft.position.clone(),entryRotation=craft.rotation.clone();
  const entryCamera=camera.position.clone(),entryQuaternion=camera.quaternion.clone(),entryFov=camera.fov;
  const entryChildren=world.children.slice(),entryVisibility=entryChildren.map(o=>o.visible);
  const terrainChildren=terrain.children.slice(),terrainVisibility=terrainChildren.map(o=>o.visible);
  const oldTerrain=terrain.children.find(o=>o.isGroup&&o.children.some(c=>c.geometry?.parameters?.width===2000));
  if(!oldTerrain)throw new Error('Landing space cannot locate second-poll terrain extension.');
  const originalPads=lm.children.filter(o=>o.geometry?.type==='CylinderGeometry'&&Math.abs(o.geometry.parameters.radiusBottom-.67)<.001);
  const probes=lm.children.filter(o=>o.isGroup&&Math.abs(o.position.y-.15)<.001&&o.children.some(c=>c.geometry?.type==='CylinderGeometry'&&c.geometry.parameters.radiusTop===.012));
  if(originalPads.length!==4||probes.length!==3)throw new Error('Expected four landing pads and three contact probes, absent from ladder leg.');
  const probeLength=1.85,probeClearance=probeLength-.15;
  for(const probe of probes){
    const rod=probe.children.find(o=>o.geometry?.type==='CylinderGeometry');
    probe.userData.originalGeometry=rod.geometry;probe.userData.originalPosition=rod.position.clone();probe.userData.originalQuaternion=rod.quaternion.clone();
    probe.userData.landingGeometry=new THREE.CylinderGeometry(.012,.012,probeLength,8);
    rod.geometry=probe.userData.landingGeometry;rod.position.set(0,-probeLength/2,0);rod.quaternion.identity();
    probe.userData.bendAxis=V(probe.position.z,0,-probe.position.x).normalize();
  }
  const touchdown=V(656,0,-576),hazard=V(438,0,-529);
  const craters=[[-80,80,48,11],[-8,5,36,8.5],[88,-100,64,14],[160,-260,40,10],[-190,-165,85,17],[255,30,77,15],[-285,225,90,16],[15,305,56,13],[350,-470,91,22],[490,-640,124,27],[-220,-490,100,19],[160,-760,140,30]];
  for(let i=0;i<80;i++)craters.push([(hash(i*7+1)-.5)*840,(hash(i*7+2)-.5)*840,3+hash(i*7+3)*14,1+hash(i*7+4)*3.6]);
  function oldHeight(x,z){
    let h=-(x*x+z*z)/20000+1.7*Math.sin(x*.015)*Math.cos(z*.021)+.27*Math.sin(x*.11+z*.07)+.13*Math.sin(x*.49-z*.31);
    for(const [cx,cz,r,d] of craters){const u=Math.hypot(x-cx,z-cz)/r;if(u>1.6)continue;if(u<1)h-=d*Math.pow(1-u*u,1.45);h+=d*.28*Math.exp(-Math.pow((u-1.015)/.14,2));}return h;
  }
  touchdown.y=oldHeight(touchdown.x,touchdown.z);
  function height(x,z){
    const r=Math.hypot(x-touchdown.x,z-touchdown.z);
    return mix(touchdown.y,oldHeight(x,z),smooth((r-9)/20));
  }
  hazard.y=height(hazard.x,hazard.z);
  // Keep the approved crater field, adding only a resolved near-ground patch.
  // The 160-unit boundary lands on the existing four-unit terrain lattice.
  const landingTerrain=new THREE.Group();terrain.add(landingTerrain);
  const nearOriginal=oldTerrain.children.find(o=>o.geometry?.parameters?.width===2000);
  let coarseGeometry;
  for(const source of oldTerrain.children){
    const copy=source.clone();
    if(source===nearOriginal){
      copy.geometry=source.geometry.clone();const a=copy.geometry.attributes.position;
      for(let i=0;i<a.count;i++)a.setY(i,height(a.getX(i),a.getZ(i)));
      // Compute the continuous field before removing the patch's triangles:
      // otherwise edge normals only see one side and form a lighting seam.
      copy.geometry.computeVertexNormals();coarseGeometry=copy.geometry;
      const sourceIndices=copy.geometry.index.array,indices=[];
      for(let i=0;i<sourceIndices.length;i+=3){let inside=true;for(let j=0;j<3;j++){let k=sourceIndices[i+j];if(Math.abs(a.getX(k)-touchdown.x)>80.001||Math.abs(a.getZ(k)-touchdown.z)>80.001)inside=false;}if(!inside)indices.push(sourceIndices[i],sourceIndices[i+1],sourceIndices[i+2]);}
      copy.geometry.setIndex(indices);
    }
    landingTerrain.add(copy);
  }
  // Match the existing grid's two triangles, including its interpolated
  // normals and color, rather than evaluating a different noise at the seam.
  function coarseSample(x,z){
    const gx=(x+1000)/4,gz=(z+1000)/4,ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,a=iz*501+ix,b=a+501,c=b+1,d=a+1;
    const ids=u+v<=1?[a,b,d]:[b,c,d],weights=u+v<=1?[1-u-v,v,u]:[1-u,u+v-1,1-v];
    const sample=name=>{const attr=coarseGeometry.attributes[name],out=V();for(let j=0;j<3;j++)out.addScaledVector(V(attr.getX(ids[j]),attr.getY(ids[j]),attr.getZ(ids[j])),weights[j]);return out;};
    return{position:sample('position'),normal:sample('normal').normalize(),color:sample('color')};
  }
  const patchGeometry=new THREE.PlaneGeometry(160,160,320,320);patchGeometry.rotateX(-Math.PI/2);patchGeometry.translate(touchdown.x,0,touchdown.z);
  const patchPositions=patchGeometry.attributes.position,patchColors=[],patchCoarseNormals=[],patchBlend=[];
  for(let i=0;i<patchPositions.count;i++){
    const x=patchPositions.getX(i),z=patchPositions.getZ(i),dx=Math.abs(x-touchdown.x),dz=Math.abs(z-touchdown.z),coarse=coarseSample(x,z),blend=smooth(Math.min(80-dx,80-dz)/24);
    patchPositions.setY(i,mix(coarse.position.y,height(x,z),blend));
    const detailColor=new THREE.Color(0x92958c).multiplyScalar(.61+hash(x*1.13+z*.71)*.09+.025*Math.sin(x*.025+z*.018));
    patchColors.push(mix(coarse.color.x,detailColor.r,blend),mix(coarse.color.y,detailColor.g,blend),mix(coarse.color.z,detailColor.b,blend));
    patchCoarseNormals.push(coarse.normal);patchBlend.push(blend);
  }
  patchGeometry.setAttribute('color',new THREE.Float32BufferAttribute(patchColors,3));patchGeometry.computeVertexNormals();
  const patchNormals=patchGeometry.attributes.normal;
  for(let i=0;i<patchNormals.count;i++){const n=patchCoarseNormals[i].clone().lerp(V(patchNormals.getX(i),patchNormals.getY(i),patchNormals.getZ(i)),patchBlend[i]).normalize();patchNormals.setXYZ(i,n.x,n.y,n.z);}
  const patch=new THREE.Mesh(patchGeometry,nearOriginal.material);patch.receiveShadow=true;landingTerrain.add(patch);
  const originalRocks=oldTerrain.children.find(o=>o.isInstancedMesh),rockPose=new THREE.Object3D();
  const boulders=new THREE.InstancedMesh(originalRocks.geometry,originalRocks.material,540);boulders.castShadow=true;boulders.receiveShadow=true;landingTerrain.add(boulders);
  for(let i=0;i<540;i++){
    let x,z,size;if(i<125){const a=hash(i*13+1)*TAU,r=4+hash(i*13+2)*47;x=hazard.x+Math.cos(a)*r;z=hazard.z+Math.sin(a)*r;size=.8+Math.pow(hash(i*13+3),2)*4.2;}
    else {const a=hash(i*13+4)*TAU,r=11+hash(i*13+5)*96;x=touchdown.x+Math.cos(a)*r;z=touchdown.z+Math.sin(a)*r;size=.04+Math.pow(hash(i*13+6),3)*1.0;}
    rockPose.position.set(x,height(x,z)+size*.31,z);rockPose.rotation.set(hash(i+20)*2,hash(i+30)*TAU,hash(i+40)*2);rockPose.scale.set(size*1.35,size*.69,size);rockPose.updateMatrix();boulders.setMatrixAt(i,rockPose.matrix);
  }
  // Remove any old random rock inside the chosen landing patch; the visible
  // surroundings remain irregular. Four pads meet one locally planar site.
  const inheritedRocks=landingTerrain.children.find(o=>o.isInstancedMesh),matrix=new THREE.Matrix4();
  for(let i=0;i<inheritedRocks.count;i++){inheritedRocks.getMatrixAt(i,matrix);matrix.decompose(rockPose.position,rockPose.quaternion,rockPose.scale);if(Math.hypot(rockPose.position.x-touchdown.x,rockPose.position.z-touchdown.z)<10)rockPose.scale.setScalar(0);else rockPose.position.y+=height(rockPose.position.x,rockPose.position.z)-oldHeight(rockPose.position.x,rockPose.position.z);rockPose.updateMatrix();inheritedRocks.setMatrixAt(i,rockPose.matrix);}
  // Horizontal travel redirects away from the rough patch before arresting.
  // Height is continuous; a changing camera never restarts vehicle motion.
  const horizontal=new THREE.CatmullRomCurve3([entryPosition.clone().setY(0),V(405,0,-513),V(487,0,-571),V(592,0,-585),V(640,0,-578),touchdown.clone().setY(0)],false,'centripetal');
  const finalY=touchdown.y+probeClearance;
  function flightPoint(f){const p=horizontal.getPoint(f),u=1-f;p.y=u*u*u*entryPosition.y+3*u*u*f*(entryPosition.y-4)+3*u*f*f*(finalY+12)+f*f*f*finalY;return p;}
  const lines=new THREE.Group();world.add(lines);
  const lime=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.72}),quiet=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.25}),orange=new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.72});
  const targetRing=line(Array.from({length:81},()=>V()),lime),hazardRing=line(Array.from({length:81},()=>V()),orange);lines.add(targetRing,hazardRing);
  for(const [ring,center,radius]of [[targetRing,touchdown,9],[hazardRing,hazard,46]])setLine(ring,Array.from({length:81},(_,i)=>{let a=i/80*TAU,x=center.x+Math.cos(a)*radius,z=center.z+Math.sin(a)*radius;return V(x,height(x,z)+.14,z);}));
  const drift=new THREE.ArrowHelper(V(1,0,0),V(),15,LIME,.8,.3);lines.add(drift);
  const rangeLine=line([V(),V()],quiet);lines.add(rangeLine);
  // A thin ballistic sheet skims outward; there is no atmospheric smoke or
  // conspicuous rocket flame. Deterministic particles permit arbitrary seek.
  const dustCount=740,dustPositions=new Float32Array(dustCount*6),dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dustMaterial=new THREE.LineBasicMaterial({color:0xd0cbbb,transparent:true,opacity:0,depthWrite:false});
  const dust=new THREE.LineSegments(dustGeometry,dustMaterial);dust.frustumCulled=false;world.add(dust);
  const p=V(),surface=V(),velocity=V(),target=V();let aspect=16/9;
  function projected(point){const a=point.clone().project(camera);return{x:(a.x+1)/2,y:(1-a.y)/2,visible:a.z>-1&&a.z<1&&Math.abs(a.x)<1.3&&Math.abs(a.y)<1.3};}
  function cameraTo(position,look,fov=59,roll=0){camera.position.copy(position);camera.up.set(0,1,0);camera.lookAt(look);camera.rotateZ(roll);camera.fov=fov;camera.aspect=aspect;camera.updateProjectionMatrix();}
  function cameraLerp(a,b,la,lb,q,fa=58,fb=fa,ra=0,rb=ra){cameraTo(a.clone().lerp(b,q),la.clone().lerp(lb,q),mix(fa,fb,q),mix(ra,rb,q));}
  function update(raw,options={}){
    const t=Math.max(144,Number.isFinite(raw)?raw:144),mode=options.mode||'approach',q=clamp(options.progress||0),s=smooth(q),f=clamp(options.flightProgress||0),cp=clamp(options.contactProgress||0),lp=clamp(options.landedProgress||0),hit=clamp(options.hit||0),off=clamp(Number(options.engineOff)||0);
    // Restore inherited objects before each seek; no state accumulates.
    for(let i=0;i<entryChildren.length;i++)entryChildren[i].visible=entryVisibility[i];
    for(let i=0;i<terrainChildren.length;i++)terrainChildren[i].visible=terrainVisibility[i];
    for(const g of world.children)if(g.isGroup&&g!==craft&&g!==terrain&&g!==lines)g.visible=false;
    world.visible=true;terrain.visible=true;craft.visible=mode!=='terrain';landingTerrain.visible=t>144;
    if(t>144)for(const o of terrainChildren)o.visible=false;
    p.copy(flightPoint(f));p.y-=probeClearance*smooth(cp);
    if(cp>0){p.x=touchdown.x;p.z=touchdown.z;p.y=touchdown.y+probeClearance*(1-smooth(cp));}
    craft.position.copy(p);
    const straighten=smooth((f-.72)/.28);
    craft.rotation.set(mix(entryRotation.x,0,straighten),mix(entryRotation.y,.84,smooth(f)),mix(entryRotation.z,0,straighten));
    if(mode==='divert'&&f<.72){craft.rotation.z-=.09*Math.sin(Math.PI*s);craft.rotation.x+=.045*Math.sin(Math.PI*s);}
    for(const probe of probes){const pivotHeight=Math.max(.15,p.y-touchdown.y+.15),angle=cp>0?Math.acos(Math.min(1,pivotHeight/probeLength)):0;probe.quaternion.setFromAxisAngle(probe.userData.bendAxis,-angle);const rod=probe.children[0];rod.geometry=t===144?probe.userData.originalGeometry:probe.userData.landingGeometry;rod.position.copy(t===144?probe.userData.originalPosition:V(0,-probeLength/2,0));rod.quaternion.copy(t===144?probe.userData.originalQuaternion:new THREE.Quaternion());}
    craft.updateMatrixWorld(true);target.copy(p).add(V(0,3,0));surface.set(p.x,height(p.x,p.z),p.z);
    velocity.copy(flightPoint(Math.min(1,f+.001))).sub(flightPoint(Math.max(0,f-.001)));velocity.y=0;velocity.normalize();
    lines.visible=options.guides!==false&&(mode==='terrain'||mode==='divert'||mode==='brake');targetRing.visible=mode==='divert';hazardRing.visible=mode==='terrain'||mode==='divert';
    drift.visible=mode==='brake';drift.position.copy(target);drift.setDirection(velocity);drift.setLength(Math.max(.03,18*(1-smooth((f-.73)/.27))),.8,.3);
    rangeLine.visible=mode==='brake'&&options.rangeGuide===true;setLine(rangeLine,[p.clone().add(V(8,1,0)),V(p.x+8,height(p.x+8,p.z)+.1,p.z)]);
    const dustStrength=smooth((9-(p.y-surface.y))/7)*(1-smooth(off));dust.visible=dustStrength>.002;dustMaterial.opacity=.085*dustStrength;
    const dustCenter=surface.clone(),attr=dustGeometry.attributes.position;
    for(let i=0;i<dustCount;i++){
      const a=hash(i*7+501)*TAU,u=fract(t*(1.3+hash(i*7+502)) +hash(i*7+503)),r=1.7+u*(20+hash(i*7+504)*27),length=.35+u*2.2;
      for(let j=0;j<2;j++){const rr=r+j*length,x=dustCenter.x+Math.cos(a)*rr,z=dustCenter.z+Math.sin(a)*rr;attr.setXYZ(i*2+j,x,height(x,z)+.035+Math.sin(u*Math.PI)*(.09+hash(i+505)*.13),z);}
    }attr.needsUpdate=true;
    sun.target.position.copy(surface);sun.position.copy(surface).add(V(-220,75,150));sun.target.updateMatrixWorld();
    const shadowWidth=mix(110,28,smooth(f));Object.assign(sun.shadow.camera,{left:-shadowWidth,right:shadowWidth,top:shadowWidth,bottom:-shadowWidth});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=mix(.25,.025,smooth(f));
    if(mode==='approach'){
      const move=p.clone().sub(entryPosition);
      cameraLerp(entryCamera.clone().add(move),p.clone().add(V(-13,9,22)),entryPosition.clone().add(V(72,-34,-100)).add(move),p.clone().add(V(28,-8,-42)),s,entryFov,64,.018,-.035);
    }else if(mode==='terrain'){
      const ahead=p.clone().addScaledVector(velocity,72);ahead.y=height(ahead.x,ahead.z);
      if(options.view==='hazard')cameraLerp(hazard.clone().add(V(-28,23,34)),hazard.clone().add(V(-18,14,23)),hazard.clone().add(V(8,-1,-12)),hazard.clone().add(V(12,-2,-18)),s,58,62,.035,-.02);
      else {const seat=p.clone().addScaledVector(velocity,4.2).add(V(0,4.4,0));cameraLerp(seat.clone().add(V(1,0,0)),seat.clone().add(V(-.6,.2,0)),ahead,ahead.clone().addScaledVector(velocity,28),s,67,71,-.015,.025);}
    }else if(mode==='divert'){
      if(options.view==='low')cameraLerp(p.clone().add(V(16,4,26)),p.clone().add(V(11,3,20)),p.clone().add(V(5,-4,-8)),p.clone().add(V(8,-4,-10)),s,62,64,-.03,.04);
      else cameraLerp(p.clone().add(V(-35,54,64)),p.clone().add(V(-25,40,49)),p.clone().lerp(touchdown,.34),p.clone().lerp(touchdown,.48),s,61,60,.045,-.025);
    }else if(mode==='brake'){
      if(options.view==='ground')cameraLerp(touchdown.clone().add(V(-15,2.2,16)),touchdown.clone().add(V(-11,1.6,13)),target,target,s,52,55,0,0);
      else cameraLerp(p.clone().add(V(-14,7,19)),p.clone().add(V(-10,4.5,15)),p.clone().add(V(3,-1,-2)),p.clone().add(V(2,-.5,-1)),s,57,54,-.025,.015);
    }else if(mode==='contact'){
      const posA=lm.localToWorld(V(8.3,1.65,6.1)),posB=lm.localToWorld(V(6.7,1.25,4.6));
      const lookA=lm.localToWorld(V(4.1,-.55,0)),lookB=lm.localToWorld(V(4.15,-.1,0));
      cameraLerp(posA,posB,lookA,lookB,s,50,51,.015,0);
    }else{
      if(options.view==='close')cameraLerp(p.clone().add(V(-11,4.5,17)),p.clone().add(V(-17,7,25)),target,target,s,56,57,0,0);
      else cameraLerp(p.clone().add(V(-38,17,49)),p.clone().add(V(-124,43,158)),p.clone().add(V(-12,6,0)),p.clone().add(V(-35,11,0)),s,58,61,0,0);
    }
    // At the exact boundary preserve the previous chapter's camera and world.
    if(t===144){craft.position.copy(entryPosition);craft.rotation.copy(entryRotation);craft.updateMatrixWorld(true);camera.position.copy(entryCamera);camera.quaternion.copy(entryQuaternion);camera.fov=entryFov;camera.updateProjectionMatrix();for(let i=0;i<entryChildren.length;i++)entryChildren[i].visible=entryVisibility[i];for(let i=0;i<terrainChildren.length;i++)terrainChildren[i].visible=terrainVisibility[i];landingTerrain.visible=false;lines.visible=false;dust.visible=false;Object.assign(sun.shadow.camera,{left:-110,right:110,top:110,bottom:-110});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.25;}
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const feet=originalPads.map(o=>{const v=o.localToWorld(V(0,-.07,0));return{world:v.toArray(),gap:v.y-height(v.x,v.z)};});
    const probeTips=probes.map(o=>{const v=o.localToWorld(V(0,-probeLength,0));return{world:v.toArray(),gap:v.y-height(v.x,v.z)};});
    const padAnchor=originalPads.find(o=>o.position.x>4),probeAnchor=probes.find(o=>o.position.x>4);
    return{stage:'landing/'+mode,mode,progress:q,flightProgress:f,contactProgress:cp,landedProgress:lp,altitudeAboveAuthoredTerrain:p.y-surface.y,cameraAltitudeAboveAuthoredTerrain:camera.position.y-height(camera.position.x,camera.position.z),landerPosition:p.toArray(),padGaps:feet.map(o=>o.gap),probeGaps:probeTips.map(o=>o.gap),feet,probeTips,dustStrength,
      anchors:{spacecraft:projected(target),window:projected(lm.localToWorld(V(-.66,4.5,1.1))),target:projected(touchdown),hazard:projected(hazard),footpad:projected(padAnchor.localToWorld(V(0,-.07,0))),probe:projected(probeAnchor.localToWorld(V(0,-probeLength,0))),ground:projected(surface),engine:projected(lm.localToWorld(V(0,.9,0))),velocity:projected(target.clone().addScaledVector(velocity,12))}};
  }
  function resize(w,h){aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();}
  update(144,{mode:'approach',flightProgress:0});
  return{scene,camera,update,resize};
}
