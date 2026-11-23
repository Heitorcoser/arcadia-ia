/* =========================================================================
   LABORATÓRIO DOS ELEMENTOS · motor da caixa
   Grade de células: cada uma tem material, temperatura (°C), forma (bloco/pó),
   vida (fogo/fumaça) e carga elétrica. A cada passo: reações com um vizinho,
   movimento (pó cai, líquido escorre, gás sobe ou desce pela massa molar),
   condução de calor e corrente elétrica.
   ========================================================================= */
'use strict';

// materiais especiais do laboratório
registrar({ chave: 'AQUECEDOR', nome: 'Placa aquecedora', formula: '—', tipo: 'especial2', cores: ['#7a2a1a'], d: 8, cp: 0.5, lam: 60, inerte: true, fixo: 0, tempFixa: 1200 });
registrar({ chave: 'RESFRIADOR', nome: 'Placa refrigerada', formula: '—', tipo: 'especial2', cores: ['#1a4a7a'], d: 8, cp: 0.5, lam: 60, inerte: true, fixo: 0, tempFixa: -120 });
registrar({ chave: 'BATERIA', nome: 'Fonte de energia (eletrodo ligado)', formula: '—', tipo: 'especial2', cores: ['#d0a020'], d: 8, cp: 0.4, lam: 100, inerte: true, fixo: 0, condutor: true, bateria: true });
registrar({ chave: 'BICO', nome: 'Bico de Bunsen (gás aceso)', formula: '—', tipo: 'especial2', cores: ['#3a4a6a'], d: 8, cp: 0.5, lam: 30, inerte: true, fixo: 0, bico: true });
registrar({ chave: 'FAISCA', nome: 'Faísca', formula: '—', tipo: 'especial', cores: [null, null, '#fff4b0'], d: 0.0003, cp: 1, lam: 0.1, fixo: 3 });
const FOGO = id('FOGO'), FUMACA = id('FUMACA'), FAISCA = id('FAISCA'), H2O = id('H2O'), PAREDE = id('Parede');

const L = { W: 0, H: 0, N: 0, AMB: 25, vel: 1, pausado: false, ventilacao: true, tick: 0, contagem: new Map(), explosoes: 0, ultimaReacao: null, eventos: [] };
let mt, T, flg, vida, carga, varc, aux, capA, kA;
// física fina (fisica.js): gás dissolvido no líquido (volumes de gás por volume de líquido, a 1 atm),
// qual gás está dissolvido, volume de gás de cada bolha, estado da bolha e o objeto rígido a que a célula pertence
let dis, disG, gv, bfl, corpo;
let estPrev, lat, matPrev; // calor latente de fusão (motor.js)
L.sondasPedidas = [];
const PO = 1, TK = 2;
function criarGrade(W, H) {
  L.W = W; L.H = H; L.N = W * H;
  mt = new Uint16Array(L.N); T = new Float32Array(L.N).fill(L.AMB); flg = new Uint8Array(L.N); vida = new Uint8Array(L.N); carga = new Uint8Array(L.N); varc = new Uint8Array(L.N); aux = new Uint16Array(L.N);
  capA = new Float32Array(L.N); kA = new Float32Array(L.N);
  dis = new Float32Array(L.N); disG = new Uint16Array(L.N); gv = new Float32Array(L.N); bfl = new Uint8Array(L.N); corpo = new Uint16Array(L.N);
  estPrev = new Uint8Array(L.N); lat = new Float32Array(L.N); matPrev = new Uint16Array(L.N);
  for (let i = 0; i < L.N; i++) varc[i] = Math.random() * 255;
}
const rnd = Math.random;
const est = i => estadoDe(MATS[mt[i]], T[i]);
// líquido com microbolhas (gv = fração de gás) fica mais leve: é o que faz a espuma de refrigerante subir
function densidade(i) { const m = mt[i]; if (m === 0) return AR_D; const M = MATS[m], s = estadoDe(M, T[i]); const d = s >= 3 ? 0.0004 : M.dens[s]; return s === 1 && gv[i] > 0 && !(bfl[i] & 1) ? d * (1 - Math.min(0.85, gv[i])) : d; }
function troca(i, j) {
  let a = mt[i]; mt[i] = mt[j]; mt[j] = a;
  let t = T[i]; T[i] = T[j]; T[j] = t;
  a = flg[i]; flg[i] = flg[j]; flg[j] = a; a = vida[i]; vida[i] = vida[j]; vida[j] = a; a = carga[i]; carga[i] = carga[j]; carga[j] = a;
  a = varc[i]; varc[i] = varc[j]; varc[j] = a; a = aux[i]; aux[i] = aux[j]; aux[j] = a;
  t = dis[i]; dis[i] = dis[j]; dis[j] = t; a = disG[i]; disG[i] = disG[j]; disG[j] = a;
  t = gv[i]; gv[i] = gv[j]; gv[j] = t; a = bfl[i]; bfl[i] = bfl[j]; bfl[j] = a; a = corpo[i]; corpo[i] = corpo[j]; corpo[j] = a;
  a = estPrev[i]; estPrev[i] = estPrev[j]; estPrev[j] = a; a = lat[i]; lat[i] = lat[j]; lat[j] = a; a = matPrev[i]; matPrev[i] = matPrev[j]; matPrev[j] = a;
}
function limparCelula(i) { mt[i] = 0; flg[i] &= TK; vida[i] = 0; carga[i] = 0; aux[i] = 0; dis[i] = 0; disG[i] = 0; gv[i] = 0; bfl[i] = 0; corpo[i] = 0; }
// pode a célula i entrar no lugar de j?
function podeEntrar(i, j) {
  const b = mt[j]; if (b === 0) return true;
  if (corpo[j]) return false;                      // objeto rígido: só se move inteiro (fisica.js)
  if (bfl[j] & 2) return false;                    // bolha grudada numa superfície
  const B = MATS[b], sb = estadoDe(B, T[j]);
  if (sb >= 3) return true;
  if (sb === 0 && !(flg[j] & PO)) return false;
  if ((bfl[j] & 1) && sb === 2 && estadoDe(MATS[mt[i]], T[i]) === 1) return rnd() < velBolha(j); // bolha sobe mais devagar quanto menor (lei de Stokes)
  if (sb === 0 && estadoDe(MATS[mt[i]], T[i]) === 0) return false; // grãos não atravessam grãos (pós misturados ficam misturados)
  return densidade(i) > densidade(j) * 1.02 && rnd() < 0.6;
}

