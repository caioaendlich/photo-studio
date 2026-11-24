const C='ps-app-202611241933', M='ps-modelos-1';
const MODELOS=/\/(celular\/(modnet\.onnx|ort-wasm(-simd)?\.wasm|ort\.wasm\.min\.js)|fonts\/)/;
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==M).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(MODELOS.test(u.pathname)){e.respondWith(caches.open(M).then(c=>c.match(r).then(h=>h||fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x;}))));return;}
 e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y));}return x;}).catch(()=>caches.match(r)));});
