/* =========================================================================
   LABORATÓRIO DOS ELEMENTOS · banco de dados químico
   - Números dos elementos: pubchem.js (PubChem / NIH)
   - Aqui: nomes em português, aparência, condutividade térmica, chama,
     reatividade, compostos com dados medidos, íons, solubilidade e toxicologia.
   Valores de compostos: CRC Handbook of Chemistry and Physics / PubChem.
   Toxicologia: ATSDR/CDC (ToxFAQs), NIH (StatPearls, Office of Dietary
   Supplements), Manual MSD, relatos de caso publicados (PubMed Central).
   Tudo aqui é para ESTUDO: não é orientação médica.
   ========================================================================= */
'use strict';

const NOMES_PT = ['', 'Hidrogênio', 'Hélio', 'Lítio', 'Berílio', 'Boro', 'Carbono', 'Nitrogênio', 'Oxigênio', 'Flúor', 'Neônio', 'Sódio', 'Magnésio', 'Alumínio', 'Silício', 'Fósforo', 'Enxofre', 'Cloro', 'Argônio', 'Potássio', 'Cálcio', 'Escândio', 'Titânio', 'Vanádio', 'Crômio', 'Manganês', 'Ferro', 'Cobalto', 'Níquel', 'Cobre', 'Zinco', 'Gálio', 'Germânio', 'Arsênio', 'Selênio', 'Bromo', 'Criptônio', 'Rubídio', 'Estrôncio', 'Ítrio', 'Zircônio', 'Nióbio', 'Molibdênio', 'Tecnécio', 'Rutênio', 'Ródio', 'Paládio', 'Prata', 'Cádmio', 'Índio', 'Estanho', 'Antimônio', 'Telúrio', 'Iodo', 'Xenônio', 'Césio', 'Bário', 'Lantânio', 'Cério', 'Praseodímio', 'Neodímio', 'Promécio', 'Samário', 'Európio', 'Gadolínio', 'Térbio', 'Disprósio', 'Hólmio', 'Érbio', 'Túlio', 'Itérbio', 'Lutécio', 'Háfnio', 'Tântalo', 'Tungstênio', 'Rênio', 'Ósmio', 'Irídio', 'Platina', 'Ouro', 'Mercúrio', 'Tálio', 'Chumbo', 'Bismuto', 'Polônio', 'Astato', 'Radônio', 'Frâncio', 'Rádio', 'Actínio', 'Tório', 'Protactínio', 'Urânio', 'Netúnio', 'Plutônio', 'Amerício', 'Cúrio', 'Berquélio', 'Califórnio', 'Einstênio', 'Férmio', 'Mendelévio', 'Nobélio', 'Laurêncio', 'Rutherfórdio', 'Dúbnio', 'Seabórgio', 'Bóhrio', 'Hássio', 'Meitnério', 'Darmstádtio', 'Roentgênio', 'Copernício', 'Nihônio', 'Fleróvio', 'Moscóvio', 'Livermório', 'Tenesso', 'Oganessônio'];

const GRUPO_PT = { 'Alkali metal': 'Metal alcalino', 'Alkaline earth metal': 'Metal alcalinoterroso', 'Transition metal': 'Metal de transição', 'Post-transition metal': 'Metal representativo', 'Metalloid': 'Semimetal', 'Nonmetal': 'Não metal', 'Halogen': 'Halogênio', 'Noble gas': 'Gás nobre', 'Lanthanide': 'Lantanídeo', 'Actinide': 'Actinídeo' };
const COR_GRUPO = { 'Metal alcalino': '#ff6b6b', 'Metal alcalinoterroso': '#ffa94d', 'Metal de transição': '#f6c344', 'Metal representativo': '#8ce99a', 'Semimetal': '#63e6be', 'Não metal': '#74c0fc', 'Halogênio': '#b197fc', 'Gás nobre': '#e599f7', 'Lantanídeo': '#ffc9c9', 'Actinídeo': '#ffd8a8' };

/* Condutividade térmica (W/m·K, ~25 °C, CRC). Usada para o calor se espalhar. */
const LAMBDA = { H: 0.18, He: 0.15, Li: 85, Be: 200, B: 27, C: 119, N: 0.026, O: 0.027, F: 0.028, Ne: 0.049, Na: 142, Mg: 156, Al: 237, Si: 149, P: 0.24, S: 0.27, Cl: 0.009, Ar: 0.018, K: 102, Ca: 201, Sc: 16, Ti: 22, V: 31, Cr: 94, Mn: 7.8, Fe: 80, Co: 100, Ni: 91, Cu: 401, Zn: 116, Ga: 41, Ge: 60, As: 50, Se: 0.52, Br: 0.12, Kr: 0.009, Rb: 58, Sr: 35, Y: 17, Zr: 23, Nb: 54, Mo: 139, Tc: 51, Ru: 117, Rh: 150, Pd: 72, Ag: 429, Cd: 97, In: 82, Sn: 67, Sb: 24, Te: 3, I: 0.45, Xe: 0.006, Cs: 36, Ba: 18, La: 13, Ce: 11, Pr: 13, Nd: 17, Pm: 15, Sm: 13, Eu: 14, Gd: 11, Tb: 11, Dy: 11, Ho: 16, Er: 15, Tm: 17, Yb: 39, Lu: 16, Hf: 23, Ta: 57, W: 173, Re: 48, Os: 88, Ir: 147, Pt: 72, Au: 318, Hg: 8.3, Tl: 46, Pb: 35, Bi: 8, Po: 20, Rn: 0.004, Ra: 19, Ac: 12, Th: 54, Pa: 47, U: 27, Np: 6, Pu: 6.7, Am: 10, Cm: 10 };

/* Aparência real (não a cor CPK dos modelos de moléculas): [sólido, líquido, gás] */
const COR_EL = {
  H: [null, '#c8e4ff', '#e6f2ff'], He: [null, '#e8f0ff', '#f3f0ff'], N: ['#f0f4ff', '#d8e8ff', '#eef2ff'], O: ['#a9c9ff', '#8fb8ff', '#eaf4ff'], F: ['#f5f0a0', '#f2ea7a', '#f4f0b8'], Ne: [null, null, '#fff0ea'], Ar: [null, null, '#f0eaff'], Kr: [null, null, '#f2f2ff'], Xe: [null, null, '#eef4ff'], Rn: [null, null, '#fff2f2'],
  Cl: ['#e0e070', '#d8d050', '#c6dd4a'], Br: ['#6b1a10', '#8b2010', '#b5532e'], I: ['#3d2b4f', '#4a2a5a', '#9b4fd1'],
  Li: ['#cfcfcf'], Na: ['#dcdcdc'], K: ['#cfcfcf'], Rb: ['#d8d0c8'], Cs: ['#e6d28c'], Be: ['#9fa6ad'], Mg: ['#c4c8cc'], Ca: ['#d0d0c8'], Sr: ['#d6d0b8'], Ba: ['#bcbcae'],
  Al: ['#c6ccd2'], Ga: ['#c8d0d8', '#c4ccd8'], In: ['#c4c4d0'], Sn: ['#c0c4c8'], Pb: ['#6c6f78'], Tl: ['#9a9aa0'], Bi: ['#c8b4c8'],
  Ti: ['#8e9096'], V: ['#9da3ab'], Cr: ['#b6bcc4'], Mn: ['#a8a29a'], Fe: ['#8a8d92'], Co: ['#9097a3'], Ni: ['#b9b39f'], Cu: ['#c87533'], Zn: ['#a8b0b8'], Ag: ['#d8dbe0'], Au: ['#ffcc33'], Pt: ['#d6d3cc'], Hg: ['#c0c4cc', '#b8bec8'],
  W: ['#8f8f8f'], Os: ['#9db0c8'], Ir: ['#d0d0d0'], Pd: ['#c4c0b8'], Rh: ['#c8c8c8'], Ru: ['#b8b8b8'], Mo: ['#9da0a5'], Zr: ['#b0b0a8'], Nb: ['#9f9fae'], Ta: ['#8b8d99'], Re: ['#b0b0b0'], Hf: ['#a8a8a8'], Cd: ['#b8bcc0'], Sc: ['#c8c8c0'], Y: ['#c8c8c0'],
  U: ['#6b7076'], Pu: ['#77797c'], Th: ['#8a8a88'], Ra: ['#e8e8e0'], Po: ['#9a9a9a'], Ac: ['#c8c8c8'],
  C: ['#2b2b2b'], B: ['#4a3f36'], Si: ['#5a6470'], P: ['#f3f0d8', '#f0ecc8'], S: ['#f2d94a', '#c8601a'], Se: ['#5f5f62'], As: ['#707070'], Sb: ['#b0b4b8'], Te: ['#9aa0a6'], Ge: ['#a0a4a8'],
};
/* Cor da chama (teste de chama) */
const CHAMA = { Li: '#ff1a40', Na: '#ffb000', K: '#c88bff', Rb: '#d44dff', Cs: '#6a5cff', Ca: '#ff6a1a', Sr: '#ff1a1a', Ba: '#a8ff4a', Cu: '#2ee6b8', B: '#46ff46', In: '#4d6aff', Tl: '#4dff4d', Pb: '#b0c4ff', As: '#b0c4ff', Zn: '#e0f0ff', Se: '#4da6ff', Sb: '#c8ffd0', Mo: '#d8ff6a', Fe: '#ffd27a', P: '#c8ffd8', S: '#7a8cff', H: '#9fd0ff', C: '#ffae42', Mg: '#ffffff', Al: '#ffffff' };
/* Cor do brilho quando passa eletricidade (lâmpadas de descarga) */
const DESCARGA = { He: '#ffb0c8', Ne: '#ff5a1a', Ar: '#b06aff', Kr: '#e0d8ff', Xe: '#6aa0ff', Rn: '#ff6060', H: '#ff6ab4', N: '#ff8ac8', O: '#d0d8ff', Hg: '#9fd8ff', Na: '#ffcc33', Cl: '#c8ff8a', Br: '#ffb070', I: '#ff9ad0' };

/* Reatividade e combustão no ar.
   agua: 0 nada, 1 só com água quente, 2 moderada, 3 vigorosa, 4 violenta/explosiva
   ign: temperatura aproximada de ignição no ar (°C); soPo: só queima em pó; comb: o que forma ao queimar */
const REATIVO = {
  H: { ign: 500, comb: 'H2O', gasComb: true, dH: -286 },
  Li: { agua: 2, ign: 179, comb: 'Li2O', dH: -598 }, Na: { agua: 3, ign: 115, comb: 'Na2O2', dH: -511 }, K: { agua: 4, ign: 70, comb: 'KO2', dH: -285 }, Rb: { agua: 4, ign: 25, comb: 'RbO2', dH: -279 }, Cs: { agua: 4, ign: 25, comb: 'CsO2', dH: -286 },
  Ca: { agua: 2, ign: 790, comb: 'CaO', dH: -635 }, Sr: { agua: 2, ign: 720, comb: 'SrO', dH: -592 }, Ba: { agua: 3, ign: 550, comb: 'BaO', dH: -548 }, Eu: { agua: 2 }, Mg: { agua: 1, ign: 473, comb: 'MgO', dH: -601 },
  Al: { ign: 585, soPo: true, comb: 'Al2O3', dH: -838 }, Fe: { ign: 430, soPo: true, comb: 'Fe3O4', dH: -279 }, Zn: { ign: 460, soPo: true, comb: 'ZnO', dH: -350 }, Ti: { ign: 330, soPo: true, comb: 'TiO2', dH: -944 }, Zr: { ign: 190, soPo: true, comb: 'ZrO2', dH: -1100 },
  Ce: { ign: 160, soPo: true, comb: 'CeO2', dH: -1089 }, U: { ign: 150, soPo: true, comb: 'U3O8', dH: -1190 }, Pu: { ign: 150, soPo: true, comb: 'PuO2', dH: -1056 }, B: { ign: 700, soPo: true, comb: 'B2O3', dH: -636 },
  C: { ign: 700, comb: 'CO2', dH: -394 }, S: { ign: 232, comb: 'SO2', dH: -297 }, P: { ign: 32, comb: 'P4O10', dH: -746 },
};
/* Série de reatividade dos metais (do mais ao menos reativo). Quem está acima de H solta hidrogênio em ácido
   e desloca da solução os metais que estão abaixo. carga = íon que forma ao reagir. */
const SERIE = ['Cs', 'Rb', 'K', 'Ba', 'Sr', 'Ca', 'Na', 'Li', 'Mg', 'Al', 'Mn', 'Zn', 'Cr', 'Fe', 'Cd', 'Co', 'Ni', 'Sn', 'Pb', 'H', 'Cu', 'Hg', 'Ag', 'Pt', 'Au'];
const CARGA_METAL = { Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, Mn: 2, Zn: 2, Cr: 3, Fe: 2, Cd: 2, Co: 2, Ni: 2, Sn: 2, Pb: 2, Cu: 2, Hg: 2, Ag: 1, Au: 3, Pt: 4 };
/* Ferromagnetismo: temperatura de Curie (°C); acima dela o ímã não atrai mais */
const CURIE = { Fe: 770, Co: 1115, Ni: 358, Gd: 20, Dy: -185 };
/* Metais quebradiços (o martelo esfarela) */
const QUEBRADICO = ['Sb', 'Bi', 'Mn', 'Ge', 'Si', 'Cr', 'B', 'As', 'Te', 'Se', 'C', 'S', 'P', 'I', 'Ga', 'U', 'Pu', 'W', 'Os', 'Ir', 'Ru', 'Be'];
/* Elementos que conduzem eletricidade além dos metais */
const CONDUTOR_EXTRA = ['C', 'Si', 'Ge', 'As', 'Sb', 'Te', 'B'];
/* Radioatividade: meia-vida do isótopo mais estável e nível de perigo radiológico (1 a 4) */
const RADIO = {
  Tc: ['4,2 milhões de anos (Tc-97)', 2], Pm: ['17,7 anos (Pm-145)', 3], Po: ['125 anos (Po-209); o Po-210 tem 138 dias', 4], At: ['8,1 horas (At-210)', 4], Rn: ['3,8 dias (Rn-222)', 3], Fr: ['22 minutos (Fr-223)', 4], Ra: ['1600 anos (Ra-226)', 4], Ac: ['21,8 anos (Ac-227)', 4],
  Th: ['14 bilhões de anos (Th-232)', 2], Pa: ['32 760 anos (Pa-231)', 4], U: ['4,5 bilhões de anos (U-238)', 2], Np: ['2,1 milhões de anos (Np-237)', 3], Pu: ['80 milhões de anos (Pu-244); o Pu-239 tem 24 100 anos', 4],
  Am: ['7370 anos (Am-243)', 4], Cm: ['15,6 milhões de anos (Cm-247)', 4], Bk: ['1380 anos (Bk-247)', 4], Cf: ['898 anos (Cf-251)', 4], Es: ['1,3 ano (Es-252)', 4],
};
/* Elementos que não existem em quantidade visível (só alguns átomos, ou se desintegram rápido demais): só a ficha, sem colocar na caixa */
const SEM_AMOSTRA = [85, 87];