/* ---------- passo da simulação ---------- */
let paridade = 0;
function passo() {
  paridade ^= TK; L.tick++;
  const W = L.W, H = L.H;
  for (let y = H - 1; y >= 0; y--) {
    const esq = rnd() < 0.5, base = y * W;
    for (let k = 0; k < W; k++) {
      const x = esq ? k : W - 1 - k, i = base + x, m = mt[i];
      if (m === 0) continue;
      if ((flg[i] & TK) === paridade) continue;
      flg[i] = (flg[i] & ~TK) | paridade;
      atualizar(i, x, y, m);
    }
  }
  calor(); fusaoLatente(); eletricidade();
  if (typeof fisica === 'function') fisica();
}
function atualizar(i, x, y, m) {
  const M = MATS[m];
  if (m === FOGO) return fogo(i, x, y);
  if (m === FUMACA) return fumaca(i, x, y);
  if (m === FAISCA) return faiscaVoa(i, x, y);
  if (M.bico) return bico(i, x, y);
  if (M.tempFixa !== undefined) T[i] = M.tempFixa;
  // espuma: as bolhas estouram sozinhas
  if (M.efemero && (vida[i] > 0 ? (rnd() < 0.25 && vida[i]--, false) : rnd() < M.efemero)) { /* vida = proteção da película: mais detergente, espuma mais estável */ if (M.efemeroVira && rnd() < 0.2) { mt[i] = id(M.efemeroVira); flg[i] &= TK; } else limparCelula(i); return; }
  const t = T[i];
  // materiais com o próprio oxidante (pólvora, pavio, cabeça de fósforo): queimam sem ar
  if (M.autoComb && (vida[i] > 0 || (t >= M.autoComb.ign && rnd() < M.autoComb.v))) return queimaPropria(i, x, y, M);
  // decomposição pelo calor
  if (M.decomp && t >= M.decomp[0] && rnd() < 0.02) return decompor(i, x, y, M);
  if (M.chave === 'Amalgama' && t >= 357 && rnd() < 0.02) { const metal = aux[i] || id('Hg'); mt[i] = metal; flg[i] |= PO; espalhar(i, x, y, id('Hg'), t); evento('Mercúrio evaporando da amálgama: VAPOR TÓXICO'); return; }
  const s = estadoDe(M, t);
  if (M.tipo === 'solucao' && s === 2) return ferver(i, x, y, M, t);
  // líquidos voláteis evaporam pela superfície (mais rápido quando quentes)
  if (s === 1 && M.vapor >= 0 && y > 0 && mt[i - L.W] === 0 && rnd() < M.volatil * (1 + Math.max(0, t - 25) / 25)) { const j = i - L.W; mt[j] = M.vapor; T[j] = t; flg[j] &= TK; vida[j] = 0; carga[j] = 0; if (rnd() < 0.12) { limparCelula(i); return; } }
  if (M.decompGas && s === 2) { mt[i] = id(M.decompGas[0]); espalhar(i, x, y, id(M.decompGas[1]), t); return; }
  // teste de chama: sal ou metal muito quente solta chama colorida
  if (M.chama && t > 650 && s < 2 && rnd() < 0.04) { const j = vizinhoVazio(i, x, y, true); if (j >= 0) { mt[j] = FOGO; vida[j] = 12 + rnd() * 10; T[j] = t; aux[j] = corFogo(M.chama); } }
  reagir(i, x, y, M);
  if (mt[i] !== m) return;
  if (s === 0) { if (flg[i] & PO) moverPo(i, x, y); }
  else if (s === 1) moverLiquido(i, x, y, M);
  else moverGas(i, x, y, M);
}
const DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1];
function reagir(i, x, y, M) {
  const d = (rnd() * 8) | 0, nx = x + DX[d], ny = y + DY[d];
  if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) return;
  const j = ny * L.W + nx, b = mt[j];
  const r = regra(M.id, b); if (!r || r.p <= 0) return;
  const tm = Math.max(T[i], T[j]);
  if (r.tmin != null && tm < r.tmin && !(r.faisca && (carga[i] || carga[j]))) return;
  if (r.tmax != null && tm > r.tmax) return;
  if (r.soPo && !(flg[i] & PO) && !(r.ignBloco && tm >= r.ignBloco)) return;
  if (r.precisaLiquidoA && estadoDe(M, T[i]) !== 1) return;
  if (r.combustao && b !== 0 && MATS[b].simb !== 'O') return;
  if (rnd() > r.p * L.velReacao) return;
  aplicar(r, i, j, x, y);
}
L.velReacao = 1;
function aplicar(r, i, j, x, y) {
  const pa = r.pa, pb = r.pb;
  if (!MATS[pa] || (pb !== undefined && !MATS[pb])) return; // produto desconhecido: não reage (nunca deixa a grade com lixo)
  mt[i] = pa; if (pb !== undefined) mt[j] = pb;
  for (const [c, p, extra] of [[i, pa, r.poA], [j, pb, r.poB]]) {
    if (p === undefined) continue;
    if (p === 0) { limparCelula(c); continue; }
    const P = MATS[p]; if (extra || P.po) flg[c] |= PO; else if (P.tipo === 'solucao' || estadoDe(P, T[c]) > 0) flg[c] &= ~PO;
    if (p !== FOGO) vida[c] = 0;
  }
  if (r.tA != null) T[i] = Math.max(T[i], r.tA); if (r.tB != null) T[j] = Math.max(T[j], r.tB);
  // reações muito quentes (termite, explosões) esquentam a vizinhança: é o que faz a frente de reação andar sozinha
  const tq = Math.max(r.tA || 0, r.tB || 0); if (tq >= 1500) for (const d of [-1, 1, -L.W, L.W]) { const n = i + d; if (n >= 0 && n < L.N && mt[n]) T[n] = Math.max(T[n], tq * 0.6); }
  if (r.dT) { T[i] += r.dT; if (pb) T[j] += r.dT; }
  if (pa === FOGO) { vida[i] = 20 + rnd() * 25; aux[i] = corFogo(r.fogo || '#ff8a1a'); T[i] = Math.max(T[i], 900); }
  if (pb === FOGO) { vida[j] = 20 + rnd() * 25; aux[j] = corFogo(r.fogo || '#ff8a1a'); T[j] = Math.max(T[j], r.tB || 1000); }
  if (r.auxA) aux[i] = r.auxA; if (r.auxB) aux[j] = r.auxB;
  if (typeof gasNoLiquido === 'function') { gasNoLiquido(i, x, y); if (pb !== undefined) gasNoLiquido(j, j % L.W, (j / L.W) | 0); }
  if (r.extra >= 0 && r.extra !== undefined) { if (!(typeof dissolverExtra === 'function' && dissolverExtra(i, x, y, r.extra))) espalhar(i, x, y, r.extra, T[i]); }
  if (r.gasB) { const g = id('OsO4'); if (g >= 0) espalhar(i, x, y, g, T[i]); }
  if (r.explosao && (r.explosaoChance == null || rnd() < r.explosaoChance)) explosao(x, y, r);
  if (r.faiscas && rnd() < 0.35) soltarFaisca(x + (rnd() < 0.5 ? -1 : 1), y - 1, (rnd() * 5 | 0) - 2, -2, 6 + rnd() * 14);
  const rc = canonico(r), n = (L.contagem.get(rc) || 0) + 1; L.contagem.set(rc, n); L.ultimaReacao = rc;
  if (n === 1) evento('Nova reação: ' + rc.nome, rc);
}
const CANON = new Map();
function canonico(r) { const k = r.nome + '|' + (r.eq || ''); let c = CANON.get(k); if (!c) { CANON.set(k, r); c = r; } return c; }
// coloca um material num vizinho vazio (gás que sai de uma reação, etc.)
function vizinhoVazio(i, x, y, emCima) {
  for (let t = 0; t < 6; t++) { const d = emCima ? [0, 1, 2, 3, 4][(rnd() * 5) | 0] : (rnd() * 8) | 0; const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) continue; const j = ny * L.W + nx; if (mt[j] === 0) return j; }
  return -1;
}
function espalhar(i, x, y, matId, temp) { const j = vizinhoVazio(i, x, y, false); if (j < 0 || matId < 0) return; mt[j] = matId; T[j] = temp; flg[j] = (flg[j] & TK) | (MATS[matId].po ? PO : 0); vida[j] = 0; }
function decompor(i, x, y, M) {
  const [, p1, p2] = M.decomp; const a = id(p1), b = id(p2);
  if (a >= 0) { mt[i] = a; flg[i] |= PO; } else limparCelula(i);
  if (b >= 0) espalhar(i, x, y, b, T[i]);
  registrarDecomp(M);
}
const decompVistas = new Map();
function registrarDecomp(M) {
  const k = 'decomp:' + M.chave; if (decompVistas.has(k)) { decompVistas.get(k).n++; return; }
  const [t, p1, p2] = M.decomp, r = { nome: `Decomposição: ${M.nome}`, eq: M.decompEq || `${fmt(M.formula)} → ${fmt(mat(p1) ? mat(p1).formula : p1)}${p2 ? ' + ' + fmt(mat(p2) ? mat(p2).formula : p2) : ''}`, nota: `Acima de ~${t} °C se quebra em substâncias mais simples.`, n: 1 };
  decompVistas.set(k, r); L.contagem.set(r, 1); evento('Nova reação: ' + r.nome, r);
}
function ferver(i, x, y, M, t) {
  // a água vira vapor; o que estava dissolvido fica para trás (ou sai como gás)
  if (rnd() < 0.5) { mt[i] = H2O; flg[i] &= ~PO; return; }
  let resto = -1;
  if (M.chave === 'aq:Sacarose') resto = id('Sacarose');
  else if (M.cat === 'H') resto = { Cl: id('HCl'), Br: id('HBr'), I: id('HI'), F: id('HF'), NO3: id('NO2'), CO3: id('CO2'), SO3: id('SO2'), SO4: id('H2SO4'), PO4: id('H3PO4'), CH3COO: -1, BO3: -1 }[M.an];
  else if (M.cat === 'NH4' && M.an === 'OH') resto = id('NH3');
  else if (M.cat) resto = M.base ? (POR_CHAVE.has(formulaSal(M.cat, 'OH')) ? id(formulaSal(M.cat, 'OH')) : sal(M.cat, 'OH')) : sal(M.cat, M.an);
  if (resto >= 0) { mt[i] = resto; flg[i] |= PO; } else { mt[i] = H2O; }
}
const coresFogo = [], idxFogo = new Map();
function corFogo(hex) { if (idxFogo.has(hex)) return idxFogo.get(hex); const k = coresFogo.length; coresFogo.push(hexRgb(hex)); idxFogo.set(hex, k); return k; }
corFogo('#ff8a1a');
function fogo(i, x, y) {
  if (vida[i] <= 1) { if (rnd() < 0.35) { mt[i] = FUMACA; vida[i] = 60 + rnd() * 80; } else limparCelula(i); return; }
  vida[i]--; T[i] = Math.max(T[i] * 0.985, 400 + vida[i] * 25);
  // a chama esquenta o que ela toca (convecção e radiação)
  for (const d of [-L.W, -1, 1, L.W]) { const n = i + d; if (n < 0 || n >= L.N) continue; const b = mt[n]; if (b && b !== FOGO && b !== FUMACA && b !== FAISCA && !MATS[b].inerte && MATS[b].tempFixa === undefined && T[n] < T[i]) { const B = MATS[b], cap = B.capacidade[Math.min(2, estadoDe(B, T[n]))] || 1; T[n] += Math.min((T[i] - T[n]) * 0.04, 5 / cap); } }
  // sobe tremulando
  const d = [0, 1, 2][(rnd() * 3) | 0], nx = x + DX[d], ny = y + DY[d];
  if (ny >= 0 && nx >= 0 && nx < L.W) { const j = ny * L.W + nx; if (mt[j] === 0) troca(i, j); }
}
// faísca: guarda a velocidade (−2…2 em x e y) em aux; a gravidade puxa para baixo
function soltarFaisca(x, y, vx, vy, vida0) {
  if (x < 0 || y < 0 || x >= L.W || y >= L.H) return false;
  const i = y * L.W + x; if (mt[i] !== 0) return false;
  vx = Math.max(-2, Math.min(2, vx | 0)); vy = Math.max(-2, Math.min(2, vy | 0));
  mt[i] = FAISCA; vida[i] = Math.max(2, Math.min(40, vida0 | 0)); aux[i] = (vx + 2) * 5 + (vy + 2); T[i] = 1400; carga[i] = 0; flg[i] &= TK;
  return true;
}
function emitirFaiscas(cx, cy, n, forca = 1) {
  let k = 0;
  for (let t = 0; t < n * 3 && k < n; t++) {
    const ang = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.7, v = (0.8 + rnd() * 1.5) * forca;
    if (soltarFaisca(cx + Math.round((rnd() - 0.5) * 3), cy + Math.round((rnd() - 0.5) * 3), Math.round(Math.cos(ang) * v * 1.3), Math.round(Math.sin(ang) * v * 1.3), 6 + rnd() * 18)) k++;
  }
  return k;
}
function faiscaVoa(i, x, y) {
  if (vida[i] <= 1) { limparCelula(i); return; }
  vida[i]--;
  let vx = ((aux[i] / 5) | 0) - 2, vy = (aux[i] % 5) - 2;
  if ((L.tick + i) % 3 === 0 && vy < 2) vy++; // gravidade
  if (rnd() < 0.15) vx += rnd() < 0.5 ? -1 : 1; // tremida
  vx = Math.max(-2, Math.min(2, vx)); aux[i] = (vx + 2) * 5 + (vy + 2);
  const sx = vx && rnd() < Math.abs(vx) / 2 ? Math.sign(vx) : 0, sy = vy && rnd() < Math.abs(vy) / 2 ? Math.sign(vy) : 0;
  if (!sx && !sy) return;
  const nx = x + sx, ny = y + sy;
  if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) { limparCelula(i); return; }
  const j = ny * L.W + nx, b = mt[j];
  if (b === 0) { troca(i, j); return; }
  if (b === FAISCA || b === FOGO || b === FUMACA) return;
  // bateu em algo: esquenta aquele ponto (é isso que acende gás, álcool, pó de metal…)
  const B = MATS[b];
  if (!B.inerte && B.tempFixa === undefined) T[j] = Math.max(T[j], 650 + vida[i] * 45);
  vida[i] = Math.min(vida[i], 2);
}
function fumaca(i, x, y) {
  if (vida[i] <= 1) { limparCelula(i); return; }
  vida[i]--;
  if (rnd() < 0.5) { const d = [0, 1, 2, 3, 4][(rnd() * 5) | 0], nx = x + DX[d], ny = y + DY[d]; if (ny >= 0 && nx >= 0 && nx < L.W) { const j = ny * L.W + nx; if (mt[j] === 0) troca(i, j); } }
  if (y === 0 && L.ventilacao) limparCelula(i);
}
function moverPo(i, x, y) {
  const W = L.W; if (y + 1 >= L.H) return;
  const b = i + W; if (podeEntrar(i, b)) return troca(i, b);
  const dir = rnd() < 0.5 ? -1 : 1;
  for (const dd of [dir, -dir]) { const nx = x + dd; if (nx < 0 || nx >= W) continue; if (podeEntrar(i, b + dd) && mt[i + dd] === 0) return troca(i, b + dd); }
}
function moverLiquido(i, x, y, M) {
  const W = L.W;
  if (y + 1 < L.H) {
    const b = i + W; if (podeEntrar(i, b)) return troca(i, b);
    const dir = rnd() < 0.5 ? -1 : 1;
    for (const dd of [dir, -dir]) { const nx = x + dd; if (nx >= 0 && nx < W && podeEntrar(i, b + dd)) return troca(i, b + dd); }
  }
  // espalha para os lados (líquidos viscosos espalham menos)
  const dir = rnd() < 0.5 ? -1 : 1, alcance = M.viscoso ? 1 : 3;
  for (let k = 1; k <= alcance; k++) { const nx = x + dir * k; if (nx < 0 || nx >= W) return; const j = i + dir * k; if (mt[j] === 0) { if (k === alcance || rnd() < 0.5) return troca(i, j); continue; } if (podeEntrar(i, j)) return troca(i, j); return; }
}
function moverGas(i, x, y, M) {
  const W = L.W, dm = densidade(i), leve = dm < AR_D;
  if (y === 0 && L.ventilacao && rnd() < 0.08) { limparCelula(i); return; } // escapa pela ventilação
  // gravidade x difusão: quanto mais pesado (ou leve) que o ar, mais ele tende a descer (ou subir), mas sempre se mistura um pouco
  const lr = Math.log(Math.max(1e-4, dm) / AR_D), desce = 0.5 + 0.25 * Math.sign(lr) * Math.tanh(lr * lr / 3); let dy = rnd() < desce ? 1 : -1; // pouca diferença (gás de cozinha, CO₂): mistura bastante; muita (vapor de gasolina, hidrogênio): escorre ou sobe
  const dx = (rnd() * 3 | 0) - 1, nx = x + dx, ny = y + (rnd() < 0.7 ? dy : 0);
  if (nx < 0 || ny < 0 || nx >= W || ny >= L.H) return;
  const j = ny * W + nx, b = mt[j];
  if (b === 0) return troca(i, j);
  const B = MATS[b], sb = estadoDe(B, T[j]);
  if (sb >= 3) return troca(i, j);
  if (sb === 2 && b !== mt[i]) { const db = densidade(j); if ((ny < y && dm < db) || (ny > y && dm > db) || rnd() < 0.25) return troca(i, j); }
}
function explosao(x, y, r) {
  L.explosoes++;
  const R = 6;
  for (let k = 0; k < 10; k++) { const a = rnd() * Math.PI * 2; soltarFaisca(x + Math.round(Math.cos(a) * (R + 1)), y + Math.round(Math.sin(a) * (R + 1)), Math.round(Math.cos(a) * 2), Math.round(Math.sin(a) * 2) - 1, 8 + rnd() * 14); }
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) continue;
    const d = Math.hypot(dx, dy); if (d > R) continue; const j = ny * L.W + nx;
    T[j] = Math.max(T[j], 300 + (1 - d / R) * 900); // a onda de calor não se acumula sem fim
    if (mt[j] === 0 && rnd() < 0.3 * (1 - d / R)) { mt[j] = FOGO; vida[j] = 8 + rnd() * 10; aux[j] = corFogo(r.fogo || '#ffd27a'); T[j] = 1500; }
    else if (mt[j] && (flg[j] & PO || est(j) > 0) && rnd() < 0.5) { const tx = nx + Math.sign(dx) * 2, ty = ny + Math.sign(dy) * 2; if (tx >= 0 && ty >= 0 && tx < L.W && ty < L.H) { const k = ty * L.W + tx; if (mt[k] === 0) troca(j, k); } }
  }
}

