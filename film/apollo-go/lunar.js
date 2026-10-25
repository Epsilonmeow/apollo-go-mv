import * as THREE from '../vendor/three.module.js';

// An authored scale model and camera score, not a reconstruction of the landing
// coordinates. The control room owns the exact historical transcript and data.
const TAU = Math.PI * 2;
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
const mix = (a,b,t) => a+(b-a)*t;
const smooth = x => {x=clamp(x);return x*x*(3-2*x);};
const easeOut = x => 1-Math.pow(1-clamp(x),3);
const hash = n => {const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
const INK=0x080d12, BONE=0xeeeadd, GOLD=0xb89b58, LIME=0xc6f16a;

function line(points,material,closed=false){
  const ps=points.map(p=>Array.isArray(p)?V(...p):p);
  if(closed)ps.push(ps[0].clone());
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(ps),material);
}
function box(w,h,d,material){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);}
function rod(a,b,r,material,sides=8){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),sides),material);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());
  return m;
}
function solid(vertices,faces,material){
  const data=[];
  for(const face of faces){for(let i=1;i<face.length-1;i++)for(const id of [face[0],face[i],face[i+1]])data.push(...vertices[id]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data,3));g.computeVertexNormals();
  return new THREE.Mesh(g,material);
}
function edge(mesh,material,threshold=22){
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,threshold),material);mesh.add(e);return e;
}

