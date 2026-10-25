import * as THREE from '../vendor/three.module.js';

// Authored spatial montage: body radii retain their ratio, distances are staged.
const TAU = Math.PI * 2;
const INK = 0x080d12, BONE = 0xeeeadd, BLUE = 0x4a778b, GOLD = 0xb89b58, LIME = 0xc6f16a;
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const blend = (a, b, t) => a + (b - a) * t;
const random = i => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

function line(points, color, opacity = 1) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({color, transparent:true, opacity, depthWrite:false}));
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
    const x = random(i+2) * 2048, y = random(i+90) * 850 + 80;
    const r = 45 + random(i+171) * 155;
    const grad = c.createRadialGradient(x,y,r*.15,x,y,r);
    grad.addColorStop(0,'rgba(48,57,60,.35)'); grad.addColorStop(1,'rgba(48,57,60,0)');
    c.fillStyle = grad; c.beginPath(); c.ellipse(x,y,r,r*.7,random(i)*3,0,TAU); c.fill();
  }
  for (let i = 0; i < 900; i++) {
    const x = random(i+1300) * 2048, y = random(i+2700) * 1024;
    const r = 1 + Math.pow(random(i+3900),4) * 24;
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

function ring(radius, material, segments = 220) {
  const p = Array.from({length:segments+1},(_,i) => v3(Math.cos(i/segments*TAU)*radius,Math.sin(i/segments*TAU)*radius,0));
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),material);
}

