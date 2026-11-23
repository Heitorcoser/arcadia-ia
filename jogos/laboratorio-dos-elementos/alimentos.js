/* =========================================================================
   LABORATÓRIO DOS ELEMENTOS · alimentos
   Comida aqui é MISTURA DE COMPONENTES REAIS (água, açúcares, amido,
   proteínas, gorduras...). O cozimento não é receita: cada componente
   muda pela física e química dele, na temperatura em que isso acontece de
   verdade, e o nome do resultado é reconhecido pelo que ele virou.
   - amido + água a 60–80 °C → incha e gelatiniza (tapioca, mingau, miolo do pão)
   - proteína acima de ~62 °C → desnatura e coagula (clara, ovo, pão firme)
   - água a 100 °C → evapora e segura a temperatura (calor latente): só a
     superfície seca passa disso e doura
   - Maillard (≥ ~120 °C, pouca água): açúcar REDUTOR + proteína → marrom e
     aroma. Sacarose pura não faz Maillard; precisa ser invertida antes
   - caramelização (sacarose ~160 °C, glicose/frutose ~150 °C); > ~200 °C queima
   - levedura viva (15–45 °C, ótimo ~32 °C) fermenta açúcar em etanol + CO₂;
     morre acima de ~55 °C. O CO₂ só fica preso se houver rede de glúten
     (farinha + água + sovar)
   - bicarbonato + ácido (ou calor) → CO₂ (fermento químico)
   - óleo e água só se misturam com emulsificante (lecitina da gema)
   - clara batida vira espuma (proteínas na interface), mas gordura impede
   Fontes de composição: USDA FoodData Central; processos: McGee, "On Food
   and Cooking"; Belitz, "Food Chemistry".
   ========================================================================= */
'use strict';

/* ---------- componentes ---------- */
const COMP = {
  agua: { n: 'água', rho: 1.0, cor: [120, 160, 215], vis: 0.3, kcal: 0 },
  sacarose: { n: 'sacarose (açúcar comum)', rho: 1.59, cor: [252, 252, 250], vis: 1, kcal: 4 },
  glicose: { n: 'açúcares redutores (glicose, frutose, lactose)', rho: 1.54, cor: [250, 250, 246], vis: 0.8, kcal: 4 },
  amido: { n: 'amido cru (grânulos)', rho: 1.5, cor: [250, 250, 244], vis: 1, kcal: 4 },
  amidoGel: { n: 'amido gelatinizado', rho: 1.5, cor: [240, 232, 212], vis: 0.7, kcal: 4 },
  proteina: { n: 'proteína nativa', rho: 1.35, cor: [236, 228, 196], vis: 0.5, kcal: 4 },
  proteinaDesn: { n: 'proteína coagulada (desnaturada)', rho: 1.35, cor: [253, 253, 250], vis: 1.6, kcal: 4 },
  gluten: { n: 'gliadina e glutenina (glúten solto)', rho: 1.35, cor: [222, 200, 150], vis: 0.8, kcal: 4 },
  glutenRede: { n: 'rede de glúten (massa sovada)', rho: 1.35, cor: [215, 188, 136], vis: 0.9, kcal: 4 },
  gordura: { n: 'gordura (triglicerídeos)', rho: 0.92, cor: [242, 214, 110], vis: 1.1, kcal: 9 },
  lecitina: { n: 'lecitina (emulsificante da gema)', rho: 1.03, cor: [250, 190, 25], vis: 5, kcal: 9 },
  fibra: { n: 'fibras', rho: 1.5, cor: [175, 145, 95], vis: 0.7, kcal: 2 },
  sal: { n: 'sais minerais', rho: 2.16, cor: [250, 250, 250], vis: 0.3, kcal: 0 },
  acido: { n: 'ácidos orgânicos (acético, cítrico)', rho: 1.05, cor: [240, 240, 220], vis: 0.2, kcal: 3 },
  etanol: { n: 'etanol (álcool)', rho: 0.79, cor: [235, 240, 250], vis: 0.2, kcal: 7 },
  levedura: { n: 'levedura viva (Saccharomyces cerevisiae)', rho: 1.1, cor: [215, 190, 140], vis: 1, kcal: 4 },
  clorofila: { n: 'clorofila', rho: 1.1, cor: [40, 150, 50], vis: 12, kcal: 0 },
  melanoidina: { n: 'melanoidinas (reação de Maillard)', rho: 1.4, cor: [120, 68, 26], vis: 7, kcal: 0 },
  caramelo: { n: 'caramelo', rho: 1.5, cor: [180, 104, 30], vis: 5, kcal: 4 },
  bicarb: { n: 'bicarbonato (fermento químico)', rho: 2.2, cor: [250, 250, 250], vis: 0.3, kcal: 0 },
  carvao: { n: 'carvão (queimado)', rho: 1.8, cor: [28, 24, 22], vis: 14, kcal: 0 },
};
const CK = Object.keys(COMP);
TOX.Alimento = { nome: 'Alimento', g: 0, efe: 'Comida: a energia vem dos carboidratos e proteínas (4 kcal/g), da gordura (9 kcal/g) e do álcool (7 kcal/g).' };
TOX.Formaldeido = { nome: 'Formaldeído', g: 3, org: ['pulmoes', 'boca', 'estomago'], efe: 'Tóxico e cancerígeno: irrita fortemente olhos e vias respiratórias; engolido, corrói o estômago.', fonte: 'ATSDR (formaldeído)' };
TOX.Metanol = { nome: 'Metanol', g: 4, lim: [100, 300, 1000], org: ['olhos', 'cerebro', 'figado'], efe: 'O fígado transforma o metanol em ácido fórmico, que pode cegar e matar. Por isso bebida "batizada" é tão perigosa.', fonte: 'StatPearls (methanol toxicity)' };

/* ---------- materiais novos ---------- */
function regComp(k, o) {
  const f = o.formula, mm = f && /^[A-Za-z0-9()]+$/.test(f) ? massaMolar(f) : null;
  return registrar(Object.assign({ chave: k, tipo: 'composto', M: mm && mm.M, comp: mm && mm.comp, Mgas: mm && mm.M, cores: o.cor, dS: o.d, dL: o.d * 0.97, cp: o.cp || 1.5, lam: o.lam || 0.3, fragil: true, tox: o.tox || 'Alimento' }, o));
}
// química do "alimento sem planta"
regComp('Glicose', { formula: 'C6H12O6', nome: 'Glicose (açúcar redutor)', pf: 146, pe: null, d: 1.54, cor: ['#fbfbf4', '#f2e6c0'], po: true, nutri: { glicose: 1 }, cozinha: true, curio: 'É o açúcar que as plantas fazem na fotossíntese e que as células usam como combustível.' });
regComp('Metanol', { formula: 'CH3OH', nome: 'Metanol (álcool de madeira)', pf: -97.6, pe: 64.7, d: 0.792, cor: [null, '#eef0fa', '#f4f4f8'], tox: 'Metanol', inflam: { ign: 464, prod: 'CO2', prod2: 'H2O' }, curio: 'Parece etanol, mas é veneno: 10 mL podem cegar.' });
regComp('Formaldeido', { formula: 'CH2O', nome: 'Formaldeído (formol)', pf: -92, pe: -19, d: 0.82, cor: [null, '#f4f4f0', '#f0f2ec'], tox: 'Formaldeido', curio: 'Com uma base (cal) ele se junta em açúcares: é a "reação da formose", talvez como os primeiros açúcares surgiram na Terra.' });
regComp('AcidoGraxo', { formula: 'C18H36O2', nome: 'Ácido graxo (ácido esteárico)', pf: 69, pe: 361, d: 0.94, cor: ['#f6f2e2', '#efe4c0', '#f4f4f0'], tox: 'Oleo', curio: 'Três dele presos numa glicerina formam uma gordura (triglicerídeo).' });
// ingredientes (composição em fração de massa; USDA FoodData Central)
const INGR = {
  FarinhaTrigo: { nome: 'Farinha de trigo', d: 1.4, cor: ['#f4efe2'], po: true, nutri: { amido: 0.70, gluten: 0.10, proteina: 0.02, agua: 0.13, fibra: 0.03, gordura: 0.01, glicose: 0.01 }, curio: 'As proteínas gliadina e glutenina, com água e sova, formam o glúten: uma rede elástica que segura o gás e faz o pão crescer.' },
  Manteiga: { nome: 'Manteiga', pf: 32, pe: null, d: 0.91, cor: ['#f6dc78', '#f0cc50'], nutri: { gordura: 0.81, agua: 0.16, proteina: 0.01, sal: 0.02 }, curio: 'É uma emulsão de água em gordura; derrete entre 32 e 35 °C.' },
  Ovo: { nome: 'Ovo (inteiro)', liq: true, pf: -1, pe: null, d: 1.03, cor: ['#f2c440', '#f0c030'], nutri: { agua: 0.76, proteina: 0.125, gordura: 0.095, lecitina: 0.01, sal: 0.01 }, cozinha: true, curio: 'A clara começa a firmar a 62 °C; a gema, a 65–70 °C.' },
  Clara: { nome: 'Clara de ovo', liq: true, pf: -1, pe: null, d: 1.04, cor: ['#f4f2e6', '#e8e6d4'], nutri: { agua: 0.88, proteina: 0.11, glicose: 0.007, sal: 0.003 }, cozinha: true, curio: 'É 88% água e 11% proteína (ovalbumina). Batida, as proteínas se desenrolam e seguram bolhas de ar.' },
  Gema: { nome: 'Gema de ovo', liq: true, pf: -1, pe: null, d: 1.03, cor: ['#f6b818', '#f2b010'], nutri: { agua: 0.50, proteina: 0.16, gordura: 0.26, lecitina: 0.08 }, cozinha: true, curio: 'A lecitina da gema tem uma ponta que gosta de água e outra que gosta de óleo: é ela que segura a maionese.' },
  Levedura: { nome: 'Fermento biológico (levedura)', d: 0.8, cor: ['#d8bc88'], po: true, nutri: { levedura: 0.92, agua: 0.05, proteina: 0.03 }, cozinha: true, curio: 'São fungos vivos (Saccharomyces cerevisiae). Comem açúcar e soltam CO₂ e álcool.' },
  Alga: { nome: 'Alga verde (Chlorella)', d: 1.05, cor: ['#3a9a3a'], po: true, rug: 0.7, nutri: { agua: 0.80, proteina: 0.11, amido: 0.03, glicose: 0.005, gordura: 0.025, fibra: 0.02, clorofila: 0.01 }, cozinha: true, curio: 'Alga de uma célula só que faz fotossíntese. Seca, tem ~60% de proteína.' },
};
for (const [k, o] of Object.entries(INGR)) regComp(k, Object.assign({ formula: 'mistura', casa: true, tox: 'Alimento' }, o));
registrar({ chave: 'CHAPA', nome: 'Chapa de fogão (220 °C)', formula: '—', tipo: 'especial2', cores: ['#5a2a1a'], d: 8, cp: 0.5, lam: 60, inerte: true, fixo: 0, tempFixa: 220 });
registrar({ chave: 'FORNO450', nome: 'Reator aquecido (450 °C)', formula: '—', tipo: 'especial2', cores: ['#7a3a10'], d: 8, cp: 0.5, lam: 60, inerte: true, fixo: 0, tempFixa: 450 });
mat('Sacarose').decomp = null; // o açúcar agora carameliza pela química dos componentes (≥ 160 °C)
// ingredientes que já existiam ganham composição
const NUTRI_EXIST = { H2O: { agua: 1 }, AguaTorneira: { agua: 0.999, sal: 0.001 }, Sacarose: { sacarose: 1 }, Amido: { amido: 0.87, agua: 0.13 }, NaCl: { sal: 1 }, Oleo: { gordura: 1 }, Leite: { agua: 0.87, glicose: 0.05, proteina: 0.034, gordura: 0.035, sal: 0.007 }, NaHCO3: { bicarb: 1 }, Refrigerante: { agua: 0.89, sacarose: 0.11 } };
for (const [k, n] of Object.entries(NUTRI_EXIST)) { const M = mat(k); if (M) M.nutri = n; }
for (const k of ['Sacarose', 'Leite', 'Amido']) mat(k).cozinha = true;
{ const v = MATS[solucao('H', 'CH3COO')]; if (v) v.nutri = { agua: 0.95, acido: 0.05 }; const l = MATS[solucao('H', 'C6H5O7')]; if (l) l.nutri = { agua: 0.93, acido: 0.06, glicose: 0.01 }; const a = MATS[solucaoAcucar()]; if (a) a.nutri = { agua: 0.9, sacarose: 0.1 }; }

