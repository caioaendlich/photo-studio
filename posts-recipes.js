// Estilos de palavra do Video Studio no Media Studio · Foto (Caio 24/11/2026 20:02: "todos os estilos transferidos").
// Porte em canvas das receitas de recipes.py (Mac), para rodar também no celular, sem servidor. Cada receita é uma camada
// forma:'receita' com progresso q (0..1) no tempo do clipe; na foto parada usa F.qParado (o estado já assentado).
// Parte de trás das receitas passa atrás da pessoa (recorte); a da frente fica por cima.
const ease = q => { q = Math.max(0, Math.min(1, q)); return 1 - (1 - q) ** 3; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
try { const f = new FontFace('InstrSI', 'url(fonts/InstrumentSerif-Italic.ttf)', { style: 'italic' }); document.fonts.add(f); f.load().catch(() => {}); } catch (e) { }

export const RECEITAS = [
  { id: 'letreiro', nome: 'Letreiro alto (B1)', atras: true },
  { id: 'fantasma', nome: 'Palavra e fantasma (A3)', atras: true },
  { id: 'pisca', nome: 'Letreiro que pisca' },
  { id: 'anel', nome: 'Anel 360 (A1 · B2)', atras: true },
  { id: 'anelCabeca', nome: 'Anel na cabeça (A1b)', atras: true },
  { id: 'papel', nome: 'Palavra repetida (B1b)', atras: true },
  { id: 'palavras', nome: 'Palavras-chave (B1c)', atras: true },
  { id: 'cordinha', nome: 'Palavra na cordinha (B3)' },
  { id: 'contorno', nome: 'Contorno da pessoa (B4)' },
  { id: 'aba', nome: 'Aba lateral (D1)' },
  { id: 'rotulo', nome: 'Rótulo no objeto (C1 · B6)', objeto: true },
  { id: 'malha', nome: 'Triangulação (C2)', objeto: true },
  { id: 'cristal', nome: 'Área tratada (C3)', objeto: true },
  { id: 'destaque', nome: 'Objeto em destaque (D2)', objeto: true },
];
export const receitaPorId = id => RECEITAS.find(r => r.id === id);

// Camada nova com a geometria tirada da caixa da pessoa (bx) ou do objeto escolhido.
export function novaReceita(id, { W, H, bx, palavra = 'NATURAL', frase = '', obj = -1 }) {
  const S = W / 1080, R = receitaPorId(id), base = { tipo: 'forma', forma: 'receita', receita: id, nome: R?.nome || id, texto: palavra, sub: frase, rot: 0, opac: 1, atras: [],
    cor: '#ffffff', vel: 1, qParado: .7, inicio: 0, dur: 0, atrasPessoa: !!R?.atras, contorno: false, obj };
  const topo = bx.y - bx.h / 2, ombro = topo + bx.h * .28;
  const g = {
    letreiro: { x: W / 2, y: (Math.max(H * .06, 120 * S) + ombro) / 2, w: W * .92, h: Math.max(120 * S, ombro - Math.max(H * .06, 120 * S)) },
    fantasma: { x: bx.x, y: topo + bx.h * .42, w: W * .8, h: 320 * S, tam: 220 * S },
    pisca: { x: W / 2, y: H * .5, w: W * .86, h: 260 * S, tam: 230 * S },
    anel: { x: bx.x, y: topo + bx.h * .38, w: Math.min(W * .9, bx.w * 1.15), h: Math.min(W * .9, bx.w * 1.15) * .45, tam: 100 * S },
    anelCabeca: { x: bx.x, y: topo + bx.h * .1, w: Math.min(W * .7, bx.w * .7), h: Math.min(W * .7, bx.w * .7) * .4, tam: 70 * S },
    papel: { x: W * .5, y: Math.max(H * .12, topo * .7), w: 400 * S, h: 200 * S, tam: 225 * S },
    palavras: { x: W / 2, y: H / 2, w: W, h: H, tam: 104 * S },
    cordinha: { x: W / 2, y: H * .76, w: 500 * S, h: 200 * S, tam: 96 * S },
    contorno: { x: bx.x, y: bx.y, w: bx.w, h: bx.h, tam: 50 * S, margem: 40 * S },
    aba: { x: W * .18, y: H / 2, w: W * .36, h: H, tam: 210 * S, frac: .36, lado: 'esquerda' },
    rotulo: { x: W / 2, y: H * .3, w: 360 * S, h: 120 * S, tam: 46 * S },
    malha: { x: W / 2, y: H / 2, w: 300 * S, h: 300 * S, tam: 46 * S },
    cristal: { x: W / 2, y: H / 2, w: 300 * S, h: 300 * S, tam: 46 * S },
    destaque: { x: W / 2, y: H / 2, w: 300 * S, h: 300 * S, tam: 46 * S },
  }[id] || { x: W / 2, y: H / 2, w: 400 * S, h: 200 * S, tam: 100 * S };
  if (id === 'rotulo') { base.ancora = 'top'; base.palavraAuto = true; }
  return { ...base, ...g, tam: g.tam || 100 * S };
}

// ---------- utilidades ----------
function sombra(c, S, blur = 3, a = .47, d = 1) { c.shadowColor = `rgba(0,0,0,${a})`; c.shadowBlur = blur * S * 2; c.shadowOffsetX = d * S; c.shadowOffsetY = d * S; }
function tela(W, H) { const t = document.createElement('canvas'); t.width = W; t.height = H; return [t, t.getContext('2d')]; }
function semPessoa(tc, env) { if (!env.pessoa) return; tc.save(); tc.globalCompositeOperation = 'destination-out'; tc.drawImage(env.pessoa.canvas, 0, 0); tc.restore(); }
function progresso(F, env) {
  if (F._t == null) return { q: F.qParado ?? .7, s: null, dur: 3 };
  const ini = +F.inicio || 0, dur = Math.max(.3, (+F.dur || 0) > 0 ? +F.dur : (env.dur || 6) - ini);
  return { q: clamp((F._t - ini) / dur, 0, 1), s: F._t - ini, dur };
}
function caberLargura(c, txt, fonte, tam, max) { c.font = fonte(tam); const w = c.measureText(txt).width; return w > max && w > 0 ? Math.max(8, tam * max / w) : tam; }
// ponto de ancoragem do maior pedaço de uma máscara (topo ou centro)
function ancora(m, W, H, where) {
  const a = m.alfa, passo = 3, xs = [], ys = [];
  for (let y = 0; y < H; y += passo) for (let x = 0; x < W; x += passo) if (a[(y * W + x) * 4 + 3] > 127) { xs.push(x); ys.push(y); }
  if (!xs.length) return null;
  if (where === 'top') { const so = [...ys].sort((p, q) => p - q), y8 = so[Math.floor(so.length * .08)], sel = []; for (let i = 0; i < ys.length; i++) if (ys[i] <= y8 + 6) sel.push(xs[i]); sel.sort((p, q) => p - q); return { x: sel[sel.length >> 1], y: y8 }; }
  let sx = 0, sy = 0; for (let i = 0; i < xs.length; i++) { sx += xs[i]; sy += ys[i]; } return { x: sx / xs.length, y: sy / ys.length };
}

// ---------- desenho ----------
export function desenharReceita(c, F, env) {
  const { W, H } = env, S = W / 1080, { q, s, dur } = progresso(F, env), cor = F.cor || '#ffffff';
  const [tt, tc] = tela(W, H), [ft, fc] = tela(W, H);   // trás e frente
  const txt = String(F.texto || '').trim(), TXT = txt.toUpperCase();
  F._box = { x: F.x, y: F.y, w: F.w, h: F.h, rot: 0 };
  const fn = DESENHOS[F.receita]; if (fn) fn({ c, tc, fc, F, env, W, H, S, q, s, dur, cor, txt, TXT });
  if (F.atrasPessoa !== false) semPessoa(tc, env);
  c.save(); c.globalAlpha = F.opac ?? 1; c.drawImage(tt, 0, 0); c.drawImage(ft, 0, 0); c.restore();
}

const DESENHOS = {
  letreiro({ tc, F, S, q, cor, TXT }) {
    if (!TXT) return; const h = Math.max(40, F.h), base = F.y + F.h / 2; let size = h / .87; const ls = .035;
    const larg = sz => { tc.font = `${sz}px SixCaps`; return [...TXT].reduce((a, ch) => a + tc.measureText(ch).width, 0) + ls * sz * (TXT.length - 1); };
    let w = larg(size); if (w > F.w) { size *= F.w / w; w = larg(size); }
    tc.font = `${size}px SixCaps`; tc.textBaseline = 'alphabetic'; tc.fillStyle = cor; sombra(tc, S, 10, .27, 2);
    const dy = -18 * S * (q - .5); let x = F.x - w / 2; const n = TXT.length;
    [...TXT].forEach((ch, i) => { const k = clamp((q - .18 * i / Math.max(1, n - 1)) / .08, 0, 1); tc.globalAlpha = .98 * ease(k);
      if (k > 0) tc.fillText(ch, x, base + 28 * S * (1 - ease(k)) + dy); x += tc.measureText(ch).width + ls * size; });
    F._box = { x: F.x, y: F.y + dy, w: Math.max(w, 40), h: F.h, rot: 0 };
  },
  fantasma({ tc, fc, F, W, S, q, cor, TXT }) {
    if (!TXT) return; const kmax = Math.max(120 * S, W * .08), k = kmax * ease(Math.min(1, q * 1.6)), d = F.h / 2;
    const fonte = t => `${t}px AntonF`; const size = caberLargura(tc, TXT, fonte, F.tam, W * .94 - 2 * kmax);
    for (const g of [tc, fc]) { g.font = fonte(size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = cor; }
    tc.font = fonte(size); const tw = tc.measureText(TXT).width;   // as duas cópias cabem inteiras na tela, contando o afastamento
    const cx = tw + 2 * kmax < W * .94 ? clamp(F.x, tw / 2 + kmax + W * .03, W - tw / 2 - kmax - W * .03) : W / 2;
    sombra(tc, S); tc.fillText(TXT, cx - k, F.y - d);
    fc.globalAlpha = .42; fc.fillText(TXT, cx + k, F.y + d);
    tc.font = fonte(size); F._box = { x: F.x, y: F.y, w: tc.measureText(TXT).width + 2 * kmax, h: 2 * d + size, rot: 0 };
  },
  pisca({ fc, F, W, s, cor, TXT }) {
    if (!TXT) return; if (s != null) { const u = ((s % 1.02) + 1.02) % 1.02; if (u < .08 || (u >= .16 && u < .24)) return; }
    const fonte = t => `700 ${t}px Neue, GenSans, sans-serif`, size = caberLargura(fc, TXT, fonte, F.tam, W * .86);
    fc.font = fonte(size); fc.textAlign = 'center'; fc.textBaseline = 'middle'; fc.fillStyle = cor; fc.fillText(TXT, F.x, F.y);
    F._box = { x: F.x, y: F.y, w: fc.measureText(TXT).width, h: size, rot: 0 };
  },
  anel(o) { anelDesenho(o); },
  anelCabeca(o) { anelDesenho(o); },
  papel({ tc, F, W, H, S, q, cor, TXT }) {
    if (!TXT) return; const size = F.tam, gap = 40 * S; tc.font = `${size}px SpaceG`;
    const m = tc.measureText(TXT), wPal = m.width * .72, hPal = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || size * .72;
    const step = wPal + gap, lh = hPal / .92 * .98, drift = (q - .5) * step * .3;
    const linhaDe = r => r * step / 2 % step;
    tc.fillStyle = cor; tc.textBaseline = 'middle'; tc.textAlign = 'center';
    const r0 = -Math.ceil(F.y / lh) - 1, r1 = Math.ceil((H - F.y) / lh) + 1;
    for (let r = r0; r <= r1; r++) {
      const desl = linhaDe(r) - linhaDe(0) + (r % 2 ? drift : -drift), y = F.y + r * lh;
      const k0 = Math.floor((-F.x + desl - step) / step) - 1, k1 = Math.ceil((W - F.x + desl + step) / step) + 1;
      for (let k = k0; k <= k1; k++) { const x = F.x + k * step - desl, aceso = r === 0 && k === 0;
        tc.globalAlpha = aceso ? 1 : 40 / 255; tc.save(); tc.translate(x, y); tc.scale(.72, 1); tc.fillText(TXT, 0, 0); tc.restore(); }
    }
    F._box = { x: F.x + drift, y: F.y, w: wPal, h: hPal, rot: 0 };
  },
  palavras({ tc, F, W, H, S, q, cor, TXT }) {
    const extra = String(F.sub || '').split(/[\s,;·|]+/).filter(x => x.length > 2).map(x => x.toUpperCase());
    const ws = [TXT, ...extra].filter(Boolean); if (!ws.length) return;
    const size = F.tam, lh = size * 118 / 104, drift = q * 180 * S;
    tc.font = `700 ${size}px Neue, GenSans, sans-serif`; tc.textBaseline = 'top'; tc.fillStyle = cor;
    for (let r = 0; r * lh < H + lh; r++) {
      const x = -((r * 260 * S) % (900 * S)) + (r % 2 ? drift : -drift) - 300 * S, linha = Array.from({ length: 14 }, (_, i) => ws[(r + i) % ws.length]).join('  ');
      tc.globalAlpha = (r % 3 ? 70 : 150) / 255; tc.fillText(linha, x, r * lh);
    }
    F._box = { x: W / 2, y: H / 2, w: W * .9, h: H * .9, rot: 0 };
  },
  cordinha({ fc, F, W, H, S, q, cor, TXT }) {
    const e = ease(q * 2.2), y = F.y + (1 - e) * 520 * S, x = F.x, alt = 700 * S;
    const gr = fc.createLinearGradient(0, H - alt, 0, H), a = .78 * Math.min(1, e * 1.4);
    for (let i = 0; i <= 10; i++) gr.addColorStop(i / 10, `rgba(0,0,0,${a * (i / 10) ** 1.6})`);
    fc.fillStyle = gr; fc.fillRect(0, H - alt, W, alt);
    sombra(fc, S, 3, .35); fc.fillStyle = cor; fc.strokeStyle = cor; fc.textAlign = 'center'; fc.textBaseline = 'alphabetic';
    fc.font = `700 ${F.tam}px Neue, GenSans, sans-serif`; fc.fillText(TXT, x, y);
    if (F.sub) { fc.font = `500 ${F.tam / 3}px Neue, GenSans, sans-serif`; fc.fillStyle = '#e1e1e4'; fc.fillText(F.sub, x, y + F.tam * .54); }
    fc.lineWidth = 2 * S; fc.beginPath(); fc.moveTo(x, y + F.tam * .96); fc.lineTo(x, H); fc.stroke();
    fc.beginPath(); fc.arc(x, y + F.tam * .96, 6 * S, 0, 7); fc.stroke();
    fc.font = `700 ${F.tam}px Neue, GenSans, sans-serif`; F._box = { x, y: y - F.tam * .2, w: Math.max(fc.measureText(TXT).width, 80 * S), h: F.tam * 1.6, rot: 0 };
  },
  contorno({ fc, F, env, W, H, S, q, cor, TXT }) {
    const m = env.pessoa; if (!m) return; const a = m.alfa, x0 = Math.max(0, F.x - F.w / 2), x1 = Math.min(W - 1, F.x + F.w / 2), pts = [];
    for (let x = x0; x <= x1; x += 4) { const xi = Math.round(x); let yy = -1; for (let y = 0; y < H; y += 2) if (a[(y * W + xi) * 4 + 3] > 100) { yy = y; break; } if (yy >= 0 && yy < H * .97) pts.push([xi, yy - (F.margem ?? 40 * S)]); }
    if (pts.length < 4) return;
    const sm = pts.map((p, i) => { let sx = 0, sy = 0, n = 0; for (let j = Math.max(0, i - 6); j <= Math.min(pts.length - 1, i + 6); j++) { sx += pts[j][0]; sy += pts[j][1]; n++; } return [sx / n, sy / n]; });
    const sub = String(F.sub || '').toUpperCase(), unid = TXT + (sub ? '  ·  ' + sub : '') + '  ·  ';
    fc.font = `500 ${F.tam}px Neue, GenSans, sans-serif`; const esp = 3 * S, one = [...unid].reduce((acc, ch) => acc + fc.measureText(ch).width + esp, 0);
    const cum = [0]; for (let i = 1; i < sm.length; i++) cum.push(cum[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]));
    const total = cum[cum.length - 1], texto = unid.repeat(Math.ceil(total / Math.max(1, one)) + 3);
    const larg = [...texto].reduce((acc, ch) => acc + fc.measureText(ch).width + esp, 0);
    let acc = (total - larg) / 2 - (q * one * (F.vel || 1)) % one;
    sombra(fc, S, 5, .55, 2); fc.fillStyle = cor; fc.globalAlpha = .94; fc.textAlign = 'center'; fc.textBaseline = 'middle';
    let k = 0;
    for (const ch of texto) {
      const w = fc.measureText(ch).width, pos = acc + w / 2; acc += w + esp; if (pos < 0 || pos > total) continue;
      while (k < cum.length - 1 && cum[k + 1] < pos) k++;
      const p0 = sm[Math.max(0, k - 3)], p1 = sm[Math.min(sm.length - 1, k + 4)], u = (pos - cum[k]) / Math.max(1e-6, (cum[k + 1] ?? cum[k]) - cum[k]);
      const P = sm[k], Q = sm[Math.min(sm.length - 1, k + 1)], X = P[0] + (Q[0] - P[0]) * u, Y = P[1] + (Q[1] - P[1]) * u;
      fc.save(); fc.translate(X, Y); fc.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0])); fc.fillText(ch, 0, 0); fc.restore();
    }
  },
  aba({ fc, F, W, H, S, q, cor, TXT }) {
    const e = ease(q * 3), frac = F.frac ?? .36, wpx = Math.max(2, W * frac * e), dir = F.lado === 'direita';
    fc.save(); if (dir) { fc.translate(W, 0); fc.scale(-1, 1); }
    const gr = fc.createLinearGradient(0, 0, wpx, 0); for (let i = 0; i <= 12; i++) { const u = i / 12; gr.addColorStop(u, `rgba(0,0,0,${.94 * ((.5 + .5 * Math.cos(Math.PI * u)) ** 1.6)})`); }
    fc.fillStyle = gr; fc.fillRect(0, 0, wpx, H); fc.restore();
    if (!TXT) return; const y0 = 230 * S, y1 = H - 380 * S; let size = F.tam; fc.font = `700 ${size}px Neue, GenSans, sans-serif`;
    let w = fc.measureText(TXT).width; if (w > y1 - y0) { size *= (y1 - y0) / w; fc.font = `700 ${size}px Neue, GenSans, sans-serif`; w = fc.measureText(TXT).width; }
    const xc = (dir ? W - wpx * (F.pos ?? .245) - size * .4 : wpx * (F.pos ?? .245) + size * .4);
    sombra(fc, S, 8, .47, 4); fc.globalAlpha = Math.min(1, e * 1.2); fc.fillStyle = cor; fc.textAlign = 'center'; fc.textBaseline = 'middle';
    fc.save(); fc.translate(xc, (y0 + y1) / 2); fc.rotate(dir ? Math.PI / 2 : -Math.PI / 2); fc.fillText(TXT, 0, 0); fc.restore();
    F.x = xc; F.y = (y0 + y1) / 2; F._box = { x: xc, y: F.y, w: size * 1.1, h: w, rot: 0 };
  },
  rotulo(o) {
    const { fc, F, env, W, H, S, q, cor, TXT } = o; const m = env.objeto(F.obj); if (!m) return;
    const pt = ancora(m, W, H, F.ancora || 'top'); if (!pt) return;
    const side = pt.x > W * .55 ? -1 : 1;
    if (F.palavraAuto) { F.x = clamp(pt.x + side * 300 * S, 60 * S, W - 60 * S); F.y = clamp(pt.y - 180 * S, H * .12, H * .7); F.palavraAuto = false; }
    rotuloDesenho(fc, { x: pt.x, y: pt.y }, { x: F.x, y: F.y }, side, TXT, F.sub, F.tam, S, cor, ease(q * 3));
    fc.font = `700 ${F.tam}px Neue, GenSans, sans-serif`; const tw = fc.measureText(TXT).width;
    F._box = { x: F.x - side * 160 * S + side * tw / 2, y: F.y - F.tam * .3, w: tw + 20 * S, h: F.tam * 2.2, rot: 0 };
  },
  malha(o) {
    const { fc, F, env, W, H, S, q } = o; const m = env.objeto(F.obj); if (!m) return;
    const a = m.alfa, den = (x, y) => a[(Math.round(clamp(y, 0, H - 1)) * W + Math.round(clamp(x, 0, W - 1))) * 4 + 3] > 127;
    let bx0 = W, by0 = H, bx1 = 0, by1 = 0; for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) if (a[(y * W + x) * 4 + 3] > 127) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    if (bx1 <= bx0) return; let sem = 5; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
    const pts = []; for (let i = 0; i < 90 && pts.length < 34; i++) { const x = bx0 + rnd() * (bx1 - bx0), y = by0 + rnd() * (by1 - by0); if (den(x, y)) pts.push([x, y]); }
    const borda = bordaPontos(m, W, H, 20); pts.push(...borda);
    const appear = Math.min(1, q / .25), link = clamp((q - .2) / .3, 0, 1), sel = clamp((q - .45) / .15, 0, 1) * (1 - Math.max(0, (q - .9) / .1)), fade = 1 - Math.max(0, (q - .82) / .18);
    if (sel > 0) foco(fc, m, W, H, sel, 4 * S);
    fc.strokeStyle = `rgba(255,255,255,${.59 * fade})`; fc.lineWidth = 2 * S;
    const nLig = Math.floor(pts.length * link);
    for (let i = 0; i < nLig; i++) { const viz = pts.map((p, j) => [j, Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])]).filter(v => v[0] !== i).sort((u, v) => u[1] - v[1]).slice(0, 3);
      for (const [j] of viz) { const mx = (pts[i][0] + pts[j][0]) / 2, my = (pts[i][1] + pts[j][1]) / 2; if (!den(mx, my)) continue; fc.beginPath(); fc.moveTo(...pts[i]); fc.lineTo(...pts[j]); fc.stroke(); } }
    fc.fillStyle = `rgba(255,255,255,${.92 * fade})`; for (const [x, y] of pts.slice(0, Math.max(1, Math.floor(pts.length * appear)))) { fc.beginPath(); fc.arc(x, y, 5 * S, 0, 7); fc.fill(); }
    if (link > 0) contornoSuave(fc, m, W, H, .82 * fade * link, 3 * S);
    F._box = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, w: bx1 - bx0, h: by1 - by0, rot: 0 };
  },
  cristal(o) { realce(o, false); },
  destaque(o) { realce(o, true); },
};

