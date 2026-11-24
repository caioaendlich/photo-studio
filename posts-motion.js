// Animação editorial de camadas: dados serializáveis, sem modificar fotos, textos ou assets.
const PARAMETERS = new Set([
  'volumeLiquido','espessuraPapel','tipoVidro',
  'faseOndas','espessuraOptica','reflexoOptico','materialRetrato','fragmentos','intervaloFragmentos',
  ...Array.from({length:4},(_,i)=>['q'+i+'x','q'+i+'y']).flat(),
  ...Array.from({length:5},(_,i)=>['fragmento'+i+'X','fragmento'+i+'Y']).flat(),
  'x','y','w','h','rot','opac','sx','sy','tam','esp','incl','arco','dy',
  'origemX','origemY','zoom','borda','sombra','corte','irregularidade',
  'textura','amplitude','frequencia','suavidade','desfoque','deslocamento',
  'faixas','intervalo','intensidade','raio','cobertura',
  'cor','lado','espelhar','recorte','mx','escala','tamLegenda','corContorno','calor','perspectiva','fibras','refracao','luzAngulo','caustica','brilho','bolhinhas','semente','varredura','desfoqueFoco','fase','inclinacao','opacTras','giro','espLetra','entreLinhas','veuFoco','escurecerFoco','deslocamento','grao','aro','tamanho','forca','relevo','bordaJanela','luzSuperficie','espessura','ladoParede','fotoX','fotoY','fotoZoom','opacFantasma','comprimento','angulo','rastro','escalaFantasma','densidade','intensidade','brilho','escalaPontos'
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const MOTION_MAX=20;
export function snapshot(layer) {
  const out={};
  for(const key of PARAMETERS){
    const value=layer[key];
    if(['number','boolean','string'].includes(typeof value) && (typeof value!=='number'||Number.isFinite(value)))out[key]=value;
  }
  return out;
}
export function interpolate(layer, time){
  const keys=(layer.keyframes||[]).slice().sort((a,b)=>a.t-b.t);
  if(!keys.length)return {...layer};
  const t=clamp(Number(time)||0,0,MOTION_MAX);
  if(t<=keys[0].t)return {...layer,...keys[0].values};
  if(t>=keys.at(-1).t)return {...layer,...keys.at(-1).values};
  let i=1;while(i<keys.length-1&&keys[i].t<t)i++;
  const a=keys[i-1],b=keys[i],span=Math.max(.001,b.t-a.t);
  const u=(t-a.t)/span,smoothed=u*u*(3-2*u),merged={...layer};
  for(const key of new Set([...Object.keys(a.values),...Object.keys(b.values)])){
    const x=a.values[key],y=b.values[key];
    if(typeof x==='number'&&typeof y==='number'){
      merged[key]=x+(y-x)*smoothed;
    }else merged[key]=u<.5?(x??y):(y??x);
  }
  return merged;
}
export function saveKeyframe(layer,time){
  const t=Math.round(clamp(Number(time)||0,0,MOTION_MAX)*30)/30, values=snapshot(layer);
  const keys=[...(layer.keyframes||[])].filter(k=>Math.abs(k.t-t)>.017);
  if(keys.length>=30)throw new Error('Use até 30 pontos por camada.');
  keys.push({t,values});keys.sort((a,b)=>a.t-b.t);layer.keyframes=keys;
  return t;
}
export function removeKeyframe(layer,time){
  const t=Number(time)||0;
  layer.keyframes=(layer.keyframes||[]).filter(k=>Math.abs(k.t-t)>.02);
}
export function animationMime(){
  if(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement==='undefined'||!HTMLCanvasElement.prototype.captureStream)return null;
  for(const mime of ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']){
    if(MediaRecorder.isTypeSupported(mime))return mime;
  }
  return null;
}
export function exportCanvasVideo({canvas,duration,draw,onProgress}){
  const mime=animationMime();
  if(!mime)throw new Error('O navegador não oferece gravação de vídeo neste formato.');
  const seconds=clamp(Number(duration)||6,2,MOTION_MAX),fps=30,stream=canvas.captureStream(fps);
  const chunks=[];
  let recorder;try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:12_000_000});}
  catch(e){stream.getTracks().forEach(t=>t.stop());throw e;}
  return new Promise((resolve,reject)=>{
    let raf=0,started=0,closed=false;
    const clear=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());};
    const fail=e=>{if(closed)return;closed=true;clear();reject(e instanceof Error?e:new Error('Falha ao gravar vídeo.'));};
    recorder.onerror=e=>fail(e.error||new Error('Erro durante a gravação.'));
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    recorder.onstop=()=>{if(closed)return;closed=true;clear();if(!chunks.length){reject(new Error('Nenhum quadro foi gravado.'));return;}
      resolve({blob:new Blob(chunks,{type:mime}),ext:mime.includes('mp4')?'mp4':'webm'});};
    function frame(clock){
      if(closed)return;
      if(!started)started=clock;
      const t=Math.min(seconds,(clock-started)/1000);
      try{draw(t);}catch(e){fail(e);return;}
      onProgress?.(t,seconds);
      if(t>=seconds){if(recorder.state==='recording')recorder.stop();return;}
      raf=requestAnimationFrame(frame);
    }
    try{
      draw(0);
      recorder.start(150);
      raf=requestAnimationFrame(frame);
    }catch(e){fail(e);}
  });
}