/* ---------- registrar uma mistura (cada composição vira um material, com propriedades calculadas) ---------- */
const CACHE_ALIM = new Map();
function normal(c) { let s = 0; for (const k of CK) { c[k] = Math.max(0, c[k] || 0); s += c[k]; } if (s > 0) for (const k of CK) c[k] /= s; return c; }
function alimento(cIn, arIn = 0) {
  const c = normal(Object.assign({}, cIn)), ar = Math.max(0, Math.min(0.92, Math.round(arIn * 20) / 20));
  const chave = 'alim:' + CK.map(k => Math.round(c[k] * 100)).join('.') + ':' + ar;
  if (CACHE_ALIM.has(chave)) return CACHE_ALIM.get(chave);
  for (const k of CK) c[k] = Math.round(c[k] * 100) / 100;
  // densidade: soma dos volumes de cada componente, mais o ar
  let v = 0; for (const k of CK) v += c[k] / COMP[k].rho; const rho = (1 / Math.max(0.01, v)) * (1 - ar);
  // cor: média pesada pela "força de cor" de cada componente (clorofila e Maillard tingem muito)
  let r = 0, g = 0, b = 0, w = 0; for (const k of CK) { const p = c[k] * COMP[k].vis; r += COMP[k].cor[0] * p; g += COMP[k].cor[1] * p; b += COMP[k].cor[2] * p; w += p; }
  let cor = w ? [r / w, g / w, b / w] : [200, 200, 200]; if (ar > 0.2) cor = cor.map(q => q + (255 - q) * ar * 0.25);
  const hex = rgbHex(cor.map(q => Math.max(0, Math.min(255, Math.round(q)))));
  const id0 = identificar(c, ar);
  const acucar = c.sacarose + c.glicose + c.caramelo;
  // estado: líquido se tem muita água livre e nada formando rede; calda/caramelo derretem quente; gordura derrete a ~32 °C
  const rede = c.amidoGel * 1.2 + c.proteinaDesn * 2.5 + c.glutenRede * 1.5 + c.fibra + c.carvao + c.melanoidina;
  let pf = null, pe = null, liq = false, po = false;
  if (acucar > 0.6 && c.agua < 0.12) { pf = c.caramelo > 0.3 ? 120 : 150; } // açúcar derretido / caramelo: líquido quente, vidro frio
  else if (c.gordura > 0.7 && c.agua < 0.3) { pf = 32; }
  else if (c.agua > 0.55 && rede < 0.12 && ar < 0.3) { liq = true; pf = -2; }
  else if (c.agua < 0.18 && rede < 0.1 && ar < 0.2) po = true;
  const nutri = c;
  const id1 = registrar({ chave, tipo: 'alimento', nome: id0.nome, formula: 'mistura', nutri, ar, porque: id0.porque, cozinha: true,
    pf, pe, liq, po, d: rho, dS: rho, dL: rho, cp: 1.5 + 2.6 * c.agua, lam: 0.15 + 0.45 * c.agua, cores: [hex, hex, '#e8eef8'], tox: 'Alimento', fragil: true,
    rug: c.clorofila > 0.003 ? 0.7 : 0.3, hidrofobico: 0.3 + c.gordura * 0.5, comoAgua: liq && c.gordura < 0.1 && c.agua > 0.8 });
  CACHE_ALIM.set(chave, id1);
  return id1;
}

