/* =========================================================================
   ARCÁDIA STUDIO · criador de personagem e editor de animações
   Abre por cima do Studio: prévia 3D, aparência, roupas, acessórios e
   animações por quadros-chave. Salva no navegador e, com conta, na nuvem.
   Com conta também publica o personagem ou a animação no Marketplace.
   ========================================================================= */
(function () {
  'use strict';
  const A = () => window.ASN.avatar;
  const Conta = () => window.ArcadiaConta || null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);

  const CSS = `
  #pz{position:fixed;inset:0;z-index:120;background:#0d0f16;color:#e7e9f0;font:14px Inter,system-ui,sans-serif;display:flex;flex-direction:column}
  #pz button{font:inherit;color:inherit;cursor:pointer}
  #pz .pz-topo{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #262a36;background:#141722;flex-wrap:wrap}
  #pz .pz-topo h2{margin:0;font-size:17px}
  #pz .pz-topo input{height:32px;border-radius:8px;border:1px solid #2f3445;background:#0d0f16;color:inherit;padding:0 10px;width:200px}
  #pz .pz-sp{flex:1}
  #pz .b{height:34px;padding:0 12px;border-radius:8px;border:1px solid #2f3445;background:#1b1f2c;font-weight:600}
  #pz .b:hover{border-color:#5b8cff} #pz .b.pri{background:#3b6cf6;border-color:transparent} #pz .b.mk{background:linear-gradient(135deg,#f59e0b,#ef4444);border-color:transparent}
  #pz .b:disabled{opacity:.5;cursor:wait}
  #pz .pz-corpo{flex:1;display:grid;grid-template-columns:minmax(260px,1fr) minmax(320px,460px);min-height:0}
  #pz .pz-previa{position:relative;min-height:240px;background:radial-gradient(ellipse at 50% 40%,#2a3350,#0d0f16 70%)}
  #pz .pz-previa canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
  #pz .pz-anims{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
  #pz .pz-anims button{height:30px;padding:0 10px;border-radius:999px;border:1px solid #39405a;background:rgba(13,15,22,.75);font-size:12.5px}
  #pz .pz-anims button.on{background:#3b6cf6;border-color:transparent}
  #pz .pz-dica{position:absolute;top:10px;left:0;right:0;text-align:center;color:#8b93ab;font-size:12px;pointer-events:none}
  #pz .pz-lado{border-left:1px solid #262a36;display:flex;flex-direction:column;min-height:0;background:#11141d}
  #pz .pz-abas{display:flex;border-bottom:1px solid #262a36}
  #pz .pz-abas button{flex:1;height:40px;background:none;border:0;border-bottom:2px solid transparent;color:#8b93ab;font-weight:600}
  #pz .pz-abas button.on{color:#fff;border-bottom-color:#3b6cf6}
  #pz .pz-cont{flex:1;overflow:auto;padding:14px}
  #pz h4{margin:14px 0 6px;font-size:11.5px;letter-spacing:1.2px;text-transform:uppercase;color:#8b93ab} #pz h4:first-child{margin-top:0}
  #pz .chips{display:flex;flex-wrap:wrap;gap:6px}
  #pz .chips button{height:32px;padding:0 11px;border-radius:9px;border:1px solid #2f3445;background:#1b1f2c;font-size:13px}
  #pz .chips button.on{border-color:#5b8cff;background:#22305a}
  #pz .cores{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  #pz .cores i{width:26px;height:26px;border-radius:50%;border:2px solid #0d0f16;box-shadow:0 0 0 1px #39405a;cursor:pointer}
  #pz .cores input[type=color]{width:34px;height:30px;border:0;background:none;padding:0;cursor:pointer}
  #pz .linha{display:flex;gap:8px;align-items:center;margin:6px 0}
  #pz .linha label{flex:1;font-size:12.5px;color:#8b93ab}
  #pz select,#pz .campo{height:32px;border-radius:8px;border:1px solid #2f3445;background:#0d0f16;color:inherit;padding:0 8px;width:100%}
  #pz .slot{display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:center;margin-bottom:6px}
  #pz .lista-an{display:grid;gap:6px;margin-top:8px}
  #pz .lista-an div{display:flex;align-items:center;gap:6px;background:#1b1f2c;border:1px solid #2f3445;border-radius:9px;padding:6px 8px}
  #pz .lista-an div span{flex:1} #pz .lista-an small{color:#8b93ab}
  #pz .lista-an button{height:28px;padding:0 8px;border-radius:7px;border:1px solid #2f3445;background:#141722;font-size:12px}
  #pz .quadros{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0}
  #pz .quadros button{height:28px;min-width:42px;border-radius:7px;border:1px solid #2f3445;background:#1b1f2c;font-size:12px}
  #pz .quadros button.on{background:#3b6cf6;border-color:transparent}
  #pz .eixo{display:grid;grid-template-columns:14px 1fr 46px;gap:6px;align-items:center;font-size:12px;color:#8b93ab}
  #pz .eixo input[type=range]{width:100%}
  #pz .eixo input[type=number]{height:24px;border-radius:6px;border:1px solid #2f3445;background:#0d0f16;color:inherit;width:46px;padding:0 4px;font-size:12px}
  #pz .junta{background:#161a26;border:1px solid #262a36;border-radius:10px;padding:8px;margin-bottom:6px}
  #pz .junta b{font-size:12.5px;display:block;margin-bottom:4px}
  #pz .msg{min-height:18px;font-size:13px;font-weight:600;margin-top:8px}
  #pz .msg.ok{color:#86efac} #pz .msg.err{color:#fca5a5}
  @media (max-width:760px){ #pz .pz-corpo{grid-template-columns:1fr;grid-template-rows:42vh 1fr} #pz .pz-lado{border-left:0;border-top:1px solid #262a36} #pz .pz-topo input{width:140px} }`;

  const PELES = ['#ffe0c4', '#ffcf9e', '#e8b07c', '#c68642', '#8d5524', '#5c3a1e', '#a7f3d0', '#c4b5fd'];
  const CORES = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ffffff', '#9ca3af', '#1f2937', '#111111', '#4a2c17', '#1e3a8a', '#7c2d12'];

  let THREE = null, aberto = null;

  async function abrir(op = {}) {
    if (aberto) return;
    THREE = THREE || await import('three');
    if (!document.getElementById('pz-css')) { const st = document.createElement('style'); st.id = 'pz-css'; st.textContent = CSS; document.head.appendChild(st); }
    let av = A().lerSalvo() || A().normalizar(null);
    const el = document.createElement('div'); el.id = 'pz';
    el.innerHTML = `<div class="pz-topo"><h2>🧍 Meu personagem</h2><input id="pz-nome" maxlength="40" spellcheck="false"><span class="pz-sp"></span>
      <button class="b mk" id="pz-pub">🛒 Publicar no Marketplace</button><button class="b pri" id="pz-salvar">💾 Salvar e usar nos jogos</button><button class="b" id="pz-x">✕</button></div>
      <div class="pz-corpo"><div class="pz-previa" id="pz-previa"><div class="pz-dica">Arraste para girar · roda do mouse aproxima</div><div class="pz-anims" id="pz-anims"></div></div>
      <div class="pz-lado"><div class="pz-abas" id="pz-abas"><button data-aba="aparencia" class="on">Aparência</button><button data-aba="roupas">Roupas</button><button data-aba="acessorios">Acessórios</button><button data-aba="animacoes">Animações</button></div>
      <div class="pz-cont" id="pz-cont"></div><div class="msg" id="pz-msg" style="padding:0 14px 10px"></div></div></div>`;
    document.body.appendChild(el);
    const msg = (t, tipo) => { const m = $('#pz-msg'); m.textContent = t || ''; m.className = 'msg ' + (tipo || ''); };

    // nuvem: se a conta tiver um personagem mais novo, usa ele
    const C = Conta();
    if (C && C.logado()) C.api('lerNuvem', { chave: 'avatar' }).then(r => {
      if (!r.valor) return; const nv = A().normalizar(JSON.parse(r.valor));
      if ((JSON.parse(r.valor).atualizado || 0) > (av.atualizado || 0)) { av = nv; recarregar(); msg('☁️ Personagem carregado da sua conta', 'ok'); }
    }).catch(() => {});

    /* ---------- prévia 3D ---------- */
    const previa = $('#pz-previa');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    previa.prepend(renderer.domElement);
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    cena.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1));
    const sol = new THREE.DirectionalLight(0xffffff, 1.8); sol.position.set(4, 8, -6); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024); cena.add(sol);
    const chao = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: 0x2a3350, roughness: 0.9 })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; cena.add(chao);
    let modelo = A().construir(THREE, av); cena.add(modelo.grupo);
    let anim = A().animador(av), estado = 'parado', editando = null, tEdit = 0, tocandoEdit = true;
    anim.definir(estado);
    const orb = { yaw: Math.PI + 0.5, pitch: 0.18, dist: 13 };
    function redim() { const w = previa.clientWidth, h = previa.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(redim); ro.observe(previa); redim();
    let arr = null;
    renderer.domElement.addEventListener('pointerdown', e => { arr = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture(e.pointerId); });
    renderer.domElement.addEventListener('pointermove', e => { if (!arr) return; orb.yaw -= (e.clientX - arr.x) * 0.01; orb.pitch = Math.max(-0.3, Math.min(1.2, orb.pitch + (e.clientY - arr.y) * 0.006)); arr = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('pointerup', () => { arr = null; });
    renderer.domElement.addEventListener('wheel', e => { orb.dist = Math.max(6, Math.min(24, orb.dist + e.deltaY * 0.01)); e.preventDefault(); }, { passive: false });
    let ult = performance.now(), vivo = true;
    function quadro(agora) {
      if (!vivo) return; requestAnimationFrame(quadro);
      const dt = Math.min(0.05, (agora - ult) / 1000); ult = agora;
      let pose;
      if (editando) { if (tocandoEdit) tEdit += dt; pose = A().amostrar(editando.an, tocandoEdit ? tEdit : Math.min(0.9999, editando.an.quadros[editando.q].t) * editando.an.dur); }
      else pose = anim.passo(dt);
      modelo.aplicar(pose);
      const cp = Math.cos(orb.pitch);
      camera.position.set(Math.sin(orb.yaw) * cp * orb.dist, 2.8 + Math.sin(orb.pitch) * orb.dist, Math.cos(orb.yaw) * cp * orb.dist); camera.lookAt(0, 2.7, 0);
      renderer.render(cena, camera);
    }
    requestAnimationFrame(quadro);
    function recarregar() { modelo.atualizar(av); anim.trocarAvatar(av); anim.definir(estado); $('#pz-nome').value = av.nome; render(); }
    function mudou() { modelo.atualizar(av); anim.trocarAvatar(av); anim.definir(estado); }

    const botoesAnim = () => { $('#pz-anims').innerHTML = [['parado', '🧍 Parado'], ['andar', '🚶 Andar'], ['pular', '🦘 Pular'], ['emote', '💃 Emote (G)']].map(([k, t]) => `<button data-prev="${k}" class="${!editando && estado === k ? 'on' : ''}">${t}</button>`).join(''); };
    $('#pz-anims').onclick = e => { const b = e.target.closest('[data-prev]'); if (!b) return; editando = null; estado = b.dataset.prev; anim.definir(estado); botoesAnim(); if (aba === 'animacoes') render(); };

    /* ---------- painel ---------- */
    let aba = 'aparencia';
    $('#pz-nome').value = av.nome; $('#pz-nome').oninput = e => { av.nome = e.target.value.slice(0, 40) || 'Meu personagem'; };
    $('#pz-abas').onclick = e => { const b = e.target.closest('[data-aba]'); if (!b) return; aba = b.dataset.aba; editando = null; [...$('#pz-abas').children].forEach(x => x.classList.toggle('on', x === b)); render(); };
    const chips = (campo, lista) => `<div class="chips">${lista.map(([v, t]) => `<button data-campo="${campo}" data-v="${v}" class="${av[campo] === v ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const cores = (campo, lista) => `<div class="cores">${lista.map(c => `<i style="background:${c}" data-cor="${campo}" data-v="${c}" title="${c}"></i>`).join('')}<input type="color" data-corlivre="${campo}" value="${av[campo]}"></div>`;
    function render() {
      const O = A().OPCOES, c = $('#pz-cont'); botoesAnim();
      if (aba === 'aparencia') c.innerHTML = `<h4>Corpo</h4>${chips('corpo', O.corpo)}<h4>Cabeça</h4>${chips('cabeca', O.cabeca)}<h4>Pele</h4>${cores('pele', PELES)}
        <h4>Rosto</h4>${chips('rosto', O.rosto)}${av.rosto === 'emoji' ? `<div class="linha"><label>Emoji do rosto</label><input class="campo" style="width:90px;font-size:20px;text-align:center" id="pz-emoji" maxlength="8" value="${esc(av.emoji)}"></div>` : `<div class="linha"><label>Cor dos olhos e boca</label>${cores('corRosto', ['#222222', '#ffffff', '#1e3a8a', '#7c2d12'])}</div>`}`;
      if (aba === 'roupas') c.innerHTML = `<h4>Camisa</h4>${cores('camisa', CORES)}<h4>Calça</h4>${cores('calca', CORES)}<h4>Sapato</h4>${cores('sapato', CORES)}
        <h4>Cabelo</h4>${chips('cabelo', O.cabelo)}${cores('corCabelo', ['#111111', '#4a2c17', '#8b5a2b', '#e8c170', '#f97316', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'])}
        <h4>Chapéu</h4>${chips('chapeu', O.chapeu)}${cores('corChapeu', CORES)}`;
      if (aba === 'acessorios') c.innerHTML = `<h4>Acessório</h4>${chips('acessorio', O.acessorio)}<h4>Cor do acessório</h4>${cores('corAcessorio', CORES)}`;
      if (aba === 'animacoes') renderAnims(c);
      if ($('#pz-emoji')) $('#pz-emoji').oninput = e => { av.emoji = e.target.value || '😎'; mudou(); };
    }
    $('#pz-cont').addEventListener('click', e => {
      const ch = e.target.closest('[data-campo]'); if (ch) { av[ch.dataset.campo] = ch.dataset.v; mudou(); render(); return; }
      const co = e.target.closest('[data-cor]'); if (co) { av[co.dataset.cor] = co.dataset.v; mudou(); render(); return; }
    });
    $('#pz-cont').addEventListener('input', e => { const cl = e.target.closest('[data-corlivre]'); if (cl) { av[cl.dataset.corlivre] = cl.value; mudou(); } });

    /* ---------- animações ---------- */
    function renderAnims(c) {
      if (editando) return renderEditor(c);
      const todas = A().todasAnims(av), ops = tipo => Object.entries(todas).filter(([, a]) => a.tipo === tipo || (tipo === 'parado' && a.tipo === 'emote')).map(([id, a]) => `<option value="${esc(id)}">${esc(a.nome)}${av.custom[id] ? ' ✏️' : ''}</option>`).join('');
      const slot = (k, t, tipo) => `<div class="slot"><span>${t}</span><select data-slot="${k}">${ops(tipo)}</select></div>`;
      c.innerHTML = `<h4>Animações do seu personagem nos jogos</h4>${slot('parado', '🧍 Parado', 'parado')}${slot('andar', '🚶 Andar', 'andar')}${slot('pular', '🦘 Pular', 'pular')}${slot('emote', '💃 Emote (tecla G)', 'emote')}
        <h4>Suas animações</h4><div class="lista-an">${Object.entries(av.custom).map(([id, a]) => `<div><span>${esc(a.nome)} <small>· ${esc(a.tipo)} · ${a.dur}s</small></span><button data-editar="${esc(id)}">✏️ Editar</button><button data-pubanim="${esc(id)}">🛒</button><button data-apagaranim="${esc(id)}">🗑</button></div>`).join('') || '<small style="color:#8b93ab">Nenhuma ainda. Crie uma a partir de uma pronta:</small>'}</div>
        <div class="linha" style="margin-top:10px"><select id="pz-base">${Object.entries(A().ANIMS).map(([id, a]) => `<option value="${id}">Começar de: ${esc(a.nome)}</option>`).join('')}<option value="">Começar do zero</option></select><button class="b pri" id="pz-nova">＋ Nova animação</button></div>
        <p style="color:#8b93ab;font-size:12.5px;line-height:1.5">Cada animação é feita de <b>quadros-chave</b>: você posiciona braços, pernas, tronco e cabeça em alguns momentos, e o jogo faz a transição suave entre eles.</p>`;
      for (const s of c.querySelectorAll('[data-slot]')) { s.value = av.animacoes[s.dataset.slot]; s.onchange = () => { av.animacoes[s.dataset.slot] = s.value; mudou(); estado = s.dataset.slot; anim.definir(estado); botoesAnim(); }; }
      $('#pz-nova').onclick = () => {
        const base = $('#pz-base').value, an = base ? A().clone(A().ANIMS[base]) : { nome: 'Minha animação', tipo: 'emote', dur: 1, loop: true, quadros: [{ t: 0, j: {}, y: 0 }, { t: 1, j: {}, y: 0 }] };
        an.nome = base ? an.nome + ' (minha)' : an.nome; const id = 'c' + Date.now().toString(36);
        editando = { id, an, q: 0, novo: true }; tEdit = 0; tocandoEdit = true; render();
      };
      c.querySelectorAll('[data-editar]').forEach(b => b.onclick = () => { editando = { id: b.dataset.editar, an: A().clone(av.custom[b.dataset.editar]), q: 0 }; tEdit = 0; tocandoEdit = true; render(); });
      c.querySelectorAll('[data-apagaranim]').forEach(b => b.onclick = () => { if (!confirm('Apagar esta animação?')) return; const id = b.dataset.apagaranim; delete av.custom[id]; for (const k in av.animacoes) if (av.animacoes[k] === id) av.animacoes[k] = A().AVATAR_PADRAO.animacoes[k]; mudou(); render(); });
      c.querySelectorAll('[data-pubanim]').forEach(b => b.onclick = () => publicarAnim(av.custom[b.dataset.pubanim]));
    }
    function renderEditor(c) {
      const an = editando.an; an.quadros.sort((a, b) => a.t - b.t); editando.q = Math.min(editando.q, an.quadros.length - 1);
      const q = an.quadros[editando.q];
      const eixo = (jn, i, nome) => { const v = Math.round(((q.j[jn] || [0, 0, 0])[i]) || 0); return `<div class="eixo"><span>${nome}</span><input type="range" min="-180" max="180" value="${v}" data-j="${jn}" data-i="${i}"><input type="number" min="-180" max="180" value="${v}" data-j="${jn}" data-i="${i}"></div>`; };
      c.innerHTML = `<div class="linha"><button class="b" id="pz-voltar">← Voltar</button><span class="pz-sp"></span><button class="b" id="pz-tocar">${tocandoEdit ? '⏸ Pausar' : '▶ Tocar'}</button><button class="b pri" id="pz-salvaranim">Salvar animação</button></div>
        <div class="linha"><label>Nome</label><input class="campo" id="pz-an-nome" maxlength="40" value="${esc(an.nome)}" style="flex:2"></div>
        <div class="linha"><label>Usar como</label><select id="pz-an-tipo" style="flex:2"><option value="parado">Parado</option><option value="andar">Andar</option><option value="pular">Pular</option><option value="emote">Emote</option></select></div>
        <div class="linha"><label>Duração (segundos)</label><input class="campo" type="number" min="0.2" max="20" step="0.1" id="pz-an-dur" value="${an.dur}" style="flex:1"><label style="flex:1"><input type="checkbox" id="pz-an-loop" ${an.loop ? 'checked' : ''}> repetir</label></div>
        <h4>Quadros-chave</h4><div class="quadros">${an.quadros.map((x, i) => `<button data-q="${i}" class="${i === editando.q ? 'on' : ''}">${Math.round(x.t * 100)}%</button>`).join('')}<button id="pz-addq">＋</button><button id="pz-delq" ${an.quadros.length <= 1 ? 'disabled' : ''}>🗑</button></div>
        <div class="eixo" style="grid-template-columns:90px 1fr 46px"><span>Momento</span><input type="range" min="0" max="100" value="${Math.round(q.t * 100)}" id="pz-qt"><input type="number" min="0" max="100" value="${Math.round(q.t * 100)}" id="pz-qt2"></div>
        <div class="eixo" style="grid-template-columns:90px 1fr 46px"><span>Pulinho</span><input type="range" min="-100" max="200" value="${Math.round((q.y || 0) * 100)}" id="pz-qy"><input type="number" value="${Math.round((q.y || 0) * 100)}" id="pz-qy2"></div>
        <h4>Pose deste quadro (graus)</h4>
        ${A().JUNTAS.map(([jn, nome]) => `<div class="junta"><b>${nome}</b>${eixo(jn, 0, 'X')}${eixo(jn, 1, 'Y')}${eixo(jn, 2, 'Z')}</div>`).join('')}
        <p style="color:#8b93ab;font-size:12px;line-height:1.5">X: para a frente / para trás · Y: girar · Z: para os lados. Mexer na pose pausa a prévia neste quadro.</p>`;
      $('#pz-an-tipo').value = an.tipo || 'emote';
      $('#pz-voltar').onclick = () => { editando = null; render(); };
      $('#pz-tocar').onclick = () => { tocandoEdit = !tocandoEdit; render(); };
      $('#pz-an-nome').oninput = e => { an.nome = e.target.value || 'Minha animação'; };
      $('#pz-an-tipo').onchange = e => { an.tipo = e.target.value; };
      $('#pz-an-dur').onchange = e => { an.dur = Math.max(0.2, Math.min(20, +e.target.value || 1)); };
      $('#pz-an-loop').onchange = e => { an.loop = e.target.checked; };
      c.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { editando.q = +b.dataset.q; tocandoEdit = false; render(); });
      $('#pz-addq').onclick = () => { // novo quadro copiando o atual, no meio do caminho até o próximo
        const prox = an.quadros[editando.q + 1], t = prox ? (q.t + prox.t) / 2 : Math.min(1, q.t + 0.25);
        an.quadros.push({ t: Math.round(t * 100) / 100, j: A().clone(q.j), y: q.y || 0 }); an.quadros.sort((a, b) => a.t - b.t);
        editando.q = an.quadros.findIndex(x => x.t === Math.round(t * 100) / 100); tocandoEdit = false; render();
      };
      $('#pz-delq').onclick = () => { if (an.quadros.length <= 1) return; an.quadros.splice(editando.q, 1); editando.q = Math.max(0, editando.q - 1); render(); };
      const pausa = () => { if (tocandoEdit) { tocandoEdit = false; $('#pz-tocar').textContent = '▶ Tocar'; } };
      const setT = v => { q.t = Math.max(0, Math.min(100, +v || 0)) / 100; $('#pz-qt').value = $('#pz-qt2').value = Math.round(q.t * 100); c.querySelectorAll('[data-q]')[editando.q].textContent = Math.round(q.t * 100) + '%'; pausa(); };
      $('#pz-qt').oninput = e => setT(e.target.value); $('#pz-qt2').onchange = e => setT(e.target.value);
      const setY = v => { q.y = (+v || 0) / 100; $('#pz-qy').value = $('#pz-qy2').value = Math.round(q.y * 100); pausa(); };
      $('#pz-qy').oninput = e => setY(e.target.value); $('#pz-qy2').onchange = e => setY(e.target.value);
      c.querySelectorAll('[data-j]').forEach(inp => inp.oninput = () => {
        const jn = inp.dataset.j, i = +inp.dataset.i, v = Math.max(-180, Math.min(180, +inp.value || 0));
        q.j[jn] = q.j[jn] || [0, 0, 0]; q.j[jn][i] = v;
        c.querySelectorAll(`[data-j="${jn}"][data-i="${i}"]`).forEach(o => { if (o !== inp) o.value = v; }); pausa();
      });
      $('#pz-salvaranim').onclick = () => {
        an.quadros.sort((a, b) => a.t - b.t);
        if (!A().validaAnim(an)) return msg('A animação precisa de pelo menos 1 quadro e duração entre 0,2 e 20s.', 'err');
        av.custom[editando.id] = A().clone(an);
        if (editando.novo && an.tipo) av.animacoes[an.tipo] = editando.id; // já passa a usar
        editando = null; mudou(); estado = an.tipo || 'emote'; anim.definir(estado); render(); msg('✓ Animação salva. Clique em "Salvar e usar nos jogos" para guardar tudo.', 'ok');
      };
    }

    /* ---------- salvar e publicar ---------- */
    async function salvarTudo() {
      av = A().salvar(av);
      const C = Conta();
      if (C && C.logado()) { try { await C.api('salvarNuvem', { chave: 'avatar', valor: JSON.stringify(av) }); return '✓ Salvo neste aparelho e na sua conta ☁️. Ele já aparece nos jogos do Studio.'; } catch (e) { return '✓ Salvo neste aparelho (a nuvem falhou: ' + e.message + ')'; } }
      return '✓ Salvo neste aparelho. Ele já aparece nos jogos do Studio. Entre numa conta para levar ele para outros aparelhos.';
    }
    $('#pz-salvar').onclick = async () => { const b = $('#pz-salvar'); b.disabled = true; msg(await salvarTudo(), 'ok'); b.disabled = false; if (op.aoSalvar) op.aoSalvar(av); };
    function fotoCapa() {
      renderer.render(cena, camera);
      const src = renderer.domElement, c2 = document.createElement('canvas'); c2.width = 400; c2.height = 225;
      const g = c2.getContext('2d'), gr = g.createRadialGradient(200, 100, 10, 200, 112, 260); gr.addColorStop(0, '#2a3350'); gr.addColorStop(1, '#0d0f16'); g.fillStyle = gr; g.fillRect(0, 0, 400, 225);
      const esc2 = Math.min(400 / src.width, 225 / src.height) * 1.15; const w = src.width * esc2, h = src.height * esc2; g.drawImage(src, (400 - w) / 2, (225 - h) / 2, w, h);
      for (const qv of [0.78, 0.6, 0.45]) { const d = c2.toDataURL('image/jpeg', qv); if (d.length < 42000) return d; }
      return '';
    }
    async function exigirConta() {
      const C = Conta(); if (C && C.logado()) return C;
      msg('🛒 Para publicar no Marketplace é preciso entrar numa conta (grátis).', 'err'); if (C) C.abrir('entrar'); return null;
    }
    $('#pz-pub').onclick = async () => {
      const C = await exigirConta(); if (!C) return;
      const b = $('#pz-pub'); b.disabled = true; msg('Enviando…');
      try {
        av = A().salvar(av);
        const r = await C.api('publicarConteudo', { tipo: 'personagem', id: av.marketId || '', nome: av.nome, descricao: `Personagem com ${Object.keys(av.custom).length} animação(ões) própria(s).`, genero: 'Personagem', capa: fotoCapa(), dados: JSON.stringify({ ...av, marketId: undefined }) })
          .catch(async e => { if (av.marketId && /outra pessoa|não existe/.test(e.message)) return C.api('publicarConteudo', { tipo: 'personagem', nome: av.nome, genero: 'Personagem', capa: fotoCapa(), dados: JSON.stringify({ ...av, marketId: undefined }) }); throw e; });
        av.marketId = r.conteudo.id; av = A().salvar(av); await salvarTudo();
        msg('✓ Publicado no Marketplace! Qualquer pessoa pode vestir o seu personagem.', 'ok');
      } catch (e) { msg('⚠ ' + e.message, 'err'); } finally { b.disabled = false; }
    };
    async function publicarAnim(an) {
      const C = await exigirConta(); if (!C) return;
      msg('Enviando animação…');
      const antes = editando; editando = { an, q: 0 }; tEdit = an.dur * 0.3; tocandoEdit = false; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const capa = fotoCapa(); editando = antes; tocandoEdit = true;
      try { await C.api('publicarConteudo', { tipo: 'animacao', nome: an.nome, descricao: `Animação de ${an.tipo} · ${an.dur}s`, genero: an.tipo, capa, dados: JSON.stringify(an) }); msg('✓ Animação publicada no Marketplace!', 'ok'); }
      catch (e) { msg('⚠ ' + e.message, 'err'); }
    }
    function fechar() { vivo = false; ro.disconnect(); renderer.dispose(); modelo.dispose(); el.remove(); aberto = null; removeEventListener('keydown', tecla); if (op.aoFechar) op.aoFechar(); }
    const tecla = e => { if (e.key === 'Escape' && !document.querySelector('.ct-fundo.on')) fechar(); };
    addEventListener('keydown', tecla);
    $('#pz-x').onclick = fechar;
    aberto = { fechar };
    render();
  }

  window.ASPersonagem = { abrir };
})();