/* ---------- queima própria (oxidante embutido) ---------- */
const R_AUTO = new Map();
function queimaPropria(i, x, y, M) {
  const a = M.autoComb;
  for (const d of [-1, 1, -L.W, L.W, -L.W - 1, -L.W + 1]) { const n = i + d; if (n >= 0 && n < L.N && mt[n] && !MATS[mt[n]].inerte && MATS[mt[n]].tempFixa === undefined) T[n] = Math.max(T[n], a.viz); }
  // cada pedaço queima por um tempinho (brasa), esquentando os vizinhos o tempo todo: é isso que faz a chama andar sem apagar
  if (vida[i] === 0 && (a.dur || 1) > 1) { vida[i] = a.dur; T[i] = Math.max(T[i], a.viz); }
  if (vida[i] > 1) { vida[i]--; T[i] = Math.max(T[i], a.viz); if (rnd() < 0.3) { const j = vizinhoVazio(i, x, y, true); if (j >= 0) { mt[j] = rnd() < 0.6 ? FOGO : FUMACA; vida[j] = mt[j] === FOGO ? 6 + rnd() * 8 : 50 + rnd() * 60; aux[j] = mt[j] === FOGO ? corFogo(a.fogo || '#ffb040') : 0; T[j] = 1100; } } return; }
  vida[i] = 0;
  const v = a.vira ? id(a.vira) : -1;
  if (v > 0) { mt[i] = v; flg[i] |= PO; T[i] = Math.max(T[i], 700); } else limparCelula(i);
  for (let k = 0; k < (a.fumaca || 0); k++) { const j = vizinhoVazio(i, x, y, true); if (j < 0) break; if (rnd() < 0.5) { mt[j] = FOGO; vida[j] = 10 + rnd() * 14; aux[j] = corFogo(a.fogo || '#ffb040'); T[j] = 1300; } else { mt[j] = FUMACA; vida[j] = 70 + rnd() * 90; T[j] = 400; } }
  if (a.faiscas && rnd() < 0.45) soltarFaisca(x + (rnd() < 0.5 ? -1 : 1), y - 1, (rnd() * 5 | 0) - 2, -2, 6 + rnd() * 12);
  let r = R_AUTO.get(M.id); if (!r) { r = { nome: `Queima: ${M.nome}`, eq: a.eq, nota: a.nota }; R_AUTO.set(M.id, r); }
  const n = (L.contagem.get(r) || 0) + 1; L.contagem.set(r, n); if (n === 1) evento('Nova reação: ' + r.nome, r);
}
/* ---------- bico de Bunsen: chama azul de gás que esquenta o que estiver em cima ---------- */
function bico(i, x, y) {
  if (!temO2()) return;
  for (let k = 1; k <= 5; k++) {
    const yy = y - k; if (yy < 0) return;
    const j = yy * L.W + x, b = mt[j];
    if (b === 0) { if (rnd() < 0.35) { mt[j] = FOGO; vida[j] = 3 + k * 3 + rnd() * 5; aux[j] = corFogo('#5aa8ff'); T[j] = 1500; flg[j] &= TK; } continue; }
    if (b === FOGO || b === FUMACA || b === FAISCA || MATS[b].bico) continue;
    if (!MATS[b].inerte) { const B = MATS[b], cap = B.capacidade[Math.min(2, estadoDe(B, T[j]))] || 1; T[j] += Math.min(1500 - T[j], 16 / cap); } // fluxo de calor limitado: a chama não esquenta o vidro mais rápido do que a água leva embora
    return;
  }
}
/* ---------- chama de fósforo (ferramenta) ---------- */
function chama(cx, cy, r) {
  let n = 0;
  noRaio(cx, cy, r, i => {
    if (mt[i] === 0) { if (temO2() && rnd() < 0.45) { mt[i] = FOGO; vida[i] = 8 + rnd() * 12; aux[i] = corFogo('#ffb040'); T[i] = 900; } }
    else if (mt[i] !== FOGO && mt[i] !== FUMACA && mt[i] !== FAISCA && !MATS[mt[i]].inerte && MATS[mt[i]].tempFixa === undefined) { T[i] += (850 - T[i]) * 0.12; n++; }
  });
  return n;
}
function colocarPalito(cx, cy) {
  const mad = id('Madeira'), cab = id('CabecaFosforo');
  for (let k = 0; k < 10; k++) { put(cx, cy + k, mad, false); put(cx + 1, cy + k, mad, false); }
  for (const [dx, dy] of [[0, -1], [1, -1], [0, -2], [1, -2], [-1, -1], [2, -1]]) put(cx + dx, cy + dy, cab, false);
}
/* ---------- calor latente de fusão: derreter e congelar "gastam" calor (a temperatura para no ponto de fusão) ---------- */
function calLatente(M, sobe, s0) {
  const agua = M.chave === 'H2O' || M.comoAgua || M.tipo === 'solucao';
  const MM = M.Mgas || M.M || 60;
  const lf = agua ? 334 : 8.3 * ((M.pf ?? 0) + 273.15) / (M.M || MM);        // regra de Richards
  const lv = agua ? 2257 : 88 * ((M.pe ?? 100) + 273.15) / MM;              // regra de Trouton
  if (M.sublima) return Math.max(20, lf + lv);
  const f = sobe ? s0 : s0 - 1;
  return Math.max(20, f === 0 ? lf : lv);
}
function fronteira(M, sobe, s0) { if (M.sublima) return M.pe; const f = sobe ? s0 : s0 - 1; return f === 0 ? M.pf : M.pe; }
// só derreter/congelar (e sublimar): ferver fica com fisica.js, que já tem o calor latente de vaporização
function fusaoLatente() {
  for (let i = 0; i < L.N; i++) {
    const m = mt[i]; if (!m) continue;
    const M = MATS[m];
    if (M.fixo !== undefined || M.tempFixa !== undefined || M.pf == null || M.tipo === 'especial') { matPrev[i] = m; continue; }
    const s = estadoDe(M, T[i]);
    if (matPrev[i] !== m) { matPrev[i] = m; estPrev[i] = s; lat[i] = 0; continue; }
    const s0 = estPrev[i], cp = M.cpv || 1;
    if (s === s0) {
      if (lat[i] === 0) continue;
      const sobe = lat[i] > 0, tb = fronteira(M, sobe, s0); if (tb == null) { lat[i] = 0; continue; }
      const Lx = calLatente(M, sobe, s0), dT = sobe ? tb - T[i] : T[i] - tb;
      const f = Math.abs(lat[i]) - Math.max(0, dT) * cp / Lx;
      if (f > 0) { lat[i] = sobe ? f : -f; T[i] = sobe ? tb - 0.01 : tb + 0.01; }
      else { lat[i] = 0; T[i] = sobe ? tb + f * Lx / cp : tb - f * Lx / cp; }
      continue;
    }
    const sobe = s > s0, tb = fronteira(M, sobe, s0);
    if (tb == null || (!M.sublima && ((sobe && s0 >= 1) || (!sobe && s0 === 2)))) { estPrev[i] = s; lat[i] = 0; continue; }
    const Lx = calLatente(M, sobe, s0), dT = sobe ? T[i] - tb : tb - T[i];
    const f = (sobe ? Math.max(0, lat[i]) : Math.max(0, -lat[i])) + Math.max(0, dT) * cp / Lx;
    if (f >= 1) { const sobra = (f - 1) * Lx / cp; T[i] = sobe ? tb + 0.01 + sobra : tb - 0.01 - sobra; lat[i] = 0; estPrev[i] = M.sublima ? (sobe ? 2 : 0) : s0 + (sobe ? 1 : -1); }
    else { lat[i] = sobe ? f : -f; T[i] = sobe ? tb - 0.01 : tb + 0.01; }
  }
}
/* ---------- calor ---------- */
function calor() {
  const W = L.W, H = L.H, N = L.N, amb = L.AMB;
  for (let i = 0; i < N; i++) {
    const m = mt[i];
    if (m === 0) { capA[i] = 0.0012; kA[i] = 0.06; continue; }
    const M = MATS[m], s = estadoDe(M, T[i]);
    capA[i] = s >= 3 ? 0.002 : M.capacidade[s]; kA[i] = s === 2 ? 0.08 : s >= 3 ? 0.25 : (s === 0 && (flg[i] & PO)) ? M.k * 0.15 : M.k; // pó tem ar entre os grãos: conduz bem menos calor que o bloco
  }
  const lado = (L.tick & 1);
  for (let y = 0; y < H; y++) {
    const base = y * W;
    for (let x = 0; x < W; x++) {
      const i = base + x;
      if (x + 1 < W) troca_calor(i, i + 1);
      if (y + 1 < H) troca_calor(i, i + W);
      // o ar volta devagar para a temperatura ambiente; bordas da caixa também
      if (mt[i] === 0) T[i] += (amb - T[i]) * 0.02;
      else if (x === 0 || y === 0 || x === W - 1 || y === H - 1) T[i] += (amb - T[i]) * 0.003;
    }
  }
  function troca_calor(i, j) {
    const dT = T[j] - T[i]; if (dT > -0.01 && dT < 0.01) return;
    const k = (kA[i] < kA[j] ? kA[i] : kA[j]) * 0.25, ci = capA[i], cj = capA[j], c = ci < cj ? ci : cj;
    const e = dT * k * c; T[i] += e / ci; T[j] -= e / cj;
  }
}
/* ---------- eletricidade ---------- */
function conduz(i) {
  const m = mt[i]; if (!m) return false; const M = MATS[m], s = estadoDe(M, T[i]);
  if (M.bateria) return true;
  if (M.tipo === 'solucao') return M.eletrolito && s === 1;
  if (M.ionico && s === 1) return true; // sal derretido conduz
  if (M.condutor && s < 2) return !M.semicondutor || T[i] > 200; // semicondutores conduzem melhor quentes
  return false;
}
function eletricidade() {
  const W = L.W, H = L.H;
  if (L.tick % 6 === 0) for (let i = 0; i < L.N; i++) if (mt[i] && MATS[mt[i]].bateria) carga[i] = 4;
  for (let i = 0; i < L.N; i++) {
    if (carga[i] !== 4) continue;
    const x = i % W, y = (i / W) | 0;
    for (let d = 0; d < 8; d++) {
      const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (carga[j] === 0 && conduz(j)) carga[j] = 5; // 5 = vai virar ativo no próximo passo (evita atravessar tudo de uma vez)
      else if (mt[j] && carga[j] === 0) { const M = MATS[mt[j]]; if (estadoDe(M, T[j]) === 2 || mt[j] === 0) carga[j] = 2; } // gás ao redor brilha (descarga)
      else if (mt[j] === 0 && MATS[mt[i]].condutor && MATS[mt[i]].tipo !== 'solucao' && rnd() < 0.004) soltarFaisca(nx, ny, (rnd() * 5 | 0) - 2, -1, 3 + rnd() * 5); // arco: faisquinha no ar
    }
    efeitoCorrente(i, x, y);
  }
  for (let i = 0; i < L.N; i++) { if (carga[i] === 5) carga[i] = 4; else if (carga[i] > 0 && carga[i] !== 4) carga[i]--; else if (carga[i] === 4 && !(mt[i] && MATS[mt[i]].bateria)) carga[i] = 3; }
}
function efeitoCorrente(i, x, y) {
  const M = MATS[mt[i]];
  // eletrólise de soluções: sai hidrogênio, oxigênio ou cloro
  if (M.tipo === 'solucao' && rnd() < 0.03) {
    const g = rnd() < 0.6 ? id('H') : (M.an === 'Cl' ? id('Cl') : id('O'));
    mt[i] = g; carga[i] = 0; T[i] = Math.max(T[i], L.AMB);
    if (!L.contagem.has(R_ELETROLISE)) evento('Nova reação: ' + R_ELETROLISE.nome, R_ELETROLISE);
    L.contagem.set(R_ELETROLISE, (L.contagem.get(R_ELETROLISE) || 0) + 1);
    return;
  }
  // sal derretido: eletrólise ígnea (é assim que se produz sódio e alumínio)
  if (M.ionico && M.ions && estadoDe(M, T[i]) === 1 && rnd() < 0.02) {
    const metal = id(simbCat(M.ions[0])), g = M.ions[1] === 'Cl' ? id('Cl') : M.ions[1] === 'F' ? id('F') : id('O');
    mt[i] = rnd() < 0.5 && metal >= 0 ? metal : g; carga[i] = 0;
    if (!L.contagem.has(R_IGNEA)) evento('Nova reação: ' + R_IGNEA.nome, R_IGNEA);
    L.contagem.set(R_IGNEA, (L.contagem.get(R_IGNEA) || 0) + 1);
    return;
  }
  if (M.condutor && !M.bateria) T[i] += (flg[i] & PO) ? 9 : 0.4; // efeito Joule: fio fino (pó, palha de aço) tem resistência alta e esquenta muito mais
}
const R_ELETROLISE = { nome: 'Eletrólise', eq: '2 H₂O → 2 H₂↑ + O₂↑  (com cloreto: 2 Cl⁻ → Cl₂↑)', nota: 'A corrente quebra a água: hidrogênio num eletrodo e oxigênio (ou cloro) no outro. Água pura quase não conduz; precisa de íons dissolvidos.' };
const R_IGNEA = { nome: 'Eletrólise ígnea (sal derretido)', eq: '2 NaCl(l) → 2 Na + Cl₂↑', nota: 'Sais derretidos conduzem eletricidade. É assim que a indústria produz sódio, magnésio e alumínio.' };