/* ---------- identificar: o nome sai do que a comida É, não de uma receita ---------- */
const pct = v => Math.round(v * 100) + '%';
function identificar(c, ar) {
  const prot = c.proteina + c.proteinaDesn, trigo = c.gluten + c.glutenRede, amidoT = c.amido + c.amidoGel, gel = amidoT ? c.amidoGel / amidoT : 0, desn = prot ? c.proteinaDesn / prot : 0, acucar = c.sacarose + c.glicose;
  const P = (nome, ...porque) => ({ nome, porque: porque.filter(Boolean).join(' ') });
  if (c.carvao > 0.3) return P('Comida queimada (carvão)', `${pct(c.carvao)} virou carbono: acima de ~200 °C os açúcares e proteínas se decompõem e sobra carvão.`);
  if (c.clorofila > 0.002) return c.agua > 0.5 ? P('Alga verde viva (Chlorella)', 'Tem clorofila e água: é uma célula viva que faz fotossíntese.') : P('Alga seca (pó verde proteico)', `Sem água a alga para de viver; sobra ${pct(prot)} de proteína.`);
  if (c.caramelo > 0.25) return P(c.agua < 0.05 ? 'Caramelo' : 'Calda de caramelo', `${pct(c.caramelo)} do açúcar caramelizou (≥ ~160 °C): as moléculas se quebram e se juntam em centenas de compostos marrons e cheirosos.`);
  if (c.gordura > 0.45 && c.lecitina > 0.004 && c.agua > 0.04 && c.agua < 0.45 && c.proteinaDesn < 0.03) return P('Maionese (emulsão)', `Óleo (${pct(c.gordura)}) em gotinhas presas na água pela lecitina da gema: sem ela, óleo e água se separam.`);
  if (prot >= 0.09 && c.agua > 0.45 && amidoT < 0.06 && trigo < 0.02) {
    if (c.lecitina > 0.04) return P(desn > 0.6 ? 'Gema cozida' : 'Gema crua', desn > 0.6 ? 'As proteínas da gema coagularam (65–70 °C) e ela ficou firme e farinhenta.' : 'Proteínas da gema ainda enroladas (nativas).');
    if (c.lecitina > 0.003) return P(desn > 0.6 ? (ar > 0.3 ? 'Omelete fofa' : 'Ovo cozido') : 'Ovo cru', desn > 0.6 ? `As proteínas da clara e da gema coagularam (${pct(desn)} desnaturadas).` : 'Proteínas ainda nativas: líquido.');
    if (ar > 0.35) return P(desn > 0.5 ? (c.agua < 0.15 ? 'Suspiro' : 'Merengue assado') : 'Claras em neve', `Bater desenrola as proteínas da clara, que se prendem em volta das bolhas de ar (${pct(ar)} de ar).${desn > 0.5 ? ' O calor coagulou essa espuma e ela ficou firme.' : ''}`);
    return P(desn > 0.6 ? 'Clara cozida' : 'Clara crua', desn > 0.6 ? 'A ovalbumina coagulou: de transparente virou branca e firme.' : 'Proteína nativa dissolvida em água: transparente e mole.');
  }
  if (c.gordura > 0.7) return P(c.agua > 0.08 ? 'Manteiga' : 'Gordura', c.agua > 0.08 ? 'Gordura com um pouco de água presa (emulsão).' : 'Quase só triglicerídeos.');
  if (c.etanol > 0.02 && c.agua > 0.5) return P(acucar > 0.03 ? 'Mosto fermentando' : `Bebida fermentada (~${Math.round(c.etanol / 0.79 * 100)}% de álcool)`, 'A levedura transformou açúcar em etanol e CO₂ (fermentação alcoólica).');
  if (c.agua > 0.8 && c.gordura > 0.015 && c.proteina + c.proteinaDesn > 0.02 && amidoT < 0.05) return P('Leite', 'Água com gotinhas de gordura e proteínas (caseína) em suspensão: por isso é branco.');
  // trigo: tem glúten (solto, em rede ou já assado) e fibra; o polvilho de mandioca não tem nenhum dos dois
  if (amidoT >= 0.3 && (trigo > 0.03 || (c.fibra >= 0.01 && (c.proteinaDesn > 0.02 || c.melanoidina > 0.005)))) {
    if (gel < 0.35) {
      if (c.agua < 0.17) return P('Farinha de trigo', 'Amido cru e proteínas do trigo secos.');
      if (c.agua > 0.55) return P('Massa mole crua', 'Água demais para formar massa firme.');
      if (c.glutenRede > c.gluten) return P(ar > 0.3 ? 'Massa de pão crescida' : 'Massa de pão sovada', `A sova juntou gliadina e glutenina numa rede elástica (glúten).${ar > 0.3 ? ` A levedura soltou CO₂ e a rede segurou: ${pct(ar)} de gás.` : ''}`);
      if (c.proteinaDesn > c.glutenRede + c.gluten) return P('Massa assando', 'O glúten já coagulou com o calor, mas o amido ainda não gelatinizou: falta água chegar a 60–80 °C aqui dentro.');
      return P('Massa crua (sem sovar)', 'Farinha e água misturadas, mas sem sova o glúten não formou rede: o gás escapa e a massa não cresce.');
    }
    if (c.agua > 0.55) return P('Mingau de farinha', 'O amido inchou na água quente e engrossou o líquido.');
    if (ar > 0.3) return P(c.melanoidina > 0.01 ? 'Pão (casca dourada)' : 'Miolo de pão', `Amido gelatinizado (${pct(gel)}) e glúten coagulado seguram ${pct(ar)} de bolhas de gás: uma espuma sólida.${c.melanoidina > 0.01 ? ' Na superfície, mais seca e acima de 120 °C, a reação de Maillard dourou a casca.' : ''}`);
    if (acucar > 0.1 && c.gordura > 0.05) return P(c.melanoidina > 0.01 ? 'Biscoito' : 'Bolo massudo', 'Massa doce e gordurosa assada, sem muito gás preso.');
    return P('Pão solado (massa dura)', 'Assou, mas quase sem gás: faltou fermentar, ou o glúten não foi sovado e o gás escapou.');
  }
  if (amidoT >= 0.35 && trigo < 0.01 && prot < 0.06 && c.fibra < 0.01) {
    if (gel >= 0.5) return c.agua < 0.5 ? P(c.melanoidina > 0.01 || c.caramelo > 0.01 ? 'Tapioca tostada' : 'Tapioca', `O polvilho úmido aqueceu: os grãos de amido incharam e grudaram uns nos outros (gelatinização, ~${pct(gel)}), formando uma panqueca elástica sem glúten.`) : P('Mingau / goma de amido', 'Amido gelatinizado em muita água: engrossa (é assim que se faz mingau e molho branco).');
    if (c.agua >= 0.2 && c.agua <= 0.5) return P('Goma de tapioca (polvilho hidratado)', 'Polvilho úmido e cru, pronto para ir à chapa.');
    return P('Polvilho', 'Amido de mandioca seco.');
  }
  if (acucar > 0.5 && c.agua < 0.45) return P(c.agua < 0.12 ? 'Açúcar derretido' : 'Calda grossa de açúcar', 'Açúcar com pouca água.');
  if (acucar > 0.04 && c.agua > 0.5) return P(acucar > 0.25 ? 'Calda de açúcar' : 'Água com açúcar', 'Açúcar dissolvido em água.');
  const top = CK.filter(k => c[k] > 0.01).sort((a, b) => c[b] - c[a]).slice(0, 3).map(k => `${COMP[k].n} ${pct(c[k])}`);
  return P('Mistura (' + top.map(t => t.split(' (')[0]).join(', ') + ')', 'Composição: ' + top.join(', ') + '.');
}
const kcal100 = c => CK.reduce((s, k) => s + c[k] * COMP[k].kcal * 100, 0);

