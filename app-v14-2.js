const sim3d={canvas:null,ctx:null,w:0,h:0,dpr:1,raf:0,key:null,mode:'idle',start:0,pallet:{x:3.0,y:.39,z:2.35,h:1.05},shake:0,impact:0};

function v3(x,y,z){return{x,y,z}}
function sub3(a,b){return v3(a.x-b.x,a.y-b.y,a.z-b.z)}
function dot3(a,b){return a.x*b.x+a.y*b.y+a.z*b.z}
function cross3(a,b){return v3(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x)}
function len3(a){return Math.hypot(a.x,a.y,a.z)||1}
function norm3(a){const l=len3(a);return v3(a.x/l,a.y/l,a.z/l)}
function mix(a,b,t){return a+(b-a)*t}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}

function cameraBasis(){
  const pos=v3(5.4,3.9,7.2), target=v3(0,1.15,-.35), up=v3(0,1,0);
  const f=norm3(sub3(target,pos)), r=norm3(cross3(f,up)), u=cross3(r,f);
  return{pos,f,r,u}
}
function project(p){
  const c=cameraBasis(), q=sub3(p,c.pos), cx=dot3(q,c.r), cy=dot3(q,c.u), cz=dot3(q,c.f);
  const fov=sim3d.h*.94, z=Math.max(.35,cz);
  return{x:sim3d.w/2+cx*fov/z,y:sim3d.h*.54-cy*fov/z,z:cz}
}
function shade(hex,f){
  const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  return`rgb(${Math.max(0,Math.min(255,r*f))|0},${Math.max(0,Math.min(255,g*f))|0},${Math.max(0,Math.min(255,b*f))|0})`
}
function cuboid(x,y,z,w,h,d,color,faces){
  const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
  const V=[v3(x0,y0,z0),v3(x1,y0,z0),v3(x1,y1,z0),v3(x0,y1,z0),v3(x0,y0,z1),v3(x1,y0,z1),v3(x1,y1,z1),v3(x0,y1,z1)];
  const ids=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]], fs=[.78,.96,.62,.72,1.08,.56];
  ids.forEach((idx,i)=>{const pts=idx.map(k=>project(V[k]));const zavg=pts.reduce((a,p)=>a+p.z,0)/4;faces.push({pts,z:zavg,color:shade(color,fs[i]),stroke:shade(color,.48)})})
}
function drawFloor(ctx){
  ctx.save();ctx.fillStyle='#9bb4c4';ctx.fillRect(0,0,sim3d.w,sim3d.h);
  const lines=[];for(let x=-5;x<=5;x+=1){lines.push([v3(x,0,-4),v3(x,0,5)])}for(let z=-4;z<=5;z+=1){lines.push([v3(-5,0,z),v3(5,0,z)])}
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;lines.forEach(([a,b])=>{const A=project(a),B=project(b);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke()});
  ctx.restore()
}
function beamBetween(a,b,thick,color,faces){
  const axis=norm3(sub3(b,a));
  let u=v3(1,0,0);
  if(Math.abs(dot3(axis,u))>.95)u=v3(0,0,1);
  u=norm3(sub3(u,v3(axis.x*dot3(axis,u),axis.y*dot3(axis,u),axis.z*dot3(axis,u))));
  const v=norm3(cross3(axis,u));
  const hu=thick/2,hv=thick/2;
  const corner=(p,su,sv)=>v3(p.x+u.x*hu*su+v.x*hv*sv,p.y+u.y*hu*su+v.y*hv*sv,p.z+u.z*hu*su+v.z*hv*sv);
  const V=[corner(a,-1,-1),corner(a,1,-1),corner(a,1,1),corner(a,-1,1),corner(b,-1,-1),corner(b,1,-1),corner(b,1,1),corner(b,-1,1)];
  const ids=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]],fs=[.78,.96,.62,.72,1.08,.56];
  ids.forEach((idx,i)=>{const pts=idx.map(k=>project(V[k]));const zavg=pts.reduce((sum,p)=>sum+p.z,0)/4;faces.push({pts,z:zavg,color:shade(color,fs[i]),stroke:shade(color,.48)})});
}
function addRack(f){
  const blue='#155487',orange='#ef651b',shelf='#8e9eaa';
  const left=-1.82,right=1.82,front=1.02,back=-1.02;
  const postH=3.22,post=.18,beam=.18;
  const levels=[.25,1.58,3.00];
  [left,right].forEach(x=>[front,back].forEach(z=>cuboid(x,0,z,post,postH,post,blue,f)));
  levels.forEach(y=>{
    cuboid(0,y,front,right-left+post,beam,.20,orange,f);
    cuboid(0,y,back,right-left+post,beam,.20,orange,f);
  });
  [left,right].forEach(x=>levels.forEach(y=>cuboid(x,y,(front+back)/2,.16,.16,front-back+post,blue,f)));
  cuboid(0,.36,0,3.45,.07,1.82,shelf,f);
  cuboid(0,1.69,0,3.45,.07,1.82,shelf,f);
  [left,right].forEach(x=>{
    beamBetween(v3(x,.42,front-.04),v3(x,1.46,back+.04),.13,blue,f);
    beamBetween(v3(x,1.70,back+.04),v3(x,2.86,front-.04),.13,blue,f);
  });
  [left,right].forEach(x=>[front,back].forEach(z=>cuboid(x-.01,0,z,.34,.06,.34,blue,f)));
}
function addPallet(f,p){
  const wood='#9a6336',wood2='#bb7e46',box='#c88b50';
  cuboid(p.x,p.y,p.z,2.7,.16,1.75,wood2,f);
  [-.95,0,.95].forEach(dx=>[-.55,.55].forEach(dz=>cuboid(p.x+dx,p.y-.18,p.z+dz,.36,.22,.34,wood,f)));
  cuboid(p.x,p.y+.16,p.z,2.48,p.h,1.58,box,f);
  const seam='#a86c39';
  [-.62,0,.62].forEach(dx=>cuboid(p.x+dx,p.y+.18,p.z+0.80,.035,p.h-.04,.025,seam,f));
  const rows=Math.max(1,Math.round(p.h/.48));for(let i=1;i<rows;i++){const yy=p.y+.16+p.h*(i/rows);cuboid(p.x,yy,p.z+0.80,2.46,.025,.025,seam,f)}
}
function render3d(){
  const c=sim3d.canvas;if(!c)return;const ctx=sim3d.ctx;const rect=c.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);
  if(Math.abs(sim3d.w-rect.width*dpr)>2||Math.abs(sim3d.h-rect.height*dpr)>2){sim3d.dpr=dpr;sim3d.w=Math.max(2,rect.width*dpr);sim3d.h=Math.max(2,rect.height*dpr);c.width=sim3d.w;c.height=sim3d.h;ctx.setTransform(1,0,0,1,0,0);ctx.scale(dpr,dpr);sim3d.w=rect.width;sim3d.h=rect.height}
  ctx.clearRect(0,0,sim3d.w,sim3d.h);drawFloor(ctx);
  const faces=[];addRack(faces);if(sim3d.key)addPallet(faces,sim3d.pallet);faces.sort((a,b)=>b.z-a.z);
  faces.forEach(F=>{ctx.beginPath();F.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=F.color;ctx.fill();ctx.strokeStyle=F.stroke;ctx.lineWidth=1.2;ctx.stroke()});
  if(sim3d.impact>0){
    const P=project(v3(0,1.62,1.12));
    const r=18+sim3d.impact*10;
    ctx.save();ctx.globalAlpha=.45+.55*sim3d.impact;ctx.strokeStyle='#ff3b30';ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(P.x-r,P.y-r);ctx.lineTo(P.x+r,P.y+r);ctx.moveTo(P.x+r,P.y-r);ctx.lineTo(P.x-r,P.y+r);ctx.stroke();
    ctx.font='900 16px system-ui';ctx.fillStyle='#ff3b30';ctx.textAlign='center';ctx.fillText('BLOCKED',P.x,P.y-r-10);ctx.restore();
  }
  sim3d.raf=requestAnimationFrame(render3d)
}
function init3d(){
  if(sim3d.canvas)return;sim3d.canvas=$('rackCanvas');if(!sim3d.canvas)return;sim3d.ctx=sim3d.canvas.getContext('2d');render3d();
}
function resetFitTest(){
  init3d();const fit=$('fitTest');if(fit)fit.classList.remove('fit-success','fit-fail','testing');$('fitResult').textContent='';
  sim3d.key=null;sim3d.mode='idle';sim3d.impact=0;sim3d.pallet={x:3.0,y:.56,z:2.35,h:.75};
}
