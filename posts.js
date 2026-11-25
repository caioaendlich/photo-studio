// Aba Posts e stories.
// v1 (23/11 21:56) Molde Corte · v2 (23/11 22:02) estilos, planos por objeto, elementos · Codex: efeitos editoriais, projeto, animação.
// v3 (Caio 24/11/2026 01:12, Claude): mesma liberdade de edição do Video Studio em qualquer camada (texto, molde, formas, PNG e
// objetos detectados na foto): bolinhas nos cantos (tamanho), nas laterais (esticar), giro e inclinação, guias de centro e
// margem; clique fora desseleciona; objetos detectados viram camadas soltas; formas refeitas (preenchimento, contorno, traço,
// cantos, sombra, pontas); molde com fonte, peso, linha e frase opcionais e "Separar em camadas"; desfazer/refazer, zoom,
// edição de texto direto na arte, ocultar camada, atalhos e linha do tempo com os pontos gravados.
import './posts-canvas-filter.js';   // precisa vir primeiro: emula ctx.filter no iPhone
import { EDITORIAL_EFFECTS, isEditorialEffect, makeEditorialEffect, drawEditorialEffect, alvoAmpliacao } from './posts-editorial-effects.js';
import { interpolate, snapshot, saveKeyframe, removeKeyframe, exportCanvasVideo, animationMime } from './posts-motion.js';
import { makeAnalysis, drawAnalysis, installFocusDrawing } from './posts-analysis.js';
import { makeDiffuse, drawDiffuse } from './posts-diffuse.js';
import { quadPoints, validQuad } from './posts-optics.js';
import { RECEITAS, receitaPorId, novaReceita, desenharReceita, ENTRADAS, aplicarEntrada } from './posts-recipes.js';
import { LOOKS, CAMPOS_COR, AMBIENTES, FUNDOS, PLANOS, PADRAO as FUNDO_PADRAO, desenharFotoTratada } from './posts-fundo.js';
const $ = id => document.getElementById(id);
const cv = $('canvas'), ctx = cv.getContext('2d');
const MARGEM = 84, U = 14, OSSO = '#f1eee8', GRAFITE = '#141518';
const ACENTO = new Set('ÂÊÎÔÛÁÉÍÓÚÀÈÌÒÙÃÕÄËÏÖÜ');
// nome na tela → [família CSS, arquivo, faixa de peso]
const FONTES = {
  'Montserrat': ['Mont', 'Montserrat-Variable.ttf', '100 900'], 'Neue Montreal': ['Neue'], 'Space Grotesk': ['SpaceG', 'SpaceGrotesk-Bold.ttf'],
  'Jost': ['Jost'], 'Inter': ['InterF', 'Inter-Regular.ttf'], 'Anton': ['AntonF', 'Anton-Regular.ttf'], 'Six Caps (condensada)': ['SixCaps', 'SixCaps.ttf'],
  'Squada One': ['Squada', 'SquadaOne-Regular.ttf'], 'Russo One': ['Russo', 'RussoOne-Regular.ttf'], 'Chakra Petch': ['Chakra', 'ChakraPetch-Bold.ttf'],
  'Orbitron': ['Orbitron', 'Orbitron-Black.ttf'], 'Bungee': ['Bungee', 'Bungee-Regular.ttf'],
  'General Sans': ['GenSans'], 'Satoshi': ['Satoshi'], 'Supreme': ['Supreme'], 'Archivo': ['ArchivoF'], 'Synonym (fina)': ['Synonym'], 'Melodrama (brincadeira)': ['Melodrama'],
  'Editorial New (detalhe)': ['EdNew', 'EditorialNew-Italic.otf'], 'Instrument Serif (detalhe)': ['InstrS', 'InstrumentSerif-Regular.ttf'], 'Bodoni Moda (detalhe)': ['Bodoni', 'BodoniModa-Black.ttf'],
};
// Fontshare (ITF Free Font License, uso comercial livre): famílias que Caio adicionou em 24/11/2026, todos os pesos.
const FONTSHARE = [["ArchivoF","fontshare/Archivo-Black.woff2",900,"normal"],["ArchivoF","fontshare/Archivo-BlackItalic.woff2",900,"italic"],["ArchivoF","fontshare/Archivo-Bold.woff2",700,"normal"],["ArchivoF","fontshare/Archivo-BoldItalic.woff2",700,"italic"],["ArchivoF","fontshare/Archivo-ExtraBold.woff2",800,"normal"],["ArchivoF","fontshare/Archivo-ExtraBoldItalic.woff2",800,"italic"],["ArchivoF","fontshare/Archivo-ExtraLight.woff2",200,"normal"],["ArchivoF","fontshare/Archivo-ExtraLightItalic.woff2",200,"italic"],["ArchivoF","fontshare/Archivo-Italic.woff2",400,"italic"],["ArchivoF","fontshare/Archivo-Light.woff2",300,"normal"],["ArchivoF","fontshare/Archivo-LightItalic.woff2",300,"italic"],["ArchivoF","fontshare/Archivo-Medium.woff2",500,"normal"],["ArchivoF","fontshare/Archivo-MediumItalic.woff2",500,"italic"],["ArchivoF","fontshare/Archivo-Regular.woff2",400,"normal"],["ArchivoF","fontshare/Archivo-SemiBold.woff2",600,"normal"],["ArchivoF","fontshare/Archivo-SemiBoldItalic.woff2",600,"italic"],["ArchivoF","fontshare/Archivo-Thin.woff2",100,"normal"],["ArchivoF","fontshare/Archivo-ThinItalic.woff2",100,"italic"],["GenSans","fontshare/GeneralSans-Bold.woff2",700,"normal"],["GenSans","fontshare/GeneralSans-BoldItalic.woff2",700,"italic"],["GenSans","fontshare/GeneralSans-Extralight.woff2",200,"normal"],["GenSans","fontshare/GeneralSans-ExtralightItalic.woff2",200,"italic"],["GenSans","fontshare/GeneralSans-Italic.woff2",400,"italic"],["GenSans","fontshare/GeneralSans-Light.woff2",300,"normal"],["GenSans","fontshare/GeneralSans-LightItalic.woff2",300,"italic"],["GenSans","fontshare/GeneralSans-Medium.woff2",500,"normal"],["GenSans","fontshare/GeneralSans-MediumItalic.woff2",500,"italic"],["GenSans","fontshare/GeneralSans-Regular.woff2",400,"normal"],["GenSans","fontshare/GeneralSans-Semibold.woff2",600,"normal"],["GenSans","fontshare/GeneralSans-SemiboldItalic.woff2",600,"italic"],["Melodrama","fontshare/Melodrama-Bold.woff2",700,"normal"],["Melodrama","fontshare/Melodrama-Light.woff2",300,"normal"],["Melodrama","fontshare/Melodrama-Medium.woff2",500,"normal"],["Melodrama","fontshare/Melodrama-Regular.woff2",400,"normal"],["Melodrama","fontshare/Melodrama-Semibold.woff2",600,"normal"],["Satoshi","fontshare/Satoshi-Black.woff2",900,"normal"],["Satoshi","fontshare/Satoshi-BlackItalic.woff2",900,"italic"],["Satoshi","fontshare/Satoshi-Bold.woff2",700,"normal"],["Satoshi","fontshare/Satoshi-BoldItalic.woff2",700,"italic"],["Satoshi","fontshare/Satoshi-Italic.woff2",400,"italic"],["Satoshi","fontshare/Satoshi-Light.woff2",300,"normal"],["Satoshi","fontshare/Satoshi-LightItalic.woff2",300,"italic"],["Satoshi","fontshare/Satoshi-Medium.woff2",500,"normal"],["Satoshi","fontshare/Satoshi-MediumItalic.woff2",500,"italic"],["Satoshi","fontshare/Satoshi-Regular.woff2",400,"normal"],["Supreme","fontshare/Supreme-Bold.woff2",700,"normal"],["Supreme","fontshare/Supreme-BoldItalic.woff2",700,"italic"],["Supreme","fontshare/Supreme-Extrabold.woff2",800,"normal"],["Supreme","fontshare/Supreme-ExtraboldItalic.woff2",800,"italic"],["Supreme","fontshare/Supreme-Extralight.woff2",200,"normal"],["Supreme","fontshare/Supreme-ExtralightItalic.woff2",200,"italic"],["Supreme","fontshare/Supreme-Italic.woff2",400,"italic"],["Supreme","fontshare/Supreme-Light.woff2",300,"normal"],["Supreme","fontshare/Supreme-LightItalic.woff2",300,"italic"],["Supreme","fontshare/Supreme-Medium.woff2",500,"normal"],["Supreme","fontshare/Supreme-MediumItalic.woff2",500,"italic"],["Supreme","fontshare/Supreme-Regular.woff2",400,"normal"],["Supreme","fontshare/Supreme-Thin.woff2",100,"normal"],["Supreme","fontshare/Supreme-ThinItalic.woff2",100,"italic"],["Synonym","fontshare/Synonym-Bold.woff2",700,"normal"],["Synonym","fontshare/Synonym-Extralight.woff2",200,"normal"],["Synonym","fontshare/Synonym-Light.woff2",300,"normal"],["Synonym","fontshare/Synonym-Medium.woff2",500,"normal"],["Synonym","fontshare/Synonym-Regular.woff2",400,"normal"],["Synonym","fontshare/Synonym-Semibold.woff2",600,"normal"]];
const st = { fundo: { ...FUNDO_PADRAO }, imgFundo: null, imgFundoSrc: null, formato: 'feed', img: null, pessoa: null, objetos: [], camadas: [], sel: -1, estilo: null, cache: {}, zoom: null, guias: null,
  motion: { duration: 6, time: 0, preview: false } };
const W = () => 1080, H = () => st.formato === 'story' ? 1920 : 1350;

// ---------- aviso flutuante ----------
let statusT = 0;
const servidorAntigo = m => /utf-8' codec can't decode|Unexpected token|not valid JSON|501/i.test(m);
function status(m, erro, acao) {
  const s = $('status'); m = String(m);
  let texto = m;
  if (servidorAntigo(m)) { texto = m.replace(/:.*$/s, '') + ': o Video Studio do Mac está com o servidor antigo.'; acao = acao || ['Reiniciar o Video Studio', reiniciarServidor]; }
  else if (/Failed to fetch|NetworkError|Load failed/i.test(m)) texto = m.replace(/:.*$/s, '') + ': o Video Studio do Mac não está respondendo.';
  s.replaceChildren(texto);
  if (acao) { const b = document.createElement('button'); b.textContent = acao[0]; b.style.cssText = 'margin-left:10px;padding:4px 9px;font-size:11px;border-radius:6px'; b.onclick = acao[1]; s.append(b); }
  s.className = 'pstatus' + (erro ? ' error' : ''); clearTimeout(statusT); statusT = setTimeout(() => s.classList.add("hide"), acao ? 15000 : erro ? 9000 : 4000);
}
async function reiniciarServidor() {
  try { const r = await fetch('/api/restart', { method: 'POST' }); const j = await r.json(); status((j.message || 'Reiniciando.') + ' Depois recarregue a página.'); setTimeout(() => location.reload(), 11000); }
  catch (e) { status('Não consegui reiniciar daqui. Feche e abra o Video Studio no Mac.', true); }
}

async function carregarFontes() {
  const f = [new FontFace('Mont', 'url(fonts/Montserrat-Variable.ttf)', { weight: '100 900' }),
    new FontFace('Neue', 'url(fonts/NeueMontreal-Regular.ttf)', { weight: '400' }), new FontFace('Neue', 'url(fonts/NeueMontreal-Medium.ttf)', { weight: '500' }),
    new FontFace('Neue', 'url(fonts/NeueMontreal-Bold.ttf)', { weight: '700' }), new FontFace('Jost', 'url(fonts/Jost-Light.ttf)', { weight: '300' }),
    new FontFace('Jost', 'url(fonts/Jost-Regular.ttf)', { weight: '400' }), new FontFace('Jost', 'url(fonts/Jost-Medium.ttf)', { weight: '500' }),
    ...Object.values(FONTES).filter(v => v[1] && v[0] !== 'Mont').map(([fam, arq]) => new FontFace(fam, `url(fonts/${arq})`)),
    ...FONTSHARE.map(([fam, arq, peso, estilo]) => new FontFace(fam, `url(fonts/${arq})`, { weight: String(peso), style: estilo }))];
  await Promise.all(f.map(async x => { try { await x.load(); document.fonts.add(x); } catch {} }));
}
const familia = n => (FONTES[n] || FONTES.Montserrat)[0];

// Enquadramento da foto: cobre o quadro (fx, fy dentro da sobra) e aceita deslocamento livre em pixels (ox, oy),
// como na Montagem: a foto pode sair da tela e volta encaixando no centro ou nas bordas (Caio 24/11 03:44).
function enquadramento(src = st.img, w = W(), h = H()) {
  const iw = src.naturalWidth || src.width, ih = src.naturalHeight || src.height, s = Math.max(w / iw, h / ih) * Math.max(.3, Math.min(5, +$('fz').value || 1)), dw = iw * s, dh = ih * s, k = w / W();
  return { s, dw, dh, x: (w - dw) * +$('fx').value + (+$('ox').value || 0) * k, y: (h - dh) * +$('fy').value + (+$('oy').value || 0) * k };
}
function posicionarFoto(x, y, E = enquadramento()) {
  const eixo = (pos, sobra, f, o) => { if (sobra > 1) { const v = Math.max(0, Math.min(1, -pos / sobra)); $(f).value = v; $(o).value = pos + v * sobra; } else $(o).value = pos + sobra * +$(f).value; };
  eixo(x, E.dw - W(), 'fx', 'ox'); eixo(y, E.dh - H(), 'fy', 'oy');
}
// Ao soltar: se a foto cobre o quadro (zoom >= 1) e sobrou uma faixa vazia pequena na borda, ela volta a preencher;
// zoom quase 1 e quase centralizada volta ao enquadramento exato (autocentralização da Montagem).
function encaixarFoto() {
  if (!st.img) return; let E = enquadramento();
  const fz = +$('fz').value || 1;
  if (Math.abs(fz - 1) < .03) { $('fz').value = 1; E = enquadramento(); }
  let x = E.x, y = E.y; const folgaX = W() * .08, folgaY = H() * .08;
  if (E.dw >= W() - 1) { if (x > 0 && x < folgaX) x = 0; if (x + E.dw < W() && W() - x - E.dw < folgaX) x = W() - E.dw; }
  if (E.dh >= H() - 1) { if (y > 0 && y < folgaY) y = 0; if (y + E.dh < H() && H() - y - E.dh < folgaY) y = H() - E.dh; }
  posicionarFoto(x, y, E);
}
const chaveEnq = () => [st.formato, $('fx').value, $('fy').value, $('fz').value, $('ox').value, $('oy').value].join();
function cobrir(c, src, w = W(), h = H()) {
  const E = enquadramento(src, w, h); c.drawImage(src, E.x, E.y, E.dw, E.dh);
}
function mascara(img) {   // máscara enquadrada no formato atual (canvas + alfa), com cache
  const k = chaveEnq();
  img._c = img._c || {};
  if (!img._c[k]) { for (const kk of Object.keys(img._c)) if (kk !== k && !kk.startsWith('bbox')) delete img._c[kk];   // só o enquadramento atual (antes acumulava um por quadro da pinça)
    const c = document.createElement('canvas'); c.width = W(); c.height = H(); cobrir(c.getContext('2d'), img); img._c[k] = { canvas: c, alfa: c.getContext('2d').getImageData(0, 0, W(), H()).data }; }
  return img._c[k];
}
const segmentos = l => l.split(/(\*[^*]+\*)/).filter(Boolean).map(p => ({ t: p.replace(/\*/g, ''), b: p.startsWith('*') }));

// ---------- camadas ----------
function texto(o) { return Object.assign({ tipo: 'texto', nome: 'Texto', texto: 'TEXTO', fonte: 'Montserrat', peso: 800, pesoDestaque: 800, tam: 120, esp: 0, entre: 1.05, caixa: true,
  cor: GRAFITE, x: W() / 2, y: H() / 2, rot: 0, incl: 0, sx: 1, sy: 1, arco: 0, alinhar: 'center', opac: 1, atras: [], sombra: 0 }, o); }
function forma(o) { return Object.assign({ tipo: 'forma', nome: o.forma, x: W() / 2, y: H() / 2, w: 300, h: 300, rot: 0, cor: GRAFITE, esp: 2, opac: 1, atras: [], legenda: '',
  preencher: false, contorno: true, corContorno: GRAFITE, traco: 'solida', raio: 0, sombra: 0 }, o); }

function caber(L, max) {   // reduz o tamanho até o bloco caber na largura
  for (; L.tam > 10; L.tam -= 2) { const w = Math.max(...(L.caixa ? L.texto.toUpperCase() : L.texto).split('\n').map(l => medirLinha(segmentos(l), L).w)); if (w * L.sx <= max) break; }
  return L;
}
const LIV = () => W() - 2 * MARGEM;
function frase() { return $('frase').value.trim(); }
function palavra() { return ($('palavra').value.trim() || 'TEXTO').toUpperCase(); }
const pessoaIdx = () => st.objetos.findIndex(o => o.kind === 'person');
function garantirPessoa() { if (st.pessoa && !st.objetos.some(o => o.kind === 'person')) st.objetos.unshift({ name: 'Pessoa', kind: 'person', img: st.pessoa }); return pessoaIdx(); }
const MOLDE = () => ({ tipo: 'molde', nome: 'Molde Corte', tinta: 'escura', cobertura: 0.5, dy: 0, mx: 0, escala: 1, recorte: true, atras: [],
  fontePalavra: 'Montserrat', pesoPalavra: 800, fonteFrase: 'Montserrat', pesoFrase: 500, pesoDestaqueFrase: 800, linha: true, mostrarFrase: true, cor: '' });
const ESTILOS = [
  { id: 'corte', nome: 'Corte', planos: true, criar: () => [MOLDE()] },
  { id: 'planos', nome: 'Entre planos', planos: true, criar: () => [caber(texto({ nome: 'Palavra', texto: palavra(), tam: 260, esp: -0.04, y: H() * 0.34, atras: garantirPessoa() >= 0 ? [pessoaIdx()] : [] }), LIV()),
      caber(texto({ nome: 'Frase', texto: frase().replace(/\|/g, '\n'), tam: 26, peso: 500, esp: 0.16, entre: 1.6, y: H() * 0.2 }), LIV())] },
  { id: 'contraste', nome: 'Contraste', criar: () => [caber(texto({ nome: 'Grosso', texto: palavra(), tam: 190, esp: -0.03, y: H() * 0.22 }), LIV()),
      caber(texto({ nome: 'Fino espaçado', texto: frase().split('|')[0].replace(/\*/g, ''), tam: 34, peso: 300, pesoDestaque: 300, esp: 0.6, y: H() * 0.22 + 150 }), LIV())] },
  { id: 'sobre', nome: 'Sobretítulo', criar: () => [caber(texto({ nome: 'Sobretítulo', texto: frase().replace(/\|/g, ' '), fonte: 'Neue Montreal', peso: 500, pesoDestaque: 700, tam: 24, esp: 0.3, y: H() * 0.12 }), LIV()),
      caber(texto({ nome: 'Título', texto: palavra(), fonte: 'Neue Montreal', peso: 700, tam: 210, esp: -0.04, y: H() * 0.12 + 150 }), LIV())] },
  { id: 'coluna', nome: 'Coluna', planos: true, criar: () => [(L => Object.assign(L, { x: L.tam * 0.62 + 30 }))(caber(texto({ nome: 'Vertical', texto: palavra(), tam: 300, esp: -0.03, rot: -90, y: H() * 0.5, atras: garantirPessoa() >= 0 ? [pessoaIdx()] : [] }), H() * 0.8)),
      caber(texto({ nome: 'Frase', texto: frase().replace(/\|/g, '\n'), tam: 24, peso: 500, esp: 0.18, entre: 1.6, alinhar: 'left', x: W() * 0.6, y: H() * 0.1 }), W() * 0.62)] },
  { id: 'envolve', nome: 'Palavra no meio', planos: true, criar: () => palavraNoMeio() },
  { id: 'pilulas', nome: 'Pílulas', criar: () => pilulas() },
  { id: 'pilulasVidro', nome: 'Pílulas de vidro', criar: () => pilulas(true) },
  { id: 'arco', nome: 'Arco', criar: () => [caber(texto({ nome: 'Arco', texto: palavra(), tam: 150, esp: 0.02, arco: 45, y: H() * 0.2 }), LIV()),
      caber(texto({ nome: 'Frase', texto: frase().replace(/\|/g, '\n').replace(/\*/g, ''), tam: 22, peso: 500, esp: 0.22, entre: 1.6, y: H() * 0.2 + 130 }), LIV())] },
];
// Palavra no meio (referência de Caio 24/11 01:34): palavra grande em minúsculas, fina e geométrica, no meio da foto;
// a frase se divide em volta dela, alinhada à direita da palavra: o que vem antes fica em cima, rente à altura do x,
// o que vem depois fica embaixo, com *destaque* em negrito. Marque em "Planos da foto" o objeto (mão, braço) que passa na frente.
function quebrarEmLinhas(txt, L, max) {
  const out = [], tk = txt.split(/\s+/).filter(Boolean); let at = [];
  for (const t of tk) { const tenta = [...at, t].join(' '); if (at.length && medirLinha(segmentos(tenta), L).w > max) { out.push(at.join(' ')); at = [t]; } else at.push(t); }
  if (at.length) out.push(at.join(' '));
  for (let i = 0; i < out.length - 1; i++) {   // palavra curta (a, e, o, de, da…) não fica pendurada no fim da linha
    const ws = out[i].split(' '), ult = ws.at(-1).replace(/\*/g, '');
    if (ws.length > 1 && ult.length <= 2) { out[i] = ws.slice(0, -1).join(' '); out[i + 1] = ws.at(-1) + ' ' + out[i + 1]; }
  }
  return out.join('\n');
}
function palavraNoMeio() {
  const pal = ($('palavra').value || 'pele').trim().toLowerCase(), cheia = frase().replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
  const i = cheia.toLowerCase().replace(/\*/g, '').indexOf(pal.replace(/[.,!?]/g, ''));
  let antes = cheia, depois = '';
  if (i >= 0) { // separa a frase em volta da palavra, contando os * que não aparecem na busca
    let vis = 0, k = 0; for (; k < cheia.length && vis < i; k++) if (cheia[k] !== '*') vis++;
    let fim = k, n = 0; for (; fim < cheia.length && n < pal.replace(/[.,!?]/g, '').length; fim++) if (cheia[fim] !== '*') n++;
    antes = cheia.slice(0, k).trim(); depois = cheia.slice(fim).replace(/^[*\s]+/, '').trim();
  }
  const corTx = '#ffffff', grande = caber(texto({ nome: 'Palavra', texto: pal, fonte: 'Jost', peso: 300, pesoDestaque: 300, tam: 420, esp: -.03, caixa: false, cor: corTx, x: W() * .47, y: H() * (st.formato === 'story' ? .55 : .6) }), W() * .8);
  const T = grande.tam, med = medirLinha(segmentos(pal), grande), wg = med.w, esquerda = grande.x - wg / 2, direita = grande.x + wg / 2, base = grande.y + T * .375;
  // o texto de cima começa depois da última haste alta da palavra (l, t, d, b, h, k, f), como o "l" de pele na referência
  let acc = 0, limite = esquerda + wg * .4; for (const [ch, , w] of med.chars) { if (/[bdfhklt]/.test(ch)) limite = esquerda + acc + w; acc += w; }
  const larguraCima = Math.max(W() * .16, direita - limite - T * .06);
  const pequeno = o => texto({ fonte: 'Montserrat', peso: 400, pesoDestaque: 700, tam: Math.max(18, Math.round(T * .078)), esp: .005, entre: 1.18, caixa: false, cor: corTx, alinhar: 'right', ...o });
  const camadas = [grande];
  for (const [nome, txt, cima] of [['Antes da palavra', antes, true], ['Depois da palavra', depois, false]]) {
    if (!txt) continue;
    const L = pequeno({ nome }); L.texto = quebrarEmLinhas(txt, L, cima ? larguraCima : W() * .3);
    const n = L.texto.split('\n').length, lh = L.tam * L.entre, bh = lh * (n - 1) + L.tam * .75, bw = Math.max(...L.texto.split('\n').map(l => medirLinha(segmentos(l), L).w));
    L.x = direita - bw / 2;
    if (cima) { const ultima = base - T * .56; L.y = ultima - (n - 1) * lh + bh / 2 - L.tam * .75; }
    else { const primeira = base + T * .07 + L.tam * .75; L.y = primeira + bh / 2 - L.tam * .75; }
    camadas.push(L);
  }
  return camadas;
}
// Elementos refeitos: cada um nasce com proporção e traço de peça editorial, e tudo é ajustável à direita.
const ELEMENTOS = [
  ['linha', 'Linha', '<line x1="3" y1="12" x2="27" y2="12"/>', { w: 520, h: 4, esp: 2 }],
  ['seta', 'Seta', '<path d="M3 12h23M20 7l6 5-6 5"/>', { w: 300, h: 40, esp: 2, pontas: 'aberta' }],
  ['retangulo', 'Retângulo', '<rect x="4" y="5" width="22" height="14" rx="1"/>', { w: 420, h: 280 }],
  ['moldura', 'Moldura', '<rect x="3" y="3" width="24" height="18"/><rect x="6" y="6" width="18" height="12" opacity=".5"/>', { w: 900, h: 1100, esp: 2, cor: OSSO, corContorno: OSSO }],
  ['circulo', 'Círculo', '<circle cx="15" cy="12" r="8"/>', { w: 260, h: 260 }],
  ['disco', 'Disco', '<circle cx="15" cy="12" r="8" fill="currentColor"/>', { w: 140, h: 140, preencher: true, contorno: false }],
  ['elipse', 'Elipse', '<ellipse cx="15" cy="12" rx="12" ry="7"/>', { w: 460, h: 220 }],
  ['ponto', 'Ponto', '<circle cx="15" cy="12" r="3" fill="currentColor"/>', { w: 22, h: 22, preencher: true, contorno: false }],
  ['triangulo', 'Triângulo', '<path d="M15 4l10 16H5z"/>', { w: 260, h: 230 }],
  ['caixa', 'Caixa de texto', '<rect x="3" y="6" width="24" height="12" rx="4" fill="currentColor" opacity=".25"/><path d="M8 12h14"/>', { w: 560, h: 130, preencher: true, contorno: false, cor: OSSO, raio: 65, sombra: .35, legenda: 'AGENDE SUA AVALIAÇÃO' }],
  ['degrade', 'Degradê', '<rect x="3" y="4" width="24" height="16" fill="url(#gg)" stroke="none"/><defs><linearGradient id="gg" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor"/></linearGradient></defs>', { w: 1080, h: 640, preencher: true, contorno: false, cor: '#000000', opac: .6, direcao: 'vertical' }],
  ['pilula', 'Pílula', '<rect x="2" y="7" width="26" height="10" rx="5"/><path d="M9 12h12" opacity=".6"/>', { w: 300, h: 76, contorno: true, preencher: false, corContorno: '#ffffff', esp: 1.5, legenda: 'Rugas finas', corTexto: '#ffffff', pesoLegenda: 400, autoLargura: true }],
  ['pilulaFoto', 'Pílula com foto', '<rect x="2" y="7" width="26" height="10" rx="5" fill="currentColor" opacity=".35"/><circle cx="11" cy="12" r="2" fill="currentColor"/>', { w: 440, h: 108, contorno: false, preencher: false, corContorno: '#ffffff', esp: 2, fosco: true }],
  ['pilulaVidro', 'Caixa de vidro', '<rect x="2" y="6" width="26" height="12" rx="4" fill="currentColor" opacity=".18"/><path d="M4 8q0-1 2-1h18" opacity=".9"/>', { forma: 'pilula', w: 260, h: 84, contorno: false, preencher: false, legenda: 'Natural', corTexto: '#ffffff', pesoLegenda: 400, fonteLegenda: 'Neue Montreal', autoLargura: true, vidro3d: true, raioVidro: .3 }],
  ['cartaoVidro', 'Cartão de vidro', '<rect x="5" y="2" width="20" height="20" rx="4" fill="currentColor" opacity=".18"/><path d="M8 14h6M8 18h10" opacity=".9"/>', { w: 380, h: 380, contorno: false, preencher: false, legenda: '5%', sublegenda: 'Niacinamida', corTexto: '#ffffff', fonteLegenda: 'Neue Montreal', vidro3d: true, raioVidro: .1 }],
  ['discoFoscoPreto', 'Discos (preto)', '<circle cx="18" cy="12" r="7" fill="currentColor"/><circle cx="12" cy="12" r="7" fill="currentColor" opacity=".35"/>', { forma: 'discoFosco', w: 560, h: 560, cor: '#0c0c0d', deslocamento: .3, desfoque: 1, grao: .45, aro: .6, ladoVidro: 'esquerda', legenda: '', contorno: false }],
  ['discoFoscoBranco', 'Discos (branco)', '<circle cx="18" cy="12" r="7"/><circle cx="12" cy="12" r="7" fill="currentColor" opacity=".2"/>', { forma: 'discoFosco', w: 560, h: 560, cor: '#f4f3f0', deslocamento: .3, desfoque: 1, grao: .45, aro: .6, ladoVidro: 'esquerda', legenda: '', contorno: false }],
  ['colchete', 'Cantos', '<path d="M4 9V4h5M26 9V4h-5M4 15v5h5M26 15v5h-5"/>', { w: 600, h: 420, esp: 3, cor: OSSO, corContorno: OSSO }],
];

