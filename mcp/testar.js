#!/usr/bin/env node
/* Testa o servidor MCP como um cliente de verdade faria.
   1. node mcp/testar.js            → sobe o servidor e espera o Studio conectar
   2. abra studio/index.html?mcp=1  → o Studio conecta sozinho
   Uso avançado: node mcp/testar.js roteiro.json   (lista de { "ferramenta": "...", "args": {...} }) */
'use strict';
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const roteiro = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : [
  { ferramenta: 'estado_do_studio' },
  { ferramenta: 'ver_cena', args: { profundidade: 1 } },
];
const srv = spawn(process.execPath, [path.join(__dirname, 'servidor.js')], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', id = 0; const esperas = new Map();
srv.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); const e = esperas.get(m.id); if (e) { esperas.delete(m.id); e(m); } } });
const rpc = (method, params) => new Promise(ok => { const n = ++id; esperas.set(n, ok); srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n'); });

(async () => {
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'teste', version: '1' } });
  const lista = await rpc('tools/list', {});
  console.log(`✓ ${lista.result.tools.length} ferramentas`);
  process.stdout.write('… esperando o Studio conectar (abra studio/index.html?mcp=1)\n');
  for (let t = 0; t < 600; t++) {
    try { const r = await (await fetch(`http://127.0.0.1:${process.env.ARCADIA_PORTA || 47823}/`)).json(); if (r.studioConectado) break; } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  for (const passo of roteiro) {
    if (passo.esperar) { await new Promise(r => setTimeout(r, passo.esperar)); continue; }
    const r = await rpc('tools/call', { name: passo.ferramenta, arguments: passo.args || {} });
    const c = (r.result && r.result.content) || [];
    const resumo = c.map(x => x.type === 'image' ? `[imagem ${x.mimeType}, ${Math.round(x.data.length * 0.75 / 1024)} KB]` : x.text).join('\n');
    console.log(`${r.result && r.result.isError ? '✗' : '✓'} ${passo.ferramenta}: ${resumo.length > 1500 ? resumo.slice(0, 1500) + ' …' : resumo}`);
  }
  srv.stdin.end();
})();
