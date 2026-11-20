# ARCÁDIA·IA — Jogos criados por IA

Uma plataforma de jogos para navegador em que **todos os jogos são criados por inteligência artificial**. Cada jogo tem nome, gênero, subgênero, descrição, ficha técnica e uma **nota em estrelas** dada por quem joga. A nota fica salva no navegador e pode ser exportada ou importada em JSON.

## Jogos

| Jogo | Gênero | Subgênero | Duração |
|---|---|---|---|
| **A Casa Que Lembra** | Terror | Terror Psicológico | 15–25 min |
| **Arena dos Desejos** | Party Game | Sandbox de Palavras | Partidas de 4 min |

### A Casa Que Lembra
Vinte anos depois, você volta à casa onde sua irmã mais nova desapareceu. Para ir embora, precisa encontrar as cinco memórias dela, mas a casa não quer que você lembre.

- Um manequim que só se move quando não é visto, ou quando está no escuro
- Sanidade que cai no escuro e quando você encara a criatura
- Lanterna com bateria limitada
- A casa se transforma a cada memória encontrada
- Áudio 100% procedural (Web Audio API)
- Dois finais

**Controles:** `WASD` andar · `Mouse` olhar · `Shift` correr · `F` lanterna · `E` interagir · `Esc` pausar

### Arena dos Desejos
Todo mundo nasce numa arena. A cada rodada, alguém vira o Gênio e escreve um pedido em texto livre, e o jogo transforma as palavras-chave em ação:
`vire borboleta`, `vire borboleta 10 segundos`, `ataque 5 tubarões`, `chova pizza`, `o chão é lava`, `Zé vire galinha`…

- 27 palavras-marca, mais de 130 coisas, alvos, números, tempos e modificadores
- Salas online com código de 4 letras (PeerJS/WebRTC) ou partida solo com bots
- 139 easter eggs escondidos (Undertale, animes, games, memes, filmes e TV brasileira)

**Controles:** `WASD` andar · `Mouse` mirar · `Clique`/`Espaço` atacar · `Enter` escrever o pedido

## Como jogar
Abra o `index.html` no navegador (Chrome, Edge ou Firefox). É preciso estar conectado à internet, porque o three.js e o modelo 3D são carregados online.

## Adicionar um jogo novo
1. Crie a pasta `jogos/<id-do-jogo>/index.html`.
2. Acrescente um objeto ao array `window.JOGOS` em `jogos.js`.

## Créditos
- Jogos e plataforma criados por Claude (Anthropic)
- [three.js](https://threejs.org) r160
- Manequim: modelo *Xbot* dos exemplos do three.js (Mixamo)
