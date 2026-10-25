import * as THREE from '../vendor/three.module.js';
// Celestial radii preserve 6371:1737. Separation, orbit speed and the sizes of
// engineering objects are authored for legibility, not reconstructed telemetry.
const TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const INK=0x080d12,BONE=0xeeeadd,BLUE=0x4a778b,GOLD=0xb89b58,LIME=0xc6f16a,ORANGE=0xf86b3d;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,p)=>a+(b-a)*p;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);},fract=x=>x-Math.floor(x);
const hash=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
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

function earthAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const c = canvas.getContext('2d'); c.fillStyle = '#345667'; c.fillRect(0, 0, 2048, 1024);
  const project = ([lon, lat]) => [(lon + 180) / 360 * 2048, (90 - lat) / 180 * 1024];
  // Graphic coast outlines, deliberately simplified rather than photographic.
  const continents = [
    [[-168,71],[-148,70],[-132,57],[-126,49],[-123,39],[-117,32],[-109,28],[-105,22],[-97,16],[-88,16],[-82,9],[-78,9],[-86,22],[-81,25],[-80,32],[-72,42],[-60,47],[-54,54],[-61,61],[-77,64],[-88,71],[-108,74],[-130,70]],
    [[-80,12],[-66,10],[-53,3],[-35,-7],[-40,-22],[-49,-29],[-56,-35],[-64,-55],[-72,-49],[-75,-32],[-80,-13]],
    [[-53,60],[-44,61],[-20,72],[-28,82],[-48,84],[-64,76]],
    [[-10,36],[-9,44],[2,49],[8,54],[6,61],[15,71],[30,70],[42,65],[58,68],[76,73],[104,77],[131,71],[163,67],[178,61],[166,54],[150,59],[140,49],[132,43],[129,34],[122,25],[113,21],[107,10],[101,1],[95,5],[90,22],[80,7],[73,12],[68,25],[57,25],[50,14],[44,13],[39,31],[31,35],[27,41],[15,38],[8,42],[0,38]],
    [[-17,36],[8,37],[29,31],[35,23],[43,13],[51,11],[43,-1],[38,-14],[31,-28],[20,-35],[12,-30],[9,-16],[2,-5],[-8,5],[-17,15]],
    [[112,-11],[130,-12],[139,-11],[144,-18],[153,-27],[146,-39],[130,-33],[115,-34]],
    [[47,-13],[50,-16],[48,-25],[44,-23]],
    [[130,31],[136,34],[140,40],[145,44],[142,35]],
    [[-180,-76],[-130,-72],[-83,-77],[-60,-65],[-49,-75],[0,-70],[55,-69],[100,-67],[150,-73],[180,-76],[180,-90],[-180,-90]]
  ];
  c.fillStyle = '#95a49b'; c.strokeStyle = '#c7cdbb'; c.lineWidth = 1.5;
  for (const polygon of continents) {
    c.beginPath(); polygon.map(project).forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill(); c.stroke();
  }
  c.strokeStyle = 'rgba(216,225,213,.14)'; c.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) { const x = project([lon,0])[0]; c.beginPath(); c.moveTo(x,0); c.lineTo(x,1024); c.stroke(); }
  for (let lat = -75; lat <= 75; lat += 15) { const y = project([0,lat])[1]; c.beginPath(); c.moveTo(0,y); c.lineTo(2048,y); c.stroke(); }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  return map;
}

