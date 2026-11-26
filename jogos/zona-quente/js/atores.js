/* =========================================================================
   ZONA QUENTE · atores (jogador e bots)
   Movimento com colisão, zonas de acerto (cabeça, tronco, pernas), colete,
   e a IA dos bots: percepção por linha de visão (a fumaça bloqueia),
   audição dos tiros, tempo de reação, mira que melhora com o tempo,
   rajadas, cobertura quando as balas passam perto, granadas, curativos e
   ida à loja de munição quando a munição acaba.
   ========================================================================= */
import * as THREE from 'three';
import { ARMAS, CLASSES, modeloArma } from './armas.js?v=1.2.0';
import { caixasPerto, chaoEm, alturaTerreno, visivel, noMaisPerto, caminho, NAV, LADOS, UNIDADES, MX, MZ, PONTOS, LOJAS, SPAWNS } from './mapa.js?v=1.2.0';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const RAIO = 0.32, PASSO_SUBIR = 0.55, OLHO = 1.62, OLHO_AGACHADO = 1.12;
const NOMES = ['Biel', 'Jow', 'Kaká', 'Tico', 'Rato', 'Dinho', 'Pardal', 'Faísca', 'Fumaça', 'Coruja', 'Zóio', 'Magrão', 'Cabeça', 'Pernambuco', 'Baixinho', 'Galego', 'Tuta', 'Bigode', 'Sombra', 'Vovô', 'Piu', 'Léo', 'Jacaré', 'Pipoca'];
function nomeLivre(J, lista) { const usados = new Set(J.atores.map(a => a.nome)), livres = lista.filter(n => !usados.has(n)); if (livres.length) return livres[(Math.random() * livres.length) | 0]; const base = lista[(Math.random() * lista.length) | 0]; let k = 2; while (usados.has(base + ' ' + k)) k++; return base + ' ' + k; }
const NOMES_POL = ['Sgt. Ramos', 'Cb. Lima', 'Sd. Souza', 'Ten. Duarte', 'Sgt. Alves', 'Cb. Nunes', 'Sd. Pires', 'Cap. Moura', 'Sd. Teles', 'Sgt. Brito', 'Cb. Vidal', 'Sd. Paiva', 'Ten. Gusmão', 'Sd. Araújo'];
let proxId = 1;
export function lado(a) { return LADOS[a.lado]; }
export const inimigos = (a, b) => a.lado !== b.lado; // facções brigam entre si e com a polícia; as três polícias são um lado só

/* ---------- boneco ---------- */
const PELES = [0x8d5524, 0xc68642, 0xe0ac69, 0x6b3f22, 0xf1c27d, 0x4a2c17];
const CAMISAS = ['#e63946', '#f1faee', '#2a9d8f', '#264653', '#e9c46a', '#1d3557', '#8d99ae', '#ff7b00', '#3a5a40', '#000000'];
function boneco(a) {
  const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: c });
  const pele = M(PELES[(Math.random() * PELES.length) | 0]), corLado = new THREE.Color(LADOS[a.lado].cor);
  let roupa, calca, detalhe;
  if (a.lado === 3) { const u = UNIDADES.find(u => u.id === a.unidade); roupa = M(u.farda); calca = M(u.farda); detalhe = M(u.detalhe); }
  else { roupa = M(CAMISAS[(Math.random() * CAMISAS.length) | 0]); calca = M(Math.random() < 0.5 ? 0x34495e : 0x2c2c2c); detalhe = M(corLado); }
  const quadril = new THREE.Group(); quadril.position.y = 0.92; g.add(quadril);
  const pernas = [];
  for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.11, 0, 0); const coxa = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.48, 0.17), calca); coxa.position.y = -0.24; const bota = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.16), a.lado === 3 ? M(0x111111) : calca); bota.position.y = -0.68; p.add(coxa, bota); quadril.add(p); pernas.push(p); }
  const tronco = new THREE.Group(); quadril.add(tronco);
  const peito = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), roupa); peito.position.y = 0.3; tronco.add(peito);
  if (a.lado === 3) { const colete = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.3), detalhe); colete.position.y = 0.32; tronco.add(colete); }
  else { const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.07, 0.25), detalhe); faixa.position.y = 0.05; tronco.add(faixa); }
  const cab = new THREE.Group(); cab.position.y = 0.7; tronco.add(cab);
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), pele); cab.add(cabeca);
  if (a.lado === 3) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), M(0x1a1a1a)); cap.position.y = 0.03; cab.add(cap); }
  else { const band = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.12, 0.27), detalhe); band.position.set(0, -0.06, 0.01); cab.add(band); if (Math.random() < 0.5) { const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.07, 10), detalhe); bone.position.y = 0.09; cab.add(bone); const aba = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.14), detalhe); aba.position.set(0, 0.07, -0.13); cab.add(aba); } }
  const bracos = new THREE.Group(); bracos.position.set(0, 0.48, 0); tronco.add(bracos);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.42), roupa); b.position.set(s * 0.16, -0.05, -0.18); b.rotation.y = -s * 0.25; bracos.add(b); const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), pele); m.position.set(s * 0.08, -0.06, -0.4); bracos.add(m); }
  const suporte = new THREE.Group(); suporte.position.set(0.05, -0.04, -0.38); bracos.add(suporte);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, quadril, pernas, tronco, cab, bracos, suporte, arma: null };
}
function porArmaNoBoneco(a) {
  const p = a.partes; if (p.arma) p.suporte.remove(p.arma.g);
  p.arma = modeloArma(a.armas[a.atual].def.id); p.arma.g.scale.setScalar(1.15); p.suporte.add(p.arma.g);
}

