// Media Studio · Vídeo. Editor de vídeo para o celular e o Mac, sem servidor.
// Linha do tempo com miniaturas e agulha no centro, cortar pelas bordas, dividir, velocidade, volume com fade,
// enquadrar com o dedo (arrastar, pinça, girar), cor em WebGL (looks e 11 ajustes, funciona no iPhone),
// transições, textos com fonte, estilo, cor e animação, legenda automática palavra por palavra (Whisper no
// aparelho), música, formatos 9:16, 4:5, 1:1 e 16:9, desfazer e refazer, projeto guardado no aparelho e
// exportação quadro a quadro em MP4 (WebCodecs), com gravação em tempo real quando o aparelho não tiver WebCodecs.
// Claude, 27/11/2026, refeito a pedido de Caio.
import { Muxer, ArrayBufferTarget } from './celular/mp4-muxer.mjs';

const $ = id => document.getElementById(id);
const tela = $('tela'), ctx = tela.getContext('2d');
let W = 1080, H = 1920;

/* ================= ícones ================= */
const IC = {
  play: '<path d="M7 4.5v15l12-7.5z"/>', pause: '<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>',
  inicio: '<path d="M6 5v14"/><path d="M19 5l-10 7 10 7z"/>', fim: '<path d="M18 5v14"/><path d="M5 5l10 7-10 7z"/>',
  qAnt: '<path d="M15 6l-6 6 6 6"/>', qProx: '<path d="M9 6l6 6-6 6"/>',
  desfazer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', refazer: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  exportar: '<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
  mais: '<path d="M12 5v14M5 12h14"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  texto: '<path d="M5 7V4h14v3"/><path d="M12 4v16"/><path d="M9 20h6"/>',
  legenda: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6"/>',
  musica: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  formato: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 8v8M21 8v8"/>',
  dividir: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  velocidade: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  volume: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  enquadrar: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  cor: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
  transicao: '<path d="M4 7h11l-3-3M20 17H9l3 3"/>',
  duplicar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  esq: '<path d="M10 6l-6 6 6 6M4 12h16"/>', dir: '<path d="M14 6l6 6-6 6M20 12H4"/>',
  apagar: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', voltar: '<path d="M15 6l-6 6 6 6"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', fonte: '<path d="M4 20L10 4h1l6 16M6.5 14h8"/>',
  estilo: '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 12h10"/>', animacao: '<path d="M2 8h4M3 12h5M4 16h4"/><circle cx="15" cy="12" r="6"/>',
  zoomTl: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/>',
  ok: '<path d="M5 12l5 5 9-10"/>',
  novo: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/>'
};
const ic = n => `<svg viewBox="0 0 24 24">${IC[n] || ''}</svg>`;

/* ================= catálogos ================= */
const FONTES = [
  ['Montserrat', '800', 'Montserrat'], ['General Sans', '600', 'General Sans'], ['Satoshi', '700', 'Satoshi'],
  ['Anton', '400', 'Anton'], ['Archivo', '900', 'Archivo'], ['Jost', '300', 'Jost fina'], ['Jost', '500', 'Jost'],
  ['Satoshi', '300', 'Satoshi fina'], ['Instrument Serif', 'italic 400', 'Serif itálica'], ['Instrument Serif', '400', 'Serif'],
  ['Bodoni Moda', '900', 'Bodoni'], ['Melodrama', '400', 'Melodrama']
];
const CORES = ['#ffffff', '#000000', '#c6f578', '#ffe14d', '#ff5a4f', '#ff8fb1', '#7cc4ff', '#3b5bff', '#f4e9dc', '#b8a48c', '#2f4f3a', '#6b4cff'];
const ZERO = { br: 0, co: 0, sa: 0, te: 0, ti: 0, sh: 0, hi: 0, fa: 0, vi: 0, ni: 0, so: 0 };
const AJUSTES = [['br', 'Brilho', -1, 1], ['co', 'Contraste', -1, 1], ['sa', 'Saturação', -1, 1], ['te', 'Temperatura', -1, 1], ['ti', 'Matiz', -1, 1],
  ['sh', 'Sombras', -1, 1], ['hi', 'Realces', -1, 1], ['fa', 'Desbotado', 0, 1], ['vi', 'Vinheta', 0, 1], ['ni', 'Nitidez', 0, 1], ['so', 'Suavizar pele', 0, 1]];
const LOOKS = [
  ['Natural', {}], ['Clínica clara', { br: .07, co: .05, sa: -.06, te: -.07, hi: -.12, sh: .12 }],
  ['Pele luminosa', { br: .06, co: -.04, sa: .02, te: .06, so: .4, hi: -.06, sh: .08 }], ['Quente suave', { te: .28, sa: .05, fa: .1, co: .03 }],
  ['Frio limpo', { te: -.24, co: .08, sa: -.06, br: .02 }], ['Editorial', { co: .2, sa: -.28, fa: .18, vi: .35, te: .04 }],
  ['Cinema', { co: .16, sa: -.1, te: .08, ti: .04, fa: .08, vi: .45, sh: -.04 }], ['Contraste', { co: .32, sa: .1, sh: -.06, vi: .2 }],
  ['P&B', { sa: -1, co: .22 }], ['P&B suave', { sa: -1, co: -.06, fa: .22 }]
];
const TRANS = [['nenhuma', 'Corte seco'], ['dissolver', 'Dissolver'], ['preto', 'Passar pelo preto'], ['branco', 'Flash branco'],
  ['zoom', 'Zoom'], ['deslizar', 'Deslizar'], ['subir', 'Empurrar para cima']];
const EST_TEXTO = [['simples', 'Simples'], ['sombra', 'Sombra'], ['contorno', 'Contorno'], ['caixa', 'Caixa escura'], ['caixaClara', 'Caixa clara'], ['caixaCor', 'Caixa colorida']];
const ANIM_IN = [['nenhuma', 'Nenhuma'], ['surgir', 'Surgir'], ['subir', 'Subir'], ['pop', 'Pop'], ['digitar', 'Digitar'], ['palavra', 'Palavra a palavra']];
const EST_LEG = [['reels', 'Reels'], ['caixa', 'Palavra em caixa'], ['karaoke', 'Karaokê'], ['limpa', 'Limpa'], ['editorial', 'Editorial']];
const FORMATOS = { '9:16': [1080, 1920], '4:5': [1080, 1350], '1:1': [1080, 1080], '16:9': [1920, 1080] };

/* ================= estado ================= */
let uid = Date.now() % 1e6;
const novoId = p => p + (++uid).toString(36);
const novoProjeto = () => ({ formato: '9:16', clipes: [], textos: [], palavras: [],
  leg: { estilo: 'reels', fonte: 0, tam: 78, cor: '#ffffff', corAtiva: '#ffe14d', y: 0.74, ppl: 3, caixaAlta: true },
  musica: null });
let P = novoProjeto();
const M = {};                       // mídias: id → { id, file, url, dur, thumbs, buf }
const V = {};                       // vídeo por clipe: clipId → <video>
const st = { t: 0, tocando: false, sel: null, pps: 60, painel: null, exportando: false, guias: null };

const caixaVideos = document.createElement('div');
caixaVideos.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:.01;pointer-events:none;z-index:-1';
document.body.appendChild(caixaVideos);

const fmt = s => (Math.round(s * 10) / 10).toFixed(1).replace('.', ',');
const fmtT = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return String(m).padStart(2, '0') + ':' + (r < 10 ? '0' : '') + r.toFixed(1).replace('.', ','); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let tStatus = 0;
function status(m, erro, ms = 3200) {
  const el = $('status'); el.textContent = m || ''; el.classList.toggle('v', !!m); el.classList.toggle('erro', !!erro);
  clearTimeout(tStatus); if (m && ms) tStatus = setTimeout(() => el.classList.remove('v'), ms);
}

/* ================= tempo da sequência ================= */
const durC = c => Math.max(0.05, (c.fim - c.ini) / c.vel);
function layout() {
  const L = []; let s = 0;
  P.clipes.forEach((c, i) => {
    const d = durC(c), prox = P.clipes[i + 1];
    const ov = prox && c.tr && c.tr.tipo !== 'nenhuma' ? Math.min(c.tr.d, d / 2, durC(prox) / 2) : 0;
    L.push({ c, i, ini: s, d, ov }); s += d - ov;
  });
  return L;
}
const total = () => { const L = layout(); return L.length ? L[L.length - 1].ini + L[L.length - 1].d : 0; };
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
function camadas(t) { // o que aparece no tempo t: até dois clipes durante uma transição
  const L = layout(), out = [], T = L.length ? L[L.length - 1].ini + L[L.length - 1].d : 0;
  for (const l of L) {
    const fimL = l.ini + l.d;
    if (t >= l.ini && (t < fimL || (l.i === L.length - 1 && t <= T + 1e-6))) out.push({ ...l, local: l.c.ini + clamp(t - l.ini, 0, l.d - 1e-3) * l.c.vel });
  }
  if (out.length === 2) { const a = out[0], p = ease(clamp((t - out[1].ini) / Math.max(1e-3, a.ov), 0, 1)); out.trans = { tipo: a.c.tr.tipo, p }; }
  return out;
}

/* ================= mídia ================= */
function abrirVideo(url, nome) { // iPhone: vídeo na página, load() explícito e prazo em tudo
  return new Promise((ok, falha) => {
    const v = document.createElement('video');
    v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.muted = true; v.preload = 'auto';
    caixaVideos.appendChild(v);
    let feito = false; const fim = (e) => { if (feito) return; feito = true; clearTimeout(lim); e ? (v.remove(), falha(e)) : ok(v); };
    const lim = setTimeout(() => fim(new Error('O aparelho não abriu ' + nome + ' a tempo.')), 20000);
    v.onloadeddata = () => fim(); v.onerror = () => fim(new Error('Não consegui abrir ' + nome + '.'));
    v.src = url; v.load();
  });
}
function esperar(v, ev, ms = 2500) { return new Promise(r => { let ok = false; const f = () => { if (ok) return; ok = true; v.removeEventListener(ev, f); r(); }; v.addEventListener(ev, f); setTimeout(f, ms); }); }
async function seekV(v, t) { if (Math.abs(v.currentTime - t) < 0.002 && v.readyState >= 2) return; v.currentTime = t; await esperar(v, 'seeked'); }

