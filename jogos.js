/* =========================================================================
   ARCÁDIA IA — Catálogo de jogos
   Para adicionar um jogo novo: crie a pasta em /jogos/<id>/index.html
   e acrescente um objeto neste array. A nota (estrelas) é sua: ela é dada
   na própria plataforma e fica salva no navegador.
   ========================================================================= */

const CAPA_CASA = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="glow" cx="50%" cy="52%" r="38%">
      <stop offset="0" stop-color="#d8955a" stop-opacity=".55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wl" x1="0" x2="1"><stop offset="0" stop-color="#070505"/><stop offset="1" stop-color="#2b1f17"/></linearGradient>
    <linearGradient id="wr" x1="1" x2="0"><stop offset="0" stop-color="#070505"/><stop offset="1" stop-color="#2b1f17"/></linearGradient>
    <linearGradient id="fl" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#040303"/><stop offset="1" stop-color="#2e1f15"/></linearGradient>
    <linearGradient id="ce" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#030202"/><stop offset="1" stop-color="#1d1410"/></linearGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="72%">
      <stop offset=".5" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".96"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="640" height="360" fill="#050404"/>
  <polygon points="0,0 640,0 362,128 278,128" fill="url(#ce)"/>
  <polygon points="0,0 278,128 278,232 0,360" fill="url(#wl)"/>
  <polygon points="640,0 362,128 362,232 640,360" fill="url(#wr)"/>
  <polygon points="0,360 278,232 362,232 640,360" fill="url(#fl)"/>
  <g stroke="#1a110c" stroke-width="2" opacity=".8">
    <line x1="0" y1="250" x2="278" y2="196"/><line x1="640" y1="250" x2="362" y2="196"/>
    <line x1="150" y1="360" x2="300" y2="232"/><line x1="490" y1="360" x2="340" y2="232"/>
    <line x1="320" y1="360" x2="320" y2="232"/>
  </g>
  <polygon points="118,112 172,128 172,282 118,306" fill="#030202"/>
  <polygon points="522,112 468,128 468,282 522,306" fill="#030202"/>
  <rect x="278" y="128" width="84" height="104" fill="#1a120d"/>
  <rect x="302" y="150" width="36" height="82" fill="#d99c5c" opacity=".9"/>
  <polygon points="302,232 338,232 400,330 240,330" fill="#d99c5c" opacity=".10"/>
  <rect width="640" height="360" fill="url(#glow)"/>
  <g fill="#0b0605">
    <ellipse cx="320" cy="166" rx="5.2" ry="7.4"/>
    <path d="M313.5 175 Q320 172 326.5 175 L328 204 L324.6 232 L321.8 232 L320 208 L318.2 232 L315.4 232 L312 204 Z"/>
    <path d="M314 177 L308.6 214 L310.6 215 L316.4 184 Z"/>
    <path d="M326 177 L331.4 214 L329.4 215 L323.6 184 Z"/>
  </g>
  <g fill="none" stroke="#3b2a1d" stroke-width="3">
    <rect x="470" y="118" width="38" height="50" transform="rotate(188 489 143)"/>
    <rect x="44" y="96" width="34" height="46" transform="rotate(-9 61 119)"/>
  </g>
  <text x="560" y="214" fill="#5a1a12" font-family="Georgia,serif" font-size="18" font-style="italic" transform="rotate(-14 560 214)" opacity=".7">volte</text>
  <rect width="640" height="360" filter="url(#grain)" opacity=".2"/>
  <rect width="640" height="360" fill="url(#vig)"/>
