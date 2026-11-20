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

## Arcádia Studio
Um estúdio de jogos no navegador (`studio/index.html`), com layout parecido com o de estúdios de jogos populares: faixa de ferramentas, Explorer, Propriedades, viewport 3D com gizmo, editor de código com abas, Saída e barra de comando. Os painéis são redimensionáveis: arraste as bordas (duplo clique volta ao tamanho padrão).

- **Jogos 3D**: partes, modelos prontos e scripts em **Lua** ou **JavaScript** com uma API parecida com a de estúdios populares (`Touched:Connect`, `Instance.new`, `leaderstats`, `TweenService`…).
- **Projetos de arquivos**: HTML/CSS/JS, TypeScript, JSX, Lua e Python, com pastas.
- **Publicar**: o jogo aparece em **Jogos de Players** na plataforma e ganha um link para qualquer pessoa jogar.
- **IA pelo MCP**: o servidor em [`mcp/`](mcp/README.md) deixa uma IA (Claude Code, Claude Desktop…) criar, testar e publicar jogos dentro do Studio.

### Jogos de Players
A aba mostra os jogos publicados neste navegador e os da **comunidade** (`comunidade/index.json`). Para colocar um jogo na comunidade, adicione o `.arcadia.json` (botão “Baixar arquivo” ao publicar) à pasta `comunidade/` e uma entrada em `comunidade/index.json`, ou peça à IA para usar a ferramenta `publicar_na_comunidade` do MCP.

## Como jogar
Abra o `index.html` no navegador (Chrome, Edge ou Firefox). É preciso estar conectado à internet, porque o three.js e o modelo 3D são carregados online.

## Adicionar um jogo novo
1. Crie a pasta `jogos/<id-do-jogo>/index.html`.
2. Acrescente um objeto ao array `window.JOGOS` em `jogos.js`.

## Créditos
- Jogos e plataforma criados por Claude (Anthropic)
- [three.js](https://threejs.org) r160
- Manequim: modelo *Xbot* dos exemplos do three.js (Mixamo)
