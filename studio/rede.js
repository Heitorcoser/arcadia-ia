/* =========================================================================
   ARCÁDIA STUDIO · rede dos jogos multijogador (PeerJS / WebRTC)

   Cada jogador roda o mundo no próprio aparelho. A rede junta os jogadores
   da mesma "sala" (o mesmo jogo, na mesma versão) e troca:
     · onde cada personagem está, para onde olha e a animação
     · o placar (leaderstats), o chat e os RemoteEvents dos scripts
   Os servidores são as salas públicas de ../salas-publicas.js: quem chega
   primeiro vira o anfitrião (o "servidor") e repassa as mensagens. Se o
   anfitrião sair, todo mundo procura de novo e alguém vira o novo anfitrião,
   sem parar o jogo de ninguém.

   ASR.conectar({ sala, nome, avatar, max }) → sessão com:
     on(evento, fn): 'status' (texto, info) · 'entrou' (id, {nome, avatar}) · 'saiu' (id)
                     'pos' (id, dados) · 'ls' (id, valores) · 'chat' (id, texto) · 're' (tipo, caminho, deId, args)
                     'reiniciou' () quando reconecta (todos os remotos já saíram)
     enviarPos(dados) · enviarLs(valores) · chat(texto) · remoto(tipo, caminho, args, alvoId)
     meuId · souHost · fechar()
   ========================================================================= */
