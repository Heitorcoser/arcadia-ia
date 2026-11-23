/* =========================================================================
   LABORATÓRIO DOS ELEMENTOS · física fina
   Nada aqui é "efeito pronto": cada coisa sai de uma lei física aplicada
   célula por célula, e o resultado aparece sozinho.

   1. GÁS DISSOLVIDO (lei de Henry): cada líquido guarda uma quantidade de gás
      dissolvido. O máximo (solubilidade) depende do gás, do líquido, da
      temperatura (van 't Hoff: mais quente, menos gás) e da pressão do ar.
      Acima do máximo o líquido fica SUPERSATURADO e o gás quer sair.
   2. NUCLEAÇÃO: o gás não vira bolha no meio do líquido (precisaria de uma
      supersaturação enorme). Ele nasce em fendinhas de superfícies ásperas
      e que repelem água: grão de milho, uva-passa, Mentos, grãos de pó,
      riscos do vidro. Quanto mais áspero e mais supersaturado, mais bolhas.
   3. BOLHAS: crescem puxando o gás dissolvido em volta (difusão), ficam
      grudadas até o empuxo vencer a tensão superficial (tamanho de
      soltura de Fritz) e sobem tanto mais rápido quanto maiores (Stokes).
      Na superfície estouram; com detergente a película fica estável e vira
      ESPUMA, que dura mais quanto mais detergente houver.
   4. OBJETOS RÍGIDOS: um sólido colocado como "objeto" se move inteiro.
      Peso = massa das células; empuxo = densidade do fluido em volta de cada
      célula (Arquimedes), mais o gás das bolhas grudadas nele. Se o empuxo
      vence, ele sobe; quando as bolhas de cima estouram na superfície, perde
      empuxo e afunda de novo. Água e ar freiam (arrasto).
   5. PIPOCA: a água dentro do grão vira vapor; a ~180 °C a pressão (~9 atm)
      rompe a casca e o amido expande e endurece numa espuma sólida.
   ========================================================================= */
'use strict';

/* ---------- gases: solubilidade em água a 25 °C (coeficiente de Ostwald:
   volumes de gás por volume de água) e constante de van 't Hoff (K) ----------
   Fontes: Sander (2015) Henry's law constants; CRC Handbook. */
const GASES = { CO2: [0.83, 2400, 'CO₂'], O: [0.031, 1700, 'O₂'], H: [0.019, 500, 'H₂'], N: [0.016, 1300, 'N₂'], Cl: [2.3, 2000, 'Cl₂'], He: [0.009, 230, 'He'], Ar: [0.034, 1500, 'Ar'], CH4: [0.034, 1600, 'CH₄'], H2S: [2.5, 2100, 'H₂S'], SO2: [39, 2900, 'SO₂'], NH3: [700, 4100, 'NH₃'], CO: [0.023, 1300, 'CO'], Ne: [0.011, 400, 'Ne'] };
const GAS_INFO = [];
for (const k in GASES) { const g = id(k); if (g >= 0) GAS_INFO[g] = { ost: GASES[k][0], C: GASES[k][1], nome: GASES[k][2], chave: k }; }
const B_BOLHA = 1, B_GRUDA = 2;
const SIGMA_AGUA = 72, SIGMA_DETERGENTE = 30; // tensão superficial (mN/m)
// gás que uma célula de reação solta dentro do líquido, em volumes de célula: n = concentração × volume; V = n × 24,5 L/mol.
// Solução 0,1 mol/L → ~2,4 volumes; vinagre (ácido acético 5% ≈ 0,83 mol/L) → ~20 volumes.
const RENDE_GAS = 2.45;
const rendimento = M => RENDE_GAS * ((M && M.molar) || 0.1) / 0.1;
const FIS = { estouros: [], vistos: new Set(), pressao: 1 };

const ehLiq = i => { const m = mt[i]; return m !== 0 && !corpo[i] && !(bfl[i] & B_BOLHA) && estadoDe(MATS[m], T[i]) === 1; };
// célula "aberta" para o ar: vazio ou gás solto (não bolha)
const abertaAoAr = i => { const m = mt[i]; if (m === 0) return true; if (bfl[i] & B_BOLHA) return false; const s = estadoDe(MATS[m], T[i]); return s >= 2; };
function pressaoAr() { return typeof ATMOSFERA !== 'undefined' && ATMOSFERA === 'vacuo' ? 0.02 : 1; }
// quanto do gás o líquido aguenta (mesma unidade de dis[]): Henry + van 't Hoff + "salting out"
function fatorSolvente(M) {
  if (M.solvGas !== undefined) return M.solvGas;
  if (M.tipo === 'solucao') return M.eletrolito ? 0.82 : 0.95; // íons dissolvidos "expulsam" o gás (efeito Sechenov)
  if (M.chave === 'H2O' || M.comoAgua || M.chave === 'AguaTorneira') return 1;
  return 2.2; // óleos e solventes orgânicos dissolvem bem mais gás que a água
}
function solubilidade(G, M, t) { return G.ost * Math.exp(G.C * (1 / (t + 273.15) - 1 / 298.15)) * FIS.pressao * fatorSolvente(M); }
// aspereza da superfície (0 a 1): é onde moram as microbolhas de ar que viram núcleo
function aspereza(k) {
  const m = mt[k]; if (!m || (bfl[k] & B_BOLHA)) return 0;
  const M = MATS[m];
  if (M.rug !== undefined) return M.rug;
  const s = estadoDe(M, T[k]); if (s !== 0) return 0;
  if (flg[k] & PO) return 0.45;
  if (M.vidro) return 0.012; if (M.inerte) return 0.02; if (M.metal || M.condutor) return 0.06;
  return 0.15;
}
// o quanto a superfície repele a água (segura a bolha por mais tempo)
const hidrofobico = k => { const m = mt[k]; if (!m) return 0; const M = MATS[m]; return M.hidrofobico ?? (M.vidro ? 0.1 : (flg[k] & PO) ? 0.35 : 0.3); };
// tamanho com que a bolha se solta (Fritz): V ∝ (σ/Δρg)^(3/2); superfície que repele água segura mais (ângulo de contato maior)
// o ângulo de contato pesa muito: superfície que repele água (casca de milho) segura aglomerados bem maiores que o vidro
const volumeSoltura = (sigma, hid) => 0.6 * Math.pow(sigma / SIGMA_AGUA, 1.5) * (0.5 + 4 * hid * hid * hid);
function tensoativo(x, y) {
  let n = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) continue; const m = mt[ny * L.W + nx]; if (m && MATS[m].surfactante) n++; }
  return n;
}
function fenomeno(chave, nome, eq, nota) { if (FIS.vistos.has(chave)) return; FIS.vistos.add(chave); evento('', { nome, eq, nota, fenomeno: true }); }
function limparFisica() { FIS.estouros = []; FIS.vistos.clear(); CORPOS.clear(); }