/* ---------- cozinhar: o que acontece com cada célula de comida ---------- */
const CO2 = id('CO2'), O2 = id('O'), FUM = id('FUMACA'), VAPOR = id('H2O');
function vizAr(i) { const W = L.W, x = i % W; for (const v of [i - W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i + W]) if (v >= 0 && v < L.N && abertaAoAr(v)) return v; return -1; }
function cozinhar(i) {
  const M = MATS[mt[i]]; if (!M.cozinha || !M.nutri) return;
  const c0 = M.nutri;
  const t = T[i];
  // atalho: comida fria e parada não muda (sem levedura, alga, fermento ou gás para vazar)
  if (t < 55 && !c0.levedura && !c0.clorofila && !c0.bicarb && !(c0.sacarose && (c0.acido || c0.levedura)) && !(M.ar > 0) && !(c0.amido > 0.3 && (c0.gluten || c0.glutenRede)) && !(c0.proteina && c0.acido >= 0.02)) return;
  const c = {}; for (const k of CK) c[k] = c0[k] || 0; let ar = M.ar || 0, mudou = false;
  // volume extra (gás que entrou e esticou a massa): guardado em aux, em milésimos do volume da célula
  let ex0 = aux[i] / 1000, exv = ex0;
  // o gás produzido é proporcional à MASSA de massa na célula (1 − porosidade), não ao número de células
  const gas = dG => { dG *= (1 - ar); const v = 1 + exv; ar = (ar * v + dG) / (v + dG); exv += dG; mudou = true; };
  const p = q => rnd() < q, mexe = (de, para, q) => { const d = Math.min(c[de], q); if (d <= 0) return 0; c[de] -= d; if (para) c[para] = (c[para] || 0) + d; mudou = true; return d; };
  const ex = vizAr(i);
  // água evapora a 100 °C (e o calor gasto segura a temperatura): só onde seca passa de 100
  if (c.agua > 0.005 && t >= 100) {
    // por dentro o vapor precisa atravessar a massa para sair: o miolo fica úmido (~40% de água) e só a casca seca
    if (p(ex >= 0 ? 0.35 : 0.0025)) { mexe('agua', null, 0.03); T[i] = Math.max(100, t - 30); if (ex >= 0 && mt[ex] === 0 && p(0.3)) { mt[ex] = VAPOR; T[ex] = 102; } }
  }
  // amido + água + calor → gelatiniza (60–80 °C)
  if (c.amido > 0 && c.agua >= 0.12 && t >= 58 && p(Math.min(1, (t - 56) / 20) * 0.2)) mexe('amido', 'amidoGel', 0.05);
  // proteínas coagulam (clara ~62 °C, gema ~65–70 °C); o glúten firma ~75 °C
  if (c.proteina > 0 && t >= 61 && p(Math.min(1, (t - 59) / 18) * 0.18)) mexe('proteina', 'proteinaDesn', 0.03);
  if (c.proteina > 0 && c.acido >= 0.02 && p(0.01)) mexe('proteina', 'proteinaDesn', 0.02); // ácido também coagula (coalhada, ceviche)
  if ((c.gluten + c.glutenRede) > 0 && t >= 72 && p(0.12)) { if (!mexe('glutenRede', 'proteinaDesn', 0.03)) mexe('gluten', 'proteinaDesn', 0.03); }
  // inversão da sacarose (ácido + calor, ou a enzima invertase da levedura) → glicose + frutose
  if (c.sacarose > 0 && c.agua > 0.2 && ((c.acido >= 0.005 && t >= 60) || (c.levedura > 0.003 && t > 15 && t < 50)) && p(0.04)) mexe('sacarose', 'glicose', 0.02);
  // amilase da farinha quebra um pouco de amido em açúcar (é o "alimento" da levedura no pão)
  if (c.amido > 0.3 && (c.gluten + c.glutenRede) > 0 && c.agua > 0.25 && t > 20 && t < 65 && p(0.006)) mexe('amido', 'glicose', 0.01);
  // caramelização (açúcar sem água); acima de ~200 °C queima
  if (c.agua < 0.12 && t >= 150) { if (c.glicose > 0 && p(Math.min(1, (t - 148) / 30) * 0.12)) mexe('glicose', 'caramelo', 0.03); if (c.sacarose > 0 && t >= 160 && p(Math.min(1, (t - 158) / 30) * 0.12)) mexe('sacarose', 'caramelo', 0.03); }
  if (t >= 200 && p(Math.min(1, (t - 195) / 60) * 0.06)) { let q = 0; for (const k of ['caramelo', 'melanoidina', 'amidoGel', 'amido', 'proteinaDesn', 'glutenRede', 'sacarose', 'glicose', 'fibra', 'gordura']) if (c[k] > 0) { q = mexe(k, 'carvao', 0.04); break; } if (q && ex >= 0 && mt[ex] === 0 && p(0.4)) { mt[ex] = FUM; vida[ex] = 60 + rnd() * 60; } }
  // reação de Maillard: açúcar REDUTOR + proteína, pouca água, ≥ ~120 °C
  const protT = c.proteinaDesn + c.proteina + c.glutenRede + c.gluten;
  if (t >= 118 && c.agua < 0.2 && c.glicose > 0.002 && protT > 0.005 && p(Math.min(1, (t - 115) / 35) * 0.15)) { const s = Math.min(0.02, c.glicose, protT); c.glicose -= s / 2; for (const k of ['proteinaDesn', 'glutenRede', 'proteina', 'gluten']) if (c[k] >= s / 2) { c[k] -= s / 2; break; } c.melanoidina += s; mudou = true; fenomenoAlim('maillard', 'Reação de Maillard', 'açúcar redutor + aminoácido → melanoidinas (marrom) + aromas', 'Acima de ~120 °C, onde a água já saiu, os açúcares redutores reagem com as proteínas e formam centenas de moléculas marrons e cheirosas: casca do pão, carne selada, café torrado. Na água fervendo isso não acontece, porque ela não passa de 100 °C.'); }
  // levedura: viva de ~15 a 45 °C (ótimo ~32 °C); morre acima de ~55 °C
  if (c.levedura > 0) {
    if (t >= 55) { if (p(0.15)) { mexe('levedura', 'proteinaDesn', 0.02); fenomenoAlim('levmorre', 'A levedura morreu', 'acima de ~55 °C', 'O calor desnatura as proteínas da levedura: ela para de fermentar. É por isso que o pão para de crescer no forno depois de um tempo.'); } }
    else {
      const f = Math.max(0, 1 - ((t - 32) / 15) ** 2);
      if (f > 0 && c.agua >= 0.2 && c.glicose > 0.001 && p(0.3 * f)) {
        const s = Math.min(c.glicose, 0.01 * Math.min(1, c.levedura * 20)); c.glicose -= s; c.etanol += s * 0.51; mudou = true;
        const reter = Math.min(1, c.glutenRede / 0.05), rede = reter > 0.2 || c.amidoGel > 0.2 || c.proteinaDesn > 0.1;
        if (rede && estadoDe(M, t) === 0) gas(s * 45 * Math.max(0.15, reter)); else if (estadoDe(M, t) === 1) dissolverEm(i, CO2, s * 40); else gas(s * 6);
        fenomenoAlim('ferment', 'Fermentação alcoólica', 'C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂', 'A levedura come a glicose e solta álcool e gás carbônico. Numa massa sovada, a rede de glúten segura o CO₂ em bolhinhas e a massa cresce; num líquido, o gás sai em bolhas (cerveja, espumante).');
      }
    }
  }
  // fermento químico: bicarbonato + ácido (ou calor ≥ 80 °C) → CO₂
  if (c.bicarb > 0 && c.agua > 0.05 && (c.acido > 0.003 || t >= 80) && p(0.2)) { const d = mexe('bicarb', 'sal', 0.02); if (c.acido > 0.003) c.acido = Math.max(0, c.acido - d * 0.6); const rede = c.glutenRede > 0.02 || c.amidoGel > 0.2 || c.proteinaDesn > 0.1 || c.proteina > 0.05; if (rede && estadoDe(M, t) !== 1) gas(d * 25); else dissolverEm(i, CO2, d * 30); }
  // massa: o gás vaza se não tiver rede de glúten; quando a estrutura já assou, fica preso
  if (ar > 0 && estadoDe(M, t) === 0) { const firme = c.proteinaDesn > 0.05 && c.amidoGel > 0.2; if (!firme) { let vaza = 0.006 * (1 - Math.min(1, (c.glutenRede + c.proteina * 0.5) / 0.05)); if (ar > 0.8) vaza += 0.01; /* massa passada do ponto: as bolhas se juntam e o gás escapa */ if (vaza > 0) { const v = 1 + exv, perde = Math.min(ar * v, vaza * v); ar = (ar * v - perde) / Math.max(0.5, v - perde); exv = Math.max(0, exv - perde); mudou = true; } } }
  // alga: fotossíntese com luz (CO₂ + água → glicose + O₂); no escuro, respira
  if (c.clorofila > 0.003 && c.agua > 0.5 && t > 4 && t < 42) alga(i, c, t, () => { mudou = true; });
  if (Math.abs(ar - (M.ar || 0)) > 0.02) mudou = true;
  if (exv !== ex0) aux[i] = Math.min(60000, Math.round(exv * 1000));
  if (!mudou) return;
  const novo = alimento(c, ar);
  if (novo !== mt[i]) { mt[i] = novo; const N = MATS[novo]; flg[i] = (flg[i] & TK) | (N.po ? PO : 0); anunciar(N); }
  // massa com gás demais cresce para o lado/para cima (o volume aumenta)
  if (aux[i] >= 1000 && estadoDe(MATS[mt[i]], T[i]) === 0) crescer(i);
}
function crescer(i) {
  const W = L.W, x = i % W, M = MATS[mt[i]];
  for (const v of [i - W, x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1]) {
    if (v < 0 || mt[v] !== 0) continue;
    // a célula (que já tinha mais que o dobro de volume) se divide: cada metade leva metade da massa e do gás
    const e = (aux[i] / 1000 - 1) / 2; mt[v] = mt[i]; T[v] = T[i]; flg[v] = flg[i]; corpo[v] = corpo[i]; aux[v] = aux[i] = Math.round(e * 1000);
    fenomenoAlim('cresce', 'A massa cresceu', 'o CO₂ preso estica a rede de glúten', 'Cada bolhinha de CO₂ fica presa numa "bexiga" de glúten. Com mais gás, as bexigas esticam e a massa aumenta de volume.');
    return;
  }
}
function alga(i, c, t, marcar) {
  const W = L.W, x = i % W, y = (i / W) | 0, f = Math.max(0, 1 - ((t - 28) / 14) ** 2);
  const d = (rnd() * 4) | 0, j = d === 0 ? (x > 0 ? i - 1 : -1) : d === 1 ? (x < W - 1 ? i + 1 : -1) : d === 2 ? i - W : i + W;
  if (j < 0 || j >= L.N) return;
  if (L.luz !== false) {
    // pega CO₂ dissolvido na água em volta (ou gás encostado) e solta O₂, que vira bolhas na alga
    let tem = false;
    if (ehLiq(j) && disG[j] === CO2 && dis[j] > 0.03) { dis[j] -= 0.03; tem = true; } else if (mt[j] === CO2 && !(bfl[j] & 1)) { if (rnd() < 0.1) limparCelula(j); tem = true; }
    if (tem && rnd() < 0.5 * f) {
      c.glicose += 0.01; if (c.agua < 0.78) c.agua = 0.8; marcar(); // célula viva na água fica hidratada (osmose)
      const k = ehLiq(j) ? j : liquidoVizinho(i, x, y); if (k >= 0) dissolverEm(k, O2, 0.6);
      fenomenoAlim('fotossintese', 'Fotossíntese', '6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂', 'A clorofila absorve a luz e usa essa energia para juntar o CO₂ dissolvido na água em glicose. O oxigênio que sobra sai em bolhinhas grudadas na alga. Toda comida do planeta começa assim.');
    }
  } else if (c.glicose > 0.005 && rnd() < 0.05) { c.glicose -= 0.005; marcar(); const k = ehLiq(j) ? j : liquidoVizinho(i, x, y); if (k >= 0) dissolverEm(k, CO2, 0.3); }
  // crescer: precisa de nitrogênio (amônia, amônio ou nitrato na água) para fazer proteína
  if (c.glicose >= 0.03) {
    let fonteN = -1; for (const v of [i - 1, i + 1, i - W, i + W, i - 2 * W, i + 2 * W, i - 2, i + 2]) if (v >= 0 && v < L.N && mt[v]) { const N = MATS[mt[v]]; if (N.chave === 'NH3' || N.cat === 'NH4' || N.an === 'NO3') { fonteN = v; break; } }
    if (fonteN >= 0) {
      let alvo = -1; for (const v of [i - W, i + W, i - 1, i + 1]) if (v >= 0 && v < L.N && ehLiq(v) && (MATS[mt[v]].comoAgua || MATS[mt[v]].chave === 'H2O' || MATS[mt[v]].tipo === 'solucao' || MATS[mt[v]].chave === 'AguaTorneira')) { alvo = v; break; }
      if (alvo >= 0 && rnd() < 0.3) {
        c.glicose -= 0.03; c.proteina += 0.01; marcar(); const filha = id('Alga'); const t2 = T[alvo], d2 = dis[alvo], g2 = disG[alvo]; mt[alvo] = filha; T[alvo] = t2; flg[alvo] = (flg[alvo] & TK) | PO; dis[alvo] = 0; disG[alvo] = 0;
        if (rnd() < 0.25) { const N = MATS[mt[fonteN]]; if (N.chave === 'NH3') limparCelula(fonteN); else { mt[fonteN] = id('H2O'); dis[fonteN] = d2; disG[fonteN] = g2; } }
        fenomenoAlim('alga', 'A alga se dividiu', 'glicose + nitrogênio → proteína → célula nova', 'Com a glicose da fotossíntese e o nitrogênio da água (amônia ou nitrato), a alga fabrica aminoácidos e proteínas e se divide em duas. Sem nitrogênio ela só guarda a glicose como amido e não cresce.');
      }
    } else if (rnd() < 0.05) { c.glicose -= 0.01; c.amido += 0.01; marcar(); }
  }
}
const vistosAlim = new Set();
function fenomenoAlim(k, nome, eq, nota) { fenomeno('al:' + k, nome, eq, nota); }
function anunciar(N) { if (N.tipo !== 'alimento' || vistosAlim.has(N.nome) || /^Mistura/.test(N.nome)) return; vistosAlim.add(N.nome); evento('', { nome: '🍽️ ' + N.nome, eq: `${Math.round(kcal100(N.nutri))} kcal por 100 g`, nota: N.porque, fenomeno: true }); }