(function () {
  'use strict';
  const ASR = (window.ASR = {});
  const PEERJS = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  const carregar = (src, global) => window[global] ? Promise.resolve() : new Promise((ok, erro) => {
    const s = document.createElement('script'); s.src = src; s.onload = () => ok(); s.onerror = () => erro(new Error('não carregou ' + src)); document.head.appendChild(s);
  });
  // endereço curto e válido para o PeerJS a partir de qualquer texto
  function hash(t) { let a = 0x811c9dc5, b = 0x1234567; for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); a = Math.imul(a ^ c, 16777619) >>> 0; b = Math.imul(b ^ c, 2246822519) >>> 0; } return a.toString(36) + b.toString(36); }
  ASR.hash = hash;

  ASR.conectar = function (o) {
    const ouvintes = {};
    const emitir = (ev, ...a) => { for (const f of ouvintes[ev] || []) { try { f(...a); } catch (e) { console.error(e); } } };
    const s = {
      meuId: 0, souHost: false, conectado: false, n: 0,
      on(ev, f) { (ouvintes[ev] = ouvintes[ev] || []).push(f); return s; },
      enviarPos, enviarLs, chat, remoto, fechar,
    };
    const prefixo = 'arcadia-studio-v1-' + hash(String(o.sala || 'sem-sala')) + '-';
    const MAX = Math.max(2, Math.min(50, +o.max || 10));
    let peer = null, conn = null, fechado = false, geracao = 0, timerPos = null, timerHb = null, ultimaMsg = 0;
    // sinal de presença a cada segundo: a conexão WebRTC às vezes demora muito para avisar que o outro lado sumiu
    const SEM_SINAL = 12000;
    // anfitrião
    let proxId = 2; const clientes = new Map(); // id → { c, nome, avatar, pos, ls }
    let meuPos = null, meuLs = null;
    const info = () => ({ servidor: s.n, jogadores: s.souHost ? clientes.size + 1 : (s.qtd || 1), souHost: s.souHost });

    function status(txt) { emitir('status', txt, info()); }
    function enviarCli(c, m) { if (c && c.open) try { c.send(m); } catch (e) {} }
    function todos(m, exceto) { for (const [id, cl] of clientes) if (id !== exceto) enviarCli(cl.c, m); }
    function contagem() { if (s.souHost) { s.qtd = clientes.size + 1; todos({ t: 'qtd', n: s.qtd }); } status(''); }

    function limparSessao() {
      clearInterval(timerPos); timerPos = null; clearInterval(timerHb); timerHb = null;
      for (const id of [...clientes.keys()]) emitir('saiu', id);
      clientes.clear();
      if (s.remotosCliente) { for (const id of s.remotosCliente) emitir('saiu', id); }
      s.remotosCliente = new Set();
      const c = conn, p = peer; conn = null; peer = null; // zera antes de fechar: o "close" dessas conexões velhas é ignorado
      try { c && c.close(); } catch (e) {}
      try { p && p.destroy(); } catch (e) {}
      s.souHost = false; s.conectado = false; s.meuId = 0;
    }
    async function procurar() {
      if (fechado) return;
      const g = ++geracao;
      status('Procurando servidor…');
      try { await carregar(PEERJS, 'Peer'); } catch (e) { status('Sem internet: jogando sozinho.'); return; }
      if (!window.ArcadiaPublica) { status('Sistema de salas indisponível: jogando sozinho.'); return; }
      ArcadiaPublica.procurar({
        Peer: window.Peer, prefixo,
        aoStatus: () => {},
        aoHospedar: (p, nome, n) => { if (g !== geracao || fechado) { try { p.destroy(); } catch (e) {} return; } virarHost(p, n); },
        aoEntrar: (cod, falhou) => { if (g !== geracao || fechado) return; entrar(cod, falhou, +cod.split('-').pop()); },
        aoErro: t => { if (g !== geracao) return; status(t + ' Tentando de novo…'); setTimeout(() => { if (g === geracao) procurar(); }, 8000); },
      });
    }
    let reconectando = false;
    function reconectar() {
      if (fechado || reconectando) return; // várias coisas avisam a queda ao mesmo tempo: só uma reconexão
      reconectando = true; geracao++;
      limparSessao(); emitir('reiniciou');
      status('O servidor caiu. Procurando outro…');
      setTimeout(() => { reconectando = false; procurar(); }, 300 + Math.random() * 1500); // espera um pouco: evita que todos tentem virar anfitrião juntos
    }

    /* ---------- anfitrião ---------- */
    function virarHost(p, n) {
      peer = p; s.souHost = true; s.conectado = true; s.meuId = 1; s.n = n; s.qtd = 1;
      peer.on('connection', c => {
        c.on('data', d => doCliente(c, d));
        c.on('close', () => saiuCliente(c)); c.on('error', () => saiuCliente(c));
      });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} }); // perdeu só o servidor de sinalização: as conexões continuam
      peer.on('error', e => { if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) status('Conexão instável…'); });
      timerPos = setInterval(() => {
        const l = [];
        if (meuPos) l.push([1, meuPos]);
        for (const [id, cl] of clientes) if (cl.pos) l.push([id, cl.pos]);
        if (clientes.size) todos({ t: 'es', l });
      }, 66);
      timerHb = setInterval(() => {
        const agora = Date.now();
        for (const [id, cl] of clientes) { if (agora - (cl.ult || agora) > SEM_SINAL + 3000) { try { cl.c.close(); } catch (e) {} saiuCliente(cl.c); } else enviarCli(cl.c, { t: 'hb' }); }
      }, 1000);
      emitir('conectado', info()); contagem();
    }
    function doCliente(c, d) {
      if (!d || typeof d !== 'object') return;
      if (d.t === 'oi') {
        if (c.idJogo) return;
        if (clientes.size + 1 >= MAX) { enviarCli(c, { t: 'cheio' }); setTimeout(() => { try { c.close(); } catch (e) {} }, 500); return; }
        const id = proxId++, nome = String(d.nome || 'Jogador').replace(/[<>]/g, '').slice(0, 20) || 'Jogador';
        c.idJogo = id;
        const lista = [[1, o.nome, o.avatar || null, meuLs]];
        for (const [oid, cl] of clientes) lista.push([oid, cl.nome, cl.avatar, cl.ls]);
        clientes.set(id, { c, nome, avatar: d.avatar || null, pos: null, ls: null, ult: Date.now() });
        enviarCli(c, { t: 'ola', id, n: s.n, lista });
        todos({ t: 'entrou', id, nome, avatar: d.avatar || null }, id);
        emitir('entrou', id, { nome, avatar: d.avatar || null });
        contagem();
        return;
      }
      const id = c.idJogo; const cl = clientes.get(id); if (!cl) return;
      cl.ult = Date.now();
      if (d.t === 'e') cl.pos = d.d, emitir('pos', id, d.d);
      else if (d.t === 'ls') { cl.ls = d.v; todos({ t: 'ls', id, v: d.v }, id); emitir('ls', id, d.v); }
      else if (d.t === 'chat') { const txt = String(d.txt || '').slice(0, 160); todos({ t: 'chat', id, txt }, id); emitir('chat', id, txt); }
      else if (d.t === 're') entregarRemoto(d.tipo, d.c, id, d.a, d.alvo);
    }
    function saiuCliente(c) {
      const id = c.idJogo; if (!id || !clientes.has(id)) return;
      clientes.delete(id); todos({ t: 'saiu', id }); emitir('saiu', id); contagem();
    }
    // RemoteEvent passando pelo anfitrião: 'srv' fica com ele, 'todos' vai para todos, 'um' vai para um só
    function entregarRemoto(tipo, caminho, de, args, alvo) {
      if (tipo === 'srv') return emitir('re', 'srv', caminho, de, args);
      if (tipo === 'todos') { todos({ t: 're', tipo: 'cli', c: caminho, de, a: args }, de); if (de !== 1) emitir('re', 'cli', caminho, de, args); return; }
      if (tipo === 'um') { if (alvo === 1) emitir('re', 'cli', caminho, de, args); else { const cl = clientes.get(alvo); if (cl) enviarCli(cl.c, { t: 're', tipo: 'cli', c: caminho, de, a: args }); } }
    }

    /* ---------- convidado ---------- */
    function entrar(cod, falhou, n) {
      let entrou = false;
      const g = geracao;
      const desistir = () => { if (entrou) return; try { p.destroy(); } catch (e) {} if (peer === p) peer = null; if (g === geracao) falhou(); };
      const limite = setTimeout(desistir, 9000);
      const p = new Peer({ debug: 0 }); peer = p;
      p.on('open', () => {
        if (g !== geracao || peer !== p) { try { p.destroy(); } catch (e) {} return; }
        const c = p.connect(prefixo + cod, { reliable: true }); conn = c;
        c.on('open', () => c.send({ t: 'oi', nome: o.nome, avatar: o.avatar || null }));
        c.on('data', d => {
          if (!d || typeof d !== 'object') return;
          ultimaMsg = Date.now();
          if (d.t === 'ola') {
            entrou = true;
            clearInterval(timerHb); timerHb = setInterval(() => { if (conn !== c) return; if (Date.now() - ultimaMsg > SEM_SINAL) reconectar(); else if (c.open) try { c.send({ t: 'hb' }); } catch (e) {} }, 1000); clearTimeout(limite); s.conectado = true; s.souHost = false; s.meuId = d.id; s.n = d.n || n; s.qtd = d.lista.length + 1;
            emitir('conectado', info());
            for (const [id, nome, avatar, ls] of d.lista) { s.remotosCliente.add(id); emitir('entrou', id, { nome, avatar }); if (ls) emitir('ls', id, ls); }
            if (meuLs) c.send({ t: 'ls', v: meuLs });
            status('');
          } else if (d.t === 'cheio') { clearTimeout(limite); desistir(); }
          else if (d.t === 'entrou') { s.remotosCliente.add(d.id); emitir('entrou', d.id, { nome: d.nome, avatar: d.avatar }); }
          else if (d.t === 'saiu') { s.remotosCliente.delete(d.id); emitir('saiu', d.id); }
          else if (d.t === 'qtd') { s.qtd = d.n; status(''); }
          else if (d.t === 'es') { for (const [id, pos] of d.l) if (id !== s.meuId) emitir('pos', id, pos); }
          else if (d.t === 'ls') emitir('ls', d.id, d.v);
          else if (d.t === 'chat') emitir('chat', d.id, d.txt);
          else if (d.t === 're') emitir('re', d.tipo, d.c, d.de, d.a);
        });
        c.on('close', () => { if (conn !== c) return; if (entrou) reconectar(); else desistir(); });
        c.on('error', () => { if (conn === c && !entrou) desistir(); });
      });
      p.on('error', e => { if (peer !== p) return; if (!entrou) { clearTimeout(limite); desistir(); } else if (e.type === 'peer-unavailable') reconectar(); });
    }

    /* ---------- o que o jogo manda ---------- */
    function enviarPos(d) { meuPos = d; if (!s.souHost && conn && conn.open) try { conn.send({ t: 'e', d }); } catch (e) {} }
    function enviarLs(v) { meuLs = v; if (s.souHost) todos({ t: 'ls', id: 1, v }); else if (conn && conn.open) try { conn.send({ t: 'ls', v }); } catch (e) {} }
    function chat(txt) { txt = String(txt || '').slice(0, 160); if (!txt) return; if (s.souHost) todos({ t: 'chat', id: 1, txt }); else if (conn && conn.open) try { conn.send({ t: 'chat', txt }); } catch (e) {} }
    function remoto(tipo, caminho, args, alvo) {
      if (s.souHost) return entregarRemoto(tipo, caminho, 1, args, alvo);
      if (conn && conn.open) try { conn.send({ t: 're', tipo, c: caminho, a: args, alvo }); } catch (e) {}
    }
    function fechar() { fechado = true; geracao++; limparSessao(); }

    s.remotosCliente = new Set();
    procurar();
    return s;
  };
})();
