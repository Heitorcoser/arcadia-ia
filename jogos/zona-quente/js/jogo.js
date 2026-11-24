/* =========================================================================
   ZONA QUENTE · jogo
   ========================================================================= */
import * as THREE from 'three';
import { MX, MZ, LADOS, UNIDADES, MORROS, PONTOS, LOJAS, BOMBAS, HELIPONTO, SPAWNS, VEICULOS_INICIAIS, JANELAS, CAIXAS, CASAS, LINHAS, BASE_POLICIA, POSTO, brZ,
  alturaTerreno, raio, visivel, construirMalhas, placa, caixasPerto, chaoEm, materialChao, NAV } from './mapa.js?v=1.1.0';
import { A, iniciarAudio, definirOuvinte, tocar, somTiro, somImpacto, somRicochete, somPassando, somExplosao, volumeGeral, distOuvinte } from './audio.js?v=1.1.0';
import { ARMAS, CLASSES, GRANADAS, danoNaDistancia, modeloArma } from './armas.js?v=1.1.0';
import { criarAtor, nascer, moverAtor, olho, direcaoOlhar, raioAtor, animarBoneco, animarMorte, pensarBot, avisoBalaPerto, inimigos, equipar, OLHO, OLHO_AGACHADO } from './atores.js?v=1.1.0';
import { criarVeiculo, dirigir, pilotoAutomatico, desenharVeiculo, raioVeiculo, bombaPerto, TIPOS } from './veiculos.js?v=1.1.0';
import * as MAPA from './mapa.js?v=1.1.0';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;
const TOQUE = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
const avisar = (evento, extra = {}) => { try { parent.postMessage({ fonte: 'arcadia-jogo', id: 'zona-quente', evento, ...extra }, '*'); } catch (e) {} };
const ler = (k, p) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? p; } catch (e) { return p; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const CFG = Object.assign({ sens: 1, fov: 78, vol: 0.9, inverter: false, qualidade: TOQUE ? 0 : 1, fps: false, bots: TOQUE ? 0 : 1 }, ler('zq.cfg', {}));
const carTxt = t => { $('#car-txt').textContent = t; };

/* ---------------- renderizador, cena, luz ---------------- */
const canvas = $('#cv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !TOQUE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOQUE ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.autoClear = false;
renderer.shadowMap.enabled = CFG.qualidade > 0; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const cena = new THREE.Scene();
const CEU_TOPO = new THREE.Color(0x5f8fc4), HORIZONTE = new THREE.Color(0xe8c08e);
cena.background = HORIZONTE.clone(); cena.fog = new THREE.Fog(0xd8b88e, 70, 560);
{ const g = new THREE.SphereGeometry(1500, 24, 12), cores = [], c = new THREE.Color(); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 1500; c.copy(HORIZONTE).lerp(CEU_TOPO, clamp(y * 1.6, 0, 1)); cores.push(c.r, c.g, c.b); } g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3)); const ceu = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); ceu.renderOrder = -10; cena.add(ceu); cena.userData.ceu = ceu; }
const hemi = new THREE.HemisphereLight(0xdfe9ff, 0x6b5a45, 1.05); cena.add(hemi);
const sol = new THREE.DirectionalLight(0xffd2a0, 2.3); sol.castShadow = CFG.qualidade > 0; sol.shadow.mapSize.set(2048, 2048); const sc = sol.shadow.camera; sc.left = sc.bottom = -70; sc.right = sc.top = 70; sc.near = 10; sc.far = 400; sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.4; cena.add(sol, sol.target);
const SOL_DIR = new THREE.Vector3(-0.55, 0.62, 0.35).normalize();
const cam = new THREE.PerspectiveCamera(CFG.fov, 1, 0.05, 1600); cam.rotation.order = 'YXZ';
// arma em primeira pessoa (cena própria por cima)
const vmCena = new THREE.Scene(), vmCam = new THREE.PerspectiveCamera(62, 1, 0.05, 10);
vmCena.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.4)); { const l = new THREE.DirectionalLight(0xffe0b0, 1.2); l.position.set(-1, 2, 1); vmCena.add(l); }

/* ---------------- mundo ---------------- */
carTxt('Montando a Serra Alta…');
const MALHAS = construirMalhas(cena, CFG.qualidade);
const PONTOS_LETRA = ['A', 'B', 'C', 'D', 'E'];
PONTOS.forEach((p, k) => {
  p.letra = PONTOS_LETRA[k]; p.y = alturaTerreno(p.x, p.z); p.inicial = { dono: p.dono, quem: p.quem, progresso: p.progresso };
  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 9, 6), new THREE.MeshLambertMaterial({ color: 0xcccccc })); mastro.position.set(p.x, p.y + 4.5, p.z); cena.add(mastro);
  p.bandeira = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })); p.bandeira.position.set(p.x + 1.25, p.y + 8.1, p.z); cena.add(p.bandeira);
  const s = placa(p.letra + ' · ' + p.nome.toUpperCase(), '#ffffff', 7); s.position.set(p.x, p.y + 10.2, p.z); cena.add(s);
  const anel = new THREE.Mesh(new THREE.RingGeometry(p.r - 0.3, p.r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false })); anel.position.set(p.x, p.y + 0.15, p.z); cena.add(anel); p.anel = anel;
});
for (const l of LOJAS) { const s = placa('🔫 MUNIÇÃO GRÁTIS', '#ffd166', 4); s.position.set(l.x, alturaTerreno(l.x, l.z) + 3.4, l.z); cena.add(s); }
{ const s = placa('⛽ COMBUSTÍVEL', '#7bd88f', 5); s.position.set(POSTO.x, alturaTerreno(POSTO.x, brZ(POSTO.x) + 20) + 7, brZ(POSTO.x) + 20); cena.add(s); const h = placa('H · HELIPONTO', '#ffffff', 5); h.position.set(HELIPONTO.x, alturaTerreno(HELIPONTO.x, HELIPONTO.z) + 4, HELIPONTO.z); cena.add(h); }

/* ---------------- efeitos: partículas, buracos de bala, clarão, traçantes ---------------- */
const MAXP = 1600, pPos = new Float32Array(MAXP * 3), pCor = new Float32Array(MAXP * 3), pVel = new Float32Array(MAXP * 3), pVida = new Float32Array(MAXP), pGrav = new Float32Array(MAXP); let pProx = 0;
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCor, 3));
const particulas = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, sizeAttenuation: true })); particulas.frustumCulled = false; cena.add(particulas);
function emitir(p, n, cor, vel, grav = 9.81, vida = 0.7, dir) {
  const c = new THREE.Color(cor);
  for (let k = 0; k < n; k++) { const i = pProx; pProx = (pProx + 1) % MAXP; pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z; let vx = (Math.random() - 0.5) * 2, vy = Math.random() * 1.2, vz = (Math.random() - 0.5) * 2; if (dir) { vx += dir.x * 1.5; vy += dir.y * 1.5; vz += dir.z * 1.5; } pVel[i * 3] = vx * vel; pVel[i * 3 + 1] = vy * vel; pVel[i * 3 + 2] = vz * vel; pVida[i] = vida * (0.6 + Math.random() * 0.6); pGrav[i] = grav; const v = 0.8 + Math.random() * 0.4; pCor[i * 3] = c.r * v; pCor[i * 3 + 1] = c.g * v; pCor[i * 3 + 2] = c.b * v; }
}
function atualizarParticulas(dt) {
  for (let i = 0; i < MAXP; i++) { if (pVida[i] <= 0) continue; pVida[i] -= dt; if (pVida[i] <= 0) { pPos[i * 3 + 1] = -9999; continue; } pVel[i * 3 + 1] -= pGrav[i] * dt; pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt; }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}
for (let i = 0; i < MAXP; i++) pPos[i * 3 + 1] = -9999;
// buracos de bala
const MAXB = 500, furos = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.11), new THREE.MeshBasicMaterial({ color: 0x1a1714, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), MAXB); let furoProx = 0; furos.frustumCulled = false; cena.add(furos);
{ const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < MAXB; i++) furos.setMatrixAt(i, z); }
const _o = new THREE.Object3D(), _n = new THREE.Vector3();
function furo(p, n) { _o.position.set(p.x + n.x * 0.01, p.y + n.y * 0.01, p.z + n.z * 0.01); _n.set(p.x + n.x, p.y + n.y, p.z + n.z); _o.lookAt(_n); _o.rotateZ(Math.random() * 6); _o.scale.setScalar(0.7 + Math.random() * 0.6); _o.updateMatrix(); furos.setMatrixAt(furoProx, _o.matrix); furos.instanceMatrix.needsUpdate = true; furoProx = (furoProx + 1) % MAXB; }
// clarão do cano (sprite) e luz
const texClarao = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.3, 'rgba(255,200,80,.9)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const clarões = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texClarao, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.visible = false; cena.add(s); clarões.push({ s, t: 0 }); }
const luzes = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffb060, 0, 14, 2); cena.add(l); luzes.push({ l, t: 0 }); }
let claraoProx = 0, luzProx = 0;
function clarao(p, tam = 0.6) { const c = clarões[claraoProx]; claraoProx = (claraoProx + 1) % clarões.length; c.s.position.copy(p); c.s.scale.setScalar(tam * (0.8 + Math.random() * 0.5)); c.s.material.rotation = Math.random() * 6; c.s.visible = true; c.t = 0.045; const L = luzes[luzProx]; luzProx = (luzProx + 1) % luzes.length; L.l.position.copy(p); L.l.intensity = 6; L.t = 0.05; }
// traçantes
const MAXT = 300, tPos = new Float32Array(MAXT * 6), tGeo = new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
const tracantes = new THREE.LineSegments(tGeo, new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })); tracantes.frustumCulled = false; cena.add(tracantes);
// fumaça (granada e explosões)
const texFumaca = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const nuvens = []; for (let i = 0; i < 260; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFumaca, color: 0xcfd2d6, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; cena.add(s); nuvens.push({ s, vida: 0, max: 1, cresce: 1, vel: new THREE.Vector3(), op: 0.6 }); }
let nuvemProx = 0;
function nuvem(p, tam, vida, cor = 0xcfd2d6, op = 0.6, vel) { const n = nuvens[nuvemProx]; nuvemProx = (nuvemProx + 1) % nuvens.length; n.s.position.copy(p); n.s.material.color.setHex(cor); n.s.scale.setScalar(tam); n.base = tam; n.vida = n.max = vida; n.op = op; n.s.visible = true; n.vel.copy(vel || new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4)); return n; }
function atualizarNuvens(dt) { for (const n of nuvens) { if (n.vida <= 0) continue; n.vida -= dt; if (n.vida <= 0) { n.s.visible = false; continue; } const k = 1 - n.vida / n.max; n.s.position.addScaledVector(n.vel, dt); n.s.scale.setScalar(n.base * (1 + k * 1.6)); n.s.material.opacity = n.op * Math.min(1, k * 6) * (1 - k); } }

/* ---------------- estado do jogo ---------------- */
const J = window.J = { cena, atores: [], veiculos: [], balas: [], granadas: [], fumacas: [], sonsRecentes: [], tempo: 0, dif: 1, placar: [0, 0, 0, 0], jogador: null, feed: [], pontosPatrulha: [...MORROS.map(m => ({ x: m.x, z: m.z })), { x: 0, z: brZ(0) }], armasChao: [] };
let estado = 'menu', escolha = { lado: 0, unidade: 'BOEPF', classe: null, dif: 1 }, tempoPartida = 0, fimPartida = false;
const META = 1000, DURACAO = 15 * 60;

