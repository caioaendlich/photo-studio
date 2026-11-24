import { opticsPixels, planePixels } from './posts-optics.js';
import { liquidPixels, glassPixels, paperRelief } from './posts-materials.js';
// Intervenções editoriais sobre a fotografia. Sem assets gerados por IA.
// A mesma função desenha a prévia e o PNG exportado na aba Posts e stories.
export const EDITORIAL_EFFECTS = [
  { id: 'janelaRealidade', name: 'Janela de realidade' },
  { id: 'ampliacaoSuperficie', name: 'Ampliação de superfície' },
  { id: 'fronteiraFoco', name: 'Fronteira de foco' },
  { id: 'retratoInterno', name: 'Retrato no retrato' },
  { id: 'papelRecortado', name: 'Papel recortado' },
  { id: 'aguaLente', name: 'Água como lente' },
  { id: 'peliculaOptica', name: 'Película óptica' },
  { id: 'sombraArquitetonica', name: 'Sombra arquitetônica' },
  { id: 'espelhoFragmentado', name: 'Espelho fragmentado' },
  { id: 'gota', name: 'Gota d’água' },
  { id: 'serum', name: 'Sérum (gota orgânica)' },
  { id: 'recorteOval', name: 'Recorte com profundidade' },
  { id: 'vidroTexturizado', name: 'Vidro texturizado' },
];
const IDS = new Set(EDITORIAL_EFFECTS.map(e => e.id));
export const isEditorialEffect = id => IDS.has(id);

export function makeEditorialEffect(id, width, height) {
  if (!IDS.has(id)) throw new Error('Intervenção desconhecida: ' + id);
  const comum = { forma: id, tipo: 'forma', atras: [], cor: '#141518', esp: 1, opac: 1, rot: 0 };
  if (id === 'janelaRealidade') return { ...comum, nome: 'Janela de realidade', x: width * .50, y: height * .46, w: width * .55, h: height * .40, desfoque: 15, suavidade: 4, raio: 0 };
  if (id === 'ampliacaoSuperficie') return { ...comum, nome: 'Ampliação de superfície', x: width * .68, y: height * .38, w: width * .34, h: width * .34, origemX: width * .50, origemY: height * .48, zoom: 2.2, borda: 1.5, sombra: .35, seguir: false };
  if (id === 'fronteiraFoco') return { ...comum, nome: 'Fronteira de foco', x: width * .50, y: height * .50, w: 50, h: height * 1.5, desfoque: 15, suavidade: 12, lado: 'direita' };
  if (id === 'retratoInterno') return { ...comum, nome: 'Retrato no retrato', x: width * .66, y: height * .49, w: width * .32, h: height * .36, origemX: width * .50, origemY: height * .45, zoom: 1.4, materialRetrato: 'papel', espessuraOptica: 3, borda: 3, sombra: .20, espelhar: false };
  if (id === 'papelRecortado') return { ...comum, nome: 'Papel recortado', x: width * .47, y: height * .48, w: width * .58, h: height * .42, cor: '#f1eee8', tom: 'osso', irregularidade: .08, sombra: .42, textura: .35, fibras: .6 };
  if (id === 'aguaLente') return { ...comum, nome: 'Água como lente', x: width * .48, y: height * .50, w: width * .56, h: height * .44, amplitude: 10, frequencia: 2.5, suavidade: 18, faseOndas: 0 };
  if (id === 'peliculaOptica') return { ...comum, nome: 'Película óptica', x: width * .55, y: height * .50, w: width * .48, h: height * .42, deslocamento: 8, desfoque: 1, espessuraOptica: 4, reflexoOptico: .14, borda: .5, raio: 1 };
  if (id === 'sombraArquitetonica') return { ...comum, nome: 'Sombra arquitetônica', x: width * .52, y: height * .52, w: width * 1.05, h: height * .68, tipoSombra: 'persiana', faixas: 6, intervalo: 120, suavidade: 26, intensidade: .55, calor: .45, perspectiva: .35, rot: -24 };
  if (id === 'recorteOval') return { ...comum, nome: 'Recorte com profundidade', x: width * .5, y: height * .47, w: width * .48, h: height * .6, cor: '#ffffff', formaRecorte: 'oval', espessura: 16, ladoParede: 180, sombra: .5, textura: 0, luzSuperficie: 0, fotoZoom: 1, fotoX: 0, fotoY: 0 };
  if (id === 'vidroTexturizado') return { ...comum, nome: 'Vidro texturizado', x: width * .45, y: height * .44, w: width * .22, h: height * .2, tipoVidro: 'martelado', tamanho: 6, forca: 9, relevo: .55, desfoque: 1.5, janela: true, bordaJanela: 1.5 };
  if (id === 'gota') return { ...comum, nome: 'Gota d’água', x: width * .5, y: height * .45, w: width * .34, h: width * .32, volumeLiquido: 1, refracao: 1.3, luzAngulo: -135, sombra: .45, borda: .6, caustica: .65, brilho: .9, bolhinhas: 0, irregularidade: .03, semente: 3 };
  if (id === 'serum') return { ...comum, nome: 'Sérum', x: width * .5, y: height * .5, w: width * .62, h: height * .42, volumeLiquido: 1, refracao: 1.12, luzAngulo: -135, sombra: .32, borda: .5, caustica: .45, brilho: .6, bolhinhas: 6, irregularidade: .22, semente: 11 };
  return { ...comum, nome: 'Espelho fragmentado', x: width * .63, y: height * .52, w: width * .42, h: height * .34, origemX: width * .47, origemY: height * .46, zoom: 1.6, fragmentos: 1, intervaloFragmentos: 8, espessuraOptica: 3, reflexoOptico: .12, borda: 2, corte: .17, sombra: .20 };
}