/* Papel no corpo humano, usos e curiosidades (resumos de NIH ODS, ATSDR e RSC) */
const INFO = {
  H: { corpo: 'Faz parte da água e de todas as moléculas orgânicas: cerca de 10% da massa do corpo.', uso: 'Combustível de foguetes, células de combustível, produção de amônia.', curio: 'É o elemento mais abundante do Universo: cerca de 3/4 da massa de toda a matéria comum.' },
  He: { corpo: 'Não participa de nada no corpo. Respirar hélio puro tira o oxigênio e pode fazer desmaiar.', uso: 'Balões, resfriamento de ímãs de ressonância magnética, mergulho profundo.', curio: 'Foi descoberto primeiro no Sol (1868), olhando a luz de um eclipse, antes de ser achado na Terra.' },
  Li: { corpo: 'Não é essencial. Sais de lítio são remédio para transtorno bipolar, com dose segura muito estreita.', uso: 'Baterias de celular e de carro elétrico, remédios, graxas.', curio: 'É o metal mais leve: flutua até em óleo.' },
  Be: { corpo: 'Tóxico. Respirar poeira de berílio causa beriliose, uma doença crônica dos pulmões, e é cancerígeno.', uso: 'Janelas de raios X, peças de satélites e ligas de cobre que não soltam faísca.', curio: 'É mais leve que o alumínio e mais rígido que o aço.' },
  B: { corpo: 'Elemento traço; o ácido bórico em excesso é tóxico. Limite superior (NIH): 20 mg/dia.', uso: 'Vidro de laboratório (borossilicato), fibras de vidro, detergentes.', curio: 'Na chama, compostos de boro dão uma cor verde intensa.' },
  C: { corpo: 'Base de toda a vida: cerca de 18% da massa do corpo. Grafite e diamante puros passam sem ser absorvidos.', uso: 'Grafite (lápis, baterias), diamante (corte), aço, carvão ativado.', curio: 'Grafite (macio, Mohs 1–2) e diamante (o mais duro, Mohs 10) são o mesmo elemento, só arrumado de outro jeito.' },
  N: { corpo: 'Está nas proteínas e no DNA. Respiramos 78% de N₂, que não faz nada no corpo; puro, sufoca por falta de oxigênio.', uso: 'Nitrogênio líquido (-196 °C) para congelar, fertilizantes, embalagens de salgadinho.', curio: 'Beber nitrogênio líquido já perfurou estômagos: ele vira gás e se expande cerca de 700 vezes.' },
  O: { corpo: 'Essencial: as células usam para tirar energia da comida. Cerca de 65% da massa do corpo (quase tudo na água).', uso: 'Hospitais, soldagem, foguetes, siderurgia.', curio: 'Oxigênio líquido é azul-claro e é atraído por ímãs.' },
  F: { corpo: 'O fluoreto em pouca quantidade protege os dentes; em excesso é tóxico. O gás F₂ é corrosivo demais.', uso: 'Pasta de dente (fluoreto), teflon, enriquecimento de urânio.', curio: 'É o elemento mais reativo: reage com quase tudo, até com vidro e com o gás nobre xenônio.' },
  Ne: { corpo: 'Não participa de nada no corpo.', uso: 'Letreiros luminosos vermelho-alaranjados, lasers.', curio: 'Só o neônio dá o vermelho-alaranjado: letreiros de outras cores usam outros gases ou tinta no vidro.' },
  Na: { corpo: 'Essencial: controla a água do corpo e os sinais dos nervos. Recomendação: menos de 2300 mg/dia (NIH).', uso: 'Sal de cozinha (NaCl), lâmpadas de rua amarelas, refrigerante de reatores.', curio: 'Metal tão mole que se corta com faca; em contato com a água solta hidrogênio e pode pegar fogo.' },
  Mg: { corpo: 'Essencial: participa de mais de 300 reações do corpo. Em excesso (suplemento) causa diarreia.', uso: 'Ligas leves (rodas, notebooks), fogos de artifício, sinalizadores.', curio: 'Queima com luz branca tão forte que machuca os olhos, e continua queimando até em CO₂.' },
  Al: { corpo: 'Não é essencial; quase não é absorvido pelo intestino.', uso: 'Latas, aviões, panelas, cabos elétricos.', curio: 'Já foi mais caro que o ouro: Napoleão III servia seus convidados mais importantes em pratos de alumínio.' },
  Si: { corpo: 'Elemento traço; a sílica comida passa quase toda sem ser absorvida. Respirar pó de sílica causa silicose.', uso: 'Chips de computador, painéis solares, vidro, concreto.', curio: 'É o segundo elemento mais comum da crosta terrestre, atrás só do oxigênio.' },
  P: { corpo: 'Essencial nos ossos, nos dentes, no DNA e no ATP. O fósforo branco puro é muito tóxico.', uso: 'Fertilizantes, palitos de fósforo (fósforo vermelho), detergentes.', curio: 'O fósforo branco brilha no escuro e pega fogo sozinho no ar a partir de uns 30 °C.' },
  S: { corpo: 'Essencial nas proteínas (aminoácidos metionina e cisteína). Enxofre puro tem baixa toxicidade.', uso: 'Ácido sulfúrico, borracha vulcanizada, pólvora, fungicidas.', curio: 'Derrete em líquido amarelo e, mais quente, fica vermelho-escuro e grosso como mel.' },
  Cl: { corpo: 'O íon cloreto é essencial (suco gástrico). O gás Cl₂ é muito tóxico: destrói os pulmões.', uso: 'Tratamento de água, PVC, alvejantes.', curio: 'Foi usado como arma química na Primeira Guerra Mundial.' },
  Ar: { corpo: 'Não participa de nada no corpo. É 0,93% do ar que respiramos.', uso: 'Lâmpadas, soldagem, janelas com isolamento.', curio: 'É o gás nobre mais comum da atmosfera; o nome vem do grego "preguiçoso".' },
  K: { corpo: 'Essencial: coração, músculos e nervos. Em excesso no sangue pode parar o coração.', uso: 'Fertilizantes, sabão, substituto de sal.', curio: 'Reage com a água tão rápido que o hidrogênio liberado pega fogo com chama lilás.' },
  Ca: { corpo: 'Essencial: ossos, dentes, contração muscular. Limite superior (NIH): 2500 mg/dia para adultos.', uso: 'Cimento, cal, gesso, giz.', curio: 'É o metal mais abundante do corpo humano: cerca de 1 kg num adulto.' },
  Ti: { corpo: 'Não é essencial e é muito bem tolerado: usado em próteses e implantes dentários.', uso: 'Aviões, implantes, tinta branca (TiO₂), bicicletas.', curio: 'Tão forte quanto o aço e cerca de 45% mais leve.' },
  Cr: { corpo: 'O crômio(III) é nutriente traço; o crômio(VI) dos processos industriais é cancerígeno.', uso: 'Cromagem, aço inoxidável.', curio: 'É o metal mais duro da tabela (Mohs 8,5).' },
  Mn: { corpo: 'Essencial em pouca quantidade. Limite superior (NIH): 11 mg/dia; respirar a poeira afeta o cérebro.', uso: 'Aço, pilhas alcalinas, ligas de alumínio.', curio: 'Os nódulos de manganês cobrem partes enormes do fundo do mar.' },
  Fe: { corpo: 'Essencial: está na hemoglobina, que leva o oxigênio. Excesso de ferro é uma das intoxicações mais comuns em crianças.', uso: 'Aço, construção, ímãs, carros.', curio: 'O núcleo da Terra é feito principalmente de ferro e níquel.' },
  Co: { corpo: 'Está na vitamina B12. Em excesso, o cobalto afeta o coração e a tireoide.', uso: 'Baterias, ímãs, tinta azul, turbinas.', curio: 'O nome vem de "kobold", um duende das minas alemãs.' },
  Ni: { corpo: 'É uma das causas mais comuns de alergia de contato (bijuterias). Os sais de níquel são tóxicos.', uso: 'Aço inoxidável, moedas, baterias.', curio: 'É atraído por ímãs, como o ferro e o cobalto.' },
  Cu: { corpo: 'Essencial em pouca quantidade. Limite superior (NIH): 10 mg/dia; o excesso de sais de cobre causa vômito.', uso: 'Fios elétricos, canos, moedas, bronze, latão.', curio: 'A Estátua da Liberdade é de cobre; o verde é a pátina que se formou com o tempo.' },
  Zn: { corpo: 'Essencial para a imunidade e a cicatrização. Limite superior (NIH): 40 mg/dia.', uso: 'Galvanização (proteger o aço), latão, pilhas, pomadas.', curio: 'Cobrir o ferro com zinco protege porque o zinco enferruja no lugar dele.' },
  Ga: { corpo: 'Não é essencial; baixa toxicidade.', uso: 'LEDs, chips de celular, painéis solares.', curio: 'Derrete a 29,8 °C: derrete na mão. Também deixa o alumínio esfarelento.' },
  Ge: { corpo: 'Não é essencial; suplementos de germânio já causaram dano nos rins.', uso: 'Fibra ótica, lentes infravermelhas, eletrônica.', curio: 'Mendeleev previu suas propriedades 15 anos antes de ele ser descoberto ("eka-silício").' },
  As: { corpo: 'Muito tóxico; contamina água de poços em algumas regiões. Causa câncer e lesões de pele a longo prazo.', uso: 'Semicondutores, preservante de madeira (antigo).', curio: 'Foi chamado de "pó da herança" por ser um veneno famoso na história.' },
  Se: { corpo: 'Essencial em pouca quantidade (antioxidante). Limite superior (NIH): 400 µg/dia; o excesso causa queda de cabelo e unhas.', uso: 'Vidro, eletrônica, suplementos.', curio: 'A castanha-do-pará é tão rica em selênio que poucas por dia já passam da recomendação.' },
  Br: { corpo: 'O brometo em excesso causa "bromismo" (sonolência, confusão). O bromo líquido corrói a pele.', uso: 'Retardantes de chama, tratamento de piscinas.', curio: 'É um dos dois únicos elementos líquidos em temperatura ambiente (o outro é o mercúrio).' },
  Kr: { corpo: 'Não participa de nada no corpo.', uso: 'Lâmpadas, flashes de fotografia.', curio: 'A kryptonita do Super-Homem não tem nada a ver com o criptônio de verdade.' },
  Sr: { corpo: 'O estrôncio estável tem baixa toxicidade; o radioativo (Sr-90) vai para os ossos.', uso: 'Fogos de artifício vermelhos, sinalizadores.', curio: 'É o estrôncio que dá o vermelho dos fogos de artifício.' },
  Zr: { corpo: 'Não é essencial; muito bem tolerado.', uso: 'Revestimento de combustível nuclear, cerâmicas, próteses.', curio: 'A zircônia (ZrO₂) é usada como diamante falso.' },
  Mo: { corpo: 'Essencial em quantidade mínima (enzimas). Limite superior (NIH): 2 mg/dia.', uso: 'Aços de alta resistência, lubrificantes.', curio: 'Derrete a 2623 °C.' },
  Ag: { corpo: 'Não é essencial. Tomar prata por muito tempo deixa a pele azul-acinzentada para sempre (argiria).', uso: 'Joias, espelhos, eletrônica, fotografia.', curio: 'É o melhor condutor de eletricidade e de calor de todos os elementos.' },
  Cd: { corpo: 'Muito tóxico: acumula nos rins e enfraquece os ossos (doença "itai-itai" no Japão).', uso: 'Baterias Ni-Cd (sendo abandonadas), pigmentos.', curio: 'O cigarro é uma das maiores fontes de cádmio para quem fuma.' },
  Sn: { corpo: 'O estanho metálico tem baixa toxicidade.', uso: 'Solda, folha de flandres (latas), bronze.', curio: 'Abaixo de 13 °C ele pode virar pó cinza ("peste do estanho").' },
  Sb: { corpo: 'Tóxico; provoca vômito. Algumas taças antigas de antimônio eram usadas como vomitório.', uso: 'Retardantes de chama, baterias de chumbo.', curio: 'Os egípcios antigos usavam o sulfeto de antimônio como maquiagem para os olhos.' },
  I: { corpo: 'Essencial para a tireoide. Limite superior (NIH): 1100 µg/dia. O iodo puro em grande quantidade é corrosivo.', uso: 'Sal iodado, antisséptico, contraste de raio X.', curio: 'Aquecido, passa direto de sólido para um vapor violeta (sublimação aparente).' },
  Xe: { corpo: 'Em concentração alta funciona como anestésico.', uso: 'Faróis de carro, flashes, propulsão de satélites.', curio: 'Mesmo sendo gás nobre, forma compostos com o flúor (XeF₂, XeF₄).' },
  Cs: { corpo: 'O césio estável tem baixa toxicidade; o radioativo Cs-137 causou o acidente de Goiânia (1987).', uso: 'Relógios atômicos (definem o segundo).', curio: 'Derrete a 28,5 °C e explode em contato com a água.' },
  Ba: { corpo: 'Os sais solúveis de bário são muito tóxicos (baixam o potássio do sangue). O sulfato de bário, insolúvel, é seguro e usado como contraste.', uso: 'Contraste de raio X (BaSO₄), fogos verdes, lama de perfuração.', curio: 'É o bário que dá o verde dos fogos de artifício.' },
  W: { corpo: 'Baixa toxicidade.', uso: 'Filamentos de lâmpada, ferramentas de corte, contrapesos.', curio: 'Tem o maior ponto de fusão dos metais: 3422 °C.' },
  Os: { corpo: 'O metal é inerte, mas o tetróxido de ósmio que se forma ao aquecer no ar é muito tóxico.', uso: 'Pontas de caneta, contatos elétricos.', curio: 'É o elemento mais denso: 22,6 g/cm³.' },
  Pt: { corpo: 'O metal é inerte; alguns compostos de platina são remédios contra o câncer (cisplatina).', uso: 'Catalisadores de carro, joias, eletrodos.', curio: 'O metro e o quilograma padrão antigos eram de platina com irídio.' },
  Au: { corpo: 'O ouro metálico é inerte: passa pelo corpo sem ser absorvido (é até corante de comida, E175).', uso: 'Joias, eletrônica, reservas de bancos, odontologia.', curio: 'Um grama de ouro pode virar um fio de mais de 2 km.' },
  Hg: { corpo: 'O mercúrio líquido engolido quase não é absorvido (~0,01%), mas o VAPOR é muito tóxico para o cérebro e os rins.', uso: 'Termômetros antigos, lâmpadas fluorescentes, garimpo (proibido em muitos lugares).', curio: 'É o único metal líquido em temperatura ambiente.' },
  Tl: { corpo: 'Muito tóxico: causa queda de cabelo, dor nos nervos e problemas no coração. Já foi veneno de rato.', uso: 'Eletrônica, vidros especiais (uso muito restrito).', curio: 'Seu nome vem do grego "thallos", broto verde, pela cor da chama.' },
  Pb: { corpo: 'Tóxico e acumulativo: afeta o cérebro, principalmente de crianças. Não existe nível seguro conhecido de chumbo no sangue (CDC).', uso: 'Baterias de carro, proteção contra radiação.', curio: 'Os romanos usavam chumbo em canos ("plumbum" deu "plumbing" em inglês).' },
  Bi: { corpo: 'Baixa toxicidade: está em remédios para o estômago.', uso: 'Remédios, ligas de baixa fusão, cosméticos.', curio: 'Seus cristais formam "escadinhas" com cores de arco-íris.' },
  Po: { corpo: 'Extremamente radiotóxico: uma quantidade invisível já é mortal se engolida.', uso: 'Eliminadores de estática (raríssimo).', curio: 'Foi descoberto por Marie e Pierre Curie e batizado em homenagem à Polônia.' },
  Rn: { corpo: 'Gás radioativo que se acumula em porões; é a segunda maior causa de câncer de pulmão (depois do cigarro).', uso: 'Antigamente, radioterapia.', curio: 'Vem do decaimento natural do urânio no solo.' },
  Ra: { corpo: 'Radioativo e "imita" o cálcio: vai para os ossos. As "radium girls" adoeceram pintando relógios.', uso: 'Antigamente, tinta que brilhava no escuro.', curio: 'Brilha fraquinho no escuro por causa da própria radiação.' },
  Th: { corpo: 'Radioativo fraco; acumula nos ossos e no fígado.', uso: 'Camisas de lampião (antigo), possível combustível nuclear.', curio: 'Tem quase o triplo da abundância do urânio na crosta.' },
  U: { corpo: 'Tóxico para os rins (como metal pesado) e radioativo.', uso: 'Combustível de usinas nucleares.', curio: 'O U-238 tem meia-vida de 4,5 bilhões de anos: quase a idade da Terra.' },
  Pu: { corpo: 'Extremamente radiotóxico se inalado ou engolido; acumula nos ossos e no fígado.', uso: 'Combustível nuclear, baterias de sondas espaciais (Pu-238).', curio: 'As sondas Voyager funcionam até hoje com o calor do plutônio.' },
  Gd: { corpo: 'Os compostos de gadolínio são usados como contraste de ressonância magnética.', uso: 'Contraste de ressonância, ímãs.', curio: 'É magnético só abaixo de ~20 °C: um dia frio decide se o ímã o atrai.' },
  Nd: { corpo: 'Baixa toxicidade.', uso: 'Os ímãs mais fortes que existem (neodímio-ferro-boro).', curio: 'Fones de ouvido e motores de carro elétrico usam ímãs de neodímio.' },
};