/* ---------------- combate ---------------- */
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3();
J.podeAtirar = a => { const w = a.armas[a.atual]; return a.cad <= 0 && a.recarregando <= 0 && a.trocando <= 0 && a.ferrolho <= 0 && w.pente > 0 && !a.correndo && a.curando <= 0 && !a.cozinhando; };
function espalhamento(a) {
  const d = a.armas[a.atual].def, vh = Math.hypot(a.vel.x, a.vel.z);
  let s = lerp(d.hip, d.ads, a.ads) + vh * 0.32 * (1 - a.ads * 0.7) + (a.noChao ? 0 : 4);
  if (a.agachado) s *= 0.75;
  if (J.tempo - (a.ultTiro || -9) > 0.32 && d.modos[0] === 'auto') s *= 0.45; // primeiro tiro certeiro
  s += (a.calor || 0) * (1 - a.ads * 0.5);
  return s;
}
J.disparar = (a, mira) => {
  const w = a.armas[a.atual], d = w.def, eu = a === J.jogador;
  if (w.pente <= 0) { if (eu) tocar('impacto_metal3', { vol: 0.2, taxa: 2.2 }); a.cad = 0.25; return; }
  w.pente--; a.cad = 60 / d.rpm; a.ultTiro = J.tempo;
  let o, yaw = a.yaw, pitch = a.pitch;
  if (eu) { o = cam.position.clone(); const e = new THREE.Euler(); e.setFromQuaternion(cam.quaternion, 'YXZ'); yaw = e.y; pitch = e.x; }
  else { o = olho(a, new THREE.Vector3()); if (mira) { yaw = mira.yaw; pitch = mira.pitch; } }
  const esp = espalhamento(a) * DEG * (eu ? 1 : 0.6);
  for (let k = 0; k < (d.bagos || 1); k++) {
    const r = esp * Math.sqrt(Math.random()), t = Math.random() * Math.PI * 2;
    const y = yaw + Math.cos(t) * r, p = pitch + Math.sin(t) * r, cp = Math.cos(p);
    const dir = new THREE.Vector3(-Math.sin(y) * cp, Math.sin(p), -Math.cos(y) * cp);
    J.balas.push({ p: o.clone(), v: dir.multiplyScalar(d.vel), dono: a, arma: d, dist: 0, pen: d.pen, mult: 1, tracer: (eu ? Math.random() < 0.35 : Math.random() < 0.3), passou: new Set(), inicio: o.clone() });
  }
  // som, clarão, cápsula
  const boca = eu ? vm.bocaMundo() : tmpA.copy(o).add(direcaoOlhar(a, tmpB).multiplyScalar(0.8));
  somTiro(d, o, eu);
  clarao(boca, d.tipo === 'escopeta' ? 0.9 : d.tipo === 'pistola' ? 0.45 : 0.65);
  J.sonsRecentes.push({ x: o.x, z: o.z, lado: a.lado, t: J.tempo, a });
  a.revelado = J.tempo;
  if (d.modos[0] === 'ferrolho') { a.ferrolho = 1.05; if (eu) setTimeout(() => tocar('recarga_fuzil', { vol: 0.35, inicio: 0.55, taxa: 1.3 }), 380); }
  if (d.modos[0] === 'bomba') { a.ferrolho = 0.62; if (eu) setTimeout(() => tocar('escopeta_bomba', { vol: 0.7 }), 260); else setTimeout(() => tocar('escopeta_bomba', { pos: a.pos, vol: 0.6, ref: 4 }), 260); }
  if (eu) {
    if (Math.random() < 0.6) tocar('capsula', { vol: 0.16, atraso: 0.35 + Math.random() * 0.2, taxa: 1 + Math.random() * 0.3 });
    // recuo: uma parte volta sozinha, o resto é com você
    const m = (1 - a.ads * 0.28) * (a.agachado ? 0.78 : 1) * (0.9 + Math.random() * 0.2);
    const sobe = d.sobe * DEG * m, lado = (Math.random() - 0.45) * 2 * d.lado * DEG * m;
    a.pitch += sobe; a.yaw -= lado; recuoVolta += sobe * d.volta; a.calor = Math.min(3, (a.calor || 0) + 0.25);
    vm.chute = Math.min(1.4, vm.chute + (d.tipo === 'precisao' || d.tipo === 'escopeta' ? 1.2 : 0.55)); tremor = Math.max(tremor, d.tipo === 'escopeta' || d.tipo === 'precisao' ? 0.35 : 0.12);
  }
};
let recuoVolta = 0, tremor = 0;
J.recarregar = a => {
  const w = a.armas[a.atual], d = w.def; if (a.recarregando > 0 || w.reserva <= 0 || w.pente >= d.pente || a.trocando > 0) return;
  a.recarregando = d.porCartucho ? d.recarga : (w.pente === 0 ? (d.recargaVazia || d.recarga) : d.recarga); a.recargaTotal = a.recarregando;
  const som = { pistola: 'recarga_pistola', fuzil: 'recarga_fuzil', geral: 'recarga_geral', cartucho: 'capsula' }[d.tipoRecarga] || 'recarga_geral';
  if (a === J.jogador) tocar(som, { vol: 0.6, taxa: d.tipoRecarga === 'cartucho' ? 1.6 : 1 }); else if (distOuvinte(a.pos) < 25) tocar(som, { pos: a.pos, vol: 0.5, ref: 3 });
};
function fimRecarga(a) {
  const w = a.armas[a.atual], d = w.def;
  if (d.porCartucho) { if (w.reserva > 0 && w.pente < d.pente) { w.pente++; w.reserva--; if (a === J.jogador) tocar('capsula', { vol: 0.45, taxa: 1.6 }); if (w.pente < d.pente && w.reserva > 0 && !(a === J.jogador && mouse.esq)) { a.recarregando = d.recarga; return; } } if (a === J.jogador) tocar('escopeta_bomba', { vol: 0.6 }); return; }
  const precisa = d.pente - w.pente + (w.pente > 0 && d.tipo !== 'escopeta' && d.tipo !== 'pistola' ? 0 : 0), tira = Math.min(precisa, w.reserva); w.pente += tira; w.reserva -= tira;
}
J.trocarArma = (a, i) => { if (i === a.atual || !a.armas[i]) return; a.atual = i; a.trocando = 0.55; a.recarregando = 0; a.ferrolho = 0; if (a.partes) { const p = a.partes; if (p.arma) p.suporte.remove(p.arma.g); p.arma = modeloArma(a.armas[i].def.id); p.arma.g.scale.setScalar(1.15); p.suporte.add(p.arma.g); } if (a === J.jogador) { vm.montar(); tocar('impacto_metal2', { vol: 0.15, taxa: 1.8 }); } };
J.reabastecer = a => { for (const w of a.armas) w.reserva = w.def.reserva; a.granadas = { frag: 2, fumaca: 1 }; a.curativos = Math.max(a.curativos, a.unidade === 'PCM' ? 4 : 2); if (a.colete < a.coleteMax) a.colete = a.coleteMax; };
J.visivelDe = (p, a) => visivel({ x: p.x, y: p.y + 0.6, z: p.z }, { x: a.pos.x, y: a.pos.y + 1.2, z: a.pos.z }, false);
const ATIRADOR_HELI = { id: -5, nome: 'Atirador do Águia', lado: 3, vivo: true, pos: new THREE.Vector3(), abates: 0, bot: true, armas: [{ def: ARMAS.metralhadora }], atual: 0 };
J.tiroHeli = (v, alvo) => {
  const o = new THREE.Vector3(v.pos.x + Math.cos(v.yaw) * 1.2, v.pos.y + 1.3, v.pos.z - Math.sin(v.yaw) * 1.2), t = new THREE.Vector3(alvo.pos.x, alvo.pos.y + 1.1, alvo.pos.z);
  const dir = t.sub(o).normalize(), e = 3.2 * DEG; dir.x += (Math.random() - 0.5) * e * 2; dir.y += (Math.random() - 0.5) * e * 2; dir.z += (Math.random() - 0.5) * e * 2; dir.normalize();
  ATIRADOR_HELI.pos.copy(v.pos);
  J.balas.push({ p: o.clone(), v: dir.multiplyScalar(ARMAS.metralhadora.vel), dono: ATIRADOR_HELI, arma: ARMAS.metralhadora, dist: 0, pen: 0.8, mult: 1, tracer: Math.random() < 0.4, passou: new Set(), inicio: o.clone() });
  somTiro(ARMAS.metralhadora, o, false); clarao(o, 0.7); J.sonsRecentes.push({ x: o.x, z: o.z, lado: 3, t: J.tempo });
};
// quebrar vidro
function quebrarJanela(caixa, p, dir) {
  if (caixa.quebrado) return; caixa.quebrado = true; const j = JANELAS[caixa.vidro]; j.quebrada = true;
  MALHAS.vidros.setMatrixAt(caixa.vidro, new THREE.Matrix4().makeScale(0, 0, 0)); MALHAS.vidros.instanceMatrix.needsUpdate = true;
  const c = { x: (caixa.x0 + caixa.x1) / 2, y: (caixa.y0 + caixa.y1) / 2, z: (caixa.z0 + caixa.z1) / 2 };
  tocar(Math.random() < 0.5 ? 'vidro_quebrando' : 'vidro_quebrando2', { pos: c, vol: 1, ref: 5, atraso: distOuvinte(c) / 343 });
  tocar('vidro_caindo', { pos: c, vol: 0.6, ref: 4, atraso: 0.35 + distOuvinte(c) / 343 });
  emitir(c, 40, 0xbfe3ff, 2.2, 9.81, 1.2, dir);
}
// a bala anda (com gravidade) e testa mundo, gente e veículo
function atualizarBalas(dt) {
  const eu = J.jogador, euOlho = eu && eu.vivo ? (eu.veiculo ? eu.veiculo.pos.clone().setY(eu.veiculo.pos.y + 1.5) : cam.position.clone()) : null;
  let nt = 0;
  for (let i = J.balas.length - 1; i >= 0; i--) {
    const b = J.balas[i]; let resto = dt, vivo = true, iter = 0;
    while (vivo && resto > 0 && iter++ < 6) {
      b.v.y -= 9.81 * resto;
      const vel = b.v.length(), len = vel * resto, dir = tmpA.copy(b.v).divideScalar(vel);
      let alvo = null, tMin = len;
      const hm = raio(b.p, dir, len);
      if (hm) { tMin = hm.t; alvo = { tipo: 'mundo', h: hm }; }
      for (const a of J.atores) { if (a === b.dono || !a.vivo || !inimigos(b.dono, a)) continue; const h = raioAtor(a, b.p, dir, tMin); if (h && h.t < tMin) { tMin = h.t; alvo = { tipo: 'ator', a, zona: h.zona }; } }
      for (const v of J.veiculos) { if (v.motorista === b.dono || (v.destruido && !v.heli)) continue; if (b.dono === ATIRADOR_HELI && v.heli) continue; const h = raioVeiculo(v, b.p, dir, tMin); if (h && h.t < tMin) { tMin = h.t; alvo = { tipo: 'veic', v }; } }
      // passou perto do jogador: zunido (e o susto)
      if (euOlho && b.dono !== eu && !b.passou.has('eu')) { const tt = clamp((euOlho.x - b.p.x) * dir.x + (euOlho.y - b.p.y) * dir.y + (euOlho.z - b.p.z) * dir.z, 0, tMin); const q = Math.hypot(b.p.x + dir.x * tt - euOlho.x, b.p.y + dir.y * tt - euOlho.y, b.p.z + dir.z * tt - euOlho.z); if (q < 2.6 && tt > 0 && tt < tMin) { b.passou.add('eu'); const f = 1 - q / 2.6; somPassando({ x: b.p.x + dir.x * tt, y: b.p.y + dir.y * tt, z: b.p.z + dir.z * tt }, f); supressao = Math.min(1, supressao + f * 0.5); tremor = Math.max(tremor, f * 0.15); } }
      // bots perto também se assustam
      for (const a of J.atores) { if (!a.bot || !a.vivo || a === b.dono || b.passou.has(a.id)) continue; const ax = a.pos.x, ay = a.pos.y + 1.4, az = a.pos.z; const tt = clamp((ax - b.p.x) * dir.x + (ay - b.p.y) * dir.y + (az - b.p.z) * dir.z, 0, tMin); if (tt <= 0) continue; const q = Math.hypot(b.p.x + dir.x * tt - ax, b.p.y + dir.y * tt - ay, b.p.z + dir.z * tt - az); if (q < 2.5) { b.passou.add(a.id); avisoBalaPerto(a, 0.5 * (1 - q / 2.5)); if (inimigos(a, b.dono) && !a.alvo && b.dono.pos) { a.ultimaPos = b.dono.pos.clone(); a.vistoEm = J.tempo - 1; if (a.estado !== 'combate') a.estado = 'cacar'; } } }
      const p = tmpB.copy(b.p).addScaledVector(dir, tMin);
      b.dist += tMin;
      if (!alvo) { b.p.copy(p); resto = 0; break; }
      const consumido = tMin / vel; resto -= consumido;
      if (alvo.tipo === 'mundo') {
        const h = alvo.h, mat = h.mat, n = tmpC.set(h.nx, h.ny, h.nz);
        if (h.caixa && h.caixa.vidro !== undefined) { quebrarJanela(h.caixa, p, dir); b.p.copy(p).addScaledVector(dir, 0.05); b.v.multiplyScalar(0.92); b.mult *= 0.9; continue; }
        const rasante = Math.abs(dir.dot(n)) < 0.18;
        if (rasante && (mat === 'metal' || mat === 'concreto' || mat === 'asfalto' || mat === 'tijolo') && Math.random() < 0.55) { somRicochete(p); emitir(p, 6, 0xffe2a0, 3, 9.81, 0.25); b.v.reflect(n).multiplyScalar(0.55); b.mult *= 0.45; b.p.copy(p).addScaledVector(n, 0.02); continue; }
        somImpacto(mat, p);
        const corP = { metal: 0xffd27a, madeira: 0x8a6a45, terra: 0x7a5c3e, tijolo: 0xa8553b, concreto: 0xb3aca1, asfalto: 0x57595e, plastico: 0x3f7fd0, borracha: 0x222222 }[mat] || 0xa09a90;
        emitir(p, mat === 'metal' ? 5 : 10, corP, mat === 'metal' ? 3.5 : 1.6, 9.81, mat === 'metal' ? 0.25 : 0.6, n);
        if (mat !== 'metal') nuvem(p.clone().addScaledVector(n, 0.15), 0.35, 0.8, corP, 0.5, n.clone().multiplyScalar(0.6));
        if (!h.terreno || mat === 'asfalto' || mat === 'concreto') furo(p, n);
        // atravessa madeira, plástico, sacos (pouco) e lata (só calibre forte)
        if ((mat === 'madeira' || mat === 'plastico') && b.pen > 0.2) { b.pen -= 0.3; b.mult *= 0.6; b.p.copy(p).addScaledVector(dir, 0.6); continue; }
        if (mat === 'metal' && h.caixa && (h.caixa.tipo === 'carro' || h.caixa.tipo === 'bomba') && b.pen >= 0.35) { b.pen -= 0.4; b.mult *= 0.55; b.p.copy(p).addScaledVector(dir, 0.4); continue; }
        vivo = false;
      } else if (alvo.tipo === 'ator') {
        const a = alvo.a; let dano = danoNaDistancia(b.arma, b.dist) * b.mult * (alvo.zona === 'cabeca' ? b.arma.cabeca : alvo.zona === 'pernas' ? 0.72 : 1);
        aplicarDano(a, dano, alvo.zona, b.dono, dir, b.arma);
        somImpacto(alvo.zona === 'cabeca' && a.lado === 3 && b.arma.pen < 0.3 ? 'metal' : 'corpo', p, 0.9);
        emitir(p, 8, 0x8a0f0f, 1.4, 9.81, 0.45, dir);
        if (b.arma.pen >= 0.7) { b.mult *= 0.4; b.pen = 0; b.p.copy(p).addScaledVector(dir, 0.6); continue; }
        vivo = false;
      } else {
        const v = alvo.v; somImpacto('metal', p, 0.9); emitir(p, 6, 0xffd27a, 3, 9.81, 0.25); furo(p, dir.clone().negate());
        const dano = danoNaDistancia(b.arma, b.dist) * b.mult;
        J.danoVeiculo(v, dano * (1 - v.T.blind), b.dono);
        // carro comum: a bala pode atravessar a lataria e acertar quem está dentro
        if (v.motorista && Math.random() < (1 - v.T.blind) * 0.4 && inimigos(b.dono, v.motorista)) aplicarDano(v.motorista, dano * 0.7, 'tronco', b.dono, dir, b.arma, true);
        vivo = false;
      }
    }
    if (!vivo || b.dist > 1400 || b.p.y < -20) { J.balas.splice(i, 1); continue; }
    if (b.tracer && nt < MAXT) { const L = Math.min(4, b.dist), d2 = tmpA.copy(b.v).normalize(); tPos[nt * 6] = b.p.x - d2.x * L; tPos[nt * 6 + 1] = b.p.y - d2.y * L; tPos[nt * 6 + 2] = b.p.z - d2.z * L; tPos[nt * 6 + 3] = b.p.x; tPos[nt * 6 + 4] = b.p.y; tPos[nt * 6 + 5] = b.p.z; nt++; }
  }
  for (let k = nt; k < MAXT; k++) for (let c = 0; c < 6; c++) tPos[k * 6 + c] = 0;
  tGeo.attributes.position.needsUpdate = true; tGeo.setDrawRange(0, nt * 2);
}
let supressao = 0, ultimoDanoDir = [];
function aplicarDano(a, dano, zona, atacante, dir, arma, dentroCarro) {
  if (!a.vivo) return;
  if (atacante && atacante !== a && !inimigos(atacante, a)) return; // sem fogo amigo
  let d = dano;
  if (zona === 'tronco' && a.colete > 0 && !dentroCarro) { const absorve = arma ? (arma.pen < 0.3 ? 0.85 : 0.5) : 0.4, segura = Math.min(a.colete, d * absorve); a.colete = Math.max(0, a.colete - segura * (arma && arma.pen >= 0.3 ? 1.3 : 0.8)); d -= segura; }
  if (zona === 'cabeca' && a.lado === 3 && arma && arma.pen < 0.3) d *= 0.45; // capacete segura pistola
  a.vida -= d; a.ultimoDano = J.tempo;
  if (a.bot) { a.supressao = Math.min(2, a.supressao + 0.7); if (atacante && atacante.pos && !a.alvo) { a.ultimaPos = atacante.pos.clone(); a.vistoEm = J.tempo; a.estado = 'cacar'; a.yaw = Math.atan2(-(atacante.pos.x - a.pos.x), -(atacante.pos.z - a.pos.z)); } }
  if (a === J.jogador) { flashDano = Math.min(1, flashDano + d / 60); if (dir) ultimoDanoDir.push({ ang: Math.atan2(-dir.x, -dir.z) + Math.PI, t: 1.2 }); }
  if (atacante === J.jogador) mostrarHit(a.vida <= 0 ? 'morte' : zona === 'cabeca' ? 'cab' : '');
  if (a.vida <= 0) matar(a, atacante, arma, zona);
}
J.aplicarDano = aplicarDano;
function matar(a, atacante, arma, zona) {
  a.vivo = false; a.vida = 0; a.morteT = 0; a.respawn = 6; a.mortes++; a.caiDir = Math.random() < 0.5 ? 1 : -1;
  if (a.veiculo) { const v = a.veiculo; v.motorista = null; a.veiculo = null; a.pos.copy(v.pos); }
  if (a.partes) a.mesh.visible = true;
  if (atacante && atacante !== a && atacante.lado !== undefined) { atacante.abates = (atacante.abates || 0) + 1; if (atacante.lado !== a.lado) J.placar[atacante.lado] += 5; }
  addFeed(atacante, a, arma, zona);
  // a arma cai no chão (dá para pegar)
  const w = a.armas[0];
  if (w && (w.pente + w.reserva) > 0) {
    const md = modeloArma(w.def.id); md.g.scale.setScalar(1.15); md.g.position.set(a.pos.x, a.pos.y + 0.08, a.pos.z); md.g.rotation.set(0, Math.random() * 6, Math.PI / 2); cena.add(md.g);
    J.armasChao.push({ id: w.def.id, pente: w.pente, reserva: Math.max(w.reserva, w.def.pente), pos: a.pos.clone(), g: md.g, t: 60 });
    if (J.armasChao.length > 24) { const x = J.armasChao.shift(); cena.remove(x.g); }
  }
  if (a === J.jogador) aoMorrer(atacante, arma, zona);
}
// explosão: dano com linha de visão, quebra vidro, empurra fumaça
function explodir(p, raioMax, letal, danoMax, dono) {
  somExplosao(p);
  clarao(p, 6); emitir(p, 70, 0x3a3128, 9, 9.81, 1.2); emitir(p, 40, 0xffb347, 7, 2, 0.35);
  for (let k = 0; k < 10; k++) nuvem(new THREE.Vector3(p.x + (Math.random() - 0.5) * 2, p.y + Math.random() * 1.5, p.z + (Math.random() - 0.5) * 2), 2.2, 4 + Math.random() * 2, 0x4a4540, 0.7);
  const de = distOuvinte(p); if (de < 30) tremor = Math.max(tremor, 1 - de / 30);
  for (const a of J.atores) {
    if (!a.vivo || (dono && dono !== a && !inimigos(dono, a))) continue;
    const alvo = new THREE.Vector3(a.pos.x, a.pos.y + 1, a.pos.z), d = alvo.distanceTo(p); if (d > raioMax) continue;
    if (!visivel({ x: p.x, y: p.y + 0.35, z: p.z }, alvo, true)) continue;
    const dano = d < letal ? danoMax : danoMax * Math.pow(1 - (d - letal) / (raioMax - letal), 1.6) * 0.8;
    aplicarDano(a, dano, 'tronco', dono, alvo.clone().sub(p).normalize(), { pen: 0.5 });
  }
  for (const v of J.veiculos) { const d = v.pos.distanceTo(p); if (d < raioMax) J.danoVeiculo(v, danoMax * 2.2 * (1 - d / raioMax), dono); }
  caixasPerto(p.x, p.z, 7, b => { if (b.vidro !== undefined && !b.quebrado) { const c = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z: (b.z0 + b.z1) / 2 }; if (Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z) < 7) quebrarJanela(b, p, new THREE.Vector3(c.x - p.x, 0.3, c.z - p.z).normalize()); } });
}
J.lancarGranada = (a, tipo, alvoPos, forca) => {
  if (a.granadas[tipo] <= 0) return; a.granadas[tipo]--;
  const o = olho(a, new THREE.Vector3());
  let v;
  if (alvoPos) { const dx = alvoPos.x - o.x, dz = alvoPos.z - o.z, dy = alvoPos.y - o.y, d = Math.hypot(dx, dz), t = clamp(d / 13, 0.6, 1.8); v = new THREE.Vector3(dx / t, (dy + 0.5 * 9.81 * t * t) / t, dz / t); }
  else { const dir = new THREE.Vector3(); cam.getWorldDirection(dir); v = dir.multiplyScalar(forca || 17).add(new THREE.Vector3(0, 2.5, 0)); }
  const m = new THREE.Mesh(tipo === 'frag' ? new THREE.SphereGeometry(0.07, 8, 6) : new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8), new THREE.MeshLambertMaterial({ color: tipo === 'frag' ? 0x3b4a2a : 0x8d99ae })); cena.add(m);
  J.granadas.push({ tipo, p: o.clone().addScaledVector(v.clone().normalize(), 0.5), v, t: a.cozido || 0, dono: a, m, solta: 0 });
  a.cozido = 0;
  if (a === J.jogador) tocar('impacto_metal1', { vol: 0.2, taxa: 1.6 });
};
function atualizarGranadas(dt) {
  for (let i = J.granadas.length - 1; i >= 0; i--) {
    const g = J.granadas[i]; g.t += dt;
    const G = GRANADAS[g.tipo];
    if (g.tipo === 'frag' && g.t >= G.fusivel) { explodir(g.p.clone().setY(g.p.y + 0.1), G.raio, G.letal, G.dano, g.dono); cena.remove(g.m); J.granadas.splice(i, 1); continue; }
    if (g.tipo === 'fumaca' && g.t >= G.fusivel) { if (!g.fumacaRef) { g.fumacaRef = { x: g.p.x, y: g.p.y + 1.5, z: g.p.z, t: 0 }; J.fumacas.push(g.fumacaRef); tocar('estouro', { pos: g.p, vol: 0.35, ref: 4, taxa: 0.6 }); } g.fumacaRef.t += dt; if (Math.random() < dt * 14) nuvem(new THREE.Vector3(g.p.x + (Math.random() - 0.5) * 3, g.p.y + 0.6 + Math.random() * 1.5, g.p.z + (Math.random() - 0.5) * 3), 3 + Math.random() * 2, 7 + Math.random() * 4, 0xd9dcdf, 0.75, new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.25, (Math.random() - 0.5) * 1.2)); if (g.t > G.fusivel + G.duracao) { cena.remove(g.m); J.fumacas.splice(J.fumacas.indexOf(g.fumacaRef), 1); J.granadas.splice(i, 1); } continue; }
    // física: quica no chão e nas paredes
    g.v.y -= 9.81 * dt; const sp = g.v.length(); if (sp > 0.05) { const dir = g.v.clone().divideScalar(sp), len = sp * dt, h = raio(g.p, dir, len + 0.08); if (h) { const n = new THREE.Vector3(h.nx, h.ny, h.nz); g.p.addScaledVector(dir, Math.max(0, h.t - 0.08)); g.v.reflect(n).multiplyScalar(0.38); if (sp > 3) tocar('impacto_metal' + (1 + ((Math.random() * 4) | 0)), { pos: g.p, vol: Math.min(0.6, sp / 20), ref: 3, taxa: 1.5 }); if (h.caixa && h.caixa.vidro !== undefined) quebrarJanela(h.caixa, g.p, dir); } else g.p.addScaledVector(g.v, dt); }
    const ch = chaoEm(g.p.x, g.p.z, g.p.y + 0.2, 0.05, 0.3); if (g.p.y < ch + 0.07) { g.p.y = ch + 0.07; g.v.y = Math.abs(g.v.y) * 0.3; g.v.x *= 0.7; g.v.z *= 0.7; }
    g.m.position.copy(g.p);
  }
  for (const f of J.fumacas) f.t += 0;
}
J.danoVeiculo = (v, dano, atacante) => {
  if (v.destruido || dano <= 0) return; v.vida -= dano; if (v.motorista === J.jogador) flashDano = Math.min(1, flashDano + dano / 400);
  if (v.vida < v.T.vidaMax * 0.3 && Math.random() < 0.1) nuvem(new THREE.Vector3(v.pos.x, v.pos.y + 1.6, v.pos.z), 1.2, 3, 0x2b2b2b, 0.6);
  if (v.vida <= 0) {
    v.destruido = true; v.respawn = 75;
    const quem = v.motorista; if (quem) { quem.veiculo = null; v.motorista = null; quem.pos.copy(v.pos); aplicarDano(quem, 999, 'tronco', atacante, null, { pen: 1 }); }
    explodir(v.pos.clone().setY(v.pos.y + 1), 8, 3, 120, atacante);
    v.mesh.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color && o.material.color.setHex(0x1c1a18); } });
    if (v.som) { v.som.parar(); v.som = null; }
    if (v.heli) { v.velV.y = -6; }
  }
};
J.somBatida = v => tocar('metal_caindo', { pos: v.pos, vol: 0.9, ref: 6 });
J.atropelar = (v, a) => { if (a.atropeladoT && J.tempo - a.atropeladoT < 0.6) return; a.atropeladoT = J.tempo; const dano = Math.abs(v.vel) * 7; const quem = v.motorista; if (quem && !inimigos(quem, a)) return; aplicarDano(a, dano, 'tronco', quem, null, { pen: 1 }); a.vel.x += -Math.sin(v.yaw) * v.vel * 0.6; a.vel.z += -Math.cos(v.yaw) * v.vel * 0.6; a.vel.y = 3; somImpacto('corpo', a.pos, 1); };