/* ---------- ferramentas ---------- */
function noRaio(cx, cy, r, fn) { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r + r) continue; const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= L.W || y >= L.H) continue; fn(y * L.W + x, x, y); } }
function pincel(cx, cy, r, matId, opc) {
  const M = MATS[matId];
  noRaio(cx, cy, r, i => {
    if (mt[i] && !opc.substituir) return;
    if (opc.chance && rnd() > opc.chance) return;
    mt[i] = matId; T[i] = opc.temp ?? (M.tempFixa ?? L.AMB); vida[i] = 0; carga[i] = 0; aux[i] = 0; dis[i] = 0; disG[i] = 0; gv[i] = 0; bfl[i] = 0; corpo[i] = 0;
    const s = estadoDe(M, T[i]);
    const objeto = s === 0 && opc.corpo && (opc.forma === 'objeto' || (opc.forma === 'auto' && M.objeto));
    const po = !objeto && (opc.forma === 'po' ? true : opc.forma === 'bloco' || opc.forma === 'objeto' ? false : !!M.po);
    flg[i] = (flg[i] & TK) | (po && s === 0 ? PO : 0);
    if (objeto) corpo[i] = opc.corpo;
    if (M.gasDis && s === 1) { disG[i] = id(M.gasDis[0]); dis[i] = M.gasDis[1]; }
  });
}
function apagar(cx, cy, r) { noRaio(cx, cy, r, i => limparCelula(i)); }
function aquecer(cx, cy, r, delta) { noRaio(cx, cy, r, i => { T[i] = Math.max(-273.15, Math.min(6000, T[i] + delta)); }); }
function definirTemp(cx, cy, r, t) { noRaio(cx, cy, r, i => { if (mt[i]) T[i] = t; }); }
function faisca(cx, cy, r) {
  let eletr = 0;
  noRaio(cx, cy, r, i => { if (conduz(i)) { carga[i] = 4; eletr++; } });
  const i = cy * L.W + cx;
  if (!eletr && mt[i] && !MATS[mt[i]].inerte && MATS[mt[i]].tempFixa === undefined && mt[i] !== FAISCA) T[i] = Math.max(T[i], 1500); // dentro de um gás ou líquido: o ponto da faísca esquenta
  emitirFaiscas(cx, cy, eletr ? 2 : 5, eletr ? 0.7 : 1);
  return eletr;
}
function ima(cx, cy, r) {
  let n = 0;
  noRaio(cx, cy, r, (i, x, y) => {
    const m = mt[i]; if (!m) return; const M = MATS[m]; if (M.curie === undefined || T[i] >= M.curie) return;
    if (!(flg[i] & PO) && estadoDe(M, T[i]) === 0) return;
    const sx = Math.sign(cx - x), sy = Math.sign(cy - y); if (!sx && !sy) return;
    const j = (y + sy) * L.W + (x + sx); if (mt[j] === 0 || (estadoDe(MATS[mt[j]], T[j]) > 0)) { troca(i, j); n++; }
  });
  return n;
}
function martelo(cx, cy, r) {
  const res = { quebrou: new Set(), resistiu: new Set(), acendeu: false };
  noRaio(cx, cy, r, (i, x, y) => {
    const m = mt[i]; if (!m) return; const M = MATS[m];
    if (M.chave === 'CabecaFosforo') { for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) continue; const k = mt[ny * L.W + nx]; if (k && MATS[k].chave === 'FosforoVermelho') { T[i] = Math.max(T[i], 450); res.acendeu = true; break; } } return; } if (estadoDe(M, T[i]) !== 0 || flg[i] & PO || M.inerte || M.tempFixa !== undefined) return;
    if (M.fragil || (M.mohs !== undefined && M.mohs !== null && M.mohs < 1.5 && !M.metal)) { flg[i] |= PO; res.quebrou.add(M.nome); }
    else res.resistiu.add(M.nome);
  });
  return res;
}
function geiger(cx, cy, r) { let n = 0; noRaio(cx, cy, r, i => { const m = mt[i]; if (m && MATS[m].radio) n += MATS[m].radio; }); return n; }
function coletar(cx, cy, r, amostra, max) {
  let n = 0;
  noRaio(cx, cy, r, i => {
    const m = mt[i]; if (!m || m === FOGO || m === FUMACA || m === FAISCA || MATS[m].inerte || MATS[m].tempFixa !== undefined) return;
    if (amostra.total >= max) return;
    const a = amostra.mapa.get(m) || { id: m, celulas: 0, somaT: 0 }; a.celulas++; a.somaT += T[i]; amostra.mapa.set(m, a); amostra.total++; limparCelula(i); n++;
  });
  return n;
}
function celula(x, y) { if (x < 0 || y < 0 || x >= L.W || y >= L.H) return null; const i = y * L.W + x; return { i, m: mt[i], t: T[i], po: !!(flg[i] & PO), carga: carga[i] }; }
function evento(txt, r) { L.eventos.push({ txt, r, t: performance.now() }); if (L.eventos.length > 30) L.eventos.shift(); }

