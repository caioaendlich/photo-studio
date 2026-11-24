// Fundo e ambiente do Photo Studio (Caio, 24/11/2026 04:24): os tratamentos de imagem da Montagem trazidos para a foto,
// com a mesma matemática (montage_effects.color_filter, person_mask.ambience_filters, bg_shade, bottom_shade):
// cor e filtros na foto toda; ambiente com pessoa e fundo separados; fundo trocado (desfoque, preto, branco, cor,
// estúdio, imagem); luz e degradê só no fundo; escurecer da frente; vinheta. Assim a foto ganha planos: fundo (3º),
// pessoa (2º) e o que fica na frente (1º), com os textos podendo passar entre eles.

export const LOOKS = [
  ['natural', 'Natural', {}], ['clinico', 'Clínico', { brilho: 0, contraste: 8, definicao: 25 }], ['quente', 'Luz quente', { temperatura: 35, saturacao: 5, brilho: 3 }],
  ['editorial', 'Editorial', { contraste: 7, saturacao: 2, vinheta: 10 }], ['suave', 'Suave', { contraste: -3, brilho: 1, saturacao: 2 }],
  ['noir', 'P&B', { saturacao: -100, contraste: 20, vinheta: 30 }], ['vivido', 'Vívido', { saturacao: 9, contraste: 4, definicao: 8 }],
  ['clara', 'Clínica clara', { brilho: 6, contraste: -4, saturacao: -6, temperatura: -8 }], ['pele', 'Pele natural', { brilho: 2, contraste: -2, saturacao: -4, temperatura: 12 }],
  ['cinema', 'Cinema suave', { contraste: 10, saturacao: -12, temperatura: 8, vinheta: 18 }], ['dourado', 'Dourado', { brilho: -2, contraste: 6, saturacao: -8, temperatura: 22, vinheta: 12 }],
];
export const CAMPOS_COR = [['brilho', 'Brilho', -100], ['contraste', 'Contraste', -100], ['saturacao', 'Saturação', -100], ['temperatura', 'Temperatura', -100], ['definicao', 'Definição', 0], ['vinheta', 'Vinheta', 0]];
export const AMBIENTES = [['', 'Nenhum'], ['clara', 'Clínica clara'], ['spa', 'Spa meia-luz'], ['editorial', 'Editorial']];
export const FUNDOS = [['', 'Original'], ['desfoque', 'Desfocado'], ['estudio', 'Estúdio'], ['preto', 'Preto'], ['branco', 'Branco'], ['cor', 'Cor'], ['imagem', 'Imagem']];
// Combinações prontas de planos (um clique): fundo tratado + ambiente + luz, para separar pessoa e cenário.
export const PLANOS = [
  ['profundidade', 'Profundidade suave', { fundo: 'desfoque', desfoqueFundo: 14, ambiente: 'editorial', intensidade: 60, gradienteFundo: 30, direcaoGradiente: 'baixo' }],
  ['estudioEscuro', 'Estúdio escuro', { fundo: 'estudio', corFundo: '#16181a', ambiente: 'spa', intensidade: 70, vinheta: 20 }],
  ['estudioClaro', 'Estúdio claro', { fundo: 'estudio', corFundo: '#e9e6e0', ambiente: 'clara', intensidade: 60 }],
  ['editorialPreto', 'Editorial preto', { fundo: 'preto', ambiente: 'editorial', intensidade: 70, contraste: 8 }],
  ['spa', 'Spa meia-luz', { ambiente: 'spa', intensidade: 70, gradienteFundo: 35, direcaoGradiente: 'cima', temperatura: 10 }],
  ['frenteEscura', 'Frente escura', { escurecerFrente: true, frenteDe: 74, frenteFaixa: 16, ambiente: 'editorial', intensidade: 50 }],
];
export const PADRAO = { look: 'natural', brilho: 0, contraste: 0, saturacao: 0, temperatura: 0, definicao: 0, vinheta: 0,
  ambiente: '', intensidade: 60, fundo: '', desfoqueFundo: 14, corFundo: '#16181a', luzFundo: 0, gradienteFundo: 0, direcaoGradiente: 'baixo',
  escurecerFrente: false, frenteDe: 78, frenteFaixa: 12, luzPessoa: 0 };

