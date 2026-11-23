/* =========================================================================
   ARCÁDIA IA · foto de perfil nos jogos
   A foto da conta pode ser um emoji sobre uma cor ("🦊|#8b5cf6") ou uma foto
   de verdade (imagem JPEG pequena, "data:image/jpeg;base64,...").
   Os jogos usam a foto como "rosto" do jogador: ela vai pela rede (PeerJS)
   e é desenhada no personagem, nas listas e nos placares.
   - ArcadiaFoto.minha()       foto da conta logada (ou a inicial do nome)
   - ArcadiaFoto.eh(f)         é uma foto válida? (sempre confira o que chega pela rede)
   - ArcadiaFoto.sprite(f, px) canvas redondo para desenhar no jogo
   - ArcadiaFoto.txt(f, em)    HTML pequeno para listas e placares (emoji comum passa escapado)
   - ArcadiaFoto.token(f)      ficha curta ("§a1b2c3") para jogos que mandam o rosto em todo quadro;
     ArcadiaFoto.todos() / registrar(m) levam as fotos de verdade de vez em quando
   ========================================================================= */
(function () {
  'use strict';
  const RE_IMG = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, RE_EMO = /^[^<>"'&\s|]{1,12}\|#[0-9a-fA-F]{6}$/, RE_TOK = /^§[a-z0-9]{6}$/;
  const FONTE = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
  const TOK = new Map(), SPR = new Map();
  let versao = 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eh = f => typeof f === 'string' && ((f.length <= 24000 && RE_IMG.test(f)) || RE_EMO.test(f));
  const resolver = f => (typeof f === 'string' && RE_TOK.test(f)) ? (TOK.get(f) || null) : f;
  const ehFoto = f => eh(resolver(f));
  function token(f) {
    if (!eh(f)) return f;
    let h = 2166136261; for (let i = 0; i < f.length; i += 7) h = Math.imul(h ^ f.charCodeAt(i), 16777619) >>> 0;
    h = Math.imul(h ^ f.length, 16777619) >>> 0;
    const t = '§' + h.toString(36).padStart(6, '0').slice(-6);
    if (!TOK.has(t)) { TOK.set(t, f); versao++; }
    return t;
  }
  function registrar(m) { if (!m || typeof m !== 'object') return; for (const k in m) if (RE_TOK.test(k) && eh(m[k]) && !TOK.has(k)) { TOK.set(k, m[k]); versao++; } }
  const todos = () => Object.fromEntries(TOK);
  function minha() {
    try {
      const u = (JSON.parse(localStorage.getItem('arcadia.conta')) || {}).usuario || {};
      if (eh(u.foto)) return u.foto;
      const ini = String(u.nome || '').trim()[0];
      if (ini) return ini.toUpperCase().replace(/[<>"'&|\s]/, '?') + '|#7c5cff';
    } catch (e) {}
    return null;
  }
  // canvas redondo com a foto (imagem cortada em círculo, ou emoji sobre a cor) e um aro branco
  function sprite(f, px = 128, aoCarregar) {
    f = resolver(f); if (!eh(f)) return null;
    const chave = px + ':' + f; let c = SPR.get(chave); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'), r = px / 2, aro = Math.max(2, px * 0.045);
    const moldura = () => { g.beginPath(); g.arc(r, r, r - aro / 2, 0, Math.PI * 2); g.strokeStyle = '#ffffff'; g.lineWidth = aro; g.stroke(); };
    if (RE_IMG.test(f)) {
      g.fillStyle = '#2a2440'; g.beginPath(); g.arc(r, r, r - 1, 0, Math.PI * 2); g.fill(); moldura();
      const im = new Image();
      im.onload = () => { const s = Math.min(im.width, im.height); g.save(); g.beginPath(); g.arc(r, r, r - 1, 0, Math.PI * 2); g.clip(); g.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, px, px); g.restore(); moldura(); if (aoCarregar) aoCarregar(c); };
      im.src = f;
    } else {
      const [emo, cor] = f.split('|');
      g.fillStyle = cor; g.beginPath(); g.arc(r, r, r - 1, 0, Math.PI * 2); g.fill();
      g.font = `${Math.round(px * 0.56)}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(emo, r, r * 1.06);
      moldura();
    }
    SPR.set(chave, c); return c;
  }
  // HTML pequeno (listas, placares, mensagens). Texto que não é foto (emoji comum) sai escapado.
  function txt(f, em = 1.3) {
    const v = resolver(f);
    if (!eh(v)) return esc(typeof f === 'string' && RE_TOK.test(f) ? '🙂' : f);
    const base = `display:inline-block;width:${em}em;height:${em}em;border-radius:50%;vertical-align:-.3em;box-shadow:0 0 0 2px rgba(255,255,255,.85)`;
    if (RE_IMG.test(v)) return `<img src="${v}" alt="" style="${base};object-fit:cover">`;
    const [emo, cor] = v.split('|');
    return `<span style="${base};background:${cor};text-align:center;line-height:${em}em;font-size:1em"><span style="font-size:.72em">${esc(emo)}</span></span>`;
  }
  // troca as fichas (§xxxxxx) que aparecem dentro de um texto/HTML pela foto
  const html = s => String(s).replace(/§[a-z0-9]{6}/g, t => TOK.has(t) ? txt(t) : '🙂');
  window.ArcadiaFoto = { eh, ehFoto, minha, sprite, txt, html, token, registrar, todos, resolver, get versao() { return versao; } };
})();