/* ---------------- feed, placar, hitmarker ---------------- */
function corDe(a) { return a && a.lado !== undefined && LADOS[a.lado] ? LADOS[a.lado].cor : '#ccc'; }
function addFeed(atac, vit, arma, zona) {
  const nomeA = atac ? (atac === J.jogador ? 'VOCÊ' : atac.nome) : 'Queda', nomeV = vit === J.jogador ? 'VOCÊ' : vit.nome;
  const el = document.createElement('div'); el.innerHTML = `<span style="color:${corDe(atac)}">${nomeA}</span> <span style="color:#aaa">[${arma && arma.nome ? arma.nome : !arma ? 'queda' : arma.pen === 1 ? 'impacto' : 'explosão'}${zona === 'cabeca' ? ' · ☠ cabeça' : ''}]</span> <span style="color:${corDe(vit)}">${nomeV}</span>`;
  $('#feed').prepend(el); while ($('#feed').children.length > 6) $('#feed').lastChild.remove(); setTimeout(() => el.remove(), 7000);
}
let hitT = 0;
function mostrarHit(tipo) { const h = $('#hit'); h.className = tipo; h.style.opacity = 1; hitT = tipo === 'morte' ? 0.35 : 0.14; if (tipo === 'cab') tocar('impacto_metal2', { vol: 0.25, taxa: 2.4, variar: false }); else tocar('impacto_corpo1', { vol: 0.25, taxa: 1.8, variar: false }); }
let centroT = 0;
function centro(t, sub, ms = 2.2) { $('#centro').innerHTML = t + (sub ? `<small>${sub}</small>` : ''); $('#centro').style.opacity = 1; centroT = ms; }

