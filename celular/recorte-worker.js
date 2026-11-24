// Recorte da pessoa no celular (Photo Studio autônomo, 24/11/2026). Mesmo modelo e mesmo motor do Prisma:
// MODNet (Apache-2.0, feito para retrato) no onnxruntime-web, num worker para a tela nunca travar.
importScripts('ort.wasm.min.js');
ort.env.wasm.wasmPaths = self.location.href.replace(/[^/]*$/, '');
ort.env.wasm.numThreads = 1;
let modnet = null, RES = 512;
function tensor(px) {
  const n = RES * RES, inp = new Float32Array(3 * n);
  for (let i = 0, j = 0; j < n; i += 4, j++) for (let c = 0; c < 3; c++) inp[j + c * n] = (px[i + c] / 255 - 0.5) / 0.5;
  return new ort.Tensor('float32', inp, [1, 3, RES, RES]);
}
onmessage = async e => {
  const d = e.data;
  try {
    if (d.type === 'load') {
      RES = d.res || 512;
      const r = await fetch('modnet.onnx'); if (!r.ok) throw new Error('Falha ao baixar o modelo de recorte.');
      modnet = await ort.InferenceSession.create(new Uint8Array(await r.arrayBuffer()), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      postMessage({ type: 'ready' });
    } else if (d.type === 'run') {
      const out = await modnet.run({ input: tensor(d.px) });
      const o = new Float32Array(out.output.data);
      postMessage({ type: 'out', id: d.id, data: o }, [o.buffer]);
    }
  } catch (err) { postMessage({ type: 'err', id: d.id, msg: (err && err.message) || String(err) }); }
};
