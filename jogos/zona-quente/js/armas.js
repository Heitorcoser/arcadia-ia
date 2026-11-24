/* =========================================================================
   ZONA QUENTE · armas
   Números próximos dos reais: velocidade de boca (m/s), cadência (tiros/min),
   capacidade do carregador. Dano em pontos de vida (100 = uma pessoa).
   Recuo: subida vertical por tiro (graus) + desvio horizontal aleatório
   pequeno; parte dele volta sozinho (o resto você puxa com o mouse).
   ========================================================================= */
import * as THREE from 'three';

export const ARMAS = {
  pistola: { nome: 'Pistola 9mm', tipo: 'pistola', som: 'pistola', dano: 26, cabeca: 3.2, rpm: 420, modos: ['semi'], pente: 17, reserva: 68, recarga: 1.6, recargaVazia: 2.0, vel: 360, queda: [25, 60, 0.55], hip: 1.8, ads: 0.35, sobe: 1.6, lado: 0.5, volta: 0.75, fovAds: 58, adsTempo: 0.14, peso: 1, pen: 0.1, tipoRecarga: 'pistola' },
  revolver: { nome: 'Revólver .38', tipo: 'pistola', som: 'revolver', dano: 38, cabeca: 3, rpm: 180, modos: ['semi'], pente: 6, reserva: 30, recarga: 2.6, recargaVazia: 2.6, vel: 290, queda: [20, 50, 0.55], hip: 2.0, ads: 0.4, sobe: 3.2, lado: 0.6, volta: 0.7, fovAds: 58, adsTempo: 0.15, peso: 1, pen: 0.12, tipoRecarga: 'pistola' },
  smg: { nome: 'Submetralhadora MT-9', tipo: 'smg', som: 'smg', dano: 21, cabeca: 2.6, rpm: 800, modos: ['auto', 'semi'], pente: 30, reserva: 120, recarga: 2.0, recargaVazia: 2.4, vel: 400, queda: [20, 55, 0.5], hip: 2.6, ads: 0.6, sobe: 0.85, lado: 0.55, volta: 0.6, fovAds: 55, adsTempo: 0.17, peso: 0.96, pen: 0.15, tipoRecarga: 'geral' },
  ppsh: { nome: 'Submetralhadora de tambor', tipo: 'smg', som: 'ppsh', dano: 22, cabeca: 2.6, rpm: 900, modos: ['auto'], pente: 71, reserva: 142, recarga: 3.4, recargaVazia: 3.8, vel: 490, queda: [22, 60, 0.5], hip: 3.0, ads: 0.75, sobe: 0.8, lado: 0.65, volta: 0.55, fovAds: 55, adsTempo: 0.22, peso: 0.9, pen: 0.2, tipoRecarga: 'geral' },
  ak: { nome: 'AK-47', tipo: 'fuzil', som: 'ak', dano: 34, cabeca: 3.4, rpm: 600, modos: ['auto', 'semi'], pente: 30, reserva: 120, recarga: 2.4, recargaVazia: 2.9, vel: 715, queda: [60, 180, 0.6], hip: 3.2, ads: 0.32, sobe: 1.45, lado: 0.7, volta: 0.45, fovAds: 52, adsTempo: 0.22, peso: 0.9, pen: 0.45, tipoRecarga: 'fuzil' },
  m4: { nome: 'Fuzil M4 5.56', tipo: 'fuzil', som: 'm4', dano: 29, cabeca: 3.4, rpm: 760, modos: ['auto', 'rajada', 'semi'], pente: 30, reserva: 120, recarga: 2.2, recargaVazia: 2.7, vel: 880, queda: [60, 200, 0.6], hip: 3.0, ads: 0.22, sobe: 1.0, lado: 0.45, volta: 0.5, fovAds: 46, adsTempo: 0.2, peso: 0.92, pen: 0.35, tipoRecarga: 'fuzil', mira: 'holo' },
  escopeta: { nome: 'Escopeta 12', tipo: 'escopeta', som: 'escopeta', dano: 15, bagos: 9, cabeca: 1.8, rpm: 70, modos: ['bomba'], pente: 6, reserva: 30, recarga: 0.55, porCartucho: true, vel: 400, queda: [8, 30, 0.15], hip: 5.0, ads: 3.6, sobe: 5, lado: 1.2, volta: 0.7, fovAds: 60, adsTempo: 0.2, peso: 0.92, pen: 0.05, tipoRecarga: 'cartucho' },
  precisao: { nome: 'Fuzil de precisão .308', tipo: 'precisao', som: 'precisao', dano: 95, cabeca: 3, rpm: 45, modos: ['ferrolho'], pente: 5, reserva: 30, recarga: 2.8, recargaVazia: 3.3, vel: 830, queda: [150, 600, 0.8], hip: 6.0, ads: 0.02, sobe: 4.5, lado: 0.8, volta: 0.85, fovAds: 12, adsTempo: 0.34, peso: 0.86, pen: 0.7, tipoRecarga: 'fuzil', luneta: true },
  metralhadora: { nome: 'Metralhadora 7.62', tipo: 'metralhadora', som: 'metralhadora', dano: 36, cabeca: 3, rpm: 650, modos: ['auto'], pente: 100, reserva: 200, recarga: 5.5, recargaVazia: 6.0, vel: 825, queda: [80, 300, 0.65], hip: 4.2, ads: 0.6, sobe: 1.35, lado: 0.95, volta: 0.4, fovAds: 52, adsTempo: 0.38, peso: 0.78, pen: 0.8, tipoRecarga: 'fuzil' },
};
for (const [k, a] of Object.entries(ARMAS)) a.id = k;
// classes de cada lado (a arma secundária é sempre de mão)
export const CLASSES = {
  faccao: [
    { id: 'fuzileiro', nome: 'Fuzileiro', armas: ['ak', 'pistola'], desc: 'AK-47: dano alto, recuo forte.' },
    { id: 'contencao', nome: 'Contenção', armas: ['metralhadora', 'revolver'], desc: 'Metralhadora de 100 tiros: segura a viela.' },
    { id: 'atirador', nome: 'Atirador', armas: ['precisao', 'pistola'], desc: 'Fuzil de precisão: um tiro, uma queda.' },
    { id: 'bonde', nome: 'Bonde', armas: ['ppsh', 'revolver'], desc: 'Submetralhadora de tambor: 71 tiros de perto.' },
    { id: 'escopeta', nome: 'Escopeteiro', armas: ['escopeta', 'pistola'], desc: 'Escopeta 12 para os becos.' },
  ],
  BOEPF: [
    { id: 'assalto', nome: 'Assalto', armas: ['m4', 'pistola'], desc: 'M4 com mira holográfica e rajada.' },
    { id: 'atirador', nome: 'Atirador de elite', armas: ['precisao', 'pistola'], desc: 'Fuzil .308 com luneta 6x.' },
  ],
  PCM: [
    { id: 'patrulha', nome: 'Patrulha', armas: ['smg', 'pistola'], desc: 'Submetralhadora leve e ágil. Mais curativos.' },
    { id: 'escopeta', nome: 'Escopeta', armas: ['escopeta', 'pistola'], desc: 'Escopeta 12 para entrar nas casas.' },
  ],
  EXANTF: [
    { id: 'suporte', nome: 'Suporte', armas: ['metralhadora', 'pistola'], desc: 'Metralhadora 7.62 e colete pesado.' },
    { id: 'fuzileiro', nome: 'Fuzileiro', armas: ['m4', 'pistola'], desc: 'M4 e colete pesado.' },
  ],
};
export const GRANADAS = { frag: { nome: 'Granada', fusivel: 3.5, raio: 9, letal: 3.5, dano: 160 }, fumaca: { nome: 'Fumaça', fusivel: 1.6, duracao: 24 } };
// queda de dano com a distância: cheio até d0, cai até 'min' em d1
export function danoNaDistancia(a, d) { const [d0, d1, min] = a.queda; if (d <= d0) return a.dano; if (d >= d1) return a.dano * min; return a.dano * (1 - (1 - min) * (d - d0) / (d1 - d0)); }