function moonAtlas() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const c = canvas.getContext('2d'); c.fillStyle = '#aead9f'; c.fillRect(0,0,2048,1024);
  // Broad maria and local craters are procedural; this is not a landing-site map.
  for (let i = 0; i < 45; i++) {
    const x = hash(i+2) * 2048, y = hash(i+90) * 850 + 80;
    const r = 45 + hash(i+171) * 155;
    const grad = c.createRadialGradient(x,y,r*.15,x,y,r);
    grad.addColorStop(0,'rgba(48,57,60,.35)'); grad.addColorStop(1,'rgba(48,57,60,0)');
    c.fillStyle = grad; c.beginPath(); c.ellipse(x,y,r,r*.7,hash(i)*3,0,TAU); c.fill();
  }
  for (let i = 0; i < 900; i++) {
    const x = hash(i+1300) * 2048, y = hash(i+2700) * 1024;
    const r = 1 + Math.pow(hash(i+3900),4) * 24;
    c.fillStyle = 'rgba(25,34,36,.18)'; c.beginPath(); c.ellipse(x,y,r,r*.7,0,0,TAU); c.fill();
    c.strokeStyle = 'rgba(236,234,219,.26)'; c.lineWidth = Math.max(.6,r*.12);
    c.beginPath(); c.ellipse(x+.4,y+.5,r,r*.7,0,.1,Math.PI*.97); c.stroke();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  return map;
}

function atmosphere(radius, color) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius,80,48), new THREE.ShaderMaterial({
    uniforms:{rimColor:{value:new THREE.Color(color)}},
    vertexShader:'varying vec3 n;varying vec3 eye;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);eye=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader:'uniform vec3 rimColor;varying vec3 n;varying vec3 eye;void main(){float r=pow(1.-max(0.,dot(normalize(n),normalize(eye))),6.);gl_FragColor=vec4(rimColor,r*.28);}',
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  }));
}


// Approved Eagle construction copied from lunar.js, with no old terrain or
// timeline instantiated. Folded probes and inactive RCS remain on the ground.
function createEagle(){
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

  const lander=new THREE.Group();
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


  for(const p of probes)p.object.quaternion.setFromAxisAngle(p.axis,-Math.acos(.15/1.64));
  jets.forEach(j=>j.visible=false);
  return lander;
}

function setLine(o,points){const a=o.geometry.attributes.position;points.forEach((p,i)=>a.setXYZ(i,p.x,p.y,p.z));a.needsUpdate=true;o.geometry.computeBoundingSphere();}
function circle(r,mat,n=160){return line(Array.from({length:n+1},(_,i)=>V(Math.cos(i/n*TAU)*r,Math.sin(i/n*TAU)*r,0)),mat);}
// Merge only fixed, visible triangles. Hidden RCS jets stay hidden, and line
// details retain their original depth testing. No dependency or whole-scene clone.
function batch(group){
  group.updateMatrixWorld(true);const inv=group.matrixWorld.clone().invert(),sets=new Map(),remove=[];
  group.traverse(o=>{if(!o.isMesh||!o.visible||Array.isArray(o.material))return;let p=o.parent;while(p&&p!==group){if(!p.visible)return;p=p.parent;}
    const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    const attrs=Object.keys(g.attributes).sort(),key=o.material.uuid+':'+attrs.join('/');if(!sets.has(key))sets.set(key,{mat:o.material,attrs,items:[]});sets.get(key).items.push(g);remove.push(o);
  });
  // Edges are children of the source meshes; flatten them before removing parent.
  const edges=[];group.traverse(o=>{if(o.isLine){const g=o.geometry.clone();g.applyMatrix4(inv.clone().multiply(o.matrixWorld));const n=o.isLineSegments?new THREE.LineSegments(g,o.material):new THREE.Line(g,o.material);edges.push(n);}});
  group.clear();
  for(const {mat,attrs,items}of sets.values()){const g=new THREE.BufferGeometry();for(const name of attrs){const size=items[0].attributes[name].itemSize;const total=items.reduce((n,x)=>n+x.attributes[name].array.length,0),a=new Float32Array(total);let at=0;for(const x of items){a.set(x.attributes[name].array,at);at+=x.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(a,size));}g.computeBoundingSphere();group.add(new THREE.Mesh(g,mat));items.forEach(g=>g.dispose());}
  edges.forEach(o=>group.add(o));return group;
}
function segmentClear(a,b,center,r){const d=b.clone().sub(a),u=clamp(center.clone().sub(a).dot(d)/d.lengthSq());return a.clone().addScaledVector(d,u).distanceTo(center)>r-1e-5;}