/* ---------- mexer / sovar / bater ---------- */
function ehComida(i) { const m = mt[i]; if (!m || corpo[i] || (bfl[i] & 1)) return false; const M = MATS[m]; return !!M.nutri && estadoDe(M, T[i]) < 2; }
function mexer(cx, cy, r) {
  const cel = []; noRaio(cx, cy, r, i => { if (ehComida(i)) cel.push(i); });
  if (cel.length < 2) return 0;
  // emulsificante presente? (lecitina da gema, detergente, proteínas) senão óleo e água ficam separados
  let emuls = 0; for (const i of cel) { const n = MATS[mt[i]].nutri; emuls += (n.lecitina || 0) + (n.proteina || 0) * 0.1; }
  const gordo = i => (MATS[mt[i]].nutri.gordura || 0) > 0.5, grupos = emuls / cel.length > 0.003 ? [cel] : [cel.filter(gordo), cel.filter(i => !gordo(i))];
  let n = 0;
  for (const g of grupos) {
    if (g.length < 1) continue;
    const soma = {}; let massa = 0, arT = 0, tT = 0;
    for (const i of g) { const M = MATS[mt[i]], d = M.dens[estadoDe(M, T[i])] || 1; for (const k of CK) soma[k] = (soma[k] || 0) + (M.nutri[k] || 0) * d; massa += d; arT += M.ar || 0; tT += T[i]; }
    for (const k of CK) soma[k] /= massa;
    let ar = arT / g.length;
    // sova: com água, a gliadina e a glutenina se juntam numa rede (glúten)
    if (soma.gluten > 0 && soma.agua >= 0.2 && soma.agua <= 0.6) { const d = soma.gluten * 0.35; soma.gluten -= d; soma.glutenRede += d; fenomenoAlim('sova', 'Sovar formou glúten', 'gliadina + glutenina + água + trabalho → rede de glúten', 'Ao sovar, as proteínas do trigo se desenrolam e se ligam umas às outras (pontes de enxofre), formando uma rede elástica. Ela é o que segura o gás e deixa o pão aerado.'); }
    // bater: proteína em muita água, sem gordura, segura ar (claras em neve). Gordura atrapalha.
    if ((soma.proteina || 0) > 0.05 && soma.agua > 0.6 && (soma.gordura || 0) < 0.02) { ar = Math.min(0.85, ar + 0.07); if (ar > 0.35) fenomenoAlim('neve', 'Claras em neve', 'proteínas desenroladas em volta do ar', 'Bater desenrola as proteínas da clara; as partes que fogem da água grudam nas bolhas de ar e formam uma espuma firme. Uma gota de gema (gordura) atrapalha e a neve não sobe.'); }
    else if ((soma.gordura || 0) > 0.2 && soma.proteina > 0.04 && soma.agua < 0.6) ar = Math.max(ar, 0);
    const m = alimento(soma, ar), tm = tT / g.length;
    for (const i of g) { mt[i] = m; T[i] = tm; flg[i] = (flg[i] & TK) | (MATS[m].po ? PO : 0); dis[i] = 0; disG[i] = 0; gv[i] = 0; n++; }
    anunciar(MATS[m]);
  }
  return n;
}

/* ---------- reações com catalisador (dos elementos às moléculas da comida) ---------- */
const CATAL = [
  { a: 'C', b: 'H2O', cat: null, t: [900, 1500], pa: 'CO', pb: 'H', p: 0.05, nome: 'Gás de água (carvão + vapor)', eq: 'C + H₂O → CO + H₂', nota: 'Vapor passando por carvão em brasa vira monóxido de carbono e hidrogênio: o "gás de síntese", matéria-prima para fazer metanol, gasolina e até gordura.' },
  { a: 'N', b: 'H', cat: ['Fe', 'Fe3O4'], t: [350, 600], pa: 'NH3', pb: 0, p: 0.03, nome: 'Haber-Bosch: amônia do ar', eq: 'N₂ + 3 H₂ ⇌ 2 NH₃ (ferro, ~450 °C)', nota: 'O nitrogênio do ar é inerte; o ferro quente ajuda a quebrar a ligação tripla. Na indústria usa-se 200 atm. Metade do nitrogênio das proteínas do seu corpo veio de adubo feito assim.' },
  { a: 'CO2', b: 'H', cat: ['Ni'], t: [250, 450], pa: 'CH4', pb: 'H2O', p: 0.03, nome: 'Reação de Sabatier', eq: 'CO₂ + 4 H₂ → CH₄ + 2 H₂O (níquel)', nota: 'A Estação Espacial usa essa reação para recuperar água do CO₂ que os astronautas respiram.' },
  { a: 'CO', b: 'H', cat: ['Cu', 'ZnO', 'Zn'], t: [200, 320], pa: 'Metanol', pb: 0, p: 0.03, nome: 'Síntese do metanol', eq: 'CO + 2 H₂ → CH₃OH (cobre/óxido de zinco)', nota: 'É assim que se faz quase todo o metanol do mundo. Atenção: metanol é veneno.' },
  { a: 'CO', b: 'H', cat: ['Co', 'Fe'], t: [200, 350], pa: 'Parafina', pb: 'H2O', p: 0.02, nome: 'Fischer-Tropsch', eq: 'n CO + (2n+1) H₂ → CₙH₂ₙ₊₂ + n H₂O', nota: 'Cobalto ou ferro juntam os carbonos em cadeias longas: combustível e cera a partir de carvão ou gás.' },
  { a: 'Metanol', b: 'O', cat: ['Ag'], t: [500, 700], pa: 'Formaldeido', pb: 'H2O', p: 0.04, nome: 'Metanol → formaldeído', eq: '2 CH₃OH + O₂ → 2 CH₂O + 2 H₂O (prata)', nota: 'A prata quente tira hidrogênio do metanol.' },
  { a: 'Formaldeido', b: 'aq:Ca:OH', cat: null, t: [40, 90], pa: 'Glicose', pb: 'aq:Ca:OH', p: 0.03, nome: 'Reação da formose: açúcar sem planta', eq: 'n CH₂O → (CH₂O)ₙ (açúcares)', nota: 'Com uma base (água de cal), o formaldeído se junta sozinho em açúcares (Butlerov, 1861). Sai uma mistura: parte é glicose e frutose; parte são açúcares que o corpo não usa. Talvez os primeiros açúcares da Terra tenham surgido assim.' },
  { a: 'Parafina', b: 'O', cat: ['MnO2', 'KMnO4'], t: [100, 170], pa: 'AcidoGraxo', pb: 0, p: 0.02, nome: 'Oxidação da parafina', eq: 'CₙH₂ₙ₊₂ + O₂ → R–COOH (manganês)', nota: 'Com oxigênio e um catalisador de manganês, as pontas das cadeias de parafina viram ácidos graxos.' },
  { a: 'AcidoGraxo', b: 'Glicerina', cat: ['H2SO4', 'aq:H:SO4'], t: [90, 220], pa: 'Oleo', pb: 'H2O', p: 0.03, nome: 'Esterificação: gordura de laboratório', eq: '3 R–COOH + C₃H₈O₃ → triglicerídeo + 3 H₂O (ácido)', nota: 'Três ácidos graxos presos numa glicerina são uma gordura. Na Alemanha dos anos 1940 chegaram a fazer "manteiga de carvão" assim (Fischer-Tropsch → ácidos graxos → gordura).' },
];
for (const r of CATAL) { r.ia = r.a.startsWith('aq:') ? POR_CHAVE.get(r.a) : id(r.a); r.ib = r.b.startsWith('aq:') ? (POR_CHAVE.get(r.b) ?? solucao(...r.b.slice(3).split(':'))) : id(r.b); r.ipa = r.pa ? (r.pa.startsWith('aq:') ? r.ib : id(r.pa)) : 0; r.ipb = r.pb ? (r.pb.startsWith('aq:') ? r.ib : id(r.pb)) : 0; r.icat = r.cat ? r.cat.map(k => k.startsWith('aq:') ? POR_CHAVE.get(k) : id(k)).filter(v => v >= 0) : null; r.tmin = r.t[0]; r.tmax = r.t[1]; }
const POR_REAGENTE = new Map(); for (const r of CATAL) { if (r.ia < 0) continue; if (!POR_REAGENTE.has(r.ia)) POR_REAGENTE.set(r.ia, []); POR_REAGENTE.get(r.ia).push(r); }
function catalise() {
  const W = L.W, n = Math.ceil(L.N / 25);
  for (let k = 0; k < n; k++) {
    const i = (rnd() * L.N) | 0, lista = POR_REAGENTE.get(mt[i]); if (!lista) continue;
    const x = i % W, y = (i / W) | 0;
    for (const r of lista) {
      if (T[i] < r.tmin || T[i] > r.tmax) continue;
      let jb = -1, cat = !r.icat;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= W || ny >= L.H) continue; const j = ny * W + nx; if (mt[j] === r.ib && jb < 0 && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) jb = j; if (!cat && r.icat.includes(mt[j])) cat = true; }
      if (jb < 0 || !cat || rnd() > r.p * L.velReacao * 8) continue;
      mt[i] = r.ipa; flg[i] &= TK; if (r.ipa === 0) limparCelula(i);
      if (r.ipb === 0) limparCelula(jb); else { mt[jb] = r.ipb; flg[jb] &= TK; }
      if (MATS[r.ipa] && MATS[r.ipa].po) flg[i] |= PO;
      const rc = canonico(r), q = (L.contagem.get(rc) || 0) + 1; L.contagem.set(rc, q); if (q === 1) evento('Nova reação: ' + rc.nome, rc);
      break;
    }
  }
}