function tela(w, h) {
  const el = document.createElement('canvas');
  el.width = w; el.height = h;
  return el;
}
const limite = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

function desfocada(base, amount) {
  const out = tela(base.width, base.height);
  const ctx = out.getContext('2d');
  ctx.filter = 'blur(' + limite(amount, 0, 45) + 'px)';
  ctx.drawImage(base, 0, 0);
  ctx.filter = 'none';
  return out;
}
function recorte(base, mask) {
  const out = tela(base.width, base.height), ctx = out.getContext('2d');
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return out;
}
function mascaraJanela(w, h, F) {
  const hard = tela(w, h), hc = hard.getContext('2d');
  hc.save();
  hc.translate(F.x, F.y);
  hc.rotate(limite(F.rot, -180, 180) * Math.PI / 180);
  hc.fillStyle = '#ffffff';
  hc.beginPath();
  hc.roundRect(-F.w / 2, -F.h / 2, Math.max(1, F.w), Math.max(1, F.h), limite(F.raio, 0, Math.min(F.w, F.h) / 2));
  hc.fill();
  hc.restore();
  const edge = limite(F.suavidade, 0, 45);
  if (!edge) return hard;
  const soft = tela(w, h), sc = soft.getContext('2d');
  sc.filter = 'blur(' + edge + 'px)';
  sc.drawImage(hard, 0, 0);
  sc.filter = 'none';
  return soft;
}
function mascaraFronteira(w, h, F) {
  const mask = tela(w, h), c = mask.getContext('2d');
  const large = Math.max(w, h) * 5, edge = limite(F.suavidade, 0, 150);
  const direita = F.lado !== 'esquerda';
  c.save();
  c.translate(F.x, F.y);
  c.rotate(limite(F.rot, -180, 180) * Math.PI / 180);
  c.fillStyle = '#ffffff';
  if (!edge) c.fillRect(direita ? 0 : -large, -large, large, 2 * large);
  else {
    c.fillRect(direita ? edge : -large, -large, large - edge, 2 * large);
    const g = c.createLinearGradient(-edge, 0, edge, 0);
    if (direita) { g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); }
    else { g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
    c.fillStyle = g;
    c.fillRect(-edge, -large, edge * 2, large * 2);
  }
  c.restore();
  return mask;
}

// base é a fotografia já enquadrada no formato final. Não altera a origem.
export function drawEditorialEffect(c, base, F) {
  if (!isEditorialEffect(F.forma) || !base) return false;
  const w = base.width, h = base.height, composite = tela(w, h), cc = composite.getContext('2d');
  if (F.forma === 'janelaRealidade') {
    cc.drawImage(desfocada(base, F.desfoque), 0, 0);
    cc.drawImage(recorte(base, mascaraJanela(w, h, F)), 0, 0);
    F._box = { x: F.x, y: F.y, w: Math.max(1, F.w), h: Math.max(1, F.h), rot: F.rot || 0 };
  } else if (F.forma === 'fronteiraFoco') {
    cc.drawImage(recorte(desfocada(base, F.desfoque), mascaraFronteira(w, h, F)), 0, 0);
    F._box = { x: F.x, y: F.y, w: 64, h: h * 1.5, rot: F.rot || 0 };
  } else if (F.forma === 'retratoInterno') {
    desenharRetrato(cc, base, F);
  } else if (F.forma === 'papelRecortado') {
    desenharPapel(cc, base, F);
  } else if (F.forma === 'aguaLente') {
    desenharAgua(cc, base, F);
  } else if (F.forma === 'peliculaOptica') {
    desenharPelicula(cc, base, F);
  } else if (F.forma === 'sombraArquitetonica') {
    desenharSombra(cc, base, F);
  } else if (F.forma === 'vidroTexturizado') {
    desenharVidroTexturizado(cc, base, F);
  } else if (F.forma === 'recorteOval') {
    desenharRecorte(cc, base, F);
  } else if (F.forma === 'gota' || F.forma === 'serum') {
    desenharGota(cc, base, F);
  } else if (F.forma === 'espelhoFragmentado') {
    desenharEspelho(cc, base, F);
  } else {
    desenharLupa(cc, base, F);
  }
  c.save();
  c.globalAlpha = limite(F.opac ?? 1, 0, 1);
  c.drawImage(composite, 0, 0);
  c.restore();
  return true;
}

