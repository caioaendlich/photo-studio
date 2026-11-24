// Photo Studio autônomo (Caio, 24/11/2026 07:12): o mesmo editor roda no iPhone sem o Mac.
// Este arquivo responde, no próprio aparelho, as chamadas que no Mac vão ao servidor do Video Studio:
//   /api/posts/recorte e /api/posts/objetos  → recorte da pessoa com o MODNet (mesmo modelo do Prisma), num worker
//   /api/posts/projetos/...                  → projetos guardados no celular (IndexedDB)
//   /api/posts/quadros/...                   → MP4 montado no aparelho (WebCodecs + mp4-muxer)
//   /api/posts/rosto e /api/posts/ia         → indisponíveis no celular (mapa do rosto e IA ficam no Mac)
// Fica fora do posts.js de propósito: o editor é um só; só a ponta que conversa com o "servidor" muda.
import { Muxer, ArrayBufferTarget } from './mp4-muxer.mjs';

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
const erro = (msg, status = 400) => json({ error: msg }, status);

// ---------- banco local ----------
const DB = (() => {
  let db = null;
  const abrir = () => db ? Promise.resolve(db) : new Promise((ok, falha) => {
    const r = indexedDB.open('photo-studio', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('projetos', { keyPath: 'id' }); };
    r.onsuccess = () => { db = r.result; ok(db); }; r.onerror = () => falha(r.error);
  });
  const tx = async (modo, fn) => { const d = await abrir(); return new Promise((ok, falha) => { const t = d.transaction('projetos', modo), s = t.objectStore('projetos'); const r = fn(s); t.oncomplete = () => ok(r?.result); t.onerror = () => falha(t.error); }); };
  return { get: id => tx('readonly', s => s.get(id)), todos: () => tx('readonly', s => s.getAll()), put: v => tx('readwrite', s => s.put(v)), apagar: id => tx('readwrite', s => s.delete(id)) };
})();
// pede ao Safari para não apagar os projetos quando faltar espaço
try { navigator.storage?.persist?.(); } catch {}

const novoId = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
const capas = new Map();   // id -> URL da capa (blob)
function urlCapa(p) { if (!p.capa) return null; if (!capas.has(p.id + p.atualizado)) capas.set(p.id + p.atualizado, p.capa); return p.capa; }

async function projetos(url, init) {
  const caminho = url.pathname, corpo = init?.body ? JSON.parse(init.body) : null;
  if (caminho === '/api/posts/projetos') {
    const todos = (await DB.todos()) || [];
    return json(todos.sort((a, b) => b.atualizado - a.atualizado).map(p => ({ id: p.id, nome: p.nome, formato: p.formato, criado: p.criado, atualizado: p.atualizado, capa: urlCapa(p) })));
  }
  if (caminho.endsWith('/salvar')) {
    if (corpo?.projeto?.schema !== 'caio-videostudio-post') return erro('Esse não é um projeto do editor de Posts.');
    const id = corpo.id || novoId(), antigo = await DB.get(id), agora = Date.now() / 1000;
    let capa = corpo.capa?.startsWith('data:image/jpeg') ? corpo.capa : antigo?.capa || null;
    if (!capa && corpo.capaDe) capa = (await DB.get(corpo.capaDe))?.capa || null;
    await DB.put({ id, nome: String(corpo.nome || antigo?.nome || 'Sem nome').slice(0, 120), formato: corpo.projeto.formato || 'feed', criado: antigo?.criado || agora, atualizado: agora, capa, projeto: corpo.projeto });
    return json({ id, nome: corpo.nome, atualizado: agora });
  }
  if (caminho.endsWith('/renomear')) { const p = await DB.get(corpo.id); if (!p) return erro('Projeto não encontrado.', 404); p.nome = String(corpo.nome || 'Sem nome').slice(0, 120); await DB.put(p); return json({ id: p.id, nome: p.nome }); }
  if (caminho.endsWith('/apagar')) { await DB.apagar(corpo.id); return json({ ok: true }); }
  const id = caminho.split('/')[4]; const p = await DB.get(id);
  if (!p) return erro('Projeto não encontrado.', 404);
  return json({ id: p.id, nome: p.nome, projeto: p.projeto });
}