/* ---------- criação ---------- */
export function criarAtor(J, ladoId, unidade, classeId, bot = true, nome) {
  const lista = ladoId === 3 ? CLASSES[unidade] : CLASSES.faccao;
  const classe = lista.find(c => c.id === classeId) || lista[(Math.random() * lista.length) | 0];
  const a = {
    id: proxId++, bot, lado: ladoId, unidade: ladoId === 3 ? unidade : null, classe: classe.id,
    nome: nome || nomeLivre(J, ladoId === 3 ? NOMES_POL : NOMES),
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, noChao: false, agachado: false, correndo: false, ads: 0, inclinar: 0,
    vida: 100, colete: 0, vivo: false, respawn: 0, mortes: 0, abates: 0, armas: [], atual: 0, granadas: { frag: 2, fumaca: 1 }, curativos: 2,
    cad: 0, recarregando: 0, trocando: 0, ferrolho: 0, rajada: 0, modo: 0, ultimoDano: -99, curando: 0, folego: 1, passoT: 0, veiculo: null,
    // IA
    estado: 'objetivo', alvo: null, vistoEm: -99, ultimaPos: null, reacao: 0, erro: 1, supressao: 0, caminho: null, idxCam: 0, tPensar: Math.random() * 0.3, tCaminho: 0, objetivo: null, presoT: 0, ultPos: new THREE.Vector3(), rajadaRest: 0, pausaRajada: 0, strafe: 0, tStrafe: 0, investigar: null,
  };
  a.altura = 1.8;
  equipar(a, classe);
  a.partes = boneco(a); a.mesh = a.partes.g; J.cena.add(a.mesh);
  porArmaNoBoneco(a);
  return a;
}
export function equipar(a, classe) {
  a.classe = classe.id;
  a.armas = classe.armas.map(id => ({ def: ARMAS[id], pente: ARMAS[id].pente, reserva: ARMAS[id].reserva }));
  a.atual = 0; a.granadas = { frag: 2, fumaca: 1 }; a.curativos = a.unidade === 'PCM' ? 4 : 2;
  a.coleteMax = a.lado === 3 ? (a.unidade === 'EXANTF' ? 100 : 75) : 30;
}
export function nascer(J, a, onde) {
  const lista = onde || SPAWNS[a.lado]; const s = lista[(Math.random() * lista.length) | 0];
  const x = s[0] + (Math.random() - 0.5) * 3, z = s[1] + (Math.random() - 0.5) * 3;
  a.pos.set(x, chaoEm(x, z, 999) + 0.05, z); a.vel.set(0, 0, 0);
  a.vida = 100; a.colete = a.coleteMax; a.vivo = true; a.mesh.visible = true; a.mesh.rotation.set(0, 0, 0);
  for (const w of a.armas) { w.pente = w.def.pente; w.reserva = w.def.reserva; }
  a.granadas = { frag: 2, fumaca: 1 }; a.curativos = a.unidade === 'PCM' ? 4 : 2; a.recarregando = 0; a.trocando = 0; a.alvo = null; a.caminho = null; a.estado = 'objetivo'; a.supressao = 0; a.curando = 0; a.agachado = false;
  a.yaw = Math.atan2(-(0 - x), -(0 - z)); a.pitch = 0; a.atual = 0; porArmaNoBoneco(a);
  if (a.veiculo) a.veiculo = null;
}

