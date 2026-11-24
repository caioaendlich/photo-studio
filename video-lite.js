// Media Studio · Vídeo (Lite): edição rápida de takes curtos para story, sem servidor.
// Corta e junta takes, enquadra em 9:16, aplica cor, põe textos e legenda automática,
// e exporta tocando a sequência num canvas gravado com o áudio dos takes.
const $ = id => document.getElementById(id);
const W = 1080, H = 1920;
const tela = $('tela'), ctx = tela.getContext('2d');
const st = { clipes: [], sel: -1, textos: [], tsel: -1, filtro: 'natural', t: 0, tocando: false, gravando: false };

const FILTROS = {
  natural: { nome: 'Natural', css: 'none' },
  neon: { nome: 'NEON', css: 'contrast(1.12) saturate(0.85) brightness(0.98) hue-rotate(-8deg)', tinta: 'rgba(40,120,255,0.10)' },
  quente: { nome: 'Quente', css: 'contrast(1.05) saturate(1.1) sepia(0.12)' },
  contraste: { nome: 'Contraste', css: 'contrast(1.25) saturate(1.05)' },
  pb: { nome: 'P&B', css: 'grayscale(1) contrast(1.15)' },
  suave: { nome: 'Suave', css: 'contrast(0.94) saturate(0.92) brightness(1.04)' }
};
const FONTES = [
  ['Anton', '400', 'Anton (título)'], ['General Sans', '600', 'General Sans'], ['Satoshi', '700', 'Satoshi forte'],
  ['Satoshi', '300', 'Satoshi fina'], ['Montserrat', '600', 'Montserrat'], ['Instrument Serif', 'italic 400', 'Instrument Serif'],
  ['Melodrama', '400', 'Melodrama (brincadeira)']
];

const dur = c => Math.max(0.1, c.fim - c.ini);
const total = () => st.clipes.reduce((s, c) => s + dur(c), 0);
const fmt = s => s.toFixed(1).replace('.', ',');
function status(m, erro) { $('status').textContent = m || ''; $('status').style.color = erro ? '#ffb0a6' : ''; }

/* ---------- takes ---------- */
function carregarVideo(file) {
  return new Promise((ok, falha) => {
    const v = document.createElement('video');
    v.playsInline = true; v.preload = 'auto'; v.muted = true; v.crossOrigin = 'anonymous';
    v.src = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(0.1, v.duration / 2);
      v.onseeked = () => {
        const c = document.createElement('canvas'); c.width = 108; c.height = 192;
        cobrir(c.getContext('2d'), v, 108, 192, 1, 0);
        v.onseeked = null;
        ok({ nome: file.name, file, v, duracao: v.duration, ini: 0, fim: v.duration, zoom: 1, y: 0, vol: 1, capa: c.toDataURL('image/jpeg', .7) });
      };
    };
    v.onerror = () => falha(new Error('Não consegui abrir ' + file.name));
  });
}
$('arquivos').onchange = async e => {
  const fs = [...e.target.files]; e.target.value = '';
  status('Abrindo ' + fs.length + ' vídeo(s)…');
  for (const f of fs) { try { st.clipes.push(await carregarVideo(f)); } catch (err) { status(err.message, true); } }
  if (st.sel < 0 && st.clipes.length) st.sel = 0;
  listarClipes(); mostrarCorte(); irPara(st.t); status('');
};
function listarClipes() {
  const el = $('clipes');
  if (!st.clipes.length) { el.innerHTML = '<p class="vazio">Escolha de 1 a 10 vídeos do rolo da câmera.</p>'; return; }
  el.innerHTML = st.clipes.map((c, i) => `<div class="clipe${i === st.sel ? ' sel' : ''}" data-i="${i}"><img src="${c.capa}" alt=""><div><b>Take ${i + 1}</b><small>${fmt(dur(c))} s de ${fmt(c.duracao)} s</small>
    <div class="bt"><button data-a="up">↑</button><button data-a="down">↓</button><button data-a="del" class="danger">Tirar</button></div></div></div>`).join('');
  el.querySelectorAll('.clipe').forEach(n => n.onclick = ev => {
    const i = +n.dataset.i, a = ev.target.dataset.a;
    if (a === 'up' && i > 0) [st.clipes[i - 1], st.clipes[i]] = [st.clipes[i], st.clipes[i - 1]], st.sel = i - 1;
    else if (a === 'down' && i < st.clipes.length - 1) [st.clipes[i + 1], st.clipes[i]] = [st.clipes[i], st.clipes[i + 1]], st.sel = i + 1;
    else if (a === 'del') { st.clipes.splice(i, 1); st.sel = Math.min(st.sel, st.clipes.length - 1); }
    else { st.sel = i; irPara(inicioDo(i)); }
    listarClipes(); mostrarCorte(); desenhar();
  });
}
const inicioDo = i => st.clipes.slice(0, i).reduce((s, c) => s + dur(c), 0);
function mostrarCorte() {
  const c = st.clipes[st.sel]; $('corte').hidden = !c; if (!c) return;
  for (const [id, k] of [['ini', 'ini'], ['fim', 'fim']]) { $(id).max = c.duracao.toFixed(2); $(id).value = c[k]; }
  $('zoom').value = c.zoom; $('posY').value = c.y; $('vol').value = c.vol; rotulos();
}
function rotulos() { const c = st.clipes[st.sel]; if (!c) return; $('vIni').textContent = fmt(c.ini) + ' s'; $('vFim').textContent = fmt(c.fim) + ' s'; }
$('ini').oninput = e => { const c = st.clipes[st.sel]; c.ini = Math.min(+e.target.value, c.fim - 0.2); e.target.value = c.ini; rotulos(); listarClipes(); irPara(inicioDo(st.sel)); };
$('fim').oninput = e => { const c = st.clipes[st.sel]; c.fim = Math.max(+e.target.value, c.ini + 0.2); e.target.value = c.fim; rotulos(); listarClipes(); irPara(inicioDo(st.sel) + dur(c) - 0.05); };
$('zoom').oninput = e => { st.clipes[st.sel].zoom = +e.target.value; desenhar(); };
$('posY').oninput = e => { st.clipes[st.sel].y = +e.target.value; desenhar(); };
$('vol').oninput = e => { st.clipes[st.sel].vol = +e.target.value; };

