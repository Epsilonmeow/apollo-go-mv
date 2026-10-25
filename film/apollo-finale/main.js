import {createDecisionSpace} from '../apollo-second-go/decision-space.js';
import {createDecisionGraphics,decisionAt} from '../apollo-second-go/decision-graphics.js';
import {createLandingSpace} from '../apollo-landing/landing-space.js';
import {createLandingGraphics} from '../apollo-landing/landing-graphics.js';
import {landingAt} from '../apollo-landing/timing.js';
import {createControlSpace} from '../apollo-stay/control-space.js';
import {createStayGraphics} from '../apollo-stay/stay-graphics.js';
import {stayAt} from '../apollo-stay/timing.js';
import {createFinaleSpace} from './finale-space.js';
import {createFinaleGraphics} from './finale-graphics.js';
import {finaleAt} from './timing.js';
import {createDescent} from '../apollo-descent/descent.js';
import {createDescentGraphics} from '../apollo-descent/descent-graphics.js';
import * as THREE from '../vendor/three.module.js';
import {createControlGraphics} from '../apollo-go/control-graphics.js';
import {createMissionGraphics} from '../apollo-go/mission-graphics.js';
import {createDistance} from '../apollo-go/distance.js';
import {createLunar} from '../apollo-go/lunar.js';
import {DURATION,clamp,pulseAt,goPulse,CUES,CLOSE,PREP_END,prepProgress} from './timing.js';
import {createPreparation} from '../apollo-first-go/preparation.js';
import {createPollGraphics} from '../apollo-first-go/poll-graphics.js';
import {createExtensionGraphics} from '../apollo-first-go/extension-graphics.js';
const canvas=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const control=createControlGraphics(),mission=createMissionGraphics();
function texture(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=t.magFilter=THREE.LinearFilter;return t;}
const controlTexture=texture(control.canvas),missionTexture=texture(mission.canvas);
const poll=createPollGraphics(),extension=createExtensionGraphics(),pollTexture=texture(poll.canvas),extensionTexture=texture(extension.canvas);
const descentGraphics=createDescentGraphics(),descentTexture=texture(descentGraphics.canvas);
const decisionGraphics=createDecisionGraphics(),decisionTexture=texture(decisionGraphics.canvas);
const landingGraphics=createLandingGraphics(),landingTexture=texture(landingGraphics.canvas);
const stayGraphics=createStayGraphics(),stayTexture=texture(stayGraphics.canvas);
const finaleGraphics=createFinaleGraphics(),finaleTexture=texture(finaleGraphics.canvas);
const target=new THREE.WebGLRenderTarget(1920,1080,{depthBuffer:true,stencilBuffer:false,samples:4});target.texture.colorSpace=THREE.SRGBColorSpace;
const uniforms={plate:{value:controlTexture},space:{value:target.texture},time:{value:0},world:{value:0},hit:{value:0},resolution:{value:new THREE.Vector2(1920,1080)}};
const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D plate,space;uniform float time,world,hit;uniform vec2 resolution;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 mid=vUv-.5;vec2 uv=.5+mid/(1.+hit*.004);vec4 a=texture2D(plate,uv);vec3 b=texture2D(space,uv).rgb;
vec3 col=world>.5?mix(b,a.rgb,a.a):a.rgb;col+=(hash(floor(vUv*resolution)+floor(time*24.)*vec2(7.,13.))-.5)*.003;col*=1.-.08*dot(mid,mid);gl_FragColor=vec4(col,1.);
#include <colorspace_fragment>
}`});
const screen=new THREE.Scene(),camera=new THREE.Camera();screen.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
let lunar,distance,preparation,descent,decision,landing,controlSpace,finaleSpace,lastTime=0,lastScene='signal',lastMs=0,width=1920,height=1080,playing=false;
function render(raw){const begin=performance.now(),t=clamp(Number(raw)||0,0,DURATION),pulse=pulseAt(t);lastTime=t;let world,newHit=0;
 if(t<16.922){control.render(t/16.922*16.4,{pulse,showGo:false});controlTexture.needsUpdate=true;uniforms.plate.value=controlTexture;lastScene='systems-forming';}
 else if(t<46){mission.render(t,{pulse});missionTexture.needsUpdate=true;uniforms.plate.value=missionTexture;
  if(t<31.8476){world=distance;world.update((t-16.922)/(31.8476-16.922)*14);lastScene='earth-moon-distance';}
  else if(t<40.4082){lastScene='mission-judgment-chain';}
  else{world=lunar;world.update(18+(t-40.4082)/(46-40.4082)*3.65);lastScene='lunar-orbit-standby';}
 }
 if(t>=46&&t<88){
  const firstCall=CUES[0]?.call??72;
  if(t<PREP_END){const u=prepProgress(t);world=preparation;const detail=world.update(u);extension.render(t,{u,pulse,...detail});lastScene='preparation';}
  else if(t<firstCall){extension.render(t,{listen:true,pollStart:firstCall,pulse});lastScene='poll-invitation';}
  else if(t<CLOSE.go){poll.render(t,{cues:CUES,endpoint:CLOSE.go,pulse:goPulse(t)});pollTexture.needsUpdate=true;uniforms.plate.value=pollTexture;lastScene='poll-judgments';}
  else{world=preparation;const q=clamp((t-CLOSE.go)/(88-CLOSE.go));world.update(1,{commit:q});extension.render(t,{collective:true,pulse:goPulse(t)});lastScene='shared-descent-action';}
  if(lastScene!=='poll-judgments'){extensionTexture.needsUpdate=true;uniforms.plate.value=extensionTexture;}
 }
 if(t>=88&&t<111.8){world=descent;const detail=world.update(t,{pulse});descentGraphics.render(t,{pulse,...detail});descentTexture.needsUpdate=true;uniforms.plate.value=descentTexture;lastScene='powered-descent/'+(detail?.stage??'flight');}
 if(t>=111.8&&t<144){const state=decisionAt(t);newHit=state.hit;world=state.world?decision:undefined;const detail=decision.update(t,state);decisionGraphics.render(t,{...detail,...state});decisionTexture.needsUpdate=true;uniforms.plate.value=decisionTexture;lastScene='second-poll/'+state.name;}
 if(t>=144&&t<184){const state=landingAt(t);newHit=state.hit;world=state.world?landing:undefined;const detail=landing.update(t,{...state,progress:state.cameraProgress});landingGraphics.render(t,{...detail,...state});landingTexture.needsUpdate=true;uniforms.plate.value=landingTexture;lastScene='landing/'+state.name;}
 if(t>=184&&t<214.8){const state=stayAt(t);newHit=state.hit;let detail={};
  if(state.world==='moon'){world=landing;detail=landing.update(184,{mode:'landed',progress:state.cameraProgress??1,view:state.view,flightProgress:1,contactProgress:1,landedProgress:1,engineOff:1,guides:false});}
  else if(state.world==='control'){world=controlSpace;detail=controlSpace.update(t,state);}
  stayGraphics.render(t,{...detail,...state});stayTexture.needsUpdate=true;uniforms.plate.value=stayTexture;lastScene='stay/'+state.name;
 }
 if(t>=214.8){const state=finaleAt(t);newHit=state.hit;let detail={};
  if(state.world){world=finaleSpace;detail=finaleSpace.update(t,state);}
  finaleGraphics.render(t,{...detail,...state});finaleTexture.needsUpdate=true;uniforms.plate.value=finaleTexture;lastScene='finale/'+state.name;
 }
 if(world){renderer.setRenderTarget(target);renderer.clear();renderer.render(world.scene,world.camera);}
 uniforms.world.value=world?1:0;uniforms.time.value=t;uniforms.hit.value=t<46?pulse:Math.max(pulse*.5,goPulse(t)*4,newHit*4);
 renderer.setRenderTarget(null);renderer.render(screen,camera);lastMs=performance.now()-begin;
}
function setSize(w,h){width=Math.max(2,Math.floor(w));height=Math.max(2,Math.floor(h));renderer.setSize(width,height,false);target.setSize(width,height);for(const s of [lunar,distance,preparation,descent,decision,landing,controlSpace,finaleSpace])s?.resize(width,height);uniforms.resolution.value.set(width,height);if(lunar&&distance&&preparation)render(lastTime);}
window.demo={ready:false,duration:DURATION,render,setSize,stats:()=>({time:lastTime,width,height,drawMs:lastMs,scene:lastScene,calls:renderer.info.render.calls}),get playing(){return playing},set playing(v){playing=!!v}};
try{const font=new FontFace('Archivo','url(../assets/Archivo.ttf)',{weight:'100 900'});document.fonts.add(await font.load());await document.fonts.ready;lunar=createLunar();distance=createDistance();preparation=createPreparation();descent=createDescent();decision=createDecisionSpace();landing=createLandingSpace();controlSpace=createControlSpace();finaleSpace=createFinaleSpace();setSize(1920,1080);for(const t of [17.2,22,26,30,34,38,42,44,49,55,63,68,73,79,85,87.5,88.2,91,95,99,103,107,110,112,116,120,125,130,135,140,143.8,144.1,149,153,157,163,169,172,181,184.1,189,191,194,198,203,205,208,211,214.6,215,219,223,227,231,235,239,243,248,252.7,0])render(t);window.demo.ready=true;window.dispatchEvent(new Event('demoready'));}
catch(error){console.error(error);window.dispatchEvent(new CustomEvent('demoerror',{detail:error.message}));}