// --- Intervenções de matéria e ótica. Não dependem de assets artificiais. ---
const rad = d => (Number(d) || 0) * Math.PI / 180;
const caixa = F => { F._box = { x:F.x, y:F.y, w:Math.max(1,F.w), h:Math.max(1,F.h), rot:F.rot||0 }; };
function lerPixels(src,blur=0){
  const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height,t=tela(w,h),c=t.getContext('2d');
  if(blur)c.filter=`blur(${blur}px)`;c.drawImage(src,0,0);return c.getImageData(0,0,w,h);
}
function canvasPixels(p){
  if(!p.width||!p.height)return null;
  const t=tela(p.width,p.height);t.getContext('2d').putImageData(new ImageData(p.data,p.width,p.height),0,0);return t;
}
function desenharPlano(c,base,F,mirror){
  const p=planePixels(lerPixels(F.img||base),F,base.width,base.height,mirror),out=canvasPixels(p);if(!out){caixa(F);return;}
  const thick=limite(F.espessuraOptica??3,0,20),glass=mirror||F.materialRetrato==='espelho';
  if(thick>0){
    const side=tela(p.width,p.height),sc=side.getContext('2d');sc.drawImage(out,0,0);sc.globalCompositeOperation='source-in';sc.fillStyle=glass?'#6b7779':'#b8b3a8';sc.fillRect(0,0,p.width,p.height);
    c.save();c.shadowColor=`rgba(10,14,18,${limite(F.sombra,0,.8)})`;c.shadowBlur=6+thick*2;c.shadowOffsetY=3+thick;c.drawImage(side,p.left+thick*.5,p.top+thick);c.restore();
  }else if(F.sombra>0){c.save();c.shadowColor=`rgba(10,14,18,${limite(F.sombra,0,.8)})`;c.shadowBlur=12;c.shadowOffsetY=4;c.drawImage(out,p.left,p.top);c.restore();}
  c.drawImage(out,p.left,p.top);caixa(F);
}
function desenharRetrato(c,base,F){desenharPlano(c,base,F,false);}
function desenharEspelho(c,base,F){desenharPlano(c,base,F,true);}
function desenharAgua(c,base,F){
  const p=opticsPixels(lerPixels(base),F,'water'),out=canvasPixels(p);if(out)c.drawImage(out,p.left,p.top);caixa(F);
}
function desenharPelicula(c,base,F){
  const p=opticsPixels(lerPixels(base,limite(F.desfoque,0,5)),F,'film'),out=canvasPixels(p);
  if(out){c.save();if(F.borda>0){c.shadowColor=`rgba(25,35,40,${limite(F.borda,0,2)*.1})`;c.shadowBlur=2+limite(F.espessuraOptica??4,0,30);c.shadowOffsetY=2;}c.drawImage(out,p.left,p.top);c.restore();}caixa(F);
}

