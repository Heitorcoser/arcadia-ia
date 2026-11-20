#!/usr/bin/env node
/* =========================================================================
   ARCÁDIA STUDIO · servidor MCP
   Liga uma IA (Claude Code, Claude Desktop, qualquer cliente MCP) ao
   Arcádia Studio aberto no navegador.

   IA  ⇄ (MCP por stdio, JSON-RPC)  ⇄  este servidor  ⇄ (HTTP 127.0.0.1)  ⇄  Studio

   O Studio fica perguntando "tem comando pra mim?" em GET /aguardar e
   devolve o resultado em POST /resposta. Não precisa instalar nada além
   do Node.js 18+: o servidor não tem dependências.

   Uso:   node mcp/servidor.js [--porta 47823]
   Env:   ARCADIA_PORTA, ARCADIA_COMUNIDADE (pasta onde salvar jogos da comunidade)
   ========================================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const VERSAO = '1.0.0';
const args = process.argv.slice(2);
const argPorta = args.indexOf('--porta');
const PORTA = +(argPorta >= 0 ? args[argPorta + 1] : process.env.ARCADIA_PORTA) || 47823;
const PASTA_COMUNIDADE = path.resolve(process.env.ARCADIA_COMUNIDADE || path.join(__dirname, '..', 'comunidade'));
const ESPERA_LONGA = 20000;      // quanto tempo o /aguardar fica aberto sem comando
const LIMITE_COMANDO = 90000;    // tempo máximo para o Studio responder um comando
const ESPERA_CONEXAO = 8000;     // quanto esperar o Studio aparecer antes de dar erro

const log = (...a) => process.stderr.write('[arcadia-mcp] ' + a.join(' ') + '\n');

/* ------------------------------------------------------------------ */
/* Ferramentas                                                         */
/* ------------------------------------------------------------------ */
const V3 = { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 };
const ID = { type: 'string', description: 'id do objeto (ex: "a1b2c3") ou caminho (ex: "Workspace.Moeda")' };
const META = {
  nome: { type: 'string' }, genero: { type: 'string', description: 'Aventura, Ação, Obby / Parkour, Plataforma, Puzzle, Corrida, Terror, Simulador, Tycoon, RPG, Party Game, Esporte, Arcade ou Outro' },
  subgenero: { type: 'string' }, descricao: { type: 'string', description: 'Do que se trata o jogo e como jogar' }, autor: { type: 'string' },
};
const obj = (props = {}, req = []) => ({ type: 'object', properties: props, required: req, additionalProperties: false });
const OBJ_CRIAR = {
  type: 'object', description: 'Um objeto a criar, com filhos opcionais',
  properties: { classe: { type: 'string' }, nome: { type: 'string' }, pai: ID, propriedades: { type: 'object' }, filhos: { type: 'array', items: { type: 'object' } } },
  required: ['classe'],
};

