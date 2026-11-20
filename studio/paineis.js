/* =========================================================================
   ARCÁDIA STUDIO · painéis redimensionáveis
   Arraste as bordas da Caixa de ferramentas, do Explorer/Propriedades e da
   Saída para mudar o tamanho (como num estúdio de jogos). O tamanho fica
   salvo. Duplo clique numa divisória volta ao tamanho padrão.
   ========================================================================= */
(function () {
  'use strict';
  const corpo = document.getElementById('corpo');
  const CHAVE = 'studio.paineis';
  const PADRAO = { esq: 230, dir: 300, baixo: 170, explorer: 0.5 };
  let tam = Object.assign({}, PADRAO);
  try { Object.assign(tam, JSON.parse(localStorage.getItem(CHAVE)) || {}); } catch (e) {}

  const metades = document.querySelectorAll('#dir .metade');
  function aplicar() {
    // se a janela encolheu, os painéis cedem espaço para o viewport (sem mudar o tamanho salvo)
    const sobra = Math.max(0, tam.esq + tam.dir + 260 - (corpo.clientWidth || innerWidth));
    const fEsq = sobra ? Math.max(0, tam.esq - sobra * tam.esq / (tam.esq + tam.dir)) : tam.esq;
    const fDir = sobra ? Math.max(0, tam.dir - sobra * tam.dir / (tam.esq + tam.dir)) : tam.dir;
    corpo.style.setProperty('--esq-t', Math.round(fEsq) + 'px');
    corpo.style.setProperty('--dir-t', Math.round(fDir) + 'px');
    corpo.style.setProperty('--baixo-t', Math.min(tam.baixo, Math.max(60, (corpo.clientHeight || innerHeight) - 120)) + 'px');
    if (metades.length === 2) { metades[0].style.flex = `${tam.explorer} 1 0`; metades[1].style.flex = `${1 - tam.explorer} 1 0`; }
  }
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(tam)); } catch (e) {} };
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  // avisa CodeMirror e outros que o espaço mudou
  let raf = 0; const avisar = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))); };

  function divisoria(pai, tipo, lado, aoArrastar) {
    const d = document.createElement('div');
    d.className = `divisoria ${tipo} ${lado}`;
    d.title = 'Arraste para redimensionar · duplo clique para restaurar';
    pai.appendChild(d);
    d.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); d.setPointerCapture(e.pointerId);
      document.body.classList.add('redimensionando', tipo === 'v' ? 'cursor-v' : 'cursor-h');
      d.classList.add('ativa');
      const ini = { x: e.clientX, y: e.clientY, tam: Object.assign({}, tam), rect: pai.getBoundingClientRect() };
      const mover = ev => { aoArrastar(ev, ini); aplicar(); avisar(); };
      const soltar = () => {
        d.removeEventListener('pointermove', mover); d.removeEventListener('pointerup', soltar); d.removeEventListener('pointercancel', soltar);
        document.body.classList.remove('redimensionando', 'cursor-v', 'cursor-h'); d.classList.remove('ativa'); salvar(); avisar();
      };
      d.addEventListener('pointermove', mover); d.addEventListener('pointerup', soltar); d.addEventListener('pointercancel', soltar);
    });
    return d;
  }
  const largura = () => corpo.getBoundingClientRect().width;
  const altura = () => corpo.getBoundingClientRect().height;

  // Caixa de ferramentas (esquerda): borda direita
  divisoria(document.getElementById('esq'), 'v', 'direita', (e, i) => { tam.esq = limitar(i.tam.esq + e.clientX - i.x, 140, largura() - tam.dir - 260); })
    .addEventListener('dblclick', () => { tam.esq = PADRAO.esq; aplicar(); salvar(); avisar(); });
  // Explorer + Propriedades (direita): borda esquerda
  divisoria(document.getElementById('dir'), 'v', 'esquerda', (e, i) => { tam.dir = limitar(i.tam.dir - (e.clientX - i.x), 200, largura() - tam.esq - 260); })
    .addEventListener('dblclick', () => { tam.dir = PADRAO.dir; aplicar(); salvar(); avisar(); });
  // Saída (embaixo): borda de cima
  divisoria(document.getElementById('baixo'), 'h', 'cima', (e, i) => { tam.baixo = limitar(i.tam.baixo - (e.clientY - i.y), 60, altura() - 120); })
    .addEventListener('dblclick', () => { tam.baixo = PADRAO.baixo; aplicar(); salvar(); avisar(); });
  // entre Explorer e Propriedades
  if (metades.length === 2) {
    const dir = document.getElementById('dir');
    divisoria(metades[1], 'h', 'cima', e => { const r = dir.getBoundingClientRect(); tam.explorer = limitar((e.clientY - r.top) / r.height, 0.12, 0.88); })
      .addEventListener('dblclick', () => { tam.explorer = PADRAO.explorer; aplicar(); salvar(); avisar(); });
  }
  window.addEventListener('resize', e => { if (e.isTrusted) aplicar(); });
  aplicar();
})();
