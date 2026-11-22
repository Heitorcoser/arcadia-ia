/* =========================================================================
   LABORATÓRIO DOS ELEMENTOS · química
   Registro de materiais (elementos, compostos, soluções), fórmulas, massas
   molares e as REGRAS que decidem o que acontece quando duas coisas se tocam.
   As regras gerais seguem a química dos livros: série de reatividade, regras
   de solubilidade, ácido + base, deslocamento, combustão, óxidos com água.
   ========================================================================= */
'use strict';

/* ---------- utilidades de fórmula ---------- */
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const fmt = f => String(f || '').replace(/([A-Za-z\)])(\d+)/g, (m, a, n) => a + n.split('').map(d => SUB[d]).join(''));
const SUP = n => ({ 1: '⁺', 2: '²⁺', 3: '³⁺', 4: '⁴⁺', '-1': '⁻', '-2': '²⁻', '-3': '³⁻' })[n] || '';
const mdc = (a, b) => b ? mdc(b, a % b) : a, mmc = (a, b) => a * b / mdc(a, b);
const MASSA = {}; // massa atômica por símbolo
for (const r of PUBCHEM) MASSA[r[1]] = r[2];
// massa molar de uma fórmula como "Ca3(PO4)2" ou "C12H22O11"
function massaMolar(f) {
  if (!f || /[^A-Za-z0-9()]/.test(f)) return null;
  let i = 0;
  function grupo() {
    const tot = {};
    while (i < f.length && f[i] !== ')') {
      let sub;
      if (f[i] === '(') { i++; sub = grupo(); i++; }
      else { const m = f.slice(i).match(/^[A-Z][a-z]?/); if (!m) return null; i += m[0].length; sub = { [m[0]]: 1 }; }
      const n = f.slice(i).match(/^\d+/); let k = 1; if (n) { k = +n[0]; i += n[0].length; }
      for (const s in sub) tot[s] = (tot[s] || 0) + sub[s] * k;
    }
    return tot;
  }
  const comp = grupo(); if (!comp) return null;
  let M = 0; for (const s in comp) { if (!MASSA[s]) return null; M += MASSA[s] * comp[s]; }
  return { M, comp };
}
const hexRgb = h => { if (!h) return null; const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const misturaCor = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

/* ---------- registro de materiais ---------- */
const MATS = [], POR_CHAVE = new Map();
const AR_D = 0.0012; // densidade do ar (g/cm³)
function registrar(m) {
  m.id = MATS.length; MATS.push(m); POR_CHAVE.set(m.chave, m.id);
  // densidades por estado: sólido, líquido, gás (gás ideal a 25 °C ≈ M / 24 465 g/cm³)
  const dg = m.Mgas ? m.Mgas / 24465 : (m.M ? m.M / 24465 : AR_D * 1.5);
  m.dens = [m.dS ?? m.d ?? 2, m.dL ?? m.d ?? 1, m.dG ?? dg];
  m.cpv = m.cp || 1;
  const lam = m.lam ?? 1;
  m.k = 0.03 + 0.55 * Math.max(0, Math.min(1, (Math.log10(Math.max(lam, 0.01)) + 1.7) / 4.4));
  m.capacidade = [m.dens[0] * m.cpv, m.dens[1] * m.cpv, Math.max(0.0012, m.dens[2] * m.cpv)];
  m.rgb = (m.cores || []).map(c => c ? hexRgb(c) : null);
  const base = m.rgb.find(Boolean) || [200, 200, 200];
  m.rgb = [m.rgb[0] || base, m.rgb[1] || misturaCor(base, [40, 40, 50], 0.15), m.rgb[2] || misturaCor(base, [240, 240, 250], 0.6)];
  return m.id;
}
const GAS_DIATOMICO = { O2: 'O', H2: 'H', N2: 'N', Cl2: 'Cl', F2: 'F', Br2: 'Br', I2: 'I' };
const id = chave => POR_CHAVE.has(chave) ? POR_CHAVE.get(chave) : GAS_DIATOMICO[chave] && POR_CHAVE.has(GAS_DIATOMICO[chave]) ? POR_CHAVE.get(GAS_DIATOMICO[chave]) : -1;
const mat = chave => MATS[id(chave)];

// 0 = ar/vazio, depois as "coisas" especiais do simulador
registrar({ chave: 'vazio', nome: 'Ar', tipo: 'vazio', cores: ['#000000'], d: AR_D, cp: 1, lam: 0.026, fixo: 2 });
registrar({ chave: 'FOGO', nome: 'Fogo (gases quentes)', tipo: 'especial', cores: [null, null, '#ff8a1a'], d: 0.0003, cp: 1, lam: 3, fixo: 3 });
registrar({ chave: 'FUMACA', nome: 'Fumaça', tipo: 'especial', cores: [null, null, '#5a5a5e'], d: 0.0011, cp: 1, lam: 0.05, fixo: 4 });

/* ---------- elementos ---------- */
const ELEM = {}; // símbolo → dados completos (inclusive os que não dá para colocar)
const DIATOMICO = { H: 2, N: 2, O: 2, F: 2, Cl: 2, Br: 2, I: 2 };
const LIQ_GAS = { H: 0.071, He: 0.125, N: 0.807, O: 1.141, F: 1.5, Ne: 1.207, Cl: 1.56, Ar: 1.4, Kr: 2.41, Xe: 2.94, Rn: 4.4 };
for (const r of PUBCHEM) {
  const [z, s, massa, cpk, config, eneg, raio, ie, ea, oxid, estado, pf, pe, dens, grupoEn, ano, mohs, cp] = r;
  const grupo = GRUPO_PT[grupoEn] || grupoEn || '—';
  const e = { z, s, nome: NOMES_PT[z], massa, cpk, config, eneg, raio, ie, ea, oxid, estado, pf, pe, dens, grupo, ano, mohs: s === 'C' ? 0.5 : mohs, cp, radio: RADIO[s] || null, info: INFO[s] || null };
  e.colocavel = z <= 99 && !SEM_AMOSTRA.includes(z) && dens != null;
  ELEM[s] = e;
  if (!e.colocavel) continue;
  const metal = /Metal|Lantan|Actin/.test(grupo) && !/Semimetal|Não metal/.test(grupo);
  const gasPadrao = LIQ_GAS[s] !== undefined;
  let pfC = pf, peC = pe;
  if (s === 'He') { pfC = -272.2; peC = -268.9; } // hélio só solidifica sob pressão
  if (pfC == null) pfC = metal ? 1000 : 300;
  if (peC == null) peC = metal ? 2500 : 900;
  const sublima = peC <= pfC; // ex.: arsênio sublima a 614 °C
  const cores = (COR_EL[s] || []).slice();
  if (!cores[0]) cores[0] = metal ? '#' + (0xa8 + (z * 7) % 30).toString(16).repeat(3) : '#' + (cpk || 'cccccc');
  const R = REATIVO[s] || {};
  registrar({
    chave: s, simb: s, z, nome: NOMES_PT[z], formula: DIATOMICO[s] ? s + '2' : s === 'P' ? 'P4' : s === 'S' ? 'S8' : s,
    tipo: 'elemento', grupo, metal, M: massa, Mgas: massa * (DIATOMICO[s] || 1),
    pf: pfC, pe: peC, sublima, d: gasPadrao ? LIQ_GAS[s] : dens, dS: gasPadrao ? LIQ_GAS[s] * 1.08 : dens, dL: gasPadrao ? LIQ_GAS[s] : dens * 0.94,
    cp: cp || (metal ? 0.2 : 0.7), lam: LAMBDA[s] ?? (metal ? 30 : 0.5), cores,
    mohs: e.mohs, fragil: QUEBRADICO.includes(s) || (!metal && !gasPadrao), condutor: metal || CONDUTOR_EXTRA.includes(s), semicondutor: ['Si', 'Ge'].includes(s),
    curie: CURIE[s], radio: RADIO[s] ? RADIO[s][1] : 0, chama: CHAMA[s], descarga: DESCARGA[s],
    reat: R, tox: TOX[s] ? s : RADIO[s] ? 'radioativo' : /Lantan/.test(grupo) ? 'lantanideo' : 'desconhecido',
    po: ['S', 'P', 'B', 'Se', 'I', 'C'].includes(s),
  });
}

/* ---------- íons, sais e soluções ---------- */
const nomeCation = c => CATIONS[c].nome;
const simbCat = c => c === 'Fe3' ? 'Fe' : c;
function formulaSal(c, a) {
  const C = CATIONS[c], A = ANIONS[a], l = mmc(C.carga, A.carga), nc = l / C.carga, na = l / A.carga;
  const p = (s, n, poli) => n === 1 ? s : poli ? `(${s})${n}` : s + n;
  if (c === 'H' && a === 'CH3COO') return 'CH3COOH';
  return p(simbCat(c), nc, C.poli) + p(a, na, A.poli);
}
// índice fórmula → [cátion, ânion] (para reconhecer os compostos da lista)
const ION_DE_FORMULA = {};
for (const c in CATIONS) for (const a in ANIONS) { if (c === 'H' && a === 'OH') continue; ION_DE_FORMULA[formulaSal(c, a)] = [c, a]; }
ION_DE_FORMULA['CuSO4'] = ['Cu', 'SO4']; ION_DE_FORMULA['NaHCO3'] = ['Na', 'CO3']; ION_DE_FORMULA['CuCO3'] = ['Cu', 'CO3'];
const OXIDO_CAT = { MgO: 'Mg', CaO: 'Ca', Na2O: 'Na', Li2O: 'Li', K2O: 'K', BaO: 'Ba', SrO: 'Sr', ZnO: 'Zn', CuO: 'Cu', Cu2O: 'Cu', Fe2O3: 'Fe3', Fe3O4: 'Fe3', Al2O3: 'Al', NiO: 'Ni', CoO: 'Co', PbO: 'Pb', HgO: 'Hg', Ag2O: 'Ag', Mn2O3: 'Mn', Bi2O3: null, Na2O2: 'Na', KO2: 'K' };

/* ---------- compostos da lista ---------- */
for (const [k, c] of Object.entries(COMPOSTOS)) {
  const f = c.formula || k, mm = massaMolar(f);
  const ions = ION_DE_FORMULA[f] || ION_DE_FORMULA[k];
  registrar(Object.assign({}, c, {
    chave: k, formula: f, tipo: 'composto', M: mm ? mm.M : null, comp: mm ? mm.comp : null, Mgas: mm ? mm.M : null,
    cores: c.cor, dS: c.dS || c.d, dL: c.d * (c.dS ? 1 : 0.95), cp: c.cp || 0.9, lam: c.lam ?? (c.liga ? 60 : 1),
    ions: ions || null, sublima: !!c.sublima, po: !!c.po, fragil: !c.liga && !c.vidro && !c.inerte, condutor: !!c.liga, ionico: !!ions,
    tox: c.tox || (ions ? 'ions' : k), curie: c.curie, chama: ions ? CHAMA[simbCat(ions[0])] : null,
  }));
}
// alguns compostos usados pelas regras
const EXTRA_COMPOSTOS = {
  SiF4: { nome: 'Tetrafluoreto de silício', pf: -90.2, pe: -86, d: 1.66, cor: [null, null, '#f4f4f4'], tox: 'HF' },
  XeF2: { nome: 'Difluoreto de xenônio', pf: 129, pe: 155, d: 4.32, cor: ['#f6f6ff'], po: true, tox: 'HF', curio: 'Um composto de gás nobre! Até 1962 achava-se que eles não reagiam com nada.' },
  Li3N: { nome: 'Nitreto de lítio', pf: 813, pe: null, d: 1.27, cor: ['#a0402a'], po: true, agua: 'aq:Li:OH', aguaGas: 'NH3', aguaCalor: 30, curio: 'O lítio é o único metal que reage com o nitrogênio do ar em temperatura ambiente.' },
  Mg3N2: { nome: 'Nitreto de magnésio', pf: 1500, pe: null, d: 2.71, cor: ['#d8d890'], po: true, agua: 'Mg(OH)2', aguaGas: 'NH3' },
  NH2Cl: { nome: 'Cloramina', pf: -66, pe: 30, d: 1.2, cor: [null, '#f2f6e0', '#eef4dc'], tox: 'Cl', curio: 'Gás tóxico que se forma ao misturar água sanitária com amônia: nunca misture produtos de limpeza.' },
};
for (const [k, c] of Object.entries(EXTRA_COMPOSTOS)) {
  const mm = massaMolar(k);
  registrar(Object.assign({}, c, { chave: k, formula: k, tipo: 'composto', M: mm && mm.M, comp: mm && mm.comp, Mgas: mm && mm.M, cores: c.cor, dS: c.d, dL: c.d * 0.95, cp: 0.9, lam: 1, po: !!c.po, fragil: true, tox: c.tox || k }));
}
ANIONS.ClO = { nome: 'Hipoclorito', carga: 1, acido: 'Ácido hipocloroso', phAcido: 4.2, bas: 3.3, oxidante: true };

// sal sólido (da lista ou genérico, com dados estimados)
function sal(c, a) {
  const f = formulaSal(c, a); let k = f;
  if (c === 'Cu' && a === 'SO4') k = 'CuSO4';
  if (POR_CHAVE.has(k)) return POR_CHAVE.get(k);
  if (POR_CHAVE.has('sal:' + f)) return POR_CHAVE.get('sal:' + f);
  const mm = massaMolar(f), cor = COR_PRECIPITADO[c + ':' + a] || (CATIONS[c].cor && a !== 'OH' ? misturaCor(hexRgb(CATIONS[c].cor), [255, 255, 255], 0.3).reduce((s, v) => s + v.toString(16).padStart(2, '0'), '#') : '#f4f4f2');
  return registrar({ chave: 'sal:' + f, formula: f, nome: (a === 'OH' ? 'Hidróxido' : ANIONS[a].nome) + ' de ' + nomeCation(c), tipo: 'composto', estimado: true,
    M: mm && mm.M, comp: mm && mm.comp, pf: 800, pe: null, d: 3, cp: 0.8, lam: 1, cores: [cor, misturaCor(hexRgb(cor), [255, 200, 120], 0.4).reduce((s, v) => s + v.toString(16).padStart(2, '0'), '#')], po: true, fragil: true, ions: [c, a], ionico: true, tox: 'ions', chama: CHAMA[simbCat(c)] });
}
// solução aquosa (~0,1 mol/L) de um par de íons
function solucao(c, a) {
  const k = 'aq:' + c + ':' + a; if (POR_CHAVE.has(k)) return POR_CHAVE.get(k);
  const C = CATIONS[c], A = ANIONS[a];
  let nome, ph;
  if (c === 'H') { nome = A.acido; ph = A.phAcido; }
  else if (a === 'OH') { nome = c === 'NH4' ? 'Amônia (solução aquosa)' : `Hidróxido de ${C.nome} (solução)`; ph = PH_BASE[c] ?? 12; }
  else if (c === 'Na' && a === 'ClO') { nome = 'Água sanitária (hipoclorito de sódio)'; ph = 11.5; }
  else { nome = `${A.nome} de ${C.nome} (solução)`; ph = Math.max(1, Math.min(13, 7 + (A.bas || 0) - (C.ac || 0))); }
  let cor = A.cor ? hexRgb(A.cor) : C.cor ? hexRgb(C.cor) : null; if (c === 'Ca' && a === 'OH') cor = [235, 240, 245];
  const corLiq = A.cor ? cor : cor ? misturaCor(cor, [60, 110, 200], 0.2) : [70, 120, 210];
  const f = (c === 'NH4' && a === 'OH') ? 'NH3' : formulaSal(c, a);
  const mm = massaMolar(f);
  return registrar({ chave: k, formula: f + '(aq)', soluto: f, nome, tipo: 'solucao', cat: c, an: a, ph: Math.round(ph * 10) / 10, M: 18.02, Msoluto: mm && mm.M, comp: mm && mm.comp,
    pf: -2, pe: 101, d: 1.05, dL: 1.05, dS: 0.95, cp: 4, lam: 0.6, cores: [misturaCor(corLiq, [230, 240, 255], 0.6).reduce((s, v) => s + v.toString(16).padStart(2, '0'), '#'), corLiq.reduce((s, v) => s + v.toString(16).padStart(2, '0'), '#'), '#e8eef8'],
    condutor: true, eletrolito: true, tox: 'ions', chama: CHAMA[simbCat(c)], acido: c === 'H', base: a === 'OH', oxidante: !!A.oxidante });
}
function solucaoAcucar() {
  if (POR_CHAVE.has('aq:Sacarose')) return POR_CHAVE.get('aq:Sacarose');
  return registrar({ chave: 'aq:Sacarose', formula: 'C12H22O11(aq)', soluto: 'C12H22O11', nome: 'Água com açúcar', tipo: 'solucao', ph: 7, M: 18.02, Msoluto: 342.3, comp: massaMolar('C12H22O11').comp, pf: -1, pe: 101, d: 1.04, cp: 4, lam: 0.6, cores: ['#e8f0ff', '#4a80d8', '#e8eef8'], tox: 'Sacarose' });
}
const rgbHex = a => '#' + a.map(v => v.toString(16).padStart(2, '0')).join('');
// água da torneira: água com um pouco de sais (conduz um pouco de eletricidade)
registrar({ chave: 'AguaTorneira', formula: 'H2O', nome: 'Água da torneira', tipo: 'solucao', comoAgua: true, reagente: true, ph: 7.4, M: 18.02, pf: 0, pe: 100, d: 0.998, dS: 0.917, cp: 4.18, lam: 0.6,
  cores: ['#d6ecff', '#3a78d4', '#e6eef8'], solidoNome: 'Gelo (de água da torneira)', gasNome: 'Vapor d’água', condutor: true, eletrolito: true, tox: 'AguaTorneira',
  uso: 'Água potável: tem pouco cálcio, magnésio, cloro residual e flúor.', curio: 'Por causa desses íons ela conduz um pouco de eletricidade (a destilada quase não conduz).' });
// lugol: iodo dissolvido em iodeto de potássio (marrom). Quimicamente se comporta como a solução de KI
function lugol() {
  if (POR_CHAVE.has('Lugol')) return POR_CHAVE.get('Lugol');
  const b = MATS[solucao('K', 'I')];
  return registrar(Object.assign({}, b, { chave: 'Lugol', nome: 'Lugol (iodo + iodeto de potássio)', formula: 'I2 + KI(aq)', lugol: true, reagente: true, cores: ['#d8a060', '#7a3a0a', '#e8e0d0'], rgb: undefined,
    uso: 'Antisséptico e teste do amido (fica azul-escuro).', curio: 'O iodo sozinho quase não dissolve na água; o iodeto de potássio "segura" o iodo formando I₃⁻, marrom.' }));
}
// cópia "tingida" de uma solução (ou da água) com um indicador: mesma química, outra cor
function tingida(B, cor, tag, nomeInd) {
  const base = B.base0 != null ? MATS[B.base0] : B;
  const k = 'ind:' + tag + ':' + base.chave + ':' + cor;
  if (POR_CHAVE.has(k)) return POR_CHAVE.get(k);
  const c = hexRgb(cor);
  return registrar(Object.assign({}, base, { chave: k, nome: `${base.liquidoNome || base.nome} + ${nomeInd}`, base0: base.id, indicador: tag, rgb: undefined, liquidoNome: undefined, reagente: false,
    comoAgua: base.chave === 'H2O' || !!base.comoAgua, cores: [rgbHex(misturaCor(c, [255, 255, 255], 0.45)), cor, (base.cores || [])[2] || '#e8eef8'] }));
}
// cor do indicador em cada pH (fenolftaleína: viragem 8,2–10; repolho roxo: antocianinas)
function corIndicador(tipo, ph) {
  if (tipo === 'fenol') return ph < 8.2 ? null : ph < 10 ? '#f06ab0' : '#e0208a';
  return ph < 3 ? '#e0203c' : ph < 5 ? '#d8408a' : ph < 7.5 ? '#7a3c9c' : ph < 9 ? '#3a5ad0' : ph < 11 ? '#20a08a' : ph < 12.5 ? '#7ac030' : '#e8d020';
}
const solChave = k => { const p = k.split(':'); return p[1] === 'Sacarose' ? solucaoAcucar() : solucao(p[1], p[2]); };
// soluções prontas para a aba "Soluções"
const SOLUCOES_PRONTAS = [['H', 'Cl'], ['H', 'SO4'], ['H', 'NO3'], ['H', 'F'], ['H', 'PO4'], ['H', 'CH3COO'], ['H', 'CO3'], ['Na', 'OH'], ['K', 'OH'], ['Ca', 'OH'], ['NH4', 'OH'], ['Na', 'Cl'], ['Cu', 'SO4'], ['Ag', 'NO3'], ['K', 'I'], ['Pb', 'NO3'], ['Ba', 'Cl'], ['Fe3', 'Cl'], ['Ni', 'Cl'], ['Co', 'Cl'], ['K', 'Br'], ['Na', 'CO3'], ['Na', 'SO4'], ['Na', 'ClO'], ['NH4', 'Cl'], ['Zn', 'SO4'], ['Mg', 'SO4'], ['Ca', 'Cl']].map(([c, a]) => solucao(c, a));
SOLUCOES_PRONTAS.push(solucaoAcucar(), solucao('K', 'MnO4'), lugol(), id('AguaTorneira'), solucao('H', 'C6H5O7'));
// marca íons nos compostos da lista (ex.: NaCl → Na, Cl) e reconhece os óxidos/hidróxidos básicos
for (const m of MATS) { if (m.tipo === 'composto' && OXIDO_CAT[m.chave] !== undefined) m.oxidoBasico = OXIDO_CAT[m.chave]; if (m.ions && m.ions[1] === 'OH') m.hidroxido = m.ions[0]; }

/* =========================================================================
   REGRAS DE REAÇÃO
   Uma regra diz: se A (célula i) encostar em B (célula j) nas condições certas,
   A vira pa e B vira pb, com probabilidade p por passo e calor dT.
   ========================================================================= */
const AGUA = id('H2O');
const ehAgua = m => m.chave === 'H2O' || !!m.comoAgua;
const ehSolAq = m => m.tipo === 'solucao' || ehAgua(m);
const serie = s => SERIE.indexOf(s);
const acimaH = s => serie(s) >= 0 && serie(s) < serie('H');
const TCHAMA = { H: 2100, C: 1200, S: 1100, P: 1000, Mg: 3100, Al: 3000, Fe: 1800, Zn: 1700, Ti: 2900, Zr: 3000, Na: 1000, K: 900, Li: 1100, Rb: 900, Cs: 900, Ca: 1800, Sr: 1800, Ba: 1600, Ce: 1700, U: 1600, Pu: 1600, B: 2100, CH4: 1950, Etanol: 1900, CO: 2100, Diamante: 1200, FosforoVermelho: 1000, Acetona: 1980, Glicerina: 1500, Oleo: 1100, Parafina: 1400, PalhaAco: 1800, EspumaH2: 2100 };
const IGN_BLOCO = { Ti: 1200, Zr: 1100, Ce: 400, U: 600, Pu: 500 };
const OXIDA_QUENTE = { Cu: ['CuO', 300], Ni: ['NiO', 500], Co: ['CoO', 500], Sn: ['SnO2', 400], Pb: ['PbO', 450], Bi: ['Bi2O3', 400], Sb: ['Sb2O3', 450], As: ['As2O3', 200], Cr: ['Cr2O3', 900], W: ['WO3', 600], Mo: ['MoO3', 600], V: ['V2O5', 650], Ge: ['GeO2', 700], Se: ['SeO2', 300], Hg: ['HgO', 350], Si: ['SiO2', 900], Fe: ['Fe3O4', 600], Mn: ['Mn2O3', 500], Os: ['OsO4', 200] };
const EQ_COMB = { H: '2 H₂ + O₂ → 2 H₂O', C: 'C + O₂ → CO₂', S: 'S + O₂ → SO₂', P: 'P₄ + 5 O₂ → P₄O₁₀', Mg: '2 Mg + O₂ → 2 MgO', Al: '4 Al + 3 O₂ → 2 Al₂O₃', Fe: '3 Fe + 2 O₂ → Fe₃O₄', Zn: '2 Zn + O₂ → 2 ZnO', Ti: 'Ti + O₂ → TiO₂', Zr: 'Zr + O₂ → ZrO₂',
  Li: '4 Li + O₂ → 2 Li₂O', Na: '2 Na + O₂ → Na₂O₂', K: 'K + O₂ → KO₂', Rb: 'Rb + O₂ → RbO₂', Cs: 'Cs + O₂ → CsO₂', Ca: '2 Ca + O₂ → 2 CaO', Sr: '2 Sr + O₂ → 2 SrO', Ba: '2 Ba + O₂ → 2 BaO', Ce: 'Ce + O₂ → CeO₂', U: '3 U + 4 O₂ → U₃O₈', Pu: 'Pu + O₂ → PuO₂', B: '4 B + 3 O₂ → 2 B₂O₃',
  CH4: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O', Etanol: 'C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O', CO: '2 CO + O₂ → 2 CO₂', Diamante: 'C (diamante) + O₂ → CO₂', FosforoVermelho: 'P₄ (vermelho) + 5 O₂ → P₄O₁₀', Acetona: 'C₃H₆O + 4 O₂ → 3 CO₂ + 3 H₂O', Glicerina: '2 C₃H₈O₃ + 7 O₂ → 6 CO₂ + 8 H₂O', Oleo: 'C₅₇H₁₀₄O₆ + 80 O₂ → 57 CO₂ + 52 H₂O', Parafina: 'C₂₅H₅₂ + 38 O₂ → 25 CO₂ + 26 H₂O', PalhaAco: '3 Fe + 2 O₂ → Fe₃O₄', EspumaH2: '2 H₂ + O₂ → 2 H₂O' };

let ATMOSFERA = 'ar'; // 'ar' | 'vacuo' | 'N2' | 'O2'
const temO2 = () => ATMOSFERA === 'ar' || ATMOSFERA === 'O2';
const cache = new Map();
function regra(a, b) {
  const key = a * 4096 + b; if (cache.has(key)) return cache.get(key);
  let r = null; try { r = criarRegra(MATS[a], MATS[b]); } catch (e) { console.error(e); r = null; }
  if (r) { r.pa = r.pa === undefined ? a : r.pa; r.pb = r.pb === undefined ? b : r.pb; r.p = r.p ?? 0.1; }
  cache.set(key, r); return r;
}
function limparCacheRegras() { cache.clear(); }
const R = (o) => o;
const eqIon = (c, n) => `${fmt(c)}${SUP(n)}`;
const minus = t => t ? t.charAt(0).toLowerCase() + t.slice(1) : t;

function criarRegra(A, B) {
  if (A.inerte || B.inerte || A.chave === 'vazio') return null;
  // ---------- 1. com o ar ----------
  if (B.chave === 'vazio') return regraAr(A);
  if (A.simb === 'H' && B.simb === 'O') return R({ pa: AGUA, pb: id('FOGO'), p: 0.9, tmin: 500, faisca: true, tA: 2500, tB: 2500, explosao: true, fogo: CHAMA.H, nome: 'Explosão de hidrogênio e oxigênio', eq: '2 H₂ + O₂ → 2 H₂O', dH: -286, nota: 'A mistura só precisa de uma faísca ou de chama para explodir (foi o que destruiu o dirigível Hindenburg).' });
  if (B.chave === 'O' ) { const r = regraAr(A, true); if (r) return r; }
  if (A.tipo === 'especial' || B.tipo === 'especial') return null;
  // ---------- reagentes de laboratório (peróxido, permanganato, indicadores, amido) ----------
  { const r = regraLab(A, B); if (r !== undefined) return r; }
  // ---------- 2. com água (ou soluções, que também têm água) ----------
  if (ehAgua(B) || (B.tipo === 'solucao' && A.reat && A.reat.agua >= 2)) { const r = regraAgua(A, B); if (r) return r; }
  // ---------- 3. metais com ácidos ----------
  if (A.metal && B.tipo === 'solucao' && B.acido) { const r = regraMetalAcido(A, B); if (r) return r; }
  if (A.metal && B.chave === 'AguaRegia' && ['Au', 'Pt'].includes(A.simb)) return R({ pa: solucao(A.simb === 'Au' ? 'Au' : 'Pt', 'Cl'), pb: id('NO2'), p: 0.01, dT: 10, nome: 'Água régia dissolvendo metal nobre', eq: A.simb === 'Au' ? 'Au + HNO₃ + 4 HCl → HAuCl₄ + NO + 2 H₂O' : '3 Pt + 4 HNO₃ + 18 HCl → 3 H₂PtCl₆ + 4 NO + 8 H₂O', nota: 'O ácido nítrico oxida o metal e o cloreto o prende em um íon complexo: só assim o ouro se dissolve.' });
  if (A.metal && B.chave === 'AguaRegia') return regraAcidoConc(A, { chave: 'HNO3' });
  if (A.metal && ['H2SO4', 'HNO3'].includes(B.chave)) { const r = regraAcidoConc(A, B); if (r) return r; }
  // ---------- 4. metal deslocando outro metal da solução ----------
  if (A.metal && B.tipo === 'solucao' && B.cat && B.cat !== 'H' && !B.base) { const r = regraDeslocamento(A, B); if (r) return r; }
  // ---------- 5. entre soluções: neutralização, precipitação, gás ----------
  if (A.tipo === 'solucao' && B.tipo === 'solucao') { const r = regraSolucoes(A, B); if (r) return r; }
  // ---------- 6. ácido com carbonatos, óxidos e hidróxidos sólidos ----------
  if (B.tipo === 'solucao' && B.acido && A.tipo === 'composto') { const r = regraAcidoSolido(A, B); if (r) return r; }
  // ---------- 7. gases e soluções ----------
  if (B.tipo === 'solucao') { const r = regraGasSolucao(A, B); if (r) return r; }
  // ---------- 8. halogênios ----------
  if (['F', 'Cl', 'Br', 'I'].includes(B.simb)) { const r = regraHalogenio(A, B); if (r) return r; }
  // ---------- 9. enxofre, nitrogênio, hidrogênio ----------
  if (B.simb === 'S' && A.metal) { const r = regraEnxofre(A); if (r) return r; }
  if (B.simb === 'N' && (A.simb === 'Li' || A.simb === 'Mg')) return A.simb === 'Li' ? R({ pa: id('Li3N'), pb: 0, p: 0.004, dT: 15, nome: 'Lítio + nitrogênio', eq: '6 Li + N₂ → 2 Li₃N', nota: 'O lítio é o único metal que reage com o nitrogênio já na temperatura ambiente.' }) : R({ pa: id('Mg3N2'), pb: 0, p: 0.3, tmin: 600, dT: 300, nome: 'Magnésio queimando em nitrogênio', eq: '3 Mg + N₂ → Mg₃N₂', nota: 'Magnésio em chamas é tão reativo que "queima" até em nitrogênio.' });
  if (A.simb === 'H' && B.simb === 'O') return R({ pa: AGUA, pb: id('FOGO'), p: 0.9, tmin: 500, faisca: true, tA: 2500, tB: 2500, explosao: true, fogo: CHAMA.H, nome: 'Explosão de hidrogênio e oxigênio', eq: '2 H₂ + O₂ → 2 H₂O', dH: -286, nota: 'A mistura só precisa de uma faísca ou de chama para explodir (foi o que destruiu o dirigível Hindenburg).' });
  if (A.simb === 'H' && B.simb === 'N') return R({ pa: id('NH3'), pb: 0, p: 0.002, tmin: 400, tmax: 600, dT: 5, nome: 'Síntese de amônia (Haber-Bosch)', eq: 'N₂ + 3 H₂ ⇌ 2 NH₃', dH: -46, nota: 'Na indústria precisa de ~200 atm e catalisador de ferro; aqui acontece bem devagar entre 400 e 600 °C.' });
  // ---------- 10. metal + óxido (termite / redução com carbono e hidrogênio) ----------
  const r10 = regraReducao(A, B); if (r10) return r10;
  // ---------- 11. mercúrio, gálio e ligas ----------
  const r11 = regraLigas(A, B); if (r11) return r11;
  // ---------- 12. casos especiais ----------
  return regraEspecial(A, B);
}

function regraAr(A, puroO2) {
  if (!puroO2 && !temO2()) return null;
  const rapido = puroO2 || ATMOSFERA === 'O2' ? 2.5 : 1;
  // combustão de elementos
  const re = A.reat || {}, inf = A.inflam || (re.ign ? { ign: re.ign, prod: re.comb, dH: re.dH, soPo: re.soPo } : null);
  if (inf && inf.prod) {
    const tChama = TCHAMA[A.simb || A.chave] || 1200;
    const prodA = A.chave === 'H' ? AGUA : id(inf.prod);
    if (prodA < 0) return null;
    return R({ pa: prodA, pb: id('FOGO'), p: 0.25 * rapido, tmin: inf.ign, soPo: inf.soPo, ignBloco: IGN_BLOCO[A.simb], tA: tChama * 0.7, tB: tChama, fogo: A.chama || CHAMA[A.simb] || '#ff9a2a', extra: inf.prod2 ? id(inf.prod2) : -1,
      faiscas: !!(A.metal || A.liga), nome: `Combustão: ${A.nome}`, eq: EQ_COMB[A.simb || A.chave] || `${fmt(A.formula)} + O₂ → ${fmt(MATS[prodA].formula)}`, dH: inf.dH, combustao: true,
      nota: `Precisa chegar a ~${inf.ign} °C${inf.soPo ? ' e estar em pó (em bloco o calor se espalha rápido demais)' : ''}. Chama de ~${tChama} °C.` });
  }
  // oxidação lenta de metais quentes (formam uma casca de óxido)
  if (A.simb && OXIDA_QUENTE[A.simb]) { const [ox, t] = OXIDA_QUENTE[A.simb]; const pid = id(ox); if (pid >= 0) return R({ pa: pid, p: 0.004 * rapido, tmin: t, nome: `Oxidação de ${A.nome} quente`, eq: `${A.simb} + O₂ → ${fmt(ox)}`, nota: `Acima de ~${t} °C o ar oxida a superfície do metal.`, gasB: A.simb === 'Os' }); }
  // amálgama de alumínio cresce "cabelos" de óxido no ar
  if (A.chave === 'Amalgama' && A._aux === 'Al') return null;
  return null;
}

function regraAgua(A, W) {
  const re = A.reat || {};
  // metais alcalinos e alcalinoterrosos: hidróxido + hidrogênio
  if (A.metal && re.agua) {
    const n = CARGA_METAL[A.simb] || 1, cat = A.simb;
    const vig = re.agua, base = CATIONS[cat] ? (['Mg'].includes(cat) ? sal('Mg', 'OH') : solucao(cat, 'OH')) : -1;
    if (base < 0) return null;
    const eq = n === 1 ? `2 ${cat} + 2 H₂O → 2 ${cat}OH + H₂↑` : `${cat} + 2 H₂O → ${cat}(OH)₂ + H₂↑`;
    const nomes = { 1: 'devagar, só com água quente', 2: 'borbulhando', 3: 'derretendo e correndo pela água', 4: 'com explosão' };
    return R({ pa: base, pb: vig >= 4 ? id('FOGO') : id('H'), p: [0, 0.01, 0.03, 0.12, 0.5][vig], tmin: vig === 1 ? 60 : null, dT: [0, 5, 25, 120, 500][vig], tB: vig >= 4 ? 1500 : null, fogo: vig >= 3 ? A.chama : null, explosao: vig >= 4, extra: vig >= 4 ? id('H') : -1,
      nome: `${A.nome} + água`, eq, dH: vig >= 3 ? -368 : -150, nota: `Reage ${nomes[vig]}: forma ${minus(MATS[base].nome)} e solta hidrogênio. ${vig >= 3 ? 'O calor pode inflamar o hidrogênio.' : ''}` });
  }
  if (!ehAgua(W)) return null;
  // gases que se dissolvem formando ácido ou base
  if (A.chave === 'HCl' || A.chave === 'HBr' || A.chave === 'HI' || A.chave === 'HF' || A.chave === 'NH3') { const pa = solChave(A.agua); return R({ pa, pb: pa, p: 0.3, dT: 10, nome: `${A.nome} dissolvendo na água`, eq: `${fmt(A.formula)} + H₂O → ${fmt(MATS[pa].formula)}`, nota: 'Este gás é extremamente solúvel em água.' }); }
  if (A.chave === 'SO2' || A.chave === 'SO3' || A.chave === 'NO2' || A.chave === 'CO2' || A.chave === 'P4O10') {
    const alvo = { SO2: solucao('H', 'SO3'), SO3: solucao('H', 'SO4'), NO2: solucao('H', 'NO3'), CO2: solucao('H', 'CO3'), P4O10: solucao('H', 'PO4') }[A.chave];
    return R({ pa: alvo, pb: alvo, p: A.chave === 'CO2' ? 0.01 : 0.15, dT: A.chave === 'SO3' ? 60 : A.chave === 'P4O10' ? 80 : 3, nome: `${A.nome} + água → ácido`, eq: { SO2: 'SO₂ + H₂O → H₂SO₃', SO3: 'SO₃ + H₂O → H₂SO₄', NO2: '3 NO₂ + H₂O → 2 HNO₃ + NO', CO2: 'CO₂ + H₂O ⇌ H₂CO₃', P4O10: 'P₄O₁₀ + 6 H₂O → 4 H₃PO₄' }[A.chave], nota: A.chave === 'SO2' || A.chave === 'NO2' ? 'É assim que se forma a chuva ácida.' : '' });
  }
  // compostos que reagem com água (óxidos, peróxidos, nitretos, gálio-alumínio...)
  if (A.agua) {
    const pa = A.agua.startsWith('aq:') ? solChave(A.agua) : id(A.agua); if (pa < 0) return null;
    const pb = A.aguaGas ? id({ O2: 'O', H2: 'H', N2: 'N', Cl2: 'Cl' }[A.aguaGas] || A.aguaGas) : (A.agua.startsWith('aq:') ? pa : W.id);
    return R({ pa, pb, p: A.aguaLenta ? 0.003 : 0.08, dT: A.aguaCalor || 5, nome: `${A.nome} + água`, eq: `${fmt(A.formula)} + H₂O → ${fmt(MATS[pa].formula)}${A.aguaGas ? ' + ' + fmt(A.aguaGas) + '↑' : ''}`, nota: A.aguaCalor >= 40 ? 'Solta bastante calor.' : '' });
  }
  if (A.chave === 'H2SO4' || A.chave === 'HNO3') { const pa = solucao('H', A.chave === 'H2SO4' ? 'SO4' : 'NO3'); return R({ pa, pb: pa, p: 0.2, dT: A.diluiCalor, nome: `Diluindo ${minus(A.nome)}`, eq: `${fmt(A.formula)} + H₂O → ${fmt(MATS[pa].formula)}`, dH: A.chave === 'H2SO4' ? -96 : -33, nota: 'Diluir ácido concentrado solta muito calor: o certo é sempre colocar o ácido na água, devagar.' }); }
  if (A.simb === 'F') return R({ pa: solucao('H', 'F'), pb: id('O'), p: 0.4, dT: 80, nome: 'Flúor + água', eq: '2 F₂ + 2 H₂O → 4 HF + O₂', nota: 'O flúor é tão reativo que arranca o oxigênio da água.' });
  if (A.simb === 'Cl') return R({ pa: solucao('H', 'Cl'), p: 0.01, dT: 2, nome: 'Cloro + água (água de cloro)', eq: 'Cl₂ + H₂O ⇌ HCl + HClO', nota: 'Forma ácido clorídrico e ácido hipocloroso (que desinfeta).' });
  if (A.chave === 'Sacarose') { const pa = solucaoAcucar(); return R({ pa, pb: pa, p: 0.05, dT: 0, nome: 'Açúcar dissolvendo', eq: 'C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq)', nota: 'Dissolve sem formar íons: a água com açúcar NÃO conduz eletricidade.' }); }
  // sais solúveis se dissolvem
  if (A.ions && A.estimado !== false) {
    const [c, a] = A.ions;
    if (soluvel(c, a)) { const pa = solucao(c, a); return R({ pa, pb: pa, p: 0.05, dT: A.dissolveCalor ? A.dissolveCalor / 3 : 0, nome: `${A.nome} dissolvendo`, eq: `${fmt(A.formula)}(s) → ${eqIon(simbCat(c) === c ? c : simbCat(c), CATIONS[c].carga)} + ${eqIon(a, -ANIONS[a].carga)}`, nota: 'Os íons se separam e ficam soltos na água: a solução passa a conduzir eletricidade.' }); }
  }
  return null;
}

function regraMetalAcido(A, S) {
  const s = A.simb; if (!CARGA_METAL[s]) return null;
  const an = S.an, Aan = ANIONS[an], n = CARGA_METAL[s];
  const cat = s === 'Fe' ? 'Fe' : s;
  if (!CATIONS[cat]) return null;
  if (Aan.oxidante) { // ácido nítrico: solta NO₂ (gás marrom) em vez de H₂
    if (['Au', 'Pt'].includes(s)) return null;
    if (['Al', 'Fe', 'Cr'].includes(s)) return R({ pa: A.id, p: 0, nome: 'Passivação', eq: '— (forma uma camada protetora de óxido)', nota: 'O ácido nítrico forma uma camada de óxido que protege o metal.' });
    return R({ pa: soluvel(cat, an) ? solucao(cat, an) : sal(cat, an), pb: id('NO2'), p: 0.03, dT: 15, nome: `${A.nome} + ácido nítrico`, eq: s === 'Cu' ? 'Cu + 4 HNO₃ → Cu(NO₃)₂ + 2 NO₂↑ + 2 H₂O' : `${s} + HNO₃ → ${fmt(formulaSal(cat, 'NO3'))} + NO₂↑ + H₂O`, nota: 'O ácido nítrico é oxidante: dissolve até cobre e prata, soltando um gás marrom tóxico (NO₂).' });
  }
  if (!acimaH(s)) return null; // cobre, prata, ouro: não deslocam o hidrogênio
  const prod = soluvel(cat, an) ? solucao(cat, an) : sal(cat, an);
  let p = 0.004 + (serie('H') - serie(s)) * 0.004; if (S.ph > 2) p *= 0.3;
  if (s === 'Pb') p = 0.0005; // o sal de chumbo insolúvel cobre o metal
  const eq = n === 1 ? `2 ${s} + 2 H⁺ → 2 ${s}⁺ + H₂↑` : n === 2 ? `${s} + 2 H⁺ → ${s}²⁺ + H₂↑` : `2 ${s} + 6 H⁺ → 2 ${s}³⁺ + 3 H₂↑`;
  return R({ pa: prod, pb: id('H'), p, dT: 8 + (serie('H') - serie(s)) * 2, nome: `${A.nome} + ${minus(S.nome)}`, eq, nota: `O ${minus(A.nome)} está acima do hidrogênio na série de reatividade: arranca o H⁺ do ácido e solta gás hidrogênio.` });
}
function regraAcidoConc(A, B) {
  const s = A.simb;
  if (B.chave === 'H2SO4') {
    if (['Fe', 'Al', 'Cr'].includes(s)) return R({ pa: A.id, p: 0, nome: 'Passivação', eq: '— (forma uma camada protetora de óxido)', nota: 'O ácido sulfúrico concentrado e frio cria uma camada protetora no metal.' });
    if (['Cu', 'Ag', 'Hg', 'Zn', 'Sn', 'Pb', 'Mg'].includes(s)) return R({ pa: sal(s, 'SO4'), pb: id('SO2'), p: 0.02, tmin: 100, dT: 20, nome: `${A.nome} + ácido sulfúrico concentrado quente`, eq: `${s} + 2 H₂SO₄ → ${fmt(formulaSal(s, 'SO4'))} + SO₂↑ + 2 H₂O`, nota: 'Quente e concentrado, o ácido sulfúrico vira oxidante e solta SO₂.' });
  }
  if (B.chave === 'HNO3' && !['Au', 'Pt', 'Al', 'Fe', 'Cr'].includes(s) && CATIONS[s]) return R({ pa: sal(s, 'NO3'), pb: id('NO2'), p: 0.05, dT: 30, nome: `${A.nome} + ácido nítrico concentrado`, eq: `${s} + 4 HNO₃ → ${fmt(formulaSal(s, 'NO3'))} + 2 NO₂↑ + 2 H₂O`, nota: 'Reação violenta com nuvem marrom de NO₂.' });
  return null;
}
function regraDeslocamento(A, S) {
  const s = A.simb, c = S.cat, alvo = simbCat(c);
  if (!CARGA_METAL[s] || serie(s) < 0 || serie(alvo) < 0 || alvo === 'H') return null;
  if (serie(s) >= serie(alvo)) return null; // só o mais reativo desloca
  if (A.reat && A.reat.agua >= 2) return null; // alcalinos reagem com a água antes
  const m = CARGA_METAL[s], n = CATIONS[c].carga, l = mmc(m, n), a = l / m, b = l / n;
  const prod = soluvel(s, S.an) ? solucao(s, S.an) : sal(s, S.an), metal = id(alvo);
  if (metal < 0 || prod < 0) return null;
  const k = (x, t) => x === 1 ? t : `${x} ${t}`;
  return R({ pa: prod, pb: metal, p: 0.015, dT: 4, poB: true, nome: `${A.nome} deslocando ${minus(MATS[metal].nome)}`, eq: `${k(a, s)} + ${k(b, eqIon(alvo, n))} → ${k(a, eqIon(s, m))} + ${k(b, alvo)}↓`, nota: `${A.nome} é mais reativo que ${minus(MATS[metal].nome)} (série de reatividade): entra na solução e o outro metal se deposita.` });
}
function regraSolucoes(A, B) {
  if (!A.cat || !B.cat) return null;
  // ácido + base → sal + água
  if (A.acido && B.base) {
    const c = B.cat, an = A.an, ok = soluvel(c, an);
    return R({ pa: ok ? solucao(c, an) : sal(c, an), pb: ok ? solucao(c, an) : AGUA, p: 0.3, dT: 6, poA: !ok, nome: 'Neutralização (ácido + base)', eq: 'H⁺ + OH⁻ → H₂O', dH: -57, nota: `O ácido e a base se anulam formando ${(ok ? MATS[solucao(c, an)] : MATS[sal(c, an)]).nome.toLowerCase()} e água. Solta calor (−57 kJ por mol de água).` });
  }
  if (A.base && B.acido) return null; // a regra inversa é achada pela vizinha
  // ácido + carbonato / sulfito → gás
  if (A.acido && (B.an === 'CO3' || B.an === 'SO3')) { const gas = B.an === 'CO3' ? id('CO2') : id('SO2'); const c = B.cat, an = A.an; return R({ pa: soluvel(c, an) ? solucao(c, an) : sal(c, an), pb: gas, p: 0.2, dT: 1, nome: B.an === 'CO3' ? 'Ácido + carbonato: efervescência' : 'Ácido + sulfito', eq: B.an === 'CO3' ? 'CO₃²⁻ + 2 H⁺ → CO₂↑ + H₂O' : 'SO₃²⁻ + 2 H⁺ → SO₂↑ + H₂O', nota: 'As bolhas são de gás carbônico (é o "vulcão" de vinagre com bicarbonato).' }); }
  // ácido + hipoclorito (água sanitária) → cloro! (acidente doméstico comum)
  if (A.acido && B.an === 'ClO') return R({ pa: solucao(B.cat, A.an === 'CH3COO' ? 'CH3COO' : A.an), pb: id('Cl'), p: 0.2, dT: 2, nome: '⚠️ Água sanitária + ácido: gás cloro', eq: 'ClO⁻ + Cl⁻ + 2 H⁺ → Cl₂↑ + H₂O', nota: 'Misturar água sanitária com produtos ácidos (desincrustantes, vinagre) solta gás cloro, que é tóxico. Nunca misture produtos de limpeza.' });
  // base forte + sal de amônio → amônia
  if (A.base && A.cat !== 'NH4' && B.cat === 'NH4') return R({ pa: solucao(A.cat, B.an), pb: id('NH3'), p: 0.1, nome: 'Base + amônio: libera amônia', eq: 'NH₄⁺ + OH⁻ → NH₃↑ + H₂O', nota: 'Teste clássico de laboratório para identificar o íon amônio (cheiro forte).' });
  // água sanitária + amônia → cloramina
  if (A.an === 'ClO' && B.cat === 'NH4' && B.an === 'OH') return R({ pa: id('NH2Cl'), pb: solucao(A.cat, 'OH'), p: 0.15, nome: '⚠️ Água sanitária + amônia: cloramina', eq: 'NH₃ + ClO⁻ → NH₂Cl↑ + OH⁻', nota: 'Forma cloramina, um gás tóxico. É outro motivo para nunca misturar produtos de limpeza.' });
  // precipitação: troca de parceiros que forma um sólido insolúvel
  for (const [c1, a2, c2, a1] of [[A.cat, B.an, B.cat, A.an], [B.cat, A.an, A.cat, B.an]]) {
    if (c1 === 'H' || c2 === 'H') continue;
    if (!soluvel(c1, a2)) {
      const pre = sal(c1, a2), resto = soluvel(c2, a1) ? solucao(c2, a1) : sal(c2, a1);
      const n1 = CATIONS[c1].carga, n2 = ANIONS[a2].carga, l = mmc(n1, n2), x = l / n1, y = l / n2, kk = (q, t) => q === 1 ? t : `${q} ${t}`;
      return R({ pa: pre, pb: resto, p: 0.25, poA: true, nome: `Precipitação: ${minus(MATS[pre].nome)}`, eq: `${kk(x, eqIon(simbCat(c1), n1))} + ${kk(y, eqIon(a2, -n2))} → ${fmt(formulaSal(c1, a2))}↓`, nota: `${MATS[pre].nome} não se dissolve em água (regras de solubilidade), então aparece como um sólido${COR_PRECIPITADO[c1 + ':' + a2] ? ' colorido' : ''} que afunda.` });
    }
  }
  return null;
}
function regraAcidoSolido(A, S) {
  const an = S.an;
  // carbonatos e bicarbonato
  if (A.ions && A.ions[1] === 'CO3') { const c = A.ions[0], ok = soluvel(c, an); return R({ pa: ok ? solucao(c, an) : sal(c, an), pb: id('CO2'), p: 0.08, dT: 1, poA: !ok, nome: `${A.nome} + ácido: efervescência`, eq: A.chave === 'NaHCO3' ? 'HCO₃⁻ + H⁺ → CO₂↑ + H₂O' : 'CO₃²⁻ + 2 H⁺ → CO₂↑ + H₂O', nota: 'Solta gás carbônico. É assim que o vinagre "come" o calcário e o mármore.' }); }
  // óxidos e hidróxidos básicos → sal + água (ex.: ácido tirando ferrugem; antiácido no estômago)
  const c = A.oxidoBasico || A.hidroxido;
  if (c && CATIONS[c]) { const ok = soluvel(c, an); return R({ pa: ok ? solucao(c, an) : sal(c, an), pb: ok ? solucao(c, an) : AGUA, p: A.chave === 'Al2O3' ? 0.002 : 0.04, dT: 5, nome: `${A.nome} + ácido`, eq: A.hidroxido ? 'OH⁻ + H⁺ → H₂O' : 'O²⁻ + 2 H⁺ → H₂O', nota: A.chave === 'Fe2O3' ? 'É assim que produtos ácidos removem ferrugem.' : A.chave === 'Mg(OH)2' ? 'É como o leite de magnésia neutraliza a acidez do estômago.' : 'Óxido básico + ácido → sal + água.' }); }
  if (A.chave === 'MnO2' && an === 'Cl') return R({ pa: solucao('Mn', 'Cl'), pb: id('Cl'), p: 0.02, tmin: 40, dT: 3, nome: 'Dióxido de manganês + ácido clorídrico', eq: 'MnO₂ + 4 HCl → MnCl₂ + Cl₂↑ + 2 H₂O', nota: 'Foi assim que Scheele descobriu o cloro em 1774.' });
  if (A.vidro && an === 'F') return R({ pa: id('SiF4'), pb: AGUA, p: 0.01, nome: 'Ácido fluorídrico corroendo o vidro', eq: 'SiO₂ + 4 HF → SiF₄↑ + 2 H₂O', nota: 'O HF é o único ácido comum que dissolve vidro: por isso é guardado em frascos de plástico.' });
  if (A.chave === 'Sacarose' && S.chave === 'aq:H:SO4') return null;
  return null;
}
function regraGasSolucao(A, S) {
  if (A.chave === 'CO2' && S.cat === 'Ca' && S.an === 'OH') return R({ pa: sal('Ca', 'CO3'), pb: AGUA, p: 0.1, poA: true, nome: 'Água de cal + CO₂: turva', eq: 'Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O', nota: 'Teste clássico para detectar gás carbônico: a água de cal fica leitosa.' });
  if (A.chave === 'CO2' && S.base && S.cat !== 'Ca') return R({ pa: solucao(S.cat, 'CO3'), pb: solucao(S.cat, 'CO3'), p: 0.05, nome: 'Base absorvendo CO₂', eq: '2 OH⁻ + CO₂ → CO₃²⁻ + H₂O', nota: 'Bases absorvem gás carbônico do ar.' });
  if (A.chave === 'SO2' && S.base) return R({ pa: solucao(S.cat, 'SO3'), pb: solucao(S.cat, 'SO3'), p: 0.1, nome: 'Base absorvendo SO₂', eq: '2 OH⁻ + SO₂ → SO₃²⁻ + H₂O', nota: 'É assim que chaminés de fábricas "lavam" a fumaça.' });
  if (A.simb === 'Cl' && S.base && S.cat === 'Na') return R({ pa: solucao('Na', 'ClO'), pb: solucao('Na', 'ClO'), p: 0.1, dT: 3, nome: 'Cloro + soda cáustica = água sanitária', eq: 'Cl₂ + 2 NaOH → NaCl + NaClO + H₂O', nota: 'É exatamente como a água sanitária é fabricada.' });
  // halogênio desloca outro halogênio menos reativo da solução
  const ord = ['F', 'Cl', 'Br', 'I'];
  if (A.simb && ord.includes(A.simb) && ord.includes(S.an) && ord.indexOf(A.simb) < ord.indexOf(S.an) && S.cat !== 'H') return R({ pa: solucao(S.cat, A.simb), pb: id(S.an), p: 0.05, nome: `${A.nome} deslocando ${minus(MATS[id(S.an)].nome)}`, eq: `${fmt(A.formula)} + 2 ${S.an}⁻ → 2 ${A.simb}⁻ + ${fmt(MATS[id(S.an)].formula)}`, nota: 'Halogênios mais reativos (mais acima no grupo) roubam o elétron dos de baixo.' });
  if (A.chave === 'NH3' && S.acido) return R({ pa: solucao('NH4', S.an), pb: solucao('NH4', S.an), p: 0.2, dT: 5, nome: 'Amônia + ácido', eq: 'NH₃ + H⁺ → NH₄⁺', nota: 'Base fraca + ácido → sal de amônio.' });
  return null;
}
const eqHalogeneto = (m, n, x, f) => n === 1 ? `2 ${m} + ${x}₂ → 2 ${f}` : n === 2 ? `${m} + ${x}₂ → ${f}` : n === 3 ? `2 ${m} + 3 ${x}₂ → 2 ${f}` : `${m} + 2 ${x}₂ → ${f}`;
function regraHalogenio(A, X) {
  const x = X.simb, an = x;
  if (A.simb === 'H') { const prod = { F: 'HF', Cl: 'HCl', Br: 'HBr', I: 'HI' }[x]; return R({ pa: id(prod), pb: id(prod), p: x === 'F' ? 0.6 : 0.4, tmin: x === 'F' ? null : x === 'Cl' ? 250 : 300, faisca: x === 'Cl', dT: x === 'F' ? 600 : 150, fogo: x === 'F' ? '#ffffff' : null, explosao: x !== 'I', nome: `Hidrogênio + ${minus(X.nome)}`, eq: `H₂ + ${x}₂ → 2 H${x}`, dH: { F: -273, Cl: -92, Br: -36, I: 26 }[x], nota: x === 'F' ? 'Reage sozinho, até no escuro e no frio: explosão.' : x === 'Cl' ? 'A mistura explode com luz forte, faísca ou chama.' : 'Precisa de calor.' }); }
  if (A.simb === 'Xe' && x === 'F') return R({ pa: id('XeF2'), pb: 0, p: 0.01, tmin: 250, nome: 'Xenônio + flúor', eq: 'Xe + F₂ → XeF₂', nota: 'Gases nobres não são tão "nobres" assim: o flúor consegue reagir com o xenônio.' });
  if (A.metal && CARGA_METAL[A.simb]) {
    const c = A.simb === 'Fe' ? 'Fe3' : A.simb; if (!CATIONS[c]) return null;
    const ativo = serie(A.simb) >= 0 && serie(A.simb) <= serie('Na');
    const tmin = x === 'F' ? null : ativo ? (x === 'I' ? 100 : null) : x === 'I' ? 250 : 200;
    return R({ pa: sal(c, an), pb: 0, p: 0.2, tmin, dT: x === 'F' ? 500 : ativo ? 400 : 200, fogo: ativo || x === 'F' ? A.chama : null, poA: true, nome: `${A.nome} + ${minus(X.nome)}`, eq: eqHalogeneto(A.simb, CATIONS[c].carga, x, fmt(formulaSal(c, an))), nota: x === 'F' ? 'O flúor ataca qualquer metal, liberando muito calor.' : ativo ? 'Metal alcalino + halogênio: reação muito exotérmica, com chama colorida.' : `Precisa estar quente (~${tmin} °C).` });
  }
  return null;
}
function regraEnxofre(A) {
  const s = A.simb, prod = { Fe: 'FeS', Zn: 'ZnS', Cu: 'Cu2S', Ag: 'Ag2S', Hg: 'HgS', Pb: 'PbS' }[s]; if (!prod) return null;
  return R({ pa: id(prod), pb: 0, p: s === 'Ag' || s === 'Hg' ? 0.003 : 0.3, tmin: s === 'Ag' || s === 'Hg' ? null : s === 'Zn' ? 450 : 400, dT: s === 'Zn' ? 900 : s === 'Fe' ? 500 : 50, fogo: s === 'Zn' ? '#e0f0ff' : null, poA: true, nome: `${A.nome} + enxofre`, eq: `${s === 'Cu' || s === 'Ag' ? '2 ' : ''}${s} + S → ${fmt(prod)}`, nota: s === 'Ag' ? 'É por isso que a prata escurece: compostos de enxofre do ar e da comida formam sulfeto de prata.' : s === 'Hg' ? 'Enxofre em pó é usado para recolher mercúrio derramado.' : 'Aquecidos juntos, brilham e formam o sulfeto.' });
}
function regraReducao(A, B) {
  // termite e parentes: metal muito reativo em pó + óxido de metal menos reativo
  const ox = { Fe2O3: 'Fe', Fe3O4: 'Fe', CuO: 'Cu', Cr2O3: 'Cr', PbO: 'Pb', NiO: 'Ni', ZnO: 'Zn', SnO2: 'Sn' }[B.chave];
  if (ox && A.simb === 'Al') return R({ pa: id('Al2O3'), pb: id(ox), p: 0.6, tmin: 1200, faisca: true, faiscas: true, tA: 2400, tB: 2500, fogo: '#fff4d0', poA: true, nome: `Termite (alumínio + ${minus(B.nome)})`, eq: B.chave === 'Fe2O3' ? 'Fe₂O₃ + 2 Al → 2 Fe + Al₂O₃' : `${fmt(B.formula)} + Al → ${ox} + Al₂O₃`, dH: B.chave === 'Fe2O3' ? -852 : -1200, nota: 'O alumínio "rouba" o oxigênio do óxido. Chega a ~2500 °C: o ferro sai derretido. É usado para soldar trilhos de trem.' });
  if (ox && A.simb === 'Mg') return R({ pa: id('MgO'), pb: id(ox), p: 0.6, tmin: 900, tA: 2200, tB: 2200, fogo: '#ffffff', poA: true, nome: `Magnésio reduzindo ${minus(B.nome)}`, eq: `${fmt(B.formula)} + Mg → ${ox} + MgO`, nota: 'O magnésio tem mais afinidade pelo oxigênio que quase todos os metais.' });
  // carbono reduz óxidos (alto-forno)
  const oxC = { Fe2O3: ['Fe', 900], Fe3O4: ['Fe', 900], CuO: ['Cu', 500], PbO: ['Pb', 600], ZnO: ['Zn', 1000], SnO2: ['Sn', 1000], NiO: ['Ni', 800] }[B.chave];
  if (oxC && (A.simb === 'C' || A.chave === 'Caramelo')) return R({ pa: id('CO2'), pb: id(oxC[0]), p: 0.05, tmin: oxC[1], dT: 0, nome: `Carbono reduzindo ${minus(B.nome)}`, eq: B.chave === 'Fe2O3' ? '2 Fe₂O₃ + 3 C → 4 Fe + 3 CO₂' : `2 ${fmt(B.formula)} + C → ${oxC[0]} + CO₂`, nota: 'É assim que se faz ferro no alto-forno: o carbono (carvão) tira o oxigênio do minério.' });
  const oxH = { CuO: 'Cu', Fe2O3: 'Fe', NiO: 'Ni', PbO: 'Pb', Ag2O: 'Ag' }[B.chave];
  if (oxH && A.simb === 'H') return R({ pa: AGUA, pb: id(oxH), p: 0.05, tmin: 300, nome: `Hidrogênio reduzindo ${minus(B.nome)}`, eq: `${fmt(B.formula)} + H₂ → ${oxH} + H₂O`, nota: 'O hidrogênio quente também tira oxigênio de óxidos.' });
  if (A.simb === 'Mg' && B.chave === 'CO2') return R({ pa: id('MgO'), pb: id('C'), p: 0.3, tmin: 600, tA: 2500, fogo: '#ffffff', nome: 'Magnésio queimando em CO₂', eq: '2 Mg + CO₂ → 2 MgO + C', nota: 'Por isso extintor de CO₂ não apaga fogo de magnésio: ele continua queimando e deixa fuligem preta.' });
  return null;
}
function regraLigas(A, B) {
  const st = (m, t) => estadoDe(m, t);
  if (A.simb === 'Hg' && B.metal && ['Au', 'Ag', 'Na', 'K', 'Zn', 'Cu', 'Sn', 'Al', 'Cd', 'Pb'].includes(B.simb)) return R({ pa: id('Amalgama'), pb: id('Amalgama'), p: B.simb === 'Na' || B.simb === 'K' ? 0.2 : 0.02, dT: B.simb === 'Na' ? 40 : 0, auxB: B.id, auxA: B.id, nome: `Amálgama de ${minus(B.nome)}`, eq: `Hg + ${B.simb} → ${B.simb}Hg (amálgama)`, nota: 'O mercúrio dissolve muitos metais formando amálgamas. Aquecendo, o mercúrio evapora (vapor tóxico!) e o metal volta.' });
  if (A.simb === 'Ga' && B.simb === 'Al') return R({ pa: id('AlFragil'), pb: id('AlFragil'), p: 0.01, nome: 'Gálio penetrando no alumínio', eq: 'Ga(l) + Al → Al fragilizado', nota: 'O gálio líquido entra entre os grãos do alumínio, que perde a resistência e esfarela.', precisaLiquidoA: true });
  const ligas = [['Cu', 'Sn', 'Bronze'], ['Cu', 'Zn', 'Latao'], ['Fe', 'C', 'Aco'], ['Sn', 'Pb', 'Solda'], ['Aco', 'Cr', 'Inox'], ['Fe', 'Cr', 'Inox']];
  for (const [x, y, liga] of ligas) if (A.chave === x && B.chave === y) return R({ pa: id(liga), pb: id(liga), p: 0.1, precisaLiquidoA: true, nome: `Liga: ${MATS[id(liga)].nome}`, eq: `${x} + ${y} → ${MATS[id(liga)].nome.split(' (')[0]}`, nota: `Derretidos juntos, formam uma liga mais dura que os metais puros. ${MATS[id(liga)].tracao ? 'Resistência à tração: ' + MATS[id(liga)].tracao + '.' : ''}` });
  return null;
}
function regraLab(A, B) {
  const O2 = id('O');
  // gás atravessando água com detergente ou sabão: espuma
  if (B.surfactante && A.tipo !== 'solucao' && !A.surfactante && A.tipo !== 'especial' && estadoDe(A, 25) === 2 && A.chave !== 'vazio') {
    const h = A.simb === 'H';
    return R({ pa: id(h ? 'EspumaH2' : 'Espuma'), pb: B.id, p: 0.5, poA: true, extra: id(h ? 'EspumaH2' : 'Espuma'), nome: h ? 'Bolhas de hidrogênio na espuma' : 'Gás + detergente: espuma', eq: 'gás + água com detergente → bolhas', nota: h ? 'Cada bolha guarda hidrogênio: com uma faísca a espuma vira uma bola de fogo.' : 'O detergente forma uma película em volta de cada bolha de gás, que demora para estourar.' });
  }
  if (A.chave === 'H2O' && B.surfactante) return R({ pa: id('Espuma'), pb: B.id, p: 0.5, tmin: 100, poA: true, extra: id('Espuma'), nome: 'Vapor + detergente: espuma', eq: 'vapor d’água + água com detergente → bolhas', nota: 'Água com detergente fervendo (ou vapor passando por ela) faz espuma: é por isso que a panela de macarrão com sabão transborda.' });
  if (A.surfactante && B.chave === 'Oleo') return R({ pa: id('Emulsao'), pb: id('Emulsao'), p: 0.05, nome: 'Detergente + óleo: emulsão', eq: 'óleo + detergente → gotinhas de óleo soltas na água', nota: 'A ponta "apolar" do detergente gruda no óleo e a ponta "polar" na água: o óleo se quebra em gotinhas e sai com a água. É assim que se lava a louça.' });
  if (ehAgua(A) && !A.surfactante && B.chave === 'Oleo') return R({ pa: AGUA, pb: B.id, p: 0.3, tmin: 150, tA: 400, explosao: true, fogo: '#ff8a1a', nome: '⚠️ Água em óleo quente', eq: 'H₂O(l) → H₂O(g) (expande ~1700 vezes)', nota: 'A água afunda no óleo quente, vira vapor de uma vez e arremessa o óleo. Se o óleo já estiver pegando fogo, vira uma bola de fogo. NUNCA jogue água em óleo quente: desligue o fogo e abafe com uma tampa.' });
  if (A.chave === 'Oleo' && B.tipo === 'solucao' && B.base && ['Na', 'K'].includes(B.cat)) return R({ pa: id('Sabao'), pb: id('Glicerina'), p: 0.01, tmin: 40, dT: 2, nome: 'Saponificação: óleo + soda = sabão', eq: 'triglicerídeo + 3 NaOH → 3 R–COONa (sabão) + glicerina', nota: 'É assim que se faz sabão (inclusive o caseiro, com óleo usado): a base quebra a gordura em sabão e glicerina. Quente é bem mais rápido.' });
  if (A.chave === 'Leite' && B.tipo === 'solucao' && B.acido) return R({ pa: id('Coalhada'), pb: id('SoroLeite'), poA: true, p: 0.1, nome: 'Leite + ácido: coalhou', eq: 'caseína (dissolvida) + H⁺ → caseína (sólida)', nota: 'Abaixo de pH ~4,6 a caseína, a principal proteína do leite, para de se dissolver e se junta em flocos. É assim que se faz ricota e queijo fresco.' });
  if (A.chave === 'Sabao' && B.tipo === 'solucao' && B.acido) return R({ pa: id('Oleo'), pb: B.id, p: 0.01, nome: 'Sabão + ácido', eq: 'R–COO⁻ + H⁺ → R–COOH (ácido graxo)', nota: 'O ácido transforma o sabão de volta num ácido graxo oleoso, que não limpa mais.' });
  // peróxido de hidrogênio: catalisadores quebram em água + oxigênio
  if (A.peroxido) {
    const forte = A.peroxido >= 30, nomeP = minus(A.nome);
    const cat = B.chave === 'MnO2' ? ['dióxido de manganês', forte ? 0.35 : 0.15] : (B.chave === 'KI' || (B.cat === 'K' && B.an === 'I')) ? ['iodeto (I⁻)', forte ? 0.3 : 0.12] : B.simb === 'Pt' ? ['platina', 0.2] : B.simb === 'Ag' ? ['prata', 0.08] : B.cat === 'Fe3' ? ['ferro(III)', 0.05] : null;
    if (cat) return R({ pa: AGUA, pb: B.id, p: cat[1], tA: forte ? 115 : null, dT: forte ? 0 : 6, extra: O2, nome: `Decomposição catalisada: ${nomeP} + ${cat[0]}`, eq: '2 H₂O₂ → 2 H₂O + O₂↑', dH: -98,
      nota: `O ${cat[0]} é um catalisador: acelera a reação e sai inteiro no final. ${forte ? 'Concentrado, o calor ferve a água e sai uma nuvem de vapor com oxigênio.' : 'Sai espuma de oxigênio; o líquido mal esquenta.'} Uma brasa perto do gás volta a pegar fogo (teste do oxigênio).` });
    if (B.an === 'ClO' && B.tipo === 'solucao') return R({ pa: AGUA, pb: solucao(B.cat, 'Cl'), p: 0.2, dT: forte ? 30 : 4, extra: O2, nome: 'Água oxigenada + água sanitária', eq: 'H₂O₂ + ClO⁻ → H₂O + Cl⁻ + O₂↑', nota: 'Um oxidante destrói o outro e sai oxigênio. (Não é para fazer em casa: em espaço fechado irrita os olhos e o nariz.)' });
    if (B.an === 'MnO4' && B.tipo === 'solucao') return R({ pa: AGUA, pb: id('MnO2'), poB: true, p: 0.2, dT: forte ? 30 : 4, extra: O2, nome: 'Água oxigenada + permanganato', eq: '2 MnO₄⁻ + 3 H₂O₂ → 2 MnO₂↓ + 3 O₂↑ + 2 OH⁻ + 2 H₂O', nota: 'O roxo desaparece e se forma um pó marrom (MnO₂), que ainda acelera a decomposição do resto do peróxido. Em meio ácido o roxo some sem deixar pó: é uma titulação clássica.' });
    if (B.cat === 'Fe' && B.tipo === 'solucao') return R({ pa: AGUA, pb: solucao('Fe3', B.an), p: 0.1, dT: 2, nome: 'Água oxigenada oxidando ferro(II)', eq: '2 Fe²⁺ + H₂O₂ + 2 H⁺ → 2 Fe³⁺ + 2 H₂O', nota: 'O ferro passa de verde-claro (Fe²⁺) para amarelo-alaranjado (Fe³⁺).' });
    if (B.simb && ['Cu', 'Fe', 'Zn', 'Al'].includes(B.simb)) return R({ pa: A.id, p: 0, nome: `${A.nome} + ${minus(B.nome)}`, eq: '—', nota: 'Quase nada visível: o metal escurece devagar (o peróxido forma uma camada de óxido).' });
    return undefined;
  }
  if (B.peroxido) return undefined; // a vizinha (o peróxido) é quem testa a regra
  // permanganato de potássio
  if (A.chave === 'KMnO4') {
    if (B.chave === 'Glicerina') return R({ pa: id('Mn2O3'), pb: id('FOGO'), p: 0.012, tA: 700, tB: 1500, fogo: '#c890ff', extra: id('CO2'), poA: true, nome: 'Permanganato + glicerina: fogo sozinho', eq: '14 KMnO₄ + 4 C₃H₅(OH)₃ → 7 K₂CO₃ + 7 Mn₂O₃ + 5 CO₂ + 16 H₂O', dH: -1500, nota: 'Depois de alguns segundos a mistura esquenta sozinha e pega fogo, com chama lilás do potássio. É uma demonstração clássica de oxidante forte + combustível.' });
    if (B.chave === 'H2SO4') return R({ pa: A.id, p: 0, nome: '⚠️ Permanganato + ácido sulfúrico concentrado', eq: '—', nota: 'Forma um óleo instável e explosivo (heptóxido de manganês). Por segurança não é simulado: nunca se mistura os dois.' });
    if (B.tipo === 'solucao' && B.cat === 'H' && B.an === 'Cl') return R({ pa: solucao('Mn', 'Cl'), pb: id('Cl'), p: 0.03, dT: 4, nome: 'Permanganato + ácido clorídrico: cloro', eq: '2 KMnO₄ + 16 HCl → 2 KCl + 2 MnCl₂ + 5 Cl₂↑ + 8 H₂O', nota: 'Jeito clássico de produzir gás cloro no laboratório (sempre na capela: o cloro é tóxico).' });
  }
  // solução de permanganato (roxa) como oxidante
  if (A.tipo === 'solucao' && A.an === 'MnO4') {
    if (B.tipo === 'solucao' && B.cat === 'Fe') return R({ pa: solucao('Mn', B.an), pb: solucao('Fe3', B.an), p: 0.25, nome: 'Permanganato + ferro(II): titulação', eq: 'MnO₄⁻ + 5 Fe²⁺ + 8 H⁺ → Mn²⁺ + 5 Fe³⁺ + 4 H₂O', nota: 'O roxo some na hora enquanto ainda houver ferro(II). Quando o roxo fica, acabou o ferro: é assim que se mede quanto ferro tem numa amostra.' });
    if (B.chave === 'Etanol' || B.chave === 'Glicerina' || B.chave === 'aq:Sacarose') return R({ pa: id('MnO2'), pb: B.id, poA: true, p: 0.004, nome: `Permanganato oxidando ${minus(B.nome)}`, eq: 'MnO₄⁻ + matéria orgânica → MnO₂↓ (marrom) + …', nota: 'Devagar, o roxo vira marrom: o permanganato oxida a matéria orgânica.' });
  }
  if (A.chave === 'SO2' && B.tipo === 'solucao' && B.an === 'MnO4') return R({ pa: solucao('Mn', 'SO4'), pb: solucao('Mn', 'SO4'), p: 0.2, nome: 'SO₂ descorando o permanganato', eq: '2 MnO₄⁻ + 5 SO₂ + 2 H₂O → 2 Mn²⁺ + 5 SO₄²⁻ + 4 H⁺', nota: 'Teste para detectar dióxido de enxofre: a solução roxa fica incolor.' });
  // indicadores ácido-base
  if (A.indicadorDe && (B.tipo === 'solucao' || ehAgua(B))) {
    const ph = phDe(B) ?? 7, cor = corIndicador(A.indicadorDe, ph);
    const nomeInd = A.indicadorDe === 'fenol' ? 'fenolftaleína' : 'repolho roxo';
    if (!cor) return R({ pa: A.id, p: 0, nome: `Fenolftaleína em ${minus(B.nome)}`, eq: 'incolor (pH < 8,2)', nota: `O pH é ${String(ph).replace('.', ',')}: a fenolftaleína continua incolor. Ela só fica rosa acima de pH 8,2.` });
    const t = tingida(B, cor, A.indicadorDe, nomeInd);
    return R({ pa: t, pb: t, p: 0.3, nome: `Indicador: ${nomeInd} em pH ${String(ph).replace('.', ',')}`, eq: A.indicadorDe === 'fenol' ? 'HIn (incolor) ⇌ In²⁻ (rosa) + 2 H⁺' : 'antocianina: cor muda com o pH', nota: A.indicadorDe === 'fenol' ? 'Acima de pH 8,2 a fenolftaleína perde H⁺ e fica rosa. Se um ácido neutralizar a base, a cor some.' : 'Vermelho no ácido forte, rosa no ácido fraco, roxo no neutro, azul e verde na base e amarelo na base forte.' });
  }
  if (B.indicadorDe) return undefined;
  // umas gotas de indicador colorem a solução inteira (o indicador se espalha por difusão)
  if (A.base0 != null && A.indicador && B.id === A.base0) return R({ pa: A.id, pb: A.id, p: 0.04, nome: 'Indicador se espalhando pela solução', eq: '(difusão)', nota: 'Bastam poucas gotas: as moléculas do indicador se espalham sozinhas por toda a solução.' });
  // teste do amido
  if (A.chave === 'Amido' && (B.lugol || B.simb === 'I')) return R({ pa: id('AmidoIodo'), pb: B.lugol ? solucao('K', 'I') : B.id, p: B.lugol ? 0.25 : 0.03, poA: true, nome: 'Teste do amido: azul-escuro', eq: 'amido + I₃⁻ → complexo azul', nota: 'O iodo entra nas espirais da amilose e a cor fica azul-escura, quase preta. Serve para achar amido nos alimentos (ou iodo, ao contrário).' });
  return undefined;
}
function regraEspecial(A, B) {
  if (A.chave === 'NH3' && B.chave === 'HCl') return R({ pa: id('NH4Cl'), pb: 0, p: 0.5, poA: true, nome: 'Amônia + cloreto de hidrogênio: fumaça branca', eq: 'NH₃ + HCl → NH₄Cl', nota: 'Os dois gases se encontram e formam um pó branco no ar.' });
  if (A.chave === 'Sacarose' && B.chave === 'H2SO4') return R({ pa: id('Caramelo'), pb: AGUA, p: 0.05, dT: 90, nome: 'Ácido sulfúrico desidratando o açúcar', eq: 'C₁₂H₂₂O₁₁ → 12 C + 11 H₂O', nota: 'O ácido arranca a água do açúcar: sobra uma "cobra" preta de carbono e vapor quente.' });
  if (A.chave === 'Amalgama' && B.chave === 'vazio') return null;
  if (A.simb === 'Fe' && ehSolAq(B) && temO2()) return R({ pa: id('Fe(OH)3'), p: B.eletrolito ? 0.0015 : 0.0003, nome: 'Ferro enferrujando', eq: '4 Fe + 3 O₂ + 6 H₂O → 4 Fe(OH)₃', nota: `Ferrugem precisa de ferro, oxigênio e água ao mesmo tempo${B.eletrolito ? '; com sal dissolvido acontece bem mais rápido' : ''}.` });
  if (A.simb === 'Cu' && ehAgua(B) && temO2()) return R({ pa: id('CuCO3'), p: 0.00008, nome: 'Cobre formando pátina', eq: '2 Cu + O₂ + CO₂ + H₂O → Cu₂(OH)₂CO₃', nota: 'Leva anos: é o verde da Estátua da Liberdade.' });
  if (A.simb === 'Na' && B.chave === 'vazio') return null;
  return null;
}

/* ---------- estados ---------- */
function estadoDe(m, t) {
  if (m.fixo !== undefined) return m.fixo;
  if (m.sublima) return t >= m.pe ? 2 : 0;
  if (m.pf != null && t < m.pf) return 0;
  if (m.pf == null && m.pe == null) return m.liq ? 1 : 0;
  if (m.pf == null) return 0;
  if (m.pe != null && t >= m.pe) return 2;
  return 1;
}
const NOME_ESTADO = ['sólido', 'líquido', 'gás', 'fogo', 'fumaça'];
function nomeNoEstado(m, s) { if (s === 0 && m.solidoNome) return m.solidoNome; if (s === 1 && m.liquidoNome) return m.liquidoNome; if (s === 2 && m.gasNome) return m.gasNome; return m.nome; }
// pH de um material (null = não é solução aquosa)
function phDe(m) { if (m.ph !== undefined && m.ph !== null) return m.ph; return null; }

/* =========================================================================
   SIMULAÇÃO NO ORGANISMO
   amostra: [{ id, celulas, temp }] · cada célula = 0,05 mL
   ========================================================================= */
const ML_CELULA = 0.05;
const NIVEL = ['Sem efeito esperado', 'Leve', 'Moderado', 'Grave', 'Muito grave / risco de morte'];
const COR_NIVEL = ['#22c55e', '#a3e635', '#facc15', '#f97316', '#ef4444'];
const ORGAOS = { boca: 'Boca e garganta', esofago: 'Esôfago', estomago: 'Estômago', intestino: 'Intestino', figado: 'Fígado', rins: 'Rins', coracao: 'Coração', pulmoes: 'Pulmões', cerebro: 'Sistema nervoso', sangue: 'Sangue', ossos: 'Ossos', tireoide: 'Tireoide', pele: 'Pele e cabelo', musculos: 'Músculos' };
function avaliarAmostra(amostra, peso, via) {
  const itens = [], orgaos = {}; let max = 0, volume = 0, massa = 0;
  const marca = (org, n) => { for (const o of org || []) orgaos[o] = Math.max(orgaos[o] || 0, n); };
  const add = (n, titulo, texto, org, fonte) => { max = Math.max(max, n); itens.push({ n, titulo, texto, fonte }); marca(org, n); };
  let gasCel = 0, total = 0;
  for (const s of amostra) total += s.celulas;
  for (const s of amostra) {
    const m = MATS[s.id], st = estadoDe(m, s.temp), vol = s.celulas * ML_CELULA, g = vol * m.dens[st];
    volume += vol; massa += g;
    if (st >= 2) gasCel += s.celulas;
    const frac = s.celulas / total, rotulo = `${nomeNoEstado(m, st)} (${fmt(m.formula)})`;
    // temperatura
    if (st < 2) {
      if (s.temp >= 100) add(4, `🔥 ${rotulo} a ${Math.round(s.temp)} °C`, 'Queimadura térmica grave na boca, no esôfago e no estômago. Líquidos acima de ~60 °C já queimam as mucosas.', ['boca', 'esofago', 'estomago'], 'StatPearls (queimaduras)');
      else if (s.temp >= 60) add(3, `🔥 ${rotulo} a ${Math.round(s.temp)} °C`, 'Queimadura na boca e no esôfago (acima de ~60 °C).', ['boca', 'esofago'], 'StatPearls (queimaduras)');
      else if (s.temp <= -150) add(4, `🧊 Líquido criogênico a ${Math.round(s.temp)} °C`, 'Congela os tecidos na hora e, ao virar gás, expande centenas de vezes: há vários casos publicados de PERFURAÇÃO DO ESTÔMAGO por nitrogênio líquido.', ['boca', 'esofago', 'estomago'], 'Relatos de caso (PMC12103062, BMJ Case Rep 2013)');
      else if (s.temp <= -20) add(3, `🧊 ${rotulo} a ${Math.round(s.temp)} °C`, 'Muito gelado: queimadura por frio na boca e na língua.', ['boca'], 'StatPearls (lesões por frio)');
    }
    // peróxido de hidrogênio: a catalase do corpo solta oxigênio
    if (m.peroxido && st === 1 && via === 'oral') {
      const o2 = Math.round(vol * m.peroxido * 3.3), forte = m.peroxido >= 10;
      const n = m.peroxido >= 30 ? (vol >= 1 ? 4 : 3) : forte ? 3 : vol > 200 ? 3 : vol > 30 ? 2 : 1;
      add(n, `🫧 ${rotulo}: ${o2} mL de oxigênio no estômago`, forte
        ? `Concentrado é corrosivo (queima a boca, o esôfago e o estômago) e a catalase dos tecidos solta cerca de ${o2} mL de oxigênio. O gás pode passar para o sangue e formar bolhas que entopem vasos do cérebro e do coração (embolia gasosa) em poucos minutos.`
        : `A enzima catalase quebra a água oxigenada em água e oxigênio (cerca de ${o2} mL de gás). Em pouca quantidade causa irritação, espuma na boca, barriga estufada e vômito, e raramente é grave; volumes grandes já causaram embolia gasosa.`,
        forte ? ['boca', 'esofago', 'estomago', 'sangue', 'cerebro', 'coracao'] : ['boca', 'estomago'], 'StatPearls (NBK585102); UKHSA; ATSDR');
    }
    if (m.oxidanteForte && st === 0 && via === 'oral') add(3, `⚗️ ${rotulo} sólido`, 'Os cristais são um oxidante forte: queimam a boca e o esôfago e deixam manchas marrons. A laringe pode inchar e dificultar a respiração.', ['boca', 'esofago', 'estomago'], 'Relatos de caso (PMC4413422)');
    if (m.tipo === 'solucao' && m.an === 'MnO4' && via === 'oral') add(2, `⚗️ ${rotulo}`, 'Nesta concentração (~1,6%) o permanganato já irrita e mancha as mucosas. Os banhos de assento usam uma solução cerca de 100 vezes mais fraca (1:10 000) e nunca é para beber.', ['boca', 'esofago', 'estomago'], 'Relatos de caso (PMC4129898)');
    // pH (corrosivos)
    const ph = phDe(m);
    if (ph !== null && st === 1 && via === 'oral') {
      if (ph <= 1 || (ph <= 2 && vol > 5)) add(4, `⚗️ Ácido forte: ${rotulo}, pH ${String(ph).replace('.', ',')}`, 'Ácidos fortes causam necrose por coagulação: queimam a boca, o esôfago e principalmente o estômago, que pode perfurar.', ['boca', 'esofago', 'estomago'], 'StatPearls; Manual MSD (cáusticos)');
      else if (ph <= 3 && ['CH3COO', 'C6H5O7'].includes(m.an)) add(vol > 200 ? 2 : vol > 30 ? 1 : 0, `🍋 Ácido fraco de alimento: ${rotulo}, pH ${String(ph).replace('.', ',')}`, 'Vinagre e limão são ácidos fracos: em pouca quantidade não fazem mal. Puros e em grande quantidade irritam o estômago e desgastam o esmalte dos dentes.', ['boca', 'estomago'], 'StatPearls (cáusticos)');
      else if (ph <= 3) add(2, `⚗️ Ácido: ${rotulo}, pH ${String(ph).replace('.', ',')}`, 'Irrita a boca e o estômago; o vinagre (pH ~2,4) em pouca quantidade é tolerado, mas puro e em grande quantidade agride o esôfago e os dentes.', ['boca', 'estomago'], 'StatPearls (cáusticos)');
      else if (ph >= 12) add(4, `🧪 Base forte: ${rotulo}, pH ${String(ph).replace('.', ',')}`, 'Bases fortes causam necrose por liquefação: "derretem" os tecidos e penetram fundo, principalmente no esôfago. Costumam ser ainda piores que os ácidos.', ['boca', 'esofago', 'estomago'], 'StatPearls (álcalis); Manual MSD');
      else if (ph >= 11) add(vol > 50 ? 3 : 2, `🧪 Base: ${rotulo}, pH ${String(ph).replace('.', ',')}`, 'Entre pH 11 e 12 irrita a boca, a garganta e o estômago (náusea, vômito). Pouca quantidade costuma causar só irritação (é o caso mais comum com água sanitária de casa); grandes volumes podem lesar o esôfago.', ['boca', 'esofago', 'estomago'], 'StatPearls (álcalis; hipoclorito)');
    }
    if (m.tox === 'acidoForte' && via === 'oral') add(4, `⚗️ ${m.nome}`, TOX.acidoForte.efe, TOX.acidoForte.org, 'StatPearls; Manual MSD');
    // metais que reagem com a água da boca
    if (m.tipo === 'elemento' && m.reat && m.reat.agua >= 2 && st < 2 && via === 'oral') add(4, `💥 ${m.nome} metálico`, `Reage com a saliva e o suco gástrico: forma ${m.reat.agua >= 2 ? 'hidróxido (base forte)' : ''}, solta hidrogênio e calor. Queimadura química e térmica grave.`, ['boca', 'esofago', 'estomago'], 'StatPearls (álcalis)');
    // gases
    if (st === 2) {
      const t = TOX[m.tox] || TOX[m.simb] || {};
      if (t.inal === 'corrosivo') add(Math.max(3, t.g || 3), `😷 ${rotulo} (gás)`, t.efe, t.org || ['pulmoes'], t.fonte);
      else if (t.inal === 'toxico') add(4, `😷 ${rotulo} (gás)`, t.efe, t.org, t.fonte);
      else if (t.inal === 'radioativo') add(3, `☢️ ${rotulo} (gás)`, t.efe, t.org, t.fonte);
      else if (frac > 0.5 && via === 'inalar' && t.inal !== 'ok') add(3, `😮‍💨 ${rotulo}`, (t.efe || 'Toma o lugar do oxigênio.') + ' Respirar gás puro sem oxigênio leva ao desmaio em poucos segundos.', ['pulmoes', 'cerebro'], 'CDC NIOSH (asfixiantes simples)');
      else if (t.inal === 'ok') add(0, `🫁 ${rotulo}`, t.efe, ['pulmoes']);
      continue;
    }
    if (via === 'inalar') continue;
    // toxicidade química por dose
    avaliarToxicidade(m, g, s, peso, add);
  }
  if (via === 'oral' && gasCel / total > 0.6) add(1, '🫧 Quase tudo é gás', 'Gás não dá para "beber": a maior parte iria para o ar ou seria arrotada. Para gases, use "Inalar".', ['estomago']);
  if (!itens.length) add(0, '✅ Nada preocupante encontrado', 'Nesta quantidade e temperatura, os componentes da amostra não têm efeito tóxico conhecido relevante.', []);
  itens.sort((a, b) => b.n - a.n);
  return { itens, orgaos, max, volume, massa };
}
function avaliarToxicidade(m, g, s, peso, add) {
  const rotulo = m.nome;
  // soluções: soluto a ~0,1 mol/L
  if (m.tipo === 'solucao') {
    if (!m.cat) { const t = TOX[m.tox]; if (t && t.g) add(t.g, `🧾 ${rotulo}`, t.efe, t.org, t.fonte); return; }
    const mmol = s.celulas * ML_CELULA * 0.1; // 0,1 mol/L
    avaliarIons(m.cat, m.an, mmol, m.Msoluto, peso, add, rotulo, 1);
    return;
  }
  // sais e compostos iônicos (sólidos): absorção depende de dissolver na água ou no ácido do estômago
  if (m.ions) {
    const [c, a] = m.ions; const mol = g / (m.M || 100) * 1000;
    let bio = soluvel(c, a) ? 1 : (['CO3', 'OH', 'PO4', 'SO3', 'BO3'].includes(a) ? 1 : 0.01); // carbonatos e hidróxidos se dissolvem no suco gástrico
    if (bio < 1) add(0, `🪨 ${rotulo} é insolúvel`, `Não se dissolve nem no ácido do estômago, então quase não é absorvido${c === 'Ba' && a === 'SO4' ? ' — é exatamente por isso que o sulfato de bário é usado como contraste de raio X, enquanto o bário solúvel é venenoso' : ''}.`, ['intestino'], c === 'Ba' ? 'CDC (bário)' : null);
    avaliarIons(c, a, mol, m.M, peso, add, rotulo, bio);
    return;
  }
  if (m.oxidoBasico && CATIONS[m.oxidoBasico]) { const mol = g / (m.M || 100) * 1000; avaliarIons(m.oxidoBasico, null, mol, m.M, peso, add, rotulo, 0.5); return; }
  const t = TOX[m.tox] || TOX[m.simb] || TOX[m.chave];
  if (!t) return;
  if (t.elem && TOX[t.elem] && TOX[t.elem].lim) { // metal: só a parte que se dissolve no estômago conta
    const mgEl = g * 1000 * (t.absorcao ?? 0.3);
    doseAgente(TOX[t.elem], t.elem, mgEl, peso, add, `${rotulo} (parte que se dissolve no estômago)`);
    return;
  }
  if (t.lim) { const mgEl = g * 1000 * (t.absorcao ?? 1) * (m.comp && t.elem === 'As' ? 0.757 : 1); doseAgente(t, m.chave, mgEl, peso, add, rotulo); return; }
  if (t.radio) { add(t.g || 4, `☢️ ${rotulo}`, t.efe + (RADIO[m.simb] ? ` Meia-vida: ${RADIO[m.simb][0]}.` : ''), t.org, t.fonte); return; }
  if (t.g !== undefined) add(t.g, (t.g >= 3 ? '☠️ ' : t.g >= 2 ? '⚠️ ' : 'ℹ️ ') + rotulo, t.efe, t.org || [], t.fonte);
}
const IONTOX = { Na: 'Na+', K: 'K+', Li: 'Li+', Mg: 'Mg2+', Ca: 'Ca2+', Ba: 'Ba2+', Sr: 'Sr2+', Al: 'Al3+', Fe: 'Fe', Fe3: 'Fe', Cu: 'Cu2+', Zn: 'Zn2+', Ni: 'Ni2+', Co: 'Co2+', Mn: 'Mn2+', Cr: 'Cr3+', Sn: 'Sn2+', Pb: 'Pb2+', Ag: 'Ag+', Hg: 'Hg2+', Cd: 'Cd2+', NH4: 'NH4+', Au: 'Au3+', Pt: 'Pt4+', Tl: 'Tl+', F: 'F-', I: 'I-', Br: 'Br-', NO3: 'NO3-', SO4: 'SO4--', PO4: 'PO4---', CO3: 'CO3--', SO3: 'SO3--', CH3COO: 'CH3COO-', BO3: 'BO3---', MnO4: 'MnO4-' };
function avaliarIons(c, a, mmolSal, Msal, peso, add, rotulo, bio) {
  if (c && c !== 'H' && IONTOX[c]) {
    const C = CATIONS[c], f = formulaSal(c, a || 'OH'), l = a ? mmc(C.carga, ANIONS[a].carga) / C.carga : 1;
    const mEl = c === 'NH4' ? 18.04 : MASSA[simbCat(c)];
    const mg = mmolSal * l * mEl * bio;
    doseAgente(TOX[IONTOX[c]], c, mg, peso, add, rotulo);
  }
  if (a && IONTOX[a]) {
    const A = ANIONS[a], l = c ? mmc(CATIONS[c].carga, A.carga) / A.carga : 1;
    const mA = { F: 19, I: 126.9, Br: 79.9, NO3: 62, SO4: 96.06, PO4: 94.97, CO3: 60.01, SO3: 80.06, CH3COO: 59.04, BO3: 58.8, MnO4: 118.94 }[a];
    doseAgente(TOX[IONTOX[a]], a, mmolSal * l * mA * bio, peso, add, rotulo);
  }
}
function doseAgente(t, chave, mg, peso, add, rotulo) {
  if (!t || !t.lim || mg <= 0) return;
  const porKg = mg / peso, [l1, l2, l3] = t.lim;
  const n = porKg >= l3 ? 4 : porKg >= l2 ? 3 : porKg >= l1 ? 2 : 0;
  const simb = { Fe3: 'Fe' }[chave] || chave, ul = UL[simb];
  const dose = `${mg >= 1000 ? (mg / 1000).toFixed(2) + ' g' : mg >= 1 ? mg.toFixed(1) + ' mg' : (mg * 1000).toFixed(0) + ' µg'} de ${minus(t.nome)} (${porKg < 0.01 ? porKg.toExponential(1) : porKg.toFixed(2)} mg/kg)`.replace(/(\d)\.(\d)/g, '$1,$2');
  const extraUl = ul ? ` Limite superior diário para adultos (NIH): ${ul >= 1 ? ul + ' mg' : ul * 1000 + ' µg'}${mg > ul ? ' — esta amostra passa do limite' : ' — esta amostra está abaixo'}.` : '';
  if (n === 0) { add(0, `ℹ️ ${rotulo}`, `Contém ${dose}: abaixo das quantidades associadas a efeitos.${extraUl}`, [], t.fonte); return; }
  add(n, `${n >= 3 ? '☠️' : '⚠️'} ${rotulo}`, `Contém ${dose}. ${t.efe}${extraUl}`, t.org, t.fonte);
}