/* ---------- desenho ---------- */
let img = null, img32 = null, telaGrade = null;
const FUNDO = [18, 22, 30];
function corpoNegro(t) { // cor aproximada do brilho por temperatura (incandescência)
  if (t < 800) return [120 + (t - 500) * 0.4, 10, 0];
  if (t < 1100) return [255, 60 + (t - 800) * 0.4, 10];
  if (t < 1600) return [255, 180 + (t - 1100) * 0.12, 60 + (t - 1100) * 0.2];
  return [255, 245, Math.min(255, 160 + (t - 1600) * 0.1)];
}
function desenharGrade(ctx2) {
  const W = L.W, H = L.H;
  if (!telaGrade || telaGrade.width !== W || telaGrade.height !== H) { telaGrade = document.createElement('canvas'); telaGrade.width = W; telaGrade.height = H; img = telaGrade.getContext('2d').createImageData(W, H); img32 = new Uint32Array(img.data.buffer); }
  const piscar = (L.tick >> 2) & 1;
  for (let i = 0; i < L.N; i++) {
    const m = mt[i], t = T[i];
    let r, g, b;
    if (m === 0) {
      r = FUNDO[0]; g = FUNDO[1]; b = FUNDO[2];
      if (t > 80) { const k = Math.min(1, (t - 80) / 900) * 0.35; r += (255 - r) * k; g += (120 - g) * k * 0.6; }
      if (carga[i] === 2) { r = 90; g = 90; b = 140; }
    } else if (m === FOGO) {
      const c = coresFogo[aux[i]] || [255, 140, 30], k = Math.min(1, vida[i] / 25) * (0.75 + rnd() * 0.25);
      r = FUNDO[0] + (c[0] - FUNDO[0]) * k; g = FUNDO[1] + (c[1] - FUNDO[1]) * k; b = FUNDO[2] + (c[2] - FUNDO[2]) * k;
    } else if (m === FAISCA) {
      const k = Math.min(1, vida[i] / 14), f = 0.85 + rnd() * 0.15;
      r = 255 * f; g = (150 + 105 * k) * f; b = (40 + 190 * k * k) * f;
    } else if (m === FUMACA) {
      const k = Math.min(0.7, vida[i] / 120); r = FUNDO[0] + (90 - FUNDO[0]) * k; g = FUNDO[1] + (90 - FUNDO[1]) * k; b = FUNDO[2] + (96 - FUNDO[2]) * k;
    } else {
      const M = MATS[m], s = estadoDe(M, t), c = M.rgb[s] || M.rgb[0], v = (varc[i] - 128) / 14;
      r = c[0] + v; g = c[1] + v; b = c[2] + v;
      if (s === 2 && (bfl[i] & 1)) { // bolha dentro do líquido: borda clara, maior = mais clara
        const k = 0.35 + 0.45 * Math.min(1, gv[i]), L2 = corLiquidoEmVolta(i);
        r = L2[0] + (235 - L2[0]) * k; g = L2[1] + (242 - L2[1]) * k; b = L2[2] + (255 - L2[2]) * k;
      } else if (s === 2) { // gás: translúcido e granulado
        const a = (varc[i] & 3) === 0 ? 0.75 : 0.4;
        r = FUNDO[0] + (r - FUNDO[0]) * a; g = FUNDO[1] + (g - FUNDO[1]) * a; b = FUNDO[2] + (b - FUNDO[2]) * a;
        if (carga[i] && M.descarga) { const d = hexRgb(M.descarga); r = d[0]; g = d[1]; b = d[2]; }
      } else if (s === 1) { const o = ((i + L.tick) % 7 === 0) ? 10 : 0; r += o; g += o; b += o; if (gv[i] > 0.01 && !(bfl[i] & 1)) { const k = Math.min(0.75, gv[i] * 1.2) * (0.8 + (varc[i] & 7) / 30); r += (240 - r) * k; g += (238 - g) * k; b += (230 - b) * k; } }
      if (flg[i] & PO && s === 0) { const o = (varc[i] & 1) ? -14 : 6; r += o; g += o; b += o; }
      if (t > 500 && s < 2) { const k = Math.min(0.9, (t - 500) / 1300), c2 = corpoNegro(t); r += (c2[0] - r) * k; g += (c2[1] - g) * k; b += (c2[2] - b) * k; }
      if (t < -60 && s < 2) { r += (190 - r) * 0.18; g += (225 - g) * 0.18; b += (255 - b) * 0.18; }
      if (carga[i] >= 3 && s < 2) { r += (255 - r) * 0.55; g += (250 - g) * 0.55; b += (170 - b) * 0.4 * piscar; }
      if (M.radio >= 3 && (varc[i] + L.tick * 7) % 97 === 0) { r = 120; g = 255; b = 140; }
    }
    img32[i] = (255 << 24) | (Math.max(0, Math.min(255, b)) << 16) | (Math.max(0, Math.min(255, g)) << 8) | Math.max(0, Math.min(255, r));
  }
  telaGrade.getContext('2d').putImageData(img, 0, 0);
  ctx2.imageSmoothingEnabled = false;
  return telaGrade;
}