</svg>`;


const CAPA_DESEJOS = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="ceu" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#6a3fd0"/><stop offset="1" stop-color="#1b1033"/></radialGradient>
    <linearGradient id="chao" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f6e3c0"/><stop offset="1" stop-color="#e9c98f"/></linearGradient>
    <radialGradient id="luz" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd166" stop-opacity=".9"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="640" height="360" fill="url(#ceu)"/>
  <ellipse cx="320" cy="292" rx="330" ry="96" fill="#5b3f8c"/>
  <ellipse cx="320" cy="286" rx="300" ry="80" fill="url(#chao)"/>
  <ellipse cx="320" cy="286" rx="120" ry="30" fill="none" stroke="#c9945a" stroke-opacity=".35" stroke-width="4"/>
  <circle cx="320" cy="120" r="95" fill="url(#luz)"/>
  <text x="320" y="150" font-size="96" text-anchor="middle">🧞</text>
  <g font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="22">
    <rect x="186" y="28" width="268" height="40" rx="20" fill="#271650" stroke="#ffd166" stroke-width="3"/>
    <text x="320" y="56" text-anchor="middle"><tspan fill="#ffd166">vire</tspan><tspan fill="#ffffff"> </tspan><tspan fill="#4cc9f0">borboleta</tspan><tspan fill="#80ed99"> 10s</tspan></text>
  </g>
  <g font-size="46" text-anchor="middle">
    <text x="150" y="290">🦋</text><text x="230" y="320">😎</text><text x="410" y="318">🐉</text><text x="500" y="292">🐔</text>
    <text x="320" y="335">🤓</text><text x="96" y="236" font-size="34">🍕</text><text x="560" y="230" font-size="34">💣</text>
  </g>
  <g font-size="26" text-anchor="middle" opacity=".9"><text x="120" y="120">✨</text><text x="530" y="110">⭐</text><text x="470" y="180">🦈</text><text x="170" y="190">🌪️</text></g>
</svg>`;

const CAPA_GONGO = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="gf" cx="50%" cy="10%" r="95%"><stop offset="0" stop-color="#5b1d8a"/><stop offset=".5" stop-color="#1a0b30"/><stop offset="1" stop-color="#07030f"/></radialGradient>
    <radialGradient id="gg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff3c2"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#a35a00"/></radialGradient>
    <radialGradient id="gc" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#ff7aa8"/><stop offset="1" stop-color="#7a0a35"/></radialGradient>
    <linearGradient id="gl1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff3d7f" stop-opacity=".45"/><stop offset="1" stop-color="#ff3d7f" stop-opacity="0"/></linearGradient>
    <linearGradient id="gl2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4cc9f0" stop-opacity=".4"/><stop offset="1" stop-color="#4cc9f0" stop-opacity="0"/></linearGradient>
    <filter id="gb"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="640" height="360" fill="url(#gf)"/>
  <polygon points="90,0 120,0 260,360 0,360" fill="url(#gl1)"/>
  <polygon points="520,0 550,0 640,360 380,360" fill="url(#gl2)"/>
  <g opacity=".85">
    ${Array.from({ length: 34 }, (_, i) => `<circle cx="${10 + i * 19}" cy="${338 + (i % 2) * 8}" r="8" fill="hsl(${(i * 47) % 360} 70% 55%)"/>`).join('')}
  </g>
  <ellipse cx="320" cy="268" rx="250" ry="58" fill="#2d2440" stroke="#ff3d7f" stroke-width="5"/>
  <ellipse cx="320" cy="268" rx="250" ry="58" fill="none" stroke="#ff3d7f" stroke-width="12" opacity=".35" filter="url(#gb)"/>
  <g stroke-linecap="round">
    <line x1="320" y1="268" x2="560" y2="236" stroke="#ff3d7f" stroke-width="14" opacity=".35" filter="url(#gb)"/>
    <line x1="320" y1="268" x2="560" y2="236" stroke="#ffd6e5" stroke-width="5"/>
    <line x1="320" y1="268" x2="150" y2="306" stroke="#ff3d7f" stroke-width="14" opacity=".35" filter="url(#gb)"/>
    <line x1="320" y1="268" x2="150" y2="306" stroke="#ffd6e5" stroke-width="5"/>
  </g>
  <ellipse cx="320" cy="268" rx="26" ry="10" fill="url(#gc)"/>
  <rect x="244" y="46" width="12" height="170" rx="4" fill="#6b3b12"/>
  <rect x="384" y="46" width="12" height="170" rx="4" fill="#6b3b12"/>
  <rect x="236" y="40" width="168" height="14" rx="6" fill="#8a4d17"/>
  <line x1="290" y1="54" x2="300" y2="74" stroke="#caa36a" stroke-width="3"/><line x1="350" y1="54" x2="340" y2="74" stroke="#caa36a" stroke-width="3"/>
  <circle cx="320" cy="140" r="70" fill="#ffd166" opacity=".35" filter="url(#gb)"/>
  <circle cx="320" cy="140" r="64" fill="url(#gg)" stroke="#7a3f00" stroke-width="4"/>
  <circle cx="320" cy="140" r="44" fill="none" stroke="#a35a00" stroke-width="3" opacity=".6"/>
  <circle cx="320" cy="140" r="20" fill="#e8a523" stroke="#a35a00" stroke-width="3"/>
  <path d="M244 92 q-26 -20 -10 -44" stroke="#fff3c2" stroke-width="4" fill="none" opacity=".7"/>
  <path d="M396 92 q26 -20 10 -44" stroke="#fff3c2" stroke-width="4" fill="none" opacity=".7"/>
  <g>
    ${[[178, 236, '#4cc9f0', '😎'], [228, 258, '#5be38f', '🐸'], [410, 252, '#ff8c42', '🦊'], [462, 228, '#a78bfa', '🤖'], [372, 290, '#ff3d7f', '🐷'], [268, 294, '#ffd166', '😀']].map(([x, y, c, e]) => `<ellipse cx="${x}" cy="${y + 16}" rx="16" ry="6" fill="#000" opacity=".35"/><circle cx="${x}" cy="${y}" r="17" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="3"/><text x="${x}" y="${y + 7}" font-size="19" text-anchor="middle">${e}</text>`).join('')}
    <circle cx="530" cy="196" r="17" fill="#e4e6f2" opacity=".55"/><text x="530" y="203" font-size="19" text-anchor="middle" opacity=".6">👻</text>
    <text x="540" y="176" font-size="15" font-weight="800" fill="#ffd166" font-family="Arial Black, sans-serif">GONG!</text>
  </g>
  <text x="320" y="44" font-size="16" text-anchor="middle" fill="#ffd166" font-family="Arial Black, sans-serif" letter-spacing="4" opacity=".9">6 PROVAS · 50 COMPETIDORES</text>