function realce({ fc, F, env, W, H, S, q, cor, TXT, s }, abaixo) {
  const m = env.objeto(F.obj); if (!m) return;
  const e = s == null ? 1 : (abaixo ? Math.min(1, q / .15) * Math.min(1, (1 - q) / .12 + .1) : Math.min(1, q / .2) * Math.min(1, (1 - q) / .15 + .2));
  foco(fc, m, W, H, e, (abaixo ? 4 : 6) * S); contornoSuave(fc, m, W, H, (abaixo ? 90 : 70) / 255 * e, 2 * S);
  if (!TXT) return; const c0 = ancora(m, W, H, 'center'); if (!c0) return; const side = c0.x > W * .55 ? -1 : 1;
  if (F.palavraAuto !== false) { F.x = clamp(c0.x + side * 220 * S, 40 * S, W - 40 * S); F.y = abaixo ? Math.min(H - 420 * S, c0.y + 160 * S) : Math.max(260 * S, c0.y - 300 * S); F.palavraAuto = false; }
  rotuloDesenho(fc, c0, { x: F.x, y: F.y }, side, TXT, F.sub, F.tam, S, cor, 1);
  fc.font = `700 ${F.tam}px Neue, GenSans, sans-serif`; const tw = fc.measureText(TXT).width; F._box = { x: F.x - side * 160 * S + side * tw / 2, y: F.y - F.tam * .3, w: tw + 20 * S, h: F.tam * 2.2, rot: 0 };
}
// escurece o resto em degradê (mais escuro embaixo) e deixa o objeto intacto
function foco(c, m, W, H, e, blur) {
  const [t, g] = tela(W, H), gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(0,0,0,${.30 * e})`); gr.addColorStop(1, `rgba(0,0,0,${.55 * e})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'destination-out'; g.filter = `blur(${blur}px)`; g.drawImage(m.canvas, 0, 0); c.drawImage(t, 0, 0);
}
function contornoSuave(c, m, W, H, alfa, lw) {
  const [t, g] = tela(W, H); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(m.canvas, dx * lw, dy * lw);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'destination-out'; g.drawImage(m.canvas, 0, 0);
  c.save(); c.globalAlpha = alfa; c.drawImage(t, 0, 0); c.restore();
}
function bordaPontos(m, W, H, n) {
  const a = m.alfa, out = [], den = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 127;
  for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) if (den(x, y) && (!den(x - 6, y) || !den(x + 6, y) || !den(x, y - 6) || !den(x, y + 6))) out.push([x, y]);
  if (out.length <= n) return out; const st = out.length / n; return Array.from({ length: n }, (_, i) => out[Math.floor(i * st)]);
}
// C1: bolinha no ponto, linha com quebra horizontal e a palavra na ponta, com explicação curta
function rotuloDesenho(c, pt, end, side, word, sub, wsize, S, cor, e) {
  const elbow = { x: end.x - side * 160 * S, y: end.y }, p = { x: elbow.x + (pt.x - elbow.x) * e, y: elbow.y + (pt.y - elbow.y) * e }, dot = 10 * S;
  c.save(); sombra(c, S, 9, .84, 3); c.strokeStyle = 'rgba(255,255,255,.59)'; c.lineWidth = 2 * S; c.beginPath(); c.arc(p.x, p.y, dot + 8 * S, 0, 7); c.stroke();
  c.fillStyle = cor; c.beginPath(); c.arc(p.x, p.y, dot, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.94)'; c.lineWidth = 3 * S; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(elbow.x, elbow.y); c.lineTo(end.x, end.y); c.stroke();
  c.textAlign = side > 0 ? 'left' : 'right'; c.textBaseline = 'alphabetic'; c.fillStyle = cor; c.font = `700 ${wsize}px Neue, GenSans, sans-serif`; c.fillText(String(word || '').toUpperCase(), elbow.x, end.y - 16 * S);
  if (sub) { c.font = `500 ${wsize * .74}px Neue, GenSans, sans-serif`; c.fillStyle = '#f0f0f2'; c.fillText(sub, elbow.x, end.y + 46 * S); }
  c.restore();
}
// A1, A1b, B2: anel em perspectiva com a palavra (Space Grotesk) e a frase (Instrument Serif itálico) presas ao disco;
// ao chegar na ponta as letras estreitam, dobram e alargam do outro lado. Metade de cima atrás da pessoa.
function anelDesenho({ tc, fc, F, S, q, cor, TXT }) {
  const cx = F.x, cy = F.y, rx = Math.max(20, F.w / 2), ry = Math.max(8, F.h / 2), fs = F.tam, sp = 8 * S, two = 2 * Math.PI;
  const run = (q - .5) * .12 * Math.PI * clamp(+F.vel || 1, 0, 20) * (F._t == null ? 1 : 6);
  for (const [g, a0] of [[tc, Math.PI], [fc, 0]]) { g.save(); g.strokeStyle = 'rgba(255,255,255,.78)'; g.lineWidth = 4 * S; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, a0, a0 + Math.PI); g.stroke(); g.restore(); }
  const frente = String(F.sub || F.texto || '');
  const palavras = [[TXT, `${fs}px SpaceG`, fs, sp, 1.5 * Math.PI], [frente, `italic ${fs * .8}px InstrSI`, fs * .8, 2 * S, .5 * Math.PI]];
  for (const [txt, fonte, tam, spc, home] of palavras) {
    if (!txt) continue; tc.font = fonte;
    const thc = ((home - run) % two + two) % two, homeBack = Math.sin(thc) < 0, d = homeBack ? 1 : -1;
    const ws = [...txt].map(ch => tc.measureText(ch).width), total = ws.reduce((a, b) => a + b + spc, 0) - spc; let acc = -total / 2; const lets = [];
    [...txt].forEach((ch, i) => { const o = acc + ws[i] / 2; acc += ws[i] + spc; const th = ((thc + d * o / rx) % two + two) % two; lets.push([ch, o, th, (Math.sin(th) < 0) !== homeBack]); });
    for (const sign of [1, -1]) { const grp = lets.filter(x => x[3] && (x[1] > 0) === (sign > 0)), pos = grp.map(x => x[2]).reverse(); grp.forEach((x, i) => { x[2] = pos[i]; }); }
    for (const [ch, , th] of lets) {
      const sn = Math.sin(th), back = sn < 0, g = back ? tc : fc; if (!ch.trim()) continue;
      const squeeze = Math.max(.06, Math.abs(sn)), depth = 1 + .1 * sn;
      let tang = Math.atan2(ry * Math.cos(th), -rx * sn) * 180 / Math.PI; if (!back) tang += 180;
      tang = ((tang + 90) % 180 + 180) % 180 - 90; tang = clamp(tang, -40, 40) * Math.min(1, Math.abs(sn) * 1.6);
      const lift = (back ? -fs * .66 : tam * .7) * Math.abs(sn);
      g.save(); sombra(g, S); g.font = fonte; g.fillStyle = cor; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.translate(cx + rx * Math.cos(th), cy + ry * sn + lift); g.rotate(tang * Math.PI / 180); g.scale(squeeze * depth, depth); g.fillText(ch, 0, 0); g.restore();
    }
  }
  F._box = { x: cx, y: cy, w: 2 * rx + fs, h: 2 * ry + fs * 1.6, rot: 0 };
}

