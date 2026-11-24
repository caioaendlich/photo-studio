// Foco contínuo, ampliação e iluminação. Núcleos numéricos testáveis sem navegador.
import {sample} from './posts-materials.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
export const BLUR_STOPS=[0,.18,.45,1];
export function boundaryAmount(x,y,F){
 const a=(F.rot||0)*Math.PI/180,dx=x-F.x,dy=y-F.y,lx=dx*Math.cos(a)+dy*Math.sin(a),ly=-dx*Math.sin(a)+dy*Math.cos(a),h=Math.max(1,F.h||1000);
 const curve=clamp(F.curvaFoco||0,-1,1)*h*4*(ly/h)**2,dist=(lx-curve)*(F.lado==='esquerda'?-1:1),soft=Math.max(0,F.suavidade||0);
 const t=soft?smooth((dist+soft)/(2*soft)):(dist>=0?1:0);
 return t**clamp(F.progressaoFoco??1,.25,4);
}
export function blendFocus(levels,amount){
 const first=levels[0],out=new Uint8ClampedArray(first.data.length);
 for(let i=0,n=0;i<out.length;i+=4,n++){
   const t=clamp(amount[n],0,1);let j=0;while(j<BLUR_STOPS.length-2&&t>BLUR_STOPS[j+1])j++;
   const k=(t-BLUR_STOPS[j])/(BLUR_STOPS[j+1]-BLUR_STOPS[j]),a=levels[j].data,b=levels[j+1].data;
   for(let ch=0;ch<4;ch++)out[i+ch]=a[i+ch]*(1-k)+b[i+ch]*k;
 }
 return {width:first.width,height:first.height,data:out};
}
export function lensPixels(src,F){
 const r=Math.max(12,Math.min(F.w,F.h)/2),left=clamp(Math.floor(F.x-r-1),0,src.width),top=clamp(Math.floor(F.y-r-1),0,src.height),w=Math.max(0,Math.min(src.width,Math.ceil(F.x+r+1))-left),h=Math.max(0,Math.min(src.height,Math.ceil(F.y+r+1))-top),data=new Uint8ClampedArray(w*h*4);
 const zoom=clamp(F.zoom||1,1,6),ox=F.seguir?F.x:Number.isFinite(+F.origemX)?+F.origemX:F.x,oy=F.seguir?F.y:Number.isFinite(+F.origemY)?+F.origemY:F.y,physical=(F.modoLupa||'fisica')==='fisica',curve=physical?clamp(F.curvaturaLente??.25,0,1):0,reflection=physical?clamp(F.reflexoLente??.3,0,1):0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const dx=left+x-F.x,dy=top+y-F.y,n=Math.hypot(dx,dy)/r;if(n>=1)continue;
   const k=(1-curve*n*n*.25)/zoom,sx=ox+dx*k,sy=oy+dy*k,edge=n**8,glint=Math.exp(-((dx/r+.42)**2+(dy/r+.50)**2)/.025)*reflection*.4,shade=physical?1-edge*.12:1,i=(y*w+x)*4;
   for(let ch=0;ch<3;ch++){const v=sample(src,sx,sy,ch)*shade;data[i+ch]=v+(255-v)*glint;}
   data[i+3]=sample(src,sx,sy,3)*clamp((1-n)*r,0,1);
 }
 return {width:w,height:h,left,top,data};
}
export function shadeLight(src,mask,F){
 const out=new Uint8ClampedArray(src.data.length),density=clamp(F.intensidade??.55,0,.9),warm=clamp(F.calor??0,0,1),cool=clamp(F.friezaSombra??.15,0,1),light=clamp(F.exposicaoLuz??.08,0,1);
 for(let i=0;i<out.length;i+=4){const lit=mask.data[i+3]/255,shadow=(1-lit)*density;
   for(let ch=0;ch<3;ch++){const tint=[-.035,-.015,.025][ch]*cool*shadow+[.035,.008,-.035][ch]*warm*lit,v=src.data[i+ch]*(1-shadow*.72+tint);out[i+ch]=v+(255-v)*light*.35*lit;}
   out[i+3]=src.data[i+3];
 }
 return {width:src.width,height:src.height,data:out};
}