async function adicionarMidia(file, guardar = true, idFixo) {
  const id = idFixo || novoId('m'), url = URL.createObjectURL(file);
  const v = await abrirVideo(url, file.name || 'o vídeo');
  const m = { id, file, url, nome: file.name || 'vídeo', dur: isFinite(v.duration) && v.duration > 0 ? v.duration : 10, vw: v.videoWidth, vh: v.videoHeight, thumbs: [], buf: undefined };
  M[id] = m; v.remove();
  if (guardar) dbPut('midia:' + id, { file, nome: m.nome }).catch(() => {});
  filaMiniaturas.push(m); rodarMiniaturas();
  return m;
}
const filaMiniaturas = []; let miniRodando = false;
async function rodarMiniaturas() {
  if (miniRodando) return; miniRodando = true;
  while (filaMiniaturas.length) {
    const m = filaMiniaturas.shift();
    let v; try { v = await abrirVideo(m.url, m.nome); } catch { continue; }
    const n = clamp(Math.ceil(m.dur / 0.6), 2, 24), c = document.createElement('canvas'); c.width = 72; c.height = 128; const g = c.getContext('2d');
    for (let k = 0; k < n; k++) {
      const t = Math.min(m.dur - 0.05, (k + 0.5) * m.dur / n);
      await seekV(v, t);
      const s = Math.max(72 / v.videoWidth, 128 / v.videoHeight); g.drawImage(v, (72 - v.videoWidth * s) / 2, (128 - v.videoHeight * s) / 2, v.videoWidth * s, v.videoHeight * s);
      m.thumbs.push({ t, src: c.toDataURL('image/jpeg', .6) });
      if (k === 0 || k === n - 1 || k % 4 === 3) desenharTL();
    }
    v.remove(); desenharTL();
  }
  miniRodando = false;
}
function videoDe(c) {
  let v = V[c.id];
  if (!v) { v = document.createElement('video'); v.playsInline = true; v.setAttribute('playsinline', ''); v.muted = true; v.preload = 'auto';
    v.src = M[c.media].url; caixaVideos.appendChild(v); v.load(); v.onseeked = () => pedirDesenho();
    v.addEventListener('loadeddata', () => { const l = camadas(st.t).find(l => l.c.id === c.id); if (l && !st.tocando) v.currentTime = l.local; pedirDesenho(); }); V[c.id] = v; }
  return v;
}
function limparVideos() { for (const id in V) if (!P.clipes.some(c => c.id === id)) { V[id].pause(); V[id].removeAttribute('src'); V[id].remove(); delete V[id]; } }
async function bufDe(m) { // áudio decodificado da mídia (null se não tiver som)
  if (m.buf !== undefined) return m.buf;
  if (m._dec) return m._dec;
  m._dec = (async () => {
    try { const ab = await m.file.arrayBuffer(); const ac = AC || new (window.AudioContext || window.webkitAudioContext)();
      m.buf = await new Promise((ok, no) => { const r = ac.decodeAudioData(ab, ok, no); if (r && r.then) r.then(ok, no); });
      if (ac !== AC && ac.close) ac.close();
    } catch { m.buf = null; }
    return m.buf;
  })();
  return m._dec;
}

async function adicionarArquivos(fs, onde) {
  fs = [...fs].filter(f => /^video\//.test(f.type) || /\.(mov|mp4|m4v|webm)$/i.test(f.name)); if (!fs.length) return;
  let pos = onde ?? P.clipes.length, n = 0, erros = 0;
  for (const f of fs) {
    n++; status('Abrindo vídeo ' + n + ' de ' + fs.length + '…', false, 0);
    try { const m = await adicionarMidia(f);
      P.clipes.splice(pos++, 0, { id: novoId('c'), media: m.id, ini: 0, fim: m.dur, vel: 1, vol: 1, fIn: 0, fOut: 0, modo: 'preencher', fundo: 'video', zoom: 1, x: 0, y: 0, rot: 0, adj: { ...ZERO }, look: 0, tr: { tipo: 'nenhuma', d: 0.5 } });
      atualizarTudo();
    } catch (e) { erros++; status(e.message, true); await new Promise(r => setTimeout(r, 1200)); }
  }
  commit(); status(erros ? erros + ' vídeo(s) não abriram. Os outros estão prontos.' : (fs.length - erros) + ' vídeo(s) prontos.', !!erros);
  irPara(st.t);
}
$('arquivos').onchange = e => { const f = e.target.files; adicionarArquivos(f); e.target.value = ''; };
$('arqMais').onchange = e => { const f = e.target.files; adicionarArquivos(f, inserirEm); e.target.value = ''; };
let inserirEm = null;

/* ================= cor em WebGL ================= */
const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
const gl = glc.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
const VS = `attribute vec2 a;uniform mat3 m;varying vec2 uv;varying vec2 sc;void main(){vec3 p=m*vec3(a,1.);gl_Position=vec4(p.xy,0.,1.);uv=a;sc=p.xy*.5+.5;}`;
const FS = `precision mediump float;uniform sampler2D tx;uniform vec2 px;uniform float br,co,sa,te,ti,sh,hi,fa,vi,ni,so,al;varying vec2 uv;varying vec2 sc;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
void main(){vec3 c=texture2D(tx,uv).rgb;
if(ni>0.||so>0.){vec3 b1=(texture2D(tx,uv+vec2(px.x,0.)).rgb+texture2D(tx,uv-vec2(px.x,0.)).rgb+texture2D(tx,uv+vec2(0.,px.y)).rgb+texture2D(tx,uv-vec2(0.,px.y)).rgb)*.25;
 c=c+(c-b1)*ni*1.8;
 if(so>0.){vec2 r=px*4.;vec3 b2=(texture2D(tx,uv+vec2(r.x,r.y)).rgb+texture2D(tx,uv-vec2(r.x,r.y)).rgb+texture2D(tx,uv+vec2(r.x,-r.y)).rgb+texture2D(tx,uv+vec2(-r.x,r.y)).rgb+b1*4.)*.125;
  float L0=lum(c);float pele=smoothstep(.02,.12,c.r-c.b)*smoothstep(.15,.4,L0);c=mix(c,b2,so*.85*pele);}}
float L=lum(c);c+=sh*.35*(1.-smoothstep(0.,.55,L));c+=hi*.35*smoothstep(.45,1.,L);
c+=br*.28;c=(c-.5)*(1.+co)+.5;L=lum(c);c=mix(vec3(L),c,1.+sa);
c.r+=te*.11;c.b-=te*.11;c.g-=ti*.08;c=mix(c,vec3(.1)+c*.86,fa);
float d=distance(sc,vec2(.5));c*=1.-vi*.75*smoothstep(.25,.85,d);
gl_FragColor=vec4(clamp(c,0.,1.),al);}`;
let prog = null, uni = {}, tex = null;
if (gl) {
  const sh = (tp, src) => { const s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['m', 'tx', 'px', 'al', ...Object.keys(ZERO)]) uni[n] = gl.getUniformLocation(prog, n);
  tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}
const rasc = [0, 1].map(() => { const c = document.createElement('canvas'); return { c, g: c.getContext('2d') }; });
function quadroDe(v, k, max) { // copia o quadro do vídeo (já girado como o iPhone grava) para uma tela de rascunho
  const vw = v.videoWidth, vh = v.videoHeight; if (!vw || !vh) return null;
  const s = Math.min(1, max / Math.max(vw, vh)), w = Math.round(vw * s), h = Math.round(vh * s), r = rasc[k];
  if (r.c.width !== w || r.c.height !== h) { r.c.width = w; r.c.height = h; }
  r.g.drawImage(v, 0, 0, w, h); return r.c;
}
function matriz(cx, cy, dw, dh, rot) {
  const co = Math.cos(rot), si = Math.sin(rot);
  return new Float32Array([2 * co * dw / W, -2 * si * dw / H, 0, -2 * si * dh / W, -2 * co * dh / H, 0,
    2 * (cx - .5 * co * dw + .5 * si * dh) / W - 1, 1 - 2 * (cy - .5 * si * dw - .5 * co * dh) / H, 1]);
}
function pintarCamada(src, c, o) { // o: {dx, dy, esc, alfa, adj, modoForcado}
  const vw = src.width, vh = src.height, modo = o.modo || c.modo;
  const base = modo === 'ajustar' ? Math.min(W / vw, H / vh) : Math.max(W / vw, H / vh);
  const s = base * (o.zoom ?? c.zoom) * (o.esc || 1), dw = vw * s, dh = vh * s;
  const cx = W / 2 + (o.semPos ? 0 : c.x * W) + (o.dx || 0), cy = H / 2 + (o.semPos ? 0 : c.y * H) + (o.dy || 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.uniformMatrix3fv(uni.m, false, matriz(cx, cy, dw, dh, (o.semPos ? 0 : c.rot) * Math.PI / 180));
  gl.uniform2f(uni.px, 1 / vw, 1 / vh); gl.uniform1f(uni.al, o.alfa ?? 1);
  const a = o.adj || c.adj; for (const k in ZERO) gl.uniform1f(uni[k], a[k] || 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function pintarClipe(c, src, o = {}) {
  if (c.modo === 'ajustar' && c.fundo === 'video') pintarCamada(src, c, { ...o, modo: 'preencher', zoom: 1.08, semPos: true, adj: { ...c.adj, br: (c.adj.br || 0) - .45, so: 1, sa: (c.adj.sa || 0) - .2, vi: .6 } });
  else if (c.modo === 'ajustar' && c.fundo === 'branco' && !o.semFundo) { /* fundo branco pintado no 2D */ }
  pintarCamada(src, c, o);
}

/* ================= desenho do quadro ================= */
let hits = [];
function desenhar(t = st.t, exportando = false) {
  const cs = camadas(t), maxLado = exportando ? 1920 : 1280;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const branco = cs.length && cs[0].c.modo === 'ajustar' && cs[0].c.fundo === 'branco';
  if (gl) {
    gl.viewport(0, 0, W, H); const fb = branco ? 1 : 0; gl.clearColor(fb, fb, fb, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const tr = cs.trans; let veu = null;
    cs.forEach((l, k) => {
      const v = V[l.c.id]; if (!v) return; const src = quadroDe(v, k, maxLado); if (!src) return;
      let o = {};
      if (tr) { const p = tr.p, ehB = k === 1;
        if (tr.tipo === 'dissolver') o = ehB ? { alfa: p } : {};
        else if (tr.tipo === 'preto' || tr.tipo === 'branco') { if ((p < .5) === ehB) return; veu = { cor: tr.tipo === 'preto' ? '0,0,0' : '255,255,255', a: p < .5 ? p * 2 : (1 - p) * 2 }; }
        else if (tr.tipo === 'zoom') o = ehB ? { esc: 1.25 - .25 * p, alfa: p } : { esc: 1 + .3 * p };
        else if (tr.tipo === 'deslizar') o = { dx: ehB ? (1 - p) * W : -p * W };
        else if (tr.tipo === 'subir') o = { dy: ehB ? (1 - p) * H : -p * H };
      }
      pintarClipe(l.c, src, o);
    });
    ctx.drawImage(glc, 0, 0);
    if (veu) { ctx.fillStyle = `rgba(${veu.cor},${veu.a})`; ctx.fillRect(0, 0, W, H); }
  } else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); cs.forEach(l => { const v = V[l.c.id]; if (v && v.videoWidth) { const s = Math.max(W / v.videoWidth, H / v.videoHeight) * l.c.zoom; ctx.drawImage(v, W / 2 + l.c.x * W - v.videoWidth * s / 2, H / 2 + l.c.y * H - v.videoHeight * s / 2, v.videoWidth * s, v.videoHeight * s); } }); }
  if (!cs.length) { ctx.fillStyle = '#0b0c0b'; ctx.fillRect(0, 0, W, H); }
  hits = [];
  P.textos.forEach((tx, i) => { if (t >= tx.de && t < tx.ate) desenharTexto(tx, t, i); });
  desenharLegenda(t);
  if (!exportando && st.guias) { ctx.save(); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 3; ctx.setLineDash([18, 14]);
    if (st.guias.v) { ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); }
    if (st.guias.h) { ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); } ctx.restore(); }
  if (!exportando && st.sel?.tipo === 'texto') { const h = hits.find(h => h.id === st.sel.id); if (h) { ctx.save(); ctx.translate(h.cx, h.cy); ctx.rotate(h.rot); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.strokeRect(-h.w / 2 - 18, -h.h / 2 - 14, h.w + 36, h.h + 28); ctx.restore(); } }
  if (!exportando) atualizarTempo();
}
let pedido = 0; function pedirDesenho() { if (pedido || st.tocando) return; pedido = requestAnimationFrame(() => { pedido = 0; desenhar(); }); }

function fonteCss(i, tam) { const [f, p] = FONTES[i] || FONTES[0]; return `${p} ${tam}px "${f}", "Helvetica Neue", Arial, sans-serif`; }
function quebrar(texto, max) {
  const linhas = [];
  for (const par of texto.split('\n')) { let l = '';
    for (const p of par.split(/\s+/).filter(Boolean)) { const tt = l ? l + ' ' + p : p; if (ctx.measureText(tt).width > max && l) { linhas.push(l); l = p; } else l = tt; }
    linhas.push(l); }
  return linhas;
}
function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); } ctx.fill(); }
function desenharTexto(tx, t, i) {
  const viva = t - tx.de, resta = tx.ate - t, dA = 0.45;
  let alfa = 1, dy = 0, esc = 1, corte = Infinity, palavrasVis = Infinity;
  const p = clamp(viva / dA, 0, 1), e = 1 - Math.pow(1 - p, 3);
  if (tx.anim === 'surgir') alfa = e; else if (tx.anim === 'subir') { alfa = e; dy = (1 - e) * 60; }
  else if (tx.anim === 'pop') { const q = clamp(viva / .35, 0, 1); esc = q < 1 ? .6 + .4 * (1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2)) : 1; alfa = clamp(viva / .12, 0, 1); }
  else if (tx.anim === 'digitar') corte = Math.floor(viva / Math.min(1.4, (tx.ate - tx.de) * .5) * tx.texto.length);
  else if (tx.anim === 'palavra') palavrasVis = Math.floor(viva / Math.min(1.8, (tx.ate - tx.de) * .5) * tx.texto.split(/\s+/).length) + 1;
  if (tx.saida === 'sumir') alfa *= clamp(resta / .3, 0, 1);
  let texto = tx.caixaAlta ? tx.texto.toUpperCase() : tx.texto;
  ctx.save(); ctx.font = fonteCss(tx.fonte, tx.tam);
  const linhas = quebrar(texto, W * tx.larg), lh = tx.tam * 1.15;
  const larg = Math.max(1, ...linhas.map(l => ctx.measureText(l).width)), alt = linhas.length * lh;
  const cx = tx.x * W, cy = tx.y * H, rot = tx.rot * Math.PI / 180;
  hits.push({ id: tx.id, cx, cy, rot, w: larg, h: alt });
  ctx.translate(cx, cy + dy); ctx.rotate(rot); ctx.scale(esc, esc); ctx.globalAlpha = alfa;
  ctx.textBaseline = 'middle'; ctx.textAlign = tx.alinh;
  const ax = tx.alinh === 'left' ? -larg / 2 : tx.alinh === 'right' ? larg / 2 : 0;
  let conta = 0, contaP = 0;
  linhas.forEach((l, k) => {
    const y = -alt / 2 + lh * (k + .5), w = ctx.measureText(l).width;
    let vis = l; if (corte < Infinity) { vis = l.slice(0, Math.max(0, corte - conta)); conta += l.length + 1; }
    if (palavrasVis < Infinity) { const ps = l.split(' '); vis = ps.slice(0, Math.max(0, palavrasVis - contaP)).join(' '); contaP += ps.length; }
    if (!vis) return;
    const x0 = tx.alinh === 'left' ? -larg / 2 : tx.alinh === 'right' ? larg / 2 - w : -w / 2;
    if (tx.estilo.startsWith('caixa')) { ctx.fillStyle = tx.estilo === 'caixa' ? 'rgba(0,0,0,.62)' : tx.estilo === 'caixaClara' ? 'rgba(255,255,255,.92)' : tx.cor2;
      const pad = tx.tam * .28; rr(x0 - pad, y - lh / 2 + tx.tam * .04, w + pad * 2, lh - tx.tam * .02, tx.tam * .22); }
    ctx.fillStyle = tx.cor;
    if (tx.estilo === 'sombra') { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = tx.tam * .22; ctx.shadowOffsetY = tx.tam * .04; }
    if (tx.estilo === 'contorno') { ctx.lineJoin = 'round'; ctx.lineWidth = tx.tam * .16; ctx.strokeStyle = tx.cor2; ctx.strokeText(vis, ax, y); }
    ctx.fillText(vis, ax, y); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  });
  ctx.restore();
}

