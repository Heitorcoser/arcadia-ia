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

const CAPA_DETETIVE = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="dl" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2a3550"/><stop offset="1" stop-color="#07090f"/></radialGradient>
    <radialGradient id="dz" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>
    <linearGradient id="dv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9bd3ff" stop-opacity=".35"/><stop offset="1" stop-color="#9bd3ff" stop-opacity=".08"/></linearGradient>
    <filter id="db"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="640" height="360" fill="url(#dl)"/>
  <rect x="0" y="210" width="640" height="150" fill="#1a1f2c"/>
  <g>
    <rect x="30" y="60" width="170" height="150" fill="#2f2752" stroke="#3a3f4d" stroke-width="8"/><rect x="48" y="96" width="134" height="70" fill="url(#dv)"/><text x="115" y="88" font-size="16" text-anchor="middle" fill="#f5e6c4" font-family="Arial Black,sans-serif">GAMES</text><text x="78" y="145" font-size="30" text-anchor="middle">🎮</text><text x="150" y="145" font-size="30" text-anchor="middle">🕹️</text>
    <rect x="440" y="60" width="170" height="150" fill="#3b2f52" stroke="#3a3f4d" stroke-width="8"/><rect x="458" y="96" width="134" height="70" fill="url(#dv)"/><text x="525" y="88" font-size="16" text-anchor="middle" fill="#f5e6c4" font-family="Arial Black,sans-serif">JOALHERIA</text><text x="490" y="145" font-size="30" text-anchor="middle">💍</text><text x="560" y="145" font-size="30" text-anchor="middle" opacity=".3">💎</text>
    <path d="M540 118 l14 14 -8 10 14 12" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
    <text x="458" y="82" font-size="16">📷</text><circle cx="477" cy="70" r="3.5" fill="#f59e0b"/>
  </g>
  <g fill="#ff5a2a" opacity=".85">
    <ellipse cx="452" cy="232" rx="4" ry="7" transform="rotate(-70 452 232)"/><ellipse cx="420" cy="246" rx="4" ry="7" transform="rotate(-70 420 246)"/><ellipse cx="388" cy="236" rx="4" ry="7" transform="rotate(-70 388 236)"/><ellipse cx="356" cy="250" rx="4" ry="7" transform="rotate(-70 356 250)"/><ellipse cx="324" cy="240" rx="4" ry="7" transform="rotate(-70 324 240)" opacity=".6"/><ellipse cx="292" cy="254" rx="4" ry="7" transform="rotate(-70 292 254)" opacity=".4"/>
  </g>
  <g font-family="Arial Black,sans-serif" text-anchor="middle">
    ${[[150, 262, '#e98bd6', '🦊', 'ANA'], [228, 286, '#7fd0a6', '🐸', 'BETO'], [500, 286, '#e98bd6', '🦊', 'ANA'], [590, 258, '#8fb4ff', '🐼', 'CAIO']].map(([x, y, c, e, n]) => `<ellipse cx="${x}" cy="${y + 18}" rx="18" ry="6" fill="#000" opacity=".35"/><circle cx="${x}" cy="${y}" r="19" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="3"/><text x="${x}" y="${y + 8}" font-size="21">${e}</text><text x="${x}" y="${y - 26}" font-size="12" fill="#fff">${n}</text>`).join('')}
    <text x="500" y="244" font-size="20" fill="#fca5a5">?</text><text x="150" y="222" font-size="20" fill="#fca5a5">?</text>
  </g>
  <circle cx="300" cy="150" r="88" fill="url(#dz)"/>
  <circle cx="300" cy="150" r="62" fill="none" stroke="#f5c542" stroke-width="12"/>
  <circle cx="300" cy="150" r="62" fill="#ffffff" opacity=".07"/>
  <line x1="344" y1="194" x2="398" y2="250" stroke="#7a4a1a" stroke-width="18" stroke-linecap="round"/>
  <text x="300" y="168" font-size="46" text-anchor="middle">🕵️</text>
  <text x="320" y="336" font-size="30" text-anchor="middle" fill="#f5e6c4" font-family="Courier New,monospace" font-weight="bold" letter-spacing="8">DETETIVE</text>
</svg>`;

const CAPA_EMOJI = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="ec" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2f8cff"/><stop offset=".55" stop-color="#9fd8ff"/><stop offset="1" stop-color="#e9f7ff"/></linearGradient>
    <linearGradient id="et" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b3123f"/><stop offset=".5" stop-color="#e0245e"/><stop offset="1" stop-color="#b3123f"/></linearGradient>
    <radialGradient id="eb" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3c2" stop-opacity=".9"/><stop offset="1" stop-color="#ffc53d" stop-opacity="0"/></radialGradient>
    <linearGradient id="ez" x1="0" x2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffc53d"/><stop offset=".5" stop-color="#4ade80"/><stop offset=".75" stop-color="#4dabf7"/><stop offset="1" stop-color="#c084fc"/></linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#ec)"/>
  <rect y="190" width="640" height="170" fill="#62bd55"/>
  <polygon points="0,214 640,214 640,300 0,300" fill="#f4e8cf"/>
  <polygon points="0,232 640,232 640,282 0,282" fill="url(#et)"/>
  <rect y="228" width="640" height="5" fill="#ffc53d"/><rect y="281" width="640" height="5" fill="#ffc53d"/>
  <g fill="#ffffff" opacity=".14"><polygon points="40,240 70,257 40,274 52,274 82,257 52,240"/><polygon points="200,240 230,257 200,274 212,274 242,257 212,240"/><polygon points="360,240 390,257 360,274 372,274 402,257 372,240"/><polygon points="520,240 550,257 520,274 532,274 562,257 532,240"/></g>
  <g fill="#8e9aab"><rect x="20" y="176" width="150" height="46" rx="6"/><rect x="470" y="176" width="150" height="46" rx="6"/></g>
  <g fill="#ff5a5a"><rect x="20" y="172" width="150" height="9" rx="4"/></g><g fill="#4dabf7"><rect x="470" y="172" width="150" height="9" rx="4"/></g>
  <g stroke="#ff2a3a" stroke-width="3" opacity=".9"><line x1="470" y1="190" x2="620" y2="190"/><line x1="470" y1="202" x2="620" y2="202"/><line x1="470" y1="214" x2="620" y2="214"/></g>
  <ellipse cx="320" cy="250" rx="70" ry="22" fill="url(#eb)"/>
  <g font-size="44" text-anchor="middle">
    <text x="70" y="262">🍌</text><text x="160" y="268">🦖</text><text x="480" y="266">🐉</text><text x="575" y="262">🍕</text>
  </g>
  <text x="320" y="268" font-size="70" text-anchor="middle">💎</text>
  <text x="92" y="214" font-size="30" text-anchor="middle">🌈</text><text x="548" y="214" font-size="30" text-anchor="middle">🗿</text>
  <text x="250" y="222" font-size="40" text-anchor="middle">😎</text>
  <text x="285" y="205" font-size="26" text-anchor="middle">🫳</text>
  <text x="400" y="222" font-size="40" text-anchor="middle">🤠</text>
  <text x="372" y="205" font-size="26" text-anchor="middle">🖐️</text>
  <g font-family="Arial Black,Impact,sans-serif" font-weight="900" text-anchor="middle" transform="rotate(-3 320 130)">
    <text x="320" y="140" font-size="54" fill="#8a2c0d">ROUBE UM EMOJI</text>
    <text x="320" y="135" font-size="54" fill="#e8590c">ROUBE UM EMOJI</text>
    <text x="320" y="131" font-size="54" fill="#fff3c2">ROUBE UM EMOJI</text>
  </g>
  <rect x="215" y="150" width="210" height="24" rx="12" fill="url(#ez)"/>
  <text x="320" y="167" font-size="16" text-anchor="middle" fill="#1b1b2f" font-family="Arial,sans-serif" font-weight="bold">COLECIONE · LUCRE · ROUBE</text>
</svg>`;