/* =========================================================================
   COMPOSTOS com dados medidos (CRC / PubChem). Chave = fórmula.
   pf/pe em °C (null = não se aplica), d em g/cm³, M em g/mol (calculado se faltar).
   decomp: [temperatura, produto1, produto2] quando se decompõe ao aquecer
   ========================================================================= */
const COMPOSTOS = {
  'H2O': { nome: 'Água destilada', pf: 0, pe: 100, d: 0.997, dS: 0.917, cor: ['#cfe8ff', '#2f6fd0', '#e6eef8'], cp: 4.18, lam: 0.6, ph: 7, liquidoNome: 'Água destilada', solidoNome: 'Gelo', gasNome: 'Vapor d’água', fonte: 'CRC', uso: 'Solvente de laboratório: sem sais nem cloro, não interfere nas reações.', curio: 'Água pura quase não conduz eletricidade: quem conduz são os íons dissolvidos. Por isso a água da torneira conduz um pouco e a destilada não.' },
  'CO2': { nome: 'Dióxido de carbono', pf: -78.5, pe: -78.5, sublima: true, d: 1.56, cor: ['#f4f8ff', null, '#f0f0f0'], tox: 'CO2', solidoNome: 'Gelo seco', uso: 'Refrigerantes, extintores, gelo seco.' },
  'CO': { nome: 'Monóxido de carbono', pf: -205, pe: -191.5, d: 0.79, cor: [null, null, '#f0f0f0'], tox: 'CO', inflam: { ign: 609, prod: 'CO2', dH: -283 } },
  'SO2': { nome: 'Dióxido de enxofre', pf: -72, pe: -10, d: 1.46, cor: [null, '#f0f0e8', '#f2f0e6'], tox: 'SO2', agua: 'H2SO3' },
  'SO3': { nome: 'Trióxido de enxofre', pf: 16.9, pe: 45, d: 1.92, cor: ['#ffffff', '#f8f8f0', '#f6f6ee'], tox: 'SO3', agua: 'H2SO4' },
  'NO2': { nome: 'Dióxido de nitrogênio', pf: -11.2, pe: 21.2, d: 1.44, cor: ['#e8e0b0', '#a04a1a', '#b5501e'], tox: 'NO2', agua: 'HNO3' },
  'NO': { nome: 'Monóxido de nitrogênio', pf: -164, pe: -152, d: 1.27, cor: [null, null, '#f0f0f0'], tox: 'NO2' },
  'NH3': { nome: 'Amônia', pf: -77.7, pe: -33.3, d: 0.68, cor: [null, '#f4f4f8', '#f0f4f0'], tox: 'NH3', agua: 'aq:NH4:OH', uso: 'Fertilizantes, produtos de limpeza.' },
  'HCl': { nome: 'Cloreto de hidrogênio', pf: -114.2, pe: -85.1, d: 1.19, cor: [null, null, '#f2f4ee'], tox: 'HCl', agua: 'aq:H:Cl' },
  'HF': { nome: 'Fluoreto de hidrogênio', pf: -83.6, pe: 19.5, d: 0.99, cor: [null, '#f0f0f0', '#f2f2f2'], tox: 'HF', agua: 'aq:H:F' },
  'HBr': { nome: 'Brometo de hidrogênio', pf: -86.9, pe: -66.8, d: 2.17, cor: [null, null, '#f2f0ee'], tox: 'HCl', agua: 'aq:H:Br' },
  'HI': { nome: 'Iodeto de hidrogênio', pf: -50.8, pe: -35.4, d: 2.85, cor: [null, null, '#f2eef2'], tox: 'HCl', agua: 'aq:H:I' },
  'CH4': { nome: 'Metano (gás natural)', pf: -182.5, pe: -161.5, d: 0.42, cor: [null, '#eef0f6', '#f0f2f6'], tox: 'asfixiante', inflam: { ign: 537, prod: 'CO2', prod2: 'H2O', dH: -890, gasComb: true } },
  'Etanol': { formula: 'C2H5OH', nome: 'Etanol (álcool)', pf: -114.1, pe: 78.4, d: 0.789, cor: ['#f0f0ff', '#e8eef8', '#f4f4f8'], cp: 2.44, lam: 0.17, tox: 'Etanol', inflam: { ign: 365, prod: 'CO2', prod2: 'H2O', dH: -1367 }, uso: 'Combustível, bebidas, desinfetante (70%).' },
  'Sacarose': { formula: 'C12H22O11', nome: 'Açúcar (sacarose)', pf: 186, pe: null, d: 1.59, cor: ['#fbfbf6'], po: true, decomp: [186, 'Caramelo', 'H2O'], tox: 'Sacarose', soluvel: 'aq:Sacarose' },
  'Caramelo': { formula: 'C', nome: 'Caramelo queimado (carbono)', pf: 3550, pe: null, d: 1.5, cor: ['#3a1e0a'], po: true, tox: 'C' },
  'NaCl': { nome: 'Cloreto de sódio (sal de cozinha)', pf: 801, pe: 1465, d: 2.165, mohs: 2.5, cor: ['#f6f6f6', '#fff6e8'], po: true },
  'KCl': { nome: 'Cloreto de potássio', pf: 770, pe: 1420, d: 1.98, mohs: 2, cor: ['#f4f4f8'], po: true },
  'LiCl': { nome: 'Cloreto de lítio', pf: 605, pe: 1382, d: 2.07, cor: ['#f4f4f4'], po: true },
  'CaCl2': { nome: 'Cloreto de cálcio', pf: 772, pe: 1935, d: 2.15, cor: ['#f6f6f2'], po: true, dissolveCalor: 81 },
  'MgCl2': { nome: 'Cloreto de magnésio', pf: 714, pe: 1412, d: 2.32, cor: ['#f6f6f6'], po: true },
  'AlCl3': { nome: 'Cloreto de alumínio', pf: 192.6, pe: 192.6, sublima: true, d: 2.48, cor: ['#f4f2e8'], po: true },
  'FeCl3': { nome: 'Cloreto de ferro(III)', pf: 306, pe: 315, d: 2.9, cor: ['#3a2a1a'], po: true },
  'FeCl2': { nome: 'Cloreto de ferro(II)', pf: 677, pe: 1023, d: 3.16, cor: ['#e8f0d8'], po: true },
  'CuCl2': { nome: 'Cloreto de cobre(II)', pf: 498, pe: 993, d: 3.39, cor: ['#7a5a2a'], po: true },
  'ZnCl2': { nome: 'Cloreto de zinco', pf: 290, pe: 732, d: 2.91, cor: ['#f6f6f6'], po: true },
  'AgCl': { nome: 'Cloreto de prata', pf: 455, pe: 1547, d: 5.56, mohs: 1.5, cor: ['#f4f4f0'], po: true, curio: 'Escurece na luz: era a base da fotografia em filme.' },
  'PbCl2': { nome: 'Cloreto de chumbo(II)', pf: 501, pe: 950, d: 5.85, cor: ['#f6f6f6'], po: true },
  'BaCl2': { nome: 'Cloreto de bário', pf: 962, pe: 1560, d: 3.86, cor: ['#f6f6f6'], po: true },
  'NaF': { nome: 'Fluoreto de sódio', pf: 993, pe: 1704, d: 2.56, cor: ['#f6f6f6'], po: true },
  'CaF2': { nome: 'Fluoreto de cálcio (fluorita)', pf: 1418, pe: 2533, d: 3.18, mohs: 4, cor: ['#c8a8e8'], po: true, curio: 'É o mineral 4 da escala de Mohs e deu nome à "fluorescência".' },
  'KBr': { nome: 'Brometo de potássio', pf: 734, pe: 1435, d: 2.74, cor: ['#f6f6f6'], po: true },
  'NaBr': { nome: 'Brometo de sódio', pf: 747, pe: 1390, d: 3.21, cor: ['#f6f6f6'], po: true },
  'KI': { nome: 'Iodeto de potássio', pf: 681, pe: 1330, d: 3.12, cor: ['#f6f6f6'], po: true, uso: 'Protege a tireoide em acidentes nucleares.' },
  'NaI': { nome: 'Iodeto de sódio', pf: 661, pe: 1304, d: 3.67, cor: ['#f6f6f6'], po: true },
  'AgBr': { nome: 'Brometo de prata', pf: 432, pe: 1502, d: 6.47, cor: ['#f2eac8'], po: true },
  'AgI': { nome: 'Iodeto de prata', pf: 558, pe: 1506, d: 5.68, cor: ['#f5e663'], po: true, uso: 'Usado para "semear" nuvens e provocar chuva.' },
  'PbI2': { nome: 'Iodeto de chumbo(II)', pf: 402, pe: 872, d: 6.16, cor: ['#ffd700'], po: true, curio: 'Forma a "chuva dourada": cristais amarelos brilhantes que caem na solução.' },
  'HgI2': { nome: 'Iodeto de mercúrio(II)', pf: 259, pe: 350, d: 6.36, cor: ['#e8331a'], po: true },
  'HgCl2': { nome: 'Cloreto de mercúrio(II)', pf: 277, pe: 304, d: 5.43, cor: ['#f6f6f6'], po: true },
  'HgS': { nome: 'Sulfeto de mercúrio(II) (cinábrio)', pf: 580, pe: 580, sublima: true, d: 8.1, mohs: 2.5, cor: ['#c8281a'], po: true },
  'FeS': { nome: 'Sulfeto de ferro(II)', pf: 1194, pe: null, d: 4.84, mohs: 4, cor: ['#3a3a30'], po: true },
  'ZnS': { nome: 'Sulfeto de zinco', pf: 1850, pe: 1850, sublima: true, d: 4.09, mohs: 3.75, cor: ['#f4f4ee'], po: true, curio: 'Brilha no escuro quando dopado com cobre: era usado em ponteiros de relógio.' },
  'Cu2S': { nome: 'Sulfeto de cobre(I)', pf: 1130, pe: null, d: 5.6, mohs: 2.75, cor: ['#2a2a30'], po: true },
  'Ag2S': { nome: 'Sulfeto de prata (o "escurecido" da prata)', pf: 825, pe: null, d: 7.23, mohs: 2.25, cor: ['#1e1e22'], po: true },
  'PbS': { nome: 'Sulfeto de chumbo (galena)', pf: 1118, pe: null, d: 7.6, mohs: 2.5, cor: ['#4a4c56'], po: true },
  'NaOH': { nome: 'Hidróxido de sódio (soda cáustica)', pf: 318, pe: 1388, d: 2.13, cor: ['#f8f8f8', '#f4f4ee'], po: true, soluvel: 'aq:Na:OH', dissolveCalor: 44.5 },
  'KOH': { nome: 'Hidróxido de potássio', pf: 360, pe: 1327, d: 2.12, cor: ['#f8f8f8', '#f4f4ee'], po: true, soluvel: 'aq:K:OH', dissolveCalor: 57.6 },
  'LiOH': { nome: 'Hidróxido de lítio', pf: 462, pe: 924, d: 1.46, cor: ['#f8f8f8'], po: true, soluvel: 'aq:Li:OH' },
  'Ca(OH)2': { nome: 'Hidróxido de cálcio (cal hidratada)', pf: null, pe: null, d: 2.21, cor: ['#f8f8f4'], po: true, decomp: [580, 'CaO', 'H2O'], soluvel: 'aq:Ca:OH' },
  'Mg(OH)2': { nome: 'Hidróxido de magnésio (leite de magnésia)', pf: null, pe: null, d: 2.34, cor: ['#f8f8f8'], po: true, decomp: [350, 'MgO', 'H2O'] },
  'Ba(OH)2': { nome: 'Hidróxido de bário', pf: 407, pe: 780, d: 3.74, cor: ['#f8f8f8'], po: true, soluvel: 'aq:Ba:OH' },
  'Cu(OH)2': { nome: 'Hidróxido de cobre(II)', pf: null, pe: null, d: 3.37, cor: ['#3b7bd9'], po: true, decomp: [80, 'CuO', 'H2O'] },
  'Fe(OH)3': { nome: 'Hidróxido de ferro(III)', pf: null, pe: null, d: 3.4, cor: ['#a0522d'], po: true, decomp: [500, 'Fe2O3', 'H2O'] },
  'Fe(OH)2': { nome: 'Hidróxido de ferro(II)', pf: null, pe: null, d: 3.4, cor: ['#6b8f5a'], po: true },
  'Al(OH)3': { nome: 'Hidróxido de alumínio', pf: null, pe: null, d: 2.42, cor: ['#f6f6f6'], po: true, decomp: [300, 'Al2O3', 'H2O'] },
  'MgO': { nome: 'Óxido de magnésio', pf: 2852, pe: 3600, d: 3.58, mohs: 5.5, cor: ['#f8f8f8'], po: true, agua: 'Mg(OH)2', aguaLenta: true },
  'CaO': { nome: 'Óxido de cálcio (cal virgem)', pf: 2613, pe: 2850, d: 3.34, mohs: 3.5, cor: ['#f4f4ee'], po: true, agua: 'aq:Ca:OH', aguaCalor: 65, curio: 'Com água esquenta tanto que pode ferver: é a "cal virgem" da construção.' },
  'Al2O3': { nome: 'Óxido de alumínio (alumina, coríndon)', pf: 2072, pe: 2977, d: 3.95, mohs: 9, cor: ['#f4f4f4'], po: true, curio: 'Rubi e safira são óxido de alumínio com traços de outros metais.' },
  'Fe2O3': { nome: 'Óxido de ferro(III) (ferrugem)', pf: 1565, pe: null, d: 5.24, mohs: 6, cor: ['#8a3a1a'], po: true },
  'Fe3O4': { nome: 'Óxido de ferro (magnetita)', pf: 1597, pe: null, d: 5.17, mohs: 6, cor: ['#2a2a2a'], po: true, curie: 585, curio: 'É o ímã natural mais antigo conhecido.' },
  'CuO': { nome: 'Óxido de cobre(II)', pf: 1326, pe: null, d: 6.31, mohs: 3.5, cor: ['#1e1e1e'], po: true },
  'Cu2O': { nome: 'Óxido de cobre(I)', pf: 1232, pe: 1800, d: 6.0, mohs: 3.75, cor: ['#a01e14'], po: true },
  'ZnO': { nome: 'Óxido de zinco', pf: 1975, pe: null, d: 5.61, mohs: 4.5, cor: ['#f8f8f6'], po: true, uso: 'Protetor solar, pomada para assaduras.' },
  'TiO2': { nome: 'Dióxido de titânio', pf: 1843, pe: 2972, d: 4.23, mohs: 6, cor: ['#ffffff'], po: true, uso: 'O branco das tintas e do papel.' },
  'SiO2': { nome: 'Dióxido de silício (areia, quartzo)', pf: 1713, pe: 2950, d: 2.65, mohs: 7, cor: ['#e8d8a8', '#ffd080'], po: true, lam: 1.4 },
  'Na2O': { nome: 'Óxido de sódio', pf: 1132, pe: 1950, d: 2.27, cor: ['#f6f6f6'], po: true, agua: 'aq:Na:OH', aguaCalor: 40 },
  'Na2O2': { nome: 'Peróxido de sódio', pf: 675, pe: null, d: 2.8, cor: ['#f6f0d0'], po: true, agua: 'aq:Na:OH', aguaGas: 'O2', aguaCalor: 40 },
  'Li2O': { nome: 'Óxido de lítio', pf: 1438, pe: 2600, d: 2.01, cor: ['#f6f6f6'], po: true, agua: 'aq:Li:OH', aguaCalor: 30 },
  'KO2': { nome: 'Superóxido de potássio', pf: 560, pe: null, d: 2.16, cor: ['#f2d060'], po: true, agua: 'aq:K:OH', aguaGas: 'O2', aguaCalor: 40, uso: 'Gera oxigênio em máscaras de resgate e em submarinos.' },
  'RbO2': { nome: 'Superóxido de rubídio', pf: 432, pe: null, d: 3.8, cor: ['#e8a040'], po: true, agua: 'aq:Rb:OH', aguaGas: 'O2', aguaCalor: 40 },
  'CsO2': { nome: 'Superóxido de césio', pf: 432, pe: null, d: 3.77, cor: ['#f0c040'], po: true, agua: 'aq:Cs:OH', aguaGas: 'O2', aguaCalor: 40 },
  'BaO': { nome: 'Óxido de bário', pf: 1923, pe: 2000, d: 5.72, cor: ['#f4f4f0'], po: true, agua: 'aq:Ba:OH', aguaCalor: 50 },
  'SrO': { nome: 'Óxido de estrôncio', pf: 2531, pe: 3200, d: 4.7, cor: ['#f4f4f0'], po: true, agua: 'aq:Sr:OH', aguaCalor: 50 },
  'ZrO2': { nome: 'Dióxido de zircônio (zircônia)', pf: 2715, pe: 4300, d: 5.68, mohs: 8, cor: ['#f6f6f6'], po: true },
  'CeO2': { nome: 'Dióxido de cério', pf: 2400, pe: 3500, d: 7.22, cor: ['#f2eccc'], po: true },
  'U3O8': { nome: 'Óxido de urânio (U₃O₈)', pf: 1150, pe: null, d: 8.38, cor: ['#3e4632'], po: true },
  'PuO2': { nome: 'Dióxido de plutônio', pf: 2744, pe: null, d: 11.5, cor: ['#8a6a2a'], po: true },
  'B2O3': { nome: 'Óxido de boro', pf: 450, pe: 1860, d: 2.46, cor: ['#f4f8f4', '#eef4ee'], po: true, agua: 'aq:H:BO3', aguaLenta: true },
  'P4O10': { nome: 'Pentóxido de fósforo', pf: 360, pe: 360, sublima: true, d: 2.39, cor: ['#ffffff', null, '#f4f4f4'], po: true, agua: 'aq:H:PO4', aguaCalor: 80, tox: 'corrosivo', curio: 'Puxa água com tanta força que é usado para secar outros gases.' },
  'PbO': { nome: 'Óxido de chumbo(II)', pf: 888, pe: 1477, d: 9.53, mohs: 2, cor: ['#e8c040'], po: true },
  'HgO': { nome: 'Óxido de mercúrio(II)', pf: null, pe: null, d: 11.14, cor: ['#e05a1a'], po: true, decomp: [500, 'Hg', 'O2'], curio: 'Aquecendo HgO, Priestley isolou o oxigênio em 1774.' },
  'Ag2O': { nome: 'Óxido de prata', pf: null, pe: null, d: 7.14, cor: ['#4a3a2a'], po: true, decomp: [280, 'Ag', 'O2'] },
  'Cr2O3': { nome: 'Óxido de crômio(III)', pf: 2435, pe: 4000, d: 5.22, mohs: 8.5, cor: ['#3a7a3a'], po: true },
  'MnO2': { nome: 'Dióxido de manganês', pf: null, pe: null, d: 5.03, cor: ['#2a2622'], po: true, decomp: [535, 'Mn2O3', 'O2'] },
  'Mn2O3': { nome: 'Óxido de manganês(III)', pf: 888, pe: null, d: 4.5, cor: ['#3a2a22'], po: true },
  'NiO': { nome: 'Óxido de níquel(II)', pf: 1955, pe: null, d: 6.67, cor: ['#4a7a3a'], po: true },
  'CoO': { nome: 'Óxido de cobalto(II)', pf: 1933, pe: null, d: 6.44, cor: ['#4a5a3a'], po: true },
  'SnO2': { nome: 'Dióxido de estanho', pf: 1630, pe: 1900, d: 6.95, mohs: 6.5, cor: ['#f6f6f6'], po: true },
  'Bi2O3': { nome: 'Óxido de bismuto', pf: 817, pe: 1890, d: 8.9, cor: ['#f2d850'], po: true },
  'Sb2O3': { nome: 'Óxido de antimônio(III)', pf: 656, pe: 1425, d: 5.2, cor: ['#f6f6f6'], po: true },
  'As2O3': { nome: 'Trióxido de arsênio', pf: 312, pe: 465, d: 3.74, cor: ['#f8f8f8'], po: true, tox: 'As2O3' },
  'SeO2': { nome: 'Dióxido de selênio', pf: 340, pe: 340, sublima: true, d: 3.95, cor: ['#f6f6f6'], po: true },
  'GeO2': { nome: 'Dióxido de germânio', pf: 1115, pe: null, d: 4.23, cor: ['#f6f6f6'], po: true },
  'V2O5': { nome: 'Pentóxido de vanádio', pf: 690, pe: 1750, d: 3.36, cor: ['#e09a2a'], po: true },
  'MoO3': { nome: 'Trióxido de molibdênio', pf: 795, pe: 1155, d: 4.69, cor: ['#f0f0e0'], po: true },
  'WO3': { nome: 'Trióxido de tungstênio', pf: 1473, pe: 1700, d: 7.16, cor: ['#e8d840'], po: true },
  'OsO4': { nome: 'Tetróxido de ósmio', pf: 40.6, pe: 129.7, d: 4.9, cor: ['#f4f0c0', '#f0e8a0', '#f2eedd'], tox: 'OsO4' },
  'CaCO3': { nome: 'Carbonato de cálcio (calcário, giz, mármore)', pf: null, pe: null, d: 2.71, mohs: 3, cor: ['#f4f2ea'], po: true, decomp: [825, 'CaO', 'CO2'], curio: 'Conchas, cascas de ovo, corais, mármore e giz são carbonato de cálcio.' },
  'Na2CO3': { nome: 'Carbonato de sódio (barrilha)', pf: 851, pe: null, d: 2.54, cor: ['#f8f8f8'], po: true },
  'NaHCO3': { nome: 'Bicarbonato de sódio', pf: null, pe: null, d: 2.2, cor: ['#fbfbfb'], po: true, decomp: [80, 'Na2CO3', 'CO2'], uso: 'Fermento, antiácido, extintor de pó.' },
  'K2CO3': { nome: 'Carbonato de potássio (potassa)', pf: 891, pe: null, d: 2.43, cor: ['#f8f8f8'], po: true },
  'BaCO3': { nome: 'Carbonato de bário', pf: null, pe: null, d: 4.29, cor: ['#f6f6f6'], po: true, decomp: [1300, 'BaO', 'CO2'] },
  'MgCO3': { nome: 'Carbonato de magnésio (pó de academia)', pf: null, pe: null, d: 2.96, mohs: 4, cor: ['#fbfbfb'], po: true, decomp: [350, 'MgO', 'CO2'] },
  'CuCO3': { nome: 'Carbonato básico de cobre (pátina, malaquita)', pf: null, pe: null, d: 4.0, mohs: 3.75, cor: ['#2f9a6a'], po: true, decomp: [290, 'CuO', 'CO2'] },
  'CuSO4': { nome: 'Sulfato de cobre(II) pentaidratado', pf: null, pe: null, d: 2.28, mohs: 2.5, cor: ['#1e6ad0'], po: true, decomp: [110, 'CuSO4anidro', 'H2O'] },
  'CuSO4anidro': { formula: 'CuSO4', nome: 'Sulfato de cobre(II) anidro', pf: null, pe: null, d: 3.6, cor: ['#eef0f0'], po: true, soluvel: 'aq:Cu:SO4', curio: 'É branco; com água volta a ficar azul (teste de umidade).' },
  'Na2SO4': { nome: 'Sulfato de sódio', pf: 884, pe: null, d: 2.66, cor: ['#f8f8f8'], po: true },
  'MgSO4': { nome: 'Sulfato de magnésio (sal de Epsom)', pf: 1124, pe: null, d: 2.66, cor: ['#f8f8f8'], po: true },
  'CaSO4': { nome: 'Sulfato de cálcio (gesso)', pf: 1460, pe: null, d: 2.96, mohs: 2, cor: ['#f6f6f2'], po: true },
  'BaSO4': { nome: 'Sulfato de bário (barita)', pf: 1580, pe: null, d: 4.5, mohs: 3.25, cor: ['#f8f8f8'], po: true, uso: 'Contraste branco dos raios X do estômago: é seguro por ser insolúvel.' },
  'ZnSO4': { nome: 'Sulfato de zinco', pf: 680, pe: null, d: 3.54, cor: ['#f8f8f8'], po: true },
  'FeSO4': { nome: 'Sulfato de ferro(II)', pf: 680, pe: null, d: 3.65, cor: ['#a8d8a0'], po: true },
  'K2SO4': { nome: 'Sulfato de potássio', pf: 1069, pe: 1689, d: 2.66, cor: ['#f8f8f8'], po: true },
  'PbSO4': { nome: 'Sulfato de chumbo(II)', pf: 1087, pe: null, d: 6.29, cor: ['#f6f6f6'], po: true },
  'NaNO3': { nome: 'Nitrato de sódio (salitre do Chile)', pf: 308, pe: 380, d: 2.26, cor: ['#f8f8f8'], po: true },
  'KNO3': { nome: 'Nitrato de potássio (salitre)', pf: 334, pe: 400, d: 2.11, cor: ['#f8f8f8'], po: true },
  'AgNO3': { nome: 'Nitrato de prata', pf: 212, pe: 440, d: 4.35, cor: ['#f8f8f8'], po: true, curio: 'Mancha a pele de preto: a luz transforma a prata em partículas escuras.' },
  'Cu(NO3)2': { nome: 'Nitrato de cobre(II)', pf: 114, pe: 170, d: 2.32, cor: ['#2a6ad0'], po: true },
  'Ca3(PO4)2': { nome: 'Fosfato de cálcio', pf: 1670, pe: null, d: 3.14, mohs: 5, cor: ['#f6f4ee'], po: true, curio: 'Os ossos e os dentes são feitos principalmente de fosfatos de cálcio (hidroxiapatita).' },
  'Na3PO4': { nome: 'Fosfato de sódio', pf: 1583, pe: null, d: 2.54, cor: ['#f8f8f8'], po: true },
  'NH4Cl': { nome: 'Cloreto de amônio', pf: 338, pe: 338, sublima: true, d: 1.53, cor: ['#ffffff', null, '#f4f4f4'], po: true, decompGas: ['NH3', 'HCl'], curio: 'Quando amônia e HCl se encontram no ar, formam uma fumaça branca: é ele.' },
  'H2SO4': { nome: 'Ácido sulfúrico concentrado', pf: 10, pe: 337, d: 1.83, cor: ['#f4f4ee', '#f0ece0', '#f4f4f0'], ph: -1, tox: 'acidoForte', diluiCalor: 70, curio: 'Misturar com água solta muito calor: sempre o ácido na água, nunca o contrário.' },
  'HNO3': { nome: 'Ácido nítrico concentrado', pf: -42, pe: 83, d: 1.51, cor: ['#f8f4e0', '#f6f0c8', '#f4f0e0'], ph: -1, tox: 'acidoForte', diluiCalor: 30 },
  'H2O2': { formula: 'H2O2', nome: 'Peróxido de hidrogênio 30%', pf: -26, pe: 106, d: 1.11, cor: ['#eef6ff', '#cfe2f6', '#eef4fa'], cp: 3.6, lam: 0.55, ph: 4, peroxido: 30, reagente: true, decomp: [90, 'H2O', 'O2'], decompEq: '2 H₂O₂ → 2 H₂O + O₂↑', tox: 'H2O2', uso: 'Reagente oxidante de laboratório; alvejante de papel e tecido; esterilização.', curio: 'Concentrado (30%, "100 volumes"): um litro solta cerca de 100 litros de oxigênio ao se decompor. Queima a pele, deixando-a branca.' },
  'AguaOxigenada': { formula: 'H2O2', nome: 'Água oxigenada 3% (10 volumes)', pf: -1, pe: 100, d: 1.0, cor: ['#eef6ff', '#4a86d8', '#eef4fa'], cp: 4.1, lam: 0.6, ph: 5, peroxido: 3, reagente: true, decomp: [95, 'H2O', 'O2'], decompEq: '2 H₂O₂ → 2 H₂O + O₂↑', tox: 'H2O2', uso: 'A de farmácia: limpeza de ferimentos (hoje pouco recomendada) e clareamento.', curio: '"10 volumes" quer dizer que 1 mL solta 10 mL de oxigênio. A espuma num machucado é a enzima catalase do sangue quebrando o peróxido.' },
  'KMnO4': { nome: 'Permanganato de potássio', pf: null, pe: null, d: 2.70, cor: ['#4a1458', '#6a1a7a'], po: true, reagente: true, oxidanteForte: true, decomp: [240, 'MnO2', 'O2'], decompEq: '2 KMnO₄ → K₂MnO₄ + MnO₂ + O₂↑', uso: 'Oxidante de laboratório e titulações; tratamento de água; banhos antissépticos MUITO diluídos (1:10 000).', curio: 'Um grãozinho deixa um copo de água inteiro roxo. Quando reage, o roxo some: é assim que ele "avisa" o fim de uma titulação.' },
  'Glicerina': { formula: 'C3H8O3', nome: 'Glicerina (glicerol)', pf: 17.8, pe: 290, d: 1.26, cor: ['#f4f4ea', '#eef0f4', '#f4f4f4'], cp: 2.4, lam: 0.29, viscoso: true, reagente: true, tox: 'Glicerina', inflam: { ign: 370, prod: 'CO2', prod2: 'H2O', dH: -1655 }, uso: 'Sabonetes, cosméticos, xaropes e alimentos (umectante).', curio: 'Grossa e adocicada. Em contato com permanganato de potássio em pó, pega fogo sozinha depois de alguns segundos.' },
  'Acetona': { formula: 'C3H6O', nome: 'Acetona (propanona)', pf: -94.7, pe: 56.1, d: 0.785, cor: ['#f4f4fa', '#e8eef8', '#f4f4f8'], cp: 2.16, lam: 0.16, reagente: true, tox: 'Acetona', inflam: { ign: 465, prod: 'CO2', prod2: 'H2O', dH: -1790 }, uso: 'Solvente de laboratório e removedor de esmalte.', curio: 'Evapora muito rápido (ferve a 56 °C) e o vapor pega fogo fácil.' },
  'Fenolftaleina': { formula: 'C20H14O4', nome: 'Fenolftaleína (indicador)', pf: -114, pe: 78, d: 0.80, cor: ['#f8f8f8', '#eef0f6', '#f4f4f8'], cp: 2.4, lam: 0.17, reagente: true, indicadorDe: 'fenol', tox: 'Fenolftaleina', uso: 'Indicador ácido-base (1% em álcool): incolor abaixo de pH 8,2 e rosa acima.', curio: 'É o indicador clássico das titulações: a primeira gota que deixa a solução rosa marca o fim.' },
  'RepolhoRoxo': { formula: 'Antocianinas', nome: 'Extrato de repolho roxo (indicador)', pf: -1, pe: 100, d: 1.0, cor: ['#a080c0', '#6a3c8c', '#e8e0f0'], cp: 4.1, lam: 0.6, reagente: true, indicadorDe: 'repolho', tox: 'RepolhoRoxo', uso: 'Indicador de pH caseiro: vermelho no ácido, roxo no neutro, azul-esverdeado e amarelo na base.', curio: 'A cor vem das antocianinas, os mesmos pigmentos da uva, da amora e do açaí.' },
  'Amido': { formula: 'C6H10O5', nome: 'Amido (polvilho)', pf: null, pe: null, d: 1.5, cor: ['#fbfbf8'], po: true, reagente: true, decomp: [260, 'Caramelo', 'H2O'], tox: 'Amido', uso: 'Reserva de energia das plantas (arroz, batata, mandioca). No laboratório, detecta iodo.', curio: 'Com iodo fica azul-escuro quase preto: o iodo entra no meio das espirais da molécula de amido.' },
  'AmidoIodo': { formula: 'C6H10O5·I₃⁻', nome: 'Amido + iodo (complexo azul)', pf: null, pe: null, d: 1.5, cor: ['#1a1a5a'], po: true, tox: 'AmidoIodo', uso: 'Teste do amido e do iodo.', curio: 'A cor some se esquentar e volta ao esfriar.' },
  'Detergente': { formula: 'C18H29NaO3S', nome: 'Detergente (lava-louças)', pf: -2, pe: 100, d: 1.03, cor: ['#e4f4b0', '#a6d64a', '#eef4e0'], cp: 3.9, lam: 0.5, ph: 7.5, viscoso: true, casa: true, surfactante: true, comoAgua: true, tox: 'Detergente', uso: 'Tira gordura da louça. O princípio ativo (dodecilbenzenossulfonato de sódio) tem uma ponta que gosta de água e outra que gosta de óleo.', curio: 'Com gás passando por ele forma espuma: cada bolha é uma película de água presa entre moléculas de detergente.' },
  'Sabao': { formula: 'C17H35COONa', nome: 'Sabão em barra', pf: 245, pe: null, d: 1.07, cor: ['#f2ecd2', '#e8dcb0'], cp: 1.8, lam: 0.3, casa: true, agua: 'AguaSabao', aguaLenta: true, tox: 'Sabao', uso: 'Limpeza. É feito de gordura + soda cáustica (saponificação).', curio: 'Em água "dura" (com cálcio) o sabão forma uma borra branca e espuma pouco.' },
  'AguaSabao': { formula: 'C17H35COONa(aq)', nome: 'Água com sabão', pf: -1, pe: 100, d: 1.0, cor: ['#eef2f4', '#b8c8d8', '#eef2f4'], cp: 4.1, lam: 0.6, ph: 9.5, surfactante: true, comoAgua: true, tox: 'Sabao' },
  'Espuma': { formula: 'bolhas', nome: 'Espuma (bolhas de gás)', pf: null, pe: null, d: 0.05, cor: ['#f4f8ff'], cp: 4, lam: 0.05, po: true, efemero: 0.004, efemeroVira: 'H2O', tox: 'Detergente', curio: 'As bolhas estouram sozinhas com o tempo e deixam umas gotinhas de água.' },
  'EspumaH2': { formula: 'bolhas de H2', nome: 'Espuma com hidrogênio', pf: null, pe: null, d: 0.04, cor: ['#eef6ff'], cp: 4, lam: 0.05, po: true, efemero: 0.004, efemeroVira: 'H', tox: 'Detergente', inflam: { ign: 500, prod: 'H2O', dH: -286 }, curio: 'Bolhas cheias de hidrogênio: uma faísca e elas viram uma bola de fogo (só água de produto).' },
  'Emulsao': { formula: 'óleo + detergente', nome: 'Emulsão (óleo com detergente)', pf: -2, pe: 100, d: 0.98, cor: ['#f6f2dc', '#ece2b8', '#f4f4f0'], cp: 3, lam: 0.4, viscoso: true, tox: 'Detergente', curio: 'O detergente quebra o óleo em gotinhas minúsculas que ficam soltas na água: é por isso que ele tira gordura.' },
  'Oleo': { formula: 'C57H104O6', nome: 'Óleo de cozinha (soja)', pf: -16, pe: 360, d: 0.92, cor: ['#f0d870', '#e6c23a', '#f4ecd0'], cp: 2.0, lam: 0.17, viscoso: true, casa: true, tox: 'Oleo', inflam: { ign: 400, prod: 'CO2', prod2: 'H2O' }, uso: 'Cozinhar e fritar. Não se mistura com água e boia por cima.', curio: 'NUNCA jogue água em óleo pegando fogo: a água afunda, vira vapor na hora e espirra o óleo em chamas para todo lado. Abafe com uma tampa.' },
  'Leite': { formula: 'H2O', nome: 'Leite', pf: -0.5, pe: 100, d: 1.03, cor: ['#fffdf4', '#f4f0e6', '#f2f2f2'], cp: 3.9, lam: 0.55, ph: 6.7, casa: true, tox: 'Leite', uso: 'Alimento: água, gordura, lactose e proteínas (caseína).', curio: 'Com ácido (vinagre, limão) a caseína coagula: é o começo da fabricação de queijo e ricota.' },
  'Coalhada': { formula: 'caseína', nome: 'Coalhada (caseína)', pf: null, pe: null, d: 1.1, cor: ['#fbf6e8'], po: true, cp: 2, lam: 0.3, tox: 'Leite', curio: 'É a proteína do leite que se juntou por causa do ácido.' },
  'SoroLeite': { formula: 'H2O', nome: 'Soro do leite', pf: -0.5, pe: 100, d: 1.02, cor: ['#f4f0c8', '#e4dc96', '#f2f2f2'], cp: 4, lam: 0.55, ph: 4.6, tox: 'Leite' },
  'Parafina': { formula: 'C25H52', nome: 'Parafina (vela)', pf: 58, pe: 370, d: 0.9, cor: ['#f6f2e4', '#f0e2b4', '#f4f4f4'], cp: 2.9, lam: 0.25, casa: true, tox: 'Parafina', inflam: { ign: 245, prod: 'CO2', prod2: 'H2O' }, uso: 'Velas. Derrete a ~58 °C e queima como vapor.', curio: 'Na vela, o que queima é o vapor da parafina que sobe pelo pavio, não a cera sólida.' },
  'PalhaAco': { formula: 'Fe', nome: 'Palha de aço', pf: 1450, pe: 2860, d: 7.85, cor: ['#a0a2a8', '#ff9a40'], cp: 0.46, lam: 50, po: true, liga: true, casa: true, curie: 770, tox: 'PalhaAco', inflam: { ign: 400, prod: 'Fe3O4', dH: -1118 }, uso: 'Arear panelas.', curio: 'Os fios são tão finos que esquentam rápido: encostada nos dois polos de uma bateria, a palha de aço brilha e pega fogo.' },
  'H3PO4': { nome: 'Ácido fosfórico (85%)', pf: 42, pe: 158, d: 1.88, cor: ['#f8f8f8', '#f2f2ea'], ph: 1, tox: 'acidoForte', uso: 'Dá o sabor ácido dos refrigerantes de cola (bem diluído).' },
  'AguaRegia': { formula: 'HNO3 + 3 HCl', nome: 'Água régia', pf: -42, pe: 108, d: 1.21, cor: [null, '#f0a020', '#f4d080'], ph: -1, tox: 'acidoForte', curio: 'Mistura de ácidos nítrico e clorídrico que dissolve até o ouro e a platina.' },
  'Diamante': { formula: 'C', nome: 'Diamante', pf: 3550, pe: null, d: 3.51, mohs: 10, cor: ['#dff6ff'], lam: 2200, tox: 'C', inflam: { ign: 800, prod: 'CO2', dH: -395 }, curio: 'O material natural mais duro, mas queima no ar a uns 800 °C virando CO₂.' },
  'FosforoVermelho': { formula: 'P', nome: 'Fósforo vermelho', pf: 590, pe: 416, sublima: true, d: 2.2, cor: ['#a0281e'], po: true, inflam: { ign: 260, prod: 'P4O10', dH: -746 }, tox: 'Pvermelho', uso: 'A lixa da caixa de fósforos.' },
  'Bronze': { formula: 'Cu + Sn', nome: 'Bronze (cobre + estanho)', pf: 950, pe: 2300, d: 8.8, mohs: 3.5, cor: ['#b8863a'], liga: true, tracao: '350–635 MPa', curio: 'Deu nome à Idade do Bronze, quando passou a substituir as ferramentas de pedra.' },
  'Latao': { formula: 'Cu + Zn', nome: 'Latão (cobre + zinco)', pf: 930, pe: 1100, d: 8.5, mohs: 3.5, cor: ['#d6b040'], liga: true, tracao: '340–550 MPa', uso: 'Instrumentos de sopro, torneiras, chaves.' },
  'Aco': { formula: 'Fe + C', nome: 'Aço (ferro + carbono)', pf: 1450, pe: 2860, d: 7.85, mohs: 5, cor: ['#7c8088'], liga: true, tracao: '400–550 MPa (aço comum)', curie: 770 },
  'Inox': { formula: 'Fe + Cr + Ni', nome: 'Aço inoxidável', pf: 1450, pe: 2860, d: 8.0, mohs: 5.5, cor: ['#b8bcc2'], liga: true, tracao: '515–750 MPa', naoEnferruja: true, curio: 'O crômio forma uma película fina de óxido que se refaz sozinha e impede a ferrugem.' },
  'Solda': { formula: 'Sn + Pb', nome: 'Solda (estanho + chumbo)', pf: 183, pe: 1600, d: 8.4, mohs: 1.5, cor: ['#a8acb0'], liga: true, tox: 'Pb' },
  'Amalgama': { formula: 'Hg + metal', nome: 'Amálgama de mercúrio', pf: -30, pe: 357, d: 13, cor: ['#b8bcc4', '#b4b8c0'], liga: true, tox: 'Hg', decompPe: 'Hg', curio: 'Garimpeiros aquecem a amálgama para evaporar o mercúrio e sobrar o ouro, envenenando rios e a si mesmos.' },
  'AlFragil': { formula: 'Al + Ga', nome: 'Alumínio com gálio (quebradiço)', pf: 30, pe: 2400, d: 3, mohs: 0.5, cor: ['#a8acb4'], po: true, agua: 'Al(OH)3', aguaGas: 'H2', aguaCalor: 30, curio: 'O gálio penetra entre os grãos do alumínio: ele perde a força e passa a reagir com água.' },
  'Vidro': { formula: 'SiO2·B2O3', nome: 'Vidro de laboratório (borossilicato)', pf: 820, pe: null, d: 2.23, mohs: 6, cor: ['#d8f0f0', '#ffb060'], lam: 1.1, vidro: true, uso: 'Béqueres e tubos de ensaio: aguenta calor e quase todos os ácidos (menos o fluorídrico).' },
  'Cadinho': { formula: 'Al2O3', nome: 'Cadinho de alumina (cerâmica)', pf: 2072, pe: 2977, d: 3.95, mohs: 9, cor: ['#e8e2d6', '#fff0c0'], lam: 30, vidro: true, uso: 'Recipiente para fundir metais: aguenta mais de 2000 °C.' },
  'Parede': { formula: '—', nome: 'Parede do simulador (indestrutível)', pf: null, pe: null, d: 99, cor: ['#4a4f5a'], lam: 0.5, inerte: true },
  'Caramelo_': null,
};
delete COMPOSTOS.Caramelo_;