// ---------- desenho ----------
// Reorganiza o texto pela caixa (Caio 24/11 03:51, igual à alça verde da Montagem): a largura decide quantas palavras
// cabem por linha, a altura decide quantas linhas, e o tamanho da letra é o maior que cabe na caixa.
function reorganizarTexto(L, v, largura, altura) {
  const base = v.texto, palavras = [];   // as quebras de linha atuais são refeitas; negrito (*palavra*) é mantido
  for (const seg of segmentos(base.replace(/\n/g, ' '))) for (const w of seg.t.split(/\s+/)) if (w) palavras.push({ t: w, b: seg.b });
  if (!palavras.length) return;
  const sx = v.sx || 1, sy = v.sy || 1, lw = largura / sx, lh0 = altura / sy, alta = t => v.caixa ? t.toUpperCase() : t;
  const montar = linha => { let out = '', bold = false; linha.forEach((w, i) => { if (w.b !== bold) { out += (bold ? '*' : '') + (i ? ' ' : '') + (w.b ? '*' : ''); bold = w.b; } else if (i) out += ' '; out += w.t; }); return out + (bold ? '*' : ''); };
  const caber = tam => {
    const M = { ...v, tam }, linhas = []; let atual = [];
    const larg = ws => medirLinha(segmentos(alta(montar(ws))), M).w;
    for (const w of palavras) { const tenta = [...atual, w]; if (atual.length && larg(tenta) > lw) { linhas.push(atual); atual = [w]; } else atual = tenta; }
    if (atual.length) linhas.push(atual);
    const ok = linhas.every(l => larg(l) <= lw) && (linhas.length - 1) * tam * (v.entre || 1.05) + tam * .75 <= lh0;
    return { ok, linhas };
  };
  let lo = 6, hi = 1200; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (caber(m).ok) lo = m; else hi = m; }
  const tam = Math.max(6, Math.floor(lo)), r = caber(tam);
  L.tam = tam; L.texto = r.linhas.map(montar).join('\n');
}
function medirLinha(segs, L) {
  let w = 0, a = [];
  for (const s of segs) { ctx.font = `${s.b ? L.pesoDestaque : L.peso} ${L.tam}px ${familia(L.fonte)}`; for (const ch of s.t) { const m = ctx.measureText(ch).width + L.esp * L.tam; a.push([ch, s.b, m]); w += m; } }
  return { w: w - L.esp * L.tam, chars: a };
}
function sombrear(c, k) { if (k > 0) { c.shadowColor = `rgba(0,0,0,${Math.min(.85, k)})`; c.shadowBlur = 30 * k + 6; c.shadowOffsetY = 10 * k; } }
function desenharTexto(c, L) {
  const linhas = (L.caixa ? L.texto.toUpperCase() : L.texto).split('\n').map(l => medirLinha(segmentos(l), L));
  const lh = L.tam * L.entre, bw = Math.max(...linhas.map(l => l.w), 1), bh = lh * (linhas.length - 1) + L.tam * 0.75;
  c.save(); c.globalAlpha = L.opac; c.translate(L.x, L.y); c.rotate(L.rot * Math.PI / 180); c.transform(1, 0, Math.tan((L.incl || 0) * Math.PI / 180), 1, 0, 0); c.scale(L.sx, L.sy);
  c.fillStyle = L.cor; c.textBaseline = 'alphabetic'; sombrear(c, L.sombra || 0);
  linhas.forEach((ln, i) => {
    const base = -bh / 2 + L.tam * 0.75 + i * lh;
    let x0 = L.alinhar === 'left' ? -bw / 2 : L.alinhar === 'right' ? bw / 2 - ln.w : -ln.w / 2;
    if (!L.arco) { for (const [ch, b, w] of ln.chars) { c.font = `${b ? L.pesoDestaque : L.peso} ${L.tam}px ${familia(L.fonte)}`; c.fillText(ch, x0, base); x0 += w; } return; }
    const R = Math.max(ln.w, 1) / (Math.abs(L.arco) / 100 * Math.PI), sinal = Math.sign(L.arco); let acc = 0;
    for (const [ch, b, w] of ln.chars) {
      const a = (acc + w / 2 - ln.w / 2) / R; acc += w;
      c.save(); c.translate(R * Math.sin(a), base + sinal * (R - R * Math.cos(a))); c.rotate(sinal * a);
      c.font = `${b ? L.pesoDestaque : L.peso} ${L.tam}px ${familia(L.fonte)}`; c.fillText(ch, -w / 2, 0); c.restore();
    }
  });
  c.restore();
  L._box = { x: L.x, y: L.y, w: bw * L.sx + 24, h: bh * L.sy + (L.arco ? L.tam * L.sy : 0) + 24, rot: L.rot, incl: L.incl || 0 };
}
function vidro(c, base, F, caminho) {
  c.save(); caminho(c); c.clip();
  c.filter = 'blur(7px)'; c.translate(F.x, F.y); c.scale(1.12, 1.12); c.translate(-F.x, -F.y); c.drawImage(base, 0, 0); c.restore();
  c.save(); caminho(c); c.clip();
  const g = c.createRadialGradient(F.x - F.w * .22, F.y - F.h * .28, 2, F.x, F.y, Math.max(F.w, F.h) * .62);
  g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.25, 'rgba(255,255,255,.12)'); g.addColorStop(.8, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(200,215,235,.35)');
  c.fillStyle = g; c.fillRect(F.x - F.w, F.y - F.h, F.w * 2, F.h * 2); c.restore();
  c.save(); caminho(c); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke(); c.restore();
}
const LEGADO = { tracejada: ['linha', 'tracejada'], pontilhada: ['linha', 'pontilhada'] };
function tracejar(c, F) { const e = F.esp || 2; c.setLineDash(F.traco === 'tracejada' ? [e * 6, e * 4] : F.traco === 'pontilhada' ? [0.01, e * 3.2] : []); c.lineCap = 'round'; }
function desenharForma(c, F, base) {
  if (F.forma === 'mapaFacial') { desenharMapa(c, F); return; }
  if (F.forma === 'fantasma') { desenharFantasma(c, F, base); return; }
  if (F.forma === 'discoFosco') { desenharDiscoFosco(c, F, base); return; }
  if (F.forma === 'anelTexto') { desenharAnel(c, F); return; }
  if (F.forma === 'receita') { desenharReceita(c, F, envReceita()); return; }
  if (F.forma === 'desfoqueDifuso') { drawDiffuse(c, base, F); return; }
  if (F.forma === 'painelAnalise') { drawAnalysis(c, base, F); return; }
  if (isEditorialEffect(F.forma)) { drawEditorialEffect(c, base, F); return; }
  let k = F.forma, traco = F.traco;
  if (LEGADO[k]) [k, traco] = LEGADO[k];
  if (k === 'pilula' || k === 'pilulaFoto' || k === 'cartaoVidro') { desenharPilula(c, F, base, k); return; }
  const contorno = F.contorno ?? !['ponto', 'disco', 'degrade', 'caixa'].includes(k), preencher = F.preencher ?? ['ponto', 'disco', 'degrade', 'caixa'].includes(k);
  c.save(); c.globalAlpha = F.opac; c.translate(F.x, F.y); c.rotate(F.rot * Math.PI / 180);
  const w = F.w, h = F.h, x0 = -w / 2, y0 = -h / 2, R = Math.min(F.raio || 0, Math.min(Math.abs(w), Math.abs(h)) / 2);
  c.fillStyle = F.cor; c.strokeStyle = F.corContorno || F.cor; c.lineWidth = F.esp || 2; c.lineJoin = 'round'; tracejar(c, { ...F, traco });
  const pintar = caminho => { c.beginPath(); caminho(); if (preencher) { c.save(); sombrear(c, F.sombra || 0); c.fill(); c.restore(); } if (contorno) { if (!preencher) sombrear(c, F.sombra || 0); c.stroke(); } };
  if (k === 'linha') { sombrear(c, F.sombra || 0); c.beginPath(); c.moveTo(x0, 0); c.lineTo(-x0, 0); c.stroke(); }
  else if (k === 'seta') {
    sombrear(c, F.sombra || 0); const p = Math.max((F.esp || 2) * 5, 14), dupla = F.pontas === 'dupla', cheia = F.pontas === 'cheia';
    c.beginPath(); c.moveTo(x0 + (dupla && cheia ? p : 0), 0); c.lineTo(-x0 - (cheia ? p * .9 : 0), 0); c.stroke(); c.setLineDash([]);
    const ponta = sx => { c.beginPath(); c.moveTo(sx * (w / 2 - p), -p * .6); c.lineTo(sx * w / 2, 0); c.lineTo(sx * (w / 2 - p), p * .6); if (cheia) { c.closePath(); c.fillStyle = F.corContorno || F.cor; c.fill(); } else c.stroke(); };
    ponta(1); if (dupla) ponta(-1);
  }
  else if (k === 'retangulo' || k === 'caixa' || k === 'moldura') {
    pintar(() => c.roundRect(x0, y0, w, h, R));
    if (k === 'moldura') { c.globalAlpha *= .5; c.lineWidth = Math.max(1, (F.esp || 2) / 2); c.beginPath(); c.roundRect(x0 + 18, y0 + 18, w - 36, h - 36, Math.max(0, R - 18)); c.stroke(); }
    if (k === 'caixa' && F.legenda) { c.shadowColor = 'transparent'; c.setLineDash([]); c.fillStyle = F.corTexto || (claro(F.cor) ? GRAFITE : OSSO);
      c.font = `${F.pesoLegenda || 600} ${Math.round(F.tamLegenda || h * .24)}px ${familia(F.fonteLegenda || 'Montserrat')}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const txt = F.legenda.toUpperCase(), espaco = (F.espLegenda ?? .08) * (F.tamLegenda || h * .24); let tw = [...txt].reduce((a, ch) => a + c.measureText(ch).width + espaco, -espaco), xx = -tw / 2;
      c.textAlign = 'left'; for (const ch of txt) { c.fillText(ch, xx, 2); xx += c.measureText(ch).width + espaco; } }
  }
  else if (k === 'circulo' || k === 'elipse' || k === 'ponto' || k === 'disco') pintar(() => c.ellipse(0, 0, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2));
  else if (k === 'triangulo') pintar(() => { c.moveTo(0, y0); c.lineTo(-x0, -y0); c.lineTo(x0, -y0); c.closePath(); });
  else if (k === 'colchete') { sombrear(c, F.sombra || 0); const a = Math.min(Math.abs(w), Math.abs(h)) * .18; c.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.moveTo(sx * w / 2, sy * (h / 2 - a)); c.lineTo(sx * w / 2, sy * h / 2); c.lineTo(sx * (w / 2 - a), sy * h / 2); } c.stroke(); }
  else if (k === 'degrade') {
    const d = F.direcao || 'vertical', inv = !!F.inverter, cheio = F.cor, vazio = /^#[\da-f]{6}$/i.test(F.cor) ? F.cor + '00' : 'rgba(0,0,0,0)';
    const g = d === 'radial' ? c.createRadialGradient(0, 0, Math.min(Math.abs(w), Math.abs(h)) * .15, 0, 0, Math.hypot(w, h) / 2) : d === 'horizontal' ? c.createLinearGradient(x0, 0, -x0, 0) : c.createLinearGradient(0, y0, 0, -y0);
    g.addColorStop(0, inv ? cheio : vazio); g.addColorStop(1, inv ? vazio : cheio);
    c.fillStyle = g; c.fillRect(x0, y0, w, h);
  }
  else if (k === 'imagem' && F.img) { sombrear(c, F.sombra || 0); c.scale(F.espelhar ? -1 : 1, 1); c.drawImage(F.img, x0, y0, w, h); }
  else if (k === 'vidroEsfera') { c.restore(); c.save(); c.globalAlpha = F.opac; vidro(c, base, F, d => { d.beginPath(); d.ellipse(F.x, F.y, w / 2, h / 2, 0, 0, 7); }); }
  else if (k === 'vidroAnel') { c.restore(); c.save(); c.globalAlpha = F.opac; vidro(c, base, F, d => { d.beginPath(); d.ellipse(F.x, F.y, w / 2, h / 2, 0, 0, 7); d.ellipse(F.x, F.y, w * .3, h * .3, 0, 0, 7, true); }); }
  else if (k === 'vidroCapsula') { c.restore(); c.save(); c.globalAlpha = F.opac; vidro(c, base, F, d => { d.beginPath(); d.roundRect(F.x - w / 2, F.y - h / 2, w, h, Math.min(w, h) / 2); }); }
  else if (k === 'vidroCanelado') { c.restore(); c.save(); c.globalAlpha = F.opac; const n = 7, lw = w / n, X0 = F.x - w / 2, Y0 = F.y - h / 2;
    for (let i = 0; i < n; i++) vidro(c, base, { x: X0 + lw * i + lw / 2, y: F.y, w: lw, h }, d => { d.beginPath(); d.rect(X0 + lw * i, Y0, lw, h); }); }
  c.restore();
  const linear = k === 'linha' || k === 'seta';
  F._box = { x: F.x, y: F.y, w: Math.max(Math.abs(w), 24), h: linear ? Math.max(Math.abs(h), 36) : Math.max(Math.abs(h), 24), rot: F.rot };
}
// Mapeamento facial (referência de Caio 24/11 01:55): malha de linhas que acompanha a curvatura do rosto, contorno com
// brilho, varredura e pontos de análise. Os 478 pontos do rosto vêm do Mac (MediaPipe, /api/posts/rosto), guardados
// normalizados na foto; o desenho segue o enquadramento. A malha nasce num plano frontal do rosto e é levada para a foto
// por um ajuste afim mais a diferença local dos pontos vizinhos, então curva junto com bochecha, nariz e queixo.
const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const PONTOS_ANALISE = [116, 345, 206, 136, 199];
function rostoNaArte() {
  if (!st.rosto || !st.img) return null;
  const E = enquadramento(), dw = E.dw, dh = E.dh, ox = E.x, oy = E.y;
  return st.rosto.map(([x, y, z]) => [ox + x * dw, oy + y * dh, z * dw]);
}
function mapaGeometria(P) {
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
  const ex = nrm(sub(P[263], P[33])), y0 = sub(P[152], P[10]), ey = nrm(sub(y0, ex.map(v => v * dot(y0, ex)))), c0 = P[10].map((v, i) => (v + P[152][i]) / 2);
  const can = P.map(p => { const d = sub(p, c0); return [dot(d, ex), dot(d, ey)]; });
  // afim global imagem ≈ A·can + t (mínimos quadrados)
  let S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
  can.forEach(([u, v], i) => { const r = [u, v, 1]; for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) S[a][b] += r[a] * r[b]; bx[a] += r[a] * P[i][0]; by[a] += r[a] * P[i][1]; } });
  const resolver = (M, b) => { const m = M.map((r, i) => [...r, b[i]]); for (let i = 0; i < 3; i++) { let p = i; for (let j = i + 1; j < 3; j++) if (Math.abs(m[j][i]) > Math.abs(m[p][i])) p = j; [m[i], m[p]] = [m[p], m[i]];
    for (let j = 0; j < 3; j++) if (j !== i) { const f = m[j][i] / m[i][i]; for (let k = i; k < 4; k++) m[j][k] -= f * m[i][k]; } } return m.map((r, i) => r[3] / r[i]); };
  const ax = resolver(S, bx), ay = resolver(S, by), afim = (u, v) => [ax[0] * u + ax[1] * v + ax[2], ay[0] * u + ay[1] * v + ay[2]];
  const res = can.map(([u, v], i) => { const a = afim(u, v); return [P[i][0] - a[0], P[i][1] - a[1]]; });
  const para = (u, v) => {   // afim + diferença local dos 8 pontos mais próximos
    const viz = can.map(([a, b], i) => [(a - u) ** 2 + (b - v) ** 2, i]).sort((a, b) => a[0] - b[0]).slice(0, 8);
    let sx = 0, sy = 0, sw = 0; for (const [d, i] of viz) { const w = 1 / (d + 1e-3); sx += w * res[i][0]; sy += w * res[i][1]; sw += w; }
    const a = afim(u, v); return [a[0] + sx / sw, a[1] + sy / sw];
  };
  return { can, para };
}
function dentroPoligono(pt, pol) { let d = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [xi, yi] = pol[i], [xj, yj] = pol[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) d = !d; } return d; }
function caminhoSuave(c, pts) { c.beginPath(); const n = pts.length, m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2]; c.moveTo(...m(0)); for (let i = 1; i <= n; i++) c.quadraticCurveTo(pts[i % n][0], pts[i % n][1], ...m(i)); c.closePath(); }
function desenharMapa(c, F) {
  const P = rostoNaArte();
  if (!P) { F._box = { x: W() / 2, y: H() / 2, w: 300, h: 80, rot: 0 }; c.save(); c.fillStyle = 'rgba(255,255,255,.8)'; c.font = '500 26px Mont'; c.textAlign = 'center'; c.fillText('Detectando o rosto… (só no Mac)', W() / 2, H() / 2); c.restore(); return; }
  const g = F._geo && F._geoK === st.rosto && F._geoF === [W(), H(), chaveEnq()].join() ? F._geo : (F._geo = mapaGeometria(P), F._geoK = st.rosto, F._geoF = [W(), H(), chaveEnq()].join(), F._geo);
  const ovalImg = OVAL.map(i => P[i]), ovalCan = OVAL.map(i => g.can[i]);
  const xs = ovalCan.map(p => p[0]), ys = ovalCan.map(p => p[1]), u0 = Math.min(...xs), u1 = Math.max(...xs), v0 = Math.min(...ys), v1 = Math.max(...ys);
  const cor = F.corLinha || '#ffffff', brilho = F.corBrilho || '#6ee7f0', dens = Math.round(limite01(F.densidade ?? 16, 6, 36)), esp = F.esp || 1.3, inten = F.intensidade ?? .5;
  const malha = document.createElement('canvas'); malha.width = W(); malha.height = H(); const m = malha.getContext('2d');
  m.strokeStyle = cor; m.lineWidth = esp; m.lineJoin = 'round'; m.lineCap = 'round'; m.globalAlpha = inten;
  const linha = (fn, n) => { let aberto = false; m.beginPath(); for (let k = 0; k <= n; k++) { const q = fn(k / n); if (!dentroPoligono(q, ovalCan)) { aberto = false; continue; } const p = g.para(...q); aberto ? m.lineTo(...p) : m.moveTo(...p); aberto = true; } m.stroke(); };
  const ratio = (v1 - v0) / Math.max(1, u1 - u0), nv = Math.round(dens * ratio);
  for (let i = 1; i < dens; i++) { const u = u0 + (u1 - u0) * i / dens; linha(t => [u, v0 + (v1 - v0) * t], 70); }
  for (let j = 1; j < nv; j++) { const v = v0 + (v1 - v0) * j / nv; linha(t => [u0 + (u1 - u0) * t, v], 60); }
  // a malha some suave perto do contorno
  const borda = document.createElement('canvas'); borda.width = W(); borda.height = H(); const b = borda.getContext('2d');
  const R = Math.hypot(...[0, 1].map(k => P[10][k] - P[152][k])) / 2; b.filter = `blur(${R * .05}px)`; b.fillStyle = '#fff'; caminhoSuave(b, ovalImg); b.fill();
  m.globalAlpha = 1; m.globalCompositeOperation = 'destination-in'; m.drawImage(borda, 0, 0);
  c.save(); c.globalAlpha = F.opac ?? 1;
  if ((F.brilho ?? .6) > 0) { c.save(); c.shadowColor = brilho; c.shadowBlur = 10 * (F.brilho ?? .6); c.drawImage(malha, 0, 0); c.restore(); } else c.drawImage(malha, 0, 0);
  // varredura: faixa de luz que atravessa o rosto (animável pelo tempo)
  const varr = F.varredura ?? .42;
  if (F.mostrarVarredura !== false) {
    const yv = Math.min(...ovalImg.map(p => p[1])) + (Math.max(...ovalImg.map(p => p[1])) - Math.min(...ovalImg.map(p => p[1]))) * varr, alt = R * .35;
    c.save(); caminhoSuave(c, ovalImg); c.clip(); c.globalCompositeOperation = 'screen';
    const gr = c.createLinearGradient(0, yv - alt, 0, yv + 4); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.8, hexA(brilho, .08)); gr.addColorStop(.97, hexA(brilho, .28)); gr.addColorStop(1, hexA('#ffffff', .6));
    c.fillStyle = gr; c.fillRect(0, yv - alt, W(), alt + 4); c.restore();
  }
  // contorno com brilho
  c.save(); caminhoSuave(c, ovalImg); c.strokeStyle = cor; c.lineWidth = esp * 2; c.shadowColor = brilho; c.shadowBlur = 18 * (F.brilho ?? .6) + 4; c.globalAlpha = Math.min(1, inten + .35); c.stroke(); c.restore();
  // pontos de análise com linha tracejada para o lado
  if (F.mostrarPontos !== false) for (const i of PONTOS_ANALISE) {
    const [x, y] = P[i], r = R * .045 * (F.escalaPontos || 1), lado = x < (P[10][0] + P[152][0]) / 2 ? -1 : 1;
    c.save(); c.shadowColor = brilho; c.shadowBlur = 10; c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1.5, r * .22);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); c.stroke();
    c.beginPath(); c.arc(x, y, r * .38, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.fill();
    if (F.linhas) { c.setLineDash([r * .5, r * .45]); c.lineWidth = Math.max(1, r * .12); c.globalAlpha = .75; c.beginPath(); c.moveTo(x + lado * r, y); c.lineTo(x + lado * R * .45, y); c.stroke(); }
    c.restore();
  }
  c.restore();
  const bx = ovalImg.map(p => p[0]), by = ovalImg.map(p => p[1]);
  F._box = { x: (Math.min(...bx) + Math.max(...bx)) / 2, y: (Math.min(...by) + Math.max(...by)) / 2, w: Math.max(...bx) - Math.min(...bx), h: Math.max(...by) - Math.min(...by), rot: 0 };
}
const limite01 = (v, a, b) => Math.max(a, Math.min(b, Number(v) || 0));
const hexA = (hex, a) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(hex) || [0, 'ff', 'ff', 'ff']; return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`; };
async function obterRosto() {
  if (!st.img) return false; status('Lendo os pontos do rosto…');
  try { const r = await fetch('/api/posts/rosto', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: await reduzida(st.img, 1280) });
    const tx = await r.text(); let j; try { j = JSON.parse(tx); } catch { throw new Error(r.status === 501 || r.status === 404 ? '501' : 'Unexpected token'); }
    if (!r.ok || j.error) throw new Error(j.error); st.rosto = j.landmarks; status('Rosto mapeado.'); return true; }
  catch (e) { status('Mapeamento indisponível: ' + e.message, true); return false; }
}
// Fantasma em movimento (referência de Caio 24/11 02:06): uma segunda exposição da pessoa, deslocada e com desfoque de
// movimento leve, atrás do rosto nítido, mais um rastro curto do outro lado. Usa o recorte da pessoa (feito no Mac).
// Arrastar a camada move o fantasma; os cantos mudam o tamanho dele.
// Estilos de palavra do Video Studio (posts-recipes.js): máscara da pessoa e dos objetos enquadradas no formato atual.
function envReceita() {
  const mp = st.pessoa || st.objetos[pessoaIdx()]?.img;
  return { W: W(), H: H(), dur: st.motion.duration, pessoa: mp ? mascara(mp) : null,
    objeto: i => { const o = st.objetos[i] || st.objetos.find(x => x.kind !== 'person') || st.objetos[pessoaIdx()]; const img = o?.img || mp; return img ? mascara(img) : null; } };
}
function caixaPessoa(m) {
  const k = 'bbox' + chaveEnq(); if (m[k]) return m[k];
  let x0 = W(), y0 = H(), x1 = 0, y1 = 0; for (let y = 0; y < H(); y += 3) for (let x = 0; x < W(); x += 3) if (m.alfa[(y * W() + x) * 4 + 3] > 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return m[k] = x1 > x0 ? { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 } : { x: W() / 2, y: H() / 2, w: W() * .6, h: H() * .7 };
}
function borrarMovimento(src, comp, ang, passos = 26) {   // média de cópias deslocadas ao longo da direção do movimento
  const out = document.createElement('canvas'); out.width = W(); out.height = H(); const o = out.getContext('2d'), a = ang * Math.PI / 180;
  for (let i = 0; i < passos; i++) { const t = passos === 1 ? 0 : i / (passos - 1) - .5; o.globalAlpha = 1 / (i + 1); o.drawImage(src, Math.cos(a) * comp * t, Math.sin(a) * comp * t); }
  return out;
}
const CACHE_FANTASMA = {};
function desenharFantasma(c, F, base) {
  const masc = st.pessoa || st.objetos[pessoaIdx()]?.img;
  if (!masc) { F._box = { x: W() / 2, y: H() / 2, w: 300, h: 80, rot: 0 }; c.save(); c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '500 26px Mont'; c.textAlign = 'center'; c.fillText('Precisa do recorte da pessoa (no Mac)', W() / 2, H() / 2); c.restore(); return; }
  const m = mascara(masc), cx = caixaPessoa(m);
  if (F.x == null || F.novo) { F.x = cx.x - W() * .16; F.y = cx.y; F.novo = false; }
  // o recorte, o fantasma desfocado e o rastro dependem só da foto, do tamanho e do movimento; a posição é um deslocamento.
  // Ficam em cache para o arraste ficar leve (revisão geral 24/11).
  const esc = F.escalaFantasma || 1, dx = F.x - cx.x, dy = F.y - cx.y, comp = F.comprimento ?? 60, ang = F.angulo ?? 0, rastro = F.rastro ?? .35, lado = Math.sign(dx || -1);
  const kBase = baseAtual + '|' + idDe(masc);   // o que está embaixo desta camada
  const FC = CACHE_FANTASMA;
  if (FC.kBase !== kBase) { FC.kBase = kBase; FC.corte = null; FC.fant = null; FC.rastro = null; }
  if (!FC.corte) { const corte = document.createElement('canvas'); corte.width = W(); corte.height = H(); const k = corte.getContext('2d');
    k.drawImage(base, 0, 0); k.globalCompositeOperation = 'destination-in'; k.drawImage(m.canvas, 0, 0); FC.corte = corte; }
  const corte = FC.corte, kF = [esc, comp, ang].join();
  if (!FC.fant || FC.kF !== kF) {
    const mov = document.createElement('canvas'); mov.width = W(); mov.height = H(); const mv = mov.getContext('2d');
    mv.translate(cx.x, cx.y); mv.scale(esc, esc); mv.translate(-cx.x, -cx.y); mv.drawImage(corte, 0, 0);
    const f = document.createElement('canvas'); f.width = W(); f.height = H(); const fc = f.getContext('2d');
    fc.filter = `blur(${2 + comp * .02}px)`; fc.drawImage(borrarMovimento(mov, comp, ang), 0, 0); FC.fant = f; FC.kF = kF;
  }
  c.save(); c.globalAlpha = (F.opac ?? 1) * (F.opacFantasma ?? .55); c.drawImage(FC.fant, dx, dy); c.restore();
  // rastro do outro lado: a própria pessoa arrastada um pouco na direção oposta ao fantasma
  if (rastro > 0) {
    const kR = [lado, comp].join();
    if (!FC.rastro || FC.kR !== kR) { const r = document.createElement('canvas'); r.width = W(); r.height = H(); const rc = r.getContext('2d');
      const passos = 18, compR = Math.max(40, comp * 2.2);
      for (let i = 0; i < passos; i++) { rc.globalAlpha = 1 / (i + 1); rc.drawImage(corte, -lado * compR * (i / (passos - 1)), 0); }
      FC.rastro = r; FC.kR = kR; }
    c.save(); c.globalAlpha = (F.opac ?? 1) * rastro; c.drawImage(FC.rastro, 0, 0); c.restore();
  }
  if (F.nitido !== false) c.drawImage(corte, 0, 0);   // o rosto principal continua nítido por cima
  F._box = { x: F.x, y: F.y, w: cx.w * esc, h: cx.h * esc, rot: 0 };
}
// Texto orbitando (referência de Caio 24/11 02:43, pin ws.nl Black Friday): faixas de texto repetido num anel 3D
// em volta da pessoa. A metade da frente passa na frente dela; a de trás aparece espelhada, mais apagada e escondida
// atrás da pessoa (recorte feito no Mac). No vídeo o anel gira sozinho (graus por segundo).
const MEDIDOR = document.createElement('canvas').getContext('2d');
function desenharAnel(c, F) {
  const rx = Math.max(20, F.w / 2), incl = Math.max(.02, Math.min(.95, F.inclinacao ?? .28)), ry = rx * incl, tam = F.tamLegenda || 54, persp = F.perspectiva ?? .35;
  const fam = familia(F.fonteLegenda || 'Montserrat'), peso = F.pesoLegenda || 800, entre = F.entreLinhas ?? 1.1, sep = F.separador ?? '  •  ', esp = (F.espLetra ?? .04) * tam;
  const linhas = String(F.legenda || '').split('\n').map(l => l.trim()).filter(Boolean); if (!linhas.length) linhas.push('TEXTO');
  MEDIDOR.font = `${peso} ${tam}px ${fam}`;
  const glifos = [], volta = 2 * Math.PI * rx, fase0 = (F.fase || 0) * Math.PI / 180;
  linhas.forEach((ln, i) => {
    const unid = [...(ln + sep)], larg = unid.map(ch => MEDIDOR.measureText(ch).width), wUnid = larg.reduce((a, b) => a + b + esp, 0);
    const reps = Math.max(1, Math.round(volta / Math.max(wUnid, 1))), k = volta / (reps * wUnid);   // fecha a volta sem emenda
    const dy = (i - (linhas.length - 1) / 2) * tam * entre, fase = fase0 + (F.defasar !== false ? i * 1.3 : 0);
    let s = 0;
    for (let r = 0; r < reps; r++) unid.forEach((ch, j) => { const a = fase + (s + larg[j] / 2) * k / rx; s += larg[j] + esp; if (ch.trim()) glifos.push({ ch, a, dy, w: larg[j] }); });
  });
  const vert = Math.sqrt(1 - incl * incl);
  const pintar = (g, lista) => {
    g.save(); g.translate(F.x, F.y); g.rotate((F.rot || 0) * Math.PI / 180);
    g.font = `${peso} ${tam}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = F.cor || '#e6ff4f';
    if ((F.brilho ?? .5) > 0) { g.shadowColor = F.cor || '#e6ff4f'; g.shadowBlur = tam * .45 * (F.brilho ?? .5); }
    for (const q of lista) {
      const z = Math.cos(q.a), p = 1 + persp * z, X = rx * Math.sin(q.a), Y = ry * z + q.dy * p * vert;
      g.save(); g.globalAlpha = (F.opac ?? 1) * (z < 0 ? (F.opacTras ?? .55) * (.55 + .45 * -z) : 1);
      g.transform(Math.cos(q.a) * p, -incl * Math.sin(q.a) * p, 0, p * vert, X, Y); g.fillText(q.ch, 0, 0); g.restore();
    }
    g.restore();
  };
  const tras = glifos.filter(q => Math.cos(q.a) < 0).sort((a, b) => Math.cos(a.a) - Math.cos(b.a)), frente = glifos.filter(q => Math.cos(q.a) >= 0).sort((a, b) => Math.cos(a.a) - Math.cos(b.a));
  const masc = F.atrasPessoa !== false && (st.pessoa || st.objetos[pessoaIdx()]?.img);
  if (masc) {
    const t = document.createElement('canvas'); t.width = W(); t.height = H(); const tc = t.getContext('2d'); pintar(tc, tras);
    tc.globalCompositeOperation = 'destination-out'; tc.drawImage(mascara(masc).canvas, 0, 0); c.drawImage(t, 0, 0);
  } else pintar(c, tras);
  pintar(c, frente);
  const hBanda = linhas.length * tam * entre;
  F.h = Math.round(2 * ry + hBanda * vert * (1 + persp));
  F._box = { x: F.x, y: F.y, w: 2 * rx * (1 + persp * .15) + tam, h: 2 * ry + hBanda * (1 + persp) + tam * .5, rot: F.rot || 0 };
}
// Discos com vidro fosco (referência de Caio 24/11 02:29): um disco sólido (preto ou branco) e, sobreposto, um disco de
// vidro fosco que desfoca muito o que está atrás (foto e disco sólido), com grão fino e um aro de luz discreto.
// Serve de caixa de texto: o texto opcional fica sobre o vidro.
let GRAO = null;
function grao(w, h) {
  if (GRAO && GRAO.width === w && GRAO.height === h) return GRAO;
  const t = document.createElement('canvas'); t.width = w; t.height = h; const g = t.getContext('2d'), id = g.createImageData(w, h);
  let s = 12345; for (let i = 0; i < w * h; i++) { s = (s * 1103515245 + 12345) >>> 0; const v = 96 + (s >>> 24) * .25 + ((s >>> 16 & 255) * .25); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0); return GRAO = t;
}
function desenharDiscoFosco(c, F, base) {
  const d = Math.max(20, F.w), r = d / 2, off = d * (F.deslocamento ?? .3), lado = F.ladoVidro === 'direita' ? 1 : -1;
  const xs = F.x - lado * off / 2, xv = F.x + lado * off / 2, y = F.y, escuro = !claro(F.cor || '#0c0c0d');
  c.save(); c.globalAlpha = F.opac ?? 1;
  // 1. disco sólido, com grão leve
  c.save(); c.beginPath(); c.arc(xs, y, r, 0, Math.PI * 2); c.fillStyle = F.cor || '#0c0c0d'; c.fill(); c.clip();
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = (F.opac ?? 1) * (F.grao ?? .45) * .35; c.drawImage(grao(W(), H()), 0, 0); c.restore();
  // 2. cena atrás do vidro = foto + disco sólido
  const cena = document.createElement('canvas'); cena.width = W(); cena.height = H(); const cc = cena.getContext('2d');
  cc.drawImage(base, 0, 0); cc.beginPath(); cc.arc(xs, y, r, 0, Math.PI * 2); cc.fillStyle = F.cor || '#0c0c0d'; cc.fill();
  // 3. vidro fosco: desfoque forte, véu suave, grão e aro de luz
  c.save(); c.beginPath(); c.arc(xv, y, r, 0, Math.PI * 2); c.clip();
  c.filter = `blur(${d * .13 * (F.desfoque ?? 1) + 2}px)`; c.drawImage(cena, 0, 0); c.filter = 'none';
  const veu = c.createRadialGradient(xv - lado * r * .35, y - r * .2, 0, xv, y, r);
  veu.addColorStop(0, escuro ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.22)'); veu.addColorStop(1, escuro ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.08)');
  c.fillStyle = veu; c.fillRect(xv - r, y - r, d, d);
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = (F.opac ?? 1) * (F.grao ?? .45); c.drawImage(grao(W(), H()), 0, 0);
  c.restore();
  const aro = c.createLinearGradient(xv - r, y - r, xv + r, y + r); aro.addColorStop(0, `rgba(255,255,255,${.55 * (F.aro ?? .6)})`); aro.addColorStop(.5, `rgba(255,255,255,${.12 * (F.aro ?? .6)})`); aro.addColorStop(1, `rgba(255,255,255,${.35 * (F.aro ?? .6)})`);
  c.beginPath(); c.arc(xv, y, r - .75, 0, Math.PI * 2); c.lineWidth = 1.5; c.strokeStyle = aro; c.stroke();
  if (F.legenda) {
    const tam = d * .075 * (F.escalaTexto || 1); c.fillStyle = F.corTexto || (escuro ? '#ffffff' : '#141518'); c.font = `${F.pesoLegenda || 400} ${tam}px ${familia(F.fonteLegenda || 'Neue Montreal')}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    String(F.legenda).split('\n').forEach((l, i, a) => c.fillText(l, xv, y + (i - (a.length - 1) / 2) * tam * 1.25));
  }
  c.restore();
  F.h = F.w; F._box = { x: F.x, y: F.y, w: d + off, h: d, rot: 0 };
}
// Pílulas (referência de Caio 24/11 01:44): cápsula de contorno fino com texto, ou cápsula com foto, sobre a pele.
function desenharPilula(c, F, base, k) {
  const tamT = F.h * .4 * (F.escalaTexto || 1), fonte = familia(F.fonteLegenda || 'Montserrat'), peso = F.pesoLegenda || 400;
  c.save(); c.font = `${peso} ${tamT}px ${fonte}`;
  if (k === 'pilula' && F.autoLargura !== false && F.legenda) F.w = Math.round(c.measureText(F.legenda).width + F.h * 1.05);
  const w = F.w, h = F.h, x0 = -w / 2, y0 = -h / 2, raio = F.vidro3d ? Math.min(w, h) * (F.raioVidro ?? .3) : h / 2, cam = () => { c.beginPath(); c.roundRect(x0, y0, w, h, raio); };
  c.globalAlpha = F.opac ?? 1; c.translate(F.x, F.y); c.rotate((F.rot || 0) * Math.PI / 180);
  if (F.vidro3d) {   // vidro fosco tridimensional (referência de Caio 24/11 02:00)
    const m = Math.min(w, h);
    c.save(); c.filter = `blur(${m * .16 + 6}px)`; c.translate(0, m * .1); cam(); c.fillStyle = `rgba(0,0,0,${.18 * (F.sombraVidro ?? 1)})`; c.fill(); c.restore();
    c.save(); cam(); c.clip(); c.rotate(-(F.rot || 0) * Math.PI / 180); c.translate(-F.x, -F.y); c.filter = `blur(${m * .12 + 10}px) brightness(1.06) saturate(1.05)`; c.drawImage(base, 0, 0); c.filter = 'none'; c.restore();
    c.save(); cam(); c.clip();
    const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, 'rgba(255,255,255,.24)'); g.addColorStop(1, 'rgba(255,255,255,.08)'); c.fillStyle = g; c.fillRect(x0, y0, w, h);
    c.filter = `blur(${m * .05 + 2}px)`; c.lineWidth = m * .14 + 6; c.strokeStyle = 'rgba(255,255,255,.16)'; cam(); c.stroke(); c.filter = 'none';   // espessura iluminada por dentro
    c.restore();
    const b = c.createLinearGradient(x0, y0, x0 + w, y0 + h); b.addColorStop(0, 'rgba(255,255,255,.95)'); b.addColorStop(.45, 'rgba(255,255,255,.35)'); b.addColorStop(1, 'rgba(255,255,255,.55)');
    c.save(); cam(); c.lineWidth = Math.max(1.5, m * .018); c.strokeStyle = b; c.stroke(); c.restore();
    c.save(); c.translate(0, Math.max(1.5, m * .02)); cam(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.22)'; c.stroke(); c.restore();
  }
  if (k === 'cartaoVidro') {
    c.fillStyle = F.corTexto || '#ffffff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const t1 = h * .34 * (F.escalaTexto || 1), t2 = h * .11 * (F.escalaTexto || 1), px = x0 + w * .1;
    c.font = `${F.pesoLegenda || 300} ${t1}px ${fonte}`; c.fillText(F.legenda || '', px, y0 + h * .58);
    c.font = `${F.pesoSub || 400} ${t2}px ${fonte}`; c.fillText(F.sublegenda || '', px, y0 + h * .58 + t2 * 1.7);
    c.restore(); F._box = { x: F.x, y: F.y, w: Math.max(w, 24), h: Math.max(h, 24), rot: F.rot || 0 }; return;
  }
  if (F.sombra > 0) { c.save(); sombrear(c, F.sombra); cam(); c.fillStyle = 'rgba(0,0,0,.01)'; c.fill(); c.restore(); }
  if (F.fosco || (k === 'pilulaFoto' && !F.img)) {   // vidro fosco: a própria foto desfocada dentro da cápsula
    c.save(); cam(); c.clip(); c.rotate(-(F.rot || 0) * Math.PI / 180); c.translate(-F.x, -F.y); c.filter = 'blur(18px) saturate(1.1)'; c.drawImage(base, 0, 0); c.filter = 'none'; c.restore();
    c.save(); cam(); c.fillStyle = k === 'pilulaFoto' && !F.img ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.10)'; c.fill(); c.restore();
  }
  if (F.preencher) { c.save(); cam(); c.fillStyle = F.cor; c.fill(); c.restore(); }
  if (k === 'pilulaFoto' && F.img) {
    const iw = F.img.naturalWidth || F.img.width, ih = F.img.naturalHeight || F.img.height, z = Math.max(w / iw, h / ih) * (F.fotoZoom || 1), dw = iw * z, dh = ih * z;
    c.save(); cam(); c.clip(); c.imageSmoothingQuality = 'high'; c.drawImage(F.img, x0 + (w - dw) * (F.fotoX ?? .5), y0 + (h - dh) * (F.fotoY ?? .5), dw, dh); c.restore();
  }
  if (k === 'pilulaFoto' && !F.img) { c.fillStyle = 'rgba(255,255,255,.85)'; c.font = `500 ${h * .2}px ${fonte}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('escolha a foto à direita', 0, 0); }
  if (F.contorno) { c.save(); cam(); c.strokeStyle = F.corContorno || '#ffffff'; c.lineWidth = F.esp || 2; tracejar(c, F); c.stroke(); c.restore(); }
  if (k === 'pilula' && F.legenda) { c.fillStyle = F.corTexto || '#ffffff'; c.font = `${peso} ${tamT}px ${fonte}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(F.legenda, 0, h * .03); }
  c.restore();
  F._box = { x: F.x, y: F.y, w: Math.max(w, 24), h: Math.max(h, 24), rot: F.rot || 0 };
}
// Estilo Pílulas: os itens da Frase (separados por | ou vírgula) viram cápsulas em fileiras desencontradas, com duas cápsulas de foto.
function pilulas(vidro = false) {
  let itens = frase().replace(/\*/g, '').split('|').map(t => t.trim()).filter(Boolean);
  if (itens.length < 2) itens = frase().replace(/\*/g, '').split(',').map(t => t.trim()).filter(Boolean);
  if (itens.length < 2) itens = ['Rugas finas', 'Manchas e tom irregular', 'Textura áspera', 'Fotoenvelhecimento'];
  const hp = st.formato === 'story' ? 84 : 76, hf = Math.round(hp * 1.42), gap = 18, vao = hf + 16, slots = [];
  const fotos = itens.length >= 3 && !vidro ? 2 : 0;
  // padrão da referência: [t t] [f t] [t f] [t t]…
  const fila = []; let i = 0, f = 0, r = 0;
  while (i < itens.length) {
    const linha = r === 1 && f < fotos ? ['f', 't'] : r === 2 && f < fotos ? ['t', 'f'] : ['t', 't'];
    const usa = linha.map(tp => tp === 'f' ? (f++, { tp }) : i < itens.length ? { tp, txt: itens[i++] } : null).filter(Boolean);
    fila.push(usa); r++;
  }
  ctx.font = `400 ${hp * .4}px Mont`;
  const larg = s => s.tp === 'f' ? hp * 4.1 : ctx.measureText(s.txt).width + hp * 1.05;
  const y0 = H() * .5 - (fila.length - 1) * vao / 2;
  fila.forEach((linha, li) => {
    const tot = linha.reduce((a, s) => a + larg(s), 0) + gap * (linha.length - 1), desloc = (li % 2 ? 1 : -1) * 18;
    let x = W() / 2 - tot / 2 + desloc;
    for (const s of linha) {
      const w = larg(s), base = { x: x + w / 2, y: y0 + li * vao, h: s.tp === 'f' ? hf : hp, w };
      slots.push(s.tp === 'f' ? forma({ forma: 'pilulaFoto', nome: 'Pílula com foto', ...base, contorno: false, fosco: true, doEstilo: true })
        : forma({ forma: 'pilula', nome: 'Pílula · ' + s.txt, ...base, legenda: s.txt, contorno: !vidro, preencher: false, corContorno: '#ffffff', esp: 1.5, corTexto: '#ffffff', pesoLegenda: 400, autoLargura: true, doEstilo: true, ...(vidro ? { vidro3d: true, raioVidro: .3, fonteLegenda: 'Neue Montreal', h: hp * 1.1 } : {}) }));
      x += w + gap;
    }
  });
  return slots;
}
const claro = cor => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(cor || ''); if (!m) return true; const [r, g, b] = m.slice(1).map(x => parseInt(x, 16)); return r * .3 + g * .59 + b * .11 > 150; };