const CAPA_NEVE = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="nc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#040a1a"/><stop offset=".6" stop-color="#14284a"/><stop offset="1" stop-color="#2b4a74"/></linearGradient>
    <radialGradient id="nf" cx="50%" cy="72%" r="42%"><stop offset="0" stop-color="#ffb347" stop-opacity=".75"/><stop offset=".45" stop-color="#ff7a1a" stop-opacity=".25"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="nn" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8f3ff"/><stop offset="1" stop-color="#9fb8d6"/></linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#nc)"/>
  <g fill="#fff"><circle cx="60" cy="40" r="1.4"/><circle cx="140" cy="80" r="1"/><circle cx="210" cy="30" r="1.6"/><circle cx="420" cy="50" r="1.2"/><circle cx="500" cy="25" r="1.5"/><circle cx="580" cy="90" r="1"/><circle cx="350" cy="20" r="1"/><circle cx="270" cy="95" r="1.2"/></g>
  <circle cx="540" cy="70" r="26" fill="#e8f1ff"/><circle cx="530" cy="62" r="24" fill="#14284a" opacity=".25"/>
  <path d="M0 230 L90 150 L170 215 L260 140 L360 220 L450 135 L560 210 L640 165 L640 360 L0 360Z" fill="#1c3458"/>
  <path d="M0 270 Q160 225 320 255 T640 240 L640 360 L0 360Z" fill="url(#nn)"/>
  <rect width="640" height="360" fill="url(#nf)"/>
  <g fill="#10263f"><path d="M40 265 L70 175 L100 265Z"/><path d="M80 270 L118 160 L156 270Z"/><path d="M520 262 L556 165 L592 262Z"/><path d="M570 268 L600 190 L630 268Z"/></g>
  <g fill="#e8f3ff"><path d="M60 205 L70 175 L80 205Z"/><path d="M106 195 L118 160 L130 195Z"/><path d="M545 198 L556 165 L567 198Z"/></g>
  <g fill="#6a4426"><rect x="286" y="268" width="68" height="9" rx="4" transform="rotate(14 320 272)"/><rect x="286" y="268" width="68" height="9" rx="4" transform="rotate(-14 320 272)"/></g>
  <path d="M320 205 C300 235 296 255 320 268 C344 255 340 235 320 205Z" fill="#ff7a1a"/>
  <path d="M320 228 C309 245 309 258 320 265 C331 258 331 245 320 228Z" fill="#ffd75a"/>
  <g fill="#8b9099"><circle cx="292" cy="276" r="6"/><circle cx="348" cy="276" r="6"/><circle cx="305" cy="281" r="5"/><circle cx="335" cy="281" r="5"/></g>
  <g transform="translate(232 238)"><rect x="-10" y="-4" width="20" height="26" rx="5" fill="#2f6fd6"/><circle cx="0" cy="-12" r="9" fill="#f1c7a0"/><path d="M-9 -15 L0 -30 L9 -15Z" fill="#e2453c"/><rect x="-11" y="-6" width="22" height="5" rx="2" fill="#e2453c"/></g>
  <g fill="#ffd34a"><circle cx="458" cy="246" r="2.6"/><circle cx="468" cy="246" r="2.6"/><circle cx="160" cy="252" r="2.4"/><circle cx="169" cy="252" r="2.4"/></g>
  <g fill="#fff" opacity=".8"><circle cx="100" cy="120" r="2"/><circle cx="190" cy="170" r="1.6"/><circle cx="300" cy="140" r="2.2"/><circle cx="380" cy="110" r="1.8"/><circle cx="470" cy="160" r="2"/><circle cx="600" cy="130" r="1.6"/><circle cx="240" cy="60" r="1.8"/><circle cx="430" cy="200" r="1.4"/></g>
  <text x="320" y="88" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="58" fill="#24476e">SETE NOITES</text>
  <text x="320" y="84" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="58" fill="#f3fbff">SETE NOITES</text>
  <text x="320" y="124" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="34" fill="#ff9a3c" letter-spacing="6">NA NEVE</text>
</svg>`;

const CAPA_MADANG = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="mc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0b1030"/><stop offset=".6" stop-color="#1b1440"/><stop offset="1" stop-color="#2a1630"/></linearGradient>
    <radialGradient id="mp" cx="50%" cy="85%" r="60%"><stop offset="0" stop-color="#e3c08a"/><stop offset="1" stop-color="#a8804c"/></radialGradient>
    <linearGradient id="mt" x1="0" x2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset=".45" stop-color="#f472b6"/><stop offset=".8" stop-color="#fbbf24"/><stop offset="1" stop-color="#fff"/></linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#mc)"/>
  <path d="M0 40 Q80 70 160 48 T320 50 T480 46 T640 44" stroke="rgba(255,255,255,.25)" stroke-width="2" fill="none"/>
  <g><ellipse cx="60" cy="72" rx="12" ry="16" fill="#ff4d4d"/><ellipse cx="160" cy="66" rx="12" ry="16" fill="#ffb02e"/><ellipse cx="250" cy="70" rx="12" ry="16" fill="#3b82f6"/><ellipse cx="390" cy="70" rx="12" ry="16" fill="#22c55e"/><ellipse cx="480" cy="66" rx="12" ry="16" fill="#f472b6"/><ellipse cx="580" cy="68" rx="12" ry="16" fill="#ff4d4d"/></g>
  <path d="M40 150 Q320 95 600 150 L620 165 L20 165Z" fill="#2b2b38"/>
  <path d="M60 165 L580 165 L560 205 L80 205Z" fill="#7a2e1b"/>
  <g fill="#f5b301"><rect x="90" y="205" width="10" height="45"/><rect x="540" y="205" width="10" height="45"/></g>
  <ellipse cx="320" cy="330" rx="420" ry="120" fill="url(#mp)"/>
  <path d="M0 290 Q320 255 640 290" stroke="#c8a26b" stroke-width="9" fill="none"/>
  <path d="M0 290 Q320 255 640 290" stroke="#8a6a3a" stroke-width="2" stroke-dasharray="8 8" fill="none"/>
  <path d="M312 262 L328 262 L334 238 L306 238Z" fill="#e11d48"/>
  <g transform="translate(130 300)"><circle r="22" fill="#3b82f6"/><text y="9" font-size="26" text-anchor="middle">😀</text></g>
  <g transform="translate(205 286)"><circle r="20" fill="#60a5fa"/><text y="8" font-size="23" text-anchor="middle">🐯</text></g>
  <g transform="translate(445 286)"><circle r="20" fill="#f87171"/><text y="8" font-size="23" text-anchor="middle">🐼</text></g>
  <g transform="translate(515 300)"><circle r="22" fill="#ef4444"/><text y="9" font-size="26" text-anchor="middle">🦊</text></g>
  <g transform="translate(560 226) rotate(-20)"><circle r="6" fill="#e8e2d0"/><path d="M0 -2 Q-8 -14 -6 -26 M0 -2 Q-2 -16 0 -28 M0 -2 Q4 -15 6 -26" stroke="#e11d48" stroke-width="3" fill="none"/></g>
  <g transform="translate(78 224) rotate(15)"><rect x="-14" y="-14" width="28" height="28" fill="#2563eb"/><path d="M-14 -14 L14 14 M14 -14 L-14 14" stroke="rgba(0,0,0,.35)" stroke-width="2"/></g>
  <g transform="translate(600 160)"><ellipse rx="22" ry="20" fill="#dbe6f5"/><rect x="-9" y="-30" width="18" height="12" fill="#dbe6f5"/><path d="M-6 -30 L-14 -62 M2 -30 L6 -64 M8 -30 L20 -58" stroke="#7a4a1a" stroke-width="3"/></g>
  <text x="320" y="128" text-anchor="middle" font-family="Black Han Sans,Impact,Arial Black,sans-serif" font-size="26" fill="#f5b301" letter-spacing="10">마 당</text>
  <text x="320" y="188" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="66" fill="#3a1a10">MADANG!</text>
  <text x="320" y="182" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="66" fill="url(#mt)">MADANG!</text>
  <text x="320" y="222" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="16" fill="#fff8ec" letter-spacing="3">FESTIVAL DOS JOGOS COREANOS</text>
</svg>`;

const CAPA_ROLETA = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="rf" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#5a1530"/><stop offset=".55" stop-color="#1a0b24"/><stop offset="1" stop-color="#0b0710"/></radialGradient>
    <radialGradient id="ra" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff2d55" stop-opacity=".55"/><stop offset="1" stop-color="#ff2d55" stop-opacity="0"/></radialGradient>
    <filter id="rb"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <rect width="640" height="360" fill="url(#rf)"/>
  <g transform="translate(150 190)">
    ${Array.from({ length: 12 }, (_, i) => { const a0 = i / 12 * Math.PI * 2 - 0.3, a1 = a0 + Math.PI * 2 / 12, R = 120, x0 = Math.cos(a0) * R, y0 = Math.sin(a0) * R, x1 = Math.cos(a1) * R, y1 = Math.sin(a1) * R; return `<path d="M0 0 L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${i % 2 ? '#2a1640' : '#3a1d55'}" stroke="#ffd16655" stroke-width="2"/>`; }).join('')}
    ${['😅', '👹', '👵', '🐔', '🧙', '🐉', '🟢', '🤡', '💀', '📐', '🦈', '🤖'].map((e, i) => { const a = (i + 0.5) / 12 * Math.PI * 2 - 0.3; return `<text x="${(Math.cos(a) * 84).toFixed(1)}" y="${(Math.sin(a) * 84 + 9).toFixed(1)}" font-size="24" text-anchor="middle">${e}</text>`; }).join('')}
    <circle r="120" fill="none" stroke="#ffd166" stroke-width="8"/><circle r="24" fill="#ffd166"/><text y="9" font-size="24" text-anchor="middle">🎡</text>
    <path d="M-14 -150 L14 -150 L0 -122 Z" fill="#ff4d5e"/>
  </g>
  <circle cx="470" cy="160" r="130" fill="url(#ra)"/>
  <g stroke="#7f1d1d" stroke-width="13" stroke-linecap="round"><line x1="450" y1="160" x2="388" y2="120"/><line x1="490" y1="160" x2="552" y2="120"/><line x1="450" y1="180" x2="380" y2="210"/><line x1="490" y1="180" x2="560" y2="210"/></g>
  <text x="470" y="200" font-size="110" text-anchor="middle">👹</text>
  <g stroke="#fff" stroke-linecap="round" opacity=".9"><line x1="300" y1="40" x2="620" y2="300" stroke-width="5"/><line x1="610" y1="30" x2="330" y2="330" stroke-width="3"/></g>
  <g stroke="#ff2d55" stroke-width="12" opacity=".35" filter="url(#rb)"><line x1="300" y1="40" x2="620" y2="300"/><line x1="610" y1="30" x2="330" y2="330"/></g>
  <g font-size="26"><text x="360" y="300">🩴</text><text x="560" y="90">🩴</text><text x="300" y="110">🔥</text><text x="590" y="250">🐥</text></g>
  <text x="320" y="345" font-size="26" text-anchor="middle" fill="#ffd166" font-family="Arial Black,sans-serif" letter-spacing="3">ROLETA DE CHEFÕES</text>
