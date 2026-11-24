// Óptica editorial e perspectiva por amostragem da fotografia original.
import {sample} from './posts-materials.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const angle=d=>(d||0)*Math.PI/180;
function bounds(points,w,h,pad=1){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const left=clamp(Math.floor(Math.min(...xs)-pad),0,w),top=clamp(Math.floor(Math.min(...ys)-pad),0,h);return {left,top,width:Math.max(0,Math.min(w,Math.ceil(Math.max(...xs)+pad))-left),height:Math.max(0,Math.min(h,Math.ceil(Math.max(...ys)+pad))-top)};}
function world(F,x,y){const a=angle(F.rot),c=Math.cos(a),s=Math.sin(a);return [F.x+x*c-y*s,F.y+x*s+y*c];}
function roundedDistance(x,y,w,h,r){const qx=Math.abs(x)-w/2+r,qy=Math.abs(y)-h/2+r;return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;}
export function opticsPixels(src,F,kind){
 const w=Math.max(1,F.w),h=Math.max(1,F.h),box=bounds([world(F,-w/2,-h/2),world(F,w/2,-h/2),world(F,w/2,h/2),world(F,-w/2,h/2)],src.width,src.height);
 const data=new Uint8ClampedArray(box.width*box.height*4),a=angle(F.rot),c=Math.cos(a),s=Math.sin(a),rx=w/2,ry=h/2;
 const freq=clamp(F.frequencia??2.5,.1,8),phase=angle(F.faseOndas),amp=clamp(F.amplitude??10,0,50),soft=Math.max(1,F.suavidade??18);
 const delta=clamp(F.deslocamento??8,-40,40),thick=clamp(F.espessuraOptica??4,0,30),shine=clamp(F.reflexoOptico??.14,0,1),radius=clamp(F.raio??1,0,Math.min(rx,ry));
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
   const X=x+box.left,Y=y+box.top,dx=X-F.x,dy=Y-F.y,lx=dx*c+dy*s,ly=-dx*s+dy*c;
   let ux=0,uy=0,alpha=0,light=0;
   if(kind==='water'){
     const u=lx/rx,v=ly/ry,r=Math.hypot(u,v),inside=(1-r)*Math.min(rx,ry);if(inside<=0)continue;
     alpha=smooth(inside/soft);const envelope=smooth((1-r)*3),f=Math.PI*freq;
     // Três frentes de onda em direções distintas: não há tiras horizontais.
     ux=(Math.cos(f*(u+.38*v)+phase)*.58+Math.cos(f*(-.61*u+.83*v)*1.17-phase*.7)*-.28+Math.cos(f*(.3*u+v)*.53+phase*.4)*.14)*amp*envelope;
     uy=(Math.cos(f*(u+.38*v)+phase)*.22+Math.cos(f*(-.61*u+.83*v)*1.17-phase*.7)*.39+Math.cos(f*(.3*u+v)*.53+phase*.4)*.33)*amp*envelope;
   }else{
     const d=-roundedDistance(lx,ly,w,h,radius);if(d<=0)continue;alpha=clamp(d,0,1);
     const edge=Math.exp(-d/Math.max(1,thick*1.6));
     const nearX=rx-Math.abs(lx)<ry-Math.abs(ly),nx=nearX?Math.sign(lx):0,ny=nearX?0:Math.sign(ly);
     ux=-delta*(.7+.3*lx/rx)+nx*edge*thick*.65;uy=-delta*(.12+.12*ly/ry)+ny*edge*thick*.65;
     light=shine*edge*(.65-.35*(nx+ny));
   }
   const sx=X+ux*c-uy*s,sy=Y+ux*s+uy*c,i=(y*box.width+x)*4;
   for(let ch=0;ch<3;ch++){const value=sample(src,sx,sy,ch);data[i+ch]=value+(255-value)*light;}
   data[i+3]=sample(src,sx,sy,3)*alpha;
 }
 return {...box,data};
}
const DEFAULT=[[0,0],[1,0],[1,1],[0,1]];
export function quadPoints(F){return DEFAULT.map(([x,y],i)=>[x+(Number(F['q'+i+'x'])||0),y+(Number(F['q'+i+'y'])||0)]);}
export function validQuad(q){
 let sign=0,area=0;
 for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4],cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(Math.abs(cross)<.005)return false;if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);area+=a[0]*b[1]-b[0]*a[1];}
 return sign>0&&area>.05;
}
export function homography(q){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=q;
 const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 let g=0,h=0;if(Math.abs(dx3)+Math.abs(dy3)>1e-10){const den=dx1*dy2-dx2*dy1;if(Math.abs(den)<1e-12)return null;g=(dx3*dy2-dx2*dy3)/den;h=(dx1*dy3-dx3*dy1)/den;}
 return [x1-x0+g*x1,x3-x0+h*x3,x0,y1-y0+g*y1,y3-y0+h*y3,y0,g,h,1];
}
export function inverse(m){if(!m)return null;const [a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=c*h-b*i,C=b*f-c*e,D=f*g-d*i,E=a*i-c*g,F=c*d-a*f,G=d*h-e*g,H=b*g-a*h,I=a*e-b*d,det=a*A+b*D+c*G;if(Math.abs(det)<1e-12)return null;return [A,B,C,D,E,F,G,H,I].map(n=>n/det);}
export function project(m,x,y){const d=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/d,(m[3]*x+m[4]*y+m[5])/d];}
export function planeWorld(F){const q=quadPoints(F);return (validQuad(q)?q:DEFAULT).map(([x,y])=>world(F,(x-.5)*F.w,(y-.5)*F.h));}
export function planePixels(src,F,targetWidth,targetHeight,mirror=false){
 const points=planeWorld(F),box=bounds(points,targetWidth,targetHeight),inv=inverse(homography(points)),data=new Uint8ClampedArray(box.width*box.height*4);
 if(!inv)return {...box,data};
 const zoom=clamp(F.zoom||1,.6,4),ox=Number.isFinite(+F.origemX)?+F.origemX:src.width/2,oy=Number.isFinite(+F.origemY)?+F.origemY:src.height/2;
 const count=mirror?Math.round(clamp(F.fragmentos??1,1,5)):1,gap=clamp(F.intervaloFragmentos??8,0,60)/Math.max(1,F.w),cut=mirror?clamp(F.corte??.17,0,.45):0;
 const border=clamp(F.borda??0,0,18),paper=F.materialRetrato!=='espelho'&&!mirror;
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
   const [u,v]=project(inv,box.left+x,box.top+y);if(u<0||u>1||v<0||v>1)continue;
   const fragment=Math.min(count-1,Math.floor(u*count)),fu=u*count-fragment,edgeGap=count>1?gap*count*.5:0;
   if(fu<edgeGap+cut*(1-v)||fu>1-edgeGap-cut*.5*v)continue;
   const px=(u-.5)*F.w,py=(v-.5)*F.h,sx=ox+(mirror||F.espelhar||F.materialRetrato==='espelho'?-px:px)/zoom+(Number(F['fragmento'+fragment+'X'])||0),sy=oy+py/zoom+(Number(F['fragmento'+fragment+'Y'])||0);
   const edge=Math.min((fu-edgeGap-cut*(1-v))*F.w/count,(1-edgeGap-cut*.5*v-fu)*F.w/count,v*F.h,(1-v)*F.h),i=(y*box.width+x)*4;
   const rim=border>0&&edge<border,reflection=paper?0:clamp(F.reflexoOptico??.12,0,1)*Math.pow(1-u,3)*.35;
   for(let ch=0;ch<3;ch++){const value=paper&&rim?[241,238,232][ch]:sample(src,sx,sy,ch);data[i+ch]=value+(255-value)*(reflection+(!paper&&rim?.16*(1-edge/Math.max(border,1)):0));}
   data[i+3]=(paper&&rim?255:sample(src,sx,sy,3))*clamp(edge,0,1);
 }
 return {...box,data};
}
