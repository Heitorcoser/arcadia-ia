/* =========================================================================
   ARCÁDIA STUDIO · motor dos jogos 3D
   Personagem, câmera, física simples, eventos e API de scripts
   (Lua via Fengari, ou JavaScript) parecida com a de estúdios populares:
     script.Parent.Touched:Connect(function(hit) ... end)
     Instance.new("Part", workspace)
     game:GetService("TweenService"):Create(parte, TweenInfo.new(1), {Position = Vector3.new(0, 10, 0)}):Play()
   ========================================================================= */
(function () {
  'use strict';
  const ASM = (window.ASM = {});
  const N = window.ASN;

  ASM.iniciar = async function (container, projeto, opcoes = {}) {
    const THREE = await import('three');
    const log = opcoes.log || ((nivel, txt) => console[nivel === 'error' ? 'error' : nivel === 'warn' ? 'warn' : 'log'](txt));
    const construtor = N.construtor(THREE);

    /* ---------------- Render ---------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!opcoes.captura });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 3000);
    const hemi = new THREE.HemisphereLight(0xdde8ff, 0x55503f, 0.9); cena.add(hemi);
    const amb = new THREE.AmbientLight(0x7a8090, 0.4); cena.add(amb);
    const sol = new THREE.DirectionalLight(0xffffff, 2.2); sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048); sol.shadow.camera.left = -80; sol.shadow.camera.right = 80; sol.shadow.camera.top = 80; sol.shadow.camera.bottom = -80; sol.shadow.camera.far = 400; sol.shadow.bias = -0.0005;
    cena.add(sol); cena.add(sol.target);
    function redimensionar() { const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    new ResizeObserver(redimensionar).observe(container); redimensionar();

    /* ---------------- Tipos de valor ---------------- */
    class Vector3 {
      constructor(x = 0, y = 0, z = 0) { this.X = +x || 0; this.Y = +y || 0; this.Z = +z || 0; }
      get x() { return this.X; } get y() { return this.Y; } get z() { return this.Z; }
      get Magnitude() { return Math.hypot(this.X, this.Y, this.Z); }
      get Unit() { const m = this.Magnitude || 1; return new Vector3(this.X / m, this.Y / m, this.Z / m); }
      Add(v) { return new Vector3(this.X + v.X, this.Y + v.Y, this.Z + v.Z); }
      Sub(v) { return new Vector3(this.X - v.X, this.Y - v.Y, this.Z - v.Z); }
      Mul(k) { return typeof k === 'number' ? new Vector3(this.X * k, this.Y * k, this.Z * k) : new Vector3(this.X * k.X, this.Y * k.Y, this.Z * k.Z); }
      Div(k) { return typeof k === 'number' ? new Vector3(this.X / k, this.Y / k, this.Z / k) : new Vector3(this.X / k.X, this.Y / k.Y, this.Z / k.Z); }
      Dot(v) { return this.X * v.X + this.Y * v.Y + this.Z * v.Z; }
      Cross(v) { return new Vector3(this.Y * v.Z - this.Z * v.Y, this.Z * v.X - this.X * v.Z, this.X * v.Y - this.Y * v.X); }
      Lerp(v, a) { return new Vector3(this.X + (v.X - this.X) * a, this.Y + (v.Y - this.Y) * a, this.Z + (v.Z - this.Z) * a); }
      toArray() { return [this.X, this.Y, this.Z]; }
      toString() { return `${+this.X.toFixed(3)}, ${+this.Y.toFixed(3)}, ${+this.Z.toFixed(3)}`; }
    }
    class Color3 {
      constructor(r = 0, g = 0, b = 0) { this.R = r; this.G = g; this.B = b; }
      static fromRGB(r, g, b) { return new Color3(r / 255, g / 255, b / 255); }
      static fromHex(h) { const [r, g, b] = N.hexParaRgb(h); return Color3.fromRGB(r, g, b); }
      Lerp(c, a) { return new Color3(this.R + (c.R - this.R) * a, this.G + (c.G - this.G) * a, this.B + (c.B - this.B) * a); }
      ToHex() { return N.rgbParaHex(this.R * 255, this.G * 255, this.B * 255).slice(1); }
      toHex() { return N.rgbParaHex(this.R * 255, this.G * 255, this.B * 255); }
      toString() { return `${+this.R.toFixed(3)}, ${+this.G.toFixed(3)}, ${+this.B.toFixed(3)}`; }
    }
    class UDim2 {
      constructor(xs = 0, xo = 0, ys = 0, yo = 0) { this.X = { Scale: xs, Offset: xo }; this.Y = { Scale: ys, Offset: yo }; }
      static fromScale(x, y) { return new UDim2(x, 0, y, 0); } static fromOffset(x, y) { return new UDim2(0, x, 0, y); }
      toArray() { return [this.X.Scale, this.X.Offset, this.Y.Scale, this.Y.Offset]; }
      toString() { return `{${this.X.Scale}, ${this.X.Offset}}, {${this.Y.Scale}, ${this.Y.Offset}}`; }
    }
    class Vector2 { constructor(x = 0, y = 0) { this.X = x; this.Y = y; } toArray() { return [this.X, this.Y]; } toString() { return `${this.X}, ${this.Y}`; } }
    const ENUM = {};
    for (const [tipo, lista] of Object.entries({ ...N.ENUMS, KeyCode: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['Space', 'LeftShift', 'RightShift', 'Return', 'Tab', 'Escape', 'Up', 'Down', 'Left', 'Right', 'One', 'Two', 'Three', 'Four', 'Five']), UserInputType: ['Keyboard', 'MouseButton1', 'MouseButton2', 'Touch'], EasingStyle: ['Linear', 'Quad', 'Sine', 'Back', 'Bounce', 'Elastic', 'Cubic'], EasingDirection: ['In', 'Out', 'InOut'], PartType: ['Block', 'Ball', 'Cylinder', 'Wedge'] })) {
      ENUM[tipo] = {}; for (const n of lista) ENUM[tipo][n] = { Name: n, EnumType: tipo, Value: n, toString() { return `Enum.${tipo}.${n}`; } };
    }
    const deEnum = v => (v && typeof v === 'object' && v.Name) ? v.Name : v;
    const ler = (t, k) => (typeof t === 'function' && typeof t.get === 'function') ? t.get(k) : (t ? t[k] : undefined);
    const ehLua = f => typeof f === 'function' && typeof f.invoke === 'function' && typeof f.get === 'function';

    /* ---------------- Agendador e eventos ---------------- */
    let tempo = 0; const agenda = []; let luaSpawn = null; let parado = false;
    const agendar = (t, fn, dono) => agenda.push({ t: tempo + Math.max(0, +t || 0), fn, dono });
    function chamar(f, args, dono) {
      if (dono && dono.__destruido) return;
      try {
        if (ehLua(f)) { if (luaSpawn) luaSpawn.call(f, ...args); }
        else { const r = f(...args); if (r && typeof r.catch === 'function') r.catch(e => erroScript(e, dono)); }
      } catch (e) { erroScript(e, dono); }
    }
    let scriptAtual = null;
    function erroScript(e, dono) { const m = (e && e.message) || String(e); log('error', (dono && dono.Name ? dono.Name + ': ' : '') + m); }
    class Sinal {
      constructor(nome) { this.nome = nome; this.lista = []; }
      Connect(f) { const c = { f, ativo: true, dono: scriptAtual, Disconnect() { c.ativo = false; }, get Connected() { return c.ativo; } }; this.lista.push(c); return c; }
      Once(f) { const c = this.Connect((...a) => { c.Disconnect(); return chamar(f, a, c.dono); }); return c; }
      Wait() { return new Promise(ok => { const c = this.Connect((...a) => { c.Disconnect(); ok(a[0]); }); }); }
      Fire(...a) { for (const c of [...this.lista]) if (c.ativo) chamar(c.f, a, c.dono); }
      get connect() { return this.Connect; }
    }

    /* ---------------- Instâncias ---------------- */
    const malhas = new Map(); // inst -> mesh
    const todas = new Set();
    const METODOS = {};
    class Inst {
      constructor(classe, nome, props) {
        this.ClassName = classe; this.Name = nome || classe; this.props = props || N.copia((N.CLASSES[classe] || { props: {} }).props);
        this.filhos = []; this.pai = null; this.sinais = {}; this.__destruido = false; this.id = N.novoId();
        this.p = new Proxy(this, MANIPULADOR); todas.add(this);
      }
      sinal(n) { return this.sinais[n] || (this.sinais[n] = new Sinal(n)); }
      toString() { return this.Name; }
    }
    const ehParteC = c => N.EH_PARTE(c) || c === '__Limb';
    const emMundo = i => { let x = i; while (x) { if (x === workspace) return true; x = x.pai; } return false; };
    const emUI = i => { let x = i; while (x) { if (x.ClassName === 'PlayerGui') return true; x = x.pai; } return false; };
    const inst = v => (v && v.__inst) ? v.__inst : (v instanceof Inst ? v : null);
    function paraJs(nome, v, i) {
      if (Array.isArray(v)) {
        if (v.length === 3) return new Vector3(...v);
        if (v.length === 4) return new UDim2(...v);
        if (v.length === 2) return new Vector2(...v);
      }
      if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) && /Color/.test(nome)) return Color3.fromHex(v);
      if (N.ENUMS[nome] && ENUM[nome] && ENUM[nome][v]) return ENUM[nome][v];
      return v;
    }
    function deJs(nome, v, atual) {
      v = deEnum(v);
      if (v instanceof Vector3 || (v && typeof v === 'object' && 'X' in v && 'Y' in v && 'Z' in v)) return [+v.X, +v.Y, +v.Z];
      if (v instanceof UDim2) return v.toArray();
      if (v instanceof Vector2) return v.toArray();
      if (v instanceof Color3 || (v && typeof v === 'object' && 'R' in v && 'G' in v)) return N.rgbParaHex(v.R * 255, v.G * 255, v.B * 255);
      if (typeof atual === 'number') return +v;
      if (typeof atual === 'boolean') return !!v;
      return v;
    }
    const MANIPULADOR = {
      get(t, k) {
        if (k === '__inst') return t;
        if (typeof k === 'symbol') return t[k];
        if (k === 'Name') return t.Name; if (k === 'ClassName') return t.ClassName === '__Limb' ? 'Part' : t.ClassName; if (k === 'Parent') return t.pai ? t.pai.p : undefined;
        if (k === 'toString') return () => t.Name;
        if (k === 'CFrame' && ehParteC(t.ClassName)) return { Position: new Vector3(...t.props.Position), toString() { return String(this.Position); } };
        if (k === 'Orientation' || k === 'Rotation') { if (t.props.Orientation) return new Vector3(...t.props.Orientation); }
        if (k === 'Velocity' || k === 'AssemblyLinearVelocity') return new Vector3(...(t.vel || [0, 0, 0]));
        if (k === 'BrickColor') return { Name: t.props.Color, Color: Color3.fromHex(t.props.Color) };
        if (k in t.props) return paraJs(k, t.props[k], t);
        if (EVENTOS[k]) return t.sinal(k);
        if (METODOS[k]) return METODOS[k];
        if (k === 'Character' && t.ClassName === 'Player') return t.personagem ? t.personagem.p : undefined;
        if (k === 'RespawnLocation' && t.ClassName === 'Player') return t.respawn ? t.respawn.p : undefined;
        if (k === 'LocalPlayer' && t.ClassName === 'Players') return jogador ? jogador.p : undefined;
        if (k === 'CurrentCamera' && t === workspace) return cameraApi;
        if (k === 'Position' && t.ClassName === 'Model') { const b = caixaModelo(t); return b ? new Vector3(...b.centro) : new Vector3(); }
        const filho = t.filhos.find(f => f.Name === k);
        if (filho) return filho.p;
        return undefined;
      },
      set(t, k, v) {
        if (t.__destruido) return true;
        if (k === 'Name') { t.Name = String(v); return true; }
        if (k === 'Parent') { reparentar(t, inst(v)); return true; }
        if (k === 'Rotation') k = 'Orientation';
        if (k === 'CFrame' && v && v.Position) { k = 'Position'; v = v.Position; }
        if (k === 'Velocity' || k === 'AssemblyLinearVelocity') { t.vel = deJs(k, v, [0, 0, 0]); return true; }
        if (k === 'BrickColor') { k = 'Color'; v = ler(v, 'Color') || v; }
        if (k === 'RespawnLocation' && t.ClassName === 'Player') { t.respawn = inst(v); return true; }
        if (k in t.props) { definir(t, k, deJs(k, v, t.props[k])); return true; }
        t[k] = v; return true;
      },
      has(t, k) { return k === '__inst' || k in t.props || !!EVENTOS[k] || !!METODOS[k] || ['Name', 'ClassName', 'Parent'].includes(k) || t.filhos.some(f => f.Name === k); },
    };
    const EVENTOS = { Touched: 1, TouchEnded: 1, MouseButton1Click: 1, Activated: 1, MouseEnter: 1, MouseLeave: 1, Changed: 1, ChildAdded: 1, ChildRemoved: 1, Died: 1, HealthChanged: 1, Destroying: 1, Ended: 1, CharacterAdded: 1 };
    function definir(t, k, v) {
      if (t.props[k] === v && !Array.isArray(v)) return;
      t.props[k] = v;
      if (ehParteC(t.ClassName) || t.ClassName === '__Limb') atualizarParte(t);
      if (N.EH_UI(t.ClassName) || t.ClassName === 'ScreenGui') atualizarUI(t);
      if (t.ClassName === 'PointLight' || t.ClassName === 'BillboardText') anexos(t.pai);
      if (t.ClassName === 'Sound' && k === 'Playing') { v ? tocarSom(t) : pararSom(t); }
      if (t.ClassName === 'Humanoid' && k === 'Health') { t.props.Health = Math.max(0, Math.min(t.props.MaxHealth, v)); t.sinal('HealthChanged').Fire(t.props.Health); if (t.props.Health <= 0) morrer(t); }
      if (t.ClassName === 'Lighting') aplicarLuz();
      if (t.sinaisProp && t.sinaisProp[k]) t.sinaisProp[k].Fire();
      if (/Value$/.test(t.ClassName) && k === 'Value') t.sinal('Changed').Fire(v);
      else if (t.sinais.Changed) t.sinal('Changed').Fire(k);
    }
    function reparentar(t, novo) {
      if (t.pai === novo) return;
      const estavaMundo = emMundo(t);
      if (t.pai) { t.pai.filhos = t.pai.filhos.filter(f => f !== t); t.pai.sinais.ChildRemoved && t.pai.sinal('ChildRemoved').Fire(t.p); if (ehParteC(t.pai.ClassName)) anexos(t.pai); }
      t.pai = novo || null;
      if (novo) { novo.filhos.push(t); novo.sinais.ChildAdded && novo.sinal('ChildAdded').Fire(t.p); if (ehParteC(novo.ClassName)) anexos(novo); }
      const agoraMundo = emMundo(t);
      percorrerInst(t, i => {
        if (ehParteC(i.ClassName)) { if (agoraMundo) garantirMalha(i); else removerMalha(i); }
        if (i.ClassName === 'Script' && (agoraMundo || emUI(i) || dentroDe(i, sss))) iniciarScript(i);
        if ((N.EH_UI(i.ClassName) || i.ClassName === 'ScreenGui')) atualizarUI(i);
      });
      if (estavaMundo !== agoraMundo) colisaoSuja = true;
    }
    const dentroDe = (i, alvo) => { let x = i; while (x) { if (x === alvo) return true; x = x.pai; } return false; };
    function percorrerInst(i, fn) { fn(i); for (const f of [...i.filhos]) percorrerInst(f, fn); }
    function destruir(t) {
      if (t.__destruido) return;
      t.sinais.Destroying && t.sinal('Destroying').Fire();
      for (const f of [...t.filhos]) destruir(f);
      if (t.pai) { t.pai.filhos = t.pai.filhos.filter(f => f !== t); if (ehParteC(t.pai.ClassName)) anexos(t.pai); }
      t.pai = null; t.__destruido = true; removerMalha(t); removerUI(t); pararSom(t); todas.delete(t); colisaoSuja = true;
      for (const s of Object.values(t.sinais)) s.lista = [];
    }
    function clonar(t) {
      const c = new Inst(t.ClassName, t.Name, N.copia(t.props));
      if (t.ClassName === 'Script') c.fonte = t.fonte;
      for (const f of t.filhos) { const cf = clonar(f); cf.pai = c; c.filhos.push(cf); }
      return c;
    }
    function caixaModelo(m) {
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]; let achou = false;
      percorrerInst(m, i => { if (ehParteC(i.ClassName)) { achou = true; const p = i.props.Position, s = i.props.Size; for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k] - s[k] / 2); max[k] = Math.max(max[k], p[k] + s[k] / 2); } } });
      return achou ? { min, max, centro: [0, 1, 2].map(k => (min[k] + max[k]) / 2) } : null;
    }
    Object.assign(METODOS, {
      FindFirstChild(nome, rec) { const t = inst(this); if (!t) return; if (!rec) { const f = t.filhos.find(f => f.Name === nome); return f ? f.p : undefined; } let r; percorrerInst(t, i => { if (!r && i !== t && i.Name === nome) r = i; }); return r ? r.p : undefined; },
      FindFirstChildOfClass(c) { const t = inst(this); const f = t && t.filhos.find(f => f.ClassName === c); return f ? f.p : undefined; },
      FindFirstChildWhichIsA(c) { const t = inst(this); const f = t && t.filhos.find(f => f.ClassName === c || (c === 'BasePart' && ehParteC(f.ClassName))); return f ? f.p : undefined; },
      FindFirstAncestor(nome) { let x = inst(this).pai; while (x) { if (x.Name === nome) return x.p; x = x.pai; } },
      WaitForChild(nome, limite) {
        const t = inst(this); const ini = tempo; let avisou = false;
        return new Promise(ok => { const ver = () => { const f = t && t.filhos.find(f => f.Name === nome); if (f) return ok(f.p); if (limite && tempo - ini > limite) return ok(undefined); if (!avisou && tempo - ini > 5) { avisou = true; log('warn', `WaitForChild("${nome}") ainda esperando em ${t && t.Name}…`); } agendar(0.03, ver); }; ver(); });
      },
      GetChildren() { return inst(this).filhos.map(f => f.p); },
      GetDescendants() { const r = []; percorrerInst(inst(this), i => r.push(i.p)); r.shift(); return r; },
      IsA(c) { const t = inst(this); return t.ClassName === c || (c === 'BasePart' && ehParteC(t.ClassName)) || (c === 'GuiObject' && N.EH_UI(t.ClassName)) || (c === 'ValueBase' && /Value$/.test(t.ClassName)) || c === 'Instance'; },
      IsDescendantOf(a) { return dentroDe(inst(this).pai, inst(a)); },
      Destroy() { destruir(inst(this)); },
      Remove() { destruir(inst(this)); },
      ClearAllChildren() { for (const f of [...inst(this).filhos]) destruir(f); },
      Clone() { return clonar(inst(this)).p; },
      GetFullName() { const n = []; let x = inst(this); while (x && x !== dm) { n.unshift(x.Name); x = x.pai; } return n.join('.'); },
      GetPropertyChangedSignal(p) { const t = inst(this); t.sinaisProp = t.sinaisProp || {}; return t.sinaisProp[p] || (t.sinaisProp[p] = new Sinal(p)); },
      GetAttribute(n) { const t = inst(this); return (t.attr || {})[n]; },
      SetAttribute(n, v) { const t = inst(this); (t.attr = t.attr || {})[n] = v; },
      GetService(n) { const s = servicos[n]; if (!s) log('warn', 'Serviço desconhecido: ' + n); return s ? s.p || s : undefined; },
      // partes / modelos
      MoveTo(v) { const t = inst(this); const b = caixaModelo(t); if (!b) return; const alvo = deJs('Position', v); const d = [alvo[0] - b.centro[0], alvo[1] - (b.min[1]) , alvo[2] - b.centro[2]]; percorrerInst(t, i => { if (ehParteC(i.ClassName)) definir(i, 'Position', i.props.Position.map((x, k) => x + d[k])); }); },
      PivotTo(cf) { METODOS.MoveTo.call(this, cf && cf.Position ? cf.Position : cf); },
      GetPivot() { const b = caixaModelo(inst(this)); return { Position: new Vector3(...(b ? b.centro : [0, 0, 0])) }; },
      GetTouchingParts() { const t = inst(this); const a = aabbDe(t); return [...todas].filter(i => i !== t && ehParteC(i.ClassName) && emMundo(i) && sobrepoe(a, aabbDe(i), 0.05)).map(i => i.p); },
      // humanoide
      TakeDamage(n) { const t = inst(this); if (t.ClassName === 'Humanoid' && !(t.pai && t.pai.ff)) definir(t, 'Health', t.props.Health - (+n || 0)); },
      Move(dir) { const t = inst(this); t.moveScript = deJs('Position', dir); },
      MoveToPos(v) { },
      // jogador
      LoadCharacter() { if (jogador) renascer(); },
      Kick(msg) { mensagemFinal(msg || 'Você foi removido do jogo.'); },
      GetPlayers() { return jogador ? [jogador.p] : []; },
      GetPlayerFromCharacter(c) { return jogador && inst(c) === jogador.personagem ? jogador.p : undefined; },
      // som
      Play() { const t = inst(this); if (t.ClassName === 'Sound') { t.props.Playing = true; tocarSom(t); } else if (t.tween) t.tween.play(); },
      Stop() { const t = inst(this); if (t.ClassName === 'Sound') { t.props.Playing = false; pararSom(t); } },
      Pause() { METODOS.Stop.call(this); },
      Resume() { METODOS.Play.call(this); },
      // Debris
      AddItem(obj, t) { const i = inst(obj); if (i) agendar(t || 10, () => destruir(i)); },
      // TweenService
      Create(obj, info, alvo) { return criarTween(inst(obj), info || {}, alvo); },
      // UserInputService
      IsKeyDown(k) { return !!teclas[deEnum(k)]; },
      // RunService
      IsStudio() { return !!opcoes.studio; }, IsClient() { return true; }, IsServer() { return true; }, IsRunning() { return true; },
    });

    /* ---------------- Árvore inicial ---------------- */
    function deDados(no) {
      const i = new Inst(no.ClassName, no.Name, N.copia(no.props || {}));
      if (no.ClassName === 'Script') i.fonte = no.props.Source || '';
      for (const f of no.children || []) { const c = deDados(f); c.pai = i; i.filhos.push(c); }
      return i;
    }
    const dm = deDados(projeto.cena || N.cenaPadrao());
    dm.ClassName = 'DataModel'; dm.Name = projeto.nome || 'Jogo';
    const serv = n => dm.filhos.find(f => f.ClassName === n) || (() => { const s = new Inst(n, n); s.pai = dm; dm.filhos.push(s); return s; })();
    const workspace = serv('Workspace'), players = serv('Players'), lighting = serv('Lighting'), rs = serv('ReplicatedStorage'), sss = serv('ServerScriptService'), sg = serv('StarterGui'), soundService = serv('SoundService');
    const svc = (nome) => { const s = new Inst(nome, nome, {}); return s; };
    const runService = svc('RunService'), uis = svc('UserInputService'), tweenService = svc('TweenService'), debris = svc('Debris');
    const servicos = { Workspace: workspace, Players: players, Lighting: lighting, ReplicatedStorage: rs, ServerScriptService: sss, StarterGui: sg, SoundService: soundService, RunService: runService, UserInputService: uis, TweenService: tweenService, Debris: debris };
    EVENTOS.MouseClick = 1;
    EVENTOS.Heartbeat = EVENTOS.RenderStepped = EVENTOS.Stepped = EVENTOS.InputBegan = EVENTOS.InputEnded = EVENTOS.PlayerAdded = EVENTOS.PlayerRemoving = 1;
    const cameraApi = { get CFrame() { return { Position: new Vector3(camera.position.x, camera.position.y, camera.position.z) }; }, get FieldOfView() { return camera.fov; }, set FieldOfView(v) { camera.fov = v; camera.updateProjectionMatrix(); } };
    const gameApi = dm.p;
    METODOS.GetService = function (n) { const s = servicos[n]; if (!s) { log('warn', 'Serviço desconhecido: ' + n); return; } return s.p; };
    for (const [n, s] of Object.entries(servicos)) if (!dm.filhos.includes(s)) { /* serviços virtuais acessíveis por game.X */ dm.virtuais = dm.virtuais || {}; dm.virtuais[n] = s; }
    const getOrig = MANIPULADOR.get;
    MANIPULADOR.get = function (t, k) { if (t === dm && dm.virtuais && dm.virtuais[k]) return dm.virtuais[k].p; if (t === dm && k === 'Workspace') return workspace.p; return getOrig(t, k); };

    /* ---------------- Malhas e anexos ---------------- */
    function garantirMalha(i) {
      if (malhas.has(i)) return atualizarParte(i);
      const m = construtor.criarMalha({ id: i.id, props: i.props }); m.userData.inst = i; cena.add(m); malhas.set(i, m); anexos(i); colisaoSuja = true;
    }
    function atualizarParte(i) {
      const m = malhas.get(i); if (!m) return;
      construtor.aplicar(m, { props: i.props }); i.aabb = null; if (i.props.Anchored) colisaoSuja = true;
    }
    function removerMalha(i) {
      const m = malhas.get(i); if (!m) return; cena.remove(m); malhas.delete(i);
      if (m.material) m.material.dispose(); colisaoSuja = true;
    }
    function anexos(parte) {
      if (!parte) return; const m = malhas.get(parte); if (!m) return;
      for (const c of [...m.children]) { m.remove(c); if (c.material && c.material.map) c.material.map.dispose(); }
      for (const f of parte.filhos) {
        if (f.ClassName === 'PointLight' && f.props.Enabled) { const l = new THREE.PointLight(f.props.Color, f.props.Brightness * 3, f.props.Range, 1.6); m.add(l); compensar(l, m); }
        if (f.ClassName === 'BillboardText' && f.props.Enabled) { const sp = construtor.spriteTexto(f.props); m.add(sp); compensar(sp, m, f.props.StudsOffset); }
      }
    }
    function compensar(obj, m, off = [0, 0, 0]) {
      // anexos não devem herdar a escala da parte
      obj.scale.divide(m.scale); obj.position.set(off[0] / m.scale.x, off[1] / m.scale.y, off[2] / m.scale.z);
      if (obj.isSprite) obj.material.sizeAttenuation = true;
    }

    /* ---------------- Iluminação ---------------- */
    function aplicarLuz() {
      const L = lighting.props, h = ((L.ClockTime % 24) + 24) % 24;
      const ang = (h - 6) / 12 * Math.PI; // 6h nasce, 18h se põe
      const dia = Math.max(0, Math.sin(ang));
      const ceu = new THREE.Color(L.SkyColor || '#8ec5ff');
      const noite = new THREE.Color('#0b1026');
      const corCeu = noite.clone().lerp(ceu, Math.min(1, dia * 1.6 + 0.05));
      if (h > 5 && h < 7.5 || h > 16.5 && h < 19) corCeu.lerp(new THREE.Color('#ff9a62'), 0.35 * (1 - Math.abs(dia - 0.25) * 2));
      cena.background = corCeu;
      cena.fog = new THREE.Fog(new THREE.Color(L.FogColor || '#c9dcf0').lerp(corCeu, 0.5), (L.FogEnd || 900) * 0.25, L.FogEnd || 900);
      sol.intensity = (L.Brightness ?? 2) * (0.15 + dia * 1.05); sol.castShadow = L.GlobalShadows !== false;
      hemi.intensity = 0.3 + dia * 0.7; amb.color.set(L.Ambient || '#7a8090'); amb.intensity = 0.35 + (1 - dia) * 0.2;
      sol.userData.dir = new THREE.Vector3(Math.cos(ang) * 0.8, Math.max(0.15, Math.sin(ang)), 0.45).normalize();
    }
    aplicarLuz();

    /* ---------------- Áudio ---------------- */
    let AC = null;
    const ctxAudio = () => { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} return AC; };
    function tom(f, d, tipo = 'square', v = 0.15, f2, atraso = 0) {
      const a = ctxAudio(); if (!a) return; const t = a.currentTime + atraso, o = a.createOscillator(), g = a.createGain();
      o.type = tipo; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.05);
    }
    function ruido(d, v = 0.3, freq = 800) {
      const a = ctxAudio(); if (!a) return; const n = a.sampleRate * d, b = a.createBuffer(1, n, a.sampleRate), dd = b.getChannelData(0);
      for (let i = 0; i < n; i++) dd[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = v; s.connect(f).connect(g).connect(a.destination); s.start();
    }
    const PRONTOS = {
      coin: v => { tom(988, 0.08, 'square', v * 0.4); tom(1319, 0.25, 'square', v * 0.4, null, 0.07); },
      jump: v => tom(300, 0.18, 'square', v * 0.3, 700),
      explosion: v => { ruido(0.7, v, 500); tom(80, 0.5, 'sine', v * 0.6, 30); },
      hit: v => { ruido(0.12, v * 0.6, 1200); tom(160, 0.1, 'square', v * 0.3, 80); },
      win: v => [523, 659, 784, 1046].forEach((f, i) => tom(f, 0.3, 'triangle', v * 0.4, null, i * 0.12)),
      lose: v => [392, 330, 262].forEach((f, i) => tom(f, 0.35, 'sawtooth', v * 0.25, null, i * 0.18)),
      click: v => tom(1200, 0.04, 'square', v * 0.25),
      powerup: v => tom(300, 0.5, 'square', v * 0.3, 1500),
      laser: v => tom(1500, 0.25, 'sawtooth', v * 0.25, 200),
    };
    const MUSICA = [262, 330, 392, 330, 349, 440, 523, 440, 392, 330, 294, 247];
    function tocarSom(s) {
      const v = (s.props.Volume ?? 0.5) * (soundService.props.Volume ?? 0.6) * 2; const id = String(s.props.SoundId || '');
      pararSom(s);
      if (PRONTOS[id]) { PRONTOS[id](v); if (s.props.Looped) s.loop = setInterval(() => PRONTOS[id](v), 900); else agendar(1, () => { s.props.Playing = false; s.sinal('Ended').Fire(); }); return; }
      if (id === 'music') { let i = 0; const passo = () => { tom(MUSICA[i % MUSICA.length], 0.25, 'triangle', v * 0.25); if (i % 2 === 0) tom(MUSICA[i % MUSICA.length] / 2, 0.4, 'sine', v * 0.2); i++; }; passo(); s.loop = setInterval(passo, 260 / (s.props.PlaybackSpeed || 1)); return; }
      if (/^(https?:|data:)/.test(id)) { const a = new Audio(id); a.volume = Math.min(1, v / 2); a.loop = !!s.props.Looped; a.playbackRate = s.props.PlaybackSpeed || 1; a.play().catch(() => {}); a.onended = () => { s.props.Playing = false; s.sinal('Ended').Fire(); }; s.audio = a; return; }
      if (id) log('warn', `Som "${id}" não existe. Use: ${N.SONS_PRONTOS.join(', ')} ou uma URL`);
    }
    function pararSom(s) { if (s.loop) { clearInterval(s.loop); s.loop = null; } if (s.audio) { s.audio.pause(); s.audio = null; } }

    /* ---------------- Interface (ScreenGui) ---------------- */
    const camadaUI = document.createElement('div'); camadaUI.className = 'as-ui'; container.appendChild(camadaUI);
    const domUI = new Map();
    const FONTES = { 'Padrão': '"Segoe UI",system-ui,sans-serif', 'Arredondada': '"Baloo 2","Comic Sans MS",system-ui,sans-serif', 'Mono': 'Consolas,monospace', 'Serifada': 'Georgia,serif', 'Pixel': '"Courier New",monospace' };
    function atualizarUI(i) {
      if (!(N.EH_UI(i.ClassName) || i.ClassName === 'ScreenGui')) return;
      if (!emUI(i)) { removerUI(i); return; }
      let el = domUI.get(i);
      if (!el) {
        el = document.createElement(i.ClassName === 'TextButton' ? 'button' : i.ClassName === 'ImageLabel' ? 'img' : 'div');
        el.className = 'as-el as-' + i.ClassName; domUI.set(i, el);
        if (i.ClassName === 'TextButton') { el.addEventListener('click', ev => { ev.stopPropagation(); i.sinal('MouseButton1Click').Fire(); i.sinal('Activated').Fire(); }); el.addEventListener('mouseenter', () => i.sinal('MouseEnter').Fire()); el.addEventListener('mouseleave', () => i.sinal('MouseLeave').Fire()); }
      }
      const pai = i.pai && domUI.get(i.pai) ? domUI.get(i.pai) : camadaUI;
      if (el.parentNode !== pai) pai.appendChild(el);
      const p = i.props, st = el.style;
      if (i.ClassName === 'ScreenGui') { st.cssText = 'position:absolute;inset:0;pointer-events:none;'; st.display = p.Enabled === false ? 'none' : 'block'; return; }
      const [xs, xo, ys, yo] = p.Position || [0, 0, 0, 0], [ws, wo, hs, ho] = p.Size || [0, 100, 0, 40], [ax, ay] = p.AnchorPoint || [0, 0];
      st.position = 'absolute'; st.left = `calc(${xs * 100}% + ${xo}px)`; st.top = `calc(${ys * 100}% + ${yo}px)`;
      st.width = `calc(${ws * 100}% + ${wo}px)`; st.height = `calc(${hs * 100}% + ${ho}px)`;
      st.transform = `translate(${-ax * 100}%, ${-ay * 100}%)`; st.display = p.Visible === false ? 'none' : (i.ClassName === 'ImageLabel' ? 'block' : 'flex');
      st.zIndex = p.ZIndex || 1; st.borderRadius = (p.CornerRadius ?? 8) + 'px'; st.pointerEvents = i.ClassName === 'TextButton' ? 'auto' : 'none';
      const [r, g, b] = N.hexParaRgb(p.BackgroundColor3); st.background = `rgba(${r},${g},${b},${1 - (p.BackgroundTransparency ?? 0)})`;
      if ('Text' in p) {
        const [tr, tg, tb] = N.hexParaRgb(p.TextColor3); st.color = `rgba(${tr},${tg},${tb},${1 - (p.TextTransparency || 0)})`;
        st.fontSize = (p.TextSize || 20) + 'px'; st.fontFamily = FONTES[p.Font] || FONTES['Padrão']; st.fontWeight = '700';
        st.alignItems = 'center'; st.justifyContent = p.TextXAlignment === 'Left' ? 'flex-start' : p.TextXAlignment === 'Right' ? 'flex-end' : 'center'; st.textAlign = (p.TextXAlignment || 'center').toLowerCase();
        st.padding = '0 8px'; st.boxSizing = 'border-box'; st.whiteSpace = 'pre-wrap'; st.overflow = 'hidden';
        if (el.textContent !== String(p.Text)) el.textContent = String(p.Text);
      }
      if (i.ClassName === 'ImageLabel' && el.getAttribute('src') !== p.Image) { if (p.Image) el.src = p.Image; st.objectFit = 'contain'; }
      for (const f of i.filhos) atualizarUI(f);
    }
    function removerUI(i) { const el = domUI.get(i); if (el) { el.remove(); domUI.delete(i); } }

    /* ---------------- Tweens ---------------- */
    const tweens = new Set();
    const EASE = {
      Linear: t => t, Quad: t => t * t, Cubic: t => t * t * t, Sine: t => 1 - Math.cos(t * Math.PI / 2),
      Back: t => t * t * (2.70158 * t - 1.70158), Elastic: t => t === 0 || t === 1 ? t : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * 2 * Math.PI / 3),
      Bounce: t => { t = 1 - t; const n = 7.5625, d = 2.75; let r; if (t < 1 / d) r = n * t * t; else if (t < 2 / d) r = n * (t -= 1.5 / d) * t + 0.75; else if (t < 2.5 / d) r = n * (t -= 2.25 / d) * t + 0.9375; else r = n * (t -= 2.625 / d) * t + 0.984375; return 1 - r; },
    };
    const facilitar = (estilo, dir, t) => { const f = EASE[estilo] || EASE.Quad; if (dir === 'In') return f(t); if (dir === 'InOut') return t < 0.5 ? f(t * 2) / 2 : 1 - f((1 - t) * 2) / 2; return 1 - f(1 - t); };
    const PROPS_TWEEN = ['Position', 'Size', 'Orientation', 'Rotation', 'Color', 'Transparency', 'BackgroundColor3', 'BackgroundTransparency', 'TextColor3', 'TextTransparency', 'TextSize', 'Brightness', 'Range', 'ClockTime', 'Volume', 'Value', 'FogEnd'];
    function criarTween(i, info, alvoT) {
      const alvo = {};
      for (const k of PROPS_TWEEN) { const v = ler(alvoT, k); if (v !== undefined && v !== null) { const kk = k === 'Rotation' ? 'Orientation' : k; if (i && kk in i.props) alvo[kk] = deJs(kk, v, i.props[kk]); } }
      const tw = { inst: i, info, alvo, ini: null, t: 0, rodando: false, volta: false, rep: 0, Completed: new Sinal('Completed') };
      tw.play = () => { if (!i) return; tw.ini = Object.fromEntries(Object.keys(alvo).map(k => [k, N.copia(i.props[k])])); tw.t = -(+ler(info, 'DelayTime') || 0); tw.rodando = true; tw.volta = false; tweens.add(tw); };
      const api = { Play: () => tw.play(), Cancel: () => { tw.rodando = false; tweens.delete(tw); }, Pause: () => { tw.rodando = false; }, Completed: tw.Completed, get PlaybackState() { return tw.rodando ? 'Playing' : 'Completed'; } };
      api.play = api.Play; return api;
    }
    function passoTweens(dt) {
      for (const tw of [...tweens]) {
        if (!tw.rodando || tw.inst.__destruido) { tweens.delete(tw); continue; }
        const dur = Math.max(0.0001, +ler(tw.info, 'Time') || 1); tw.t += dt; if (tw.t < 0) continue;
        let a = Math.min(1, tw.t / dur); const e = facilitar(deEnum(ler(tw.info, 'EasingStyle')) || 'Quad', deEnum(ler(tw.info, 'EasingDirection')) || 'Out', tw.volta ? 1 - a : a);
        for (const [k, fim] of Object.entries(tw.alvo)) {
          const ini = tw.ini[k];
          let v;
          if (typeof fim === 'number') v = ini + (fim - ini) * e;
          else if (Array.isArray(fim)) v = fim.map((x, j) => ini[j] + (x - ini[j]) * e);
          else if (typeof fim === 'string' && fim[0] === '#') { const c1 = N.hexParaRgb(ini), c2 = N.hexParaRgb(fim); v = N.rgbParaHex(...c1.map((x, j) => x + (c2[j] - x) * e)); }
          else v = a >= 1 ? fim : ini;
          definir(tw.inst, k, v);
        }
        if (a >= 1) {
          const reverte = !!ler(tw.info, 'Reverses'), rep = +ler(tw.info, 'RepeatCount') || 0;
          if (reverte && !tw.volta) { tw.volta = true; tw.t = 0; continue; }
          if (rep < 0 || tw.rep < rep) { tw.rep++; tw.t = 0; tw.volta = false; continue; }
          tw.rodando = false; tweens.delete(tw); tw.Completed.Fire('Completed');
        }
      }
    }

    /* ---------------- Jogador e personagem ---------------- */
    let jogador = null, personagem = null, humanoide = null, raiz = null;
    // avatar do jogador (criador de personagem do Studio): corpo com juntas e animações
    const AV = N.avatar ? N.avatar.normalizar(opcoes.avatar || null) : null;
    let avatarObj = null, animAv = null;
    const corpo = {}; // partes visuais
    const estado = { pos: new THREE.Vector3(0, 5, 0), vel: new THREE.Vector3(), chao: false, plataforma: null, yaw: 0, morto: false, animT: 0, pulando: false };
    const DIM = { w: 2, h: 5, d: 1.4 };
    function criarJogador() {
      jogador = new Inst('Player', opcoes.nomeJogador || 'Jogador', { UserId: 1, DisplayName: opcoes.nomeJogador || 'Jogador' });
      jogador.pai = players; players.filhos.push(jogador);
      const pg = new Inst('PlayerGui', 'PlayerGui', {}); pg.pai = jogador; jogador.filhos.push(pg); jogador.gui = pg;
    }
    function criarPersonagem() {
      if (personagem) destruir(personagem);
      personagem = new Inst('Model', jogador.Name, {}); jogador.personagem = personagem;
      const limb = (nome, tam, cor) => { const l = new Inst('__Limb', nome, { Position: [0, 0, 0], Size: tam, Orientation: [0, 0, 0], Color: cor, Material: 'SmoothPlastic', Transparency: 0, Anchored: true, CanCollide: false, Shape: 'Block', CastShadow: true }); l.pai = personagem; personagem.filhos.push(l); return l; };
      raiz = limb('HumanoidRootPart', [2, 2, 1], '#ffffff'); raiz.props.Transparency = 1;
      const pele = AV ? AV.pele : '#ffcf9e', camisa = AV ? AV.camisa : (opcoes.corCamisa || '#3b82f6'), calca = AV ? AV.calca : (opcoes.corCalca || '#1e3a8a');
      corpo.cabeca = limb('Head', [1.2, 1.2, 1.2], pele);
      corpo.tronco = limb('Torso', [2, 2, 1], camisa);
      corpo.be = limb('Left Arm', [1, 2, 1], pele); corpo.bd = limb('Right Arm', [1, 2, 1], pele);
      corpo.pe = limb('Left Leg', [1, 2, 1], calca); corpo.pd = limb('Right Leg', [1, 2, 1], calca);
      humanoide = new Inst('Humanoid', 'Humanoid', { Health: 100, MaxHealth: 100, WalkSpeed: players.props.CharacterWalkSpeed ?? 16, JumpPower: players.props.CharacterJumpPower ?? 50 });
      humanoide.pai = personagem; personagem.filhos.push(humanoide);
      personagem.pai = workspace; workspace.filhos.push(personagem);
      for (const l of personagem.filhos) if (l.ClassName === '__Limb') garantirMalha(l);
      // rosto
      const cab = malhas.get(corpo.cabeca); const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(18, 22, 7, 10); g.fillRect(39, 22, 7, 10); g.lineWidth = 4; g.strokeStyle = '#222'; g.beginPath(); g.arc(32, 36, 12, 0.2, Math.PI - 0.2); g.stroke();
      const rosto = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); rosto.position.z = -0.51; rosto.rotation.y = Math.PI; cab.add(rosto);
      if (avatarObj) { cena.remove(avatarObj.grupo); avatarObj.dispose(); avatarObj = null; }
      if (AV) { avatarObj = N.avatar.construir(THREE, AV); cena.add(avatarObj.grupo); animAv = N.avatar.animador(AV); animAv.definir('parado'); }
      estado.morto = false; estado.vel.set(0, 0, 0); estado.emote = false;
      posicionarNoSpawn();
      jogador.sinal('CharacterAdded').Fire(personagem.p);
      personagem.ff = true; agendar(2, () => { if (personagem) personagem.ff = false; });
    }
    function posicionarNoSpawn() {
      let sp = jogador.respawn && emMundo(jogador.respawn) ? jogador.respawn : null;
      if (!sp) { const lista = [...todas].filter(i => i.ClassName === 'SpawnLocation' && emMundo(i)); sp = lista[0]; }
      if (sp) estado.pos.set(sp.props.Position[0], sp.props.Position[1] + sp.props.Size[1] / 2 + 0.05, sp.props.Position[2]);
      else estado.pos.set(0, 10, 0);
      estado.vel.set(0, 0, 0);
    }
    function morrer(h) {
      if (h !== humanoide || estado.morto) return;
      estado.morto = true; h.sinal('Died').Fire(); som('lose');
      if (avatarObj) avatarObj.grupo.visible = false; // as partes "de bloco" (com as cores do avatar) se desmontam
      for (const k of ['cabeca', 'tronco', 'be', 'bd', 'pe', 'pd']) { const m = malhas.get(corpo[k]); if (m) m.visible = true; }
      for (const k of ['cabeca', 'tronco', 'be', 'bd', 'pe', 'pd']) { const l = corpo[k]; l.vel = [(Math.random() - 0.5) * 30, 15 + Math.random() * 20, (Math.random() - 0.5) * 30]; l.rotVel = [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10]; }
      agendar(players.props.RespawnTime ?? 3, renascer);
    }
    function renascer() {
      if (!jogador) return;
      criarPersonagem();
      for (const g of [...jogador.gui.filhos]) if (g.props.ResetOnSpawn !== false) destruir(g);
      copiarGui(true);
    }
    function copiarGui(soResetaveis) {
      for (const g of sg.filhos) {
        if (soResetaveis && g.props.ResetOnSpawn === false) continue;
        const c = clonar(g); reparentar(c, jogador.gui);
      }
    }
    const som = n => PRONTOS[n] && PRONTOS[n](0.6);

    /* ---------------- Colisão ---------------- */
    let colisaoSuja = true, solidos = [];
    function aabbDe(i) {
      if (i.aabb && i.aabbPos === i.props.Position && !i.vel) return i.aabb;
      const m = malhas.get(i);
      let min, max;
      if (m && (i.props.Orientation || [0, 0, 0]).some(v => Math.abs(v % 360) > 0.01)) {
        const b = new THREE.Box3().setFromObject(m); min = b.min.toArray(); max = b.max.toArray();
      } else {
        const p = i.props.Position, s = i.props.Size; let ss = s;
        if (i.props.Shape === 'Ball') { const k = Math.min(...s); ss = [k, k, k]; }
        if (i.props.Shape === 'Cylinder') { const k = Math.min(s[1], s[2]); ss = [s[0], k, k]; }
        min = [p[0] - ss[0] / 2, p[1] - ss[1] / 2, p[2] - ss[2] / 2]; max = [p[0] + ss[0] / 2, p[1] + ss[1] / 2, p[2] + ss[2] / 2];
      }
      i.aabb = { min, max }; i.aabbPos = i.props.Position;
      return i.aabb;
    }
    const sobrepoe = (a, b, m = 0) => a.min[0] < b.max[0] + m && a.max[0] > b.min[0] - m && a.min[1] < b.max[1] + m && a.max[1] > b.min[1] - m && a.min[2] < b.max[2] + m && a.max[2] > b.min[2] - m;
    function atualizarSolidos() {
      if (!colisaoSuja) return; colisaoSuja = false;
      solidos = [...malhas.keys()].filter(i => i.ClassName !== '__Limb' && i.props.CanCollide !== false && emMundo(i));
    }
    const caixaJogador = (pos = estado.pos) => ({ min: [pos.x - DIM.w / 2, pos.y, pos.z - DIM.d / 2], max: [pos.x + DIM.w / 2, pos.y + DIM.h, pos.z + DIM.d / 2] });
    function moverEixo(eixo, delta) {
      const p = estado.pos; const k = eixo === 'x' ? 0 : eixo === 'y' ? 1 : 2;
      p[eixo] += delta;
      let caixa = caixaJogador();
      for (const s of solidos) {
        if (s.props.Shape === 'Wedge') continue;
        const b = aabbDe(s); if (!sobrepoe(caixa, b)) continue;
        if (k === 1) {
          if (delta < 0) { p.y = b.max[1]; estado.vel.y = 0; estado.chao = true; estado.plataforma = s; }
          else { p.y = b.min[1] - DIM.h - 0.001; estado.vel.y = 0; }
        } else {
          const degrau = b.max[1] - p.y;
          if (degrau > 0 && degrau <= 1.1 && estado.chaoAnt) { const ant = p.y; p.y = b.max[1] + 0.001; if (!colideAlgo()) { caixa = caixaJogador(); continue; } p.y = ant; }
          if (delta > 0) p[eixo] = b.min[k] - (k === 0 ? DIM.w : DIM.d) / 2 - 0.001; else p[eixo] = b.max[k] + (k === 0 ? DIM.w : DIM.d) / 2 + 0.001;
          if (k === 0) estado.vel.x = 0; else estado.vel.z = 0;
        }
        caixa = caixaJogador();
      }
    }
    const colideAlgo = () => { const c = caixaJogador(); return solidos.some(s => s.props.Shape !== 'Wedge' && sobrepoe(c, aabbDe(s))); };
    const inv = new THREE.Matrix4(), vtmp = new THREE.Vector3();
    function rampas() {
      for (const s of solidos) {
        if (s.props.Shape !== 'Wedge') continue;
        const m = malhas.get(s); if (!m) continue;
        const b = aabbDe(s); const c = caixaJogador();
        if (!(c.max[0] > b.min[0] && c.min[0] < b.max[0] && c.max[2] > b.min[2] && c.min[2] < b.max[2])) continue;
        inv.copy(m.matrixWorld).invert();
        vtmp.set(estado.pos.x, estado.pos.y, estado.pos.z).applyMatrix4(inv);
        if (Math.abs(vtmp.x) > 0.5 || Math.abs(vtmp.z) > 0.5) continue;
        const topo = -0.5 + (0.5 - vtmp.z); // altura local da rampa
        if (vtmp.y < topo + 0.15 && vtmp.y > -0.6) {
          vtmp.y = topo; const mundo = vtmp.clone().applyMatrix4(m.matrixWorld);
          if (mundo.y - estado.pos.y < 2.5 && estado.vel.y <= 0.5) { estado.pos.y = mundo.y; estado.vel.y = Math.max(0, estado.vel.y); estado.chao = true; estado.plataforma = null; }
        }
      }
    }
    const tocando = new Set();
    function toques() {
      if (!personagem || estado.morto) return;
      const c = caixaJogador(), agora = new Set();
      for (const i of malhas.keys()) {
        if (i.ClassName === '__Limb' || i.props.CanTouch === false) continue;
        if (sobrepoe(c, aabbDe(i), 0.12)) agora.add(i);
      }
      for (const i of agora) if (!tocando.has(i)) i.sinal('Touched').Fire(raiz.p);
      for (const i of tocando) if (!agora.has(i) && !i.__destruido) i.sinal('TouchEnded').Fire(raiz.p);
      tocando.clear(); for (const i of agora) tocando.add(i);
    }
    function fisicaSoltas(dt) {
      const g = workspace.props.Gravity ?? 196.2;
      for (const [i, m] of malhas) {
        if (i.ClassName === '__Limb' || i.props.Anchored) continue;
        const v = i.vel || (i.vel = [0, 0, 0]);
        v[1] -= g * dt;
        const p = [...i.props.Position];
        for (let k = 0; k < 3; k++) {
          p[k] += v[k] * dt;
          const s = i.props.Size; const a = { min: p.map((x, j) => x - s[j] / 2), max: p.map((x, j) => x + s[j] / 2) };
          for (const o of solidos) {
            if (o === i) continue;
            const b = aabbDe(o); if (!sobrepoe(a, b)) continue;
            if (v[k] > 0) p[k] = b.min[k] - s[k] / 2 - 0.001; else p[k] = b.max[k] + s[k] / 2 + 0.001;
            v[k] = k === 1 ? 0 : v[k] * 0.3; a.min[k] = p[k] - s[k] / 2; a.max[k] = p[k] + s[k] / 2;
          }
        }
        if (Math.abs(v[1]) < 0.01) { v[0] *= 0.9; v[2] *= 0.9; }
        i.props.Position = p; construtor.aplicar(m, { props: i.props }); i.aabb = null;
        if (p[1] < (workspace.props.FallenPartsDestroyHeight ?? -100)) destruir(i);
      }
    }

    /* ---------------- Entrada ---------------- */
    const teclas = {}; let arrastando = false, ultX = 0, ultY = 0, distCam = 14, pitch = 0.35;
    const TECLA = e => { const k = e.code; if (/^Key[A-Z]$/.test(k)) return k.slice(3); return ({ Space: 'Space', ShiftLeft: 'LeftShift', ShiftRight: 'RightShift', Enter: 'Return', Tab: 'Tab', Escape: 'Escape', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Digit1: 'One', Digit2: 'Two', Digit3: 'Three', Digit4: 'Four', Digit5: 'Five' })[k] || k; };
    const objInput = (nome, tipo) => ({ KeyCode: ENUM.KeyCode[nome] || { Name: nome }, UserInputType: ENUM.UserInputType[tipo] || { Name: tipo } });
    const onKeyDown = e => { if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; const n = TECLA(e); if (!teclas[n]) uis.sinal('InputBegan').Fire(objInput(n, 'Keyboard'), false); teclas[n] = true; if (['Space', 'Up', 'Down'].includes(n)) e.preventDefault(); };
    const onKeyUp = e => { const n = TECLA(e); teclas[n] = false; uis.sinal('InputEnded').Fire(objInput(n, 'Keyboard'), false); };
    addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp);
    addEventListener('blur', () => { for (const k in teclas) teclas[k] = false; });
    const tela = renderer.domElement;
    tela.addEventListener('contextmenu', e => e.preventDefault());
    const ray = new THREE.Raycaster(), mouseV = new THREE.Vector2();
    function cliqueNoMundo(cx, cy) {
      const r = tela.getBoundingClientRect(); mouseV.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
      ray.setFromCamera(mouseV, camera);
      const lista = [...malhas.values()].filter(m => m.visible && m.userData.inst && m.userData.inst.ClassName !== '__Limb');
      const h = ray.intersectObjects(lista, false)[0]; if (!h) return;
      let i = h.object.userData.inst;
      while (i) { const cd = i.filhos.find(f => f.ClassName === 'ClickDetector'); if (cd) { if (h.point.distanceTo(estado.pos) <= (cd.props.MaxActivationDistance || 32) + 4) cd.sinal('MouseClick').Fire(jogador.p); return; } i = i.pai && ehParteC(i.pai.ClassName) || (i.pai && i.pai.ClassName === 'Model') ? i.pai : null; }
    }
    tela.addEventListener('click', e => cliqueNoMundo(e.clientX, e.clientY));
    tela.addEventListener('mousedown', e => { ctxAudio(); if (e.button === 2 || e.button === 1) { arrastando = true; ultX = e.clientX; ultY = e.clientY; } uis.sinal('InputBegan').Fire(objInput(e.button === 0 ? 'MouseButton1' : 'MouseButton2', e.button === 0 ? 'MouseButton1' : 'MouseButton2'), false); });
    addEventListener('mouseup', () => { arrastando = false; });
    addEventListener('mousemove', e => { if (!arrastando) return; estado.yaw -= (e.clientX - ultX) * 0.006; pitch = Math.max(-1.2, Math.min(1.35, pitch + (e.clientY - ultY) * 0.005)); ultX = e.clientX; ultY = e.clientY; });
    tela.addEventListener('wheel', e => { distCam = Math.max(0.5, Math.min(80, distCam * (e.deltaY > 0 ? 1.12 : 0.89))); e.preventDefault(); }, { passive: false });
    // toque
    const TOQUE = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
    const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 }, olhar = { id: null, x: 0, y: 0 };
    if (TOQUE) {
      const zona = document.createElement('div'); zona.className = 'as-toque'; zona.innerHTML = '<div class="as-joy"><i></i></div><button class="as-pular">⤒</button>'; container.appendChild(zona);
      const btP = zona.querySelector('.as-pular'), jEl = zona.querySelector('.as-joy');
      btP.addEventListener('touchstart', e => { teclas.Space = true; ctxAudio(); e.preventDefault(); e.stopPropagation(); }, { passive: false });
      btP.addEventListener('touchend', e => { teclas.Space = false; e.preventDefault(); });
      zona.addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (t.target === btP) continue; if (t.clientX < innerWidth * 0.45 && joy.id === null) { Object.assign(joy, { id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 }); jEl.style.display = 'block'; jEl.style.left = t.clientX + 'px'; jEl.style.top = t.clientY + 'px'; } else if (olhar.id === null) Object.assign(olhar, { id: t.identifier, x: t.clientX, y: t.clientY }); } e.preventDefault(); }, { passive: false });
      zona.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy; const d = Math.hypot(dx, dy); if (d > 50) { dx *= 50 / d; dy *= 50 / d; } joy.x = dx / 50; joy.y = dy / 50; jEl.firstChild.style.transform = `translate(${dx}px,${dy}px)`; } else if (t.identifier === olhar.id) { estado.yaw -= (t.clientX - olhar.x) * 0.008; pitch = Math.max(-1.2, Math.min(1.35, pitch + (t.clientY - olhar.y) * 0.006)); olhar.x = t.clientX; olhar.y = t.clientY; } } e.preventDefault(); }, { passive: false });
      const fim = e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; jEl.style.display = 'none'; } if (t.identifier === olhar.id) olhar.id = null; } };
      zona.addEventListener('touchend', fim); zona.addEventListener('touchcancel', fim);
    }

    /* ---------------- Scripts ---------------- */
    const iniciados = new Set();
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const esperar = (t = 0.03) => new Promise(ok => { const ini = tempo; agendar(t, () => ok(tempo - ini)); });
    const fmt = a => a.map(x => x === undefined ? 'nil' : x === null ? 'nil' : (x && x.__inst) ? x.__inst.Name : typeof x === 'object' && !(x instanceof Vector3 || x instanceof Color3) ? JSON.stringify(x) : String(x)).join('  ');
    const apiComum = {
      game: gameApi, workspace: workspace.p, Workspace: workspace.p,
      print: (...a) => log('log', fmt(a)), warn: (...a) => log('warn', fmt(a)),
      wait: esperar, task: { wait: esperar, spawn: (f, ...a) => chamar(f, a, scriptAtual), delay: (t, f, ...a) => agendar(t, () => chamar(f, a)) },
      spawn: (f) => agendar(0, () => chamar(f, [])), delay: (t, f) => agendar(t, () => chamar(f, [])), tick: () => performance.now() / 1000, time: () => tempo,
      Vector3: Object.assign((x, y, z) => new Vector3(x, y, z), { new: (x, y, z) => new Vector3(x, y, z), zero: new Vector3(), one: new Vector3(1, 1, 1), xAxis: new Vector3(1, 0, 0), yAxis: new Vector3(0, 1, 0), zAxis: new Vector3(0, 0, 1) }),
      Color3: { new: (r, g, b) => new Color3(r, g, b), fromRGB: Color3.fromRGB, fromHex: Color3.fromHex },
      UDim2: { new: (a, b, c, d) => new UDim2(a, b, c, d), fromScale: UDim2.fromScale, fromOffset: UDim2.fromOffset },
      Vector2: { new: (x, y) => new Vector2(x, y) },
      CFrame: { new: (x, y, z) => ({ Position: new Vector3(x, y, z) }) },
      BrickColor: { new: c => ({ Color: corTijolo(c) }), Random: () => ({ Color: new Color3(Math.random(), Math.random(), Math.random()) }) },
      Instance: { new: (c, pai) => novaInstancia(c, pai) },
      TweenInfo: { new: (t = 1, estilo, dir, rep = 0, rev = false, atraso = 0) => ({ Time: t, EasingStyle: estilo, EasingDirection: dir, RepeatCount: rep, Reverses: rev, DelayTime: atraso }) },
      Enum: ENUM,
    };
    const TIJOLOS = { 'bright red': '#c4281c', 'bright blue': '#0d69ac', 'bright green': '#4b974b', 'bright yellow': '#f5cd30', 'bright orange': '#da8541', 'really red': '#ff0000', 'really blue': '#0000ff', 'really black': '#111111', 'white': '#f2f3f3', 'black': '#1b2a35', 'lime green': '#00ff00', 'medium stone grey': '#a3a2a5', 'dark stone grey': '#635f62', 'institutional white': '#f8f8f8', 'hot pink': '#ff66cc', 'deep orange': '#ffaf00', 'toothpaste': '#00ffff', 'royal purple': '#6225d1', 'cyan': '#04afec', 'gold': '#efb838', 'brown': '#7c5c46', 'reddish brown': '#694028', 'sand green': '#789082', 'pastel blue': '#80bbdb', 'new yeller': '#ffff00' };
    const corTijolo = c => typeof c === 'string' && c[0] === '#' ? Color3.fromHex(c) : Color3.fromHex(TIJOLOS[String(c || '').toLowerCase()] || '#a3a2a5');
    function novaInstancia(c, pai) {
      if (!N.CLASSES[c] || N.CLASSES[c].servico || ['DataModel', 'Player', 'PlayerGui'].includes(c)) { log('error', `Instance.new: classe "${c}" não pode ser criada`); return; }
      const i = new Inst(c, c); if (c === 'Script') i.fonte = '';
      if (pai) reparentar(i, inst(pai));
      return i.p;
    }
    function iniciarScript(s) {
      if (iniciados.has(s) || s.props.Enabled === false || s.__destruido) return;
      iniciados.add(s);
      const codigo = s.fonte ?? s.props.Source ?? '';
      if (!codigo.trim()) return;
      agendar(0, () => (s.props.Language === 'JavaScript' ? rodarJs : rodarLua)(s, codigo), s);
    }
    function rodarJs(s, codigo) {
      const nomes = Object.keys(apiComum);
      let f;
      try { f = new AsyncFunction('script', ...nomes, '"use strict";\n' + codigo); } catch (e) { log('error', `${s.Name}: erro de sintaxe: ${e.message}`); return; }
      scriptAtual = s;
      f(s.p, ...nomes.map(n => apiComum[n])).catch(e => erroScript(e, s));
      scriptAtual = null;
    }
    let luaPronto = null;
    async function prepararLua() {
      if (luaPronto) return luaPronto;
      luaPronto = (async () => {
        await N.carregarScript(N.FENGARI, 'fengari');
        window.__asLua = {
          game: gameApi, workspace: workspace.p, Enum: ENUM, scriptAtual: null,
          print(t) { log('log', String(t)); }, warn(t) { log('warn', String(t)); }, erro(t) { log('error', String(t)); },
          agora() { return tempo; }, relogio() { return performance.now() / 1000; },
          agendar(t, f) { agendar(t, () => { try { f.call(undefined); } catch (e) { log('error', String(e)); } }); },
          registrarSpawn(f) { luaSpawn = f; },
          v3(x, y, z) { return new Vector3(x, y, z); }, rgb(r, g, b) { return Color3.fromRGB(r, g, b); }, hex(h) { return Color3.fromHex(h); },
          udim2(a, b, c, d) { return new UDim2(a, b, c, d); }, v2(x, y) { return new Vector2(x, y); },
          novo(c, pai) { return novaInstancia(c, pai); },
          brick(c) { return corTijolo(c); },
          tweenInfo(t, e, d, r, rv, at) { return apiComum.TweenInfo.new(t, e, d, r, rv, at); },
          cframe(x, y, z) { return { Position: new Vector3(x, y, z) }; },
          op(o, a, b) {
            const A = a instanceof Vector3, B = b instanceof Vector3;
            if (o === 'add' && A && B) return a.Add(b); if (o === 'sub' && A && B) return a.Sub(b);
            if (o === 'mul') { if (A && B) return a.Mul(b); if (A) return a.Mul(b); if (B) return b.Mul(a); if (a instanceof Color3) return new Color3(a.R * b, a.G * b, a.B * b); }
            if (o === 'div' && A) return a.Div(b); if (o === 'unm' && A) return a.Mul(-1);
            if (o === 'eq') { if (a === b) return true; if (A && B) return a.X === b.X && a.Y === b.Y && a.Z === b.Z; if (a && b && a.Name && a.EnumType && a.Name === b.Name && a.EnumType === b.EnumType) return true; const ia = inst(a), ib = inst(b); return !!ia && ia === ib; }
            if (o === 'concat') return String(a) + String(b);
            throw new Error('operação inválida: ' + o);
          },
          len(a) { return a && a.length; },
        };
        const prelude = `
local js = require "js"
local G = js.global.__asLua
__AS = G
game = G.game; workspace = G.workspace; Workspace = workspace; Enum = G.Enum
local function juntar(...) local t = table.pack(...) local s = {} for i = 1, t.n do s[i] = tostring(t[i]) end return table.concat(s, "  ") end
function print(...) G:print(juntar(...)) end
function warn(...) G:warn(juntar(...)) end
local function inteiro(v) if math.type(v) == "float" and v == math.floor(v) and v > -9.0e15 and v < 9.0e15 then return math.tointeger(v) end return v end
__inteiro = inteiro
local function inteiros(...) local t = table.pack(...) for i = 1, t.n do t[i] = inteiro(t[i]) end return table.unpack(t, 1, t.n) end
local function retomar(co, ...)
  local ok, t = coroutine.resume(co, ...)
  if not ok then G:erro(tostring(t)) return end
  if coroutine.status(co) ~= "dead" then G:agendar(t or 0.03, function() retomar(co) end) end
end
function wait(t) local ini = G:agora() coroutine.yield(t or 0.03) return G:agora() - ini end
function spawn(f, ...) retomar(coroutine.create(f), inteiros(...)) end
function delay(t, f, ...) local a = table.pack(...) G:agendar(t or 0, function() spawn(f, table.unpack(a, 1, a.n)) end) end
task = { wait = wait, spawn = spawn, delay = delay, defer = spawn }
function tick() return G:relogio() end
function time() return G:agora() end
G:registrarSpawn(spawn)
Vector3 = { new = function(x, y, z) return G:v3(x or 0, y or 0, z or 0) end }
Vector3.zero = Vector3.new(0, 0, 0); Vector3.one = Vector3.new(1, 1, 1); Vector3.xAxis = Vector3.new(1,0,0); Vector3.yAxis = Vector3.new(0,1,0); Vector3.zAxis = Vector3.new(0,0,1)
Vector2 = { new = function(x, y) return G:v2(x or 0, y or 0) end }
Color3 = { new = function(r, g, b) return G:rgb((r or 0) * 255, (g or 0) * 255, (b or 0) * 255) end, fromRGB = function(r, g, b) return G:rgb(r or 0, g or 0, b or 0) end, fromHex = function(h) return G:hex(h) end }
UDim2 = { new = function(a, b, c, d) return G:udim2(a or 0, b or 0, c or 0, d or 0) end, fromScale = function(x, y) return G:udim2(x or 0, 0, y or 0, 0) end, fromOffset = function(x, y) return G:udim2(0, x or 0, 0, y or 0) end }
CFrame = { new = function(x, y, z) return G:cframe(x or 0, y or 0, z or 0) end }
BrickColor = { new = function(c) return { Color = G:brick(c) } end, Random = function() return { Color = G:rgb(math.random(0,255), math.random(0,255), math.random(0,255)) } end }
Instance = { new = function(c, pai) return G:novo(c, pai) end }
TweenInfo = { new = function(t, e, d, r, rv, at) return G:tweenInfo(t or 1, e, d, r or 0, rv or false, at or 0) end }
local mt = debug.getmetatable(game)
if mt then
  mt.__add = function(a, b) return G:op("add", a, b) end
  mt.__sub = function(a, b) return G:op("sub", a, b) end
  mt.__mul = function(a, b) return G:op("mul", a, b) end
  mt.__div = function(a, b) return G:op("div", a, b) end
  mt.__unm = function(a) return G:op("unm", a, nil) end
  mt.__eq = function(a, b) return G:op("eq", a, b) end
  mt.__concat = function(a, b) return G:op("concat", a, b) end
  local indice = mt.__index
  local LISTAS = { GetChildren = true, GetDescendants = true, GetPlayers = true, GetTouchingParts = true }
  if type(indice) == "function" then
    mt.__index = function(o, k)
      local v = inteiro(indice(o, k))
      if k == "WaitForChild" then
        return function(self, nome, limite)
          local f = self:FindFirstChild(nome)
          local ini = G:agora()
          while f == nil do
            if limite and G:agora() - ini > limite then return nil end
            wait(0.03)
            f = self:FindFirstChild(nome)
          end
          return f
        end
      end
      if LISTAS[k] and v ~= nil then
        return function(self, ...)
          local arr = v(self, ...)
          local t = {}
          local n = G:len(arr) or 0
          for i = 0, n - 1 do t[i + 1] = arr[i] end
          return t
        end
      end
      return v
    end
  end
end
`;
        fengari.load(prelude, '=prelude')();
      })();
      return luaPronto;
    }
    let luaOk = false;
    async function rodarLua(s, codigo) {
      if (!luaOk) { try { await prepararLua(); luaOk = true; } catch (e) { log('error', 'Não foi possível carregar o Lua (sem internet?): ' + e.message); return; } }
      window.__asLua.scriptAtual = s.p;
      const chunk = `local script = __AS.scriptAtual; spawn(function() ${codigo}\nend)`;
      try { scriptAtual = s; fengari.load(chunk, '=' + s.Name)(); }
      catch (e) { log('error', String(e).replace(/^\[string "[^"]*"\]/, s.Name)); }
      finally { scriptAtual = null; }
    }

    /* ---------------- Início ---------------- */
    percorrerInst(dm, i => { if (ehParteC(i.ClassName) && emMundo(i)) garantirMalha(i); });
    let temLua = false; percorrerInst(dm, i => { if (i.ClassName === 'Script' && i.props.Language !== 'JavaScript' && (i.fonte || '').trim()) temLua = true; });
    if (temLua) { try { await prepararLua(); luaOk = true; } catch (e) { log('error', 'Não foi possível carregar o Lua (sem internet?): ' + e.message); } }
    criarJogador(); criarPersonagem(); copiarGui(false);
    percorrerInst(dm, i => { if (i.ClassName === 'Script' && (emMundo(i) || dentroDe(i, sss))) iniciarScript(i); });
    for (const g of jogador.gui.filhos) percorrerInst(g, i => { if (i.ClassName === 'Script') iniciarScript(i); });
    agendar(0.05, () => players.sinal('PlayerAdded').Fire(jogador.p));

    // HUD: placar (leaderstats) e vida
    const hud = document.createElement('div'); hud.className = 'as-hud'; container.appendChild(hud);
    function atualizarHud() {
      let html = '';
      const ls = jogador && jogador.filhos.find(f => f.Name === 'leaderstats');
      if (ls && ls.filhos.length) {
        html += `<div class="as-placar"><div class="as-placar-cab"><span>${esc(jogador.Name)}</span></div>` + ls.filhos.filter(f => /Value$/.test(f.ClassName)).map(f => `<div><span>${esc(f.Name)}</span><b>${esc(typeof f.props.Value === 'number' ? Math.round(f.props.Value * 100) / 100 : f.props.Value)}</b></div>`).join('') + '</div>';
      }
      if (humanoide && humanoide.props.Health < humanoide.props.MaxHealth) html += `<div class="as-vida"><i style="width:${Math.max(0, humanoide.props.Health / humanoide.props.MaxHealth * 100)}%"></i></div>`;
      if (hud.innerHTML !== html) hud.innerHTML = html;
    }
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function mensagemFinal(msg) { const d = document.createElement('div'); d.className = 'as-kick'; d.textContent = msg; container.appendChild(d); parado = true; }

    /* ---------------- Loop ---------------- */
    let ultimo = performance.now(), acc = 0, rodando = true;
    const PASSO = 1 / 60;
    const frente = new THREE.Vector3(), lado = new THREE.Vector3();
    function passo(dt) {
      tempo += dt;
      for (let k = agenda.length - 1; k >= 0; k--) if (agenda[k].t <= tempo) { const a = agenda.splice(k, 1)[0]; if (!(a.dono && a.dono.__destruido)) { try { a.fn(); } catch (e) { erroScript(e, a.dono); } } }
      runService.sinal('Stepped').Fire(tempo, dt);
      passoTweens(dt);
      atualizarSolidos();
      // personagem
      if (personagem && !estado.morto) {
        const h = humanoide.props;
        let ix = 0, iz = 0;
        if (teclas.W || teclas.Up) iz += 1; if (teclas.S || teclas.Down) iz -= 1; if (teclas.A || teclas.Left) ix -= 1; if (teclas.D || teclas.Right) ix += 1;
        ix += joy.x; iz -= joy.y;
        frente.set(-Math.sin(estado.yaw), 0, -Math.cos(estado.yaw)); lado.set(-frente.z, 0, frente.x);
        let dx = frente.x * iz + lado.x * ix, dz = frente.z * iz + lado.z * ix; const l = Math.hypot(dx, dz);
        if (humanoide.moveScript) { dx = humanoide.moveScript[0]; dz = humanoide.moveScript[2]; }
        const lim = Math.max(1, l); dx /= lim; dz /= lim;
        const alvoVx = dx * h.WalkSpeed, alvoVz = dz * h.WalkSpeed, k = Math.min(1, dt * (estado.chao ? 18 : 6));
        estado.vel.x += (alvoVx - estado.vel.x) * k; estado.vel.z += (alvoVz - estado.vel.z) * k;
        if (l > 0.1) { const alvoYaw = Math.atan2(-dx, -dz); let d = alvoYaw - estado.corpoYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); estado.corpoYaw = (estado.corpoYaw || 0) + d * Math.min(1, dt * 12); }
        if ((teclas.Space) && estado.chao && h.JumpPower > 0) { estado.vel.y = h.JumpPower; estado.chao = false; estado.plataforma = null; }
        estado.vel.y -= (workspace.props.Gravity ?? 196.2) * dt;
        // plataformas móveis
        if (estado.plataforma && estado.platPos) { const p = estado.plataforma.props.Position; estado.pos.x += p[0] - estado.platPos[0]; estado.pos.y += p[1] - estado.platPos[1]; estado.pos.z += p[2] - estado.platPos[2]; }
        estado.chaoAnt = estado.chao; estado.chao = false; const platAnt = estado.plataforma; estado.plataforma = null;
        moverEixo('x', estado.vel.x * dt); moverEixo('z', estado.vel.z * dt); moverEixo('y', estado.vel.y * dt);
        rampas();
        if (!estado.plataforma && platAnt && estado.chao) estado.plataforma = platAnt;
        estado.platPos = estado.plataforma ? [...estado.plataforma.props.Position] : null;
        if (estado.pos.y < (workspace.props.FallenPartsDestroyHeight ?? -100)) definir(humanoide, 'Health', 0);
        raiz.props.Position = [estado.pos.x, estado.pos.y + 3, estado.pos.z];
        estado.animT += dt * Math.hypot(estado.vel.x, estado.vel.z) * 0.45;
        toques();
      }
      fisicaSoltas(dt);
      runService.sinal('Heartbeat').Fire(dt);
    }
    function poseCorpo(dt) {
      if (!personagem) return;
      const set = (l, x, y, z, rx = 0, ry = 0) => { const m = malhas.get(l); if (!m) return; m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); };
      if (estado.morto) {
        for (const k of ['cabeca', 'tronco', 'be', 'bd', 'pe', 'pd']) { const l = corpo[k], m = malhas.get(l); if (!m || !l.vel) continue; l.vel[1] -= 120 * dt; m.position.x += l.vel[0] * dt; m.position.y = Math.max(0.5 + (estado.pos.y - 0.5), m.position.y + l.vel[1] * dt); m.position.z += l.vel[2] * dt; m.rotation.x += l.rotVel[0] * dt; m.rotation.z += l.rotVel[2] * dt; }
        return;
      }
      const p = estado.pos, yaw = estado.corpoYaw || 0, s = Math.sin(estado.animT * 2) * (estado.chao ? 0.8 : 0.2), ar = !estado.chao ? -0.6 : 0;
      const off = (fx, fz) => [p.x + Math.cos(yaw) * fx + Math.sin(yaw) * fz, p.z - Math.sin(yaw) * fx + Math.cos(yaw) * fz];
      let [x, z] = off(0, 0);
      set(corpo.tronco, x, p.y + 3, z, 0, yaw);
      set(corpo.cabeca, x, p.y + 4.6, z, 0, yaw);
      [x, z] = off(-1.5, 0); set(corpo.be, x, p.y + 3, z, s + ar, yaw);
      [x, z] = off(1.5, 0); set(corpo.bd, x, p.y + 3, z, -s + ar, yaw);
      [x, z] = off(-0.5, 0); set(corpo.pe, x, p.y + 1, z, -s, yaw);
      [x, z] = off(0.5, 0); set(corpo.pd, x, p.y + 1, z, s, yaw);
      const vis = distCam > 1.5;
      for (const k of ['cabeca', 'tronco', 'be', 'bd', 'pe', 'pd']) { const m = malhas.get(corpo[k]); if (m) m.visible = vis && !avatarObj; }
      if (avatarObj) {
        const vh = Math.hypot(estado.vel.x, estado.vel.z);
        if (teclas.G && !estado.gAnt) estado.emote = !estado.emote; estado.gAnt = !!teclas.G;
        if (vh > 1 || !estado.chao) estado.emote = false;
        animAv.definir(!estado.chao ? 'pular' : vh > 1 ? 'andar' : estado.emote ? 'emote' : 'parado');
        const pose = animAv.passo(dt, vh > 1 && estado.chao ? Math.max(0.6, vh / 16) : 1);
        avatarObj.grupo.position.set(p.x, p.y, p.z); avatarObj.grupo.rotation.y = yaw;
        avatarObj.aplicar(pose); avatarObj.grupo.visible = vis;
      }
    }
    const alvoCam = new THREE.Vector3();
    function loop(agora) {
      if (!rodando) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.1, (agora - ultimo) / 1000); ultimo = agora;
      if (!parado) { acc += dt; let n = 0; while (acc >= PASSO && n < 8) { passo(PASSO); acc -= PASSO; n++; } if (n >= 8) acc = 0; }
      runService.sinal('RenderStepped').Fire(dt);
      poseCorpo(dt);
      // câmera
      alvoCam.set(estado.pos.x, estado.pos.y + 4.5, estado.pos.z);
      const cx = alvoCam.x + Math.sin(estado.yaw) * Math.cos(pitch) * distCam, cy = alvoCam.y + Math.sin(pitch) * distCam, cz = alvoCam.z + Math.cos(estado.yaw) * Math.cos(pitch) * distCam;
      camera.position.set(cx, cy, cz); camera.lookAt(alvoCam);
      // sol segue o jogador
      const d = sol.userData.dir || new THREE.Vector3(0.5, 1, 0.3);
      sol.position.set(alvoCam.x + d.x * 150, alvoCam.y + d.y * 150, alvoCam.z + d.z * 150); sol.target.position.copy(alvoCam);
      atualizarHud();
      renderer.render(cena, camera);
    }
    requestAnimationFrame(loop);

    return {
      parar() { rodando = false; removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); for (const i of todas) pararSom(i); renderer.dispose(); },
      captura() { renderer.render(cena, camera); return renderer.domElement.toDataURL('image/jpeg', 0.85); },
      avancar(seg, teclasTeste) { Object.assign(teclas, teclasTeste || {}); for (let i = 0; i < Math.round(seg * 60); i++) passo(PASSO); for (const k in teclasTeste || {}) teclas[k] = false; poseCorpo(0); atualizarHud(); renderer.render(cena, camera); },
      get jogadorPos() { return estado.pos.toArray().map(v => Math.round(v * 100) / 100); },
      get tempo() { return tempo; },
    };
  };
})();
