/* =========================================================================
   ARCÁDIA STUDIO · núcleo compartilhado (Studio + motor dos jogos)
   - modelo de dados (classes, propriedades, enums)
   - construtor de malhas 3D (three.js)
   - empacotador de projetos de arquivos (HTML/CSS/JS/TS/Lua/Python)
   ========================================================================= */
(function () {
  'use strict';
  const ASN = (window.ASN = {});

  /* ------------------------------------------------------------------ */
  /* Classes                                                             */
  /* ------------------------------------------------------------------ */
  const UI_BASE = { Position: [0, 0, 0, 0], Size: [0, 200, 0, 50], AnchorPoint: [0, 0], BackgroundColor3: '#1e1e2e', BackgroundTransparency: 0, Visible: true, ZIndex: 1, CornerRadius: 8 };
  const TEXTO = { Text: 'Texto', TextColor3: '#ffffff', TextSize: 22, TextTransparency: 0, Font: 'Padrão', TextXAlignment: 'Center' };
  const PARTE = { Position: [0, 0.5, 0], Size: [4, 1, 2], Orientation: [0, 0, 0], Color: '#a3a2a5', Material: 'Plastic', Transparency: 0, Reflectance: 0, Anchored: true, CanCollide: true, CanTouch: true, Shape: 'Block', CastShadow: true };
  const CLASSES = {
    DataModel: { icone: '🎮', props: {} },
    Workspace: { servico: true, icone: '🌐', props: { Gravity: 196.2, FallenPartsDestroyHeight: -100 }, desc: 'Tudo que existe no mundo 3D' },
    Players: { servico: true, icone: '👥', props: { RespawnTime: 3, CharacterWalkSpeed: 16, CharacterJumpPower: 50, Multiplayer: false, MaxPlayers: 10 }, desc: 'Configurações dos jogadores (Multiplayer liga o multijogador)' },
    Lighting: { servico: true, icone: '💡', props: { ClockTime: 14, Brightness: 2, Ambient: '#7a8090', SkyColor: '#8ec5ff', FogColor: '#c9dcf0', FogEnd: 900, GlobalShadows: true }, desc: 'Luz, céu e neblina' },
    ReplicatedStorage: { servico: true, icone: '📦', props: {}, desc: 'Guarde modelos para clonar por script' },
    ServerScriptService: { servico: true, icone: '⚙️', props: {}, desc: 'Scripts que rodam quando o jogo começa' },
    StarterGui: { servico: true, icone: '🖼️', props: {}, desc: 'Interfaces (telas) copiadas para cada jogador' },
    SoundService: { servico: true, icone: '🔊', props: { Volume: 0.6 }, desc: 'Sons globais' },
    Part: { icone: '🧱', props: { ...PARTE }, desc: 'Um bloco, esfera, cilindro ou rampa' },
    SpawnLocation: { icone: '🏁', props: { ...PARTE, Size: [6, 1, 6], Color: '#3f8f47', Material: 'Plastic' }, desc: 'Onde o jogador nasce' },
    Model: { icone: '🧩', props: {}, desc: 'Agrupa várias partes' },
    Folder: { icone: '📁', props: {}, desc: 'Pasta para organizar' },
    Script: { icone: '📜', props: { Language: 'Lua', Enabled: true, Source: '' }, desc: 'Código que dá vida ao jogo (Lua ou JavaScript)' },
    PointLight: { icone: '🔆', props: { Color: '#fff1d6', Brightness: 2, Range: 16, Enabled: true }, desc: 'Luz que sai de uma parte' },
    BillboardText: { icone: '🏷️', props: { Text: 'Olá!', TextColor3: '#ffffff', TextSize: 28, BackgroundTransparency: 1, BackgroundColor3: '#000000', StudsOffset: [0, 3, 0], Enabled: true }, desc: 'Texto que flutua em cima de uma parte' },
    Sound: { icone: '🎵', props: { SoundId: 'coin', Volume: 0.5, Looped: false, Playing: false, PlaybackSpeed: 1 }, desc: 'Som (efeito pronto ou URL de áudio)' },
    ScreenGui: { icone: '🖥️', props: { Enabled: true, ResetOnSpawn: true }, desc: 'Uma tela de interface' },
    Frame: { icone: '⬛', props: { ...UI_BASE }, desc: 'Caixa de interface' },
    TextLabel: { icone: '🔤', props: { ...UI_BASE, Size: [0, 240, 0, 50], BackgroundTransparency: 0.35, ...TEXTO }, desc: 'Texto na tela' },
    TextButton: { icone: '🔘', props: { ...UI_BASE, Size: [0, 200, 0, 50], BackgroundColor3: '#3b82f6', ...TEXTO, Text: 'Botão' }, desc: 'Botão clicável' },
    ImageLabel: { icone: '🖼️', props: { ...UI_BASE, Size: [0, 100, 0, 100], BackgroundTransparency: 1, Image: '' }, desc: 'Imagem na tela (URL)' },
    IntValue: { icone: '🔢', props: { Value: 0 }, desc: 'Guarda um número inteiro' },
    NumberValue: { icone: '🔢', props: { Value: 0 }, desc: 'Guarda um número' },
    StringValue: { icone: '🔤', props: { Value: '' }, desc: 'Guarda um texto' },
    BoolValue: { icone: '✅', props: { Value: false }, desc: 'Guarda verdadeiro/falso' },
    RemoteEvent: { icone: '📡', props: {}, desc: 'Manda mensagens entre os jogadores no multijogador (FireServer, FireAllClients, FireClient)' },
    ClickDetector: { icone: '🖱️', props: { MaxActivationDistance: 32 }, desc: 'Deixa a parte clicável (evento MouseClick)' },
    Humanoid: { icone: '🧍', props: { Health: 100, MaxHealth: 100, WalkSpeed: 16, JumpPower: 50 }, desc: 'Vida e movimento de um personagem' },
    Player: { icone: '🙂', props: { UserId: 1, DisplayName: '' }, desc: 'Um jogador' },
    PlayerGui: { icone: '🖥️', props: {}, desc: '' },
  };
  const ENUMS = {
    Material: ['Plastic', 'SmoothPlastic', 'Wood', 'Brick', 'Concrete', 'Grass', 'Sand', 'Metal', 'DiamondPlate', 'Neon', 'Glass', 'Ice', 'Marble', 'Slate', 'Fabric'],
    Shape: ['Block', 'Ball', 'Cylinder', 'Wedge'],
    Language: ['Lua', 'JavaScript'],
    Font: ['Padrão', 'Arredondada', 'Mono', 'Serifada', 'Pixel'],
    TextXAlignment: ['Left', 'Center', 'Right'],
  };
  const SONS_PRONTOS = ['coin', 'jump', 'explosion', 'hit', 'win', 'lose', 'click', 'powerup', 'laser', 'music'];
  const PODE_TER_FILHOS = c => !['Script', 'ClickDetector', 'Sound', 'IntValue', 'NumberValue', 'StringValue', 'BoolValue', 'PointLight', 'BillboardText', 'RemoteEvent'].includes(c);
  const EH_PARTE = c => c === 'Part' || c === 'SpawnLocation';
  const EH_UI = c => ['Frame', 'TextLabel', 'TextButton', 'ImageLabel'].includes(c);
  Object.assign(ASN, { CLASSES, ENUMS, SONS_PRONTOS, PODE_TER_FILHOS, EH_PARTE, EH_UI });

  let contador = Date.now() % 100000;
  ASN.novoId = () => (++contador).toString(36) + Math.random().toString(36).slice(2, 5);
  ASN.copia = o => JSON.parse(JSON.stringify(o));

  ASN.criar = function (classe, props = {}, nome) {
    const def = CLASSES[classe]; if (!def) throw new Error('Classe desconhecida: ' + classe);
    return { id: ASN.novoId(), ClassName: classe, Name: nome || props.Name || classe, props: { ...ASN.copia(def.props), ...ASN.copia(props) }, children: [] };
  };
  ASN.tipoProp = function (nome, valor) {
    for (const [e, lista] of Object.entries(ENUMS)) if (nome === e || (nome === 'Font' && e === 'Font')) return { t: 'enum', lista };
    if (nome === 'SoundId') return { t: 'som' };
    if (nome === 'Source') return { t: 'codigo' };
    if (typeof valor === 'boolean') return { t: 'bool' };
    if (typeof valor === 'number') return { t: 'num' };
    if (Array.isArray(valor)) return { t: valor.length === 4 ? 'udim2' : valor.length === 2 ? 'vec2' : 'vec3' };
    if (typeof valor === 'string' && /^#[0-9a-f]{6}$/i.test(valor)) return { t: 'cor' };
    return { t: 'texto' };
  };

  /* Cena padrão (Baseplate) */
  ASN.cenaPadrao = function (modelo = 'baseplate') {
    const s = c => ASN.criar(c, {}, c);
    const ws = s('Workspace'), pl = s('Players'), li = s('Lighting'), rs = s('ReplicatedStorage'), sss = s('ServerScriptService'), sg = s('StarterGui'), so = s('SoundService');
    if (modelo !== 'vazio') {
      ws.children.push(ASN.criar('Part', { Position: [0, -2, 0], Size: [256, 4, 256], Color: '#5f9e4f', Material: 'Grass', Anchored: true }, 'Baseplate'));
      ws.children.push(ASN.criar('SpawnLocation', { Position: [0, 0.5, 0] }, 'SpawnLocation'));
    }
    return { id: 'raiz', ClassName: 'DataModel', Name: 'Jogo', props: {}, children: [ws, pl, li, rs, sss, sg, so] };
  };
  ASN.novoProjeto = function (tipo, nome, cena) {
    const p = { formato: 'arcadia-studio', versao: 1, id: 'proj-' + ASN.novoId(), nome: nome || 'Meu jogo', tipo, criado: Date.now(), atualizado: Date.now(), descricao: '', capa: '' };
    if (tipo === 'cena') p.cena = cena || ASN.cenaPadrao();
    else { p.arquivos = {}; p.entrada = 'index.html'; }
    return p;
  };
  ASN.percorrer = function (no, fn, pai = null) { fn(no, pai); for (const f of no.children || []) ASN.percorrer(f, fn, no); };
  ASN.acharPorId = function (raiz, id) { let r = null; ASN.percorrer(raiz, (n, p) => { if (!r && n.id === id) r = { no: n, pai: p }; }); return r; };
  ASN.caminhoDe = function (raiz, id) {
    const pilha = [];
    const busca = n => { if (n.id === id) return true; for (const f of n.children || []) { pilha.push(f.Name); if (busca(f)) return true; pilha.pop(); } return false; };
    return busca(raiz) ? pilha.join('.') : null;
  };
  ASN.acharPorCaminho = function (raiz, caminho) {
    const partes = String(caminho).replace(/^game\.?/, '').split('.').filter(Boolean);
    let n = raiz;
    for (const p of partes) { n = (n.children || []).find(f => f.Name === p); if (!n) return null; }
    return n;
  };
  ASN.reidentificar = function (no) { ASN.percorrer(no, n => { n.id = ASN.novoId(); }); return no; };

  /* ------------------------------------------------------------------ */
  /* Cores                                                               */
  /* ------------------------------------------------------------------ */
  ASN.hexParaRgb = h => { const n = parseInt(String(h || '#000000').slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  ASN.rgbParaHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

  /* ------------------------------------------------------------------ */
  /* Malhas (three.js)                                                   */
  /* ------------------------------------------------------------------ */
  ASN.construtor = function (THREE) {
    const texturas = {};
    function canvasTex(nome, desenhar) {
      if (texturas[nome]) return texturas[nome];
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'); desenhar(g, 128);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return (texturas[nome] = t);
    }
    const ruido = (g, s, a) => { for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${Math.random() * a})`; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); } };
    const TEX = {
      Plastic: () => canvasTex('plastic', (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); }),
      Wood: () => canvasTex('wood', (g, s) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 3) { g.fillStyle = `rgba(80,50,20,${0.08 + Math.random() * 0.12})`; g.fillRect(0, y + Math.sin(y) * 2, s, 1.5); } g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(0, 0, s, 2); g.fillRect(0, s / 2, s, 2); }),
      Brick: () => canvasTex('brick', (g, s) => { g.fillStyle = '#d9d9d9'; g.fillRect(0, 0, s, s); g.fillStyle = '#fff'; const h = s / 4; for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const off = r % 2 ? s / 4 : 0; g.fillRect(c * s / 2 + off + 3, r * h + 3, s / 2 - 6, h - 6); } ruido(g, s, .12); }),
      Concrete: () => canvasTex('concrete', (g, s) => { g.fillStyle = '#eee'; g.fillRect(0, 0, s, s); ruido(g, s, .18); }),
      Grass: () => canvasTex('grass', (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,${40 + Math.random() * 60},0,${Math.random() * 0.25})`; g.fillRect(Math.random() * s, Math.random() * s, 1.5, 3 + Math.random() * 3); } }),
      Sand: () => canvasTex('sand', (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); ruido(g, s, .22); }),
      Metal: () => canvasTex('metal', (g, s) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(0, y, s, 1); } }),
      DiamondPlate: () => canvasTex('diamond', (g, s) => { g.fillStyle = '#ececec'; g.fillRect(0, 0, s, s); g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < s; y += 16) for (let x = (y / 16) % 2 * 8; x < s; x += 16) { g.save(); g.translate(x + 4, y + 4); g.rotate(0.7); g.fillRect(-5, -1.5, 10, 3); g.restore(); } }),
      Ice: () => canvasTex('ice', (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * s, Math.random() * s); g.lineTo(Math.random() * s, Math.random() * s); g.stroke(); } }),
      Marble: () => canvasTex('marble', (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { g.beginPath(); let x = 0, y = Math.random() * s; g.moveTo(x, y); while (x < s) { x += 8; y += (Math.random() - .5) * 14; g.lineTo(x, y); } g.stroke(); } }),
      Slate: () => canvasTex('slate', (g, s) => { g.fillStyle = '#ddd'; g.fillRect(0, 0, s, s); for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * s, Math.random() * s, 30, 18); } }),
      Fabric: () => canvasTex('fabric', (g, s) => { g.fillStyle = '#eee'; g.fillRect(0, 0, s, s); g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < s; i += 4) { g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); } }),
    };
    const geoCubo = new THREE.BoxGeometry(1, 1, 1), geoEsfera = new THREE.SphereGeometry(0.5, 28, 18), geoCilindro = new THREE.CylinderGeometry(0.5, 0.5, 1, 28);
    geoCilindro.rotateZ(Math.PI / 2); // como no Roblox: o cilindro deita no eixo X
    const geoCunha = (() => {
      // rampa: base no chão, sobe em direção a -Z (frente)
      const v = [-.5, -.5, .5, .5, -.5, .5, .5, -.5, -.5, -.5, -.5, -.5, -.5, .5, -.5, .5, .5, -.5];
      const idx = [0, 2, 1, 0, 3, 2, 3, 4, 5, 3, 5, 2, 0, 1, 5, 0, 5, 4, 0, 4, 3, 1, 2, 5];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx);
      const ng = g.toNonIndexed(); ng.computeVertexNormals();
      const pos = ng.attributes.position, uv = [];
      for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i) + pos.getZ(i) + .5, pos.getY(i) + .5);
      ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      return ng;
    })();
    function material(props) {
      const m = props.Material, cor = new THREE.Color(props.Color || '#a3a2a5');
      const base = { color: cor, roughness: 0.55, metalness: 0 };
      if (m === 'SmoothPlastic') base.roughness = 0.3;
      if (m === 'Wood' || m === 'Fabric' || m === 'Grass' || m === 'Sand' || m === 'Concrete' || m === 'Slate' || m === 'Brick') base.roughness = 0.9;
      if (m === 'Metal' || m === 'DiamondPlate') { base.metalness = 0.75; base.roughness = 0.35; }
      if (m === 'Marble') base.roughness = 0.25;
      if (m === 'Ice') { base.roughness = 0.08; base.metalness = 0.1; }
      if (m === 'Glass') { base.roughness = 0.03; base.metalness = 0.1; }
      const mat = new THREE.MeshStandardMaterial(base);
      if (m === 'Neon') { mat.emissive = cor.clone(); mat.emissiveIntensity = 1.6; mat.roughness = 1; }
      const tf = TEX[m] || (m !== 'Neon' && m !== 'Glass' && m !== 'SmoothPlastic' ? TEX.Plastic : null);
      if (tf) mat.map = tf().clone();
      const tr = m === 'Glass' ? Math.max(0.55, props.Transparency || 0) : (props.Transparency || 0);
      if (tr > 0) { mat.transparent = true; mat.opacity = 1 - tr; mat.depthWrite = tr < 0.5; }
      mat.userData.chave = m + '|' + props.Color + '|' + tr;
      return mat;
    }
    function aplicar(malha, inst) {
      const p = inst.props, s = p.Size || [1, 1, 1];
      const forma = p.Shape || 'Block';
      const geo = forma === 'Ball' ? geoEsfera : forma === 'Cylinder' ? geoCilindro : forma === 'Wedge' ? geoCunha : geoCubo;
      if (malha.geometry !== geo) malha.geometry = geo;
      const esc = forma === 'Ball' ? [Math.min(...s), Math.min(...s), Math.min(...s)] : forma === 'Cylinder' ? [s[0], Math.min(s[1], s[2]), Math.min(s[1], s[2])] : s;
      malha.scale.set(Math.max(0.05, esc[0]), Math.max(0.05, esc[1]), Math.max(0.05, esc[2]));
      malha.position.set(p.Position[0], p.Position[1], p.Position[2]);
      const o = p.Orientation || [0, 0, 0], r = Math.PI / 180;
      malha.rotation.set(o[0] * r, o[1] * r, o[2] * r, 'YXZ');
      const chave = p.Material + '|' + p.Color + '|' + (p.Material === 'Glass' ? Math.max(0.55, p.Transparency || 0) : (p.Transparency || 0));
      if (!malha.material || malha.material.userData.chave !== chave) { if (malha.material) malha.material.dispose(); malha.material = material(p); }
      if (malha.material.map) malha.material.map.repeat.set(Math.max(1, esc[0] / 4), Math.max(1, esc[1] / 4));
      malha.visible = (p.Transparency || 0) < 1;
      malha.castShadow = p.CastShadow !== false && (p.Transparency || 0) < 0.5; malha.receiveShadow = true;
      malha.updateMatrixWorld(true);
    }
    function criarMalha(inst) { const m = new THREE.Mesh(geoCubo); m.userData.instId = inst.id; aplicar(m, inst); return m; }
    function spriteTexto(props) {
      const c = document.createElement('canvas'), g = c.getContext('2d'), fs = 64;
      g.font = `bold ${fs}px "Segoe UI", system-ui, sans-serif`;
      const w = Math.ceil(g.measureText(props.Text || ' ').width) + 40; c.width = Math.min(2048, w); c.height = fs + 30;
      g.font = `bold ${fs}px "Segoe UI", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ((props.BackgroundTransparency ?? 1) < 1) { g.globalAlpha = 1 - props.BackgroundTransparency; g.fillStyle = props.BackgroundColor3 || '#000'; g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1; }
      g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText(props.Text || '', c.width / 2, c.height / 2);
      g.fillStyle = props.TextColor3 || '#fff'; g.fillText(props.Text || '', c.width / 2, c.height / 2);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
      const h = (props.TextSize || 28) / 28 * 1.4; sp.scale.set(h * c.width / c.height, h, 1);
      return sp;
    }
    return { criarMalha, aplicar, material, spriteTexto, TEX };
  };

  /* ------------------------------------------------------------------ */
  /* Projetos de arquivos → HTML executável                              */
  /* ------------------------------------------------------------------ */
  const MIME = { html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', ts: 'text/javascript', tsx: 'text/javascript', jsx: 'text/javascript', json: 'application/json', txt: 'text/plain', md: 'text/markdown', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', glb: 'model/gltf-binary', gltf: 'model/gltf+json', lua: 'text/plain', py: 'text/plain', xml: 'application/xml', csv: 'text/csv', wasm: 'application/wasm' };
  ASN.MIME = MIME;
  ASN.extensao = p => (String(p).split('/').pop().match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
  ASN.ehTexto = p => /^(text\/|application\/(json|xml))/.test(MIME[ASN.extensao(p)] || 'text/plain') || ['lua', 'py', 'ts', 'tsx', 'jsx', 'svg', 'gltf', 'md'].includes(ASN.extensao(p)) || !MIME[ASN.extensao(p)];
  const b64utf8 = s => { const b = new TextEncoder().encode(s); let r = ''; for (let i = 0; i < b.length; i += 0x8000) r += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(r); };
  ASN.b64utf8 = b64utf8;
  ASN.resolverCaminho = function (base, ref) {
    ref = String(ref).split('#')[0].split('?')[0];
    if (!ref || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) return null;
    let partes = ref.startsWith('/') ? [] : (base ? base.split('/').slice(0, -1) : []);
    for (const p of ref.replace(/^\//, '').split('/')) { if (p === '..') partes.pop(); else if (p && p !== '.') partes.push(p); }
    return partes.join('/');
  };
  ASN.carregarScript = (src, global) => new Promise((ok, erro) => {
    if (global && window[global]) return ok(window[global]);
    const s = document.createElement('script'); s.src = src; s.onload = () => ok(global ? window[global] : true); s.onerror = () => erro(new Error('não carregou ' + src)); document.head.appendChild(s);
  });
  const BABEL = 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js';
  const FENGARI = 'https://unpkg.com/fengari-web@0.1.4/dist/fengari-web.js';
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
  Object.assign(ASN, { BABEL, FENGARI, PYODIDE });

  ASN.construirHTML = async function (proj, avisar = () => {}) {
    const arqs = proj.arquivos || {};
    const nomes = Object.keys(arqs);
    let entrada = proj.entrada && arqs[proj.entrada] ? proj.entrada : (nomes.find(n => /(^|\/)index\.html?$/i.test(n)) || nomes.find(n => /\.html?$/i.test(n)));
    let htmlBase;
    if (!entrada) {
      const principal = ['main.py', 'main.lua', 'main.js', 'main.ts', 'jogo.py', 'jogo.lua', 'jogo.js'].find(n => arqs[n]) || nomes.find(n => /\.(py|lua|js|ts)$/.test(n));
      if (!principal) return '<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;background:#111;color:#ddd;padding:30px"><h2>Projeto vazio</h2><p>Crie um arquivo <b>index.html</b> (ou main.py, main.lua, main.js).</p>';
      const ext = ASN.extensao(principal);
      const tag = ext === 'py' ? `<script type="text/python" src="${principal}"></script>` : ext === 'lua' ? `<script type="application/lua" src="${principal}"></script>` : `<script type="module" src="${principal}"></script>`;
      htmlBase = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#111;color:#eee;font-family:system-ui}canvas{display:block}</style></head><body><canvas id="tela" width="800" height="600"></canvas>${tag}</body></html>`;
      entrada = '__gerado.html';
    }
    const precisaBabel = nomes.some(n => /\.(ts|tsx|jsx)$/.test(n));
    if (precisaBabel) { avisar('Compilando TypeScript/JSX…'); await ASN.carregarScript(BABEL, 'Babel'); }
    const memo = {}, montando = new Set();
    const dataDe = (caminho) => {
      if (memo[caminho]) return memo[caminho];
      const a = arqs[caminho]; if (!a) return null;
      const ext = ASN.extensao(caminho), mime = MIME[ext] || 'text/plain';
      if (a.b64) return (memo[caminho] = `data:${mime};base64,${a.conteudo}`);
      let txt = a.conteudo || '';
      if (montando.has(caminho)) return 'data:text/javascript;base64,' + b64utf8('/* import circular: ' + caminho + ' */');
      montando.add(caminho);
      try {
        if (['ts', 'tsx', 'jsx'].includes(ext) && window.Babel) {
          const presets = [['typescript', { allExtensions: true, isTSX: ext !== 'ts' }]]; if (ext !== 'ts') presets.push('react');
          txt = window.Babel.transform(txt, { presets, filename: caminho, sourceType: 'module' }).code;
        }
        if (['js', 'mjs', 'ts', 'tsx', 'jsx'].includes(ext)) txt = reescreverImports(txt, caminho);
        if (ext === 'css') txt = reescreverCss(txt, caminho);
      } catch (e) { txt = `console.error(${JSON.stringify('Erro ao compilar ' + caminho + ': ' + e.message)})`; }
      montando.delete(caminho);
      return (memo[caminho] = `data:${mime};charset=utf-8;base64,${b64utf8(txt)}`);
    };
    const trocar = (base, ref) => { const c = ASN.resolverCaminho(base, ref); if (c === null) return null; return arqs[c] ? dataDe(c) : null; };
    function reescreverImports(txt, base) {
      return txt.replace(/(\bimport\s+(?:[\w*{}\s,$]+\s+from\s+)?|\bexport\s+(?:[\w*{}\s,$]+\s+from\s+)|\bimport\s*\(\s*)(['"])([^'"]+)\2/g, (m, pre, q, spec) => {
        if (!/^(\.{1,2}\/|\/)/.test(spec)) return m;
        const d = trocar(base, spec); return d ? pre + q + d + q : m;
      });
    }
    function reescreverCss(txt, base) { return txt.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => { const d = trocar(base, ref); return d ? `url("${d}")` : m; }); }
    let html = htmlBase || (arqs[entrada].conteudo || '');
    html = html.replace(/(<(?:script|img|audio|video|source|link|iframe|embed|track|input)\b[^>]*?\s(?:src|href|poster))\s*=\s*(['"])([^'"]+)\2/gi, (m, pre, q, ref) => { const d = trocar(entrada, ref); return d ? `${pre}=${q}${d}${q}` : m; });
    html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, b) => a + reescreverCss(css, entrada) + b);
    html = html.replace(/(<script\b(?![^>]*\bsrc=)[^>]*type=["']module["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, js, b) => a + reescreverImports(js, entrada) + b);
    // TypeScript em <script lang="ts"> / type="text/typescript"
    if (window.Babel) html = html.replace(/<script\b([^>]*)(?:type=["']text\/(?:typescript|babel|jsx)["']|lang=["']tsx?["'])([^>]*)>([\s\S]*?)<\/script>/gi, (m, a, b, code) => { try { return `<script type="module"${a}${b}>${window.Babel.transform(code, { presets: [['typescript', { allExtensions: true, isTSX: true }], 'react'], filename: 'inline.tsx' }).code}</script>`; } catch (e) { return `<script>console.error(${JSON.stringify(e.message)})</script>`; } });
    const mapa = {}; for (const n of nomes) if (!/\.html?$/.test(n)) mapa[n] = null;
    const usaLua = /type=["']application\/lua["']/i.test(html), usaPy = /type=["']text\/python["']/i.test(html);
    const mapaJs = JSON.stringify(Object.fromEntries(nomes.filter(n => !/\.html?$/.test(n)).map(n => [n, dataDe(n)])));
    const shim = `<script>(function(){
  var M=${mapaJs};
  function enviar(nivel,args){try{parent.postMessage({fonte:'as-preview',tipo:'log',nivel:nivel,texto:Array.prototype.map.call(args,function(a){try{return typeof a==='object'?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(' ')},'*')}catch(e){}}
  ['log','info','warn','error'].forEach(function(n){var o=console[n];console[n]=function(){enviar(n,arguments);o.apply(console,arguments)}});
  window.addEventListener('error',function(e){enviar('error',[(e.message||'Erro')+(e.lineno?' (linha '+e.lineno+')':'')])});
  window.addEventListener('unhandledrejection',function(e){enviar('error',['Promise: '+(e.reason&&e.reason.message||e.reason)])});
  function mapear(u){if(typeof u!=='string')return u;if(/^([a-z][a-z0-9+.-]*:|\\/\\/)/i.test(u))return u;var p=u.split('?')[0].split('#')[0].replace(/^\\.\\//,'').replace(/^\\//,'');return M[p]||u}
  window.__mapearArquivo=mapear;
  var f=window.fetch;window.fetch=function(u,o){return f.call(this,typeof u==='string'?mapear(u):u,o)};
  var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=mapear(u);return xo.apply(this,arguments)};
  [HTMLImageElement,HTMLMediaElement,HTMLScriptElement,HTMLSourceElement].forEach(function(C){var d=Object.getOwnPropertyDescriptor(C.prototype,'src');if(d&&d.set)Object.defineProperty(C.prototype,'src',{get:d.get,set:function(v){d.set.call(this,mapear(v))},configurable:true})});
  var A=window.Audio;if(A){window.Audio=function(u){var a=new A();if(u)a.src=mapear(u);return a};window.Audio.prototype=A.prototype}
  try{Object.defineProperty(window,'localStorage',{value:(function(){var s={};return{getItem:function(k){return k in s?s[k]:null},setItem:function(k,v){s[k]=String(v)},removeItem:function(k){delete s[k]},clear:function(){s={}},key:function(i){return Object.keys(s)[i]||null},get length(){return Object.keys(s).length}}})()})}catch(e){}
})();<\/script>`;
    const extraFim = (usaLua ? `<script src="${FENGARI}"><\/script>` : '') + (usaPy ? `<script src="${PYODIDE}"><\/script><script>(async function(){try{console.log('🐍 carregando Python (Pyodide)…');var py=await loadPyodide();py.setStdout({batched:function(s){console.log(s)}});py.setStderr({batched:function(s){console.error(s)}});var els=document.querySelectorAll('script[type="text/python"]');for(var i=0;i<els.length;i++){var el=els[i];var code=el.getAttribute('src')?await (await fetch(el.getAttribute('src'))).text():el.textContent;await py.runPythonAsync(code)}}catch(e){console.error(String(e))}})()<\/script>` : '');
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, m => m + '<meta charset="utf-8">' + shim);
    else html = shim + html;
    if (extraFim) html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, extraFim + '</body>') : html + extraFim;
    return html;
  };

  /* ------------------------------------------------------------------ */
  /* Compactar projeto para link (#p=…)                                  */
  /* ------------------------------------------------------------------ */
  ASN.compactar = async function (obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  ASN.descompactar = async function (txt) {
    const b = atob(txt.replace(/-/g, '+').replace(/_/g, '/')); const buf = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) buf[i] = b.charCodeAt(i);
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return JSON.parse(await new Response(ds).text());
  };

  /* ------------------------------------------------------------------ */
  /* Banco local (IndexedDB) — compartilhado entre Studio e plataforma   */
  /* ------------------------------------------------------------------ */
  let dbp = null;
  ASN.db = function () {
    if (dbp) return dbp;
    dbp = new Promise((ok, erro) => {
      const r = indexedDB.open('arcadia-studio', 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('projetos')) d.createObjectStore('projetos', { keyPath: 'id' }); if (!d.objectStoreNames.contains('publicados')) d.createObjectStore('publicados', { keyPath: 'id' }); };
      r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
    });
    return dbp;
  };
  const tx = async (loja, modo, fn) => { const d = await ASN.db(); return new Promise((ok, erro) => { const t = d.transaction(loja, modo), s = t.objectStore(loja); const r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => erro(t.error); }); };
  ASN.salvarDb = (loja, obj) => tx(loja, 'readwrite', s => s.put(obj));
  ASN.lerDb = (loja, id) => tx(loja, 'readonly', s => s.get(id));
  ASN.listarDb = (loja) => tx(loja, 'readonly', s => s.getAll());
  ASN.apagarDb = (loja, id) => tx(loja, 'readwrite', s => s.delete(id));
})();
