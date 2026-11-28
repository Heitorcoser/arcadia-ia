/* =========================================================================
   ZONA QUENTE · áudio
   Só gravações reais (veja sons/CREDITOS.txt). O que é calculado aqui é a
   ACÚSTICA: posição 3D, atenuação, atraso pela velocidade do som (343 m/s),
   abafamento com a distância (o ar absorve os agudos), eco entre as casas
   (reverberação) e o zumbido no ouvido depois de uma explosão perto.
   ========================================================================= */
const ARQS = {
  tiro_pistola: 'wav', tiro_pistola_longe: 'wav', tiro_revolver: 'wav', tiro_revolver_longe: 'wav', tiro_smg: 'wav', tiro_smg_longe: 'wav', tiro_ppsh: 'wav', tiro_ppsh_longe: 'wav',
  tiro_ak: 'wav', tiro_ak_longe: 'wav', tiro_m4: 'wav', tiro_m4_longe: 'wav', tiro_escopeta: 'wav', tiro_escopeta_longe: 'wav', tiro_precisao: 'wav', tiro_precisao_longe: 'wav', tiro_metralhadora: 'wav', tiro_metralhadora_longe: 'wav',
  bala_passando: 'wav', granada: 'wav', vidro_quebrando: 'wav', vidro_quebrando2: 'ogg', capsula: 'wav', recarga_pistola: 'wav', recarga_fuzil: 'wav', recarga_geral: 'wav', escopeta_bomba: 'wav',
  ricochete1: 'wav', ricochete2: 'wav', ricochete3: 'wav', ricochete4: 'wav', passo1: 'wav', passo2: 'wav', passo3: 'wav', passo4: 'wav', passo5: 'wav', passo6: 'wav',
  impacto_vidro1: 'ogg', impacto_vidro2: 'ogg', vidro_caindo: 'ogg', impacto_metal1: 'ogg', impacto_metal2: 'ogg', impacto_metal3: 'ogg', impacto_metal4: 'ogg',
  impacto_madeira1: 'ogg', impacto_madeira2: 'ogg', impacto_madeira3: 'ogg', impacto_pedra1: 'ogg', impacto_pedra2: 'ogg', impacto_corpo1: 'ogg', impacto_corpo2: 'ogg', impacto_corpo3: 'ogg', impacto_corpo4: 'ogg',
  madeira_quebrando: 'ogg', metal_caindo: 'ogg', explosao_longe: 'ogg', estouro: 'ogg', helicoptero: 'mp3', motor: 'mp3',
};
export const A = { ctx: null, buf: {}, mestre: null, abafar: null, reverb: null, envioReverb: null, vozes: 0, volume: 0.9, carregados: 0, total: Object.keys(ARQS).length, zumbido: null };
const MAX_VOZES = 48;
let ouvinte = { x: 0, y: 0, z: 0 };
export function iniciarAudio(base) {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  const C = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = C.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.002; comp.release.value = 0.2;
  A.mestre = C.createGain(); A.mestre.gain.value = A.volume;
  A.abafar = C.createBiquadFilter(); A.abafar.type = 'lowpass'; A.abafar.frequency.value = 20000;
  A.mestre.connect(A.abafar).connect(comp).connect(C.destination);
  // reverberação: resposta ao impulso gerada (ruído com queda exponencial, com primeiras reflexões das paredes)
  const dur = 1.9, sr = C.sampleRate, ir = C.createBuffer(2, dur * sr, sr);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / dur, 3.2) * (t < 0.012 ? t / 0.012 : 1); } for (const [tt, a] of [[0.031, 0.5], [0.057, 0.35], [0.094, 0.25]]) { const k = Math.floor(tt * sr) + ch * 37; if (k < d.length) d[k] += a; } }
  A.reverb = C.createConvolver(); A.reverb.buffer = ir; A.envioReverb = C.createGain(); A.envioReverb.gain.value = 0.9; A.envioReverb.connect(A.reverb).connect(A.mestre);
  for (const [k, ext] of Object.entries(ARQS)) fetch(`${base}${k}.${ext}`).then(r => r.arrayBuffer()).then(b => C.decodeAudioData(b)).then(d => { A.buf[k] = d; A.carregados++; }).catch(() => { A.carregados++; });
}
export function definirOuvinte(x, y, z, fx, fz, ux = 0, uy = 1, uz = 0) {
  ouvinte = { x, y, z }; if (!A.ctx) return; const L = A.ctx.listener, t = A.ctx.currentTime;
  if (L.positionX) { L.positionX.setValueAtTime(x, t); L.positionY.setValueAtTime(y, t); L.positionZ.setValueAtTime(z, t); L.forwardX.setValueAtTime(fx, t); L.forwardY.setValueAtTime(0, t); L.forwardZ.setValueAtTime(fz, t); L.upX.setValueAtTime(ux, t); L.upY.setValueAtTime(uy, t); L.upZ.setValueAtTime(uz, t); }
  else { L.setPosition(x, y, z); L.setOrientation(fx, 0, fz, ux, uy, uz); }
}
export const distOuvinte = p => Math.hypot(p.x - ouvinte.x, p.y - ouvinte.y, p.z - ouvinte.z);
// toca um som. opc: pos {x,y,z} (3D), vol, taxa, atraso (s), passaBaixa (Hz), reverb (0..1), laço, ref (para parar depois)
export function tocar(nome, opc = {}) {
  const C = A.ctx; if (!C || !A.buf[nome]) return null;
  if (A.vozes >= MAX_VOZES && !opc.prioridade) return null;
  const s = C.createBufferSource(); s.buffer = A.buf[nome]; s.playbackRate.value = (opc.taxa || 1) * (opc.variar === false ? 1 : 0.96 + Math.random() * 0.08); s.loop = !!opc.laco;
  let no = s;
  if (opc.passaBaixa && opc.passaBaixa < 18000) { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opc.passaBaixa; no.connect(f); no = f; }
  const g = C.createGain(); g.gain.value = opc.vol ?? 1; no.connect(g); no = g;
  let pan = null;
  if (opc.pos) { pan = C.createPanner(); pan.panningModel = opc.hrtf ? 'HRTF' : 'equalpower'; pan.distanceModel = 'inverse'; pan.refDistance = opc.ref ?? 6; pan.rolloffFactor = opc.rolloff ?? 1; pan.maxDistance = 2000; if (pan.positionX) { pan.positionX.value = opc.pos.x; pan.positionY.value = opc.pos.y; pan.positionZ.value = opc.pos.z; } else pan.setPosition(opc.pos.x, opc.pos.y, opc.pos.z); no.connect(pan); no = pan; }
  no.connect(A.mestre);
  if (opc.reverb) { const r = C.createGain(); r.gain.value = opc.reverb; no.connect(r); r.connect(A.envioReverb); }
  const quando = C.currentTime + (opc.atraso || 0);
  s.start(quando, opc.inicio || 0);
  A.vozes++; s.onended = () => { A.vozes--; };
  return { s, g, pan, mover(p) { if (pan && pan.positionX) { pan.positionX.value = p.x; pan.positionY.value = p.y; pan.positionZ.value = p.z; } }, parar() { try { s.stop(); } catch (e) {} } };
}
// TIRO: perto = gravação próxima; longe = gravação de média distância, abafada e atrasada pela velocidade do som
export function somTiro(arma, pos, meu, abafado = false) {
  if (!A.ctx) return;
  const nome = 'tiro_' + arma.som;
  if (meu) { tocar(nome, { vol: arma.volume ?? 0.95, reverb: 0.35, prioridade: true }); return; }
  const d = distOuvinte(pos), atraso = d / 343;
  if (d < 55) tocar(nome, { pos, vol: 1.1, ref: 9, rolloff: 0.9, atraso, reverb: 0.45, passaBaixa: abafado ? 1800 : 20000, prioridade: d < 25 });
  if (d > 25) { const fc = Math.max(700, 9000 - d * 18); tocar(nome + '_longe', { pos, vol: Math.min(1.4, 0.35 + d / 120), ref: 25, rolloff: 0.55, atraso, passaBaixa: abafado ? Math.min(fc, 1200) : fc, reverb: 0.75 }); }
}
// impacto da bala: cada material tem o seu som
const IMPACTOS = { metal: ['impacto_metal1', 'impacto_metal2', 'impacto_metal3', 'impacto_metal4'], madeira: ['impacto_madeira1', 'impacto_madeira2', 'impacto_madeira3'], plastico: ['impacto_madeira2'], borracha: ['impacto_corpo2'],
  tijolo: ['impacto_pedra1', 'impacto_pedra2'], concreto: ['impacto_pedra1', 'impacto_pedra2'], asfalto: ['impacto_pedra1'], terra: ['impacto_corpo3', 'impacto_corpo4'], vidro: ['impacto_vidro1', 'impacto_vidro2'], corpo: ['impacto_corpo1', 'impacto_corpo2'], carne: ['impacto_corpo1'] };