/* ---------------- arma em primeira pessoa ---------------- */
const vm = {
  g: new THREE.Group(), modelo: null, chute: 0, balanco: 0, abaixar: 0, def: null,
  montar() {
    if (this.modelo) this.g.remove(this.modelo.g);
    const a = J.jogador; const w = a.armas[a.atual]; this.def = w.def; this.modelo = modeloArma(w.def.id); this.g.add(this.modelo.g);
    // braços (luva preta para a polícia, pele para as facções)
    if (this.bracos) this.g.remove(this.bracos);
    const cor = a.lado === 3 ? 0x1a1a1a : 0x8d5524, manga = a.lado === 3 ? (UNIDADES.find(u => u.id === a.unidade)?.farda || 0x222222) : 0x2a4d69;
    const br = new THREE.Group(); const mm = new THREE.MeshLambertMaterial({ color: cor }), ms = new THREE.MeshLambertMaterial({ color: manga });
    const mao1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.11), mm); mao1.position.set(0, -0.03, 0.03); br.add(mao1);
    const ant1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), ms); ant1.position.set(0.03, -0.07, 0.22); ant1.rotation.x = -0.2; br.add(ant1);
    const z2 = w.def.tipo === 'pistola' ? 0.03 : -0.24; const mao2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.11), mm); mao2.position.set(-0.01, -0.02, z2); br.add(mao2);
    const ant2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.34), ms); ant2.position.set(-0.12, -0.08, z2 + 0.16); ant2.rotation.set(-0.2, -0.5, 0); br.add(ant2);
    this.bracos = br; this.g.add(br);
  },
  bocaMundo() { const p = this.modelo.boca.clone(); this.modelo.g.localToWorld(p); // da cena da arma para o mundo
    p.applyMatrix4(new THREE.Matrix4().copy(vmCam.matrixWorld).invert()); p.applyMatrix4(cam.matrixWorld); return p; },
};
vmCena.add(vm.g);
function atualizarVM(dt) {
  const a = J.jogador; if (!a || !vm.modelo) return;
  const d = vm.def, ads = a.ads, vh = Math.hypot(a.vel.x, a.vel.z);
  vm.chute = Math.max(0, vm.chute - dt * 8); const amort = Math.pow(0.0005, dt); mouseVel.x = clamp(mouseVel.x * amort, -40, 40); mouseVel.y = clamp(mouseVel.y * amort, -40, 40);
  vm.balanco += dt * vh * (a.correndo ? 1.5 : 1.15);
  const bob = Math.min(1, vh / 4) * (1 - ads * 0.85), bx = Math.sin(vm.balanco) * 0.012 * bob, by = Math.abs(Math.cos(vm.balanco)) * 0.01 * bob;
  const hip = new THREE.Vector3(0.17, -0.18, d.tipo === 'pistola' ? -0.38 : -0.5), mira = new THREE.Vector3(0, -vm.modelo.miraY, d.tipo === 'pistola' ? -0.34 : -0.3);
  const pos = hip.clone().lerp(mira, ads);
  const baixo = (a.recarregando > 0 ? Math.sin(Math.PI * (1 - a.recarregando / Math.max(0.01, a.recargaTotal || 1))) * 0.12 : 0) + (a.trocando > 0 ? a.trocando / 0.55 * 0.3 : 0) + (a.correndo ? 0.06 : 0) + (a.curando > 0 ? 0.35 : 0) + (a.cozinhando ? 0.15 : 0);
  vm.g.position.set(pos.x + bx + (a.correndo ? 0.05 : 0), pos.y + by - baixo, pos.z + vm.chute * 0.06);
  vm.g.rotation.set(vm.chute * 0.09 + (a.recarregando > 0 ? 0.35 * Math.min(1, baixo * 8) : 0) - (a.correndo ? 0.25 : 0), (a.correndo ? 0.6 : 0) + mouseVel.x * 0.0006, (a.recarregando > 0 ? -0.4 * Math.min(1, baixo * 8) : 0) + mouseVel.x * 0.0004 + (a.correndo ? 0.2 : 0));
  // pente sai e volta na recarga
  const m = vm.modelo;
  if (m.pente && m.penteBase) { const f = a.recarregando > 0 && !d.porCartucho ? Math.sin(Math.PI * clamp(1 - a.recarregando / (a.recargaTotal || 1), 0, 1)) : 0; m.pente.position.copy(m.penteBase); m.pente.position.y -= f * 0.25; m.pente.visible = f < 0.8; }
  if (m.bomba) m.bomba.position.z = -0.32 + (a.ferrolho > 0 && a.ferrolho < 0.5 ? Math.sin(a.ferrolho / 0.5 * Math.PI) * 0.08 : 0);
  if (m.ferrolho && d.modos[0] === 'ferrolho') m.ferrolho.position.z = 0.04 + (a.ferrolho > 0 && a.ferrolho < 0.8 ? Math.sin(a.ferrolho / 0.8 * Math.PI) * 0.07 : 0);
  vm.g.visible = !(d.luneta && ads > 0.85) && a.vivo && !a.veiculo;
}

/* ---------------- entrada ---------------- */
const teclas = new Set(), mouse = { esq: false, dir: false, novoEsq: false }, mouseVel = { x: 0, y: 0 };
let travado = false;
addEventListener('keydown', e => { if (estado !== 'jogo') return; if (['Tab', 'Space'].includes(e.code)) e.preventDefault(); if (!teclas.has(e.code)) teclaApertada(e.code); teclas.add(e.code); });
addEventListener('keyup', e => { teclas.delete(e.code); teclaSolta(e.code); });
addEventListener('blur', () => { teclas.clear(); mouse.esq = mouse.dir = false; });
canvas.addEventListener('mousedown', e => { if (estado !== 'jogo') return; if (!travado && !TOQUE) { canvas.requestPointerLock(); return; } if (e.button === 0) { mouse.esq = true; mouse.novoEsq = true; } if (e.button === 2) mouse.dir = true; });
addEventListener('mouseup', e => { if (e.button === 0) mouse.esq = false; if (e.button === 2) mouse.dir = false; });
addEventListener('contextmenu', e => { if (estado === 'jogo') e.preventDefault(); });
addEventListener('wheel', e => { if (estado === 'jogo' && J.jogador && J.jogador.vivo && !J.jogador.veiculo) J.trocarArma(J.jogador, J.jogador.atual ? 0 : 1); });
addEventListener('mousemove', e => {
  if (!travado || estado !== 'jogo') return; const a = J.jogador; if (!a) return;
  mouseVel.x = e.movementX; mouseVel.y = e.movementY;
  const zoom = a.veiculo ? 1 : Math.tan(cam.fov * DEG / 2) / Math.tan(CFG.fov * DEG / 2), k = 0.0022 * CFG.sens * zoom;
  if (a.veiculo) { camOrbita.yaw -= e.movementX * k; camOrbita.pitch = clamp(camOrbita.pitch - e.movementY * k, -0.6, 0.5); camOrbita.t = 2.5; return; }
  a.yaw -= e.movementX * k; a.pitch = clamp(a.pitch - e.movementY * k * (CFG.inverter ? -1 : 1), -1.5, 1.5);
});
document.addEventListener('pointerlockchange', () => { travado = document.pointerLockElement === canvas; if (!travado && estado === 'jogo' && !TOQUE && !morteAberta) pausar(); });
const camOrbita = { yaw: 0, pitch: -0.15, t: 0 };
function teclaApertada(c) {
  const a = J.jogador; if (!a) return;
  if (c === 'Escape') { pausar(); return; }
  if (c === 'KeyM') { $('#mapaGrande').style.display = $('#mapaGrande').style.display === 'block' ? 'none' : 'block'; desenharMapaGrande(); }
  if (c === 'Tab') mostrarTabela(true);
  if (!a.vivo) { if ((c === 'Space' || c === 'KeyF') && morteAberta && a.respawn <= 0) renascer('base'); return; }
  if (a.veiculo) { if (c === 'KeyF') sairVeiculo(); return; }
  if (c === 'KeyR') J.recarregar(a);
  if (c === 'Digit1') J.trocarArma(a, 0); if (c === 'Digit2') J.trocarArma(a, 1);
  if (c === 'KeyB') { const w = a.armas[a.atual]; a.modo = (a.modo + 1) % w.def.modos.length; centro('', 'Modo: ' + { auto: 'automático', semi: 'semiautomático', rajada: 'rajada de 3', bomba: 'bomba', ferrolho: 'ferrolho' }[w.def.modos[a.modo]], 1); tocar('impacto_metal3', { vol: 0.15, taxa: 2.5 }); }
  if (c === 'KeyC') a.agachado = !a.agachado;
  if (c === 'KeyG' && a.granadas.frag > 0 && !a.cozinhando && a.recarregando <= 0) { a.cozinhando = true; a.cozido = 0; tocar('impacto_metal4', { vol: 0.2, taxa: 2 }); }
  if (c === 'KeyT' && a.granadas.fumaca > 0) J.lancarGranada(a, 'fumaca', null, 15);
  if (c === 'KeyX' && a.curativos > 0 && a.vida < 100 && a.curando <= 0) { a.curando = 3; centro('', '🩹 Fazendo curativo…', 2.5); }
  if (c === 'KeyV') coronhada(a);
  if (c === 'KeyF') interagir(a);
}
function teclaSolta(c) {
  const a = J.jogador; if (!a) return;
  if (c === 'Tab') mostrarTabela(false);
  if (c === 'KeyG' && a.cozinhando) { a.cozinhando = false; J.lancarGranada(a, 'frag', null, 17); }
}
const k = c => teclas.has(c);
function coronhada(a) {
  if (a.cad > 0) return; a.cad = 0.7; vm.chute = 1.2; tocar('impacto_madeira2', { vol: 0.2, taxa: 0.7 });
  const o = olho(a, new THREE.Vector3()), d = direcaoOlhar(a, new THREE.Vector3());
  for (const b of J.atores) { if (!b.vivo || !inimigos(a, b)) continue; const h = raioAtor(b, o, d, 1.9); if (h) { const costas = Math.cos(b.yaw - a.yaw) > 0.5; aplicarDano(b, costas ? 120 : 55, 'tronco', a, d, { nome: 'Coronhada', pen: 0.2 }); somImpacto('corpo', b.pos, 1); break; } }
}
// interação: loja, arma no chão, veículo
function alvoInteracao(a) {
  for (const l of LOJAS) if ((l.lado === a.lado || l.lado === -1) && Math.hypot(l.x - a.pos.x, l.z - a.pos.z) < 3.5) return { tipo: 'loja', l, txt: `[F] ${l.nome}: munição, granadas e curativos (grátis)` };
  for (const w of J.armasChao) if (w.pos.distanceTo(a.pos) < 2.2) return { tipo: 'arma', w, txt: `[F] Pegar ${ARMAS[w.id].nome} (${w.pente}/${w.reserva})` };
  for (const v of J.veiculos) { if (v.destruido || v.motorista) continue; const d = v.pos.distanceTo(a.pos); if (d < (v.heli ? 5 : 3.8)) { const pode = v.lado === -1 || v.lado === a.lado; return pode ? { tipo: 'veic', v, txt: `[F] Entrar: ${v.T.nome} · ⛽ ${Math.round(v.comb)} L` } : { tipo: 'nada', txt: `${v.T.nome} — só para ${LADOS[v.lado].nome}` }; } }
  return null;
}
function interagir(a) {
  const t = alvoInteracao(a); if (!t) return;
  if (t.tipo === 'loja') { J.reabastecer(a); tocar('recarga_geral', { vol: 0.6 }); centro('', '✅ Munição, granadas, curativos e colete repostos', 1.8); }
  if (t.tipo === 'arma') { const w = t.w, def = ARMAS[w.id], slot = def.tipo === 'pistola' ? 1 : 0, velha = a.armas[slot]; a.armas[slot] = { def, pente: w.pente, reserva: w.reserva }; cena.remove(w.g); J.armasChao.splice(J.armasChao.indexOf(w), 1); if (velha) { const md = modeloArma(velha.def.id); md.g.scale.setScalar(1.15); md.g.position.set(a.pos.x, a.pos.y + 0.08, a.pos.z); md.g.rotation.set(0, Math.random() * 6, Math.PI / 2); cena.add(md.g); J.armasChao.push({ id: velha.def.id, pente: velha.pente, reserva: velha.reserva, pos: a.pos.clone(), g: md.g, t: 60 }); } a.atual = slot; J.trocarArma(a, slot === 0 ? 1 : 0); J.trocarArma(a, slot); }
  if (t.tipo === 'veic') entrarVeiculo(a, t.v);
}
function entrarVeiculo(a, v) { a.veiculo = v; v.motorista = a; v.ia = null; camOrbita.yaw = 0; camOrbita.pitch = -0.15; tocar('impacto_metal1', { vol: 0.3, taxa: 0.7 }); centro('', v.heli ? 'W/S inclina · A/D gira · Espaço sobe · Ctrl desce · Q/E de lado · F sai' : 'W/S acelera · A/D vira · Espaço freia · F sai · segure F no posto para abastecer', 4); }
function sairVeiculo() {
  const a = J.jogador, v = a.veiculo; if (!v) return;
  if (v.heli && v.pos.y > chaoEm(v.pos.x, v.pos.z, v.pos.y + 0.5, 1.2, 1.5) + 2.5) { centro('', 'Pouse antes de sair!', 1.5); return; }
  const rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw), off = (v.heli ? 2.6 : v.T.larg / 2 + 1.0);
  a.pos.set(v.pos.x - rx * off, v.pos.y + 0.3, v.pos.z - rz * off); a.pos.y = chaoEm(a.pos.x, a.pos.z, a.pos.y + 1.5) + 0.05; a.vel.set(0, 0, 0);
  v.motorista = null; a.veiculo = null; a.yaw = v.yaw; a.pitch = 0;
  if (v.som && !v.heli) { v.som.parar(); v.som = null; }
}

