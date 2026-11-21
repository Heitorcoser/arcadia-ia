/* =========================================================================
   ARCÁDIA STUDIO · editor
   ========================================================================= */
(function () {
  'use strict';
  const N = window.ASN;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const r3 = v => Math.round(v * 1000) / 1000;
  const TOQUE = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);

  /* ===================== Estado ===================== */
  let proj = null, sel = [], faixaAtual = 'inicio', ferramenta = 'mover';
  let abas = [], abaAtiva = null; const editores = new Map();
  const snap = { mover: 1, girar: 15, escala: 1 };
  let jogando = null, expandidos = new Set(), filtro = '';
  let historico = [], futuro = [], ultimoSnap = null, timerSalvar = null, timerHist = null;
  let autoRecarregar = true;
  const linhasSaida = [];

  /* ===================== Utilidades de UI ===================== */
  let tt; function toast(m, ms = 2600) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), ms); }
  function saida(nivel, texto, origem = '') {
    const d = new Date(), h = d.toTimeString().slice(0, 8);
    linhasSaida.push({ h, nivel, texto: (origem ? origem + ' · ' : '') + texto }); if (linhasSaida.length > 500) linhasSaida.shift();
    const el = document.createElement('div'); el.className = nivel; el.innerHTML = `<span class="t">${h}</span>${esc((origem ? origem + ' · ' : '') + texto)}`;
    const s = $('#saida'); s.appendChild(el); while (s.children.length > 800) s.firstChild.remove(); s.scrollTop = s.scrollHeight;
  }
  function fecharMenu() { $('#menu').classList.remove('on'); }
  function abrirMenu(x, y, itens) {
    const m = $('#menu');
    m.innerHTML = itens.map((it, i) => it === '-' ? '<hr>' : `<button data-i="${i}" ${it.desab ? 'disabled style="opacity:.4"' : ''}>${it.i || ''} ${esc(it.t)}${it.k ? `<span class="k">${esc(it.k)}</span>` : ''}</button>`).join('');
    m.onclick = e => { if (performance.now() < menuProtegidoAte) return; const b = e.target.closest('button'); if (!b) return; const it = itens[+b.dataset.i]; fecharMenu(); if (it && it.f && !it.desab) it.f(); };
    m.classList.add('on'); const r = m.getBoundingClientRect();
    m.style.left = Math.max(6, Math.min(x, innerWidth - r.width - 6)) + 'px'; m.style.top = Math.max(6, Math.min(y, innerHeight - r.height - 6)) + 'px';
  }
  // depois de um toque longo o navegador ainda solta um mousedown "de compatibilidade": ele não pode fechar o menu recém-aberto
  // (vale até o dedo sair da tela e mais um instante; nesse tempo o menu também não aceita cliques)
  let menuProtegidoAte = 0; const protegerMenu = () => { menuProtegidoAte = Infinity; };
  const soltouDedo = () => { if (menuProtegidoAte === Infinity) menuProtegidoAte = performance.now() + 450; };
  addEventListener('touchend', soltouDedo, true); addEventListener('touchcancel', soltouDedo, true);
  addEventListener('mousedown', e => { if (performance.now() < menuProtegidoAte) return; if (!e.target.closest('#menu')) fecharMenu(); });
  function modal(html) { $('#modal-caixa').innerHTML = html; $('#modal').classList.add('on'); }
  function fecharModal() { $('#modal').classList.remove('on'); }
  $('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal' && proj) fecharModal(); });
  $('#modal').addEventListener('click', e => { if (e.target.closest('[data-fechar]')) fecharModal(); });

  /* ===================== Dados da cena ===================== */
  const ehCena = () => proj && proj.tipo === 'cena';
  const acharNo = id => ehCena() ? N.acharPorId(proj.cena, id) : null;
  const servico = nome => proj.cena.children.find(c => c.ClassName === nome);
  function resolver(ref) {
    if (!ref) return null; if (typeof ref === 'object' && ref.id) ref = ref.id;
    const r = acharNo(ref); if (r) return r;
    const n = N.acharPorCaminho(proj.cena, ref); if (n) return N.acharPorId(proj.cena, n.id);
    return null;
  }
  const noSel = () => sel.length ? acharNo(sel[0]) : null;
  const emWorkspace = id => { const c = N.caminhoDe(proj.cena, id); return c && c.split('.')[0] === 'Workspace'; };
  function ancestralModelo(id) {
    // primeiro Model logo abaixo do Workspace que contém o id
    let caminho = []; const busca = (n, pilha) => { if (n.id === id) { caminho = pilha; return true; } for (const f of n.children) if (busca(f, [...pilha, f])) return true; return false; };
    busca(proj.cena, []);
    const ws = caminho[0]; if (!ws || ws.ClassName !== 'Workspace') return id;
    const topo = caminho[1]; return topo && topo.ClassName === 'Model' ? topo.id : id;
  }
  function partesDe(no) { const r = []; N.percorrer(no, n => { if (N.EH_PARTE(n.ClassName)) r.push(n); }); return r; }
  function caixaDe(nos) {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]; let ok = false;
    for (const no of nos) for (const p of partesDe(no)) { ok = true; const P = p.props.Position, S = p.props.Size; for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[k] - S[k] / 2); max[k] = Math.max(max[k], P[k] + S[k] / 2); } }
    return ok ? { min, max, centro: [0, 1, 2].map(k => (min[k] + max[k]) / 2) } : null;
  }
  function moverNo(no, delta) { for (const p of partesDe(no)) p.props.Position = p.props.Position.map((v, k) => r3(v + delta[k])); }

  /* ===================== Histórico e salvamento ===================== */
  const fotografia = () => JSON.stringify(ehCena() ? proj.cena : { arquivos: proj.arquivos, pastas: proj.pastas || [], entrada: proj.entrada });
  function registrar() {
    if (ultimoSnap !== null) { const atual = fotografia(); if (atual === ultimoSnap) return; historico.push(ultimoSnap); if (historico.length > 80) historico.shift(); futuro = []; ultimoSnap = atual; }
    else ultimoSnap = fotografia();
    marcarSujo();
  }
  const registrarDepois = () => { clearTimeout(timerHist); timerHist = setTimeout(registrar, 700); marcarSujo(); };
  function restaurar(f) {
    const d = JSON.parse(f); if (ehCena()) proj.cena = d; else Object.assign(proj, d);
    sel = sel.filter(id => ehCena() ? acharNo(id) : true); ultimoSnap = f; reconstruirTudo(); marcarSujo();
  }
  function desfazer() { if (!historico.length) return toast('Nada para desfazer'); futuro.push(ultimoSnap); restaurar(historico.pop()); toast('↶ Desfeito'); }
  function refazer() { if (!futuro.length) return toast('Nada para refazer'); historico.push(ultimoSnap); restaurar(futuro.pop()); toast('↷ Refeito'); }
  function marcarSujo() { $('#salvo').textContent = 'Salvando…'; clearTimeout(timerSalvar); timerSalvar = setTimeout(salvar, 1000); }
  async function salvar() {
    if (!proj) return; clearTimeout(timerSalvar); proj.atualizado = Date.now();
    for (const [id, cm] of editores) { if (id.startsWith('s:')) { const r = acharNo(id.slice(2)); if (r) r.no.props.Source = cm.getValue(); } }
    try { await N.salvarDb('projetos', structuredClone(proj)); $('#salvo').textContent = 'Salvo ✓'; try { localStorage.setItem('studio.ultimo', proj.id); } catch (e) {} agendarNuvemProj(); }
    catch (e) { $('#salvo').textContent = '⚠ não salvou'; saida('error', 'Erro ao salvar: ' + e.message); }
  }

  // com conta: o projeto também vai para a nuvem (abre em qualquer aparelho)
  let timerNuvemProj = 0;
  const Conta = () => window.ArcadiaConta || null;
  function agendarNuvemProj() {
    const C = Conta(); if (!C || !C.logado() || !proj) return;
    clearTimeout(timerNuvemProj); const p = proj;
    timerNuvemProj = setTimeout(() => {
      const valor = JSON.stringify({ ...p, pasta: undefined });
      C.api('salvarNuvem', { chave: 'studio.' + p.id, valor }).then(() => { if (proj === p) $('#salvo').textContent = 'Salvo ✓ ☁️'; })
        .catch(e => { if (proj === p) { $('#salvo').textContent = 'Salvo ✓ (sem nuvem)'; saida('warn', '☁️ Não salvou na nuvem: ' + e.message); } });
    }, 5000);
  }
  // capa pequena (o servidor guarda até ~44 mil caracteres)
  async function miniCapa(url) {
    if (!url) return '';
    const img = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = url; }); if (!img) return '';
    const c = document.createElement('canvas'); c.width = 400; c.height = 225; c.getContext('2d').drawImage(img, 0, 0, 400, 225);
    for (const q of [0.75, 0.6, 0.45, 0.3]) { const d = c.toDataURL('image/jpeg', q); if (d.length < 42000) return d; }
    return '';
  }

  /* ===================== Abrir / criar projetos ===================== */
  async function abrirProjeto(p) {
    if (jogando) pararJogo();
    proj = p; sel = []; historico = []; futuro = []; ultimoSnap = null;
    for (const cm of editores.values()) cm.getWrapperElement().remove(); editores.clear();
    if (ehCena()) {
      abas = [{ id: 'cena', titulo: '🌐 Cena' }]; abaAtiva = 'cena';
      expandidos = new Set([servico('Workspace')?.id].filter(Boolean));
    } else {
      proj.pastas = proj.pastas || [];
      abas = [{ id: 'previa', titulo: '▶ Prévia' }]; abaAtiva = 'previa';
      expandidos = new Set(proj.pastas);
      const entrada = proj.entrada && proj.arquivos[proj.entrada] ? proj.entrada : Object.keys(proj.arquivos).find(n => /\.html?$/.test(n));
      if (entrada) abrirArquivo(entrada);
    }
    $('#nome-proj').value = proj.nome;
    registrar(); $('#salvo').textContent = 'Salvo ✓';
    fecharModal(); reconstruirTudo();
    if (!ehCena()) executarPrevia();
    saida('ok', `Projeto aberto: ${proj.nome} (${ehCena() ? 'jogo 3D' : 'arquivos'})`);
  }
  async function criarProjeto(tipo, nome, modelo) {
    let p;
    if (tipo === 'cena') {
      const cena = N.cenaPadrao(modelo === 'vazio' ? 'vazio' : 'baseplate');
      p = N.novoProjeto('cena', nome || 'Meu jogo 3D', cena);
      if (modelo === 'obby') montarObby(p.cena);
    } else {
      p = N.novoProjeto('arquivos', nome || 'Meu projeto');
      const t = MODELOS_ARQ[modelo] || MODELOS_ARQ.canvas;
      p.arquivos = Object.fromEntries(Object.entries(t.arquivos).map(([k, v]) => [k, { conteudo: v }]));
      p.entrada = t.entrada || 'index.html';
    }
    await N.salvarDb('projetos', structuredClone(p));
    await abrirProjeto(p);
    return p;
  }
  function reconstruirTudo() {
    document.body.classList.toggle('modo-arquivos', !ehCena());
    renderFaixa(); renderCaixa(); renderArvore(); renderProps(); renderAbas();
    if (ehCena()) reconstruirCena();
    $('#cab-esq').textContent = ehCena() ? '🧰 Caixa de ferramentas' : '🧰 Modelos e arquivos';
  }

  /* ===================== Faixa de ferramentas ===================== */
  const B = (a, i, t, extra = {}) => ({ a, i, t, ...extra });
  function faixas() {
    const arq = [
      ['Projeto', [B('novo', '📄', 'Novo'), B('abrir', '📂', 'Abrir'), B('salvar', '💾', 'Salvar'), B('importar', '📥', 'Importar'), B('exportar', '📤', 'Exportar')]],
      ['Pasta do computador', [B('abrirPasta', '🗂️', 'Abrir pasta'), B('salvarPasta', '💽', 'Salvar na pasta', { desab: !proj || !proj.pasta })]],
      ['Compartilhar', [B('publicar', '🚀', 'Publicar'), B('link', '🔗', 'Link do jogo')]],
      ['Comunidade', [B('personagem', '🧍', 'Meu personagem'), B('marketplace', '🛒', 'Marketplace')]],
    ];
    if (!ehCena()) return {
      arquivo: arq,
      inicio: [
        ['Arquivos', [B('novoArquivo', '📄', 'Novo arquivo'), B('novaPasta', '📁', 'Nova pasta'), B('enviar', '⬆️', 'Enviar arquivos'), B('excluir', '🗑️', 'Excluir')]],
        ['Executar', [B('executar', '▶', 'Executar', { c: 'play' }), B('pararPrevia', '■', 'Parar', { c: 'stop' }), B('autoRec', '🔁', 'Recarregar ao salvar', { on: autoRecarregar })]],
        ['Editar', [B('desfazer', '↶', 'Desfazer'), B('refazer', '↷', 'Refazer')]],
        ['Pasta do PC', [B('abrirPasta', '🗂️', 'Abrir pasta'), B('salvarPasta', '💽', 'Salvar na pasta', { desab: !proj || !proj.pasta })]],
        ['Exportar', [B('zip', '🗜️', 'Baixar .zip')]],
      ],
      modelo: [['Novo a partir de modelo', Object.entries(MODELOS_ARQ).map(([k, m]) => B('modeloArq:' + k, m.i, m.t))]],
      testar: [['Prévia', [B('executar', '▶', 'Executar', { c: 'play' }), B('pararPrevia', '■', 'Parar', { c: 'stop' }), B('janela', '🪟', 'Abrir em janela')]], ['Saída', [B('limparSaida', '🧹', 'Limpar saída')]]],
      exibir: [['Painéis', [B('pEsq', '🧰', 'Caixa'), B('pDir', '🌳', 'Explorer'), B('pBaixo', '📟', 'Saída')]], ['Ajuda', [B('docs', '📘', 'Documentação'), B('atalhos', '⌨️', 'Atalhos')]]],
    };
    return {
      arquivo: arq,
      inicio: [
        ['Área de transferência', [B('colar', '📋', 'Colar'), B('copiar', '📄', 'Copiar'), B('recortar', '✂️', 'Recortar'), B('duplicar', '⧉', 'Duplicar')]],
        ['Ferramentas', [B('f:selecionar', '🖱️', 'Selecionar', { on: ferramenta === 'selecionar' }), B('f:mover', '✥', 'Mover', { on: ferramenta === 'mover' }), B('f:escala', '⤢', 'Escalar', { on: ferramenta === 'escala' }), B('f:girar', '⟳', 'Girar', { on: ferramenta === 'girar' })]],
        ['Inserir', [B('i:Block', '🧱', 'Bloco'), B('i:Ball', '⚪', 'Esfera'), B('i:Cylinder', '🥫', 'Cilindro'), B('i:Wedge', '📐', 'Rampa'), B('i:SpawnLocation', '🏁', 'Spawn')]],
        ['Editar', [{ html: `<div class="mini-col"><label>Cor <input type="color" id="f-cor" value="#a3a2a5"></label><label>Material <select id="f-mat">${N.ENUMS.Material.map(m => `<option>${m}</option>`).join('')}</select></label></div>` }, B('ancorar', '⚓', 'Ancorar'), B('agrupar', '🧩', 'Agrupar'), B('desagrupar', '💥', 'Desagrupar')]],
        ['Histórico', [B('desfazer', '↶', 'Desfazer'), B('refazer', '↷', 'Refazer')]],
        ['Testar', [B('jogar', '▶', 'Jogar', { c: 'play' }), B('parar', '■', 'Parar', { c: 'stop' })]],
        ['Comunidade', [B('personagem', '🧍', 'Meu personagem'), B('marketplace', '🛒', 'Marketplace')]],
      ],
      modelo: [
        ['Objetos', [B('n:PointLight', '🔆', 'Luz'), B('n:BillboardText', '🏷️', 'Texto 3D'), B('n:Sound', '🎵', 'Som'), B('n:ClickDetector', '🖱️', 'Clicável'), B('n:Model', '🧩', 'Modelo'), B('n:Folder', '📁', 'Pasta')]],
        ['Scripts', [B('script:Lua', '📜', 'Script Lua'), B('script:JavaScript', '📃', 'Script JS')]],
        ['Interface', [B('ui:ScreenGui', '🖥️', 'Tela'), B('ui:TextLabel', '🔤', 'Texto'), B('ui:TextButton', '🔘', 'Botão'), B('ui:Frame', '⬛', 'Caixa'), B('ui:ImageLabel', '🖼️', 'Imagem')]],
        ['Valores', [B('n:IntValue', '🔢', 'Número'), B('n:StringValue', '🔤', 'Texto'), B('n:BoolValue', '✅', 'Sim/Não')]],
        ['Encaixe na grade', [{ html: `<div class="mini-col"><label>Mover <input type="number" id="snap-mover" step="0.25" min="0" value="${snap.mover}"></label><label>Girar° <input type="number" id="snap-girar" step="5" min="0" value="${snap.girar}"></label></div>` }]],
      ],
      testar: [['Simulação', [B('jogar', '▶', 'Jogar', { c: 'play' }), B('parar', '■', 'Parar', { c: 'stop' })]], ['Captura', [B('captura', '📸', 'Foto da cena')]], ['Saída', [B('limparSaida', '🧹', 'Limpar saída')]]],
      exibir: [['Painéis', [B('pEsq', '🧰', 'Caixa'), B('pDir', '🌳', 'Explorer'), B('pBaixo', '📟', 'Saída')]], ['Câmera', [B('focar', '🎯', 'Focar (F)'), B('camInicio', '🏠', 'Câmera inicial')]], ['Grade', [B('grade', '#️⃣', 'Mostrar grade', { on: !grade || grade.visible })]], ['Ajuda', [B('docs', '📘', 'Documentação'), B('atalhos', '⌨️', 'Atalhos')]]],
    };
  }
  function renderFaixa() {
    $$('.aba-r').forEach(b => b.classList.toggle('on', b.dataset.faixa === faixaAtual));
    if (!proj) { $('#faixa').innerHTML = ''; return; }
    const gr = faixas()[faixaAtual] || [];
    $('#faixa').innerHTML = gr.map(([rot, itens]) => `<div class="grupo"><div class="itens">${itens.map(b => b.html || `<button class="fb ${b.on ? 'on' : ''} ${b.c || ''}" data-acao="${b.a}" ${b.desab ? 'disabled' : ''} title="${esc(b.t)}"><span class="ic">${b.i}</span>${esc(b.t)}</button>`).join('')}</div><div class="rot">${esc(rot)}</div></div>`).join('');
    const cor = $('#f-cor'), mat = $('#f-mat');
    if (cor) {
      const n = noSel(); const p = n && n.no.props;
      if (p && p.Color) cor.value = p.Color; if (p && p.Material) mat.value = p.Material;
      cor.addEventListener('input', () => aplicarEmSel('Color', cor.value, false)); cor.addEventListener('change', () => registrar());
      mat.addEventListener('change', () => { aplicarEmSel('Material', mat.value, true); });
    }
    const sm = $('#snap-mover'), sg = $('#snap-girar');
    if (sm) { sm.onchange = () => { snap.mover = +sm.value; atualizarGizmo(); }; sg.onchange = () => { snap.girar = +sg.value; atualizarGizmo(); }; }
  }
  $$('.aba-r').forEach(b => b.addEventListener('click', () => { faixaAtual = b.dataset.faixa; renderFaixa(); }));
  $('#faixa').addEventListener('click', e => { const b = e.target.closest('[data-acao]'); if (b && !b.disabled) acao(b.dataset.acao); });

  function aplicarEmSel(prop, valor, reg) {
    for (const id of sel) { const r = acharNo(id); if (!r) continue; const alvos = r.no.props[prop] !== undefined ? [r.no] : partesDe(r.no); for (const n of alvos) if (prop in n.props) { n.props[prop] = valor; atualizarMalha(n); } }
    renderProps(); if (reg) registrar(); else marcarSujo();
  }

  /* ===================== Ações ===================== */
  function acao(a) {
    const [nome, arg] = a.split(':');
    const A = {
      novo: telaInicial, abrir: telaInicial, salvar: () => { salvar(); toast('💾 Salvo'); if (!ehCena() && autoRecarregar) executarPrevia(); },
      importar: () => $('#in-importar').click(), exportar: exportarArquivo, abrirPasta, salvarPasta, publicar: telaPublicar, link: copiarLink,
      f: () => { ferramenta = arg; atualizarGizmo(); renderFaixa(); },
      i: () => inserirParte(arg), n: () => inserirObjeto(arg), script: () => inserirScript(arg), ui: () => inserirUI(arg),
      colar, copiar, recortar, duplicar, excluir: () => excluirSel(), agrupar, desagrupar,
      ancorar: () => { const n = noSel(); if (!n) return; const v = !(partesDe(n.no)[0] || n.no).props.Anchored; aplicarEmSel('Anchored', v, true); toast(v ? '⚓ Ancorado' : 'Solto (cai com a gravidade)'); },
      desfazer, refazer, jogar, parar: pararJogo, captura: () => { const img = captura(); if (img) { const a = document.createElement('a'); a.href = img; a.download = (proj.nome || 'cena') + '.png'; a.click(); } },
      limparSaida: () => { $('#saida').innerHTML = ''; linhasSaida.length = 0; },
      pEsq: () => $('#corpo').classList.toggle('sem-esq'), pDir: () => $('#corpo').classList.toggle('sem-dir'), pBaixo: () => $('#corpo').classList.toggle('sem-baixo'),
      focar, camInicio: () => { cam.pos.set(22, 18, 26); cam.yaw = Math.atan2(22, 26); cam.pitch = -0.5; },
      grade: () => { if (grade) grade.visible = !grade.visible; renderFaixa(); },
      docs: telaDocs, atalhos: telaAtalhos,
      personagem: () => window.ASPersonagem.abrir({ aoSalvar: () => saida('ok', '🧍 Personagem salvo: ele aparece quando você aperta Jogar') }),
      marketplace: () => telaMarketplace(),
      novoArquivo: () => novoArquivo(), novaPasta: () => novaPasta(), enviar: () => $('#in-arquivos').click(),
      executar: () => { mostrarAba('previa'); executarPrevia(); }, pararPrevia: () => { $('#vista-previa').innerHTML = ''; saida('info', 'Prévia parada'); },
      autoRec: () => { autoRecarregar = !autoRecarregar; renderFaixa(); }, zip: baixarZip, janela: abrirEmJanela,
      modeloArq: () => criarProjeto('arquivos', MODELOS_ARQ[arg].t, arg),
    };
    if (nome === 'excluir' && !ehCena()) return excluirArquivoSel();
    (A[nome] || (() => toast('Ação desconhecida: ' + a)))();
  }

  /* ===================== Viewport 3D ===================== */
  let THREE, renderer, cena3, camera, gizmo, grade, construtor, ray, pivo, caixaSel, solV;
  const malhas = new Map();
  const cam = { pos: null, yaw: 0, pitch: -0.45, teclas: {}, rmb: false, mmb: false, ult: [0, 0], sobre: false };
  let arrastandoGizmo = false, inicioGizmo = null;
  async function iniciarViewport() {
    THREE = await import('three');
    const { TransformControls } = await import('three/addons/controls/TransformControls.js');
    construtor = N.construtor(THREE);
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const el = $('#vista-cena'); el.prepend(renderer.domElement); renderer.domElement.tabIndex = 0;
    cena3 = new THREE.Scene(); cena3.background = new THREE.Color('#8ec5ff');
    camera = new THREE.PerspectiveCamera(70, 1, 0.1, 5000);
    cam.pos = new THREE.Vector3(22, 18, 26); cam.yaw = Math.atan2(22, 26); cam.pitch = -0.5;
    cena3.add(new THREE.HemisphereLight(0xdde8ff, 0x55503f, 0.9));
    solV = new THREE.DirectionalLight(0xffffff, 2.2); solV.position.set(60, 120, 40); solV.castShadow = true; solV.shadow.mapSize.set(2048, 2048);
    Object.assign(solV.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, far: 400 }); solV.shadow.bias = -0.0005; cena3.add(solV);
    cena3.add(new THREE.AmbientLight(0x7a8090, 0.45));
    grade = new THREE.GridHelper(512, 128, 0x6b7389, 0x485066); grade.position.y = 0.02; grade.material.transparent = true; grade.material.opacity = 0.28; grade.material.depthWrite = false; cena3.add(grade);
    gizmo = new TransformControls(camera, renderer.domElement); gizmo.setSize(0.9); cena3.add(gizmo);
    gizmo.addEventListener('dragging-changed', e => { arrastandoGizmo = e.value; if (e.value) comecarGizmo(); else terminarGizmo(); });
    gizmo.addEventListener('objectChange', mudouGizmo);
    pivo = new THREE.Object3D(); cena3.add(pivo);
    caixaSel = new THREE.Box3Helper(new THREE.Box3(), 0x38bdf8); caixaSel.visible = false; cena3.add(caixaSel);
    ray = new THREE.Raycaster();
    new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }).observe(el);
    eventosViewport(renderer.domElement);
    let ult = performance.now();
    const loop = (t) => { requestAnimationFrame(loop); const dt = Math.min(0.1, (t - ult) / 1000); ult = t; moverCamera(dt); renderer.render(cena3, camera); };
    requestAnimationFrame(loop);
    if (ehCena()) reconstruirCena();
  }
  function moverCamera(dt) {
    if (!cam.pos) return;
    const k = cam.teclas, ativo = cam.rmb || (cam.sobre && document.activeElement === renderer.domElement);
    if (ativo && !arrastandoGizmo) {
      const v = (k.ShiftLeft || k.ShiftRight ? 70 : 28) * dt;
      const fr = new THREE.Vector3(-Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), -Math.cos(cam.yaw) * Math.cos(cam.pitch));
      const ld = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
      if (k.KeyW) cam.pos.addScaledVector(fr, v); if (k.KeyS) cam.pos.addScaledVector(fr, -v);
      if (k.KeyD) cam.pos.addScaledVector(ld, v); if (k.KeyA) cam.pos.addScaledVector(ld, -v);
      if (k.KeyE) cam.pos.y += v; if (k.KeyQ) cam.pos.y -= v;
    }
    camera.position.copy(cam.pos); camera.rotation.set(cam.pitch, cam.yaw, 0, 'YXZ');
    const info = $('#info-cena'); if (info && ehCena()) info.textContent = `${malhas.size} partes · ${ferramenta === 'selecionar' ? 'Selecionar' : ferramenta === 'mover' ? 'Mover' : ferramenta === 'escala' ? 'Escalar' : 'Girar'} · ${TOQUE ? '1 dedo: girar · 2 dedos: arrastar e pinça · toque: selecionar · segurar: menu' : 'botão direito: olhar · WASD/QE: voar'}`;
  }
  function eventosViewport(tela) {
    let baixo = null;
    tela.addEventListener('contextmenu', e => e.preventDefault());
    tela.addEventListener('mouseenter', () => cam.sobre = true); tela.addEventListener('mouseleave', () => cam.sobre = false);
    tela.addEventListener('pointerdown', e => {
      tela.focus();
      if (e.pointerType === 'touch') return; // toque tem gestos próprios (logo abaixo)
      if (e.button === 2) { cam.rmb = true; cam.ult = [e.clientX, e.clientY]; baixo = { x: e.clientX, y: e.clientY, b: 2 }; }
      if (e.button === 1) { cam.mmb = true; cam.ult = [e.clientX, e.clientY]; e.preventDefault(); }
      if (e.button === 0) baixo = { x: e.clientX, y: e.clientY, b: 0, gizmo: gizmo.axis !== null };
    });
    addEventListener('pointermove', e => {
      if (cam.rmb) { cam.yaw -= (e.clientX - cam.ult[0]) * 0.005; cam.pitch = Math.max(-1.55, Math.min(1.55, cam.pitch - (e.clientY - cam.ult[1]) * 0.005)); cam.ult = [e.clientX, e.clientY]; }
      if (cam.mmb) { const d = cam.pos.length() * 0.0015 + 0.03; const ld = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)); cam.pos.addScaledVector(ld, -(e.clientX - cam.ult[0]) * d); cam.pos.y += (e.clientY - cam.ult[1]) * d; cam.ult = [e.clientX, e.clientY]; }
    });
    addEventListener('pointerup', e => {
      if (e.pointerType === 'touch') return;
      if (e.button === 2) cam.rmb = false; if (e.button === 1) cam.mmb = false;
      if (e.button === 0 && baixo && baixo.b === 0 && !baixo.gizmo && Math.hypot(e.clientX - baixo.x, e.clientY - baixo.y) < 5 && e.target === tela) clicarCena(e);
      baixo = null;
    });
    tela.addEventListener('wheel', e => { e.preventDefault(); const fr = new THREE.Vector3(); camera.getWorldDirection(fr); cam.pos.addScaledVector(fr, -Math.sign(e.deltaY) * Math.max(2, cam.pos.y * 0.12)); }, { passive: false });
    tela.addEventListener('keydown', e => { cam.teclas[e.code] = true; });
    addEventListener('keyup', e => { cam.teclas[e.code] = false; });
    gestosDeToque(tela);
    addEventListener('blur', () => { cam.teclas = {}; cam.rmb = cam.mmb = false; });
    // arrastar modelos da caixa para a cena
    tela.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/arcadia-modelo')) e.preventDefault(); });
    tela.addEventListener('drop', e => { const m = e.dataTransfer.getData('text/arcadia-modelo'); if (m) { e.preventDefault(); inserirModelo(m, pontoNaTela(e.clientX, e.clientY)); } });
  }
  /* ---------- toque (celular e tablet) ----------
     1 dedo arrastando: gira a câmera em volta do ponto que está no meio da tela
     2 dedos: arrastar move a câmera de lado, pinça aproxima e afasta
     toque rápido: seleciona · segurar parado: seleciona e abre o menu do objeto
     arrastar as setas do gizmo continua movendo/girando o objeto */
  const frenteCam = () => new THREE.Vector3(-Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), -Math.cos(cam.yaw) * Math.cos(cam.pitch));
  function gestosDeToque(tela) {
    const toques = new Map(); let g = null, segurar = 0;
    const lista = () => [...toques.values()];
    const centro = () => { const l = lista(); return [l.reduce((a, p) => a + p.x, 0) / l.length, l.reduce((a, p) => a + p.y, 0) / l.length]; };
    const abertura = () => { const [a, b] = lista(); return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
    const alvoOlhado = () => { const p = new THREE.Vector3(...pontoDeInsercao()), d = cam.pos.distanceTo(p); return d > 1 && d < 800 ? p : cam.pos.clone().addScaledVector(frenteCam(), 25); };
    const mundoPorPixel = d => 2 * d * Math.tan(camera.fov * Math.PI / 360) / (renderer.domElement.clientHeight || 1);
    const cancelarSegurar = () => { clearTimeout(segurar); segurar = 0; };
    tela.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (toques.size === 1) {
        g = { tipo: gizmo.axis !== null ? 'gizmo' : 'um', x: e.clientX, y: e.clientY, t0: performance.now(), mov: 0, pivo: null, dist: 0 };
        cancelarSegurar();
        if (ehCena() && !jogando) segurar = setTimeout(() => {
          segurar = 0; if (!g || g.mov >= 10 || toques.size !== 1) return;
          // em cima do gizmo o objeto já está selecionado; fora dele, seleciona o que está sob o dedo
          if (g.tipo === 'um') clicarCena({ clientX: g.x, clientY: g.y });
          g.tipo = 'feito'; if (navigator.vibrate) navigator.vibrate(15);
          if (sel.length) { protegerMenu(); menuObjeto(g.x, g.y); }
        }, 550);
      } else if (toques.size === 2 && g && g.tipo !== 'gizmo') {
        cancelarSegurar(); const [cx, cy] = centro(), alvo = alvoOlhado();
        g = { tipo: 'dois', cx, cy, ab: abertura(), dist: Math.max(2, cam.pos.distanceTo(alvo)), mov: 99 };
      }
    });
    tela.addEventListener('pointermove', e => {
      if (e.pointerType !== 'touch' || !toques.has(e.pointerId) || !g) return;
      const ant = toques.get(e.pointerId), dx = e.clientX - ant.x, dy = e.clientY - ant.y;
      toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.tipo === 'gizmo') { g.mov += Math.abs(dx) + Math.abs(dy); if (g.mov >= 10) cancelarSegurar(); return; }
      if (g.tipo === 'um') {
        g.mov += Math.abs(dx) + Math.abs(dy); if (g.mov < 10) return;
        cancelarSegurar();
        if (!g.pivo) { g.pivo = alvoOlhado(); g.dist = cam.pos.distanceTo(g.pivo); }
        cam.yaw -= dx * 0.008; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch - dy * 0.006));
        cam.pos.copy(g.pivo).addScaledVector(frenteCam(), -g.dist);
      } else if (g.tipo === 'dois' && toques.size >= 2) {
        const [cx, cy] = centro(), ab = abertura(), k = mundoPorPixel(g.dist);
        const lado = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)), cima = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        cam.pos.addScaledVector(lado, -(cx - g.cx) * k).addScaledVector(cima, (cy - g.cy) * k);
        const passo = g.dist * (1 - g.ab / ab), andar = Math.min(passo, g.dist - 1.5);
        cam.pos.addScaledVector(frenteCam(), andar); g.dist = Math.max(1.5, g.dist - andar);
        g.cx = cx; g.cy = cy; g.ab = ab;
      }
    });
    const fim = e => {
      if (e.pointerType !== 'touch' || !toques.has(e.pointerId)) return;
      toques.delete(e.pointerId); cancelarSegurar();
      if (g && g.tipo === 'um' && g.mov < 10 && performance.now() - g.t0 < 550 && !toques.size && e.type === 'pointerup') clicarCena(e);
      if (!toques.size) g = null;
      else if (toques.size === 1 && g && g.tipo === 'dois') { const [p] = lista(); g = { tipo: 'um', x: p.x, y: p.y, t0: 0, mov: 99, pivo: null, dist: 0 }; }
    };
    tela.addEventListener('pointerup', fim); tela.addEventListener('pointercancel', fim);
  }
  function pontoNaTela(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1), camera);
    const h = ray.intersectObjects([...malhas.values()], false)[0];
    if (h) return [h.point.x, h.point.y, h.point.z];
    const t = -ray.ray.origin.y / ray.ray.direction.y; if (t > 0 && t < 2000) { const p = ray.ray.at(t, new THREE.Vector3()); return [p.x, 0, p.z]; }
    const p = ray.ray.at(30, new THREE.Vector3()); return [p.x, Math.max(0, p.y), p.z];
  }
  const pontoDeInsercao = () => { if (!renderer) return [0, 0, 0]; const r = renderer.domElement.getBoundingClientRect(); return pontoNaTela(r.left + r.width / 2, r.top + r.height / 2); };
  function clicarCena(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
    const h = ray.intersectObjects([...malhas.values()].filter(m => m.visible), false)[0];
    let id = h ? h.object.userData.instId : null;
    if (id && !e.altKey) id = ancestralModelo(id);
    if (e.ctrlKey || e.shiftKey) { if (id) sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]; }
    else sel = id ? [id] : [];
    aoSelecionar(true);
  }
  function reconstruirCena() {
    if (!cena3 || !ehCena()) return;
    for (const m of malhas.values()) { cena3.remove(m); m.material && m.material.dispose(); }
    malhas.clear();
    const ws = servico('Workspace'); if (ws) N.percorrer(ws, n => { if (N.EH_PARTE(n.ClassName)) criarMalha(n); });
    const L = servico('Lighting'); if (L) { cena3.background = new THREE.Color(L.props.SkyColor || '#8ec5ff'); cena3.fog = new THREE.Fog(L.props.FogColor || '#c9dcf0', (L.props.FogEnd || 900) * 0.4, (L.props.FogEnd || 900) * 1.5); }
    atualizarGizmo();
  }
  function criarMalha(n) { const m = construtor.criarMalha(n); cena3.add(m); malhas.set(n.id, m); anexos(n); return m; }
  function atualizarMalha(n) {
    if (!cena3) return;
    if (N.EH_PARTE(n.ClassName)) { const m = malhas.get(n.id); if (m) { construtor.aplicar(m, n); anexos(n); } else if (emWorkspace(n.id)) criarMalha(n); }
    else { const r = acharNo(n.id); if (r && r.pai && N.EH_PARTE(r.pai.ClassName)) anexos(r.pai); if (n.ClassName === 'Lighting') reconstruirCena(); }
    atualizarCaixaSel();
  }
  function anexos(parte) {
    const m = malhas.get(parte.id); if (!m) return;
    for (const c of [...m.children]) m.remove(c);
    for (const f of parte.children) {
      if (f.ClassName === 'PointLight' && f.props.Enabled) { const l = new THREE.PointLight(f.props.Color, f.props.Brightness * 3, f.props.Range, 1.6); l.scale.divide(m.scale); m.add(l); }
      if (f.ClassName === 'BillboardText' && f.props.Enabled) { const sp = construtor.spriteTexto(f.props); sp.scale.divide(m.scale); const o = f.props.StudsOffset || [0, 3, 0]; sp.position.set(o[0] / m.scale.x, o[1] / m.scale.y, o[2] / m.scale.z); m.add(sp); }
    }
  }
  function atualizarCaixaSel() {
    if (!caixaSel) return;
    const b = new THREE.Box3(); let ok = false;
    for (const id of sel) { const r = acharNo(id); if (!r) continue; for (const p of partesDe(r.no)) { const m = malhas.get(p.id); if (m) { b.expandByObject(m); ok = true; } } }
    caixaSel.visible = ok; if (ok) caixaSel.box.copy(b.expandByScalar(0.05));
  }
  function atualizarGizmo() {
    if (!gizmo) return;
    gizmo.detach();
    atualizarCaixaSel();
    if (!ehCena() || jogando || ferramenta === 'selecionar' || sel.length !== 1) return;
    const r = acharNo(sel[0]); if (!r) return;
    gizmo.setTranslationSnap(snap.mover > 0 ? snap.mover : null); gizmo.setRotationSnap(snap.girar > 0 ? snap.girar * Math.PI / 180 : null); gizmo.setScaleSnap(snap.escala > 0 ? snap.escala : null);
    gizmo.setSpace(ferramenta === 'escala' ? 'local' : 'world');
    if (N.EH_PARTE(r.no.ClassName)) { const m = malhas.get(r.no.id); if (!m) return; gizmo.setMode(ferramenta === 'escala' ? 'scale' : ferramenta === 'girar' ? 'rotate' : 'translate'); gizmo.attach(m); }
    else { const b = caixaDe([r.no]); if (!b || !emWorkspace(r.no.id)) return; pivo.position.set(...b.centro); pivo.rotation.set(0, 0, 0); pivo.scale.set(1, 1, 1); pivo.updateMatrixWorld(); gizmo.setMode(ferramenta === 'girar' ? 'rotate' : 'translate'); gizmo.attach(pivo); }
  }
  function comecarGizmo() {
    const r = acharNo(sel[0]); if (!r) return;
    if (gizmo.object === pivo) { pivo.updateMatrixWorld(); inicioGizmo = { pivoInv: pivo.matrixWorld.clone().invert(), partes: partesDe(r.no).map(p => ({ p, m: malhas.get(p.id).matrixWorld.clone() })) }; }
  }
  function mudouGizmo() {
    const r = acharNo(sel[0]); if (!r) return;
    const grau = 180 / Math.PI;
    if (gizmo.object === pivo && inicioGizmo) {
      pivo.updateMatrixWorld(); const delta = pivo.matrixWorld.clone().multiply(inicioGizmo.pivoInv);
      const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), eul = new THREE.Euler();
      for (const { p, m } of inicioGizmo.partes) { const nm = delta.clone().multiply(m); nm.decompose(pos, q, sc); eul.setFromQuaternion(q, 'YXZ'); p.props.Position = [r3(pos.x), r3(pos.y), r3(pos.z)]; p.props.Orientation = [r3(eul.x * grau), r3(eul.y * grau), r3(eul.z * grau)]; construtor.aplicar(malhas.get(p.id), p); }
    } else {
      const m = gizmo.object, p = r.no.props;
      p.Position = [r3(m.position.x), r3(m.position.y), r3(m.position.z)];
      p.Orientation = [r3(m.rotation.x * grau), r3(m.rotation.y * grau), r3(m.rotation.z * grau)];
      if (gizmo.mode === 'scale') { const s = [r3(m.scale.x), r3(m.scale.y), r3(m.scale.z)]; if (p.Shape === 'Ball') { const a = s.find((v, i) => Math.abs(v - Math.min(...p.Size)) > 0.001) || s[0]; p.Size = [a, a, a]; } else p.Size = s.map(v => Math.max(0.05, v)); }
      construtor.aplicar(m, r.no); anexos(r.no);
    }
    atualizarCaixaSel(); atualizarCamposTransform();
  }
  function terminarGizmo() { inicioGizmo = null; registrar(); renderProps(); }
  function focar() {
    const r = noSel(); if (!r) return; const b = caixaDe([r.no]); if (!b) return;
    const tam = Math.max(...b.max.map((v, k) => v - b.min[k]), 4);
    const dir = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(cam.pitch), -Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
    cam.pos.set(...b.centro).addScaledVector(dir, tam * 1.6 + 6);
  }
  function captura() {
    if (!renderer) return null;
    // sempre em 1280×720 (capa 16:9), não importa o tamanho do viewport
    camera.position.copy(cam.pos); camera.rotation.set(cam.pitch, cam.yaw, 0, 'YXZ');
    const tam = renderer.getSize(new THREE.Vector2()), pr = renderer.getPixelRatio(), asp = camera.aspect;
    renderer.setPixelRatio(1); renderer.setSize(1280, 720, false); camera.aspect = 16 / 9; camera.updateProjectionMatrix();
    gizmo.visible = false; caixaSel.visible = false; grade.visible = false;
    renderer.render(cena3, camera); const img = renderer.domElement.toDataURL('image/jpeg', 0.82);
    renderer.setPixelRatio(pr); renderer.setSize(tam.x, tam.y, false); camera.aspect = asp; camera.updateProjectionMatrix();
    gizmo.visible = true; grade.visible = true; atualizarCaixaSel(); renderer.render(cena3, camera); return img;
  }

  /* ===================== Explorer ===================== */
  function renderArvore() {
    const a = $('#arvore'); if (!proj) { a.innerHTML = ''; return; }
    if (!ehCena()) return renderArvoreArquivos();
    const f = filtro.toLowerCase();
    const casa = n => !f || n.Name.toLowerCase().includes(f) || n.ClassName.toLowerCase().includes(f) || n.children.some(casa);
    const linha = (n, nivel) => {
      if (!casa(n)) return '';
      const def = N.CLASSES[n.ClassName] || {}, tem = n.children.length > 0, aberto = expandidos.has(n.id) || (f && tem);
      let h = `<div class="no ${sel.includes(n.id) ? 'sel' : ''}" data-id="${n.id}" draggable="${!def.servico}" style="padding-left:${4 + nivel * 14}px"><span class="seta">${tem ? (aberto ? '▼' : '▶') : ''}</span><span class="ico">${def.icone || '❔'}</span><span class="nm">${esc(n.Name)}</span>${n.Name !== n.ClassName ? `<span class="cl">${n.ClassName}</span>` : ''}</div>`;
      if (aberto) for (const c of n.children) h += linha(c, nivel + 1);
      return h;
    };
    a.innerHTML = proj.cena.children.map(s => linha(s, 0)).join('');
  }
  function expandirAte(id) { let c = []; const busca = (n, p) => { if (n.id === id) { c = p; return true; } return n.children.some(f => busca(f, [...p, n.id])); }; busca(proj.cena, []); c.forEach(x => expandidos.add(x)); }
  $('#arvore').addEventListener('click', e => {
    const row = e.target.closest('.no'); if (!row) { if (ehCena()) { sel = []; aoSelecionar(); } return; }
    const id = row.dataset.id;
    if (e.target.classList.contains('seta')) { expandidos.has(id) ? expandidos.delete(id) : expandidos.add(id); renderArvore(); return; }
    if (!ehCena()) { selArquivo = id; if (row.dataset.pasta) { expandidos.has(id) ? expandidos.delete(id) : expandidos.add(id); } renderArvore(); renderProps(); return; }
    if (e.ctrlKey || e.shiftKey) sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]; else sel = [id];
    aoSelecionar();
  });
  $('#arvore').addEventListener('dblclick', e => {
    const row = e.target.closest('.no'); if (!row) return; const id = row.dataset.id;
    if (!ehCena()) { if (!row.dataset.pasta) abrirArquivo(id); return; }
    const r = acharNo(id); if (!r) return;
    if (r.no.ClassName === 'Script') abrirScript(id); else renomear(id);
  });
  $('#arvore').addEventListener('contextmenu', e => {
    e.preventDefault(); const row = e.target.closest('.no');
    if (!ehCena()) return menuArquivo(e, row ? row.dataset.id : null, row && row.dataset.pasta);
    if (row && !sel.includes(row.dataset.id)) { sel = [row.dataset.id]; aoSelecionar(); }
    menuObjeto(e.clientX, e.clientY);
  });
  $('#arvore').addEventListener('keydown', e => { if (e.key === 'F2' && sel[0]) { e.preventDefault(); ehCena() ? renomear(sel[0]) : renomearArquivo(selArquivo); } });
  let arrastando = null;
  $('#arvore').addEventListener('dragstart', e => { const row = e.target.closest('.no'); if (!row) return; arrastando = row.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', arrastando); });
  $('#arvore').addEventListener('dragover', e => { const row = e.target.closest('.no'); $$('.alvo-drop').forEach(x => x.classList.remove('alvo-drop')); if (row && arrastando) { e.preventDefault(); row.classList.add('alvo-drop'); } });
  $('#arvore').addEventListener('dragleave', () => $$('.alvo-drop').forEach(x => x.classList.remove('alvo-drop')));
  $('#arvore').addEventListener('drop', e => {
    e.preventDefault(); $$('.alvo-drop').forEach(x => x.classList.remove('alvo-drop'));
    const row = e.target.closest('.no'); if (!row || !arrastando) return;
    if (!ehCena()) { moverArquivo(arrastando, row.dataset.pasta ? row.dataset.id : row.dataset.id.split('/').slice(0, -1).join('/')); arrastando = null; return; }
    reparentar(arrastando, row.dataset.id); arrastando = null;
  });
  $('#filtro-exp').addEventListener('input', e => { filtro = e.target.value; renderArvore(); });
  $('#exp-recolher').addEventListener('click', () => { expandidos.clear(); renderArvore(); });
  $('#exp-novo').addEventListener('click', e => { if (!ehCena()) return menuArquivo(e, null); const r = e.target.getBoundingClientRect(); abrirMenu(r.left, r.bottom, itensInserir()); });
  function reparentar(id, paiId) {
    const r = acharNo(id), alvo = acharNo(paiId); if (!r || !alvo || id === paiId) return;
    if ((N.CLASSES[r.no.ClassName] || {}).servico) return toast('Serviços não podem ser movidos');
    let x = alvo; while (x) { if (x.no.id === id) return toast('Não dá para colocar um objeto dentro dele mesmo'); x = x.pai ? acharNo(x.pai.id) : null; }
    if (!N.PODE_TER_FILHOS(alvo.no.ClassName)) return toast(`${alvo.no.ClassName} não pode ter filhos`);
    r.pai.children = r.pai.children.filter(c => c !== r.no); alvo.no.children.push(r.no); expandidos.add(alvo.no.id);
    registrar(); reconstruirCena(); renderArvore(); renderProps();
  }
  function renomear(id) {
    const r = acharNo(id); if (!r || (N.CLASSES[r.no.ClassName] || {}).servico) return;
    const row = $(`.no[data-id="${id}"] .nm`); if (!row) return;
    const inp = document.createElement('input'); inp.value = r.no.Name; row.replaceWith(inp); inp.focus(); inp.select();
    const fim = ok => { if (ok && inp.value.trim()) { r.no.Name = inp.value.trim().slice(0, 60); registrar(); renomearAbas(); } renderArvore(); renderProps(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') fim(true); if (e.key === 'Escape') fim(false); e.stopPropagation(); });
    inp.addEventListener('blur', () => fim(true));
  }
  function itensInserir() {
    const pai = noSel(); const paiNo = pai && N.PODE_TER_FILHOS(pai.no.ClassName) ? pai.no : null;
    const it = (cl, t) => ({ i: N.CLASSES[cl].icone, t: t || cl, f: () => inserirObjeto(cl, paiNo ? paiNo.id : null) });
    return [
      { i: '🧱', t: 'Parte (bloco)', f: () => inserirParte('Block') }, it('SpawnLocation'), it('Model', 'Modelo'), it('Folder', 'Pasta'), '-',
      { i: '📜', t: 'Script (Lua)', f: () => inserirScript('Lua') }, { i: '📃', t: 'Script (JavaScript)', f: () => inserirScript('JavaScript') }, '-',
      it('PointLight', 'Luz'), it('BillboardText', 'Texto 3D'), it('Sound', 'Som'), it('ClickDetector', 'Clicável'), '-',
      { i: '🖥️', t: 'Tela (ScreenGui)', f: () => inserirUI('ScreenGui') }, { i: '🔤', t: 'Texto (TextLabel)', f: () => inserirUI('TextLabel') }, { i: '🔘', t: 'Botão (TextButton)', f: () => inserirUI('TextButton') }, '-',
      it('IntValue'), it('StringValue'), it('BoolValue'),
    ];
  }
  function menuObjeto(x, y) {
    const r = noSel(), serv = r && (N.CLASSES[r.no.ClassName] || {}).servico;
    abrirMenu(x, y, [
      { i: '＋', t: 'Inserir objeto…', f: () => abrirMenu(x + 20, y, itensInserir()) },
      ...(r && r.no.ClassName === 'Script' ? [{ i: '📝', t: 'Abrir script', f: () => abrirScript(r.no.id) }] : []),
      '-', { i: '✂️', t: 'Recortar', k: 'Ctrl+X', f: recortar, desab: !r || serv }, { i: '📄', t: 'Copiar', k: 'Ctrl+C', f: copiar, desab: !r || serv }, { i: '📋', t: 'Colar dentro', k: 'Ctrl+V', f: () => colar(true), desab: !area }, { i: '⧉', t: 'Duplicar', k: 'Ctrl+D', f: duplicar, desab: !r || serv },
      '-', { i: '✏️', t: 'Renomear', k: 'F2', f: () => renomear(r.no.id), desab: !r || serv }, { i: '🧩', t: 'Agrupar como modelo', k: 'Ctrl+G', f: agrupar, desab: !r || serv }, { i: '💥', t: 'Desagrupar', k: 'Ctrl+U', f: desagrupar, desab: !r || r.no.ClassName !== 'Model' },
      { i: '🎯', t: 'Focar câmera', k: 'F', f: focar, desab: !r }, { i: '🛒', t: 'Publicar no Marketplace', f: publicarItem, desab: !r || serv }, '-', { i: '🗑️', t: 'Excluir', k: 'Del', f: excluirSel, desab: !r || serv },
    ]);
  }
  function aoSelecionar(daCena) {
    if (sel[0]) expandirAte(sel[0]);
    renderArvore(); renderProps(); atualizarGizmo(); renderFaixa();
    if (daCena && sel[0]) { const row = $(`.no[data-id="${sel[0]}"]`); if (row) row.scrollIntoView({ block: 'nearest' }); }
  }

  /* ===================== Inserir / editar objetos ===================== */
  function paiPadrao(classe) {
    const r = noSel();
    if (r && N.PODE_TER_FILHOS(r.no.ClassName) && !N.EH_PARTE(classe)) return r.no;
    if (N.EH_PARTE(classe) || classe === 'Model' || classe === 'Folder') return servico('Workspace');
    if (classe === 'Script') return servico('ServerScriptService');
    if (N.EH_UI(classe) || classe === 'ScreenGui') return servico('StarterGui');
    if (classe === 'Sound') return servico('SoundService');
    return servico('Workspace');
  }
  function adicionar(no, pai, selecionar = true) {
    pai = pai || servico('Workspace'); pai.children.push(no); expandidos.add(pai.id);
    if (selecionar) sel = [no.id];
    registrar(); if (N.EH_PARTE(no.ClassName) || partesDe(no).length) reconstruirCena(); else if (N.EH_PARTE(pai.ClassName)) anexos(pai);
    aoSelecionar(true); return no;
  }
  function inserirParte(forma) {
    if (!ehCena()) return;
    const p = pontoDeInsercao();
    if (forma === 'SpawnLocation') { const s = N.criar('SpawnLocation', { Position: [r3(p[0]), r3(p[1] + 0.5), r3(p[2])] }); return adicionar(s, servico('Workspace')); }
    const tam = forma === 'Ball' ? [4, 4, 4] : forma === 'Cylinder' ? [4, 2, 2] : forma === 'Wedge' ? [4, 2, 4] : [4, 1, 2];
    const pos = [Math.round(p[0]), r3(p[1] + tam[1] / 2), Math.round(p[2])];
    const cor = $('#f-cor') ? $('#f-cor').value : '#a3a2a5';
    return adicionar(N.criar('Part', { Position: pos, Size: tam, Shape: forma, Color: cor === '#a3a2a5' ? '#a3a2a5' : cor, Material: $('#f-mat') ? $('#f-mat').value : 'Plastic' }, forma === 'Block' ? 'Part' : forma === 'Ball' ? 'Bola' : forma === 'Cylinder' ? 'Cilindro' : 'Rampa'), servico('Workspace'));
  }
  function inserirObjeto(classe, paiId) {
    if (!ehCena()) return;
    const pai = paiId ? acharNo(paiId).no : paiPadrao(classe);
    if (['PointLight', 'BillboardText', 'ClickDetector'].includes(classe) && !N.EH_PARTE(pai.ClassName)) toast('Dica: coloque esse objeto dentro de uma parte (Part)');
    const no = N.criar(classe, {}, classe);
    if (classe === 'Model') { no.Name = 'Modelo'; }
    return adicionar(no, pai);
  }
  const SCRIPT_LUA = `-- Script em Lua. Ele roda quando o jogo começa.\n-- Dica: script.Parent é o objeto onde este script está.\n\nprint("Olá do script " .. script.Name)\n`;
  const SCRIPT_JS = `// Script em JavaScript. Ele roda quando o jogo começa.\n// Use "await wait(1)" para esperar 1 segundo.\n\nprint("Olá do script " + script.Name);\n`;
  function inserirScript(ling, paiId, codigo, nome) {
    if (!ehCena()) return;
    const pai = paiId ? (acharNo(paiId) || {}).no : paiPadrao('Script');
    const s = N.criar('Script', { Language: ling, Source: codigo ?? (ling === 'Lua' ? SCRIPT_LUA : SCRIPT_JS) }, nome || 'Script');
    adicionar(s, pai); abrirScript(s.id); return s;
  }
  function inserirUI(classe) {
    if (!ehCena()) return;
    let pai = noSel() && (N.EH_UI(noSel().no.ClassName) || noSel().no.ClassName === 'ScreenGui') ? noSel().no : null;
    if (classe === 'ScreenGui') return adicionar(N.criar('ScreenGui', {}, 'ScreenGui'), servico('StarterGui'));
    if (!pai) { const sg = servico('StarterGui'); pai = sg.children.find(c => c.ClassName === 'ScreenGui'); if (!pai) { pai = N.criar('ScreenGui', {}, 'ScreenGui'); sg.children.push(pai); } }
    const props = classe === 'TextLabel' ? { Position: [0.5, 0, 0, 20], AnchorPoint: [0.5, 0], Text: 'Texto' } : classe === 'TextButton' ? { Position: [0.5, 0, 0.5, 0], AnchorPoint: [0.5, 0.5], Text: 'Clique aqui' } : classe === 'Frame' ? { Position: [0.5, 0, 0.5, 0], AnchorPoint: [0.5, 0.5], Size: [0, 300, 0, 200], BackgroundTransparency: 0.2 } : { Position: [0, 20, 0, 20], Image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png' };
    return adicionar(N.criar(classe, props, classe), pai);
  }
  function excluirSel() {
    if (!ehCena() || !sel.length) return;
    let n = 0;
    for (const id of sel) { const r = acharNo(id); if (!r || !r.pai || (N.CLASSES[r.no.ClassName] || {}).servico) continue; r.pai.children = r.pai.children.filter(c => c !== r.no); fecharAbasDe(r.no); n++; }
    sel = []; registrar(); reconstruirCena(); aoSelecionar(); if (n) toast(`🗑️ ${n} ${n > 1 ? 'objetos excluídos' : 'objeto excluído'}`);
  }
  let area = null;
  function copiar() { if (!ehCena()) return; const nos = sel.map(id => acharNo(id)).filter(r => r && !(N.CLASSES[r.no.ClassName] || {}).servico).map(r => N.copia(r.no)); if (nos.length) { area = nos; toast(`📄 ${nos.length} copiado(s)`); } }
  function recortar() { copiar(); excluirSel(); }
  function colar(dentro) {
    if (!area || !ehCena()) return;
    const r = noSel(); const pai = dentro && r && N.PODE_TER_FILHOS(r.no.ClassName) ? r.no : (r && r.pai && r.pai.id !== 'raiz' ? r.pai : servico('Workspace'));
    const novos = area.map(n => N.reidentificar(N.copia(n)));
    for (const n of novos) { if (pai === servico('Workspace') || emWorkspace(pai.id)) moverNo(n, [0, 0, 0]); pai.children.push(n); }
    sel = novos.map(n => n.id); registrar(); reconstruirCena(); aoSelecionar(true);
  }
  function duplicar() {
    if (!ehCena()) return;
    const novos = [];
    for (const id of sel) { const r = acharNo(id); if (!r || !r.pai || (N.CLASSES[r.no.ClassName] || {}).servico) continue; const c = N.reidentificar(N.copia(r.no)); const b = caixaDe([c]); if (b) moverNo(c, [b.max[0] - b.min[0] > 0 ? Math.ceil(b.max[0] - b.min[0]) : 2, 0, 0]); c.Name = r.no.Name; r.pai.children.push(c); novos.push(c.id); }
    if (novos.length) { sel = novos; registrar(); reconstruirCena(); aoSelecionar(true); }
  }
  function agrupar() {
    if (!ehCena() || !sel.length) return;
    const rs = sel.map(id => acharNo(id)).filter(r => r && r.pai && !(N.CLASSES[r.no.ClassName] || {}).servico); if (!rs.length) return;
    const pai = rs[0].pai, m = N.criar('Model', {}, 'Modelo');
    for (const r of rs) { r.pai.children = r.pai.children.filter(c => c !== r.no); m.children.push(r.no); }
    pai.children.push(m); sel = [m.id]; expandidos.add(m.id); registrar(); aoSelecionar(); toast('🧩 Agrupado');
  }
  function desagrupar() {
    const r = noSel(); if (!r || r.no.ClassName !== 'Model') return;
    const idx = r.pai.children.indexOf(r.no); r.pai.children.splice(idx, 1, ...r.no.children);
    sel = r.no.children.map(c => c.id); registrar(); aoSelecionar();
  }

  /* ===================== Propriedades ===================== */
  const ORDEM = ['Text', 'Source', 'Language', 'Enabled', 'Position', 'Size', 'Orientation', 'AnchorPoint', 'Shape', 'Color', 'Material', 'Transparency', 'Reflectance', 'Anchored', 'CanCollide', 'CanTouch', 'CastShadow', 'BackgroundColor3', 'BackgroundTransparency', 'TextColor3', 'TextSize', 'TextTransparency', 'Font', 'TextXAlignment', 'CornerRadius', 'Visible', 'ZIndex', 'Image', 'SoundId', 'Volume', 'Looped', 'Playing', 'PlaybackSpeed', 'Brightness', 'Range', 'StudsOffset', 'Value', 'MaxActivationDistance'];
  const NOMES_PT = { Position: 'Posição', Size: 'Tamanho', Orientation: 'Rotação', Color: 'Cor', Material: 'Material', Transparency: 'Transparência', Reflectance: 'Reflexo', Anchored: 'Ancorado', CanCollide: 'Colide', CanTouch: 'Detecta toque', Shape: 'Forma', CastShadow: 'Faz sombra', Language: 'Linguagem', Source: 'Código', Enabled: 'Ativo', Text: 'Texto', TextColor3: 'Cor do texto', TextSize: 'Tamanho do texto', BackgroundColor3: 'Cor de fundo', BackgroundTransparency: 'Transp. do fundo', Visible: 'Visível', AnchorPoint: 'Ponto de âncora', CornerRadius: 'Arredondar', SoundId: 'Som', Volume: 'Volume', Looped: 'Repetir', Playing: 'Tocando', Gravity: 'Gravidade', ClockTime: 'Hora do dia', SkyColor: 'Cor do céu', FogEnd: 'Neblina (distância)', FogColor: 'Cor da neblina', Ambient: 'Luz ambiente', Brightness: 'Brilho', Range: 'Alcance', StudsOffset: 'Deslocamento', Value: 'Valor', RespawnTime: 'Tempo p/ renascer', CharacterWalkSpeed: 'Velocidade', CharacterJumpPower: 'Força do pulo', TextTransparency: 'Transp. do texto', Font: 'Fonte', TextXAlignment: 'Alinhamento', ZIndex: 'Camada', Image: 'Imagem (URL)', ImageId: 'Imagem', PlaybackSpeed: 'Velocidade', GlobalShadows: 'Sombras', FallenPartsDestroyHeight: 'Altura de queda', MaxActivationDistance: 'Distância máx.', ResetOnSpawn: 'Reinicia ao renascer', Volume2: '' };
  function renderProps() {
    const el = $('#props'); if (!proj) { el.innerHTML = ''; return; }
    if (!ehCena()) return renderPropsArquivo();
    if (!sel.length) { el.innerHTML = `<div class="p-vazio">Selecione um objeto na cena ou no Explorer para ver as propriedades.<br><br><b>Dica:</b> ${TOQUE ? 'segure o dedo' : 'clique com o botão direito'} no Explorer para inserir objetos.</div>`; return; }
    if (sel.length > 1) { el.innerHTML = `<div class="p-vazio">${sel.length} objetos selecionados.<br>Use a faixa “Início” para mudar cor e material de todos.</div>`; return; }
    const r = acharNo(sel[0]); if (!r) { el.innerHTML = ''; return; }
    const n = r.no, def = N.CLASSES[n.ClassName] || {};
    const chaves = Object.keys(n.props).sort((a, b) => (ORDEM.indexOf(a) + 1 || 99) - (ORDEM.indexOf(b) + 1 || 99));
    let h = `<div class="p-desc"><b>${def.icone || ''} ${esc(n.ClassName)}</b>${def.desc ? ' · ' + esc(def.desc) : ''}</div><div class="p-sec">Dados</div>`;
    h += `<div class="p-lin"><label>Nome</label><div><input type="text" data-nome value="${esc(n.Name)}" ${def.servico ? 'disabled' : ''}></div></div>`;
    h += `<div class="p-lin"><label>Caminho</label><div style="color:var(--fraco2);font-size:11.5px;overflow:hidden;text-overflow:ellipsis">${esc(N.caminhoDe(proj.cena, n.id) || '')}</div></div>`;
    if (chaves.length) h += `<div class="p-sec">Propriedades</div>`;
    for (const k of chaves) h += linhaProp(k, n.props[k], n);
    el.innerHTML = h;
  }
  function linhaProp(k, v, n) {
    const t = N.tipoProp(k, v), rot = NOMES_PT[k] ? `${NOMES_PT[k]}` : k;
    const lbl = `<label title="${esc(k)}">${esc(rot)}</label>`;
    const num = (i, val, step = 'any') => `<input type="number" step="${step}" data-p="${k}" data-i="${i}" value="${r3(val)}">`;
    let c = '';
    if (t.t === 'num') c = num(-1, v, k === 'Transparency' || k === 'BackgroundTransparency' || /Transp/.test(k) ? 0.1 : 'any');
    else if (t.t === 'bool') c = `<input type="checkbox" data-p="${k}" ${v ? 'checked' : ''}>`;
    else if (t.t === 'vec3') c = v.map((x, i) => num(i, x)).join('');
    else if (t.t === 'vec2') c = v.map((x, i) => num(i, x, 0.05)).join('');
    else if (t.t === 'udim2') c = v.map((x, i) => `<input type="number" step="${i % 2 ? 1 : 0.05}" data-p="${k}" data-i="${i}" value="${x}" title="${['Escala X', 'Pixels X', 'Escala Y', 'Pixels Y'][i]}">`).join('');
    else if (t.t === 'cor') c = `<input type="color" data-p="${k}" value="${v}"><input type="text" data-p="${k}" data-hex value="${v}">`;
    else if (t.t === 'enum') c = `<select data-p="${k}">${t.lista.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    else if (t.t === 'codigo') c = `<button class="p-btn" data-abrir-script="${n.id}">📝 Abrir script (${(v || '').split('\n').length} linhas)</button>`;
    else if (t.t === 'som') c = `<select data-p="${k}" data-som>${N.SONS_PRONTOS.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}<option value="__url" ${N.SONS_PRONTOS.includes(v) ? '' : 'selected'}>URL…</option></select>${N.SONS_PRONTOS.includes(v) ? '' : `<input type="text" data-p="${k}" value="${esc(v)}">`}`;
    else c = `<input type="text" data-p="${k}" value="${esc(v)}">`;
    return `<div class="p-lin">${lbl}<div>${c}</div></div>`;
  }
  function lerValorProp(el, n) {
    const k = el.dataset.p, atual = n.props[k];
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.i !== undefined && el.dataset.i !== '-1') { const arr = [...atual]; arr[+el.dataset.i] = +el.value || 0; return arr; }
    if (typeof atual === 'number') return +el.value || 0;
    if (el.dataset.som && el.value === '__url') return '';
    return el.value;
  }
  function aplicarProp(n, k, v) {
    if (k === 'Orientation' || k === 'Position' || k === 'Size') v = v.map(x => r3(x));
    if (k === 'Language' && editores.has('s:' + n.id)) editores.get('s:' + n.id).setOption('mode', v === 'Lua' ? 'lua' : 'javascript');
    n.props[k] = v; atualizarMalha(n);
    if (k === 'SkyColor' || k === 'FogEnd' || k === 'FogColor') reconstruirCena();
    atualizarGizmoPos();
  }
  function atualizarGizmoPos() { if (gizmo && gizmo.object === pivo) { const r = noSel(); const b = r && caixaDe([r.no]); if (b) pivo.position.set(...b.centro); } }
  $('#props').addEventListener('input', e => {
    const el = e.target; const r = noSel(); if (!r) return;
    if (el.dataset.nome !== undefined) return;
    if (!el.dataset.p || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    if (el.dataset.hex !== undefined && !/^#[0-9a-f]{6}$/i.test(el.value)) return;
    aplicarProp(r.no, el.dataset.p, lerValorProp(el, r.no)); marcarSujo();
  });
  $('#props').addEventListener('change', e => {
    const el = e.target; const r = noSel(); if (!r) return;
    if (el.dataset.nome !== undefined) { if (el.value.trim()) { r.no.Name = el.value.trim(); registrar(); renderArvore(); renomearAbas(); } return; }
    if (!el.dataset.p) return;
    if (el.dataset.hex !== undefined && !/^#[0-9a-f]{6}$/i.test(el.value)) { renderProps(); return; }
    aplicarProp(r.no, el.dataset.p, lerValorProp(el, r.no)); registrar(); renderProps();
  });
  $('#props').addEventListener('click', e => { const b = e.target.closest('[data-abrir-script]'); if (b) abrirScript(b.dataset.abrirScript); });
  function atualizarCamposTransform() {
    const r = noSel(); if (!r) return;
    for (const k of ['Position', 'Size', 'Orientation']) { const v = r.no.props[k]; if (!v) continue; $$(`#props input[data-p="${k}"]`).forEach(inp => { inp.value = r3(v[+inp.dataset.i]); }); }
  }

  /* ===================== Abas e editores de código ===================== */
  function renderAbas() {
    $('#abas').innerHTML = abas.map(a => `<div class="aba ${a.id === abaAtiva ? 'on' : ''} ${a.mod ? 'mod' : ''}" data-aba="${esc(a.id)}">${esc(a.titulo)}${a.id === 'cena' || a.id === 'previa' ? '' : '<button class="x" data-fechar-aba>✕</button>'}</div>`).join('');
    mostrarVista();
  }
  function mostrarVista() {
    const a = abas.find(x => x.id === abaAtiva) || abas[0]; if (!a) return; abaAtiva = a.id;
    $$('.vista').forEach(v => v.classList.remove('on'));
    if (jogando) { $('#vista-jogo').classList.add('on'); return; }
    if (a.id === 'cena') $('#vista-cena').classList.add('on');
    else if (a.id === 'previa') $('#vista-previa').classList.add('on');
    else { $('#vista-codigo').classList.add('on'); for (const [id, cm] of editores) { const w = cm.getWrapperElement ? cm.getWrapperElement() : cm.el; w.style.display = id === a.id ? '' : 'none'; if (id === a.id && cm.refresh) setTimeout(() => { cm.refresh(); cm.focus(); }, 0); } }
  }
  $('#abas').addEventListener('click', e => {
    const aba = e.target.closest('.aba'); if (!aba) return;
    if (e.target.closest('[data-fechar-aba]')) { fecharAba(aba.dataset.aba); return; }
    abaAtiva = aba.dataset.aba; renderAbas();
  });
  $('#abas').addEventListener('auxclick', e => { const aba = e.target.closest('.aba'); if (aba && e.button === 1 && aba.dataset.aba !== 'cena' && aba.dataset.aba !== 'previa') fecharAba(aba.dataset.aba); });
  function mostrarAba(id) { abaAtiva = id; renderAbas(); }
  function fecharAba(id) {
    const cm = editores.get(id); if (cm) { if (id.startsWith('s:')) { const r = acharNo(id.slice(2)); if (r) r.no.props.Source = cm.getValue(); } (cm.getWrapperElement ? cm.getWrapperElement() : cm.el).remove(); editores.delete(id); }
    const i = abas.findIndex(a => a.id === id); abas.splice(i, 1);
    if (abaAtiva === id) abaAtiva = (abas[i - 1] || abas[0] || {}).id; renderAbas();
  }
  function fecharAbasDe(no) { N.percorrer(no, n => { if (abas.some(a => a.id === 's:' + n.id)) fecharAba('s:' + n.id); }); }
  function renomearAbas() { for (const a of abas) if (a.id.startsWith('s:')) { const r = acharNo(a.id.slice(2)); if (r) a.titulo = (r.no.props.Language === 'Lua' ? '📜 ' : '📃 ') + r.no.Name; } renderAbas(); }
  function criarEditor(id, valor, modo, aoMudar) {
    const cm = CodeMirror($('#vista-codigo'), {
      value: valor, mode: modo, theme: 'material-darker', lineNumbers: true, tabSize: 2, indentUnit: 2, indentWithTabs: false,
      autoCloseBrackets: true, matchBrackets: true, styleActiveLine: true, lineWrapping: false,
      extraKeys: { 'Ctrl-S': () => acao('salvar'), 'Cmd-S': () => acao('salvar'), 'Ctrl-/': 'toggleComment', 'Cmd-/': 'toggleComment', Tab: c => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('  ') },
    });
    cm.on('change', () => { aoMudar(cm.getValue()); const a = abas.find(x => x.id === id); if (a && !a.mod) { a.mod = true; renderAbasSoTitulos(); } });
    editores.set(id, cm); return cm;
  }
  function renderAbasSoTitulos() { $$('.aba').forEach(el => { const a = abas.find(x => x.id === el.dataset.aba); if (a) el.classList.toggle('mod', !!a.mod); }); }
  function abrirScript(id) {
    const r = acharNo(id); if (!r || r.no.ClassName !== 'Script') return;
    const abaId = 's:' + id;
    if (!abas.some(a => a.id === abaId)) {
      abas.push({ id: abaId, titulo: (r.no.props.Language === 'Lua' ? '📜 ' : '📃 ') + r.no.Name });
      criarEditor(abaId, r.no.props.Source || '', r.no.props.Language === 'Lua' ? 'lua' : 'javascript', v => { const rr = acharNo(id); if (rr) { rr.no.props.Source = v; registrarDepois(); } });
    }
    mostrarAba(abaId);
  }

  /* ===================== Jogar (cena) ===================== */
  function jogar() {
    if (!ehCena()) { acao('executar'); return; }
    if (jogando) pararJogo();
    salvar();
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts allow-pointer-lock'); f.setAttribute('allow', 'autoplay; fullscreen; gamepad');
    f.src = 'jogar.html?embed=1&studio=1&v=' + encodeURIComponent(window.VERSAO_STUDIO || ''); // com a versão: nunca abre um jogar.html velho do cache
    $('#vista-jogo').innerHTML = ''; $('#vista-jogo').appendChild(f); jogando = f;
    $('#faixa-jogo').classList.add('on'); gizmo && gizmo.detach(); mostrarVista();
    saida('info', '▶ Jogo iniciado'); marcarBarra();
    setTimeout(() => f.focus(), 400);
  }
  function pararJogo() {
    if (!jogando) return; jogando.remove(); jogando = null; $('#vista-jogo').innerHTML = '';
    $('#faixa-jogo').classList.remove('on'); mostrarVista(); atualizarGizmo(); saida('info', '■ Jogo parado'); marcarBarra();
  }
  $('#btn-parar-jogo').addEventListener('click', pararJogo);
  window.addEventListener('message', e => {
    const d = e.data; if (!d || typeof d !== 'object') return;
    if (d.fonte === 'as-jogo' && jogando && e.source === jogando.contentWindow) {
      if (d.tipo === 'aguardando') jogando.contentWindow.postMessage({ tipo: 'carregar', projeto: JSON.parse(JSON.stringify({ ...proj, pasta: undefined })), opcoes: { studio: true, avatar: N.avatar.lerSalvo(), nomeJogador: ((Conta() && Conta().usuario()) || {}).nome || localStorage.getItem('studio.autor') || 'Jogador' } }, '*');
      if (d.tipo === 'log') saida(d.nivel, d.texto, 'Jogo');
      if (d.tipo === 'captura' && esperaCaptura) { esperaCaptura(d.imagem); esperaCaptura = null; }
    }
    if (d.fonte === 'as-preview' && d.tipo === 'log') saida(d.nivel === 'log' ? '' : d.nivel, d.texto, 'Prévia');
  });
  let esperaCaptura = null;

  /* ===================== Projetos de arquivos ===================== */
  let selArquivo = null;
  function arvoreArquivos() {
    const raiz = { nome: '', caminho: '', pasta: true, filhos: new Map() };
    const garantir = caminho => { let n = raiz; let acc = ''; for (const p of caminho.split('/').filter(Boolean)) { acc = acc ? acc + '/' + p : p; if (!n.filhos.has(p)) n.filhos.set(p, { nome: p, caminho: acc, pasta: true, filhos: new Map() }); n = n.filhos.get(p); } return n; };
    for (const p of proj.pastas || []) garantir(p);
    for (const c of Object.keys(proj.arquivos)) { const partes = c.split('/'); const nome = partes.pop(); const pai = garantir(partes.join('/')); pai.filhos.set(nome, { nome, caminho: c, pasta: false }); }
    return raiz;
  }
  const ICONE_ARQ = c => { const e = N.extensao(c); return { html: '🌐', htm: '🌐', css: '🎨', js: '📜', mjs: '📜', ts: '🔷', tsx: '🔷', jsx: '⚛️', json: '🧾', md: '📝', py: '🐍', lua: '🌙', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️', mp3: '🎵', wav: '🎵', ogg: '🎵', glb: '🧊', gltf: '🧊', txt: '📄' }[e] || '📄'; };
  function renderArvoreArquivos() {
    const raiz = arvoreArquivos(), f = filtro.toLowerCase();
    const ord = m => [...m.values()].sort((a, b) => (b.pasta - a.pasta) || a.nome.localeCompare(b.nome));
    const casa = n => !f || n.caminho.toLowerCase().includes(f) || (n.pasta && ord(n.filhos).some(casa));
    const linha = (n, nivel) => {
      if (!casa(n)) return '';
      const aberto = n.pasta && (expandidos.has(n.caminho) || f);
      let h = `<div class="no ${selArquivo === n.caminho ? 'sel' : ''}" data-id="${esc(n.caminho)}" ${n.pasta ? 'data-pasta="1"' : ''} draggable="true" style="padding-left:${4 + nivel * 14}px"><span class="seta">${n.pasta ? (aberto ? '▼' : '▶') : ''}</span><span class="ico">${n.pasta ? (aberto ? '📂' : '📁') : ICONE_ARQ(n.caminho)}</span><span class="nm">${esc(n.nome)}</span>${n.caminho === proj.entrada ? '<span class="cl">entrada</span>' : ''}</div>`;
      if (aberto) for (const c of ord(n.filhos)) h += linha(c, nivel + 1);
      return h;
    };
    $('#arvore').innerHTML = `<div class="no" data-id="" data-pasta="1" style="padding-left:4px"><span class="seta">▼</span><span class="ico">📦</span><span class="nm"><b>${esc(proj.nome)}</b></span>${proj.pasta ? '<span class="cl">pasta do PC</span>' : ''}</div>` + ord(raiz.filhos).map(c => linha(c, 1)).join('');
  }
  function renderPropsArquivo() {
    const el = $('#props'); const c = selArquivo;
    const htmls = Object.keys(proj.arquivos).filter(n => /\.html?$/.test(n));
    let h = `<div class="p-sec">Projeto</div><div class="p-lin"><label>Arquivo de entrada</label><div><select id="p-entrada">${htmls.map(n => `<option ${n === proj.entrada ? 'selected' : ''}>${esc(n)}</option>`).join('')}${htmls.length ? '' : '<option>(automático)</option>'}</select></div></div>`;
    h += `<div class="p-lin"><label>Arquivos</label><div>${Object.keys(proj.arquivos).length}</div></div>`;
    if (c && proj.arquivos[c]) {
      const a = proj.arquivos[c], tam = a.b64 ? Math.round(a.conteudo.length * 0.75) : new Blob([a.conteudo || '']).size;
      h += `<div class="p-sec">Arquivo</div><div class="p-lin"><label>Caminho</label><div>${esc(c)}</div></div><div class="p-lin"><label>Tipo</label><div>${esc(N.MIME[N.extensao(c)] || 'texto')}</div></div><div class="p-lin"><label>Tamanho</label><div>${tam < 1024 ? tam + ' B' : (tam / 1024).toFixed(1) + ' KB'}</div></div>`;
      h += `<div class="p-desc" style="display:flex;gap:6px;flex-wrap:wrap;border:0"><button class="p-btn" data-arq="abrir">Abrir</button><button class="p-btn" data-arq="renomear">Renomear</button><button class="p-btn" data-arq="baixar">Baixar</button><button class="p-btn" data-arq="excluir">Excluir</button></div>`;
    } else if (c !== null && c !== undefined) h += `<div class="p-sec">Pasta</div><div class="p-lin"><label>Caminho</label><div>${esc(c || '/')}</div></div>`;
    h += `<div class="p-desc" style="border:0">Linguagens: HTML, CSS, JavaScript, TypeScript (.ts/.tsx), JSX, Lua (<code>&lt;script type="application/lua"&gt;</code>) e Python (<code>&lt;script type="text/python"&gt;</code>). Arraste arquivos do computador para cá.</div>`;
    el.innerHTML = h;
    const pe = $('#p-entrada'); if (pe) pe.onchange = () => { if (proj.arquivos[pe.value]) { proj.entrada = pe.value; registrar(); renderArvore(); executarPrevia(); } };
  }
  $('#props').addEventListener('click', e => {
    const b = e.target.closest('[data-arq]'); if (!b || !selArquivo) return;
    const op = b.dataset.arq;
    if (op === 'abrir') abrirArquivo(selArquivo); if (op === 'renomear') renomearArquivo(selArquivo); if (op === 'excluir') excluirArquivo(selArquivo); if (op === 'baixar') baixarArquivo(selArquivo);
  });
  function modoDe(c) { const e = N.extensao(c); return { js: 'javascript', mjs: 'javascript', jsx: { name: 'javascript', jsx: true }, ts: { name: 'javascript', typescript: true }, tsx: { name: 'javascript', typescript: true }, json: { name: 'javascript', json: true }, html: 'htmlmixed', htm: 'htmlmixed', svg: 'xml', xml: 'xml', css: 'css', lua: 'lua', py: 'python', md: 'markdown' }[e] || null; }
  function abrirArquivo(c) {
    const a = proj.arquivos[c]; if (!a) return;
    const abaId = 'f:' + c;
    if (!abas.some(x => x.id === abaId)) {
      abas.push({ id: abaId, titulo: ICONE_ARQ(c) + ' ' + c.split('/').pop() });
      const e = N.extensao(c);
      if (a.b64) {
        const div = document.createElement('div'); div.className = 'img-prev'; div.style.height = '100%';
        const mime = N.MIME[e] || '';
        div.innerHTML = mime.startsWith('image/') ? `<img src="data:${mime};base64,${a.conteudo}">` : mime.startsWith('audio/') ? `<audio controls src="data:${mime};base64,${a.conteudo}"></audio>` : `<div style="color:var(--fraco)">Arquivo binário (${esc(mime || e)})</div>`;
        $('#vista-codigo').appendChild(div); editores.set(abaId, { el: div });
      } else criarEditor(abaId, a.conteudo || '', modoDe(c), v => { if (proj.arquivos[c]) { proj.arquivos[c].conteudo = v; proj.arquivos[c].mod = true; registrarDepois(); } });
    }
    selArquivo = c; mostrarAba(abaId); renderArvore(); renderProps();
  }
  function pastaAtual() { if (selArquivo === null || selArquivo === undefined) return ''; if (proj.arquivos[selArquivo]) return selArquivo.split('/').slice(0, -1).join('/'); return selArquivo; }
  function novoArquivo(pasta = pastaAtual()) {
    const nome = prompt('Nome do novo arquivo (ex: jogo.js, estilo.css, main.py, main.lua):', 'novo.js'); if (!nome) return;
    const c = (pasta ? pasta + '/' : '') + nome.replace(/^\/+/, '');
    if (proj.arquivos[c]) return toast('Já existe um arquivo com esse nome');
    proj.arquivos[c] = { conteudo: MODELO_POR_EXT[N.extensao(c)] || '' }; registrar(); expandidos.add(pasta); renderArvore(); abrirArquivo(c);
  }
  function novaPasta(pasta = pastaAtual()) {
    const nome = prompt('Nome da nova pasta:', 'pasta'); if (!nome) return;
    const c = (pasta ? pasta + '/' : '') + nome.replace(/^\/+|\/+$/g, '');
    proj.pastas = [...new Set([...(proj.pastas || []), c])]; expandidos.add(c); selArquivo = c; registrar(); renderArvore(); renderProps();
  }
  function renomearArquivo(c) {
    if (!c) return; const ehPasta = !proj.arquivos[c];
    const novo = prompt('Novo caminho:', c); if (!novo || novo === c) return;
    const mover = (de, para) => { proj.arquivos[para] = proj.arquivos[de]; delete proj.arquivos[de]; const aba = abas.find(a => a.id === 'f:' + de); if (aba) fecharAba(aba.id); if (proj.entrada === de) proj.entrada = para; };
    if (ehPasta) { for (const k of Object.keys(proj.arquivos)) if (k.startsWith(c + '/')) mover(k, novo + k.slice(c.length)); proj.pastas = (proj.pastas || []).map(p => p === c || p.startsWith(c + '/') ? novo + p.slice(c.length) : p); }
    else mover(c, novo);
    selArquivo = novo; registrar(); renderArvore(); renderProps();
  }
  function moverArquivo(de, pastaDestino) {
    if (de === pastaDestino || (pastaDestino + '/').startsWith(de + '/')) return;
    const nome = de.split('/').pop(), para = (pastaDestino ? pastaDestino + '/' : '') + nome;
    if (proj.arquivos[de]) { if (proj.arquivos[para]) return toast('Já existe ' + para); proj.arquivos[para] = proj.arquivos[de]; delete proj.arquivos[de]; if (proj.entrada === de) proj.entrada = para; const aba = abas.find(a => a.id === 'f:' + de); if (aba) fecharAba(aba.id); }
    else { for (const k of Object.keys(proj.arquivos)) if (k.startsWith(de + '/')) { proj.arquivos[para + k.slice(de.length)] = proj.arquivos[k]; delete proj.arquivos[k]; } proj.pastas = (proj.pastas || []).map(p => p === de || p.startsWith(de + '/') ? para + p.slice(de.length) : p); }
    registrar(); renderArvore();
  }
  function excluirArquivo(c) {
    if (!c && c !== '') return; const ehPasta = !proj.arquivos[c];
    if (!confirm(`Excluir ${ehPasta ? 'a pasta' : 'o arquivo'} "${c}"?`)) return;
    for (const k of Object.keys(proj.arquivos)) if (k === c || k.startsWith(c + '/')) { delete proj.arquivos[k]; const aba = abas.find(a => a.id === 'f:' + k); if (aba) fecharAba(aba.id); }
    proj.pastas = (proj.pastas || []).filter(p => p !== c && !p.startsWith(c + '/'));
    selArquivo = null; registrar(); renderArvore(); renderProps();
  }
  const excluirArquivoSel = () => selArquivo ? excluirArquivo(selArquivo) : toast('Selecione um arquivo no Explorer');
  function menuArquivo(e, c, ehPasta) {
    selArquivo = c ?? selArquivo; renderArvore();
    const pasta = c === null || c === undefined ? '' : (ehPasta ? c : c.split('/').slice(0, -1).join('/'));
    abrirMenu(e.clientX, e.clientY, [
      { i: '📄', t: 'Novo arquivo', f: () => novoArquivo(pasta) }, { i: '📁', t: 'Nova pasta', f: () => novaPasta(pasta) }, { i: '⬆️', t: 'Enviar arquivos…', f: () => { destinoUpload = pasta; $('#in-arquivos').click(); } }, '-',
      { i: '📝', t: 'Abrir', f: () => abrirArquivo(c), desab: !c || ehPasta }, { i: '🚪', t: 'Definir como entrada', f: () => { proj.entrada = c; registrar(); renderArvore(); renderProps(); executarPrevia(); }, desab: !c || !/\.html?$/.test(c) },
      { i: '✏️', t: 'Renomear / mover', f: () => renomearArquivo(c), desab: !c }, { i: '⬇️', t: 'Baixar', f: () => baixarArquivo(c), desab: !c || ehPasta }, '-', { i: '🗑️', t: 'Excluir', f: () => excluirArquivo(c), desab: !c },
    ]);
  }
  let destinoUpload = '';
  const lerArquivoLocal = f => new Promise(ok => { const r = new FileReader(); const texto = N.ehTexto(f.name) && f.size < 3e6; r.onload = () => ok(texto ? { conteudo: r.result } : { conteudo: String(r.result).split(',')[1] || '', b64: true }); texto ? r.readAsText(f) : r.readAsDataURL(f); });
  async function importarArquivosSoltos(lista, pasta = '') {
    if (!proj || ehCena()) { toast('Arquivos só podem ser adicionados em projetos de arquivos'); return; }
    let n = 0;
    for (const f of lista) { const c = (pasta ? pasta + '/' : '') + (f.webkitRelativePath || f.caminhoRelativo || f.name); proj.arquivos[c] = await lerArquivoLocal(f); n++; }
    registrar(); renderArvore(); toast(`⬆️ ${n} arquivo(s) adicionados`); if (autoRecarregar) executarPrevia();
  }
  $('#in-arquivos').addEventListener('change', e => { importarArquivosSoltos([...e.target.files], destinoUpload || pastaAtual()); destinoUpload = ''; e.target.value = ''; });
  // soltar arquivos do computador
  let contaArrasto = 0;
  addEventListener('dragenter', e => { if (e.dataTransfer && e.dataTransfer.types.includes('Files')) { contaArrasto++; $('#arrastar-arquivos').style.display = 'flex'; } });
  addEventListener('dragleave', e => { if (e.dataTransfer && e.dataTransfer.types.includes('Files')) { contaArrasto--; if (contaArrasto <= 0) { contaArrasto = 0; $('#arrastar-arquivos').style.display = 'none'; } } });
  addEventListener('dragover', e => { if (e.dataTransfer && e.dataTransfer.types.includes('Files')) e.preventDefault(); });
  addEventListener('drop', async e => {
    if (!e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); contaArrasto = 0; $('#arrastar-arquivos').style.display = 'none';
    const arqs = [...e.dataTransfer.files];
    if (arqs.length === 1 && /\.(zip|arcadia|json)$/i.test(arqs[0].name) && (ehCena() || confirm('Importar este arquivo como um projeto novo? (Cancelar adiciona ao projeto atual)'))) return importarProjetoDeArquivo(arqs[0]);
    importarArquivosSoltos(arqs, pastaAtual());
  });
  async function executarPrevia() {
    if (!proj || ehCena()) return;
    const v = $('#vista-previa'); v.innerHTML = '';
    let html; try { html = await N.construirHTML(proj, t => saida('info', t, 'Prévia')); } catch (e) { saida('error', 'Erro ao montar a prévia: ' + e.message); return; }
    const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts allow-pointer-lock allow-modals allow-popups'); f.setAttribute('allow', 'autoplay; fullscreen; gamepad');
    f.srcdoc = html; v.appendChild(f);
  }
  async function abrirEmJanela() { if (!proj) return; salvar(); const link = await gerarLink(); window.open(link, '_blank'); }
  function baixarArquivo(c) { const a = proj.arquivos[c]; if (!a) return; const blob = a.b64 ? new Blob([Uint8Array.from(atob(a.conteudo), ch => ch.charCodeAt(0))], { type: N.MIME[N.extensao(c)] }) : new Blob([a.conteudo], { type: 'text/plain' }); baixarBlob(blob, c.split('/').pop()); }
  function baixarBlob(blob, nome) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
  async function baixarZip() {
    await N.carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
    const z = new JSZip();
    if (ehCena()) z.file((proj.nome || 'jogo') + '.arcadia.json', JSON.stringify(proj, null, 1));
    else for (const [c, a] of Object.entries(proj.arquivos)) z.file(c, a.conteudo, { base64: !!a.b64 });
    baixarBlob(await z.generateAsync({ type: 'blob' }), (proj.nome || 'projeto').replace(/[^\w-]+/g, '_') + '.zip');
  }

  /* ===================== Pastas do computador ===================== */
  const IGNORAR = /^(node_modules|\.git|\.svn|dist|build|\.next|\.cache|__pycache__)$/;
  async function abrirPasta() {
    if (!window.showDirectoryPicker) { toast('Seu navegador não abre pastas direto. Escolha a pasta para importar uma cópia.'); $('#in-pasta').click(); return; }
    let dir; try { dir = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch (e) { return; }
    saida('info', 'Lendo a pasta ' + dir.name + '…');
    const arquivos = {}, pastas = []; let total = 0;
    async function ler(h, base) {
      for await (const [nome, item] of h.entries()) {
        if (IGNORAR.test(nome)) continue; const c = base ? base + '/' + nome : nome;
        if (item.kind === 'directory') { pastas.push(c); await ler(item, c); }
        else { const f = await item.getFile(); total += f.size; if (total > 40e6) throw new Error('Pasta grande demais (máx. 40 MB)'); arquivos[c] = await lerArquivoLocal(f); }
      }
    }
    try { await ler(dir, ''); } catch (e) { saida('error', e.message); toast(e.message); return; }
    if (arquivos['projeto.arcadia.json']) { try { const p = JSON.parse(arquivos['projeto.arcadia.json'].conteudo); if (p.formato === 'arcadia-studio') { p.pasta = dir; await N.salvarDb('projetos', p); return abrirProjeto(p); } } catch (e) {} }
    const p = N.novoProjeto('arquivos', dir.name); p.arquivos = arquivos; p.pastas = pastas; p.pasta = dir;
    p.entrada = Object.keys(arquivos).find(n => /^index\.html?$/i.test(n)) || Object.keys(arquivos).find(n => /\.html?$/.test(n)) || 'index.html';
    await N.salvarDb('projetos', p); abrirProjeto(p); toast(`🗂️ ${Object.keys(arquivos).length} arquivos carregados de "${dir.name}"`);
  }
  $('#in-pasta').addEventListener('change', async e => {
    const lista = [...e.target.files].filter(f => !f.webkitRelativePath.split('/').some(p => IGNORAR.test(p))); if (!lista.length) return;
    const raizNome = lista[0].webkitRelativePath.split('/')[0];
    const p = N.novoProjeto('arquivos', raizNome); p.arquivos = {};
    for (const f of lista) p.arquivos[f.webkitRelativePath.split('/').slice(1).join('/')] = await lerArquivoLocal(f);
    p.entrada = Object.keys(p.arquivos).find(n => /^index\.html?$/i.test(n)) || 'index.html';
    await N.salvarDb('projetos', p); abrirProjeto(p); e.target.value = '';
  });
  async function salvarPasta() {
    if (!proj || !proj.pasta) return toast('Este projeto não veio de uma pasta do computador');
    try {
      if ((await proj.pasta.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await proj.pasta.requestPermission({ mode: 'readwrite' })) !== 'granted') return toast('Sem permissão para gravar na pasta');
      let n = 0;
      const escrever = async (caminho, dados) => { const partes = caminho.split('/'); const nome = partes.pop(); let d = proj.pasta; for (const p of partes) d = await d.getDirectoryHandle(p, { create: true }); const fh = await d.getFileHandle(nome, { create: true }); const w = await fh.createWritable(); await w.write(dados); await w.close(); n++; };
      if (ehCena()) await escrever('projeto.arcadia.json', JSON.stringify({ ...proj, pasta: undefined }, null, 1));
      else for (const [c, a] of Object.entries(proj.arquivos)) await escrever(c, a.b64 ? Uint8Array.from(atob(a.conteudo), ch => ch.charCodeAt(0)) : a.conteudo);
      toast(`💽 ${n} arquivo(s) gravados na pasta "${proj.pasta.name}"`); saida('ok', `Gravado na pasta do computador: ${proj.pasta.name}`);
    } catch (e) { saida('error', 'Erro ao gravar na pasta: ' + e.message); }
  }

  /* ===================== Importar / exportar ===================== */
  $('#in-importar').addEventListener('change', e => { const f = e.target.files[0]; if (f) importarProjetoDeArquivo(f); e.target.value = ''; });
  async function importarProjetoDeArquivo(f) {
    try {
      if (/\.zip$/i.test(f.name)) {
        await N.carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
        const z = await JSZip.loadAsync(f); const arquivos = {};
        let prefixo = null; const nomes = Object.keys(z.files).filter(n => !z.files[n].dir);
        const json = nomes.find(n => /\.arcadia\.json$/.test(n));
        if (json) { const p = JSON.parse(await z.file(json).async('string')); p.id = 'proj-' + N.novoId(); await N.salvarDb('projetos', p); return abrirProjeto(p); }
        const tops = new Set(nomes.map(n => n.split('/')[0])); if (tops.size === 1 && nomes.every(n => n.includes('/'))) prefixo = [...tops][0] + '/';
        for (const n of nomes) { const c = prefixo ? n.slice(prefixo.length) : n; if (c.split('/').some(p => IGNORAR.test(p))) continue; arquivos[c] = N.ehTexto(c) ? { conteudo: await z.file(n).async('string') } : { conteudo: await z.file(n).async('base64'), b64: true }; }
        const p = N.novoProjeto('arquivos', f.name.replace(/\.zip$/i, '')); p.arquivos = arquivos; p.entrada = Object.keys(arquivos).find(n => /^index\.html?$/i.test(n)) || 'index.html';
        await N.salvarDb('projetos', p); return abrirProjeto(p);
      }
      const p = JSON.parse(await f.text());
      if (p.formato !== 'arcadia-studio') throw new Error('Arquivo não é um projeto do Arcádia Studio');
      p.id = 'proj-' + N.novoId(); await N.salvarDb('projetos', p); abrirProjeto(p); toast('📥 Projeto importado');
    } catch (e) { toast('Não deu para importar: ' + e.message); saida('error', e.message); }
  }
  function exportarArquivo() { if (!proj) return; baixarBlob(new Blob([JSON.stringify({ ...proj, pasta: undefined }, null, 1)], { type: 'application/json' }), (proj.nome || 'projeto').replace(/[^\w-]+/g, '_') + '.arcadia.json'); }
  async function gerarLink() { const p = JSON.parse(JSON.stringify({ ...proj, pasta: undefined, capa: '' })); return new URL('jogar.html', location.href).href + '#p=' + await N.compactar(p); }
  async function copiarLink() {
    const link = await gerarLink();
    try { await navigator.clipboard.writeText(link); toast(`🔗 Link copiado (${Math.round(link.length / 1024)} KB)`); } catch (e) { prompt('Copie o link do jogo:', link); }
  }

  /* ===================== Publicar ===================== */
  const GENEROS = ['Aventura', 'Ação', 'Obby / Parkour', 'Plataforma', 'Puzzle', 'Corrida', 'Terror', 'Simulador', 'Tycoon', 'RPG', 'Party Game', 'Esporte', 'Arcade', 'Outro'];
  async function telaPublicar() {
    if (!proj) return; await salvar();
    const capa = ehCena() ? captura() : '';
    const autor = localStorage.getItem('studio.autor') || '';
    modal(`<div class="m-cab"><h2>🚀 Publicar “${esc(proj.nome)}”</h2><button data-fechar>✕</button></div><div class="m-corpo">
      <div style="display:grid;grid-template-columns:${capa ? '240px 1fr' : '1fr'};gap:18px">
        ${capa ? `<div><img src="${capa}" style="width:100%;border-radius:10px;border:1px solid var(--linha2)"><div style="color:var(--fraco2);font-size:12px;margin-top:6px">A capa é a vista atual da câmera.</div></div>` : ''}
        <div>
          <label class="campo"><span>Nome do jogo</span><input id="pb-nome" value="${esc(proj.nome)}"></label>
          <div class="linha2"><label class="campo"><span>Gênero</span><select id="pb-gen">${GENEROS.map(g => `<option ${g === proj.genero ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
          <label class="campo"><span>Subgênero</span><input id="pb-sub" value="${esc(proj.subgenero || '')}" placeholder="ex: Obby de lava"></label></div>
          <label class="campo" style="${Conta() && Conta().logado() ? 'display:none' : ''}"><span>Seu nome (autor)</span><input id="pb-autor" value="${esc(autor)}" placeholder="Como você quer aparecer"></label>
          <label class="campo"><span>Descrição</span><textarea id="pb-desc" placeholder="Conte do que se trata o jogo e como jogar">${esc(proj.descricao || '')}</textarea></label>
          ${Conta() && Conta().logado()
            ? `<button class="btn-pri" id="pb-online" style="height:38px;width:100%">🌍 Publicar para todo mundo · como ${esc(Conta().usuario().nome)} ✓</button>${proj.nuvemId ? '<div style="color:var(--fraco2);font-size:12px;margin-top:4px">Já está no ar: publicar de novo atualiza o mesmo jogo, sem perder curtidas e partidas.</div>' : ''}`
            : `<div style="background:var(--painel2);border:1px solid var(--linha2);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.5">🌍 <b>Publicar para todo mundo</b> precisa de uma conta (grátis). Com ela o jogo aparece em “Online” para qualquer pessoa, com o seu nome e o selo ✓.<br><button class="btn" id="pb-entrar" style="margin-top:6px">Entrar ou criar conta</button></div>`}
          <button class="btn" id="pb-ok" style="height:34px;margin-top:8px">Publicar só neste navegador</button>
          <div id="pb-res" style="margin-top:14px"></div>
        </div></div></div>`);
    const metaTela = () => ({ nome: $('#pb-nome').value.trim() || proj.nome, genero: $('#pb-gen').value, subgenero: $('#pb-sub').value.trim(), autor: $('#pb-autor').value.trim() || 'Anônimo', descricao: $('#pb-desc').value.trim() });
    if ($('#pb-entrar')) $('#pb-entrar').onclick = () => { Conta() && Conta().abrir('entrar'); const volta = () => { removeEventListener('arcadia-conta', volta); if (Conta().logado()) telaPublicar(); }; addEventListener('arcadia-conta', volta); };
    if ($('#pb-online')) $('#pb-online').onclick = async () => {
      const b = $('#pb-online'), txt = b.textContent; b.disabled = true; b.textContent = '⏳ Enviando para o servidor…';
      try {
        const C = Conta(), meta = { ...metaTela(), autor: C.usuario().nome };
        Object.assign(proj, { nome: meta.nome, genero: meta.genero, subgenero: meta.subgenero, descricao: meta.descricao, autor: meta.autor });
        const pedido = async id => C.api('publicarConteudo', { tipo: 'jogo', id, nome: meta.nome, descricao: meta.descricao, genero: meta.genero, subgenero: meta.subgenero, capa: await miniCapa(capa), dados: JSON.stringify({ ...proj, pasta: undefined, capa: '' }) });
        let r; try { r = await pedido(proj.nuvemId || ''); } catch (e) { if (!proj.nuvemId || !/outra pessoa|não existe/.test(e.message)) throw e; r = await pedido(''); } // projeto importado de outra pessoa: vira um novo
        proj.nuvemId = r.conteudo.id; await publicar({ ...meta, capa });
        const link = new URL('jogar.html?nuvem=' + encodeURIComponent(proj.nuvemId), location.href).href;
        $('#pb-res').innerHTML = `<div style="color:var(--verde);font-weight:600;margin-bottom:8px">✓ No ar para todo mundo! Ele aparece em “Jogos de Players → 🌍 Online” na plataforma, com o seu nome ✓.</div>
          <div class="campo"><span>Link para qualquer pessoa jogar</span><div class="caixa-link"><input readonly value="${esc(link)}"><button class="btn" id="pb-copiar">Copiar</button></div></div>
          <a class="btn" style="display:inline-flex;align-items:center;text-decoration:none" href="../index.html#players" target="_blank">Ver na plataforma</a>`;
        $('#pb-copiar').onclick = async () => { try { await navigator.clipboard.writeText(link); toast('🔗 Link copiado'); } catch (e) {} };
        saida('ok', `🌍 Publicado para todo mundo: ${proj.nome}`);
      } catch (e) { $('#pb-res').innerHTML = `<div style="color:#fca5a5;font-weight:600">⚠ ${esc(e.message)}</div>`; }
      finally { b.disabled = false; b.textContent = txt; }
    };
    $('#pb-ok').onclick = async () => {
      const meta = { nome: $('#pb-nome').value.trim() || proj.nome, genero: $('#pb-gen').value, subgenero: $('#pb-sub').value.trim(), autor: $('#pb-autor').value.trim() || 'Anônimo', descricao: $('#pb-desc').value.trim() };
      localStorage.setItem('studio.autor', meta.autor);
      const r = await publicar({ ...meta, capa });
      $('#pb-res').innerHTML = `<div style="color:var(--verde);font-weight:600;margin-bottom:8px">✓ Publicado! Ele já aparece em “Jogos de Players” na plataforma (neste navegador).</div>
        <div class="campo"><span>Link para qualquer pessoa jogar (o jogo vai dentro do link)</span><div class="caixa-link"><input readonly value="${esc(r.link)}"><button class="btn" id="pb-copiar">Copiar</button></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" style="display:inline-flex;align-items:center;text-decoration:none" href="../index.html#players" target="_blank">Ver na plataforma</a><button class="btn" id="pb-baixar">Baixar arquivo .arcadia.json</button></div>
        <p style="color:var(--fraco);font-size:12.5px;line-height:1.6">Para o jogo aparecer para <b>todo mundo</b> na aba Comunidade, envie o arquivo .arcadia.json para a pasta <code>comunidade/</code> do repositório da plataforma no GitHub (ou peça para a IA fazer isso pelo MCP).</p>`;
      $('#pb-copiar').onclick = async () => { try { await navigator.clipboard.writeText(r.link); toast('🔗 Link copiado'); } catch (e) {} };
      $('#pb-baixar').onclick = exportarArquivo;
    };
  }
  async function publicar(meta) {
    Object.assign(proj, { nome: meta.nome || proj.nome, genero: meta.genero || proj.genero || 'Outro', subgenero: meta.subgenero || '', descricao: meta.descricao || '', autor: meta.autor || proj.autor || 'Anônimo' });
    $('#nome-proj').value = proj.nome; await salvar();
    const capa = meta.capa ?? (ehCena() ? captura() : '');
    const registro = { id: 'pub-' + proj.id, nuvemId: proj.nuvemId || '', nome: proj.nome, autor: proj.autor, genero: proj.genero, subgenero: proj.subgenero, descricao: proj.descricao, capa, tipo: proj.tipo, publicadoEm: Date.now(), projeto: JSON.parse(JSON.stringify({ ...proj, pasta: undefined, capa: '' })) };
    await N.salvarDb('publicados', registro);
    const link = await gerarLink();
    saida('ok', `🚀 Publicado: ${proj.nome}`);
    return { id: registro.id, link };
  }

  /* ===================== Marketplace ===================== */
  async function publicarItem() {
    const r = noSel(); if (!r || !ehCena()) return; const C = Conta();
    if (!C || !C.logado()) { toast('🛒 Entre numa conta para publicar no Marketplace'); if (C) C.abrir('entrar'); return; }
    const nome = prompt('Nome do item no Marketplace:', r.no.Name); if (!nome) return;
    const descricao = prompt('Descrição (opcional): para que serve, como usar…', '') || '';
    focar(); await new Promise(ok => setTimeout(ok, 350));
    try {
      await C.api('publicarConteudo', { tipo: 'item', nome, descricao, genero: r.no.ClassName, capa: await miniCapa(captura()), dados: JSON.stringify(N.copia(r.no)) });
      toast('✓ Publicado no Marketplace'); saida('ok', `🛒 Item publicado no Marketplace: ${nome}`);
    } catch (e) { toast('⚠ ' + e.message); }
  }
  async function usarDoMarketplace(tipo, id) {
    const C = Conta(), j = await C.api('baixarConteudo', { id, contar: true }), dados = JSON.parse(j.dados);
    if (tipo === 'item') {
      if (!ehCena()) throw new Error('Abra um jogo 3D para inserir itens.');
      const no = N.reidentificar(dados), pai = servico('Workspace'); pai.children.push(no);
      sel = [no.id]; registrar(); reconstruirCena(); aoSelecionar(true); focar(); saida('ok', `🛒 Inserido do Marketplace: ${j.conteudo.nome} (por ${j.conteudo.autor})`);
      return `✓ “${j.conteudo.nome}” inserido na cena`;
    }
    if (tipo === 'personagem') { N.avatar.salvar(Object.assign(dados, { marketId: undefined })); if (C.logado()) C.api('salvarNuvem', { chave: 'avatar', valor: JSON.stringify(N.avatar.lerSalvo()) }).catch(() => {}); return `✓ Você está vestindo “${j.conteudo.nome}”. Aperte Jogar para ver.`; }
    if (tipo === 'animacao') {
      if (!N.avatar.validaAnim(dados)) throw new Error('Animação inválida.');
      const av = N.avatar.lerSalvo() || N.avatar.normalizar(null); av.custom['m' + id] = dados; N.avatar.salvar(av);
      return `✓ Animação guardada. Escolha ela em 🧍 Meu personagem → Animações.`;
    }
  }
  async function telaMarketplace(tipo = 'item') {
    const C = Conta();
    modal(`<div class="m-cab"><h2>🛒 Marketplace</h2><button data-fechar>✕</button></div><div class="m-corpo">
      <div class="mk-abas">${[['item', '🧩 Itens'], ['personagem', '🧍 Personagens'], ['animacao', '💃 Animações']].map(([k, t]) => `<button class="btn ${k === tipo ? 'on' : ''}" data-mk="${k}">${t}</button>`).join('')}<span style="flex:1"></span><button class="btn" data-mkmeu>🧍 Meu personagem</button></div>
      <p style="color:var(--fraco);font-size:12.5px;margin:0 0 10px">${tipo === 'item' ? 'Modelos prontos feitos pela comunidade. Para publicar um seu: ' + (TOQUE ? 'segure o dedo' : 'botão direito') + ' num modelo do Explorer (ou na cena) → <b>Publicar no Marketplace</b>.' : tipo === 'personagem' ? 'Personagens da comunidade: vista um e ele aparece nos jogos.' : 'Animações da comunidade: pegue e escolha em Meu personagem → Animações.'}</p>
      <div id="mk-lista" class="mk-grade"><div style="color:var(--fraco2)">Carregando…</div></div><div id="mk-msg" style="margin-top:10px;font-weight:600"></div></div>`);
    const cx = $('#modal-caixa');
    cx.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => telaMarketplace(b.dataset.mk));
    cx.querySelector('[data-mkmeu]').onclick = () => { fecharModal(); acao('personagem'); };
    const lista = $('#mk-lista');
    if (!C || !C.servidorLigado()) { lista.innerHTML = '<div style="color:var(--fraco2)">O Marketplace precisa do servidor de contas.</div>'; return; }
    try {
      const r = await C.api('listarConteudo', { tipo }), itens = r.conteudos || [];
      const verbo = { item: 'Inserir na cena', personagem: 'Vestir', animacao: 'Pegar' }[tipo];
      lista.innerHTML = itens.length ? itens.map(i => `<div class="mk-card"><div class="cp">${i.capa ? `<img src="${esc(i.capa)}" alt="">` : { item: '🧩', personagem: '🧍', animacao: '💃' }[tipo]}</div>
        <div class="tx"><b>${esc(i.nome)}</b>por ${esc(i.autor)} <span style="color:#22d3ee">✓</span> · ❤ ${i.curtidas} · ${i.jogadas} usos${i.descricao ? `<br>${esc(i.descricao).slice(0, 90)}` : ''}</div>
        <div class="ac"><button class="btn" data-usar="${esc(i.id)}" ${tipo === 'item' && !ehCena() ? 'disabled title="Abra um jogo 3D"' : ''}>${verbo}</button></div></div>`).join('')
        : `<div style="color:var(--fraco2)">Nada aqui ainda. Seja o primeiro a publicar!</div>`;
      lista.querySelectorAll('[data-usar]').forEach(b => b.onclick = async () => {
        b.disabled = true; const m = $('#mk-msg');
        try { m.style.color = 'var(--verde)'; m.textContent = await usarDoMarketplace(tipo, b.dataset.usar); if (tipo === 'item') setTimeout(fecharModal, 700); }
        catch (e) { m.style.color = '#fca5a5'; m.textContent = '⚠ ' + e.message; b.disabled = false; }
      });
    } catch (e) { lista.innerHTML = `<div style="color:#fca5a5">${esc(e.message)}</div>`; }
  }

  /* ===================== Telas: início, docs, atalhos ===================== */
  const MODELOS_CENA = [
    { k: 'baseplate', i: '🟩', t: 'Baseplate', d: 'Chão e um spawn' },
    { k: 'obby', i: '🧗', t: 'Obby', d: 'Percurso com lava, checkpoints e moedas' },
    { k: 'vazio', i: '⬛', t: 'Vazio', d: 'Nada além do céu' },
  ];
  async function telaInicial() {
    const lista = (await N.listarDb('projetos').catch(() => [])).sort((a, b) => b.atualizado - a.atualizado);
    modal(`<div class="m-cab"><h2>🎮 Arcádia Studio</h2>${proj ? '<button data-fechar>✕</button>' : ''}</div><div class="m-corpo">
      <div class="m-sec">Novo jogo 3D (estilo estúdio, com scripts em Lua ou JavaScript)</div>
      <div class="modelos">${MODELOS_CENA.map(m => `<button class="modelo" data-novo-cena="${m.k}"><span>${m.i}</span><b>${m.t}</b><small>${m.d}</small></button>`).join('')}</div>
      <div class="m-sec">Novo projeto de arquivos (HTML, JavaScript, TypeScript, Python, Lua…)</div>
      <div class="modelos">${Object.entries(MODELOS_ARQ).map(([k, m]) => `<button class="modelo" data-novo-arq="${k}"><span>${m.i}</span><b>${m.t}</b><small>${m.d}</small></button>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px"><button class="btn" data-ac="abrirPasta">🗂️ Abrir pasta do computador</button><button class="btn" data-ac="importar">📥 Importar .zip / .arcadia.json</button><button class="btn" data-ac="docs">📘 Documentação</button></div>
      <div class="m-sec">Seus projetos</div>
      <div class="recentes">${lista.length ? lista.map(p => `<div class="recente" data-abrir="${p.id}" role="button"><span>${p.tipo === 'cena' ? '🌐' : '📦'}</span><span class="nm">${esc(p.nome)}</span>${p.pasta ? '<span style="color:var(--fraco2);font-size:12px">pasta do PC</span>' : ''}<span class="dt">${new Date(p.atualizado).toLocaleString('pt-BR')}</span><button data-apagar="${p.id}" title="Apagar">🗑️</button></div>`).join('') : '<div style="color:var(--fraco2)">Nenhum projeto ainda.</div>'}</div>
    </div>`);
    const caixa = $('#modal-caixa');
    const C = Conta();
    if (C && C.logado()) {
      const rec = caixa.querySelector('.recentes'), div = document.createElement('div'); div.id = 'recentes-nuvem'; rec.after(div);
      C.api('listarNuvem').then(r => {
        const locais = new Set(lista.map(p => 'studio.' + p.id));
        const so = r.dados.filter(d => d.chave.startsWith('studio.') && !locais.has(d.chave));
        if (!so.length || !document.body.contains(div)) return;
        div.innerHTML = `<div class="m-sec" style="margin-top:14px">☁️ Na sua conta (de outros aparelhos)</div><div class="recentes">${so.map(d => `<div class="recente" data-nuvem="${esc(d.chave)}" role="button"><span>☁️</span><span class="nm">${esc(d.chave.slice(7))}</span><span class="dt">${new Date(d.atualizadoEm).toLocaleString('pt-BR')}</span></div>`).join('')}</div>`;
        div.querySelectorAll('[data-nuvem]').forEach(el => C.api('lerNuvem', { chave: el.dataset.nuvem }).then(x => { try { const p = JSON.parse(x.valor); el.querySelector('.nm').textContent = p.nome; el._p = p; } catch (e) {} }).catch(() => {}));
      }).catch(() => {});
    }
    caixa.onclick = async e => {
      const nv = e.target.closest('[data-nuvem]');
      if (nv) { let p = nv._p; if (!p) { try { p = JSON.parse((await C.api('lerNuvem', { chave: nv.dataset.nuvem })).valor); } catch (er) { return toast('Não deu para baixar: ' + er.message); } } await N.salvarDb('projetos', p); abrirProjeto(p); return; }
      const b = e.target.closest('button,[data-abrir]'); if (!b) return;
      if (b.dataset.apagar) { e.stopPropagation(); if (confirm('Apagar este projeto para sempre?')) { await N.apagarDb('projetos', b.dataset.apagar); telaInicial(); } return; }
      if (b.dataset.novoCena) { const m = MODELOS_CENA.find(x => x.k === b.dataset.novoCena); criarProjeto('cena', m.k === 'obby' ? 'Meu Obby' : 'Meu jogo 3D', m.k); }
      if (b.dataset.novoArq) criarProjeto('arquivos', MODELOS_ARQ[b.dataset.novoArq].t, b.dataset.novoArq);
      if (b.dataset.abrir) { const p = await N.lerDb('projetos', b.dataset.abrir); if (p) abrirProjeto(p); }
      if (b.dataset.ac) { if (b.dataset.ac !== 'docs') fecharModal(); acao(b.dataset.ac); }
    };
  }
  function telaDocs() { modal(`<div class="m-cab"><h2>📘 Documentação</h2><button data-fechar>✕</button></div><div class="m-corpo doc">${DOCS_HTML}</div>`); }
  function telaAtalhos() {
    const at = [['Ctrl+S', 'Salvar'], ['Ctrl+Z / Ctrl+Y', 'Desfazer / refazer'], ['F5', 'Jogar / executar'], ['Shift+F5', 'Parar'], ['1 2 3 4', 'Selecionar, mover, escalar, girar'], ['Ctrl+D', 'Duplicar'], ['Ctrl+C / Ctrl+V / Ctrl+X', 'Copiar, colar, recortar'], ['Ctrl+G / Ctrl+U', 'Agrupar / desagrupar'], ['Delete', 'Excluir'], ['F', 'Focar a câmera na seleção'], ['F2', 'Renomear'], ['Botão direito + arrastar', 'Olhar em volta'], ['W A S D + Q E', 'Voar com a câmera'], ['Shift', 'Voar mais rápido'], ['Roda do mouse', 'Aproximar / afastar'], ['Botão do meio + arrastar', 'Deslizar a câmera'], ['Alt + clique', 'Selecionar uma parte dentro de um modelo']];
    modal(`<div class="m-cab"><h2>⌨️ Atalhos</h2><button data-fechar>✕</button></div><div class="m-corpo"><table style="width:100%;border-collapse:collapse">${at.map(([k, d]) => `<tr><td style="padding:6px 0;width:220px"><code style="background:#14161c;border:1px solid var(--linha);border-radius:5px;padding:2px 6px">${k}</code></td><td>${d}</td></tr>`).join('')}</table></div>`);
  }

  /* ===================== Caixa de ferramentas ===================== */
  function renderCaixa() {
    const f = ($('#busca-cx').value || '').toLowerCase();
    const cats = ehCena() ? CAIXA : [{ cat: 'Começar de um modelo', itens: Object.entries(MODELOS_ARQ).map(([k, m]) => ({ k: 'arq:' + k, i: m.i, t: m.t })) }, { cat: 'Adicionar arquivo', itens: [{ k: 'novo:html', i: '🌐', t: 'HTML' }, { k: 'novo:css', i: '🎨', t: 'CSS' }, { k: 'novo:js', i: '📜', t: 'JavaScript' }, { k: 'novo:ts', i: '🔷', t: 'TypeScript' }, { k: 'novo:py', i: '🐍', t: 'Python' }, { k: 'novo:lua', i: '🌙', t: 'Lua' }, { k: 'novo:json', i: '🧾', t: 'JSON' }, { k: 'enviar', i: '⬆️', t: 'Enviar do PC' }] }];
    $('#caixa').innerHTML = (ehCena() && !f ? '<button class="cx-market" data-cx="marketplace"><span>🛒</span><div><b>Marketplace</b><small>Modelos prontos feitos por outras pessoas</small></div></button>' : '') + cats.map(c => { const it = c.itens.filter(i => !f || i.t.toLowerCase().includes(f)); return it.length ? `<div class="cx-cat">${esc(c.cat)}</div><div class="cx-grade">${it.map(i => `<button class="cx-item" data-cx="${i.k}" draggable="${ehCena() && !/^(script|ui|svc)/.test(i.k)}" title="${esc(i.d || i.t)}"><span>${i.i}</span>${esc(i.t)}</button>`).join('')}</div>` : ''; }).join('');
  }
  $('#busca-cx').addEventListener('input', renderCaixa);
  $('#caixa').addEventListener('click', e => {
    const b = e.target.closest('[data-cx]'); if (!b) return; const k = b.dataset.cx;
    if (k.startsWith('arq:')) return criarProjeto('arquivos', MODELOS_ARQ[k.slice(4)].t, k.slice(4));
    if (k.startsWith('novo:')) { const ext = k.slice(5); const nome = prompt('Nome do arquivo:', (ext === 'py' || ext === 'lua' ? 'main.' : ext === 'html' ? 'pagina.' : 'novo.') + ext); if (nome) { const c = (pastaAtual() ? pastaAtual() + '/' : '') + nome; proj.arquivos[c] = { conteudo: MODELO_POR_EXT[ext] || '' }; registrar(); renderArvore(); abrirArquivo(c); } return; }
    if (k === 'enviar') return $('#in-arquivos').click();
    if (k === 'marketplace') return acao('marketplace');
    inserirModelo(k); fecharGavetas();
  });
  $('#caixa').addEventListener('dragstart', e => { const b = e.target.closest('[data-cx]'); if (b) e.dataTransfer.setData('text/arcadia-modelo', b.dataset.cx); });
  function inserirModelo(k, ponto) {
    if (!ehCena()) return;
    const item = CAIXA.flatMap(c => c.itens).find(i => i.k === k); if (!item) throw new Error('Modelo não encontrado: ' + k);
    if (item.f) return item.f();
    const res = item.criar();
    const nos = Array.isArray(res) ? res : [res];
    for (const no of nos) {
      const destino = no.__destino ? servico(no.__destino) : servico('Workspace'); delete no.__destino;
      if (destino.ClassName === 'Workspace') { const b = caixaDe([no]); const p = ponto || pontoDeInsercao(); if (b) moverNo(no, [Math.round(p[0] - b.centro[0]), r3(p[1] - b.min[1]), Math.round(p[2] - b.centro[2])]); }
      destino.children.push(no); expandidos.add(destino.id);
    }
    sel = [nos[0].id]; registrar(); reconstruirCena(); aoSelecionar(true); toast(`${item.i} ${item.t} adicionado`);
    return nos[0];
  }

  /* ===================== Barra de comando ===================== */
  const histCmd = []; let posCmd = 0;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  $('#cmd').addEventListener('keydown', async e => {
    if (e.key === 'ArrowUp') { posCmd = Math.max(0, posCmd - 1); e.target.value = histCmd[posCmd] || ''; return; }
    if (e.key === 'ArrowDown') { posCmd = Math.min(histCmd.length, posCmd + 1); e.target.value = histCmd[posCmd] || ''; return; }
    if (e.key !== 'Enter') return;
    const cod = e.target.value.trim(); if (!cod) return; histCmd.push(cod); posCmd = histCmd.length; e.target.value = '';
    saida('info', '> ' + cod);
    try { const r = await executarCodigo(cod); if (r !== undefined) saida('ok', typeof r === 'object' ? JSON.stringify(r) : String(r)); } catch (er) { saida('error', er.message || String(er)); }
  });
  async function executarCodigo(cod) {
    const print = (...a) => saida('', a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
    const corpo = /^\s*(const|let|var|for|if|while|await|return|studio\.|\{)/.test(cod) || cod.includes(';') || cod.includes('\n') ? cod : 'return (' + cod + ')';
    return await new AsyncFunction('studio', 'print', 'ASN', corpo)(window.studio, print, N);
  }
  $('#limpar-saida').addEventListener('click', () => acao('limparSaida'));

  /* ===================== Atalhos de teclado ===================== */
  addEventListener('keydown', e => {
    const emTexto = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.closest('.CodeMirror');
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); acao('salvar'); return; }
    if (e.key === 'F5') { e.preventDefault(); e.shiftKey ? (ehCena() ? pararJogo() : acao('pararPrevia')) : (ehCena() ? jogar() : acao('executar')); return; }
    if (emTexto || !proj) return;
    if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); desfazer(); return; }
    if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); refazer(); return; }
    if (!ehCena()) { if (e.key === 'Delete') excluirArquivoSel(); return; }
    if (jogando) return;
    if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicar(); return; }
    if (ctrl && e.key.toLowerCase() === 'c') { copiar(); return; }
    if (ctrl && e.key.toLowerCase() === 'v') { colar(); return; }
    if (ctrl && e.key.toLowerCase() === 'x') { recortar(); return; }
    if (ctrl && e.key.toLowerCase() === 'g') { e.preventDefault(); agrupar(); return; }
    if (ctrl && e.key.toLowerCase() === 'u') { e.preventDefault(); desagrupar(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { excluirSel(); return; }
    if (cam.rmb || ctrl) return;
    if (document.activeElement === renderer?.domElement && /^Key[WASDQE]$/.test(e.code)) return;
    if (e.key === 'f' || e.key === 'F') { focar(); return; }
    const t = { 1: 'selecionar', 2: 'mover', 3: 'escala', 4: 'girar' }[e.key]; if (t) { ferramenta = t; atualizarGizmo(); renderFaixa(); }
  });
  $('#nome-proj').addEventListener('change', e => { if (proj && e.target.value.trim()) { proj.nome = e.target.value.trim(); marcarSujo(); if (!ehCena()) renderArvore(); } });
  $('#btn-publicar').addEventListener('click', telaPublicar);

  /* ===================== API do Studio (MCP e barra de comando) ===================== */
  function resumo(n, prof = 3) {
    const o = { id: n.id, classe: n.ClassName, nome: n.Name };
    const p = n.props;
    if (N.EH_PARTE(n.ClassName)) Object.assign(o, { Position: p.Position, Size: p.Size, Color: p.Color, Material: p.Material, Shape: p.Shape, Anchored: p.Anchored, ...(p.Transparency ? { Transparency: p.Transparency } : {}), ...(p.CanCollide === false ? { CanCollide: false } : {}) });
    if (n.ClassName === 'Script') Object.assign(o, { Language: p.Language, linhas: (p.Source || '').split('\n').length });
    if ('Text' in p) o.Text = p.Text;
    if ('Value' in p) o.Value = p.Value;
    if (n.children.length) o.filhos = prof > 0 ? n.children.map(c => resumo(c, prof - 1)) : `${n.children.length} filho(s)`;
    return o;
  }
  function exigirCena() { if (!proj) throw new Error('Nenhum projeto aberto. Use criar_projeto ou abrir_projeto.'); if (!ehCena()) throw new Error('O projeto aberto é de arquivos. Use as ferramentas de arquivos (escrever_arquivo, ler_arquivo…).'); }
  function exigirArquivos() { if (!proj) throw new Error('Nenhum projeto aberto.'); if (ehCena()) throw new Error('O projeto aberto é um jogo 3D (cena). Use as ferramentas de objetos (criar_objeto, editar_objeto…).'); }
  function normalizarProps(classe, props = {}) {
    const def = (N.CLASSES[classe] || { props: {} }).props, out = {};
    for (const [k0, v0] of Object.entries(props || {})) {
      let k = k0 === 'Rotation' ? 'Orientation' : k0 === 'Code' || k0 === 'Codigo' ? 'Source' : k0, v = v0;
      if (v && typeof v === 'object' && !Array.isArray(v)) { if ('X' in v || 'x' in v) v = [v.X ?? v.x, v.Y ?? v.y, v.Z ?? v.z].filter(x => x !== undefined); else if ('R' in v) v = N.rgbParaHex(v.R * 255, v.G * 255, v.B * 255); }
      if (Array.isArray(v) && /Color/.test(k) && v.length === 3) v = N.rgbParaHex(...v.map(x => x <= 1 ? x * 255 : x));
      if (!(k in def) && k !== 'Source') throw new Error(`Propriedade "${k0}" não existe em ${classe}. Válidas: ${Object.keys(def).join(', ')}`);
      out[k] = v;
    }
    return out;
  }
  const studio = window.studio = {
    estado: () => ({ projeto: proj ? { id: proj.id, nome: proj.nome, tipo: proj.tipo, objetos: ehCena() ? (() => { let n = 0; N.percorrer(proj.cena, () => n++); return n; })() : undefined, arquivos: !ehCena() && proj ? Object.keys(proj.arquivos).length : undefined } : null, selecionado: sel, jogando: !!jogando, conectadoMcp: mcp.estado === 'ok' }),
    listarProjetos: async () => (await N.listarDb('projetos')).sort((a, b) => b.atualizado - a.atualizado).map(p => ({ id: p.id, nome: p.nome, tipo: p.tipo, atualizado: new Date(p.atualizado).toISOString() })),
    criarProjeto: async ({ nome, tipo = 'cena', modelo } = {}) => { const p = await criarProjeto(tipo === 'arquivos' ? 'arquivos' : 'cena', nome, modelo || (tipo === 'arquivos' ? 'vazio' : 'baseplate')); return { id: p.id, nome: p.nome, tipo: p.tipo }; },
    abrirProjeto: async ({ id }) => { const p = await N.lerDb('projetos', id); if (!p) throw new Error('Projeto não encontrado: ' + id); await abrirProjeto(p); return { id: p.id, nome: p.nome, tipo: p.tipo }; },
    salvar: async () => { await salvar(); return 'salvo'; },
    arvore: ({ raiz, profundidade = 4 } = {}) => { exigirCena(); const n = raiz ? resolver(raiz) : null; if (raiz && !n) throw new Error('Objeto não encontrado: ' + raiz); return n ? resumo(n.no, profundidade) : proj.cena.children.map(s => resumo(s, profundidade)); },
    ler: ({ id }) => { exigirCena(); const r = resolver(id); if (!r) throw new Error('Objeto não encontrado: ' + id); return { id: r.no.id, classe: r.no.ClassName, nome: r.no.Name, caminho: N.caminhoDe(proj.cena, r.no.id), propriedades: r.no.props, filhos: r.no.children.map(c => ({ id: c.id, classe: c.ClassName, nome: c.Name })) }; },
    criar: ({ classe, pai, nome, propriedades } = {}) => {
      exigirCena(); if (!N.CLASSES[classe] || N.CLASSES[classe].servico || ['DataModel', 'Player', 'PlayerGui', 'Humanoid'].includes(classe)) throw new Error(`Classe inválida: ${classe}. Use: ${Object.keys(N.CLASSES).filter(c => !N.CLASSES[c].servico && !['DataModel', 'Player', 'PlayerGui', 'Humanoid'].includes(c)).join(', ')}`);
      const paiR = pai ? resolver(pai) : null; if (pai && !paiR) throw new Error('Pai não encontrado: ' + pai);
      const paiNo = paiR ? paiR.no : paiPadrao(classe);
      if (!N.PODE_TER_FILHOS(paiNo.ClassName)) throw new Error(`${paiNo.ClassName} não pode ter filhos`);
      const no = N.criar(classe, normalizarProps(classe, propriedades), nome || (propriedades && propriedades.Name) || classe);
      paiNo.children.push(no); expandidos.add(paiNo.id); registrar(); reconstruirCena(); renderArvore();
      return { id: no.id, caminho: N.caminhoDe(proj.cena, no.id) };
    },
    criarVarios: ({ objetos = [] } = {}) => {
      // cria uma árvore inteira de uma vez: [{classe, nome, pai, propriedades, filhos:[…]}]
      exigirCena(); const criados = [];
      const montar = (o, paiNo) => { const no = N.criar(o.classe, normalizarProps(o.classe, o.propriedades), o.nome || o.classe); paiNo.children.push(no); criados.push({ id: no.id, nome: no.Name }); for (const f of o.filhos || []) montar(f, no); return no; };
      for (const o of objetos) { const paiR = o.pai ? resolver(o.pai) : null; if (o.pai && !paiR) throw new Error('Pai não encontrado: ' + o.pai); if (!N.CLASSES[o.classe]) throw new Error('Classe inválida: ' + o.classe); montar(o, paiR ? paiR.no : paiPadrao(o.classe)); }
      registrar(); reconstruirCena(); renderArvore(); return criados;
    },
    editar: ({ id, propriedades, nome, pai } = {}) => {
      exigirCena(); const r = resolver(id); if (!r) throw new Error('Objeto não encontrado: ' + id);
      if (propriedades) { const p = normalizarProps(r.no.ClassName, propriedades); Object.assign(r.no.props, p); }
      if (nome) r.no.Name = String(nome);
      if (pai) { const alvo = resolver(pai); if (!alvo) throw new Error('Pai não encontrado: ' + pai); r.pai.children = r.pai.children.filter(c => c !== r.no); alvo.no.children.push(r.no); }
      const ed = editores.get('s:' + r.no.id); if (ed && propriedades && ('Source' in propriedades || 'Codigo' in propriedades || 'Code' in propriedades)) ed.setValue(r.no.props.Source);
      registrar(); reconstruirCena(); renderArvore(); renderProps(); return { id: r.no.id, caminho: N.caminhoDe(proj.cena, r.no.id) };
    },
    apagar: ({ id }) => { exigirCena(); const r = resolver(id); if (!r || !r.pai) throw new Error('Objeto não encontrado: ' + id); if ((N.CLASSES[r.no.ClassName] || {}).servico) throw new Error('Serviços não podem ser apagados'); r.pai.children = r.pai.children.filter(c => c !== r.no); fecharAbasDe(r.no); sel = sel.filter(x => acharNo(x)); registrar(); reconstruirCena(); aoSelecionar(); return 'apagado'; },
    criarScript: ({ pai, nome, linguagem = 'Lua', codigo = '' } = {}) => { exigirCena(); const r = studio.criar({ classe: 'Script', pai, nome: nome || 'Script', propriedades: { Language: /^j/i.test(linguagem) ? 'JavaScript' : 'Lua', Source: codigo } }); return r; },
    lerScript: ({ id }) => { exigirCena(); const r = resolver(id); if (!r || r.no.ClassName !== 'Script') throw new Error('Script não encontrado: ' + id); const ed = editores.get('s:' + r.no.id); return { linguagem: r.no.props.Language, codigo: ed ? ed.getValue() : r.no.props.Source }; },
    inserirModelo: ({ nome, posicao } = {}) => { exigirCena(); const it = CAIXA.flatMap(c => c.itens).find(i => i.k === nome || i.t.toLowerCase() === String(nome).toLowerCase()); if (!it) throw new Error('Modelo não existe. Opções: ' + CAIXA.flatMap(c => c.itens).map(i => i.k).join(', ')); const no = inserirModelo(it.k, posicao); return no ? { id: no.id, nome: no.Name } : 'ok'; },
    modelos: () => CAIXA.map(c => ({ categoria: c.cat, itens: c.itens.map(i => ({ nome: i.k, titulo: i.t })) })),
    selecionar: ({ id }) => { const r = resolver(id); sel = r ? [r.no.id] : []; aoSelecionar(true); return sel; },
    arquivos: () => { exigirArquivos(); return { entrada: proj.entrada, arquivos: Object.entries(proj.arquivos).map(([c, a]) => ({ caminho: c, binario: !!a.b64, tamanho: (a.conteudo || '').length })), pastas: proj.pastas || [] }; },
    lerArquivo: ({ caminho }) => { exigirArquivos(); const a = proj.arquivos[caminho]; if (!a) throw new Error('Arquivo não existe: ' + caminho); const ed = editores.get('f:' + caminho); return { caminho, binario: !!a.b64, conteudo: ed && ed.getValue ? ed.getValue() : a.conteudo }; },
    escreverArquivo: ({ caminho, conteudo = '', base64 = false } = {}) => {
      exigirArquivos(); caminho = String(caminho).replace(/^\/+/, ''); if (!caminho) throw new Error('caminho vazio');
      proj.arquivos[caminho] = base64 ? { conteudo, b64: true } : { conteudo: String(conteudo) };
      const ed = editores.get('f:' + caminho); if (ed && ed.setValue && ed.getValue() !== conteudo) ed.setValue(conteudo);
      if (!proj.entrada || !proj.arquivos[proj.entrada]) { if (/\.html?$/.test(caminho)) proj.entrada = caminho; }
      registrar(); renderArvore(); if (autoRecarregar) executarPrevia(); return { caminho, tamanho: String(conteudo).length };
    },
    apagarArquivo: ({ caminho }) => { exigirArquivos(); if (!proj.arquivos[caminho]) throw new Error('Arquivo não existe: ' + caminho); delete proj.arquivos[caminho]; const aba = abas.find(a => a.id === 'f:' + caminho); if (aba) fecharAba(aba.id); registrar(); renderArvore(); return 'apagado'; },
    definirEntrada: ({ caminho }) => { exigirArquivos(); if (!proj.arquivos[caminho]) throw new Error('Arquivo não existe'); proj.entrada = caminho; registrar(); renderArvore(); return 'ok'; },
    jogar: async () => { if (!proj) throw new Error('Nenhum projeto aberto'); if (ehCena()) jogar(); else { mostrarAba('previa'); await executarPrevia(); } return 'jogando'; },
    parar: () => { if (ehCena()) pararJogo(); else { $('#vista-previa').innerHTML = ''; } return 'parado'; },
    saida: ({ linhas = 60, limpar = false } = {}) => { const r = linhasSaida.slice(-linhas).map(l => `[${l.h}] ${l.nivel ? l.nivel.toUpperCase() + ' ' : ''}${l.texto}`); if (limpar) acao('limparSaida'); return r; },
    captura: async () => {
      if (jogando) { return await new Promise(ok => { esperaCaptura = ok; jogando.contentWindow.postMessage({ tipo: 'captura' }, '*'); setTimeout(() => { if (esperaCaptura) { esperaCaptura = null; ok(captura()); } }, 2500); }); }
      if (!ehCena()) throw new Error('A captura de tela funciona em jogos 3D (cena).');
      return captura();
    },
    camera: ({ posicao, olharPara } = {}) => { if (posicao) cam.pos.set(...posicao); if (olharPara) { const d = new THREE.Vector3(...olharPara).sub(cam.pos); cam.yaw = Math.atan2(-d.x, -d.z); cam.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); } return { posicao: cam.pos.toArray().map(r3) }; },
    publicar: async (meta = {}) => { if (!proj) throw new Error('Nenhum projeto aberto'); return await publicar({ ...meta, autor: meta.autor || localStorage.getItem('studio.autor') || 'IA' }); },
    link: async () => await gerarLink(),
    exportar: () => JSON.parse(JSON.stringify({ ...proj, pasta: undefined })),
    documentacao: () => DOCS_TEXTO,
    desfazer: () => { desfazer(); return 'ok'; },
  };

  /* ===================== Ponte MCP ===================== */
  const mcp = { ativo: false, porta: +(localStorage.getItem('studio.mcpPorta') || 47823), estado: 'off' };
  const FERRAMENTAS = {
    estado_do_studio: () => studio.estado(), listar_projetos: () => studio.listarProjetos(), criar_projeto: a => studio.criarProjeto(a), abrir_projeto: a => studio.abrirProjeto(a), salvar: () => studio.salvar(),
    ver_cena: a => studio.arvore(a), ler_objeto: a => studio.ler(a), criar_objeto: a => studio.criar(a), criar_varios: a => studio.criarVarios(a), editar_objeto: a => studio.editar(a), apagar_objeto: a => studio.apagar(a),
    criar_script: a => studio.criarScript(a), ler_script: a => studio.lerScript(a), inserir_modelo: a => studio.inserirModelo(a), listar_modelos: () => studio.modelos(), selecionar: a => studio.selecionar(a),
    listar_arquivos: () => studio.arquivos(), ler_arquivo: a => studio.lerArquivo(a), escrever_arquivo: a => studio.escreverArquivo(a), apagar_arquivo: a => studio.apagarArquivo(a), definir_entrada: a => studio.definirEntrada(a),
    jogar: () => studio.jogar(), parar: () => studio.parar(), ler_saida: a => studio.saida(a), capturar_tela: () => studio.captura(), posicionar_camera: a => studio.camera(a),
    publicar: a => studio.publicar(a), link_do_jogo: () => studio.link(), executar_no_studio: async a => { const r = await executarCodigo(a.codigo || ''); return r === undefined ? 'ok' : r; }, documentacao: () => studio.documentacao(), desfazer: () => studio.desfazer(),
    exportar: () => studio.exportar(),
  };
  function estadoMcp(e) { mcp.estado = e; const b = $('#btn-mcp'); b.classList.toggle('ok', e === 'ok'); b.classList.toggle('esperando', e === 'esperando'); b.querySelector('span').textContent = e === 'ok' ? 'MCP conectado' : e === 'esperando' ? 'MCP: aguardando servidor…' : 'MCP'; }
  async function loopMcp() {
    if (mcp.rodando) return; mcp.rodando = true;
    mcp.sessao = Math.random().toString(36).slice(2, 10); // nova sessão a cada conexão: assim esta janela passa a ser a ativa
    let primeira = true;
    estadoMcp('esperando');
    while (mcp.ativo) {
      try {
        const r = await fetch(`http://127.0.0.1:${mcp.porta}/aguardar?sessao=${mcp.sessao}${primeira ? '&assumir=1' : ''}`, { cache: 'no-store' });
        primeira = false;
        if (!mcp.ativo) break;
        if (r.status === 409) { mcp.ativo = false; saida('warn', '🤖 Outra janela do Studio assumiu a conexão MCP. Clique em “MCP” para usar esta janela de novo.'); break; }
        if (r.status === 204) { if (mcp.estado !== 'ok') { estadoMcp('ok'); saida('ok', '🤖 Servidor MCP conectado na porta ' + mcp.porta); } continue; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        if (mcp.estado !== 'ok') { estadoMcp('ok'); saida('ok', '🤖 Servidor MCP conectado na porta ' + mcp.porta); }
        const cmd = await r.json(); let resp;
        saida('info', `🤖 ${cmd.ferramenta}(${JSON.stringify(cmd.args || {}).slice(0, 140)})`);
        try { const f = FERRAMENTAS[cmd.ferramenta]; if (!f) throw new Error('Ferramenta desconhecida: ' + cmd.ferramenta); resp = { id: cmd.id, ok: true, resultado: await f(cmd.args || {}) }; }
        catch (e) { resp = { id: cmd.id, ok: false, erro: e.message || String(e) }; saida('error', '🤖 ' + resp.erro); }
        await fetch(`http://127.0.0.1:${mcp.porta}/resposta`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(resp) });
      } catch (e) { if (mcp.estado === 'ok') saida('warn', '🤖 Conexão com o servidor MCP perdida. Tentando de novo…'); estadoMcp('esperando'); await dorme(2500); }
    }
    mcp.rodando = false;
    estadoMcp('off');
  }
  $('#btn-mcp').addEventListener('click', () => {
    if (mcp.ativo) { mcp.ativo = false; estadoMcp('off'); saida('info', '🤖 MCP desconectado'); return; }
    modal(`<div class="m-cab"><h2>🤖 Conectar uma IA (MCP)</h2><button data-fechar>✕</button></div><div class="m-corpo doc">
      <p>Com o MCP, uma IA como o Claude consegue criar e editar jogos <b>aqui dentro do Studio</b>: inserir partes, escrever scripts, testar e publicar.</p>
      <h3>1. Rode o servidor MCP no seu computador</h3>
      <p>Ele está na pasta <code>mcp/</code> do projeto (precisa do Node.js). Adicione no seu cliente de IA, por exemplo no Claude Code:</p>
      <pre>claude mcp add arcadia-studio -- node "CAMINHO/ArcadiaIA/mcp/servidor.js"</pre>
      <p>ou no arquivo de configuração do Claude Desktop:</p>
      <pre>{ "mcpServers": { "arcadia-studio": { "command": "node", "args": ["CAMINHO/ArcadiaIA/mcp/servidor.js"] } } }</pre>
      <h3>2. Conecte este Studio</h3>
      <label class="campo" style="max-width:220px"><span>Porta</span><input id="mcp-porta" type="number" value="${mcp.porta}"></label>
      <button class="btn-pri" id="mcp-conectar" style="height:34px">Conectar</button>
      <p style="color:var(--fraco);font-size:12.5px">Se o navegador perguntar sobre acesso à rede local, permita: o Studio só conversa com o servidor no seu próprio computador (127.0.0.1).</p>
    </div>`);
    $('#mcp-conectar').onclick = () => { mcp.porta = +$('#mcp-porta').value || 47823; localStorage.setItem('studio.mcpPorta', mcp.porta); mcp.ativo = true; fecharModal(); loopMcp(); };
  });

  /* ===================== Modelos (caixa de ferramentas) ===================== */
  const P = (props, nome) => N.criar('Part', props, nome);
  const S = (codigo, nome = 'Script', ling = 'Lua') => N.criar('Script', { Language: ling, Source: codigo }, nome);
  const M = (nome, filhos) => { const m = N.criar('Model', {}, nome); m.children = filhos; return m; };
  const com = (no, ...filhos) => { no.children.push(...filhos); return no; };
  const LUA = {
    girar: `-- gira a parte sem parar\nlocal parte = script.Parent\nwhile parte.Parent do\n  parte.Orientation = parte.Orientation + Vector3.new(0, 3, 0)\n  wait()\nend\n`,
    moeda: `-- moeda: soma 1 em leaderstats.Moedas e some\nlocal moeda = script.Parent\nlocal pega = false\nmoeda.Touched:Connect(function(hit)\n  if pega then return end\n  local jogador = game.Players:GetPlayerFromCharacter(hit.Parent)\n  if not jogador then return end\n  pega = true\n  local stats = jogador:FindFirstChild("leaderstats")\n  if stats and stats:FindFirstChild("Moedas") then\n    stats.Moedas.Value = stats.Moedas.Value + 1\n  end\n  local som = moeda:FindFirstChild("Som")\n  if som then som:Play() end\n  moeda:Destroy()\nend)\nwhile moeda.Parent do\n  moeda.Orientation = moeda.Orientation + Vector3.new(0, 4, 0)\n  wait()\nend\n`,
    placar: `-- cria o placar (leaderstats) de cada jogador\ngame.Players.PlayerAdded:Connect(function(jogador)\n  local stats = Instance.new("Folder")\n  stats.Name = "leaderstats"\n  stats.Parent = jogador\n\n  local moedas = Instance.new("IntValue")\n  moedas.Name = "Moedas"\n  moedas.Parent = stats\nend)\n`,
    lava: `-- quem encostar perde toda a vida\nscript.Parent.Touched:Connect(function(hit)\n  local humanoide = hit.Parent:FindFirstChild("Humanoid")\n  if humanoide then\n    humanoide.Health = 0\n  end\nend)\n`,
    trampolim: `-- joga o jogador para cima\nlocal debounce = false\nscript.Parent.Touched:Connect(function(hit)\n  local raiz = hit.Parent:FindFirstChild("HumanoidRootPart")\n  if raiz and not debounce then\n    debounce = true\n    raiz.Velocity = Vector3.new(0, 140, 0)\n    wait(0.3)\n    debounce = false\n  end\nend)\n`,
    checkpoint: `-- salva o ponto de renascimento\nlocal cp = script.Parent\ncp.Touched:Connect(function(hit)\n  local jogador = game.Players:GetPlayerFromCharacter(hit.Parent)\n  if jogador and jogador.RespawnLocation ~= cp then\n    jogador.RespawnLocation = cp\n    cp.Color = Color3.fromRGB(80, 220, 120)\n    print(jogador.Name .. " salvou o checkpoint " .. cp.Name)\n  end\nend)\n`,
    movel: `-- vai e volta para sempre\nlocal TweenService = game:GetService("TweenService")\nlocal p = script.Parent\nlocal info = TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)\nTweenService:Create(p, info, { Position = p.Position + Vector3.new(16, 0, 0) }):Play()\n`,
    some: `-- some quando alguém pisa e volta depois\nlocal p = script.Parent\nlocal ocupado = false\np.Touched:Connect(function(hit)\n  if ocupado or not hit.Parent:FindFirstChild("Humanoid") then return end\n  ocupado = true\n  for i = 1, 10 do\n    p.Transparency = i / 10\n    wait(0.06)\n  end\n  p.CanCollide = false\n  wait(3)\n  p.CanCollide = true\n  p.Transparency = 0\n  ocupado = false\nend)\n`,
    porta: `-- clique no botão para abrir e fechar a porta\nlocal TweenService = game:GetService("TweenService")\nlocal modelo = script.Parent\nlocal porta = modelo.Porta\nlocal botao = modelo.Botao\nlocal fechada = porta.Position\nlocal aberta = fechada + Vector3.new(0, 9, 0)\nlocal aberto = false\nbotao.ClickDetector.MouseClick:Connect(function(jogador)\n  aberto = not aberto\n  botao.Color = aberto and Color3.fromRGB(80, 220, 120) or Color3.fromRGB(230, 70, 60)\n  TweenService:Create(porta, TweenInfo.new(0.8), { Position = aberto and aberta or fechada }):Play()\nend)\n`,
    vitoria: `-- mostra "Você venceu!" na tela de quem encostar\nlocal feito = {}\nscript.Parent.Touched:Connect(function(hit)\n  local jogador = game.Players:GetPlayerFromCharacter(hit.Parent)\n  if not jogador or feito[jogador.Name] then return end\n  feito[jogador.Name] = true\n  local tela = Instance.new("ScreenGui")\n  tela.Parent = jogador:FindFirstChild("PlayerGui")\n  local txt = Instance.new("TextLabel")\n  txt.Size = UDim2.new(0, 420, 0, 90)\n  txt.Position = UDim2.new(0.5, 0, 0.4, 0)\n  txt.AnchorPoint = Vector2.new(0.5, 0.5)\n  txt.Text = "🏆 Você venceu!"\n  txt.TextSize = 44\n  txt.BackgroundColor3 = Color3.fromRGB(30, 30, 40)\n  txt.Parent = tela\n  local som = Instance.new("Sound")\n  som.SoundId = "win"\n  som.Parent = script.Parent\n  som:Play()\nend)\n`,
    botaoUI: `-- este script fica dentro do botão\nlocal botao = script.Parent\nlocal cliques = 0\nbotao.MouseButton1Click:Connect(function()\n  cliques = cliques + 1\n  botao.Text = "Cliques: " .. cliques\nend)\n`,
    textoMoedas: `-- mostra as moedas do jogador\nlocal jogador = game.Players.LocalPlayer\nlocal moedas = jogador:WaitForChild("leaderstats"):WaitForChild("Moedas")\nlocal texto = script.Parent\ntexto.Text = "🪙 " .. moedas.Value\nmoedas.Changed:Connect(function(v)\n  texto.Text = "🪙 " .. v\nend)\n`,
    corAleatoria: `-- troca de cor a cada segundo\nwhile true do\n  script.Parent.Color = Color3.fromRGB(math.random(0, 255), math.random(0, 255), math.random(0, 255))\n  wait(1)\nend\n`,
    relogio: `-- ciclo de dia e noite\nlocal luz = game:GetService("Lighting")\nwhile true do\n  luz.ClockTime = (luz.ClockTime + 0.05) % 24\n  wait(0.1)\nend\n`,
  };
  const CAIXA = [
    { cat: 'Partes', itens: [
      { k: 'bloco', i: '🧱', t: 'Bloco', f: () => inserirParte('Block') }, { k: 'esfera', i: '⚪', t: 'Esfera', f: () => inserirParte('Ball') }, { k: 'cilindro', i: '🥫', t: 'Cilindro', f: () => inserirParte('Cylinder') },
      { k: 'rampa', i: '📐', t: 'Rampa', f: () => inserirParte('Wedge') }, { k: 'spawn', i: '🏁', t: 'Spawn', f: () => inserirParte('SpawnLocation') },
      { k: 'parede', i: '🧱', t: 'Parede', criar: () => P({ Size: [16, 8, 1], Color: '#c7b299', Material: 'Brick' }, 'Parede') },
    ] },
    { cat: 'Jogabilidade', itens: [
      { k: 'moeda', i: '🪙', t: 'Moeda', d: 'Soma 1 moeda no placar', criar: () => com(P({ Size: [0.4, 2.4, 2.4], Shape: 'Cylinder', Color: '#f5c518', Material: 'Neon', CanCollide: false }, 'Moeda'), S(LUA.moeda, 'Moeda'), N.criar('Sound', { SoundId: 'coin' }, 'Som')) },
      { k: 'placar', i: '🏆', t: 'Placar de moedas', d: 'leaderstats para cada jogador', criar: () => Object.assign(S(LUA.placar, 'Placar'), { __destino: 'ServerScriptService' }) },
      { k: 'lava', i: '🌋', t: 'Bloco de lava', criar: () => com(P({ Size: [8, 1, 8], Color: '#ff4a1c', Material: 'Neon' }, 'Lava'), S(LUA.lava, 'Mata')) },
      { k: 'trampolim', i: '🦘', t: 'Trampolim', criar: () => com(P({ Size: [6, 1, 6], Color: '#ec4899', Material: 'SmoothPlastic' }, 'Trampolim'), S(LUA.trampolim, 'Pulo')) },
      { k: 'checkpoint', i: '🚩', t: 'Checkpoint', criar: () => com(N.criar('SpawnLocation', { Size: [6, 1, 6], Color: '#9ca3af' }, 'Checkpoint'), S(LUA.checkpoint, 'Checkpoint')) },
      { k: 'movel', i: '↔️', t: 'Plataforma móvel', criar: () => com(P({ Size: [8, 1, 8], Color: '#3b82f6' }, 'PlataformaMovel'), S(LUA.movel, 'Mover')) },
      { k: 'some', i: '👻', t: 'Plataforma que some', criar: () => com(P({ Size: [6, 1, 6], Color: '#a78bfa', Material: 'Glass', Transparency: 0 }, 'PlataformaFantasma'), S(LUA.some, 'Some')) },
      { k: 'porta', i: '🚪', t: 'Porta com botão', criar: () => com(M('PortaComBotao', [P({ Position: [0, 4.5, 0], Size: [8, 9, 1], Color: '#7c5c46', Material: 'Wood' }, 'Porta'), com(P({ Position: [6, 3, 0], Size: [1, 1, 1], Color: '#e6463c', Material: 'Neon' }, 'Botao'), N.criar('ClickDetector', {}, 'ClickDetector'))]), S(LUA.porta, 'PortaScript')) },
      { k: 'vitoria', i: '🏆', t: 'Bloco de vitória', criar: () => com(P({ Size: [8, 1, 8], Color: '#facc15', Material: 'Neon' }, 'Vitoria'), S(LUA.vitoria, 'Vitoria'), N.criar('BillboardText', { Text: '🏆 FIM', StudsOffset: [0, 4, 0] }, 'Placa')) },
      { k: 'girando', i: '🌀', t: 'Parte giratória', criar: () => com(P({ Size: [10, 1, 2], Color: '#22d3ee' }, 'Giratoria'), S(LUA.girar, 'Girar')) },
      { k: 'colorida', i: '🌈', t: 'Muda de cor', criar: () => com(P({ Size: [4, 4, 4], Color: '#ff00aa', Material: 'Neon' }, 'Colorida'), S(LUA.corAleatoria, 'Cores')) },
    ] },
    { cat: 'Cenário', itens: [
      { k: 'arvore', i: '🌳', t: 'Árvore', criar: () => M('Arvore', [P({ Position: [0, 4, 0], Size: [1.6, 8, 1.6], Color: '#6b4226', Material: 'Wood' }, 'Tronco'), P({ Position: [0, 10, 0], Size: [8, 8, 8], Shape: 'Ball', Color: '#2f8f3a', Material: 'Grass' }, 'Folhas')]) },
      { k: 'casa', i: '🏠', t: 'Casa', criar: () => M('Casa', [
        P({ Position: [0, 0.25, 0], Size: [16, 0.5, 16], Color: '#a0816c', Material: 'Wood' }, 'Piso'),
        P({ Position: [0, 5, -7.5], Size: [16, 9.5, 1], Color: '#f2e3c6', Material: 'Brick' }, 'ParedeFundo'), P({ Position: [-7.5, 5, 0], Size: [1, 9.5, 14], Color: '#f2e3c6', Material: 'Brick' }, 'ParedeEsquerda'), P({ Position: [7.5, 5, 0], Size: [1, 9.5, 14], Color: '#f2e3c6', Material: 'Brick' }, 'ParedeDireita'),
        P({ Position: [-5, 5, 7.5], Size: [6, 9.5, 1], Color: '#f2e3c6', Material: 'Brick' }, 'FrenteEsq'), P({ Position: [5, 5, 7.5], Size: [6, 9.5, 1], Color: '#f2e3c6', Material: 'Brick' }, 'FrenteDir'), P({ Position: [0, 8, 7.5], Size: [4, 3.5, 1], Color: '#f2e3c6', Material: 'Brick' }, 'SobrePorta'),
        P({ Position: [0, 11.5, -4.25], Size: [17, 3.5, 8.5], Shape: 'Wedge', Color: '#b4442e', Material: 'Slate', Orientation: [0, 180, 0] }, 'TelhadoA'), P({ Position: [0, 11.5, 4.25], Size: [17, 3.5, 8.5], Shape: 'Wedge', Color: '#b4442e', Material: 'Slate' }, 'TelhadoB')]) },
      { k: 'poste', i: '💡', t: 'Poste de luz', criar: () => M('Poste', [P({ Position: [0, 5, 0], Size: [0.6, 10, 0.6], Shape: 'Block', Color: '#3f3f46', Material: 'Metal' }, 'Haste'), com(P({ Position: [0, 10.5, 0], Size: [1.6, 1.6, 1.6], Shape: 'Ball', Color: '#fff3c4', Material: 'Neon' }, 'Lampada'), N.criar('PointLight', { Range: 28, Brightness: 3 }, 'Luz'))]) },
      { k: 'placa', i: '🪧', t: 'Placa com texto', criar: () => com(P({ Size: [6, 3, 0.4], Color: '#7c5c46', Material: 'Wood' }, 'Placa'), N.criar('BillboardText', { Text: 'Bem-vindo!', StudsOffset: [0, 3, 0] }, 'Texto')) },
      { k: 'escada', i: '🪜', t: 'Escada', criar: () => M('Escada', Array.from({ length: 8 }, (_, i) => P({ Position: [0, 0.5 + i, -i * 2], Size: [6, 1, 2], Color: '#9ca3af', Material: 'Concrete' }, 'Degrau' + (i + 1)))) },
      { k: 'pedra', i: '🪨', t: 'Pedra', criar: () => P({ Size: [5, 3.5, 4], Shape: 'Ball', Color: '#78716c', Material: 'Slate' }, 'Pedra') },
      { k: 'agua', i: '🌊', t: 'Água', criar: () => P({ Size: [30, 1, 30], Color: '#2a7fd4', Material: 'Glass', Transparency: 0.4, CanCollide: false }, 'Agua') },
      { k: 'diaNoite', i: '🌗', t: 'Dia e noite', d: 'Script que gira o relógio do céu', criar: () => Object.assign(S(LUA.relogio, 'DiaENoite'), { __destino: 'ServerScriptService' }) },
    ] },
    { cat: 'Interface', itens: [
      { k: 'uiTexto', i: '🔤', t: 'Texto na tela', criar: () => Object.assign(com(N.criar('ScreenGui', {}, 'Tela'), N.criar('TextLabel', { Position: [0.5, 0, 0, 16], AnchorPoint: [0.5, 0], Text: 'Olá!' }, 'Texto')), { __destino: 'StarterGui' }) },
      { k: 'uiMoedas', i: '🪙', t: 'Contador de moedas', criar: () => Object.assign(com(N.criar('ScreenGui', {}, 'TelaMoedas'), com(N.criar('TextLabel', { Position: [0, 16, 0, 16], Size: [0, 160, 0, 46], Text: '🪙 0', TextSize: 26 }, 'Moedas'), S(LUA.textoMoedas, 'Atualiza'))), { __destino: 'StarterGui' }) },
      { k: 'uiBotao', i: '🔘', t: 'Botão com script', criar: () => Object.assign(com(N.criar('ScreenGui', {}, 'TelaBotao'), com(N.criar('TextButton', { Position: [0.5, 0, 1, -24], AnchorPoint: [0.5, 1], Text: 'Clique em mim' }, 'Botao'), S(LUA.botaoUI, 'Clique'))), { __destino: 'StarterGui' }) },
    ] },
    { cat: 'Scripts', itens: [
      { k: 'scriptLua', i: '📜', t: 'Script Lua', f: () => inserirScript('Lua') }, { k: 'scriptJs', i: '📃', t: 'Script JS', f: () => inserirScript('JavaScript') },
    ] },
  ];
  function montarObby(cena) {
    const ws = cena.children.find(c => c.ClassName === 'Workspace'), sss = cena.children.find(c => c.ClassName === 'ServerScriptService'), sg = cena.children.find(c => c.ClassName === 'StarterGui');
    ws.children = ws.children.filter(c => c.Name !== 'Baseplate');
    const pz = (x, y, z, sx, sz, cor = '#e5e7eb', nome = 'Plataforma') => P({ Position: [x, y, z], Size: [sx, 1, sz], Color: cor, Material: 'SmoothPlastic' }, nome);
    ws.children.push(P({ Position: [0, -40, -90], Size: [200, 2, 260], Color: '#ff4a1c', Material: 'Neon' }, 'MarDeLava'));
    ws.children.find(c => c.ClassName === 'SpawnLocation').props.Position = [0, 0.5, 0];
    const fase = M('Fase1', [pz(0, 0, -12, 6, 6), pz(0, 1, -22, 4, 4, '#93c5fd'), pz(5, 2, -31, 4, 4, '#93c5fd'), pz(0, 3, -40, 4, 4, '#93c5fd')]);
    const cp1 = com(N.criar('SpawnLocation', { Position: [0, 4, -50], Size: [6, 1, 6], Color: '#9ca3af' }, 'Checkpoint1'), S(LUA.checkpoint, 'Checkpoint'));
    const lava = com(P({ Position: [0, 4.6, -62], Size: [6, 0.4, 10], Color: '#ff4a1c', Material: 'Neon' }, 'Lava'), S(LUA.lava, 'Mata'));
    const fase2 = M('Fase2', [pz(0, 4, -62, 10, 14, '#e5e7eb', 'ChaoLava'), lava, com(P({ Position: [0, 5, -78], Size: [6, 1, 6], Color: '#3b82f6' }, 'Movel'), S(LUA.movel, 'Mover')), pz(20, 5, -90, 6, 6, '#e5e7eb')]);
    const moedas = M('Moedas', [[0, 3, -22], [0, 5, -40], [20, 8, -90]].map(p => com(P({ Position: p, Size: [0.4, 2.4, 2.4], Shape: 'Cylinder', Color: '#f5c518', Material: 'Neon', CanCollide: false }, 'Moeda'), S(LUA.moeda, 'Moeda'), N.criar('Sound', { SoundId: 'coin' }, 'Som'))));
    const fim = com(P({ Position: [20, 6, -104], Size: [10, 1, 10], Color: '#facc15', Material: 'Neon' }, 'Vitoria'), S(LUA.vitoria, 'Vitoria'), N.criar('BillboardText', { Text: '🏆 FIM', StudsOffset: [0, 4, 0] }, 'Placa'));
    ws.children.push(fase, cp1, fase2, moedas, fim);
    sss.children.push(S(LUA.placar, 'Placar'));
    sg.children.push(com(N.criar('ScreenGui', {}, 'TelaMoedas'), com(N.criar('TextLabel', { Position: [0, 16, 0, 16], Size: [0, 160, 0, 46], Text: '🪙 0', TextSize: 26 }, 'Moedas'), S(LUA.textoMoedas, 'Atualiza'))));
  }

  /* ===================== Modelos de projeto de arquivos ===================== */
  const MODELO_POR_EXT = {
    html: '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>Página</title>\n</head>\n<body>\n  <h1>Olá!</h1>\n</body>\n</html>\n',
    js: '// JavaScript\nconsole.log("Olá do JavaScript!");\n', ts: '// TypeScript\nconst nome: string = "mundo";\nconsole.log(`Olá, ${nome}!`);\n',
    py: '# Python (roda no navegador com Pyodide)\nprint("Olá do Python!")\n', lua: '-- Lua (roda no navegador com Fengari)\nprint("Olá do Lua!")\n', css: 'body {\n  font-family: system-ui, sans-serif;\n}\n', json: '{\n  "nome": "valor"\n}\n', md: '# Título\n\nTexto em **Markdown**.\n',
  };
  const MODELOS_ARQ = {
    canvas: { i: '🕹️', t: 'Jogo em canvas', d: 'HTML + CSS + JavaScript', arquivos: {
      'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Desvie!</title>\n  <link rel="stylesheet" href="estilo.css">\n</head>\n<body>\n  <canvas id="tela" width="480" height="640"></canvas>\n  <p>Use ← → (ou toque nos lados) para desviar dos blocos.</p>\n  <script src="jogo.js"></script>\n</body>\n</html>\n',
      'estilo.css': 'body {\n  margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;\n  background: #0f172a; color: #cbd5e1; font-family: system-ui, sans-serif;\n}\ncanvas { background: #111827; border-radius: 12px; max-width: 95vw; max-height: 80vh; }\n',
      'jogo.js': `const tela = document.getElementById('tela');\nconst ctx = tela.getContext('2d');\nconst jogador = { x: 220, y: 580, w: 40, h: 40, vel: 6 };\nlet blocos = [], pontos = 0, vivo = true, teclas = {};\n\naddEventListener('keydown', e => teclas[e.key] = true);\naddEventListener('keyup', e => teclas[e.key] = false);\ntela.addEventListener('pointerdown', e => { const r = tela.getBoundingClientRect(); teclas.toque = (e.clientX - r.left) < r.width / 2 ? -1 : 1; if (!vivo) reiniciar(); });\naddEventListener('pointerup', () => teclas.toque = 0);\n\nfunction reiniciar() { blocos = []; pontos = 0; vivo = true; }\n\nfunction passo() {\n  if (vivo) {\n    if (teclas.ArrowLeft || teclas.toque === -1) jogador.x -= jogador.vel;\n    if (teclas.ArrowRight || teclas.toque === 1) jogador.x += jogador.vel;\n    jogador.x = Math.max(0, Math.min(tela.width - jogador.w, jogador.x));\n    if (Math.random() < 0.04 + pontos / 20000) blocos.push({ x: Math.random() * (tela.width - 40), y: -40, w: 30 + Math.random() * 40, h: 24, v: 3 + Math.random() * 3 + pontos / 400 });\n    for (const b of blocos) {\n      b.y += b.v;\n      if (b.x < jogador.x + jogador.w && b.x + b.w > jogador.x && b.y < jogador.y + jogador.h && b.y + b.h > jogador.y) { vivo = false; console.log('Fim! Pontos: ' + pontos); }\n    }\n    blocos = blocos.filter(b => b.y < tela.height);\n    pontos++;\n  } else if (teclas[' ']) reiniciar();\n  desenhar();\n  requestAnimationFrame(passo);\n}\n\nfunction desenhar() {\n  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, tela.width, tela.height);\n  ctx.fillStyle = '#38bdf8'; ctx.fillRect(jogador.x, jogador.y, jogador.w, jogador.h);\n  ctx.fillStyle = '#f87171'; for (const b of blocos) ctx.fillRect(b.x, b.y, b.w, b.h);\n  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui'; ctx.fillText('Pontos: ' + pontos, 14, 32);\n  if (!vivo) { ctx.textAlign = 'center'; ctx.fillText('Fim! Espaço ou toque para recomeçar', tela.width / 2, tela.height / 2); ctx.textAlign = 'left'; }\n}\n\npasso();\n`,
    } },
    three: { i: '🧊', t: 'Three.js 3D', d: 'Cena 3D com módulos', arquivos: {
      'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>3D</title>\n  <style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>\n  <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>\n</head>\n<body>\n  <script type="module" src="main.js"></script>\n</body>\n</html>\n',
      'main.js': `import * as THREE from 'three';\nimport { criarCubo } from './cubo.js';\n\nconst renderer = new THREE.WebGLRenderer({ antialias: true });\nrenderer.setSize(innerWidth, innerHeight);\ndocument.body.appendChild(renderer.domElement);\nconst cena = new THREE.Scene();\ncena.background = new THREE.Color('#1e293b');\nconst camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);\ncamera.position.set(0, 1.5, 4);\ncena.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2));\nconst cubo = criarCubo(THREE);\ncena.add(cubo);\n\nrenderer.setAnimationLoop(t => {\n  cubo.rotation.x = t / 1000;\n  cubo.rotation.y = t / 700;\n  renderer.render(cena, camera);\n});\naddEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });\n`,
      'cubo.js': `export function criarCubo(THREE) {\n  return new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: '#38bdf8' }));\n}\n`,
    } },
    phaser: { i: '👾', t: 'Phaser 3', d: 'Motor 2D popular', arquivos: {
      'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>Phaser</title>\n  <style>body{margin:0;background:#000;display:flex;justify-content:center}</style>\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js"></script>\n</head>\n<body>\n  <script src="jogo.js"></script>\n</body>\n</html>\n',
      'jogo.js': `class Cena extends Phaser.Scene {\n  create() {\n    this.add.text(20, 20, 'Phaser 3 · use as setas', { fontSize: '20px', color: '#fff' });\n    this.jogador = this.add.rectangle(400, 300, 40, 40, 0x38bdf8);\n    this.physics.add.existing(this.jogador);\n    this.jogador.body.setCollideWorldBounds(true);\n    this.setas = this.input.keyboard.createCursorKeys();\n  }\n  update() {\n    const v = 260, b = this.jogador.body;\n    b.setVelocity(0);\n    if (this.setas.left.isDown) b.setVelocityX(-v);\n    if (this.setas.right.isDown) b.setVelocityX(v);\n    if (this.setas.up.isDown) b.setVelocityY(-v);\n    if (this.setas.down.isDown) b.setVelocityY(v);\n  }\n}\nnew Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, backgroundColor: '#1e293b', physics: { default: 'arcade' }, scene: Cena });\n`,
    } },
    python: { i: '🐍', t: 'Python', d: 'Python no navegador (Pyodide)', arquivos: {
      'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>Python</title>\n  <style>body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui;display:flex;flex-direction:column;align-items:center}canvas{background:#111827;border-radius:10px;margin-top:20px}</style>\n</head>\n<body>\n  <canvas id="tela" width="480" height="360"></canvas>\n  <p id="msg">Carregando Python…</p>\n  <script type="text/python" src="main.py"></script>\n</body>\n</html>\n',
      'main.py': `# Python rodando no navegador! O módulo "js" dá acesso à página.\nfrom js import document, window\nfrom pyodide.ffi import create_proxy\nimport math\n\ntela = document.getElementById("tela")\nctx = tela.getContext("2d")\ndocument.getElementById("msg").textContent = "Python pronto! 🐍"\nt = 0\n\ndef quadro(_):\n    global t\n    t += 1\n    ctx.fillStyle = "#111827"\n    ctx.fillRect(0, 0, 480, 360)\n    for i in range(12):\n        a = t / 40 + i * math.pi / 6\n        ctx.fillStyle = f"hsl({i * 30}, 80%, 60%)"\n        ctx.beginPath()\n        ctx.arc(240 + math.cos(a) * 120, 180 + math.sin(a) * 120, 14, 0, math.pi * 2)\n        ctx.fill()\n    window.requestAnimationFrame(proxy)\n\nproxy = create_proxy(quadro)\nwindow.requestAnimationFrame(proxy)\nprint("Olá do Python!")\n`,
    } },
    lua: { i: '🌙', t: 'Lua', d: 'Lua no navegador (Fengari)', arquivos: {
      'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>Lua</title>\n  <style>body{margin:0;background:#0b1026;color:#e2e8f0;font-family:system-ui;display:flex;flex-direction:column;align-items:center}canvas{background:#111827;border-radius:10px;margin-top:20px}</style>\n</head>\n<body>\n  <canvas id="tela" width="480" height="360"></canvas>\n  <p>Clique na tela para criar estrelas</p>\n  <script type="application/lua" src="main.lua"></script>\n</body>\n</html>\n',
      'main.lua': `-- Lua rodando no navegador! "js" dá acesso à página.\nlocal js = require "js"\nlocal window = js.global\nlocal document = window.document\nlocal tela = document:getElementById("tela")\nlocal ctx = tela:getContext("2d")\nlocal estrelas = {}\n\ntela:addEventListener("click", function(_, ev)\n  table.insert(estrelas, { x = ev.offsetX, y = ev.offsetY, r = math.random(4, 12) })\nend)\n\nlocal function quadro()\n  ctx.fillStyle = "#111827"\n  ctx:fillRect(0, 0, 480, 360)\n  ctx.fillStyle = "#facc15"\n  for _, e in ipairs(estrelas) do\n    ctx:beginPath()\n    ctx:arc(e.x, e.y, e.r, 0, math.pi * 2)\n    ctx:fill()\n  end\n  window:requestAnimationFrame(quadro)\nend\nwindow:requestAnimationFrame(quadro)\nprint("Olá do Lua!")\n`,
    } },
    typescript: { i: '🔷', t: 'TypeScript', d: 'TS compilado na hora', arquivos: {
      'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>TypeScript</title>\n  <style>body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui;padding:30px}button{font-size:18px;padding:10px 20px;border-radius:10px;border:0;background:#3178c6;color:#fff}</style>\n</head>\n<body>\n  <h1>Contador em TypeScript</h1>\n  <button id="botao">Cliques: 0</button>\n  <script type="module" src="main.ts"></script>\n</body>\n</html>\n',
      'main.ts': `interface Estado { cliques: number; }\nconst estado: Estado = { cliques: 0 };\nconst botao = document.getElementById('botao') as HTMLButtonElement;\nbotao.addEventListener('click', () => {\n  estado.cliques++;\n  botao.textContent = \`Cliques: \${estado.cliques}\`;\n});\nconsole.log('TypeScript funcionando!');\n`,
    } },
    vazio: { i: '📄', t: 'Página em branco', d: 'Só um index.html', arquivos: { 'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>Meu projeto</title>\n</head>\n<body>\n  <h1>Olá!</h1>\n  <script>\n    console.log("Projeto pronto");\n  </script>\n</body>\n</html>\n' } },
  };

  /* ===================== Documentação ===================== */
  const DOCS_TEXTO = `ARCÁDIA STUDIO · API DE SCRIPTS (jogos 3D)
Scripts podem ser em Lua (padrão) ou JavaScript. A API é parecida com a de estúdios populares.

OBJETOS (classes): Part, SpawnLocation, Model, Folder, Script, PointLight, BillboardText, Sound, ClickDetector, ScreenGui, Frame, TextLabel, TextButton, ImageLabel, IntValue, NumberValue, StringValue, BoolValue.
Serviços: Workspace (mundo 3D), Players, Lighting, ReplicatedStorage, ServerScriptService, StarterGui, SoundService, RunService, UserInputService, TweenService, Debris.

PROPRIEDADES DE Part: Position (Vector3), Size (Vector3), Orientation (graus), Color (Color3), Material (Plastic, SmoothPlastic, Wood, Brick, Concrete, Grass, Sand, Metal, DiamondPlate, Neon, Glass, Ice, Marble, Slate, Fabric), Transparency, Anchored, CanCollide, CanTouch, Shape (Block, Ball, Cylinder, Wedge), Velocity.
Interface: Position/Size são UDim2 (escalaX, pixelsX, escalaY, pixelsY), AnchorPoint (Vector2), Text, TextSize, TextColor3, BackgroundColor3, BackgroundTransparency, Visible, CornerRadius.

GLOBAIS: game, workspace, script, print, warn, wait(s), task.wait/spawn/delay, Vector3.new, Color3.fromRGB/new, UDim2.new, Vector2.new, Instance.new(classe, pai), TweenInfo.new, Enum, BrickColor.new.
MÉTODOS: FindFirstChild(nome), WaitForChild(nome), GetChildren(), GetDescendants(), Clone(), Destroy(), IsA(classe), game:GetService(nome), Players:GetPlayerFromCharacter(modelo), model:MoveTo(Vector3), Sound:Play()/Stop(), Humanoid:TakeDamage(n), TweenService:Create(obj, info, {Prop = valor}):Play(), Debris:AddItem(obj, s).
EVENTOS (:Connect(função)): part.Touched / TouchEnded (recebe a parte que tocou; hit.Parent é o personagem), ClickDetector.MouseClick (jogador), TextButton.MouseButton1Click, Players.PlayerAdded (jogador), player.CharacterAdded, Humanoid.Died, valor.Changed, RunService.Heartbeat (dt), UserInputService.InputBegan (input.KeyCode.Name).
PERSONAGEM: player.Character contém HumanoidRootPart, Head, Torso, braços, pernas e Humanoid (Health, MaxHealth, WalkSpeed, JumpPower). player.RespawnLocation = parte (checkpoint). Placar: crie uma Folder "leaderstats" dentro do jogador com IntValue dentro.
SONS PRONTOS (Sound.SoundId): coin, jump, explosion, hit, win, lose, click, powerup, laser, music, ou uma URL de áudio.
Em JavaScript use "await wait(1)" e "obj.Touched.Connect(hit => {...})".

PROJETOS DE ARQUIVOS: qualquer HTML/CSS/JS. Também TypeScript (.ts/.tsx), JSX, Lua (<script type="application/lua" src="main.lua">) e Python (<script type="text/python" src="main.py">). Imports relativos, fetch('dados.json') e imagens funcionam.`;
  const DOCS_HTML = `<p>O Arcádia Studio tem dois tipos de projeto:</p>
  <ul><li><b>Jogo 3D (cena):</b> você monta o mundo com partes, como num estúdio de jogos, e dá vida com scripts em <b>Lua</b> ou <b>JavaScript</b>.</li><li><b>Projeto de arquivos:</b> qualquer jogo web feito com arquivos e pastas (HTML, CSS, JS, TypeScript, Python, Lua…). Dá para abrir uma pasta do seu computador.</li></ul>
  <h3>Primeiro script (Lua)</h3><pre>-- coloque este Script dentro de uma Part
script.Parent.Touched:Connect(function(hit)
  local humanoide = hit.Parent:FindFirstChild("Humanoid")
  if humanoide then
    humanoide.Health = 0   -- bloco de lava!
  end
end)</pre>
  <h3>O mesmo em JavaScript</h3><pre>script.Parent.Touched.Connect(hit => {
  const h = hit.Parent.FindFirstChild("Humanoid");
  if (h) h.Health = 0;
});</pre>
  <h3>Placar (leaderstats)</h3><pre>game.Players.PlayerAdded:Connect(function(jogador)
  local stats = Instance.new("Folder")
  stats.Name = "leaderstats"
  stats.Parent = jogador
  local moedas = Instance.new("IntValue")
  moedas.Name = "Moedas"
  moedas.Parent = stats
end)</pre>
  <h3>Animação com TweenService</h3><pre>local TS = game:GetService("TweenService")
local p = script.Parent
TS:Create(p, TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
  { Position = p.Position + Vector3.new(0, 10, 0) }):Play()</pre>
  <h3>Referência</h3><pre style="white-space:pre-wrap">${esc(DOCS_TEXTO)}</pre>`;

  /* ===================== Celular e tablet =====================
     Tela pequena: a cena ocupa tudo e os painéis viram gavetas por cima dela,
     abertas pela barra de baixo. Toque (dedo): botões e linhas maiores. */
  const mqMovel = matchMedia('(max-width: 1000px), (max-height: 620px)');
  function modoMovel() {
    const movel = mqMovel.matches;
    document.body.classList.toggle('movel', movel); document.body.classList.toggle('toque', TOQUE);
    if (!movel) fecharGavetas();
    window.dispatchEvent(new Event('resize'));
  }
  function fecharGavetas() { for (const c of ['ver-esq', 'ver-dir', 'ver-baixo']) document.body.classList.toggle(c, false); marcarBarra(); }
  function gaveta(qual) {
    const c = 'ver-' + qual, aberta = document.body.classList.contains(c);
    fecharGavetas(); if (!aberta) document.body.classList.add(c);
    marcarBarra(); window.dispatchEvent(new Event('resize'));
  }
  function marcarBarra() {
    $$('#barra-movel [data-g]').forEach(b => b.classList.toggle('on', document.body.classList.contains('ver-' + b.dataset.g)));
    const j = $('#barra-movel [data-m="jogar"]'); if (j) j.innerHTML = jogando ? '<span>■</span>Parar' : '<span>▶</span>Jogar';
  }
  $('#barra-movel').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.g) return gaveta(b.dataset.g);
    const m = b.dataset.m; fecharGavetas();
    if (m === 'jogar') { jogando ? pararJogo() : jogar(); setTimeout(marcarBarra, 50); }
    else acao(m);
  });
  $$('.fechar-gaveta').forEach(b => b.addEventListener('click', fecharGavetas));
  // na gaveta da direita, Explorer e Propriedades viram abas (não cabem as duas na tela do celular)
  $$('[data-aba-dir]').forEach(b => b.addEventListener('click', () => {
    $('#dir').classList.toggle('aba-props', b.dataset.abaDir === 'props');
    $$('[data-aba-dir]').forEach(x => x.classList.toggle('on', x === b));
  }));
  mqMovel.addEventListener('change', modoMovel); modoMovel();
  // segurar o dedo numa linha do Explorer abre o menu (no iPhone não existe "botão direito")
  {
    let t = 0, ini = null;
    $('#arvore').addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return; ini = { x: e.clientX, y: e.clientY, alvo: e.target };
      clearTimeout(t); t = setTimeout(() => { if (!ini || $('#menu').classList.contains('on')) return; protegerMenu(); ini.alvo.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: ini.x, clientY: ini.y })); ini = null; }, 600);
    });
    $('#arvore').addEventListener('pointermove', e => { if (ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 10) { clearTimeout(t); ini = null; } });
    const parar = () => { clearTimeout(t); ini = null; };
    $('#arvore').addEventListener('pointerup', parar); $('#arvore').addEventListener('pointercancel', parar); $('#arvore').addEventListener('scroll', parar);
    addEventListener('touchstart', e => { if (!e.target.closest('#menu')) fecharMenu(); }, { passive: true });
  }

  /* ===================== Início ===================== */
  (async function iniciar() {
    renderFaixa();
    try { await iniciarViewport(); } catch (e) { saida('error', 'Não foi possível iniciar o 3D: ' + e.message); }
    let p = null;
    try { const id = localStorage.getItem('studio.ultimo'); if (id) p = await N.lerDb('projetos', id); } catch (e) {}
    const q = new URLSearchParams(location.search);
    if (q.get('novo')) { await criarProjeto(q.get('novo') === 'arquivos' ? 'arquivos' : 'cena', null, q.get('modelo') || undefined); }
    else if (p) await abrirProjeto(p);
    else telaInicial();
    if (q.get('mcp') === '1' || localStorage.getItem('studio.mcpAuto') === '1') { mcp.ativo = true; loopMcp(); }
    saida('info', 'Arcádia Studio pronto. Pressione F5 para jogar. Veja Exibir → Documentação para a API de scripts.');
    // atalhos vindos da plataforma: #personagem, #marketplace, #marketplace=personagem
    const h = location.hash.slice(1);
    if (h === 'personagem') acao('personagem');
    else if (h.startsWith('marketplace')) telaMarketplace(h.split('=')[1] || 'item');
  })();
})();