/* =========================================================================
   ÍONS para soluções aquosas (~0,1 mol/L). acidez/basic: quanto o íon desloca o pH de 7
   (hidrólise). Fonte das tendências: química de soluções (Atkins / CRC); valores aproximados.
   ========================================================================= */
const CATIONS = {
  H: { nome: 'hidrogênio', carga: 1, simb: 'H' },
  Li: { nome: 'lítio', carga: 1, simb: 'Li', ac: 0 }, Na: { nome: 'sódio', carga: 1, simb: 'Na', ac: 0 }, K: { nome: 'potássio', carga: 1, simb: 'K', ac: 0 }, Rb: { nome: 'rubídio', carga: 1, simb: 'Rb', ac: 0 }, Cs: { nome: 'césio', carga: 1, simb: 'Cs', ac: 0 },
  NH4: { nome: 'amônio', carga: 1, poli: true, ac: 1.9, simb: 'N' },
  Mg: { nome: 'magnésio', carga: 2, simb: 'Mg', ac: 0.5 }, Ca: { nome: 'cálcio', carga: 2, simb: 'Ca', ac: 0.2 }, Sr: { nome: 'estrôncio', carga: 2, simb: 'Sr', ac: 0 }, Ba: { nome: 'bário', carga: 2, simb: 'Ba', ac: 0 },
  Al: { nome: 'alumínio', carga: 3, simb: 'Al', ac: 4 }, Zn: { nome: 'zinco', carga: 2, simb: 'Zn', ac: 1.8 }, Fe: { nome: 'ferro(II)', carga: 2, simb: 'Fe', ac: 2.5, cor: '#b8d8a0' }, Fe3: { nome: 'ferro(III)', carga: 3, simb: 'Fe', ac: 5, cor: '#c88a1a' },
  Cu: { nome: 'cobre(II)', carga: 2, simb: 'Cu', ac: 3, cor: '#2f78d0' }, Ni: { nome: 'níquel(II)', carga: 2, simb: 'Ni', ac: 1.5, cor: '#4fbf5a' }, Co: { nome: 'cobalto(II)', carga: 2, simb: 'Co', ac: 1.5, cor: '#e07aa0' },
  Mn: { nome: 'manganês(II)', carga: 2, simb: 'Mn', ac: 1.2, cor: '#f2d8e0' }, Cr: { nome: 'crômio(III)', carga: 3, simb: 'Cr', ac: 4, cor: '#3f8f6a' }, Sn: { nome: 'estanho(II)', carga: 2, simb: 'Sn', ac: 4.5 }, Pb: { nome: 'chumbo(II)', carga: 2, simb: 'Pb', ac: 2.5 },
  Ag: { nome: 'prata', carga: 1, simb: 'Ag', ac: 1 }, Hg: { nome: 'mercúrio(II)', carga: 2, simb: 'Hg', ac: 3.5 }, Cd: { nome: 'cádmio', carga: 2, simb: 'Cd', ac: 1.5 }, Au: { nome: 'ouro(III)', carga: 3, simb: 'Au', ac: 5, cor: '#f0c030' }, Pt: { nome: 'platina(IV)', carga: 4, simb: 'Pt', ac: 5, cor: '#e8a040' },
};
const ANIONS = {
  OH: { nome: 'Hidróxido', carga: 1, poli: true, base: true },
  Cl: { nome: 'Cloreto', carga: 1, acido: 'Ácido clorídrico', phAcido: 1.0, forte: true }, Br: { nome: 'Brometo', carga: 1, acido: 'Ácido bromídrico', phAcido: 1.0, forte: true }, I: { nome: 'Iodeto', carga: 1, acido: 'Ácido iodídrico', phAcido: 1.0, forte: true },
  F: { nome: 'Fluoreto', carga: 1, acido: 'Ácido fluorídrico', phAcido: 2.1, bas: 1.1 }, NO3: { nome: 'Nitrato', carga: 1, poli: true, acido: 'Ácido nítrico', phAcido: 1.0, forte: true, oxidante: true },
  SO4: { nome: 'Sulfato', carga: 2, poli: true, acido: 'Ácido sulfúrico (diluído)', phAcido: 1.0, forte: true }, SO3: { nome: 'Sulfito', carga: 2, poli: true, acido: 'Ácido sulfuroso', phAcido: 1.5, bas: 2.8 },
  CO3: { nome: 'Carbonato', carga: 2, poli: true, acido: 'Ácido carbônico (água com gás)', phAcido: 3.9, bas: 4.6, gas: 'CO2' }, PO4: { nome: 'Fosfato', carga: 3, poli: true, acido: 'Ácido fosfórico', phAcido: 1.6, bas: 5.6 },
  C6H5O7: { nome: 'Citrato', carga: 3, poli: true, acido: 'Suco de limão (ácido cítrico)', phAcido: 2.3, bas: 1 },
  MnO4: { nome: 'Permanganato', carga: 1, poli: true, oxidante: true, cor: '#6a1a86' },
  CH3COO: { nome: 'Acetato', carga: 1, poli: true, acido: 'Vinagre (ácido acético)', phAcido: 2.4, bas: 1.9 }, BO3: { nome: 'Borato', carga: 3, poli: true, acido: 'Ácido bórico', phAcido: 5.1, bas: 4 },
};
const PH_BASE = { Na: 13, K: 13, Li: 13, Rb: 13, Cs: 13, Ba: 13.3, Sr: 13, Ca: 12.4, NH4: 11.1 };
/* Regras de solubilidade em água (as clássicas dos livros de química) */
function soluvel(c, a) {
  if (['Li', 'Na', 'K', 'Rb', 'Cs', 'NH4', 'H'].includes(c)) return true;
  if (a === 'NO3' || a === 'CH3COO' || a === 'MnO4') return true;
  if (a === 'Cl' || a === 'Br') return !['Ag', 'Pb'].includes(c);
  if (a === 'I') return !['Ag', 'Pb', 'Hg'].includes(c);
  if (a === 'F') return !['Ca', 'Mg', 'Sr', 'Ba', 'Pb'].includes(c);
  if (a === 'SO4') return !['Ba', 'Sr', 'Pb', 'Ca'].includes(c);
  if (a === 'OH') return ['Ba', 'Sr', 'Ca'].includes(c);
  return false; // carbonatos, fosfatos, sulfitos, boratos: insolúveis fora alcalinos e amônio
}
/* Cor dos precipitados (o que aparece quando duas soluções formam um sólido) */
const COR_PRECIPITADO = {
  'Ag:Cl': '#f4f4f0', 'Ag:Br': '#f2eac8', 'Ag:I': '#f5e663', 'Pb:I': '#ffd700', 'Hg:I': '#e8331a', 'Pb:Cl': '#f6f6f6', 'Ba:SO4': '#f8f8f8', 'Pb:SO4': '#f6f6f6', 'Ca:SO4': '#f6f6f2', 'Sr:SO4': '#f6f6f6',
  'Ca:CO3': '#f4f2ea', 'Ba:CO3': '#f6f6f6', 'Cu:CO3': '#2f9a6a', 'Fe:CO3': '#a8b898', 'Ag:CO3': '#f2f0c0', 'Ag:PO4': '#f6dc3c', 'Ca:PO4': '#f6f4ee', 'Ag:OH': '#4a3a2a',
  'Cu:OH': '#3b7bd9', 'Fe3:OH': '#a0522d', 'Fe:OH': '#6b8f5a', 'Ni:OH': '#6fbf4a', 'Co:OH': '#d97fa0', 'Mn:OH': '#e8d8c8', 'Cr:OH': '#4a7a5a', 'Hg:OH': '#e0a020', 'Ca:F': '#f6f6f6',
};