</svg>`;

window.JOGOS = [
  {
    id: "gongo",
    nome: "GONGO! O Show das 6 Provas",
    genero: "Party Game",
    subgenero: "Party Royale (show de eliminação)",
    corGenero: "#ff3d7f",
    tags: ["Multijogador online", "Até 50 jogadores", "Bots", "2D", "Eliminação", "Game show", "Quiz"],
    criadoEm: "2026-11-20",
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Temporadas de 7–9 min",
    classificacao: "Livre",
    finais: 1,
    caminho: "jogos/gongo/index.html",
    capa: CAPA_GONGO,
    sinopse:
      "Um game show apresentado por um robô. Até 50 competidores, entre pessoas e bots, encaram 6 provas totalmente diferentes, e a cada uma o Gongo elimina uma parte. Só um sai campeão.",
    descricao: [
      "GONGO! é um party royale: um programa de auditório em que até 50 competidores entram no estúdio e só um sai com o troféu. O apresentador é o Gongo, um robô sem paciência que toca o gongo a cada eliminação. Numa sala online cabem até 50 pessoas, e os bots completam as vagas.",
      "São seis provas seguidas, cada uma com uma mecânica diferente. Na Corda de Laser você pula no tempo certo. No Quiz Corre-Corre você corre para a resposta certa antes que o chão das erradas suma. Na Bomba-Relógio você precisa se livrar da bomba encostando em alguém. No Piso da Memória você decora símbolos e corre para o piso certo. No Sumô no Gelo você empurra os outros para fora de uma arena que encolhe.",
      "Quem sobrevive chega à grande final, a Guerra de Tinta: cada finalista pinta o chão com a sua cor e quem tiver mais chão no fim vence o show. Foi eliminado? Você continua assistindo a temporada e entra de novo na próxima."
    ],
    mecanicas: [
      "6 provas com mecânicas diferentes: timing, conhecimento, batata-quente, memória, física no gelo e território",
      "Até 50 competidores na mesma sala, misturando pessoas e bots",
      "Bots com nível de habilidade próprio: erram o pulo, chutam respostas, esquecem símbolos e escorregam no gelo",
      "Cada prova elimina uma parte do grupo; se todo mundo errar ao mesmo tempo, o Gongo dá uma segunda chance",
      "Quiz com 70 perguntas de conhecimentos gerais e pegadinhas",
      "Quem é eliminado assiste o resto da temporada, alternando entre os competidores",
      "Pódio, ranking completo e nova temporada na hora",
      "Controles de toque no celular, com joystick e botão de ação"
    ],
    controles: [
      ["W A S D / setas", "Andar"],
      ["Espaço", "Ação da prova (pular, arrancar, investir, bomba de tinta)"],
      ["Espaço (eliminado)", "Assistir outro competidor"],
      ["🔊", "Som e música / só efeitos / mudo"]
    ],
    avisos: "Partidas online usam um servidor público gratuito (PeerJS) só para conectar os jogadores.",
    tecnologia: [
      "Canvas 2D com câmera que acompanha o jogador, plateia animada, luzes de estúdio, partículas e tremida de tela",
      "Multijogador P2P por WebRTC (PeerJS): o anfitrião simula a partida e envia um estado compacto 15 vezes por segundo, e os outros interpolam",
      "IA de bots diferente para cada prova",
      "Música e efeitos sonoros gerados na hora com Web Audio API"
    ]
  },
  {
    id: "arena-dos-desejos",
    nome: "Arena dos Desejos",
    genero: "Party Game",
    subgenero: "Sandbox de Palavras",
    corGenero: "#f59e0b",
    tags: ["Multijogador online", "Bots", "2D", "Caos", "Texto", "Arena", "Easter eggs"],
    criadoEm: "2026-11-20",
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Partidas de 4 min",
    classificacao: "Livre",
    finais: 1,
    caminho: "jogos/arena-dos-desejos/index.html",
    capa: CAPA_DESEJOS,
    sinopse:
      "Todo mundo nasce numa arena. A cada rodada, alguém vira o Gênio e escreve um pedido. O jogo entende as palavras-chave e faz acontecer: vire borboleta, ataque 5 tubarões, o chão é lava…",
    descricao: [
      "Arena dos Desejos é um party game de caos em que as regras são escritas pelos próprios jogadores. Você e outros jogadores (ou bots, se não tiver ninguém) lutam numa arena, e a cada rodada uma pessoa é sorteada para fazer um pedido ao Gênio.",
      "O pedido é um texto livre. O jogo procura palavras-marca (vire, ataque, chova, invoque, exploda, congele…), coisas (mais de 130: borboleta, dragão, pizza, bomba, tornado…), alvos (eu, todos, os outros, o nome de alguém), números e tempos (5 dragões, 10 segundos, para sempre). Junta tudo e o desejo acontece na hora.",
      "\"Vire borboleta\" te transforma numa borboleta. \"Vire borboleta 10 segundos\" faz isso só por 10 segundos. \"Ataque borboletas\" solta um enxame em cima dos outros. Dá para combinar: \"vire dragão e chova pizza\". Derrube os outros para ganhar pontos; quem tiver mais no fim dos 4 minutos vence.",
      "E tem segredo: 139 easter eggs escondidos. Escreva o nome de um certo esqueleto preguiçoso, grite um golpe de anime famoso ou cite um meme, e algo único acontece: o tempo para, um caminhão te manda para outro mundo, começa uma rodada de batatinha frita 1, 2, 3… O dicionário mostra só pistas dos que você ainda não achou."
    ],
    mecanicas: [
      "Interpretador de pedidos em português: entende verbos, plurais, diminutivos, números escritos e acentos",
      "27 palavras-marca e mais de 130 coisas, cada uma com tamanho, velocidade, vida, força e poderes próprios",
      "Transformações mudam seu ataque: dragão cospe fogo, galinha joga ovo, zumbi transforma quem morde, bomba explode",
      "Eventos globais: chão de lava com ilhas seguras, escuridão, terremoto, chuva de coisas",
      "O texto fica colorido enquanto você digita, mostrando quais palavras o Gênio reconheceu",
      "Salas online com código de 4 letras (até 8 pessoas) ou partida solo com bots que também fazem pedidos",
      "Controles de toque no celular, com mira automática",
      "139 easter eggs escondidos (Undertale, animes, games, memes, filmes e TV brasileira), cada um com um efeito único e um contador de descobertas no dicionário"
    ],
    controles: [
      ["W A S D", "Andar"],
      ["Mouse", "Mirar"],
      ["Clique / Espaço", "Atacar"],
      ["Enter", "Escrever o pedido (na sua vez)"],
      ["📖 Palavras", "Abrir o dicionário do Gênio"]
    ],
    avisos: "Partidas online usam um servidor público gratuito (PeerJS) só para conectar os jogadores.",
    tecnologia: [
      "Canvas 2D com emojis como sprites, partículas e câmera que segue o jogador",
      "Interpretador de linguagem natural feito à mão (sem IA externa): tokenização, normalização de acentos e plurais",
      "Multijogador P2P por WebRTC (PeerJS): o anfitrião simula a partida e envia o estado 20 vezes por segundo",
      "Sons gerados com Web Audio API"
    ]
  },
  {
    id: "a-casa-que-lembra",
    nome: "A Casa Que Lembra",
    genero: "Terror",
    subgenero: "Terror Psicológico",
    tags: ["Primeira pessoa", "3D", "Exploração", "Narrativo", "Sobrevivência", "Single-player"],
    criadoEm: "2026-11-19",
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "15–25 min",
    classificacao: "16+",
    finais: 2,
    caminho: "jogos/a-casa-que-lembra/index.html",
    capa: CAPA_CASA,
    corDestaque: "#d99c5c",
    sinopse:
      "Vinte anos depois, você volta à casa onde sua irmã mais nova desapareceu. Para ir embora, precisa encontrar as cinco memórias dela, mas a casa não quer que você lembre.",
    descricao: [
      "A Casa Que Lembra é um terror psicológico curto, narrativo e em primeira pessoa. Você explora uma casa de família abandonada com uma lanterna de bateria fraca, atrás de cinco objetos ligados a Clara, sua irmã caçula.",
      "A cada memória recuperada a casa muda. Os quadros viram de cabeça para baixo, frases aparecem escritas nas paredes, as luzes morrem e os móveis deixam de respeitar a gravidade. E tem o manequim: ele só se move quando você não está olhando, ou quando está escuro demais para enxergá-lo. Só que encará-lo também corrói a sua sanidade.",
      "O medo não vem de monstros. Vem da dúvida: o que aconteceu com Clara, e quanto do que você lembra é verdade? Existem dois finais."
    ],
    mecanicas: [
      "Um manequim que só se move quando não é visto, ou quando está no escuro",
      "Sanidade que cai no escuro e quando você encara a criatura, e volta perto das luzes",
      "Lanterna com bateria limitada que falha quando está fraca",
      "Cinco memórias com textos que vão revelando a história",
      "A casa se transforma a cada memória encontrada",
      "Áudio 100% procedural: batimentos, sussurros, rangidos e uma caixinha de música desafinada",
      "Dois finais, decididos por uma escolha"
    ],
    controles: [
      ["W A S D", "Andar"],
      ["Mouse", "Olhar"],
      ["Shift", "Correr"],
      ["F", "Ligar/desligar a lanterna"],
      ["E", "Interagir / pegar"],
      ["Esc", "Pausar"]
    ],
    avisos: "Luzes piscando, sustos, sons altos e temas de luto e saúde mental. Jogue de fone.",
    tecnologia: [
      "Three.js r160 (WebGL) com pós-processamento próprio: grão, aberração cromática e distorção",
      "Modelo 3D do manequim: Xbot (exemplos oficiais do three.js / Mixamo), carregado da internet",
      "Sons gerados em tempo real com Web Audio API, com reverb por convolução",
      "Texturas pintadas por código (papel de parede, assoalho, retratos)"
    ]
  }
];