function makeDish(aim=V(.64,.76,0).normalize()){
  const g=new THREE.Group(),assembly=new THREE.Group();g.add(assembly);
  const pale=new THREE.MeshStandardMaterial({color:BONE,roughness:.74,metalness:.22,side:THREE.DoubleSide});
  const steel=new THREE.MeshStandardMaterial({color:0x52656a,roughness:.57,metalness:.5});
  const dark=new THREE.MeshStandardMaterial({color:0x152329,roughness:.88,metalness:.1});
  const ink=new THREE.LineBasicMaterial({color:0x526366,transparent:true,opacity:.75});
  const footing=new THREE.Mesh(new THREE.CylinderGeometry(.39,.55,.1,32),steel);footing.position.y=.06;g.add(footing);
  const column=new THREE.Mesh(new THREE.CylinderGeometry(.14,.25,.62,16),dark);column.position.y=.38;g.add(column);
  const collar=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.12,32),pale);collar.position.y=.66;g.add(collar);
  for(const x of [-.3,.3]){const arm=box(.095,.62,.12,steel);arm.position.set(x,.92,0);arm.rotation.z=-Math.sign(x)*.17;g.add(arm);}
  assembly.position.y=1.08;assembly.quaternion.setFromUnitVectors(V(0,1,0),aim);
  g.userData.feed=V(0,1.08,0).addScaledVector(aim,.8);
  const shape=Array.from({length:24},(_,i)=>new THREE.Vector2(i/23*.78,Math.pow(i/23,2)*.225));
  const dish=new THREE.Mesh(new THREE.LatheGeometry(shape,96),pale);assembly.add(dish);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.78,.015,6,96),steel);rim.rotation.x=Math.PI/2;rim.position.y=.225;assembly.add(rim);
  for(let i=0;i<24;i++){const a=i/24*TAU;const ps=shape.map(p=>V(Math.cos(a)*p.x,p.y+.001,Math.sin(a)*p.x));assembly.add(line(ps,ink));}
  for(const radius of [.22,.43,.62]){const ring=circle(radius,ink,96);ring.rotation.x=Math.PI/2;ring.position.y=Math.pow(radius/.78,2)*.225+.003;assembly.add(ring);}
  for(let i=0;i<4;i++){const a=i*TAU/4+.3;assembly.add(rod(V(Math.cos(a)*.72,.2,Math.sin(a)*.72),V(0,.8,0),.012,steel));}
  const feed=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,.16,12),dark);feed.position.y=.76;assembly.add(feed);
  const cable=[V(0,.73,0),V(-.25,.32,.15),V(-.29,-.2,.12),V(-.16,-.8,.1)];assembly.add(line(cable,new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.8})));
  // Receive-chain housing carries real functional words, never sampled numbers.
  const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const c=cv.getContext('2d');c.fillStyle='#142229';c.fillRect(0,0,1024,512);c.fillStyle='#eeeadd';c.font='650 54px Archivo';c.fillText('S-BAND RECEIVE',54,84);c.strokeStyle='#53696a';c.lineWidth=3;c.strokeRect(35,122,954,343);c.font='500 37px Archivo';['RF','IF','DEMOD','VOICE / DATA'].forEach((w,i)=>{c.fillStyle=i===3?'#c6f16a':'#eeeadd';c.fillText(w,[70,255,445,700][i],235);});c.strokeStyle='#c6f16a';for(const x of [150,335,618]){c.beginPath();c.moveTo(x,222);c.lineTo(x+65,222);c.moveTo(x+53,213);c.lineTo(x+65,222);c.lineTo(x+53,231);c.stroke();}c.fillStyle='#a2bab5';c.font='400 32px Archivo';c.fillText('CARRIER',70,390);c.fillText('BASEBAND',700,390);c.strokeStyle='#53696a';c.beginPath();c.moveTo(270,380);c.lineTo(655,380);c.stroke();
  const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const housing=box(.72,.4,.29,dark);housing.position.set(-.64,.31,.8);g.add(housing);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.65,.325),new THREE.MeshBasicMaterial({map}));screen.position.set(-.64,.31,.948);g.add(screen);
  const platform=box(1.4,.06,.8,steel);platform.position.set(0,.05,.48);g.add(platform);
  for(let i=0;i<6;i++){const rung=box(.07,.025,.42,pale);rung.position.set(-.53+i*.21,.085,.57);g.add(rung);}
  for(const x of [-.65,.65]){for(const z of [.24,.79])g.add(rod(V(x,.08,z),V(x,.4,z),.012,pale));g.add(rod(V(x,.4,.24),V(x,.4,.79),.012,pale));}
  return batch(g);
}