/* ---------- passo ---------- */
L.luz = true;
function passoAlimentos() {
  if (L.tick & 1) for (let i = 0; i < L.N; i++) { const m = mt[i]; if (m && MATS[m].cozinha) cozinhar(i); }
  catalise();
  // programa de temperatura (forno dos experimentos)
  if (L.programa && L.programa.length) { const p0 = L.programa[0]; L.AMB = p0.amb; if (p0.ate !== undefined && L.tick >= p0.ate) { L.programa.shift(); if (L.programa[0] && L.programa[0].aviso) evento(L.programa[0].aviso); } }
}

/* ---------- ficha de um alimento ---------- */
function fichaAlimento(M, t) {
  const c = M.nutri, kc = kcal100(c), linhas = CK.filter(k => c[k] >= 0.005).sort((a, b) => c[b] - c[a]).map(k => `<tr><td><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:rgb(${COMP[k].cor.join(',')})"></span> ${esc(COMP[k].n)}</td><td>${pct(c[k])}</td><td>${n1(c[k] * 100, 1)} g</td></tr>`).join('');
  const macro = { carb: ['sacarose', 'glicose', 'amido', 'amidoGel', 'caramelo'].reduce((s, k) => s + c[k], 0), prot: ['proteina', 'proteinaDesn', 'gluten', 'glutenRede', 'levedura'].reduce((s, k) => s + c[k], 0), gord: c.gordura + c.lecitina };
  return `<h2 class="titulo">🍽️ ${esc(M.nome)}</h2><p>${esc(M.porque || '')}</p>
    <div class="cartao"><b>${Math.round(kc)} kcal</b> por 100 g · carboidratos ${n1(macro.carb * 100, 1)} g · proteínas ${n1(macro.prot * 100, 1)} g · gorduras ${n1(macro.gord * 100, 1)} g${c.etanol > 0.005 ? ` · álcool ${n1(c.etanol * 100, 1)} g` : ''}${M.ar > 0.02 ? ` · ${pct(M.ar)} do volume é gás` : ''}</div>
    <table><tr><th>Componente</th><th>Fração</th><th>em 100 g</th></tr>${linhas}</table>
    <p class="muted" style="font-size:12px">Densidade ${n1(M.dens[0], 2)} g/cm³ · ${n1(t, 0)} °C. Energia pelos fatores de Atwater (carboidrato e proteína 4 kcal/g, gordura 9, álcool 7, fibra 2). Composição dos ingredientes: USDA FoodData Central.</p>`;
}

/* ---------- microscópio: a comida por dentro ---------- */
function texturaAlimento(c2, w, h, M, t) {
  const c = M.nutri, R = (k, n) => Math.round(Math.min(40, c[k] * n));
  c2.fillStyle = c.agua > 0.5 ? '#0e1e34' : '#1a1712'; c2.fillRect(0, 0, w, h);
  let s = 7; const rr = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  // bolhas de ar/gás
  for (let k = 0; k < Math.round((M.ar || 0) * 14); k++) { const x = rr() * w, y = rr() * h, r = 8 + rr() * 22; c2.fillStyle = 'rgba(8,10,14,.95)'; c2.beginPath(); c2.arc(x, y, r, 0, 7); c2.fill(); c2.strokeStyle = 'rgba(215,190,140,.9)'; c2.lineWidth = 2; c2.stroke(); }
  // rede de glúten / proteína coagulada: fios ligados
  const fios = R('glutenRede', 90) + R('proteinaDesn', 90);
  c2.strokeStyle = 'rgba(225,205,160,.85)'; c2.lineWidth = 1.6; for (let k = 0; k < fios; k++) { c2.beginPath(); let x = rr() * w, y = rr() * h; c2.moveTo(x, y); for (let q = 0; q < 6; q++) { x += (rr() - 0.5) * 34; y += (rr() - 0.5) * 34; c2.lineTo(x, y); } c2.stroke(); }
  // proteína nativa: novelos enrolados
  for (let k = 0; k < R('proteina', 120) + R('gluten', 60); k++) { const x = rr() * w, y = rr() * h; c2.strokeStyle = 'rgba(236,226,190,.9)'; c2.lineWidth = 1.4; c2.beginPath(); for (let a = 0; a < 12; a += 0.5) c2.lineTo(x + Math.cos(a * 2) * (3 + a * 0.5), y + Math.sin(a * 2.3) * (3 + a * 0.5)); c2.stroke(); }
  // grânulos de amido: crus = poliedros densos com anéis; gelatinizados = inchados e translúcidos, soltando amilose
  for (let k = 0; k < R('amido', 40); k++) { const x = rr() * w, y = rr() * h, r = 7 + rr() * 6; c2.fillStyle = 'rgba(250,250,240,.95)'; c2.beginPath(); for (let a = 0; a < 6; a++) c2.lineTo(x + Math.cos(a + k) * r, y + Math.sin(a + k) * r); c2.fill(); c2.strokeStyle = 'rgba(190,190,170,.8)'; c2.beginPath(); c2.arc(x, y, r * 0.5, 0, 7); c2.stroke(); }
  for (let k = 0; k < R('amidoGel', 30); k++) { const x = rr() * w, y = rr() * h, r = 14 + rr() * 10; c2.fillStyle = 'rgba(225,232,236,.35)'; c2.beginPath(); c2.arc(x, y, r, 0, 7); c2.fill(); c2.strokeStyle = 'rgba(235,240,245,.6)'; c2.lineWidth = 1; c2.beginPath(); c2.moveTo(x + r, y); c2.bezierCurveTo(x + r + 10, y - 8, x + r + 16, y + 10, x + r + 26, y); c2.stroke(); }
  // gotas de gordura
  for (let k = 0; k < R('gordura', 30); k++) { const x = rr() * w, y = rr() * h, r = 4 + rr() * 9; esfera(c2, x, y, r, '#f2d66e'); }
  // levedura: células ovais brotando
  for (let k = 0; k < R('levedura', 60); k++) { const x = rr() * w, y = rr() * h; const viva = t < 55; c2.fillStyle = 'rgba(220,196,140,.95)'; c2.beginPath(); c2.ellipse(x, y, 7, 5, rr() * 3, 0, 7); c2.fill(); if (viva) { c2.beginPath(); c2.ellipse(x + 7, y - 3, 3, 2.4, 0, 0, 7); c2.fill(); } }
  // clorofila: cloroplastos verdes dentro das células
  for (let k = 0; k < Math.round(Math.min(10, c.clorofila * 900)); k++) { const x = rr() * w, y = rr() * h; c2.strokeStyle = 'rgba(160,220,160,.7)'; c2.lineWidth = 2; c2.beginPath(); c2.arc(x, y, 18, 0, 7); c2.stroke(); for (let q = 0; q < 4; q++) esfera(c2, x + (rr() - 0.5) * 20, y + (rr() - 0.5) * 20, 4, '#2f9a35'); }
  // açúcar, Maillard, caramelo, carvão: pontos coloridos
  const pontos = [['sacarose', '#ffffff', 60], ['glicose', '#f6f0d8', 60], ['melanoidina', '#7a4418', 400], ['caramelo', '#b4681e', 120], ['carvao', '#1c1816', 120], ['sal', '#e8f0ff', 200]];
  for (const [k, cor, f] of pontos) for (let q = 0; q < R(k, f); q++) { c2.fillStyle = cor; c2.fillRect(rr() * w, rr() * h, 3, 3); }
}
function explicarAlimento(M, t) {
  const c = M.nutri; let h = `<b>${esc(M.nome)}</b> a ${Math.round(t)} °C · ${Math.round(kcal100(c))} kcal/100 g. ${esc(M.porque || '')}`;
  const amidoT = c.amido + c.amidoGel; if (amidoT > 0.05) h += `<br>🔹 Amido: ${pct(c.amidoGel / amidoT)} gelatinizado ${c.amido > 0.02 ? (c.agua >= 0.12 ? (t < 58 ? '(ainda frio: gelatiniza a 60–80 °C)' : '(inchando agora)') : '(falta água para gelatinizar)') : ''}.`;
  const prot = c.proteina + c.proteinaDesn; if (prot > 0.02) h += `<br>🔸 Proteína: ${pct(c.proteinaDesn / prot)} coagulada${c.proteina > 0.01 && t < 61 ? ' (coagula acima de ~62 °C)' : ''}.`;
  if (c.glutenRede + c.gluten > 0.02) h += `<br>🌾 Glúten: ${pct(c.glutenRede / (c.glutenRede + c.gluten))} em rede${c.gluten > c.glutenRede ? ' — sove com 🥄 Mexer para formar a rede' : ''}.`;
  if (c.levedura > 0.002) h += `<br>🍄 Levedura ${t >= 55 ? 'morta (calor)' : t < 15 ? 'dormindo (frio)' : c.glicose < 0.002 ? 'viva, mas sem açúcar para comer' : 'viva e fermentando'}.`;
  if (c.agua < 0.2 && t >= 118) h += '<br>🟤 Seco e acima de 120 °C: aqui acontece a reação de Maillard.';
  if (c.clorofila > 0.002) h += `<br>🌱 ${L.luz !== false ? 'Com luz: fotossíntese (pega CO₂ da água, solta O₂).' : 'No escuro: respira (gasta glicose, solta CO₂).'}`;
  return h;
}

