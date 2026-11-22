/* Arcádia IA · salas públicas (sem código) para os jogos online com PeerJS.

   Não existe servidor com lista de salas: as salas públicas têm endereços fixos
   (<prefixo>publica-1, <prefixo>publica-2, …). Quem clica em "Sala pública" tenta
   abrir a sala 1. Se o endereço estiver livre, essa pessoa vira a anfitriã. Se já
   existir alguém lá, entra como convidado. Se a sala estiver cheia (ou sumiu no
   meio do caminho), tenta a próxima.

   Uso no jogo:
     ArcadiaPublica.procurar({
       Peer, prefixo: PREFIXO,
       aoStatus: texto => …,                 // "Procurando sala pública… (2)"
       aoHospedar: (peer, nome, n) => …,     // o endereço era livre: peer já aberto
       aoEntrar: (cod, falhou) => …,         // já existe: conectar em PREFIXO + cod; se não der, chamar falhou()
       aoErro: texto => …,
     });
*/
(function () {
  'use strict';
  const MAX_SALAS = 12;
  window.ArcadiaPublica = {
    MAX_SALAS,
    procurar(o) {
      let n = 1;
      const tentar = () => {
        if (n > MAX_SALAS) { o.aoErro('Todas as salas públicas estão cheias agora. Tente de novo daqui a pouco.'); return; }
        o.aoStatus(n === 1 ? 'Procurando sala pública…' : `Procurando sala pública… (sala ${n})`);
        const cod = 'publica-' + n;
        let resolvido = false;
        let p;
        try { p = new o.Peer(o.prefixo + cod, { debug: 0 }); } catch (e) { o.aoErro('Não foi possível conectar.'); return; }
        p.on('open', () => { if (resolvido) return; resolvido = true; o.aoHospedar(p, 'SALA PÚBLICA ' + n, n); });
        p.on('error', e => {
          if (resolvido) return;
          resolvido = true;
          try { p.destroy(); } catch (er) {}
          if (e.type === 'unavailable-id') o.aoEntrar(cod, () => { n++; tentar(); });
          else o.aoErro('Não foi possível conectar ao servidor de salas (' + e.type + ').');
        });
      };
      tentar();
    },
  };
})();