function desenharMolde(c, M) {   // medidas de posts/molde_corte.py; v3: fonte, peso, linha e frase opcionais, posição livre e escala
  const pal = palavra(), LARG = 0.72, famP = familia(M.fontePalavra || 'Montserrat'), pesoP = M.pesoPalavra || 800;
  const famF = familia(M.fonteFrase || 'Montserrat'), pesoF = M.pesoFrase || 500, pesoFD = M.pesoDestaqueFrase || 800;
  let tam = 300, xs = [];
  for (; tam > 60; tam -= 2) {
    c.font = `${pesoP} ${tam}px ${famP}`; const av = [...pal].map(ch => c.measureText(ch).width - 0.04 * tam);
    if (av.slice(0, -1).reduce((a, b) => a + b, 0) + c.measureText(pal.at(-1)).actualBoundingBoxRight + c.measureText(pal[0]).actualBoundingBoxLeft <= LARG * W()) break;
  }
  c.font = `${pesoP} ${tam}px ${famP}`; const capH = c.measureText('H').actualBoundingBoxAscent;
  let x = MARGEM + c.measureText(pal[0]).actualBoundingBoxLeft; for (const ch of pal) { xs.push(x); x += c.measureText(ch).width - 0.04 * tam; }
  const masc = M.recorte && (st.pessoa || st.objetos[pessoaIdx()]?.img);
  let capTop = Math.round((st.formato === 'story' ? .3 : .29) * H());
  if (masc) {
    const m = mascara(masc), x0 = Math.max(0, Math.floor(xs[0])), x1 = Math.min(W(), Math.ceil(xs[0] + c.measureText(pal[0]).width));
    fora: for (let yy = 0; yy < H(); yy++) for (let xx = x0; xx < x1; xx++) if (m.alfa[(yy * W() + xx) * 4 + 3] > 128) { capTop = Math.round(yy - capH * (1 - M.cobertura)); break fora; }
  }
  capTop += M.dy || 0;
  let corte = [...pal].findIndex(ch => ACENTO.has(ch));
  if (corte <= 0) { const alvo = MARGEM + .6 * LARG * W(); corte = xs.findIndex(v => v > alvo); if (corte < 0) corte = pal.length - 1; corte = Math.max(1, Math.min(pal.length - 1, corte)); }
  const fim = xs[corte - 1] + c.measureText(pal[corte - 1]).actualBoundingBoxRight, linhaY = capTop - 3 * U;
  const L = { peso: pesoF, pesoDestaque: pesoFD, esp: .16, fonte: M.fonteFrase || 'Montserrat' };
  const txt = frase().toUpperCase(); let linhas = txt.split('|').map(segmentos), sz = 40;
  const larg = (segs, s) => medirLinha(segs, { ...L, tam: s }).w;
  while (sz > 12 && Math.max(...linhas.map(l => larg(l, sz))) > fim - MARGEM) sz -= .5;
  if (sz < 22) { sz = 22; const tk = txt.split(/[|\s]+/).filter(Boolean); linhas = []; let at = [];
    for (const t of tk) { if (at.length && larg(segmentos([...at, t].join(' ')), sz) > fim - MARGEM) { linhas.push(segmentos(at.join(' '))); at = [t]; } else at.push(t); }
    linhas.push(segmentos(at.join(' '))); }
  c.font = `${pesoF} ${sz}px ${famF}`; const capF = c.measureText('H').actualBoundingBoxAscent, bases = [M.linha === false ? capTop - 3 * U : linhaY - 2 * U];
  for (let i = 1; i < linhas.length; i++) bases.unshift(bases[0] - U - capF);
  const escala = M.escala || 1, ox = MARGEM, oy = capTop;   // escala a partir do canto superior esquerdo da palavra
  c.save(); c.translate((M.mx || 0) + ox, oy); c.scale(escala, escala); c.translate(-ox, -oy);
  c.fillStyle = M.cor || (M.tinta === 'clara' ? OSSO : GRAFITE);
  if (M.mostrarFrase !== false) linhas.forEach((l, i) => { let xx = MARGEM; for (const [ch, b, w] of medirLinha(l, { ...L, tam: sz }).chars) { c.font = `${b ? pesoFD : pesoF} ${sz}px ${famF}`; c.fillText(ch, xx, bases[i]); xx += w; } });
  if (M.linha !== false) c.fillRect(0, linhaY - 1, fim, 2);
  c.font = `${pesoP} ${tam}px ${famP}`; [...pal].forEach((ch, i) => c.fillText(ch, xs[i], capTop + capH));
  c.restore();
  const topo = M.mostrarFrase !== false ? bases[0] - capF : M.linha !== false ? linhaY : capTop, esq = M.linha !== false ? 0 : MARGEM;
  const right = Math.max(x, fim), bx0 = (M.mx || 0) + ox + (esq - ox) * escala, by0 = oy + (topo - 12 - oy) * escala, bx1 = (M.mx || 0) + ox + (right - ox) * escala, by1 = oy + (capTop + capH + 12 - oy) * escala;
  M._box = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, w: bx1 - bx0, h: by1 - by0, rot: 0 };
  M._partes = { pal, tam, famP, pesoP, xs, capTop, capH, fim, linhaY, sz, bases, capF, linhas: txt.split('|'), x };
  M._mascara = masc;
}

// Palavra que recorta o foco (referência de Caio 24/11 02:31): o texto vira máscara. "nitido": a foto fica nítida dentro
// das letras e desfocada (com véu claro) fora; "desfocado": o contrário. Mantém todas as bolinhas e fontes do texto.
function focoPorTexto(c, A) {
  const w = W(), h = H(), m = document.createElement('canvas'); m.width = w; m.height = h; const mc = m.getContext('2d');
  const mold = { ...A, cor: '#ffffff', opac: 1, sombra: 0 }; desenharTexto(mc, mold); A._box = mold._box;   // a caixa vem da cópia desenhada
  const nitida = document.createElement('canvas'); nitida.width = w; nitida.height = h; nitida.getContext('2d').drawImage(c.canvas, 0, 0);
  const borrada = document.createElement('canvas'); borrada.width = w; borrada.height = h; const bc = borrada.getContext('2d');
  bc.filter = `blur(${A.desfoqueFoco ?? 28}px)`; bc.drawImage(nitida, -2, -2, w + 4, h + 4); bc.filter = 'none';
  const veu = A.veuFoco ?? .18; if (veu > 0) { bc.fillStyle = `rgba(255,255,255,${veu})`; bc.fillRect(0, 0, w, h); }
  const esc = A.escurecerFoco ?? 0;
  const dentro = document.createElement('canvas'); dentro.width = w; dentro.height = h; const dc = dentro.getContext('2d');
  dc.drawImage(A.modoFoco === 'desfocado' ? borrada : nitida, 0, 0); if (esc > 0) { dc.fillStyle = `rgba(0,0,0,${esc})`; dc.fillRect(0, 0, w, h); }
  dc.globalCompositeOperation = 'destination-in'; dc.drawImage(m, 0, 0);
  c.save(); c.globalAlpha = 1; c.drawImage(A.modoFoco === 'desfocado' ? nitida : borrada, 0, 0); c.globalAlpha = A.opac ?? 1; c.drawImage(dentro, 0, 0); c.restore();
}
// Cache das camadas pesadas (revisão geral 24/11): se nada mudou na camada nem nas que estão embaixo dela,
// reaproveita o resultado em vez de refazer desfoques e máscaras a cada quadro (ex.: arrastar um texto por cima).
const PESADOS = new Set(['aguaLente', 'peliculaOptica', 'retratoInterno', 'espelhoFragmentado', 'fantasma', 'mapaFacial', 'sombraArquitetonica', 'painelAnalise', 'papelRecortado', 'gota', 'serum', 'janelaRealidade', 'desfoqueDifuso', 'recorteOval', 'discoFosco', 'cartaoVidro', 'fronteiraFoco', 'vidroTexturizado']);
let versaoFontes = 0; document.fonts?.addEventListener?.('loadingdone', () => { versaoFontes++; CACHE_CAMADA.clear(); });
let baseAtual = '';
const CACHE_CAMADA = new Map(), IDS = new WeakMap(); let proxId = 1;
const idDe = o => { if (!o || typeof o !== 'object') return 0; if (!IDS.has(o)) IDS.set(o, proxId++); return IDS.get(o); };
const assinatura = A => JSON.stringify(A, (k, v) => (k[0] === '_' || k === 'keyframes' || k === 'imgSrc') ? undefined : (k === 'img' ? idDe(v) : v));
function render(c, { selecao = false, tempo = (st.motion.preview ? st.motion.time : null) } = {}) {
  // Não recriar a superfície a cada frame: o MediaRecorder mantém esta mesma trilha Canvas.
  if (c.canvas.width !== W()) c.canvas.width = W();
  if (c.canvas.height !== H()) c.canvas.height = H();
  c.clearRect(0, 0, W(), H());
  c.fillStyle = '#000'; c.fillRect(0, 0, W(), H()); if (!st.img) return;
  // Caio 24/11 22:01: mover ou dar zoom na foto com efeitos por cima travava, porque cada quadro refazia todos os efeitos
  // e máscaras. Durante o gesto da foto desenha só a foto e os textos simples; ao soltar, a arte completa volta.
  if (st.rapido) { cobrir(c, st.img); for (const L of st.camadas) if (!L.oculto && L.tipo === 'texto' && !L.modoFoco && !(L.atras || []).length) desenharTexto(c, L); return; }
  const mascPessoa = () => { const m = st.pessoa || st.objetos[pessoaIdx()]?.img; return m ? mascara(m).canvas : null; };
  desenharFotoTratada(c, { foto: st.img, enquadrar: (g, src) => cobrir(g, src), mascara: mascPessoa, imagemFundo: st.imgFundo, w: W(), h: H(), f: st.fundo,
    chave: [chaveEnq(), idDe(st.img), idDe(st.pessoa), idDe(st.imgFundo)].join() });
  const quadro = [chaveEnq(), JSON.stringify(st.fundo), idDe(st.imgFundo), idDe(st.img), idDe(st.pessoa), idDe(st.rosto), st.objetos.map(o => idDe(o.img)).join('.'), versaoFontes].join();
  let pilha = '';
  for (const L of st.camadas) {
    if (L.oculto || L._editando) continue;   // o texto em edição aparece só na caixa (sem duplicar atrás)
    let A = tempo === null ? L : interpolate(L, tempo);
    if (A.forma === 'anelTexto' && tempo !== null && A.giro) A = { ...A, fase: (A.fase || 0) + A.giro * tempo };
    if (A.forma === 'receita') A = { ...A, _t: tempo };
    if (A.tipo === 'texto' && A.entrada && tempo !== null) A = aplicarEntrada(A, tempo, W(), st.motion.duration);
    if (A.tipo === 'texto' && A.modoFoco) { pilha += assinatura(A); focoPorTexto(c, A); if (A !== L) L._box = A._box; continue; }
    const sig = assinatura(A); baseAtual = quadro + '|' + pilha; pilha += sig;
    const chave = PESADOS.has(A.forma) ? pilha + '|' + quadro : null, guardado = chave && CACHE_CAMADA.get(chave);
    if (guardado) { L._box = guardado.box; if (A !== L) A._box = guardado.box; c.drawImage(guardado.t, 0, 0); continue; }
    const t = document.createElement('canvas'); t.width = W(); t.height = H(); const tc = t.getContext('2d');
    if (A.tipo === 'molde') desenharMolde(tc, A); else if (A.tipo === 'texto') desenharTexto(tc, A); else desenharForma(tc, A, c.canvas);
    if (A !== L) { L._box = A._box; L._mascara = A._mascara; L._partes = A._partes; }
    // planos: apaga a camada onde os objetos marcados ficam na frente
    const frente = [...(A.atras || []).map(i => st.objetos[i]?.img).filter(Boolean), ...(A.tipo === 'molde' && A._mascara ? [A._mascara] : [])];
    tc.globalCompositeOperation = 'destination-out'; for (const m of frente) tc.drawImage(mascara(m).canvas, 0, 0);
    if (chave) { CACHE_CAMADA.set(chave, { t, box: A._box }); if (CACHE_CAMADA.size > 12) CACHE_CAMADA.delete(CACHE_CAMADA.keys().next().value); }
    c.drawImage(t, 0, 0);
  }
  const ass = $('assinatura').value.trim().toUpperCase();
  if (ass) { c.font = '400 15px Neue'; c.fillStyle = OSSO; c.textAlign = 'center'; c.fillText(ass.split(/\s+/).map(p => [...p].join(' ')).join('   '), W() / 2, st.formato === 'story' ? H() - 300 : H() - 46); c.textAlign = 'left'; }
  if (selecao && !st.editando) desenharSelecao(c);   // bolinhas somem enquanto digita
}