/* ---------- abrir espaço: o líquido é empurrado até o ar mais perto (o nível sobe) ---------- */
function abrirEspaco(i) {
  // caminho mais curto até o ar: sobe pela coluna; se um objeto ou sólido estiver em cima, anda de lado e sobe pela coluna vizinha
  const W = L.W, x0 = i % W, y0 = (i / W) | 0;
  const passavel = v => ehLiq(v) || ((bfl[v] & B_BOLHA) && !(bfl[v] & B_GRUDA));
  for (const dx of [0, -1, 1, -2, 2, -3, 3, -5, 5, -8, 8]) {
    const cam = [i]; let ok = true;
    for (let k = 1; k <= Math.abs(dx); k++) { const x = x0 + Math.sign(dx) * k; if (x < 0 || x >= W) { ok = false; break; } const v = y0 * W + x; if (!passavel(v)) { ok = false; break; } cam.push(v); }
    if (!ok) continue;
    let v = cam[cam.length - 1] - W;
    while (v >= 0 && passavel(v)) { cam.push(v); v -= W; }
    if (v < 0 || !abertaAoAr(v)) continue;
    cam.push(v);
    // o ar do fim do caminho desce até i e cada célula do caminho anda uma casa para fora
    for (let c = cam.length - 1; c > 0; c--) troca(cam[c], cam[c - 1]);
    return true;
  }
  return false;
}

/* ---------- nascimento de uma bolha ---------- */
function nascerBolha(i, g, grudada) {
  const t = T[i], m0 = mt[i];
  if (!abrirEspaco(i)) return false;
  // o líquido que estava em i foi empurrado; a célula i agora tem o "ar" que veio do fim do caminho
  limparCelula(i); mt[i] = g; T[i] = t; bfl[i] = B_BOLHA | (grudada ? B_GRUDA : 0); gv[i] = 0.04;
  fenomeno('nucleacao', 'Nucleação: o gás vira bolha', 'CO₂(aq) → CO₂(g)', `O líquido ficou supersaturado: tem mais gás dissolvido do que a lei de Henry deixa. Mas uma bolha nova precisa vencer a tensão superficial, e no meio do líquido isso quase nunca acontece. Ela nasce em fendinhas de superfícies ásperas (${MATS[m0] ? 'como esta' : ''}), onde já há um tiquinho de ar preso.`);
  return true;
}

/* ---------- gás que sai de uma reação dentro do líquido: fica dissolvido ---------- */
function liquidoVizinho(c, x, y) {
  let melhor = -1, n = 0;
  for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) continue; const k = ny * L.W + nx; if (ehLiq(k)) { n++; if (melhor < 0 || rnd() < 0.4) melhor = k; } }
  return n >= 2 ? melhor : -1;
}
function dissolverEm(k, g, q) {
  if (disG[k] !== g && dis[k] > 0.05) { // já tem outro gás: o novo toma o lugar só se for mais
    if (q < dis[k]) return; dis[k] = 0;
  }
  disG[k] = g; dis[k] += q;
}
function gasNoLiquido(c, x, y) {
  const m = mt[c]; if (!m || !GAS_INFO[m] || estadoDe(MATS[m], T[c]) !== 2) return;
  const k = liquidoVizinho(c, x, y); if (k < 0) return;
  // a célula da reação passa a ser líquido igual ao vizinho, com o gás novo dissolvido
  const g = m; mt[c] = mt[k]; flg[c] = flg[c] & TK; vida[c] = 0; bfl[c] = 0; gv[c] = 0; dis[c] = dis[k]; disG[c] = disG[k];
  // o gás nasce na superfície do sólido que está reagindo: ali a supersaturação local é enorme e a bolha se forma na hora
  let solido = false;
  for (let d = 0; d < 8 && !solido; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) continue; const v = ny * L.W + nx; if (mt[v] && !(bfl[v] & B_BOLHA) && estadoDe(MATS[mt[v]], T[v]) === 0) solido = true; }
  const q = rendimento(MATS[mt[k]]);
  if (solido && nascerBolha(c, g, false)) { gv[c] = q; return; } // todo o gás vai direto para a bolha que nasce ali (e ela se divide ao subir)
  dissolverEm(c, g, q);
}
function dissolverExtra(i, x, y, extra) {
  if (!GAS_INFO[extra]) return false;
  const k = ehLiq(i) ? i : liquidoVizinho(i, x, y); if (k < 0) return false;
  dissolverEm(k, extra, rendimento(MATS[mt[k]])); return true;
}