// ---------- recorte da pessoa (MODNet num worker, como no Prisma) ----------
const RES = 512;   // 512 basta para a máscara da arte e é rápido no iPhone
let worker = null, pronto = null, seq = 0; const espera = new Map();
function carregar() {
  if (pronto) return pronto;
  pronto = new Promise((ok, falha) => {
    worker = new Worker(new URL('./recorte-worker.js', import.meta.url));
    worker.onmessage = e => { const d = e.data;
      if (d.type === 'ready') ok(true);
      else if (d.type === 'out' || d.type === 'err') { const w = espera.get(d.id); if (w) { espera.delete(d.id); d.type === 'out' ? w.ok(d.data) : w.falha(new Error(d.msg)); } else if (d.type === 'err') falha(new Error(d.msg)); } };
    worker.onerror = () => { falha(new Error('O recorte foi interrompido.')); pronto = null; };
    worker.postMessage({ type: 'load', res: RES });
  });
  return pronto;
}
async function recortar(blob) {
  await carregar();
  const bmp = await createImageBitmap(blob), w = bmp.width, h = bmp.height;
  const c = new OffscreenCanvas(RES, RES), g = c.getContext('2d'); g.drawImage(bmp, 0, 0, RES, RES);
  const px = g.getImageData(0, 0, RES, RES).data;
  const alfa = await new Promise((ok, falha) => { const id = ++seq; espera.set(id, { ok, falha }); worker.postMessage({ type: 'run', id, px }, [px.buffer]); });
  // máscara RES×RES → tamanho da foto, com o alfa suave do modelo
  const m = new OffscreenCanvas(RES, RES), mg = m.getContext('2d'), id = mg.createImageData(RES, RES);
  for (let i = 0; i < alfa.length; i++) { const a = Math.max(0, Math.min(255, Math.round(alfa[i] * 255))); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = a; }
  mg.putImageData(id, 0, 0);
  const out = new OffscreenCanvas(w, h), og = out.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(m, 0, 0, w, h);
  const png = await out.convertToBlob({ type: 'image/png' });
  return await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(png); });
}

// ---------- MP4 no aparelho ----------
const sessoes = new Map();
async function quadros(url, init) {
  const partes = url.pathname.split('/');
  if (url.pathname === '/api/posts/quadros/iniciar') {
    if (typeof VideoEncoder === 'undefined') return erro('Este aparelho não grava vídeo pelo navegador. Atualize o iOS (17 ou mais novo).');
    const { fps, total } = JSON.parse(init.body), sid = novoId();
    sessoes.set(sid, { fps, total, enc: null, mux: null, falha: null, w: 0, h: 0 });
    return json({ id: sid });
  }
  const sid = partes[4], S = sessoes.get(sid); if (!S) return erro('Exportação não encontrada.', 404);
  if (partes[5] === 'cancelar') { try { S.enc?.close(); } catch {} sessoes.delete(sid); return json({ ok: true }); }
  if (partes[5] === 'fim') {
    try { await S.enc.flush(); S.mux.finalize(); const buf = S.mux.target.buffer; sessoes.delete(sid); return new Response(new Blob([buf], { type: 'video/mp4' }), { headers: { 'Content-Type': 'video/mp4' } }); }
    catch (e) { sessoes.delete(sid); return erro('O MP4 não foi criado: ' + (S.falha || e.message)); }
  }
  const n = +partes[5], bmp = await createImageBitmap(init.body);
  if (!S.enc) {
    S.w = bmp.width - bmp.width % 2; S.h = bmp.height - bmp.height % 2;
    S.mux = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: S.w, height: S.h, frameRate: S.fps }, fastStart: 'in-memory' });
    S.enc = new VideoEncoder({ output: (chunk, meta) => S.mux.addVideoChunk(chunk, meta), error: e => { S.falha = e.message; } });
    let cfg = null;
    for (const codec of ['avc1.640033', 'avc1.640028', 'avc1.4d0033', 'avc1.42003e']) {
      const c = { codec, width: S.w, height: S.h, bitrate: 20_000_000, framerate: S.fps, avc: { format: 'avc' } };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) { cfg = c; break; } } catch {}
    }
    if (!cfg) return erro('Este aparelho não grava H.264 nesse tamanho.');
    S.enc.configure(cfg);
  }
  if (S.falha) return erro(S.falha);
  const ts = Math.round(n * 1e6 / S.fps), frame = new VideoFrame(bmp, { timestamp: ts, duration: Math.round(1e6 / S.fps) });
  S.enc.encode(frame, { keyFrame: n % (S.fps * 2) === 0 }); frame.close(); bmp.close();
  while (S.enc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 5));
  return json({ ok: true });
}

// ---------- ponte: intercepta as chamadas ao servidor ----------
const fetchOriginal = window.fetch.bind(window);
window.fetch = async (entrada, init) => {
  const url = new URL(typeof entrada === 'string' ? entrada : entrada.url, location.href);
  if (!url.pathname.startsWith('/api/')) return fetchOriginal(entrada, init);
  try {
    const p = url.pathname;
    if (p.startsWith('/api/posts/projetos')) return await projetos(url, init);
    if (p.startsWith('/api/posts/quadros')) return await quadros(url, init);
    if (p === '/api/posts/recorte') return json({ mask: await recortar(init.body) });
    if (p === '/api/posts/objetos') return json({ objects: [{ name: 'pessoa', kind: 'person', mask: await recortar(init.body) }] });
    if (p === '/api/posts/rosto') return erro('O mapa do rosto ainda não roda no celular; use no Mac.', 501);
    if (p === '/api/posts/ia') return erro('A IA de montagem fica no Mac por enquanto (a chave da API não pode ir para um site público).', 501);
    if (p === '/api/restart') return json({ ok: true, message: 'Nada a reiniciar no celular.' });
    return erro('Indisponível no celular.', 501);
  } catch (e) { return erro(e.message || String(e), 500); }
};
window.PHOTO_STUDIO_AUTONOMO = true;