/* ---------- movimento com colisão ---------- */
export function moverAtor(a, dt) {
  const h = a.agachado ? 1.25 : 1.8; a.altura = h;
  a.vel.y -= 9.81 * dt;
  const vh = Math.hypot(a.vel.x, a.vel.z), n = Math.max(1, Math.ceil(vh * dt / 0.22));
  for (let k = 0; k < n; k++) { a.pos.x += a.vel.x * dt / n; a.pos.z += a.vel.z * dt / n; empurrar(a, h); }
  a.pos.y += a.vel.y * dt;
  // teto
  if (a.vel.y > 0) caixasPerto(a.pos.x, a.pos.z, RAIO + 0.3, b => { if (b.vidro !== undefined) return; if (a.pos.x + RAIO > b.x0 && a.pos.x - RAIO < b.x1 && a.pos.z + RAIO > b.z0 && a.pos.z - RAIO < b.z1 && b.y0 > a.pos.y && b.y0 < a.pos.y + h) { a.vel.y = 0; a.pos.y = b.y0 - h; } });
  const chao = chaoEm(a.pos.x, a.pos.z, a.pos.y, RAIO * 0.7, a.noChao ? PASSO_SUBIR : 0.15);
  if (a.pos.y <= chao + 0.02) {
    if (!a.noChao && a.vel.y < -10) a.quedaDano = (-a.vel.y - 10) * 9; // queda de mais de ~5 m machuca
    a.pos.y = chao; a.vel.y = 0; a.noChao = true;
  } else if (a.noChao && a.pos.y - chao < 0.45 && a.vel.y <= 0) { a.pos.y = chao; a.vel.y = 0; } // descendo escada/ladeira: gruda no chão
  else a.noChao = false;
  a.pos.x = clamp(a.pos.x, -MX + 6, MX - 6); a.pos.z = clamp(a.pos.z, -MZ + 6, MZ - 6);
}
function empurrar(a, h) {
  caixasPerto(a.pos.x, a.pos.z, RAIO + 0.8, b => {
    if (b.vidro !== undefined) return;
    if (a.pos.y + h <= b.y0 + 0.02 || a.pos.y >= b.y1 - 0.02) return;
    if (b.y1 - a.pos.y <= PASSO_SUBIR && a.noChao) return; // degrau: sobe
    const cx = clamp(a.pos.x, b.x0, b.x1), cz = clamp(a.pos.z, b.z0, b.z1); let dx = a.pos.x - cx, dz = a.pos.z - cz; const d = Math.hypot(dx, dz);
    if (d >= RAIO) return;
    if (d < 1e-5) { const e = [a.pos.x - b.x0, b.x1 - a.pos.x, a.pos.z - b.z0, b.z1 - a.pos.z], m = Math.min(...e), k = e.indexOf(m); if (k === 0) a.pos.x = b.x0 - RAIO; else if (k === 1) a.pos.x = b.x1 + RAIO; else if (k === 2) a.pos.z = b.z0 - RAIO; else a.pos.z = b.z1 + RAIO; }
    else { const f = (RAIO - d) / d; a.pos.x += dx * f; a.pos.z += dz * f; }
  });
}
export function olho(a, out = new THREE.Vector3()) { return out.set(a.pos.x, a.pos.y + (a.agachado ? OLHO_AGACHADO : OLHO), a.pos.z); }
export function direcaoOlhar(a, out = new THREE.Vector3()) { const cp = Math.cos(a.pitch); return out.set(-Math.sin(a.yaw) * cp, Math.sin(a.pitch), -Math.cos(a.yaw) * cp); }