/* ---------- um passo da física fina ---------- */
function fisica() {
  FIS.pressao = pressaoAr();
  const N = L.N;
  for (let i = 0; i < N; i++) {
    if (!mt[i]) continue;
    if (bfl[i] & B_BOLHA) bolha(i);
    else if (dis[i] > 0) liquidoComGas(i);
    else if (MATS[mt[i]].pipoca && T[i] >= MATS[mt[i]].pipoca) estourarPipoca(i);
    else if (((i + L.tick) & 7) === 0) liquidoSemGas(i);
    if ((((i * 7) + L.tick) & 3) === 0 && mt[i] && !(bfl[i] & B_BOLHA) && !corpo[i]) { const x = i % L.W, y = (i / L.W) | 0; if (ehLiq(i)) misturar(i, x, y, agitadoPerto(i)); }
  }
  corpos();
  if (FIS.estouros.length > 80) FIS.estouros.splice(0, FIS.estouros.length - 80);
}

function liquidoComGas(i) {
  const W = L.W, m = mt[i], M = MATS[m], t = T[i];
  const G = GAS_INFO[disG[i]];
  if (!G) { dis[i] = 0; return; }
  if (corpo[i] || estadoDe(M, t) !== 1) { // congelou, ferveu ou reagiu: o gás escapa
    if (dis[i] > 0.5) { const x = i % W, y = (i / W) | 0; const j = vizinhoVazio(i, x, y, true); if (j >= 0) { mt[j] = disG[i]; T[j] = t; } }
    dis[i] = 0; disG[i] = 0; return;
  }
  const x = i % W, y = (i / W) | 0, cs = solubilidade(G, M, t), S = dis[i] / Math.max(1e-6, cs);
  // difusão + mistura com um vizinho líquido (o gás espalha pelo líquido)
  const d = (rnd() * 4) | 0, j = d === 0 ? (x > 0 ? i - 1 : -1) : d === 1 ? (x < W - 1 ? i + 1 : -1) : d === 2 ? i - W : i + W;
  if (j >= 0 && j < L.N && ehLiq(j) && (disG[j] === disG[i] || dis[j] < 0.02)) { const f = (dis[i] - dis[j]) * 0.08; dis[i] -= f; dis[j] += f; disG[j] = disG[i]; }
  // superfície livre: o excesso escapa devagar para o ar (é por isso que o refrigerante aberto perde o gás)
  if (y > 0 && abertaAoAr(i - W)) {
    if (S > 1) dis[i] -= (dis[i] - cs) * 0.0015; // perde gás devagar pela superfície (em minutos, como um copo aberto)
  }
  absorverGas(i, x, y, S);
  if (dis[i] < 0.002) { dis[i] = 0; disG[i] = 0; return; }
  if (S <= 1.02) return;
  // nucleação heterogênea: na superfície mais áspera em volta
  let rug = 0, site = -1;
  for (let k = 0; k < 8; k++) {
    const nx = x + DX[k], ny = y + DY[k]; if (nx < 0 || ny < 0 || nx >= W || ny >= L.H) continue;
    const v = ny * W + nx; if (S < 3 && (bfl[v] & B_BOLHA) && (k === 1 || k === 3 || k === 4 || k === 6)) { rug = -1; break; } // pouco excesso e já tem bolha encostada: ela é que vai crescer
    const a = aspereza(v); if (a > rug) { rug = a; site = v; }
  }
  if (rug < 0) return;
  // núcleos por célula de superfície: o Mentos tem milhões de poros; o milho, algumas fendas
  // a taxa de nucleação dispara com a supersaturação (na teoria clássica é exponencial): perto de uma reação o gás vira bolha na hora
  const fS = (S - 1) * (1 + ((S - 1) / 6) ** 2);
  let p = rug > 0 ? 0.0007 * rug * fS * (site >= 0 ? (MATS[mt[site]].nucleos || 1) : 1) : 0;
  // no meio do líquido: um líquido real tem impurezas e microbolhas que viram núcleo a partir de ~8× (o refrigerante, ~4×, só faz bolha em superfícies)
  if (S > 8) p += 0.004 * Math.min(6, (S - 8) / 8);
  if (rnd() < p) nascerBolha(i, disG[i], site >= 0 && rug > 0);
}