function makeCSM(){
  const g=new THREE.Group(),silver=new THREE.MeshStandardMaterial({color:0xbac4c0,roughness:.5,metalness:.55}),pale=new THREE.MeshStandardMaterial({color:BONE,roughness:.7,metalness:.25}),dark=new THREE.MeshStandardMaterial({color:0x19242a,roughness:.7,metalness:.2}),gold=new THREE.MeshStandardMaterial({color:GOLD,roughness:.6,metalness:.4});
  const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,1.35,48),silver);cylinder.position.y=-.43;g.add(cylinder);
  const cabin=new THREE.Mesh(new THREE.ConeGeometry(.67,.91,48),pale);cabin.position.y=.71;g.add(cabin);
  const heatshield=new THREE.Mesh(new THREE.CylinderGeometry(.685,.685,.06,48),dark);heatshield.position.y=.26;g.add(heatshield);
  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.19,.48,.69,32,1,true),dark);nozzle.position.y=-1.44;g.add(nozzle);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(.48,.025,6,32),silver);lip.rotation.x=Math.PI/2;lip.position.y=-1.78;g.add(lip);
  const dock=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.19,16),dark);dock.position.y=1.23;g.add(dock);
  for(let i=0;i<6;i++){const a=i/6*TAU;const panel=box(.3,1.13,.025,i%2?pale:dark);panel.position.set(Math.sin(a)*.655,-.43,Math.cos(a)*.655);panel.rotation.y=a;g.add(panel);for(let j=0;j<8;j++){const f=box(.24,.015,.02,silver);f.position.set(Math.sin(a)*.675,-.91+j*.14,Math.cos(a)*.675);f.rotation.y=a;g.add(f);}}
  for(let i=0;i<4;i++){const a=i*TAU/4;const quad=box(.16,.14,.16,gold);quad.position.set(Math.sin(a)*.75,-.03,Math.cos(a)*.75);g.add(quad);for(const sign of [-1,1]){const n=new THREE.Mesh(new THREE.CylinderGeometry(.027,.06,.15,8,1,true),dark);n.position.copy(quad.position).add(V(0,sign*.14,0));n.rotation.z=sign<0?Math.PI:0;g.add(n);}}
  for(let i=0;i<4;i++){const disk=new THREE.Mesh(new THREE.CircleGeometry(.15,20),pale);disk.position.set(.7+(i%2)*.31,-.55+Math.floor(i/2)*.31,.75);disk.rotation.x=-.25;g.add(disk);}g.add(rod(V(.4,-.7,.4),V(.85,-.4,.75),.035,silver));
  const window=box(.22,.18,.024,dark);window.position.set(0,.72,.33);window.rotation.x=-.62;g.add(window);
  return batch(g);
}