/* ---------- zonas de acerto ---------- */
// cabeça (esfera), tronco e pernas (cápsulas). Devolve { t, zona }
export function raioAtor(a, o, d, max) {
  if (!a.vivo || a.veiculo) return null;
  const ag = a.agachado, y = a.pos.y;
  const cab = { x: a.pos.x, y: y + (ag ? 1.17 : 1.66), z: a.pos.z };
  // teste rápido: esfera que envolve o corpo
  const cx = a.pos.x - o.x, cy = y + 0.9 - o.y, cz = a.pos.z - o.z, tc = cx * d.x + cy * d.y + cz * d.z;
  if (tc < -1.2 || tc > max + 1.2) return null; const dd = cx * cx + cy * cy + cz * cz - tc * tc; if (dd > 1.3) return null;
  let melhor = null;
  const esfera = (c, r, zona) => { const lx = c.x - o.x, ly = c.y - o.y, lz = c.z - o.z, t = lx * d.x + ly * d.y + lz * d.z; const q = lx * lx + ly * ly + lz * lz - t * t; if (q > r * r) return; const th = t - Math.sqrt(r * r - q); if (th > 0 && th < max && (!melhor || th < melhor.t)) melhor = { t: th, zona }; };
  const capsula = (y0, y1, r, zona) => { for (let k = 0; k <= 3; k++) esfera({ x: a.pos.x, y: y0 + (y1 - y0) * k / 3, z: a.pos.z }, r, zona); };
  esfera(cab, 0.14, 'cabeca');
  if (ag) { capsula(y + 0.62, y + 1.0, 0.25, 'tronco'); capsula(y + 0.12, y + 0.5, 0.2, 'pernas'); }
  else { capsula(y + 0.98, y + 1.46, 0.25, 'tronco'); capsula(y + 0.12, y + 0.88, 0.17, 'pernas'); }
  return melhor;
}

/* ---------- animação do boneco ---------- */
export function animarBoneco(a, dt, t) {
  const p = a.partes; if (!p) return;
  if (!a.vivo) { return; }
  a.mesh.position.copy(a.pos); a.mesh.rotation.set(0, a.yaw, 0);
  const vh = Math.hypot(a.vel.x, a.vel.z); a.fase = (a.fase || 0) + vh * dt * 2.2;
  const amp = Math.min(0.7, vh * 0.13);
  p.pernas[0].rotation.x = Math.sin(a.fase) * amp; p.pernas[1].rotation.x = -Math.sin(a.fase) * amp;
  p.quadril.position.y = a.agachado ? 0.55 : 0.92; p.tronco.rotation.x = a.agachado ? 0.15 : 0;
  if (a.agachado) { p.pernas[0].rotation.x -= 1.0; p.pernas[1].rotation.x -= 1.0; }
  p.bracos.rotation.x = a.pitch * 0.9 + (a.recarregando > 0 ? -0.6 : 0) + (a.correndo ? -0.5 : 0);
  p.cab.rotation.x = a.pitch * 0.5;
}
export function animarMorte(a, dt) { if (a.vivo || !a.mesh.visible) return; a.morteT = (a.morteT || 0) + dt; const k = Math.min(1, a.morteT * 2.2); a.mesh.rotation.x = -k * Math.PI / 2 * (a.caiDir || 1); a.mesh.position.y = a.pos.y + 0.15 * k; if (a.morteT > 12) a.mesh.visible = false; }

/* =========================================================================
   IA
   ========================================================================= */