// ---------- seleção: moldura e bolinhas (iguais em todas as camadas) ----------
const px = () => W() / (cv.getBoundingClientRect().width || W());   // unidades do canvas por pixel de tela
function alcas(L) {
  if (L.forma === 'mapaFacial') return [];
  if (L._perspectivaUI && ['retratoInterno','espelhoFragmentado'].includes(L.forma)) return quadPoints(L).map(([x,y],i)=>({id:'quad'+i,x:(x-.5)*L.w,y:(y-.5)*L.h}));
  const b = L._box, k = px(), so = L.tipo === 'molde' ? ['nw', 'ne', 'sw', 'se'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'rot'];
  if (L.tipo === 'texto') { so.splice(so.indexOf('sw'), 1, 'curva'); so.push('incl'); }
  const pos = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], curva: [-1, 1] };
  return so.map(id => id === 'rot' ? { id, x: 0, y: -b.h / 2 - 34 * k * ALCA() } : id === 'incl' ? { id, x: -b.w / 2 - 26 * k * ALCA(), y: 0 } : { id, x: pos[id][0] * b.w / 2, y: pos[id][1] * b.h / 2 });
}
const ALCA = () => document.body.classList.contains('celular') ? 1.8 : 1;   // bolinhas maiores para o dedo
function desenharSelecao(c) {
  const k = px();
  if (st.guias) {
    c.save(); c.strokeStyle = '#ff5fd2'; c.lineWidth = 1.5 * k; c.setLineDash([6 * k, 5 * k]);
    for (const x of st.guias.v || []) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H()); c.stroke(); }
    for (const y of st.guias.h || []) { c.beginPath(); c.moveTo(0, y); c.lineTo(W(), y); c.stroke(); }
    c.restore();
  }
  const S = st.camadas[st.sel]; if (!S?._box || S.oculto) return;
  const alvo = alvoAmpliacao(S);
  if (alvo) {   // o que a lupa/retrato amplia: alvo tracejado arrastável ligado à lente por uma linha fina
    c.save(); c.strokeStyle = '#7cc4ff'; c.lineWidth = 1.5 * k; c.setLineDash([7 * k, 5 * k]);
    const ang = Math.atan2(alvo.y - S._box.y, alvo.x - S._box.x), rL = Math.min(S._box.w, S._box.h) / 2; c.beginPath(); c.moveTo(alvo.x, alvo.y); c.lineTo(S._box.x + Math.cos(ang) * rL, S._box.y + Math.sin(ang) * rL); c.stroke();
    c.lineWidth = 2 * k; c.beginPath(); if (alvo.redondo) c.arc(alvo.x, alvo.y, alvo.w / 2, 0, 7); else c.rect(alvo.x - alvo.w / 2, alvo.y - alvo.h / 2, alvo.w, alvo.h); c.stroke();
    c.setLineDash([]); c.fillStyle = '#7cc4ff'; c.beginPath(); c.arc(alvo.x, alvo.y, 5 * k, 0, 7); c.fill();
    c.font = `600 ${11 * k}px system-ui`; c.textAlign = 'center'; c.fillText('o que a lente amplia', alvo.x, alvo.y + alvo.h / 2 + 16 * k); c.textAlign = 'left'; c.restore();
  }
  const b = S._box; c.save(); c.translate(b.x, b.y); c.rotate((b.rot || 0) * Math.PI / 180);
  c.strokeStyle = '#c6f578'; c.lineWidth = 1.5 * k; c.setLineDash([]);
  if(S._perspectivaUI&&['retratoInterno','espelhoFragmentado'].includes(S.forma)){c.beginPath();quadPoints(S).forEach(([x,y],i)=>i?c.lineTo((x-.5)*S.w,(y-.5)*S.h):c.moveTo((x-.5)*S.w,(y-.5)*S.h));c.closePath();c.stroke();}
  else c.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
  for (const a of alcas(S)) {
    c.beginPath();
    if (a.id === 'rot') { c.moveTo(0, -b.h / 2); c.lineTo(0, a.y); c.stroke(); c.beginPath(); c.arc(a.x, a.y, 8 * k, 0, 7); c.fillStyle = '#c6f578'; c.fill(); c.lineWidth = 2 * k; c.strokeStyle = '#16200d'; c.stroke(); c.strokeStyle = '#c6f578'; c.lineWidth = 1.5 * k; continue; }
    const cor = S.tipo !== 'texto' ? '#fff' : a.id === 'incl' ? '#ba965a' : a.id === 'curva' ? '#7a5bb5' : a.id.length === 2 ? '#28695e' : '#276aa8';
    c.arc(a.x, a.y, (a.id.length === 2 || a.id === 'curva' ? 7.5 : a.id === 'incl' ? 7 : 6) * k * ALCA(), 0, 7); c.fillStyle = cor; c.fill();
    if (S.tipo === 'texto') { c.lineWidth = 2 * k; c.strokeStyle = '#fff'; c.stroke(); c.strokeStyle = '#c6f578'; c.lineWidth = 1.5 * k; } else c.stroke();
  }
  c.restore();
}
let quadroPendente = 0;
const desenhar = () => { if (quadroPendente) { cancelAnimationFrame(quadroPendente); quadroPendente = 0; } render(ctx, { selecao: true }); painel(); interfaceAtual(); };
// Caio 24/11 22:01: no máximo um desenho por quadro da tela; antes cada movimento do dedo desenhava a arte inteira e os
// pedidos se acumulavam (com efeitos pesados, a pinça travava).
const redesenhar = () => { if (quadroPendente) return; quadroPendente = requestAnimationFrame(() => { quadroPendente = 0; render(ctx, { selecao: true }); }); };

// ---------- desfazer / refazer ----------
const hist = { pilha: [], pos: -1 };
const copiar = cs => cs.map(l => ({ ...l, atras: [...(l.atras || [])], keyframes: l.keyframes ? l.keyframes.map(k => ({ t: k.t, values: { ...k.values } })) : l.keyframes }));
const chave = cs => JSON.stringify(cs, (k, v) => k === 'img' || k.startsWith('_') ? undefined : v);
function registrar() {
  const k = chave(st.camadas) + '|' + $('frase').value + '|' + $('palavra').value;
  if (hist.pilha[hist.pos]?.k === k) return;
  hist.pilha = hist.pilha.slice(0, hist.pos + 1); hist.pilha.push({ k, c: copiar(st.camadas), sel: st.sel, frase: $('frase').value, palavra: $('palavra').value });
  if (hist.pilha.length > 100) hist.pilha.shift(); hist.pos = hist.pilha.length - 1; interfaceAtual();
}
function voltar(d) {
  const p = hist.pilha[hist.pos + d]; if (!p) return;
  hist.pos += d; st.camadas = copiar(p.c); st.sel = Math.min(p.sel, st.camadas.length - 1); $('frase').value = p.frase; $('palavra').value = p.palavra; desenhar();
}
$('desfazer').onclick = () => voltar(-1); $('refazer').onclick = () => voltar(1);

// ---------- zoom e estado da interface ----------
function ajustarZoom() {
  const box = $('pstage'), fit = Math.min((box.clientWidth - 16) / W(), (box.clientHeight - 16) / H()), s = st.zoom ?? fit;
  cv.style.width = W() * s + 'px'; cv.style.height = H() * s + 'px';
  $('zoomLabel').textContent = st.zoom == null ? 'Ajustar' : Math.round(s * 100) + '%';
  return fit;
}
$('zoomMais').onclick = () => { st.zoom = Math.min(4, (st.zoom ?? ajustarZoom()) * 1.25); ajustarZoom(); redesenhar(); };
$('zoomMenos').onclick = () => { st.zoom = Math.max(.1, (st.zoom ?? ajustarZoom()) / 1.25); ajustarZoom(); redesenhar(); };
$('zoomLabel').onclick = () => { st.zoom = null; ajustarZoom(); redesenhar(); };
cv.addEventListener('wheel', e => {   // pinça na trackpad (chega como ctrl+roda) ou ⌥+roda: aproxima a foto dentro do quadro
  if (!st.img || e.metaKey || !(e.ctrlKey || e.altKey)) return; e.preventDefault(); e.stopPropagation();
  const p = local(e), E0 = enquadramento(), fz = Math.max(.3, Math.min(5, (+$('fz').value || 1) * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .002))));
  $('fz').value = fz; const E1 = enquadramento(), r = E1.dw / E0.dw;   // o ponto da foto sob o cursor fica parado
  posicionarFoto(p.x - (p.x - E0.x) * r, p.y - (p.y - E0.y) * r, E1);
  st.rapido = true; redesenhar(); clearTimeout(st.tm); st.tm = setTimeout(() => { st.rapido = false; encaixarFoto(); desenhar(); miniaturas(); }, 400);
}, { passive: false });
$('enquadrarReset').onclick = () => { $('fx').value = .5; $('fy').value = .5; $('fz').value = 1; $('ox').value = 0; $('oy').value = 0; desenhar(); miniaturas(); };
$('pstage').addEventListener('wheel', e => { if (!e.metaKey) return; e.preventDefault(); st.zoom = Math.max(.1, Math.min(4, (st.zoom ?? ajustarZoom()) * Math.exp(-e.deltaY * .004))); ajustarZoom(); redesenhar(); }, { passive: false });
addEventListener('resize', () => { ajustarZoom(); redesenhar(); });
function interfaceAtual() {
  ajustarZoom();
  const L = st.camadas[st.sel];
  $('selName').textContent = L ? L.nome : st.img ? 'Clique numa camada para editar' : '';
  for (const id of ['tbFrente', 'tbTras', 'tbDuplicar', 'tbApagar']) $(id).disabled = !L;
  $('desfazer').disabled = hist.pos <= 0; $('refazer').disabled = hist.pos >= hist.pilha.length - 1;
  $('empty').classList.toggle('hide', !!st.img);
  pontosLinhaTempo();
}
function pontosLinhaTempo() {
  const tr = $('tlTrack'); tr.querySelectorAll('.kf').forEach(n => n.remove());
  const L = st.camadas[st.sel]; if (!L?.keyframes?.length) return;
  for (const k of L.keyframes) { const d = document.createElement('span'); d.className = 'kf'; d.style.left = (k.t / st.motion.duration * 100) + '%'; d.title = k.t.toFixed(2) + ' s';
    d.onclick = () => { stopMotion(); setMotionTime(k.t, true); }; tr.append(d); }
}