/* ---------- legenda palavra por palavra ---------- */
function grupos() {
  const G = [], ppl = P.leg.ppl; let g = null;
  P.palavras.forEach((w, i) => {
    const ant = P.palavras[i - 1], quebra = !g || g.ps.length >= ppl || (ant && w.de - ant.ate > .7) || (ant && /[.!?…]$/.test(ant.w));
    if (quebra) { g = { ps: [], i0: i }; G.push(g); } g.ps.push(w);
  });
  G.forEach((g, k) => { g.de = g.ps[0].de; const prox = G[k + 1]; g.ate = Math.min(prox ? prox.ps[0].de : Infinity, g.ps[g.ps.length - 1].ate + .35); });
  return G;
}
function desenharLegenda(t) {
  if (!P.palavras.length) return;
  const g = grupos().find(g => t >= g.de && t < g.ate); if (!g) return;
  const L = P.leg, ed = L.estilo === 'editorial', fi = ed ? 8 : L.fonte, tam = L.tam;
  ctx.save(); ctx.font = fonteCss(fi, tam); ctx.textBaseline = 'middle';
  const sep = ctx.measureText(' ').width + (L.estilo === 'reels' || L.estilo === 'karaoke' ? tam * .2 : L.estilo === 'caixa' ? tam * .3 : 0), palavras = g.ps.map(w => ({ ...w, s: L.caixaAlta && !ed ? w.w.toUpperCase() : w.w }));
  palavras.forEach(w => w.lw = ctx.measureText(w.s).width);
  const linhas = [[]]; let lw = 0; const max = W * .84;
  for (const w of palavras) { if (lw && lw + sep + w.lw > max) { linhas.push([]); lw = 0; } linhas[linhas.length - 1].push(w); lw += (lw ? sep : 0) + w.lw; }
  const lh = tam * 1.22, y0 = L.y * H - (linhas.length - 1) * lh / 2, entra = clamp((t - g.de) / .12, 0, 1);
  ctx.translate(W / 2, y0); const esc = .9 + .1 * entra; ctx.scale(esc, esc); ctx.globalAlpha = entra;
  linhas.forEach((ln, k) => {
    const tot = ln.reduce((s, w) => s + w.lw, 0) + sep * (ln.length - 1); let x = -tot / 2; const y = k * lh;
    for (const w of ln) {
      const ativa = t >= w.de && t < w.ate + .02, dita = t >= w.de;
      ctx.save(); ctx.translate(x + w.lw / 2, y);
      if (L.estilo === 'reels') { if (ativa) ctx.scale(1.08, 1.08); ctx.lineJoin = 'round'; ctx.lineWidth = tam * .17; ctx.strokeStyle = '#000'; ctx.textAlign = 'center'; ctx.strokeText(w.s, 0, 0); ctx.fillStyle = ativa ? L.corAtiva : L.cor; ctx.fillText(w.s, 0, 0); }
      else if (L.estilo === 'caixa') { ctx.textAlign = 'center'; if (ativa) { ctx.fillStyle = L.corAtiva; rr(-w.lw / 2 - tam * .18, -tam * .62, w.lw + tam * .36, tam * 1.2, tam * .2); }
        ctx.shadowColor = ativa ? 'transparent' : 'rgba(0,0,0,.6)'; ctx.shadowBlur = tam * .2; ctx.fillStyle = ativa ? '#111' : L.cor; ctx.fillText(w.s, 0, 0); }
      else if (L.estilo === 'karaoke') { ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = tam * .14; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(w.s, 0, 0); ctx.fillStyle = dita ? L.corAtiva : L.cor; ctx.fillText(w.s, 0, 0); }
      else { ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = tam * .25; ctx.globalAlpha *= L.estilo === 'limpa' && !dita ? .45 : 1; ctx.fillStyle = L.cor; ctx.fillText(w.s, 0, 0); }
      ctx.restore(); x += w.lw + sep;
    }
  });
  ctx.restore();
}

/* ================= áudio (o mesmo grafo toca a prévia e gera o arquivo) ================= */
function agendarAudio(ac, tIni, quando, saida, { semMusica = false } = {}) {
  const fontes = [];
  for (const l of layout()) {
    const c = l.c, m = M[c.media], b = m && m.buf; if (!b || c.vol <= 0) continue;
    const fimL = l.ini + l.d; if (fimL <= tIni) continue;
    const s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = c.vel;
    const g = ac.createGain(); s.connect(g); g.connect(saida);
    const atraso = Math.max(0, l.ini - tIni), off = c.ini + Math.max(0, tIni - l.ini) * c.vel, durSrc = Math.max(0.01, c.fim - off);
    const t0 = quando + atraso, tl0 = Math.max(l.ini, tIni);
    // envelope: fades do take e cruzamento com a transição
    const fIn = Math.max(c.fIn, l.i > 0 ? layout()[l.i - 1].ov : 0), fOut = Math.max(c.fOut, l.ov);
    const nivel = tt => { const r = tt - l.ini, a = fIn ? clamp(r / fIn, 0, 1) : 1, z = fOut ? clamp((l.d - r) / fOut, 0, 1) : 1; return c.vol * Math.min(a, z); };
    g.gain.setValueAtTime(nivel(tl0), t0);
    for (let k = 1; k <= 24; k++) { const tt = tl0 + (fimL - tl0) * k / 24; g.gain.linearRampToValueAtTime(nivel(tt), quando + (tt - tIni)); }
    s.start(t0, off, durSrc); fontes.push(s);
  }
  const mu = P.musica, mb = mu && M[mu.media] && M[mu.media].buf;
  if (!semMusica && mb) {
    const fimM = Math.min(total(), mu.de + mu.dur);
    if (fimM > tIni) {
      const s = ac.createBufferSource(); s.buffer = mb; const g = ac.createGain(); s.connect(g); g.connect(saida);
      const atraso = Math.max(0, mu.de - tIni), off = mu.ini + Math.max(0, tIni - mu.de), t0 = quando + atraso, tl0 = Math.max(mu.de, tIni);
      const nivel = tt => { const r = tt - mu.de, a = mu.fIn ? clamp(r / mu.fIn, 0, 1) : 1, z = mu.fOut ? clamp((fimM - tt) / mu.fOut, 0, 1) : 1; return mu.vol * Math.min(a, z); };
      g.gain.setValueAtTime(nivel(tl0), t0);
      for (let k = 1; k <= 24; k++) { const tt = tl0 + (fimM - tl0) * k / 24; g.gain.linearRampToValueAtTime(nivel(tt), quando + (tt - tIni)); }
      s.start(t0, off, Math.max(0.01, fimM - tl0)); fontes.push(s);
    }
  }
  return fontes;
}
async function prepararAudio() {
  const faltam = [...new Set([...P.clipes.map(c => c.media), P.musica?.media].filter(Boolean))].filter(id => M[id] && M[id].buf === undefined);
  if (!faltam.length) return; status('Preparando o som…', false, 0);
  for (const id of faltam) await bufDe(M[id]); status('');
}