export function createLunar(){
  const scene=new THREE.Scene();scene.background=new THREE.Color(INK);
  const camera=new THREE.PerspectiveCamera(48,16/9,.04,1600);
  const gold=new THREE.MeshStandardMaterial({color:GOLD,roughness:.74,metalness:.43,flatShading:true});
  const silver=new THREE.MeshStandardMaterial({color:0xb4b8b4,roughness:.68,metalness:.26,flatShading:true});
  const pale=new THREE.MeshStandardMaterial({color:BONE,roughness:.65,metalness:.12,flatShading:true});
  const graphite=new THREE.MeshStandardMaterial({color:0x252d31,roughness:.91,metalness:.12,flatShading:true});
  const glass=new THREE.MeshStandardMaterial({color:0x050c13,roughness:.2,metalness:.5});
  const black=new THREE.MeshBasicMaterial({color:0x030608});
  const foil=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:.48,flatShading:true,side:THREE.DoubleSide});
  const detailLine=new THREE.LineBasicMaterial({color:0xe2d3ad,transparent:true,opacity:.52});
  const darkLine=new THREE.LineBasicMaterial({color:0x182128,transparent:true,opacity:.95});
  const orange=new THREE.MeshBasicMaterial({color:0xf86b3d});
  const datum=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.66});
  const whiteLine=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.24});
  scene.add(new THREE.HemisphereLight(0xc6d1da,0x080d12,.54));
  const sun=new THREE.DirectionalLight(0xf6f0df,3.6);sun.position.set(-42,28,35);scene.add(sun);scene.add(sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:170});
  sun.shadow.bias=-.00018;sun.shadow.normalBias=.025;sun.shadow.radius=2;
  const rim=new THREE.DirectionalLight(0x7f9fa8,.25);rim.position.set(35,14,-40);scene.add(rim);

  const surface=new THREE.Group();scene.add(surface);
  const orbital=new THREE.Group();scene.add(orbital);
  const lander=new THREE.Group();surface.add(lander);

  // The descent stage has a clipped square plan, triangular foil facets, side
  // bays, and four independently braced legs. +Z is the hatch / ladder side.
  const plan=[[-1.45,-2.14],[1.45,-2.14],[2.14,-1.45],[2.14,1.45],[1.45,2.14],[-1.45,2.14],[-2.14,1.45],[-2.14,-1.45]];
  const bodyV=[];for(const y of [1.76,3.15])for(const p of plan)bodyV.push([p[0],y,p[1]]);
  const bodyF=[[7,6,5,4,3,2,1,0],[8,9,10,11,12,13,14,15]];
  for(let i=0;i<8;i++)bodyF.push([i,(i+1)%8,(i+1)%8+8,i+8]);
  const descent=solid(bodyV,bodyF,gold);lander.add(descent);edge(descent,darkLine);
  // A small independent triangulation on each blanket creates real facets;
  // highlights therefore change with the camera, without a bitmap texture.
  for(let side=0;side<8;side++){
    const a=V(plan[side][0],1.78,plan[side][1]);
    const b=V(plan[(side+1)%8][0],1.78,plan[(side+1)%8][1]);
    const normal=V((a.x+b.x)*.5,0,(a.z+b.z)*.5).normalize();
    const points=[],cols=[];
    const at=(i,j)=>a.clone().lerp(b,i/12).add(V(0,j/7*1.34,0)).addScaledVector(normal,.012+(i>0&&i<12&&j>0&&j<7?(hash(side*300+i*8+j)-.5)*.075:0));
    for(let i=0;i<12;i++)for(let j=0;j<7;j++)for(const ids of [[[i,j],[i+1,j],[i+1,j+1]],[[i,j],[i+1,j+1],[i,j+1]]]){
      const c=new THREE.Color(GOLD).multiplyScalar(.62+hash(side*900+i*31+j*7+ids[1][1])*.48);
      for(const [u,v] of ids){const p=at(u,v);points.push(p.x,p.y,p.z);cols.push(c.r,c.g,c.b);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();
    lander.add(new THREE.Mesh(g,foil));
    for(const h of [1.82,3.08])lander.add(line([a.clone().setY(h).addScaledVector(normal,.025),b.clone().setY(h).addScaledVector(normal,.025)],detailLine));
    for(let n=0;n<5;n++){
      const p=a.clone().lerp(b,(n+.5)/5).setY(3.1).addScaledVector(normal,.03);
      const bolt=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),graphite);bolt.position.copy(p);lander.add(bolt);
    }
  }
  const lowerBand=box(3.7,.18,3.7,graphite);lowerBand.position.y=1.74;lander.add(lowerBand);
  const topDeck=box(3.45,.12,3.4,graphite);topDeck.position.y=3.2;lander.add(topDeck);
  // Descent engine bell opens downward. The dark interior remains visible in
  // the undercarriage shot; Apollo exhaust is not a terrestrial orange flame.
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(.27,.58,.8,36,1,true),graphite);bell.position.y=1.3;lander.add(bell);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(.58,.035,6,36),silver);lip.rotation.x=Math.PI/2;lip.position.y=.9;lander.add(lip);
  const throat=new THREE.Mesh(new THREE.CircleGeometry(.45,32),black);throat.rotation.x=Math.PI/2;throat.position.y=1.5;lander.add(throat);

  // Angular ascent cabin. The dark triangular forward windows and central
  // hatch are the identifying silhouette, rather than a generic spacecraft.
  const cabV=[[-1.46,3.28,-1.05],[1.46,3.28,-1.05],[1.5,3.48,1.02],[-1.5,3.48,1.02],[-1.18,5.13,-1.13],[1.18,5.13,-1.13],[1.28,4.93,1.02],[-1.28,4.93,1.02],[-.93,5.46,-.65],[.93,5.46,-.65],[.93,5.26,.7],[-.93,5.26,.7]];
  const cabin=solid(cabV,[[0,1,2,3],[0,4,5,1],[0,3,7,4],[1,5,6,2],[3,2,6,7],[4,8,9,5],[4,7,11,8],[5,9,10,6],[7,6,10,11],[8,11,10,9]],silver);lander.add(cabin);edge(cabin,darkLine,16);
  // Front windows are inset black triangles with individual metal surrounds.
  for(const side of [-1,1]){
    const verts=side===-1?[[-1.14,4.78,1.045],[-.2,4.84,1.045],[-.84,4.11,1.045]]:[[.2,4.84,1.045],[1.14,4.78,1.045],[.84,4.11,1.045]];
    const surround=solid(verts,[[0,1,2]],graphite);surround.material.side=THREE.DoubleSide;lander.add(surround);
    const center=verts.reduce((p,q)=>p.add(V(...q)),V()).multiplyScalar(1/3);
    const inner=verts.map(p=>V(...p).lerp(center,.12).add(V(0,0,.012)).toArray());
    const window=solid(inner,[[0,1,2]],glass);window.material.side=THREE.DoubleSide;lander.add(window);
    lander.add(line(verts,detailLine,true));
    const shade=box(.99,.065,.18,graphite);shade.position.set(side*.66,4.84,1.07);shade.rotation.z=side*-.065;lander.add(shade);
  }
  const hatch=box(.9,.82,.08,pale);hatch.position.set(0,3.75,1.08);lander.add(hatch);edge(hatch,darkLine);
  const hatchInside=box(.74,.67,.025,silver);hatchInside.position.set(0,3.75,1.133);lander.add(hatchInside);
  const hinge=box(.07,.42,.08,graphite);hinge.position.set(-.38,3.74,1.17);lander.add(hinge);
  lander.add(rod(V(-.1,3.75,1.18),V(.17,3.75,1.18),.026,graphite));
  for(const side of [-1,1]){
    const cheek=box(.55,.58,.8,graphite);cheek.position.set(side*1.45,3.75,.15);lander.add(cheek);edge(cheek,detailLine);
    const tank=new THREE.Mesh(new THREE.SphereGeometry(.59,12,8),silver);tank.scale.set(.9,1,1.23);tank.position.set(side*1.55,4.28,-.69);lander.add(tank);
    const cover=box(.65,1.25,.09,pale);cover.position.set(side*1.66,4.28,-.95);cover.rotation.y=side*.37;lander.add(cover);edge(cover,darkLine);
    lander.add(rod(V(side*1.4,3.28,-1.1),V(side*1.79,4.72,-.72),.035,silver));
    const thermal=box(.25,.72,1.2,graphite);thermal.position.set(side*1.48,4.3,-.25);lander.add(thermal);
  }
  const aft=box(2.25,1.2,.72,graphite);aft.position.set(0,4.06,-1.43);lander.add(aft);edge(aft,detailLine);
  for(let n=0;n<12;n++){const fin=box(.08,.92,.05,silver);fin.position.set(-.97+n*.176,4.08,-1.805);lander.add(fin);}
  // Docking tunnel, optical sight, VHF struts and the steerable S-band dish.
  const tunnel=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.4,16),graphite);tunnel.position.set(0,5.45,-.14);lander.add(tunnel);
  const tunnelRim=new THREE.Mesh(new THREE.TorusGeometry(.45,.035,5,20),silver);tunnelRim.rotation.x=Math.PI/2;tunnelRim.position.set(0,5.66,-.14);lander.add(tunnelRim);
  for(const side of [-1,1]){
    lander.add(rod(V(side*.9,5.1,-.5),V(side*1.2,6.42,-.55),.025,silver));
    lander.add(rod(V(side*.97,6.31,-.55),V(side*1.43,6.31,-.55),.018,pale));
    lander.add(rod(V(side*1.2,6.1,-.79),V(side*1.2,6.1,-.31),.018,pale));
  }
  const dishPivot=new THREE.Group();dishPivot.position.set(-1.28,5.37,.26);dishPivot.rotation.set(-.85,.12,-.55);lander.add(dishPivot);
  const dishShape=new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.22,.035),new THREE.Vector2(.43,.11),new THREE.Vector2(.6,.22)],24);
  const dish=new THREE.Mesh(dishShape,new THREE.MeshStandardMaterial({color:0xb6b9ab,roughness:.8,metalness:.3,side:THREE.DoubleSide}));dishPivot.add(dish);
  const dishRim=new THREE.Mesh(new THREE.TorusGeometry(.6,.02,5,32),pale);dishRim.rotation.x=Math.PI/2;dishRim.position.y=.22;dishPivot.add(dishRim);
  for(let n=0;n<3;n++){const a=n*TAU/3;dishPivot.add(rod(V(Math.cos(a)*.56,.2,Math.sin(a)*.56),V(0,.62,0),.012,pale));}
  dishPivot.add(rod(V(0,.45,0),V(0,.72,0),.03,graphite));
  const radar=box(.7,.055,.6,graphite);radar.position.set(1.12,5.32,.23);radar.rotation.z=-.15;lander.add(radar);edge(radar,detailLine);
  for(let n=0;n<8;n++)lander.add(line([[.8+n*.09,5.36,-.05],[.8+n*.09,5.36,.5]],detailLine));
  // Four RCS quads, with four small nozzles each. Short cold jets are timed to
  // attitude corrections rather than being a permanent decorative effect.
  const jets=[];
  for(const x of [-1.75,1.75])for(const z of [-.85,.85]){
    const block=box(.29,.22,.29,silver);block.position.set(x,4.9,z);lander.add(block);
    for(const dir of [V(Math.sign(x),0,0),V(0,0,Math.sign(z)),V(0,1,0),V(0,-1,0)]){
      const start=V(x,4.9,z).addScaledVector(dir,.13),end=start.clone().addScaledVector(dir,.26);
      const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.04,.10,.25,10,1,true),graphite);nozzle.position.copy(start).add(end).multiplyScalar(.5);nozzle.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().negate());lander.add(nozzle);
      const jet=new THREE.Mesh(new THREE.ConeGeometry(.1,.6,10,1,true),new THREE.MeshBasicMaterial({color:0xddebdc,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));jet.position.copy(end).addScaledVector(dir,.3);jet.quaternion.setFromUnitVectors(V(0,-1,0),dir);jet.visible=false;lander.add(jet);jets.push(jet);
    }
  }
  const feet=[],probes=[];
  for(let n=0;n<4;n++){
    const a=n*TAU/4, radial=V(Math.sin(a),0,Math.cos(a)),tangent=V(Math.cos(a),0,-Math.sin(a));
    const top=radial.clone().multiplyScalar(1.85).setY(2.85);
    const knee=radial.clone().multiplyScalar(3.13).setY(1.59);
    const foot=radial.clone().multiplyScalar(4.35).setY(.15);
    lander.add(rod(top,knee,.105,gold));lander.add(rod(knee,foot,.075,silver));
    const sleeve=radial.clone().multiplyScalar(2.92).setY(1.81);lander.add(rod(top,sleeve,.136,gold));
    for(const s of [-1,1]){
      const anchor=radial.clone().multiplyScalar(1.83).addScaledVector(tangent,s*1.22).setY(1.84);
      const join=radial.clone().multiplyScalar(3.6).setY(.86);
      lander.add(rod(anchor,join,.047,silver));
      lander.add(rod(anchor,top,.027,graphite));
      lander.add(rod(join,foot,.052,gold));
    }
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(.56,.67,.14,24),silver);pad.position.copy(foot).add(V(0,-.08,0));lander.add(pad);edge(pad,darkLine);feet.push(pad);
    const hub=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),graphite);hub.position.copy(foot).add(V(0,.12,0));lander.add(hub);
    const padRing=new THREE.Mesh(new THREE.TorusGeometry(.43,.015,5,24),graphite);padRing.rotation.x=Math.PI/2;padRing.position.copy(foot).add(V(0,-.004,0));lander.add(padRing);
    if(n!==0){
      const probe=new THREE.Group();probe.position.copy(foot);lander.add(probe);
      probe.add(rod(V(0,0,0),V(0,-1.64,0),.012,silver));probes.push({object:probe,axis:tangent.clone()});
    }
  }
  // Ladder and porch align with the forward hatch and the forward landing leg.
  for(const x of [-.4,.4])lander.add(rod(V(x,3.35,1.35),V(x,.72,3.78),.035,silver));
  for(let n=0;n<10;n++){
    const q=n/9;lander.add(rod(V(-.41,mix(3.27,.8,q),mix(1.42,3.71,q)),V(.41,mix(3.27,.8,q),mix(1.42,3.71,q)),.032,silver));
  }
  const porch=box(1.08,.07,.52,graphite);porch.position.set(0,3.34,1.49);lander.add(porch);edge(porch,detailLine);
  for(const x of [-.52,.52]){
    lander.add(rod(V(x,3.35,1.2),V(x,3.99,1.2),.025,silver));
    lander.add(rod(V(x,3.99,1.2),V(x,3.69,1.76),.025,silver));
    lander.add(rod(V(x,3.69,1.76),V(x,3.35,1.76),.025,silver));
  }
  // Small body markings are panel outlines and fasteners, not invented
  // historical readouts. The forward band is an equipment identification mark.
  const mark=box(.88,.22,.018,pale);mark.position.set(-.92,2.6,2.159);lander.add(mark);
  for(let n=0;n<8;n++){const m=box(.035,.14,.02,graphite);m.position.set(-1.25+n*.085,2.6,2.172);lander.add(m);}
  const reflector=box(.2,.2,.03,orange);reflector.position.set(1.65,2.83,1.98);reflector.rotation.y=.65;lander.add(reflector);

  // Crater terrain: a broad floor plus a more finely sampled landing field.
  // Values are compositional terrain coordinates, never mission telemetry.
  const craters=[[-44,-16,18,4.7],[40,-62,25,5.6],[-84,54,31,6.2],[75,40,19,3.8],[-22,-102,15,3.6]];
  for(let i=0;i<47;i++){
    const x=(hash(i*8+1)-.5)*225,z=(hash(i*8+2)-.5)*225,r=1.3+hash(i*8+3)*6.1;
    if(Math.hypot(x,z)>r+12)craters.push([x,z,r,r*(.13+hash(i*8+4)*.06)]);
  }
  function height(x,z){
    let h=.13*Math.sin(x*.12)*Math.cos(z*.14)+.045*Math.sin(x*.74+z*.33);
    for(const [cx,cz,r,d] of craters){
      const u=Math.hypot(x-cx,z-cz)/r;if(u>1.5)continue;
      if(u<1)h-=d*Math.pow(1-u*u,1.35);
      h+=d*.2*Math.exp(-Math.pow((u-1.025)/.12,2));
    }
    // Keep the selected touchdown patch flat enough for all four footpads.
    return h*smooth((Math.hypot(x,z)-6)/6);
  }
  function terrain(size,segments,omitCenter=false){
    const g=new THREE.PlaneGeometry(size,size,segments,segments);g.rotateX(-Math.PI/2);
    const p=g.attributes.position, colors=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i);p.setY(i,height(x,z));
      const n=hash(i*.751+x*1.43+z*3.31),v=.57+n*.11+.025*Math.sin(x*.4+z*.27);
      const c=new THREE.Color(0x6d7272).multiplyScalar(v);colors.push(c.r,c.g,c.b);
    }
    if(omitCenter){
      const index=g.index.array,out=[];
      for(let i=0;i<index.length;i+=3){const ix=index[i],x=p.getX(ix),z=p.getZ(ix);if(Math.abs(x)>115||Math.abs(z)>115)out.push(index[i],index[i+1],index[i+2]);}
      g.setIndex(out);
    }
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));m.receiveShadow=true;surface.add(m);return m;
  }
  terrain(1100,100,true);terrain(240,240);
  // Ejecta fragments catch low sunlight. Instancing keeps the dense field
  // inexpensive while each instance still has a distinct scale and silhouette.
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x50554f,roughness:1,flatShading:true}),460);
  const dummy=new THREE.Object3D();
  for(let i=0;i<460;i++){
    const x=(hash(i*13+4)-.5)*230,z=(hash(i*13+5)-.5)*230;
    const s=.08+Math.pow(hash(i*13+6),3)*.65;
    dummy.position.set(x,height(x,z)+s*.22,z);dummy.rotation.set(hash(i+1)*2,hash(i+2)*TAU,hash(i+3)*2);dummy.scale.set(s*1.3,s*.68,s);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  surface.add(rocks);
  // Three survey contours give the approach shot a measurable target. They
  // disappear as the pilot commits to a clear patch, before touchdown.
  const contours=new THREE.Group();surface.add(contours);
  for(const offset of [.94,1.12,1.3]){
    const [cx,cz,r]=craters[0],ps=[];for(let i=0;i<=160;i++){const a=i/160*TAU,x=cx+Math.cos(a)*r*offset,z=cz+Math.sin(a)*r*offset;ps.push(V(x,height(x,z)+.065,z));}
    contours.add(line(ps,datum));
  }
  const landingDatum=new THREE.Group();surface.add(landingDatum);
  for(const a of [0,Math.PI/2]){
    const u=V(Math.cos(a),0,Math.sin(a));
    landingDatum.add(line([u.clone().multiplyScalar(-9).setY(.045),u.clone().multiplyScalar(-6).setY(.045)],datum));
    landingDatum.add(line([u.clone().multiplyScalar(6).setY(.045),u.clone().multiplyScalar(9).setY(.045)],datum));
  }
  for(let i=0;i<4;i++){
    const a=i*TAU/4+Math.PI/4,ps=[];for(let n=0;n<=16;n++){const b=a+mix(-.15,.15,n/16);ps.push(V(Math.cos(b)*7,.045,Math.sin(b)*7));}landingDatum.add(line(ps,datum));
  }
  // Dispersed, low-opacity surface dust. A vacuum plume spreads radially and
  // never becomes a terrestrial smoke column or a flame graphic.
  const dustCount=280,dustPositions=new Float32Array(dustCount*3);
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dustMaterial=new THREE.PointsMaterial({color:0xbfc2ae,size:.065,transparent:true,opacity:.0,depthWrite:false,sizeAttenuation:true});
  dustMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','diffuseColor.a *= 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - vec2(0.5)));\n#include <alphatest_fragment>');};
  const dust=new THREE.Points(dustGeometry,dustMaterial);surface.add(dust);

  // A small Earth remains above the empty horizon, taking over from the large
  // mission graphics after touchdown. Geography is stylised geometry.
  const earthGeo=new THREE.SphereGeometry(2.3,64,40),ep=earthGeo.attributes.position,ec=[];
  for(let i=0;i<ep.count;i++){
    const x=ep.getX(i)/2.3,y=ep.getY(i)/2.3,z=ep.getZ(i)/2.3;
    const n=Math.sin(x*9+z*2)*Math.cos(y*8-z*3)+.4*Math.sin(x*16-y*5+z*8);
    const c=new THREE.Color(n>.48?0xb8c3ba:n<-.7?0xe7e9df:0x426e84);ec.push(c.r,c.g,c.b);
  }
  earthGeo.setAttribute('color',new THREE.Float32BufferAttribute(ec,3));
  const earth=new THREE.Mesh(earthGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));earth.position.set(-27,29,-128);surface.add(earth);

  // The opening orbit is a curved physical globe with topographic relief,
  // meridians and a flight arc. It is not a flat diagram held for four seconds.
  const globeGeo=new THREE.SphereGeometry(65,160,112),gp=globeGeo.attributes.position,gc=[];
  const globeCraters=Array.from({length:37},(_,i)=>({n:V(hash(i*5+1)*2-1,hash(i*5+2)*2-1,hash(i*5+3)*2-1).normalize(),radius:.035+hash(i*5+4)*.14,depth:.25+hash(i*5+5)*1.3}));
  for(let i=0;i<gp.count;i++){
    const n=V(gp.getX(i),gp.getY(i),gp.getZ(i)).normalize();
    let h=.28*Math.sin(n.x*37)*Math.cos(n.y*31)*Math.sin(n.z*39);
    for(const c of globeCraters){const d=n.distanceTo(c.n)/c.radius;if(d<1.5){if(d<1)h-=c.depth*(1-d*d);h+=c.depth*.25*Math.exp(-Math.pow((d-1.02)/.14,2));}}
    gp.setXYZ(i,n.x*(65+h),n.y*(65+h),n.z*(65+h));
    const variation=.68+.1*Math.sin(n.x*13+n.z*8)*Math.cos(n.y*11)+hash(i*.7)*.06;
    const c=new THREE.Color(0x9a9b96).multiplyScalar(variation);gc.push(c.r,c.g,c.b);
  }
  globeGeo.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));globeGeo.computeVertexNormals();
  const moon=new THREE.Mesh(globeGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));moon.position.set(0,-50,-30);orbital.add(moon);
  const grid=new THREE.Group();grid.position.copy(moon.position);orbital.add(grid);
  for(let n=-2;n<=2;n++){
    const y=n*18,r=Math.sqrt(65.6**2-y*y),ps=[];for(let i=0;i<=150;i++){const a=i/150*TAU;ps.push(V(Math.cos(a)*r,y,Math.sin(a)*r));}grid.add(line(ps,whiteLine));
  }
  for(let n=0;n<6;n++){
    const a=n*Math.PI/6,ps=[];for(let i=0;i<=150;i++){const b=i/150*TAU;ps.push(V(Math.cos(a)*Math.cos(b)*65.6,Math.sin(b)*65.6,Math.sin(a)*Math.cos(b)*65.6));}grid.add(line(ps,whiteLine));
  }
  const orbitPoints=[];for(let i=0;i<=180;i++){const a=mix(-1.7,1.16,i/180);orbitPoints.push(V(Math.cos(a)*81,Math.sin(a)*81-50,-25+Math.sin(a*1.4)*22));}
  const orbitTrack=line(orbitPoints,datum);orbital.add(orbitTrack);
  const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.9),new THREE.MeshBasicMaterial({color:LIME}));orbital.add(marker);
  const orbitLM=lander.clone(true);orbitLM.scale.setScalar(.5);orbital.add(orbitLM);
  const tangentTicks=new THREE.Group();orbital.add(tangentTicks);
  for(let n=0;n<20;n++){
    const a=mix(-1.7,1.16,n/19),p=V(Math.cos(a)*81,Math.sin(a)*81-50,-25+Math.sin(a*1.4)*22);
    tangentTicks.add(line([p.clone().add(V(0,0,-.6)),p.clone().add(V(0,0,.6))],whiteLine));
  }
  lander.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=object.material!==foil;}});

  function setCamera(pos,target,fov=48,roll=0){camera.position.copy(pos);camera.up.set(0,1,0);camera.lookAt(target);camera.rotateZ(roll);camera.fov=fov;camera.updateProjectionMatrix();}
  function flight(t){
    if(t<28){const q=clamp((t-21.8)/3.2);return V(mix(-92,-66,q),mix(39,30,q),mix(-36,-20,q));}
    if(t<31){const q=smooth((t-28)/3);return V(mix(-66,-23,q),mix(25,13,q),mix(-20,-8,q));}
    if(t<33){const q=smooth((t-31)/2);return V(mix(-23,-4.3,q),mix(13,4.3,q),mix(-8,-.9,q));}
    if(t<35.65){const q=smooth((t-33)/2.65);return V(mix(-4.3,0,q),mix(4.3,0,q),mix(-.9,0,q));}
    return V(0,0,0);
  }
  function update(t){
    t=Number.isFinite(t)?t:18;
    const orbit=t<21.8;orbital.visible=orbit;surface.visible=!orbit;
    const pos=flight(t);lander.position.copy(pos);
    const lightTarget=orbit?moon.position:pos.clone().add(V(0,-Math.min(pos.y,10),0));
    sun.position.copy(lightTarget).add(V(-42,28,35));sun.target.position.copy(lightTarget);sun.target.updateMatrixWorld();
    const attitude=t<28?-.095:t<31?mix(-.095,-.025,smooth((t-28)/3)):t<33?mix(-.025,0,smooth((t-31)/2)):0;
    lander.rotation.set(0,.08*Math.sin(t*.27)*(1-smooth((t-28)/5)),attitude);
    for(let i=0;i<jets.length;i++)jets[i].visible=t>22&&t<33&&Math.sin(t*12+i*1.8)>.96&&i%4===0;
    for(const p of probes){p.object.quaternion.setFromAxisAngle(p.axis,-Math.PI*.49*smooth((t-34.8)/.65));}
    contours.visible=t>=28&&t<30.8;landingDatum.visible=t>=30.4&&t<35.1;
    const dustPower=smooth((t-32)/1.9)*(1-smooth((t-35.65)/1.6));dustMaterial.opacity=dustPower*.26;
    dust.visible=t>32&&t<37.3;
    if(dust.visible){
      for(let i=0;i<dustCount;i++){
        const phase=(t*.72+hash(i+11))%1,a=hash(i*9+6)*TAU,r=1+phase*(5+hash(i*9+5)*10);
        const x=pos.x+Math.cos(a)*r,z=pos.z+Math.sin(a)*r;
        dustPositions[i*3]=x;dustPositions[i*3+1]=height(x,z)+.06+Math.sin(phase*Math.PI)*.13;dustPositions[i*3+2]=z;
      }
      dustGeometry.attributes.position.needsUpdate=true;
    }
    earth.rotation.y=.25+t*.002;
    if(orbit){
      const q=clamp((t-18)/3.8),a=mix(-.10,.86,q);
      marker.position.set(Math.cos(a)*81,Math.sin(a)*81-50,-25+Math.sin(a*1.4)*22);
      orbitLM.position.copy(marker.position).add(V(0,1.4,0));orbitLM.rotation.set(-.12,Math.PI*.15,-a*.3);marker.visible=q<.5;
      orbitTrack.geometry.setDrawRange(0,Math.floor(181*clamp(.5+q*.5)));
      whiteLine.opacity=mix(.3,.08,q);
      if(t<19.5){
        const k=smooth((t-18)/1.5);setCamera(V(mix(160,130,k),mix(71,28,k),mix(194,131,k)),V(5,-26,-30),mix(46,48,k),mix(-.11,.03,k));
      }else{
        const k=smooth((t-19.5)/2.3);const p=orbitLM.position;
        setCamera(V(130,28,131).lerp(p.clone().add(V(8,3.4,12)),k),V(5,-26,-30).lerp(p.clone().add(V(0,1.6,0)),k),mix(48,54,k),mix(.03,-.08,k));
      }
    }else if(t<23.3){
      const q=easeOut((t-21.8)/1.5);
      setCamera(pos.clone().add(V(mix(8,5.2,q),mix(3.4,6.2,q),mix(12,10.5,q))),pos.clone().add(V(0,3.0,0)),mix(54,49,q),mix(-.08,.015,q));
    }else if(t<25){
      const q=smooth((t-23.3)/1.7);
      setCamera(pos.clone().add(V(mix(5.2,3.25,q),mix(6.2,4.65,q),mix(10.5,3.55,q))),pos.clone().add(V(mix(0,.25,q),mix(3,4.45,q),mix(0,1,q))),mix(49,55,q),mix(.015,-.035,q));
    }else if(t<28){
      setCamera(pos.clone().add(V(3.25,4.65,3.55)),pos.clone().add(V(.25,4.45,1)),55,-.035);
    }else if(t<29.6){
      const q=smooth((t-28)/1.6);
      setCamera(pos.clone().add(V(mix(16,11,q),mix(17,8,q),mix(30,23,q))),pos.clone().add(V(mix(10,5,q),mix(-5,-2,q),-3)),mix(55,57,q),mix(-.075,.025,q));
    }else if(t<31){
      const q=smooth((t-29.6)/1.4);
      setCamera(pos.clone().add(V(mix(11,-12,q),mix(8,10,q),mix(23,19,q))),pos.clone().add(V(4,0,-3)),mix(57,61,q),mix(.025,.06,q));
    }else if(t<32.3){
      const q=smooth((t-31)/1.3);
      setCamera(pos.clone().add(V(mix(-12,-10,q),mix(10,6,q),mix(19,14,q))),pos.clone().add(V(mix(4,1,q),mix(0,1,q),mix(-3,1,q))),mix(61,55,q),mix(.06,.01,q));
    }else if(t<33.3){
      const q=smooth((t-32.3)/1);
      setCamera(pos.clone().add(V(mix(-10,-6.4,q),mix(6,1.4,q),mix(14,7.7,q))),pos.clone().add(V(0,mix(1,.25,q),mix(1,3.5,q))),mix(55,62,q),mix(.01,-.055,q));
    }else if(t<35.65){
      const q=smooth((t-33.3)/2.35);
      // Macro follows the front foot until the remaining gap is physically
      // eliminated. Ground, pad and ladder remain together in the same space.
      setCamera(pos.clone().add(V(mix(-6.4,-2.65,q),mix(1.4,.8,q),mix(7.7,6.6,q))),pos.clone().add(V(0,.22,4.1)),mix(62,57,q),mix(-.055,0,q));
    }else if(t<36.5){
      const q=easeOut((t-35.65)/.85);
      setCamera(V(-2.65,.8,6.6).lerp(V(-8.2,4.1,11),q),V(0,.22,4.1).lerp(V(0,2.45,0),q),mix(57,48,q),0);
    }else{
      const q=smooth((t-36.5)/3.5);
      setCamera(V(-8.2,4.1,11).lerp(V(17.5,8.8,28),q),V(0,2.45,0).lerp(V(-2,3.9,-6),q),mix(48,47,q),mix(0,-.025,q));
    }
    return {stage:t<21.8?'orbital-descent':t<25?'eagle-approach':t<28?'computer-interlude':t<33?'clear-landing-patch':t<35.65?'footpad-contact':'tranquility',landerPosition:pos.toArray(),touchdown:t>=35.65};
  }
  function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
  function dispose(){
    const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);});
    for(const g of gs)g.dispose();for(const m of ms)m.dispose();
  }
  update(18);return{scene,camera,update,resize,dispose};
}