const FERRAMENTAS = [
  ['estado_do_studio', 'Mostra o projeto aberto, quantos objetos/arquivos ele tem, o que está selecionado e se o jogo está rodando. Comece por aqui.', obj()],
  ['documentacao', 'Referência completa da API de scripts (Lua/JavaScript) e das classes, propriedades, eventos e sons do Arcádia Studio. Leia antes de escrever scripts.', obj()],
  ['listar_projetos', 'Lista os projetos salvos no Studio (id, nome, tipo).', obj()],
  ['criar_projeto', 'Cria e abre um projeto novo. tipo "cena" = jogo 3D com partes e scripts (modelos: baseplate, obby, vazio). tipo "arquivos" = jogo web com arquivos (modelos: canvas, three, phaser, python, lua, typescript, vazio).',
    obj({ nome: { type: 'string' }, tipo: { type: 'string', enum: ['cena', 'arquivos'] }, modelo: { type: 'string' } })],
  ['abrir_projeto', 'Abre um projeto salvo pelo id.', obj({ id: { type: 'string' } }, ['id'])],
  ['salvar', 'Salva o projeto aberto.', obj()],

  ['ver_cena', 'Árvore de objetos do jogo 3D (Explorer) com id, classe, nome e propriedades principais.', obj({ raiz: ID, profundidade: { type: 'integer', minimum: 0, maximum: 10 } })],
  ['ler_objeto', 'Todas as propriedades e filhos de um objeto.', obj({ id: ID }, ['id'])],
  ['criar_objeto', 'Cria um objeto (Part, SpawnLocation, Model, Folder, Script, PointLight, BillboardText, Sound, ClickDetector, ScreenGui, Frame, TextLabel, TextButton, ImageLabel, IntValue…). Partes vão para o Workspace e scripts para o ServerScriptService se pai for omitido. Cores em "#rrggbb", vetores em [x, y, z].',
    obj({ classe: { type: 'string' }, pai: ID, nome: { type: 'string' }, propriedades: { type: 'object', description: 'ex: { "Position": [0, 5, 0], "Size": [4, 1, 4], "Color": "#ff0000", "Material": "Neon", "Anchored": true }' } }, ['classe'])],
  ['criar_varios', 'Cria vários objetos (e seus filhos) de uma vez. Muito mais rápido que criar_objeto em sequência.',
    obj({ objetos: { type: 'array', items: OBJ_CRIAR } }, ['objetos'])],
  ['editar_objeto', 'Muda propriedades, o nome ou o pai de um objeto.', obj({ id: ID, propriedades: { type: 'object' }, nome: { type: 'string' }, pai: ID }, ['id'])],
  ['apagar_objeto', 'Apaga um objeto e seus filhos.', obj({ id: ID }, ['id'])],
  ['criar_script', 'Cria um Script. Dentro de uma Part, "script.Parent" é a parte. Lua é o padrão.',
    obj({ pai: ID, nome: { type: 'string' }, linguagem: { type: 'string', enum: ['Lua', 'JavaScript'] }, codigo: { type: 'string' } }, ['codigo'])],
  ['ler_script', 'Lê o código de um Script.', obj({ id: ID }, ['id'])],
  ['inserir_modelo', 'Insere um modelo pronto da Caixa de ferramentas (moeda, lava, checkpoint, porta com botão, casa…). Use listar_modelos para ver os nomes.', obj({ nome: { type: 'string' }, posicao: V3 }, ['nome'])],
  ['listar_modelos', 'Lista os modelos prontos da Caixa de ferramentas.', obj()],
  ['selecionar', 'Seleciona um objeto no Studio (aparece destacado para o usuário).', obj({ id: ID }, ['id'])],
  ['posicionar_camera', 'Move a câmera do editor (útil antes de capturar_tela).', obj({ posicao: V3, olharPara: V3 })],

  ['listar_arquivos', 'Lista os arquivos de um projeto de arquivos.', obj()],
  ['ler_arquivo', 'Lê um arquivo do projeto de arquivos.', obj({ caminho: { type: 'string' } }, ['caminho'])],
  ['escrever_arquivo', 'Cria ou substitui um arquivo (pastas são criadas pelo caminho, ex: "js/jogo.js").', obj({ caminho: { type: 'string' }, conteudo: { type: 'string' }, base64: { type: 'boolean' } }, ['caminho', 'conteudo'])],
  ['apagar_arquivo', 'Apaga um arquivo do projeto de arquivos.', obj({ caminho: { type: 'string' } }, ['caminho'])],
  ['definir_entrada', 'Define qual HTML abre primeiro no projeto de arquivos.', obj({ caminho: { type: 'string' } }, ['caminho'])],

  ['jogar', 'Roda o jogo dentro do Studio (como F5).', obj()],
  ['parar', 'Para o jogo.', obj()],
  ['ler_saida', 'Últimas linhas da janela Saída: print(), avisos e erros dos scripts com número da linha.', obj({ linhas: { type: 'integer', minimum: 1, maximum: 500 }, limpar: { type: 'boolean' } })],
  ['capturar_tela', 'Tira uma foto do viewport 3D (ou do jogo rodando) e devolve a imagem.', obj()],
  ['executar_no_studio', 'Roda JavaScript dentro do Studio com acesso a "studio" (API interna), "print" e "ASN". Para casos que as outras ferramentas não cobrem.', obj({ codigo: { type: 'string' } }, ['codigo'])],
  ['desfazer', 'Desfaz a última mudança.', obj()],

  ['publicar', 'Publica o jogo na aba "Jogos de Players" deste navegador e devolve um link que qualquer pessoa pode abrir.', obj(META)],
  ['link_do_jogo', 'Gera o link compartilhável do jogo (o jogo inteiro vai dentro do link).', obj()],
  ['publicar_na_comunidade', 'Publica o jogo e salva o arquivo .arcadia.json (com a capa) na pasta comunidade/ do repositório da plataforma, atualizando comunidade/index.json. Depois é só fazer commit e push para o jogo aparecer para todo mundo.', obj(META)],
];