// gás solto encostado num líquido que ainda não está saturado se dissolve (lei de Henry: CO₂ do ar na água, gelo seco...)
function absorverGas(i, x, y, S) {
  if (S >= 0.98) return;
  const W = L.W, d = (rnd() * 4) | 0, j = d === 0 ? (x > 0 ? i - 1 : -1) : d === 1 ? (x < W - 1 ? i + 1 : -1) : d === 2 ? i - W : i + W;
  if (j < 0 || j >= L.N || !mt[j] || (bfl[j] & B_BOLHA) || !GAS_INFO[mt[j]] || estadoDe(MATS[mt[j]], T[j]) !== 2) return;
  if (disG[i] && disG[i] !== mt[j] && dis[i] > 0.05) return;
  const G = GAS_INFO[mt[j]];
  if (rnd() < 0.02 * Math.min(1, G.ost) * (1 - S)) { disG[i] = mt[j]; dis[i] += 1; limparCelula(j); }
}
function liquidoSemGas(i) { // líquido limpo também absorve gás que encosta nele
  const m = mt[i]; if (corpo[i] || estadoDe(MATS[m], T[i]) !== 1) return;
  const W = L.W, x = i % W, y = (i / W) | 0; absorverGas(i, x, y, 0);
}
/* ---------- mistura de líquidos miscíveis ----------
   Dois líquidos que se misturam (água, soluções, álcool, vinagre, detergente...) trocam de lugar aos poucos (difusão).
   Bolhas passando agitam o líquido e misturam muito mais rápido (convecção). Óleo e água não se misturam. */
const POLARES = new Set(['H2O', 'AguaTorneira', 'AguaOxigenada', 'H2O2', 'Etanol', 'Glicerina', 'Acetona', 'Leite', 'RepolhoRoxo', 'Fenolftaleina', 'Refrigerante', 'Detergente', 'AguaSabao']);
const miscivel = M => M.tipo === 'solucao' || M.comoAgua || M.lugol || POLARES.has(M.chave);
function misturar(i, x, y, agitado) {
  const W = L.W, d = (rnd() * 4) | 0, j = d === 0 ? (x > 0 ? i - 1 : -1) : d === 1 ? (x < W - 1 ? i + 1 : -1) : d === 2 ? i - W : i + W;
  if (j < 0 || j >= L.N || mt[j] === mt[i] || !ehLiq(j)) return;
  if (!miscivel(MATS[mt[i]]) || !miscivel(MATS[mt[j]])) return;
  if (rnd() < (agitado ? 0.5 : 0.08)) troca(i, j);
}