/* ---------- experimentos ---------- */
const COMP_FARINHA = INGR.FarinhaTrigo.nutri;
function misturaDe(partes) { const c = {}; for (const [n, f] of partes) for (const k in n) c[k] = (c[k] || 0) + n[k] * f; return c; }
EXPERIMENTOS.push(
  { n: '🍞 Pão de verdade', d: 'Massa sovada (farinha, água, sal e levedura). Primeiro 32 °C: a levedura fermenta e a massa cresce. Depois o forno a 220 °C: o amido gelatiniza, o glúten firma, a levedura morre e a casca doura (Maillard). Use o 🔬 e o 🔍 na massa.', f: (W, H) => {
    const c = misturaDe([[COMP_FARINHA, 0.6], [{ agua: 1 }, 0.37], [{ sal: 1 }, 0.012], [{ levedura: 0.92, agua: 0.05, proteina: 0.03 }, 0.015]]); c.glutenRede = c.gluten * 0.9; c.gluten *= 0.1;
    const m = alimento(c, 0.05); EXP.ret(W * 0.25, H - 4, W * 0.75, H - 3, 'Cadinho');
    for (let y = H - 14; y < H - 4; y++) for (let x = W * 0.33 | 0; x < W * 0.67; x++) { const dx = (x - W * 0.5) / (W * 0.17), dy = (y - (H - 4)) / 10; if (dx * dx + dy * dy <= 1) put(x, y, m, false, 30); }
    L.programa = [{ amb: 32, ate: L.tick + 1800 }, { amb: 220, ate: L.tick + 3600, aviso: '🔥 Forno ligado: 220 °C' }, { amb: 25, aviso: '✅ Forno desligado: o pão está pronto (use o 🔍 e o 🔬)' }]; } },
  { n: '🥞 Tapioca na chapa', d: 'Polvilho úmido numa chapa a 220 °C. A água evapora por baixo, os grãos de amido incham e grudam (gelatinização) e vira uma panqueca elástica, sem glúten nenhum.', f: (W, H) => { EXP.ret(0, H - 3, W - 1, H - 1, 'CHAPA'); const m = alimento({ amido: 0.6, agua: 0.4 }, 0); EXP.ret(W * 0.3, H - 6, W * 0.7, H - 4, m, { po: true }); } },
  { n: '🍮 Caramelo', d: 'Açúcar numa chapa a 220 °C. A sacarose derrete e, acima de ~160 °C, se quebra em centenas de moléculas marrons e cheirosas. Deixe demais e queima (carvão).', f: (W, H) => { EXP.ret(0, H - 3, W - 1, H - 1, 'CHAPA'); EXP.ret(W * 0.35, H - 9, W * 0.65, H - 4, 'Sacarose', { po: true }); } },
  { n: '🥚 Ovo cozido', d: 'Um ovo (casca de carbonato de cálcio, clara e gema) numa panela de água fervendo. A água segura a 100 °C: a clara coagula a ~62 °C e a gema a ~65–70 °C.', f: (W, H) => { EXP.ret(0, H - 3, W - 1, H - 1, 'CHAPA'); const x0 = W * 0.3 | 0, w = W * 0.4 | 0; EXP.bequer(x0, H * 0.62 | 0, w, H - 4 - (H * 0.62 | 0), 'Cadinho'); EXP.ret(x0 + 1, H * 0.7, x0 + w - 1, H - 5, 'H2O', { temp: 90 }); const cx = W * 0.5, cy = H - 17; for (let y = cy - 8; y <= cy + 8; y++) for (let x = cx - 7; x <= cx + 7; x++) { const e = ((x - cx) / 7) ** 2 + ((y - cy) / 8) ** 2; if (e > 1) continue; put(Math.round(x), Math.round(y), e > 0.75 ? id('CaCO3') : e < 0.22 ? id('Gema') : id('Clara'), false); } } },
  { n: '🌱 Da luz ao alimento (alga)', d: 'Algas verdes em água com gás carbônico e um pouco de amônia (nitrogênio). Com a luz, elas fazem fotossíntese: tiram o CO₂ da água, soltam bolhas de O₂ e, com o nitrogênio, fabricam proteína e se multiplicam. Apague a 💡 luz e compare.', f: (W, H) => { const x0 = W * 0.25 | 0, w = W * 0.5 | 0; EXP.bequer(x0, H * 0.3 | 0, w, H * 0.65 | 0); for (let y = H * 0.4 | 0; y < H * 0.95 - 1; y++) for (let x = x0 + 1; x < x0 + w; x++) { put(x, y, id('H2O')); const i = y * L.W + x; disG[i] = CO2; dis[i] = 1.6; } for (let k = 0; k < 40; k++) put(x0 + 3 + (rnd() * (w - 6) | 0), H * 0.5 + rnd() * H * 0.4 | 0, id('Alga'), true); EXP.ret(x0 + 2, H * 0.42, x0 + 6, H * 0.46, solucao('NH4', 'OH')); EXP.ret(x0 + w - 6, H * 0.42, x0 + w - 2, H * 0.46, solucao('NH4', 'OH')); L.luz = true; } },
  { n: '🏭 Amônia do ar (Haber-Bosch)', d: 'Nitrogênio e hidrogênio num reator a 450 °C com ferro em pó como catalisador. O ferro ajuda a quebrar a ligação tripla do N₂ e forma amônia: o começo do adubo que vira a proteína dos alimentos.', f: (W, H) => { const x0 = W * 0.25 | 0, w = W * 0.5 | 0, y0 = H * 0.3 | 0; EXP.bequer(x0, y0, w, H * 0.65 | 0); EXP.ret(x0, y0, x0 + w, y0, 'Vidro'); EXP.ret(x0 + 1, H * 0.95 - 4, x0 + w - 1, H * 0.95 - 1, 'FORNO450'); EXP.ret(x0 + 1, H * 0.95 - 7, x0 + w - 1, H * 0.95 - 5, 'Fe', { po: true }); for (let y = y0 + 1; y < H * 0.95 - 7; y++) for (let x = x0 + 1; x < x0 + w; x++) put(x, y, rnd() < 0.25 ? id('N') : id('H'), false, 450); /* reator cheio: sem ar, o ferro não queima */ } },
  { n: '🧪 Gordura sem planta', d: 'Ácido graxo e glicerina com um pouco de ácido sulfúrico (catalisador), num banho a 140 °C. Três ácidos graxos se prendem numa glicerina e formam uma gordura (triglicerídeo), igual à do óleo de cozinha. A água que sai vira vapor, e isso empurra a reação para a frente.', f: (W, H) => { EXP.bequer(W * 0.35 | 0, H * 0.55 | 0, W * 0.3 | 0, (H * 0.45 | 0) - 2, 'Cadinho'); for (let y = H * 0.75 | 0; y < H - 2; y++) for (let x = W * 0.35 + 1 | 0; x < W * 0.65 - 1; x++) { const q = rnd(); put(x, y, q < 0.02 ? id('H2SO4') : q < 0.75 ? id('AcidoGraxo') : id('Glicerina'), false, 140); } L.programa = [{ amb: 140 }]; L.agitador = true; } },
);
{ const lt0 = limparTudo; limparTudo = function () { lt0(); L.agitador = false; if (L.programa) { L.programa = null; L.AMB = 25; } }; }

