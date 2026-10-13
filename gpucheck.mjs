// prints which WebGL renderer headless Chromium gets on this machine (should be Apple GPU, not SwiftShader)
import { chromium } from 'playwright-core';
const args = ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'];
let b;
try { b = await chromium.launch({ channel: 'chromium', args }); } catch { b = await chromium.launch({ args }); }
const p = await b.newPage();
const r = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); if (!g) return 'no WebGL2'; const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); });
console.log('WebGL renderer:', r, /swiftshader|llvmpipe/i.test(r) ? '  <-- software rendering, GPU not used' : '  <-- GPU OK');
await b.close();