</svg>`;

const CAPA_FEIRA = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="fx" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#6b6f76"/><rect width="20" height="20" fill="#62666d"/><rect x="20" y="20" width="20" height="20" fill="#62666d"/></pattern>
  </defs>
  <rect width="640" height="360" fill="url(#fx)"/>
  <path d="M-20 90 H200 V250 H420 V120 H660" fill="none" stroke="#8f7a55" stroke-width="62" stroke-linejoin="round"/>
  <path d="M-20 90 H200 V250 H420 V120 H660" fill="none" stroke="#d9c7a0" stroke-width="52" stroke-linejoin="round"/>
  <g font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif" text-anchor="middle">
    <text x="40" y="104" font-size="30">🐜</text><text x="90" y="100" font-size="30">🐜</text><text x="150" y="104" font-size="34">🪳</text>
    <text x="200" y="170" font-size="36">🐀</text><text x="300" y="262" font-size="30">🐌</text><text x="380" y="150" font-size="32">🐦</text><text x="470" y="70" font-size="26">🪰</text>
    <text x="540" y="100" font-size="44">🐦</text><text x="540" y="62" font-size="24">👑</text>
  </g>
  <g>
    <rect x="98" y="150" width="64" height="40" rx="8" fill="#5b3a1c"/><rect x="94" y="128" width="72" height="24" rx="9" fill="#f59e0b"/>
    <rect x="296" y="150" width="64" height="40" rx="8" fill="#5b3a1c"/><rect x="292" y="128" width="72" height="24" rx="9" fill="#ef4444"/>
    <rect x="478" y="176" width="64" height="40" rx="8" fill="#5b3a1c"/><rect x="474" y="154" width="72" height="24" rx="9" fill="#38bdf8"/>
    <g fill="rgba(255,255,255,.55)"><rect x="98" y="128" width="9" height="24"/><rect x="116" y="128" width="9" height="24"/><rect x="134" y="128" width="9" height="24"/><rect x="152" y="128" width="9" height="24"/>
    <rect x="296" y="128" width="9" height="24"/><rect x="314" y="128" width="9" height="24"/><rect x="332" y="128" width="9" height="24"/><rect x="350" y="128" width="9" height="24"/>
    <rect x="478" y="154" width="9" height="24"/><rect x="496" y="154" width="9" height="24"/><rect x="514" y="154" width="9" height="24"/><rect x="532" y="154" width="9" height="24"/></g>
    <g font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif" text-anchor="middle" font-size="30"><text x="130" y="186">🥟</text><text x="328" y="186">🎆</text><text x="510" y="212">🎯</text></g>
    <circle cx="328" cy="170" r="110" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="8 8"/>
  </g>
  <rect x="0" y="282" width="640" height="78" fill="rgba(29,20,12,.82)"/>
  <rect x="0" y="282" width="640" height="12" fill="#ef4444"/>
  <g fill="#fff7e8"><rect x="40" y="282" width="40" height="12"/><rect x="120" y="282" width="40" height="12"/><rect x="200" y="282" width="40" height="12"/><rect x="280" y="282" width="40" height="12"/><rect x="360" y="282" width="40" height="12"/><rect x="440" y="282" width="40" height="12"/><rect x="520" y="282" width="40" height="12"/><rect x="600" y="282" width="40" height="12"/></g>
  <text x="320" y="340" font-size="38" text-anchor="middle" fill="#ffcc4d" stroke="#8a3b0d" stroke-width="2" font-family="Arial Black,sans-serif" letter-spacing="2">DEFESA DA FEIRA</text>
</svg>`;

const CAPA_BAIA = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2b1a6b"/><stop offset=".45" stop-color="#ff5c8a"/><stop offset=".7" stop-color="#ffb06b"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient>
    <linearGradient id="bm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a7fa8"/><stop offset="1" stop-color="#103a5c"/></linearGradient>
    <linearGradient id="bt" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".45" stop-color="#ff9f45"/><stop offset=".75" stop-color="#ff4fa3"/><stop offset="1" stop-color="#7b5cff"/></linearGradient>
    <radialGradient id="bs" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6d0"/><stop offset=".5" stop-color="#ffb347"/><stop offset="1" stop-color="#ff5c8a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bc)"/>
  <circle cx="470" cy="215" r="90" fill="url(#bs)"/>
  <g fill="#3a1f5c"><rect x="20" y="120" width="46" height="140"/><rect x="72" y="80" width="40" height="180"/><rect x="118" y="140" width="52" height="120"/><rect x="176" y="100" width="34" height="160"/><rect x="214" y="150" width="44" height="110"/><rect x="262" y="130" width="30" height="130"/></g>
  <g fill="#ffd28a" opacity=".85"><rect x="28" y="130" width="6" height="6"/><rect x="44" y="150" width="6" height="6"/><rect x="80" y="96" width="6" height="6"/><rect x="96" y="120" width="6" height="6"/><rect x="128" y="160" width="6" height="6"/><rect x="150" y="180" width="6" height="6"/><rect x="184" y="120" width="6" height="6"/><rect x="224" y="170" width="6" height="6"/><rect x="270" y="150" width="6" height="6"/></g>
  <rect x="62" y="140" width="80" height="14" rx="3" fill="#ff3fa4" opacity=".9"/><rect x="180" y="170" width="70" height="12" rx="3" fill="#2ee6ff" opacity=".9"/>
  <rect y="255" width="640" height="105" fill="url(#bm)"/>
  <path d="M0 255 L330 255 L300 360 L0 360Z" fill="#f3d9a4"/>
  <path d="M0 258 L320 258" stroke="#fff" stroke-width="3" opacity=".6"/>
  <g transform="translate(560 190)"><circle r="56" fill="none" stroke="#fff" stroke-width="3"/><g stroke="#fff" stroke-width="1.5" opacity=".7"><line x1="-56" y1="0" x2="56" y2="0"/><line x1="0" y1="-56" x2="0" y2="56"/><line x1="-40" y1="-40" x2="40" y2="40"/><line x1="40" y1="-40" x2="-40" y2="40"/></g><g fill="#ffe14d"><circle cx="56" cy="0" r="4"/><circle cx="-56" cy="0" r="4"/><circle cx="0" cy="56" r="4"/><circle cx="0" cy="-56" r="4"/></g><g fill="#2ee6ff"><circle cx="40" cy="40" r="4"/><circle cx="-40" cy="-40" r="4"/></g><g fill="#ff3fa4"><circle cx="40" cy="-40" r="4"/><circle cx="-40" cy="40" r="4"/></g><path d="M-10 0 L-30 70 M10 0 L30 70" stroke="#fff" stroke-width="4"/></g>
  <rect x="480" y="258" width="160" height="8" fill="#9b7653"/>
  <g stroke="#3a2410" stroke-width="7" fill="none"><path d="M355 330 Q350 260 372 200"/><path d="M420 335 Q428 270 412 215"/></g>
  <g fill="#1f6b3a"><path d="M372 200 l-44 6 l40 -16z M372 200 l40 -4 l-36 -12z M372 200 l-24 30 l20 -32z M372 200 l30 28 l-26 -30z M372 200 l2 -40 l6 38z"/><path d="M412 215 l-40 8 l36 -18z M412 215 l42 -2 l-38 -14z M412 215 l-20 28 l16 -30z M412 215 l28 24 l-24 -28z"/></g>
  <g transform="translate(150 300)"><rect x="-58" y="-16" width="116" height="26" rx="8" fill="#ff4fa3"/><path d="M-30 -16 L-16 -36 L26 -36 L40 -16Z" fill="#1a2438"/><circle cx="-34" cy="12" r="11" fill="#16161c"/><circle cx="34" cy="12" r="11" fill="#16161c"/><rect x="50" y="-10" width="8" height="5" fill="#fff"/></g>
  <text x="250" y="152" text-anchor="middle" font-family="Impact,Anton,Arial Black,sans-serif" font-size="70" fill="#2a0b3d">BAÍA NEON</text>
  <text x="250" y="146" text-anchor="middle" font-family="Impact,Anton,Arial Black,sans-serif" font-size="70" fill="url(#bt)">BAÍA NEON</text>