/* ---------- experimentos prontos ---------- */
const EXP = {
  bequer(x0, y0, w, h, mat = 'Vidro') { const v = id(mat); for (let y = y0; y <= y0 + h; y++) for (const x of [x0, x0 + w]) put(x, y, v, false); for (let x = x0; x <= x0 + w; x++) put(x, y0 + h, v, false); },
  // objeto rígido (elipse) de um material: boia ou afunda inteiro
  objeto(cx, cy, r, chave, temp) { const m = typeof chave === 'number' ? chave : id(chave), c = novoCorpoId(), ry = Math.max(1, r * 0.8); for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) for (let dx = -r; dx <= r; dx++) { if ((dx * dx) / (r * r + 0.5) + (dy * dy) / (ry * ry + 0.5) > 1) continue; const x = Math.round(cx + dx), y = Math.round(cy + dy); if (x < 0 || y < 0 || x >= L.W || y >= L.H) continue; put(x, y, m, false, temp); const i = y * L.W + x; if (mt[i] === m) corpo[i] = c; } },
  ret(x0, y0, x1, y1, chave, o = {}) { const m = typeof chave === 'number' ? chave : id(chave); for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) put(x, y, m, o.po, o.temp, o.chance); },
};
function put(x, y, m, po, temp, chance) { if (x < 0 || y < 0 || x >= L.W || y >= L.H || m < 0) return; if (chance && rnd() > chance) return; const i = y * L.W + x; if (mt[i] && (MATS[mt[i]].vidro || MATS[mt[i]].inerte) && !(MATS[m].vidro || MATS[m].inerte)) return; mt[i] = m; T[i] = temp ?? (MATS[m].tempFixa ?? L.AMB); flg[i] = (flg[i] & TK) | (po ? PO : 0); vida[i] = 0; carga[i] = 0; aux[i] = 0; dis[i] = 0; disG[i] = 0; gv[i] = 0; bfl[i] = 0; corpo[i] = 0; const Mp = MATS[m]; if (Mp.gasDis && estadoDe(Mp, T[i]) === 1) { disG[i] = id(Mp.gasDis[0]); dis[i] = Mp.gasDis[1]; } }
function limparTudo() { mt.fill(0); T.fill(L.AMB); flg.fill(0); vida.fill(0); carga.fill(0); aux.fill(0); lat.fill(0); matPrev.fill(0); L.sondasPedidas = []; L.velReacao = 1; dis.fill(0); disG.fill(0); gv.fill(0); bfl.fill(0); corpo.fill(0); if (typeof limparFisica === 'function') limparFisica(); L.contagem.clear(); decompVistas.clear(); L.eventos = []; }
const EXPERIMENTOS = [
  { n: '💧 Sódio na água', d: 'Metal alcalino reagindo com água: hidróxido de sódio e hidrogênio.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.45 | 0, W * 0.4 | 0, H * 0.5 | 0); EXP.ret(W * 0.3 + 1, H * 0.6, W * 0.7 - 1, H * 0.95 - 1, 'H2O'); EXP.ret(W * 0.45, H * 0.2, W * 0.55, H * 0.25, 'Na', { po: true, chance: 0.6 }); } },
  { n: '🔥 Potássio na água', d: 'Mais reativo que o sódio: o hidrogênio pega fogo com chama lilás.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.45 | 0, W * 0.4 | 0, H * 0.5 | 0); EXP.ret(W * 0.3 + 1, H * 0.6, W * 0.7 - 1, H * 0.95 - 1, 'H2O'); EXP.ret(W * 0.47, H * 0.2, W * 0.53, H * 0.24, 'K', { po: true, chance: 0.6 }); } },
  { n: '🌈 Teste de chama', d: 'Sais aquecidos dão chamas de cores diferentes: é como se identificam metais (e como se colorem os fogos de artifício).', f: (W, H) => { const sais = ['LiCl', 'NaCl', 'KCl', 'CaCl2', 'sal:SrCl2', 'BaCl2', 'CuCl2']; const n = sais.length, lw = W / (n + 1); EXP.ret(0, H - 3, W - 1, H - 1, 'AQUECEDOR'); sais.forEach((s, k) => { let mid = id(s); if (mid < 0) mid = sal('Sr', 'Cl'); EXP.ret(lw * (k + 0.6), H - 8, lw * (k + 1.3), H - 4, mid, { po: true }); }); } },
  { n: '✨ Termite', d: 'Alumínio em pó + ferrugem. Use a FAÍSCA para acender: chega a ~2500 °C e sobra ferro derretido.', f: (W, H) => { EXP.bequer(W * 0.38 | 0, H * 0.55 | 0, W * 0.24 | 0, H * 0.4 | 0, 'Cadinho'); for (let y = H * 0.7 | 0; y < H * 0.95 - 1; y++) for (let x = W * 0.38 + 1 | 0; x < W * 0.62 - 1; x++) put(x, y, rnd() < 0.5 ? id('Al') : id('Fe2O3'), true); } },
  { n: '🌳 Árvore de prata', d: 'Fio de cobre em nitrato de prata: o cobre entra na solução (azul) e a prata se deposita.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.4 | 0, W * 0.4 | 0, H * 0.55 | 0); EXP.ret(W * 0.3 + 1, H * 0.5, W * 0.7 - 1, H * 0.95 - 1, solucao('Ag', 'NO3')); EXP.ret(W * 0.49, H * 0.25, W * 0.51, H * 0.85, 'Cu'); } },
  { n: '🌟 Chuva dourada', d: 'Nitrato de chumbo + iodeto de potássio: forma iodeto de chumbo, amarelo-ouro e insolúvel.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.4 | 0, W * 0.4 | 0, H * 0.55 | 0); EXP.ret(W * 0.3 + 1, H * 0.7, W * 0.7 - 1, H * 0.95 - 1, solucao('Pb', 'NO3')); EXP.ret(W * 0.4, H * 0.1, W * 0.6, H * 0.3, solucao('K', 'I')); } },
  { n: '🌋 Vulcão de bicarbonato', d: 'Vinagre + bicarbonato de sódio: o gás carbônico sobe em bolhas.', f: (W, H) => { EXP.ret(W * 0.35, H * 0.82, W * 0.65, H - 1, 'NaHCO3', { po: true }); EXP.ret(W * 0.42, H * 0.1, W * 0.58, H * 0.3, solucao('H', 'CH3COO')); } },
  { n: '⚡ Eletrólise da água', d: 'Corrente elétrica em água com sulfato de sódio: bolhas de hidrogênio e oxigênio.', f: (W, H) => { EXP.bequer(W * 0.25 | 0, H * 0.35 | 0, W * 0.5 | 0, H * 0.6 | 0); EXP.ret(W * 0.25 + 1, H * 0.45, W * 0.75 - 1, H * 0.95 - 1, solucao('Na', 'SO4')); EXP.ret(W * 0.38, H * 0.2, W * 0.39, H * 0.85, 'C'); EXP.ret(W * 0.61, H * 0.2, W * 0.62, H * 0.85, 'C'); EXP.ret(W * 0.36, H * 0.16, W * 0.41, H * 0.2, 'BATERIA'); EXP.ret(W * 0.59, H * 0.16, W * 0.64, H * 0.2, 'BATERIA'); } },
  { n: '🫠 Gálio e alumínio', d: 'Gálio líquido (derrete a 29,8 °C) penetra no alumínio, que fica quebradiço. Depois use o MARTELO.', f: (W, H) => { EXP.ret(W * 0.3, H * 0.75, W * 0.7, H * 0.85, 'Al'); EXP.ret(W * 0.45, H * 0.6, W * 0.55, H * 0.7, 'Ga', { temp: 40 }); } },
  { n: '⚠️ Água sanitária + vinagre', d: 'NÃO FAÇA EM CASA: solta gás cloro, tóxico. Veja por que nunca se mistura produtos de limpeza.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.4 | 0, W * 0.4 | 0, H * 0.55 | 0); EXP.ret(W * 0.3 + 1, H * 0.7, W * 0.7 - 1, H * 0.95 - 1, solucao('Na', 'ClO')); EXP.ret(W * 0.42, H * 0.1, W * 0.58, H * 0.28, solucao('H', 'CH3COO')); } },
  { n: '🧂 Ferrugem: água x água salgada', d: 'Dois pregos de ferro: um em água, outro em água com sal. O sal acelera a corrosão.', f: (W, H) => { EXP.bequer(W * 0.1 | 0, H * 0.4 | 0, W * 0.35 | 0, H * 0.55 | 0); EXP.bequer(W * 0.55 | 0, H * 0.4 | 0, W * 0.35 | 0, H * 0.55 | 0); EXP.ret(W * 0.1 + 1, H * 0.6, W * 0.45 - 1, H * 0.95 - 1, 'H2O'); EXP.ret(W * 0.55 + 1, H * 0.6, W * 0.9 - 1, H * 0.95 - 1, solucao('Na', 'Cl')); EXP.ret(W * 0.27, H * 0.3, W * 0.28, H * 0.9, 'Fe'); EXP.ret(W * 0.72, H * 0.3, W * 0.73, H * 0.9, 'Fe'); L.velReacao = 8; } },
  { n: '🧊 Nitrogênio líquido', d: 'A −196 °C: ferve na hora e congela a água em volta.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.5 | 0, W * 0.4 | 0, H * 0.45 | 0); EXP.ret(W * 0.3 + 1, H * 0.75, W * 0.7 - 1, H * 0.95 - 1, 'H2O'); EXP.ret(W * 0.44, H * 0.15, W * 0.56, H * 0.3, 'N', { temp: -196 }); } },
  { n: '🏭 Alto-forno', d: 'Minério de ferro + carvão aquecidos: o carbono rouba o oxigênio e sobra ferro.', f: (W, H) => { const y0 = H * 0.5 | 0, h = H * 0.45 | 0; EXP.bequer(W * 0.35 | 0, y0, W * 0.3 | 0, h, 'Cadinho'); EXP.ret(0, y0 + h, W - 1, H - 1, 'AQUECEDOR'); for (let y = H * 0.65 | 0; y < H * 0.95 - 1; y++) for (let x = W * 0.35 + 1 | 0; x < W * 0.65 - 1; x++) put(x, y, rnd() < 0.55 ? id('Fe2O3') : id('C'), true); } },
  { n: '💥 Hidrogênio + oxigênio', d: 'Mistura de gases num frasco fechado. Use a FAÍSCA lá dentro: explode e vira vapor d’água.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.3 | 0, W * 0.4 | 0, H * 0.65 | 0); EXP.ret(W * 0.3 | 0, H * 0.3 | 0, (W * 0.3 | 0) + (W * 0.4 | 0), H * 0.3 | 0, 'Vidro'); for (let y = H * 0.32 | 0; y < H * 0.95 - 1; y++) for (let x = W * 0.3 + 1 | 0; x < W * 0.7 - 1; x++) if (rnd() < 0.7) put(x, y, rnd() < 0.66 ? id('H') : id('O')); } },
  { n: '🥇 Ouro e mercúrio', d: 'O mercúrio dissolve o ouro (amálgama). Aqueça acima de 357 °C: o mercúrio evapora e o ouro volta (vapor tóxico!).', f: (W, H) => { EXP.ret(0, H - 3, W - 1, H - 1, 'Cadinho'); EXP.ret(W * 0.4, H * 0.8, W * 0.6, H - 4, 'Au', { po: true }); EXP.ret(W * 0.42, H * 0.6, W * 0.58, H * 0.72, 'Hg'); } },
  { n: '🫧 Água de cal + gelo seco', d: 'O gás carbônico do gelo seco deixa a água de cal turva (forma carbonato de cálcio).', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.4 | 0, W * 0.4 | 0, H * 0.55 | 0); EXP.ret(W * 0.3 + 1, H * 0.6, W * 0.7 - 1, H * 0.95 - 1, solucao('Ca', 'OH')); EXP.ret(W * 0.45, H * 0.45, W * 0.55, H * 0.52, 'CO2', { temp: -80, po: true }); } },
  { n: '🧪 Precipitados coloridos', d: 'Hidróxido de sódio caindo em soluções de cobre, ferro(III), níquel e cobalto: cada um forma um sólido de cor diferente.', f: (W, H) => { const sol = [['Cu', 'SO4'], ['Fe3', 'Cl'], ['Ni', 'Cl'], ['Co', 'Cl']], lw = W / 4; sol.forEach(([c, a], k) => { EXP.bequer(lw * k + 3 | 0, H * 0.45 | 0, lw - 7 | 0, H * 0.5 | 0); EXP.ret(lw * k + 4, H * 0.65, lw * (k + 1) - 5, H * 0.95 - 1, solucao(c, a)); EXP.ret(lw * k + lw * 0.35, H * 0.15, lw * k + lw * 0.6, H * 0.25, solucao('Na', 'OH')); }); } },
  { n: '🍬 Açúcar + ácido sulfúrico', d: 'O ácido arranca a água do açúcar: sobra carbono preto e vapor quente.', f: (W, H) => { EXP.bequer(W * 0.35 | 0, H * 0.5 | 0, W * 0.3 | 0, H * 0.45 | 0); EXP.ret(W * 0.35 + 1, H * 0.75, W * 0.65 - 1, H * 0.95 - 1, 'Sacarose', { po: true }); EXP.ret(W * 0.45, H * 0.2, W * 0.55, H * 0.35, 'H2SO4'); } },
  { n: '🫧 Água oxigenada + catalisador', d: 'Dióxido de manganês caindo em água oxigenada 3% (esquerda) e em peróxido 30% (direita). O catalisador não é gasto; o concentrado ferve sozinho.', f: (W, H) => { EXP.bequer(W * 0.08 | 0, H * 0.45 | 0, W * 0.36 | 0, H * 0.5 | 0); EXP.bequer(W * 0.56 | 0, H * 0.45 | 0, W * 0.36 | 0, H * 0.5 | 0); EXP.ret(W * 0.08 + 1, H * 0.65, W * 0.44 - 1, H * 0.95 - 1, 'AguaOxigenada'); EXP.ret(W * 0.56 + 1, H * 0.65, W * 0.92 - 1, H * 0.95 - 1, 'H2O2'); EXP.ret(W * 0.22, H * 0.3, W * 0.3, H * 0.34, 'MnO2', { po: true }); EXP.ret(W * 0.7, H * 0.3, W * 0.78, H * 0.34, 'MnO2', { po: true }); } },
  { n: '💜 Permanganato + glicerina', d: 'Oxidante forte em pó com um combustível líquido: depois de alguns segundos pega fogo sozinho, com chama lilás.', f: (W, H) => { EXP.ret(W * 0.3, H - 4, W * 0.7, H - 1, 'Cadinho'); EXP.ret(W * 0.42, H - 9, W * 0.58, H - 5, 'KMnO4', { po: true }); EXP.ret(W * 0.46, H * 0.4, W * 0.54, H * 0.5, 'Glicerina'); } },
  { n: '🌈 Indicador de repolho roxo', d: 'O mesmo extrato em ácido clorídrico, vinagre, água destilada, bicarbonato… e soda cáustica: uma cor para cada pH.', f: (W, H) => { const sol = [solucao('H', 'Cl'), solucao('H', 'CH3COO'), id('H2O'), solucao('Na', 'CO3'), solucao('Na', 'OH')], lw = W / 5; sol.forEach((m, k) => { EXP.bequer(lw * k + 2 | 0, H * 0.5 | 0, lw - 5 | 0, H * 0.45 | 0); EXP.ret(lw * k + 3, H * 0.7, lw * (k + 1) - 4, H * 0.95 - 1, m); EXP.ret(lw * k + lw * 0.35, H * 0.2, lw * k + lw * 0.6, H * 0.3, 'RepolhoRoxo'); }); } },
  { n: '🩷 Titulação com fenolftaleína', d: 'Soda cáustica com fenolftaleína fica rosa. Ácido clorídrico caindo por cima neutraliza a base e a cor some.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.45 | 0, W * 0.4 | 0, H * 0.5 | 0); EXP.ret(W * 0.3 + 1, H * 0.72, W * 0.7 - 1, H * 0.95 - 1, solucao('Na', 'OH')); EXP.ret(W * 0.4, H * 0.6, W * 0.6, H * 0.64, 'Fenolftaleina'); EXP.ret(W * 0.44, H * 0.08, W * 0.56, H * 0.3, solucao('H', 'Cl')); } },
  { n: '🔵 Teste do amido', d: 'Polvilho (amido) em água destilada; pingue lugol (iodo) e veja o azul-escuro aparecer.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.45 | 0, W * 0.4 | 0, H * 0.5 | 0); EXP.ret(W * 0.3 + 1, H * 0.65, W * 0.7 - 1, H * 0.95 - 1, 'H2O'); EXP.ret(W * 0.32, H * 0.86, W * 0.68, H * 0.95 - 1, 'Amido', { po: true }); EXP.ret(W * 0.45, H * 0.15, W * 0.55, H * 0.3, lugol()); } },
  { n: '🐘 Pasta de dente de elefante', d: 'Peróxido 30% com detergente; o iodeto de potássio cai e quebra o peróxido. O oxigênio vira uma montanha de espuma quente.', f: (W, H) => { EXP.bequer(W * 0.36 | 0, H * 0.5 | 0, W * 0.28 | 0, H * 0.45 | 0); for (let y = H * 0.7 | 0; y < H * 0.95 - 1; y++) for (let x = W * 0.36 + 1 | 0; x < W * 0.64 - 1; x++) put(x, y, rnd() < 0.7 ? id('H2O2') : id('Detergente')); EXP.ret(W * 0.46, H * 0.3, W * 0.54, H * 0.36, solucao('K', 'I')); } },
  { n: '🧼 Bolhas de hidrogênio', d: 'Zinco + ácido clorídrico no fundo; o hidrogênio sobe pela camada de detergente e vira espuma inflamável. Encoste a FAÍSCA na espuma.', f: (W, H) => { EXP.bequer(W * 0.35 | 0, H * 0.4 | 0, W * 0.3 | 0, H * 0.55 | 0); EXP.ret(W * 0.35 + 1, H * 0.9, W * 0.65 - 1, H * 0.95 - 1, 'Zn', { po: true }); EXP.ret(W * 0.35 + 1, H * 0.72, W * 0.65 - 1, H * 0.9 - 1, solucao('H', 'Cl')); EXP.ret(W * 0.35 + 1, H * 0.62, W * 0.65 - 1, H * 0.72 - 1, 'Detergente'); L.velReacao = 4; } },
  { n: '🔥 Água no óleo quente (nunca faça)', d: 'Óleo a 260 °C numa panela e umas gotas de água caindo: a água vira vapor de uma vez e arremessa óleo em chamas.', f: (W, H) => { EXP.ret(0, H - 3, W - 1, H - 1, 'AQUECEDOR'); EXP.bequer(W * 0.3 | 0, H * 0.7 | 0, W * 0.4 | 0, (H * 0.3 | 0) - 4, 'Cadinho'); EXP.ret(W * 0.3 + 1, H * 0.82, W * 0.7 - 1, H - 5, 'Oleo', { temp: 260 }); EXP.ret(W * 0.48, H * 0.2, W * 0.52, H * 0.24, 'H2O'); } },
  { n: '🧀 Leite + vinagre', d: 'O ácido do vinagre faz a caseína do leite coagular: flocos brancos (coalhada) e soro amarelado.', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.45 | 0, W * 0.4 | 0, H * 0.5 | 0); EXP.ret(W * 0.3 + 1, H * 0.62, W * 0.7 - 1, H * 0.95 - 1, 'Leite'); EXP.ret(W * 0.42, H * 0.15, W * 0.58, H * 0.32, solucao('H', 'CH3COO')); } },
  { n: '🧽 Palha de aço + bateria', d: 'A corrente passa pelos fios finíssimos de aço, que esquentam até brilhar e pegar fogo, soltando faíscas.', f: (W, H) => { EXP.ret(W * 0.25, H - 4, W * 0.75, H - 1, 'Cadinho'); EXP.ret(W * 0.3, H - 14, W * 0.7, H - 5, 'PalhaAco', { po: true, chance: 0.75 }); EXP.ret(W * 0.27, H - 16, W * 0.3, H - 5, 'BATERIA'); EXP.ret(W * 0.7, H - 16, W * 0.73, H - 5, 'BATERIA'); } },
  { n: '🌽 Milho dançante', d: 'Grãos de milho em água com gás. Ninguém programou a dança: as bolhas nascem nas fendinhas da casca, levantam o grão pelo empuxo e estouram na superfície. Use o 🔬 microscópio num grão.', f: (W, H) => { const x0 = W * 0.3 | 0, w = W * 0.4 | 0, y0 = H * 0.25 | 0; EXP.bequer(x0, y0, w, H * 0.7 | 0); EXP.ret(x0 + 1, H * 0.35, x0 + w - 1, H * 0.95 - 1, solucao('H', 'CO3')); for (let k = 0; k < 5; k++) EXP.objeto(x0 + 4 + (k + 0.5) * (w - 8) / 5, H * 0.95 - 4 - (k % 2) * 6, 2, 'Milho'); } },
  { n: '🍬 Mentos no refrigerante', d: 'Balas Mentos caindo numa garrafa de refrigerante: cada poro da bala vira um ponto de nucleação, as bolhas se soltam pequenas e crescem enquanto sobem, numa coluna de gás. Compare com o milho dançante: mesmo líquido, superfície diferente.', f: (W, H) => { const x0 = W * 0.42 | 0, w = W * 0.16 | 0, y0 = H * 0.3 | 0; EXP.bequer(x0, y0, w, H * 0.65 | 0); EXP.ret(x0 + 1, H * 0.4, x0 + w - 1, H * 0.95 - 1, 'Refrigerante'); for (let k = 0; k < 3; k++) EXP.objeto(x0 + w / 2, H * 0.08 + k * 6, 2, 'Mentos'); } },
  { n: '🌋 Vulcão com detergente', d: 'Bicarbonato no fundo; vinagre com detergente por cima. O CO₂ da reação fica dissolvido, vira bolhas nos grãos de bicarbonato e o detergente transforma tudo em espuma que transborda.', f: (W, H) => { const x0 = W * 0.38 | 0, w = W * 0.24 | 0; EXP.bequer(x0, H * 0.45 | 0, w, H * 0.5 | 0); EXP.ret(x0 + 1, H * 0.88, x0 + w - 1, H * 0.95 - 1, 'NaHCO3', { po: true }); for (let y = H * 0.6 | 0; y < H * 0.88; y++) for (let x = x0 + 1; x < x0 + w; x++) put(x, y, rnd() < 0.8 ? solucao('H', 'CH3COO') : id('Detergente')); } },
  { n: '⚖️ Boia ou afunda?', d: 'Rolha (0,24 g/cm³), pipoca (0,06), gelo (0,92), milho (1,25), uva-passa (1,3) e ferro (7,9) na água (1,0). Cada um para onde o princípio de Arquimedes manda.', f: (W, H) => { const x0 = W * 0.15 | 0, w = W * 0.7 | 0; EXP.bequer(x0, H * 0.3 | 0, w, H * 0.65 | 0); EXP.ret(x0 + 1, H * 0.5, x0 + w - 1, H * 0.95 - 1, 'H2O'); const itens = [['Rolha', 2], ['Pipoca', 2], ['H2O', 4, -40], ['Milho', 2], ['UvaPassa', 2], ['Fe', 2]]; itens.forEach(([k, r, t], n) => EXP.objeto(x0 + 6 + (n + 0.5) * (w - 12) / itens.length, H * 0.62, r, k, t)); } },
  { n: '🍿 Pipoca na panela', d: 'Grãos de milho numa panela quente. A água dentro de cada grão vira vapor e, perto de 180 °C, a casca rompe: o amido infla e o grão pula.', f: (W, H) => { EXP.ret(0, H - 3, W - 1, H - 1, 'AQUECEDOR'); EXP.bequer(W * 0.3 | 0, H * 0.55 | 0, W * 0.4 | 0, H - 4 - (H * 0.55 | 0), 'Cadinho'); for (let k = 0; k < 6; k++) EXP.objeto(W * 0.33 + k * W * 0.06, H - 7, 2, 'Milho'); } },
  { n: '🫒 Detergente tirando gordura', d: 'Óleo boiando na água; o detergente cai por cima e quebra o óleo em gotinhas (emulsão).', f: (W, H) => { EXP.bequer(W * 0.3 | 0, H * 0.45 | 0, W * 0.4 | 0, H * 0.5 | 0); EXP.ret(W * 0.3 + 1, H * 0.75, W * 0.7 - 1, H * 0.95 - 1, 'H2O'); EXP.ret(W * 0.3 + 1, H * 0.66, W * 0.7 - 1, H * 0.75 - 1, 'Oleo'); EXP.ret(W * 0.44, H * 0.2, W * 0.56, H * 0.32, 'Detergente'); } },
  { n: '⛽ Vapor de gasolina', d: 'Um pote de gasolina aberto. O vapor (mais pesado que o ar) escorre pelo chão. Uma faísca longe do pote acende o vapor, e o fogo volta até a gasolina.', f: (W, H) => { EXP.bequer(W * 0.05 | 0, H - 7, W * 0.16 | 0, 6, 'Cadinho'); EXP.ret(W * 0.05 + 1, H - 5, W * 0.21 - 1, H - 2, 'Gasolina'); L.sondasPedidas = [[W * 0.13 | 0, H - 3], [W * 0.8 | 0, H - 2]]; },
    r: { objetivo: 'Ver que quem pega fogo é o vapor, não o líquido, e que o vapor viaja.', passos: [{ t: 'Espere o vapor escorrer pelo chão (uns segundos)', ok: S => S.conta('vap:Gasolina') > 25 }, { t: 'Solte ✨ faíscas no chão a um palmo do pote, onde o vapor chegou (passe o mouse para ver)', ok: S => S.reacao('Combustão: Vapor de gasolina') }, { t: 'O fogo volta pelo rastro de vapor e fica queimando em cima do pote', ok: S => S.vezes('Combustão: Vapor de gasolina') > 20 }], conclusao: 'A gasolina tem ponto de fulgor de −43 °C: em quase qualquer temperatura há vapor suficiente sobre ela para queimar. O vapor é ~3,5 vezes mais pesado que o ar, escorre e se espalha; uma faísca a metros de distância acende a nuvem e a chama volta até a fonte. Por isso é proibido fumar e usar celular perto de bombas de combustível.' } },
  { n: '🔥 Riscar um fósforo', d: 'Palito de fósforo encostado na lixa da caixa (fósforo vermelho). O atrito acende a cabeça, que acende a madeira. Do lado, uma folha de papel.', f: (W, H) => { const x = W * 0.4 | 0, y = H * 0.55 | 0; EXP.ret(0, H - 2, W - 1, H - 1, 'Cadinho'); colocarPalito(x, y); EXP.ret(x + 3, y - 3, x + 8, y, 'FosforoVermelho'); EXP.ret(W * 0.62, H * 0.5, W * 0.64, H - 3, 'Papel'); L.sondasPedidas = [[x, y + 3]]; },
    r: { objetivo: 'Entender como o fósforo de segurança acende e a ordem de ignição dos materiais.', passos: [{ t: 'Escolha 🔨 Martelo e bata na cabeça vermelha encostada na lixa (atrito)', ok: S => S.reacao('Queima: Cabeça de fósforo') }, { t: 'A chama da cabeça acende o palito de madeira', ok: S => S.reacao('Combustão: Madeira') }, { t: 'Leve fogo ao papel: com 🔥 Chama, ou encoste o palito', ok: S => S.reacao('Combustão: Papel') }], conclusao: 'O atrito na lixa vira um pouco de fósforo vermelho em fósforo branco, que pega fogo sozinho no ar. Esse calor decompõe o clorato de potássio da cabeça, que solta oxigênio e queima enxofre e sulfeto de antimônio a mais de 1000 °C. A madeira precisa de ~300 °C para acender; o papel, só ~233 °C.' } },
  { n: '🧨 Rastilho de pólvora', d: 'Um pavio leva o fogo até uma trilha de pólvora negra, que termina num montinho. A pólvora tem o próprio oxidante e queima muito rápido.', f: (W, H) => { EXP.ret(0, H - 2, W - 1, H - 1, 'Cadinho'); EXP.ret(W * 0.08, H - 3, W * 0.3, H - 3, 'Pavio'); EXP.ret(W * 0.3, H - 3, W * 0.7, H - 3, 'Polvora', { po: true }); EXP.ret(W * 0.7, H - 7, W * 0.8, H - 3, 'Polvora', { po: true }); L.sondasPedidas = [[W * 0.75 | 0, H - 5]]; },
    r: { objetivo: 'Comparar uma queima lenta (pavio) com uma muito rápida (pólvora) e ver que a pólvora não precisa de ar.', passos: [{ t: 'Acenda a ponta esquerda do pavio com 🔥 Chama', ok: S => S.reacao('Queima: Pavio') }, { t: 'O fogo anda devagar pelo pavio até a pólvora', ok: S => S.reacao('Queima: Pólvora negra') }, { t: 'Repita em ⚙ Vácuo (atmosfera lá em cima): a pólvora queima mesmo sem ar', ok: S => S.reacao('Queima: Pólvora negra') && ATMOSFERA === 'vacuo' }], conclusao: 'O salitre (nitrato de potássio) da pólvora fornece o oxigênio, então ela queima sem ar e numa velocidade enorme, transformando um sólido em muito gás quente. Ao ar livre isso é só um clarão com fumaça; dentro de um tubo fechado a pressão sobe até estourar. Por isso fogos de artifício só devem ser manuseados por profissionais.' } },
  { n: '🏠 Vazamento de gás de cozinha', d: 'Uma cozinha fechada com gás vazando (mais pesado que o ar, ele fica embaixo). Um interruptor de luz solta uma faísca…', f: (W, H) => { const x0 = W * 0.1 | 0, x1 = W * 0.9 | 0, y0 = H * 0.25 | 0; for (let x = x0; x <= x1; x++) { put(x, y0, PAREDE, false); put(x, H - 1, PAREDE, false); } for (let y = y0; y < H; y++) { put(x0, y, PAREDE, false); put(x1, y, PAREDE, false); } for (let y = H * 0.6 | 0; y < H - 1; y++) for (let x = x0 + 1; x < x1; x++) if (rnd() < 0.35) put(x, y, id('GLP')); },
    r: { objetivo: 'Ver por que vazamento de gás é tão perigoso e o que fazer.', passos: [{ t: 'Observe o gás ficar perto do chão (passe o mouse para ver)', ok: S => S.t > 3 }, { t: 'Solte uma ✨ faísca dentro da cozinha (como um interruptor)', ok: S => S.reacao('Combustão: Gás de cozinha') }], conclusao: 'Misturado com o ar na proporção certa (~2% a 10%), o gás de cozinha queima tão rápido que vira uma explosão. Se sentir cheiro de gás: não acenda luz nem fósforo, não ligue aparelhos, abra portas e janelas, feche o registro e saia; ligue para os bombeiros (193) de fora de casa.' } },
  { n: '🌡️ Curva de aquecimento da água', d: 'Gelo a −20 °C num béquer sobre o bico de Bunsen. A sonda mostra a temperatura: ela para em 0 °C enquanto o gelo derrete e em 100 °C enquanto a água ferve.', f: (W, H) => { const x0 = W * 0.38 | 0, w = W * 0.24 | 0; EXP.ret(x0 + 3, H - 2, x0 + w - 3, H - 2, 'BICO'); EXP.bequer(x0, H * 0.5 | 0, w, (H - 6) - (H * 0.5 | 0), 'Vidro'); EXP.ret(x0 + 1, H * 0.72, x0 + w - 1, H - 7, 'H2O', { temp: -20 }); L.sondasPedidas = [[x0 + (w >> 1), H - 10]]; },
    r: { objetivo: 'Ver o calor latente: derreter e ferver gastam energia sem mudar a temperatura.', passos: [{ t: 'A temperatura sobe até 0 °C e PARA enquanto o gelo derrete', ok: S => S.estado('H2O', 1) > 60 }, { t: 'Com tudo líquido, sobe até 100 °C e para de novo: está fervendo', ok: S => S.maxT('H2O') >= 99.9 || S.estado('H2O', 2) > 8 }], conclusao: 'Derreter 1 g de gelo gasta 334 J e ferver 1 g de água gasta 2257 J, sem mudar a temperatura: essa energia vai para soltar as moléculas umas das outras. É por isso que o gráfico tem "patamares" em 0 °C e 100 °C, e que um copo com gelo fica a 0 °C até o gelo acabar.' } },
  { n: '📄 Temperatura de ignição', d: 'Papel, madeira e carvão no mesmo prato aquecido pelo bico de Bunsen. Qual acende primeiro?', f: (W, H) => { EXP.ret(W * 0.2, H - 2, W * 0.8, H - 2, 'BICO'); EXP.ret(W * 0.2, H - 6, W * 0.8, H - 6, 'Cadinho'); EXP.ret(W * 0.25, H - 10, W * 0.33, H - 7, 'Papel'); EXP.ret(W * 0.46, H - 10, W * 0.54, H - 7, 'Madeira'); EXP.ret(W * 0.67, H - 10, W * 0.75, H - 7, 'C', { po: true }); L.sondasPedidas = [[W * 0.29 | 0, H - 7], [W * 0.5 | 0, H - 7], [W * 0.71 | 0, H - 7]]; },
    r: { objetivo: 'Comparar temperaturas de ignição medindo com as sondas.', passos: [{ t: 'O papel acende primeiro (~233 °C)', ok: S => S.reacao('Combustão: Papel') }, { t: 'Depois a madeira (~300 °C)', ok: S => S.reacao('Combustão: Madeira') }, { t: 'O carvão é o último', ok: S => S.reacao('Combustão: Carbono') }], conclusao: 'Cada material precisa de uma temperatura mínima para os gases que ele solta reagirem com o oxigênio sozinhos. O papel é fino e acende a ~233 °C; a madeira, a ~300 °C; o carvão quase não solta gases e precisa estar bem quente. Repare nas sondas: a curva de cada um sobe de repente quando ele pega fogo.' } },
];
const ROTEIROS = {
  'Sódio na água': { objetivo: 'Ver a reação de um metal alcalino com a água.', passos: [{ t: 'O sódio cai na água e reage', ok: S => S.reacao('Sódio + água') }, { t: 'Meça o pH da água depois com 🧫 Fita de pH', ok: S => S.reacao('dissolvendo') }], conclusao: 'O sódio arranca o hidrogênio da água: forma hidróxido de sódio (a água fica básica, pH ~13) e solta gás hidrogênio, com muito calor.' },
  'Termite': { objetivo: 'Ver um metal "roubar" o oxigênio de outro.', passos: [{ t: 'Use ✨ Faísca ou 🔥 Chama na mistura', ok: S => S.reacao('Termite') }, { t: 'Sobra ferro derretido (acima de 1538 °C)', ok: S => S.maxT('Fe') > 1538 }], conclusao: 'O alumínio tem mais afinidade pelo oxigênio que o ferro. A troca libera tanta energia que o ferro sai líquido, a ~2500 °C: é como se soldam trilhos de trem.' },
  'Eletrólise da água': { objetivo: 'Quebrar a água com eletricidade.', passos: [{ t: 'Ligue a corrente: toque com ✨ nas fontes amarelas', ok: S => S.reacao('Eletrólise') }, { t: 'Leve uma faísca às bolhas: o hidrogênio estoura', ok: S => S.reacao('hidrogênio') || S.reacao('Hidrogênio') }], conclusao: 'A corrente separa a água em hidrogênio e oxigênio. A água pura quase não conduz: o sulfato de sódio dissolvido é que leva a corrente.' },
  'Pasta de dente de elefante': { objetivo: 'Ver um catalisador e uma reação que solta gás e calor.', passos: [{ t: 'O iodeto cai e começa a quebrar o peróxido', ok: S => S.reacao('Decomposição catalisada') }, { t: 'A espuma sobe e transborda', ok: S => S.conta('Espuma') > 40 }], conclusao: 'O iodeto acelera 2 H₂O₂ → 2 H₂O + O₂ sem ser gasto. O oxigênio e o vapor ficam presos no detergente e viram uma montanha de espuma quente.' },
  'Indicador de repolho roxo': { objetivo: 'Usar um indicador natural para comparar o pH.', passos: [{ t: 'O extrato cai nas cinco soluções e muda de cor', ok: S => S.reacoes('repolho') >= 5 }], conclusao: 'As antocianinas mudam de forma com o pH: vermelho no ácido forte, rosa no fraco, roxo no neutro, verde e amarelo na base.' },
  'Titulação com fenolftaleína': { objetivo: 'Ver o ponto final de uma neutralização.', passos: [{ t: 'A base com fenolftaleína fica rosa', ok: S => S.reacao('fenolftaleína') }, { t: 'O ácido neutraliza e a cor some', ok: S => S.reacao('Neutralização') }], conclusao: 'No laboratório se mede exatamente quanto ácido foi preciso para a cor sumir e se calcula a concentração da base.' },
  'Leite + vinagre': { objetivo: 'Ver uma proteína coagular com ácido.', passos: [{ t: 'O vinagre cai e o leite coalha', ok: S => S.reacao('coalhou') }], conclusao: 'Abaixo de pH ~4,6 a caseína deixa de se dissolver: é o princípio da ricota e dos queijos frescos.' },
  'Palha de aço + bateria': { objetivo: 'Ver o efeito Joule: a corrente esquenta fios finos.', passos: [{ t: 'Ligue as fontes com ✨ (toque nas barras amarelas)', ok: S => S.maxT('PalhaAco') > 200 }, { t: 'A palha brilha e pega fogo', ok: S => S.reacao('Combustão: Palha') }], conclusao: 'Fios finos têm resistência alta: a corrente os aquece até ~400 °C, quando o ferro queima no ar soltando faíscas.' },
  'Bolhas de hidrogênio': { objetivo: 'Guardar hidrogênio em bolhas e acender.', passos: [{ t: 'O zinco reage com o ácido e solta hidrogênio', ok: S => S.reacao('Zinco + ácido') }, { t: 'O hidrogênio vira espuma no detergente', ok: S => S.conta('EspumaH2') > 10 }, { t: 'Encoste uma ✨ faísca na espuma', ok: S => S.reacao('Combustão: Espuma') }], conclusao: 'Zn + 2 H⁺ → Zn²⁺ + H₂. As bolhas guardam o gás, que queima numa bola de fogo e vira só água.' },
  'Água no óleo quente': { objetivo: 'Entender por que nunca se joga água em óleo quente.', passos: [{ t: 'A água cai no óleo a 260 °C', ok: S => S.reacao('Água em óleo') }], conclusao: 'A água afunda, vira vapor de uma vez (1700 vezes mais volume) e joga o óleo para cima, onde ele pega fogo. Em óleo pegando fogo: desligue e abafe com uma tampa.' },
  'Hidrogênio + oxigênio': { objetivo: 'Ver uma mistura explosiva.', passos: [{ t: 'Solte uma ✨ faísca dentro do frasco', ok: S => S.reacao('Explosão de hidrogênio') || S.reacao('Combustão: Hidrogênio') }], conclusao: '2 H₂ + O₂ → 2 H₂O. A mistura só precisa de uma faísca; o produto é só vapor de água.' },
};
for (const e of EXPERIMENTOS) { if (e.r) continue; const k = Object.keys(ROTEIROS).find(k => e.n.includes(k)); e.r = k ? ROTEIROS[k] : { objetivo: e.d, passos: [{ t: 'Observe a reação acontecer', ok: S => S.nReacoes() > 0 }], conclusao: 'Abra 📓 Caderno para ver as equações e as explicações de cada reação que aconteceu.' }; }
