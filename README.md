# ARCÁDIA·IA — Jogos criados por IA

Uma plataforma de jogos para navegador em que **todos os jogos são criados por inteligência artificial**. Cada jogo tem nome, gênero, subgênero, descrição, ficha técnica e uma **nota em estrelas** dada por quem joga. A nota fica salva no navegador e pode ser exportada ou importada em JSON.

## Jogos

| Jogo | Gênero | Subgênero | Duração |
|---|---|---|---|
| **A Casa Que Lembra** | Terror | Terror Psicológico | 15–25 min |
| **Arena dos Desejos** | Party Game | Sandbox de Palavras | Partidas de 4 min |
| **GONGO! O Show das 6 Provas** | Party Game | Party Royale (show de eliminação) | Temporadas de 7–9 min |
| **Detetive** | Dedução Social | Ladrões, detetives e clones | Partidas de 3–5 min |
| **Roube um Emoji** | Tycoon | Coleção e roubo | Sem fim (progresso salvo) |
| **Sete Noites na Neve** | Sobrevivência | Sobrevivência no frio | 20–30 min |

### Sete Noites na Neve
Seu avião caiu num vale congelado e o resgate só chega depois de sete noites. Um jogo de sobrevivência no frio em 3D:

- 🔥 **Calor**: à noite e nas nevascas o frio corta. Fogueira, abrigo, tocha e casaco de pele seguram o frio.
- 🍖 **Fome**: frutinhas nos arbustos, peixe nos buracos do lago congelado e coelhos nas armadilhas (asse no fogo: cru faz mal).
- 🛠️ **Criar**: machado, fogueira, tocha, vara de pesca, armadilha, abrigo, casaco de pele e fogueira de sinal.
- 🐺 **Lobos**: rondam no escuro, atacam quem está desprotegido e fogem do fogo e dos golpes.

Dois finais: aguentar as sete noites, ou acender a fogueira de sinal no alto do morro à noite. O jogo salva a cada amanhecer.

**Controles:** `WASD` andar · `Shift` correr · segurar `E` ação · `C` criar · `Q` comer · `F` tocha · `Espaço` ou clique golpe

### Roube um Emoji
Um tycoon 3D de coleção e roubo para até 8 bases (pessoas e bots). Os emojis desfilam num tapete vermelho no meio do mapa:

- 🛒 **Compre**: chegue perto de um emoji do desfile e aperte `E`; ele anda sozinho até um pedestal da sua base.
- 💰 **Lucre**: cada emoji rende $/s, que se acumula no cofre dourado da base. Pise nele para coletar.
- 🫳 **Roube**: segure `E` num emoji da base de um rival e corra para casa. Um tapa faz o ladrão largar o roubo.
- 🔒 **Tranque**: o botão vermelho da base liga lasers que barram os rivais por 40 s.

30 emojis em 6 raridades (Comum → Secreto), mutações de Ouro ×2, Diamante ×4 e Arco-íris ×8, e a Chuva de Sorte, quando os raros aparecem 4× mais. Junte $1 milhão para virar milionário. No modo com bots o progresso fica salvo no navegador.

**Controles:** `WASD` andar · arrastar gira a câmera · `E` comprar/trancar · segurar `E` roubar/vender · `Espaço` ou clique tapa · salas online com código de 4 letras (até 8 bases)

### Detetive
Noite no Shopping Estrela, com até 30 pessoas ou bots. Cada um recebe um papel secreto:

- 🦹 **Ladrão**: rouba os objetos das lojas, coloca câmeras em loop e causa apagões.
- 🕵️ **Detetive**: vê pegadas frescas, fareja quem roubou há pouco e prende (prisão errada custa um distintivo).
- 🧰 **Ajudante**: vigia as câmeras ao vivo, conserta vitrines e câmeras, religa a luz e faz tarefas que inocentam gente.

**Os clones:** cada pessoa nasce com o próprio visual ou com o de outra pessoa (nome e rosto sempre juntos), e o mesmo visual pode estar em dois corpos. Na metade da partida, todo mundo troca de disfarce. De fora de uma loja não dá para ver quem está lá dentro: só quem está na loja ou quem olha as câmeras.

**Controles:** `WASD` andar · segurar `Espaço` ação · `Q` habilidade · salas online com código de 4 letras (até 30 pessoas)

## Contas
Quem tem conta pode **publicar jogos do Studio para todo mundo** (aba Jogos de Players → 🌍 Online, com o selo ✓ de conta verificada), **curtir** jogos da comunidade e ter **projetos do Studio e notas salvos na nuvem**, abrindo em qualquer aparelho. Tudo fica no mesmo servidor do Apps Script (abas Conteudos, Curtidas, Nuvem e Blobs da planilha).

O botão **Entrar** da plataforma cria uma conta com verificação por e-mail e, se a pessoa quiser, verificação em duas etapas. Toda entrada na conta gera um aviso detalhado no e-mail do dono. O servidor roda em Google Apps Script na conta da empresa; veja [servidor-contas/LEIAME.md](servidor-contas/LEIAME.md).

O selo **Novo** de cada jogo some sozinho 2 dias depois do lançamento (campo `lancadoEm` em `jogos.js`).

### GONGO! O Show das 6 Provas
Um game show apresentado por um robô: até 50 competidores (pessoas e bots) passam por 6 provas bem diferentes, e a cada uma o Gongo elimina uma parte. Só um vence.

1. ⚡ **Corda de Laser**: lasers giram a partir do centro; pule na hora certa
2. ❓ **Quiz Corre-Corre**: corra para o quadrado da resposta certa antes que o chão das erradas suma
3. 💣 **Bomba-Relógio**: passe a bomba encostando nos outros antes que ela exploda
4. 🧠 **Piso da Memória**: decore os símbolos do chão e corra para o certo quando o Gongo gritar
5. 🧊 **Sumô no Gelo**: empurre os outros para fora de uma arena escorregadia que encolhe
6. 🎨 **Final: Guerra de Tinta**: quem pintar mais chão com a sua cor vence o show

**Controles:** `WASD` andar · `Espaço` ação da prova · salas online com código de 4 letras (até 50 pessoas)

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

## Versões
- A versão da plataforma aparece no rodapé (e a do app, quando aberto pelo app Android/Windows). Cada jogo mostra a própria versão na barra de cima ("Detetive · v1.2.0"), na ficha técnica e num selo no canto da tela do jogo.
- Ao publicar uma mudança: aumente `window.ARCADIA_VERSAO` em `jogos.js`, `VERSAO_HTML` em `index.html`, `window.VERSAO_STUDIO` em `studio/index.html` e `studio/jogar.html` (e o `?v=` dos scripts deles) e `versao.json` (todos iguais). O Studio também confere `versao.json` ao abrir e recarrega sozinho se estiver velho. No jogo alterado, aumente `versao` em `jogos.js` e `window.VERSAO_JOGO` no fim do arquivo do jogo.
- O site confere `versao.json` sem cache ao abrir: se a página estiver velha, recarrega sozinho. Os jogos abrem com `?v=versão`, então o app nunca usa um arquivo antigo do cache.

## Adicionar um jogo novo
1. Crie a pasta `jogos/<id-do-jogo>/index.html`.
2. Acrescente um objeto ao array `window.JOGOS` em `jogos.js`.

## Créditos
- Jogos e plataforma criados por Claude (Anthropic)
- [three.js](https://threejs.org) r160
- Manequim: modelo *Xbot* dos exemplos do three.js (Mixamo)