/* ================= reprodução ================= */
let AC = null, fontesAtivas = [], relogio = null, raf = 0;
async function tocar() {
  if (!P.clipes.length || st.tocando) return;
  if (st.t >= total() - 0.04) st.t = 0;
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  try { await AC.resume(); } catch {}
  st.tocando = true; botaoPlay();
  await prepararAudio(); if (!st.tocando) return;
  const quando = AC.currentTime + 0.08;
  fontesAtivas = agendarAudio(AC, st.t, quando, AC.destination);
  relogio = { ac: quando, t: st.t };
  const passo = () => {
    if (!st.tocando) return;
    const t = relogio.t + Math.max(0, AC.currentTime - relogio.ac), T = total();
    if (t >= T) { st.t = T; parar(); irPara(T); return; }
    st.t = t; sincronizarVideos(t); desenhar(t); rolarTL(t);
    raf = requestAnimationFrame(passo);
  };
  raf = requestAnimationFrame(passo);
}
function sincronizarVideos(t) {
  const cs = camadas(t), ativos = new Set(cs.map(l => l.c.id));
  for (const l of cs) { const v = videoDe(l.c); v.playbackRate = l.c.vel;
    if (v.paused) { v.currentTime = l.local; v.play().catch(() => {}); }
    else if (Math.abs(v.currentTime - l.local) > 0.25) v.currentTime = l.local; }
  for (const l of layout()) { if (ativos.has(l.c.id)) continue; const v = V[l.c.id]; if (!v) continue;
    if (!v.paused) v.pause();
    if (l.ini > t && l.ini - t < 0.8 && Math.abs(v.currentTime - l.c.ini) > 0.05 && !v.seeking) v.currentTime = l.c.ini; }
}
function parar() {
  st.tocando = false; cancelAnimationFrame(raf);
  fontesAtivas.forEach(s => { try { s.stop(); } catch {} }); fontesAtivas = [];
  Object.values(V).forEach(v => v.pause()); botaoPlay();
}
function botaoPlay() { $('play').innerHTML = ic(st.tocando ? 'pause' : 'play'); $('play').title = st.tocando ? 'Pausar' : 'Tocar'; }
function irPara(t, rolar = true) {
  st.t = clamp(t, 0, total());
  for (const l of camadas(st.t)) { const v = videoDe(l.c); if (!v.paused) v.pause(); if (Math.abs(v.currentTime - l.local) > 0.01) v.currentTime = l.local; }
  if (rolar) rolarTL(st.t); desenhar();
}
function atualizarTempo() { $('tempo').textContent = fmtT(st.t) + ' / ' + fmtT(total()); }

/* ================= linha do tempo ================= */
const tl = $('tl'), tli = $('tli');
let rolandoProg = false, pad = 0;
function rolarTL(t) { rolandoProg = true; tl.scrollLeft = t * st.pps; requestAnimationFrame(() => rolandoProg = false); }
tl.addEventListener('scroll', () => {
  if (rolandoProg || arrasteTL) return;
  if (st.tocando) parar();
  if (rolarRaf) return; rolarRaf = requestAnimationFrame(() => { rolarRaf = 0; irPara(tl.scrollLeft / st.pps, false); });
}, { passive: true });
let rolarRaf = 0;
function desenharTL() {
  pad = Math.round(tl.clientWidth / 2); const T = total(), L = layout(), pps = st.pps;
  const larg = pad * 2 + T * pps + 60; tli.style.width = larg + 'px';
  const passo = pps >= 160 ? 1 : pps >= 60 ? 2 : pps >= 30 ? 5 : 10;
  let h = '<div class="regua">';
  for (let s = 0; s <= T + 1e-6; s += passo) h += `<span style="left:${pad + s * pps}px">${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}</span>`;
  h += '</div>';
  for (const l of L) {
    const c = l.c, m = M[c.media], w = Math.max(8, l.d * pps), x = pad + l.ini * pps, sel = st.sel?.tipo === 'clipe' && st.sel.id === c.id;
    let imgs = '';
    if (m && m.thumbs.length) { const n = Math.ceil(w / 40);
      for (let k = 0; k < n; k++) { const ts = c.ini + ((k + .5) * 40 / pps) * c.vel; let best = m.thumbs[0]; for (const th of m.thumbs) if (Math.abs(th.t - ts) < Math.abs(best.t - ts)) best = th; imgs += `<img src="${best.src}" alt="">`; } }
    h += `<div class="bloco v${sel ? ' sel' : ''}" data-tipo="clipe" data-id="${c.id}" style="left:${x}px;width:${w}px">${imgs}<span class="rot">${fmt(l.d)}s${c.vel !== 1 ? ' · ' + c.vel + 'x' : ''}${c.vol === 0 ? ' · mudo' : ''}</span><div class="alca e" data-alca="e"></div><div class="alca d" data-alca="d"></div></div>`;
    if (l.i < L.length - 1) { const xb = pad + (L[l.i + 1].ini + l.ov / 2) * pps; h += `<button class="trans${c.tr.tipo !== 'nenhuma' ? ' on' : ''}" data-tr="${c.id}" style="left:${xb}px" title="Transição">${ic('transicao')}</button>`; }
  }
  h += `<button class="addcl" id="addFim" style="left:${pad + T * pps + 12}px" title="Adicionar vídeos">${ic('mais')}</button>`;
  for (const tx of P.textos) { const sel = st.sel?.tipo === 'texto' && st.sel.id === tx.id;
    h += `<div class="bloco t${sel ? ' sel' : ''}" data-tipo="texto" data-id="${tx.id}" style="left:${pad + tx.de * pps}px;width:${Math.max(16, (tx.ate - tx.de) * pps)}px">${esc(tx.texto.split('\n')[0]) || 'Texto'}<div class="alca e" data-alca="e"></div><div class="alca d" data-alca="d"></div></div>`; }
  if (P.palavras.length) { const G = grupos(), sel = st.sel?.tipo === 'legenda';
    for (const g of G) h += `<div class="bloco t leg${sel ? ' sel' : ''}" data-tipo="legenda" style="top:112px;height:18px;padding:2px 6px;font-size:10px;left:${pad + g.de * pps}px;width:${Math.max(6, (g.ate - g.de) * pps - 2)}px">${esc(g.ps.map(w => w.w).join(' '))}</div>`; }
  if (P.musica) { const mu = P.musica, sel = st.sel?.tipo === 'musica';
    h += `<div class="bloco m${sel ? ' sel' : ''}" data-tipo="musica" style="top:132px;height:18px;padding:2px 18px;font-size:10px;left:${pad + mu.de * pps}px;width:${Math.max(16, mu.dur * pps)}px">♪ ${esc(M[mu.media]?.nome || 'música')}<div class="alca e" data-alca="e"></div><div class="alca d" data-alca="d"></div></div>`; }
  tli.innerHTML = h;
  $('addFim').onclick = () => { inserirEm = null; $('arqMais').click(); };
  rolarTL(st.t);
}
// toque e arraste nos blocos
let arrasteTL = null;
tli.addEventListener('pointerdown', e => {
  const tr = e.target.closest('[data-tr]'); if (tr) { selecionar({ tipo: 'clipe', id: tr.dataset.tr }); abrirPainel('transicao'); return; }
  const b = e.target.closest('.bloco'); if (!b) return;
  const tipo = b.dataset.tipo, alca = e.target.dataset.alca, id = b.dataset.id;
  const obj = tipo === 'clipe' ? P.clipes.find(c => c.id === id) : tipo === 'texto' ? P.textos.find(t => t.id === id) : tipo === 'musica' ? P.musica : null;
  const jaSel = st.sel && st.sel.tipo === tipo && (tipo === 'legenda' || tipo === 'musica' || st.sel.id === id);
  if (!jaSel) { selecionar(tipo === 'legenda' ? { tipo } : tipo === 'musica' ? { tipo } : { tipo, id }); if (tipo === 'legenda') abrirPainel('legenda'); }
  if (!obj || (!alca && tipo === 'clipe') || (!jaSel && !alca)) return;
  e.preventDefault(); tl.style.touchAction = 'none';
  arrasteTL = { x0: e.clientX, obj, tipo, alca, orig: JSON.parse(JSON.stringify(obj)), id: e.pointerId, mexeu: false };
  b.setPointerCapture && b.setPointerCapture(e.pointerId);
});
window.addEventListener('pointermove', e => {
  const a = arrasteTL; if (!a || e.pointerId !== a.id) return;
  const dt = (e.clientX - a.x0) / st.pps; if (Math.abs(e.clientX - a.x0) > 2) a.mexeu = true;
  const o = a.obj, g = a.orig;
  if (a.tipo === 'clipe') { const m = M[o.media];
    if (a.alca === 'e') { o.ini = clamp(g.ini + dt * o.vel, 0, o.fim - 0.2); prevAlca(o, o.ini); }
    else { o.fim = clamp(g.fim + dt * o.vel, o.ini + 0.2, m.dur); prevAlca(o, o.fim - 0.02); } }
  else if (a.tipo === 'texto') {
    if (a.alca === 'e') o.de = clamp(g.de + dt, 0, o.ate - .2); else if (a.alca === 'd') o.ate = Math.max(o.de + .2, g.ate + dt);
    else { const d = g.ate - g.de; o.de = Math.max(0, g.de + dt); o.ate = o.de + d; } }
  else if (a.tipo === 'musica') { const md = M[o.media].dur;
    if (a.alca === 'e') { const d = clamp(dt, -g.ini, g.dur - .5); o.ini = g.ini + d; o.de = Math.max(0, g.de + d); o.dur = g.dur - d; }
    else if (a.alca === 'd') o.dur = clamp(g.dur + dt, .5, md - o.ini);
    else o.de = Math.max(0, g.de + dt); }
  desenharTL();
});
function prevAlca(c, ts) { const v = videoDe(c); v.currentTime = ts; v.onseeked = () => { v.onseeked = () => pedirDesenho(); const L = layout().find(l => l.c.id === c.id); if (L) { st.t = L.ini + (ts - c.ini) / c.vel; desenhar(); } }; }
window.addEventListener('pointerup', e => { const a = arrasteTL; if (!a || e.pointerId !== a.id) return; arrasteTL = null; tl.style.touchAction = '';
  if (a.mexeu) { commit(); desenharTL(); irPara(st.t); atualizarPainel(); } });
window.addEventListener('pointercancel', () => { arrasteTL = null; tl.style.touchAction = ''; });
tl.addEventListener('click', e => { if (!e.target.closest('.bloco,.trans,.addcl') && st.sel) selecionar(null); });
// pinça na linha do tempo muda o zoom
let pincaTL = null;
tl.addEventListener('touchstart', e => { if (e.touches.length === 2) pincaTL = { d: Math.abs(e.touches[0].clientX - e.touches[1].clientX), pps: st.pps }; }, { passive: true });
tl.addEventListener('touchmove', e => { if (pincaTL && e.touches.length === 2) { const d = Math.abs(e.touches[0].clientX - e.touches[1].clientX); st.pps = clamp(pincaTL.pps * d / Math.max(20, pincaTL.d), 12, 400); desenharTL(); } }, { passive: true });
tl.addEventListener('touchend', () => { pincaTL = null; }, { passive: true });
tl.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); st.pps = clamp(st.pps * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 12, 400); desenharTL(); } }, { passive: false });
$('zoomTl').onclick = () => { const z = [30, 60, 120, 240]; st.pps = z[(z.findIndex(v => v >= st.pps - 1) + 1) % z.length]; desenharTL(); };