/* ---------------- jogador ---------------- */
let flashDano = 0, folegoMsg = 0, abastecendo = 0;
function atualizarJogador(dt) {
  const a = J.jogador;
  if (!a.vivo) return;
  if (a.veiculo) return controlarVeiculo(a, a.veiculo, dt);
  const w = a.armas[a.atual], d = w.def;
  // movimento
  let fw = (k('KeyW') ? 1 : 0) - (k('KeyS') ? 1 : 0), st = (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0);
  if (toque.ativo) { fw -= toque.joy.y; st += toque.joy.x; }
  const agachar = k('ControlLeft') || k('ControlRight'); if (agachar) a.agachado = true; else if (a.agachouSegurando && !agachar) a.agachado = false; a.agachouSegurando = agachar;
  const querCorrer = (k('ShiftLeft') || toque.correr || Math.hypot(toque.joy.x, toque.joy.y) > 0.92) && fw > 0 && a.ads < 0.3 && !a.agachado && a.folego > 0.05 && a.recarregando <= 0 && !mouse.esq;
  a.correndo = querCorrer;
  const vMax = (a.correndo ? 6.3 : a.agachado ? 2.1 : 4.3) * d.peso * (1 - a.ads * 0.42) * (a.curando > 0 ? 0.45 : 1);
  const fx = -Math.sin(a.yaw), fz = -Math.cos(a.yaw), rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw);
  let qx = fx * fw + rx * st, qz = fz * fw + rz * st; const ql = Math.hypot(qx, qz); if (ql > 1) { qx /= ql; qz /= ql; }
  const ac = a.noChao ? 11 : 1.8;
  a.vel.x += (qx * vMax - a.vel.x) * Math.min(1, ac * dt); a.vel.z += (qz * vMax - a.vel.z) * Math.min(1, ac * dt);
  if ((k('Space') || toque.pular) && a.noChao && a.folego > 0.12) { a.vel.y = 4.7; a.noChao = false; a.folego -= 0.1; if (a.agachado) a.agachado = false; toque.pular = false; }
  a.folego = clamp(a.folego + (a.correndo ? -0.11 : 0.16) * dt, 0, 1);
  const yAntes = a.pos.y;
  moverAtor(a, dt);
  if (a.quedaDano) { aplicarDano(a, a.quedaDano, 'pernas', null, null, null); a.quedaDano = 0; tocar('impacto_corpo3', { vol: 0.6 }); }
  // passos (reais) — mais alto correndo, quase nada agachado
  const vh = Math.hypot(a.vel.x, a.vel.z);
  if (a.noChao && vh > 0.6) { a.passoT += vh * dt; const intervalo = a.correndo ? 2.6 : 2.0; if (a.passoT > intervalo) { a.passoT = 0; tocar('passo' + (1 + ((Math.random() * 6) | 0)), { vol: a.agachado ? 0.08 : a.correndo ? 0.42 : 0.24, taxa: 0.9 + Math.random() * 0.2 }); } }
  // inclinar (espiar pela quina)
  const incl = (k('KeyE') ? 1 : 0) - (k('KeyQ') ? 1 : 0); a.inclinar += (incl - a.inclinar) * Math.min(1, 10 * dt);
  // mirar
  const querMirar = (mouse.dir || toque.mirar) && !a.correndo && a.recarregando <= 0 && a.curando <= 0;
  a.ads = clamp(a.ads + (querMirar ? 1 : -1) * dt / d.adsTempo, 0, 1);
  // respiração na luneta (balanço; Shift segura por alguns segundos)
  // timers
  a.cad -= dt; a.trocando = Math.max(0, a.trocando - dt); a.ferrolho = Math.max(0, a.ferrolho - dt); a.calor = Math.max(0, (a.calor || 0) - dt * 2.2);
  if (a.recarregando > 0) { a.recarregando -= dt; if (a.recarregando <= 0) fimRecarga(a); if (mouse.novoEsq && d.porCartucho && w.pente > 0) a.recarregando = 0; }
  if (a.curando > 0) { a.curando -= dt; if (a.curando <= 0 && a.curativos > 0) { a.curativos--; a.vida = Math.min(100, a.vida + 45); centro('', '🩹 +45 de vida', 1.2); } }
  if (a.cozinhando) { a.cozido += dt; if (a.cozido >= GRANADAS.frag.fusivel - 0.05) { a.cozinhando = false; J.lancarGranada(a, 'frag', null, 2); } }
  // atirar
  const modo = d.modos[a.modo] || d.modos[0];
  if (w.pente === 0 && mouse.novoEsq && w.reserva > 0 && a.recarregando <= 0) J.recarregar(a);
  if (mouse.esq || toque.atirar) {
    if (modo === 'auto' && J.podeAtirar(a)) J.disparar(a);
    else if ((modo === 'semi' || modo === 'bomba' || modo === 'ferrolho') && (mouse.novoEsq || toque.novoTiro) && J.podeAtirar(a)) J.disparar(a);
    else if (modo === 'rajada' && (mouse.novoEsq || toque.novoTiro) && J.podeAtirar(a)) a.rajada = 3;
    else if (w.pente === 0 && (mouse.novoEsq || toque.novoTiro)) J.disparar(a);
  }
  if (a.rajada > 0 && J.podeAtirar(a)) { J.disparar(a); a.rajada--; }
  mouse.novoEsq = false; toque.novoTiro = false;
  if (w.pente === 0 && w.reserva > 0 && a.recarregando <= 0 && a.cad <= -0.25 && !mouse.esq) J.recarregar(a);
  // recuo volta aos poucos
  if (recuoVolta > 0) { const r = Math.min(recuoVolta, dt * 6 * recuoVolta + dt * 0.02); a.pitch -= r; recuoVolta -= r; }
  // interação
  const t = alvoInteracao(a); $('#aviso').style.display = t ? 'block' : 'none'; if (t) $('#aviso').textContent = t.txt;
  void yAntes;
}
function controlarVeiculo(a, v, dt) {
  const ent = { frente: k('KeyW') ? 1 : 0, tras: k('KeyS') ? 1 : 0, esq: k('KeyA') ? 1 : 0, dir: k('KeyD') ? 1 : 0, freio: k('Space'), sobe: (k('Space') ? 1 : 0) - (k('ControlLeft') || k('ControlRight') ? 1 : 0), lateral: false };
  if (toque.ativo) { ent.frente = Math.max(ent.frente, -toque.joy.y > 0.2 ? -toque.joy.y : 0); ent.tras = Math.max(ent.tras, toque.joy.y > 0.2 ? toque.joy.y : 0); ent.esq = Math.max(ent.esq, -toque.joy.x > 0.2 ? -toque.joy.x : 0); ent.dir = Math.max(ent.dir, toque.joy.x > 0.2 ? toque.joy.x : 0); if (v.heli) ent.sobe = toque.pular ? 1 : toque.agachar ? -1 : 0; }
  if (v.heli && (k('KeyQ') || k('KeyE'))) { ent.lateral = true; ent.esq = k('KeyQ') ? 1 : 0; ent.dir = k('KeyE') ? 1 : 0; }
  dirigir(J, v, ent, dt); a.pos.copy(v.pos);
  // abastecer (de graça): segure F parado perto da bomba
  const b = bombaPerto(v); let txt = '';
  if (b && Math.abs(v.vel) < 1.2 && v.comb < v.T.tanque - 0.1) { if (k('KeyF') || toque.interagir) { abastecendo += dt; v.comb = Math.min(v.T.tanque, v.comb + 9 * dt); txt = `⛽ Abastecendo… ${Math.round(v.comb)}/${v.T.tanque} L`; } else txt = '[Segure F] Abastecer (grátis)'; }
  else if (v.comb <= 0) txt = v.heli ? '⛽ Sem combustível! Abasteça no heliponto da base.' : '⛽ Sem combustível! Empurre… ou vá a pé até o posto na BR.';
  $('#aviso').style.display = txt ? 'block' : 'none'; if (txt) $('#aviso').textContent = txt;
}

/* ---------------- câmera ---------------- */
let camAlvo = new THREE.Vector3(), quedaCam = 0;
function atualizarCamera(dt) {
  const a = J.jogador; if (!a) return;
  if (a.veiculo) {
    const v = a.veiculo, dist = v.heli ? 13 : v.tipo === 'blindado' ? 9 : 7.2, alt = v.heli ? 4 : 2.6;
    camOrbita.t -= dt; if (camOrbita.t <= 0) { camOrbita.yaw *= Math.pow(0.1, dt); camOrbita.pitch += (-0.15 - camOrbita.pitch) * Math.min(1, dt * 2); }
    const y = v.yaw + camOrbita.yaw; const alvo = new THREE.Vector3(v.pos.x + Math.sin(y) * dist * Math.cos(camOrbita.pitch), v.pos.y + alt - Math.sin(camOrbita.pitch) * dist, v.pos.z + Math.cos(y) * dist * Math.cos(camOrbita.pitch));
    alvo.y = Math.max(alvo.y, alturaTerreno(alvo.x, alvo.z) + 0.6);
    cam.position.lerp(alvo, 1 - Math.pow(0.0005, dt)); cam.lookAt(v.pos.x, v.pos.y + (v.heli ? 1.5 : 1.2), v.pos.z);
    cam.fov = lerp(cam.fov, CFG.fov, 0.1); cam.updateProjectionMatrix(); return;
  }
  if (!a.vivo) { // câmera de morte: olha o próprio corpo caindo
    quedaCam = Math.min(1, quedaCam + dt); const p = a.pos; cam.position.lerp(new THREE.Vector3(p.x + 2.5, p.y + 2.2 + quedaCam, p.z + 2.5), 0.05); cam.lookAt(p.x, p.y + 0.3, p.z); return;
  }
  quedaCam = 0;
  const alturaOlho = a.agachado ? OLHO_AGACHADO : OLHO;
  camAlvo.set(a.pos.x, a.pos.y + alturaOlho, a.pos.z);
  if (!cam.userData.y) cam.userData.y = camAlvo.y;
  cam.userData.y = lerp(cam.userData.y, camAlvo.y, Math.min(1, dt * 14)); // suaviza degraus
  // inclinar: desloca de lado, sem atravessar parede
  let lado = a.inclinar * 0.45; if (Math.abs(lado) > 0.01) { const rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw), h = raio({ x: camAlvo.x, y: cam.userData.y, z: camAlvo.z }, { x: rx * Math.sign(lado), y: 0, z: rz * Math.sign(lado) }, Math.abs(lado) + 0.2); if (h) lado = Math.sign(lado) * Math.max(0, h.t - 0.25); }
  const rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw);
  cam.position.set(camAlvo.x + rx * lado, cam.userData.y - Math.abs(a.inclinar) * 0.06, camAlvo.z + rz * lado);
  // tremor (tiro, explosão, bala passando)
  tremor = Math.max(0, tremor - dt * 2.2);
  let sway = 0, swayY = 0;
  const d = a.armas[a.atual].def;
  if (d.luneta && a.ads > 0.8) { const segura = (k('ShiftLeft') && a.folego > 0.05); if (segura) a.folego = Math.max(0, a.folego - dt * 0.18); const amp = segura ? 0.0006 : 0.004; const t = J.tempo; sway = Math.sin(t * 0.9) * amp + Math.sin(t * 2.3) * amp * 0.4; swayY = Math.cos(t * 1.3) * amp * 0.8; }
  cam.rotation.set(a.pitch + swayY + (Math.random() - 0.5) * tremor * 0.02, a.yaw + sway + (Math.random() - 0.5) * tremor * 0.02, -a.inclinar * 0.16);
  const fovAlvo = lerp(CFG.fov, d.luneta && a.ads > 0.85 ? d.fovAds : lerp(CFG.fov, d.fovAds, 0.85), a.ads) * (a.correndo ? 1.04 : 1);
  if (Math.abs(cam.fov - fovAlvo) > 0.01) { cam.fov = lerp(cam.fov, fovAlvo, Math.min(1, dt * 18)); cam.updateProjectionMatrix(); }
}