export const ativo = f => !!f && Object.keys(PADRAO).some(k => k !== 'look' && k !== 'intensidade' && k !== 'desfoqueFundo' && k !== 'corFundo' && k !== 'direcaoGradiente' && k !== 'frenteDe' && k !== 'frenteFaixa' && (f[k] ?? PADRAO[k]) !== PADRAO[k]);
const precisaMascara = f => !!(f.ambiente || f.fundo || f.luzFundo || f.gradienteFundo || f.luzPessoa);

function parametros(f) {   // colorParams da Montagem
  const v = k => Number(f[k] || 0);
  return { brilho: 1 + v('brilho') / 100 * .4, contraste: 1 + v('contraste') / 100 * .6, saturacao: Math.max(0, 1 + v('saturacao') / 100),
    temperatura: v('temperatura') / 100 * .1, definicao: Math.max(0, v('definicao')) / 100 * .6, vinheta: Math.max(0, v('vinheta')) / 100 * .75 };
}
const tela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// cor da foto toda: brilho/contraste/saturação pelo filtro do navegador (mesmas fórmulas do ffmpeg) e temperatura/definição por pixel
function corGlobal(src, w, h, f) {
  const p = parametros(f), c = tela(w, h), g = c.getContext('2d');
  const filtros = []; if (p.brilho !== 1) filtros.push(`brightness(${p.brilho})`); if (p.contraste !== 1) filtros.push(`contrast(${p.contraste})`); if (p.saturacao !== 1) filtros.push(`saturate(${p.saturacao})`);
  g.filter = filtros.join(' ') || 'none'; g.drawImage(src, 0, 0); g.filter = 'none';
  if (p.temperatura || p.definicao) {
    const id = g.getImageData(0, 0, w, h), d = id.data, kr = 1 + p.temperatura, kb = 1 - p.temperatura;
    if (p.temperatura) for (let i = 0; i < d.length; i += 4) { d[i] = Math.min(255, d[i] * kr); d[i + 2] = Math.min(255, d[i + 2] * kb); }
    if (p.definicao) {   // nitidez 3x3 (mesmo núcleo da Montagem)
      const a = p.definicao, o = new Uint8ClampedArray(d), lw = w * 4;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * lw + x * 4;
        for (let k = 0; k < 3; k++) d[i + k] = (1 + 4 * a) * o[i + k] - a * (o[i + k - 4] + o[i + k + 4] + o[i + k - lw] + o[i + k + lw]); }
    }
    g.putImageData(id, 0, 0);
  }
  return c;
}
// curva de tons médios da Montagem: val + k*4*val*(255-val)/255
function levantar(c, k) {
  if (!k) return; const g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), d = id.data, lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = v + k * 4 * v * (255 - v) / 255;
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  g.putImageData(id, 0, 0);
}
function multiplicar(c, r, g_, b) { const g = c.getContext('2d'); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgb(${r * 255},${g_ * 255},${b * 255})`; g.fillRect(0, 0, c.width, c.height); g.restore(); }

let CACHE = { k: null, c: null };
// Desenha a foto já tratada no quadro. `enquadrar(g, src)` é o cobrir do editor; `mascara()` devolve o canvas da pessoa
// enquadrado (ou null); `imagemFundo` é a imagem escolhida para o fundo.
export function desenharFotoTratada(ctx, { foto, enquadrar, mascara, imagemFundo, w, h, f, chave }) {
  if (!ativo(f)) { enquadrar(ctx, foto); return; }
  const k = chave + '|' + JSON.stringify(f);
  if (CACHE.k === k && CACHE.c) { ctx.drawImage(CACHE.c, 0, 0); return; }
  const base = tela(w, h); enquadrar(base.getContext('2d'), foto);
  const cor = corGlobal(base, w, h, f), a = Math.max(0, Math.min(1, (f.intensidade ?? 60) / 100));
  const m = precisaMascara(f) ? mascara() : null, out = tela(w, h), o = out.getContext('2d');
  if (m) {
    // fundo (3º plano)
    const bg = tela(w, h), bgc = bg.getContext('2d');
    if (f.fundo === 'desfoque') { bgc.filter = `blur(${Math.max(1, f.desfoqueFundo || 14)}px)`; bgc.drawImage(cor, -20, -20, w + 40, h + 40); bgc.filter = 'none'; }
    else if (f.fundo === 'preto' || f.fundo === 'branco' || f.fundo === 'cor') { bgc.fillStyle = f.fundo === 'preto' ? '#000' : f.fundo === 'branco' ? '#fff' : (f.corFundo || '#16181a'); bgc.fillRect(0, 0, w, h); }
    else if (f.fundo === 'estudio') { const c0 = f.corFundo || '#16181a', gr = bgc.createRadialGradient(w * .5, h * .42, 0, w * .5, h * .5, Math.hypot(w, h) * .62);
      gr.addColorStop(0, misturar(c0, '#ffffff', .18)); gr.addColorStop(.55, c0); gr.addColorStop(1, misturar(c0, '#000000', .45)); bgc.fillStyle = gr; bgc.fillRect(0, 0, w, h); }
    else if (f.fundo === 'imagem' && imagemFundo) { enquadrarCobrir(bgc, imagemFundo, w, h); }
    else bgc.drawImage(cor, 0, 0);
    if (f.ambiente === 'spa') { const dk = 1 - .28 * a; multiplicar(bg, dk, dk, dk * (1 - .04 * a)); }
    else if (f.ambiente === 'clara') levantar(bg, .055 * a);
    else if (f.ambiente === 'editorial') { const dk = 1 - .18 * a; multiplicar(bg, dk, dk, dk); }
    if (f.luzFundo) { bgc.save(); bgc.globalCompositeOperation = 'lighter'; const v = Math.round(f.luzFundo / 100 * .22 * 255); bgc.fillStyle = `rgb(${v},${v},${v})`; bgc.fillRect(0, 0, w, h); bgc.restore(); }
    if (f.gradienteFundo) { const op = f.gradienteFundo / 100 * .65, topo = f.direcaoGradiente === 'cima', gr = bgc.createLinearGradient(0, topo ? 0 : h, 0, topo ? h : 0);
      gr.addColorStop(0, `rgba(0,0,0,${op})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); bgc.fillStyle = gr; bgc.fillRect(0, 0, w, h); }
    o.drawImage(bg, 0, 0);
    // pessoa (2º plano)
    const fg = tela(w, h), fgc = fg.getContext('2d');
    if (f.ambiente === 'editorial') { fgc.filter = `contrast(${1 + .035 * a})`; fgc.drawImage(cor, 0, 0); fgc.filter = 'none'; } else fgc.drawImage(cor, 0, 0);
    if (f.ambiente === 'spa') levantar(fg, .06 * a); else if (f.ambiente === 'clara') levantar(fg, .055 * a);
    if (f.luzPessoa) levantar(fg, f.luzPessoa / 100 * .12);
    fgc.globalCompositeOperation = 'destination-in'; fgc.drawImage(m, 0, 0);
    o.drawImage(fg, 0, 0);
  } else o.drawImage(cor, 0, 0);
  // escurecer da frente: do transparente ao preto, no quadro todo (mesa, colo)
  if (f.escurecerFrente) { const de = Math.max(.4, Math.min(.98, (f.frenteDe ?? 78) / 100)), fx = Math.max(.02, Math.min(.5, (f.frenteFaixa ?? 12) / 100)), gr = o.createLinearGradient(0, h * de, 0, h * Math.min(1, de + fx));
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); o.fillStyle = gr; o.fillRect(0, h * de, w, h * (1 - de)); }
  const vin = parametros(f).vinheta;
  if (vin > 0) { const r = Math.hypot(w / 2, h / 2), gr = o.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${vin})`); o.fillStyle = gr; o.fillRect(0, 0, w, h); }
  CACHE = { k, c: out }; ctx.drawImage(out, 0, 0);
}
function enquadrarCobrir(g, img, w, h) { const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, s = Math.max(w / iw, h / ih); g.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s); }
function misturar(a, b, t) { const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