// ---------- clipes editoriais animados ----------
let animationRaf = 0, videoBusy = false;
function stopMotion() { cancelAnimationFrame(animationRaf); animationRaf = 0; $('motionPlay').textContent = '▶'; }
function setMotionTime(value, preview = true) {
  st.motion.time = Math.max(0, Math.min(st.motion.duration, Number(value) || 0));
  st.motion.preview = preview;
  $('motionTime').value = String(st.motion.time);
  $('motionClock').textContent = st.motion.time.toFixed(2) + ' s';
  render(ctx, { selecao: !animationRaf, tempo: preview ? st.motion.time : null });
}
$('motionDuration').onchange = () => {
  const n = Math.max(2, Math.min(20, Number($('motionDuration').value) || 6));
  st.motion.duration = n; $('motionDuration').value = n; $('motionTime').max = n;
  stopMotion(); setMotionTime(Math.min(st.motion.time, n), true); pontosLinhaTempo();
};
$('motionTime').oninput = e => { stopMotion(); setMotionTime(e.target.value, true); };
$('motionEdit').onclick = () => {
  const L = st.camadas[st.sel]; if (!L) return status('Selecione uma camada para animar.', true);
  Object.assign(L, snapshot(interpolate(L, st.motion.time))); st.motion.preview = false; desenhar();
  $('motionHint').textContent = 'Agora mova ou ajuste a camada. Depois toque em Gravar ponto.';
};
$('motionMark').onclick = () => {
  const L = st.camadas[st.sel]; if (!L) return status('Selecione uma camada para animar.', true);
  try { const t = saveKeyframe(L, st.motion.time); setMotionTime(t, true); registrar(); painel(); pontosLinhaTempo();
    $('motionHint').textContent = (L.keyframes?.length || 0) + ' ponto(s) nesta camada. Avance o tempo, mude a camada e grave outro.'; }
  catch (e) { status(e.message, true); }
};
$('motionDelete').onclick = () => {
  const L = st.camadas[st.sel]; if (!L) return;
  removeKeyframe(L, st.motion.time); setMotionTime(st.motion.time, true); registrar(); painel(); pontosLinhaTempo();
  $('motionHint').textContent = 'Ponto removido deste instante.';
};
$('motionPlay').onclick = () => {
  if (animationRaf) { stopMotion(); return; }
  if (!st.img) return status('Escolha uma imagem antes de reproduzir.', true);
  st.motion.preview = true; const origin = performance.now(), offset = st.motion.time >= st.motion.duration ? 0 : st.motion.time;
  $('motionPlay').textContent = '■';
  const tick = clock => {
    const t = offset + (clock - origin) / 1000;
    if (t >= st.motion.duration) { stopMotion(); setMotionTime(0, true); return; }
    setMotionTime(t, true); animationRaf = requestAnimationFrame(tick);
  };
  animationRaf = requestAnimationFrame(tick);
};
// Exportação quadro a quadro (Caio 24/11/2026 04:24: o anel travava). Cada quadro é desenhado no tempo exato
// (t = i / 60) numa tela fora da vista e enviado ao Mac, que monta o MP4 a 60 quadros por segundo.
// Não depende do relógio da tela: por mais pesada que seja a arte, nenhum quadro se perde ou se repete.
const FPS_CLIPE = 60;
$('exportarVideo').onclick = async () => {
  if (videoBusy) return;
  if (!st.img) return status('Escolha uma imagem antes de exportar o clipe.', true);
  stopMotion(); videoBusy = true; const btn = $('exportarVideo'); btn.disabled = true; btn.textContent = 'Exportando…';
  let sid = null;
  try {
    const dur = Math.max(1, Math.min(20, st.motion.duration || 6)), total = Math.round(dur * FPS_CLIPE);
    const ini = await fetch('/api/posts/quadros/iniciar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fps: FPS_CLIPE, total }) });
    const j = await ini.json().catch(() => ({ error: ini.status === 404 || ini.status === 501 ? '501' : 'Unexpected token' })); if (!ini.ok || j.error) throw new Error(j.error || ini.status);
    sid = j.id;
    const tela = document.createElement('canvas'); tela.width = W(); tela.height = H(); const g = tela.getContext('2d');
    const envios = new Set(), t0 = performance.now();
    for (let i = 0; i < total; i++) {
      render(g, { selecao: false, tempo: i / FPS_CLIPE });
      const blob = await new Promise(ok => tela.toBlob(ok, 'image/jpeg', .95));
      const envio = fetch(`/api/posts/quadros/${sid}/${i}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob })
        .then(r => { if (!r.ok) throw new Error('quadro ' + i + ' recusado'); }).finally(() => envios.delete(envio));
      envios.add(envio); if (envios.size >= 4) await Promise.race(envios);   // até 4 quadros subindo enquanto o próximo é desenhado
      if (i % 6 === 0) { const pct = Math.round(i / total * 100), resta = (performance.now() - t0) / Math.max(1, i) * (total - i) / 1000;
        btn.textContent = `Quadros ${pct}%`; $('motionClock').textContent = `${pct}% · faltam ~${Math.ceil(resta)} s`; await new Promise(r => setTimeout(r)); }
    }
    await Promise.all(envios);
    btn.textContent = 'Montando MP4…';
    const fim = await fetch(`/api/posts/quadros/${sid}/fim`, { method: 'POST' }); sid = null;
    if (!fim.ok) { const e = await fim.json().catch(() => ({ error: 'Falha ao montar o MP4.' })); throw new Error(e.error); }
    const mp4 = await fim.blob(); if (mp4.size < 1024) throw new Error('O vídeo exportado está vazio.');
    baixar(mp4, 'CAIO_ENDLICH_' + (st.projeto?.nome || 'photo_studio').replace(/[^\wÀ-ú]+/g, '_').slice(0, 40) + '_' + st.formato + '.mp4');
    status(`Clipe MP4 exportado: ${total} quadros a ${FPS_CLIPE} por segundo, sem áudio.`);
  } catch (e) {
    if (sid) fetch(`/api/posts/quadros/${sid}/cancelar`, { method: 'POST' }).catch(() => {});
    status('Não consegui exportar o clipe: ' + e.message, true);
  } finally { videoBusy = false; btn.disabled = false; btn.textContent = btn.dataset.rotulo || 'Exportar clipe'; setMotionTime(st.motion.time, true); }
};

// ---------- miniaturas dos estilos ----------
function miniaturas() {
  const box = $('thumbs'); box.innerHTML = '';
  const salvo = st.camadas;
  for (const E of ESTILOS) {
    const b = document.createElement('button'); b.className = 'thumb' + (st.estilo === E.id ? ' on' : '');
    const t = document.createElement('canvas'); t.width = 216; t.height = Math.round(216 * H() / W());
    st.camadas = [...E.criar(), ...salvo.filter(l => l.tipo === 'forma' && !l.doEstilo && !PESADOS.has(l.forma) && l.forma !== 'receita' && !isEditorialEffect(l.forma))];   // miniatura sem efeitos pesados
    const full = document.createElement('canvas').getContext('2d'); render(full); t.getContext('2d').drawImage(full.canvas, 0, 0, t.width, t.height);
    b.append(t); const s = document.createElement('span'); s.textContent = E.nome + (E.planos ? ' · planos' : ''); b.append(s);
    b.onclick = () => aplicarEstilo(E); box.append(b);
  }
  st.camadas = salvo;
}
// Regra de Caio (24/11 21:15), para todos os estilos: com um texto selecionado (texto, molde, estilo de palavra ou peça
// de um estilo), o estilo tocado transforma esse texto, mantendo as palavras; tocar outro estilo transforma de novo.
// Sem nada selecionado, cria um texto novo. Peças criadas juntas por um estilo formam um grupo e são trocadas juntas.
const TEXTUAL = L => !!L && (L.tipo === 'texto' || L.tipo === 'molde' || L.forma === 'receita' || !!L.doEstilo || !!L.grupo);
const limparTexto = t => String(t || '').replace(/\*/g, '').replace(/\s*\n\s*/g, ' ').trim();
function palavrasDe(S) {
  if (!S) return null;
  const textos = S.grupo ? st.camadas.filter(l => l.grupo === S.grupo && l.tipo === 'texto') : [];
  if (textos.length > 1) {   // estilo com palavra grande + frase: a maior letra é a palavra, o resto é a frase
    const maior = textos.reduce((a, b) => ((b.tam || 0) * (b.sy || 1) > (a.tam || 0) * (a.sy || 1) ? b : a));
    return { palavra: limparTexto(maior.texto), frase: textos.filter(l => l !== maior).map(l => String(l.texto || '').replace(/\n/g, '|')).join('|') };
  }
  if (S.tipo === 'texto') return { palavra: limparTexto(S.texto) };
  if (S.forma === 'receita') return { palavra: limparTexto(S.texto), frase: S.sub || '' };
  if (S.tipo === 'molde') return { palavra: limparTexto($('palavra').value), frase: $('frase').value };
  const irmao = st.camadas.find(l => l.grupo && l.grupo === S.grupo && (l.tipo === 'texto' || l.forma === 'receita'));
  return irmao ? palavrasDe(irmao) : null;
}
function trocarSelecao(novas) {
  const S = st.camadas[st.sel], g = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  novas.forEach(l => { l.grupo = g; });
  if (TEXTUAL(S)) {
    const tirar = new Set(S.grupo ? st.camadas.filter(l => l.grupo === S.grupo) : [S]);
    const idx = Math.max(0, st.camadas.findIndex(l => tirar.has(l)));
    st.camadas = st.camadas.filter(l => !tirar.has(l)); st.camadas.splice(idx, 0, ...novas); st.sel = idx + novas.length - 1;
  } else { st.camadas.push(...novas); st.sel = st.camadas.length - 1; }
}
async function aplicarEstilo(E) {
  st.estilo = E.id;
  if (E.planos && !st.objetos.length && st.img) await detectar();
  const S = st.camadas[st.sel], w = TEXTUAL(S) ? palavrasDe(S) : null;
  if (w?.palavra) $('palavra').value = w.palavra;
  if (w?.frase) $('frase').value = w.frase;
  trocarSelecao(E.criar()); miniaturas(); desenhar(); registrar();
}

// ---------- inspetor ----------
const ICONE = L => L.tipo === 'molde' ? 'Aa' : L.tipo === 'texto' ? 'T' : L.forma === 'imagem' ? '▣' : isEditorialEffect(L.forma) ? '✦' : '◇';
const OLHO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const OLHO_OFF = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3l18 18M10.6 5.1A10 10 0 0122 12s-1.3 2.3-3.7 4.3M6.3 6.3C3.6 8.2 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/></svg>';
let alvo = null;
function secao(titulo, aberta = true) { const d = document.createElement('details'); d.open = aberta; d.innerHTML = `<summary>${titulo}</summary><div class="body"></div>`; $('props').append(d); alvo = d.querySelector('.body'); return alvo; }
function painel() {
  // camadas
  $('layers').innerHTML = '';
  st.camadas.forEach((L, i) => {
    const d = document.createElement('div'); d.className = 'layer' + (i === st.sel ? ' on' : '') + (L.oculto ? ' off' : '');
    d.innerHTML = `<span class="ic">${ICONE(L)}</span><span class="nm"></span>${L.keyframes?.length ? `<span class="bd">◆${L.keyframes.length}</span>` : ''}<button class="eye" title="Mostrar ou ocultar">${L.oculto ? OLHO_OFF : OLHO}</button>`;
    d.querySelector('.nm').textContent = (L.atras?.length ? '◐ ' : '') + L.nome; d.title = 'Dois cliques para renomear';
    d.onclick = () => { st.sel = i; desenhar(); };
    d.querySelector('.nm').ondblclick = e => { e.stopPropagation(); const n = e.target; n.contentEditable = 'true'; n.focus(); document.getSelection().selectAllChildren(n);
      n.onblur = () => { L.nome = n.textContent.trim() || L.nome; n.contentEditable = 'false'; registrar(); painel(); }; n.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); n.blur(); } }; };
    d.querySelector('.eye').onclick = e => { e.stopPropagation(); L.oculto = !L.oculto; registrar(); desenhar(); };
    $('layers').prepend(d);
  });
  if (!st.camadas.length) $('layers').innerHTML = '<div class="empty-note">Sem camadas. Use as abas da esquerda para adicionar texto, formas ou efeitos.</div>';
  // planos da foto
  const L = st.camadas[st.sel];
  $('objs').innerHTML = '';
  if (!st.objetos.length) $('objs').innerHTML = '<div class="empty-note" style="margin-top:8px">Detecte para passar textos por trás da pessoa ou de objetos, ou para soltar um objeto como camada.</div>';
  st.objetos.forEach((o, i) => {
    const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:6px';
    const l = document.createElement('label'); l.className = 'chk'; l.style.flex = '1';
    const c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!L?.atras?.includes(i); c.disabled = !L || L.tipo === 'molde';
    c.onchange = () => { L.atras = c.checked ? [...(L.atras || []), i] : L.atras.filter(x => x !== i); registrar(); desenhar(); };
    l.append(c, ` ${o.name} na frente`); l.title = 'Marcado: este objeto passa na frente da camada selecionada';
    const solta = document.createElement('button'); solta.textContent = 'Soltar'; solta.title = 'Cria uma camada com este objeto recortado da foto, livre para mover, girar e aumentar';
    solta.style.cssText = 'padding:4px 8px;font-size:10.5px;border-radius:6px'; solta.onclick = () => soltarObjeto(o);
    row.append(l, solta); $('objs').append(row);
  });
  // propriedades
  const p = $('props'); p.innerHTML = ''; if (!L) return;
  const fmt = v => Number.isFinite(+v) ? +(+v).toFixed(3) : v;
  const campo = (rot, k, html, conv = v => v) => { const l = document.createElement('label'); l.className = 'f'; l.innerHTML = rot + html; const inp = l.querySelector('input,select,textarea'); inp.value = L[k] ?? '';
    inp.oninput = () => { L[k] = conv(inp.value); redesenhar(); }; inp.onchange = () => { registrar(); if (inp.tagName === 'SELECT') desenhar(); }; alvo.append(l); return inp; };
  const faixa = (rot, k, min, max, passo, padrao = 0) => { const l = document.createElement('label'); l.className = 'f';
    l.innerHTML = `${rot}<div class="r"><input type="range" min="${min}" max="${max}" step="${passo}"><input type="number" min="${min}" max="${max}" step="${passo}"></div>`;
    const [r, n] = l.querySelectorAll('input'); r.value = n.value = fmt(L[k] ?? padrao);
    const set = v => { L[k] = Number(v); if (L.forma === 'ampliacaoSuperficie' && k === 'w') L.h = L.w; r.value = n.value = fmt(L[k]); redesenhar(); };
    r.oninput = () => set(r.value); n.oninput = () => set(n.value); r.onchange = n.onchange = () => registrar(); alvo.append(l); };
  const marca = (rot, k, padrao) => { const l = document.createElement('label'); l.className = 'chk'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = L[k] ?? padrao;
    c.onchange = () => { L[k] = c.checked; registrar(); desenhar(); }; l.append(c, ' ' + rot); alvo.append(l); };
  const cor = (rot, k, padrao) => { const l = document.createElement('label'); l.className = 'f'; l.innerHTML = rot + '<div class="cr"><input type="color"><input type="text" maxlength="7"></div>';
    const [sw, hx] = l.querySelectorAll('input'); sw.value = hx.value = /^#[\da-f]{6}$/i.test(L[k] || '') ? L[k] : padrao;
    sw.oninput = () => { L[k] = hx.value = sw.value; redesenhar(); }; hx.oninput = () => { if (/^#[\da-f]{6}$/i.test(hx.value)) { L[k] = sw.value = hx.value; redesenhar(); } };
    sw.onchange = hx.onchange = () => registrar(); alvo.append(l); };
  const seletor = (rot, k, ops) => campo(rot, k, `<select>${ops.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`);
  const fontes = Object.keys(FONTES).map(f => [f, f]);
  const botao = (t, fn) => { const b = document.createElement('button'); b.className = 'btn-wide'; b.textContent = t; b.style.marginTop = '8px'; b.onclick = fn; alvo.append(b); };

  if (L.forma === 'desfoqueDifuso') {
    secao('Desfoque difuso');
    faixa('Intensidade do desfoque','desfoque',0,140,1);faixa('Dissolver as bordas','suavidade',.05,1,.01);
    faixa('Irregularidade','irregularidade',0,.4,.01);faixa('Opacidade','opac',0,1,.01);
    secao('Posição e extensão');faixa('Horizontal','x',-W(),W()*2,1);faixa('Vertical','y',-H(),H()*2,1);
    faixa('Largura','w',50,W()*3,1);faixa('Altura','h',50,H()*3,1);faixa('Girar','rot',-180,180,1);
    botao('Duplicar área de desfoque',()=>{st.camadas.push({...L,x:L.x-100,y:L.y+100});st.sel=st.camadas.length-1;registrar();desenhar();});
    return;
  }
  if (L.forma === 'painelAnalise') {
    secao('Área de foco');
    botao('Desenhar área de foco', () => { stopMotion(); st.motion.preview=false; desenharFoco(L); });
    botao('Voltar ao foco oval', () => { L.foco=[]; registrar(); desenhar(); });
    faixa('Desfoque do entorno','desfoque',0,45,1);
    faixa('Suavidade ao redor','suavidade',0,140,1);
    secao('Informações');
    campo('Título','titulo','<input type="text" maxlength="100">');
    campo('Área tratada','area','<textarea maxlength="240"></textarea>');
    campo('Proposta','proposta','<textarea maxlength="240"></textarea>');
    campo('Objetivo','objetivo','<textarea maxlength="240"></textarea>');
    marca('Mostrar painel','mostrarPainel',true);
    faixa('Opacidade do painel','painelOpacidade',0,1,.01);
    cor('Fundo do painel','corPainel','#19211e'); cor('Texto','corTexto','#ffffff');
    faixa('Painel horizontal','painelX',0,W(),1);faixa('Painel vertical','painelY',0,H(),1);
    faixa('Largura do painel','painelW',300,1000,1);faixa('Altura mínima','painelH',100,1000,1);
    secao('Posição do foco');faixa('Horizontal','x',0,W(),1);faixa('Vertical','y',0,H(),1);
    faixa('Largura','w',30,W(),1);faixa('Altura','h',30,H(),1);faixa('Girar','rot',-180,180,1);
    return;
  }
  if (L.tipo === 'molde') {
    secao('Conteúdo');
    const fr = document.createElement('label'); fr.className = 'f'; fr.innerHTML = 'Frase (| quebra a linha, *palavra* em negrito)<textarea></textarea>';
    const ta = fr.querySelector('textarea'); ta.value = $('frase').value; ta.oninput = () => { $('frase').value = ta.value; redesenhar(); clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 500); }; ta.onchange = registrar; alvo.append(fr);
    const pa = document.createElement('label'); pa.className = 'f'; pa.innerHTML = 'Palavra grande<input type="text">';
    const ip = pa.querySelector('input'); ip.value = $('palavra').value; ip.oninput = () => { $('palavra').value = ip.value; redesenhar(); clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 500); }; ip.onchange = registrar; alvo.append(pa);
    secao('Palavra grande'); seletor('Fonte', 'fontePalavra', fontes); faixa('Peso', 'pesoPalavra', 100, 900, 100, 800);
    secao('Frase'); marca('Mostrar a frase', 'mostrarFrase', true); seletor('Fonte', 'fonteFrase', fontes); faixa('Peso', 'pesoFrase', 100, 900, 100, 500); faixa('Peso das *palavras*', 'pesoDestaqueFrase', 100, 900, 100, 800);
    secao('Linha e cor'); marca('Linha entre frase e palavra', 'linha', true);
    seletor('Cor do texto', 'tinta', [['escura', 'Grafite'], ['clara', 'Osso']]); cor('Outra cor (substitui a de cima)', 'cor', GRAFITE);
    secao('Profundidade e posição'); marca('Palavra atrás da pessoa', 'recorte', true); faixa('Quanto a pessoa cobre da palavra', 'cobertura', .15, .85, .01, .5);
    faixa('Escala', 'escala', .3, 2.5, .01, 1); faixa('Horizontal', 'mx', -900, 900, 1, 0); faixa('Vertical', 'dy', -1200, 1200, 1, 0);
    botao('Separar em camadas livres', () => separarMolde(L));
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Separar transforma o molde em palavra, frase e linha independentes, cada uma com todas as bolinhas e fontes.'; alvo.append(h);
    return;
  }
  if (L.tipo === 'texto') {
    secao('Texto'); campo('Conteúdo (*palavra* em negrito)', 'texto', '<textarea></textarea>');
    seletor('Efeito do texto', 'modoFoco', [['', 'Texto normal'], ['nitido', 'Foto nítida dentro das letras'], ['desfocado', 'Foto desfocada dentro das letras']]);
    if (L.modoFoco) { faixa('Desfoque', 'desfoqueFoco', 2, 80, 1, 28); faixa('Véu claro no desfoque', 'veuFoco', 0, .6, .01, .18); faixa('Escurecer dentro das letras', 'escurecerFoco', 0, .6, .01, 0); }
    seletor('Fonte', 'fonte', fontes); seletor('Alinhar', 'alinhar', [['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']]); marca('Caixa alta', 'caixa', true);
    cor('Cor', 'cor', GRAFITE);
    secao('Tipografia'); faixa('Tamanho', 'tam', 8, 600, 1); faixa('Peso', 'peso', 100, 900, 100); faixa('Peso das *palavras*', 'pesoDestaque', 100, 900, 100);
    faixa('Espaço entre letras', 'esp', -.15, 1.2, .01); faixa('Entrelinha', 'entre', .7, 2.6, .05);
    secao('Forma do texto', false); faixa('Abaular', 'arco', -100, 100, 1); faixa('Esticar na horizontal', 'sx', .2, 3, .01, 1); faixa('Esticar na vertical', 'sy', .2, 3, .01, 1); faixa('Inclinar', 'incl', -45, 45, 1);
    secao('Aparência'); faixa('Girar', 'rot', -180, 180, 1); faixa('Opacidade', 'opac', .05, 1, .01, 1); faixa('Sombra', 'sombra', 0, .9, .01, 0);
    secao('Entrada no vídeo', false); seletor('Animação de entrada (como no Video Studio)', 'entrada', ENTRADAS);
    if (L.entrada) { faixa('Começa em (s)', 'inicio', 0, 20, .1, 0); faixa('Duração da entrada (s)', 'durEntrada', .1, 3, .05, .6); }
    return;
  }
  if (L.forma === 'receita') {
    const R = receitaPorId(L.receita);
    secao(R?.nome || 'Estilo de palavra'); campo(L.receita === 'contorno' ? 'Frase que corre pelo contorno' : 'Palavra', 'texto', '<input type="text">');
    if (['anel', 'anelCabeca', 'contorno', 'cordinha', 'rotulo', 'cristal', 'destaque'].includes(L.receita)) campo(L.receita.startsWith('anel') ? 'Frase da frente (vazio repete a palavra)' : L.receita === 'contorno' ? 'Segunda frase (opcional)' : 'Explicação curta (opcional)', 'sub', '<input type="text">');
    if (L.receita === 'palavras') campo('Outras palavras-chave (separe por vírgula)', 'sub', '<input type="text">');
    if (R?.objeto) { seletor('Objeto', 'obj', [['-1', 'Automático'], ...st.objetos.map((o, i) => [String(i), o.name || ('Objeto ' + (i + 1))])]); if (L.receita === 'rotulo') seletor('Ponto no objeto', 'ancora', [['top', 'Ponta de cima'], ['center', 'Centro']]); }
    if (L.receita === 'aba') seletor('Lado', 'lado', [['esquerda', 'Esquerda'], ['direita', 'Direita']]);
    cor('Cor', 'cor', '#ffffff'); faixa('Tamanho da letra', 'tam', 10, 500, 1);
    if (!['palavras', 'aba', 'cordinha', 'pisca'].includes(L.receita)) { faixa('Largura', 'w', 40, W() * 1.2, 1); faixa('Altura', 'h', 20, H(), 1); }
    if (L.receita === 'contorno') faixa('Distância da pessoa', 'margem', 0, 200, 1, 40);
    if (L.receita === 'aba') faixa('Largura da aba', 'frac', .15, .6, .01, .36);
    if (R?.atras) marca('Atrás da pessoa', 'atrasPessoa', true);
    secao('Movimento'); faixa('Estado na foto parada (0 = início, 1 = fim)', 'qParado', 0, 1, .01, .7); faixa('Velocidade', 'vel', 0, 20, .1, 1);
    faixa('Começa em (s)', 'inicio', 0, 20, .1, 0); faixa('Duração (s, 0 = até o fim do clipe)', 'dur', 0, 20, .1, 0); faixa('Opacidade', 'opac', .05, 1, .01, 1);
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Mesmo desenho do Video Studio. Na aba Animar, exporte o clipe para ver o estilo em movimento.'; alvo.append(h);
    return;
  }
  if (isEditorialEffect(L.forma)) {
    secao('Ajustes do efeito');
    if (L.forma === 'janelaRealidade') { faixa('Largura da janela', 'w', 70, 1080, 1); faixa('Altura da janela', 'h', 70, 1920, 1); faixa('Desfoque fora da janela', 'desfoque', 0, 36, 1); faixa('Transição da borda', 'suavidade', 0, 45, 1); faixa('Cantos arredondados', 'raio', 0, 140, 1); }
    else if (L.forma === 'ampliacaoSuperficie') { marca('Ampliar o que está embaixo da lupa', 'seguir', false); faixa('Diâmetro da lente', 'w', 80, 900, 1); faixa('Ampliação', 'zoom', 1, 6, .05); faixa('Aro', 'borda', 0, 8, .25, 1.5); faixa('Sombra da lente', 'sombra', 0, .8, .01, .35);
      const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Arraste a lente para posicioná-la. Arraste o alvo azul tracejado para escolher o que ela amplia.'; alvo.append(h); }
    else if (L.forma === 'fronteiraFoco') { faixa('Desfoque', 'desfoque', 0, 36, 1); faixa('Transição de foco', 'suavidade', 0, 100, 1); seletor('Lado desfocado', 'lado', [['direita', 'Direita'], ['esquerda', 'Esquerda']]); }
    else if (L.forma === 'retratoInterno' || L.forma === 'espelhoFragmentado') {
      marca('Editar perspectiva pelos quatro cantos','_perspectivaUI',false);
      botao('Restaurar perspectiva',()=>{for(let i=0;i<4;i++){L['q'+i+'x']=0;L['q'+i+'y']=0;}registrar();desenhar();});
      faixa('Espessura da peça','espessuraOptica',0,20,.5,3);
      if(L.forma==='retratoInterno')seletor('Material do retrato','materialRetrato',[['papel','Fotografia impressa'],['espelho','Espelho']]);
      if(L.forma==='espelhoFragmentado'||L.materialRetrato==='espelho')faixa('Reflexo suave','reflexoOptico',0,1,.01,.12);
      if(L.forma==='espelhoFragmentado'){
        campo('Quantidade de fragmentos','fragmentos','<select><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>',Number);
        faixa('Espaço entre fragmentos','intervaloFragmentos',0,60,1,8);
        for(let i=0;i<Math.max(1,Math.min(5,Math.round(L.fragmentos||1)));i++){
          secao('Fragmento '+(i+1),false);
          faixa('Enquadramento horizontal','fragmento'+i+'X',-1080,1080,1,0);
          faixa('Enquadramento vertical','fragmento'+i+'Y',-H(),H(),1,0);
        }
        secao('Peça completa');
      }

      faixa('Largura', 'w', 80, 1080, 1); faixa('Altura', 'h', 80, H(), 1); faixa('Ampliação do reflexo/retrato', 'zoom', .6, 4, .05);
      faixa('Origem horizontal na foto', 'origemX', 0, L.img?.naturalWidth || W(), 1); faixa('Origem vertical na foto', 'origemY', 0, L.img?.naturalHeight || H(), 1);
      faixa('Borda', 'borda', 0, 12, .5); faixa('Sombra realista', 'sombra', 0, .6, .01);
      if (L.forma === 'espelhoFragmentado') faixa('Recorte geométrico', 'corte', 0, .45, .01); else marca('Espelhar a fotografia', 'espelhar', false);
      const fl = document.createElement('label'); fl.className = 'f'; fl.textContent = 'Imagem interna opcional'; const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*';
      fi.onchange = async () => { const file = fi.files?.[0]; if (!file) return; try { L.imgSrc = await arquivoDados(file); L.img = await imagem(L.imgSrc); L.origemX = L.img.naturalWidth / 2; L.origemY = L.img.naturalHeight / 2; registrar(); desenhar(); } catch { status('Não consegui usar a fotografia interna.', true); } };
      fl.append(fi); alvo.append(fl);
    }
    else if (L.forma === 'papelRecortado') { seletor('Papel', 'tom', [['osso', 'Osso (marca)'], ['branco', 'Branco'], ['rosado', 'Rosado'], ['kraft', 'Kraft'], ['grafite', 'Grafite'], ['foto', 'Cor tirada da foto'], ['livre', 'Cor livre']]);
      if (L.tom === 'livre') cor('Cor do papel', 'cor', '#f1eee8');
      faixa('Espessura do papel','espessuraPapel',.5,12,.5,3);
      const scanLabel=document.createElement('label');scanLabel.className='f';scanLabel.textContent='Textura fotografada (opcional)';
      const scan=document.createElement('input');scan.type='file';scan.accept='image/*';
      scan.onchange=async()=>{const file=scan.files?.[0];if(!file)return;try{const src=await arquivoDados(file),img=await imagem(src);L.img=img;L.imgSrc=src;registrar();desenhar();}catch{status('Não consegui abrir a textura. Use JPG, PNG ou WebP.',true);}};
      scanLabel.append(scan);alvo.append(scanLabel);
      if(L.img)botao('Remover textura fotografada',()=>{delete L.img;delete L.imgSrc;registrar();desenhar();});

      faixa('Largura da abertura', 'w', 90, 1400, 1); faixa('Altura da abertura', 'h', 90, H(), 1); faixa('Irregularidade do rasgo', 'irregularidade', 0, .25, .01, .08); faixa('Fibras na borda', 'fibras', 0, 1, .01, .6); faixa('Sombra para dentro', 'sombra', 0, .8, .01, .42); faixa('Textura do papel', 'textura', 0, 1, .01, .35); }
    else if (L.forma === 'aguaLente') { faixa('Largura da água', 'w', 100, 1080, 1); faixa('Altura da água', 'h', 100, H(), 1); faixa('Intensidade da refração', 'amplitude', 0, 35, 1); faixa('Ondas', 'frequencia', .1, 8, .1); faixa('Posição das ondas','faseOndas',-360,360,1,0); faixa('Transição da borda','suavidade',1,120,1,18); }
    else if (L.forma === 'peliculaOptica') { faixa('Largura', 'w', 80, 1080, 1); faixa('Altura', 'h', 80, H(), 1); faixa('Deslocamento óptico', 'deslocamento', -40, 40, 1); faixa('Espessura óptica','espessuraOptica',0,30,.5,4); faixa('Reflexo nas bordas','reflexoOptico',0,1,.01,.14); faixa('Suavidade', 'desfoque', 0, 5, .5); faixa('Borda', 'borda', 0, 2, .25); faixa('Cantos', 'raio', 0, 40, 1); }
    else if (L.forma === 'vidroTexturizado') { seletor('Material', 'tipoVidro', [['martelado','Vidro martelado'],['fosco','Vidro fosco'],['canelado','Vidro canelado']]); faixa('Direção da luz','luzAngulo',-180,180,1,-135); faixa('Escala da textura', 'tamanho', 3, 40, 1, 6); faixa('Força da refração', 'forca', 0, 30, .5, 9); faixa('Brilho do vidro', 'relevo', 0, 1, .01, .55); faixa('Fosco', 'desfoque', 0, 6, .1, 1.5);
      marca('Janela nítida (a caixa da camada)', 'janela', true); faixa('Borda da janela', 'bordaJanela', 0, 6, .25, 1.5);
      const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'A caixa da camada é a janela nítida: arraste e redimensione pelas bolinhas.'; alvo.append(h); }
    else if (L.forma === 'recorteOval') { seletor('Forma do recorte', 'formaRecorte', [['oval', 'Oval'], ['circulo', 'Círculo'], ['arco', 'Arco'], ['capsula', 'Cápsula'], ['retangulo', 'Retângulo']]);
      faixa('Largura', 'w', 60, 1080, 1); faixa('Altura', 'h', 60, H(), 1); cor('Cor da superfície', 'cor', '#ffffff'); faixa('Textura da superfície', 'textura', 0, 1, .01, 0); faixa('Sombreado da superfície', 'luzSuperficie', 0, 1, .01, 0);
      faixa('Espessura da parede', 'espessura', 0, 80, 1, 16); faixa('Lado da parede', 'ladoParede', -180, 180, 1, 180); faixa('Sombra da parede', 'sombra', 0, 1, .01, .5);
      faixa('Mover a foto (horizontal)', 'fotoX', -600, 600, 1, 0); faixa('Mover a foto (vertical)', 'fotoY', -800, 800, 1, 0); faixa('Aproximar a foto', 'fotoZoom', .5, 4, .01, 1); }
    else if (L.forma === 'gota' || L.forma === 'serum') { faixa('Largura', 'w', 20, 1600, 1); faixa('Altura', 'h', 20, 1600, 1); faixa('Forma irregular', 'irregularidade', 0, .45, .01, .03); faixa('Variação da forma', 'semente', 1, 60, 1, 3);
      faixa('Volume / espessura', 'volumeLiquido', .2, 2, .01, 1);
      faixa('Refração (lente)', 'refracao', .7, 2.2, .01, 1.3); faixa('Direção da luz', 'luzAngulo', -180, 180, 1, -135); faixa('Sombra', 'sombra', 0, .9, .01, .45); faixa('Luz atravessando (cáustica)', 'caustica', 0, 1, .01, .65);
      faixa('Borda escura', 'borda', 0, 1, .01, .6); faixa('Brilho', 'brilho', 0, 1, .01, .9); faixa('Microbolhas', 'bolhinhas', 0, 30, 1, 0); }
    else if (L.forma === 'sombraArquitetonica') { seletor('Tipo de luz', 'tipoSombra', [['persiana', 'Persiana'], ['janela', 'Janela com caixilho'], ['folhagem', 'Folhagem']]);
      faixa(L.tipoSombra === 'folhagem' ? 'Folhas' : L.tipoSombra === 'janela' ? 'Vidros' : 'Lâminas', 'faixas', 1, 16, 1, 6); faixa(L.tipoSombra === 'folhagem' ? 'Tamanho das folhas' : 'Distância entre faixas', 'intervalo', 30, 440, 1, 120);
      faixa('Largura da luz', 'w', 100, 2600, 1); faixa('Altura da luz', 'h', 100, 2600, 1); faixa('Perspectiva', 'perspectiva', -1, 1, .01, .35); faixa('Penumbra', 'suavidade', 0, 90, 1, 26);
      faixa('Sombra', 'intensidade', 0, .9, .01, .55); faixa('Luz quente', 'calor', 0, 1, .01, .45); }
    secao('Aparência'); faixa('Girar', 'rot', -180, 180, 1); faixa('Opacidade', 'opac', .05, 1, .01, 1);
    return;
  }
  // formas e imagens
  const k = LEGADO[L.forma]?.[0] || L.forma;
  if (k === 'anelTexto') {
    secao('Texto do anel'); campo('Texto (cada linha vira uma faixa do anel)', 'legenda', '<textarea></textarea>'); campo('Separador entre as repetições', 'separador', '<input type="text">');
    seletor('Fonte', 'fonteLegenda', fontes); faixa('Peso', 'pesoLegenda', 100, 900, 100, 800); faixa('Tamanho das letras', 'tamLegenda', 10, 200, 1, 54); faixa('Espaço entre letras', 'espLetra', -.1, .5, .01, .04); faixa('Espaço entre as faixas', 'entreLinhas', .8, 2.5, .01, 1.1);
    cor('Cor', 'cor', '#e6ff4f'); faixa('Brilho neon', 'brilho', 0, 1.5, .01, .5);
    secao('Órbita 3D'); faixa('Diâmetro', 'w', 80, 2400, 1); faixa('Inclinação (achatar o anel)', 'inclinacao', .02, .95, .01, .28); faixa('Girar o anel', 'rot', -90, 90, 1, -10); faixa('Posição das letras na volta', 'fase', -360, 360, 1, 0);
    faixa('Perspectiva (frente maior)', 'perspectiva', 0, .9, .01, .35); faixa('Opacidade da parte de trás', 'opacTras', 0, 1, .01, .55); marca('Parte de trás passa atrás da pessoa', 'atrasPessoa', true); marca('Faixas defasadas', 'defasar', true);
    secao('Animação'); faixa('Giro no vídeo (graus por segundo)', 'giro', -180, 180, 1, 36);
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Arraste para posicionar o anel. Os cantos mudam o tamanho; as bolinhas de cima e de baixo achatam ou abrem a órbita. No vídeo exportado (aba Animar) o anel gira sozinho.'; alvo.append(h);
    secao('Opacidade', false); faixa('Opacidade', 'opac', .05, 1, .01, 1);
    return;
  }
  if (k === 'fantasma') {
    secao('Fantasma em movimento'); faixa('Transparência do fantasma', 'opacFantasma', .05, 1, .01, .55); faixa('Desfoque de movimento', 'comprimento', 0, 300, 1, 60); faixa('Direção do movimento', 'angulo', -90, 90, 1, 0);
    faixa('Rastro do outro lado', 'rastro', 0, 1, .01, .35); faixa('Tamanho do fantasma', 'escalaFantasma', .3, 3, .01, 1); marca('Rosto principal nítido por cima', 'nitido', true);
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'Arraste para posicionar o fantasma. Os cantos mudam o tamanho dele.'; alvo.append(h);
    return;
  }
  if (k === 'mapaFacial') {
    secao('Mapeamento facial'); faixa('Densidade da malha', 'densidade', 6, 36, 1, 16); faixa('Espessura das linhas', 'esp', .5, 4, .1, 1.3); faixa('Intensidade da malha', 'intensidade', .05, 1, .01, .5); faixa('Brilho', 'brilho', 0, 1.5, .01, .6);
    cor('Cor das linhas', 'corLinha', '#ffffff'); cor('Cor do brilho', 'corBrilho', '#6ee7f0');
    secao('Varredura e pontos'); marca('Faixa de varredura', 'mostrarVarredura', true); faixa('Altura da varredura', 'varredura', 0, 1, .01, .42); marca('Pontos de análise', 'mostrarPontos', true); marca('Linhas tracejadas dos pontos', 'linhas', true); faixa('Tamanho dos pontos', 'escalaPontos', .3, 3, .01, 1);
    botao('Ler o rosto de novo', async () => { st.rosto = null; if (await obterRosto()) desenhar(); });
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = 'A malha fica presa ao rosto e acompanha o enquadramento. Para animar a varredura, grave pontos na aba Animar com alturas diferentes.'; alvo.append(h);
    return;
  }
  if (k === 'discoFosco') {
    secao('Discos'); cor('Cor do disco sólido', 'cor', '#0c0c0d'); faixa('Tamanho', 'w', 60, 1400, 1); faixa('Distância entre os discos', 'deslocamento', 0, 1, .01, .3); seletor('Vidro do lado', 'ladoVidro', [['esquerda', 'Esquerdo'], ['direita', 'Direito']]);
    secao('Vidro fosco'); faixa('Desfoque', 'desfoque', 0, 3, .01, 1); faixa('Grão', 'grao', 0, 1, .01, .45); faixa('Aro de luz', 'aro', 0, 1.5, .01, .6); faixa('Opacidade', 'opac', .05, 1, .01, 1);
    secao('Texto no vidro'); campo('Texto (Enter quebra a linha)', 'legenda', '<textarea></textarea>'); seletor('Fonte', 'fonteLegenda', fontes); faixa('Peso', 'pesoLegenda', 100, 900, 100, 400); faixa('Tamanho do texto', 'escalaTexto', .3, 3, .01, 1); cor('Cor do texto', 'corTexto', '#ffffff');
  }
  else if (k === 'cartaoVidro') {
    secao('Cartão de vidro'); campo('Texto grande', 'legenda', '<input type="text">'); campo('Texto pequeno', 'sublegenda', '<input type="text">'); seletor('Fonte', 'fonteLegenda', fontes);
    faixa('Peso do texto grande', 'pesoLegenda', 100, 900, 100, 300); faixa('Tamanho dos textos', 'escalaTexto', .4, 2, .01, 1); cor('Cor do texto', 'corTexto', '#ffffff');
    secao('Vidro'); faixa('Arredondamento', 'raioVidro', 0, .5, .01, .1); faixa('Sombra', 'sombraVidro', 0, 2, .01, 1); faixa('Opacidade', 'opac', .05, 1, .01, 1);
  }
  else if (k === 'pilula' || k === 'pilulaFoto') {
    secao(k === 'pilula' ? 'Pílula' : 'Pílula com foto');
    if (k === 'pilula') { marca('Vidro fosco 3D (em vez de só a linha)', 'vidro3d', false); if (L.vidro3d) { faixa('Arredondamento', 'raioVidro', 0, .5, .01, .3); faixa('Sombra do vidro', 'sombraVidro', 0, 2, .01, 1); } }
    if (k === 'pilula') { campo('Texto', 'legenda', '<input type="text">'); seletor('Fonte', 'fonteLegenda', fontes); faixa('Peso', 'pesoLegenda', 100, 900, 100, 400); faixa('Tamanho do texto', 'escalaTexto', .4, 2, .01, 1); cor('Cor do texto', 'corTexto', '#ffffff'); marca('Largura acompanha o texto', 'autoLargura', true); }
    else {
      const fl = document.createElement('label'); fl.className = 'f'; fl.textContent = 'Foto da pílula'; const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*';
      fi.onchange = async () => { const file = fi.files?.[0]; if (!file) return; try { L.imgSrc = await arquivoDados(file); L.img = await imagem(L.imgSrc); L.fosco = false; registrar(); desenhar(); } catch { status('Não consegui usar essa foto.', true); } };
      fl.append(fi); alvo.append(fl);
      if (L.img) { faixa('Enquadrar na horizontal', 'fotoX', 0, 1, .01, .5); faixa('Enquadrar na vertical', 'fotoY', 0, 1, .01, .5); faixa('Aproximar a foto', 'fotoZoom', 1, 4, .01, 1); }
    }
    secao('Contorno e fundo'); marca('Contorno', 'contorno', k === 'pilula'); cor('Cor do contorno', 'corContorno', '#ffffff'); faixa('Espessura', 'esp', .5, 8, .5, 2);
    marca('Vidro fosco (a foto desfocada por trás)', 'fosco', k === 'pilulaFoto'); marca('Preencher com cor', 'preencher', false); cor('Cor do preenchimento', 'cor', '#ffffff');
    faixa('Sombra', 'sombra', 0, .9, .01, 0); faixa('Opacidade', 'opac', .05, 1, .01, 1);
  }
  else if (k === 'imagem') { secao('Imagem'); marca('Espelhar', 'espelhar', false); faixa('Sombra', 'sombra', 0, .9, .01, 0); faixa('Opacidade', 'opac', .05, 1, .01, 1); }
  else if (k === 'degrade') { secao('Degradê'); cor('Cor', 'cor', '#000000'); seletor('Direção', 'direcao', [['vertical', 'Vertical'], ['horizontal', 'Horizontal'], ['radial', 'Radial (vinheta)']]); marca('Inverter', 'inverter', false); faixa('Opacidade', 'opac', .05, 1, .01, 1); }
  else {
    const linear = k === 'linha' || k === 'seta' || k === 'colchete';
    secao(linear ? 'Traço' : 'Preenchimento e contorno');
    if (!linear) { marca('Preencher', 'preencher', ['ponto', 'disco', 'caixa'].includes(k)); cor('Cor do preenchimento', 'cor', GRAFITE); marca('Contorno', 'contorno', !['ponto', 'disco', 'caixa'].includes(k)); }
    cor(linear ? 'Cor' : 'Cor do contorno', linear ? 'corContorno' : 'corContorno', L.cor || GRAFITE);
    faixa('Espessura', 'esp', .5, 30, .5, 2);
    seletor('Estilo do traço', 'traco', [['solida', 'Contínuo'], ['tracejada', 'Tracejado'], ['pontilhada', 'Pontilhado']]);
    if (k === 'seta') seletor('Pontas', 'pontas', [['aberta', 'Aberta'], ['cheia', 'Cheia'], ['dupla', 'Dupla aberta']]);
    if (['retangulo', 'caixa', 'moldura'].includes(k)) faixa('Cantos arredondados', 'raio', 0, 400, 1, 0);
    if (k === 'caixa') { secao('Texto da caixa'); campo('Texto', 'legenda', '<input type="text">'); seletor('Fonte', 'fonteLegenda', fontes); faixa('Tamanho', 'tamLegenda', 10, 200, 1, Math.round(L.h * .24)); faixa('Peso', 'pesoLegenda', 100, 900, 100, 600); faixa('Espaço entre letras', 'espLegenda', 0, .8, .01, .08); cor('Cor do texto', 'corTexto', claro(L.cor) ? GRAFITE : OSSO); }
    secao('Sombra e opacidade', false); faixa('Sombra', 'sombra', 0, .9, .01, 0); faixa('Opacidade', 'opac', .05, 1, .01, 1);
  }
  secao('Posição e tamanho', false); faixa('Largura', 'w', 2, 2400, 1); faixa('Altura', 'h', 1, 2400, 1); faixa('Girar', 'rot', -180, 180, 1);
  faixa('Horizontal', 'x', -200, 1280, 1); faixa('Vertical', 'y', -200, H() + 200, 1);
}

// ---------- molde → camadas livres; objeto detectado → camada ----------
function separarMolde(M) {
  const P = M._partes; if (!P) return;
  const e = M.escala || 1, ox = MARGEM, oy = P.capTop, tx = v => (M.mx || 0) + ox + (v - ox) * e, ty = v => oy + (v - oy) * e, corT = M.cor || (M.tinta === 'clara' ? OSSO : GRAFITE);
  const novas = [], pi = M.recorte ? garantirPessoa() : -1;
  const pal = texto({ nome: 'Palavra', texto: P.pal, fonte: M.fontePalavra || 'Montserrat', peso: M.pesoPalavra || 800, pesoDestaque: M.pesoPalavra || 800, tam: P.tam * e, esp: -.04, caixa: true, cor: corT, alinhar: 'left', atras: pi >= 0 ? [pi] : [] });
  const wPal = medirLinha(segmentos(P.pal), pal).w; pal.x = tx(P.xs[0]) + wPal / 2; pal.y = ty(P.capTop + P.capH) - pal.tam * .375; novas.push(pal);
  if (M.mostrarFrase !== false) {
    const lh = (U + P.capF) / P.sz, fr = texto({ nome: 'Frase', texto: frase().toUpperCase().replace(/\|/g, '\n'), fonte: M.fonteFrase || 'Montserrat', peso: M.pesoFrase || 500, pesoDestaque: M.pesoDestaqueFrase || 800, tam: P.sz * e, esp: .16, entre: lh, cor: corT, alinhar: 'left' });
    const n = fr.texto.split('\n').length, bw = Math.max(...fr.texto.split('\n').map(l => medirLinha(segmentos(l), fr).w)), bh = fr.tam * lh * (n - 1) + fr.tam * .75;
    fr.x = tx(MARGEM) + bw / 2; fr.y = ty(P.bases[0]) + bh / 2 - fr.tam * .75; novas.push(fr);
  }
  if (M.linha !== false) novas.push(forma({ forma: 'linha', nome: 'Linha', x: tx(P.fim / 2), y: ty(P.linhaY), w: P.fim * e, h: 4, esp: 2, cor: corT, corContorno: corT }));
  const i = st.camadas.indexOf(M); st.camadas.splice(i, 1, ...novas); st.sel = i; st.estilo = null;
  registrar(); desenhar(); status('Molde separado: palavra, frase e linha agora são camadas independentes.');
}
function soltarObjeto(o) {
  const m = mascara(o.img), c = document.createElement('canvas'); c.width = W(); c.height = H(); const g = c.getContext('2d');
  cobrir(g, st.img); g.globalCompositeOperation = 'destination-in'; g.drawImage(m.canvas, 0, 0);
  let x0 = W(), y0 = H(), x1 = 0, y1 = 0; const a = m.alfa;
  for (let y = 0; y < H(); y += 2) for (let x = 0; x < W(); x += 2) if (a[(y * W() + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return status('Esse objeto não tem área suficiente para virar camada.', true);
  const w = x1 - x0 + 2, h = y1 - y0 + 2, out = document.createElement('canvas'); out.width = w; out.height = h; out.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
  st.camadas.push(forma({ forma: 'imagem', nome: 'Recorte · ' + o.name, img: out, x: x0 + w / 2, y: y0 + h / 2, w, h, contorno: false }));
  st.sel = st.camadas.length - 1; registrar(); desenhar(); status(`"${o.name}" virou camada. Arraste, gire ou aumente pelas bolinhas.`);
}

// ---------- gestos: mover, bolinhas, guias ----------
function local(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W() / r.width, y: (e.clientY - r.top) * H() / r.height }; }
function paraLocal(b, p) { const a = -(b.rot || 0) * Math.PI / 180, dx = p.x - b.x, dy = p.y - b.y; return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }; }
function dentro(b, p, pad = 0) { const q = paraLocal(b, p); return Math.abs(q.x) <= b.w / 2 + pad && Math.abs(q.y) <= b.h / 2 + pad; }
const girarVetor = (x, y, graus) => { const a = graus * Math.PI / 180; return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) }; };
let gesto = null;
function camadaEm(p) { return st.camadas.map((L, i) => i).reverse().find(i => !st.camadas[i].oculto && st.camadas[i]._box && dentro(st.camadas[i]._box, p)); }
cv.onpointerdown = e => {
  if (e.button !== 0) return;
  $('inlineEdit').blur();
  const p = local(e), S = st.camadas[st.sel], k = px();
  if (S?._box && !S.oculto) {
    const q = paraLocal(S._box, p), a = alcas(S).find(a => Math.hypot(q.x - a.x, q.y - a.y) < 13 * k * ALCA());
    if (a) gesto = { tipo: a.id, L: S, p0: p, q0: q, b0: { ...S._box }, v: { ...S } };
    const alvo = !a && alvoAmpliacao(S);
    if (alvo && Math.abs(p.x - alvo.x) <= alvo.w / 2 + 10 * k && Math.abs(p.y - alvo.y) <= alvo.h / 2 + 10 * k && !dentro(S._box, p))
      gesto = { tipo: 'origem', L: S, p0: p, v: { ...S, origemX: alvo.x, origemY: alvo.y }, b0: { ...S._box } };
  }
  if (!gesto) {
    const i = camadaEm(p);
    if (i === undefined) {   // ponto sem camada: desseleciona e arrasta a foto (enquadramento com o dedo)
      st.sel = -1; if (!st.img) { desenhar(); return; }
      st.rapido = true; gesto = { tipo: 'foto', p0: p, E: enquadramento() }; gesto.movido = false; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; desenhar(); return;
    }
    st.sel = i; const L = st.camadas[i]; gesto = { tipo: 'mover', L, p0: p, v: { ...L }, b0: { ...L._box } };
  }
  gesto.movido = false; cv.setPointerCapture(e.pointerId); desenhar();
};
function guiar(L, dx, dy, b0, livre) {   // encaixa o centro e as bordas da caixa no centro e nas margens do post
  const k = px(), lim = 8 * k, cx = b0.x + dx, cy = b0.y + dy, v = [], h = [];
  if (livre) return { dx, dy, v, h };
  const alvosX = [W() / 2, MARGEM, W() - MARGEM], alvosY = [H() / 2, MARGEM, H() - MARGEM];
  let mx = null, my = null;
  for (const t of alvosX) for (const [o, s] of [[0, cx], [-b0.w / 2, cx - b0.w / 2], [b0.w / 2, cx + b0.w / 2]]) if (Math.abs(s - t) < lim && (mx === null || Math.abs(s - t) < Math.abs(mx.d))) mx = { d: t - s, t };
  for (const t of alvosY) for (const [o, s] of [[0, cy], [-b0.h / 2, cy - b0.h / 2], [b0.h / 2, cy + b0.h / 2]]) if (Math.abs(s - t) < lim && (my === null || Math.abs(s - t) < Math.abs(my.d))) my = { d: t - s, t };
  if (mx) { dx += mx.d; v.push(mx.t); }
  if (my) { dy += my.d; h.push(my.t); }
  return { dx, dy, v, h };
}
cv.onpointermove = e => {
  if (!gesto) { const S = st.camadas[st.sel], p = local(e);   // cursor conforme a bolinha
    let cur = 'default'; if (S?._box) { const q = paraLocal(S._box, p), a = alcas(S).find(a => Math.hypot(q.x - a.x, q.y - a.y) < 13 * px() * ALCA());
      if (a) cur = a.id === 'rot' ? 'grab' : a.id === 'curva' ? 'ns-resize' : a.id === 'incl' ? 'ew-resize' : ['n', 's'].includes(a.id) ? 'ns-resize' : ['e', 'w'].includes(a.id) ? 'ew-resize' : ['nw', 'se'].includes(a.id) ? 'nwse-resize' : 'nesw-resize';
      else if (camadaEm(p) !== undefined) cur = 'move'; else if (st.img) cur = 'grab'; } else if (camadaEm(p) !== undefined) cur = 'move'; else if (st.img) cur = 'grab';
    cv.style.cursor = cur; return; }
  const p = local(e), L = gesto.L, v = gesto.v, b0 = gesto.b0;
  if (!gesto.movido && Math.hypot(p.x - gesto.p0.x, p.y - gesto.p0.y) < 3 * px()) return;
  gesto.movido = true;
  const t = gesto.tipo;
  if (t === 'foto') {
    // posição desejada da foto (pode sair da tela); ímã encaixa centro e bordas da foto no centro e nas bordas do post
    const E = gesto.E, lim = 12 * px(), v = [], h = [];
    let x = E.x + p.x - gesto.p0.x, y = E.y + p.y - gesto.p0.y;
    if (!e.altKey) {
      const ima = (pos, tam, total, guias) => { let m = null;
        for (const [d, g] of [[total / 2 - (pos + tam / 2), total / 2], [-pos, 0], [total - pos - tam, total]]) if (Math.abs(d) < lim && (!m || Math.abs(d) < Math.abs(m[0]))) m = [d, g];
        if (m) { guias.push(m[1]); return pos + m[0]; } return pos; };
      x = ima(x, E.dw, W(), v); y = ima(y, E.dh, H(), h);
    }
    posicionarFoto(x, y, E);
    st.guias = (v.length || h.length) ? { v, h } : null;
    redesenhar(); return;
  }
  if (t.startsWith('quad')) {
    const i=Number(t.slice(4)),q=paraLocal(b0,p),candidate={...L};
    candidate['q'+i+'x']=Math.max(-.45,Math.min(.45,(v['q'+i+'x']||0)+(q.x-gesto.q0.x)/v.w));
    candidate['q'+i+'y']=Math.max(-.45,Math.min(.45,(v['q'+i+'y']||0)+(q.y-gesto.q0.y)/v.h));
    if(validQuad(quadPoints(candidate))){L['q'+i+'x']=candidate['q'+i+'x'];L['q'+i+'y']=candidate['q'+i+'y'];}
    redesenhar();return;
  }
  if (t === 'origem') { L.origemX = v.origemX + p.x - gesto.p0.x; L.origemY = v.origemY + p.y - gesto.p0.y; redesenhar(); return; }
  if (t === 'mover') {
    let dx = p.x - gesto.p0.x, dy = p.y - gesto.p0.y;
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    const g = guiar(L, dx, dy, b0, e.altKey); st.guias = (g.v.length || g.h.length) ? g : null; dx = g.dx; dy = g.dy;
    if (L.forma === 'mapaFacial') {} else if (L.tipo === 'molde') { L.mx = Math.round((v.mx || 0) + dx); L.dy = Math.round((v.dy || 0) + dy); } else { L.x = v.x + dx; L.y = v.y + dy; }
  } else if (t === 'rot') {
    let a = Math.atan2(p.y - b0.y, p.x - b0.x) * 180 / Math.PI + 90;
    a = ((a + 540) % 360) - 180;
    if (e.shiftKey) a = Math.round(a / 15) * 15; else for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(a - s) <= 4) a = s;
    st.guias = a % 90 === 0 ? (Math.abs(a) % 180 === 0 ? { v: [], h: [b0.y] } : { v: [b0.x], h: [] }) : null;   // linha guia quando encaixa
    L.rot = Math.round(((a + 540) % 360) - 180);
  } else if (t === 'curva') {   // para cima: arco ∩; para baixo: ∪; 1/4 da altura do post = semicírculo (igual à Montagem)
    L.arco = Math.max(-100, Math.min(100, Math.round((v.arco || 0) - (p.y - gesto.p0.y) / H() * 400)));
  } else if (t === 'incl') {
    const q = paraLocal(b0, p); L.incl = Math.max(-45, Math.min(45, Math.round((v.incl || 0) + (q.x - gesto.q0.x) / W() * 90)));   // mesma escala da Montagem
  } else if (t.length === 2 && L.tipo === 'texto' && !e.altKey) {   // canto do texto: reorganiza as palavras pela caixa (como na Montagem)
    const q = paraLocal(b0, p), sx = t[1] === 'e' ? 1 : -1, sy = t[0] === 's' ? 1 : -1;
    reorganizarTexto(L, v, Math.max(40, b0.w - 24 + 2 * sx * (q.x - gesto.q0.x)), Math.max(20, b0.h - 24 + 2 * sy * (q.y - gesto.q0.y)));
  } else if (t.length === 2) {   // canto: tamanho proporcional; com Alt, a partir do centro
    const q = paraLocal(b0, p), sx = t[1] === 'e' ? 1 : -1, sy = t[0] === 's' ? 1 : -1;
    const fixo = e.altKey ? { x: 0, y: 0 } : { x: -sx * b0.w / 2, y: -sy * b0.h / 2 };
    const d0 = Math.hypot(gesto.q0.x - fixo.x, gesto.q0.y - fixo.y), d1 = Math.hypot(q.x - fixo.x, q.y - fixo.y), f = Math.max(.05, d1 / Math.max(d0, 1));
    escalar(L, v, f, f);
    if (!e.altKey && L.tipo !== 'molde') { const c = girarVetor(fixo.x * (1 - f), fixo.y * (1 - f), b0.rot || 0); mover(L, v, c.x, c.y); }
  } else if (L.tipo === 'texto' && e.altKey) {   // ⌥ na lateral do texto: reorganiza só nesse eixo (largura muda as palavras por linha)
    const q = paraLocal(b0, p), hor = t === 'e' || t === 'w', s = t === 'e' || t === 's' ? 1 : -1;
    reorganizarTexto(L, v, Math.max(40, b0.w - 24 + (hor ? 2 * s * (q.x - gesto.q0.x) : 0)), Math.max(20, b0.h - 24 + (hor ? 0 : 2 * s * (q.y - gesto.q0.y))));
  } else {   // lateral: estica num eixo, o lado oposto fica parado; com Alt, a partir do centro
    const q = paraLocal(b0, p), hor = t === 'e' || t === 'w', s = t === 'e' || t === 's' ? 1 : -1;
    const d = (hor ? q.x - gesto.q0.x : q.y - gesto.q0.y) * s * (e.altKey ? 2 : 1), base = hor ? b0.w : b0.h, f = Math.max(.03, (base + d) / Math.max(base, 1));
    escalar(L, v, hor ? f : 1, hor ? 1 : f, true);
    if (!e.altKey) { const off = s * (base * f - base) / 2, c = girarVetor(hor ? off : 0, hor ? 0 : off, b0.rot || 0); mover(L, v, c.x, c.y); }
  }
  redesenhar();
};
function mover(L, v, dx, dy) { if (L.forma === 'mapaFacial') return; if (L.tipo === 'molde') { L.mx = (v.mx || 0) + dx; L.dy = (v.dy || 0) + dy; } else { L.x = v.x + dx; L.y = v.y + dy; } }
function escalar(L, v, fx, fy, esticar = false) {
  if (L.forma === 'discoFosco') { L.w = L.h = Math.max(40, Math.round(v.w * Math.max(fx, fy))); return; }
  if (L.forma === 'anelTexto') {
    if (esticar && fx === 1) L.inclinacao = Math.max(.02, Math.min(.95, (v.inclinacao ?? .28) * fy));
    else { L.w = Math.max(80, Math.round(v.w * Math.max(fx, fy))); if (!esticar) L.tamLegenda = Math.max(8, Math.round((v.tamLegenda || 54) * Math.max(fx, fy))); }
    return;
  }
  if (L.forma === 'fantasma') { L.escalaFantasma = Math.max(.3, Math.min(3, (v.escalaFantasma || 1) * Math.max(fx, fy))); return; }
  if (L.tipo === 'molde') { L.escala = Math.max(.2, Math.min(3, (v.escala || 1) * fx)); return; }
  if (L.tipo === 'texto') {
    if (esticar) { L.sx = Math.max(.1, (v.sx || 1) * fx); L.sy = Math.max(.1, (v.sy || 1) * fy); }
    else L.tam = Math.max(6, Math.round(v.tam * fx * 10) / 10);
    return;
  }
  if (L.forma === 'ampliacaoSuperficie') { L.w = L.h = Math.max(40, Math.round(v.w * Math.max(fx, fy))); return; }
  if (L.forma === 'pilula' && esticar && fx !== 1) L.autoLargura = false;
  L.w = Math.max(2, Math.round(v.w * fx)); L.h = Math.max(1, Math.round(v.h * fy));
  if (L.forma === 'caixa' && !esticar && v.tamLegenda) L.tamLegenda = Math.round(v.tamLegenda * fx);
}
let gestoAlt = false;
cv.onpointerup = e => { gestoAlt = !!e?.altKey; if (!gesto) return; const mudou = gesto.movido, foto = gesto.tipo === 'foto'; gesto = null; st.rapido = false; st.guias = null; if (foto) { cv.style.cursor = 'grab'; if (mudou && !gestoAlt) encaixarFoto(); desenhar(); if (mudou) { clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 300); } return; } if (mudou) registrar(); desenhar(); };
// clicar fora da arte (parte escura) desseleciona
$('pstage').addEventListener('pointerdown', e => { if (e.target === cv || e.target.closest('.drop') || e.target.closest('#inlineEdit') || e.target.closest('.pstatus')) return; if (st.sel !== -1) { st.sel = -1; desenhar(); } });
$('pstage').addEventListener('dblclick', e => { if (e.target !== cv) return; });

// ---------- edição do texto direto na arte ----------
// Caio 24/11 21:13: no celular o toque duplo abre só o menu; o editor abre pelo "Editar texto" do menu.
let toqueRecente = 0;
cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') toqueRecente = Date.now(); }, true);
cv.ondblclick = e => {
  if (Date.now() - toqueRecente < 700) return;
  const i = camadaEm(local(e)); if (i === undefined) return;
  st.sel = i; abrirEdicao(st.camadas[i]);
};
function abrirEdicao(L) {
  if (L.tipo === 'molde') { abrirAba('texto'); $('palavra').focus(); $('palavra').select(); desenhar(); return; }
  if (L.tipo === 'texto' || L.forma === 'receita') editarNaArte(L);
  else if (L.forma === 'caixa') { desenhar(); $('props').querySelector('input[type=text]')?.focus(); }
}
// Caio 24/11 21:07: na edição a camada some da arte (sem texto duplicado atrás), as bolinhas somem, e a caixa usa a
// fonte, o peso e o alinhamento do próprio texto, com o tamanho ajustado à largura da caixa.
function editarNaArte(L) {
  const ta = $('inlineEdit'), r = cv.getBoundingClientRect(), s = r.width / W(), b = L._box || { x: W() / 2, y: H() / 2, w: W() * .6, h: 120 };
  const receita = L.forma === 'receita', fam = receita ? 'Neue, GenSans, sans-serif' : familia(L.fonte), peso = receita ? 700 : (L.peso || 600);
  const larg = Math.min(r.width - 8, Math.max(140, b.w * s + 24)), esq = Math.max(4, Math.min(r.width - larg - 4, b.x * s - larg / 2));
  L._editando = true; st.editando = true;
  Object.assign(ta.style, { display: 'block', left: esq + 'px', width: larg + 'px', fontFamily: fam, fontWeight: String(peso),
    textTransform: receita || L.caixa ? 'uppercase' : 'none', textAlign: receita ? 'center' : (L.alinhar || 'center'), letterSpacing: receita ? '0' : ((L.esp || 0) + 'em') });
  const medir = document.createElement('canvas').getContext('2d');
  const ajustar = () => {
    const alvo = Math.max(16, Math.min(64, (L.tam || 60) * (L.sx || 1) * s)), linhas = String(ta.value || ' ').split('\n');
    medir.font = `${peso} ${alvo}px ${fam}`;
    const maior = Math.max(...linhas.map(l => medir.measureText((receita || L.caixa ? l.toUpperCase() : l) || ' ').width * (1 + Math.max(0, L.esp || 0) * .6)));
    const tam = Math.max(16, Math.min(alvo, alvo * (larg - 20) / Math.max(1, maior)));
    ta.style.fontSize = tam + 'px'; ta.style.lineHeight = (receita ? 1.15 : (L.entre || 1.1)) + '';
    ta.style.height = 'auto'; ta.style.height = Math.min(r.height - 8, ta.scrollHeight + 2) + 'px';
    ta.style.top = Math.max(4, Math.min(r.height - ta.offsetHeight - 4, b.y * s - ta.offsetHeight / 2)) + 'px';
  };
  ta.value = L.texto; ajustar(); redesenhar(); ta.focus(); ta.select();
  ta.oninput = () => { L.texto = ta.value; ajustar(); };
  ta.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Escape' || (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey))) { ev.preventDefault(); ta.blur(); } };
  ta.onblur = () => { ta.style.display = 'none'; ta.onblur = null; delete L._editando; st.editando = false; registrar(); desenhar(); };
}

// ---------- recorte e objetos (no Mac) ----------
async function reduzida(img, lado) {
  const s = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', .92));
}
const imagem = async src => { const m = new Image(); m.src = src; await m.decode(); return m; };
const arquivoDados = file => new Promise((resolve, reject) => { const rd = new FileReader(); rd.onload = () => resolve(rd.result); rd.onerror = () => reject(rd.error); rd.readAsDataURL(file); });
// Caio 24/11 22:08 (projeto demorava a abrir): imagem que já veio de um texto data: é devolvida como está, e a
// conversão para PNG fica guardada na própria imagem, em vez de recodificar foto e máscaras a cada salvamento.
function pngDados(img) { if (!(img instanceof HTMLImageElement)) return pngDadosNovo(img); if (img._dados) return img._dados; if (img.src.startsWith('data:')) return (img._dados = img.src); return (img._dados = pngDadosNovo(img)); }
function pngDadosNovo(img) { const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height; c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/png'); }
// No celular, o arquivo vai pela folha de compartilhar do iPhone (Salvar imagem / Salvar vídeo vão direto para o Fotos).
// O Safari só abre essa folha a partir de um toque; se a exportação demorou, aparece o botão "Salvar no celular".
function baixar(blob, nome) {
  if (window.PHOTO_STUDIO_AUTONOMO && navigator.canShare) {
    const f = new File([blob], nome, { type: blob.type }), compartilhar = () => navigator.share({ files: [f] }).catch(() => {});
    if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f] }).catch(() => setTimeout(() => status('Arquivo pronto.', false, ['Salvar no celular', compartilhar]), 50)); return; }
  }
  baixarArquivo(blob, nome);
}
function baixarArquivo(blob, nome) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
async function arquivoProjeto() {
  if (!st.img) throw Error('Escolha a fotografia antes de salvar.');
  const camadas = st.camadas.map(l => { const obj = { ...l }; for (const k of Object.keys(obj)) if (k.startsWith('_')) delete obj[k]; delete obj.imgUrl; if (l.img) obj.imgSrc = l.imgSrc || pngDados(l.img); delete obj.img; return obj; });
  return { schema: 'caio-videostudio-post', version: 1, formato: st.formato, estilo: st.estilo,
    fundo: st.fundo, imagemFundo: st.imgFundoSrc || null,
    imagem: st.imgSrc || pngDados(st.img), pessoa: st.pessoa ? pngDados(st.pessoa) : null,
    objetos: st.objetos.map(o => ({ name: o.name, kind: o.kind, mask: pngDados(o.img) })), rosto: st.rosto || null,
    camadas, sel: st.sel, frase: $('frase').value, palavra: $('palavra').value,
    assinatura: $('assinatura').value, fx: $('fx').value, fy: $('fy').value, fz: $('fz').value, ox: $('ox').value, oy: $('oy').value, motion: { duration: st.motion.duration } };
}
$('salvarProjeto').onclick = () => salvarNaBiblioteca({ avisar: true });
const botaoArquivo = document.createElement('button'); botaoArquivo.id = 'salvarArquivo'; botaoArquivo.hidden = true; document.body.append(botaoArquivo);
$('salvarArquivo').onclick = async () => {
  try { const data = await arquivoProjeto(); baixar(new Blob([JSON.stringify(data)], { type: 'application/json' }), 'post_' + String(data.palavra).replace(/[^\wÀ-ú]+/g, '').slice(0, 40) + '_editavel.json'); status('Projeto editável salvo.'); }
  catch (err) { status(err.message || 'Não consegui salvar o projeto.', true); }
};
// Caio 24/11 22:14 (abrir continuava lento): a foto era guardada na resolução original do iPhone (12 MP, vários MB em
// texto), e cada abertura relia, decodificava e copiava tudo isso. A arte tem no máximo 1080 de largura; guardar a foto
// com até 2560 px no lado maior (JPEG 92%) mantém folga para zoom 2x e deixa abrir, salvar e redesenhar bem mais leves.
const LADO_MAX = 2560;
async function reduzirFoto(img, src) {
  const w = img.naturalWidth, h = img.naturalHeight, k = LADO_MAX / Math.max(w, h);
  if (!(k < 1)) return { img, src, reduzida: false };
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
  const novo = c.toDataURL('image/jpeg', .92); return { img: await imagem(novo), src: novo, reduzida: true };
}
async function carregarProjeto(data) {
  if (data.schema !== 'caio-videostudio-post' || data.version !== 1 || !data.imagem || !Array.isArray(data.camadas)) throw Error('Esse não é um projeto do editor de Posts.');
  const foto = await reduzirFoto(await imagem(data.imagem), data.imagem); data.imagem = foto.src; st._fotoReduzida = foto.reduzida;
  const img = foto.img, pessoa = data.pessoa ? await imagem(data.pessoa) : null;
  const objetos = await Promise.all((data.objetos || []).map(async o => ({ name: o.name, kind: o.kind, img: await imagem(o.mask) })));
  const camadas = await Promise.all(data.camadas.map(async o => { const l = { ...o }; if (l.imgSrc) l.img = await imagem(l.imgSrc); return l; }));
  stopMotion();
  st.img = img; st.imgSrc = data.imagem; st.pessoa = pessoa; st.objetos = objetos; st.camadas = camadas; st.rosto = data.rosto || null;
  st.estilo = data.estilo || null; st.formato = data.formato === 'story' ? 'story' : 'feed';
  st.fundo = { ...FUNDO_PADRAO, ...(data.fundo || {}) }; st.imgFundoSrc = data.imagemFundo || null; st.imgFundo = data.imagemFundo ? await imagem(data.imagemFundo) : null; painelFundo();
  st.sel = Math.max(-1, Math.min(Number(data.sel) || 0, camadas.length - 1));
  st.motion = { duration: Math.max(2, Math.min(20, Number(data.motion?.duration) || 6)), time: 0, preview: false };
  $('motionDuration').value = st.motion.duration; $('motionTime').max = st.motion.duration; $('motionTime').value = '0'; $('motionClock').textContent = '0.00 s';
  $('frase').value = data.frase || ''; $('palavra').value = data.palavra || ''; $('assinatura').value = '';
  if (String(data.assinatura ?? 'CAIO ENDLICH').trim()) { const A = textoAssinatura('nome'); A.texto = String(data.assinatura ?? 'CAIO ENDLICH').trim().toUpperCase(); st.camadas.push(A); }
  $('fx').value = data.fx ?? .5; $('fy').value = data.fy ?? .5; $('fz').value = data.fz ?? 1; $('ox').value = data.ox ?? 0; $('oy').value = data.oy ?? 0;
  $('formato').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === st.formato));
  hist.pilha = []; hist.pos = -1; desenhar(); registrar(); setTimeout(miniaturas, 60);   // a arte aparece antes das miniaturas
}
$('abrirProjeto').onchange = async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    await carregarProjeto(JSON.parse(await file.text()));
    st.projeto = { id: null, nome: file.name.replace(/\.json$/i, '').replace(/_editavel.*$/, '') || 'Projeto importado' }; ultimaAssinatura = null;
    fecharProjetos(); status('Arquivo aberto. Ele entra na lista de projetos ao salvar.'); agendarSalvar(300);
  } catch (err) { status('Não consegui abrir o projeto: ' + err.message, true); }
  finally { event.target.value = ''; }
};

// ---------- biblioteca de projetos (Caio 24/11/2026 03:32): tudo fica salvo no Mac e volta para reeditar ----------
st.projeto = null;   // { id, nome }
let ultimaAssinatura = null, salvando = false, timerSalvar = 0, falhasSalvar = 0;
const assinaturaProjeto = () => [JSON.stringify(st.fundo), idDe(st.imgFundo), chave(st.camadas), $('frase').value, $('palavra').value, chaveEnq(),
  st.formato, st.estilo, st.motion.duration, idDe(st.img), idDe(st.pessoa), idDe(st.rosto), st.objetos.length].join('|');
function nomePadrao() {
  const p = ($('palavra').value || $('frase').value || '').replace(/[*|]/g, ' ').trim(), d = new Date();
  return (p ? p.slice(0, 40) + ' · ' : 'Post · ') + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function capaProjeto() {
  const c = document.createElement('canvas'); c.width = W(); c.height = H(); render(c.getContext('2d'), { selecao: false, tempo: null });
  const m = document.createElement('canvas'); m.width = 360; m.height = Math.round(360 * H() / W()); m.getContext('2d').drawImage(c, 0, 0, m.width, m.height);
  return m.toDataURL('image/jpeg', .8);
}
function marcarSalvo(txt) { $('salvoEm').textContent = txt; }
async function salvarNaBiblioteca({ avisar = false } = {}) {
  if (!st.img) { if (avisar) status('Escolha uma foto antes de salvar.', true); return false; }
  if (salvando) { agendarSalvar(800); return false; }
  const sig = assinaturaProjeto();
  if (!avisar && sig === ultimaAssinatura && st.projeto?.id) return true;
  salvando = true; marcarSalvo('Salvando…');
  try {
    st.projeto = st.projeto || { id: null, nome: nomePadrao() };
    const r = await fetch('/api/posts/projetos/salvar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: st.projeto.id, nome: st.projeto.nome, projeto: await arquivoProjeto(), capa: capaProjeto() }) });
    const tx = await r.text(); let j; try { j = JSON.parse(tx); } catch { throw new Error(r.status === 404 || r.status === 501 ? '501' : 'Unexpected token'); }
    if (!r.ok || j.error) throw new Error(j.error || r.status);
    st.projeto.id = j.id; ultimaAssinatura = sig; falhasSalvar = 0;
    marcarSalvo('Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    if (avisar) status(`Projeto "${st.projeto.nome}" salvo no Mac. Ele fica em Projetos.`);
    return true;
  } catch (e) {
    falhasSalvar++; marcarSalvo('Não salvo');
    if (avisar || falhasSalvar === 1) status('Não consegui salvar o projeto no Mac: ' + e.message, true);
    return false;
  } finally { salvando = false; }
}
function agendarSalvar(ms = 1500) { clearTimeout(timerSalvar); timerSalvar = setTimeout(() => salvarNaBiblioteca(), ms); }
// salvamento automático: confere a cada 3 s se algo mudou (camadas, textos, enquadramento, formato, animação)
setInterval(() => { if (st.img && !gesto && !videoBusy && assinaturaProjeto() !== ultimaAssinatura) agendarSalvar(600); }, 3000);
addEventListener('visibilitychange', () => { if (document.hidden && st.img && assinaturaProjeto() !== ultimaAssinatura) salvarNaBiblioteca(); });
const quando = t => { if (!t) return ''; const d = new Date(t * 1000), hoje = new Date(); const h = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === hoje.toDateString() ? 'Hoje, ' + h : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ', ' + h; };
async function listarProjetos() { const r = await fetch('/api/posts/projetos'); const j = await r.json(); if (!Array.isArray(j)) throw new Error(j.error || 'lista indisponível'); return j; }
async function abrirDaBiblioteca(id) {
  if (st.img && st.projeto?.id !== id && assinaturaProjeto() !== ultimaAssinatura) await salvarNaBiblioteca();   // guarda o atual antes de trocar
  status('Abrindo o projeto…'); const t0 = performance.now();
  try {
    const r = await fetch('/api/posts/projetos/' + id), j = await r.json(); if (!r.ok || j.error) throw new Error(j.error || r.status);
    await carregarProjeto(j.projeto); st.projeto = { id: j.id, nome: j.nome }; ultimaAssinatura = assinaturaProjeto();
    if (st._fotoReduzida) { ultimaAssinatura = null; agendarSalvar(2500); }   // regrava uma vez com a foto reduzida
    marcarSalvo('Salvo'); fecharProjetos(); status(`"${j.nome}" aberto em ${((performance.now() - t0) / 1000).toFixed(1).replace('.', ',')} s.`);
  } catch (e) { status('Não consegui abrir o projeto: ' + e.message, true); }
}
function fecharProjetos() { if ($('projetosDlg').open) $('projetosDlg').close(); }
async function mostrarProjetos() {
  const L = $('pjLista'); L.innerHTML = '<div class="pj-vazio">Carregando…</div>'; if (!$('projetosDlg').open) $('projetosDlg').showModal();
  if (st.img) await salvarNaBiblioteca();
  let lista; try { lista = await listarProjetos(); } catch (e) { L.innerHTML = '<div class="pj-vazio">Não consegui ler os projetos do Mac (' + e.message + '). Reinicie o Video Studio se ele estiver com o servidor antigo.</div>'; return; }
  if (!lista.length) { L.innerHTML = '<div class="pj-vazio">Nenhum projeto ainda. Abra uma foto: o projeto é criado e salvo sozinho.</div>'; return; }
  L.replaceChildren(...lista.map(p => {
    const c = document.createElement('div'); c.className = 'pj-card' + (p.id === st.projeto?.id ? ' atual' : '');
    c.innerHTML = `<button class="pj-capa" title="Abrir"></button><div class="pj-info"><input class="pj-nome" title="Clique para renomear"><span class="pj-data"></span></div><div class="pj-acoes"><button class="abrir">Abrir</button><button class="dup">Duplicar</button><button class="perigo">Apagar</button></div>`;
    if (p.capa) c.querySelector('.pj-capa').style.backgroundImage = `url(${p.capa}?t=${p.atualizado})`;
    const nome = c.querySelector('.pj-nome'); nome.value = p.nome; c.querySelector('.pj-data').textContent = (p.formato === 'story' ? 'Story · ' : 'Feed · ') + quando(p.atualizado) + (p.id === st.projeto?.id ? ' · aberto agora' : '');
    nome.onkeydown = e => { if (e.key === 'Enter') nome.blur(); e.stopPropagation(); };
    nome.onchange = async () => { const n = nome.value.trim() || 'Sem nome'; await fetch('/api/posts/projetos/renomear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, nome: n }) }); if (st.projeto?.id === p.id) st.projeto.nome = n; };
    c.querySelector('.pj-capa').onclick = c.querySelector('.abrir').onclick = () => abrirDaBiblioteca(p.id);
    c.querySelector('.dup').onclick = async () => {
      try { const j = await (await fetch('/api/posts/projetos/' + p.id)).json();
        await fetch('/api/posts/projetos/salvar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: p.nome + ' (cópia)', projeto: j.projeto, capaDe: p.id }) });
        mostrarProjetos(); } catch (e) { status('Não consegui duplicar: ' + e.message, true); } };
    const ap = c.querySelector('.perigo');
    ap.onclick = async () => {
      if (!ap.classList.contains('confirmar')) { ap.classList.add('confirmar'); ap.textContent = 'Confirmar'; setTimeout(() => { ap.classList.remove('confirmar'); ap.textContent = 'Apagar'; }, 4000); return; }
      await fetch('/api/posts/projetos/apagar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
      if (st.projeto?.id === p.id) st.projeto = { id: null, nome: st.projeto.nome };
      status('Projeto movido para a lixeira do Video Studio (data/posts_projetos/_lixeira).'); mostrarProjetos();
    };
    return c;
  }));
}
async function recentesNaTelaInicial() {
  const box = $('recentes'); if (!box) return;
  try { const lista = (await listarProjetos()).slice(0, 6); if (!lista.length) return box.replaceChildren();
    box.innerHTML = '<div class="rc-tit">ou continue um projeto</div>';
    for (const p of lista) { const b = document.createElement('button'); b.innerHTML = '<span></span><em></em>'; if (p.capa) b.querySelector('span').style.backgroundImage = `url(${p.capa}?t=${p.atualizado})`; b.querySelector('em').textContent = p.nome; b.title = p.nome; b.onclick = () => abrirDaBiblioteca(p.id); box.append(b); }
    const todos = document.createElement('button'); todos.innerHTML = '<span style="display:grid;place-items:center;background:var(--panel)">Todos</span><em>Ver projetos</em>'; todos.onclick = mostrarProjetos; box.append(todos);
  } catch { box.replaceChildren(); }
}
// ---------- IA do Photo Studio (Caio 24/11/2026 04:14): pedido + foto -> plano de composição -> camadas editáveis ----------
const EFEITOS_IA = () => [...EDITORIAL_EFFECTS.map(e => [e.id, e.name]), ['anelTexto', 'Texto orbitando em anel 3D em volta da pessoa (o campo texto vira o texto do anel)'],
  ['desfoqueDifuso', 'Desfoque difuso suave em parte da foto'], ...(st.pessoa ? [['fantasma', 'Fantasma em movimento: segunda exposição da pessoa com desfoque de movimento']] : [])];
const blobDados = b => new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(b); });
const fr = (v, a = 0, b = 1) => Math.max(a, Math.min(b, Number(v) || 0));
const corOk = c => /^#[0-9a-f]{6}$/i.test(String(c || ''));
function contextoIA() {
  const masc = st.pessoa || st.objetos[pessoaIdx()]?.img, box = b => b && { x: +(b.x / W()).toFixed(3), y: +(b.y / H()).toFixed(3), w: +(b.w / W()).toFixed(3), h: +(b.h / H()).toFixed(3) };
  let rosto = null; const P = rostoNaArte(); if (P) { const xs = P.map(p => p[0]), ys = P.map(p => p[1]); rosto = box({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }); }
  return { pessoa: masc ? box(caixaPessoa(mascara(masc))) : null, rosto, pessoaRecortada: !!masc,
    camadas: st.camadas.map(l => ({ nome: l.nome, tipo: l.tipo, texto: l.texto || l.legenda || '' })).slice(0, 20) };
}
function aplicarPlanoIA(P, manter) {
  if (!manter) { st.camadas = []; st.estilo = null; }
  if (P.formato && P.formato !== st.formato) { st.formato = P.formato === 'story' ? 'story' : 'feed'; $('formato').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === st.formato)); }
  // enquadramento: zoom e o ponto da foto que vai para o centro, sem deixar faixa vazia
  const Q = P.enquadramento || {}; $('fz').value = fr(Q.zoom || 1, 1, 2.5); $('fx').value = .5; $('fy').value = .5; $('ox').value = 0; $('oy').value = 0;
  const E = enquadramento(); let x = W() / 2 - fr(Q.focoX ?? .5) * E.dw, y = H() / 2 - fr(Q.focoY ?? .5) * E.dh;
  x = Math.min(0, Math.max(W() - E.dw, x)); y = Math.min(0, Math.max(H() - E.dh, y)); posicionarFoto(x, y, E);
  const px_ = v => fr(v) * W(), py_ = v => fr(v) * H(), novos = [];
  for (const f of P.efeitos || []) {
    const id = f.efeito; let F = null;
    if (isEditorialEffect(id)) { F = forma(makeEditorialEffect(id, W(), H())); }
    else if (id === 'desfoqueDifuso') { F = makeDiffuse(W(), H()); }
    else if (id === 'anelTexto') { const t = String(f.texto || 'CAIO ENDLICH').toUpperCase();
      F = forma({ forma: 'anelTexto', nome: 'Texto orbitando', contorno: false, legenda: t, separador: '  •  ', fonteLegenda: 'Montserrat', pesoLegenda: 800, tamLegenda: Math.round(W() * .05), espLetra: .04, entreLinhas: 1.1, cor: '#e6ff4f', brilho: .5, inclinacao: .28, rot: -10, fase: 0, perspectiva: .35, opacTras: .55, atrasPessoa: true, defasar: true, giro: 36, w: W() * .8 }); }
    else if (id === 'fantasma' && st.pessoa) { F = forma({ forma: 'fantasma', nome: 'Fantasma em movimento', x: null, y: null, novo: true, contorno: false, opacFantasma: .55, comprimento: 60, angulo: 0, rastro: .35, escalaFantasma: 1, nitido: true }); }
    if (!F) continue;
    if (F.x != null && f.x != null) { F.x = px_(f.x); F.y = py_(f.y); }
    if (f.largura > 0 && F.w != null && id !== 'fantasma') F.w = Math.max(40, px_(f.largura));
    if (f.altura > 0 && F.h != null && !['anelTexto', 'fantasma', 'ampliacaoSuperficie'].includes(id)) F.h = Math.max(40, py_(f.altura));
    if (corOk(f.cor) && 'cor' in F && id !== 'fantasma') F.cor = f.cor;
    F.nome = 'IA · ' + (F.nome || id); st.camadas.unshift(F); novos.push(F);
  }
  for (const e of P.elementos || []) {
    const def = ELEMENTOS.find(x => x[0] === e.elemento); if (!def) continue;
    const [k, n, , d] = def;
    const F = forma({ forma: k, nome: 'IA · ' + n, ...d, forma: d.forma || k, x: px_(e.x), y: py_(e.y), corContorno: d.corContorno || d.cor || GRAFITE });
    if (e.largura > 0) F.w = Math.max(4, px_(e.largura)); if (e.altura > 0) F.h = Math.max(2, py_(e.altura));
    if (corOk(e.cor)) { F.cor = e.cor; if (F.contorno !== false) F.corContorno = e.cor; }
    if (e.texto && 'legenda' in F) F.legenda = e.texto;
    st.camadas.push(F); novos.push(F);
  }
  for (const t of P.textos || []) {
    if (!String(t.texto || '').trim()) continue;
    const L = texto({ nome: 'IA · Texto', texto: String(t.texto).replace(/\\n/g, '\n'), fonte: FONTES[t.fonte] ? t.fonte : 'General Sans',
      peso: Math.round(fr(t.peso || 600, 100, 900) / 100) * 100, pesoDestaque: Math.round(fr(t.pesoDestaque || t.peso || 700, 100, 900) / 100) * 100,
      tam: fr(t.tamanho || 80, 12, 600), cor: corOk(t.cor) ? t.cor : OSSO, x: px_(t.x ?? .5), y: py_(t.y ?? .5), alinhar: ['left', 'center', 'right'].includes(t.alinhar) ? t.alinhar : 'center',
      caixa: !!t.caixaAlta, esp: fr(t.espacamento, -.1, .5), rot: fr(t.rotacao, -180, 180), arco: fr(t.arco, -100, 100), sombra: fr(t.sombra, 0, .9) });
    caber(L, Math.min(LIV(), Math.max(80, fr(t.largura || .86, .1, 1) * W())));
    if (t.efeitoTexto === 'nitido' || t.efeitoTexto === 'desfocado') Object.assign(L, { modoFoco: t.efeitoTexto, desfoqueFoco: 28, veuFoco: .18, escurecerFoco: 0 });
    if (t.atrasDaPessoa) { const i = garantirPessoa(); if (i >= 0) L.atras = [i]; }
    st.camadas.push(L); novos.push(L);
  }
  st.sel = st.camadas.indexOf(novos.at(-1)); miniaturas(); registrar(); desenhar();
  return novos.length;
}
$('iaMontar').onclick = async () => {
  if (!st.img) return status('Escolha uma foto primeiro.', true);
  const pedido = $('iaPedido').value.trim(); if (!pedido) return status('Escreva o que você quer na imagem.', true);
  const btn = $('iaMontar'); btn.disabled = true; btn.textContent = 'Montando…'; status('A IA está olhando a foto e montando a composição…');
  try {
    if (!st.pessoa && !st.objetos.some(o => o.kind === 'person')) await recortarPessoa();
    const ef = EFEITOS_IA(), descricoes = Object.fromEntries([...ef, ...ELEMENTOS.map(e => [e[0], e[1]])]);
    const body = { pedido, imagem: await blobDados(await reduzida(st.img, 1280)), formato: st.formato, fontes: Object.keys(FONTES),
      efeitos: ef.map(e => e[0]), elementos: ELEMENTOS.map(e => e[0]), descricoes, ...contextoIA() };
    const r = await fetch('/api/posts/ia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const tx = await r.text(); let j; try { j = JSON.parse(tx); } catch { throw new Error(r.status === 404 || r.status === 501 ? '501' : 'Unexpected token'); }
    if (!r.ok || j.error) throw new Error(j.error || r.status);
    const n = aplicarPlanoIA(j.plano, $('iaManter').checked);
    $('iaResumo').textContent = j.plano.resumo || ''; $('iaResumo').classList.add('on');
    status(`A IA montou ${n} camada${n === 1 ? '' : 's'}. Tudo continua editável; ⌘Z desfaz.`);
  } catch (e) { status('A IA não conseguiu montar: ' + e.message, true); }
  finally { btn.disabled = false; btn.textContent = 'Montar com IA'; }
};
// ---------- aba Fundo (Caio 24/11/2026 04:24): fundo, ambiente e cor como na Montagem ----------
let recortePedido = false;
async function mudarFundo(mud) {
  Object.assign(st.fundo, mud);
  const precisa = st.fundo.ambiente || st.fundo.fundo || st.fundo.luzFundo || st.fundo.gradienteFundo || st.fundo.luzPessoa;
  if (precisa && st.img && !st.pessoa && !st.objetos.some(o => o.kind === 'person') && !recortePedido) {
    recortePedido = true; status('Recortando a pessoa para separar o fundo…'); await recortarPessoa(); recortePedido = false;
    if (!st.pessoa) status('Sem o recorte da pessoa, o ambiente e o fundo valem para a foto toda.', true);
  }
  painelFundo(); desenhar();
}
function painelFundo() {
  const P = $('fundoPainel'); if (!P) return; const f = st.fundo;
  const grade = (itens, chave, val) => `<div class="fp-grid">${itens.map(([id, nome]) => `<button data-${chave}="${id}" class="${val === id ? 'on' : ''}">${nome}</button>`).join('')}</div>`;
  const faixa = (k, rot, min, max, passo = 1) => `<label class="fp-row"><span>${rot}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${passo}" value="${f[k] ?? 0}"><output>${f[k] ?? 0}</output></label>`;
  P.innerHTML = `<h4>Planos prontos</h4>${grade(PLANOS.map(p => [p[0], p[1]]), 'plano', '')}
    <h4>Fundo (3º plano)</h4>${grade(FUNDOS, 'fundo', f.fundo)}
    ${f.fundo === 'desfoque' ? faixa('desfoqueFundo', 'Desfoque', 2, 60) : ''}
    ${['cor', 'estudio'].includes(f.fundo) ? `<label class="fp-row"><span>Cor do fundo</span><input type="color" data-k="corFundo" value="${f.corFundo}"></label>` : ''}
    ${f.fundo === 'imagem' ? `<label class="fp-row"><span>Imagem</span><input type="file" id="fpImagem" accept="image/*"></label>` : ''}
    ${faixa('luzFundo', 'Luz no fundo', 0, 100)}${faixa('gradienteFundo', 'Escurecer fundo', 0, 100)}
    <div class="fp-grid"><button data-dir="baixo" class="${f.direcaoGradiente !== 'cima' ? 'on' : ''}">Escuro embaixo</button><button data-dir="cima" class="${f.direcaoGradiente === 'cima' ? 'on' : ''}">Escuro em cima</button></div>
    <h4>Ambiente (pessoa e fundo separados)</h4>${grade(AMBIENTES, 'amb', f.ambiente)}${f.ambiente ? faixa('intensidade', 'Intensidade', 0, 100) : ''}
    ${faixa('luzPessoa', 'Luz na pessoa', 0, 100)}
    <h4>Frente (1º plano)</h4><label class="chk"><input type="checkbox" data-k="escurecerFrente" ${f.escurecerFrente ? 'checked' : ''}> Escurecer a frente (mesa, colo)</label>
    ${f.escurecerFrente ? faixa('frenteDe', 'Começa em %', 40, 98) + faixa('frenteFaixa', 'Transição %', 2, 50) : ''}
    <h4>Cor e filtros (foto toda)</h4>${grade(LOOKS.map(l => [l[0], l[1]]), 'look', f.look)}
    ${CAMPOS_COR.map(([k, n, min]) => faixa(k, n, min, 100)).join('')}
    <button class="btn-wide" id="fpZerar" style="margin-top:12px">Voltar à foto original</button>`;
  P.querySelectorAll('[data-plano]').forEach(b => b.onclick = () => { const p = PLANOS.find(x => x[0] === b.dataset.plano); mudarFundo({ ...FUNDO_PADRAO, ...p[2], look: st.fundo.look }); });
  P.querySelectorAll('[data-fundo]').forEach(b => b.onclick = () => mudarFundo({ fundo: b.dataset.fundo }));
  P.querySelectorAll('[data-amb]').forEach(b => b.onclick = () => mudarFundo({ ambiente: b.dataset.amb }));
  P.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => mudarFundo({ direcaoGradiente: b.dataset.dir }));
  P.querySelectorAll('[data-look]').forEach(b => b.onclick = () => { const L = LOOKS.find(x => x[0] === b.dataset.look); const z = Object.fromEntries(CAMPOS_COR.map(c => [c[0], 0])); mudarFundo({ ...z, ...L[2], look: L[0] }); });
  P.querySelectorAll('input[type=range][data-k]').forEach(i => { i.oninput = () => { st.fundo[i.dataset.k] = +i.value; i.nextElementSibling.textContent = i.value; desenhar(); }; i.onchange = () => mudarFundo({}); });
  P.querySelectorAll('input[type=color][data-k]').forEach(i => i.oninput = () => { st.fundo[i.dataset.k] = i.value; desenhar(); });
  P.querySelectorAll('input[type=checkbox][data-k]').forEach(i => i.onchange = () => mudarFundo({ [i.dataset.k]: i.checked }));
  const fi = $('fpImagem'); if (fi) fi.onchange = async () => { const file = fi.files?.[0]; if (!file) return; try { st.imgFundoSrc = await arquivoDados(file); st.imgFundo = await imagem(st.imgFundoSrc); desenhar(); } catch { status('Não consegui abrir essa imagem.', true); } };
  $('fpZerar').onclick = () => { st.fundo = { ...FUNDO_PADRAO }; st.imgFundo = null; st.imgFundoSrc = null; painelFundo(); desenhar(); };
}
painelFundo();
// Assinatura sob demanda (Caio 24/11 03:44): não entra sozinha; cada botão cria um texto comum, selecionável e apagável.
const ASSINATURAS = { nome: ['CAIO ENDLICH', 'Assinatura · nome', true, .32], arroba: ['@caioendlich.md', 'Assinatura · @', false, .04], dr: ['Dr. Caio Endlich', 'Assinatura · Dr.', false, .04], crm: ['Dr. Caio Endlich · CRM-ES 17607', 'Assinatura · CRM', false, .04] };
function textoAssinatura(chaveA) {
  const [t, nome, alta, esp] = ASSINATURAS[chaveA];
  return texto({ nome, texto: t, fonte: 'Neue Montreal', peso: 400, pesoDestaque: 400, tam: alta ? 17 : 22, esp, caixa: alta, cor: OSSO, y: st.formato === 'story' ? H() - 300 : H() - 46 });
}
$('assinBtns').onclick = e => {
  const b = e.target.closest('button[data-a]'); if (!b) return; if (!st.img) return status('Escolha uma foto primeiro.', true);
  const L = textoAssinatura(b.dataset.a), ja = st.camadas.filter(c => String(c.nome).startsWith('Assinatura')).length; L.y -= ja * 34;   // empilha acima da anterior
  st.camadas.push(L); st.sel = st.camadas.length - 1; registrar(); desenhar();
};
$('projetosBtn').onclick = mostrarProjetos;
$('pjFechar').onclick = fecharProjetos;
$('pjNovo').onclick = async () => {
  if (st.img) await salvarNaBiblioteca();
  stopMotion(); st.fundo = { ...FUNDO_PADRAO }; st.imgFundo = null; st.imgFundoSrc = null; painelFundo(); st.img = null; st.imgSrc = null; st.pessoa = null; st.objetos = []; st.camadas = []; st.rosto = null; st.sel = -1; st.estilo = null; st.projeto = null; ultimaAssinatura = null;
  $('frase').value = ''; $('palavra').value = ''; hist.pilha = []; hist.pos = -1; marcarSalvo(''); fecharProjetos(); desenhar(); interfaceAtual(); recentesNaTelaInicial();
  status('Projeto novo. Escolha uma foto para começar.');
};
$('pjBaixar').onclick = () => $('salvarArquivo').click();
async function recortarPessoa() {
  try { const r = await fetch('/api/posts/recorte', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: await reduzida(st.img, 1600) });
    const tx = await r.text(); let j; try { j = JSON.parse(tx); } catch { throw new Error(r.status === 501 || r.status === 404 ? '501' : 'Unexpected token'); }
    if (!r.ok || j.error) throw new Error(j.error); st.pessoa = await imagem(j.mask); }
  catch (e) { st.pessoa = null; status('Sem recorte da pessoa: ' + e.message, true); }
}
async function detectar() {
  if (!st.img) return status('Escolha uma foto primeiro.', true); status('Detectando a pessoa e os objetos da foto… (alguns segundos)'); $('detectar').disabled = true;
  try { const r = await fetch('/api/posts/objetos', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: await reduzida(st.img, 960) });
    const tx = await r.text(); let j; try { j = JSON.parse(tx); } catch { throw new Error('Unexpected token'); }
    if (!r.ok || j.error) throw new Error(j.error);
    st.objetos = await Promise.all(j.objects.map(async o => ({ name: o.name, kind: o.kind, img: await imagem(o.mask) })));
    status(`${st.objetos.length} objeto(s) encontrados. À direita: marque o que passa na frente, ou toque em Soltar para mover o objeto.`); }
  catch (e) { status('Detecção indisponível: ' + e.message, true); }
  $('detectar').disabled = false; painel();
}
$('detectar').onclick = async () => { await detectar(); desenhar(); };

// ---------- entradas ----------
let imageLoading = false;
async function abrirImagem(f) {
  if (!f) return;
  if (imageLoading || videoBusy) return status('Aguarde a operação atual antes de trocar a imagem.', true);
  if (!(f.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|bmp|heic|heif)$/i.test(f.name))) return status('Solte um arquivo de imagem (JPG, PNG ou WebP).', true);
  imageLoading = true;
  try {
    const bruta = await arquivoDados(f), { img, src } = await reduzirFoto(await imagem(bruta), bruta);   // só troca o fundo depois de decodificar
    if (st.img) await salvarNaBiblioteca();   // a foto nova vira um projeto novo; o anterior fica guardado
    st.projeto = null; ultimaAssinatura = null; marcarSalvo(''); st.fundo = { ...FUNDO_PADRAO }; st.imgFundo = null; st.imgFundoSrc = null; painelFundo();
    stopMotion(); st.imgSrc = src; st.img = img; $('fx').value = .5; $('fy').value = .5; $('fz').value = 1; $('ox').value = 0; $('oy').value = 0;
    st.motion = { duration: 6, time: 0, preview: false }; $('motionDuration').value = 6; $('motionTime').max = 6; $('motionTime').value = 0; $('motionClock').textContent = '0.00 s';
    st.objetos = []; st.pessoa = null; st.rosto = null; status('Recortando a pessoa da foto…'); desenhar();
    await recortarPessoa();   // Caio 24/11 01:25: a foto entra limpa, sem texto automático
    if (st.pessoa) status('Foto pronta. Adicione texto, estilos, formas ou efeitos pelas abas da esquerda.');
    miniaturas(); desenhar(); registrar();
  } catch { status('Não consegui abrir essa imagem. Tente JPG, PNG ou WebP.', true); }
  finally { imageLoading = false; }
}
for (const id of ['arquivo', 'arquivoVazio']) $(id).onchange = async e => { await abrirImagem(e.target.files?.[0]); e.target.value = ''; };
let fileDragDepth = 0;
const arrastaArquivo = e => Array.from(e.dataTransfer?.types || []).includes('Files');
const limparArraste = () => { fileDragDepth = 0; document.body.classList.remove('image-drag-over'); };
document.addEventListener('dragenter', e => { if (!arrastaArquivo(e)) return; e.preventDefault(); fileDragDepth++; document.body.classList.add('image-drag-over'); });
document.addEventListener('dragover', e => { if (!arrastaArquivo(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
document.addEventListener('dragleave', () => { if (fileDragDepth && --fileDragDepth === 0) limparArraste(); });
document.addEventListener('dragend', limparArraste); window.addEventListener('blur', limparArraste);
document.addEventListener('drop', async e => {
  if (!arrastaArquivo(e) && !e.dataTransfer?.files?.length) return;
  e.preventDefault(); limparArraste();
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length !== 1) return status('Solte uma imagem por vez para escolher o fundo do post.', true);
  await abrirImagem(files[0]);
});
$('objetoPng').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; const src = await arquivoDados(f), img = await imagem(src), s = 500 / Math.max(img.naturalWidth, img.naturalHeight);
  st.camadas.push(forma({ forma: 'imagem', nome: f.name.replace(/\.\w+$/, ''), img, imgSrc: src, w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s), contorno: false }));
  st.sel = st.camadas.length - 1; registrar(); desenhar(); e.target.value = '';
};
$('editoriais').innerHTML = [...EDITORIAL_EFFECTS.map(e => '<button type="button" data-k="' + e.id + '">' + e.name + '</button>'), '<button type="button" data-k="textoProfundidade">Texto em profundidade</button>', '<button type="button" data-k="mapaFacial">Mapeamento facial</button>', '<button type="button" data-k="fantasma">Fantasma em movimento</button>', '<button type="button" data-k="anelTexto">Texto orbitando (anel 3D)</button>'].join('');
const desenharFoco = installFocusDrawing({canvas:cv,selected:()=>st.camadas[st.sel],redraw:()=>render(ctx,{selecao:true}),commit:registrar,status});
$('editoriais').insertAdjacentHTML('beforeend','<button type="button" data-k="painelAnalise">Painel de análise</button>');
$('editoriais').insertAdjacentHTML('beforeend','<button type="button" data-k="desfoqueDifuso">Desfoque difuso</button>');
// Aba Desfoques (Caio 24/11 02:18): os desfoques e vidros saem de Efeitos e ficam juntos numa aba própria.
const DESFOQUES = ['vidroTexturizado', 'desfoqueDifuso', 'janelaRealidade', 'fronteiraFoco', 'fantasma', 'peliculaOptica', 'aguaLente'];
for (const k of DESFOQUES) { const b = $('editoriais').querySelector(`button[data-k="${k}"]`); if (b) $('desfoques').append(b); }
$('desfoques').insertAdjacentHTML('afterbegin', '<button type="button" data-k="textoFoco">Palavra que recorta o foco</button>');
$('desfoques').onclick = e => $('editoriais').onclick(e);
$('receitas').innerHTML = RECEITAS.map(r => '<button type="button" data-r="' + r.id + '">' + r.nome + '</button>').join('');
$('receitas').onclick = async e => {
  const b = e.target.closest('button[data-r]'); if (!b) return; if (!st.img) return status('Escolha uma foto primeiro.', true);
  const id = b.dataset.r, R = receitaPorId(id);
  await Promise.all(['700 40px Neue', '500 40px Neue', '40px SpaceG', '40px AntonF', '40px SixCaps', 'italic 40px InstrSI', '700 40px GenSans', '500 40px GenSans'].map(f => document.fonts.load(f).catch(() => null)));
  if (!st.pessoa && !st.objetos.some(o => o.kind === 'person')) await recortarPessoa();
  if (R.objeto && !st.objetos.some(o => o.kind !== 'person')) { try { await detectar(); } catch (err) { } }
  const mp = st.pessoa || st.objetos[pessoaIdx()]?.img, bx = mp ? caixaPessoa(mascara(mp)) : { x: W() / 2, y: H() / 2, w: W() * .6, h: H() * .7 };
  // Caio 24/11 20:44: com um texto (ou outro estilo) selecionado, o estilo é aplicado nele, mantendo as palavras;
  // sem nada selecionado, cria um texto novo com a palavra padrão TEXTO.
  const S = st.camadas[st.sel], w = TEXTUAL(S) ? palavrasDe(S) : null;
  const obj = R.objeto ? (S?.forma === 'receita' && S.obj >= 0 ? S.obj : Math.max(-1, st.objetos.findIndex(o => o.kind !== 'person'))) : -1;
  const L = novaReceita(id, { W: W(), H: H(), bx, palavra: w?.palavra || 'TEXTO', frase: S?.forma === 'receita' ? S.sub || '' : '', obj });
  if (S?.forma === 'receita') { L.cor = S.cor || L.cor; L.vel = S.vel ?? L.vel; L.inicio = S.inicio || 0; L.dur = S.dur || 0; }
  trocarSelecao([L]); registrar(); desenhar();
};
$('editoriais').onclick = async e => {
  const button = e.target.closest('button[data-k]'); if (!button) return;
  if (!st.img) return status('Escolha uma foto primeiro.', true);
  if (button.dataset.k === 'desfoqueDifuso') { st.camadas.unshift(makeDiffuse(W(),H())); st.sel=0; registrar(); desenhar(); return; }
  if (button.dataset.k === 'painelAnalise') { st.camadas.unshift(makeAnalysis(W(),H())); st.sel=0; registrar(); desenhar(); return; }
  if (button.dataset.k === 'textoProfundidade') {
    if (!st.objetos.length && st.img && !st.pessoa) await detectar();
    const pessoa = garantirPessoa();
    st.camadas.push(caber(texto({ nome: 'Texto em profundidade', texto: palavra(), y: H() * .37, tam: 260, esp: -.04, atras: pessoa >= 0 ? [pessoa] : [] }), LIV()));
    st.sel = st.camadas.length - 1; registrar(); desenhar(); return;
  }
  if (button.dataset.k === 'textoFoco') {
    const t = ($('palavra').value || 'FOCO').trim().toUpperCase();
    const L = caber(texto({ nome: 'Palavra que recorta o foco', texto: [t, t, t].join('\n'), fonte: 'Montserrat', peso: 900, pesoDestaque: 900, tam: 420, esp: -.02, entre: .92, cor: '#ffffff', modoFoco: 'nitido', desfoqueFoco: 28, veuFoco: .18, escurecerFoco: 0 }), W() * .9);
    st.camadas.push(L); st.sel = st.camadas.length - 1; registrar(); desenhar(); return;
  }
  if (button.dataset.k === 'fantasma') {
    if (!st.pessoa && !st.objetos.some(o => o.kind === 'person')) { await recortarPessoa(); if (!st.pessoa) return; }
    st.camadas.push(forma({ forma: 'fantasma', nome: 'Fantasma em movimento', x: null, y: null, novo: true, contorno: false, opacFantasma: .55, comprimento: 60, angulo: 0, rastro: .35, escalaFantasma: 1, nitido: true }));
    st.sel = st.camadas.length - 1; registrar(); desenhar(); return;
  }
  if (button.dataset.k === 'anelTexto') {
    if (!st.pessoa && !st.objetos.some(o => o.kind === 'person')) await recortarPessoa();
    const masc = st.pessoa || st.objetos[pessoaIdx()]?.img, cx = masc ? caixaPessoa(mascara(masc)) : { x: W() / 2, y: H() / 2, w: W() * .6, h: H() * .6 };
    const t = ($('palavra').value || '').trim().toUpperCase();
    st.camadas.push(forma({ forma: 'anelTexto', nome: 'Texto orbitando', x: cx.x, y: cx.y + cx.h * .12, w: Math.min(W() * 1.05, Math.max(cx.w * 1.3, W() * .7)), contorno: false,
      legenda: t ? `${t}\nCAIO ENDLICH` : 'MEDICINA ESTÉTICA\nCAIO ENDLICH', separador: '  •  ', fonteLegenda: 'Montserrat', pesoLegenda: 800, tamLegenda: Math.round(W() * .05), espLetra: .04, entreLinhas: 1.1,
      cor: '#e6ff4f', brilho: .5, inclinacao: .28, rot: -10, fase: 0, perspectiva: .35, opacTras: .55, atrasPessoa: true, defasar: true, giro: 36 }));
    st.sel = st.camadas.length - 1; registrar(); desenhar(); return;
  }
  if (button.dataset.k === 'mapaFacial') {
    if (!st.rosto && !(await obterRosto())) return;
    st.camadas.push(forma({ forma: 'mapaFacial', nome: 'Mapeamento facial', contorno: false, densidade: 16, esp: 1.3, intensidade: .5, brilho: .6, corLinha: '#ffffff', corBrilho: '#6ee7f0', varredura: .42, mostrarVarredura: true, mostrarPontos: true, linhas: true, escalaPontos: 1 }));
    st.sel = st.camadas.length - 1; registrar(); desenhar(); return;
  }
  if (!isEditorialEffect(button.dataset.k)) return;
  st.camadas.unshift(forma(makeEditorialEffect(button.dataset.k, W(), H())));   // intervenção fica abaixo dos textos
  st.sel = 0; registrar(); desenhar();
};
$('elems').innerHTML = ELEMENTOS.map(([k, n, svg]) => `<button data-k="${k}" title="${n}"><svg viewBox="0 0 30 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>${n}</button>`).join('');
$('elems').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; if (!st.img) return status('Escolha uma foto primeiro.', true);
  const [k, n, , d] = ELEMENTOS.find(x => x[0] === b.dataset.k);
  const F = forma({ forma: k, nome: n, ...d, forma: d.forma || k, y: k === 'degrade' ? H() - d.h / 2 : H() / 2, corContorno: d.corContorno || d.cor || GRAFITE });
  st.camadas.push(F); st.sel = st.camadas.length - 1; registrar(); desenhar();
};
$('addTexto').onclick = () => {
  if (!st.img) return status('Escolha uma foto primeiro.', true);
  const L = caber(texto({ nome: 'Texto', texto: 'SEU TEXTO', tam: 110, cor: OSSO, y: H() * .5 }), LIV()); st.camadas.push(L); st.sel = st.camadas.length - 1;
  registrar(); desenhar(); editarNaArte(L);
};
$('fraseNegrito').onclick = () => { const t = $('frase'), a = t.selectionStart, z = t.selectionEnd; if (a === z) return status('Selecione na frase as palavras que vão em negrito.', true);
  t.value = t.value.slice(0, a) + '*' + t.value.slice(a, z).replace(/\*/g, '') + '*' + t.value.slice(z); t.dispatchEvent(new Event('input')); registrar(); };
$('fraseQuebra').onclick = () => { const t = $('frase'), a = t.selectionStart; t.value = t.value.slice(0, a) + '|' + t.value.slice(a); t.dispatchEvent(new Event('input')); registrar(); };
function abrirAba(nome) { document.querySelectorAll('#rail button').forEach(b => b.classList.toggle('on', b.dataset.tab === nome)); document.querySelectorAll('.drawer .tab').forEach(s => s.classList.toggle('on', s.dataset.tab === nome)); }
// ---------- celular (24/11/2026): layout de rodapé, aba Ajustes e gestos de dois dedos ----------
const ehCelular = () => window.PHOTO_STUDIO_AUTONOMO || matchMedia('(max-width: 820px)').matches;
if (ehCelular()) {
  document.body.classList.add('celular');
  const aj = document.createElement('button'); aj.dataset.tab = 'ajustes';
  aj.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>Ajustes';
  $('rail').prepend(aj);
  $('exportarVideo').textContent = $('exportarVideo').dataset.rotulo = 'Clipe'; $('exportar').textContent = 'PNG';
  if (window.PHOTO_STUDIO_AUTONOMO) { $('rail').querySelector('[data-tab="ia"]')?.remove(); const t = $('projetosDlg').querySelector('.pj-sub'); if (t) t.textContent = 'Salvos neste celular, com salvamento automático.'; }
}
// toque duplo no celular (Caio 24/11/2026 19:17): menu do que dá para fazer com o objeto tocado, direto na tela
function fecharMenuToque() { $('menuToque')?.remove(); }
function menuDoToque(e, p) {
  fecharMenuToque();
  const i = camadaEm(p), L = i === undefined ? null : st.camadas[i];
  if (L) { st.sel = i; desenhar(); }
  const pi = typeof pessoaIdx === 'function' ? pessoaIdx() : -1, atrasPessoa = L && Array.isArray(L.atras) && pi >= 0 && L.atras.includes(pi);
  const itens = [];
  if (L) itens.push(['🗑', 'Apagar', apagar, 'perigo']);   // Caio 24/11 21:28: apagar é o primeiro
  if (L && (L.tipo === 'texto' || L.tipo === 'molde' || L.forma === 'caixa' || L.forma === 'receita')) itens.push(['✎', 'Editar texto', () => abrirEdicao(L)]);
  if (L) itens.push(['⧉', 'Duplicar', duplicar], ['↑', 'Trazer para frente', () => reordenar(1)], ['↓', 'Enviar para trás', () => reordenar(-1)]);
  if (L && Array.isArray(L.atras) && pi >= 0) itens.push(['◐', atrasPessoa ? 'Passar na frente da pessoa' : 'Passar atrás da pessoa', () => { L.atras = atrasPessoa ? L.atras.filter(x => x !== pi) : [...L.atras, pi]; registrar(); redesenhar(); }]);
  if (L) itens.push(['◌', L.oculto ? 'Mostrar' : 'Esconder', () => { L.oculto = !L.oculto; registrar(); desenhar(); }]);
  itens.push(['↶', 'Desfazer', () => voltar(-1)], ['↷', 'Refazer', () => voltar(1)]);
  const m = document.createElement('div'); m.id = 'menuToque';
  m.innerHTML = (L ? `<p>${String(L.nome || L.texto || 'Objeto').replace(/[&<>"']/g, '').slice(0, 28)}</p>` : '<p>Foto</p>') + itens.map((it, k) => `<button data-k="${k}" class="${it[3] || ''}"><span>${it[0]}</span>${it[1]}</button>`).join('');
  document.body.appendChild(m);
  const r = m.getBoundingClientRect(), x = Math.min(Math.max(8, e.clientX - r.width / 2), innerWidth - r.width - 8), y = Math.min(Math.max(8, e.clientY + 14), innerHeight - r.height - 8);
  m.style.left = x + 'px'; m.style.top = y + 'px';
  m.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const it = itens[+b.dataset.k]; fecharMenuToque(); it[2](); };
  setTimeout(() => document.addEventListener('pointerdown', function fora(ev) { if (!ev.target.closest('#menuToque')) { fecharMenuToque(); document.removeEventListener('pointerdown', fora, true); } }, true), 0);
}
// dois dedos: com uma camada selecionada, aumenta, diminui e gira a camada; sem seleção, aproxima e move a foto
const toques = new Map(); let pinca = null, ultimoToque = null, selAntesDoToque = -1;
const baixoOriginal = cv.onpointerdown, moverOriginal = cv.onpointermove, cimaOriginal = cv.onpointerup;
const geo = () => { const [a, b] = [...toques.values()]; return { d: Math.hypot(b.x - a.x, b.y - a.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; };
cv.onpointerdown = e => {
  if (e.pointerType === 'touch') {
    if (e.isPrimary) { toques.clear(); pinca = null; selAntesDoToque = st.sel; } // primeiro dedo de um toque novo: descarta toques que não terminaram
    toques.set(e.pointerId, local(e));
    if (toques.size === 2) {
      // a pinça age no que estava selecionado ANTES do toque: sem seleção, é zoom na foto, mesmo com efeitos cobrindo a arte
      gesto = null; st.guias = null; st.sel = selAntesDoToque; const g = geo(), L = st.camadas[st.sel];
      if (!(L && !L.oculto)) st.rapido = true;
      pinca = { g0: g, L: L && !L.oculto ? L : null, v: L ? JSON.parse(JSON.stringify({ ...L, img: undefined, _box: undefined })) : null, E0: enquadramento(), fz0: +$('fz').value || 1 };
      try { cv.setPointerCapture(e.pointerId); } catch {} return;
    }
    if (toques.size > 2) return;
    // toque duplo = editar o texto (o iPhone nem sempre manda dblclick)
    const agora = performance.now(), p = local(e);
    if (ultimoToque && agora - ultimoToque.t < 320 && Math.hypot(p.x - ultimoToque.p.x, p.y - ultimoToque.p.y) < 40 * px()) { ultimoToque = null; menuDoToque(e, p); return; }
    ultimoToque = { t: agora, p };
  }
  baixoOriginal(e);
};
cv.onpointermove = e => {
  if (toques.has(e.pointerId)) toques.set(e.pointerId, local(e));
  if (pinca && toques.size === 2) {
    const g = geo(), k = g.d / pinca.g0.d, dA = (g.ang - pinca.g0.ang) * 180 / Math.PI, dx = g.m.x - pinca.g0.m.x, dy = g.m.y - pinca.g0.m.y;
    if (pinca.L) {
      const L = pinca.L, v = pinca.v; escalar(L, v, k, k, false);
      if ('rot' in v) { let a = (v.rot || 0) + dA; for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(a - s) <= 4) a = s; L.rot = a; }
      if (v.x != null) { L.x = v.x + dx; L.y = v.y + dy; }
    } else {
      $('fz').value = Math.max(.3, Math.min(5, pinca.fz0 * k)); const E1 = enquadramento(), r = E1.dw / pinca.E0.dw;
      posicionarFoto(g.m.x - (pinca.g0.m.x - pinca.E0.x) * r, g.m.y - (pinca.g0.m.y - pinca.E0.y) * r, E1);
    }
    redesenhar(); return;
  }
  if (pinca) return;
  moverOriginal(e);
};
cv.onpointerup = cv.onpointercancel = e => {
  toques.delete(e.pointerId);
  if (pinca) { if (toques.size < 2) { const foto = !pinca.L; pinca = null; st.rapido = false; if (foto) encaixarFoto(); registrar(); desenhar(); clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 300); } return; }
  cimaOriginal(e);
};
// Segurar o dedo (ou o clique) parado na arte mostra a foto original, sem nenhuma edição; soltar volta (Caio 24/11 21:23).
let segurar = null, mostrandoOriginal = false;
const baixoComPinca = cv.onpointerdown, moverComPinca = cv.onpointermove, cimaComPinca = cv.onpointerup;
function mostrarOriginal() {
  if (!st.img) return; mostrandoOriginal = true;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W(), H()); cobrir(ctx, st.img);
  const k = px(), t = 'ORIGINAL'; ctx.save(); ctx.font = `600 ${13 * k}px Neue, GenSans, system-ui, sans-serif`;
  const w = ctx.measureText(t).width + 24 * k, h = 28 * k, x = 14 * k, y = 14 * k;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + 12 * k, y + h / 2 + k); ctx.restore();
}
const pararSegurar = () => { if (segurar) { clearTimeout(segurar.t); segurar = null; } };
cv.onpointerdown = e => {
  pararSegurar();
  if (st.img && e.isPrimary && e.button === 0) segurar = { id: e.pointerId, x: e.clientX, y: e.clientY,
    t: setTimeout(() => { segurar = null; if (toques.size > 1 || pinca || document.getElementById('menuToque') || st.editando) return; mostrarOriginal(); }, 450) };
  baixoComPinca(e);
};
cv.onpointermove = e => {
  if (mostrandoOriginal) return;   // enquanto mostra o original, nada se move
  if (segurar && e.pointerId === segurar.id && Math.hypot(e.clientX - segurar.x, e.clientY - segurar.y) > 8) pararSegurar();
  if (segurar && e.pointerId !== segurar.id) pararSegurar();
  moverComPinca(e);
};
cv.onpointerup = cv.onpointercancel = e => {
  pararSegurar();
  if (mostrandoOriginal) { mostrandoOriginal = false; cimaComPinca(e); desenhar(); return; }
  cimaComPinca(e);
};
$('rail').onclick = e => { const b = e.target.closest('button[data-tab]'); if (!b) return;
  if (b.dataset.tab === 'ajustes') { document.body.classList.add('ver-ajustes'); document.querySelectorAll('#rail button').forEach(x => x.classList.toggle('on', x === b)); return; }
  document.body.classList.remove('ver-ajustes'); abrirAba(b.dataset.tab); };