/* =========================================================================
   TOXICOLOGIA (para a simulação no organismo)
   g: gravidade base 0–4 · lim: [leve, moderado, grave] em mg do agente por kg de peso
   (faixas aproximadas, só para classificar; não são orientação de dose) · org: órgãos
   ========================================================================= */
const TOX = {
  // íons e compostos em solução / dissolvidos no estômago
  'Na+': { nome: 'Sódio', lim: [40, 120, 400], org: ['sangue', 'cerebro', 'rins'], efe: 'Muito sal de uma vez puxa água das células, dá sede intensa e vômito; em excesso extremo, o sódio do sangue dispara (hipernatremia) e afeta o cérebro.', fonte: 'NIH ODS; StatPearls (hipernatremia)' },
  'K+': { nome: 'Potássio', lim: [30, 80, 150], org: ['coracao', 'estomago'], efe: 'Em grande quantidade irrita o estômago e pode elevar o potássio do sangue (hipercalemia), que causa arritmia no coração.', fonte: 'StatPearls (hipercalemia)' },
  'Li+': { nome: 'Lítio', lim: [2, 5, 10], org: ['cerebro', 'rins', 'estomago'], efe: 'Tremores, vômito, confusão; em dose alta, convulsões e dano nos rins. A dose de remédio e a dose tóxica são próximas.', fonte: 'StatPearls (toxicidade do lítio)' },
  'Mg2+': { nome: 'Magnésio', lim: [5, 25, 70], org: ['intestino', 'coracao'], efe: 'Efeito laxante (diarreia). Doses muito grandes, principalmente com rins fracos, baixam a pressão e o ritmo do coração.', fonte: 'NIH ODS (magnésio)' },
  'Ca2+': { nome: 'Cálcio', lim: [36, 100, 300], org: ['rins', 'coracao'], efe: 'Em excesso: prisão de ventre, pedras nos rins e cálcio alto no sangue (hipercalcemia).', fonte: 'NIH ODS (cálcio)' },
  'Ba2+': { nome: 'Bário solúvel', lim: [0.3, 1, 3], org: ['coracao', 'musculos', 'estomago'], efe: 'O bário dissolvido derruba o potássio do sangue: fraqueza muscular, paralisia e arritmia. (O sulfato de bário, insolúvel, é seguro.)', fonte: 'CDC/ATSDR (bário); NCBI Bookshelf' },
  'Sr2+': { nome: 'Estrôncio', lim: [20, 100, 300], org: ['ossos'], efe: 'O estrôncio estável tem baixa toxicidade; se deposita nos ossos no lugar do cálcio.', fonte: 'ATSDR (estrôncio)' },
  'Al3+': { nome: 'Alumínio', lim: [10, 50, 200], org: ['estomago'], efe: 'Quase não é absorvido; em grande quantidade, prisão de ventre.', fonte: 'ATSDR (alumínio)' },
  'Fe': { nome: 'Ferro', lim: [20, 40, 60], org: ['estomago', 'figado', 'sangue'], efe: 'Acima de ~20 mg/kg: vômito e dor; acima de ~60 mg/kg o ferro destrói o fígado e causa choque. É uma das intoxicações mais comuns em crianças (comprimidos de ferro).', fonte: 'StatPearls (toxicidade do ferro); Manual MSD' },
  'Cu2+': { nome: 'Cobre', lim: [0.15, 1, 5], org: ['estomago', 'figado', 'rins'], efe: 'Sais de cobre irritam o estômago e provocam vômito rápido; em grande quantidade, dano no fígado e destruição de glóbulos vermelhos.', fonte: 'ATSDR (cobre); NIH ODS' },
  'Zn2+': { nome: 'Zinco', lim: [0.6, 3, 10], org: ['estomago'], efe: 'Náusea, vômito e cólica. Excesso prolongado atrapalha a absorção de cobre.', fonte: 'NIH ODS (zinco)' },
  'Ni2+': { nome: 'Níquel', lim: [0.015, 0.5, 5], org: ['estomago', 'pele', 'rins'], efe: 'Náusea, vômito e alergia; os sais de níquel são tóxicos e possíveis cancerígenos.', fonte: 'ATSDR (níquel)' },
  'Co2+': { nome: 'Cobalto', lim: [0.05, 1, 5], org: ['coracao', 'tireoide', 'sangue'], efe: 'Excesso afeta o coração (cardiomiopatia), a tireoide e o sangue.', fonte: 'ATSDR (cobalto)' },
  'Mn2+': { nome: 'Manganês', lim: [0.16, 2, 10], org: ['cerebro', 'figado'], efe: 'Em excesso prolongado, afeta o sistema nervoso (sintomas parecidos com Parkinson).', fonte: 'NIH ODS; ATSDR (manganês)' },
  'Cr3+': { nome: 'Crômio(III)', lim: [5, 50, 200], org: ['estomago'], efe: 'O crômio(III) tem baixa toxicidade e pouca absorção.', fonte: 'NIH ODS (crômio)' },
  'Sn2+': { nome: 'Estanho', lim: [2, 10, 50], org: ['estomago'], efe: 'Sais de estanho causam náusea, vômito e diarreia.', fonte: 'ATSDR (estanho)' },
  'Pb2+': { nome: 'Chumbo', lim: [0.005, 0.5, 5], org: ['cerebro', 'sangue', 'rins', 'ossos'], efe: 'Afeta o cérebro (principalmente de crianças), causa anemia e cólica; acumula nos ossos por décadas. O CDC diz que não existe nível seguro de chumbo no sangue.', fonte: 'CDC/ATSDR (chumbo)' },
  'Ag+': { nome: 'Prata', lim: [0.1, 2, 10], org: ['boca', 'estomago', 'pele'], efe: 'O nitrato de prata é cáustico (queima as mucosas). Tomar prata por muito tempo causa argiria: pele azul-acinzentada permanente.', fonte: 'ATSDR (prata)' },
  'Hg2+': { nome: 'Mercúrio (sais)', lim: [0.01, 0.5, 5], org: ['estomago', 'rins', 'cerebro'], efe: 'Os sais de mercúrio são absorvidos (7–15%) e corrosivos: vômito com sangue, falência dos rins e dano neurológico.', fonte: 'ATSDR (mercúrio); UK HSA' },
  'Cd2+': { nome: 'Cádmio', lim: [0.01, 0.3, 3], org: ['estomago', 'rins', 'ossos'], efe: 'Vômito intenso logo depois; a longo prazo acumula nos rins e enfraquece os ossos.', fonte: 'ATSDR (cádmio)' },
  'Tl+': { nome: 'Tálio', lim: [0.005, 0.3, 2], org: ['cerebro', 'pele', 'coracao', 'estomago'], efe: 'Dias depois: dor forte nos pés e mãos, queda de cabelo e problemas no coração.', fonte: 'CDC/ATSDR ToxFAQs (tálio)' },
  'NH4+': { nome: 'Amônio', lim: [10, 50, 200], org: ['estomago', 'cerebro'], efe: 'Irrita o estômago; em grande quantidade, sobrecarrega o fígado.', fonte: 'ATSDR (amônia)' },
  'Au3+': { nome: 'Sais de ouro', lim: [0.5, 5, 20], org: ['rins', 'pele', 'sangue'], efe: 'Os sais de ouro (não o metal) são tóxicos para rins e medula; já foram remédio para artrite.', fonte: 'NCBI Bookshelf (LiverTox: ouro)' },
  'Pt4+': { nome: 'Sais de platina', lim: [0.5, 5, 20], org: ['rins', 'pele'], efe: 'Sais de platina causam alergia forte e dano nos rins.', fonte: 'NCBI (platina)' },
  'F-': { nome: 'Fluoreto', lim: [0.14, 5, 15], org: ['estomago', 'coracao', 'ossos'], efe: 'Acima de ~5 mg/kg (dose provavelmente tóxica usada em odontologia): vômito e dor; em doses maiores, o cálcio do sangue cai e o coração sofre.', fonte: 'NIH ODS; literatura odontológica (PTD)' },
  'I-': { nome: 'Iodo/iodeto', lim: [0.016, 1, 10], org: ['tireoide', 'estomago'], efe: 'Excesso desregula a tireoide (pode tanto acelerar quanto travar).', fonte: 'NIH ODS (iodo)' },
  'Br-': { nome: 'Brometo', lim: [10, 50, 150], org: ['cerebro', 'pele'], efe: 'Bromismo: sonolência, confusão e manchas na pele.', fonte: 'StatPearls (bromismo)' },
  'NO3-': { nome: 'Nitrato', lim: [3.7, 50, 150], org: ['sangue'], efe: 'No corpo vira nitrito, que impede o sangue de levar oxigênio (metemoglobinemia: pele azulada). Bebês são os mais sensíveis.', fonte: 'EFSA; StatPearls (metemoglobinemia)' },
  'SO4--': { nome: 'Sulfato', lim: [20, 100, 500], org: ['intestino'], efe: 'Efeito laxante (o sal de Epsom é usado para isso).', fonte: 'OMS (sulfato na água)' },
  'PO4---': { nome: 'Fosfato', lim: [57, 150, 400], org: ['rins', 'intestino'], efe: 'Diarreia; em excesso, baixa o cálcio do sangue.', fonte: 'NIH ODS (fósforo)' },
  'CO3--': { nome: 'Carbonato/bicarbonato', lim: [50, 200, 500], org: ['estomago', 'sangue'], efe: 'Antiácido: solta gás no estômago (arroto). Doses enormes deixam o sangue alcalino.', fonte: 'StatPearls (alcalose)' },
  'SO3--': { nome: 'Sulfito', lim: [0.7, 10, 100], org: ['pulmoes'], efe: 'Pode causar crise de asma em pessoas sensíveis.', fonte: 'FDA; EFSA (sulfitos)' },
  'CH3COO-': { nome: 'Acetato', lim: [100, 400, 1000], org: ['estomago'], efe: 'Baixa toxicidade (é o "sal" do vinagre).', fonte: 'PubChem' },
  'BO3---': { nome: 'Ácido bórico/borato', lim: [0.3, 20, 100], org: ['estomago', 'pele', 'rins'], efe: 'Vômito, diarreia e uma vermelhidão típica da pele ("lagosta cozida") em doses altas.', fonte: 'NIH ODS (boro); ATSDR' },
  // elementos e compostos puros
  'H': { nome: 'Hidrogênio', inal: 'asfixiante', efe: 'Não é tóxico, mas puro toma o lugar do oxigênio; também é muito inflamável.' },
  'He': { nome: 'Hélio', inal: 'asfixiante', efe: 'Afina a voz, mas respirado puro tira o oxigênio dos pulmões: pode causar desmaio em segundos. Inalar direto de cilindro pode romper os pulmões.' },
  'N': { nome: 'Nitrogênio', inal: 'asfixiante', efe: 'Não tem cheiro e não avisa: respirado puro, causa desmaio por falta de oxigênio.' },
  'O': { nome: 'Oxigênio', inal: 'ok', efe: 'Respirar oxigênio puro por pouco tempo não faz mal; por muitas horas, irrita os pulmões. Aumenta muito o risco de incêndio.' },
  'Ne': { nome: 'Neônio', inal: 'asfixiante', efe: 'Inerte; respirado puro tira o oxigênio.' }, 'Ar': { nome: 'Argônio', inal: 'asfixiante', efe: 'Inerte e mais pesado que o ar: acumula em lugares baixos e causa asfixia.' },
  'Kr': { nome: 'Criptônio', inal: 'asfixiante', efe: 'Inerte; em concentração alta tem efeito narcótico (tonteira).' }, 'Xe': { nome: 'Xenônio', inal: 'asfixiante', efe: 'Funciona como anestésico em concentração alta; puro, tira o oxigênio.' },
  'Rn': { nome: 'Radônio', inal: 'radioativo', g: 3, org: ['pulmoes'], efe: 'Radioativo: as partículas que solta ficam presas nos pulmões. Exposição longa é a 2ª maior causa de câncer de pulmão.', fonte: 'EPA; OMS (radônio)' },
  'F': { nome: 'Flúor (gás F₂)', inal: 'corrosivo', g: 4, org: ['pulmoes', 'boca', 'pele'], efe: 'Extremamente corrosivo: queima os pulmões, a pele e os olhos; forma ácido fluorídrico nos tecidos.', fonte: 'CDC NIOSH (flúor)' },
  'Cl': { nome: 'Cloro (gás Cl₂)', inal: 'corrosivo', g: 4, org: ['pulmoes', 'boca'], efe: 'Ao tocar a umidade dos pulmões forma ácidos: tosse, falta de ar e edema pulmonar (os pulmões enchem de líquido).', fonte: 'CDC (cloro)' },
  'Br': { nome: 'Bromo', inal: 'corrosivo', g: 4, org: ['boca', 'estomago', 'pulmoes', 'pele'], efe: 'Líquido e vapor muito corrosivos: queimaduras graves na boca, no esôfago e nos pulmões.', fonte: 'CDC (bromo)' },
  'I': { nome: 'Iodo puro', g: 3, lim: [5, 15, 30], org: ['boca', 'estomago', 'tireoide'], efe: 'O iodo puro em grande quantidade é corrosivo para o estômago (vômito, dor, choque). Em quantidade mínima é essencial à tireoide.', fonte: 'NIH ODS; StatPearls (iodo)' },
  'Hg': { nome: 'Mercúrio líquido', g: 1, absorcao: 0.0001, org: ['intestino'], efe: 'Engolido, quase não é absorvido (~0,01%) e sai nas fezes. O perigo real é o VAPOR (aquecido ou derramado em casa), que é absorvido em ~80% pelos pulmões e ataca cérebro e rins.', fonte: 'ATSDR (mercúrio); UK HSA' },
  'P': { nome: 'Fósforo branco', g: 4, lim: [0.1, 1, 3], org: ['boca', 'estomago', 'figado', 'rins', 'coracao'], efe: 'Muito tóxico: queima o tubo digestivo, o vômito pode brilhar e soltar fumaça; dias depois, falência do fígado e dos rins.', fonte: 'CDC/ATSDR (fósforo branco)' },
  'Pvermelho': { nome: 'Fósforo vermelho', g: 1, org: ['estomago'], efe: 'Bem menos tóxico que o branco, pois quase não é absorvido; pode conter traços do branco.', fonte: 'ATSDR' },
  'As': { nome: 'Arsênio', g: 4, lim: [0.05, 0.5, 2], org: ['estomago', 'coracao', 'cerebro', 'pele'], efe: 'Vômito, diarreia intensa e arritmia; a longo prazo, câncer, lesões na pele e nos nervos.', fonte: 'ATSDR (arsênio); OMS' },
  'As2O3': { nome: 'Trióxido de arsênio', g: 4, elem: 'As', lim: [0.05, 0.5, 2], org: ['estomago', 'coracao', 'cerebro', 'pele'], efe: 'Foi o "pó da herança": vômito, diarreia com cólica, arritmia e choque. Hoje é usado, em doses controladas, como remédio contra um tipo de leucemia.', fonte: 'ATSDR (arsênio); NCBI' },
  'Se': { nome: 'Selênio', g: 2, lim: [0.006, 1, 5], absorcao: 0.5, org: ['pele', 'cerebro', 'estomago'], efe: 'Excesso causa selenose: hálito de alho, unhas e cabelos quebradiços, nervos afetados.', fonte: 'NIH ODS (selênio)' },
  'Sb': { nome: 'Antimônio', g: 3, lim: [0.1, 1, 5], absorcao: 0.1, org: ['estomago', 'coracao'], efe: 'Provoca vômito forte; em doses maiores, afeta o coração.', fonte: 'ATSDR (antimônio)' },
  'Te': { nome: 'Telúrio', g: 2, lim: [0.5, 5, 20], absorcao: 0.2, org: ['estomago', 'pele'], efe: 'Deixa um hálito de alho que dura semanas; náusea e sonolência.', fonte: 'NCBI (telúrio)' },
  'Be': { nome: 'Berílio', g: 3, lim: [0.1, 1, 5], absorcao: 0.01, org: ['pulmoes', 'pele'], efe: 'Pouco absorvido pelo intestino; o grande perigo é respirar a poeira (beriliose, câncer).', fonte: 'ATSDR (berílio)' },
  'Tl': { nome: 'Tálio', g: 4, elem: 'Tl+', absorcao: 1, org: ['cerebro', 'pele', 'coracao', 'estomago'], efe: 'Muito tóxico: dor nos nervos, queda de cabelo, problemas no coração.', fonte: 'CDC/ATSDR ToxFAQs (tálio)' },
  'Cd': { nome: 'Cádmio', elem: 'Cd2+', absorcao: 0.3 }, 'Pb': { nome: 'Chumbo', elem: 'Pb2+', absorcao: 0.3 }, 'Ba': { nome: 'Bário', elem: 'Ba2+', absorcao: 1 }, 'Ni': { nome: 'Níquel', elem: 'Ni2+', absorcao: 0.2 },
  'Co': { nome: 'Cobalto', elem: 'Co2+', absorcao: 0.3 }, 'Zn': { nome: 'Zinco', elem: 'Zn2+', absorcao: 0.4 }, 'Cu': { nome: 'Cobre', elem: 'Cu2+', absorcao: 0.02 }, 'Fe': { nome: 'Ferro', elem: 'Fe', absorcao: 0.3 }, 'Mn': { nome: 'Manganês', elem: 'Mn2+', absorcao: 0.2 },
  'Mg': { nome: 'Magnésio', elem: 'Mg2+', absorcao: 0.5 }, 'Al': { nome: 'Alumínio', elem: 'Al3+', absorcao: 0.05 }, 'Sn': { nome: 'Estanho', elem: 'Sn2+', absorcao: 0.05 }, 'Cr': { nome: 'Crômio metálico', g: 0, absorcao: 0.01 }, 'Ag': { nome: 'Prata metálica', elem: 'Ag+', absorcao: 0.02 },
  'C': { nome: 'Carbono', g: 0, efe: 'Grafite, diamante e carvão passam pelo intestino sem ser absorvidos. O carvão ativado é até usado no tratamento de algumas intoxicações.' },
  'Si': { nome: 'Silício', g: 0, efe: 'Inerte e não é absorvido.' }, 'Ti': { nome: 'Titânio', g: 0, efe: 'Inerte; usado em implantes.' }, 'Zr': { nome: 'Zircônio', g: 0, efe: 'Inerte.' }, 'Ta': { nome: 'Tântalo', g: 0, efe: 'Inerte; usado em implantes.' }, 'Nb': { nome: 'Nióbio', g: 0, efe: 'Pouco absorvido.' },
  'Au': { nome: 'Ouro metálico', g: 0, efe: 'Inerte: passa direto sem ser absorvido (é o corante alimentar E175, usado em doces de luxo).', fonte: 'EFSA (E175)' },
  'Pt': { nome: 'Platina metálica', g: 0, efe: 'O metal é inerte.' }, 'Ir': { nome: 'Irídio', g: 0, efe: 'Inerte.' }, 'Os': { nome: 'Ósmio', g: 1, efe: 'O metal é inerte, mas aquecido no ar forma OsO₄, muito tóxico para olhos e pulmões.' }, 'W': { nome: 'Tungstênio', g: 1, efe: 'Baixa toxicidade.' },
  'Bi': { nome: 'Bismuto', g: 1, efe: 'Baixa toxicidade (está em remédios para o estômago); pode escurecer a língua e as fezes.' }, 'Ga': { nome: 'Gálio', g: 1, efe: 'Baixa toxicidade.' }, 'In': { nome: 'Índio', g: 1, efe: 'Pouco absorvido.' }, 'Ge': { nome: 'Germânio', g: 1, efe: 'Pouco tóxico em dose única; suplementos de longo prazo danificaram rins.' },
  'S': { nome: 'Enxofre', g: 1, org: ['intestino'], efe: 'Baixa toxicidade: efeito laxante; no intestino uma parte vira gás sulfídrico (cheiro de ovo podre).' }, 'B': { nome: 'Boro', g: 1, efe: 'O boro elementar é pouco absorvido.' }, 'Sr': { nome: 'Estrôncio', elem: 'Sr2+', absorcao: 0.2 }, 'Ca': { nome: 'Cálcio', elem: 'Ca2+', absorcao: 0.3 },
  'Mo': { nome: 'Molibdênio', g: 1, efe: 'Baixa toxicidade (limite superior NIH: 2 mg/dia).' }, 'V': { nome: 'Vanádio', g: 2, efe: 'O metal é pouco absorvido; compostos de vanádio irritam o estômago.' },
  'U': { nome: 'Urânio', g: 3, radio: true, org: ['rins', 'ossos'], efe: 'Como metal pesado, danifica os rins; como radioativo (alfa), é perigoso principalmente se inalado.', fonte: 'ATSDR (urânio)' },
  'Th': { nome: 'Tório', g: 2, radio: true, org: ['ossos', 'figado'], efe: 'Pouco absorvido pelo intestino; o que entra fica nos ossos e no fígado e irradia por décadas.', fonte: 'ATSDR (tório)' },
  'Ra': { nome: 'Rádio', g: 4, radio: true, org: ['ossos', 'sangue'], efe: 'O corpo confunde o rádio com o cálcio e o coloca nos ossos: anemia, fraturas e câncer de osso.', fonte: 'EPA; caso das "radium girls"' },
  'Po': { nome: 'Polônio', g: 4, radio: true, org: ['sangue', 'figado', 'rins'], efe: 'Extremamente radiotóxico: quantidades invisíveis causam síndrome aguda da radiação.', fonte: 'CDC (polônio-210)' },
  'Pu': { nome: 'Plutônio', g: 4, radio: true, org: ['ossos', 'figado', 'pulmoes'], efe: 'Pouco absorvido pelo intestino, mas o que entra fica décadas nos ossos e no fígado emitindo radiação alfa.', fonte: 'ATSDR (plutônio)' },
  'radioativo': { nome: 'Elemento radioativo', g: 4, radio: true, org: ['sangue', 'ossos'], efe: 'Emite radiação dentro do corpo: dano às células e à medula óssea; risco de câncer.' },
  'lantanideo': { nome: 'Terras-raras', g: 1, efe: 'Pouco absorvidas pelo intestino; baixa a moderada toxicidade.' },
  'desconhecido': { nome: 'Sem dados confiáveis', g: 1, efe: 'Não há estudos suficientes sobre a ingestão desta substância.' },
  // compostos
  'CO2': { nome: 'Dióxido de carbono', inal: 'asfixiante', efe: 'Em bebidas é inofensivo (só arroto). Respirado em alta concentração causa falta de ar, dor de cabeça e desmaio.' },
  'CO': { nome: 'Monóxido de carbono', inal: 'toxico', g: 4, org: ['sangue', 'cerebro', 'coracao'], efe: 'Gruda na hemoglobina mais de 200 vezes mais forte que o oxigênio: dor de cabeça, desmaio e morte sem nenhum cheiro de aviso.', fonte: 'CDC (monóxido de carbono)' },
  'SO2': { nome: 'Dióxido de enxofre', inal: 'corrosivo', g: 3, org: ['pulmoes'], efe: 'Irrita fortemente os pulmões; perigoso para asmáticos.' },
  'SO3': { nome: 'Trióxido de enxofre', inal: 'corrosivo', g: 4, org: ['pulmoes', 'boca'], efe: 'Vira ácido sulfúrico ao tocar a umidade: queimaduras graves.' },
  'NO2': { nome: 'Óxidos de nitrogênio', inal: 'corrosivo', g: 3, org: ['pulmoes'], efe: 'Irritam os pulmões; o dano (edema) pode aparecer horas depois.' },
  'NH3': { nome: 'Amônia', inal: 'corrosivo', g: 3, org: ['pulmoes', 'boca'], efe: 'Cheiro forte; queima os olhos e as vias respiratórias.' },
  'HCl': { nome: 'Gás ácido', inal: 'corrosivo', g: 3, org: ['pulmoes', 'boca'], efe: 'Forma ácido nas vias respiratórias: tosse, queimadura e falta de ar.' },
  'HF': { nome: 'Ácido fluorídrico', g: 4, org: ['boca', 'estomago', 'coracao', 'ossos'], efe: 'Mesmo diluído, atravessa os tecidos e captura o cálcio do corpo: o coração pode parar. É um dos ácidos mais perigosos.', fonte: 'CDC (ácido fluorídrico); StatPearls' },
  'OsO4': { nome: 'Tetróxido de ósmio', inal: 'corrosivo', g: 4, org: ['pulmoes', 'boca'], efe: 'O vapor é muito tóxico para os olhos (pode cegar) e os pulmões.' },
  'asfixiante': { nome: 'Gás asfixiante', inal: 'asfixiante', efe: 'Toma o lugar do oxigênio.' },
  'corrosivo': { nome: 'Corrosivo', g: 4, org: ['boca', 'estomago'], efe: 'Reage com a água dos tecidos liberando calor e ácido.' },
  'acidoForte': { nome: 'Ácido concentrado', g: 4, org: ['boca', 'esofago', 'estomago'], efe: 'Ácidos concentrados queimam por coagulação: destroem a boca, o esôfago e o estômago; o estômago pode perfurar.' },
  'Etanol': { nome: 'Etanol', g: 2, lim: [300, 1000, 3000], org: ['cerebro', 'figado'], efe: 'Álcool: tontura, falta de coordenação e, em grande quantidade, coma alcoólico. (O álcool 70% de limpeza não é para beber.)', fonte: 'NIAAA/NIH' },
  'Sacarose': { nome: 'Açúcar', g: 0, efe: 'Energia (4 kcal/g). Sem toxicidade aguda.' },
  'H2O2': { nome: 'Peróxido de hidrogênio', efe: 'No corpo, a enzima catalase quebra o peróxido em água e oxigênio. A 3% costuma só irritar; concentrado queima as mucosas e o oxigênio liberado pode formar bolhas no sangue (embolia gasosa).', fonte: 'StatPearls (NBK585102); UKHSA; ATSDR' },
  'MnO4-': { nome: 'permanganato', lim: [1, 10, 50], org: ['boca', 'esofago', 'estomago', 'sangue', 'figado', 'rins'], efe: 'Oxidante forte: queima a boca e o esôfago (pode inchar a laringe) e, absorvido, pode causar metemoglobinemia (o sangue carrega menos oxigênio) e lesão no fígado e nos rins.', fonte: 'Relatos de caso (PMC4413422, PMC4129898); faixas aproximadas' },
  'Glicerina': { nome: 'Glicerina', g: 0, efe: 'Pouco tóxica: é usada em alimentos e xaropes. Em grande quantidade funciona como laxante.', fonte: 'PubChem (glicerol)' },
  'Acetona': { nome: 'Acetona', g: 2, org: ['estomago', 'cerebro'], efe: 'Irrita a boca e o estômago; absorvida, dá sonolência e tontura, como uma bebida muito forte. Em grande quantidade pode levar ao coma. O vapor irrita olhos e nariz.', fonte: 'ATSDR ToxFAQs (acetona)' },
  'Fenolftaleina': { nome: 'Fenolftaleína', g: 1, org: ['intestino'], efe: 'Já foi vendida como laxante, mas saiu do mercado nos EUA em 1999 por suspeita de causar câncer em testes com animais. A de laboratório vem dissolvida em álcool.', fonte: 'FDA (1999)' },
  'RepolhoRoxo': { nome: 'Extrato de repolho roxo', g: 0, efe: 'É só suco de repolho: comestível.' },
  'Amido': { nome: 'Amido', g: 0, efe: 'É o carboidrato do pão, do arroz e da batata (4 kcal/g). Sem toxicidade.' },
  'AmidoIodo': { nome: 'Amido com iodo', g: 1, org: ['tireoide'], efe: 'Contém iodo: em pouca quantidade não faz mal; muito iodo de uma vez irrita o estômago e mexe com a tireoide.', fonte: 'NIH ODS (iodo)' },
  'Detergente': { nome: 'Detergente', g: 1, org: ['boca', 'estomago', 'intestino'], efe: 'Irrita a boca e o estômago e dá vômito e diarreia; se a pessoa vomitar, a espuma pode ir para os pulmões. O de lava-louças comum costuma ser leve; as cápsulas de lava-roupa (concentradas) são bem mais perigosas.', fonte: 'StatPearls (detergentes e surfactantes)' },
  'Sabao': { nome: 'Sabão', g: 1, org: ['boca', 'estomago', 'intestino'], efe: 'Gosto ruim, irritação, náusea e diarreia. Raramente é grave.', fonte: 'StatPearls (detergentes e surfactantes)' },
  'Oleo': { nome: 'Óleo de cozinha', g: 0, efe: 'É alimento (9 kcal/g). O perigo é ir para o pulmão (engasgar), não a toxicidade.' },
  'Leite': { nome: 'Leite', g: 0, efe: 'Alimento. (Leite não "neutraliza" venenos: não dê leite em caso de intoxicação sem orientação.)', fonte: 'Anvisa / Disque-Intoxicação' },
  'Parafina': { nome: 'Parafina', g: 1, org: ['intestino'], efe: 'Quase não é absorvida pelo intestino; em grande quantidade pode prender o intestino.', fonte: 'PubChem (parafina)' },
  'PalhaAco': { nome: 'Palha de aço', g: 2, org: ['boca', 'esofago', 'intestino'], efe: 'O perigo é mecânico: os fios de aço cortam a boca, o esôfago e o intestino.', fonte: 'Relatos de caso (corpo estranho)' },
  'AguaTorneira': { nome: 'Água da torneira', g: 0, efe: 'Água potável: tem um pouco de cálcio, magnésio, cloro residual (desinfecção) e flúor (contra cáries).', fonte: 'Ministério da Saúde (potabilidade)' },
};
/* Nutrientes: limite superior tolerável de ingestão diária para adultos (NIH ODS / Academias Nacionais dos EUA), em mg */
const UL = { Na: 2300, Ca: 2500, Mg: 350, Fe: 45, Zn: 40, Cu: 10, Mn: 11, Se: 0.4, I: 1.1, F: 10, Mo: 2, B: 20, Ni: 1, P: 4000 };
const ESSENCIAL = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Zn', 'Cu', 'Mn', 'Se', 'I', 'Mo', 'Co', 'Cr', 'F'];

