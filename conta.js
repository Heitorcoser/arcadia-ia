/* =========================================================================
   ARCÁDIA IA · contas
   Criar conta, entrar, verificação em duas etapas por e-mail, minha conta.
   Conversa com o servidor de contas (Google Apps Script, pasta servidor-contas/).
   ========================================================================= */
(function () {
  'use strict';
  // Endereço do servidor de contas (o link do Apps Script publicado, termina em /exec).
  const URL_SERVIDOR = 'https://script.google.com/macros/s/AKfycbyIWeeBdIRzWCH6vUNYJEhMcqHQtU_uzD4FpvRHJyuYUlwUydrcdUTp3N_9FCu7N6d6/exec';
  const servidor = () => { try { return localStorage.getItem('arcadia.contasUrl') || URL_SERVIDOR; } catch (e) { return URL_SERVIDOR; } };
  const CHAVE = 'arcadia.conta';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || null; } catch (e) { return null; } };
  const gravar = v => { try { v ? localStorage.setItem(CHAVE, JSON.stringify(v)) : localStorage.removeItem(CHAVE); } catch (e) {} };

  /* ---------------- aparelho (vai no aviso de acesso) ---------------- */
  function dispositivo() {
    const ua = navigator.userAgent, d = {};
    const nav = [[/Edg\/([\d]+)/, 'Edge'], [/OPR\/([\d]+)/, 'Opera'], [/SamsungBrowser\/([\d]+)/, 'Samsung Internet'], [/Firefox\/([\d]+)/, 'Firefox'], [/Chrome\/([\d]+)/, 'Chrome'], [/Version\/([\d]+).*Safari/, 'Safari']];
    for (const [re, n] of nav) { const m = ua.match(re); if (m) { d.navegador = n + ' ' + m[1]; break; } }
    const so = [[/Windows NT 10/, 'Windows 10/11'], [/Windows NT 6\.3/, 'Windows 8.1'], [/Windows NT 6\.1/, 'Windows 7'], [/Android ([\d.]+)/, 'Android $1'], [/iPhone OS ([\d_]+)/, 'iOS $1'], [/iPad.*OS ([\d_]+)/, 'iPadOS $1'], [/Mac OS X ([\d_]+)/, 'macOS $1'], [/CrOS/, 'ChromeOS'], [/Linux/, 'Linux']];
    for (const [re, n] of so) { const m = ua.match(re); if (m) { d.sistema = n.replace('$1', (m[1] || '').replace(/_/g, '.')); break; } }
    d.tipo = /Mobi|Android|iPhone/.test(ua) ? 'Celular' : /iPad|Tablet/.test(ua) ? 'Tablet' : 'Computador';
    if (/ArcadiaApp|Electron/.test(ua)) d.app = 'App Arcádia IA';
    d.idioma = navigator.language || '';
    try { d.fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    d.tela = `${screen.width}×${screen.height}`;
    return d;
  }

  /* ---------------- senha: nunca sai do aparelho em texto puro ---------------- */
  async function derivarSenha(email, senha) {
    const enc = new TextEncoder();
    const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('arcadia-ia:' + email.trim().toLowerCase()), iterations: 150000 }, chave, 256);
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function api(acao, dados = {}) {
    const url = servidor();
    if (!url) throw new Error('O sistema de contas ainda não foi ligado. Volte daqui a pouco!');
    let r, j;
    // se o servidor não responder em 35 s, desiste e avisa (nada de "Carregando…" para sempre)
    const ctl = typeof AbortController === 'function' ? new AbortController() : null, tempo = setTimeout(() => ctl && ctl.abort(), 35000);
    try {
      // text/plain evita a "pré-checagem" do navegador, que o Apps Script não responde
      r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao, ...dados }), redirect: 'follow', signal: ctl ? ctl.signal : undefined });
      try { j = await r.json(); } catch (e) { if (e.name === 'AbortError') throw e; throw new Error('O servidor de contas respondeu algo estranho. Tente de novo.'); }
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('O servidor demorou demais para responder. Tente de novo.');
      if (e.message && e.message.startsWith('O servidor')) throw e;
      throw new Error('Sem conexão com o servidor de contas. Confira sua internet.');
    } finally { clearTimeout(tempo); }
    if (!j.ok) { const e = new Error(j.erro || 'Algo deu errado.'); if (j.sessao === false) { gravar(null); atualizarBotao(); } throw e; }
    return j;
  }

  /* ---------------- estilos e estrutura ---------------- */
  const css = `
  .ct-btn{height:40px;padding:0 12px 0 6px;border-radius:10px;border:1px solid var(--line2,#33334a);background:var(--surface,#13131b);color:var(--text,#ececf3);display:inline-flex;align-items:center;gap:8px;font:600 13.5px Inter,system-ui,sans-serif;white-space:nowrap;cursor:pointer}
  .ct-btn:hover{border-color:var(--accent,#8b5cf6)}
  .ct-btn .av{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#22d3ee);color:#fff;font-weight:800;font-size:13px}
  .ct-btn.sem .av{background:var(--surface2,#1a1a25);font-size:15px}
  .ct-fundo{position:fixed;inset:0;z-index:150;background:rgba(3,3,6,.78);backdrop-filter:blur(6px);display:none;align-items:flex-start;justify-content:center;overflow-y:auto;padding:50px 16px}
  .ct-fundo.on{display:flex}
  .ct-caixa{width:min(440px,100%);background:var(--surface,#13131b);border:1px solid var(--line,#262634);border-radius:20px;padding:26px;position:relative;color:var(--text,#ececf3);font-family:Inter,system-ui,sans-serif;animation:ctSobe .22s ease}
  @keyframes ctSobe{from{transform:translateY(12px);opacity:.5}}
  .ct-caixa h2{font-family:"Space Grotesk",Inter,sans-serif;font-size:25px;margin:0 0 4px}
  .ct-caixa .sub{color:var(--muted,#9696ab);font-size:14px;line-height:1.5;margin:0 0 18px}
  .ct-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:9px;border:1px solid var(--line2,#33334a);background:transparent;color:inherit;cursor:pointer;font-size:16px}
  .ct-campo{display:block;margin-bottom:12px}
  .ct-campo span{display:block;font-size:12.5px;color:var(--muted,#9696ab);margin-bottom:5px;font-weight:600}
  .ct-campo input{width:100%;height:44px;border-radius:11px;border:1px solid var(--line2,#33334a);background:var(--bg,#0a0a0f);color:inherit;padding:0 13px;font:15px Inter,system-ui,sans-serif;outline:none}
  .ct-campo input:focus{border-color:var(--accent,#8b5cf6)}
  .ct-senha{position:relative} .ct-senha button{position:absolute;right:8px;top:8px;height:28px;border:0;background:none;color:var(--muted,#9696ab);cursor:pointer;font-size:12.5px;font-weight:600}
  .ct-forca{height:4px;border-radius:4px;background:var(--line,#262634);margin-top:6px;overflow:hidden} .ct-forca i{display:block;height:100%;width:0;transition:.25s}
  .ct-check{display:flex;gap:11px;align-items:flex-start;background:var(--surface2,#1a1a25);border:1px solid var(--line,#262634);border-radius:12px;padding:12px;margin:4px 0 14px;cursor:pointer;font-size:13.5px;line-height:1.45}
  .ct-check input{width:18px;height:18px;margin-top:1px;accent-color:#8b5cf6;flex-shrink:0}
  .ct-check b{display:block;font-size:14px}
  .ct-check small{color:var(--muted,#9696ab)}
  .ct-pri{width:100%;height:46px;border-radius:11px;border:0;background:linear-gradient(135deg,#8b5cf6,#6d4ae0);color:#fff;font:700 15px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(139,92,246,.3)}
  .ct-pri:disabled{opacity:.6;cursor:wait}
  .ct-sec{height:40px;border-radius:10px;border:1px solid var(--line2,#33334a);background:var(--surface2,#1a1a25);color:inherit;font:600 13.5px Inter,system-ui,sans-serif;cursor:pointer;padding:0 14px}
  .ct-sec:hover{border-color:var(--accent,#8b5cf6)}
  .ct-link{background:none;border:0;color:#c4b5fd;font:600 13.5px Inter,system-ui,sans-serif;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
  .ct-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:13.5px;color:var(--muted,#9696ab);gap:10px;flex-wrap:wrap}
  .ct-erro{min-height:20px;color:#fca5a5;font-size:13.5px;font-weight:600;margin:-4px 0 10px}
  .ct-ok{color:#86efac}
  .ct-codigo{display:flex;gap:8px;justify-content:center;margin:6px 0 14px}
  .ct-codigo input{width:46px;height:56px;border-radius:12px;border:1px solid var(--line2,#33334a);background:var(--bg,#0a0a0f);color:inherit;text-align:center;font:700 24px "Space Grotesk",Inter,sans-serif;outline:none}
  .ct-codigo input:focus{border-color:var(--accent,#8b5cf6)}
  .ct-icone{font-size:40px;margin-bottom:6px}
  .ct-bloco{background:var(--surface2,#1a1a25);border:1px solid var(--line,#262634);border-radius:14px;padding:14px;margin-bottom:12px}
  .ct-bloco h4{margin:0 0 8px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted,#9696ab)}
  .ct-linha{display:flex;align-items:center;gap:10px;justify-content:space-between}
  .ct-chave{position:relative;width:46px;height:26px;border-radius:13px;background:var(--line2,#33334a);border:0;cursor:pointer;flex-shrink:0;transition:.2s}
  .ct-chave::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
  .ct-chave.on{background:#22c55e} .ct-chave.on::after{left:23px}
  .ct-acessos{display:grid;gap:6px;max-height:230px;overflow:auto}
  .ct-acessos div{font-size:12.5px;line-height:1.4;display:flex;gap:8px}
  .ct-acessos div b{font-weight:600} .ct-acessos div small{color:var(--muted,#9696ab);display:block}
  .ct-girando{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:ctGira .8s linear infinite;vertical-align:-2px;margin-right:6px}
  @keyframes ctGira{to{transform:rotate(360deg)}}
  .ct-verif{color:#22d3ee;font-weight:800;margin-left:3px}
  .ct-s{display:inline-block;margin-left:4px;vertical-align:-2px;flex-shrink:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
  .ct-selo svg.ct-s{margin:0 2px 0 0;vertical-align:-3px}
  .ct-perfil button.selo{height:26px;font-size:11.5px;margin-top:0;background:transparent;border-style:dashed}
  .ct-selo{display:inline-flex;align-items:center;gap:5px;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.35);color:#67e8f9;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700}
  .ct-vant{display:grid;gap:6px;font-size:13.5px;line-height:1.4} .ct-vant div{display:flex;gap:8px}
  .ct-pubs{display:grid;gap:6px;max-height:220px;overflow:auto}
  .ct-pub{display:flex;align-items:center;gap:10px;font-size:13px;background:var(--bg,#0a0a0f);border:1px solid var(--line,#262634);border-radius:10px;padding:6px 8px}
  .ct-pub img,.ct-pub .ph{width:54px;height:32px;border-radius:6px;object-fit:cover;background:var(--surface,#13131b);display:grid;place-items:center;flex-shrink:0}
  .ct-pub b{display:block;font-size:13.5px} .ct-pub small{color:var(--muted,#9696ab)} .ct-pub span.tx{flex:1;min-width:0}
  .ct-pub button{border:0;background:none;color:var(--muted,#9696ab);cursor:pointer;font-size:15px}
  #conta-lugar .ct-btn{height:28px;font-size:12.5px;border-radius:7px} #conta-lugar .ct-btn .av{width:20px;height:20px;font-size:11px;border-radius:6px}
  .ct-btn{position:relative}
  .ct-badge{position:absolute;top:-7px;right:-7px;min-width:19px;height:19px;border-radius:10px;background:#ef4444;color:#fff;font:800 11px Inter,system-ui,sans-serif;display:grid;place-items:center;padding:0 5px;box-shadow:0 0 0 2px var(--bg,#0a0a0f)}
  .ct-amg{display:grid;gap:6px;max-height:260px;overflow:auto}
  .ct-amg>div{display:flex;align-items:center;gap:10px;background:var(--bg,#0a0a0f);border:1px solid var(--line,#262634);border-radius:11px;padding:7px 9px;font-size:13px}
  .ct-amg .av{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#22d3ee);color:#fff;font-weight:800;position:relative;flex-shrink:0}
  .ct-amg .av i{position:absolute;right:-3px;bottom:-3px;width:11px;height:11px;border-radius:50%;background:#52525b;border:2px solid var(--bg,#0a0a0f)} .ct-amg .av i.on{background:#22c55e}
  .ct-amg .tx{flex:1;min-width:0} .ct-amg .tx b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .ct-amg .tx small{color:var(--muted,#9696ab)}
  .ct-amg button{height:32px;border-radius:9px;border:1px solid var(--line2,#33334a);background:var(--surface2,#1a1a25);color:inherit;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer;padding:0 10px;flex-shrink:0}
  .ct-amg button.ok{background:#22c55e;border-color:transparent;color:#052e12} .ct-amg button:disabled{opacity:.55;cursor:default}
  .ct-caixa.larga{width:min(600px,100%)}
  .ct-fot{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#22d3ee);color:#fff;font-weight:800;font-size:17px;position:relative;flex-shrink:0;line-height:1;user-select:none}
  .ct-fot.emo{font-size:22px} .ct-fot.g{width:64px;height:64px;font-size:26px} .ct-fot.g.emo{font-size:36px} .ct-fot.gg{width:84px;height:84px;font-size:34px} .ct-fot.gg.emo{font-size:48px}
  .ct-fot i{position:absolute;right:1px;bottom:1px;width:13px;height:13px;border-radius:50%;background:#52525b;border:2.5px solid var(--surface,#13131b)} .ct-fot.g i{width:16px;height:16px;right:2px;bottom:2px} .ct-fot i.on{background:#22c55e}
  .ct-btn .av.emo{border-radius:50%;font-size:17px}
  .ct-amg .av.ct-fot{width:34px;height:34px;border-radius:50%;font-size:14px} .ct-amg .av.ct-fot.emo{font-size:19px}
  .ct-fila{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;margin:0 -2px 6px;scrollbar-width:thin;scroll-snap-type:x proximity}
  .ct-it{flex:0 0 76px;display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:0;color:inherit;cursor:pointer;padding:0;font-family:inherit;scroll-snap-align:start;text-align:center}
  .ct-it b{font-size:12.5px;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
  .ct-it small{font-size:11px;color:var(--muted,#9696ab);max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;margin-top:-3px} .ct-it small.on{color:#86efac}
  .ct-it.sel .ct-fot{box-shadow:0 0 0 3px var(--surface,#13131b),0 0 0 5px #8b5cf6}
  .ct-it .mais{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;border:2px dashed var(--line2,#44445e);font-size:30px;color:#c4b5fd;transition:.15s}
  .ct-it:hover .mais{border-color:#8b5cf6;background:#8b5cf61a}
  .ct-det{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  .ct-det .tx{flex:1;min-width:150px} .ct-det .tx b{font-size:17px;display:block} .ct-det .tx small{color:var(--muted,#9696ab);font-size:13px;display:block;margin-top:2px}
  .ct-busca{position:relative;margin-bottom:14px} .ct-busca input{width:100%;height:44px;border-radius:22px;border:1px solid var(--line2,#33334a);background:var(--bg,#0a0a0f);color:inherit;padding:0 16px 0 40px;font:15px Inter,system-ui,sans-serif;outline:none} .ct-busca input:focus{border-color:var(--accent,#8b5cf6)}
  .ct-busca:before{content:"🔍";position:absolute;left:14px;top:12px;font-size:15px;opacity:.7}
  .ct-perfis{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
  .ct-perfil{background:var(--surface2,#1a1a25);border:1px solid var(--line,#262634);border-radius:14px;padding:14px 10px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;min-width:0}
  .ct-perfil b{font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ct-perfil small{font-size:11.5px;color:var(--muted,#9696ab);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:-4px} .ct-perfil small.on{color:#86efac}
  .ct-perfil button{width:100%;height:34px;border-radius:9px;border:1px solid var(--line2,#33334a);background:var(--surface,#13131b);color:inherit;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;margin-top:2px}
  .ct-perfil button.ok{background:#22c55e;border-color:transparent;color:#052e12} .ct-perfil button:disabled{opacity:.6;cursor:default}
  .ct-escolha{display:grid;grid-template-columns:repeat(auto-fill,minmax(42px,1fr));gap:6px;margin:10px 0}
  .ct-escolha button{height:42px;border-radius:10px;border:1px solid var(--line,#262634);background:var(--bg,#0a0a0f);font-size:22px;cursor:pointer;padding:0} .ct-escolha button.sel{border-color:#8b5cf6;box-shadow:0 0 0 2px #8b5cf6}
  .ct-cores{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px} .ct-cores button{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0} .ct-cores button.sel{border-color:#fff;box-shadow:0 0 0 2px #8b5cf6}
  .ct-cod{font:700 19px "Space Grotesk",ui-monospace,monospace;letter-spacing:3px;color:#fcd34d}
  .ct-vazio{color:var(--muted,#9696ab);font-size:13px}
  @media (max-width:520px){ .ct-amg>div{flex-wrap:wrap} .ct-amg .tx{min-width:calc(100% - 50px)} .ct-amg>div>button{flex:1} .ct-perfis{grid-template-columns:repeat(2,1fr)} .ct-btn span.nm{display:none} .ct-codigo input{width:40px;height:50px} }`;

  function montar() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement('button'); b.className = 'ct-btn'; b.id = 'ct-btn'; b.type = 'button';
    const lugar = document.querySelector('header .top') || document.getElementById('conta-lugar'); if (lugar) lugar.appendChild(b);
    b.addEventListener('click', () => ler() ? abrir('minha') : abrir('entrar'));
    const f = document.createElement('div'); f.className = 'ct-fundo'; f.id = 'ct-fundo';
    f.innerHTML = '<div class="ct-caixa" id="ct-caixa" role="dialog" aria-modal="true"></div>';
    f.addEventListener('mousedown', e => { if (e.target === f) fechar(); });
    document.body.appendChild(f);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && f.classList.contains('on')) fechar(); });
    atualizarBotao();
    const c = ler(); if (c) api('eu', { token: c.token }).then(j => { c.usuario = j.usuario; gravar(c); atualizarBotao(); }).catch(() => {});
    // presença: avisa que está on-line (e em qual jogo) e descobre se chegaram pedidos de amizade
    if (/\/studio\//.test(location.pathname)) jogoAtual = 'Arcádia Studio';
    presenca(); setInterval(() => { if (!document.hidden) presenca(); }, 120000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) presenca(); });
  }
  let jogoAtual = '', pedidosPend = 0;
  function presenca() { const c = ler(); if (!c || !servidor()) return; api('presenca', { token: c.token, jogo: jogoAtual }).then(j => { pedidosPend = j.pedidos || 0; atualizarBotao(); }).catch(() => {}); }
  function atualizarBotao() {
    const b = $('#ct-btn'); if (!b) return; const c = ler();
    if (c && c.usuario) { b.classList.remove('sem'); const f = foto(c.usuario); b.innerHTML = `<span class="av${f.emoji ? ' emo' : ''}" style="${f.estilo}">${esc(f.txt)}</span><span class="nm">${esc(c.usuario.nome)}${seloIco(c.usuario.selo)}</span>` + (pedidosPend > 0 ? `<span class="ct-badge" title="Pedidos de amizade">${pedidosPend}</span>` : ''); b.title = 'Minha conta (verificada)'; }
    else { b.classList.add('sem'); b.innerHTML = '<span class="av">👤</span><span class="nm">Entrar</span>'; b.title = 'Entrar ou criar conta'; }
    window.dispatchEvent(new CustomEvent('arcadia-conta', { detail: c && c.usuario }));
  }

  /* ---------------- telas ---------------- */
  let pendente = null; // { desafio, email, motivo, senhaHashNova? }
  const caixa = () => $('#ct-caixa');
  function abrir(tela, extra) { $('#ct-fundo').classList.add('on'); document.body.style.overflow = 'hidden'; render(tela, extra); }
  function fechar() { $('#ct-fundo').classList.remove('on'); document.body.style.overflow = ''; }
  function erroTela(t, ok) { const e = $('#ct-erro'); if (e) { e.textContent = t || ''; e.classList.toggle('ct-ok', !!ok); } }
  async function ocupado(botao, fn) {
    const txt = botao.innerHTML; botao.disabled = true; botao.innerHTML = '<span class="ct-girando"></span>Aguarde…'; erroTela('');
    try { await fn(); } catch (e) { erroTela(e.message); } finally { if (document.body.contains(botao)) { botao.disabled = false; botao.innerHTML = txt; } }
  }
  const campoSenha = (id, ph, auto) => `<label class="ct-campo"><span>${ph}</span><div class="ct-senha"><input id="${id}" type="password" autocomplete="${auto}" minlength="8" required><button type="button" data-ver="${id}">mostrar</button></div></label>`;
  function ligarVerSenha() { caixa().querySelectorAll('[data-ver]').forEach(b => b.onclick = () => { const i = $('#' + b.dataset.ver); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'mostrar' : 'esconder'; }); }
  function forca(s) { let p = 0; if (s.length >= 8) p++; if (s.length >= 12) p++; if (/[A-Z]/.test(s) && /[a-z]/.test(s)) p++; if (/\d/.test(s)) p++; if (/[^A-Za-z0-9]/.test(s)) p++; return p; }
  function validarSenha(s) { if (s.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.'); if (forca(s) < 2) throw new Error('Senha fraca demais. Misture letras, números ou símbolos.'); }

  function render(tela, extra) {
    caixa().onclick = null; // cada tela liga os próprios cliques
    caixa().classList.toggle('larga', tela === 'amigos' || tela === 'add-amigos');
    const c = caixa(), x = '<button class="ct-x" type="button" aria-label="Fechar">✕</button>';
    const semServidor = !servidor() ? `<div class="ct-bloco" style="border-color:#f59e0b55;color:#fcd34d;font-size:13.5px;line-height:1.5">⚙️ O sistema de contas ainda está sendo ligado. Você já pode jogar normalmente sem conta.</div>` : '';

    if (tela === 'entrar') {
      c.innerHTML = `${x}<h2>Entrar</h2><p class="sub">Use sua conta para levar seu nome para todos os jogos.</p>${semServidor}
        <form id="ct-form" autocomplete="on"><label class="ct-campo"><span>E-mail</span><input id="ct-email" type="email" autocomplete="email" required value="${esc(extra && extra.email || '')}"></label>
        ${campoSenha('ct-senha', 'Senha', 'current-password')}<div class="ct-erro" id="ct-erro"></div><button class="ct-pri" id="ct-ir">Entrar</button></form>
        <div class="ct-rodape"><button class="ct-link" data-ir="esqueci">Esqueci minha senha</button><span>Novo aqui? <button class="ct-link" data-ir="criar">Criar conta</button></span></div>`;
      $('#ct-form').onsubmit = e => { e.preventDefault(); ocupado($('#ct-ir'), async () => {
        const email = $('#ct-email').value.trim(), senha = $('#ct-senha').value;
        const j = await api('entrar', { email, senhaHash: await derivarSenha(email, senha), dispositivo: dispositivo() });
        if (j.token) return concluirLogin(j); pendente = j; render('codigo');
      }); };
    }
    else if (tela === 'criar') {
      c.innerHTML = `${x}<h2>Criar conta</h2><p class="sub">É grátis. Vamos mandar um código para confirmar seu e-mail.</p>${semServidor}<div class="ct-bloco">${VANTAGENS}</div>
        <form id="ct-form" autocomplete="on"><label class="ct-campo"><span>Seu nome nos jogos</span><input id="ct-nome" maxlength="24" autocomplete="nickname" required></label>
        <label class="ct-campo"><span>E-mail</span><input id="ct-email" type="email" autocomplete="email" required></label>
        ${campoSenha('ct-senha', 'Senha (mínimo 8 caracteres)', 'new-password')}<div class="ct-forca" style="margin:-6px 0 12px"><i id="ct-forca"></i></div>
        ${campoSenha('ct-senha2', 'Repita a senha', 'new-password')}
        <label class="ct-check"><input type="checkbox" id="ct-2f" checked><span><b>🛡️ Verificação em duas etapas por e-mail</b><small>Além da senha, pedimos um código enviado para o seu e-mail toda vez que alguém entrar. Recomendado.</small></span></label>
        <div class="ct-erro" id="ct-erro"></div><button class="ct-pri" id="ct-ir">Criar conta</button></form>
        <div class="ct-rodape"><span>Já tem conta? <button class="ct-link" data-ir="entrar">Entrar</button></span></div>`;
      const cores = ['#ef4444', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#22c55e'];
      $('#ct-senha').oninput = e => { const p = forca(e.target.value); const i = $('#ct-forca'); i.style.width = (p / 5 * 100) + '%'; i.style.background = cores[p]; };
      $('#ct-form').onsubmit = e => { e.preventDefault(); ocupado($('#ct-ir'), async () => {
        const nome = $('#ct-nome').value.trim(), email = $('#ct-email').value.trim(), senha = $('#ct-senha').value;
        if (nome.length < 2) throw new Error('Escolha um nome com pelo menos 2 letras.');
        validarSenha(senha); if (senha !== $('#ct-senha2').value) throw new Error('As duas senhas não são iguais.');
        pendente = await api('cadastrar', { nome, email, senhaHash: await derivarSenha(email, senha), doisFatores: $('#ct-2f').checked, dispositivo: dispositivo() });
        render('codigo');
      }); };
    }
    else if (tela === 'esqueci') {
      c.innerHTML = `${x}<div class="ct-icone">🔑</div><h2>Esqueci minha senha</h2><p class="sub">Digite o e-mail da conta. Se ele estiver cadastrado, mandamos um código para criar uma senha nova.</p>${semServidor}
        <form id="ct-form"><label class="ct-campo"><span>E-mail</span><input id="ct-email" type="email" autocomplete="email" required></label><div class="ct-erro" id="ct-erro"></div><button class="ct-pri" id="ct-ir">Mandar código</button></form>
        <div class="ct-rodape"><button class="ct-link" data-ir="entrar">← Voltar</button></div>`;
      $('#ct-form').onsubmit = e => { e.preventDefault(); ocupado($('#ct-ir'), async () => { pendente = await api('esqueciSenha', { email: $('#ct-email').value.trim(), dispositivo: dispositivo() }); render('codigo'); }); };
    }
    else if (tela === 'codigo') {
      const p = pendente || {}, senha = p.motivo === 'senha';
      const titulos = { verificar: ['📬', 'Confirme seu e-mail', 'Mandamos um código de 6 números para'], login: ['🛡️', 'Verificação em duas etapas', 'Sua conta pede um código extra. Mandamos para'], senha: ['🔑', 'Crie uma senha nova', 'Se o e-mail estiver cadastrado, mandamos um código para'] }[p.motivo] || ['📬', 'Digite o código', 'Mandamos um código para'];
      c.innerHTML = `${x}<div class="ct-icone">${titulos[0]}</div><h2>${titulos[1]}</h2><p class="sub">${titulos[2]} <b>${esc(p.email)}</b>. Olhe também a caixa de spam.</p>
        <form id="ct-form"><div class="ct-codigo">${'<input inputmode="numeric" autocomplete="one-time-code">'.repeat(6)}</div>
        ${senha ? campoSenha('ct-senha', 'Senha nova (mínimo 8 caracteres)', 'new-password') + campoSenha('ct-senha2', 'Repita a senha nova', 'new-password') : ''}
        <div class="ct-erro" id="ct-erro"></div><button class="ct-pri" id="ct-ir">${senha ? 'Salvar senha nova' : 'Confirmar'}</button></form>
        <div class="ct-rodape"><button class="ct-link" id="ct-reenviar">Mandar outro código</button><button class="ct-link" data-ir="entrar">Cancelar</button></div>`;
      const ins = [...c.querySelectorAll('.ct-codigo input')];
      ins.forEach((inp, i) => {
        inp.addEventListener('input', () => {
          const d = inp.value.replace(/\D/g, '');
          if (d.length > 1) { d.slice(0, 6 - i).split('').forEach((n, k) => { ins[i + k].value = n; }); (ins[Math.min(5, i + d.length)] || ins[5]).focus(); } // vários dígitos de uma vez (colar / preenchimento automático)
          else { inp.value = d; if (d && ins[i + 1]) ins[i + 1].focus(); }
          if (!senha && ins.every(x => x.value)) $('#ct-ir').click();
        });
        inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
        inp.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length) { e.preventDefault(); t.split('').forEach((d, k) => { if (ins[k]) ins[k].value = d; }); (ins[t.length] || ins[5]).focus(); if (!senha && t.length === 6) $('#ct-ir').click(); } });
      });
      setTimeout(() => ins[0].focus(), 50);
      $('#ct-form').onsubmit = e => { e.preventDefault(); ocupado($('#ct-ir'), async () => {
        const codigo = ins.map(x => x.value).join(''); if (codigo.length !== 6) throw new Error('Digite os 6 números do código.');
        if (senha) {
          const s = $('#ct-senha').value; validarSenha(s); if (s !== $('#ct-senha2').value) throw new Error('As duas senhas não são iguais.');
          return concluirLogin(await api('redefinirSenha', { desafio: p.desafio, codigo, senhaHash: await derivarSenha(p.email, s), dispositivo: dispositivo() }));
        }
        concluirLogin(await api(p.motivo === 'verificar' ? 'verificarEmail' : 'confirmarCodigo', { desafio: p.desafio, codigo, dispositivo: dispositivo() }));
      }); };
      $('#ct-reenviar').onclick = () => ocupado($('#ct-reenviar'), async () => { pendente = await api('reenviarCodigo', { desafio: p.desafio }); render('codigo'); erroTela('Código novo enviado!', true); });
    }
    else if (tela === 'minha') {
      const conta = ler(); if (!conta) return render('entrar');
      const u = conta.usuario || {};
      c.innerHTML = `${x}<div class="ct-det" style="margin-bottom:16px">${avatar(u, 'gg')}<div class="tx"><h2 style="margin:0">Minha conta</h2><small>${esc(u.nome)} · ${esc(u.email)}</small><span class="ct-selo"${u.selo === 'criador' ? ' style="background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.4);color:#fcd34d"' : ''}>${u.selo === 'criador' ? seloSvg('criador', 16) + ' Criador da Arcádia' : u.selo === 'verificado' ? seloSvg('verificado', 16) + ' Verificado' : '✓ E-mail confirmado'}${u.criadoEm ? ' · desde ' + new Date(u.criadoEm).toLocaleDateString('pt-BR') : ''}</span><br><button class="ct-link" id="ct-trocar-foto" style="margin-top:6px">🎨 Trocar foto de perfil</button></div></div>
        <div class="ct-bloco"><b style="font-size:14.5px">🎮 Publicar no Studio</b><br><small style="color:var(--muted,#9696ab)">${esc(u.limites || (u.selo ? 'publicações ilimitadas, até ~20 MB cada' : 'até 60 publicações de até ~2 MB'))}${u.selo === 'criador' ? '. Você pode dar o selo de verificado para outras contas em 👥 Amigos → Adicionar.' : u.selo === 'verificado' ? (u.seloOrigem === 'curtidas' ? ' · selo ganho com um jogo de 1.000 curtidas' : ' · selo dado pelo criador') : '. Ganhe o selo de verificado com um jogo de 1.000 curtidas, ou com a verificação do criador.'}</small></div>
        <div class="ct-bloco" id="ct-blk-foto" style="display:none"><h4>Sua foto de perfil</h4><div class="ct-linha" style="justify-content:flex-start;gap:8px;margin-bottom:6px"><label class="ct-sec" style="display:inline-flex;align-items:center;cursor:pointer">📷 Enviar uma foto<input type="file" id="ct-arquivo-foto" accept="image/*" style="display:none"></label><small style="color:var(--muted,#9696ab)">ou escolha um desenho:</small></div><div class="ct-escolha" id="ct-emojis">${FOTOS.map(e => `<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div><div class="ct-cores" id="ct-cores">${CORES.map(k => `<button type="button" data-cor="${k}" style="background:${k}" aria-label="Cor"></button>`).join('')}</div><div class="ct-linha"><span class="ct-linha" style="justify-content:flex-start"><span id="ct-previa"></span><small style="color:var(--muted,#9696ab)">É assim que seus amigos (e os outros jogadores) vão te ver.</small></span><button class="ct-sec" id="ct-salvar-foto" style="white-space:nowrap">Salvar foto</button></div></div>
        <div class="ct-bloco"><div class="ct-linha"><span><b style="font-size:14.5px">👥 Amigos</b><br><small style="color:var(--muted,#9696ab)">${pedidosPend > 0 ? `<b style="color:#fca5a5">${pedidosPend} pedido${pedidosPend > 1 ? 's' : ''} esperando resposta</b>` : 'Adicione amigos e veja quem está on-line'}</small></span><button class="ct-sec" data-ir="amigos">Abrir</button></div></div>
        <div class="ct-bloco"><h4>🎮 Suas publicações</h4><div class="ct-pubs" id="ct-pubs"><span style="color:var(--muted,#9696ab);font-size:13px"><span class="ct-girando"></span>Carregando…</span></div>
          <div style="margin-top:8px;font-size:12.5px;color:var(--muted,#9696ab)" id="ct-nuvem"></div></div>
        <div class="ct-bloco"><div class="ct-linha"><span><b style="font-size:14.5px">🛡️ Verificação em duas etapas</b><br><small style="color:var(--muted,#9696ab)">Pede um código por e-mail em todo acesso</small></span><button class="ct-chave ${u.doisFatores ? 'on' : ''}" id="ct-chave" aria-label="Ligar ou desligar"></button></div>
          <div id="ct-confirma" style="display:none;margin-top:12px">${campoSenha('ct-senha', 'Digite sua senha para confirmar', 'current-password')}<button class="ct-sec" id="ct-salvar2f" style="width:100%"></button></div></div>
        <div class="ct-bloco"><h4>Seu nome nos jogos</h4><div class="ct-linha"><input id="ct-nome" class="ct-campo" style="margin:0;flex:1;height:40px;border-radius:10px;border:1px solid var(--line2,#33334a);background:var(--bg,#0a0a0f);color:inherit;padding:0 12px;font:15px Inter,sans-serif" maxlength="24" value="${esc(u.nome)}"><button class="ct-sec" id="ct-salvar-nome">Salvar</button></div></div>
        <div class="ct-bloco"><h4>Acessos recentes</h4><div class="ct-acessos" id="ct-acessos"><span style="color:var(--muted,#9696ab);font-size:13px"><span class="ct-girando"></span>Carregando…</span></div></div>
        <div class="ct-erro" id="ct-erro"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ct-sec" id="ct-sair">Sair</button><button class="ct-sec" id="ct-sair-todos">Sair de todos os aparelhos</button></div>`;
      api('eu', { token: conta.token }).then(j => {
        conta.usuario = j.usuario; gravar(conta); atualizarBotao();
        $('#ct-chave') && $('#ct-chave').classList.toggle('on', !!j.usuario.doisFatores);
        const lista = $('#ct-acessos'); if (!lista) return;
        const icone = { sucesso: '✅', 'senha errada': '❌' };
        lista.innerHTML = (j.acessos.length ? j.acessos.map(a => `<div><span>${icone[a.resultado] || '•'}</span><span><b>${new Date(a.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</b> · ${esc(a.resultado === 'sucesso' ? a.metodo : a.resultado)}<small>${esc([a.dispositivo.navegador, a.dispositivo.sistema, a.dispositivo.tipo].filter(Boolean).join(' · ') || 'aparelho desconhecido')}</small></span></div>`).join('') : '<span style="color:var(--muted,#9696ab);font-size:13px">Nenhum acesso ainda.</span>')
          + `<div style="color:var(--muted,#9696ab);margin-top:4px">${j.sessoesAbertas} aparelho${j.sessoesAbertas === 1 ? '' : 's'} com a conta aberta agora.</div>`;
      }).catch(e => { const l = $('#ct-acessos'); if (l) l.textContent = e.message; if (!ler()) render('entrar'); });
      carregarPublicacoes(conta);
      { // escolher a foto de perfil
        const atual = String(u.foto || '').split('|'); let emo = atual.length === 2 ? atual[0] : FOTOS[0], cor = atual.length === 2 ? atual[1] : CORES[0], imagem = FOTO_IMG.test(u.foto || '') ? u.foto : null;
        const escolhida = () => imagem || emo + '|' + cor;
        const marcar = () => { c.querySelectorAll('#ct-emojis button').forEach(b => b.classList.toggle('sel', !imagem && b.dataset.emoji === emo)); c.querySelectorAll('#ct-cores button').forEach(b => b.classList.toggle('sel', !imagem && b.dataset.cor === cor)); $('#ct-previa').innerHTML = avatar({ foto: escolhida() }); };
        // foto de verdade: recorta um quadrado no meio, reduz para 128 px e vira JPEG leve (~8 KB), para ir rápido pela rede nos jogos
        $('#ct-arquivo-foto').onchange = ev => {
          const arq = ev.target.files && ev.target.files[0]; if (!arq) return;
          if (!/^image\//.test(arq.type)) return erroTela('Escolha um arquivo de imagem.');
          const im = new Image(), url = URL.createObjectURL(arq);
          im.onload = () => { const s = Math.min(im.width, im.height), cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128); g.imageSmoothingQuality = 'high'; g.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128); URL.revokeObjectURL(url);
            let d = ''; for (const q of [0.85, 0.75, 0.6, 0.45]) { d = cv.toDataURL('image/jpeg', q); if (d.length <= 20000) break; }
            imagem = d; marcar(); erroTela('Ficou assim? Aperte "Salvar foto".', true); };
          im.onerror = () => { URL.revokeObjectURL(url); erroTela('Não consegui abrir essa imagem.'); };
          im.src = url;
        };
        $('#ct-trocar-foto').onclick = () => { const bl = $('#ct-blk-foto'); bl.style.display = bl.style.display === 'none' ? '' : 'none'; marcar(); };
        $('#ct-emojis').onclick = ev => { const b = ev.target.closest('[data-emoji]'); if (b) { emo = b.dataset.emoji; imagem = null; marcar(); } };
        $('#ct-cores').onclick = ev => { const b = ev.target.closest('[data-cor]'); if (b) { cor = b.dataset.cor; imagem = null; marcar(); } };
        $('#ct-salvar-foto').onclick = () => ocupado($('#ct-salvar-foto'), async () => { const j = await api('alterarFoto', { token: conta.token, foto: escolhida() }); conta.usuario = j.usuario; gravar(conta); atualizarBotao(); render('minha'); erroTela('Foto salva! 🎉', true); });
      }
      let querLigar = !u.doisFatores;
      $('#ct-chave').onclick = () => { querLigar = !$('#ct-chave').classList.contains('on'); $('#ct-confirma').style.display = 'block'; $('#ct-salvar2f').textContent = querLigar ? 'Ligar verificação em duas etapas' : 'Desligar verificação em duas etapas'; ligarVerSenha(); $('#ct-senha').focus(); };
      $('#ct-salvar2f').onclick = () => ocupado($('#ct-salvar2f'), async () => {
        const j = await api('alterarDoisFatores', { token: conta.token, ativar: querLigar, senhaHash: await derivarSenha(u.email, $('#ct-senha').value) });
        conta.usuario = j.usuario; gravar(conta); render('minha'); erroTela(querLigar ? 'Verificação em duas etapas ligada. Mandamos um aviso para o seu e-mail.' : 'Verificação em duas etapas desligada.', true);
      });
      $('#ct-salvar-nome').onclick = () => ocupado($('#ct-salvar-nome'), async () => { const j = await api('alterarNome', { token: conta.token, nome: $('#ct-nome').value }); conta.usuario = j.usuario; gravar(conta); atualizarBotao(); erroTela('Nome salvo!', true); });
      $('#ct-sair').onclick = async () => { api('sair', { token: conta.token }).catch(() => {}); gravar(null); atualizarBotao(); fechar(); };
      $('#ct-sair-todos').onclick = () => ocupado($('#ct-sair-todos'), async () => { await api('sairTodos', { token: conta.token }); gravar(null); atualizarBotao(); render('entrar'); erroTela('Pronto: sua conta foi fechada em todos os aparelhos.', true); });
    }
    else if (tela === 'amigos') {
      const conta = ler(); if (!conta) return render('entrar');
      c.innerHTML = `${x}<h2 id="ct-tit-amg">Amigos</h2><p class="sub">Veja quem está on-line e em qual jogo.</p>
        <div class="ct-fila" id="ct-fila">${itemAdicionar()}<span class="ct-vazio" style="align-self:center;padding-left:6px"><span class="ct-girando"></span>Carregando…</span></div>
        <div class="ct-bloco" id="ct-det" style="display:none"></div>
        <div class="ct-bloco" id="ct-blk-rec" style="display:none"><h4>📨 Pedidos de amizade</h4><div class="ct-amg" id="ct-rec"></div></div>
        <div class="ct-bloco" id="ct-blk-env" style="display:none"><h4>⏳ Pedidos que você mandou</h4><div class="ct-amg" id="ct-env"></div></div>
        <div class="ct-bloco"><div class="ct-linha"><span><small style="color:var(--muted,#9696ab)">Seu código de amigo</small><br><span class="ct-cod" id="ct-cod">········</span></span><button class="ct-sec" id="ct-copiar" disabled>Copiar</button></div></div>
        <div class="ct-erro" id="ct-erro"></div>
        <div class="ct-rodape"><button class="ct-link" data-ir="minha">← Minha conta</button><button class="ct-link" id="ct-atualizar">Atualizar</button></div>`;
      $('#ct-atualizar').onclick = () => { erroTela(''); carregarAmigos(conta); };
      $('#ct-copiar').onclick = async () => { const cod = $('#ct-cod').dataset.cod; if (!cod) return; try { await navigator.clipboard.writeText(cod); erroTela('Código copiado! Mande para seus amigos.', true); } catch (e) { erroTela('Seu código: ' + cod, true); } };
      c.onclick = ev => {
        const it = ev.target.closest('[data-amigo]'); if (it) return mostrarAmigo(it.dataset.amigo);
        acaoAmizade(ev, conta, () => carregarAmigos(conta));
      };
      carregarAmigos(conta);
    }
    else if (tela === 'add-amigos') {
      const conta = ler(); if (!conta) return render('entrar');
      c.innerHTML = `${x}<h2>Adicionar amigos</h2><p class="sub">Escolha alguém da lista ou pesquise pelo nome (ou código de amigo).</p>
        <form class="ct-busca" id="ct-busca"><input id="ct-q" type="search" maxlength="24" placeholder="Pesquisar um nome" autocomplete="off" enterkeyhint="search"></form>
        <h4 id="ct-tit-lista" style="margin:0 0 10px;font-size:13px;color:var(--muted,#9696ab);text-transform:uppercase;letter-spacing:.06em">Todos os perfis</h4>
        <div class="ct-perfis" id="ct-lista"></div>
        <div style="text-align:center;margin-top:12px"><button class="ct-sec" id="ct-mais" style="display:none">Mostrar mais</button></div>
        <div class="ct-erro" id="ct-erro"></div>
        <div class="ct-rodape"><button class="ct-link" data-ir="amigos">← Amigos</button></div>`;
      let proximo = 0, pedido = 0, espera = 0;
      const lista = $('#ct-lista'), tit = $('#ct-tit-lista'), mais = $('#ct-mais');
      const carregando = '<span class="ct-vazio" style="grid-column:1/-1"><span class="ct-girando"></span>Carregando…</span>';
      const vazio = t => `<span class="ct-vazio" style="grid-column:1/-1;padding:10px 0">${t}</span>`;
      const todos = async (inicio = 0) => {
        const n = ++pedido; if (!inicio) lista.innerHTML = carregando; mais.disabled = true;
        try {
          const j = await api('listarPerfis', { token: conta.token, inicio }); if (n !== pedido || !lista.isConnected) return;
          tit.textContent = `Todos os perfis · ${j.total}`; proximo = j.proximo;
          const html = j.contas.map(cartaoPerfil).join('');
          if (inicio) lista.insertAdjacentHTML('beforeend', html); else lista.innerHTML = html || vazio('Ainda não tem mais ninguém com conta por aqui. Chame seus amigos!');
          mais.style.display = proximo ? '' : 'none';
        } catch (e) { if (n === pedido) lista.innerHTML = vazio(esc(e.message) + ' <button class="ct-link" data-recarregar>Tentar de novo</button>'); }
        mais.disabled = false;
      };
      const buscar = async q => {
        const n = ++pedido; lista.innerHTML = carregando; mais.style.display = 'none'; tit.textContent = `Resultados para “${q}”`;
        try {
          const j = await api('buscarAmigos', { token: conta.token, q }); if (n !== pedido || !lista.isConnected) return;
          lista.innerHTML = j.contas.length ? j.contas.map(cartaoPerfil).join('') : vazio('Ninguém encontrado com esse nome ou código.');
        } catch (e) { if (n === pedido) lista.innerHTML = vazio(esc(e.message)); }
      };
      const digitou = () => { clearTimeout(espera); const q = $('#ct-q').value.trim(); espera = setTimeout(() => q.length >= 2 ? buscar(q) : (q ? 0 : todos()), q ? 450 : 0); };
      $('#ct-q').oninput = digitou;
      $('#ct-busca').onsubmit = e => { e.preventDefault(); clearTimeout(espera); const q = $('#ct-q').value.trim(); if (q.length >= 2) buscar(q); else if (!q) todos(); else erroTela('Digite pelo menos 2 letras.'); };
      mais.onclick = () => todos(proximo);
      c.onclick = ev => {
        if (ev.target.closest('[data-recarregar]')) return todos();
        const bf = ev.target.closest('[data-tirar-foto]');
        if (bf) { if (!confirm('Tirar a foto desta conta? Ela volta para a inicial do nome.')) return; bf.disabled = true; api('apagarFoto', { token: conta.token, id: bf.dataset.tirarFoto }).then(() => { erroTela('Foto removida.', true); const q = $('#ct-q').value.trim(); if (q.length >= 2) buscar(q); else todos(); }).catch(e => { erroTela(e.message); bf.disabled = false; }); return; }
        const bs = ev.target.closest('[data-selo]');
        if (bs) { bs.disabled = true; api('darSelo', { token: conta.token, id: bs.dataset.selo, dar: bs.dataset.dar === '1' }).then(j => { erroTela(bs.dataset.dar === '1' ? `${j.conta.nome} agora é verificado (e recebeu um e-mail de parabéns).` : `Selo tirado de ${j.conta.nome}.`, true); const q = $('#ct-q').value.trim(); if (q.length >= 2) buscar(q); else todos(); }).catch(e => { erroTela(e.message); bs.disabled = false; }); return; }
        acaoAmizade(ev, conta, (b, j, ac) => { // atualiza só o cartão, sem recarregar a lista
          b.className = ''; b.disabled = true;
          b.textContent = ac === 'aceitar' || j.estado === 'aceita' ? 'Amigos ✓' : 'Pedido enviado';
          presenca();
        });
      };
      todos();
    }
    else if (tela === 'pronto') {
      const u = (ler() || {}).usuario || {};
      c.innerHTML = `${x}<div class="ct-icone">🎉</div><h2>Oi, ${esc(u.nome)}!</h2><p class="sub">Você entrou. Seu nome já vai aparecer preenchido nos jogos. Sempre que alguém entrar na sua conta, você recebe um aviso no e-mail com os detalhes.</p>
        <div class="ct-bloco"><h4>Com a sua conta você pode</h4>${VANTAGENS}</div><button class="ct-pri" id="ct-ok">Bora jogar</button>`;
      $('#ct-ok').onclick = fechar;
    }
    c.querySelector('.ct-x').onclick = fechar;
    c.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => render(b.dataset.ir));
    ligarVerSenha();
    const pri = c.querySelector('input:not([type=checkbox])'); if (pri && tela !== 'codigo' && tela !== 'minha') setTimeout(() => pri.focus(), 50);
  }
  const VANTAGENS = `<div class="ct-vant"><div>🌍<span><b>Publicar jogos para todo mundo</b> direto do Studio</span></div><div>✓<span><b>Selo de conta verificada</b> no seu nome e nos seus jogos</span></div><div>❤️<span><b>Curtir</b> os jogos da comunidade</span></div><div>☁️<span><b>Projetos, notas e progresso salvos na nuvem</b>, em qualquer aparelho</span></div></div>`;
  async function carregarPublicacoes(conta) {
    try {
      const [p, n] = await Promise.all([api('meusConteudos', { token: conta.token }), api('listarNuvem', { token: conta.token }).catch(() => ({ dados: [] }))]);
      const el = $('#ct-pubs'); if (!el) return;
      el.innerHTML = p.conteudos.length ? p.conteudos.map(j => `<div class="ct-pub">${j.capa ? `<img src="${esc(j.capa)}" alt="">` : '<span class="ph">🎮</span>'}<span class="tx"><b>${esc(j.nome)}</b><small>▶ ${j.jogadas} partidas · ❤ ${j.curtidas}</small></span><button data-apagar-pub="${esc(j.id)}" title="Tirar do ar">🗑</button></div>`).join('')
        : '<span style="color:var(--muted,#9696ab);font-size:13px">Nada publicado ainda. No Studio, use <b>Publicar → Para todo mundo</b>.</span>';
      el.querySelectorAll('[data-apagar-pub]').forEach(b => b.onclick = async () => { if (!confirm('Tirar esta publicação do ar para todo mundo?')) return; b.disabled = true; try { await api('apagarConteudo', { token: conta.token, id: b.dataset.apagarPub }); carregarPublicacoes(conta); window.dispatchEvent(new CustomEvent('arcadia-publicacoes')); } catch (e) { erroTela(e.message); } });
      const nv = $('#ct-nuvem'); if (nv) nv.textContent = n.dados.length ? `☁️ ${n.dados.length} ${n.dados.length === 1 ? 'item salvo' : 'itens salvos'} na nuvem (projetos, notas e progresso).` : '☁️ Seus projetos, notas e progresso vão ser salvos na nuvem automaticamente.';
    } catch (e) { const el = $('#ct-pubs'); if (el) el.textContent = e.message; }
  }
  function concluirLogin(j) { gravar({ token: j.token, usuario: j.usuario }); pendente = null; atualizarBotao(); render('pronto'); presenca(); }
  /* ---------------- selos (desenhados em SVG) ---------------- */
  const ROSETA = (() => { const p = []; for (let k = 0; k < 24; k++) { const a = Math.PI * k / 12 - Math.PI / 2, rr = k % 2 ? 9.6 : 11.2; p.push((12 + Math.cos(a) * rr).toFixed(2) + ',' + (12 + Math.sin(a) * rr).toFixed(2)); } return p.join(' '); })();
  function corpoSelo(tipo) {
    const g = tipo === 'criador' ? 'arcSeloC' : 'arcSeloV';
    const base = `<polygon points="${ROSETA}" fill="url(#${g})" stroke="url(#${g})" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="8.6" fill="url(#arcSeloBrilho)"/>`;
    if (tipo === 'criador') return base + '<path d="M6.7 15.2 5.9 9.3l3.4 2.3L12 7.4l2.7 4.2 3.4-2.3-.8 5.9z" fill="#fff" stroke="#fff" stroke-width=".7" stroke-linejoin="round"/><rect x="6.8" y="16" width="10.4" height="1.7" rx=".85" fill="#fff"/><circle cx="12" cy="12.4" r=".95" fill="#f59e0b"/>';
    return base + '<path d="M7.6 12.4l2.9 2.9 5.9-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function seloSvg(tipo, px = 15) {
    if (tipo !== 'criador' && tipo !== 'verificado') return '';
    if (!document.getElementById('arc-selo-defs')) document.body.insertAdjacentHTML('beforeend', '<svg id="arc-selo-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="arcSeloV" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ee6ff"/><stop offset=".55" stop-color="#7c5cff"/><stop offset="1" stop-color="#c94dff"/></linearGradient> <linearGradient id="arcSeloC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient> <radialGradient id="arcSeloBrilho" cx=".35" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs></svg>');
    return `<svg class="ct-s" width="${px}" height="${px}" viewBox="0 0 24 24" role="img" aria-label="${tipo === 'criador' ? 'Criador da Arcádia' : 'Verificado'}"><title>${tipo === 'criador' ? 'Criador da Arcádia' : 'Verificado'}</title>${corpoSelo(tipo)}</svg>`;
  }
  /* ---------------- amigos ---------------- */
  // foto de perfil: um emoji sobre uma cor ("🦊|#8b5cf6"); sem foto, a inicial do nome
  const FOTOS = ['🦊', '🐼', '🐸', '🐯', '🐵', '🐙', '🦄', '🐲', '🦖', '🐱', '🐶', '🐧', '🐨', '🐰', '🦉', '🐝', '🤖', '👾', '👻', '🎃', '🥷', '🧙', '🦸', '👽', '😎', '🤠', '🔥', '⚡', '🌈', '🍕', '⚽', '🎮', '🚀', '👑', '💎', '🌵'];
  const CORES = ['#8b5cf6', '#6366f1', '#3b82f6', '#22d3ee', '#14b8a6', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#64748b'];
  const FOTO_IMG = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
  function foto(u) {
    const f = String((u && u.foto) || '').split('|');
    if (FOTO_IMG.test(String((u && u.foto) || ''))) return { emoji: false, txt: '', estilo: `background:#221c33 url(${u.foto}) center/cover` }; // foto de verdade
    if (f.length === 2 && f[0] && /^#[0-9a-fA-F]{6}$/.test(f[1])) return { emoji: true, txt: f[0], estilo: `background:${f[1]}` };
    return { emoji: false, txt: String((u && u.nome) || '?')[0].toUpperCase(), estilo: '' };
  }
  function avatar(u, tam = '', online) { const f = foto(u); return `<span class="ct-fot ${tam}${f.emoji ? ' emo' : ''}" style="${f.estilo}">${esc(f.txt)}${online === undefined ? '' : `<i class="${online ? 'on' : ''}"></i>`}</span>`; }
  function tempoAtras(t) { const s = (Date.now() - t) / 1000; if (s < 3600) return `há ${Math.max(1, Math.round(s / 60))} min`; if (s < 86400) return `há ${Math.round(s / 3600)} h`; const d = Math.round(s / 86400); return d === 1 ? 'ontem' : `há ${d} dias`; }
  const statusCurto = k => k.online ? (k.jogo ? '🎮 ' + k.jogo : 'On-line') : k.vistoEm ? 'Visto ' + tempoAtras(k.vistoEm) : 'Off-line';
  function linhaAmigo(k, botoes) {
    const st = k.online ? (k.jogo ? `🟢 jogando <b style="color:#86efac;display:inline">${esc(k.jogo)}</b>` : '🟢 on-line agora') : k.vistoEm ? 'visto ' + tempoAtras(k.vistoEm) : 'ainda não apareceu por aqui';
    return `<div>${avatar(k, 'av', k.online)}<span class="tx"><b>${esc(k.nome)}${seloIco(k.selo)}</b><small>#${esc(k.codigo)} · ${st}</small></span>${botoes}</div>`;
  }
  const bt = (ac, k, txt, cls = '') => `<button class="${cls}" data-ac="${ac}" data-id="${esc(k.id)}" data-nome="${esc(k.nome)}">${txt}</button>`;
  function botaoBusca(k) { return k.relacao === 'amigo' ? '<button disabled>Amigos ✓</button>' : k.relacao === 'enviado' ? '<button disabled>Pedido enviado</button>' : k.relacao === 'recebido' ? bt('aceitar', k, 'Aceitar', 'ok') : bt('pedir', k, '＋ Adicionar', 'ok'); }
  const itemAdicionar = () => `<button class="ct-it" data-ir="add-amigos" title="Adicionar amigos"><span class="mais">＋</span><b>Adicionar</b><small>&nbsp;</small></button>`;
  const seloIco = (s, px = 15) => seloSvg(s, px);
  const souCriador = () => ((ler() || {}).usuario || {}).selo === 'criador';
  function cartaoPerfil(k) { return `<div class="ct-perfil">${avatar(k, 'g', k.online)}<b title="${esc(k.nome)}">${esc(k.nome)}${seloIco(k.selo)}</b><small class="${k.online ? 'on' : ''}">${esc(statusCurto(k))}</small>${botaoBusca(k)}${souCriador() && FOTO_IMG.test(k.foto || '') ? `<button class="selo" data-tirar-foto="${esc(k.id)}">Tirar foto</button>` : ''}${souCriador() && k.selo !== 'criador' ? `<button class="selo" data-selo="${esc(k.id)}" data-dar="${k.selo ? 0 : 1}">${k.selo ? 'Tirar selo' : seloSvg('verificado', 13) + ' Dar selo'}</button>` : ''}</div>`; }
  let amigosCache = [];
  function mostrarAmigo(id) {
    const d = $('#ct-det'); if (!d) return;
    const k = amigosCache.find(a => a.id === id), it = caixa().querySelector(`[data-amigo="${CSS.escape(id)}"]`), aberto = it && it.classList.contains('sel');
    caixa().querySelectorAll('.ct-it.sel').forEach(e => e.classList.remove('sel'));
    if (!k || aberto) { d.style.display = 'none'; return; }
    it.classList.add('sel');
    const st = k.online ? (k.jogo ? `🟢 Jogando <b style="color:#86efac">${esc(k.jogo)}</b>` : '🟢 On-line agora') : k.vistoEm ? 'Visto ' + tempoAtras(k.vistoEm) : 'Ainda não apareceu por aqui';
    d.innerHTML = `<div class="ct-det">${avatar(k, 'g', k.online)}<div class="tx"><b>${esc(k.nome)}${seloIco(k.selo)}</b><small>${st}</small><small>#${esc(k.codigo)}${k.em ? ' · amigos desde ' + new Date(k.em).toLocaleDateString('pt-BR') : ''}</small></div>${bt('remover', k, 'Desfazer amizade', 'ct-sec')}</div>`;
    d.style.display = '';
  }
  // clique em "Adicionar", "Aceitar", "Recusar", "Desfazer", "Cancelar"
  async function acaoAmizade(ev, conta, depois) {
    const b = ev.target.closest('[data-ac]'); if (!b || b.disabled) return;
    const ac = b.dataset.ac, id = b.dataset.id, nome = b.dataset.nome || '';
    if (ac === 'remover' && !confirm(`Desfazer a amizade com ${nome}?`)) return;
    const acoes = { pedir: ['pedirAmizade', {}], aceitar: ['responderAmizade', { aceitar: true }], recusar: ['responderAmizade', { aceitar: false }], remover: ['removerAmizade', {}], cancelar: ['removerAmizade', {}] };
    b.disabled = true; const txt = b.textContent; b.innerHTML = '<span class="ct-girando"></span>';
    try {
      const j = await api(acoes[ac][0], { token: conta.token, id, ...acoes[ac][1] });
      erroTela(ac === 'pedir' ? (j.estado === 'aceita' ? `Agora você e ${nome} são amigos! 🎉` : `Pedido enviado para ${nome}.`) : ac === 'aceitar' ? `Agora você e ${nome} são amigos! 🎉` : ac === 'recusar' ? 'Pedido recusado.' : ac === 'cancelar' ? 'Pedido cancelado.' : 'Amizade desfeita.', true);
      await depois(b, j, ac);
    } catch (e) { erroTela(e.message); b.textContent = txt; b.disabled = false; }
  }
  async function carregarAmigos(conta) {
    const fila = $('#ct-fila');
    try {
      const j = await api('listarAmizades', { token: conta.token });
      if (!$('#ct-fila') || !$('#ct-fila').isConnected) return;
      amigosCache = j.amigos;
      const cod = $('#ct-cod'); cod.textContent = '#' + j.meuCodigo; cod.dataset.cod = j.meuCodigo; $('#ct-copiar').disabled = false;
      $('#ct-blk-rec').style.display = j.recebidos.length ? '' : 'none'; $('#ct-rec').innerHTML = j.recebidos.map(k => linhaAmigo(k, bt('aceitar', k, 'Aceitar', 'ok') + bt('recusar', k, 'Recusar'))).join('');
      $('#ct-blk-env').style.display = j.enviados.length ? '' : 'none'; $('#ct-env').innerHTML = j.enviados.map(k => linhaAmigo(k, bt('cancelar', k, 'Cancelar'))).join('');
      const on = j.amigos.filter(k => k.online).length;
      $('#ct-tit-amg').textContent = `Amigos (${j.amigos.length})`;
      $('#ct-tit-amg').nextElementSibling.textContent = j.amigos.length ? (on ? `${on} on-line agora. Toque num amigo para ver mais.` : 'Ninguém on-line agora. Toque num amigo para ver mais.') : 'Você ainda não tem amigos aqui. Toque em ＋ para adicionar!';
      $('#ct-fila').innerHTML = itemAdicionar() + j.amigos.map(k => `<button class="ct-it" data-amigo="${esc(k.id)}" title="${esc(k.nome)}">${avatar(k, 'g', k.online)}<b>${esc(k.nome)}${seloIco(k.selo)}</b><small class="${k.online ? 'on' : ''}">${esc(statusCurto(k))}</small></button>`).join('');
      $('#ct-fila').querySelectorAll('[data-ir]').forEach(b => b.onclick = () => render(b.dataset.ir));
      $('#ct-det').style.display = 'none';
      pedidosPend = j.recebidos.length; atualizarBotao();
    } catch (e) {
      if (!fila || !fila.isConnected) return;
      fila.innerHTML = itemAdicionar() + `<span class="ct-vazio" style="align-self:center;padding-left:6px">${esc(e.message)} <button class="ct-link" id="ct-tentar">Tentar de novo</button></span>`;
      fila.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => render(b.dataset.ir));
      $('#ct-tentar').onclick = () => { fila.innerHTML = itemAdicionar() + '<span class="ct-vazio" style="align-self:center;padding-left:6px"><span class="ct-girando"></span>Carregando…</span>'; fila.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => render(b.dataset.ir)); carregarAmigos(conta); };
    }
  }

  // usado pela plataforma, Studio e jogos: chama o servidor já com o token da conta (se houver)
  const apiConta = (acao, dados = {}) => { const c = ler(); return api(acao, c ? { token: c.token, ...dados } : dados); };
  window.ArcadiaConta = { selo: seloSvg, usuario: () => (ler() || {}).usuario || null, logado: () => !!ler(), abrir, dispositivo, api: apiConta, servidorLigado: () => !!servidor(), jogando: nome => { jogoAtual = String(nome || '').slice(0, 60); presenca(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
