#!/usr/bin/env node
/* Roda o Code.gs no computador, sem Google, para testar o sistema de contas.
   - planilha em memória, e-mails salvos em servidor-contas/emails-simulados/
   Uso: node servidor-contas/simulador.js [porta]   (padrão 8790)
   No site, abra o console e rode:  localStorage.setItem('arcadia.contasUrl', 'http://127.0.0.1:8790')  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm'), crypto = require('crypto');
const PORTA = +process.argv[2] || 8790, PASTA_EMAILS = path.join(__dirname, 'emails-simulados');
fs.mkdirSync(PASTA_EMAILS, { recursive: true });

const abas = {}, props = {}, colunas = {}; // colunas: como no Google, a aba nasce com 26 e o appendRow aumenta
const fakeSheet = nome => {
  const dados = abas[nome] = abas[nome] || [];
  if (!colunas[nome]) colunas[nome] = 26;
  return {
    appendRow: r => { dados.push(r.slice()); colunas[nome] = Math.max(colunas[nome], r.length); }, setFrozenRows() {},
    getMaxColumns: () => colunas[nome], insertColumnsAfter: (c, n) => { colunas[nome] += n; },
    getDataRange: () => ({ getValues: () => dados.map(r => r.slice()) }),
    getLastRow: () => { let n = dados.length; while (n > 0 && dados[n - 1].every(v => v === '' || v == null)) n--; return n; },
    getLastColumn: () => dados.reduce((m, r) => Math.max(m, r.length), 0),
    getRange: (l, c, nl = 1, nc = 1) => {
      if (c - 1 + nc > colunas[nome]) throw new Error('Os limites do intervalo estão fora das dimensões da planilha.');
      const cel = (i, j) => { const r = dados[l - 1 + i] || []; const v = r[c - 1 + j]; return v === undefined ? '' : v; };
      const por = (i, j, v) => { while (dados.length < l + i) dados.push([]); dados[l - 1 + i][c - 1 + j] = v; };
      return {
        setValue: v => por(0, 0, v), getValue: () => cel(0, 0),
        getValues: () => Array.from({ length: nl }, (_, i) => Array.from({ length: nc }, (_, j) => cel(i, j))),
        setValues: m => m.forEach((r, i) => r.forEach((v, j) => por(i, j, v))),
        clearContent: () => { for (let i = 0; i < nl; i++) for (let j = 0; j < nc; j++) por(i, j, ''); },
      };
    },
    deleteRow: l => dados.splice(l - 1, 1),
  };
};
const ss = { getId: () => 'simulada', getUrl: () => 'memória', getSheetByName: n => abas[n] ? fakeSheet(n) : null, insertSheet: n => { abas[n] = []; return fakeSheet(n); }, getSheets: () => Object.keys(abas), deleteSheet() {} };
let enviados = 0;
const ctx = {
  console, JSON, Date, Math, Object, String, Number, parseInt, Error,
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ setMimeType: () => ({ texto: t }) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  SpreadsheetApp: { openById: () => ss, create: () => ss },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, txt) => [...crypto.createHash('sha256').update(txt, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
    getUuid: () => crypto.randomUUID(),
    formatDate: d => d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  },
  MailApp: {
    getRemainingDailyQuota: () => 100,
    sendEmail: o => {
      const n = String(++enviados).padStart(3, '0'), arq = path.join(PASTA_EMAILS, `${n}-${o.to.replace(/[^a-z0-9]/gi, '_')}.html`);
      fs.writeFileSync(arq, `<!-- Para: ${o.to} | Assunto: ${o.subject} -->\n<meta charset="utf-8"><title>${o.subject}</title>\n` + o.htmlBody);
      console.log(`✉️  [${n}] para ${o.to}: ${o.subject}`);
    },
  },
  Logger: { log: console.log },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
ctx.configurar();

http.createServer((req, res) => {
  const cab = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json; charset=utf-8' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cab); return res.end(); }
  if (req.method === 'GET') { res.writeHead(200, cab); return res.end(ctx.doGet().texto); }
  let corpo = ''; req.on('data', c => corpo += c);
  req.on('end', () => { const out = ctx.doPost({ postData: { contents: corpo } }); res.writeHead(200, cab); res.end(out.texto); });
}).listen(PORTA, '127.0.0.1', () => console.log(`Servidor de contas SIMULADO em http://127.0.0.1:${PORTA}`));
