/* =========================================================================
   ARCÁDIA STUDIO · avatar (personagem do jogador) e animações
   Usado pelo criador de personagem do Studio e pelo motor dos jogos.
   - O corpo tem juntas de verdade: braços giram no ombro, pernas no quadril.
   - Animações por quadros-chave: cada quadro guarda a rotação (graus) das juntas.
   - Frente do personagem = -Z (igual ao motor).
   ========================================================================= */
(function () {
  'use strict';
  const ASN = (window.ASN = window.ASN || {});

  /* ---------------- opções ---------------- */
  const OPCOES = {
    cabeca: [['bloco', 'Bloco'], ['redonda', 'Redonda'], ['cilindro', 'Cilindro'], ['grande', 'Cabeção']],
    rosto: [['sorriso', '🙂 Sorriso'], ['feliz', '😊 Feliz'], ['legal', '😎 Óculos escuros'], ['bravo', '😠 Bravo'], ['surpreso', '😮 Surpreso'], ['piscada', '😉 Piscada'], ['robo', '🤖 Robô'], ['emoji', '✨ Emoji']],
    cabelo: [['nenhum', 'Nenhum'], ['curto', 'Curto'], ['longo', 'Longo'], ['moicano', 'Moicano'], ['coque', 'Coque'], ['afro', 'Black power']],
    chapeu: [['nenhum', 'Nenhum'], ['bone', 'Boné'], ['cartola', 'Cartola'], ['coroa', 'Coroa'], ['chifres', 'Chifres'], ['orelhas', 'Orelhas de gato'], ['aureola', 'Auréola'], ['capacete', 'Capacete']],
    acessorio: [['nenhum', 'Nenhum'], ['oculos', 'Óculos'], ['mochila', 'Mochila'], ['capa', 'Capa de herói'], ['asas', 'Asas'], ['cachecol', 'Cachecol'], ['espada', 'Espada nas costas']],
    corpo: [['normal', 'Normal'], ['forte', 'Forte'], ['magro', 'Magro'], ['baixinho', 'Baixinho']],
  };
  const JUNTAS = [['tronco', 'Tronco'], ['cab', 'Cabeça'], ['be', 'Braço esquerdo'], ['bd', 'Braço direito'], ['pe', 'Perna esquerda'], ['pd', 'Perna direita']];

  const AVATAR_PADRAO = {
    formato: 'arcadia-avatar', versao: 1, nome: 'Meu personagem',
    pele: '#ffcf9e', camisa: '#3b82f6', calca: '#1e3a8a', sapato: '#2b2f3a',
    cabeca: 'bloco', rosto: 'sorriso', emoji: '😎', corRosto: '#222222',
    cabelo: 'curto', corCabelo: '#4a2c17', chapeu: 'nenhum', corChapeu: '#ef4444',
    acessorio: 'nenhum', corAcessorio: '#facc15', corpo: 'normal',
    animacoes: { parado: 'parado', andar: 'andar', pular: 'pular', emote: 'danca' },
    custom: {}, // animações criadas pela pessoa { id: animação }
  };

  /* ---------------- animações prontas ----------------
     t vai de 0 a 1 (fração da duração). j: rotação [x, y, z] em graus.
     x positivo leva o membro para a frente; z gira para os lados.  */
  const k = (t, j, y) => ({ t, j, y: y || 0 });
  const ANIMS = {
    parado: { nome: 'Parado (respirando)', tipo: 'parado', dur: 2.6, loop: true, quadros: [
      k(0, { tronco: [0, 0, 0], be: [0, 0, -3], bd: [0, 0, 3], cab: [0, 0, 0] }),
      k(0.5, { tronco: [2, 0, 0], be: [3, 0, -6], bd: [3, 0, 6], cab: [-3, 0, 0] }, 0.04),
      k(1, { tronco: [0, 0, 0], be: [0, 0, -3], bd: [0, 0, 3], cab: [0, 0, 0] })] },
    andar: { nome: 'Andar', tipo: 'andar', dur: 0.8, loop: true, quadros: [
      k(0, { pe: [32, 0, 0], pd: [-32, 0, 0], be: [-28, 0, -4], bd: [28, 0, 4], tronco: [3, 0, 0] }),
      k(0.25, { pe: [0, 0, 0], pd: [0, 0, 0], be: [0, 0, -4], bd: [0, 0, 4], tronco: [3, 0, 0] }, 0.18),
      k(0.5, { pe: [-32, 0, 0], pd: [32, 0, 0], be: [28, 0, -4], bd: [-28, 0, 4], tronco: [3, 0, 0] }),
      k(0.75, { pe: [0, 0, 0], pd: [0, 0, 0], be: [0, 0, -4], bd: [0, 0, 4], tronco: [3, 0, 0] }, 0.18),
      k(1, { pe: [32, 0, 0], pd: [-32, 0, 0], be: [-28, 0, -4], bd: [28, 0, 4], tronco: [3, 0, 0] })] },
    pular: { nome: 'Pular', tipo: 'pular', dur: 0.6, loop: false, quadros: [
      k(0, { pe: [20, 0, 0], pd: [-10, 0, 0], be: [0, 0, -140], bd: [0, 0, 140] }),
      k(1, { pe: [35, 0, 0], pd: [-25, 0, 0], be: [0, 0, -160], bd: [0, 0, 160], cab: [-10, 0, 0] })] },
    robo: { nome: 'Andar de robô', tipo: 'andar', dur: 1.0, loop: true, quadros: [
      k(0, { pe: [25, 0, 0], pd: [-25, 0, 0], be: [-25, 0, 0], bd: [25, 0, 0], cab: [0, 15, 0] }),
      k(0.49, { pe: [25, 0, 0], pd: [-25, 0, 0], be: [-25, 0, 0], bd: [25, 0, 0], cab: [0, 15, 0] }),
      k(0.5, { pe: [-25, 0, 0], pd: [25, 0, 0], be: [25, 0, 0], bd: [-25, 0, 0], cab: [0, -15, 0] }),
      k(0.99, { pe: [-25, 0, 0], pd: [25, 0, 0], be: [25, 0, 0], bd: [-25, 0, 0], cab: [0, -15, 0] }),
      k(1, { pe: [25, 0, 0], pd: [-25, 0, 0], be: [-25, 0, 0], bd: [25, 0, 0], cab: [0, 15, 0] })] },
    pato: { nome: 'Andar de pato', tipo: 'andar', dur: 0.7, loop: true, quadros: [
      k(0, { tronco: [0, 0, 10], pe: [15, 0, 8], pd: [-10, 0, 0], be: [0, 0, -40], bd: [0, 0, 40] }),
      k(0.5, { tronco: [0, 0, -10], pe: [-10, 0, 0], pd: [15, 0, -8], be: [0, 0, -50], bd: [0, 0, 50] }, 0.1),
      k(1, { tronco: [0, 0, 10], pe: [15, 0, 8], pd: [-10, 0, 0], be: [0, 0, -40], bd: [0, 0, 40] })] },
    ninja: { nome: 'Corrida ninja', tipo: 'andar', dur: 0.55, loop: true, quadros: [
      k(0, { tronco: [28, 0, 0], cab: [-20, 0, 0], be: [-80, 0, -10], bd: [-80, 0, 10], pe: [45, 0, 0], pd: [-35, 0, 0] }),
      k(0.5, { tronco: [28, 0, 0], cab: [-20, 0, 0], be: [-80, 0, -10], bd: [-80, 0, 10], pe: [-35, 0, 0], pd: [45, 0, 0] }, 0.2),
      k(1, { tronco: [28, 0, 0], cab: [-20, 0, 0], be: [-80, 0, -10], bd: [-80, 0, 10], pe: [45, 0, 0], pd: [-35, 0, 0] })] },
    zumbi: { nome: 'Andar de zumbi', tipo: 'andar', dur: 1.3, loop: true, quadros: [
      k(0, { be: [90, 0, 0], bd: [85, 0, 0], cab: [10, 0, 12], pe: [20, 0, 0], pd: [-15, 0, 0], tronco: [8, 0, 4] }),
      k(0.5, { be: [85, 0, 0], bd: [90, 0, 0], cab: [10, 0, -12], pe: [-15, 0, 0], pd: [20, 0, 0], tronco: [8, 0, -4] }, 0.08),
      k(1, { be: [90, 0, 0], bd: [85, 0, 0], cab: [10, 0, 12], pe: [20, 0, 0], pd: [-15, 0, 0], tronco: [8, 0, 4] })] },
    flutuar: { nome: 'Flutuar (parado)', tipo: 'parado', dur: 2.2, loop: true, quadros: [
      k(0, { be: [0, 0, -25], bd: [0, 0, 25], pe: [10, 0, 0], pd: [-5, 0, 0] }, 0.2),
      k(0.5, { be: [0, 0, -35], bd: [0, 0, 35], pe: [-5, 0, 0], pd: [10, 0, 0] }, 0.6),
      k(1, { be: [0, 0, -25], bd: [0, 0, 25], pe: [10, 0, 0], pd: [-5, 0, 0] }, 0.2)] },
    danca: { nome: 'Dancinha', tipo: 'emote', dur: 1.2, loop: true, quadros: [
      k(0, { tronco: [0, 0, 10], be: [0, 0, -150], bd: [0, 0, 30], pe: [0, 0, 10], pd: [0, 0, 0] }),
      k(0.25, { tronco: [0, 20, 0], be: [0, 0, -90], bd: [0, 0, 90], cab: [0, 0, 15] }, 0.25),
      k(0.5, { tronco: [0, 0, -10], be: [0, 0, -30], bd: [0, 0, 150], pe: [0, 0, 0], pd: [0, 0, -10] }),
      k(0.75, { tronco: [0, -20, 0], be: [0, 0, -90], bd: [0, 0, 90], cab: [0, 0, -15] }, 0.25),
      k(1, { tronco: [0, 0, 10], be: [0, 0, -150], bd: [0, 0, 30], pe: [0, 0, 10], pd: [0, 0, 0] })] },
    aceno: { nome: 'Dar tchau', tipo: 'emote', dur: 1.0, loop: true, quadros: [
      k(0, { bd: [0, 0, 150], cab: [0, 0, -8] }), k(0.25, { bd: [0, 0, 120], cab: [0, 0, -8] }), k(0.5, { bd: [0, 0, 160], cab: [0, 0, -8] }),
      k(0.75, { bd: [0, 0, 120], cab: [0, 0, -8] }), k(1, { bd: [0, 0, 150], cab: [0, 0, -8] })] },
    comemorar: { nome: 'Comemorar', tipo: 'emote', dur: 0.8, loop: true, quadros: [
      k(0, { be: [0, 0, -160], bd: [0, 0, 160], pe: [0, 0, 0], pd: [0, 0, 0] }),
      k(0.5, { be: [0, 0, -120], bd: [0, 0, 120], pe: [20, 0, 0], pd: [20, 0, 0], cab: [-15, 0, 0] }, 0.9),
      k(1, { be: [0, 0, -160], bd: [0, 0, 160], pe: [0, 0, 0], pd: [0, 0, 0] })] },
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  function normalizarAvatar(a) {
    const r = Object.assign(clone(AVATAR_PADRAO), a && typeof a === 'object' ? a : {});
    r.animacoes = Object.assign({}, AVATAR_PADRAO.animacoes, (a && a.animacoes) || {});
    r.custom = (a && a.custom && typeof a.custom === 'object') ? a.custom : {};
    for (const [chave, lista] of Object.entries(OPCOES)) if (!lista.some(o => o[0] === r[chave])) r[chave] = AVATAR_PADRAO[chave];
    for (const c of ['pele', 'camisa', 'calca', 'sapato', 'corRosto', 'corCabelo', 'corChapeu', 'corAcessorio']) if (!/^#[0-9a-f]{6}$/i.test(String(r[c]))) r[c] = AVATAR_PADRAO[c];
    r.emoji = String(r.emoji || '😎').slice(0, 8);
    for (const [id, an] of Object.entries(r.custom)) if (!validaAnim(an)) delete r.custom[id];
    return r;
  }
  function validaAnim(a) {
    return a && Array.isArray(a.quadros) && a.quadros.length >= 1 && a.quadros.length <= 60 && a.quadros.every(q => typeof q.t === 'number' && q.j && typeof q.j === 'object') && +a.dur > 0 && +a.dur <= 20;
  }
  function animDe(av, id) { return (av && av.custom && av.custom[id]) || ANIMS[id] || null; }
  function todasAnims(av) { return Object.assign({}, ANIMS, (av && av.custom) || {}); }

  /* pose no tempo t (segundos): { j: {junta: [x,y,z] rad}, y } */
  const RAD = Math.PI / 180;
  function amostrar(anim, t) {
    const pose = { j: {}, y: 0 };
    if (!anim || !anim.quadros.length) return pose;
    const q = anim.quadros.slice().sort((a, b) => a.t - b.t);
    let f = anim.loop ? ((t / anim.dur) % 1 + 1) % 1 : Math.min(1, t / anim.dur);
    let i = 0; while (i < q.length - 1 && q[i + 1].t <= f) i++;
    const a = q[i], b = q[Math.min(i + 1, q.length - 1)];
    const u = b.t > a.t ? Math.min(1, Math.max(0, (f - a.t) / (b.t - a.t))) : 0, s = u * u * (3 - 2 * u); // suavizado
    for (const [jn] of JUNTAS) {
      const va = a.j[jn] || [0, 0, 0], vb = b.j[jn] || [0, 0, 0];
      pose.j[jn] = [0, 1, 2].map(x => ((va[x] || 0) + ((vb[x] || 0) - (va[x] || 0)) * s) * RAD);
    }
    pose.y = (a.y || 0) + ((b.y || 0) - (a.y || 0)) * s;
    return pose;
  }
  function misturar(p1, p2, w) {
    const r = { j: {}, y: p1.y + (p2.y - p1.y) * w };
    for (const [jn] of JUNTAS) { const a = p1.j[jn] || [0, 0, 0], b = p2.j[jn] || [0, 0, 0]; r.j[jn] = [0, 1, 2].map(x => a[x] + (b[x] - a[x]) * w); }
    return r;
  }

  /* ---------------- rosto ---------------- */
  function desenharRosto(g, av, tam) {
    const s = tam / 64, c = av.corRosto; g.clearRect(0, 0, tam, tam); g.save(); g.scale(s, s);
    g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 4; g.lineCap = 'round';
    const boca = (a0, a1, y = 36, r = 12) => { g.beginPath(); g.arc(32, y, r, a0, a1); g.stroke(); };
    switch (av.rosto) {
      case 'feliz': g.beginPath(); g.arc(21, 28, 5, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(43, 28, 5, Math.PI, 0); g.stroke(); boca(0.15, Math.PI - 0.15, 34, 13); g.fillStyle = 'rgba(255,120,120,.45)'; g.fillRect(10, 36, 8, 4); g.fillRect(46, 36, 8, 4); break;
      case 'legal': g.fillStyle = '#111'; g.fillRect(10, 20, 20, 11); g.fillRect(34, 20, 20, 11); g.fillRect(28, 22, 8, 3); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(13, 22, 5, 3); g.fillRect(37, 22, 5, 3); g.strokeStyle = c; boca(0.3, Math.PI - 0.9, 38, 11); break;
      case 'bravo': g.fillRect(18, 25, 7, 8); g.fillRect(39, 25, 7, 8); g.beginPath(); g.moveTo(14, 18); g.lineTo(27, 23); g.moveTo(50, 18); g.lineTo(37, 23); g.stroke(); boca(Math.PI + 0.4, -0.4, 50, 11); break;
      case 'surpreso': g.beginPath(); g.arc(21, 26, 5, 0, 7); g.fill(); g.beginPath(); g.arc(43, 26, 5, 0, 7); g.fill(); g.beginPath(); g.arc(32, 44, 6, 0, 7); g.stroke(); break;
      case 'piscada': g.fillRect(18, 22, 7, 10); g.beginPath(); g.moveTo(37, 28); g.lineTo(47, 28); g.stroke(); boca(0.2, Math.PI - 0.2); break;
      case 'robo': g.fillStyle = '#22d3ee'; g.fillRect(14, 20, 12, 9); g.fillRect(38, 20, 12, 9); g.fillStyle = c; for (let i = 0; i < 5; i++) g.fillRect(17 + i * 7, 40, 4, 7); break;
      case 'emoji': g.restore(); g.font = `${tam * 0.82}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(av.emoji, tam / 2, tam * 0.56); return;
      default: g.fillRect(18, 22, 7, 10); g.fillRect(39, 22, 7, 10); boca(0.2, Math.PI - 0.2);
    }
    g.restore();
  }

  /* ---------------- construir o modelo 3D ----------------
     Retorna { grupo, juntas, aplicar(pose), atualizar(av), dispose() }.
     grupo fica com os pés em y=0; altura total ~5 (igual ao motor). */
  function construir(THREE, avEntrada) {
    let av = normalizarAvatar(avEntrada);
    const grupo = new THREE.Group(), interno = new THREE.Group(); grupo.add(interno);
    const geos = [], mats = [], texs = [];
    const mat = (cor, extra) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.55 }, extra || {})); mats.push(m); return m; };
    const caixa = (w, h, d, m) => { const g = new THREE.BoxGeometry(w, h, d); geos.push(g); const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; return me; };
    const malha = (geo, m) => { geos.push(geo); const me = new THREE.Mesh(geo, m); me.castShadow = true; return me; };
    const juntas = {};
    function montar() {
      while (interno.children.length) interno.remove(interno.children[0]);
      geos.splice(0).forEach(g => g.dispose()); mats.splice(0).forEach(m => m.dispose()); texs.splice(0).forEach(t => t.dispose());
      const larg = { normal: 1, forte: 1.25, magro: 0.82, baixinho: 1 }[av.corpo], alt = { normal: 1, forte: 1.02, magro: 1.05, baixinho: 0.82 }[av.corpo];
      const mPele = mat(av.pele), mCamisa = mat(av.camisa), mCalca = mat(av.calca), mSapato = mat(av.sapato);
      // quadril
      const quadril = new THREE.Group(); quadril.position.y = 2 * alt; interno.add(quadril);
      // tronco (gira no quadril)
      const tronco = new THREE.Group(); quadril.add(tronco); juntas.tronco = tronco;
      const t = caixa(2 * larg, 2 * alt, 1, mCamisa); t.position.y = 1 * alt; tronco.add(t);
      // cabeça (gira no pescoço)
      const pesc = new THREE.Group(); pesc.position.y = 2 * alt; tronco.add(pesc); juntas.cab = pesc;
      let cab, hc = 1.2;
      if (av.cabeca === 'redonda') { cab = malha(new THREE.SphereGeometry(0.72, 24, 16), mPele); hc = 1.44; }
      else if (av.cabeca === 'cilindro') { cab = malha(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 24), mPele); }
      else if (av.cabeca === 'grande') { cab = caixa(1.7, 1.6, 1.6, mPele); hc = 1.6; }
      else cab = caixa(1.2, 1.2, 1.2, mPele);
      cab.position.y = hc / 2 + 0.02; pesc.add(cab);
      const prof = av.cabeca === 'grande' ? 0.81 : av.cabeca === 'redonda' ? 0.66 : 0.61, lr = av.cabeca === 'grande' ? 1.45 : 1.05;
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; desenharRosto(cv.getContext('2d'), av, 128);
      const tx = new THREE.CanvasTexture(cv); texs.push(tx); if (THREE.SRGBColorSpace) tx.colorSpace = THREE.SRGBColorSpace;
      const rosto = malha(new THREE.PlaneGeometry(lr, lr), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); rosto.castShadow = false; mats.push(rosto.material);
      rosto.position.set(0, cab.position.y, -prof); rosto.rotation.y = Math.PI; pesc.add(rosto);
      const topo = cab.position.y + hc / 2, raioCab = av.cabeca === 'grande' ? 0.85 : 0.62;
      // cabelo
      const mCab = mat(av.corCabelo, { roughness: 0.8 });
      if (av.cabelo === 'curto') { const c = caixa(raioCab * 2 + 0.08, 0.32, raioCab * 2 + 0.08, mCab); c.position.y = topo - 0.1; pesc.add(c); const n = caixa(raioCab * 2 + 0.08, 0.6, 0.2, mCab); n.position.set(0, topo - 0.4, raioCab); pesc.add(n); }
      if (av.cabelo === 'longo') { const c = caixa(raioCab * 2 + 0.1, 0.3, raioCab * 2 + 0.1, mCab); c.position.y = topo - 0.1; pesc.add(c); const n = caixa(raioCab * 2 + 0.1, 1.5, 0.3, mCab); n.position.set(0, topo - 0.85, raioCab + 0.05); pesc.add(n); }
      if (av.cabelo === 'moicano') { const c = caixa(0.32, 0.6, raioCab * 2, mCab); c.position.y = topo + 0.25; pesc.add(c); }
      if (av.cabelo === 'coque') { const c = caixa(raioCab * 2 + 0.06, 0.25, raioCab * 2 + 0.06, mCab); c.position.y = topo - 0.08; pesc.add(c); const b = malha(new THREE.SphereGeometry(0.35, 16, 12), mCab); b.position.set(0, topo + 0.25, 0.3); pesc.add(b); }
      if (av.cabelo === 'afro') { const b = malha(new THREE.SphereGeometry(raioCab * 1.35, 18, 14), mCab); b.position.set(0, topo - 0.1, 0.15); pesc.add(b); }
      // chapéu
      const mCh = mat(av.corChapeu, { roughness: 0.4 });
      if (av.chapeu === 'bone') { const c = malha(new THREE.CylinderGeometry(raioCab + 0.05, raioCab + 0.08, 0.4, 20, 1, false, 0, Math.PI * 2), mCh); c.position.y = topo + 0.1; pesc.add(c); const a = caixa(raioCab * 1.6, 0.08, 0.7, mCh); a.position.set(0, topo - 0.05, -raioCab - 0.3); pesc.add(a); }
      if (av.chapeu === 'cartola') { const a = malha(new THREE.CylinderGeometry(raioCab + 0.4, raioCab + 0.4, 0.08, 24), mCh); a.position.y = topo + 0.04; pesc.add(a); const c = malha(new THREE.CylinderGeometry(raioCab, raioCab, 1.1, 24), mCh); c.position.y = topo + 0.6; pesc.add(c); }
      if (av.chapeu === 'coroa') { const m = mat('#facc15', { metalness: 0.7, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.4 }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = malha(new THREE.ConeGeometry(0.16, 0.5, 4), m); p.position.set(Math.sin(a) * raioCab * 0.85, topo + 0.3, Math.cos(a) * raioCab * 0.85); pesc.add(p); } const b = malha(new THREE.CylinderGeometry(raioCab * 0.95, raioCab * 0.95, 0.2, 24, 1, true), m); b.position.y = topo + 0.08; pesc.add(b); }
      if (av.chapeu === 'chifres') for (const sx of [-1, 1]) { const c = malha(new THREE.ConeGeometry(0.16, 0.7, 12), mCh); c.position.set(sx * raioCab * 0.6, topo + 0.3, 0); c.rotation.z = -sx * 0.35; pesc.add(c); }
      if (av.chapeu === 'orelhas') for (const sx of [-1, 1]) { const c = malha(new THREE.ConeGeometry(0.28, 0.5, 4), mCh); c.position.set(sx * raioCab * 0.6, topo + 0.2, 0); c.rotation.y = Math.PI / 4; pesc.add(c); }
      if (av.chapeu === 'aureola') { const m = new THREE.MeshBasicMaterial({ color: '#fff3a0' }); mats.push(m); const a = malha(new THREE.TorusGeometry(raioCab * 0.8, 0.07, 8, 32), m); a.rotation.x = Math.PI / 2; a.position.y = topo + 0.45; a.castShadow = false; pesc.add(a); }
      if (av.chapeu === 'capacete') { const c = malha(new THREE.SphereGeometry(raioCab * 1.18, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mCh); c.position.y = topo - 0.45; pesc.add(c); }
      // braços (giram no ombro)
      const ombroY = 1.8 * alt, bx = 1 * larg + 0.5;
      for (const [nome, sx] of [['be', -1], ['bd', 1]]) {
        const j = new THREE.Group(); j.position.set(sx * bx, ombroY, 0); tronco.add(j); juntas[nome] = j;
        const manga = caixa(1, 0.8 * alt, 1, mCamisa); manga.position.y = -0.4 * alt; j.add(manga);
        const braco = caixa(0.98, 1.2 * alt, 0.98, mPele); braco.position.y = -1.4 * alt; j.add(braco);
      }
      // pernas (giram no quadril)
      for (const [nome, sx] of [['pe', -1], ['pd', 1]]) {
        const j = new THREE.Group(); j.position.set(sx * 0.5 * larg, 2 * alt, 0); interno.add(j); juntas[nome] = j;
        const perna = caixa(1 * larg - 0.04, 1.65 * alt, 1, mCalca); perna.position.y = -0.83 * alt; j.add(perna);
        const pe = caixa(1 * larg - 0.02, 0.35 * alt, 1.15, mSapato); pe.position.set(0, -1.82 * alt, -0.07); j.add(pe);
      }
      // acessórios
      const mAc = mat(av.corAcessorio, { roughness: 0.45 });
      if (av.acessorio === 'oculos') { const m = mat('#111111', { metalness: 0.4 }); for (const sx of [-1, 1]) { const o = caixa(0.42, 0.26, 0.06, m); o.position.set(sx * 0.27, cab.position.y + 0.1, -prof - 0.04); pesc.add(o); } const p = caixa(0.15, 0.06, 0.05, m); p.position.set(0, cab.position.y + 0.15, -prof - 0.04); pesc.add(p); }
      if (av.acessorio === 'mochila') { const m = caixa(1.5 * larg, 1.5 * alt, 0.6, mAc); m.position.set(0, 1.05 * alt, 0.8); tronco.add(m); }
      if (av.acessorio === 'capa') { const g = new THREE.PlaneGeometry(2.2 * larg, 3.4 * alt); geos.push(g); const m = new THREE.MeshStandardMaterial({ color: av.corAcessorio, side: THREE.DoubleSide, roughness: 0.7 }); mats.push(m); const c = new THREE.Mesh(g, m); c.castShadow = true; c.position.set(0, 0.35 * alt, 0.62); c.rotation.x = 0.12; tronco.add(c); juntas.capa = c; }
      if (av.acessorio === 'asas') for (const sx of [-1, 1]) { const g = new THREE.ConeGeometry(0.9, 2.4, 3); geos.push(g); const w = new THREE.Mesh(g, mAc); w.castShadow = true; w.scale.z = 0.2; w.position.set(sx * 1.4, 1.4 * alt, 0.75); w.rotation.z = sx * 1.1; tronco.add(w); }
      if (av.acessorio === 'cachecol') { const c = caixa(2.15 * larg, 0.45, 1.15, mAc); c.position.y = 1.9 * alt; tronco.add(c); const p = caixa(0.45, 1.1, 0.12, mAc); p.position.set(0.5, 1.25 * alt, -0.6); tronco.add(p); }
      if (av.acessorio === 'espada') { const m = mat('#d6dde8', { metalness: 0.8, roughness: 0.2 }); const l = caixa(0.25, 2.6, 0.08, m); l.position.set(0, 1.3 * alt, 0.65); l.rotation.z = 0.6; tronco.add(l); const c = caixa(0.8, 0.15, 0.15, mAc); c.position.set(-0.55, 2.35 * alt, 0.65); c.rotation.z = 0.6; tronco.add(c); }
    }
    montar();
    const rest = {};
    for (const [n, j] of Object.entries(juntas)) rest[n] = j.rotation.clone();
    function aplicar(pose) {
      for (const [jn] of JUNTAS) { const j = juntas[jn], r = pose.j[jn] || [0, 0, 0]; if (j) j.rotation.set(r[0], r[1], r[2], 'YXZ'); }
      interno.position.y = pose.y || 0;
      if (juntas.capa) juntas.capa.rotation.x = 0.12 + Math.max(0, (pose.j.pe ? Math.abs(pose.j.pe[0]) : 0)) * 0.8;
    }
    return {
      grupo, juntas,
      aplicar,
      atualizar(novo) { av = normalizarAvatar(novo); montar(); },
      dispose() { geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose()); },
    };
  }

  /* ---------------- animador: troca suave entre parado / andar / pular / emote ---------------- */
  function animador(av) {
    av = normalizarAvatar(av);
    let atual = null, anterior = null, tAtual = 0, tAnt = 0, mistura = 1;
    return {
      definir(id) {
        const an = animDe(av, av.animacoes[id] || id) || ANIMS[id];
        if (an === atual) return;
        anterior = atual; tAnt = tAtual; atual = an; tAtual = 0; mistura = anterior ? 0 : 1;
      },
      passo(dt, vel = 1) {
        tAtual += dt * vel; tAnt += dt * vel; mistura = Math.min(1, mistura + dt * 6);
        const p = amostrar(atual, tAtual);
        return anterior && mistura < 1 ? misturar(amostrar(anterior, tAnt), p, mistura) : p;
      },
      trocarAvatar(novo) { av = normalizarAvatar(novo); },
    };
  }

  function lerAvatarSalvo() { try { const a = JSON.parse(localStorage.getItem('arcadia.avatar')); return a ? normalizarAvatar(a) : null; } catch (e) { return null; } }
  function salvarAvatar(a) { try { a = normalizarAvatar(a); a.atualizado = Date.now(); localStorage.setItem('arcadia.avatar', JSON.stringify(a)); return a; } catch (e) { return a; } }

  ASN.avatar = { OPCOES, JUNTAS, ANIMS, AVATAR_PADRAO, normalizar: normalizarAvatar, validaAnim, animDe, todasAnims, amostrar, misturar, construir, animador, desenharRosto, lerSalvo: lerAvatarSalvo, salvar: salvarAvatar, clone };
})();