/* ------------------------------------------------------------------ */
/* Ponte HTTP com o Studio                                             */
/* ------------------------------------------------------------------ */
const fila = [];                 // comandos esperando o Studio pegar
const pendentes = new Map();     // id → { ok, erro, timer }
let esperando = null;            // resposta HTTP do /aguardar aberta
let ultimoContato = 0;
let proximoId = 1;
let erroPorta = null;
let sessaoAtiva = null;          // id da janela do Studio que está conectada
const descartadas = new Set();   // janelas que foram substituídas por uma mais nova

const conectado = () => !!esperando || Date.now() - ultimoContato < ESPERA_LONGA + 5000;

function cabecalhos(res, extra = {}) {
  res.writeHead(extra.status || 200, Object.assign({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true',
    'Cache-Control': 'no-store',
  }, extra.headers || {}));
}

function entregar() {
  if (!esperando || !fila.length) return;
  const res = esperando; esperando = null; clearTimeout(res.__timer);
  const cmd = fila.shift();
  cabecalhos(res, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  res.end(JSON.stringify(cmd));
}

const servidor = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'OPTIONS') { cabecalhos(res, { status: 204 }); return res.end(); }

  if (req.method === 'GET' && url === '/aguardar') {
    // só uma janela do Studio por vez: a que conectou por último assume, as outras recebem 409 e param
    // "assumir=1" só vem quando a janela acabou de abrir ou alguém clicou em Conectar;
    // janelas que estão só tentando reconectar não tiram o lugar de uma conexão viva.
    const q = new URL(req.url, 'http://x').searchParams;
    const sessao = q.get('sessao') || 'sem-id', assumir = q.get('assumir') === '1';
    if (sessao !== sessaoAtiva) {
      if (descartadas.has(sessao) || (sessaoAtiva && conectado() && !assumir)) {
        descartadas.add(sessao); cabecalhos(res, { status: 409 }); return res.end('Outra janela do Studio assumiu a conexão'); }
      if (sessaoAtiva) { descartadas.add(sessaoAtiva); log('outra janela do Studio conectou; a anterior foi desligada'); } else log('Studio conectado');
      sessaoAtiva = sessao;
      if (esperando) { clearTimeout(esperando.__timer); cabecalhos(esperando, { status: 409 }); esperando.end('Outra janela do Studio assumiu a conexão'); esperando = null; }
    }
    ultimoContato = Date.now();
    if (esperando) { clearTimeout(esperando.__timer); cabecalhos(esperando, { status: 204 }); esperando.end(); }
    esperando = res;
    res.__timer = setTimeout(() => { if (esperando === res) { esperando = null; ultimoContato = Date.now(); cabecalhos(res, { status: 204 }); res.end(); } }, ESPERA_LONGA);
    req.on('close', () => { if (esperando === res) { esperando = null; clearTimeout(res.__timer); } });
    return entregar();
  }

  if (req.method === 'POST' && url === '/resposta') {
    let corpo = '';
    req.on('data', c => { corpo += c; if (corpo.length > 64e6) req.destroy(); });
    req.on('end', () => {
      ultimoContato = Date.now();
      try {
        const r = JSON.parse(corpo); const p = pendentes.get(r.id);
        if (p) { pendentes.delete(r.id); clearTimeout(p.timer); r.ok ? p.ok(r.resultado) : p.erro(new Error(r.erro || 'Erro no Studio')); }
        cabecalhos(res, { status: 204 }); res.end();
      } catch (e) { cabecalhos(res, { status: 400 }); res.end('JSON inválido'); }
    });
    return;
  }

  if (req.method === 'GET' && url === '/') {
    cabecalhos(res, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    return res.end(JSON.stringify({ servidor: 'arcadia-studio-mcp', versao: VERSAO, studioConectado: conectado(), comandosNaFila: fila.length }));
  }
  cabecalhos(res, { status: 404 }); res.end('não encontrado');
});
servidor.on('error', e => {
  erroPorta = e.code === 'EADDRINUSE' ? `A porta ${PORTA} já está em uso (outro servidor MCP do Arcádia aberto?). Feche o outro ou use --porta.` : e.message;
  log(erroPorta);
});
servidor.listen(PORTA, '127.0.0.1', () => log(`ponte do Studio em http://127.0.0.1:${PORTA} — no Studio, clique em MCP → Conectar`));

