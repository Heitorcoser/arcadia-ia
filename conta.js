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
    let r;
    try {
      // text/plain evita a "pré-checagem" do navegador, que o Apps Script não responde
      r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao, ...dados }), redirect: 'follow' });
    } catch (e) { throw new Error('Sem conexão com o servidor de contas. Confira sua internet.'); }
    let j; try { j = await r.json(); } catch (e) { throw new Error('O servidor de contas respondeu algo estranho. Tente de novo.'); }
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
  @media (max-width:520px){ .ct-btn span.nm{display:none} .ct-codigo input{width:40px;height:50px} }`;

  function montar() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement('button'); b.className = 'ct-btn'; b.id = 'ct-btn'; b.type = 'button';
    const lugar = document.querySelector('header .top'); if (lugar) lugar.appendChild(b);
    b.addEventListener('click', () => ler() ? abrir('minha') : abrir('entrar'));
    const f = document.createElement('div'); f.className = 'ct-fundo'; f.id = 'ct-fundo';
    f.innerHTML = '<div class="ct-caixa" id="ct-caixa" role="dialog" aria-modal="true"></div>';
    f.addEventListener('mousedown', e => { if (e.target === f) fechar(); });
    document.body.appendChild(f);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && f.classList.contains('on')) fechar(); });
    atualizarBotao();
    const c = ler(); if (c) api('eu', { token: c.token }).then(j => { c.usuario = j.usuario; gravar(c); atualizarBotao(); }).catch(() => {});
  }
  function atualizarBotao() {
    const b = $('#ct-btn'); if (!b) return; const c = ler();
    if (c && c.usuario) { b.classList.remove('sem'); b.innerHTML = `<span class="av">${esc((c.usuario.nome || '?')[0].toUpperCase())}</span><span class="nm">${esc(c.usuario.nome)}</span>`; b.title = 'Minha conta'; }
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
      c.innerHTML = `${x}<h2>Criar conta</h2><p class="sub">É grátis. Vamos mandar um código para confirmar seu e-mail.</p>${semServidor}
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
      c.innerHTML = `${x}<h2>Minha conta</h2><p class="sub">${esc(u.nome)} · ${esc(u.email)}</p>
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
    else if (tela === 'pronto') {
      const u = (ler() || {}).usuario || {};
      c.innerHTML = `${x}<div class="ct-icone">🎉</div><h2>Oi, ${esc(u.nome)}!</h2><p class="sub">Você entrou. Seu nome já vai aparecer preenchido nos jogos. Sempre que alguém entrar na sua conta, você recebe um aviso no e-mail com os detalhes.</p><button class="ct-pri" id="ct-ok">Bora jogar</button>`;
      $('#ct-ok').onclick = fechar;
    }
    c.querySelector('.ct-x').onclick = fechar;
    c.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => render(b.dataset.ir));
    ligarVerSenha();
    const pri = c.querySelector('input:not([type=checkbox])'); if (pri && tela !== 'codigo' && tela !== 'minha') setTimeout(() => pri.focus(), 50);
  }
  function concluirLogin(j) { gravar({ token: j.token, usuario: j.usuario }); pendente = null; atualizarBotao(); render('pronto'); }

  window.ArcadiaConta = { usuario: () => (ler() || {}).usuario || null, abrir, dispositivo };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
