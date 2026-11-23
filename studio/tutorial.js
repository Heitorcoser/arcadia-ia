/* =========================================================================
   ARCÁDIA STUDIO · tutorial para quem está começando
   Um tour guiado que destaca cada parte da tela e explica o básico.
   Começa sozinho na primeira vez que a pessoa abre um projeto; dá para rever
   em Exibir → Ajuda → 🎓 Tutorial. Tem um roteiro para jogos 3D (cena) e
   outro para projetos de código (three.js, 2D, Phaser, Python, Lua...).
   ========================================================================= */
(function () {
  'use strict';
  const CHAVE = 'studio.tutorial.v1';
  const toque = () => matchMedia('(pointer: coarse)').matches;
  const aba = nome => () => { const b = document.querySelector(`.aba-r[data-faixa="${nome}"]`); if (b) b.click(); };

  const CENA = [
    { t: '👋 Bem-vindo ao Arcádia Studio!', d: 'Aqui você monta jogos 3D com peças, scripts e personagens, e publica para todo mundo jogar. Em 2 minutos você vai saber o básico. Pode pular quando quiser.' },
    { alvo: '#vista-cena', t: '🎥 Mexer a câmera', d: () => toque() ? 'Arraste com <b>1 dedo</b> para girar em volta, use <b>2 dedos</b> para arrastar e fazer pinça (zoom). Toque numa peça para selecionar.' : 'Segure o <b>botão direito</b> do mouse e arraste para olhar em volta. <b>W A S D</b> andam, <b>Q E</b> descem e sobem e a <b>roda</b> aproxima. Clique numa peça para selecionar.' },
    { alvo: '[data-acao="i:Block"]', antes: aba('inicio'), t: '🧱 Criar peças', d: 'Na aba <b>Início</b>, clique em <b>Bloco</b>, <b>Esfera</b>, <b>Cilindro</b> ou <b>Rampa</b>. A peça nasce na frente da câmera. Experimente criar uma agora!' },
    { alvo: '[data-acao="f:mover"]', antes: aba('inicio'), t: '✥ Mover, escalar e girar', d: 'Com uma peça selecionada, escolha <b>Mover</b>, <b>Escalar</b> ou <b>Girar</b> e arraste as setinhas coloridas que aparecem nela. Atalhos: <b>1</b> selecionar, <b>2</b> mover, <b>3</b> escalar, <b>4</b> girar.' },
    { alvo: '#f-cor', antes: aba('inicio'), t: '🎨 Cor e material', d: 'Troque a <b>cor</b> e o <b>material</b> (grama, madeira, metal, neon...) da peça selecionada. Use <b>⚓ Ancorar</b> para ela não cair quando o jogo começar.' },
    { alvo: '#arvore', t: '🌳 Explorer', d: 'Tudo o que existe no jogo aparece aqui, em árvore. Arraste um item para dentro de outro para agrupar. Com o botão direito (ou segurando o dedo) você renomeia, duplica e apaga.' },
    { alvo: '#props', t: '📋 Propriedades', d: 'Os detalhes do objeto selecionado: posição, tamanho, cor, transparência, se colide, se é ancorado... Mude os números e veja na hora.' },
    { alvo: '#caixa', t: '🧰 Caixa de ferramentas e Marketplace', d: 'Modelos prontos para arrastar para o jogo: árvores, casas, moedas, inimigos. No <b>🛒 Marketplace</b> estão personagens, animações e itens feitos por outros jogadores.' },
    { alvo: '.aba-r[data-faixa="modelo"]', t: '📜 Scripts (a mágica)', d: 'Na aba <b>Modelo</b> você cria um <b>Script Lua</b> ou <b>JS</b> dentro de uma peça para ela fazer coisas: girar, dar pontos, abrir porta, matar no toque... Também tem luz, som, texto 3D e telas de interface.' },
    { alvo: '[data-acao="jogar"]', antes: aba('inicio'), t: '▶ Testar o jogo', d: 'Aperte <b>Jogar</b> para entrar no jogo com o seu personagem e testar. <b>■ Parar</b> volta para a edição (o que mudou durante o teste não fica salvo).' },
    { alvo: '#baixo', t: '📟 Saída', d: 'Mensagens dos seus scripts (<code>print</code>) e erros aparecem aqui. Se algo não funcionar, olhe primeiro na Saída: ela diz a linha do problema.' },
    { alvo: '#btn-publicar', t: '🚀 Publicar', d: 'Quando estiver pronto, publique! Dê um nome, um gênero, uma descrição e escolha uma <b>imagem de capa</b>. Com conta, o jogo vai para todo mundo em “Jogos de Players”.' },
    { t: '🎉 Pronto para criar!', d: 'Dica de primeiro jogo: um <b>obby</b>. Faça um caminho de blocos no ar, umas peças vermelhas que matam no toque e uma linha de chegada. O Studio salva sozinho. Para ver este tutorial de novo: <b>Exibir → Ajuda → 🎓 Tutorial</b>.' },
  ];
  const CODIGO = [
    { t: '👋 Bem-vindo ao modo código!', d: 'Projetos de código são jogos feitos com arquivos: HTML, JavaScript, three.js, Phaser, Python, Lua... Você escreve, executa e publica, tudo aqui.' },
    { alvo: '#arvore', t: '📁 Arquivos', d: 'Os arquivos do projeto. O que tem ⭐ é a <b>entrada</b> (o primeiro que roda). Clique para abrir; botão direito (ou segurar o dedo) para renomear, apagar ou definir como entrada.' },
    { alvo: '#vista-codigo', t: '⌨️ Editor', d: 'Escreva o código aqui. <b>Ctrl+S</b> salva. Com <b>🔁 Recarregar ao salvar</b> ligado, a prévia atualiza sozinha.' },
    { alvo: '[data-acao="executar"]', antes: aba('inicio'), t: '▶ Executar', d: 'Roda o jogo na prévia, ao lado. Erros e <code>console.log</code> aparecem na Saída, lá embaixo.' },
    { alvo: '.aba-r[data-faixa="modelo"]', t: '🧩 Modelos prontos', d: 'Na aba <b>Modelo</b> há projetos iniciais: canvas 2D, <b>Three.js 3D</b>, <b>Phaser</b>, Python e Lua. É o jeito mais rápido de começar.' },
    { alvo: '#btn-publicar', t: '🚀 Publicar', d: 'Publique com nome, gênero e uma <b>imagem de capa</b> sua. Contas verificadas podem publicar jogos de até ~20 MB.' },
    { t: '🎉 Mãos à obra!', d: 'Comece por um modelo, mude uma coisinha e aperte Executar. Para ver este tutorial de novo: <b>Exibir → Ajuda → 🎓 Tutorial</b>.' },
  ];

  let passos = [], n = 0, fundo, foco, cartao;
  const visivel = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'; };
  function montar() {
    if (fundo) return;
    const css = document.createElement('style');
    css.textContent = `#tut-fundo{position:fixed;inset:0;z-index:9000}
      #tut-foco{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(5,5,12,.72),0 0 0 3px #8b5cf6,0 0 24px 6px rgba(139,92,246,.55);transition:all .28s ease;pointer-events:none}
      #tut-cartao{position:fixed;width:min(360px,calc(100vw - 24px));background:#17131f;color:#ece7f8;border:1px solid #45297c;border-radius:16px;padding:16px 18px 14px;box-shadow:0 18px 50px rgba(0,0,0,.55);font:14px/1.55 Inter,system-ui,sans-serif;transition:top .28s ease,left .28s ease}
      #tut-cartao h3{margin:0 0 6px;font-size:17px;color:#fff} #tut-cartao p{margin:0} #tut-cartao code{background:#2a2140;border-radius:5px;padding:0 5px}
      #tut-cartao .tut-rod{display:flex;align-items:center;gap:8px;margin-top:14px} #tut-cartao .tut-pts{flex:1;display:flex;gap:4px} #tut-cartao .tut-pts i{width:7px;height:7px;border-radius:50%;background:#3a2f55} #tut-cartao .tut-pts i.on{background:#8b5cf6}
      #tut-cartao button{height:32px;border-radius:9px;border:1px solid #45297c;background:#221a33;color:#ece7f8;font:600 13px Inter,system-ui,sans-serif;padding:0 12px;cursor:pointer}
      #tut-cartao button.pri{background:linear-gradient(135deg,#8b5cf6,#6d4ae0);border-color:transparent;color:#fff} #tut-cartao .tut-pular{background:none;border:0;color:#9f93c0;padding:0 4px}`;
    document.head.appendChild(css);
    fundo = document.createElement('div'); fundo.id = 'tut-fundo';
    fundo.innerHTML = '<div id="tut-foco"></div><div id="tut-cartao" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(fundo); foco = fundo.querySelector('#tut-foco'); cartao = fundo.querySelector('#tut-cartao');
    cartao.addEventListener('click', e => { const a = e.target.closest('[data-tut]'); if (!a) return; if (a.dataset.tut === 'prox') ir(n + 1); else if (a.dataset.tut === 'volta') ir(n - 1); else fechar(); });
    addEventListener('keydown', tecla, true); addEventListener('resize', posicionar);
  }
  function tecla(e) { if (!fundo) return; if (e.key === 'Escape') { e.stopPropagation(); fechar(); } else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); ir(n + 1); } else if (e.key === 'ArrowLeft') ir(n - 1); }
  function ir(k) {
    if (k >= passos.length) return fechar(true);
    n = Math.max(0, k); const p = passos[n];
    if (p.antes) try { p.antes(); } catch (e) {}
    const d = typeof p.d === 'function' ? p.d() : p.d;
    cartao.innerHTML = `<h3>${p.t}</h3><p>${d}</p><div class="tut-rod"><div class="tut-pts">${passos.map((_, i) => `<i class="${i === n ? 'on' : ''}"></i>`).join('')}</div>${n ? '<button data-tut="volta">Voltar</button>' : '<button class="tut-pular" data-tut="pular">Pular</button>'}<button class="pri" data-tut="prox">${n === passos.length - 1 ? 'Começar!' : 'Próximo'}</button></div>`;
    setTimeout(posicionar, 30);
  }
  function posicionar() {
    if (!fundo) return;
    const p = passos[n], el = p.alvo && document.querySelector(p.alvo), cw = cartao.offsetWidth, ch = cartao.offsetHeight;
    if (!visivel(el)) { // sem alvo (ou escondido numa gaveta no celular): cartão no meio da tela
      foco.style.cssText = `left:${innerWidth / 2}px;top:${innerHeight / 2}px;width:0;height:0`;
      cartao.style.left = (innerWidth - cw) / 2 + 'px'; cartao.style.top = Math.max(12, (innerHeight - ch) / 2) + 'px'; return;
    }
    const r = el.getBoundingClientRect(), m = 6, x = Math.max(4, r.left - m), y = Math.max(4, r.top - m), w = Math.min(innerWidth - x - 4, r.width + m * 2), h = Math.min(innerHeight - y - 4, r.height + m * 2);
    foco.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    // cartão: embaixo, em cima, à direita ou à esquerda do destaque, onde couber
    let cx, cy;
    if (y + h + 12 + ch < innerHeight) { cy = y + h + 12; cx = x + w / 2 - cw / 2; }
    else if (y - 12 - ch > 0) { cy = y - 12 - ch; cx = x + w / 2 - cw / 2; }
    else if (x + w + 12 + cw < innerWidth) { cx = x + w + 12; cy = y + h / 2 - ch / 2; }
    else { cx = x - 12 - cw; cy = y + h / 2 - ch / 2; }
    cartao.style.left = Math.max(12, Math.min(innerWidth - cw - 12, cx)) + 'px'; cartao.style.top = Math.max(12, Math.min(innerHeight - ch - 12, cy)) + 'px';
  }
  function fechar(terminou) {
    try { localStorage.setItem(CHAVE, terminou ? 'feito' : 'pulado'); } catch (e) {}
    removeEventListener('keydown', tecla, true); removeEventListener('resize', posicionar);
    if (fundo) fundo.remove(); fundo = null;
  }
  function iniciar(tipo) {
    const cena = tipo ? tipo === 'cena' : !!document.querySelector('[data-acao="jogar"]'), codigo = tipo ? tipo === 'codigo' : !!document.querySelector('[data-acao="executar"]');
    if (!cena && !codigo) return false;
    passos = cena ? CENA : CODIGO; montar(); ir(0); return true;
  }
  // primeira vez: espera um projeto aberto e começa sozinho
  let ja = false; try { ja = !!localStorage.getItem(CHAVE); } catch (e) {}
  if (!ja && !/[?&]mcp=1/.test(location.search)) { const t = setInterval(() => { if (document.querySelector('#faixa .fb') && !document.querySelector('#modal.on, .modal.on')) { clearInterval(t); setTimeout(iniciar, 600); } }, 800); }
  window.StudioTutorial = { iniciar, reiniciar: () => { try { localStorage.removeItem(CHAVE); } catch (e) {} return iniciar(); } };
})();