/* ---------------- pontos de controle e placar ---------------- */
let tPontos = 0, tPlacar = 0;
function atualizarPontos(dt) {
  tPontos += dt; if (tPontos < 0.25) return; const pass = tPontos; tPontos = 0;
  for (const p of PONTOS) {
    const cont = [0, 0, 0, 0];
    for (const a of J.atores) if (a.vivo && !a.veiculo && Math.hypot(a.pos.x - p.x, a.pos.z - p.z) < p.r && Math.abs(a.pos.y - p.y) < 10) cont[a.lado]++;
    const ladosPresentes = cont.map((c, i) => c > 0 ? i : -1).filter(i => i >= 0);
    p.disputa = ladosPresentes.length > 1;
    if (ladosPresentes.length === 1) {
      const l = ladosPresentes[0], vel = pass * (1 / 14) * Math.min(3, cont[l]);
      if (p.quem !== l) { p.progresso -= vel; if (p.progresso <= 0) { p.progresso = 0; p.quem = l; if (p.dono !== -1) { if (p.dono === J.jogador.lado) centro('⚠ PERDENDO ' + p.letra, p.nome, 2); p.dono = -1; } } }
      else if (p.progresso < 1) { p.progresso = Math.min(1, p.progresso + vel); if (p.progresso >= 1 && p.dono !== l) { p.dono = l; if (l === J.jogador.lado) centro('✅ PONTO ' + p.letra + ' DOMINADO', p.nome, 2.2); else centro('', `${LADOS[l].nome} tomou ${p.letra} · ${p.nome}`, 2); } }
    }
    p.bandeira.material.color.set(p.dono >= 0 ? LADOS[p.dono].cor : '#dddddd');
    p.bandeira.position.y = p.y + 1.6 + 6.5 * (p.dono >= 0 ? 1 : p.progresso);
    p.anel.material.color.set(p.disputa ? '#ff5d5d' : p.quem >= 0 ? LADOS[p.quem].cor : '#ffffff');
  }
  tPlacar += pass; if (tPlacar >= 2) { tPlacar = 0; for (const p of PONTOS) if (p.dono >= 0) J.placar[p.dono] += 2; }
  const max = Math.max(...J.placar); if ((max >= META || tempoPartida >= DURACAO) && !fimPartida) terminar();
}

