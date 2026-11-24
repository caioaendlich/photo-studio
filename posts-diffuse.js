// Desfoque localizado editorial, independente do Painel de análise.
export function makeDiffuse(w,h){return {tipo:'forma',forma:'desfoqueDifuso',nome:'Desfoque difuso',x:w*.76,y:h*.45,w:w*.7,h:h*.8,rot:-20,opac:1,atras:[],desfoque:65,suavidade:.78,irregularidade:.14};}
const surface=(w,h)=>{const el=document.createElement('canvas');el.width=w;el.height=h;return el;};
export function drawDiffuse(c,base,L){
  const out=surface(base.width,base.height),b=out.getContext('2d');
  b.filter=`blur(${Math.max(0,Math.min(140,L.desfoque||0))}px)`;b.drawImage(base,0,0);b.filter='none';
  const mask=surface(base.width,base.height),m=mask.getContext('2d');
  m.translate(L.x,L.y);m.rotate((L.rot||0)*Math.PI/180);m.scale(Math.max(1,L.w)/2,Math.max(1,L.h)/2);
  const soft=Math.max(.05,Math.min(1,L.suavidade??.78)),rough=Math.max(0,Math.min(.4,L.irregularidade??.14));
  // Gradiente contínuo em lóbulos sobrepostos, sem limite geométrico visível.
  const lobes=rough?[[0,0,1],[-rough,.18,1-rough*.5],[rough,-.22,1-rough*.3]]:[[0,0,1]];
  for(const [x,y,r] of lobes){const g=m.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(Math.max(.01,1-soft),'rgba(255,255,255,.94)');g.addColorStop(1,'rgba(255,255,255,0)');m.fillStyle=g;m.fillRect(-1.5,-1.5,3,3);}
  b.globalCompositeOperation='destination-in';b.drawImage(mask,0,0);
  c.save();c.globalAlpha=L.opac??1;c.drawImage(out,0,0);c.restore();
  L._box={x:L.x,y:L.y,w:L.w,h:L.h,rot:L.rot||0};
}