async function esperarConexao() {
  const t0 = Date.now();
  while (!conectado() && Date.now() - t0 < ESPERA_CONEXAO) await new Promise(r => setTimeout(r, 250));
  return conectado();
}

async function noStudio(ferramenta, argumentos = {}) {
  if (erroPorta) throw new Error(erroPorta);
  if (!(await esperarConexao())) throw new Error(`O Arcádia Studio não está conectado. Abra o Studio (studio/index.html) no navegador, clique no botão "MCP" no canto de cima e em "Conectar" (porta ${PORTA}). Dica: abrir studio/index.html?mcp=1 conecta sozinho.`);
  const id = proximoId++;
  return new Promise((ok, erro) => {
    const timer = setTimeout(() => { pendentes.delete(id); const i = fila.findIndex(c => c.id === id); if (i >= 0) fila.splice(i, 1); erro(new Error(`O Studio não respondeu "${ferramenta}" em ${LIMITE_COMANDO / 1000}s.`)); }, LIMITE_COMANDO);
    pendentes.set(id, { ok, erro, timer });
    fila.push({ id, ferramenta, args: argumentos });
    entregar();
  });
}

/* ------------------------------------------------------------------ */
/* Comunidade: salva o jogo no repositório                             */
/* ------------------------------------------------------------------ */
const slug = s => String(s || 'jogo').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'jogo';

async function publicarNaComunidade(meta) {
  const pub = await noStudio('publicar', meta);
  const projeto = await noStudio('exportar');
  let capa = null;
  if (projeto.tipo !== 'arquivos') { try { capa = await noStudio('capturar_tela'); } catch (e) { /* sem capa */ } }

  fs.mkdirSync(path.join(PASTA_COMUNIDADE, 'capas'), { recursive: true });
  const indice = path.join(PASTA_COMUNIDADE, 'index.json');
  let lista = [];
  try { lista = JSON.parse(fs.readFileSync(indice, 'utf8')); if (!Array.isArray(lista)) lista = lista.jogos || []; } catch (e) { /* novo */ }

  const id = slug(projeto.nome);
  const anterior = lista.find(j => j.projetoId === projeto.id) || lista.find(j => j.id === id);
  const nomeBase = anterior ? anterior.id : (lista.some(j => j.id === id) ? `${id}-${Date.now().toString(36)}` : id);

  const limpo = Object.assign({}, projeto, { capa: undefined, pasta: undefined, formato: projeto.formato || 'arcadia-studio' });
  fs.writeFileSync(path.join(PASTA_COMUNIDADE, nomeBase + '.arcadia.json'), JSON.stringify(limpo, null, 1));

  let arqCapa = '';
  const m = typeof capa === 'string' && capa.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
  if (m) { arqCapa = `capas/${nomeBase}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`; fs.writeFileSync(path.join(PASTA_COMUNIDADE, arqCapa), Buffer.from(m[2], 'base64')); }
  else if (anterior) arqCapa = anterior.capa || '';

  const registro = {
    id: nomeBase, projetoId: projeto.id, nome: projeto.nome, autor: projeto.autor || meta.autor || 'Anônimo',
    genero: projeto.genero || 'Outro', subgenero: projeto.subgenero || '', descricao: projeto.descricao || '',
    tipo: projeto.tipo || 'cena', arquivo: nomeBase + '.arcadia.json', capa: arqCapa,
    publicadoEm: anterior ? anterior.publicadoEm : new Date().toISOString().slice(0, 10), atualizadoEm: new Date().toISOString().slice(0, 10),
  };
  lista = lista.filter(j => j !== anterior); lista.unshift(registro);
  fs.writeFileSync(indice, JSON.stringify(lista, null, 2) + '\n');

  return {
    salvoEm: PASTA_COMUNIDADE, arquivo: path.join(PASTA_COMUNIDADE, registro.arquivo), capa: arqCapa || '(sem capa)', registro,
    linkDireto: pub && pub.link,
    proximoPasso: 'Faça commit e push da pasta comunidade/ (git add comunidade && git commit -m "Jogo da comunidade: ' + registro.nome + '" && git push) para o jogo aparecer na aba "Jogos de Players" para todo mundo.',
  };
}