/* ---------------- HUD ---------------- */
const mmCtx = $('#minimapa').getContext('2d'); let mapaBase = null;
function prepararMapaBase() {
  const c = document.createElement('canvas'); c.width = MX * 2; c.height = MZ * 2; const g = c.getContext('2d');
  const img = g.createImageData(c.width, c.height);
  for (let z = 0; z < c.height; z++) for (let x = 0; x < c.width; x++) { const h = alturaTerreno(x - MX, z - MZ), k = (z * c.width + x) * 4; let r = 70 + h * 1.6, gg = 92 + h * 1.2, b = 52 + h * 0.6; for (const m of MORROS) if (Math.hypot(x - MX - m.x, z - MZ - m.z) < m.r) { r = 110 + h; gg = 104 + h; b = 96 + h * 0.8; } img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.strokeStyle = '#2b2d31'; g.lineWidth = 20; g.beginPath(); LINHAS.BR.forEach(([x, z], i) => i ? g.lineTo(x + MX, z + MZ) : g.moveTo(x + MX, z + MZ)); g.stroke();
  g.lineWidth = 7; g.strokeStyle = '#55585e'; for (const L of LINHAS.ruas) { g.beginPath(); L.forEach(([x, z], i) => i ? g.lineTo(x + MX, z + MZ) : g.moveTo(x + MX, z + MZ)); g.stroke(); }
  g.fillStyle = '#3b3631'; for (const c2 of CASAS) g.fillRect(c2.b.x0 + MX, c2.b.z0 + MZ, c2.b.x1 - c2.b.x0, c2.b.z1 - c2.b.z0);
  g.fillStyle = '#ffd166'; for (const l of LOJAS) { g.beginPath(); g.arc(l.x + MX, l.z + MZ, 3, 0, 7); g.fill(); }
  g.fillStyle = '#7bd88f'; for (const b of BOMBAS) g.fillRect(b.x + MX - 2, b.z + MZ - 2, 4, 4);
  mapaBase = c;
}
function desenharMinimapa() {
  const a = J.jogador; if (!a || !mapaBase) return; const W = 380, esc = 1.35, ctx = mmCtx, p = a.veiculo ? a.veiculo.pos : a.pos, yaw = a.veiculo ? a.veiculo.yaw : a.yaw;
  ctx.save(); ctx.clearRect(0, 0, W, W); ctx.beginPath(); ctx.arc(W / 2, W / 2, W / 2, 0, 7); ctx.clip();
  ctx.translate(W / 2, W / 2); ctx.rotate(yaw); ctx.scale(esc, esc); ctx.translate(-(p.x + MX), -(p.z + MZ));
  ctx.drawImage(mapaBase, 0, 0);
  for (const pt of PONTOS) { ctx.strokeStyle = pt.dono >= 0 ? LADOS[pt.dono].cor : '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(pt.x + MX, pt.z + MZ, pt.r, 0, 7); ctx.stroke(); ctx.save(); ctx.translate(pt.x + MX, pt.z + MZ); ctx.rotate(-yaw); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center'; ctx.fillText(pt.letra, 0, 4); ctx.restore(); }
  for (const o of J.atores) { if (!o.vivo || o === a) continue; const amigo = !inimigos(a, o); if (!amigo && !(J.tempo - (o.revelado || -9) < 2.5 && o.pos.distanceTo(a.pos) < 120)) continue; ctx.fillStyle = amigo ? LADOS[o.lado].cor : '#ff3b3b'; ctx.beginPath(); ctx.arc(o.pos.x + MX, o.pos.z + MZ, amigo ? 2.4 : 3, 0, 7); ctx.fill(); }
  for (const v of J.veiculos) { if (v.destruido) continue; ctx.fillStyle = v.heli ? '#a0c4ff' : '#cbd5e1'; ctx.fillRect(v.pos.x + MX - 2, v.pos.z + MZ - 2, 4, 4); }
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(W / 2, W / 2 - 10); ctx.lineTo(W / 2 - 7, W / 2 + 8); ctx.lineTo(W / 2 + 7, W / 2 + 8); ctx.fill();
}
function desenharMapaGrande() {
  const c = $('#mapaGrande'), g = c.getContext('2d'), a = J.jogador; if (!mapaBase) return; g.drawImage(mapaBase, 0, 0, c.width, c.height); const s = c.width / (MX * 2);
  for (const pt of PONTOS) { g.strokeStyle = pt.dono >= 0 ? LADOS[pt.dono].cor : '#fff'; g.lineWidth = 4; g.beginPath(); g.arc((pt.x + MX) * s, (pt.z + MZ) * s, pt.r * s, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 22px Inter'; g.textAlign = 'center'; g.fillText(pt.letra + ' ' + pt.nome, (pt.x + MX) * s, (pt.z + MZ) * s - pt.r * s - 6); }
  g.fillStyle = '#ffd166'; g.font = 'bold 18px Inter'; for (const l of LOJAS) g.fillText('🔫', (l.x + MX) * s, (l.z + MZ) * s); g.fillText('⛽', (POSTO.x + MX) * s, (brZ(POSTO.x) + 20 + MZ) * s - 24); g.fillText('H', (HELIPONTO.x + MX) * s, (HELIPONTO.z + MZ) * s);
  for (const m of MORROS) { g.fillStyle = LADOS[m.lado].cor; g.font = 'bold 26px "Barlow Condensed"'; g.fillText(m.nome.toUpperCase(), (m.x + MX) * s, (m.z + MZ + m.r * 0.85) * s); }
  g.fillStyle = '#ff5d5d'; g.fillText('BATALHÃO', (BASE_POLICIA.x + MX) * s, (BASE_POLICIA.z + MZ) * s); g.fillStyle = '#ddd'; g.fillText('BR-707', (-300 + MX) * s, (brZ(-300) + MZ) * s - 16);
  if (a) { const p = a.veiculo ? a.veiculo.pos : a.pos; g.fillStyle = '#fff'; g.beginPath(); g.arc((p.x + MX) * s, (p.z + MZ) * s, 8, 0, 7); g.fill(); }
}
function mostrarTabela(on) {
  const t = $('#tabela'); t.style.display = on ? 'block' : 'none'; if (!on) return;
  t.innerHTML = `<h2>Placar</h2><div class="grade" style="grid-template-columns:repeat(4,1fr)">${LADOS.map(L => `<div><b style="color:${L.cor}">${L.nome}</b> · ${Math.round(J.placar[L.id])}<table>${J.atores.filter(a => a.lado === L.id).sort((x, y) => y.abates - x.abates).map(a => `<tr><td>${a === J.jogador ? '⭐ ' : ''}${a.nome}${a.unidade ? ' <small>' + a.unidade + '</small>' : ''}</td><td>${a.abates}/${a.mortes}</td></tr>`).join('')}</table></div>`).join('')}</div>`;
}
const PONTOS_CARD = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
let hudT = 0;
function atualizarHUD(dt) {
  const a = J.jogador; if (!a) return;
  hitT -= dt; if (hitT <= 0) $('#hit').style.opacity = 0;
  centroT -= dt; if (centroT <= 0) $('#centro').style.opacity = 0;
  flashDano = Math.max(0, flashDano - dt * 0.8); supressao = Math.max(0, supressao - dt * 0.6);
  const vidaBaixa = a.vivo ? clamp(1 - a.vida / 60, 0, 1) : 1;
  $('#vinheta').style.background = `radial-gradient(ellipse at center, transparent ${55 - vidaBaixa * 25}%, rgba(140,0,0,${Math.min(0.85, flashDano * 0.8 + vidaBaixa * 0.45)}) 100%)`;
  $('#supr').style.opacity = supressao * 0.8;
  // mira dinâmica (mostra o espalhamento real)
  const w = a.armas[a.atual], d = w.def;
  const esp = espalhamento(a) * DEG, px = Math.tan(esp) / Math.tan(cam.fov * DEG / 2) * (innerHeight / 2), gap = Math.max(3, px);
  const mostrar = a.vivo && !a.veiculo && a.ads < 0.6 && !(d.luneta && a.ads > 0.3);
  $('#mira').style.display = mostrar ? 'block' : 'none';
  $('#mt').style.cssText = `width:2px;height:8px;left:-1px;top:${-gap - 8}px`; $('#mb').style.cssText = `width:2px;height:8px;left:-1px;top:${gap}px`; $('#ml').style.cssText = `width:8px;height:2px;top:-1px;left:${-gap - 8}px`; $('#mr').style.cssText = `width:8px;height:2px;top:-1px;left:${gap}px`;
  $('#luneta').style.display = a.vivo && !a.veiculo && d.luneta && a.ads > 0.85 ? 'block' : 'none';
  // setas de dano
  ultimoDanoDir = ultimoDanoDir.filter(s => (s.t -= dt) > 0);
  $('#setas').innerHTML = ultimoDanoDir.map(s => `<div style="transform:rotate(${(s.ang - a.yaw) * 180 / Math.PI + 180}deg);opacity:${Math.min(1, s.t)}"></div>`).join('');
  hudT -= dt; if (hudT > 0) return; hudT = 0.1;
  $('#t-vida').textContent = Math.max(0, Math.round(a.vida)); $('#b-vida').style.width = Math.max(0, a.vida) + '%'; $('#b-vida').style.background = a.vida < 30 ? '#ff4d4d' : '#e9ecef';
  $('#t-colete').textContent = Math.round(a.colete); $('#b-colete').style.width = (a.colete / Math.max(1, a.coleteMax)) * 100 + '%';
  $('#t-folego').textContent = a.folego < 0.25 ? '😮‍💨 SEM FÔLEGO' : `🫁 FÔLEGO ${Math.round(a.folego * 100)}%`; $('#t-cur').textContent = `🩹 ${a.curativos} [X]`;
  $('#t-arma').textContent = d.nome + ' · ' + ({ auto: 'AUTO', semi: 'SEMI', rajada: 'RAJADA', bomba: 'BOMBA', ferrolho: 'FERROLHO' }[d.modos[a.modo] || d.modos[0]]);
  $('#t-mun').innerHTML = `${w.pente}<small> / ${w.reserva}</small>`; $('#t-mun').style.color = w.pente === 0 ? '#ff5d5d' : w.pente <= d.pente * 0.25 ? '#ffd166' : '#fff';
  $('#t-extra').textContent = `💣 ${a.granadas.frag} [G]   💨 ${a.granadas.fumaca} [T]` + (w.pente === 0 && w.reserva === 0 ? '   ⚠ SEM MUNIÇÃO — vá à loja' : a.recarregando > 0 ? '   ⟳ recarregando' : '');
  // bússola
  const graus = ((-a.yaw * 180 / Math.PI) % 360 + 360) % 360; let s = ''; for (let g = -180; g <= 540; g += 15) { const gg = (g + 360) % 360; s += `<span style="display:inline-block;width:30px;text-align:center;color:${gg % 90 === 0 ? '#ffb703' : '#cfd6df'}">${gg % 45 === 0 ? PONTOS_CARD[gg / 45] : '·'}</span>`; } $('#bussola-faixa').innerHTML = s; $('#bussola-faixa').style.left = (-(graus + 180) / 15 * 30 + ($('#bussola').clientWidth / 2) - 15) + 'px';
  // placar e pontos
  const mm = Math.floor((DURACAO - tempoPartida) / 60), ss = Math.max(0, Math.floor((DURACAO - tempoPartida) % 60));
  $('#placar').innerHTML = LADOS.map(L => `<div class="ld cond ${L.id === a.lado ? 'meu' : ''}" style="border-color:${L.cor};color:${L.cor}">${L.sigla} ${Math.round(J.placar[L.id])}</div>`).slice(0, 2).join('') + `<div class="tempo cond">${mm}:${String(ss).padStart(2, '0')}</div>` + LADOS.map(L => `<div class="ld cond ${L.id === a.lado ? 'meu' : ''}" style="border-color:${L.cor};color:${L.cor}">${L.sigla} ${Math.round(J.placar[L.id])}</div>`).slice(2).join('');
  $('#pontos').innerHTML = PONTOS.map(p => `<div class="cp cond" title="${p.nome}" style="border-color:${p.disputa ? '#ff5d5d' : p.dono >= 0 ? LADOS[p.dono].cor : p.quem >= 0 ? LADOS[p.quem].cor + '88' : '#777'};color:${p.dono >= 0 ? LADOS[p.dono].cor : '#ddd'}">${p.letra}</div>`).join('');
  // veículo
  if (a.veiculo) { const v = a.veiculo; $('#veic').style.display = 'block'; $('#veic').innerHTML = `<b>${v.T.nome}</b> · ${Math.round(Math.abs(v.vel) * 3.6)} km/h${v.heli ? ' · alt ' + Math.round(v.pos.y - alturaTerreno(v.pos.x, v.pos.z)) + ' m' : ''}<div class="barra"><i style="width:${v.vida / v.T.vidaMax * 100}%;background:#ff7b7b"></i></div><div class="barra"><i style="width:${v.comb / v.T.tanque * 100}%;background:#7bd88f"></i></div><small>Lataria ${Math.round(v.vida / v.T.vidaMax * 100)}% · ⛽ ${Math.round(v.comb)}/${v.T.tanque} L${v.T.blind > 0.8 ? ' · BLINDADO' : ''}</small>`; }
  else $('#veic').style.display = 'none';
  desenharMinimapa();
  if (CFG.fps) $('#fps').textContent = Math.round(fpsMed) + ' fps · ' + J.atores.length + ' combatentes · ' + J.balas.length + ' balas';
}

/* ---------------- morte e renascimento ---------------- */
let morteAberta = false;
function aoMorrer(atac, arma, zona) {
  morteAberta = true; if (document.pointerLockElement) document.exitPointerLock();
  const dist = atac && atac.pos ? Math.round(atac.pos.distanceTo(J.jogador.pos)) : 0;
  const quem = atac ? `<b style="color:${corDe(atac)}">${atac.nome}</b>${atac.unidade ? ' (' + atac.unidade + ')' : atac.lado !== undefined ? ' (' + LADOS[atac.lado].sigla + ')' : ''}` : 'a queda';
  const pontosMeus = PONTOS.filter(p => p.dono === J.jogador.lado && !p.disputa);
  $('#morte').style.display = 'block';
  const desenhar = () => { const t = Math.ceil(J.jogador.respawn); $('#morte').innerHTML = `<div style="font-size:30px;font-weight:800">☠ Você foi abatido</div><div style="font-size:18px">por ${quem}${arma && arma.nome ? ' · ' + arma.nome : ''}${zona === 'cabeca' ? ' · tiro na cabeça' : ''}${dist ? ' · ' + dist + ' m' : ''}</div><div class="linha" style="justify-content:center;margin-top:10px">${t > 0 ? `<b style="font-size:20px">Renasce em ${t}…</b>` : `<button class="b pri" data-nascer="base">Renascer na base</button>${pontosMeus.map(p => `<button class="b" data-nascer="${p.id}">No ponto ${p.letra}</button>`).join('')}`}<button class="b" id="m-classe">Trocar equipamento</button></div>`; $('#morte').querySelectorAll('[data-nascer]').forEach(b => b.onclick = () => renascer(b.dataset.nascer)); const mc = $('#m-classe'); if (mc) mc.onclick = () => { abrirClasses(true); }; };
  desenhar(); J.morteTimer = setInterval(() => { if (!morteAberta) { clearInterval(J.morteTimer); return; } desenhar(); }, 500);
}
function renascer(onde) {
  const a = J.jogador; if (a.vivo || a.respawn > 0) return;
  let lista = null; const p = PONTOS.find(p => p.id === onde); if (p && p.dono === a.lado) { lista = []; for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2; lista.push([p.x + Math.cos(ang) * (p.r + 4), p.z + Math.sin(ang) * (p.r + 4)]); } }
  nascer(J, a, lista); a.mesh.visible = false; vm.montar(); morteAberta = false; $('#morte').style.display = 'none'; clearInterval(J.morteTimer);
  if (!TOQUE) canvas.requestPointerLock();
}

/* ---------------- telas ---------------- */
function tela(id) { document.querySelectorAll('.tela').forEach(t => t.classList.toggle('on', t.id === id)); }
document.querySelectorAll('[data-voltar]').forEach(b => b.onclick = () => tela(b.dataset.voltar));
$('#b-jogar').onclick = () => { iniciarAudio('sons/'); abrirLados(); };
$('#b-ajuda').onclick = () => tela('t-ajuda');
$('#b-creditos').onclick = () => { fetch('sons/CREDITOS.txt').then(r => r.text()).then(t => $('#txt-creditos').textContent = t).catch(() => {}); tela('t-creditos'); };
$('#b-sair').onclick = () => avisar('sair');
$('#b-config').onclick = () => { montarConfig(); tela('t-pausa'); $('#b-continuar').textContent = '← Voltar'; $('#b-trocar').style.display = 'none'; $('#b-menu').style.display = 'none'; };
function abrirLados() {
  $('#lista-lados').innerHTML = LADOS.map(L => `<button class="op" data-lado="${L.id}" style="border-color:${L.cor}55"><span class="nm" style="color:${L.cor}">${L.nome}</span><small>${L.id < 3 ? 'Facção · ' + MORROS.find(m => m.lado === L.id).nome + '. Briga com as outras duas facções e com a polícia.' : 'BOEPF, PCM e EXANTF juntas. Começam no Batalhão, perto da BR, com blindado e helicóptero.'}</small></button>`).join('');
  $('#lista-dif').innerHTML = ['Recruta', 'Soldado', 'Veterano'].map((n, i) => `<button class="b ${i === escolha.dif ? 'pri' : ''}" data-dif="${i}">${n}</button>`).join('');
  $('#lista-dif').querySelectorAll('[data-dif]').forEach(b => b.onclick = () => { escolha.dif = +b.dataset.dif; abrirLados(); });
  $('#lista-lados').querySelectorAll('[data-lado]').forEach(b => b.onclick = () => { escolha.lado = +b.dataset.lado; if (escolha.lado === 3) abrirUnidades(); else abrirClasses(); });
  tela('t-lado');
}
function abrirUnidades() {
  $('#lista-unidades').innerHTML = UNIDADES.map(u => `<button class="op" data-u="${u.id}"><span class="nm">${u.nome}</span><small>${u.desc}. ${CLASSES[u.id].map(c => c.nome).join(' ou ')}.</small></button>`).join('');
  $('#lista-unidades').querySelectorAll('[data-u]').forEach(b => b.onclick = () => { escolha.unidade = b.dataset.u; abrirClasses(); });
  tela('t-unidade');
}
let trocandoClasse = false;
function abrirClasses(durante) {
  trocandoClasse = !!durante;
  const lista = escolha.lado === 3 ? CLASSES[escolha.unidade] : CLASSES.faccao;
  $('#classe-tit').textContent = 'Equipamento · ' + (escolha.lado === 3 ? escolha.unidade : LADOS[escolha.lado].nome);
  $('#lista-classes').innerHTML = lista.map(c => `<button class="op" data-c="${c.id}"><span class="nm">${c.nome}</span><small>${c.armas.map(a => ARMAS[a].nome).join(' + ')}<br>${c.desc}</small></button>`).join('');
  $('#lista-classes').querySelectorAll('[data-c]').forEach(b => b.onclick = () => { escolha.classe = b.dataset.c; if (trocandoClasse && J.jogador) { const cl = lista.find(c => c.id === escolha.classe); equipar(J.jogador, cl); tela(null); centro('', 'Equipamento novo no próximo renascimento', 2); } else comecarPartida(); });
  $('#classe-voltar').onclick = () => trocandoClasse ? tela(null) : (escolha.lado === 3 ? abrirUnidades() : abrirLados());
  tela('t-classe');
}
function montarConfig() {
  $('#cfg-campos').innerHTML = `<label class="cfg">Sensibilidade do mouse <input type="range" id="c-sens" min="0.2" max="3" step="0.05" value="${CFG.sens}"></label>
    <label class="cfg">Campo de visão (FOV) <input type="range" id="c-fov" min="60" max="100" step="1" value="${CFG.fov}"></label>
    <label class="cfg">Volume <input type="range" id="c-vol" min="0" max="1.2" step="0.05" value="${CFG.vol}"></label>
    <label class="cfg">Inverter eixo vertical <input type="checkbox" id="c-inv" ${CFG.inverter ? 'checked' : ''}></label>
    <label class="cfg">Sombras (mais bonito, mais pesado) <input type="checkbox" id="c-qual" ${CFG.qualidade ? 'checked' : ''}></label>
    <label class="cfg">Muitos bots (30 combatentes) <input type="checkbox" id="c-bots" ${CFG.bots ? 'checked' : ''}></label>
    <label class="cfg">Mostrar FPS <input type="checkbox" id="c-fps" ${CFG.fps ? 'checked' : ''}></label>`;
  const s = () => { CFG.sens = +$('#c-sens').value; CFG.fov = +$('#c-fov').value; CFG.vol = +$('#c-vol').value; CFG.inverter = $('#c-inv').checked; CFG.fps = $('#c-fps').checked; const q = $('#c-qual').checked ? 1 : 0; if (q !== CFG.qualidade) { CFG.qualidade = q; renderer.shadowMap.enabled = !!q; sol.castShadow = !!q; cena.traverse(o => { if (o.material) o.material.needsUpdate = true; }); } CFG.bots = $('#c-bots').checked ? 1 : 0; volumeGeral(CFG.vol); gravar('zq.cfg', CFG); $('#fps').style.display = CFG.fps ? 'block' : 'none'; };
  $('#cfg-campos').querySelectorAll('input').forEach(i => i.oninput = s);
}
function pausar() { if (estado !== 'jogo') return; estado = 'pausa'; montarConfig(); $('#b-continuar').textContent = 'Continuar'; $('#b-trocar').style.display = ''; $('#b-menu').style.display = ''; tela('t-pausa'); }
$('#b-continuar').onclick = () => { if (estado === 'pausa') { estado = 'jogo'; tela(null); if (!TOQUE && !morteAberta) canvas.requestPointerLock(); } else tela('t-inicio'); };
$('#b-trocar').onclick = () => { estado = 'jogo'; abrirClasses(true); };
$('#b-menu').onclick = () => { sairPartida(); };
$('#b-revanche').onclick = () => comecarPartida();
$('#b-fim-menu').onclick = () => { sairPartida(); };
function sairPartida() { estado = 'menu'; fimPartida = true; $('#hud').classList.remove('on'); $('#morte').style.display = 'none'; morteAberta = false; $('#toque').style.display = 'none'; document.body.classList.remove('toque'); toque.ativo = false; if (document.pointerLockElement) document.exitPointerLock(); tela('t-inicio'); }

/* ---------------- partida ---------------- */
function limparPartida() {
  for (const a of J.atores) cena.remove(a.mesh); for (const v of J.veiculos) { cena.remove(v.mesh); if (v.som) v.som.parar(); } for (const g of J.granadas) cena.remove(g.m); for (const w of J.armasChao) cena.remove(w.g);
  J.atores = []; J.veiculos = []; J.balas = []; J.granadas = []; J.fumacas = []; J.armasChao = []; J.placar = [0, 0, 0, 0]; J.sonsRecentes = [];
  for (const p of PONTOS) Object.assign(p, p.inicial);
  for (const j of JANELAS) if (j.quebrada) { j.quebrada = false; j.b.quebrado = false; const b = j.b, o = new THREE.Object3D(); o.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2); o.scale.set(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0); o.updateMatrix(); MALHAS.vidros.setMatrixAt(j.idx, o.matrix); }
  MALHAS.vidros.instanceMatrix.needsUpdate = true;
}
function comecarPartida() {
  limparPartida();
  J.dif = escolha.dif; tempoPartida = 0; fimPartida = false;
  const nf = CFG.bots ? 6 : 3, np = CFG.bots ? 9 : 5;
  const eu = criarAtor(J, escolha.lado, escolha.lado === 3 ? escolha.unidade : null, escolha.classe, false, (ler('rolima.nome', '') || 'Você').slice(0, 14));
  J.jogador = eu; J.atores.push(eu);
  for (let l = 0; l < 3; l++) for (let k = 0; k < nf - (l === escolha.lado ? 1 : 0); k++) J.atores.push(criarAtor(J, l, null, null, true));
  for (let k = 0; k < np - (escolha.lado === 3 ? 1 : 0); k++) J.atores.push(criarAtor(J, 3, ['BOEPF', 'PCM', 'EXANTF'][k % 3], null, true));
  for (const a of J.atores) nascer(J, a);
  eu.mesh.visible = false;
  for (const vi of VEICULOS_INICIAIS) J.veiculos.push(criarVeiculo(J, vi.tipo, vi.x, vi.z, vi.yaw, vi.lado));
  J.veiculos.push(criarVeiculo(J, 'heli', HELIPONTO.x, HELIPONTO.z, 0, 3));
  vm.montar(); estado = 'jogo'; tela(null); $('#hud').classList.add('on'); $('#fps').style.display = CFG.fps ? 'block' : 'none';
  if (TOQUE) montarToque(); else canvas.requestPointerLock();
  centro(LADOS[eu.lado].nome.toUpperCase(), 'Domine os pontos. Munição grátis na 🔫 loja; combustível no ⛽ posto.', 4);
  avisar('iniciado');
}
function terminar() {
  fimPartida = true; estado = 'fim'; if (document.pointerLockElement) document.exitPointerLock();
  const ordem = LADOS.map(L => [L, J.placar[L.id]]).sort((a, b) => b[1] - a[1]), venceu = ordem[0][0].id === J.jogador.lado;
  $('#fim-tit').textContent = venceu ? '🏆 VITÓRIA' : 'Fim da partida';
  $('#fim-txt').innerHTML = `<p class="sub">${ordem[0][0].nome} dominou a Serra Alta.</p><table style="width:100%">${ordem.map(([L, p], i) => `<tr><td>${i + 1}º</td><td style="color:${L.cor}"><b>${L.nome}</b></td><td>${Math.round(p)} pts</td></tr>`).join('')}</table><p class="sub">Você: ${J.jogador.abates} abates · ${J.jogador.mortes} mortes</p>`;
  $('#hud').classList.remove('on'); $('#toque').style.display = 'none'; document.body.classList.remove('toque'); toque.ativo = false; tela('t-fim'); avisar('concluido', { final: venceu ? 'vitoria' : 'derrota' });
}

/* ---------------- toque (celular) ---------------- */
const toque = { ativo: false, joy: { x: 0, y: 0 }, atirar: false, novoTiro: false, mirar: false, pular: false, correr: false, interagir: false, agachar: false };
function montarToque() {
  toque.ativo = true; document.body.classList.add('toque'); const T = $('#toque'); T.style.display = 'block';
  T.querySelectorAll('.tb').forEach(b => b.remove());
  const W = innerWidth, H = innerHeight, d = Math.min(78, W * 0.11, H * 0.17), pq = d * 0.8;
  const botoes = [['ATIRAR', W - d * 1.6 - 20, H - d * 1.6 - 30, d * 1.6, 'atirar'], ['MIRA', W - d * 2.9 - 30, H - d * 1.1 - 30, d, 'mirar'], ['PULA', W - d - 20, H - d * 2.9 - 40, d, 'pular'], ['AGACHA', W - d * 2.1 - 30, H - d * 2.6 - 40, d * 0.9, 'agachar'], ['⟳', W - d * 3.1 - 30, H - d * 2.3 - 40, d * 0.85, 'recarregar'], ['💣', W - d * 4.0 - 40, H - d * 1.0 - 30, d * 0.8, 'granada'], ['⇄', W - pq * 3 - 36, 12, pq, 'trocar'], ['F', W - pq * 2 - 24, 12, pq, 'interagir'], ['🩹', W - pq - 12, 12, pq, 'curar']];
  for (const [txt, x, y, tam, acao] of botoes) {
    const b = document.createElement('div'); b.className = 'tb'; b.textContent = txt; b.style.cssText = `left:${x}px;top:${y}px;width:${tam}px;height:${tam}px`; T.appendChild(b);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId); b.classList.add('on'); iniciarAudio('sons/'); const a = J.jogador; if (!a) return;
      if (acao === 'atirar') { toque.atirar = true; toque.novoTiro = true; } else if (acao === 'mirar') toque.mirar = !toque.mirar; else if (acao === 'pular') toque.pular = true; else if (acao === 'agachar') { a.agachado = !a.agachado; toque.agachar = true; } else if (acao === 'recarregar') J.recarregar(a); else if (acao === 'granada' && a.granadas.frag > 0) J.lancarGranada(a, 'frag', null, 16); else if (acao === 'trocar') J.trocarArma(a, a.atual ? 0 : 1); else if (acao === 'interagir') { toque.interagir = true; if (!a.vivo) renascer('base'); else if (a.veiculo) { if (!bombaPerto(a.veiculo)) sairVeiculo(); } else interagir(a); } else if (acao === 'curar' && a.curativos > 0) a.curando = 3; });
    const solta = () => { b.classList.remove('on'); if (acao === 'atirar') toque.atirar = false; if (acao === 'interagir') toque.interagir = false; if (acao === 'agachar') toque.agachar = false; if (acao === 'pular') toque.pular = false; };
    b.addEventListener('pointerup', solta); b.addEventListener('pointercancel', solta);
  }
  const joy = $('#joy'), bola = joy.querySelector('i'); let idJoy = null, idOlhar = null, ultX = 0, ultY = 0;
  T.onpointerdown = e => { const r = joy.getBoundingClientRect(); if (e.clientX < W * 0.4 && idJoy === null) { idJoy = e.pointerId; mexerJoy(e); } else if (idOlhar === null) { idOlhar = e.pointerId; ultX = e.clientX; ultY = e.clientY; } void r; };
  const mexerJoy = e => { const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } toque.joy.x = dx; toque.joy.y = dy; bola.style.left = 45 + dx * 45 + 'px'; bola.style.top = 45 + dy * 45 + 'px'; };
  T.onpointermove = e => { if (e.pointerId === idJoy) mexerJoy(e); else if (e.pointerId === idOlhar) { const a = J.jogador; if (!a) return; const dx = e.clientX - ultX, dy = e.clientY - ultY; ultX = e.clientX; ultY = e.clientY; const kk = 0.0055 * CFG.sens * (Math.tan(cam.fov * DEG / 2) / Math.tan(CFG.fov * DEG / 2)); if (a.veiculo) { camOrbita.yaw -= dx * kk; camOrbita.t = 2; } else { a.yaw -= dx * kk; a.pitch = clamp(a.pitch - dy * kk, -1.5, 1.5); } } };
  T.onpointerup = T.onpointercancel = e => { if (e.pointerId === idJoy) { idJoy = null; toque.joy.x = toque.joy.y = 0; bola.style.left = bola.style.top = '45px'; } if (e.pointerId === idOlhar) idOlhar = null; };
}