/* ---------- modelos (primeira pessoa e na mão dos bonecos) ---------- */
const M = {
  preto: new THREE.MeshLambertMaterial({ color: 0x1b1c1f }), grafite: new THREE.MeshLambertMaterial({ color: 0x2f3237 }), madeira: new THREE.MeshLambertMaterial({ color: 0x7a4a26 }),
  aco: new THREE.MeshLambertMaterial({ color: 0x5b5f66 }), cromado: new THREE.MeshPhongMaterial({ color: 0x9aa0a8, shininess: 80 }), oliva: new THREE.MeshLambertMaterial({ color: 0x4b5a32 }),
  lente: new THREE.MeshPhongMaterial({ color: 0x223344, shininess: 120, specular: 0x88aaff }),
};
const B = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const C = (r, l, m, x = 0, y = 0, z = 0, eixo = 'z', seg = 10) => { const g = new THREE.CylinderGeometry(r, r, l, seg); if (eixo === 'z') g.rotateX(Math.PI / 2); else if (eixo === 'x') g.rotateZ(Math.PI / 2); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
// eixo: -z = frente (cano). Origem = empunhadura. Retorna { g, boca (ponto do cano), pente (objeto que sai na recarga), miraY (altura da mira) }
export function modeloArma(id) {
  const g = new THREE.Group(); let boca = new THREE.Vector3(), pente = null, miraY = 0.08, ferrolho = null, bomba = null;
  const add = (...o) => o.forEach(x => g.add(x));
  if (id === 'pistola' || id === 'revolver') {
    if (id === 'pistola') { add(B(0.034, 0.03, 0.19, M.preto, 0, 0.055, -0.06), B(0.03, 0.11, 0.045, M.grafite, 0, -0.005, 0.01)); pente = B(0.026, 0.08, 0.036, M.preto, 0, -0.04, 0.01); add(pente); ferrolho = g.children[0]; boca.set(0, 0.055, -0.16); miraY = 0.075; }
    else { add(C(0.008, 0.11, M.cromado, 0, 0.055, -0.1), C(0.022, 0.04, M.cromado, 0, 0.048, -0.025), B(0.028, 0.1, 0.04, M.madeira, 0, -0.005, 0.012)); boca.set(0, 0.055, -0.16); miraY = 0.07; }
  } else if (id === 'ak') {
    add(B(0.05, 0.065, 0.34, M.aco, 0, 0.03, -0.12), B(0.045, 0.05, 0.16, M.madeira, 0, 0.02, -0.33), C(0.011, 0.24, M.aco, 0, 0.045, -0.5), C(0.007, 0.2, M.aco, 0, 0.065, -0.42), B(0.04, 0.07, 0.24, M.madeira, 0, -0.005, 0.17), B(0.03, 0.09, 0.04, M.madeira, 0, -0.06, 0.03), B(0.012, 0.03, 0.012, M.aco, 0, 0.085, -0.56));
    pente = new THREE.Group(); const p1 = B(0.032, 0.09, 0.05, M.aco, 0, -0.05, -0.08), p2 = B(0.032, 0.08, 0.05, M.aco, 0, -0.12, -0.1); p2.rotation.x = 0.35; pente.add(p1, p2); add(pente); boca.set(0, 0.045, -0.63); miraY = 0.095;
  } else if (id === 'm4') {
    add(B(0.05, 0.07, 0.3, M.preto, 0, 0.03, -0.08), B(0.06, 0.06, 0.2, M.grafite, 0, 0.03, -0.32), C(0.01, 0.22, M.preto, 0, 0.035, -0.52), B(0.036, 0.06, 0.2, M.preto, 0, 0.01, 0.2), B(0.03, 0.08, 0.04, M.preto, 0, -0.05, 0.04), B(0.04, 0.012, 0.36, M.grafite, 0, 0.072, -0.16));
    const holo = new THREE.Group(); holo.add(B(0.045, 0.05, 0.07, M.preto, 0, 0.1, -0.06), B(0.03, 0.028, 0.004, M.lente, 0, 0.105, -0.025)); add(holo);
    pente = B(0.03, 0.12, 0.055, M.preto, 0, -0.06, -0.12); pente.rotation.x = 0.12; add(pente); boca.set(0, 0.035, -0.64); miraY = 0.105;
  } else if (id === 'smg' || id === 'ppsh') {
    if (id === 'smg') { add(B(0.045, 0.07, 0.26, M.preto, 0, 0.03, -0.06), C(0.01, 0.09, M.preto, 0, 0.04, -0.24), B(0.03, 0.08, 0.04, M.preto, 0, -0.04, 0.03), B(0.02, 0.03, 0.18, M.grafite, 0, 0.01, 0.17)); pente = B(0.026, 0.15, 0.035, M.preto, 0, -0.08, -0.08); add(pente); boca.set(0, 0.04, -0.3); miraY = 0.085; }
    else { add(B(0.05, 0.07, 0.3, M.aco, 0, 0.035, -0.1), C(0.02, 0.22, M.aco, 0, 0.04, -0.32), B(0.045, 0.08, 0.3, M.madeira, 0, 0.0, 0.16)); pente = C(0.065, 0.04, M.aco, 0, -0.06, -0.06, 'x', 14); add(pente); boca.set(0, 0.04, -0.44); miraY = 0.09; }
  } else if (id === 'escopeta') {
    add(B(0.05, 0.07, 0.26, M.preto, 0, 0.03, -0.06), C(0.014, 0.5, M.preto, 0, 0.055, -0.42), C(0.012, 0.4, M.grafite, 0, 0.02, -0.38), B(0.045, 0.08, 0.26, M.preto, 0, 0.0, 0.2));
    bomba = C(0.022, 0.13, M.madeira, 0, 0.02, -0.32); add(bomba); boca.set(0, 0.055, -0.68); miraY = 0.075;
  } else if (id === 'precisao') {
    add(B(0.05, 0.06, 0.3, M.oliva, 0, 0.02, -0.05), C(0.012, 0.42, M.preto, 0, 0.035, -0.4), B(0.05, 0.08, 0.3, M.oliva, 0, -0.005, 0.22), C(0.022, 0.26, M.preto, 0, 0.1, -0.06), C(0.028, 0.04, M.lente, 0, 0.1, -0.2), C(0.026, 0.04, M.preto, 0, 0.1, 0.08));
    ferrolho = B(0.012, 0.012, 0.06, M.aco, 0.04, 0.05, 0.04); add(ferrolho); pente = B(0.03, 0.04, 0.06, M.preto, 0, -0.035, -0.02); add(pente); boca.set(0, 0.035, -0.62); miraY = 0.1;
  } else if (id === 'metralhadora') {
    add(B(0.07, 0.09, 0.4, M.grafite, 0, 0.03, -0.1), C(0.014, 0.5, M.preto, 0, 0.04, -0.52), B(0.045, 0.07, 0.24, M.preto, 0, 0.0, 0.22), B(0.03, 0.09, 0.04, M.preto, 0, -0.05, 0.05), C(0.02, 0.06, M.preto, 0, 0.05, -0.68));
    const bipe = new THREE.Group(); for (const s of [-1, 1]) { const p = B(0.008, 0.16, 0.008, M.aco, s * 0.03, -0.04, -0.6); p.rotation.z = s * 0.3; bipe.add(p); } add(bipe);
    pente = B(0.09, 0.09, 0.1, M.oliva, 0.05, -0.04, -0.08); add(pente); boca.set(0, 0.04, -0.75); miraY = 0.095;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { g, boca, pente, penteBase: pente ? pente.position.clone() : null, miraY, ferrolho, bomba };
}
