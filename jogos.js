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

window.JOGOS = [
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