export function createFinaleSpace(){
  const scene=new THREE.Scene();scene.background=new THREE.Color(INK);
  const camera=new THREE.PerspectiveCamera(43,16/9,.002,450);
  scene.add(new THREE.AmbientLight(0xa1b3b6,.5));const sun=new THREE.DirectionalLight(0xfff2d6,2.6);sun.position.set(-19,24,35);scene.add(sun);const fill=new THREE.DirectionalLight(0x4a778b,.32);fill.position.set(25,-4,-15);scene.add(fill);
  const ec=V(-14,0,0),mc=V(14.5,1.1,-3.7),er=6.371,mr=1.737;
  const earth=new THREE.Group();earth.position.copy(ec);scene.add(earth);
  const globe=new THREE.Mesh(new THREE.SphereGeometry(er,128,80),new THREE.MeshStandardMaterial({map:earthAtlas(),roughness:.95}));globe.rotation.y=-.4;earth.add(globe,atmosphere(er*1.008,BLUE));
  const moon=new THREE.Mesh(new THREE.SphereGeometry(mr,128,80),new THREE.MeshStandardMaterial({map:moonAtlas(),roughness:1}));moon.position.copy(mc);moon.rotation.set(.2,-.75,.1);scene.add(moon);
  const white=new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.2,depthWrite:false}),quiet=new THREE.LineBasicMaterial({color:BLUE,transparent:true,opacity:.25,depthWrite:false}),lime=new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.75,depthWrite:false}),orange=new THREE.LineBasicMaterial({color:ORANGE,transparent:true,opacity:.63,depthWrite:false});
  const net=new THREE.Group();earth.add(net);const normals=[V(.58,.2,.79).normalize(),V(.8,.5,.32).normalize(),V(.85,-.22,.47).normalize()];
  const stationPoints=normals.map(n=>ec.clone().addScaledVector(n,er+.012)),stationTips=[],stations=[];
  normals.forEach((n,i)=>{const rotation=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),n),aim=mc.clone().sub(stationPoints[i]).normalize().applyQuaternion(rotation.clone().invert());const station=makeDish(aim);station.scale.setScalar(i===0?.32:.16);station.position.copy(n).multiplyScalar(er+.01);station.quaternion.copy(rotation);earth.add(station);station.updateMatrixWorld(true);stationTips.push(station.localToWorld(station.userData.feed.clone()));stations.push(station);});
  // Ground routing is represented by surface geodesics, not a wire through Earth.
  const groundRoutes=[];for(let i=1;i<normals.length;i++){const pts=Array.from({length:161},(_,j)=>normals[0].clone().lerp(normals[i],j/160).normalize().multiplyScalar(er+.035));const route=line(pts,white);net.add(route);groundRoutes.push(route);}
  const planetReference=new THREE.Group();earth.add(planetReference);for(const z of [0,Math.PI/2]){const r=circle(er*1.012,quiet);r.rotation.y=z;planetReference.add(r);}const equator=circle(er*1.012,white);equator.rotation.x=Math.PI/2;planetReference.add(equator);
  const eagleNormal=V(-.79,.16,.59).normalize(),eaglePoint=mc.clone().addScaledVector(eagleNormal,mr+.001);
  const eagle=batch(createEagle());eagle.scale.setScalar(.0175);eagle.position.copy(eaglePoint);eagle.quaternion.setFromUnitVectors(V(0,1,0),eagleNormal);scene.add(eagle);
  const eagleTip=eaglePoint.clone().addScaledVector(eagleNormal,.11),groundTip=stationTips[0].clone();
  const padRing=circle(.15,new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.5}),96);padRing.quaternion.setFromUnitVectors(V(0,0,1),eagleNormal);padRing.position.copy(eaglePoint).addScaledVector(eagleNormal,.003);scene.add(padRing);
  const orbit=new THREE.Group();orbit.position.copy(mc);orbit.rotation.set(.79,-.12,.28);scene.add(orbit);const orbitRadius=2.28;
  const orbitLine=circle(orbitRadius,white,280);orbit.add(orbitLine);
  const orbitMarks=new THREE.BufferGeometry(),markPoints=[];for(let i=0;i<72;i++){const a=i/72*TAU;markPoints.push(Math.cos(a)*(orbitRadius+.03),Math.sin(a)*(orbitRadius+.03),0,Math.cos(a)*(orbitRadius+(i%6?.065:.13)),Math.sin(a)*(orbitRadius+(i%6?.065:.13)),0);}orbitMarks.setAttribute('position',new THREE.Float32BufferAttribute(markPoints,3));orbit.add(new THREE.LineSegments(orbitMarks,quiet));
  const csm=makeCSM();csm.scale.setScalar(.13);orbit.add(csm);
  const tail=line(Array.from({length:81},()=>V()),lime);orbit.add(tail);
  const eagleEarth=line([eagleTip,groundTip],lime),csmEarth=line([V(),groundTip],orange),localLink=line([V(),eagleTip],white);scene.add(eagleEarth,csmEarth,localLink);
  const packets=new THREE.InstancedMesh(new THREE.SphereGeometry(.025,8,6),new THREE.MeshBasicMaterial({color:LIME}),12);scene.add(packets);const dummy=new THREE.Object3D();
  const nodeMaterial=new THREE.MeshBasicMaterial({color:LIME});const nodes=stationPoints.map(p=>{const n=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),nodeMaterial);n.position.copy(p).add(p.clone().sub(ec).normalize().multiplyScalar(.02));scene.add(n);return n;});
  const starCoords=[];for(let i=0;i<210;i++){const a=hash(i+200)*TAU,z=hash(i+330)*2-1,r=100+hash(i+510)*70;starCoords.push(Math.sqrt(1-z*z)*Math.cos(a)*r,z*r,Math.sqrt(1-z*z)*Math.sin(a)*r);}const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(starCoords,3));scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:BONE,size:.055,transparent:true,opacity:.28,depthWrite:false})));
  const csmWorld=V(),look=V(),cameraUp=V(0,1,0),earthward=ec.clone().sub(mc).normalize();
  function project(p){const q=p.clone().project(camera),dir=p.clone().sub(camera.position);return{x:(q.x+1)/2,y:(1-q.y)/2,visible:q.z>=-1&&q.z<=1&&dir.dot(camera.getWorldDirection(V()))>0};}
  function update(time,options={}){
    const t=Math.max(214.8,Math.min(252.720544,Number.isFinite(time)?time:214.8)),p=clamp(options.progress??0),s=smooth(p),mode=options.mode||'ground',consensus=clamp(options.consensus??0),hit=clamp(options.hit??0),view=options.view||'';
    // This orbit is a continuous illustrative clock, never a second takeoff.
    // Ease into the final pose so the last frame cannot keep drifting on hold.
    const elapsed=t-214.8,settle=clamp((elapsed-34)/3.920544),clock=elapsed<34?elapsed:34+3.920544*(settle-settle*settle+settle*settle*settle/3);
    const angle=2.48-clock*.065;csm.position.set(Math.cos(angle)*orbitRadius,Math.sin(angle)*orbitRadius,0);csm.rotation.set(0,0,angle-Math.PI/2);orbit.updateMatrixWorld(true);csm.getWorldPosition(csmWorld);
    setLine(tail,Array.from({length:81},(_,i)=>{const a=angle+.38*(1-i/80);return V(Math.cos(a)*orbitRadius,Math.sin(a)*orbitRadius,0);}));
    const csmToEarth=segmentClear(csmWorld,groundTip,mc,mr)&&segmentClear(csmWorld,groundTip,ec,er),direct=segmentClear(csmWorld,eagleTip,mc,mr),eagleToEarth=segmentClear(eagleTip,groundTip,mc,mr)&&segmentClear(eagleTip,groundTip,ec,er);
    setLine(csmEarth,[csmWorld,groundTip]);setLine(localLink,[csmWorld,eagleTip]);
    const linksOn=mode==='link'||mode==='whole'||mode==='finale';eagleEarth.visible=linksOn&&eagleToEarth;csmEarth.visible=linksOn&&csmToEarth;localLink.visible=mode!=='ground'&&direct;
    lime.opacity=.68+hit*.19;orange.opacity=.46+hit*.2;white.opacity=.19+consensus*.10;padRing.visible=mode!=='ground';
    packets.visible=linksOn;for(let i=0;i<12;i++){const c=i<6?eagleToEarth:csmToEarth,from=i<6?eagleTip:csmWorld,phase=fract(clock*.29+i/6);dummy.position.copy(from).lerp(groundTip,phase);dummy.scale.setScalar(c?1:0);dummy.updateMatrix();packets.setMatrixAt(i,dummy.matrix);}packets.instanceMatrix.needsUpdate=true;
    groundRoutes.forEach((route,i)=>route.material.opacity=.15+.27*clamp(consensus*3-i));nodes.forEach((n,i)=>n.scale.setScalar(.7+.45*clamp(consensus*3-i)));
    planetReference.visible=mode==='ground'||mode==='whole'||mode==='finale';orbitLine.visible=mode!=='ground';orbitMarks.visible=mode!=='ground';
    const station=stationPoints[0],n=normals[0],tangent=V(.8,.05,-.6).normalize();
    camera.up.copy(cameraUp);let fov=43;
    if(mode==='ground'){
      if(view==='network'){camera.position.copy(ec).add(V(mix(8,5,s),mix(4,6,s),mix(14,19,s)));look.copy(ec).add(V(1,.4,0));fov=43;}
      else if(view==='receiver'){camera.up.copy(n);camera.position.copy(stations[0].localToWorld(V(mix(-.9,-.7,s),.55,mix(1.8,2.25,s))));look.copy(stations[0].localToWorld(V(-.53,.4,.35)));fov=48;}
      else{camera.up.copy(n);camera.position.copy(stations[0].localToWorld(V(mix(-2.4,-5,s),mix(1.7,4,s),mix(3.5,9,s))));look.copy(stations[0].localToWorld(V(0,.95,0)));fov=46;}
    }else if(mode==='orbit'){
      if(view==='surface'){camera.up.copy(eagleNormal);camera.position.copy(eagle.localToWorld(V(mix(12,24,s),mix(7,11,s),mix(19,31,s))));look.copy(eagle.localToWorld(V(0,3.1,0)));fov=47;}
      else{camera.position.copy(csmWorld).add(V(mix(.65,3.9,s),mix(.44,2.3,s),mix(1.15,5.9,s)));look.copy(csmWorld).lerp(mc,s*.8);fov=mix(43,47,s);}
    }else if(mode==='link'){
      camera.position.copy(eagleTip).addScaledVector(eagleNormal,mix(.6,7,s)).add(V(mix(.1,-2,s),mix(.3,2.5,s),mix(.85,9,s)));look.copy(eagleTip).lerp(ec,s*.66);fov=49;
    }else if(mode==='whole'){
      camera.position.set(mix(3,-2,s),mix(13,9,s),mix(40,43,s));look.set(.8,1,-1.5);fov=47;
    }else{
      const lock=smooth(Math.min(1,p/.82));camera.position.set(mix(-3,-1.4,lock),mix(7.7,9.5,lock),mix(43,46,lock));look.set(.25,.65,-1.5);fov=46;
    }
    camera.lookAt(look);camera.fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    const anchors={earth:project(ec),moon:project(mc),eagle:project(eagleTip),csm:project(csmWorld),ground:project(groundTip)};
    for(const [name,point]of [['eagle',eagleTip],['csm',csmWorld],['ground',groundTip]]){anchors[name].occluded=!segmentClear(camera.position,point,mc,mr)||!segmentClear(camera.position,point,ec,er);anchors[name].visible=anchors[name].visible&&!anchors[name].occluded;}
    return{stage:'finale/'+mode,mode,progress:p,consensus,anchors,links:{eagleEarth:eagleToEarth,csmEarth:csmToEarth,eagleCSM:direct},positions:{eagle:eaglePoint.toArray(),csm:csmWorld.toArray()},bodyRadii:{earth:er,moon:mr}};
  }
  function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
  update(214.8);return{scene,camera,update,resize};
}