/* ---------------- sons dos motores ---------------- */
function sonsVeiculos() {
  for (const v of J.veiculos) {
    const ligado = !v.destruido && (v.motorista || (v.heli && (v.rotor || 0) > 0.05));
    const d = distOuvinte(v.pos);
    if (ligado && d < 260) {
      if (!v.som) v.som = tocar(v.heli ? 'helicoptero' : 'motor', { pos: v.pos, laco: true, vol: v.heli ? 1.2 : 0.7, ref: v.heli ? 18 : 6, rolloff: 0.8, prioridade: true, variar: false });
      if (v.som) { v.som.mover(v.pos); v.som.s.playbackRate.value = v.heli ? 0.7 + (v.rotor || 0) * 0.35 : 0.7 + Math.min(1.2, Math.abs(v.vel) / v.T.vmax * 1.1); }
    } else if (v.som) { v.som.parar(); v.som = null; }
  }
}

/* ---------------- laço principal ---------------- */
let ultimo = performance.now(), fpsMed = 60, tamAtual = [0, 0];
function quadro(agora) {
  requestAnimationFrame(quadro);
  const dtReal = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora; fpsMed = lerp(fpsMed, 1 / Math.max(0.001, dtReal), 0.05);
  const W = innerWidth, H = innerHeight; if (W !== tamAtual[0] || H !== tamAtual[1]) { renderer.setSize(W, H, false); tamAtual = [W, H]; cam.aspect = vmCam.aspect = W / H; cam.updateProjectionMatrix(); vmCam.updateProjectionMatrix(); if (toque.ativo) montarToque(); }
  if (estado === 'jogo') passo(dtReal);
  else if (estado === 'menu') { const t = agora / 9000; cam.position.set(Math.cos(t) * 260, 95, Math.sin(t) * 200 - 20); cam.lookAt(0, 20, 0); }
  // sombra acompanha a câmera
  if (CFG.qualidade) { const p = cam.position; sol.position.set(p.x + SOL_DIR.x * 200, p.y + SOL_DIR.y * 200, p.z + SOL_DIR.z * 200); sol.target.position.set(p.x, p.y - 10, p.z); }
  cena.userData.ceu.position.copy(cam.position);
  renderer.clear(); renderer.render(cena, cam);
  if (estado === 'jogo' && J.jogador && J.jogador.vivo && !J.jogador.veiculo) { renderer.clearDepth(); renderer.render(vmCena, vmCam); }
}
function passo(dt) {
  J.tempo += dt; tempoPartida += dt;
  J.sonsRecentes = J.sonsRecentes.filter(s => J.tempo - s.t < 0.5);
  atualizarJogador(dt);
  for (const a of J.atores) {
    if (!a.vivo) { animarMorte(a, dt); if (a !== J.jogador || !morteAberta) a.respawn -= dt; else a.respawn -= dt; if (a.bot && a.respawn <= 0) { const donos = PONTOS.filter(p => p.dono === a.lado && !p.disputa); let lista = null; if (donos.length && Math.random() < 0.4) { const p = donos[(Math.random() * donos.length) | 0]; lista = [[p.x + (Math.random() - 0.5) * 8, p.z + p.r + 4]]; } nascer(J, a, lista); } continue; }
    if (a.bot) {
      pensarBot(J, a, dt);
      a.cad -= dt; a.trocando = Math.max(0, a.trocando - dt); a.ferrolho = Math.max(0, a.ferrolho - dt);
      if (a.recarregando > 0) { a.recarregando -= dt; if (a.recarregando <= 0) fimRecarga(a); }
      moverAtor(a, dt); if (a.quedaDano) { aplicarDano(a, a.quedaDano, 'pernas', null, null, null); a.quedaDano = 0; }
      // passos dos outros (dá para ouvir quem vem)
      const vh = Math.hypot(a.vel.x, a.vel.z); if (a.noChao && vh > 1 && distOuvinte(a.pos) < 28) { a.passoT += vh * dt; if (a.passoT > 2.2) { a.passoT = 0; tocar('passo' + (1 + ((Math.random() * 6) | 0)), { pos: a.pos, vol: a.correndo ? 0.5 : 0.3, ref: 2.5, rolloff: 1.6 }); } }
    }
    animarBoneco(a, dt, J.tempo);
  }
  for (const v of J.veiculos) {
    if (v.destruido) { v.respawn -= dt; if (v.respawn <= 0 && !v.motorista) { cena.remove(v.mesh); const i = J.veiculos.indexOf(v); J.veiculos[i] = criarVeiculo(J, v.tipo, v.inicial.x, v.inicial.z, v.inicial.yaw, v.lado); } }
    if (v.heli && !v.motorista) pilotoAutomatico(J, v, dt);
    else if (!v.motorista && !v.heli) dirigir(J, v, { frente: 0, tras: 0, esq: 0, dir: 0, freio: true, sobe: 0 }, dt);
    else if (v.heli && v.destruido) dirigir(J, v, { frente: 0, tras: 0, esq: 0, dir: 0, sobe: -1 }, dt);
    desenharVeiculo(v, dt);
  }
  atualizarBalas(dt); atualizarGranadas(dt); atualizarParticulas(dt); atualizarNuvens(dt);
  for (const c of clarões) if (c.t > 0) { c.t -= dt; if (c.t <= 0) c.s.visible = false; }
  for (const l of luzes) if (l.t > 0) { l.t -= dt; if (l.t <= 0) l.l.intensity = 0; }
  for (const w of J.armasChao) { w.t -= dt; if (w.t <= 0) { cena.remove(w.g); w.morta = true; } } J.armasChao = J.armasChao.filter(w => !w.morta);
  atualizarPontos(dt);
  atualizarCamera(dt); cam.updateMatrixWorld(); atualizarVM(dt);
  const fw = new THREE.Vector3(); cam.getWorldDirection(fw); definirOuvinte(cam.position.x, cam.position.y, cam.position.z, fw.x, fw.z);
  sonsVeiculos();
  atualizarHUD(dt);
}

/* ---------------- início ---------------- */
carTxt('Calculando os caminhos dos bots…');
prepararMapaBase();
$('#carregando').style.display = 'none';
tela('t-inicio');
requestAnimationFrame(quadro);
window.__zq = { MAPA, J, CFG, comecarPartida, escolha, MALHAS, passo, mouse, teclas, toque, montarToque, explodir, renderer, cena, get estado() { return estado; }, set estado(v) { estado = v; }, cam, vm, NAV };
avisar('iniciado');