/* ================= gestos na prévia ================= */
const ptrs = new Map(); let gesto = null, ultimoToque = 0;
function ptCanvas(e) { const r = tela.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
function textoEm(p) {
  for (let k = hits.length - 1; k >= 0; k--) { const h = hits[k], dx = p.x - h.cx, dy = p.y - h.cy, co = Math.cos(-h.rot), si = Math.sin(-h.rot);
    const lx = dx * co - dy * si, ly = dx * si + dy * co; if (Math.abs(lx) <= h.w / 2 + 40 && Math.abs(ly) <= h.h / 2 + 30) return h.id; }
  return null;
}
tela.addEventListener('pointerdown', e => {
  if (st.exportando) return; tela.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, ptCanvas(e));
  if (st.tocando) parar();
  if (ptrs.size === 1) {
    const p = ptCanvas(e), idT = textoEm(p), agora = performance.now();
    if (idT) { const tx = P.textos.find(t => t.id === idT); selecionar({ tipo: 'texto', id: idT });
      if (agora - ultimoToque < 320) { abrirPainel('editarTexto'); setTimeout(() => { const ta = $('pTexto'); ta && (ta.focus(), ta.select()); }, 50); }
      gesto = { alvo: 'texto', o: tx, ini: { x: tx.x, y: tx.y, tam: tx.tam, rot: tx.rot }, p0: p }; }
    else { const cs = camadas(st.t), l = cs[cs.length - 1];
      if (l) { if (!(st.sel?.tipo === 'clipe' && st.sel.id === l.c.id)) selecionar({ tipo: 'clipe', id: l.c.id }); gesto = { alvo: 'clipe', o: l.c, ini: { x: l.c.x, y: l.c.y, zoom: l.c.zoom, rot: l.c.rot }, p0: p }; }
      else if (st.sel) selecionar(null); }
    ultimoToque = agora;
  } else if (ptrs.size === 2 && gesto) {
    const [a, b] = [...ptrs.values()]; gesto.d0 = Math.hypot(b.x - a.x, b.y - a.y); gesto.a0 = Math.atan2(b.y - a.y, b.x - a.x);
    gesto.c0 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; gesto.ini = { x: gesto.o.x, y: gesto.o.y, tam: gesto.o.tam, zoom: gesto.o.zoom, rot: gesto.o.rot };
  }
});
tela.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId) || !gesto) return; ptrs.set(e.pointerId, ptCanvas(e));
  const g = gesto, o = g.o, ps = [...ptrs.values()]; g.mexeu = true; st.guias = null;
  if (ps.length === 1 && g.d0 === undefined) {
    const p = ps[0], dx = (p.x - g.p0.x) / W, dy = (p.y - g.p0.y) / H;
    let nx = g.ini.x + dx, ny = g.ini.y + dy;
    if (g.alvo === 'texto') { st.guias = {}; if (Math.abs(nx - .5) < .02) { nx = .5; st.guias.v = 1; } if (Math.abs(ny - .5) < .015) { ny = .5; st.guias.h = 1; } }
    else { st.guias = {}; if (Math.abs(nx) < .015) { nx = 0; st.guias.v = 1; } if (Math.abs(ny) < .01) { ny = 0; st.guias.h = 1; } }
    o.x = nx; o.y = ny;
  } else if (ps.length >= 2 && g.d0) {
    const [a, b] = ps, d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x), c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    let rot = g.ini.rot + (ang - g.a0) * 180 / Math.PI; for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(rot - s) < 4) rot = s;
    o.rot = rot; o.x = g.ini.x + (c.x - g.c0.x) / W; o.y = g.ini.y + (c.y - g.c0.y) / H;
    if (g.alvo === 'texto') o.tam = clamp(g.ini.tam * d / g.d0, 20, 400); else o.zoom = clamp(g.ini.zoom * d / g.d0, .3, 6);
  }
  pedirDesenhoLivre(); atualizarPainelLeve();
});
let livre = 0; function pedirDesenhoLivre() { if (livre) return; livre = requestAnimationFrame(() => { livre = 0; desenhar(); }); }
function soltar(e) { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if (ptrs.size === 0) { const m = gesto && gesto.mexeu; gesto = null; st.guias = null; if (m) { commit(); atualizarPainel(); } desenhar(); }
  else if (gesto) { gesto.d0 = undefined; const p = [...ptrs.values()][0]; gesto.p0 = p; gesto.ini = { x: gesto.o.x, y: gesto.o.y, tam: gesto.o.tam, zoom: gesto.o.zoom, rot: gesto.o.rot }; } }
tela.addEventListener('pointerup', soltar); tela.addEventListener('pointercancel', soltar);
tela.addEventListener('wheel', e => { const s = st.sel; if (!s) return; e.preventDefault();
  const o = s.tipo === 'texto' ? P.textos.find(t => t.id === s.id) : s.tipo === 'clipe' ? P.clipes.find(c => c.id === s.id) : null; if (!o) return;
  const f = e.deltaY < 0 ? 1.05 : 1 / 1.05; if (e.altKey) o.rot += e.deltaY < 0 ? 2 : -2; else if (s.tipo === 'texto') o.tam = clamp(o.tam * f, 20, 400); else o.zoom = clamp(o.zoom * f, .3, 6);
  desenhar(); clearTimeout(o._w); o._w = setTimeout(commit, 400); }, { passive: false });