/* ---------- reagentes: testes de alimentos e reações clássicas ---------- */
const reg2 = (k, o) => POR_CHAVE.has(k) ? POR_CHAVE.get(k) : registrar(Object.assign({ chave: k, tipo: 'composto', formula: o.formula || '—', pf: -2, pe: 101, d: 1.05, cp: 4, lam: 0.6, cores: o.cor, tox: 'ions', comoAgua: false, tipo2: 'reagente' }, o));
const BENEDICT_OK = reg2('BenedictPositivo', { nome: 'Benedict positivo (Cu₂O)', formula: 'Cu2O', pf: 1232, pe: null, d: 6.0, cor: ['#b8301a'], po: true });
const BIURETO_OK = reg2('BiuretoPositivo', { nome: 'Biureto positivo (violeta)', cor: ['#b090d8', '#7a3ab0', '#ece4f4'] });
const SUDAN_OK = reg2('GorduraCorada', { nome: 'Gordura corada com Sudan III', pf: -16, pe: null, d: 0.92, cor: ['#e85a28', '#e0461c', '#f4d8c8'] });
const FE_SALIC = reg2('FerroSalicilato', { nome: 'Complexo ferro(III)–salicilato (violeta)', cor: ['#9a4ab8', '#6a1a8a', '#ece0f4'] });
const CROMO_VERDE = solucao('Cr', 'SO4');
const nutriDe = M => M.nutri || null;
function regraReagentes(A, B) {
  const par = (f) => { const r = f(A, B); if (r) return r; const s = f(B, A); if (s) return Object.assign({}, s, { pa: s.pb, pb: s.pa, tA: s.tB, tB: s.tA }); return null; };
  return par((X, Y) => {
    const n = nutriDe(Y), glic = Y.chave === 'Glicose' || (n && (n.glicose || 0) >= 0.005), prot = n && ((n.proteina || 0) + (n.proteinaDesn || 0) + (n.gluten || 0) + (n.glutenRede || 0) + (n.levedura || 0)) >= 0.02, gord = n && (n.gordura || 0) >= 0.05, amid = n && ((n.amido || 0) + (n.amidoGel || 0)) >= 0.05;
    if (X.chave === 'Benedict') { if (glic) return R({ pa: BENEDICT_OK, pb: Y.id, p: 0.15, tmin: 70, poA: true, nome: 'Teste de Benedict: açúcar redutor', eq: 'Cu²⁺ (azul) + açúcar redutor → Cu₂O↓ (vermelho-tijolo)', nota: 'O açúcar redutor (glicose, frutose, lactose) tem um grupo aldeído que doa elétrons ao cobre. Precisa aquecer (~70 °C ou mais). A sacarose dá negativo: o grupo dela está "preso" na ligação entre as duas metades.' }); if (n && (n.sacarose || 0) > 0.05) return R({ pa: X.id, p: 0, tmin: 70, nome: 'Benedict com sacarose: negativo', eq: 'continua azul', nota: 'A sacarose não é redutora. Ferva com um pouco de ácido (inversão) e ela vira glicose + frutose: aí dá positivo.' }); }
    if (X.chave === 'Biureto' && prot) return R({ pa: BIURETO_OK, pb: Y.id, p: 0.2, nome: 'Teste do biureto: proteína', eq: 'Cu²⁺ + ligações peptídicas → complexo violeta', nota: 'O cobre se liga ao nitrogênio das ligações entre os aminoácidos. Aminoácidos soltos não dão a cor: precisa ser uma cadeia (proteína).' });
    if (X.chave === 'SudanIII' && (gord || Y.chave === 'Oleo' || Y.chave === 'Manteiga')) return R({ pa: SUDAN_OK, pb: Y.chave === 'Oleo' ? SUDAN_OK : Y.id, p: 0.2, nome: 'Teste do Sudan III: gordura', eq: 'corante apolar + gordura → gordura vermelha', nota: 'O Sudan III é apolar como a gordura: sai do álcool e se dissolve nela, que fica vermelha. Na água ele não entra.' });
    if (X.lugol && amid) return R({ pa: solucao('K', 'I'), pb: id('AmidoIodo'), p: 0.2, poB: true, nome: 'Teste do amido no alimento', eq: 'amilose + I₃⁻ → complexo azul-escuro', nota: 'O iodo entra na hélice da amilose. Funciona no pão, na batata, no polvilho e no mingau.' });
    if (X.lugol && (Y.an === 'C6H7O6' || Y.chave === 'C6H8O6')) return R({ pa: solucao('K', 'I'), pb: Y.id, p: 0.25, nome: 'Vitamina C descora o iodo', eq: 'C₆H₈O₆ + I₂ → C₆H₆O₆ + 2 HI', nota: 'A vitamina C é um redutor: transforma o iodo (marrom) em iodeto (incolor). Quanto mais vitamina C um suco tem, mais lugol ele descora.' });
    if (X.lugol && Y.an === 'S2O3') return R({ pa: solucao('K', 'I'), pb: Y.id, p: 0.25, nome: 'Tiossulfato descora o iodo', eq: 'I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻', nota: 'É a titulação iodométrica: o tiossulfato reduz o iodo até a cor sumir.' });
    if (X.an === 'S2O3' && Y.tipo === 'solucao' && Y.acido && (Y.phAcido ?? Y.ph) < 3) return R({ pa: id('S'), pb: id('SO2'), poA: true, p: 0.01, nome: 'Tiossulfato + ácido: a reação do relógio', eq: 'S₂O₃²⁻ + 2 H⁺ → S↓ + SO₂ + H₂O', nota: 'O enxofre aparece aos poucos e a solução fica turva. Como demora alguns segundos, é usada para medir velocidade de reação.' });
    if (X.an === 'C2O4' && X.tipo === 'solucao' && Y.an === 'MnO4') return R({ pa: id('CO2'), pb: id('H2O'), p: 0.1, tmin: 60, nome: 'Oxalato descora o permanganato', eq: '2 MnO₄⁻ + 5 C₂O₄²⁻ + 16 H⁺ → 2 Mn²⁺ + 10 CO₂ + 8 H₂O', nota: 'Titulação clássica: o roxo do permanganato some enquanto ainda há oxalato. Precisa estar morno (~60 °C).' });
    if (X.an === 'Cr2O7' && (Y.chave === 'Etanol' || (n && (n.etanol || 0) > 0.02))) return R({ pa: CROMO_VERDE, pb: Y.chave === 'Etanol' ? id('CH3COOH') >= 0 ? id('CH3COOH') : solucao('H', 'CH3COO') : Y.id, p: 0.08, nome: 'Bafômetro: dicromato + álcool', eq: 'Cr₂O₇²⁻ (laranja) + 3 C₂H₅OH + 8 H⁺ → 2 Cr³⁺ (verde) + 3 CH₃CHO + 7 H₂O', nota: 'O dicromato oxida o álcool e vira crômio(III), verde. Os bafômetros antigos tinham um tubinho com esse reagente.' });
    if (X.cat === 'Fe3' && X.tipo === 'solucao' && (Y.an === 'C7H5O3' || Y.chave === 'C7H6O3')) return R({ pa: FE_SALIC, pb: Y.tipo === 'solucao' ? FE_SALIC : Y.id, p: 0.2, nome: 'Ferro(III) + salicilato: violeta', eq: 'Fe³⁺ + salicilato → complexo violeta', nota: 'Teste que mostra ácido salicílico: aspirina velha (que já se decompôs) fica violeta com cloreto férrico.' });
    // ácido + sal: se o ânion do ácido forma sal insolúvel com o cátion, precipita (H₂C₂O₄ + Ca²⁺ → CaC₂O₄↓; H₂SO₄ + Ba²⁺ → BaSO₄↓)
    if (X.tipo === 'solucao' && X.cat === 'H' && X.an && Y.tipo === 'solucao' && Y.cat && Y.cat !== 'H' && Y.an && CATIONS[Y.cat] && !soluvel(Y.cat, X.an) && soluvel('H', Y.an)) return R({ pa: sal(Y.cat, X.an), pb: solucao('H', Y.an), poA: true, p: 0.15, nome: `Precipitação: ${minus(MATS[sal(Y.cat, X.an)].nome)}`, eq: `${eqIon(simbCat(Y.cat), CATIONS[Y.cat].carga)} + ${fmt(X.an)}${SUP(-ANIONS[X.an].carga)} → ${fmt(MATS[sal(Y.cat, X.an)].formula)}↓`, nota: `O ânion do ácido encontra um cátion com que forma um sal insolúvel, e o sólido aparece mesmo vindo de um ácido.${X.an === 'C2O4' && Y.cat === 'Ca' ? ' O oxalato de cálcio é o principal componente das pedras nos rins.' : ''}` });
    if (X.chave === 'HCOOH' && Y.chave === 'H2SO4') return R({ pa: id('CO'), pb: Y.id, p: 0.05, tmin: 40, nome: 'Ácido fórmico + ácido sulfúrico: monóxido de carbono', eq: 'HCOOH → CO↑ + H₂O (H₂SO₄ tira a água)', nota: 'O ácido sulfúrico concentrado arranca a água do ácido fórmico e sobra monóxido de carbono, um gás tóxico. É como se faz CO no laboratório.' });
    return null;
  });
}
{ const cr0 = criarRegra; criarRegra = function (A, B) { const r = regraReagentes(A, B); if (r) return r; return cr0(A, B); }; limparCacheRegras(); }

/* ---------- liga no motor ---------- */
{ const f0 = fisica; window.fisica = fisica = function () { f0(); passoAlimentos(); }; }