// Entrada e movimento dos textos comuns no clipe (letreiros do Video Studio: fade, subir, letras subindo, deriva, varredura).
export const ENTRADAS = [['', 'Sem entrada'], ['fade', 'Aparecer (fade)'], ['rise', 'Subir'], ['letras', 'Letras subindo'], ['pop', 'Surgir maior'], ['drift', 'Deriva lenta para cima'], ['sweep', 'Varredura lateral']];
export function aplicarEntrada(A, tempo, W, dur) {
  if (!A.entrada || tempo == null) return A; const S = W / 1080, ini = +A.inicio || 0, p = clamp((tempo - ini) / Math.max(.1, +A.durEntrada || .6), 0, 1), e = ease(p), B = { ...A };
  if (tempo < ini) { B.opac = 0; return B; }
  if (A.entrada === 'fade') B.opac = (A.opac ?? 1) * e;
  else if (A.entrada === 'rise') { B.opac = (A.opac ?? 1) * e; B.y = A.y + (1 - e) * 60 * S; }
  else if (A.entrada === 'letras') { B.opac = (A.opac ?? 1) * e; B.y = A.y + (1 - e) * 40 * S; B.esp = (A.esp || 0) + (1 - e) * .08; }
  else if (A.entrada === 'pop') { B.opac = (A.opac ?? 1) * e; B.sx = (A.sx ?? 1) * (1.15 - .15 * e); B.sy = (A.sy ?? 1) * (1.15 - .15 * e); }
  else if (A.entrada === 'drift') { B.opac = (A.opac ?? 1) * e; B.y = A.y - 18 * S * ((tempo - ini) / Math.max(.5, dur - ini) - .5) * 2; }
  else if (A.entrada === 'sweep') { B.opac = (A.opac ?? 1) * e; B.x = A.x + 40 * S * (1 - 2 * clamp((tempo - ini) / Math.max(.5, dur - ini), 0, 1)); }
  return B;
}