/* ------------------------------------------------------------------ */
/* MCP por stdio (JSON-RPC 2.0, uma mensagem por linha)                */
/* ------------------------------------------------------------------ */
const enviar = m => process.stdout.write(JSON.stringify(m) + '\n');
const texto = t => ({ type: 'text', text: typeof t === 'string' ? t : JSON.stringify(t, null, 2) });

async function chamarFerramenta(nome, argumentos) {
  if (!FERRAMENTAS.some(f => f[0] === nome)) throw new Error('Ferramenta desconhecida: ' + nome);
  if (nome === 'publicar_na_comunidade') return [texto(await publicarNaComunidade(argumentos))];
  const r = await noStudio(nome, argumentos);
  if (nome === 'capturar_tela') {
    const m = typeof r === 'string' && r.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (m) return [{ type: 'image', mimeType: m[1], data: m[2] }];
    return [texto('Não foi possível capturar a tela.')];
  }
  return [texto(r === undefined ? 'ok' : r)];
}

async function tratar(msg) {
  const { id, method, params = {} } = msg;
  const responder = resultado => id !== undefined && enviar({ jsonrpc: '2.0', id, result: resultado });
  const falhar = (code, message) => id !== undefined && enviar({ jsonrpc: '2.0', id, error: { code, message } });
  switch (method) {
    case 'initialize':
      return responder({
        protocolVersion: params.protocolVersion || '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'arcadia-studio', title: 'Arcádia Studio', version: VERSAO },
        instructions: 'Controla o Arcádia Studio aberto no navegador: cria jogos 3D (partes + scripts Lua/JavaScript com API parecida com a de estúdios populares) ou projetos web de arquivos, testa, captura a tela e publica. Comece com estado_do_studio e leia documentacao antes de escrever scripts. Depois de mudar scripts, use jogar + ler_saida para ver erros.',
      });
    case 'ping': return responder({});
    case 'tools/list':
      return responder({ tools: FERRAMENTAS.map(([name, description, inputSchema]) => ({ name, description, inputSchema })) });
    case 'tools/call':
      try { return responder({ content: await chamarFerramenta(params.name, params.arguments || {}) }); }
      catch (e) { return responder({ content: [texto('Erro: ' + (e.message || e))], isError: true }); }
    case 'resources/list': return responder({ resources: [] });
    case 'prompts/list': return responder({ prompts: [] });
    default:
      if (method && method.startsWith('notifications/')) return;
      return falhar(-32601, 'Método não suportado: ' + method);
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', pedaco => {
  buffer += pedaco;
  let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const linha = buffer.slice(0, i).trim(); buffer = buffer.slice(i + 1);
    if (!linha) continue;
    let msg; try { msg = JSON.parse(linha); } catch (e) { enviar({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }); continue; }
    for (const m of Array.isArray(msg) ? msg : [msg]) tratar(m).catch(e => log('erro:', e.stack || e));
  }
});
process.stdin.on('end', () => { log('cliente desconectou, encerrando'); servidor.close(); process.exit(0); });