/* ================= seleção, ferramentas e painéis ================= */
const selObj = () => { const s = st.sel; if (!s) return null; if (s.tipo === 'clipe') return P.clipes.find(c => c.id === s.id); if (s.tipo === 'texto') return P.textos.find(t => t.id === s.id); if (s.tipo === 'musica') return P.musica; return null; };
function selecionar(s) { st.sel = s; if (st.painel && !painelServe(st.painel)) fecharPainel(); desenharTL(); desenharFerramentas(); pedirDesenho(); }
const PAINEIS_DE = { clipe: ['velocidade', 'volume', 'enquadrar', 'cor', 'transicao'], texto: ['editarTexto', 'fonte', 'estiloTexto', 'corTexto', 'animacao'], legenda: ['legenda'], musica: ['musica'] };
function painelServe(p) { const t = st.sel?.tipo; if (!t) return ['legenda', 'formato', 'musica', 'projeto', 'exportar'].includes(p); return (PAINEIS_DE[t] || []).includes(p) || p === 'exportar'; }
function fb(id, icone, nome, extra = '') { return `<button class="fb${st.painel === id ? ' on' : ''} ${extra}" data-f="${id}">${ic(icone)}<span>${nome}</span></button>`; }
function desenharFerramentas() {
  const t = st.sel?.tipo; let h = '';
  if (!t) h = fb('addVideo', 'video', 'Vídeos') + fb('addTexto', 'texto', 'Texto') + fb('legenda', 'legenda', 'Legendas') + fb('musica', 'musica', 'Música') + fb('formato', 'formato', 'Formato') + fb('projeto', 'novo', 'Projeto');
  else { h = `<button class="fb volta" data-f="desmarcar">${ic('voltar')}</button>`;
    if (t === 'clipe') h += fb('dividir', 'dividir', 'Dividir') + fb('velocidade', 'velocidade', 'Velocidade') + fb('volume', 'volume', 'Volume') + fb('enquadrar', 'enquadrar', 'Enquadrar') + fb('cor', 'cor', 'Cor') + fb('transicao', 'transicao', 'Transição') + fb('duplicar', 'duplicar', 'Duplicar') + fb('moverE', 'esq', 'Mover') + fb('moverD', 'dir', 'Mover') + fb('inserir', 'mais', 'Inserir') + fb('apagar', 'apagar', 'Apagar', 'perigo');
    if (t === 'texto') h += fb('editarTexto', 'editar', 'Editar') + fb('fonte', 'fonte', 'Fonte') + fb('estiloTexto', 'estilo', 'Estilo') + fb('corTexto', 'cor', 'Cor') + fb('animacao', 'animacao', 'Animação') + fb('duplicar', 'duplicar', 'Duplicar') + fb('apagar', 'apagar', 'Apagar', 'perigo');
    if (t === 'legenda') h += fb('legenda', 'legenda', 'Legendas') + fb('apagar', 'apagar', 'Apagar todas', 'perigo');
    if (t === 'musica') h += fb('musica', 'musica', 'Música') + fb('apagar', 'apagar', 'Apagar', 'perigo'); }
  $('ferr').innerHTML = h;
}
$('ferr').onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; acao(b.dataset.f); };
let apagarProjetoArmado = 0;
function acao(f) {
  const o = selObj(), t = st.sel?.tipo;
  if (f === 'desmarcar') return selecionar(null);
  if (f === 'addVideo') { inserirEm = null; return $('arqMais').click(); }
  if (f === 'inserir') { inserirEm = P.clipes.indexOf(o) + 1; return $('arqMais').click(); }
  if (f === 'addTexto') return novoTexto();
  if (f === 'dividir') return dividir();
  if (f === 'duplicar') { if (t === 'clipe') { const c = JSON.parse(JSON.stringify(o)); c.id = novoId('c'); P.clipes.splice(P.clipes.indexOf(o) + 1, 0, c); selecionar({ tipo: 'clipe', id: c.id }); }
    else if (t === 'texto') { const c = JSON.parse(JSON.stringify(o)); c.id = novoId('t'); c.y = clamp(c.y + .06, .05, .95); P.textos.push(c); selecionar({ tipo: 'texto', id: c.id }); }
    commit(); return atualizarTudo(); }
  if (f === 'moverE' || f === 'moverD') { const i = P.clipes.indexOf(o), j = i + (f === 'moverE' ? -1 : 1); if (j < 0 || j >= P.clipes.length) return;
    [P.clipes[i], P.clipes[j]] = [P.clipes[j], P.clipes[i]]; commit(); atualizarTudo(); const L = layout().find(l => l.c.id === o.id); return irPara(L.ini + .01); }
  if (f === 'apagar') {
    if (t === 'clipe') { P.clipes.splice(P.clipes.indexOf(o), 1); limparVideos(); }
    else if (t === 'texto') P.textos.splice(P.textos.indexOf(o), 1);
    else if (t === 'legenda') P.palavras = [];
    else if (t === 'musica') P.musica = null;
    st.sel = null; fecharPainel(); commit(); atualizarTudo(); return irPara(st.t);
  }
  if (st.painel === f) return fecharPainel();
  abrirPainel(f);
}
function fecharPainel() { document.querySelector('.app').classList.remove('compacto'); st.painel = null; $('painel').hidden = true; $('painel').innerHTML = ''; desenharFerramentas(); }
function abrirPainel(f) { document.querySelector('.app').classList.add('compacto'); st.painel = f; $('painel').hidden = false; atualizarPainel(); desenharFerramentas(); }
const sl = (k, nome, min, max, passo, val, fmtv = v => Math.round(v * 100)) => `<label class="sl"><span>${nome}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${passo}" value="${val}"><output>${fmtv(+val)}</output></label>`;
const chips = (k, itens, atual) => `<div class="chips">${itens.map(([v, n]) => `<button class="chip${String(v) === String(atual) ? ' on' : ''}" data-c="${k}" data-v="${v}">${n}</button>`).join('')}</div>`;
const paleta = (k, atual) => `<div class="cores">${CORES.map(c => `<button class="cor${c === atual ? ' on' : ''}" data-cor="${k}" data-v="${c}" style="background:${c}"></button>`).join('')}<input type="color" data-k="${k}" value="${atual}"></div>`;
function atualizarPainel() {
  const f = st.painel; if (!f) return; const o = selObj(), el = $('painel'); let h = '';
  if (f === 'velocidade' && o) h = `<h4>Velocidade</h4>${chips('vel', [.25, .5, .75, 1, 1.25, 1.5, 2, 3].map(v => [v, v + 'x']), o.vel)}${sl('vel', 'Ajuste fino', .25, 4, .05, o.vel, v => v.toFixed(2) + 'x')}<p class="nota">Câmera lenta suave depende de o take ter sido gravado em 60 ou 120 quadros por segundo.</p>`;
  else if (f === 'volume' && o) h = `<h4>Volume do take</h4>${chips('volP', [[0, 'Mudo'], [.5, '50%'], [1, '100%'], [1.5, '150%']], o.vol)}${sl('vol', 'Volume', 0, 2, .05, o.vol, v => Math.round(v * 100) + '%')}${sl('fIn', 'Entrar suave', 0, 2, .1, o.fIn, v => fmt(v) + 's')}${sl('fOut', 'Sair suave', 0, 2, .1, o.fOut, v => fmt(v) + 's')}`;
  else if (f === 'enquadrar' && o) h = `<h4>Enquadrar <button data-b="todosEnq">Aplicar a todos</button></h4>${chips('modo', [['preencher', 'Preencher a tela'], ['ajustar', 'Vídeo inteiro']], o.modo)}${o.modo === 'ajustar' ? chips('fundo', [['video', 'Fundo desfocado'], ['preto', 'Fundo preto'], ['branco', 'Fundo branco']], o.fundo) : ''}
    ${sl('zoom', 'Zoom', .3, 4, .01, o.zoom, v => v.toFixed(2) + 'x')}${sl('x', 'Horizontal', -1, 1, .005, o.x)}${sl('y', 'Vertical', -1, 1, .005, o.y)}${sl('rot', 'Girar', -180, 180, .5, o.rot, v => Math.round(v) + '°')}
    <div class="row2"><button data-b="centrar">Centralizar</button><button data-b="girar90">Girar 90°</button></div><p class="nota">Na prévia: arraste para mover, pinça para aproximar e girar com dois dedos.</p>`;
  else if (f === 'cor' && o) h = `<h4>Cor <span><button data-b="zerarCor">Zerar</button> <button data-b="todosCor">Aplicar a todos</button></span></h4><div class="looks" id="looks">${LOOKS.map((l, i) => `<button class="look${o.look === i ? ' on' : ''}" data-look="${i}"><canvas width="96" height="126"></canvas>${l[0]}</button>`).join('')}</div>${AJUSTES.map(([k, n, a, b]) => sl('adj.' + k, n, a, b, .01, o.adj[k] || 0)).join('')}`;
  else if (f === 'transicao' && o) { const i = P.clipes.indexOf(o);
    h = i >= P.clipes.length - 1 ? `<h4>Transição</h4><p class="nota">A transição fica entre este take e o próximo. Este é o último.</p>` : `<h4>Transição para o take ${i + 2} <button data-b="todasTr">Aplicar a todas</button></h4>${chips('tr', TRANS, o.tr.tipo)}${sl('trd', 'Duração', .2, 1.5, .05, o.tr.d, v => fmt(v) + 's')}`; }
  else if (f === 'editarTexto' && o) h = `<h4>Texto</h4><textarea id="pTexto" rows="2" style="font-size:16px">${esc(o.texto)}</textarea>${chips('alinh', [['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']], o.alinh)}${chips('caixaAlta', [[false, 'Como digitado'], [true, 'CAIXA ALTA']], o.caixaAlta)}
    ${sl('tam', 'Tamanho', 20, 400, 1, o.tam, v => Math.round(v))}${sl('larg', 'Largura', .3, .96, .01, o.larg)}${sl('rotT', 'Girar', -180, 180, .5, o.rot, v => Math.round(v) + '°')}
    <div class="row2"><button data-b="deAqui">Começa aqui (${fmt(o.de)}s)</button><button data-b="ateAqui">Termina aqui (${fmt(o.ate)}s)</button></div><div class="row2"><button data-b="todoVideo">O vídeo todo</button><button data-b="centrarT">Centralizar</button></div>`;
  else if (f === 'fonte' && o) h = `<h4>Fonte</h4><div class="fontes">${FONTES.map((ft, i) => `<button class="fonte${o.fonte === i ? ' on' : ''}" data-fonte="${i}" style="font:${ft[1]} 18px '${ft[0]}'">${ft[2]}</button>`).join('')}</div>`;
  else if (f === 'estiloTexto' && o) h = `<h4>Estilo</h4>${chips('estilo', EST_TEXTO, o.estilo)}${['contorno', 'caixaCor'].includes(o.estilo) ? '<p class="nota" style="margin-top:10px">Cor do ' + (o.estilo === 'contorno' ? 'contorno' : 'fundo') + '</p>' + paleta('cor2', o.cor2) : ''}`;
  else if (f === 'corTexto' && o) h = `<h4>Cor do texto</h4>${paleta('cor', o.cor)}<p class="nota" style="margin-top:10px">Cor do contorno ou da caixa</p>${paleta('cor2', o.cor2)}`;
  else if (f === 'animacao' && o) h = `<h4>Entrada</h4>${chips('anim', ANIM_IN, o.anim)}<h4 style="margin-top:12px">Saída</h4>${chips('saida', [['nenhuma', 'Corte'], ['sumir', 'Sumir']], o.saida)}`;
  else if (f === 'legenda') { const L = P.leg;
    if (!P.palavras.length) h = `<h4>Legendas automáticas</h4><p class="nota">O app ouve os takes no próprio aparelho e escreve palavra por palavra, já no tempo da fala. Na primeira vez baixa o modelo de fala.</p>${chips('modelo', [['base', 'Rápida (~80 MB)'], ['small', 'Mais precisa (~250 MB)']], st.modelo || 'base')}<button class="exp" data-b="gerarLeg" style="width:100%;justify-content:center;margin-top:10px">${ic('legenda')} Gerar legendas</button>`;
    else h = `<h4>Legendas <span><button data-b="gerarLeg">Gerar de novo</button></span></h4>${chips('lEstilo', EST_LEG, L.estilo)}${chips('lppl', [[1, '1 palavra'], [2, '2'], [3, '3'], [4, '4'], [6, '6']], L.ppl)}
      ${sl('lTam', 'Tamanho', 40, 160, 1, L.tam, v => Math.round(v))}${sl('lY', 'Altura', .1, .92, .005, L.y)}${chips('lCaixa', [[true, 'CAIXA ALTA'], [false, 'Como falado']], L.caixaAlta)}
      <p class="nota" style="margin-top:10px">Cor do texto</p>${paleta('lCor', L.cor)}<p class="nota">Cor da palavra falada</p>${paleta('lCorAtiva', L.corAtiva)}
      ${L.estilo !== 'editorial' ? `<p class="nota">Fonte</p><div class="fontes">${FONTES.map((ft, i) => `<button class="fonte${L.fonte === i ? ' on' : ''}" data-lfonte="${i}" style="font:${ft[1]} 18px '${ft[0]}'">${ft[2]}</button>`).join('')}</div>` : ''}
      <h4 style="margin-top:14px">Corrigir o texto</h4><div class="leglist">${grupos().map((g, k) => `<div class="legit"><small>${fmt(g.de)}s</small><textarea rows="1" data-g="${k}">${esc(g.ps.map(w => w.w).join(' '))}</textarea></div>`).join('')}</div>`; }
  else if (f === 'musica') { const mu = P.musica;
    h = !mu ? `<h4>Música</h4><p class="nota">Escolha um arquivo de áudio (ou um vídeo, para usar só o som dele).</p><button class="exp" data-b="escolherMusica" style="width:100%;justify-content:center">${ic('musica')} Escolher música</button>`
      : `<h4>Música <button data-b="escolherMusica">Trocar</button></h4>${sl('mVol', 'Volume', 0, 1.5, .05, mu.vol, v => Math.round(v * 100) + '%')}${sl('mIn', 'Entrar suave', 0, 4, .1, mu.fIn, v => fmt(v) + 's')}${sl('mOut', 'Sair suave', 0, 6, .1, mu.fOut, v => fmt(v) + 's')}
        <div class="row2"><button data-b="mAqui">Começa aqui</button><button data-b="mBaixar">Baixar o som dos takes</button></div><p class="nota">Na linha do tempo: arraste a faixa para mudar onde entra; puxe as bordas para cortar.</p>`; }
  else if (f === 'formato') h = `<h4>Formato</h4>${chips('formato', Object.keys(FORMATOS).map(k => [k, k + (k === '9:16' ? ' · Reels e story' : k === '4:5' ? ' · feed' : k === '1:1' ? ' · quadrado' : ' · horizontal')]), P.formato)}`;
  else if (f === 'projeto') h = `<h4>Projeto</h4><p class="nota">O projeto fica guardado neste aparelho e volta sozinho quando você abrir o app.</p><button data-b="novoProj" class="${apagarProjetoArmado ? 'danger' : ''}" style="width:100%">${apagarProjetoArmado ? 'Toque de novo para começar do zero' : 'Começar projeto novo'}</button>`;
  el.innerHTML = `<button class="fecharP" data-b="fecharP" title="Fechar">${ic('ok')}</button>` + h;
  if (f === 'cor' && o) miniLooks(o);
}
function atualizarPainelLeve() { // durante o gesto, só os números do enquadramento/texto
  if (!st.painel || !['enquadrar', 'editarTexto'].includes(st.painel)) return; const o = selObj(); if (!o) return;
  $('painel').querySelectorAll('input[type=range]').forEach(r => { const k = r.dataset.k, v = k === 'rotT' ? o.rot : o[k]; if (v !== undefined) { r.value = v; } });
}
function miniLooks(c) {
  const v = V[c.id]; if (!v || !gl) return; const src = quadroDe(v, 0, 640); if (!src) return;
  const salva = c.adj;
  $('looks').querySelectorAll('canvas').forEach((cv, i) => {
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    pintarCamada(src, { ...c, adj: { ...ZERO, ...LOOKS[i][1] } }, {});
    const g = cv.getContext('2d'), s = Math.max(cv.width / W, cv.height / H); g.drawImage(glc, (cv.width - W * s) / 2, (cv.height - H * s) / 2, W * s, H * s);
  });
  c.adj = salva; desenhar();
}
$('painel').addEventListener('input', e => {
  const k = e.target.dataset.k, o = selObj();
  if (e.target.id === 'pTexto' && o) { o.texto = e.target.value; desenharTL(); pedirDesenho(); clearTimeout(st.tCommit); st.tCommit = setTimeout(commit, 600); return; }
  if (e.target.dataset.g !== undefined) { editarGrupo(+e.target.dataset.g, e.target.value); clearTimeout(st.tCommit); st.tCommit = setTimeout(() => { commit(); desenharTL(); }, 600); return; }
  if (!k) return;
  const v = e.target.type === 'range' ? +e.target.value : e.target.value;
  const out = e.target.parentElement.querySelector('output'); if (out) out.textContent = e.target.nextElementSibling?.textContent ?? '';
  if (k.startsWith('adj.')) { o.adj[k.slice(4)] = v; }
  else if (k === 'rotT') o.rot = v; else if (k === 'trd') o.tr.d = v;
  else if (k === 'lTam') P.leg.tam = v; else if (k === 'lY') P.leg.y = v;
  else if (k === 'mVol') P.musica.vol = v; else if (k === 'mIn') P.musica.fIn = v; else if (k === 'mOut') P.musica.fOut = v;
  else if (k === 'lCor' || k === 'lCorAtiva') P.leg[k === 'lCor' ? 'cor' : 'corAtiva'] = v;
  else if (o && k in o) o[k] = v;
  if (out) { const f = { vel: x => x.toFixed(2) + 'x', vol: x => Math.round(x * 100) + '%', zoom: x => x.toFixed(2) + 'x', rot: x => Math.round(x) + '°', rotT: x => Math.round(x) + '°', tam: x => Math.round(x), lTam: x => Math.round(x), mVol: x => Math.round(x * 100) + '%' }[k];
    out.textContent = f ? f(v) : ['fIn', 'fOut', 'trd', 'mIn', 'mOut'].includes(k) ? fmt(v) + 's' : Math.round(v * 100); }
  if (['vel', 'trd'].includes(k)) desenharTL();
  if (k === 'vel' || k === 'trd') irPara(st.t); else pedirDesenho();
  clearTimeout(st.tCommit); st.tCommit = setTimeout(commit, 500);
});
$('painel').addEventListener('click', e => {
  const o = selObj(), b = e.target.closest('button'); if (!b) return;
  if (b.dataset.c) { const k = b.dataset.c, raw = b.dataset.v, v = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
    if (k === 'volP') o.vol = v; else if (k === 'tr') o.tr.tipo = v; else if (k === 'formato') mudarFormato(v);
    else if (k === 'lEstilo') P.leg.estilo = v; else if (k === 'lppl') P.leg.ppl = v; else if (k === 'lCaixa') P.leg.caixaAlta = v; else if (k === 'modelo') st.modelo = v;
    else if (k === 'modo') { o.modo = v; o.zoom = 1; o.x = 0; o.y = 0; } else o[k] = v;
    commit(); atualizarPainel(); desenharTL(); irPara(st.t); return; }
  if (b.dataset.cor) { const k = b.dataset.cor, v = b.dataset.v; if (k === 'lCor') P.leg.cor = v; else if (k === 'lCorAtiva') P.leg.corAtiva = v; else o[k] = v; commit(); atualizarPainel(); pedirDesenho(); return; }
  if (b.dataset.look) { const i = +b.dataset.look; o.look = i; o.adj = { ...ZERO, ...LOOKS[i][1] }; commit(); atualizarPainel(); return; }
  if (b.dataset.fonte) { o.fonte = +b.dataset.fonte; commit(); atualizarPainel(); pedirDesenho(); return; }
  if (b.dataset.lfonte) { P.leg.fonte = +b.dataset.lfonte; commit(); atualizarPainel(); pedirDesenho(); return; }
  const a = b.dataset.b; if (!a) return;
  if (a === 'fecharP') return fecharPainel();
  if (a === 'centrar') { o.x = 0; o.y = 0; o.rot = 0; o.zoom = 1; }
  else if (a === 'girar90') o.rot = ((Math.round(o.rot / 90) * 90 + 90 + 180) % 360) - 180;
  else if (a === 'todosEnq') P.clipes.forEach(c => { c.modo = o.modo; c.fundo = o.fundo; c.zoom = o.zoom; c.x = o.x; c.y = o.y; c.rot = o.rot; });
  else if (a === 'zerarCor') { o.adj = { ...ZERO }; o.look = 0; }
  else if (a === 'todosCor') P.clipes.forEach(c => { c.adj = { ...o.adj }; c.look = o.look; });
  else if (a === 'todasTr') P.clipes.forEach(c => { c.tr = { ...o.tr }; });
  else if (a === 'deAqui') { o.de = Math.min(st.t, o.ate - .2); } else if (a === 'ateAqui') { o.ate = Math.max(st.t, o.de + .2); }
  else if (a === 'todoVideo') { o.de = 0; o.ate = total(); } else if (a === 'centrarT') { o.x = .5; o.y = .5; o.rot = 0; }
  else if (a === 'gerarLeg') return gerarLegendas();
  else if (a === 'escolherMusica') return $('arqMusica').click();
  else if (a === 'mAqui') P.musica.de = st.t;
  else if (a === 'mBaixar') P.clipes.forEach(c => c.vol = Math.min(c.vol, .35));
  else if (a === 'novoProj') { if (!apagarProjetoArmado) { apagarProjetoArmado = 1; setTimeout(() => { apagarProjetoArmado = 0; if (st.painel === 'projeto') atualizarPainel(); }, 4000); return atualizarPainel(); }
    apagarProjetoArmado = 0; parar(); Object.keys(V).forEach(k => { V[k].remove(); delete V[k]; }); P = novoProjeto(); hist = []; futuro = []; st.sel = null; fecharPainel(); dbLimpar(); commit(); atualizarTudo(); return irPara(0); }
  commit(); atualizarPainel(); desenharTL(); irPara(st.t);
});