const DIF = [ // reação (s), erro inicial (graus), melhora da mira por s, visão (m)
  { reacao: [0.55, 1.1], erro: 9, melhora: 0.75, visao: 95 },
  { reacao: [0.32, 0.7], erro: 6, melhora: 0.85, visao: 130 },
  { reacao: [0.18, 0.42], erro: 4, melhora: 0.92, visao: 170 },
];
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
function municaoBaixa(a) { const w = a.armas[0]; return (w.pente + w.reserva) < w.def.pente * 1.2; }
function fumacaNoMeio(J, o, p) {
  for (const f of J.fumacas) { if (f.t < 2) continue; const r = Math.min(7, f.t * 1.6); const dx = p.x - o.x, dy = p.y - o.y, dz = p.z - o.z, L = Math.hypot(dx, dy, dz); const t = clamp(((f.x - o.x) * dx + (f.y - o.y) * dy + (f.z - o.z) * dz) / (L * L), 0, 1); const q = Math.hypot(o.x + dx * t - f.x, o.y + dy * t - f.y, o.z + dz * t - f.z); if (q < r) return true; }
  return false;
}
function podeVer(J, a, b, dif) {
  const e = olho(a, v1), alvo = v2.set(b.pos.x, b.pos.y + (b.agachado ? 0.95 : 1.4), b.pos.z);
  const dx = alvo.x - e.x, dz = alvo.z - e.z, d = Math.hypot(dx, dz);
  if (d > dif.visao * (b.agachado ? 0.8 : 1)) return false;
  if (d > 7) { const ang = Math.atan2(-dx, -dz), dif2 = Math.abs(((ang - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (dif2 > 1.15 && a.estado !== 'combate') return false; }
  if (fumacaNoMeio(J, e, alvo)) return false;
  return visivel(e, alvo, false);
}
function irPara(J, a, x, z) {
  const de = noMaisPerto(a.pos.x, a.pos.z), para = noMaisPerto(x, z);
  a.caminho = caminho(de, para, 3500); a.idxCam = 0; a.tCaminho = 0;
  if (!a.caminho) a.caminho = [para].filter(i => i >= 0);
}
function escolherObjetivo(J, a) {
  // pontos que não são do lado valem mais; alguns ficam defendendo o que já têm
  const op = PONTOS.map(p => { const d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z); let peso = 1 / (40 + d); if (p.dono !== a.lado) peso *= 2.6; else if (p.quem !== a.lado && p.quem !== -1) peso *= 3; else peso *= 0.6; return [p, peso * (0.6 + Math.random())]; });
  op.sort((x, y) => y[1] - x[1]); const p = op[0][0];
  a.objetivo = { x: p.x + (Math.random() - 0.5) * p.r * 1.2, z: p.z + (Math.random() - 0.5) * p.r * 1.2, ponto: p };
  irPara(J, a, a.objetivo.x, a.objetivo.z);
}
function lojaMaisPerto(a) { let m = null, md = 1e9; for (const l of LOJAS) { if (l.lado !== a.lado && l.lado !== -1) continue; const d = Math.hypot(l.x - a.pos.x, l.z - a.pos.z); if (d < md) { md = d; m = l; } } return m; }
export function pensarBot(J, a, dt) {
  if (!a.vivo || a.veiculo) return;
  const dif = DIF[J.dif];
  a.supressao = Math.max(0, a.supressao - dt * 0.5);
  a.tPensar -= dt;
  if (a.tPensar <= 0) {
    a.tPensar = 0.18 + Math.random() * 0.1;
    // percepção: os três inimigos mais perto
    let melhor = null, md = 1e9;
    const cands = [];
    for (const b of J.atores) { if (!b.vivo || !inimigos(a, b)) continue; const d = (b.pos.x - a.pos.x) ** 2 + (b.pos.z - a.pos.z) ** 2; if (d < 190 * 190) cands.push([d, b]); }
    cands.sort((x, y) => x[0] - y[0]);
    for (let k = 0; k < Math.min(4, cands.length); k++) { const b = cands[k][1]; const alvoVeic = b.veiculo; if (alvoVeic) { if (visivel(olho(a, v1), v2.set(alvoVeic.pos.x, alvoVeic.pos.y + 1.2, alvoVeic.pos.z), false) && cands[k][0] < dif.visao ** 2) { melhor = b; md = cands[k][0]; break; } continue; } if (podeVer(J, a, b, dif)) { melhor = b; md = cands[k][0]; break; } }
    if (melhor) {
      if (a.alvo !== melhor) { a.alvo = melhor; a.reacao = dif.reacao[0] + Math.random() * (dif.reacao[1] - dif.reacao[0]); a.erro = dif.erro * (1 + Math.sqrt(md) / 60); }
      a.vistoEm = J.tempo; a.ultimaPos = melhor.pos.clone(); a.estado = 'combate';
      // granada no meio do tiroteio (de vez em quando, a média distância)
      { const dg = Math.sqrt(md); if (a.granadas.frag > 0 && dg > 12 && dg < 34 && J.tempo - (a.granadaT || -99) > 20 && Math.random() < 0.03) { a.granadaT = J.tempo; J.lancarGranada(a, 'frag', melhor.pos.clone()); } }
    } else if (a.estado === 'combate' && J.tempo - a.vistoEm > 1.2) {
      // perdeu de vista: granada se estava perto, senão vai até onde viu por último
      if (a.ultimaPos && a.granadas.frag > 0 && Math.random() < 0.5 && a.pos.distanceTo(a.ultimaPos) < 36 && a.pos.distanceTo(a.ultimaPos) > 8) J.lancarGranada(a, 'frag', a.ultimaPos.clone());
      a.estado = 'cacar'; a.alvo = null; if (a.ultimaPos) irPara(J, a, a.ultimaPos.x, a.ultimaPos.z);
    }
    // ouviu tiro perto: vai ver
    if (a.estado !== 'combate' && a.estado !== 'municiar') { for (const s of J.sonsRecentes) { if (s.lado === a.lado) continue; const d = Math.hypot(s.x - a.pos.x, s.z - a.pos.z); if (d < 70 && d > 6 && Math.random() < 0.25) { a.estado = 'cacar'; a.yaw = Math.atan2(-(s.x - a.pos.x), -(s.z - a.pos.z)); irPara(J, a, s.x, s.z); break; } } }
    if (a.estado === 'cacar' && J.tempo - a.vistoEm > 12) a.estado = 'objetivo';
    // munição acabando: loja (de graça)
    if (a.estado !== 'combate' && municaoBaixa(a) && a.estado !== 'municiar') { const l = lojaMaisPerto(a); if (l) { a.estado = 'municiar'; a.loja = l; irPara(J, a, l.x, l.z); } }
    if (a.estado === 'municiar' && a.loja && Math.hypot(a.loja.x - a.pos.x, a.loja.z - a.pos.z) < 4) { J.reabastecer(a); a.estado = 'objetivo'; a.loja = null; }
    // ferido e sem inimigo à vista: curativo
    if (a.estado !== 'combate' && a.vida < 55 && a.curativos > 0 && a.curando <= 0 && J.tempo - a.ultimoDano > 3) { a.curando = 3.2; }
    if (a.estado === 'objetivo' && (!a.caminho || a.idxCam >= a.caminho.length || !a.objetivo)) escolherObjetivo(J, a);
    if (a.estado === 'objetivo' && a.objetivo && a.objetivo.ponto.dono === a.lado && a.objetivo.ponto.quem === a.lado && Math.random() < 0.04) escolherObjetivo(J, a);
  }
  // ---------- execução ----------
  let querX = 0, querZ = 0, velAlvo = 4.0;
  a.correndo = false;
  if (a.curando > 0) { a.curando -= dt; a.agachado = true; if (a.curando <= 0 && a.curativos > 0) { a.curativos--; a.vida = Math.min(100, a.vida + 45); } }
  if (a.estado === 'combate' && a.alvo && a.alvo.vivo) {
    const b = a.alvo, alvoP = b.veiculo ? v2.set(b.veiculo.pos.x, b.veiculo.pos.y + 1.1, b.veiculo.pos.z) : v2.set(b.pos.x, b.pos.y + (b.agachado ? 0.85 : 1.3), b.pos.z);
    const e = olho(a, v1), dx = alvoP.x - e.x, dy = alvoP.y - e.y, dz = alvoP.z - e.z, d = Math.hypot(dx, dz);
    const yawAlvo = Math.atan2(-dx, -dz), pitchAlvo = Math.atan2(dy, d);
    // vira para o alvo (rápido, mas não instantâneo)
    let dyaw = ((yawAlvo - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.yaw += clamp(dyaw, -6 * dt, 6 * dt); a.pitch += clamp(pitchAlvo - a.pitch, -4 * dt, 4 * dt);
    a.reacao -= dt;
    // a mira melhora enquanto acompanha o alvo; piora com supressão e com o alvo correndo
    const velAlvoMov = Math.hypot(b.vel.x, b.vel.z);
    a.erro = Math.max(0.35, a.erro * Math.pow(dif.melhora, dt * 4)) ;
    const errAtual = (a.erro + a.supressao * 4 + velAlvoMov * 0.5) * Math.PI / 180;
    a.mira = { yaw: yawAlvo + (Math.random() - 0.5) * 2 * errAtual, pitch: pitchAlvo + (Math.random() - 0.5) * 2 * errAtual * 0.7 };
    const w = a.armas[a.atual];
    // troca para a pistola se a principal acabou e o inimigo está perto
    if (w.pente === 0 && w.reserva === 0 && a.atual === 0 && a.armas[1].pente + a.armas[1].reserva > 0) J.trocarArma(a, 1);
    if (w.pente === 0 && a.recarregando <= 0 && w.reserva > 0) J.recarregar(a);
    if (a.reacao <= 0 && Math.abs(dyaw) < 0.15 && a.recarregando <= 0 && a.trocando <= 0 && a.curando <= 0) {
      const alcance = w.def.tipo === 'escopeta' ? 30 : w.def.tipo === 'pistola' ? 60 : w.def.tipo === 'smg' ? 75 : 200;
      if (d < alcance) {
        if (a.pausaRajada > 0) a.pausaRajada -= dt;
        else if (J.podeAtirar(a)) { J.disparar(a, a.mira); a.rajadaRest--; if (a.rajadaRest <= 0) { a.rajadaRest = w.def.modos[0] === 'auto' ? 3 + ((Math.random() * (d < 25 ? 8 : 4)) | 0) : 1; a.pausaRajada = w.def.modos[0] === 'auto' ? 0.15 + Math.random() * 0.4 + d / 200 : 0.25 + Math.random() * 0.5 + (w.def.tipo === 'precisao' ? 0.8 : 0); } }
      }
    }
    // movimento em combate: anda de lado, agacha de longe, procura cobertura se estiver tomando tiro
    a.tStrafe -= dt; if (a.tStrafe <= 0) { a.tStrafe = 0.6 + Math.random() * 1.4; a.strafe = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); a.agachado = d > 25 && Math.random() < 0.55 && w.def.tipo !== 'escopeta'; }
    if (a.supressao > 0.6 && Math.random() < dt * 0.8) { a.agachado = true; }
    const lx = Math.cos(a.yaw), lz = -Math.sin(a.yaw);
    querX = lx * a.strafe; querZ = lz * a.strafe; velAlvo = a.agachado ? 1.6 : 3.2;
    if (w.def.tipo === 'escopeta' || w.def.tipo === 'smg') { if (d > 14) { querX += -Math.sin(a.yaw); querZ += -Math.cos(a.yaw); } }
    else if (d < 6) { querX -= -Math.sin(a.yaw); querZ -= -Math.cos(a.yaw); }
  } else {
    if (a.alvo && !a.alvo.vivo) { a.alvo = null; a.estado = 'objetivo'; }
    // segue o caminho
    if (a.caminho && a.idxCam < a.caminho.length) {
      const n = NAV.nos[a.caminho[a.idxCam]], dx = n.x - a.pos.x, dz = n.z - a.pos.z, d = Math.hypot(dx, dz);
      if (d < 2.2) a.idxCam++;
      else { querX = dx / d; querZ = dz / d; const yawAlvo = Math.atan2(-dx, -dz), dyaw = ((yawAlvo - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.yaw += clamp(dyaw, -4 * dt, 4 * dt); a.pitch *= 0.9; }
      a.correndo = a.estado === 'municiar' || (a.estado === 'objetivo' && d > 30 && a.folego > 0.3);
      velAlvo = a.correndo ? 6.0 : 4.2; a.agachado = false;
      // preso? tenta pular ou recalcula
      a.tCaminho += dt; if (a.tCaminho > 1.5) { if (a.pos.distanceTo(a.ultPos) < 1) { if (a.noChao) a.vel.y = 4.6; a.presoT++; if (a.presoT > 2) { a.presoT = 0; a.caminho = null; } } a.ultPos.copy(a.pos); a.tCaminho = 0; }
    }
    if (a.armas[a.atual].pente < a.armas[a.atual].def.pente * 0.5 && a.armas[a.atual].reserva > 0 && a.recarregando <= 0) J.recarregar(a);
  }
  if (a.curando > 0) { querX = querZ = 0; }
  const ql = Math.hypot(querX, querZ); if (ql > 1) { querX /= ql; querZ /= ql; }
  const ac = a.noChao ? 10 : 2;
  a.vel.x += (querX * velAlvo - a.vel.x) * Math.min(1, ac * dt); a.vel.z += (querZ * velAlvo - a.vel.z) * Math.min(1, ac * dt);
  a.folego = clamp(a.folego + (a.correndo ? -0.12 : 0.18) * dt, 0, 1);
}
export function avisoBalaPerto(a, forca) { a.supressao = Math.min(2, a.supressao + forca); }