</svg>`;

const CAPA_GOL = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <rect width="640" height="360" fill="#0d1f14"/>
  <g><rect x="0" y="40" width="64" height="250" fill="#33974c"/><rect x="64" y="40" width="64" height="250" fill="#2a8640"/><rect x="128" y="40" width="64" height="250" fill="#33974c"/><rect x="192" y="40" width="64" height="250" fill="#2a8640"/><rect x="256" y="40" width="64" height="250" fill="#33974c"/><rect x="320" y="40" width="64" height="250" fill="#2a8640"/><rect x="384" y="40" width="64" height="250" fill="#33974c"/><rect x="448" y="40" width="64" height="250" fill="#2a8640"/><rect x="512" y="40" width="64" height="250" fill="#33974c"/><rect x="576" y="40" width="64" height="250" fill="#2a8640"/></g>
  <g stroke="#fff" stroke-opacity=".85" stroke-width="3" fill="none">
    <rect x="10" y="40" width="620" height="250"/><line x1="320" y1="40" x2="320" y2="290"/><circle cx="320" cy="165" r="44"/>
    <rect x="530" y="95" width="100" height="140"/><rect x="590" y="130" width="40" height="70"/>
  </g>
  <rect x="630" y="135" width="10" height="60" fill="#fff" fill-opacity=".25"/>
  <path d="M630 135 l8 -8 v60 l-8 8" stroke="#fff" stroke-width="4" fill="none"/>
  <g>
    <ellipse cx="452" cy="176" rx="12" ry="7" fill="rgba(0,0,0,.3)"/>
    <ellipse cx="448" cy="168" rx="11" ry="16" fill="#1d4ed8"/><rect x="444" y="152" width="8" height="32" fill="#fff"/><circle cx="450" cy="168" r="8" fill="#c68642"/>
    <ellipse cx="560" cy="200" rx="11" ry="16" fill="#84cc16"/><circle cx="558" cy="200" r="8" fill="#8d5524"/>
    <ellipse cx="360" cy="230" rx="11" ry="16" fill="#f97316"/><rect x="356" y="214" width="8" height="32" fill="#1c1917"/><circle cx="360" cy="230" r="8" fill="#e0ac69"/>
    <ellipse cx="250" cy="120" rx="11" ry="16" fill="#1d4ed8"/><rect x="246" y="104" width="8" height="32" fill="#fff"/><circle cx="250" cy="120" r="8" fill="#5c3a1e"/>
  </g>
  <path d="M470 168 Q 540 120 612 160" stroke="#ffd23f" stroke-width="3" stroke-dasharray="7 6" fill="none"/>
  <circle cx="612" cy="160" r="9" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="612" cy="160" r="3" fill="#111"/>
  <g fill="#fff" opacity=".7"><circle cx="0" cy="8" r="2.5" fill="#facc15"/><circle cx="37" cy="21" r="2.5" fill="#ef4444"/><circle cx="74" cy="8" r="2.5" fill="#3b82f6"/><circle cx="111" cy="21" r="2.5" fill="#fff"/><circle cx="148" cy="8" r="2.5" fill="#22c55e"/><circle cx="185" cy="21" r="2.5" fill="#facc15"/><circle cx="222" cy="8" r="2.5" fill="#ef4444"/><circle cx="259" cy="21" r="2.5" fill="#3b82f6"/><circle cx="296" cy="8" r="2.5" fill="#fff"/><circle cx="333" cy="21" r="2.5" fill="#22c55e"/><circle cx="370" cy="8" r="2.5" fill="#facc15"/><circle cx="407" cy="21" r="2.5" fill="#ef4444"/><circle cx="444" cy="8" r="2.5" fill="#3b82f6"/><circle cx="481" cy="21" r="2.5" fill="#fff"/><circle cx="518" cy="8" r="2.5" fill="#22c55e"/><circle cx="555" cy="21" r="2.5" fill="#facc15"/><circle cx="592" cy="8" r="2.5" fill="#ef4444"/><circle cx="629" cy="21" r="2.5" fill="#3b82f6"/><circle cx="26" cy="8" r="2.5" fill="#fff"/><circle cx="63" cy="21" r="2.5" fill="#22c55e"/><circle cx="100" cy="8" r="2.5" fill="#facc15"/><circle cx="137" cy="21" r="2.5" fill="#ef4444"/><circle cx="174" cy="8" r="2.5" fill="#3b82f6"/><circle cx="211" cy="21" r="2.5" fill="#fff"/><circle cx="248" cy="8" r="2.5" fill="#22c55e"/><circle cx="285" cy="21" r="2.5" fill="#facc15"/><circle cx="322" cy="8" r="2.5" fill="#ef4444"/><circle cx="359" cy="21" r="2.5" fill="#3b82f6"/><circle cx="396" cy="8" r="2.5" fill="#fff"/><circle cx="433" cy="21" r="2.5" fill="#22c55e"/><circle cx="470" cy="8" r="2.5" fill="#facc15"/><circle cx="507" cy="21" r="2.5" fill="#ef4444"/><circle cx="544" cy="8" r="2.5" fill="#3b82f6"/><circle cx="581" cy="21" r="2.5" fill="#fff"/><circle cx="618" cy="8" r="2.5" fill="#22c55e"/><circle cx="15" cy="21" r="2.5" fill="#facc15"/><circle cx="52" cy="8" r="2.5" fill="#ef4444"/><circle cx="89" cy="21" r="2.5" fill="#3b82f6"/><circle cx="126" cy="8" r="2.5" fill="#fff"/><circle cx="163" cy="21" r="2.5" fill="#22c55e"/><circle cx="200" cy="8" r="2.5" fill="#facc15"/><circle cx="237" cy="21" r="2.5" fill="#ef4444"/><circle cx="274" cy="8" r="2.5" fill="#3b82f6"/><circle cx="311" cy="21" r="2.5" fill="#fff"/><circle cx="348" cy="8" r="2.5" fill="#22c55e"/><circle cx="385" cy="21" r="2.5" fill="#facc15"/><circle cx="422" cy="8" r="2.5" fill="#ef4444"/><circle cx="459" cy="21" r="2.5" fill="#3b82f6"/><circle cx="496" cy="8" r="2.5" fill="#fff"/><circle cx="533" cy="21" r="2.5" fill="#22c55e"/><circle cx="570" cy="8" r="2.5" fill="#facc15"/><circle cx="607" cy="21" r="2.5" fill="#ef4444"/><circle cx="4" cy="8" r="2.5" fill="#3b82f6"/><circle cx="41" cy="21" r="2.5" fill="#fff"/><circle cx="78" cy="8" r="2.5" fill="#22c55e"/><circle cx="115" cy="21" r="2.5" fill="#facc15"/><circle cx="152" cy="8" r="2.5" fill="#ef4444"/><circle cx="189" cy="21" r="2.5" fill="#3b82f6"/><circle cx="226" cy="8" r="2.5" fill="#fff"/><circle cx="263" cy="21" r="2.5" fill="#22c55e"/></g>
  <rect x="0" y="292" width="640" height="68" fill="rgba(4,16,9,.85)"/>
  <text x="320" y="342" font-size="46" text-anchor="middle" fill="#fff" font-family="Impact,Arial Black,sans-serif" letter-spacing="3">GOL DE <tspan fill="#ffd23f">PLACA</tspan></text>
</svg>`;

const CAPA_LAB = `
<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="lab-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1626"/><stop offset="1" stop-color="#05080f"/></linearGradient><linearGradient id="lab-ph"><stop offset="0" stop-color="#d01c1c"/><stop offset=".3" stop-color="#f2e21c"/><stop offset=".5" stop-color="#4cc41c"/><stop offset=".75" stop-color="#1c6ad0"/><stop offset="1" stop-color="#6a1480"/></linearGradient></defs>
  <rect width="640" height="360" fill="url(#lab-f)"/>
  <g font-family="Arial,sans-serif" font-weight="800" text-anchor="middle">
    <rect x="28" y="34" width="62" height="66" rx="8" fill="#fda4af"/><text x="59" y="58" font-size="12" fill="#1b1b1b">11</text><text x="59" y="88" font-size="28" fill="#1b1b1b">Na</text>
    <rect x="98" y="34" width="62" height="66" rx="8" fill="#93c5fd"/><text x="129" y="58" font-size="12" fill="#1b1b1b">8</text><text x="129" y="88" font-size="28" fill="#1b1b1b">O</text>
    <rect x="28" y="108" width="62" height="66" rx="8" fill="#fde68a"/><text x="59" y="132" font-size="12" fill="#1b1b1b">17</text><text x="59" y="162" font-size="28" fill="#1b1b1b">Cl</text>
    <rect x="98" y="108" width="62" height="66" rx="8" fill="#fcd34d"/><text x="129" y="132" font-size="12" fill="#1b1b1b">79</text><text x="129" y="162" font-size="28" fill="#1b1b1b">Au</text>
    <rect x="28" y="182" width="62" height="66" rx="8" fill="#c4b5fd"/><text x="59" y="206" font-size="12" fill="#1b1b1b">2</text><text x="59" y="236" font-size="28" fill="#1b1b1b">He</text>
    <rect x="98" y="182" width="62" height="66" rx="8" fill="#86efac"/><text x="129" y="206" font-size="12" fill="#1b1b1b">26</text><text x="129" y="236" font-size="28" fill="#1b1b1b">Fe</text>
  </g>
  <g>
    <path d="M300 60 h80 v14 h-8 v70 l72 150 q8 22 -16 22 h-176 q-24 0 -16 -22 l72 -150 v-70 h-8z" fill="#d8f0f0" fill-opacity=".12" stroke="#d8f0f0" stroke-width="5"/>
    <path d="M292 228 h176 l20 42 q8 22 -16 22 h-184 q-24 0 -16 -22z" fill="#38bdf8" fill-opacity=".75"/>
    <circle cx="350" cy="250" r="7" fill="#e0f2fe"/><circle cx="392" cy="214" r="5" fill="#e0f2fe"/><circle cx="410" cy="240" r="9" fill="#e0f2fe"/><circle cx="372" cy="190" r="4" fill="#e0f2fe"/><circle cx="364" cy="160" r="3" fill="#e0f2fe"/>
    <circle cx="384" cy="232" r="10" fill="#fff7c2"/><path d="M384 222 q10 -30 -4 -50 q22 18 10 44z" fill="#fb923c"/>
  </g>
  <g font-family="Arial,sans-serif" font-weight="800" fill="#e8eef8" text-anchor="middle">
    <text x="540" y="120" font-size="21">2 Na + 2 H₂O</text><text x="540" y="150" font-size="21" fill="#5eead4">→ 2 NaOH + H₂↑</text>
    <rect x="484" y="186" width="112" height="16" rx="8" fill="url(#lab-ph)"/>
    <text x="540" y="232" font-size="14" fill="#93a3bd">pH · °C · g/cm³</text>
  </g>
</svg>`;

// Versão da plataforma. Ao publicar qualquer mudança, aumente aqui E em versao.json
// (o site compara as duas e recarrega sozinho quem estiver com arquivo velho em cache).
window.ARCADIA_VERSAO = "1.22.0";