function novoTexto() {
  const T = total(), de = T ? Math.min(st.t, Math.max(0, T - .5)) : 0, ate = T ? Math.min(T, de + 3) : 3;
  const tx = { id: novoId('t'), texto: 'Seu texto aqui', fonte: 0, tam: 92, cor: '#ffffff', cor2: '#000000', estilo: 'sombra', alinh: 'center', caixaAlta: false, larg: .84, x: .5, y: .3, rot: 0, anim: 'subir', saida: 'sumir', de, ate: ate > de + .2 ? ate : de + 3 };
  P.textos.push(tx); commit(); st.sel = { tipo: 'texto', id: tx.id }; abrirPainel('editarTexto'); desenharTL(); desenhar();
  setTimeout(() => { const ta = $('pTexto'); ta && (ta.focus(), ta.select()); }, 60);
}
function dividir() {
  const o = selObj(), L = layout().find(l => l.c.id === o.id); if (!L) return;
  const r = st.t - L.ini; if (r < .1 || r > L.d - .1) return status('Leve a agulha para dentro do take, longe das bordas, para dividir.', true);
  const s = o.ini + r * o.vel, n = JSON.parse(JSON.stringify(o)); n.id = novoId('c'); n.ini = s; o.fim = s; n.tr = o.tr; o.tr = { tipo: 'nenhuma', d: .5 };
  P.clipes.splice(P.clipes.indexOf(o) + 1, 0, n); commit(); selecionar({ tipo: 'clipe', id: n.id }); irPara(st.t); status('Take dividido.');
}
function mudarFormato(f) { P.formato = f; [W, H] = FORMATOS[f]; tela.width = W; tela.height = H; glc.width = W; glc.height = H; }

/* ---------- legenda automática ---------- */
let transcritor = null, modeloCarregado = null;
async function gerarLegendas() {
  if (!P.clipes.length) return status('Adicione os takes primeiro.', true);
  const modelo = st.modelo || 'base';
  try {
    progresso('Legendas', 'Preparando o som…', 0);
    await prepararAudio();
    const T = total(), oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.ceil(T * 16000) + 1, 16000);
    agendarAudio(oc, 0, 0, oc.destination, { semMusica: true }); const audio = (await oc.startRendering()).getChannelData(0);
    if (!transcritor || modeloCarregado !== modelo) {
      progresso('Legendas', 'Baixando o modelo de fala (só na primeira vez)…', 0);
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
      env.allowLocalModels = false;
      transcritor = await pipeline('automatic-speech-recognition', 'Xenova/whisper-' + modelo, { progress_callback: p => { if (p.status === 'progress' && p.total) progresso('Legendas', 'Baixando o modelo de fala…', p.loaded / p.total); } });
      modeloCarregado = modelo;
    }
    progresso('Legendas', 'Ouvindo os takes…', 1);
    let ws = [];
    try { const r = await transcritor(audio, { language: 'portuguese', task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
      ws = (r.chunks || []).map(c => ({ w: c.text.trim(), de: c.timestamp[0] ?? 0, ate: c.timestamp[1] ?? (c.timestamp[0] + .3) })).filter(w => w.w); }
    catch (e) { const r = await transcritor(audio, { language: 'portuguese', task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 });
      for (const c of (r.chunks || [{ text: r.text, timestamp: [0, T] }])) { const ps = c.text.trim().split(/\s+/).filter(Boolean), a = c.timestamp[0] || 0, b = c.timestamp[1] ?? Math.min(T, a + ps.length * .35);
        ps.forEach((w, k) => ws.push({ w, de: a + (b - a) * k / ps.length, ate: a + (b - a) * (k + 1) / ps.length })); } }
    ws.forEach(w => { w.ate = Math.max(w.ate, w.de + .08); });
    P.palavras = ws; progresso(); commit(); selecionar({ tipo: 'legenda' }); abrirPainel('legenda');
    status(ws.length ? ws.length + ' palavras na legenda. Toque no texto para corrigir.' : 'Não encontrei fala nos takes.', !ws.length, 5000);
  } catch (e) { progresso(); console.error(e); status('A legenda falhou: ' + (e.message || e), true, 6000); }
}
function editarGrupo(k, texto) {
  const g = grupos()[k]; if (!g) return; const ps = texto.trim().split(/\s+/).filter(Boolean), a = g.ps[0].de, b = g.ps[g.ps.length - 1].ate;
  const novas = ps.map((w, i) => ({ w, de: a + (b - a) * i / ps.length, ate: a + (b - a) * (i + 1) / ps.length }));
  if (ps.length === g.ps.length) novas.forEach((n, i) => { n.de = g.ps[i].de; n.ate = g.ps[i].ate; });
  P.palavras.splice(g.i0, g.ps.length, ...novas); pedirDesenho();
}

/* ---------- música ---------- */
$('arqMusica').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  status('Abrindo a música…', false, 0);
  try { const id = novoId('m'), m = { id, file: f, url: URL.createObjectURL(f), nome: f.name, thumbs: [], buf: undefined };
    M[id] = m; await bufDe(m); if (!m.buf) throw new Error('Não consegui ler o som desse arquivo.');
    m.dur = m.buf.duration; dbPut('midia:' + id, { file: f, nome: f.name, audio: true }).catch(() => {});
    P.musica = { media: id, de: 0, ini: 0, dur: Math.min(m.dur, Math.max(total(), 1)), vol: .8, fIn: .5, fOut: 1.5 };
    commit(); selecionar({ tipo: 'musica' }); abrirPainel('musica'); status('Música pronta.');
  } catch (er) { status(er.message, true); }
};

/* ================= desfazer, refazer e guardar ================= */
let hist = [], futuro = [], ultimo = '';
function commit() {
  const s = JSON.stringify(P); if (s === ultimo) return;
  if (ultimo) hist.push(ultimo); if (hist.length > 80) hist.shift(); futuro = []; ultimo = s; botoesHist(); salvarDepois();
}
function restaurar(s) { P = JSON.parse(s); ultimo = s; [W, H] = FORMATOS[P.formato]; tela.width = W; tela.height = H; glc.width = W; glc.height = H;
  if (st.sel && !selObj() && st.sel.tipo !== 'legenda') st.sel = null; limparVideos(); atualizarTudo(); irPara(st.t); salvarDepois(); }