export function somImpacto(mat, pos, vol = 0.8) {
  const l = IMPACTOS[mat] || IMPACTOS.concreto, d = distOuvinte(pos); if (d > 70) return;
  tocar(l[(Math.random() * l.length) | 0], { pos, vol, ref: 3, rolloff: 1.3, taxa: mat === 'concreto' || mat === 'tijolo' ? 1.25 : 1, atraso: d / 343 });
}
export function somRicochete(pos) { const d = distOuvinte(pos); if (d > 80) return; tocar('ricochete' + (1 + ((Math.random() * 4) | 0)), { pos, vol: 0.7, ref: 6, atraso: d / 343 }); }
export function somPassando(pos, forca) { tocar('bala_passando', { pos, vol: Math.min(1.3, 0.5 + forca), ref: 2, rolloff: 1, taxa: 0.9 + Math.random() * 0.3, prioridade: true, hrtf: true }); }
export function somExplosao(pos) {
  const d = distOuvinte(pos), atraso = d / 343;
  if (d < 90) tocar('granada', { pos, vol: 1.6, ref: 14, rolloff: 0.8, atraso, reverb: 0.6, prioridade: true });
  tocar('explosao_longe', { pos, vol: Math.min(1.5, 0.4 + d / 100), ref: 30, rolloff: 0.5, atraso, passaBaixa: Math.max(500, 6000 - d * 25), reverb: 0.8, prioridade: true });
  if (d < 14) zumbido(1 - d / 14);
}
// zumbido no ouvido: tudo abafa por alguns segundos e fica um apito agudo (é o que acontece de verdade)
export function zumbido(forca) {
  const C = A.ctx; if (!C) return; const t = C.currentTime;
  A.abafar.frequency.cancelScheduledValues(t); A.abafar.frequency.setValueAtTime(400 + (1 - forca) * 1500, t); A.abafar.frequency.exponentialRampToValueAtTime(20000, t + 2.5 + forca * 4);
  const o = C.createOscillator(), g = C.createGain(); o.frequency.value = 3900 + Math.random() * 400; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * forca + 0.005, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 2 + forca * 4); o.connect(g).connect(C.destination); o.start(t); o.stop(t + 7);
}
export function volumeGeral(v) { A.volume = v; if (A.mestre) A.mestre.gain.value = v; }