/* ---------- vida de uma bolha ---------- */
function bolha(i) {
  const W = L.W, g = mt[i], G = GAS_INFO[g], x = i % W, y = (i / W) | 0;
  if (!G || estadoDe(MATS[g], T[i]) !== 2) { bfl[i] = 0; return; }
  let liq = 0, solido = -1, objeto = -1, ar = false;
  for (let k = 0; k < 4; k++) {
    const j = k === 0 ? (x > 0 ? i - 1 : -1) : k === 1 ? (x < W - 1 ? i + 1 : -1) : k === 2 ? i - W : i + W;
    if (j < 0 || j >= L.N) continue;
    if (ehLiq(j)) {
      liq++;
      if (disG[j] === g) { // o gás dissolvido entra na bolha se o líquido estiver supersaturado; se não, a bolha se dissolve
        const ex = dis[j] - solubilidade(G, MATS[mt[j]], T[j]);
        // difusão pela parede da bolha: lenta (segundos) quando parada; subindo, o líquido em volta se renova e a troca é bem mais rápida (convecção)
        // (numa superfície cheia de poros, cada célula é um enxame de microbolhas: muito mais área, cresce muito mais rápido)
        const q = ex > 0 ? ex * ((bfl[i] & B_GRUDA) ? 0.0016 * areaPoros(i) : 0.008) : Math.max(ex * 0.002, -gv[i] * 0.05);
        dis[j] -= q; gv[i] += q;
      } else if (dis[j] < 0.01) { const q = Math.min(gv[i], 0.004 * G.ost); gv[i] -= q; dis[j] += q; disG[j] = g; } // líquido sem gás: a bolha se dissolve devagar (mais rápido para gases solúveis)
    } else if (abertaAoAr(j)) ar = true;
    else if (mt[j] && estadoDe(MATS[mt[j]], T[j]) === 0) { solido = j; if (corpo[j]) objeto = j; }
  }
  if (gv[i] <= 0.004) { limparCelula(i); return; } // dissolveu
  // chegou na superfície (ar em cima ou espuma em cima)
  const cima = y > 0 ? i - W : -1;
  const espumaEmCima = cima >= 0 && mt[cima] && MATS[mt[cima]].espuma;
  if (cima >= 0 && (abertaAoAr(cima) || espumaEmCima)) return estourar(i, x, y, g, tensoativo(x, y), espumaEmCima);
  if (!liq) { bfl[i] = 0; return; } // fora do líquido: virou gás comum
  const surf = tensoativo(x, y), sigma = surf ? SIGMA_DETERGENTE : SIGMA_AGUA;
  if (bfl[i] & B_GRUDA) {
    // tamanho de soltura (Fritz): V ∝ (σ / Δρ g)^(3/2); superfície que repele a água segura mais
    const Vd = volumeSoltura(sigma, solido >= 0 ? hidrofobico(solido) : 0);
    if (solido >= 0 && gv[i] >= 1 && hidrofobico(solido) > 0.45 && espalharBolha(i, g)) { /* encheu a célula: a bolha se espalha pela superfície */ }
    else if (solido < 0 || volumeAglomerado(i) > Vd) {
      bfl[i] &= ~B_GRUDA;
      if (objeto >= 0 || solido >= 0) fenomeno('soltou', 'A bolha se soltou', 'empuxo > tensão superficial', `A bolha cresceu até o empuxo vencer a força da tensão superficial que a prende (σ ≈ ${sigma} mN/m${surf ? ', baixa por causa do detergente: as bolhas se soltam menores' : ''}). Agora ela sobe: quanto maior, mais rápido (lei de Stokes).`);
    }
  } else if (objeto >= 0 && hidrofobico(objeto) > 0.5 && rnd() < 0.04) bfl[i] |= B_GRUDA; // bolha encosta numa superfície que repele água e gruda (flotação)
  // cresceu demais para uma célula: divide em duas, empurrando o líquido
  if (gv[i] > 1.4 && !(bfl[i] & B_GRUDA) && rnd() < 0.5) {
    // uma célula só guarda ~1 volume de gás: a bolha grande ocupa a vizinha (em cima ou do lado), empurrando o líquido
    const t = T[i], viz = [cima, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1];
    for (const k of viz) if (k >= 0 && ehLiq(k) && abrirEspaco(k)) { if (!(bfl[i] & B_BOLHA)) break; limparCelula(k); mt[k] = g; T[k] = t; bfl[k] = B_BOLHA; gv[k] = gv[i] / 2; gv[i] /= 2; break; }
  }
}
// gás total de um aglomerado de bolhas grudadas (é o aglomerado inteiro que o empuxo tenta arrancar)
function volumeAglomerado(i) {
  const W = L.W, vistos = [i]; let soma = 0;
  for (let n = 0; n < vistos.length && vistos.length < 14; n++) {
    const k = vistos[n]; soma += gv[k];
    for (const v of [k - 1, k + 1, k - W, k + W]) if (v >= 0 && v < L.N && (bfl[v] & B_GRUDA) && (bfl[v] & B_BOLHA) && mt[v] === mt[i] && !vistos.includes(v)) vistos.push(v);
  }
  return soma;
}
// bolha cheia grudada: cresce para uma célula de líquido vizinha que também encoste no sólido
function espalharBolha(i, g) {
  const W = L.W, x = i % W;
  for (const k of [i - W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i + W]) {
    if (k < 0 || k >= L.N || !ehLiq(k)) continue;
    const kx = k % W; let tocaSolido = false;
    for (const v of [k - W, kx > 0 ? k - 1 : -1, kx < W - 1 ? k + 1 : -1, k + W]) if (v >= 0 && v < L.N && v !== i && mt[v] && !(bfl[v] & B_BOLHA) && estadoDe(MATS[mt[v]], T[v]) === 0) { tocaSolido = true; break; }
    if (!tocaSolido) continue;
    const t = T[i]; if (!abrirEspaco(k)) continue;
    if (!(bfl[i] & B_BOLHA)) return true; // o caminho passou pela própria bolha (raro): deixa para o próximo passo
    limparCelula(k); mt[k] = g; T[k] = t; bfl[k] = B_BOLHA | B_GRUDA; gv[k] = gv[i] / 2; gv[i] /= 2;
    return true;
  }
  return false;
}
// coloca n células de espuma no ar mais perto, passando por cima da espuma que já existe
function empilharEspuma(i, n, esp, vd, t) {
  const W = L.W, vistos = new Set([i]), fila = [i];
  for (let q = 0; q < fila.length && n > 0 && q < 600; q++) {
    const k = fila[q], x = k % W;
    for (const v of [k - W, x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1]) {
      if (v < 0 || vistos.has(v)) continue; vistos.add(v);
      if (mt[v] === 0) { mt[v] = esp; T[v] = t; flg[v] = (flg[v] & TK) | PO; vida[v] = vd; n--; if (!n) return; fila.push(v); }
      else if (MATS[mt[v]].espuma) fila.push(v);
    }
  }
}
function estourar(i, x, y, g, surf, sobEspuma) {
  if (surf > 0 || sobEspuma) {
    // a película de detergente segura a bolha: vira espuma (dura mais com mais detergente)
    const h = MATS[g].simb === 'H';
    const vol = gv[i], esp = id(h ? 'EspumaH2' : 'Espuma'), vd = Math.min(250, 40 + surf * 12), t = T[i];
    limparCelula(i); mt[i] = esp; T[i] = t; flg[i] = (flg[i] & TK) | PO; vida[i] = vd;
    if (vol > 1.5) empilharEspuma(i, Math.round(vol) - 1, esp, vd, t); // cada volume de gás vira uma célula de espuma (a espuma cresce e transborda)
    fenomeno('espuma', 'Espuma: o detergente segura as bolhas', 'bolha + tensoativo → película estável', 'Cada molécula de detergente tem uma ponta que gosta de água e uma cauda que foge dela. As caudas se viram para dentro da bolha e a película de água fica presa entre duas camadas de detergente, que não deixam ela afinar e romper. Sem detergente a bolha estoura na hora.');
    return;
  }
  FIS.estouros.push({ x, y, t: performance.now(), r: 0.6 + Math.min(1.5, gv[i]) });
  if (gv[i] >= 0.5 && rnd() < gv[i]) { bfl[i] = 0; gv[i] = 0; } else limparCelula(i);
  fenomeno('estouro', 'A bolha estourou na superfície', 'CO₂(g) → ar', 'Na superfície, a película de água em cima da bolha afina até romper (sem detergente leva frações de segundo). O gás vai para o ar. Se essa bolha estava grudada num objeto, ele perde esse empuxo.');
}

