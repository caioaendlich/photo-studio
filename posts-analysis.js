// Painel editorial manual: não detecta anatomia nem produz conclusões clínicas.
export function makeAnalysis(w, h) {
  return {tipo:'forma',forma:'painelAnalise',nome:'Painel de análise',x:w*.5,y:h*.42,w:w*.3,h:h*.3,rot:0,opac:1,atras:[],
    foco:[],desfoque:20,suavidade:36,painelX:w*.5,painelY:h*.77,painelW:w*.78,painelH:320,
    painelOpacidade:.45,corPainel:'#19211e',corTexto:'#ffffff',titulo:'Análise da região',area:'',proposta:'',objetivo:'',mostrarPainel:true};
}
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function focusPath(c,L){
  c.beginPath();
  if(L.foco?.length>=3){L.foco.forEach(([x,y],i)=>{if(i)c.lineTo(x*L.w,y*L.h);else c.moveTo(x*L.w,y*L.h);});c.closePath();}
  else c.ellipse(0,0,L.w/2,L.h/2,0,0,Math.PI*2);
}
function textLines(c,text,width){
  const lines=[];
  for(const paragraph of String(text).split('\n')){
    let line='';
    for(const word of paragraph.split(/\s+/)){
      if(c.measureText(line+(line?' ':'')+word).width<=width)line+=(line?' ':'')+word;
      else {if(line)lines.push(line);line='';for(const ch of word){if(c.measureText(line+ch).width>width&&line){lines.push(line);line='';}line+=ch;}}
    }
    lines.push(line);
  }
  return lines;
}
export function drawAnalysis(c,base,L){
  const w=base.width,h=base.height,mask=surface(w,h),m=mask.getContext('2d');
  // Máscara suave, com núcleo nítido e sem linha na imagem final.
  m.translate(L.x,L.y);m.rotate((L.rot||0)*Math.PI/180);
  m.fillStyle='#fff';m.filter=`blur(${Math.max(0,L.suavidade||0)}px)`;focusPath(m,L);m.fill();
  m.filter='none';
  const feather=surface(w,h),f=feather.getContext('2d');f.drawImage(mask,0,0);f.globalCompositeOperation='lighter';f.drawImage(mask,0,0);
  const blurred=surface(w,h),b=blurred.getContext('2d');
  b.filter=`blur(${Math.max(0,L.desfoque||0)}px)`;b.drawImage(base,0,0);b.filter='none';
  b.globalCompositeOperation='destination-out';b.drawImage(feather,0,0);
  const sharp=surface(w,h),s=sharp.getContext('2d');s.drawImage(base,0,0);s.globalCompositeOperation='destination-in';s.drawImage(feather,0,0);
  c.save();c.globalAlpha=L.opac??1;c.drawImage(blurred,0,0);c.drawImage(sharp,0,0);
  if(L.mostrarPainel!==false){
    const pw=Math.max(240,L.painelW||840),pad=30,tx=L.painelX-pw/2+pad;
    const rows=[];
    for(const [label,value] of [['ÁREA TRATADA',L.area],['PROPOSTA',L.proposta],['OBJETIVO',L.objetivo]]){
      if(!String(value||'').trim())continue;
      c.font='400 23px Mont, sans-serif';rows.push({label,lines:textLines(c,value,pw-2*pad)});
    }
    c.font='600 30px Mont, sans-serif';const title=textLines(c,L.titulo||'',pw-2*pad);
    const ph=Math.max(L.painelH||0,2*pad+title.length*38+rows.reduce((n,r)=>n+35+r.lines.length*29,0));
    const top=Math.max(12,Math.min(h-ph-12,L.painelY-ph/2));
    c.save();c.globalAlpha=(L.opac??1)*(L.painelOpacidade??.45);c.fillStyle=L.corPainel||'#19211e';
    c.beginPath();c.roundRect(L.painelX-pw/2,top,pw,ph,24);c.fill();c.restore();
    c.fillStyle=L.corTexto||'#fff';c.textAlign='left';c.textBaseline='top';let y=top+pad;
    c.font='600 30px Mont, sans-serif';for(const line of title){c.fillText(line,tx,y);y+=38;}
    for(const row of rows){y+=14;c.font='600 15px Mont, sans-serif';c.fillText(row.label,tx,y);y+=21;c.font='400 23px Mont, sans-serif';for(const line of row.lines){c.fillText(line,tx,y);y+=29;}}
  }
  c.restore();L._box={x:L.x,y:L.y,w:L.w,h:L.h,rot:L.rot||0};
}
export function installFocusDrawing({canvas,selected,redraw,commit,status}){
  let armed=null,stroke=null;
  const point=e=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))];};
  const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
  const cancel=()=>{armed=null;stroke=null;canvas.style.cursor='';redraw();};
  canvas.addEventListener('pointerdown',e=>{
    if(!armed)return;if(selected()!==armed){cancel();return;}if(e.button!==0)return;
    stop(e);stroke=[point(e)];canvas.setPointerCapture(e.pointerId);
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!stroke)return;stop(e);const p=point(e),last=stroke.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])<3||stroke.length>=1500)return;stroke.push(p);
    redraw();const c=canvas.getContext('2d');c.save();c.strokeStyle='#a9dbc5';c.lineWidth=2*canvas.width/canvas.getBoundingClientRect().width;c.setLineDash([8,5]);c.beginPath();stroke.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
  },true);
  canvas.addEventListener('pointerup',e=>{
    if(!stroke)return;stop(e);const L=armed,points=stroke;
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
    if(points.length>=3&&w>12&&h>12){L.x=x+w/2;L.y=y+h/2;L.w=w;L.h=h;L.rot=0;L.foco=points.map(p=>[(p[0]-L.x)/w,(p[1]-L.y)/h]);commit();status('Área de foco desenhada. Ajuste a suavidade e as informações no painel.');}
    else status('Desenhe uma área fechada maior. O foco anterior foi preservado.',true);
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);cancel();
  },true);
  canvas.addEventListener('pointercancel',cancel,true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&armed){stop(e);cancel();}},true);
  return L=>{armed=L;stroke=null;canvas.style.cursor='crosshair';status('Contorne a área que deve ficar nítida e solte para fechar. Esc cancela.');};
}