$('desfazer').onclick = () => { if (!hist.length) return; futuro.push(ultimo); restaurar(hist.pop()); botoesHist(); };
$('refazer').onclick = () => { if (!futuro.length) return; hist.push(ultimo); restaurar(futuro.pop()); botoesHist(); };
function botoesHist() { $('desfazer').disabled = !hist.length; $('refazer').disabled = !futuro.length; }
let db = null;
function abrirDB() { if (db) return db; db = new Promise((ok, no) => { const r = indexedDB.open('media-studio-video', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); return db; }
async function dbPut(k, v) { const d = await abrirDB(); return new Promise((ok, no) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = ok; t.onerror = () => no(t.error); }); }
async function dbGet(k) { const d = await abrirDB(); return new Promise((ok, no) => { const r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); }
async function dbLimpar() { try { const d = await abrirDB(); d.transaction('kv', 'readwrite').objectStore('kv').clear(); } catch {} }
let tSalvar = 0; function salvarDepois() { clearTimeout(tSalvar); tSalvar = setTimeout(() => dbPut('projeto', JSON.stringify(P)).catch(() => {}), 700); }
async function reabrir() {
  try { const s = await dbGet('projeto'); if (!s) return; const p = JSON.parse(s); if (!p.clipes?.length && !p.textos?.length) return;
    status('Abrindo o projeto anterior…', false, 0);
    const ids = [...new Set([...p.clipes.map(c => c.media), p.musica?.media].filter(Boolean))];
    for (const id of ids) { const r = await dbGet('midia:' + id); if (!r) continue;
      try { if (r.audio) { const m = { id, file: r.file, url: URL.createObjectURL(r.file), nome: r.nome, thumbs: [], buf: undefined }; M[id] = m; await bufDe(m); m.dur = m.buf?.duration || 0; }
        else await adicionarMidia(r.file, false, id); } catch {} }
    p.clipes = p.clipes.filter(c => M[c.media]); if (p.musica && !M[p.musica.media]) p.musica = null;
    P = p; ultimo = JSON.stringify(P); [W, H] = FORMATOS[P.formato] || FORMATOS['9:16']; tela.width = W; tela.height = H; glc.width = W; glc.height = H;
    atualizarTudo(); irPara(0); status('Projeto anterior aberto.');
  } catch (e) { console.warn(e); status(''); }
}

/* ================= exportar ================= */
let cancelar = false;
function progresso(tit, txt, p) { const el = $('prog'); if (tit === undefined) { el.hidden = true; return; } el.hidden = false; $('progTit').textContent = tit; $('progTxt').textContent = txt || ''; $('progBar').style.width = Math.round((p || 0) * 100) + '%'; }
$('progCancel').onclick = () => { cancelar = true; };
async function carregarFontes() { const usadas = new Set([...P.textos.map(t => t.fonte), P.palavras.length ? (P.leg.estilo === 'editorial' ? 8 : P.leg.fonte) : null].filter(v => v !== null));
  await Promise.all([...usadas].map(i => document.fonts.load(fonteCss(i, 60)).catch(() => {}))); }
async function suportaWebCodecs() {
  if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined' || typeof VideoFrame === 'undefined') return null;
  let vc = null; for (const codec of ['avc1.640033', 'avc1.640028', 'avc1.4d0033', 'avc1.42003e']) { const c = { codec, width: W, height: H, bitrate: 14_000_000, framerate: 30, avc: { format: 'avc' } };
    try { if ((await VideoEncoder.isConfigSupported(c)).supported) { vc = c; break; } } catch {} }
  let ac = null; // AAC primeiro (Instagram e iPhone); Opus no MP4 só se o aparelho não tiver AAC
  for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) { const c = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 };
    try { if ((await AudioEncoder.isConfigSupported(c)).supported) { ac = c; ac.mux = mux; break; } } catch {} }
  return vc && ac ? { vc, ac } : null;
}
$('exportar').onclick = async () => {
  if (!P.clipes.length) return status('Adicione os takes primeiro.', true);
  if (st.exportando) return; parar(); st.exportando = true; cancelar = false; const sel = st.sel; st.sel = null;
  try {
    await carregarFontes(); progresso('Exportando', 'Preparando o som…', 0); await prepararAudio();
    const cfg = await suportaWebCodecs();
    const blob = cfg ? await exportarQuadros(cfg) : await exportarTempoReal();
    if (!blob) { status('Exportação cancelada.'); return; }
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm', nome = `video-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`, arq = new File([blob], nome, { type: blob.type });
    progresso(); status('Vídeo pronto (' + (blob.size / 1e6).toFixed(1) + ' MB).', false, 5000);
    if (navigator.canShare && navigator.canShare({ files: [arq] })) { try { await navigator.share({ files: [arq] }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { console.error(e); status('A exportação falhou: ' + (e.message || e), true, 8000); }
  finally { progresso(); st.exportando = false; st.sel = sel; irPara(st.t); }
};
async function exportarQuadros({ vc, ac }) {
  const T = total(), fps = 30, N = Math.max(1, Math.round(T * fps)), sr = 48000;
  const mux = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: fps }, audio: { codec: ac.mux, numberOfChannels: 2, sampleRate: sr }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
  let falha = null;
  const ve = new VideoEncoder({ output: (c, m) => mux.addVideoChunk(c, m), error: e => falha = e }); ve.configure(vc);
  const ae = new AudioEncoder({ output: (c, m) => mux.addAudioChunk(c, m), error: e => falha = e }); const { mux: _m, ...acfg } = ac; ae.configure(acfg);
  // som: o mesmo grafo da prévia, renderizado fora do tempo real
  progresso('Exportando', 'Misturando o som…', 0);
  const oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, Math.ceil(T * sr) + 1, sr);
  agendarAudio(oc, 0, 0, oc.destination); const ab = await oc.startRendering();
  const L0 = ab.getChannelData(0), L1 = ab.numberOfChannels > 1 ? ab.getChannelData(1) : L0, bloco = 4800;
  for (let i = 0; i < ab.length; i += bloco) { const n = Math.min(bloco, ab.length - i), d = new Float32Array(n * 2); d.set(L0.subarray(i, i + n), 0); d.set(L1.subarray(i, i + n), n);
    const a = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i * 1e6 / sr), data: d }); ae.encode(a); a.close(); }
  // imagem: cada quadro no tempo exato
  const t0 = performance.now();
  for (let k = 0; k < N; k++) {
    if (cancelar) { ve.close(); ae.close(); return null; } if (falha) throw falha;
    const t = Math.min(T - 1e-3, k / fps);
    for (const l of camadas(t)) { const v = videoDe(l.c); if (!v.paused) v.pause(); await seekV(v, l.local); }
    desenhar(t, true);
    const fr = new VideoFrame(tela, { timestamp: Math.round(k * 1e6 / fps), duration: Math.round(1e6 / fps) }); ve.encode(fr, { keyFrame: k % (fps * 2) === 0 }); fr.close();
    while (ve.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 4));
    if (k % 3 === 0) { const gasto = (performance.now() - t0) / 1000, falta = gasto / (k + 1) * (N - k - 1);
      progresso('Exportando', `Quadro ${k + 1} de ${N} · faltam ~${Math.ceil(falta)} s`, (k + 1) / N); }
  }
  progresso('Exportando', 'Fechando o arquivo…', 1);
  await ve.flush(); await ae.flush(); mux.finalize(); if (falha) throw falha;
  return new Blob([mux.target.buffer], { type: 'video/mp4' });
}
async function exportarTempoReal() { // aparelho sem WebCodecs: toca do começo ao fim gravando a tela
  const tipos = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  const tipo = tipos.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  if (!tipo) throw new Error('Este navegador não grava vídeo. Atualize o iOS.');
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); await AC.resume();
  const dest = AC.createMediaStreamDestination(), T = total();
  const fluxo = new MediaStream([...tela.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(fluxo, { mimeType: tipo, videoBitsPerSecond: 12e6 }), partes = []; rec.ondataavailable = e => e.data.size && partes.push(e.data);
  const pronto = new Promise(ok => rec.onstop = ok);
  irPara(0); for (const l of camadas(0)) await seekV(videoDe(l.c), l.local);
  rec.start(500); const quando = AC.currentTime + .1, fontes = agendarAudio(AC, 0, quando, dest);
  await new Promise(fim => { const passo = () => { const t = AC.currentTime - quando;
    if (cancelar || t >= T) { fontes.forEach(s => { try { s.stop(); } catch {} }); Object.values(V).forEach(v => v.pause()); return fim(); }
    if (t >= 0) { sincronizarVideos(t); desenhar(t, true); progresso('Gravando', 'Tocando o vídeo para gravar · não troque de tela', t / T); }
    requestAnimationFrame(passo); }; requestAnimationFrame(passo); });
  setTimeout(() => rec.stop(), 200); await pronto; if (cancelar) return null;
  return new Blob(partes, { type: tipo.split(';')[0] });
}

/* ================= início ================= */
function atualizarTudo() { $('vazioPrev').style.display = P.clipes.length ? 'none' : 'flex'; desenharTL(); desenharFerramentas(); if (st.painel) atualizarPainel(); desenhar(); }
$('play').onclick = () => st.tocando ? parar() : tocar();
$('inicio').onclick = () => { parar(); irPara(0); }; $('fim').onclick = () => { parar(); irPara(total()); };
$('qAnt').onclick = () => { parar(); irPara(st.t - 1 / 30); }; $('qProx').onclick = () => { parar(); irPara(st.t + 1 / 30); };
for (const [id, n] of [['desfazer', 'desfazer'], ['refazer', 'refazer'], ['inicio', 'inicio'], ['fim', 'fim'], ['qAnt', 'qAnt'], ['qProx', 'qProx'], ['zoomTl', 'zoomTl']]) $(id).innerHTML = ic(n);
$('exportar').innerHTML = ic('exportar') + '<span>Exportar</span>'; $('icAdd').innerHTML = ic('mais');
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  const mod = e.metaKey || e.ctrlKey;
  if (e.code === 'Space') { e.preventDefault(); st.tocando ? parar() : tocar(); }
  else if (e.key === 'ArrowLeft') { parar(); irPara(st.t - (e.shiftKey ? 1 : 1 / 30)); } else if (e.key === 'ArrowRight') { parar(); irPara(st.t + (e.shiftKey ? 1 : 1 / 30)); }
  else if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? $('refazer') : $('desfazer')).click(); }
  else if (mod && e.key.toLowerCase() === 'b' && st.sel?.tipo === 'clipe') { e.preventDefault(); dividir(); }
  else if ((e.key === 'Backspace' || e.key === 'Delete') && st.sel) { e.preventDefault(); acao('apagar'); }
});
document.addEventListener('dragover', e => { e.preventDefault(); }); document.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) adicionarArquivos(e.dataTransfer.files); });
window.addEventListener('resize', () => desenharTL());
window.__videoLite = { get P() { return P; }, st, M, V, total, camadas, desenhar, irPara, tocar, parar, acao, selecionar, abrirPainel, dividir, novoTexto, exportarQuadros, suportaWebCodecs, grupos };
botaoPlay(); botoesHist(); ultimo = JSON.stringify(P); atualizarTudo(); reabrir();