/* ---------- pipoca ---------- */
function estourarPipoca(i) {
  const M = MATS[mt[i]], W = L.W, c = corpo[i], p = id('Pipoca'), t = T[i];
  if (rnd() > 0.15) return;
  const cel = []; if (c) { for (let k = 0; k < L.N; k++) if (corpo[k] === c) cel.push(k); } else cel.push(i);
  for (const k of cel) { mt[k] = p; flg[k] &= TK; }
  // o amido expande: cada célula de grão vira várias de pipoca (o volume cresce muitas vezes)
  let extra = cel.length * (M.expande || 5);
  const fila = cel.slice(); let n = 0;
  while (extra > 0 && n < fila.length && n < 3000) {
    const k = fila[n++], x = k % W, y = (k / W) | 0;
    for (let d = 0; d < 8 && extra > 0; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= W || ny >= L.H) continue; const v = ny * W + nx; if (mt[v] === 0 && rnd() < 0.7) { mt[v] = p; T[v] = t; flg[v] = flg[v] & TK; corpo[v] = c; fila.push(v); extra--; } }
  }
  if (c) { const b = CORPOS.get(c) || novoCorpo(c); b.vy = -1.2; b.vx = (rnd() - 0.5) * 1.2; }
  FIS.estouros.push({ x: i % W, y: (i / W) | 0, t: performance.now(), r: 3, pipoca: true });
  L.explosoesPipoca = (L.explosoesPipoca || 0) + 1;
  fenomeno('pipoca', 'Pipoca! O grão estourou', 'H₂O(l, dentro do grão) → H₂O(g) · ~180 °C, ~9 atm', 'O milho de pipoca tem ~14% de água dentro de uma casca dura e impermeável (pericarpo). Aquecida, a água vira vapor, mas não consegue sair: a pressão sobe até ~9 atm. Perto de 180 °C a casca rompe de uma vez, o vapor expande e infla o amido amolecido, que esfria e endurece numa espuma sólida até 40 vezes maior. Grão sem água (velho ou furado) não estoura.');
}