window.JOGOS = [
  {
    id: "laboratorio-dos-elementos",
    versao: "1.4.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-23",
    novidades: "Alimentos de verdade: comida feita de componentes reais (amido, proteína, glúten, gordura, açúcares...) que gelatinizam, coagulam, fermentam, caramelizam e douram (Maillard) nas temperaturas reais; pão, tapioca, caramelo, ovo cozido e mais, reconhecidos pelo que viraram. Dos elementos à comida: Haber-Bosch, fotossíntese de algas, açúcar e gordura sem planta. Gêiser do Mentos com microbolhas, calor latente, convecção, agitador e novos ácidos (fórmico, oxálico, lático, cítrico, vitamina C...) e reagentes (Benedict, biureto, Sudan III, indicadores).",
    nome: "Laboratório dos Elementos",
    genero: "Simulação",
    subgenero: "Sandbox de química (educativo)",
    corGenero: "#14b8a6",
    tags: ["Ciência", "Química", "Educativo", "Sandbox", "Simulação", "Celular"],
    criadoEm: "2026-11-22",
    lancadoEm: "2026-11-22T19:36:22-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Livre",
    classificacao: "Livre",
    finais: 0,
    caminho: "jogos/laboratorio-dos-elementos/index.html",
    capa: CAPA_LAB,
    sinopse:
      "Uma caixa de areia de química com a tabela periódica inteira. Coloque elementos, misture, aqueça, dê faísca e veja as reações com a equação certa, o calor e os produtos. Meça o pH, colete amostras e veja o que aconteceria no corpo humano. Dados da PubChem (NIH).",
    descricao: [
      "Laboratório dos Elementos é um sandbox de química para estudar brincando. A caixa simula cada grãozinho com temperatura própria: os materiais derretem, fervem e congelam nos pontos reais de fusão e ebulição, afundam ou boiam pela densidade e trocam calor conforme a condutividade térmica de verdade.",
      "Os 118 elementos têm ficha completa (massa, configuração eletrônica, eletronegatividade, energia de ionização, estados de oxidação, dureza, calor específico e mais), baixada da PubChem. 95 deles dá para colocar na caixa; os outros só existem em poucos átomos e ficam só com a ficha.",
      "As reações seguem as regras que se aprende na escola e na faculdade: série de reatividade dos metais, regras de solubilidade (com a equação iônica do precipitado), ácido + base, combustão com temperatura de ignição, óxidos com água, halogênios, termite, alto-forno, eletrólise, ligas e amálgamas. São mais de 1.200 combinações calculadas, e o combinador mostra a equação, o ΔH e as condições de qualquer par.",
      "Com a ferramenta de coleta você enche um copo com o que está na caixa e simula beber, comer ou inalar: o laboratório estima a dose por quilo de peso e mostra quais órgãos seriam afetados e com que gravidade, citando a fonte (ATSDR/CDC, NIH, Manual MSD). É uma simulação educativa, não orientação médica, e não mostra doses letais."
    ],
    mecanicas: [
      "Tabela periódica completa com fichas dos 118 elementos (dados PubChem/NIH)",
      "Abas de gases, líquidos e sólidos que mudam com a temperatura ambiente",
      "Mais de 140 compostos e soluções de 27 cátions com 13 ânions (pH calculado)",
      "Mais de 1.200 reações com equação, ΔH e condições",
      "Ferramentas: aquecer, resfriar, definir °C, faísca e corrente, ímã, martelo, fita de pH, Geiger e coleta de amostra",
      "Atmosfera de ar, oxigênio puro, nitrogênio ou vácuo",
      "Aba Casa: detergente, sabão, água sanitária, vinagre, limão, óleo, leite, vela, palha de aço e outros produtos do dia a dia",
      "Faíscas que voam e acendem gases, álcool, pó de metal e espuma de hidrogênio; arco elétrico e aquecimento por corrente",
      "Reagentes de laboratório: peróxido de hidrogênio, permanganato, água destilada e da torneira, indicadores (fenolftaleína, repolho roxo), lugol e amido",
      "29 experimentos prontos (sódio na água, termite, pasta de dente de elefante, palha de aço + bateria, repolho roxo, leite + vinagre…)",
      "Simulação no organismo humano por ingestão ou inalação, com órgãos afetados e fontes",
      "Física fina sem efeitos prontos: gás dissolvido (lei de Henry), nucleação em superfícies ásperas, bolhas que grudam e se soltam pela tensão superficial, espuma com detergente",
      "Objetos soltos que boiam ou afundam pelo empuxo e giram pelo torque das bolhas: milho dançante, Mentos, rolha, gelo, pipoca que estoura a 180 °C",
      "Microscópio: as moléculas de cada ponto montadas pela fórmula, com a explicação do fenômeno e os números da simulação",
      "Alimentos por composição: misture, sove e asse; o amido gelatiniza, a proteína coagula, a levedura fermenta, o açúcar carameliza e a casca doura (Maillard), cada um na temperatura real. Ficha com calorias",
      "Dos elementos à comida: Haber-Bosch, fotossíntese de algas (luz, CO₂ e nitrogênio), formose (açúcar sem planta) e gordura por esterificação",
      "Ácidos orgânicos (fórmico, oxálico, lático, tartárico, málico, cítrico, ascórbico, benzoico, salicílico) e testes de alimentos (Benedict, biureto, Sudan III, lugol)",
      "Calor latente de vaporização, convecção nos líquidos e no ar, agitador magnético e luz"
    ],
    controles: [
      ["Mouse / dedo", "Arrastar na caixa usa a ferramenta escolhida"],
      ["🔬 Microscópio", "Passar ou tocar num ponto para ver as moléculas"],
      ["🥄 Mexer / sovar", "Misturar ingredientes, sovar a massa, bater claras"],
      ["Espaço", "Pausar e continuar"],
      ["Esc", "Fechar janelas"]
    ],
    tecnologia: [
      "Autômato celular em Canvas 2D com temperatura, estado físico e condução de calor por célula",
      "Física fina por célula: gás dissolvido, volume de cada bolha e objetos rígidos com empuxo, arrasto e torque",
      "Motor de regras químicas gerado a partir de tabelas (reatividade, solubilidade, ignição, redução)",
      "Dados dos elementos da PubChem (NIH); toxicologia resumida de ATSDR/CDC, NIH e Manual MSD",
      "Sons gerados com Web Audio API"
    ]
  },
  {
    id: "gol-de-placa",
    versao: "1.0.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-22",
    novidades: "Lançamento: futebol 5 contra 5 com amistoso, Copa Arcádia com pênaltis, 2 jogadores no mesmo computador e online 1 contra 1.",
    nome: "Gol de Placa",
    genero: "Esporte",
    subgenero: "Futebol arcade",
    corGenero: "#22c55e",
    tags: ["Futebol", "Esporte", "2D", "Multiplayer", "Online", "Local", "Celular", "Controle"],
    criadoEm: "2026-11-22",
    lancadoEm: "2026-11-22T18:50:11-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Partidas de 2–6 min",
    classificacao: "Livre",
    finais: 3,
    caminho: "jogos/gol-de-placa/index.html",
    capa: CAPA_GOL,
    sinopse:
      "Futebol arcade 5 contra 5 visto de cima. Chute para onde o jogador está olhando: um toque é um passe, segurar o botão é uma bomba. Jogue contra o computador, na Copa Arcádia, com um amigo no mesmo computador ou online.",
    descricao: [
      "Gol de Placa é um futebol arcade com 5 jogadores de cada lado (4 na linha e o goleiro). Você controla o jogador mais perto da bola e troca quando quiser.",
      "O chute é um botão só: a bola vai para onde o jogador está olhando. Um toque rápido é um passe leve; segurando o botão a barra enche e o chute sai mais forte. Sem a bola, o mesmo botão dá um carrinho. Dá para correr mais segurando Shift, até cansar.",
      "São 8 times fictícios, cada um com ataque, defesa e velocidade: Tubarões do Litoral, Onças da Serra, Galos do Sertão, Lobos do Pampa, Tucanos da Mata, Abelhas FC, Dragões do Vale e Botos Cor-de-Rosa. Os goleiros mergulham, espalmam e agarram; tem lateral, escanteio, tiro de meta, intervalo e comemoração de gol.",
      "Modos: Amistoso contra o computador (três dificuldades), Copa Arcádia (8 times em mata-mata, com disputa de pênaltis no empate), 2 jogadores no mesmo computador (teclado ou dois controles) e Online 1 contra 1, com código de sala ou sala pública."
    ],
    mecanicas: [
      "Um botão de chute: toque = passe leve, segurar = chute forte, sempre para onde o jogador olha",
      "Carrinho sem a bola, corrida com fôlego e troca de jogador",
      "Goleiros que mergulham, espalmam e agarram",
      "Lateral, escanteio, tiro de meta, intervalo e comemoração de gol",
      "Copa Arcádia em mata-mata com disputa de pênaltis",
      "2 jogadores no mesmo computador e online 1 contra 1 (sala com código ou pública)",
      "8 times com ataque, defesa e velocidade diferentes",
      "Controles de toque no celular e suporte a controle (gamepad)"
    ],
    controles: [
      ["W A S D / setas", "Mover"],
      ["K, J ou Espaço", "Chutar para onde olha (toque = passe, segurar = forte) · sem bola: carrinho"],
      ["Q", "Trocar de jogador"],
      ["Shift", "Correr"],
      ["Esc", "Pausar"],
      ["2 jogadores", "P1: WASD, G chuta, F troca · P2: setas, ponto chuta, vírgula troca"],
      ["Controle", "A ou B chuta, X troca, RT corre"]
    ],
    tecnologia: [
      "Canvas 2D com câmera que segue a bola, bola com altura, quique, traves e rede",
      "Inteligência dos jogadores por posição (formação, pressão, cobertura e apoio)",
      "Online com PeerJS (WebRTC): o anfitrião simula a partida e o convidado manda os comandos",
      "Apito, chutes e torcida gerados com Web Audio API"
    ]
  },
  {
    id: "baia-neon",
    versao: "1.0.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-21",
    novidades: "Lançamento: cidade litorânea em 3D, carros com derrapagem, polícia de 1 a 5 estrelas, 5 trabalhos, táxi, corrida, flamingos e rádio.",
    nome: "Baía Neon",
    genero: "Ação",
    subgenero: "Mundo aberto (direção e perseguição)",
    corGenero: "#ff4fa3",
    corDestaque: "#ff9f45",
    tags: ["Mundo aberto", "3D", "Carros", "Perseguição", "Missões", "Rádio", "Progresso salvo", "Celular"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T23:20:00-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Livre (missões de 2–6 min)",
    classificacao: "12+",
    finais: 2,
    caminho: "jogos/baia-neon/index.html",
    capa: CAPA_BAIA,
    sinopse:
      "Uma cidade litorânea inteira ao pôr do sol: dirija qualquer carro, faça trabalhos para a Rê, vença a corrida da orla, fuja da polícia e prepare o grande golpe do porto.",
    descricao: [
      "Baía Neon é um mundo aberto em 3D numa cidade inventada à beira-mar. Tem o Centro de prédios de vidro, a Vila Pastel de prédios coloridos, a avenida da Orla com coqueiros e calçadão, o Píer com roda-gigante e o Porto Velho cheio de contêineres. O dia passa e, à noite, as janelas, os postes e os letreiros de neon acendem.",
      "Você anda pela cidade e pega qualquer carro: os estacionados ou os do trânsito, puxando o motorista. Os carros têm física própria, com derrapagem no freio de mão, batidas, fumaça e até explosão. Cada um tem rádio, com três estações de música gerada na hora: synthwave, bossa e funk.",
      "Atropelar, roubar carro na frente da polícia ou bater numa viatura rende estrelas de procurado. Com mais estrelas vêm mais viaturas e, a partir de 3, um helicóptero com holofote. Para escapar, suma da vista deles até as estrelas apagarem, ou passe na oficina de pintura. Se a polícia te cercar parado, você é preso. Os trabalhos da Rê (entrega, táxi, corrida de rua e fuga) levam ao Grande Golpe, a missão final. Há ainda 12 flamingos dourados escondidos."
    ],
    mecanicas: [
      "Cidade aberta com 6 bairros, praia, mar, píer com roda-gigante e porto",
      "6 carros diferentes (compacto, esportivo, SUV, táxi, viatura e carro-forte) com derrapagem, dano e explosão",
      "Trânsito que segue as ruas e para atrás dos outros; pedestres que andam, fogem e podem ser atropelados",
      "Nível de procurado de 1 a 5 estrelas, com viaturas que perseguem e helicóptero",
      "5 trabalhos com história, corridas de táxi com gorjeta e corrida de rua contra 3 pilotos",
      "12 flamingos dourados colecionáveis",
      "Ciclo de dia e noite com janelas acesas, postes, letreiros de neon e brilho",
      "Rádio com 3 estações de música gerada na hora",
      "Radar giratório, celular com mapa da cidade e progresso salvo",
      "Controles de toque no celular (joystick, acelerador e freio de mão)"
    ],
    controles: [
      ["W A S D / setas", "Andar e dirigir"],
      ["Shift", "Correr (a pé)"],
      ["F", "Entrar e sair do carro"],
      ["Espaço", "Freio de mão (no carro) / pular (a pé)"],
      ["R / H", "Trocar a rádio / buzina"],
      ["Tab", "Celular: mapa e trabalhos"],
      ["Arrastar o mouse", "Girar a câmera"]
    ],
    avisos: "Tem perseguições policiais, batidas e atropelamentos sem sangue. Inspirado nos jogos de mundo aberto, mas a cidade, os personagens e as marcas são todos inventados.",
    tecnologia: [
      "Three.js r160 (WebGL) com prédios mesclados por material, texturas de janela desenhadas por código e pós-processamento de brilho (bloom) no computador",
      "Física de carro própria (aderência lateral, freio de mão, colisões com prédios, postes e outros carros)",
      "IA de trânsito, de polícia e de corrida por um grafo das ruas",
      "Motor, pneus, sirene, efeitos e três rádios gerados na hora com Web Audio API"
    ]
  },
  {
    id: "defesa-da-feira",
    versao: "1.0.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-21",
    novidades: "Lançamento: 3 mapas, 7 barracas com 3 níveis, 10 tipos de bicho com chefes, habilidades e modo infinito.",
    nome: "Defesa da Feira",
    genero: "Estratégia",
    subgenero: "Tower Defense",
    corGenero: "#f59e0b",
    tags: ["Tower defense", "Estratégia", "2D", "Single-player", "Rejogável", "Humor", "Celular", "Brasil"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T22:15:04-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Mapas de 12–25 min",
    classificacao: "Livre",
    finais: 2,
    caminho: "jogos/defesa-da-feira/index.html",
    capa: CAPA_FEIRA,
    sinopse:
      "Domingo de feira e os bichos querem o seu pastel. Monte barracas de pastel, caldo de cana, pipoca, estilingue, ventilador e rojão no caminho das formigas, baratas, pombos, ratos e caramujos, e não deixe nenhum chegar.",
    descricao: [
      "Defesa da Feira é um tower defense: os bichos andam por um caminho até a barraca de pastel e você monta barracas da feira em volta para derrubá-los antes que cheguem. Cada bicho que chega leva fregueses; sem fregueses, a feira fecha.",
      "São 7 barracas, cada uma com 3 níveis: a Pastelaria atira pastéis, o Caldo de Cana deixa os bichos lentos, o Pipoqueiro estoura pipoca em volta, o Estilingue derruba voadores de longe, o Ventilador sopra os bichos de volta, o Fogueteiro solta rojões que explodem em área e o Caixa rende moedas a cada onda. Dá para escolher a mira de cada barraca (primeiro, último, mais forte ou mais perto).",
      "Os bichos variam: formigas rápidas, baratas com casco, pombos e moscas que voam por cima do caminho, ratos fortes, baratas-mães que soltam filhotes e caramujos que se curam. A cada 5 ondas vem um chefe: o Ratão do Esgoto, o Pombo-Rei (que chama reforços) e, no fim, o Rei Barata.",
      "São 3 mapas (Feira da Rua, Praça da Matriz e Mercadão), com estrelas pelos fregueses que sobraram e um modo infinito para ver até onde você aguenta. No aperto, use a Promoção Relâmpago (todos os bichos param) ou a Vassourada."
    ],
    mecanicas: [
      "7 barracas com 3 níveis e mira configurável",
      "10 tipos de bicho: rápidos, com casco, voadores, que se curam e que se dividem",
      "Chefes a cada 5 ondas, que chamam reforços",
      "Voadores cortam caminho por cima do mapa: nem toda barraca alcança",
      "Habilidades: Promoção Relâmpago e Vassourada",
      "Começar a onda mais cedo dá moedas de bônus",
      "3 mapas com estrelas e modo infinito com recorde",
      "Velocidade 1x, 2x e 3x",
      "Celular: em pé o mapa gira para caber; deitado a loja fica do lado"
    ],
    controles: [
      ["Clique / toque", "Montar e escolher barraca"],
      ["1 a 7", "Escolher barraca da loja"],
      ["Espaço", "Começar a onda"],
      ["U / S", "Melhorar / vender a barraca escolhida"],
      ["Q / W", "Promoção / Vassourada"],
      ["F", "Velocidade"],
      ["P ou Esc", "Pausar"]
    ],
    tecnologia: [
      "Canvas 2D com mapa em grade, caminhos por pontos e tiros que perseguem o alvo",
      "Ondas geradas por semente: a mesma onda é sempre igual",
      "No celular em pé o mapa gira 90° e emojis e textos continuam em pé",
      "Efeitos sonoros gerados com Web Audio API"
    ]
  },
  {
    id: "roleta-de-chefoes",
    versao: "1.1.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-21",
    novidades: "Superchefão final sorteado numa roleta dourada (6 superchefões de 3 fases), 16 chefões novos (28 no total), esquiva perfeita, especial, combo, 4 poderes novos e versão para celular com mira automática.",
    nome: "Roleta de Chefões",
    genero: "Ação",
    subgenero: "Boss Rush roguelite",
    corGenero: "#ff4d5e",
    tags: ["Chefões", "Roguelite", "2D", "Bullet hell", "Single-player", "Rejogável", "Humor", "Celular"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T21:00:09-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Runs de 8–14 min",
    classificacao: "Livre",
    finais: 2,
    caminho: "jogos/roleta-de-chefoes/index.html",
    capa: CAPA_ROLETA,
    sinopse:
      "Uma roleta gigante sorteia 6 chefões entre 28 e, no fim, uma roleta dourada sorteia o superchefão final: o Rei das Maldições em forma ancestral, o Boitatá, o Noob Supremo e outros. Escolha um poder depois de cada luta e tente sair vivo.",
    descricao: [
      "Roleta de Chefões é um boss rush: só tem luta contra chefões, uma atrás da outra. A cada rodada uma roleta gira e sorteia quem você vai enfrentar, então nenhuma partida é igual à outra.",
      "São 28 chefões, cada um com ataques e falas próprias e uma segunda fase: do Noob Lendário e da Vovó do Chinelo ao Polvo DJ, à Abelha Rainha, ao Saci Pererê (com redemoinhos que perseguem você), ao Boi-Bumbá, ao Kraken de Piscina (que apaga sua tela com tinta), à Coruja Hipnotizadora (que inverte seus controles), ao Astronauta Perdido (com poços de gravidade) e ao Caixa Eletrônico Possuído.",
      "Depois do sexto chefão gira a roleta dourada e sai o superchefão final, com três fases: Rei das Maldições em Forma Ancestral (domínio com mil lâminas), Boitatá (serpente de fogo que deixa rastro em chamas), Noob Supremo (comandos de admin como /kill, /clone e /nuke), Sol de Meio-Dia de Janeiro, Máquina do Fim versão Ômega e a Bisavó do Chinelo de Ouro.",
      "Esquive em cima de um ataque para fazer uma esquiva perfeita: o tempo desacelera e enche o especial, que limpa a tela e atordoa o chefe. Entre as lutas você escolhe 1 de 3 poderes entre 18, e no celular a mira e o tiro são automáticos."
    ],
    mecanicas: [
      "28 chefões com padrões de ataque próprios e segunda fase",
      "Roleta dourada no fim sorteia 1 de 6 superchefões com 3 fases",
      "Esquiva perfeita: desvie em cima do ataque para desacelerar o tempo",
      "Especial que limpa os tiros da tela e atordoa o chefe",
      "Combo de acertos que aumenta o dano até +60%",
      "Efeitos no chão e no jogador: mel, gelo, fogo, tornado, poço de gravidade, controles invertidos e escuridão",
      "18 poderes em três raridades para montar sua build",
      "Ataques avisados: cortes e lasers piscam antes de machucar, áreas mostram onde vão cair",
      "Galeria de chefões descobertos, recorde de chefões, tempo e combo",
      "Três dificuldades: Tranquilo, Normal e Pesadelo",
      "Celular: câmera que segue você, joystick, mira e tiro automáticos e botões de esquiva e especial"
    ],
    controles: [
      ["W A S D / setas", "Andar"],
      ["Mouse", "Mirar"],
      ["Clique (segurar)", "Atirar"],
      ["Espaço / Shift / botão direito", "Esquivar"],
      ["Q", "Especial"],
      ["Esc", "Pausar"],
      ["Celular", "Dedo esquerdo anda, mira e tiro automáticos, botões de esquiva e especial"]
    ],
    avisos: "Muitos tiros e flashes na tela durante as lutas.",
    tecnologia: [
      "Canvas 2D com arena, partículas, tremida de tela e câmera lenta na esquiva perfeita",
      "Ataques dos chefões escritos como roteiros com funções geradoras do JavaScript",
      "Câmera que segue o jogador e afasta na roleta para caber em telas pequenas",
      "Música que acelera a cada fase e efeitos sonoros gerados com Web Audio API"
    ]
  },
  {
    id: "madang",
    versao: "1.1.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-21",
    novidades: "Salas públicas: o botão 🌍 Sala pública coloca você numa partida online sem precisar de código.",
    nome: "MADANG! Festival dos Jogos Coreanos",
    genero: "Party Game",
    subgenero: "Party Royale (brincadeiras tradicionais coreanas)",
    corGenero: "#e11d48",
    corDestaque: "#f5b301",
    tags: ["Multijogador online", "Até 50 jogadores", "Bots", "2D", "Eliminação", "Cultura coreana", "Celular"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T17:25:00-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Festivais de 6–8 min",
    classificacao: "Livre",
    finais: 1,
    caminho: "jogos/madang/index.html",
    capa: CAPA_MADANG,
    sinopse:
      "Noite de festival no madang, o pátio da vila. Até 50 jogadores, entre pessoas e bots, enfrentam 6 brincadeiras tradicionais da Coreia, e a cada uma o tambor buk tira uma parte. Só um vence a Batalha de Piões.",
    descricao: [
      "MADANG! é um party royale com brincadeiras que existem de verdade e passam de geração em geração na Coreia. Numa sala online cabem até 50 pessoas, e os bots completam as vagas. O apresentador é o Dokkaebi, figura do folclore coreano, que comanda o festival ao som do tambor buk.",
      "Na Flor de Mugunghwa (무궁화 꽃이 피었습니다) você anda enquanto o pegador canta de costas e congela quando ele vira. No Jegichagi (제기차기) mantém a peteca coreana no ar chutando na hora certa. No Tuho (투호) arremessa flechas dentro de um jarro. No Cabo de Guerra (줄다리기) dois times puxam no ritmo do grito “Yeongcha!”. No Ddakjichigi (딱지치기) os duelos são para virar o quadradinho de papel dobrado do adversário.",
      "Quem sobrevive chega à grande final, a Batalha de Piões (팽이치기), brincadeira de inverno jogada no gelo: cada finalista é um pião, a chicotada dá mais giro e um tranco, e vence o último que continuar girando."
    ],
    mecanicas: [
      "6 brincadeiras tradicionais coreanas, cada uma com um jeito diferente de jogar: congelar, ritmo, mira, força em time, duelo e física",
      "Até 50 jogadores na mesma sala, misturando pessoas e bots com nível de habilidade próprio",
      "Canto de verdade do 무궁화 꽃이 피었습니다, sílaba por sílaba, com o pegador que vira de surpresa",
      "Cabo de guerra em dois times com bônus de puxão no ritmo do “영차!” (Yeongcha)",
      "Duelos de ddakji em pares, com barra de força",
      "Final com piões no gelo: giro que acaba, chicotadas e choques",
      "Quem sai continua assistindo; pódio e ranking no fim",
      "Controles de toque no celular, com joystick e botão de ação"
    ],
    controles: [
      ["W A S D / setas", "Andar"],
      ["Espaço", "Ação da brincadeira (chutar, arremessar, puxar, bater, chicote)"],
      ["Espaço (fora)", "Assistir outro jogador"],
      ["🔊", "Som e música / só efeitos / mudo"]
    ],
    avisos: "Partidas online usam um servidor público gratuito (PeerJS) só para conectar os jogadores.",
    tecnologia: [
      "Canvas 2D com pátio de festival, lanternas, plateia em roupas típicas, partículas e textos em Hangul (fonte Black Han Sans)",
      "Multijogador P2P por WebRTC (PeerJS): o anfitrião simula o festival e envia um estado compacto 15 vezes por segundo",
      "IA de bots diferente para cada brincadeira",
      "Trilha com tambores buk e janggu e melodia pentatônica, tudo gerado na hora com Web Audio API"
    ]
  },
  {
    id: "sete-noites",
    versao: "1.0.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-21",
    novidades: "Lançamento: vale congelado em 3D, calor e fome, criação, pesca, lobos, nevascas e dois finais.",
    nome: "Sete Noites na Neve",
    genero: "Sobrevivência",
    subgenero: "Sobrevivência no frio",
    corGenero: "#7cc4ff",
    corDestaque: "#ff9a3c",
    tags: ["Um jogador", "3D", "Criação", "Dia e noite", "Clima", "Progresso salvo", "Celular"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T16:50:00-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "20–30 min (salva a cada amanhecer)",
    classificacao: "Livre",
    finais: 2,
    caminho: "jogos/sete-noites/index.html",
    capa: CAPA_NEVE,
    sinopse:
      "Seu avião caiu num vale congelado e o resgate só chega depois de sete noites. Mantenha o fogo aceso, não passe fome e não deixe os lobos chegarem perto.",
    descricao: [
      "Sete Noites na Neve é um jogo de sobrevivência no frio em 3D. Você acorda ao lado do avião caído, com uma caixa de suprimentos e um vale inteiro coberto de neve: floresta de pinheiros, um lago congelado e um morro com uma bandeira lá no alto.",
      "Quatro barras mandam em tudo: vida, calor, fome e energia. De dia o frio é suportável; à noite ele corta, e nas nevascas congela em segundos. Junte gravetos, pedras e madeira para criar machado, fogueira, tocha, vara de pesca, armadilha, abrigo e casaco de pele. Pesque nos buracos do gelo, cace coelhos e asse tudo no fogo, porque comida crua faz mal.",
      "Quando escurece, os lobos saem. Eles rondam no escuro, têm medo de fogo e fogem de golpes, mas atacam quem fica sozinho no frio ou dorme sem uma fogueira por perto. São dois finais: aguentar as sete noites até o helicóptero chegar, ou montar uma fogueira de sinal no alto do morro e acendê-la à noite para ser visto antes."
    ],
    mecanicas: [
      "Calor, fome, vida e energia: perto do fogo e do abrigo você esquenta, longe deles o frio vence",
      "Ciclo de dia e noite de 4 minutos e nevascas que deixam tudo muito mais frio",
      "Recursos no mapa: árvores, pedras, gravetos, arbustos com frutinhas, lago congelado e caixas do avião",
      "8 criações: machado, fogueira, tocha, vara de pesca, armadilha, abrigo, casaco de pele e fogueira de sinal",
      "Fogueiras gastam lenha, cozinham peixe e carne e afastam os lobos",
      "Lobos que rondam, atacam quem está desprotegido e fogem do fogo, da tocha e dos golpes",
      "Dormir no abrigo faz a noite passar rápido, mas sem fogo você acorda congelando",
      "Bússola com o avião, o lago, o morro, a fogueira e o abrigo",
      "Progresso salvo a cada amanhecer e dois finais"
    ],
    controles: [
      ["W A S D / setas", "Andar (Shift corre)"],
      ["Arrastar o mouse / roda", "Girar e aproximar a câmera"],
      ["E (segure)", "Pegar, cortar, quebrar, pescar, pôr lenha, assar, dormir"],
      ["C", "Criar"],
      ["Q", "Comer"],
      ["F", "Acender ou apagar a tocha"],
      ["Espaço / clique", "Golpe (espanta lobos)"]
    ],
    avisos: "Tem lobos e sustos leves à noite. Jogue com som: o vento e os uivos avisam o perigo.",
    tecnologia: [
      "Three.js r160 (WebGL) com terreno gerado por código, pinheiros instanciados, sombras, neve em partículas e céu que muda com a hora",
      "Fogueiras e tochas com luz própria que tremula",
      "Lobos com estados (rondar, atacar, fugir) que reagem ao fogo",
      "Vento, fogo, uivos e efeitos gerados na hora com Web Audio API"
    ]
  },
  {
    id: "roube-um-emoji",
    versao: "1.1.0", // a mesma do arquivo do jogo (window.VERSAO_JOGO)
    atualizadoEm: "2026-11-21",
    novidades: "Salas públicas: o botão 🌍 Sala pública coloca você numa partida online sem precisar de código.",
    nome: "Roube um Emoji",
    genero: "Tycoon",
    subgenero: "Coleção e roubo",
    corGenero: "#ffc53d",
    corDestaque: "#ff5fa2",
    tags: ["Multijogador online", "Até 8 jogadores", "Bots", "3D", "Coleção", "Roubo", "Progresso salvo"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T15:34:00-03:00", // o selo "Novo" some 2 dias depois
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Sem fim (progresso salvo)",
    classificacao: "Livre",
    finais: 1,
    caminho: "jogos/roube-um-emoji/index.html",
    capa: CAPA_EMOJI,
    sinopse:
      "Os emojis desfilam num tapete vermelho. Compre os que puder, leve para a sua base, junte dinheiro a cada segundo e roube os mais raros das bases dos rivais, antes que eles roubem os seus.",
    descricao: [
      "Roube um Emoji é um tycoon 3D de coleção e roubo para até 8 bases, entre pessoas e bots. No meio do mapa, um tapete vermelho traz um desfile sem fim de emojis: da Banana Fofoqueira de $25 ao Moai Misterioso de $25 milhões. Chegue perto de um, aperte E e ele anda sozinho até um pedestal da sua base.",
      "Cada emoji rende dinheiro por segundo, que se acumula no cofre dourado da base. Pise no cofre para coletar e compre emojis cada vez mais caros. São 30 emojis em 6 raridades (Comum, Raro, Épico, Lendário, Mítico e Secreto) e mutações de Ouro, Diamante e Arco-íris que multiplicam preço e renda. De vez em quando cai uma Chuva de Sorte e os raros aparecem 4 vezes mais.",
      "A base só tem 10 pedestais, então o atalho é roubar: entre na base de um rival, segure E num emoji e corra para casa com ele. Quem leva um tapa larga o roubo na hora, e o emoji volta para o pedestal. Para se proteger, aperte o botão vermelho da sua base: lasers fecham a entrada por 40 segundos. Junte 1 milhão para virar milionário."
    ],
    mecanicas: [
      "Desfile contínuo de emojis com preço, raridade e renda por segundo em cada etiqueta",
      "30 emojis em 6 raridades e 3 mutações (Ouro ×2, Diamante ×4, Arco-íris ×8)",
      "Base com 10 pedestais, cofre que acumula a renda e venda pela metade do preço",
      "Roubo segurando E: o ladrão carrega o emoji e corre de volta para casa",
      "Tapa que empurra, deixa tonto e faz o ladrão largar o roubo",
      "Trava de laser por 40 segundos que impede rivais de entrar na base",
      "Chuva de Sorte com raros 4× mais frequentes e desfile mais rápido",
      "Bots com nível próprio que compram, vendem, coletam, roubam, trancam e defendem",
      "Salas online com código de 4 letras (até 8 bases) e progresso salvo no modo com bots"
    ],
    controles: [
      ["W A S D / setas", "Andar"],
      ["Arrastar o mouse / roda", "Girar e aproximar a câmera"],
      ["E", "Comprar e trancar a base"],
      ["Segurar E", "Roubar (base de rival) ou vender (sua base)"],
      ["Espaço / clique", "Tapa"],
      ["🔊", "Som e música / só efeitos / mudo"]
    ],
    avisos: "Partidas online usam um servidor público gratuito (PeerJS) só para conectar os jogadores.",
    tecnologia: [
      "Three.js r160 (WebGL) com sombras, céu em degradê, partículas e emojis desenhados em texturas",
      "Multijogador P2P por WebRTC (PeerJS): o anfitrião simula tudo e envia um estado compacto 15 vezes por segundo, e os outros interpolam",
      "Bots com rotas pelos corredores entre as bases e decisões de compra, roubo e defesa",
      "Música e efeitos sonoros gerados na hora com Web Audio API"
    ]
  },
  {
    id: "detetive",
    versao: "1.3.0", // a mesma do arquivo do jogo (const VERSAO)
    atualizadoEm: "2026-11-21",
    novidades: "Salas públicas: o botão 🌍 Sala pública coloca você numa partida online sem precisar de código.",
    nome: "Detetive",
    genero: "Dedução Social",
    subgenero: "Ladrões, detetives e clones",
    corGenero: "#60a5fa",
    tags: ["Multijogador online", "Até 30 jogadores", "Bots", "2D", "Papéis secretos", "Disfarces", "Investigação"],
    criadoEm: "2026-11-21",
    lancadoEm: "2026-11-21T12:10:00-03:00",
    criadoPor: "Claude Opus 5.5 (Anthropic)",
    duracao: "Partidas de 3–5 min",
    classificacao: "Livre",
    finais: 2,
    caminho: "jogos/detetive/index.html",
    capa: CAPA_DETETIVE,
    sinopse:
      "Noite no Shopping Estrela. Ladrões roubam as lojas, detetives seguem pegadas e farejam pistas, ajudantes vigiam as câmeras. O detalhe: cada um pode estar com o rosto e o nome de outra pessoa.",
    descricao: [
      "Detetive é um jogo de dedução social para até 30 pessoas ou bots. Cada um recebe um papel secreto: Ladrão, Detetive ou Ajudante. Os ladrões precisam levar os objetos de valor das lojas antes do tempo acabar. Os detetives precisam descobrir quem eles são e prendê-los.",
      "O truque são os clones. Cada pessoa nasce com o próprio visual ou com o visual de outra pessoa, sempre com o nome e o rosto juntos, e o mesmo visual pode aparecer em dois corpos ao mesmo tempo. Então pode ter duas “Ana” andando pelo shopping, e só uma delas é a de verdade (ou nenhuma). Na metade da partida tem troca de turno e todo mundo muda de disfarce.",
      "De fora de uma loja não dá para ver quem está lá dentro: só quem está na mesma loja ou quem olha as câmeras na Sala de Segurança. Os ladrões podem colocar a câmera de uma loja em loop, ou causar um apagão que desliga as luzes e as câmeras. Os detetives veem pegadas frescas dos ladrões e podem farejar quem roubou há pouco, mas cada prisão errada custa um distintivo. Os ajudantes fazem tarefas, consertam vitrines e câmeras e alimentam o quadro de pistas."
    ],
    mecanicas: [
      "Três papéis secretos com habilidades próprias: Ladrão, Detetive e Ajudante",
      "Disfarces com clones: você pode parecer outra pessoa, e o mesmo visual pode estar em até dois corpos",
      "Troca de turno no meio da partida: todos mudam de disfarce",
      "Visão por ambiente: dentro das lojas só vê quem está lá ou quem está nas câmeras",
      "Câmeras ao vivo das 10 lojas na Sala de Segurança, com gravações que viram pistas",
      "Ladrão burla câmeras (loop) e causa apagões; ajudantes consertam e religam a luz",
      "Detetive vê pegadas que aparecem com alguns segundos de atraso, fareja e prende (2 distintivos)",
      "Quadro de pistas compartilhado e selo ✅ para inocentados",
      "Salas online com código de 4 letras (até 30 pessoas) e bots que investigam, roubam e vigiam"
    ],
    controles: [
      ["W A S D / setas", "Andar"],
      ["Segurar Espaço", "Ação: roubar, prender, tarefa, câmeras, burlar ou consertar câmera"],
      ["Q", "Habilidade: apagão (Ladrão) ou farejar (Detetive)"],
      ["Espaço (preso)", "Assistir outro jogador"]
    ],
    avisos: "Partidas online usam um servidor público gratuito (PeerJS) só para conectar os jogadores.",
    tecnologia: [
      "Canvas 2D com shopping desenhado por código, minimapa e painel de câmeras ao vivo",
      "Multijogador P2P por WebRTC (PeerJS): o anfitrião simula e manda para cada jogador só o que ele pode ver (papéis e posições escondidas não vão pela rede)",
      "Bots com rotas entre lojas, que roubam quando ninguém vê, seguem pegadas e fazem turnos nas câmeras",
      "Música de suspense e efeitos gerados com Web Audio API"
    ]
  },
  {
    id: "gongo",
    versao: "1.3.0", // a mesma do arquivo do jogo (const VERSAO)
    atualizadoEm: "2026-11-21",
    novidades: "Salas públicas: o botão 🌍 Sala pública coloca você numa partida online sem precisar de código.",
    nome: "GONGO! O Show das 6 Provas",
    genero: "Party Game",
    subgenero: "Party Royale (show de eliminação)",
    corGenero: "#ff3d7f",
    tags: ["Multijogador online", "Até 50 jogadores", "Bots", "2D", "Eliminação", "Game show", "Quiz"],
    criadoEm: "2026-11-20",
    lancadoEm: "2026-11-20T20:32:20-03:00", // o selo "Novo" some 2 dias depois
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
    versao: "1.2.0", // a mesma do arquivo do jogo (const VERSAO)
    atualizadoEm: "2026-11-21",
    novidades: "Salas públicas: o botão 🌍 Sala pública coloca você numa partida online sem precisar de código.",
    nome: "Arena dos Desejos",
    genero: "Party Game",
    subgenero: "Sandbox de Palavras",
    corGenero: "#f59e0b",
    tags: ["Multijogador online", "Bots", "2D", "Caos", "Texto", "Arena", "Easter eggs"],
    criadoEm: "2026-11-19",
    lancadoEm: "2026-11-19T22:18:58-03:00",
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
    versao: "1.0.0", // a mesma do arquivo do jogo (const VERSAO)
    atualizadoEm: "2026-11-21",
    nome: "A Casa Que Lembra",
    genero: "Terror",
    subgenero: "Terror Psicológico",
    tags: ["Primeira pessoa", "3D", "Exploração", "Narrativo", "Sobrevivência", "Single-player"],
    criadoEm: "2026-11-19",
    lancadoEm: "2026-11-19T20:58:38-03:00",
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