// ===================== v3 (Caio 24/11/2026 01:30, Claude) =====================
// Ruído determinístico: mesmas camadas dão o mesmo desenho no PNG, no MP4 e na prévia.
function aleatorio(seed) { let t = (seed >>> 0) || 1; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
function ruido1D(n, oitavas, seed) {   // ruído periódico suave com n amostras, em -1..1
  const out = new Float32Array(n), rnd = aleatorio(seed);
  let amp = 1, total = 0;
  for (let o = 0; o < oitavas; o++) {
    const nos = 6 * 2 ** o, v = Array.from({ length: nos }, () => rnd() * 2 - 1);
    for (let i = 0; i < n; i++) { const t = i / n * nos, a = Math.floor(t), f = t - a, s = f * f * (3 - 2 * f); out[i] += amp * (v[a % nos] * (1 - s) + v[(a + 1) % nos] * s); }
    total += amp; amp *= .55;
  }
  for (let i = 0; i < n; i++) out[i] /= total;
  return out;
}
const CACHE_TEX = new Map();
function texturaPapel(w, h, cor, forca, seed = 7) {   // fibras + grão em várias escalas, em alta definição
  const k = [w, h, cor, forca, seed].join();
  if (CACHE_TEX.has(k)) return CACHE_TEX.get(k);
  const t = tela(w, h), c = t.getContext('2d'), rnd = aleatorio(seed);
  c.fillStyle = cor; c.fillRect(0, 0, w, h);
  const relief=tela(w,h),rc=relief.getContext('2d'),pixels=rc.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const z=paperRelief(x,y,seed),slope=paperRelief(x+1,y+1,seed)-z,value=128+(z-.5)*30+slope*60,i=(y*w+x)*4;
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
  }
  rc.putImageData(pixels,0,0);c.save();c.globalCompositeOperation='soft-light';c.globalAlpha=forca;c.drawImage(relief,0,0);c.restore();
  c.save(); c.lineCap = 'round';   // fibras curtas
  for (let i = 0; i < 900 * forca; i++) {
    const x = rnd() * w, y = rnd() * h, a = rnd() * Math.PI, l = 1 + rnd() * 5;
    c.strokeStyle = rnd() < .5 ? `rgba(255,255,255,${.10 + rnd() * .12})` : `rgba(90,80,70,${.05 + rnd() * .07})`; c.lineWidth = .25 + rnd() * .25;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l / 2 + rnd() * 3, y + Math.sin(a) * l / 2 + rnd() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  c.restore();
  const luz = c.createLinearGradient(0, 0, w, h); luz.addColorStop(0, 'rgba(255,255,255,.10)'); luz.addColorStop(1, 'rgba(0,0,0,.10)');
  c.fillStyle = luz; c.fillRect(0, 0, w, h);
  if (CACHE_TEX.size > 8) CACHE_TEX.clear(); CACHE_TEX.set(k, t); return t;
}
function corMedia(base) { const t = tela(1, 1), c = t.getContext('2d'); c.drawImage(base, 0, 0, 1, 1); const [r, g, b] = c.getImageData(0, 0, 1, 1).data; return `rgb(${r},${g},${b})`; }
const TONS_PAPEL = { osso: '#f1eee8', branco: '#fbfaf7', kraft: '#bf9f74', grafite: '#1d1e20', rosado: '#efe2dc' };
function caminhoRasgado(c, F, extra, seed) {   // borda rasgada fractal com ~720 pontos; extra > 0 = miolo branco do rasgo
  const N = 720, irr = limite(F.irregularidade, 0, .25);
  const grande = ruido1D(N, 3, seed), fino = ruido1D(N, 6, seed + 11), lado = ruido1D(N, 2, seed + 29), fiapo = ruido1D(N, 7, seed + 41);
  c.beginPath();
  for (let i = 0; i <= N; i++) {
    const j = i % N, t = j / N * Math.PI * 2;
    // o miolo aparece de um lado do rasgo (onde o papel foi puxado), com largura que varia ao longo da borda
    const e = extra ? extra * Math.max(0, .35 + Math.cos(t + 2.4) * .9 + lado[j] * .6) * (1 + fiapo[j] * .5) : 0;
    const q = 1 + grande[j] * irr * 1.4 + fino[j] * .018;
    const x = Math.cos(t) * (F.w / 2 * q + e), y = Math.sin(t) * (F.h / 2 * q + e);
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
function desenharPapel(c, base, F) {
  const w = base.width, h = base.height, papel = tela(w, h), p = papel.getContext('2d');
  const cor = F.tom === 'foto' ? corMedia(base) : TONS_PAPEL[F.tom] || F.cor || TONS_PAPEL.osso, seed = 13;
  p.drawImage(texturaPapel(w, h, cor, limite(F.textura, 0, 1), 7), 0, 0);
  if(F.img){
    // Textura fornecida pelo usuário: luminância sobre a cor escolhida, sem tingir a peça.
    p.save();p.filter='grayscale(1)';p.globalCompositeOperation='soft-light';p.globalAlpha=limite(F.textura,0,1);
    const scale=Math.max(w/F.img.naturalWidth,h/F.img.naturalHeight);p.drawImage(F.img,0,0,F.img.naturalWidth*scale,F.img.naturalHeight*scale);p.restore();
  }
  // miolo branco do rasgo: faixa irregular entre o buraco e o papel
  p.save(); p.translate(F.x, F.y); p.rotate(rad(F.rot));
  const miolo = F.tom === 'grafite' ? '#3a3b3e' : F.tom === 'kraft' ? '#e9dcc6' : '#f6f4ef';
  caminhoRasgado(p, F, limite(F.espessuraPapel??3, .5, 12) * (1 + limite(F.irregularidade, 0, .25)), seed); p.save(); p.clip();
  p.fillStyle = miolo; p.fillRect(-w * 2, -h * 2, w * 4, h * 4); p.restore();
  p.globalCompositeOperation = 'destination-out'; caminhoRasgado(p, F, 0, seed); p.fill();
  // fibras saindo da borda para dentro do buraco
  p.globalCompositeOperation = 'source-over'; const rnd = aleatorio(91), N = Math.round(250 * limite(F.fibras ?? .6, 0, 1)), irr = limite(F.irregularidade, 0, .25), gr = ruido1D(720, 3, seed), fi = ruido1D(720, 6, seed + 11);
  p.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const j = Math.floor(rnd() * 720), t = j / 720 * Math.PI * 2, q = 1 + gr[j] * irr * 1.4 + fi[j] * .018;
    const x = Math.cos(t) * F.w / 2 * q, y = Math.sin(t) * F.h / 2 * q, l = .8 + rnd() ** 2 * 4, a = t + Math.PI + (rnd() - .5) * 1.4;
    p.strokeStyle = miolo; p.globalAlpha = .35 + rnd() * .5; p.lineWidth = .35 + rnd() * .55;
    p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a + .5) * l * .5, y + Math.sin(a + .5) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
  }
  p.restore();
  // o papel projeta sombra para dentro do buraco (sombra de contato curta + sombra larga)
  const sombra = limite(F.sombra, 0, .8);
  c.save(); c.shadowColor = `rgba(12,9,6,${sombra})`; c.shadowBlur = 5; c.shadowOffsetX = 2; c.shadowOffsetY = 4; c.drawImage(papel, 0, 0); c.restore();
  c.save(); c.shadowColor = `rgba(12,9,6,${sombra * .75})`; c.shadowBlur = 8 + (F.espessuraPapel??3)*2; c.shadowOffsetX = 2; c.shadowOffsetY = 3 + (F.espessuraPapel??3); c.globalAlpha = 1; c.drawImage(papel, 0, 0); c.restore();
  caixa(F);
}
// Sombra arquitetônica: luz quente entrando, sombra fria, penumbra que abre com a distância e perspectiva de janela.
function mascaraLuz(w, h, F) {
  const m = tela(w, h), c = m.getContext('2d'), tipo = F.tipoSombra || 'persiana';
  const n = Math.max(1, Math.round(limite(F.faixas, 1, 16))), passo = Math.max(30, Number(F.intervalo) || 110), persp = limite(F.perspectiva, -1, 1);
  const larg = Math.max(60, Number(F.w) || w), alt = Math.max(60, Number(F.h) || h);
  c.save(); c.translate(F.x, F.y); c.rotate(rad(F.rot)); c.fillStyle = '#fff';
  if (tipo === 'persiana') {   // lâminas de luz que se abrem em leque
    const vao = passo * .58;
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * passo, abre = 1 + persp * .9;
      c.beginPath(); c.moveTo(-larg / 2, y - vao / 2); c.lineTo(larg / 2, y * abre - vao * abre / 2); c.lineTo(larg / 2, y * abre + vao * abre / 2); c.lineTo(-larg / 2, y + vao / 2); c.closePath(); c.fill();
    }
  } else if (tipo === 'janela') {   // vidros com caixilho em cruz, em trapézio
    const cols = Math.max(1, Math.min(4, Math.round(n / 2))), rows = 2, cw = larg / cols, rh = alt / rows, mol = Math.max(10, passo * .16), k = 1 + persp * .5;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x0 = -larg / 2 + q * cw + mol / 2, x1 = x0 + cw - mol, y0 = -alt / 2 + r * rh + mol / 2, y1 = y0 + rh - mol, s = v => v * (1 + (k - 1) * ((v + larg / 2) / larg));
      c.beginPath(); c.moveTo(x0, y0 * (1 + (k - 1) * (q / cols))); c.lineTo(x1, y0 * (1 + (k - 1) * ((q + 1) / cols))); c.lineTo(x1, y1 * (1 + (k - 1) * ((q + 1) / cols))); c.lineTo(x0, y1 * (1 + (k - 1) * (q / cols))); c.closePath(); c.fill();
    }
  } else {   // folhagem: poça de luz cortada por folhas
    c.beginPath(); c.ellipse(0, 0, larg / 2, alt / 2, 0, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out'; const rnd = aleatorio(31 + n);
    for (let i = 0; i < 40 + n * 14; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()), x = Math.cos(a) * d * larg / 2, y = Math.sin(a) * d * alt / 2, L = passo * (.35 + rnd() * .6);
      c.save(); c.translate(x, y); c.rotate(rnd() * Math.PI * 2); c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -L * .28, L / 2, 0); c.quadraticCurveTo(0, L * .28, -L / 2, 0); c.fill(); c.restore();
    }
  }
  c.restore();
  // penumbra: nítida perto da janela, aberta longe dela (mistura de duas desfocagens ao longo da luz)
  const soft = limite(F.suavidade, 0, 90), perto = tela(w, h), longe = tela(w, h), pc = perto.getContext('2d'), lc = longe.getContext('2d');
  pc.filter = `blur(${soft * .25 + 1}px)`; pc.drawImage(m, 0, 0); lc.filter = `blur(${soft + 2}px)`; lc.drawImage(m, 0, 0);
  const a = rad(F.rot), dx = Math.cos(a) * larg / 2, dy = Math.sin(a) * larg / 2, g = lc.createLinearGradient(F.x - dx, F.y - dy, F.x + dx, F.y + dy);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000');
  lc.globalCompositeOperation = 'destination-in'; lc.fillStyle = g; lc.fillRect(0, 0, w, h);
  const g2 = pc.createLinearGradient(F.x - dx, F.y - dy, F.x + dx, F.y + dy); g2.addColorStop(0, '#000'); g2.addColorStop(1, 'rgba(0,0,0,0)');
  pc.globalCompositeOperation = 'destination-in'; pc.fillStyle = g2; pc.fillRect(0, 0, w, h);
  pc.globalCompositeOperation = 'lighter'; pc.drawImage(longe, 0, 0);
  // a luz cai em uma mancha, não no quadro inteiro
  const r = Math.hypot(larg, alt) * .62, poca = pc.createRadialGradient(F.x, F.y, r * .25, F.x, F.y, r);
  poca.addColorStop(0, '#000'); poca.addColorStop(1, 'rgba(0,0,0,0)');
  pc.globalCompositeOperation = 'destination-in'; pc.fillStyle = poca; pc.fillRect(0, 0, w, h);
  return perto;
}
function desenharSombra(c, base, F) {
  const w = base.width, h = base.height, luz = mascaraLuz(w, h, F), dens = limite(F.intensidade, 0, .9), calor = limite(F.calor ?? .45, 0, 1);
  c.drawImage(base, 0, 0);
  // sombra fria onde não entra luz
  const sb = tela(w, h), s = sb.getContext('2d');
  s.fillStyle = '#1b2230'; s.fillRect(0, 0, w, h); s.globalCompositeOperation = 'destination-out'; s.drawImage(luz, 0, 0);
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = dens; c.drawImage(sb, 0, 0); c.restore();
  // luz quente onde entra
  const lb = tela(w, h), l = lb.getContext('2d');
  l.fillStyle = '#ffcf94'; l.fillRect(0, 0, w, h); l.globalCompositeOperation = 'destination-in'; l.drawImage(luz, 0, 0);
  c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = calor; c.drawImage(lb, 0, 0); c.restore();
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = calor * .22; c.drawImage(lb, 0, 0); c.restore();
  caixa(F);
}
// Lupa: lente de vidro que amplia um ponto escolhido (origemX/origemY) ou o que está embaixo dela (seguir).
function desenharLupa(c, base, F) {
  const r = Math.max(12, Math.min(F.w, F.h) / 2), zoom = limite(F.zoom, 1, 6);
  const ox = F.seguir ? F.x : Number.isFinite(+F.origemX) ? +F.origemX : F.x, oy = F.seguir ? F.y : Number.isFinite(+F.origemY) ? +F.origemY : F.y;
  const s = limite(F.sombra ?? .35, 0, .8);
  c.save(); c.shadowColor = `rgba(0,0,0,${s})`; c.shadowBlur = r * .28; c.shadowOffsetY = r * .08; c.beginPath(); c.arc(F.x, F.y, r, 0, Math.PI * 2); c.fillStyle = '#000'; c.fill(); c.restore();
  c.save(); c.beginPath(); c.arc(F.x, F.y, r, 0, Math.PI * 2); c.clip();
  c.imageSmoothingQuality = 'high'; c.drawImage(base, F.x - ox * zoom, F.y - oy * zoom, base.width * zoom, base.height * zoom);
  // vidro: leve escurecimento na borda, reflexo suave em cima e brilho no canto
  const vin = c.createRadialGradient(F.x, F.y, r * .62, F.x, F.y, r); vin.addColorStop(0, 'rgba(0,0,0,0)'); vin.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = vin; c.fillRect(F.x - r, F.y - r, r * 2, r * 2);
  const refl = c.createLinearGradient(F.x, F.y - r, F.x, F.y); refl.addColorStop(0, 'rgba(255,255,255,.07)'); refl.addColorStop(1, 'rgba(255,255,255,0)');
  c.beginPath(); c.ellipse(F.x, F.y - r * .42, r * .78, r * .46, 0, 0, Math.PI * 2); c.fillStyle = refl; c.fill();
  const spot = c.createRadialGradient(F.x - r * .5, F.y - r * .55, 0, F.x - r * .5, F.y - r * .55, r * .12); spot.addColorStop(0, 'rgba(255,255,255,.22)'); spot.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = spot; c.fillRect(F.x - r, F.y - r, r * 2, r * 2);
  c.restore();
  const b = limite(F.borda, 0, 8);
  if (b > 0) {
    c.save(); c.lineWidth = b * 2; c.strokeStyle = 'rgba(241,238,232,.85)'; c.beginPath(); c.arc(F.x, F.y, r, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(F.x, F.y, r + b, 0, Math.PI * 2); c.stroke(); c.restore();
  }
  F._box = { x: F.x, y: F.y, w: r * 2, h: r * 2, rot: 0 };
}
// Alvo da lupa e do retrato: o que está sendo ampliado (desenhado só na edição, nunca no PNG).
export function alvoAmpliacao(F) {
  if (F._perspectivaUI) return null;
  if (!['ampliacaoSuperficie', 'retratoInterno', 'espelhoFragmentado'].includes(F.forma) || F.img || F.seguir) return null;
  const zoom = limite(F.zoom || 1, .6, 6), ox = Number.isFinite(+F.origemX) ? +F.origemX : F.x, oy = Number.isFinite(+F.origemY) ? +F.origemY : F.y;
  if (F.forma === 'ampliacaoSuperficie') { const r = Math.max(12, Math.min(F.w, F.h) / 2) / zoom; return { x: ox, y: oy, w: r * 2, h: r * 2, redondo: true }; }
  return { x: ox, y: oy, w: F.w / zoom, h: F.h / zoom, redondo: false };
}

// Gota d'água e sérum (referências de Caio 24/11 01:47): refração da foto dentro da gota, borda escura fina,
// brilho especular do lado da luz, cáustica clara dentro da sombra, sombra projetada para o lado oposto à luz e microbolhas.
function caminhoGota(c, F, sx = 0, sy = 0, enc = 0) {
  const N = 360, irr = limite(F.irregularidade ?? .03, 0, .45), g = ruido1D(N, 2, F.semente || 3), f = ruido1D(N, 4, (F.semente || 3) + 5);
  c.beginPath();
  for (let i = 0; i <= N; i++) {
    const j = i % N, t = j / N * Math.PI * 2, q = 1 + g[j] * irr + f[j] * irr * .25;
    const x = Math.cos(t) * (F.w / 2 - enc) * q, y = Math.sin(t) * (F.h / 2 - enc) * q;
    const a = rad(F.rot), X = F.x + sx + x * Math.cos(a) - y * Math.sin(a), Y = F.y + sy + x * Math.sin(a) + y * Math.cos(a);
    i ? c.lineTo(X, Y) : c.moveTo(X, Y);
  }
  c.closePath();
}
function elipseGradiente(c, cx, cy, rx, ry, paradas) {   // gradiente radial esticado em elipse
  c.save(); c.translate(cx, cy); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); for (const [o, cor] of paradas) g.addColorStop(o, cor);
  c.fillStyle = g; c.fillRect(-rx * 3, -rx * 3, rx * 6, rx * 6); c.restore();
}
function desenharGota(c, base, F) {
  const w=base.width,h=base.height,R=Math.max(1,Math.min(F.w,F.h)/2),serum=F.forma==='serum';
  const la=rad(F.luzAngulo??-135),lx=Math.cos(la),ly=Math.sin(la),shadow=limite(F.sombra,0,.9),volume=limite(F.volumeLiquido??1,.2,2);
  // Sombra de contato e sombra projetada obedecem à direção da luz e ao volume.
  const offset=R*(serum?.035:.13)*volume;
  c.save();c.filter=`blur(${R*(serum?.025:.065)+1}px)`;c.fillStyle=`rgba(10,14,18,${shadow*.48})`;
  caminhoGota(c,F,-lx*offset,-ly*offset);c.fill();c.restore();
  c.save();c.filter=`blur(${Math.max(1,R*.012)}px)`;c.fillStyle=`rgba(10,14,18,${shadow*.22})`;caminhoGota(c,F,-lx*offset*.12,-ly*offset*.12);c.fill();c.restore();
  const source=tela(w,h),sc=source.getContext('2d');sc.drawImage(base,0,0);
  const g=ruido1D(360,2,F.semente||3),fine=ruido1D(360,4,(F.semente||3)+5),irr=limite(F.irregularidade??.03,0,.45);
  const radii=Array.from(g,(v,i)=>1+v*irr+fine[i]*irr*.25);
  const pixels=liquidPixels(sc.getImageData(0,0,w,h),F,radii);
  if(pixels.width&&pixels.height){const layer=tela(pixels.width,pixels.height),lc=layer.getContext('2d');
    lc.putImageData(new ImageData(pixels.data,pixels.width,pixels.height),0,0);c.drawImage(layer,pixels.left,pixels.top);}
  // Poucas bolhas de tamanhos diferentes, no espaço local do líquido (acompanham rotação).
  const rnd=aleatorio((F.semente||3)*97),count=Math.round(limite(F.bolhinhas,0,30));
  c.save();caminhoGota(c,F);c.clip();c.translate(F.x,F.y);c.rotate(rad(F.rot));
  for(let i=0;i<count;i++){
    const angle=rnd()*Math.PI*2,d=Math.sqrt(rnd())*.72,bx=Math.cos(angle)*F.w*.5*d,by=Math.sin(angle)*F.h*.5*d,r=R*(.008+rnd()**3*.045);
    c.beginPath();c.arc(bx,by,r,0,Math.PI*2);c.lineWidth=Math.max(.4,r*.12);c.strokeStyle='rgba(25,30,33,.22)';c.stroke();
    c.beginPath();c.arc(bx+Math.cos(la-rad(F.rot))*r*.4,by+Math.sin(la-rad(F.rot))*r*.4,r*.23,0,Math.PI*2);c.fillStyle='rgba(255,255,255,.55)';c.fill();
  }
  c.restore();caixa(F);
}