/* ---------- objetos rígidos (empuxo de Arquimedes) ---------- */
const CORPOS = new Map(); let proxCorpo = 1;
function novoCorpo(k) {
  if (!k) { do { proxCorpo = proxCorpo >= 65000 ? 1 : proxCorpo + 1; } while (CORPOS.has(proxCorpo)); k = proxCorpo; }
  const b = { vy: 0, vx: 0, ay: 0, ax: 0, flut: 0, w: 0, ang: 0 }; CORPOS.set(k, b); return b.id = k, b;
}
const novoCorpoId = () => novoCorpo().id;
// densidade do fluido que a célula i (de um conjunto) está ocupando: olha para os lados, fora do conjunto
function fluidoEm(i, set) {
  const W = L.W, x = i % W, y = (i / W) | 0; let soma = 0, n = 0, liq = 0, visc = 0;
  for (const dir of [-1, 1]) {
    for (let k = 1; k < 40; k++) {
      const nx = x + dir * k; if (nx < 0 || nx >= W) break;
      const j = y * W + nx; if (set.has(j)) continue;
      const m = mt[j];
      if (m === 0) { soma += AR_D; n++; }
      else { const M = MATS[m], s = estadoDe(M, T[j]); if (bfl[j] & B_BOLHA) { const L2 = liquidoAoLado(j); if (L2) { soma += L2.d; n++; liq++; } } else if (s === 1) { soma += M.dens[1]; n++; liq++; if (M.viscoso) visc++; } else if (s >= 2) { soma += AR_D; n++; } }
      break;
    }
  }
  if (!n) { // preso dos dois lados: usa o de cima
    for (let k = 1; k < 40; k++) { const j = i - k * W; if (j < 0) break; if (set.has(j)) continue; const m = mt[j]; if (m && estadoDe(MATS[m], T[j]) === 1) { soma = MATS[m].dens[1]; liq = 1; } else soma = AR_D; n = 1; break; }
  }
  return { d: n ? soma / n : AR_D, liq: liq > 0, visc };
}
function liquidoAoLado(j) { const W = L.W; for (const v of [j - 1, j + 1, j - W, j + W]) if (v >= 0 && v < L.N && ehLiq(v)) return { d: MATS[mt[v]].dens[1] }; return null; }
function corpos() {
  const cel = new Map();
  for (let i = 0; i < L.N; i++) {
    const c = corpo[i]; if (!c) continue;
    if (!mt[i] || estadoDe(MATS[mt[i]], T[i]) !== 0) { corpo[i] = 0; continue; } // derreteu ou queimou: sai do objeto
    let a = cel.get(c); if (!a) { a = []; cel.set(c, a); } a.push(i);
  }
  for (const k of [...CORPOS.keys()]) if (!cel.has(k)) CORPOS.delete(k);
  for (const [k, a] of cel) moverCorpo(CORPOS.get(k) || novoCorpo(k), a);
}
function moverCorpo(b, cells) {
  const W = L.W, set = new Set(cells), bolhas = [];
  for (const i of cells) { const x = i % W; for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = ((i / W) | 0) + DY[d]; if (nx < 0 || ny < 0 || nx >= W || ny >= L.H) continue; const j = ny * W + nx; if ((bfl[j] & B_BOLHA) && (bfl[j] & B_GRUDA) && !set.has(j)) { set.add(j); bolhas.push(j); } } }
  let massa = 0, desloc = 0, liq = 0, visc = 0, gas = 0;
  for (const i of cells) { massa += MATS[mt[i]].dens[0]; const f = fluidoEm(i, set); desloc += f.d; if (f.liq) liq++; visc += f.visc; }
  for (const j of bolhas) { const f = liquidoAoLado(j); if (f) { desloc += f.d * gv[j]; gas += gv[j]; } }
  const V = cells.length, imerso = liq / V;
  // força resultante (em "gramas" por célula): empuxo − peso. Massa efetiva inclui o fluido que vai junto (massa adicional)
  const F = desloc - massa, mEf = massa + 0.5 * desloc;
  b.vy -= 0.05 * F / mEf;
  const arrasto = imerso > 0.2 ? 0.03 + 0.12 * visc / Math.max(1, liq) : 0.012; // um grão afunda na água a ~10 cm/s: o arrasto não é tão grande
  b.vy *= 1 - arrasto; b.vx *= 1 - arrasto * 1.5;
  b.vy = Math.max(-1, Math.min(1, b.vy)); b.vx = Math.max(-1, Math.min(1, b.vx));
  b.info = { massa, desloc, V, gas, bolhas: bolhas.length, dens: massa / (V + gas), imerso, densFluido: desloc / Math.max(1e-6, V + gas) };
  if (imerso > 0.2 && F > 0 && b.flut !== 1) { b.flut = 1; if (gas > 0) fenomeno('boia', 'O objeto subiu com as bolhas', 'empuxo (fluido + bolhas) > peso', `Sozinho o objeto é mais denso que o líquido e afunda. As bolhas grudadas nele aumentam o volume sem quase aumentar a massa: a densidade média caiu de ${MATS[mt[cells[0]]].dens[0].toFixed(2)} para ${(massa / (V + gas)).toFixed(2)} g/cm³, menor que a do líquido. Pelo princípio de Arquimedes o empuxo venceu o peso.`); }
  if (F < 0 && b.flut === 1) { b.flut = -1; if (b.info.gas >= 0) fenomeno('afunda', 'Perdeu as bolhas e afundou', 'peso > empuxo', 'Na superfície, as bolhas de cima ficaram expostas ao ar e estouraram. Sem o gás, a densidade média voltou a ser maior que a do líquido e o objeto desce, até juntar bolhas de novo lá embaixo. É o "milho dançante".'); }
  // torque: o empuxo das bolhas age onde elas estão. Gás de um lado gira o objeto; gás embaixo do centro de massa é instável (vira)
  if (gas > 0.05 && imerso > 0.2) {
    let mx = 0, my = 0, gx = 0, gy = 0;
    for (const i of cells) { const d = MATS[mt[i]].dens[0]; mx += (i % W) * d; my += ((i / W) | 0) * d; }
    mx /= massa; my /= massa;
    for (const j of bolhas) { gx += (j % W) * gv[j]; gy += ((j / W) | 0) * gv[j]; }
    gx /= gas; gy /= gas;
    let tq = (gx - mx) * gas;
    if (gy > my + 0.3 && Math.abs(tq) < 0.3 * gas) tq += (rnd() < 0.5 ? -1 : 1) * 0.6 * gas; // centro de empuxo abaixo do centro de massa: equilíbrio instável
    b.w = (b.w + 0.03 * tq / Math.max(1, V * 0.2)) * (1 - arrasto);
    b.ang += b.w;
    if (Math.abs(b.ang) >= 1) { if (rodarConjunto(set, Math.round(mx), Math.round(my), Math.sign(b.ang))) { fenomeno('gira', 'O objeto virou', 'torque do empuxo', 'O empuxo das bolhas age onde elas estão, não no centro do objeto. Quando o gás fica de um lado (ou embaixo do centro de massa, que é instável), aparece um torque e o objeto gira. Assim as bolhas de baixo chegam à superfície e estouram também.'); } b.ang = 0; b.w *= 0.3; }
  }
  b.ay += b.vy; b.ax += b.vx;
  if (Math.abs(b.ay) >= 1) {
    const dy = Math.sign(b.ay);
    if (moverConjunto(set, 0, dy)) b.ay -= dy;
    else { // bateu: tenta escorregar para o lado (como um grão rolando de um monte)
      const dx = rnd() < 0.5 ? -1 : 1;
      if (dy > 0 && podeMover(set, dx, 1) && moverConjunto(set, dx, 0)) { b.ay = 0; }
      else { b.ay = 0; b.vy = 0; }
    }
  } else if (Math.abs(b.ax) >= 1) { const dx = Math.sign(b.ax); if (moverConjunto(set, dx, 0)) b.ax -= dx; else { b.ax = 0; b.vx = 0; } }
}
// o que um objeto consegue empurrar ao se mover: ar, gás, líquido, bolhas soltas, pó
function empurravel(t) {
  const m = mt[t]; if (m === 0) return true; if (corpo[t]) return false;
  const M = MATS[m]; if (M.inerte || M.vidro || M.tempFixa !== undefined) return false;
  const s = estadoDe(M, T[t]); if (s >= 1) return true; return !!(flg[t] & PO);
}
function podeMover(set, dx, dy) { const W = L.W; for (const i of set) { const x = i % W + dx, y = ((i / W) | 0) + dy; if (x < 0 || y < 0 || x >= W || y >= L.H) return false; const t = y * W + x; if (!set.has(t) && !empurravel(t)) return false; } return true; }
const lerCel = i => [mt[i], T[i], flg[i], vida[i], carga[i], varc[i], aux[i], dis[i], disG[i], gv[i], bfl[i], corpo[i]];
function porCel(i, v) { mt[i] = v[0]; T[i] = v[1]; flg[i] = v[2]; vida[i] = v[3]; carga[i] = v[4]; varc[i] = v[5]; aux[i] = v[6]; dis[i] = v[7]; disG[i] = v[8]; gv[i] = v[9]; bfl[i] = v[10]; corpo[i] = v[11]; }
function moverConjunto(set, dx, dy) {
  if (!podeMover(set, dx, dy)) return false;
  const W = L.W, desl = W * dy + dx, frente = [], vagas = [];
  for (const i of set) { const t = i + desl; if (!set.has(t)) frente.push(t); if (!set.has(i - desl)) vagas.push(i); }
  // o fluido da frente vai para as casas que o objeto deixa para trás, na mesma coluna (ou linha)
  const chave = k => dy ? k % W : (k / W) | 0, ordem = (a, b) => a - b;
  const grupos = new Map();
  for (const t of frente) { const k = chave(t); if (!grupos.has(k)) grupos.set(k, [[], []]); grupos.get(k)[0].push(t); }
  for (const v of vagas) { const k = chave(v); if (!grupos.has(k)) grupos.set(k, [[], []]); grupos.get(k)[1].push(v); }
  const dadosFluido = [], dadosObj = [];
  for (const [, [f, v]] of grupos) { f.sort(ordem); v.sort(ordem); for (let n = 0; n < f.length; n++) dadosFluido.push([v[n], lerCel(f[n])]); }
  for (const i of set) dadosObj.push([i + desl, lerCel(i)]);
  for (const [d, v] of dadosFluido) porCel(d, v);
  for (const [d, v] of dadosObj) porCel(d, v);
  return true;
}