const FONTES = [
  ['PubChem Periodic Table (NIH/NCBI)', 'https://pubchem.ncbi.nlm.nih.gov/periodic-table/'],
  ['Hardnesses of the elements (data page) — Samsonov, 1968', 'https://en.wikipedia.org/wiki/Hardnesses_of_the_elements_(data_page)'],
  ['Heat capacities of the elements (data page) — CRC Handbook', 'https://en.wikipedia.org/wiki/Heat_capacities_of_the_elements_(data_page)'],
  ['ATSDR ToxFAQs (CDC) — mercúrio, tálio, chumbo, cádmio e outros', 'https://wwwn.cdc.gov/TSP/ToxFAQs/ToxFAQsLanding.aspx'],
  ['UK Health Security Agency — mercúrio elementar e inorgânico', 'https://www.gov.uk/government/publications/mercury-properties-incident-management-and-toxicology/elemental-mercury-and-inorganic-mercury-toxicological-overview'],
  ['StatPearls (NIH) — ingestão de cáusticos, queimaduras químicas', 'https://www.ncbi.nlm.nih.gov/books/NBK499888/'],
  ['Manual MSD — ingestão de cáusticos', 'https://www.msdmanuals.com/professional/injuries-poisoning/poisoning/caustic-ingestion'],
  ['CDC — bário (Medical Management Guidelines)', 'https://wwwn.cdc.gov/TSP/MMG/MMGDetails.aspx?mmgid=321&toxid=57'],
  ['NCBI Bookshelf — toxicidade do bário', 'https://www.ncbi.nlm.nih.gov/books/NBK598777'],
  ['Perfuração gástrica por nitrogênio líquido (relato de caso, PMC)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12103062/'],
  ['NIH Office of Dietary Supplements — limites superiores (UL)', 'https://ods.od.nih.gov/'],
  ['StatPearls (NIH) — toxicidade do peróxido de hidrogênio', 'https://www.ncbi.nlm.nih.gov/books/NBK585102/'],
  ['UK Health Security Agency — peróxido de hidrogênio', 'https://www.gov.uk/government/publications/hydrogen-peroxide-properties-incident-management-and-toxicology/hydrogen-peroxide-toxicological-overview'],
  ['ATSDR/CDC — peróxido de hidrogênio (Medical Management Guidelines)', 'https://wwwn.cdc.gov/TSP/ToxFAQs/ToxFAQsDetails.aspx?faqid=304&toxid=55'],
  ['Ingestão de permanganato de potássio (relatos de caso, PMC)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4413422'],
  ['ATSDR ToxFAQs — acetona', 'https://wwwn.cdc.gov/TSP/ToxFAQs/ToxFAQsDetails.aspx?faqid=4&toxid=1'],
  ['Anvisa — Disque-Intoxicação 0800 722 6001', 'https://www.gov.br/anvisa/'],
];