export function createDistance() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(INK);
  const camera = new THREE.PerspectiveCamera(42,16/9,.03,600);
  const earthCenter = v3(-7,0,0), moonCenter = v3(21,1.5,-3);
  scene.add(new THREE.AmbientLight(0x91a1ad, .33));
  const sun = new THREE.DirectionalLight(0xfff4db, 2.65); sun.position.set(-18,16,28); scene.add(sun);
  const rimLight = new THREE.DirectionalLight(0x4a778b,.3); rimLight.position.set(20,-2,-10); scene.add(rimLight);

  const earth = new THREE.Group(); earth.position.copy(earthCenter); scene.add(earth);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(3.67,128,80),new THREE.MeshStandardMaterial({map:earthAtlas(),roughness:.94,metalness:0}));
  earth.add(globe, atmosphere(3.71,BLUE)); globe.rotation.y = -.45;
  earth.rotation.z = -.19;

  const earthSurvey = new THREE.Group(); earth.add(earthSurvey);
  const surveyMat = new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.22,depthWrite:false});
  const equator = ring(3.76,surveyMat); equator.rotation.x = Math.PI/2; earthSurvey.add(equator);
  const meridian = ring(3.76,surveyMat); earthSurvey.add(meridian);
  const polar = ring(3.76,surveyMat); polar.rotation.y = Math.PI/2; earthSurvey.add(polar);
  for(let i=0;i<72;i++) {
    const a = i/72*TAU, big=i%6===0;
    earthSurvey.add(line([v3(Math.cos(a)*3.8,0,Math.sin(a)*3.8),v3(Math.cos(a)*(big?4.04:3.91),0,Math.sin(a)*(big?4.04:3.91))],GOLD,.4));
  }

  const moon = new THREE.Group(); moon.position.copy(moonCenter); scene.add(moon);
  const moonBall = new THREE.Mesh(new THREE.SphereGeometry(1,112,72),new THREE.MeshStandardMaterial({map:moonAtlas(),roughness:1,metalness:0}));
  moonBall.rotation.set(.2,-.75,.1); moon.add(moonBall);
  const lunarGrid = new THREE.Group(); moon.add(lunarGrid);
  const lunarGridMat = new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.13,depthWrite:false});
  for(let i=0;i<6;i++) { const r=ring(1.009,lunarGridMat,120); r.rotation.y=i*Math.PI/6; lunarGrid.add(r); }
  for(let i=-2;i<=2;i++) { const y=i*.3, r=ring(Math.sqrt(1.018-y*y),lunarGridMat,120); r.rotation.x=Math.PI/2;r.position.y=y;lunarGrid.add(r); }

  const orbitGroup = new THREE.Group(); orbitGroup.position.copy(moonCenter); orbitGroup.rotation.set(.88,-.23,.24); scene.add(orbitGroup);
  const orbitMat = new THREE.LineBasicMaterial({color:GOLD,transparent:true,opacity:.6,depthWrite:false});
  const orbit = ring(1.6,orbitMat); orbitGroup.add(orbit);
  const lowerOrbit = ring(1.2,new THREE.LineBasicMaterial({color:BONE,transparent:true,opacity:.24,depthWrite:false})); orbitGroup.add(lowerOrbit);
  for(let i=0;i<48;i++) {
    const a=i/48*TAU, r1=1.64, r2=i%4===0?1.73:1.68;
    orbitGroup.add(line([v3(Math.cos(a)*r1,Math.sin(a)*r1,0),v3(Math.cos(a)*r2,Math.sin(a)*r2,0)],GOLD,.43));
  }
  const craft = new THREE.Group(); orbitGroup.add(craft);
  craft.add(new THREE.Mesh(new THREE.SphereGeometry(.032,12,8),new THREE.MeshBasicMaterial({color:LIME})));
  for(let i=0;i<4;i++){const a=i*Math.PI/2; craft.add(line([v3(Math.cos(a)*.065,Math.sin(a)*.065,0),v3(Math.cos(a)*.12,Math.sin(a)*.12,0)],LIME,.85));}
  const tailPoints = new Float32Array(90*3);
  const tailGeometry = new THREE.BufferGeometry();tailGeometry.setAttribute('position',new THREE.BufferAttribute(tailPoints,3));
  const craftTail = new THREE.Line(tailGeometry,new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.9,depthWrite:false})); orbitGroup.add(craftTail);

  const transferCurve = new THREE.CubicBezierCurve3(v3(-3.4,.65,.4),v3(2,7,-1),v3(16,7,-4),v3(20.2,2.8,-3));
  const transfer = line(transferCurve.getPoints(400),GOLD,.32);scene.add(transfer);
  const transferDot = new THREE.Mesh(new THREE.SphereGeometry(.052,14,10),new THREE.MeshBasicMaterial({color:LIME})); scene.add(transferDot);
  const earthAnchor = earthCenter.clone().add(v3(3.25,1.4,.9));
  const radioCurve = new THREE.QuadraticBezierCurve3(earthAnchor,v3(8,1.2,.4),moonCenter.clone().add(v3(-.83,.32,.48)));
  const radioBase = line(radioCurve.getPoints(360),BLUE,.58);scene.add(radioBase);
  const radioPulse = line(radioCurve.getPoints(360),LIME,.96);scene.add(radioPulse);
  const signalHead = new THREE.Mesh(new THREE.SphereGeometry(.065,16,10),new THREE.MeshBasicMaterial({color:LIME}));scene.add(signalHead);
  const waveFronts=[];
  for(let i=0;i<3;i++) {
    const w=ring(1.1,new THREE.LineBasicMaterial({color:LIME,transparent:true,opacity:.2,depthWrite:false}),80);
    w.rotation.y=Math.PI/2;waveFronts.push(w);scene.add(w);
  }

  // Sparse fixed reference stars; the camera supplies motion, not particles.
  const stars=[];
  for(let i=0;i<145;i++) {
    const az=random(i+7000)*TAU, el=(random(i+8100)-.5)*2.0;
    const rad=130+random(i+9200)*80;
    stars.push(Math.cos(az)*Math.cos(el)*rad,Math.sin(el)*rad,Math.sin(az)*Math.cos(el)*rad);
  }
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:BONE,size:.075,sizeAttenuation:true,transparent:true,opacity:.33,depthWrite:false})));

  const look=v3();
  const shots=[
    {a:0,b:3,p:[-4.9,1.4,7.1],q:[-2.8,2.5,8.1],look:[-5.4,.65,0],end:[-3,.9,-.2],fov:42},
    {a:3,b:6,p:[2.2,3.7,17],q:[16,2.7,9],look:[7.3,1,-1],end:[20.3,1.5,-3],fov:42},
    {a:6,b:9,p:[22.25,2.1,-.15],q:[20.5,2.6,-.8],look:[21.2,1.5,-3],end:[21,1.5,-3],fov:42},
    {a:9,b:11.5,p:[7.1,8.2,30],q:[7.8,6,26],look:[6.7,.7,-1.1],end:[8,.9,-1.3],fov:46},
    {a:11.5,b:14,p:[16.6,5.1,9.8],q:[21.1,2.4,-.2],look:[21,1.5,-3],end:[21,1.5,-3],fov:42}
  ];
  function update(time) {
    const t=Math.max(0,Math.min(14,time));
    const shot=shots.find(s=>t<s.b)||shots[shots.length-1];
    const f=ease((t-shot.a)/(shot.b-shot.a));
    camera.position.set(...shot.p).lerp(v3(...shot.q),f);
    look.set(...shot.look).lerp(v3(...shot.end),f);camera.lookAt(look);
    camera.fov=shot.fov;camera.updateProjectionMatrix();
    globe.rotation.y=-.45+t*.012;
    earthSurvey.rotation.y=t*.006;
    surveyMat.opacity=.28*(1-ease((t-1.8)/1.1))+.04;
    lunarGridMat.opacity=.04+.12*ease((t-5.7)/1.2);
    const angle=2.7-t*.38;
    craft.position.set(Math.cos(angle)*1.6,Math.sin(angle)*1.6,0);
    for(let i=0;i<90;i++){const a=angle+.48*(1-i/89);tailPoints[i*3]=Math.cos(a)*1.6;tailPoints[i*3+1]=Math.sin(a)*1.6;tailPoints[i*3+2]=0;}
    tailGeometry.attributes.position.needsUpdate=true;tailGeometry.computeBoundingSphere();
    orbitMat.opacity=.13+.5*ease((t-4.5)/2);
    craft.scale.setScalar(t<9?1: .75+ease((t-11.5)/2)*.25);
    const travel=ease((t-1.8)/4.5);transferDot.position.copy(transferCurve.getPoint(travel));
    transfer.visible=t<6.1;transferDot.visible=t>1.8&&t<6.1;
    transfer.geometry.setDrawRange(0,Math.max(1,Math.floor(travel*401)));
    const signal=clamp((t-9)/2.2);
    radioBase.visible=t>=9&&t<12;radioPulse.visible=t>=9&&t<11.9;signalHead.visible=radioPulse.visible;
    const head=Math.floor(signal*360),tail=Math.max(0,head-36);
    radioPulse.geometry.setDrawRange(tail,Math.max(0,head-tail));
    signalHead.position.copy(radioCurve.getPoint(signal));
    for(let i=0;i<waveFronts.length;i++) {
      const p=clamp((t-9-i*.23)/2.2),w=waveFronts[i];
      w.visible=t>=9+i*.23&&t<11.9&&p<1;
      w.position.copy(radioCurve.getPoint(p));w.scale.setScalar(.5+p*1.4);
      w.material.opacity=.3*(1-p);
    }
    return {phase:t<3?'earth':t<6?'distance':t<9?'lunar-approach':t<11.5?'radio-link':'lunar-orbit'};
  }
  function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
  function dispose(){
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const x of Object.values(m))if(x?.isTexture)textures.add(x);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }
  update(0);
  return {scene,camera,update,resize,dispose};
}
