// Filtro de canvas no iPhone (Caio 24/11 21:28: janela de realidade, desfoque difuso e fronteira de foco não faziam nada).
// O Safari do iPhone ignora ctx.filter ('blur(...)', 'brightness(...)' etc.), e todos os desfoques do editor dependem dele.
// Este módulo testa se o filtro funciona de verdade; se não funcionar, emula: a operação de desenho vai para uma tela
// à parte, recebe o desfoque (redução + média de deslocamentos + ampliação suave) e os ajustes de cor por pixel, e volta
// para a tela original respeitando transparência, modo de mistura e recorte. No Mac (Chrome/Safari com filtro) não muda nada.
const P = CanvasRenderingContext2D.prototype;
function filtroFunciona() {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 9; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 9, 9); g.filter = 'blur(2px)'; g.fillStyle = '#fff'; g.fillRect(4, 4, 1, 1); g.filter = 'none';
    return g.getImageData(2, 4, 1, 1).data[0] > 0;
  } catch (e) { return true; }
}
export const filtroEmulado = !filtroFunciona() || /[?&]semfiltro\b/.test(location.search);   // ?semfiltro força a emulação (teste)
if (filtroEmulado) {
  const original = {}; for (const n of ['drawImage', 'fill', 'fillRect', 'fillText', 'stroke', 'strokeRect', 'strokeText', 'save', 'restore', 'getImageData', 'putImageData']) original[n] = P[n];
  const atual = new WeakMap(), pilha = new WeakMap();
  Object.defineProperty(P, 'filter', { configurable: true, get() { return atual.get(this) || 'none'; }, set(v) { atual.set(this, String(v || 'none')); } });
  P.save = function () { let s = pilha.get(this); if (!s) pilha.set(this, s = []); s.push(atual.get(this) || 'none'); return original.save.call(this); };
  P.restore = function () { const s = pilha.get(this); if (s?.length) atual.set(this, s.pop()); return original.restore.call(this); };
  const ler = f => { const ops = []; String(f).replace(/([a-z-]+)\(([^)]*)\)/gi, (m, n, a) => { ops.push([n.toLowerCase(), parseFloat(a)]); return m; }); return ops; };
  // telas de trabalho reaproveitadas por posição (criar telas cheias a cada desenho pesava no iPhone)
  const POOL = {};
  const tela = (w, h, slot = 'a') => { w = Math.max(1, w); h = Math.max(1, h); let c = POOL[slot];
    if (!c || c.width !== w || c.height !== h) { c = POOL[slot] = document.createElement('canvas'); c.width = w; c.height = h; }
    const g = c.getContext('2d'); original.save.call(g); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); original.restore.call(g);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; return [c, g]; };
  function desfocar(c, r) {
    if (!(r > .4)) return;
    const w = c.width, h = c.height, f = Math.max(1, r / 2), sw = Math.max(1, Math.round(w / f)), sh = Math.max(1, Math.round(h / f));
    const [a, ga] = tela(sw, sh, 'b'); ga.imageSmoothingEnabled = true; ga.imageSmoothingQuality = 'high'; original.drawImage.call(ga, c, 0, 0, sw, sh);
    const [b, gb] = tela(sw, sh, 'c'), passos = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    passos.forEach(([dx, dy], i) => { gb.globalAlpha = 1 / (i + 1); original.drawImage.call(gb, a, dx, dy); });   // média corrida = caixa 3x3
    const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'copy';
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; original.drawImage.call(g, b, 0, 0, w, h); g.restore();
  }
  function cores(c, ops) {
    if (!ops.length) return; const g = c.getContext('2d'), img = original.getImageData.call(g, 0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue; let r = d[i], gg = d[i + 1], b = d[i + 2];
      for (const [n, v] of ops) {
        if (n === 'brightness') { r *= v; gg *= v; b *= v; }
        else if (n === 'contrast') { r = (r - 128) * v + 128; gg = (gg - 128) * v + 128; b = (b - 128) * v + 128; }
        else if (n === 'saturate') { const l = .2126 * r + .7152 * gg + .0722 * b; r = l + (r - l) * v; gg = l + (gg - l) * v; b = l + (b - l) * v; }
        else if (n === 'grayscale') { const l = .2126 * r + .7152 * gg + .0722 * b, k = Math.min(1, v); r += (l - r) * k; gg += (l - gg) * k; b += (l - b) * k; }
      }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    original.putImageData.call(g, img, 0, 0);
  }
  const COPIAR = ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'imageSmoothingEnabled', 'imageSmoothingQuality', 'letterSpacing'];
  for (const nome of ['drawImage', 'fill', 'fillRect', 'fillText', 'stroke', 'strokeRect', 'strokeText']) {
    P[nome] = function (...a) {
      const f = atual.get(this), ops = f && f !== 'none' ? ler(f) : [];
      // fill()/stroke() sem Path2D usam o caminho atual, que não passa para outra tela: desenha sem filtro
      if (!ops.length || ((nome === 'fill' || nome === 'stroke') && !(a[0] instanceof Path2D))) return original[nome].apply(this, a);
      const alvo = this.canvas, [t, g] = tela(alvo.width, alvo.height);
      for (const k of COPIAR) if (k in this) try { g[k] = this[k]; } catch (e) { }
      g.setTransform(this.getTransform()); original[nome].apply(g, a);
      desfocar(t, ops.filter(o => o[0] === 'blur').reduce((s, o) => s + (o[1] || 0), 0));
      cores(t, ops.filter(o => o[0] !== 'blur'));
      original.save.call(this); this.setTransform(1, 0, 0, 1, 0, 0); atual.set(this, 'none');
      original.drawImage.call(this, t, 0, 0); original.restore.call(this); atual.set(this, f);
    };
  }
}