$('formato').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('formato').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); st.formato = b.dataset.v; miniaturas(); desenhar(); };
for (const id of ['frase', 'palavra']) { $(id).oninput = () => { const E = ESTILOS.find(x => x.id === st.estilo);
    if (E?.id === 'pilulas' || E?.id === 'pilulasVidro') { const fotos = st.camadas.filter(l => l.doEstilo && l.forma === 'pilulaFoto'); const novas = pilulas(E.id === 'pilulasVidro'); novas.filter(l => l.forma === 'pilulaFoto').forEach((l, i) => { if (fotos[i]?.img) Object.assign(l, { img: fotos[i].img, imgSrc: fotos[i].imgSrc, fosco: false }); });
      st.camadas = [...st.camadas.filter(l => !l.doEstilo), ...novas]; desenhar(); clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 400); return; }
    if (E && E.id !== 'corte') st.camadas = [...E.criar().map((n, i) => ({ ...n, ...pos(i) })), ...st.camadas.filter(l => l.tipo === 'forma')]; desenhar(); clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 400); }; $(id).onchange = registrar; }
function pos(i) { const L = st.camadas.filter(l => l.tipo !== 'forma')[i]; return L ? (L.tipo === 'molde' ? { ...L } : { x: L.x, y: L.y, tam: L.tam, rot: L.rot, atras: L.atras, cor: L.cor, fonte: L.fonte, peso: L.peso }) : {}; }
for (const id of ['fx', 'fy']) { $(id).oninput = () => { desenhar(); clearTimeout(st.tm); st.tm = setTimeout(miniaturas, 400); }; }