/* ---------- desenho ---------- */
function cobrir(c, v, w, h, zoom, y) {
  const vw = v.videoWidth || 9, vh = v.videoHeight || 16, s = Math.max(w / vw, h / vh) * zoom;
  const dw = vw * s, dh = vh * s, folga = Math.max(0, (dh - h) / 2);
  c.drawImage(v, (w - dw) / 2, (h - dh) / 2 + y * folga, dw, dh);
}
function onde(t) { // take e tempo local para o tempo t da sequência
  let a = 0;
  for (let i = 0; i < st.clipes.length; i++) { const d = dur(st.clipes[i]); if (t < a + d || i === st.clipes.length - 1) return { i, local: st.clipes[i].ini + Math.min(d, Math.max(0, t - a)) }; a += d; }
  return null;
}
function desenhar() {
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const p = onde(st.t);
  if (p) { const c = st.clipes[p.i], f = FILTROS[st.filtro]; ctx.filter = f.css; cobrir(ctx, c.v, W, H, c.zoom, c.y); ctx.filter = 'none';
    if (f.tinta) { ctx.fillStyle = f.tinta; ctx.globalCompositeOperation = 'soft-light'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; } }
  else { ctx.fillStyle = '#5f6b58'; ctx.font = '600 44px "General Sans",Arial'; ctx.textAlign = 'center'; ctx.fillText('Adicione os takes', W / 2, H / 2); }
  for (const tx of st.textos) if (st.t >= tx.de && st.t < tx.ate) desenharTexto(tx);
  ctx.restore();
  $('tempo').textContent = fmt(st.t) + ' / ' + fmt(total()) + ' s';
  $('barra').max = Math.max(0.01, total()).toFixed(2); if (!arrastando) $('barra').value = st.t;
}
function quebrar(texto, max) {
  const linhas = [];
  for (const par of texto.split('\n')) { let l = '';
    for (const p of par.split(' ')) { const t = l ? l + ' ' + p : p; if (ctx.measureText(t).width > max && l) { linhas.push(l); l = p; } else l = t; }
    linhas.push(l); }
  return linhas;
}
function desenharTexto(tx) {
  const [fam, peso] = FONTES[tx.fonte] || FONTES[1];
  ctx.font = `${peso} ${tx.tam}px "${fam}",Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const linhas = quebrar(tx.texto, W * 0.84), lh = tx.tam * 1.12, y0 = tx.y * H - (linhas.length - 1) * lh / 2;
  if (tx.fundo) { const larg = Math.max(...linhas.map(l => ctx.measureText(l).width)) + tx.tam * 0.7, alt = linhas.length * lh + tx.tam * 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; arred(W / 2 - larg / 2, y0 - lh / 2 - tx.tam * 0.17, larg, alt, tx.tam * 0.25); }
  ctx.fillStyle = tx.cor; ctx.shadowColor = tx.fundo ? 'transparent' : 'rgba(0,0,0,0.55)'; ctx.shadowBlur = tx.tam * 0.18;
  linhas.forEach((l, k) => ctx.fillText(l, W / 2, y0 + k * lh)); ctx.shadowBlur = 0;
}
function arred(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }

/* ---------- reprodução ---------- */
let atual = -1, t0 = 0, rel0 = 0, raf = 0, arrastando = false, audio = null;
function irPara(t) {
  st.t = Math.max(0, Math.min(t, total())); const p = onde(st.t);
  if (!p) return desenhar();
  const v = st.clipes[p.i].v;
  if (Math.abs(v.currentTime - p.local) > 0.04) { v.currentTime = p.local; v.onseeked = () => { v.onseeked = null; desenhar(); }; } else desenhar();
}
async function tocar(gravar) {
  if (!st.clipes.length) return;
  if (st.t >= total() - 0.05) st.t = 0;
  st.tocando = true; $('play').textContent = '❚❚'; atual = -1; t0 = performance.now(); rel0 = st.t;
  await iniciarTake(onde(st.t), gravar);
  const passo = async () => {
    if (!st.tocando) return;
    st.t = rel0 + (performance.now() - t0) / 1000;
    if (st.t >= total()) { st.t = total(); desenhar(); return parar(true); }
    const p = onde(st.t);
    if (p.i !== atual) { st.clipes[atual]?.v.pause(); await iniciarTake(p, gravar); }
    desenhar(); raf = requestAnimationFrame(passo);
  };
  raf = requestAnimationFrame(passo);
}
async function iniciarTake(p, gravar) {
  atual = p.i; const c = st.clipes[p.i], v = c.v;
  v.currentTime = p.local; v.muted = !gravar && false; v.volume = c.vol;
  if (audio && c.no) c.ganho.gain.value = c.vol;
  try { await v.play(); } catch (e) { v.muted = true; await v.play().catch(() => {}); }
  t0 = performance.now(); rel0 = inicioDo(p.i) + (p.local - c.ini);
}
function parar(fim) {
  st.tocando = false; cancelAnimationFrame(raf); st.clipes.forEach(c => c.v.pause()); $('play').textContent = '▶';
  if (fim && fimGravacao) fimGravacao();
}
$('play').onclick = () => st.tocando ? parar() : tocar(false);
$('voltar').onclick = () => { parar(); irPara(0); };
$('barra').oninput = e => { arrastando = true; if (st.tocando) parar(); irPara(+e.target.value); };
$('barra').onchange = () => { arrastando = false; };

/* ---------- cor ---------- */
$('filtros').innerHTML = Object.entries(FILTROS).map(([k, f]) => `<button data-f="${k}">${f.nome}</button>`).join('');
function marcarFiltro() { $('filtros').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === st.filtro)); }
$('filtros').onclick = e => { const f = e.target.dataset.f; if (f) { st.filtro = f; marcarFiltro(); desenhar(); } };
marcarFiltro();

/* ---------- textos ---------- */
$('tFonte').innerHTML = FONTES.map((f, i) => `<option value="${i}">${f[2]}</option>`).join('');
function listarTextos() {
  $('textos').innerHTML = st.textos.map((t, i) => `<div class="txt${i === st.tsel ? ' sel' : ''}" data-i="${i}">${esc(t.texto).slice(0, 40) || '(vazio)'}<br><small style="color:#9aa296">${fmt(t.de)} a ${fmt(t.ate)} s</small></div>`).join('');
  $('textos').querySelectorAll('.txt').forEach(n => n.onclick = () => { st.tsel = +n.dataset.i; editarTexto(); listarTextos(); irPara(st.textos[st.tsel].de + 0.01); });
}
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function editarTexto() {
  const t = st.textos[st.tsel]; $('edTexto').hidden = !t; if (!t) return;
  $('tTexto').value = t.texto; $('tFonte').value = t.fonte; $('tCor').value = t.cor; $('tTam').value = t.tam; $('tY').value = t.y;
  $('tDe').value = t.de.toFixed(1); $('tAte').value = t.ate.toFixed(1); $('tFundo').checked = t.fundo;
}
$('novoTexto').onclick = () => {
  const de = st.t, ate = Math.min(total() || 5, de + 3) || 3;
  st.textos.push({ texto: 'Seu texto', fonte: 0, cor: '#ffffff', tam: 110, y: 0.22, de, ate: ate > de ? ate : de + 3, fundo: false });
  st.tsel = st.textos.length - 1; listarTextos(); editarTexto(); desenhar();
};
const campo = (id, k, conv) => $(id).oninput = e => { const t = st.textos[st.tsel]; if (!t) return; t[k] = conv(e.target); listarTextos(); desenhar(); };
campo('tTexto', 'texto', e => e.value); campo('tFonte', 'fonte', e => +e.value); campo('tCor', 'cor', e => e.value);
campo('tTam', 'tam', e => +e.value); campo('tY', 'y', e => +e.value); campo('tDe', 'de', e => Math.max(0, +e.value || 0));
campo('tAte', 'ate', e => Math.max(0, +e.value || 0)); campo('tFundo', 'fundo', e => e.checked);
$('tApagar').onclick = () => { st.textos.splice(st.tsel, 1); st.tsel = -1; editarTexto(); listarTextos(); desenhar(); };

/* ---------- legenda automática (Whisper no próprio aparelho) ---------- */
let transcritor = null;
async function audioDaSequencia() {
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const pedacos = [];
  for (const c of st.clipes) {
    let buf; try { buf = await ac.decodeAudioData(await c.file.arrayBuffer()); } catch { buf = null; }
    const n = Math.round(dur(c) * 16000), out = new Float32Array(n);
    if (buf) { const ch = buf.getChannelData(0), r = buf.sampleRate / 16000, o = Math.round(c.ini * buf.sampleRate);
      for (let k = 0; k < n; k++) out[k] = (ch[o + Math.floor(k * r)] || 0) * c.vol; }
    pedacos.push(out);
  }
  ac.close(); const todo = new Float32Array(pedacos.reduce((s, p) => s + p.length, 0));
  let a = 0; for (const p of pedacos) { todo.set(p, a); a += p.length; } return todo;
}
$('legenda').onclick = async () => {
  if (!st.clipes.length) return status('Adicione os takes primeiro.', true);
  const b = $('legenda'); b.disabled = true;
  try {
    if (!transcritor) {
      status('Baixando o modelo de fala (só na primeira vez, ~80 MB)…');
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
      env.allowLocalModels = false;
      transcritor = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', { progress_callback: p => { if (p.status === 'progress' && p.total) status(`Baixando o modelo de fala… ${Math.round(p.loaded / p.total * 100)}%`); } });
    }
    status('Ouvindo os takes…');
    const r = await transcritor(await audioDaSequencia(), { language: 'portuguese', task: 'transcribe', return_timestamps: true, chunk_length_s: 30 });
    const partes = (r.chunks || [{ text: r.text, timestamp: [0, total()] }]).filter(c => c.text.trim());
    st.textos = st.textos.filter(t => !t.legenda);
    for (const c of partes) {
      const de = c.timestamp[0] || 0, ate = c.timestamp[1] ?? Math.min(total(), de + 2.5);
      st.textos.push({ texto: c.text.trim(), fonte: 1, cor: '#ffffff', tam: 70, y: 0.8, de, ate, fundo: true, legenda: true });
    }
    listarTextos(); desenhar(); status(partes.length + ' trechos de legenda criados. Toque em cada um para corrigir.');
  } catch (e) { console.error(e); status('A legenda automática falhou: ' + (e.message || e), true); }
  b.disabled = false;
};

/* ---------- exportar ---------- */
let fimGravacao = null;
function montarAudio() {
  if (audio) return audio;
  const ac = new (window.AudioContext || window.webkitAudioContext)(), dest = ac.createMediaStreamDestination();
  for (const c of st.clipes) if (!c.no) { c.no = ac.createMediaElementSource(c.v); c.ganho = ac.createGain(); c.no.connect(c.ganho); c.ganho.connect(dest); c.ganho.connect(ac.destination); }
  audio = { ac, dest }; return audio;
}
$('exportar').onclick = async () => {
  if (!st.clipes.length) return status('Adicione os takes primeiro.', true);
  if (st.tocando) parar();
  const tipos = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  const tipo = tipos.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  if (!tipo) return status('Este navegador não grava vídeo. No iPhone, use o Safari atualizado.', true);
  const a = montarAudio(); await a.ac.resume();
  st.clipes.forEach(c => { c.v.muted = false; c.ganho.gain.value = c.vol; });
  const fluxo = new MediaStream([...tela.captureStream(30).getVideoTracks(), ...a.dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(fluxo, { mimeType: tipo, videoBitsPerSecond: 12e6 }), partes = [];
  rec.ondataavailable = e => e.data.size && partes.push(e.data);
  const pronto = new Promise(ok => rec.onstop = ok);
  $('exportar').disabled = true; status('Gravando o story… não troque de tela até terminar.');
  st.t = 0; irPara(0); await new Promise(r => setTimeout(r, 300));
  fimGravacao = () => { fimGravacao = null; setTimeout(() => rec.stop(), 150); };
  rec.start(500); await tocar(true); await pronto;
  st.clipes.forEach(c => c.v.muted = true);
  const ext = tipo.startsWith('video/mp4') ? 'mp4' : 'webm', blob = new Blob(partes, { type: tipo.split(';')[0] });
  const nome = `story-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`, arq = new File([blob], nome, { type: blob.type });
  $('exportar').disabled = false; status('Story pronto (' + (blob.size / 1e6).toFixed(1) + ' MB).');
  if (navigator.canShare && navigator.canShare({ files: [arq] })) { try { await navigator.share({ files: [arq] }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = nome; link.click();
};
window.__videoLite = st;
desenhar();