// gira o objeto (com as bolhas grudadas) 90° em volta de (cx, cy); o fluido ocupa as casas que ele deixa
function rodarConjunto(set, cx, cy, sentido) {
  const W = L.W, mapa = new Map(), alvos = new Set();
  for (const i of set) {
    const dx = (i % W) - cx, dy = ((i / W) | 0) - cy;
    const nx = cx + (sentido > 0 ? dy : -dy), ny = cy + (sentido > 0 ? -dx : dx);
    if (nx < 0 || ny < 0 || nx >= W || ny >= L.H) return false;
    const t = ny * W + nx; if (!set.has(t) && !empurravel(t)) return false;
    mapa.set(i, t); alvos.add(t);
  }
  const frente = [...alvos].filter(t => !set.has(t)).sort((a, b) => a - b), vagas = [...set].filter(i => !alvos.has(i)).sort((a, b) => a - b);
  const fluido = frente.map((t, n) => [vagas[n], lerCel(t)]), obj = [...mapa].map(([i, t]) => [t, lerCel(i)]);
  for (const [d, v] of fluido) porCel(d, v);
  for (const [d, v] of obj) porCel(d, v);
  return true;
}

/* ---------- desenho: estouros e o brilho das bolhas ---------- */
function areaPoros(i) { const W = L.W; for (const v of [i - 1, i + 1, i - W, i + W]) if (v >= 0 && v < L.N && mt[v] && MATS[mt[v]].nucleos) return Math.min(25, MATS[mt[v]].nucleos / 2.4); return 1; }
// tem bolha subindo encostada? (a esteira da bolha agita o líquido)
function agitadoPerto(i) { const W = L.W; for (const v of [i - 1, i + 1, i - W, i + W]) if (v >= 0 && v < L.N && (bfl[v] & B_BOLHA) && !(bfl[v] & B_GRUDA)) return true; return false; }
function corLiquidoEmVolta(i) {
  const W = L.W; for (const v of [i - 1, i + 1, i + W, i - W]) if (v >= 0 && v < L.N && mt[v] && !(bfl[v] & B_BOLHA)) { const M = MATS[mt[v]], s = estadoDe(M, T[v]); if (s === 1) return M.rgb[1]; }
  return [47, 111, 208];
}
function velBolha(j) { return Math.min(1, 0.12 + Math.pow(gv[j], 0.67)); }
function desenharExtras(c2) {
  const agora = performance.now();
  c2.save(); c2.lineWidth = 0.35;
  FIS.estouros = FIS.estouros.filter(e => agora - e.t < 350);
  for (const e of FIS.estouros) { const k = (agora - e.t) / 350; c2.strokeStyle = e.pipoca ? `rgba(255,240,200,${1 - k})` : `rgba(230,245,255,${0.9 - k * 0.9})`; c2.beginPath(); c2.arc(e.x + 0.5, e.y + 0.5, e.r * (0.5 + k * 1.6), 0, Math.PI * 2); c2.stroke(); }
  c2.restore();
}

/* ---------- ajustes nos materiais ---------- */
for (const k of ['Espuma', 'EspumaH2']) { const e = mat(k); if (e) e.espuma = true; }
{ const v = MATS[solucao('H', 'CH3COO')]; if (v) v.molar = 0.83; } // vinagre: ácido acético 5%
{ const a = MATS[solucao('H', 'CO3')]; if (a) { a.gasDis = ['CO2', 4.2]; a.nome = 'Água com gás (ácido carbônico)'; } } // água gaseificada: ~4 volumes de CO₂