const reordenar = d => { const i = st.sel, j = i + d; if (i < 0 || j < 0 || j >= st.camadas.length) return; [st.camadas[i], st.camadas[j]] = [st.camadas[j], st.camadas[i]]; st.sel = j; registrar(); desenhar(); };
const duplicar = () => { const L = st.camadas[st.sel]; if (!L) return; const [c] = copiar([L]); Object.assign(c, { nome: L.nome + ' (cópia)' }); delete c.grupo; if (L.tipo === 'molde') c.dy = (L.dy || 0) + 40; else { c.x = L.x + 30; c.y = L.y + 30; } st.camadas.splice(st.sel + 1, 0, c); st.sel++; registrar(); desenhar(); };
const apagar = () => { if (st.sel < 0) return; st.camadas.splice(st.sel, 1); st.sel = Math.min(st.sel, st.camadas.length - 1); registrar(); desenhar(); };
$('subir').onclick = $('tbFrente').onclick = () => reordenar(1); $('descer').onclick = $('tbTras').onclick = () => reordenar(-1);
$('duplicar').onclick = $('tbDuplicar').onclick = duplicar; $('apagar').onclick = $('tbApagar').onclick = apagar;
let nudgeT = 0;
document.addEventListener('keydown', e => {
  const digitando = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable, cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z' && !digitando) { e.preventDefault(); voltar(e.shiftKey ? 1 : -1); return; }
  if (cmd && e.key.toLowerCase() === 'y' && !digitando) { e.preventDefault(); voltar(1); return; }
  if (digitando) return;
  const L = st.camadas[st.sel];
  if (cmd && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicar(); return; }
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); apagar(); return; }
  if (e.key === 'Escape') { st.sel = -1; desenhar(); return; }
  if (e.key === 'Enter' && L?.tipo === 'texto') { e.preventDefault(); editarNaArte(L); return; }
  const set = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (set && L) { e.preventDefault(); const n = e.shiftKey ? 10 : 1; mover(L, { ...L }, set[0] * n, set[1] * n); redesenhar(); clearTimeout(nudgeT); nudgeT = setTimeout(() => { registrar(); painel(); }, 400); }
});
$('exportar').onclick = () => {
  if (!st.img) return status('Escolha uma imagem antes de exportar.', true);
  const c = document.createElement('canvas').getContext('2d'); render(c);
  c.canvas.toBlob(b => { baixar(b, `post_${palavra().replace(/[^\wÀ-ú]+/g, '')}_${st.formato}.png`); status('PNG exportado para Downloads.'); }, 'image/png');
};
window.__posts = st;   // inspeção em testes
window.__render = () => render(ctx, { selecao: true });
await carregarFontes(); miniaturas(); desenhar(); registrar(); recentesNaTelaInicial();