// Recorte com profundidade (referência de Caio 24/11 02:15): a foto aparece por um buraco recortado numa superfície clara;
// a parede interna do recorte aparece de um lado (espessura), com sombra dela sobre a foto. A foto pode ser movida e
// aproximada dentro do recorte.
function caminhoRecorte(c, F, dx = 0, dy = 0) {
  const w = F.w, h = F.h, tipo = F.formaRecorte || 'oval';
  c.save(); c.translate(F.x + dx, F.y + dy); c.rotate(rad(F.rot)); c.beginPath();
  if (tipo === 'circulo') c.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
  else if (tipo === 'arco') { c.moveTo(-w / 2, h / 2); c.lineTo(-w / 2, -h / 2 + w / 2); c.arc(0, -h / 2 + w / 2, w / 2, Math.PI, 0); c.lineTo(w / 2, h / 2); c.closePath(); }
  else if (tipo === 'capsula') c.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2);
  else if (tipo === 'retangulo') c.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * .06);
  else c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  c.restore();
}
function desenharRecorte(c, base, F) {
  const w = base.width, h = base.height, a = rad(F.ladoParede ?? 180), esp = limite(F.espessura, 0, 80), dx = Math.cos(a) * esp, dy = Math.sin(a) * esp, sombra = limite(F.sombra, 0, 1);
  // 1. a foto, atrás da superfície, com posição e aproximação próprias
  const z = limite(F.fotoZoom || 1, .5, 4);
  c.save(); caminhoRecorte(c, F); c.clip();
  c.translate(F.x + (F.fotoX || 0), F.y + (F.fotoY || 0)); c.scale(z, z); c.translate(-F.x, -F.y); c.imageSmoothingQuality = 'high'; c.drawImage(base, 0, 0);
  c.restore();
  // 2. parede interna do recorte: a meia-lua entre o buraco e o buraco deslocado pela espessura
  if (esp > 0) {
    const parede = tela(w, h), p = parede.getContext('2d');
    caminhoRecorte(p, F); p.fillStyle = '#000'; p.fill();
    p.globalCompositeOperation = 'destination-out'; caminhoRecorte(p, F, -dx, -dy); p.fill();
    p.globalCompositeOperation = 'source-in';
    const g = p.createLinearGradient(F.x + dx * 4, F.y + dy * 4, F.x - dx * 4, F.y - dy * 4);
    g.addColorStop(0, '#9a9a98'); g.addColorStop(.45, '#d8d7d4'); g.addColorStop(1, '#f2f1ee');
    p.fillStyle = g; p.fillRect(0, 0, w, h);
    // sombra da parede caindo sobre a foto, junto da meia-lua
    const sb = tela(w, h), sc = sb.getContext('2d'); sc.fillStyle = 'rgba(0,0,0,.85)'; sc.fillRect(0, 0, w, h);
    sc.globalCompositeOperation = 'destination-out'; sc.fillStyle = '#000'; caminhoRecorte(sc, F, -dx * 1.8, -dy * 1.8); sc.fill();
    c.save(); caminhoRecorte(c, F); c.clip(); c.filter = `blur(${esp * .9 + 4}px)`; c.globalAlpha = sombra; c.drawImage(sb, 0, 0); c.restore();
    c.drawImage(parede, 0, 0);
  }
  // 3. a superfície clara, com textura leve, e o buraco
  const sup = tela(w, h), s = sup.getContext('2d'), cor = F.cor || '#ffffff';
  if (limite(F.textura, 0, 1) > 0) s.drawImage(texturaPapel(w, h, cor, limite(F.textura, 0, 1) * .6, 21), 0, 0); else { s.fillStyle = cor; s.fillRect(0, 0, w, h); }
  if (limite(F.luzSuperficie, 0, 1) > 0) {   // sombreado opcional; por padrão a superfície fica na cor escolhida, sem tom (Caio 24/11 02:18)
    const luz = s.createRadialGradient(w * .5, h * .4, 0, w * .5, h * .5, Math.hypot(w, h) * .65); luz.addColorStop(0, 'rgba(255,255,255,0)'); luz.addColorStop(1, `rgba(0,0,0,${.12 * F.luzSuperficie})`);
    s.fillStyle = luz; s.fillRect(0, 0, w, h);
  }
  s.globalCompositeOperation = 'destination-out'; s.fillStyle = '#000'; caminhoRecorte(s, F); s.fill();
  c.drawImage(sup, 0, 0);
  // 4. aresta: luz fina do lado oposto à parede e uma linha escura bem leve do lado da parede
  c.save(); caminhoRecorte(c, F); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke(); c.restore();
  c.save(); caminhoRecorte(c, F, dx * .08, dy * .08); c.lineWidth = 1; c.strokeStyle = `rgba(0,0,0,${.12 + sombra * .1})`; c.stroke(); c.restore();
  caixa(F);
}

