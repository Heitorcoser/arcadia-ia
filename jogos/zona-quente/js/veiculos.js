/* =========================================================================
   ZONA QUENTE · veículos
   Carros (viatura, carro civil, picape blindada artesanal, blindado da polícia)
   e o helicóptero. Combustível acaba (abasteça no posto, de graça).
   Blindado segura tiro de fuzil; carro comum deixa a bala passar.
   ========================================================================= */
import * as THREE from 'three';
import { alturaTerreno, caixasPerto, HELIPONTO, chaoEm, MX, MZ, BOMBAS } from './mapa.js?v=1.2.0';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const TIPOS = {
  carro: { nome: 'Carro', vidaMax: 380, blind: 0, pot: 9, vmax: 32, comp: 4.3, larg: 1.8, alt: 1.45, tanque: 45, consumo: 0.09, cor: null },
  viatura: { nome: 'Viatura', vidaMax: 480, blind: 0.2, pot: 10, vmax: 38, comp: 4.6, larg: 1.85, alt: 1.55, tanque: 50, consumo: 0.1, cor: '#f1f1f1' },
  picape: { nome: 'Picape blindada', vidaMax: 900, blind: 0.6, pot: 8, vmax: 28, comp: 5.2, larg: 2.0, alt: 1.9, tanque: 70, consumo: 0.14, cor: '#3d3d3d' },
  blindado: { nome: 'Blindado BOEPF', vidaMax: 2200, blind: 0.92, pot: 7, vmax: 22, comp: 6.2, larg: 2.5, alt: 2.6, tanque: 120, consumo: 0.22, cor: '#1f2124' },
  heli: { nome: 'Helicóptero Águia', vidaMax: 1100, blind: 0.35, tanque: 90, consumo: 0.25, cor: '#202733' },
};
const PINT = ['#c1121f', '#003049', '#f77f00', '#6c757d', '#e9edc9', '#283618', '#9d0208', '#0466c8'];
function modeloCarro(t, cor, lado) {
  const T = TIPOS[t], g = new THREE.Group(), corpoMat = new THREE.MeshLambertMaterial({ color: cor || T.cor || PINT[(Math.random() * PINT.length) | 0] });
  const vidro = new THREE.MeshPhongMaterial({ color: 0x1d2a36, shininess: 80, transparent: true, opacity: 0.85 }), preto = new THREE.MeshLambertMaterial({ color: 0x151515 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(T.larg, T.alt * 0.45, T.comp), corpoMat); base.position.y = 0.35 + T.alt * 0.22; g.add(base);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(T.larg * 0.92, T.alt * 0.42, T.comp * (t === 'picape' ? 0.45 : t === 'blindado' ? 0.8 : 0.55)), t === 'blindado' ? corpoMat : vidro); cab.position.set(0, 0.35 + T.alt * 0.66, t === 'picape' ? -T.comp * 0.12 : 0.1); g.add(cab);
  if (t !== 'blindado') { const teto = new THREE.Mesh(new THREE.BoxGeometry(T.larg * 0.9, 0.06, cab.geometry.parameters.depth * 0.9), corpoMat); teto.position.set(0, cab.position.y + T.alt * 0.21, cab.position.z); g.add(teto); }
  else { for (const s of [-1, 1]) { const vis = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.4), vidro); vis.position.set(s * T.larg * 0.47, cab.position.y + 0.1, -0.8); g.add(vis); } const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.35, 10), corpoMat); torre.position.set(0, cab.position.y + T.alt * 0.28, 0.4); g.add(torre); }
  if (t === 'viatura') { const giro = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: 0x1e5bff })); giro.position.set(0, cab.position.y + T.alt * 0.26, 0); g.add(giro); g.userData.giro = giro; const faixa = new THREE.Mesh(new THREE.BoxGeometry(T.larg + 0.02, 0.18, T.comp * 0.7), new THREE.MeshLambertMaterial({ color: 0x1b3f8a })); faixa.position.y = base.position.y; g.add(faixa); }
  if (lado !== undefined && lado >= 0 && lado < 3) { const f = new THREE.Mesh(new THREE.BoxGeometry(T.larg + 0.02, 0.12, T.comp + 0.02), new THREE.MeshLambertMaterial({ color: ['#f6c90e', '#4cc9f0', '#c77dff'][lado] })); f.position.y = base.position.y + T.alt * 0.2; g.add(f); }
  const rodas = [];
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(t === 'blindado' ? 0.55 : 0.36, t === 'blindado' ? 0.55 : 0.36, 0.28, 14).rotateZ(Math.PI / 2), preto); r.position.set(x * T.larg * 0.5, t === 'blindado' ? 0.55 : 0.36, z * T.comp * 0.33); g.add(r); rodas.push(r); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, rodas, corpoMat };
}
function modeloHeli() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0x202733 }), v = new THREE.MeshPhongMaterial({ color: 0x18252f, shininess: 90, transparent: true, opacity: 0.85 }), faixa = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(1.0, 2.6, 6, 12).rotateX(Math.PI / 2), m); corpo.position.y = 1.4; g.add(corpo);
  const vid = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-Math.PI / 2), v); vid.position.set(0, 1.5, -1.5); g.add(vid);
  const cauda = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 5), m); cauda.position.set(0, 1.7, 3.8); g.add(cauda);
  const deriva = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.7), m); deriva.position.set(0, 2.3, 6.1); g.add(deriva);
  const f = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 2.2), faixa); f.position.y = 1.4; g.add(f);
  for (const s of [-1, 1]) { const esqui = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.4), m); esqui.position.set(s * 0.9, 0.08, 0); g.add(esqui); for (const z of [-0.8, 0.8]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), m); p.position.set(s * 0.85, 0.4, z); g.add(p); } }
  const rotor = new THREE.Group(); rotor.position.y = 2.75; for (let k = 0; k < 4; k++) { const pa = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 9), m); pa.rotation.y = k * Math.PI / 4 * 2; rotor.add(pa); } g.add(rotor);
  const rot2 = new THREE.Group(); rot2.position.set(0.18, 2.3, 6.2); for (let k = 0; k < 2; k++) { const pa = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 0.15), m); pa.rotation.x = k * Math.PI / 2; rot2.add(pa); } g.add(rot2);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, rotor, rot2 };
}
export function criarVeiculo(J, tipo, x, z, yaw, lado) {
  const T = TIPOS[tipo], heli = tipo === 'heli';
  const md = heli ? modeloHeli() : modeloCarro(tipo, null, lado);
  const v = { tipo, T, heli, lado: lado ?? -1, pos: new THREE.Vector3(x, 0, z), yaw, vel: 0, velV: new THREE.Vector3(), pitch: 0, roll: 0, vida: T.vidaMax, comb: T.tanque * (0.55 + Math.random() * 0.4), motorista: null, destruido: false, md, mesh: md.g, som: null, girar: 0, inicial: { x, z, yaw }, ia: null };
  v.pos.y = heli ? chaoEm(x, z, 999) : alturaTerreno(x, z);
  J.cena.add(md.g); return v;
}
// colisão do raio com o veículo (caixa orientada)
export function raioVeiculo(v, o, d, max) {
  if (v.destruido && v.tipo !== 'heli') { }
  const T = v.T, c = Math.cos(-v.yaw), s = Math.sin(-v.yaw);
  const ox = o.x - v.pos.x, oz = o.z - v.pos.z, oy = o.y - v.pos.y;
  const lx = ox * c - oz * s, lz = ox * s + oz * c, dx = d.x * c - d.z * s, dz = d.x * s + d.z * c;
  const hx = (v.heli ? 1.0 : T.larg / 2), hz = (v.heli ? 3.5 : T.comp / 2), y0 = v.heli ? 0.3 : 0.25, y1 = v.heli ? 2.5 : T.alt + 0.35;
  let t0 = 0, t1 = max;
  for (const [oo, dd, a, b] of [[lx, dx, -hx, hx], [oy, d.y, y0, y1], [lz, dz, -hz, hz]]) { if (Math.abs(dd) < 1e-8) { if (oo < a || oo > b) return null; continue; } let ta = (a - oo) / dd, tb = (b - oo) / dd; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return null; }
  return t0 > 0 ? { t: t0 } : null;
}
// ---------- direção ----------
export function dirigir(J, v, ent, dt) {
  const T = v.T;
  if (v.destruido) { v.vel *= Math.pow(0.2, dt); return; }
  if (v.heli) return voar(J, v, ent, dt);
  const temComb = v.comb > 0, acel = temComb ? (ent.frente - ent.tras * 0.6) : 0;
  if (acel !== 0) v.comb = Math.max(0, v.comb - Math.abs(acel) * T.consumo * dt * (1 + Math.abs(v.vel) / T.vmax));
  else if (v.motorista && temComb) v.comb = Math.max(0, v.comb - 0.01 * dt); // marcha lenta
  v.vel += acel * T.pot * dt * (v.vel * acel < 0 ? 1.8 : 1);
  if (ent.freio) v.vel *= Math.pow(0.08, dt);
  v.vel *= Math.pow(0.85, dt); v.vel -= Math.sign(v.vel) * Math.min(Math.abs(v.vel), 0.6 * dt);
  // subida: a gravidade puxa
  const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw), h0 = alturaTerreno(v.pos.x, v.pos.z), h1 = alturaTerreno(v.pos.x + fx * 2, v.pos.z + fz * 2), incl = (h1 - h0) / 2;
  v.vel -= incl * 9.81 * dt * 0.8;
  v.vel = clamp(v.vel, -T.vmax * 0.35, T.vmax);
  const virar = (ent.esq - ent.dir) * clamp(Math.abs(v.vel) / 6, 0, 1) * (v.vel >= 0 ? 1 : -1);
  v.yaw += virar * 1.25 * dt * (1 - Math.min(0.55, Math.abs(v.vel) / T.vmax * 0.55));
  const nx = v.pos.x + fx * v.vel * dt, nz = v.pos.z + fz * v.vel * dt;
  // bate em casa, muro, mureta: para e toma dano
  let bateu = false;
  const R = T.larg * 0.55;
  for (const off of [-T.comp * 0.35, 0, T.comp * 0.35]) {
    const px = nx + fx * off, pz = nz + fz * off, hy = alturaTerreno(px, pz);
    caixasPerto(px, pz, R + 1, b => { if (b.vidro !== undefined || bateu) return; if (b.y1 < hy + 0.45 || b.y0 > hy + T.alt) return; const cx = clamp(px, b.x0, b.x1), cz = clamp(pz, b.z0, b.z1); if (Math.hypot(px - cx, pz - cz) < R) bateu = true; });
  }
  for (const o of J.veiculos) { if (o === v || o.heli) continue; if (Math.hypot(o.pos.x - nx, o.pos.z - nz) < (T.comp + o.T.comp) * 0.32) { bateu = true; if (Math.abs(v.vel) > 6) { o.vel += v.vel * 0.3; } } }
  if (bateu) { if (Math.abs(v.vel) > 7) { J.danoVeiculo(v, Math.abs(v.vel) * 9, null); J.somBatida(v); } v.vel *= -0.25; }
  else { v.pos.x = clamp(nx, -MX + 8, MX - 8); v.pos.z = clamp(nz, -MZ + 8, MZ - 8); }
  // atropelar
  if (Math.abs(v.vel) > 4) for (const a of J.atores) { if (!a.vivo || a.veiculo) continue; const dx = a.pos.x - v.pos.x, dz = a.pos.z - v.pos.z; const lz = dx * fx + dz * fz, lx = dx * Math.cos(v.yaw) - dz * Math.sin(v.yaw); if (Math.abs(lz) < T.comp * 0.55 && Math.abs(lx) < T.larg * 0.7 && Math.abs(a.pos.y - v.pos.y) < 2) J.atropelar(v, a); }
  // assenta no chão (inclinação pelas 4 rodas)
  const hF = alturaTerreno(v.pos.x + fx * T.comp * 0.35, v.pos.z + fz * T.comp * 0.35), hT = alturaTerreno(v.pos.x - fx * T.comp * 0.35, v.pos.z - fz * T.comp * 0.35);
  const rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw), hE = alturaTerreno(v.pos.x - rx * T.larg * 0.45, v.pos.z - rz * T.larg * 0.45), hD = alturaTerreno(v.pos.x + rx * T.larg * 0.45, v.pos.z + rz * T.larg * 0.45);
  v.pos.y = (hF + hT + hE + hD) / 4; v.pitch = Math.atan2(hF - hT, T.comp * 0.7); v.roll = Math.atan2(hD - hE, T.larg * 0.9);
  v.girar += v.vel * dt / 0.36;
}
function voar(J, v, ent, dt) {
  const temComb = v.comb > 0, potencia = temComb ? 1 : 0;
  if (v.motorista || v.ia) v.comb = Math.max(0, v.comb - v.T.consumo * dt * (0.5 + Math.abs(ent.sobe)));
  const ligado = (v.motorista || v.ia) && temComb;
  v.rotor = clamp((v.rotor || 0) + (ligado ? 0.5 : -0.25) * dt, 0, 1);
  const chao = chaoEm(v.pos.x, v.pos.z, v.pos.y + 0.5, 1.2, 1.5);
  const noChao = v.pos.y <= chao + 0.05;
  // atitude: inclina para frente/trás e para os lados; empuxo segura o peso
  v.pitch += ((ent.frente - ent.tras) * 0.32 - v.pitch) * Math.min(1, 2.2 * dt);
  v.roll += ((ent.dir - ent.esq) * 0.25 * (ent.lateral ? 1 : 0) - v.roll) * Math.min(1, 2.2 * dt);
  if (!noChao || ent.sobe > 0) v.yaw += (ent.esq - ent.dir) * (ent.lateral ? 0 : 1) * 1.1 * dt;
  const empuxo = v.rotor * (9.81 + ent.sobe * 6.5) * potencia;
  const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw), rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
  v.velV.x += (fx * Math.sin(v.pitch) * 14 + rx * Math.sin(v.roll) * 12) * v.rotor * dt;
  v.velV.z += (fz * Math.sin(v.pitch) * 14 + rz * Math.sin(v.roll) * 12) * v.rotor * dt;
  v.velV.y += (empuxo * Math.cos(v.pitch) - 9.81) * dt;
  v.velV.multiplyScalar(Math.pow(0.55, dt)); v.velV.y *= Math.pow(0.7, dt);
  v.pos.addScaledVector(v.velV, dt);
  if (v.pos.y < chao) { if (v.velV.y < -9) J.danoVeiculo(v, (-v.velV.y - 9) * 120, null); v.pos.y = chao; v.velV.set(0, Math.max(0, v.velV.y), 0); v.pitch *= 0.5; v.roll *= 0.5; }
  // bate em prédio
  caixasPerto(v.pos.x, v.pos.z, 4, b => { if (b.vidro !== undefined) return; if (v.pos.y + 0.4 > b.y1 || v.pos.y + 2.5 < b.y0) return; const cx = clamp(v.pos.x, b.x0, b.x1), cz = clamp(v.pos.z, b.z0, b.z1), dd = Math.hypot(v.pos.x - cx, v.pos.z - cz); if (dd < 3.2) { const sp = Math.hypot(v.velV.x, v.velV.z); if (sp > 6) J.danoVeiculo(v, sp * 25, null); const k = (3.2 - dd) / Math.max(dd, 0.1); v.pos.x += (v.pos.x - cx) * k; v.pos.z += (v.pos.z - cz) * k; v.velV.x *= -0.3; v.velV.z *= -0.3; } });
  v.pos.y = Math.min(v.pos.y, 160);
  v.pos.x = clamp(v.pos.x, -MX + 10, MX - 10); v.pos.z = clamp(v.pos.z, -MZ + 10, MZ - 10);
  v.vel = Math.hypot(v.velV.x, v.velV.z);
}
// helicóptero da polícia no automático: sobrevoa os morros com um atirador na porta
export function pilotoAutomatico(J, v, dt) {
  if (v.destruido || v.motorista) { v.ia = null; return; }
  if (!v.ia) v.ia = { alvo: 0, t: 0, atirarT: 0 };
  const ia = v.ia, pts = J.pontosPatrulha; const p = pts[ia.alvo % pts.length];
  if (v.comb < 8) { // volta para abastecer
    const dx = HELIPONTO.x - v.pos.x, dz = HELIPONTO.z - v.pos.z, d = Math.hypot(dx, dz);
    const ent = { frente: d > 12 ? 1 : 0, tras: 0, esq: 0, dir: 0, sobe: d > 20 ? (v.pos.y < alturaTerreno(v.pos.x, v.pos.z) + 40 ? 1 : 0) : -0.8, lateral: false };
    v.yaw += clamp((((Math.atan2(-dx, -dz) - v.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI), -0.8 * dt, 0.8 * dt);
    voar(J, v, ent, dt); if (d < 6 && v.pos.y <= chaoEm(v.pos.x, v.pos.z, v.pos.y + 0.5, 1.2, 1.5) + 0.1) v.comb = v.T.tanque; return;
  }
  const dx = p.x - v.pos.x, dz = p.z - v.pos.z, d = Math.hypot(dx, dz), alt = alturaTerreno(v.pos.x, v.pos.z) + 48;
  const yawAlvo = Math.atan2(-dx, -dz), dy = ((yawAlvo - v.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  v.yaw += clamp(dy, -0.7 * dt, 0.7 * dt);
  const ent = { frente: d > 40 && Math.abs(dy) < 0.6 ? 0.6 : 0.15, tras: 0, esq: 0, dir: 0, sobe: v.pos.y < alt ? 1 : v.pos.y > alt + 8 ? -0.6 : 0, lateral: false };
  voar(J, v, ent, dt);
  if (d < 35) { ia.t += dt; if (ia.t > 9) { ia.t = 0; ia.alvo++; } }
  // atirador da porta
  ia.atirarT -= dt;
  if (ia.atirarT <= 0) {
    ia.atirarT = 0.11;
    let alvo = null, md = 130;
    for (const a of J.atores) { if (!a.vivo || a.lado === 3) continue; const dd = a.pos.distanceTo(v.pos); if (dd < md && J.visivelDe(v.pos, a)) { md = dd; alvo = a; } }
    if (alvo) { if (!ia.rajada) ia.rajada = 8 + ((Math.random() * 8) | 0); ia.rajada--; if (ia.rajada <= 0) { ia.atirarT = 1.2 + Math.random(); ia.rajada = 0; } J.tiroHeli(v, alvo); }
  }
}
export function desenharVeiculo(v, dt) {
  const m = v.mesh; m.position.copy(v.pos); m.rotation.set(0, 0, 0, 'YXZ'); m.rotation.order = 'YXZ'; m.rotation.y = v.yaw; const sg = v.heli ? -1 : 1; m.rotation.x = sg * v.pitch; m.rotation.z = sg * v.roll;
  if (v.heli) { v.md.rotor.rotation.y += (v.rotor || 0) * dt * 28; v.md.rot2.rotation.x += (v.rotor || 0) * dt * 40; }
  else { for (const r of v.md.rodas) r.rotation.x = v.girar; if (m.userData.giro) m.userData.giro.material.color.setHex(((performance.now() / 250) | 0) % 2 ? 0x1e5bff : 0xff2020); }
}
export function bombaPerto(v) { if (v.heli) return Math.hypot(HELIPONTO.x - v.pos.x, HELIPONTO.z - v.pos.z) < 9 ? HELIPONTO : null; return BOMBAS.find(b => Math.hypot(b.x - v.pos.x, b.z - v.pos.z) < 4.5) || null; }
