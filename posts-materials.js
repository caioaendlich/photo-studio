// Núcleos de materiais em pixels, determinísticos e independentes do navegador.
// Aproximação editorial de relevo/refração, não simulação óptica clínica.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const hash=(x,y,seed=7)=>{let n=Math.imul(x^seed,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
export function noise(x,y,seed=7){const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);return (hash(ix,iy,seed)*(1-u)+hash(ix+1,iy,seed)*u)*(1-v)+(hash(ix,iy+1,seed)*(1-u)+hash(ix+1,iy+1,seed)*u)*v;}
export function sample(src,x,y,ch){
  x=clamp(x,0,src.width-1);y=clamp(y,0,src.height-1);
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,src.width-1),y1=Math.min(y0+1,src.height-1),u=x-x0,v=y-y0,d=src.data,w=src.width;
  return (d[(y0*w+x0)*4+ch]*(1-u)+d[(y0*w+x1)*4+ch]*u)*(1-v)+(d[(y1*w+x0)*4+ch]*(1-u)+d[(y1*w+x1)*4+ch]*u)*v;
}
export function liquidProfile(r,angle,serum=false){
  if(r>=1)return 0;
  const edge=Math.max(0,1-r*r);
  // Água: cúpula; sérum: centro achatado e menisco espesso junto da borda.
  return serum ? Math.pow(edge,.30)*(.22+.20*Math.exp(-(((r-.83)/.14)**2)))*(.94+.06*Math.sin(angle*3+r*4)) : Math.pow(edge,.62);
}
export function liquidPixels(src,F,radii){
  const rx=Math.max(1,F.w/2),ry=Math.max(1,F.h/2),a=(F.rot||0)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),R=Math.min(rx,ry),serum=F.forma==='serum';
  const radiusMax=Math.max(...radii),ex=(Math.abs(rx*ca)+Math.abs(ry*sa))*radiusMax+2,ey=(Math.abs(rx*sa)+Math.abs(ry*ca))*radiusMax+2;
  const left=clamp(Math.floor(F.x-ex),0,src.width),top=clamp(Math.floor(F.y-ey),0,src.height),w=Math.max(0,Math.min(src.width,Math.ceil(F.x+ex))-left),h=Math.max(0,Math.min(src.height,Math.ceil(F.y+ey))-top);
  const heights=new Float32Array((w+2)*(h+2)),coverage=new Float32Array(w*h),stride=w+2;
  const thickness=clamp(F.volumeLiquido??1,.2,2),la=(F.luzAngulo??-135)*Math.PI/180,lx=Math.cos(la),ly=Math.sin(la);
  for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){
    const dx=left+x+.5-F.x,dy=top+y+.5-F.y,u=(dx*ca+dy*sa)/rx,v=(-dx*sa+dy*ca)/ry,theta=Math.atan2(v,u),q=(theta/(2*Math.PI)+1)%1*radii.length,i=Math.floor(q),boundary=radii[i]*(1-q+i)+radii[(i+1)%radii.length]*(q-i),r=Math.hypot(u,v)/boundary;
    heights[(y+1)*stride+x+1]=liquidProfile(r,theta,serum)*R*.42*thickness;
    if(x>=0&&y>=0&&x<w&&y<h)coverage[y*w+x]=clamp((1-r)*R,0,1);
  }
  const data=new Uint8ClampedArray(w*h*4),ref=clamp((F.refracao??(serum?1.04:1.3))-1,-.3,1.2),gloss=clamp(F.brilho??.7,0,1),edgeDark=clamp(F.borda??.5,0,1),caustic=clamp(F.caustica??.5,0,1);
  const hx=lx*.38,hy=ly*.38,hz=.925;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const n=y*w+x,alpha=coverage[n];if(!alpha)continue;const i=(y+1)*stride+x+1;
    const gx=(heights[i+1]-heights[i-1])*.5,gy=(heights[i+stride]-heights[i-stride])*.5;
    const inv=1/Math.hypot(gx,gy,1),nx=-gx*inv,ny=-gy*inv,nz=inv;
    // Curvatura local altera a amostra da própria foto, em vez de ampliar tudo por igual.
    const sx=left+x+clamp(gx*R*ref*.45,-R*.3,R*.3),sy=top+y+clamp(gy*R*ref*.45,-R*.3,R*.3);
    const spec=Math.pow(Math.max(0,nx*hx+ny*hy+nz*hz),serum?34:65)*gloss;
    const fresnel=(1-nz)**3,lit=nx*lx+ny*ly;
    const shade=1-edgeDark*fresnel*.32+caustic*Math.max(0,-lit)*fresnel*.12;
    for(let ch=0;ch<3;ch++){const color=sample(src,sx,sy,ch)*shade;data[n*4+ch]=color+(255-color)*Math.min(.75,spec*.70+fresnel*gloss*.10);}
    data[n*4+3]=sample(src,sx,sy,3)*alpha;
  }
  return {data,width:w,height:h,left,top};
}
export function glassHeight(x,y,size,type='martelado',seed=17){
  const s=Math.max(3,size),u=x/s,v=y/s;
  if(type==='canelado')return .5+.43*Math.cos(u*Math.PI*2)+.025*(noise(u*.7,v*.3,seed)-.5);
  if(type==='fosco')return .5+(noise(u*3.1,v*3.1,seed)-.5)*.35+(noise(u*7,v*7,seed+3)-.5)*.1;
  // Martelado: células arredondadas, sem uma grade visível de quadrados de ruído.
  let nearest=Infinity;
  const ix=Math.floor(u),iy=Math.floor(v);
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=ix+i+.2+.6*hash(ix+i,iy+j,seed),cy=iy+j+.2+.6*hash(ix+i,iy+j,seed+1);nearest=Math.min(nearest,(u-cx)**2+(v-cy)**2);}
  return .5+.36*Math.cos(Math.min(1,Math.sqrt(nearest))*Math.PI)+.06*(noise(u*2,v*2,seed+2)-.5);
}
const GLASS_HEIGHTS=new Map();
export function glassPixels(src,F){
  const {width:w,height:h}=src,size=clamp(F.tamanho??6,3,60),type=F.tipoVidro||'martelado',key=[w,h,size,type].join('|');
  let map=GLASS_HEIGHTS.get(key);if(!map){map=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)map[y*w+x]=glassHeight(x,y,size,type);if(GLASS_HEIGHTS.size>=3)GLASS_HEIGHTS.delete(GLASS_HEIGHTS.keys().next().value);GLASS_HEIGHTS.set(key,map);}
  const out=new Uint8ClampedArray(w*h*4),strength=clamp(F.forca??9,0,60),relief=clamp(F.relevo??.55,0,1),angle=(F.luzAngulo??-135)*Math.PI/180,lx=Math.cos(angle),ly=Math.sin(angle);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,gx=(map[y*w+Math.min(w-1,x+1)]-map[y*w+Math.max(0,x-1)])*size*.5,gy=(map[Math.min(h-1,y+1)*w+x]-map[Math.max(0,y-1)*w+x])*size*.5;
    const sx=x+gx*strength,sy=y+gy*strength,inv=1/Math.hypot(gx,gy,1),normal=(-gx*lx-gy*ly)*inv;
    const spec=Math.pow(Math.max(0,normal*.42+inv*.90),type==='fosco'?10:36),shine=relief*spec*(type==='fosco'?.035:.16),shade=1+relief*normal*.035;
    for(let ch=0;ch<3;ch++){const value=sample(src,sx,sy,ch)*shade;out[i*4+ch]=value+(255-value)*shine;}
    out[i*4+3]=sample(src,sx,sy,3);
  }
  return {width:w,height:h,data:out};
}
export function paperRelief(x,y,seed=7){return noise(x/28,y/28,seed)*.4+noise(x/6,y/6,seed+1)*.35+noise(x/1.8,y/1.8,seed+2)*.25;}