// Vidro texturizado (referência de Caio 24/11 02:18): vidro martelado na frente da foto. Um relevo de ruído desvia cada
// pixel (refração) e acende as bordas do relevo; uma janela retangular nítida (a caixa da camada) mostra a foto limpa.
function desenharVidroTexturizado(c,base,F){
  const w=base.width,h=base.height,source=tela(w,h),sc=source.getContext('2d');
  const frost=limite(F.desfoque,0,8);sc.filter=`blur(${frost}px)`;sc.drawImage(base,0,0);sc.filter='none';
  const pixels=glassPixels(sc.getImageData(0,0,w,h),F),out=tela(w,h);
  out.getContext('2d').putImageData(new ImageData(pixels.data,w,h),0,0);c.drawImage(out,0,0);
  if(F.janela!==false){
    c.save();c.translate(F.x,F.y);c.rotate(rad(F.rot));c.beginPath();c.rect(-F.w/2,-F.h/2,F.w,F.h);c.restore();
    c.save();c.clip();c.drawImage(base,0,0);c.restore();
    if(F.bordaJanela>0){c.save();c.translate(F.x,F.y);c.rotate(rad(F.rot));c.lineWidth=F.bordaJanela;c.strokeStyle='rgba(255,255,255,.65)';c.strokeRect(-F.w/2,-F.h/2,F.w,F.h);c.restore();}
  }
  caixa(F);
}
