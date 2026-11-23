/* =========================================================================
   ARCÁDIA IA · servidor de contas (Google Apps Script)
   Roda na conta Google da empresa (arcadiaaisupport@gmail.com):
   - guarda as contas numa planilha do Google Drive da empresa
   - manda os e-mails pelo Gmail da empresa (códigos e avisos de acesso)
   Como publicar: veja servidor-contas/LEIAME.md
   ========================================================================= */

var CONFIG = {
  NOME: 'Arcádia IA',
  SITE: 'https://heitorcoser.github.io/arcadia-ia/',
  SUPORTE: 'arcadiaaisupport@gmail.com',
  AVISAR_EMPRESA_NOVA_CONTA: true,   // manda um aviso para o e-mail da empresa quando alguém cria conta
  CODIGO_MINUTOS: 10,                // validade dos códigos enviados por e-mail
  CODIGO_TENTATIVAS: 5,              // tentativas erradas antes de invalidar o código
  LOGIN_TENTATIVAS: 6,               // senhas erradas antes de bloquear a conta por um tempo
  LOGIN_BLOQUEIO_MIN: 15,
  SESSAO_DIAS: 30,
  ACESSOS_GUARDADOS: 15,
  // contas de criador da Arcádia: dão e tiram o selo de verificado; publicam sem limite
  CRIADORES: ['hdcoser@gmail.com'],
  SELO_CURTIDAS: 1000,               // um jogo com essa quantidade de curtidas dá o selo de verificado ao autor, sozinho
  LIMITE_PUBLICACOES: 60,            // contas comuns (verificados e criadores: sem limite)
};

/* ---------------------------- entrada HTTP ---------------------------- */
function doPost(e) {
  var resp;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = ACOES[req.acao];
    if (!fn) throw erro('Ação desconhecida.');
    var lock = LockService.getScriptLock();
    // muitos pedidos ao mesmo tempo (ex.: salvar na nuvem enquanto publica): espera a vez; se demorar demais, avisa
    if (!lock.tryLock(28000)) throw erro('O servidor está ocupado agora. Tente de novo em alguns segundos.');
    try { resp = fn(req); } finally { lock.releaseLock(); }
    resp.ok = true;
  } catch (err) {
    // erro interno: manda um resumo curto junto, para dar para saber o que houve sem abrir os registros
    var det = err && !err.publico ? String(err.message || err).replace(/\s+/g, ' ').slice(0, 140) : '';
    resp = { ok: false, erro: err && err.publico ? err.message : 'Erro no servidor. Tente de novo.' + (det ? ' (' + det + ')' : '') };
    if (err && err.extra) for (var k in err.extra) resp[k] = err.extra[k];
    if (!(err && err.publico)) console.error(err && err.stack || err);
  }
  return ContentService.createTextOutput(JSON.stringify(resp)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, servico: 'contas ' + CONFIG.NOME })).setMimeType(ContentService.MimeType.JSON);
}
function erro(msg, extra) { var e = new Error(msg); e.publico = true; if (extra) e.extra = extra; return e; }

/* ---------------------------- planilha ---------------------------- */
var TABELAS = {
  Contas: ['id', 'email', 'nome', 'sal', 'hash', 'verificado', 'doisFatores', 'criadoEm', 'falhas', 'bloqueadoAte', 'ultimoAcesso', 'foto', 'selo'],
  Codigos: ['desafio', 'email', 'tipo', 'hashCodigo', 'expira', 'tentativas', 'usado', 'dados'],
  Sessoes: ['hashToken', 'email', 'criadoEm', 'expira', 'dispositivo', 'ativa'],
  Acessos: ['email', 'data', 'dispositivo', 'metodo', 'resultado'],
};
function planilha() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('PLANILHA_ID'), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create(CONFIG.NOME + ' · Contas (não apagar)'); props.setProperty('PLANILHA_ID', ss.getId()); }
  return ss;
}
function aba(nome) {
  var ss = planilha(), sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome); sh.appendRow(TABELAS[nome]); sh.setFrozenRows(1);
    var padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
    if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  } else if (!abaConferida[nome]) {
    var n = TABELAS[nome].length;
    if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
    if (sh.getRange(1, n).getValue() === '') sh.getRange(1, n).setValue(TABELAS[nome][n - 1]); // a tabela ganhou coluna nova
  }
  abaConferida[nome] = true;
  return sh;
}
var abaConferida = {};
function linhas(nome) {
  var sh = aba(nome), v = sh.getDataRange().getValues(), cab = TABELAS[nome], out = [];
  for (var i = 1; i < v.length; i++) { var o = { _linha: i + 1 }; for (var j = 0; j < cab.length; j++) o[cab[j]] = v[i][j]; out.push(o); }
  return out;
}
function achar(nome, campo, valor) { var l = linhas(nome); for (var i = 0; i < l.length; i++) if (String(l[i][campo]) === String(valor)) return l[i]; return null; }
function inserir(nome, obj) { aba(nome).appendRow(TABELAS[nome].map(function (c) { return obj[c] === undefined ? '' : obj[c]; })); }
function atualizar(nome, linhaObj, mudancas) {
  var sh = aba(nome), cab = TABELAS[nome];
  Object.keys(mudancas).forEach(function (c) { var j = cab.indexOf(c); if (j >= 0) { sh.getRange(linhaObj._linha, j + 1).setValue(mudancas[c]); linhaObj[c] = mudancas[c]; } });
}

/* ---------------------------- segurança ---------------------------- */
function hex(bytes) { return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join(''); }
function sha256(txt) { return hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, txt, Utilities.Charset.UTF_8)); }
function aleatorio() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }
function pimenta() {
  var props = PropertiesService.getScriptProperties(), p = props.getProperty('PIMENTA');
  if (!p) { p = aleatorio(); props.setProperty('PIMENTA', p); }
  return p;
}
function hashSenha(sal, senhaHash) { return sha256(sal + ':' + senhaHash + ':' + pimenta()); }
function novoCodigo() { var n = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 1000000; return ('000000' + n).slice(-6); }
function iguais(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; var r = 0; for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function limparEmail(e) { e = String(e || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || e.length > 120) throw erro('E-mail inválido.'); return e; }
function limparNome(n) { n = String(n || '').replace(/[<>]/g, '').trim().slice(0, 24); if (n.length < 2) throw erro('Escolha um nome com pelo menos 2 letras.'); return n; }
function exigirSenhaHash(h) { if (!/^[0-9a-f]{64}$/.test(String(h || ''))) throw erro('Senha inválida.'); return String(h); }
function limparDispositivo(d) {
  d = d || {};
  var s = function (v, n) { return String(v || '').replace(/[<>]/g, '').slice(0, n || 80); };
  return { navegador: s(d.navegador), sistema: s(d.sistema), tipo: s(d.tipo, 20), app: s(d.app, 40), idioma: s(d.idioma, 20), fuso: s(d.fuso, 50), tela: s(d.tela, 20) };
}
function descreverDispositivo(d) { return [d.navegador, d.sistema && 'no ' + d.sistema, d.app && '(' + d.app + ')'].filter(String).join(' ') || 'Dispositivo desconhecido'; }
function agoraBR() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm:ss"); }

/* ---------------------------- códigos por e-mail ---------------------------- */
function criarDesafio(email, tipo, dados) {
  var codigo = novoCodigo(), desafio = aleatorio().slice(0, 32);
  inserir('Codigos', { desafio: desafio, email: email, tipo: tipo, hashCodigo: sha256(desafio + codigo), expira: Date.now() + CONFIG.CODIGO_MINUTOS * 60000, tentativas: 0, usado: false, dados: JSON.stringify(dados || {}) });
  return { desafio: desafio, codigo: codigo };
}
function conferirDesafio(desafio, codigo, tipo) {
  var c = achar('Codigos', 'desafio', String(desafio || ''));
  if (!c || c.tipo !== tipo || c.usado === true || String(c.usado) === 'TRUE') throw erro('Código expirado. Peça um novo.');
  if (Date.now() > Number(c.expira)) throw erro('Código expirado. Peça um novo.');
  if (Number(c.tentativas) >= CONFIG.CODIGO_TENTATIVAS) throw erro('Muitas tentativas. Peça um novo código.');
  var limpo = String(codigo || '').replace(/\D/g, '');
  if (!iguais(sha256(c.desafio + limpo), c.hashCodigo)) {
    atualizar('Codigos', c, { tentativas: Number(c.tentativas) + 1 });
    var resta = CONFIG.CODIGO_TENTATIVAS - Number(c.tentativas);
    throw erro(resta > 0 ? 'Código errado. Você ainda tem ' + resta + ' tentativa' + (resta > 1 ? 's' : '') + '.' : 'Muitas tentativas. Peça um novo código.');
  }
  atualizar('Codigos', c, { usado: true });
  return c;
}

/* ---------------------------- sessões ---------------------------- */
function criarSessao(conta, disp, metodo) {
  var token = aleatorio();
  inserir('Sessoes', { hashToken: sha256(token), email: conta.email, criadoEm: Date.now(), expira: Date.now() + CONFIG.SESSAO_DIAS * 86400000, dispositivo: JSON.stringify(disp), ativa: true });
  atualizar('Contas', conta, { ultimoAcesso: Date.now(), falhas: 0, bloqueadoAte: '' });
  registrarAcesso(conta.email, disp, metodo, 'sucesso');
  avisarAcesso(conta, disp, metodo);
  return { token: token, usuario: publico(conta) };
}
function contaDoToken(token) {
  if (!token) throw erro('Entre na sua conta para fazer isso.', { sessao: false });
  var s = achar('Sessoes', 'hashToken', sha256(String(token || '')));
  if (!s || !(s.ativa === true || String(s.ativa) === 'TRUE') || Date.now() > Number(s.expira)) throw erro('Sua sessão terminou. Entre de novo.', { sessao: false });
  var c = achar('Contas', 'email', s.email); if (!c) throw erro('Conta não encontrada.', { sessao: false });
  return { conta: c, sessao: s };
}
function publico(c) { return { id: String(c.id), nome: c.nome, email: c.email, doisFatores: c.doisFatores === true || String(c.doisFatores) === 'TRUE', criadoEm: Number(c.criadoEm), foto: String(c.foto || ''), selo: seloDe(c), seloOrigem: origemSelo(c), limites: limitesTexto(c) }; }
/* ---------------------------- selos ----------------------------
   'criador': as contas da equipe (CONFIG.CRIADORES). 'verificado': dado pelo criador ou por um jogo com 1.000 curtidas.
   Quem tem selo publica sem limite de quantidade e com até ~20 MB por jogo (contas comuns: 60 de até ~2 MB). */
function ehCriador(c) { return !!c && CONFIG.CRIADORES.indexOf(String(c.email || '').trim().toLowerCase()) >= 0; }
function seloDe(c) { if (ehCriador(c)) return 'criador'; return String(c && c.selo || '').indexOf('verificado') === 0 ? 'verificado' : ''; }
function origemSelo(c) { if (ehCriador(c)) return 'criador'; var s = String(c && c.selo || ''); return s.indexOf('verificado:') === 0 ? s.split(':')[1] : ''; }
function limitesDe(c) { return seloDe(c) ? { publicacoes: 0, blocos: MAX_BLOCOS_SELO } : { publicacoes: CONFIG.LIMITE_PUBLICACOES, blocos: MAX_BLOCOS }; }
function limitesTexto(c) { var l = limitesDe(c); return l.publicacoes ? 'até ' + l.publicacoes + ' publicações de até ~2 MB' : 'publicações ilimitadas, até ~20 MB cada'; }
function mapaSelos() { var m = {}; linhas('Contas').forEach(function (c) { var s = seloDe(c); if (s) m[String(c.email)] = s; }); return m; }
function registrarAcesso(email, disp, metodo, resultado) {
  inserir('Acessos', { email: email, data: Date.now(), dispositivo: JSON.stringify(disp), metodo: metodo, resultado: resultado });
}

/* ---------------------------- ações ---------------------------- */
var ACOES = {
  // 1. criar conta: guarda a conta como "não verificada" e manda o código para o e-mail
  cadastrar: function (r) {
    var email = limparEmail(r.email), nome = limparNome(r.nome), sh = exigirSenhaHash(r.senhaHash), disp = limparDispositivo(r.dispositivo);
    var c = achar('Contas', 'email', email);
    if (c && (c.verificado === true || String(c.verificado) === 'TRUE')) throw erro('Já existe uma conta com esse e-mail. Tente entrar ou use "Esqueci minha senha".');
    var sal = aleatorio().slice(0, 24), dados = { id: aleatorio().slice(0, 16), email: email, nome: nome, sal: sal, hash: hashSenha(sal, sh), verificado: false, doisFatores: !!r.doisFatores, criadoEm: Date.now(), falhas: 0, bloqueadoAte: '', ultimoAcesso: '' };
    if (c) atualizar('Contas', c, dados); else inserir('Contas', dados);
    var d = criarDesafio(email, 'verificar', { disp: disp });
    enviarCodigo(email, nome, d.codigo, 'Confirme seu e-mail', 'Falta pouco para criar sua conta na ' + CONFIG.NOME + '. Use este código para confirmar que este e-mail é seu:', disp);
    return { etapa: 'codigo', desafio: d.desafio, email: email, motivo: 'verificar' };
  },
  // 2. confirmar o e-mail: ativa a conta e já entra
  verificarEmail: function (r) {
    var c0 = conferirDesafio(r.desafio, r.codigo, 'verificar'), conta = achar('Contas', 'email', c0.email);
    if (!conta) throw erro('Conta não encontrada.');
    atualizar('Contas', conta, { verificado: true });
    var disp = limparDispositivo(r.dispositivo);
    enviarBoasVindas(conta);
    if (CONFIG.AVISAR_EMPRESA_NOVA_CONTA) avisarEmpresaNovaConta(conta, disp);
    return criarSessao(conta, disp, 'cadastro');
  },
  entrar: function (r) {
    var email = limparEmail(r.email), sh = exigirSenhaHash(r.senhaHash), disp = limparDispositivo(r.dispositivo);
    var c = achar('Contas', 'email', email);
    if (c && c.bloqueadoAte && Date.now() < Number(c.bloqueadoAte)) {
      var min = Math.ceil((Number(c.bloqueadoAte) - Date.now()) / 60000);
      throw erro('Muitas senhas erradas. Por segurança, esta conta está bloqueada por mais ' + min + ' min.');
    }
    if (!c || !iguais(hashSenha(c.sal, sh), c.hash)) {
      if (c) {
        var falhas = Number(c.falhas || 0) + 1, mud = { falhas: falhas };
        if (falhas >= CONFIG.LOGIN_TENTATIVAS) { mud.bloqueadoAte = Date.now() + CONFIG.LOGIN_BLOQUEIO_MIN * 60000; mud.falhas = 0; avisarBloqueio(c, disp); }
        atualizar('Contas', c, mud); registrarAcesso(email, disp, 'senha', 'senha errada');
      }
      throw erro('E-mail ou senha errados.');
    }
    if (!(c.verificado === true || String(c.verificado) === 'TRUE')) {
      var dv = criarDesafio(email, 'verificar', { disp: disp });
      enviarCodigo(email, c.nome, dv.codigo, 'Confirme seu e-mail', 'Você ainda não confirmou seu e-mail. Use este código para ativar sua conta:', disp);
      return { etapa: 'codigo', desafio: dv.desafio, email: email, motivo: 'verificar' };
    }
    if (c.doisFatores === true || String(c.doisFatores) === 'TRUE') {
      var d = criarDesafio(email, 'login', { disp: disp });
      enviarCodigo(email, c.nome, d.codigo, 'Seu código de acesso', 'Alguém (provavelmente você) acertou a senha da sua conta. Para terminar de entrar, use este código:', disp);
      return { etapa: 'codigo', desafio: d.desafio, email: email, motivo: 'login' };
    }
    return criarSessao(c, disp, 'senha');
  },
  // segunda etapa do login
  confirmarCodigo: function (r) {
    var c0 = conferirDesafio(r.desafio, r.codigo, 'login'), conta = achar('Contas', 'email', c0.email);
    if (!conta) throw erro('Conta não encontrada.');
    return criarSessao(conta, limparDispositivo(r.dispositivo), 'senha + código por e-mail');
  },
  reenviarCodigo: function (r) {
    var c = achar('Codigos', 'desafio', String(r.desafio || ''));
    if (!c || String(c.usado) === 'TRUE' || c.usado === true) throw erro('Esse código já foi usado. Comece de novo.');
    if (Date.now() - (Number(c.expira) - CONFIG.CODIGO_MINUTOS * 60000) < 45000) throw erro('Espere alguns segundos antes de pedir outro código.');
    atualizar('Codigos', c, { usado: true });
    var conta = achar('Contas', 'email', c.email), dados = JSON.parse(c.dados || '{}'), d = criarDesafio(c.email, c.tipo, dados);
    var textos = { verificar: ['Confirme seu e-mail', 'Aqui está um novo código para confirmar seu e-mail:'], login: ['Seu código de acesso', 'Aqui está um novo código para terminar de entrar:'], senha: ['Redefinir sua senha', 'Aqui está um novo código para criar uma senha nova:'] }[c.tipo];
    enviarCodigo(c.email, conta ? conta.nome : '', d.codigo, textos[0], textos[1], dados.disp || {});
    return { etapa: 'codigo', desafio: d.desafio, email: c.email, motivo: c.tipo };
  },
  esqueciSenha: function (r) {
    var email = limparEmail(r.email), c = achar('Contas', 'email', email), disp = limparDispositivo(r.dispositivo);
    // responde igual mesmo se a conta não existir (não entrega quem tem conta)
    var desafio = aleatorio().slice(0, 32);
    if (c && (c.verificado === true || String(c.verificado) === 'TRUE')) {
      var d = criarDesafio(email, 'senha', { disp: disp }); desafio = d.desafio;
      enviarCodigo(email, c.nome, d.codigo, 'Redefinir sua senha', 'Recebemos um pedido para trocar a senha da sua conta. Se foi você, use este código. Se não foi, ignore este e-mail: sua senha continua a mesma.', disp);
    }
    return { etapa: 'codigo', desafio: desafio, email: email, motivo: 'senha' };
  },
  redefinirSenha: function (r) {
    var c0 = conferirDesafio(r.desafio, r.codigo, 'senha'), conta = achar('Contas', 'email', c0.email), sh = exigirSenhaHash(r.senhaHash);
    var sal = aleatorio().slice(0, 24);
    atualizar('Contas', conta, { sal: sal, hash: hashSenha(sal, sh), falhas: 0, bloqueadoAte: '' });
    encerrarSessoes(conta.email, null);
    var disp = limparDispositivo(r.dispositivo);
    enviarAviso(conta, '🔑 Sua senha foi trocada', '<p>A senha da sua conta acabou de ser trocada e <b>todas as sessões abertas foram encerradas</b>.</p>' + tabelaDispositivo(disp, 'troca de senha') + '<p>Se não foi você, peça uma senha nova em "Esqueci minha senha" agora e responda este e-mail.</p>');
    return criarSessao(conta, disp, 'senha nova');
  },
  eu: function (r) {
    var x = contaDoToken(r.token), acessos = linhas('Acessos').filter(function (a) { return a.email === x.conta.email; }).slice(-CONFIG.ACESSOS_GUARDADOS).reverse()
      .map(function (a) { return { data: Number(a.data), dispositivo: JSON.parse(a.dispositivo || '{}'), metodo: a.metodo, resultado: a.resultado }; });
    var sessoes = linhas('Sessoes').filter(function (s) { return s.email === x.conta.email && (s.ativa === true || String(s.ativa) === 'TRUE') && Date.now() < Number(s.expira); }).length;
    return { usuario: publico(x.conta), acessos: acessos, sessoesAbertas: sessoes };
  },
  alterarDoisFatores: function (r) {
    var x = contaDoToken(r.token), sh = exigirSenhaHash(r.senhaHash);
    if (!iguais(hashSenha(x.conta.sal, sh), x.conta.hash)) throw erro('Senha errada.');
    atualizar('Contas', x.conta, { doisFatores: !!r.ativar });
    enviarAviso(x.conta, r.ativar ? '🛡️ Verificação em duas etapas ativada' : '⚠️ Verificação em duas etapas desativada',
      r.ativar ? '<p>A partir de agora, além da senha, vamos pedir um código enviado para este e-mail sempre que alguém entrar na sua conta.</p>' : '<p>A verificação em duas etapas foi <b>desligada</b>. Agora só a senha é pedida para entrar. Se não foi você, troque sua senha agora.</p>');
    return { usuario: publico(x.conta) };
  },
  alterarNome: function (r) { var x = contaDoToken(r.token); atualizar('Contas', x.conta, { nome: limparNome(r.nome) }); return { usuario: publico(x.conta) }; },
  sair: function (r) { try { var x = contaDoToken(r.token); atualizar('Sessoes', x.sessao, { ativa: false }); } catch (e) {} return {}; },
  sairTodos: function (r) { var x = contaDoToken(r.token); var n = encerrarSessoes(x.conta.email, null); return { encerradas: n }; },
};
/* ---------------------------- conteúdo da comunidade e nuvem ----------------------------
   Jogos (e depois personagens, animações e itens) publicados por quem tem conta ficam
   visíveis para todo mundo. O conteúdo vai para a aba "Blobs" em pedaços de 45 mil
   caracteres (limite de uma célula); assim não precisa de nenhuma permissão nova. */
TABELAS.Conteudos = ['id', 'tipo', 'nome', 'descricao', 'genero', 'subgenero', 'autorId', 'autorNome', 'autorEmail', 'capa', 'criadoEm', 'atualizadoEm', 'jogadas', 'curtidas', 'tamanho', 'ativo'];
TABELAS.Curtidas = ['id', 'email', 'data'];
TABELAS.Nuvem = ['email', 'chave', 'atualizadoEm', 'tamanho'];
var TIPOS = ['jogo', 'personagem', 'animacao', 'item'], BLOCO = 45000, MAX_BLOCOS = 44, MAX_BLOCOS_SELO = 450, POR_LINHA = 44;
function sim(v) { return v === true || String(v) === 'TRUE'; }
function abaBlobs() { var ss = planilha(), sh = ss.getSheetByName('Blobs'); if (!sh) { sh = ss.insertSheet('Blobs'); sh.appendRow(['chave', 'partes']); sh.setFrozenRows(1); } return sh; }
function linhaBlob(sh, chave) {
  var n = sh.getLastRow(); if (n < 2) return -1;
  var v = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) if (String(v[i][0]) === chave) return i + 2;
  return -1;
}
// dados grandes ficam em várias linhas: "chave" (com o total de pedaços) e "chave#2", "chave#3"... com até 44 pedaços cada
function gravarBlob(chave, texto, maxBlocos) {
  texto = String(texto == null ? '' : texto); maxBlocos = maxBlocos || MAX_BLOCOS;
  var partes = []; for (var i = 0; i < texto.length; i += BLOCO) partes.push('~' + texto.slice(i, i + BLOCO)); // o "~" impede a planilha de ler o texto como fórmula ou número
  if (partes.length > maxBlocos) throw erro(maxBlocos > MAX_BLOCOS ? 'Grande demais: o limite do servidor é de uns 20 MB.' : 'Grande demais: o limite é de uns 2 MB. Contas verificadas (☑️) podem publicar até uns 20 MB.');
  apagarBlob(chave);
  var sh = abaBlobs();
  for (var k = 0, n = 0; k === 0 || n < partes.length; k++) {
    var pedaco = partes.slice(n, n + POR_LINHA); n += POR_LINHA;
    gravarLinhaBlob(sh, k === 0 ? chave : chave + '#' + (k + 1), [k === 0 ? partes.length : pedaco.length].concat(pedaco));
  }
}
function gravarLinhaBlob(sh, chave, resto) {
  var valores = [chave].concat(resto), l = linhaBlob(sh, ''); // reaproveita uma linha apagada
  if (l < 0) { sh.appendRow(valores); return; }
  var larg = Math.max(sh.getLastColumn(), valores.length), linha = [];
  // a aba nasce com 26 colunas: uma linha mais larga precisa de colunas novas antes de escrever
  var max = sh.getMaxColumns(); if (larg > max) sh.insertColumnsAfter(max, larg - max);
  for (var k = 0; k < larg; k++) linha.push(k < valores.length ? valores[k] : '');
  sh.getRange(l, 1, 1, larg).setValues([linha]);
}
function lerBlob(chave) {
  var sh = abaBlobs(), l = linhaBlob(sh, chave); if (l < 0) return null;
  var total = Number(sh.getRange(l, 2, 1, 1).getValues()[0][0]) || 0; if (!total) return '';
  var nesta = Math.min(total, POR_LINHA), out = sh.getRange(l, 3, 1, nesta).getValues()[0].map(function (p) { return String(p).slice(1); });
  for (var k = 2; out.length < total; k++) {
    var lk = linhaBlob(sh, chave + '#' + k); if (lk < 0) break;
    var n = Number(sh.getRange(lk, 2, 1, 1).getValues()[0][0]) || 0; if (!n) break;
    out = out.concat(sh.getRange(lk, 3, 1, n).getValues()[0].map(function (p) { return String(p).slice(1); }));
  }
  return out.join('');
}
function apagarBlob(chave) {
  var sh = abaBlobs(), l = linhaBlob(sh, chave); if (l < 0) return;
  var total = Number(sh.getRange(l, 2, 1, 1).getValues()[0][0]) || 0;
  sh.getRange(l, 1, 1, sh.getLastColumn()).clearContent();
  for (var k = 2; (k - 1) * POR_LINHA < total; k++) { var lk = linhaBlob(sh, chave + '#' + k); if (lk > 0) sh.getRange(lk, 1, 1, sh.getLastColumn()).clearContent(); }
}
function limparTexto(t, max) { return String(t == null ? '' : t).replace(/[<>]/g, '').trim().slice(0, max); }
function contaOpcional(token) { try { return token ? contaDoToken(token).conta : null; } catch (e) { return null; } }
function metaConteudo(c, curtidos, selos) {
  return { autorSelo: selos ? selos[String(c.autorEmail)] || '' : '', id: String(c.id), tipo: c.tipo, nome: c.nome, descricao: c.descricao, genero: c.genero, subgenero: c.subgenero, autor: c.autorNome, autorId: String(c.autorId),
    capa: String(c.capa || '').replace(/^~/, ''), criadoEm: Number(c.criadoEm), atualizadoEm: Number(c.atualizadoEm), jogadas: Number(c.jogadas || 0), curtidas: Number(c.curtidas || 0),
    tamanho: Number(c.tamanho || 0), curti: !!(curtidos && curtidos[c.id]) };
}
function curtidosPor(conta) { var m = {}; if (conta) linhas('Curtidas').forEach(function (x) { if (x.email === conta.email) m[x.id] = true; }); return m; }
function conteudoAtivo(id) { var c = achar('Conteudos', 'id', String(id || '')); if (!c || !sim(c.ativo)) throw erro('Esse conteúdo não existe mais.'); return c; }
function chaveNuvem(ch) { ch = String(ch || ''); if (!/^[\w.:-]{1,80}$/.test(ch)) throw erro('Nome de dado inválido.'); return ch; }

var ACOES_CONTEUDO = {
  // publica (ou atualiza, se "id" for seu) um jogo, personagem, animação ou item para todo mundo
  publicarConteudo: function (r) {
    var conta = contaDoToken(r.token).conta, tipo = String(r.tipo || 'jogo');
    if (TIPOS.indexOf(tipo) < 0) throw erro('Tipo de conteúdo inválido.');
    var nome = limparTexto(r.nome, 60); if (nome.length < 2) throw erro('Dê um nome com pelo menos 2 letras.');
    var dados = String(r.dados || ''); if (!dados) throw erro('Nada para publicar.');
    try { JSON.parse(dados); } catch (e) { throw erro('O conteúdo está corrompido.'); }
    // confere o tamanho ANTES de criar a entrada (senão ficava um "jogo fantasma" contando no limite)
    var maxB = limitesDe(conta).blocos; if (Math.ceil(dados.length / BLOCO) > maxB) throw erro(maxB > MAX_BLOCOS ? 'Grande demais: o limite do servidor é de uns 20 MB.' : 'Grande demais: o limite é de uns 2 MB. Contas verificadas (☑️) podem publicar até uns 20 MB.');
    var capa = String(r.capa || ''); if (!/^data:image\/(jpeg|png|webp);base64,[\w+\/=]+$/.test(capa) || capa.length > 44000) capa = '';
    var agora = Date.now(), c = r.id ? achar('Conteudos', 'id', String(r.id)) : null;
    if (c && c.autorEmail !== conta.email) throw erro('Esse conteúdo é de outra pessoa.');
    var campos = { tipo: tipo, nome: nome, descricao: limparTexto(r.descricao, 600), genero: limparTexto(r.genero, 40), subgenero: limparTexto(r.subgenero, 60),
      autorId: String(conta.id), autorNome: conta.nome, autorEmail: conta.email, capa: capa ? '~' + capa : '', atualizadoEm: agora, tamanho: dados.length, ativo: true };
    if (c) atualizar('Conteudos', c, campos);
    else {
      var lim = limitesDe(conta).publicacoes;
      if (lim) { var meus = linhas('Conteudos').filter(function (x) { return x.autorEmail === conta.email && sim(x.ativo); }).length;
        if (meus >= lim) throw erro('Você já tem ' + lim + ' publicações. Apague alguma para publicar outra (contas verificadas ☑️ não têm limite).'); }
      c = { id: aleatorio().slice(0, 12), criadoEm: agora, jogadas: 0, curtidas: 0 };
      for (var k in campos) c[k] = campos[k];
      inserir('Conteudos', c);
    }
    gravarBlob('c:' + c.id, dados, limitesDe(conta).blocos);
    return { conteudo: metaConteudo(c) };
  },
  listarConteudo: function (r) {
    var conta = contaOpcional(r.token), curt = curtidosPor(conta), tipo = r.tipo ? String(r.tipo) : '';
    var l = linhas('Conteudos').filter(function (c) { return sim(c.ativo) && (!tipo || c.tipo === tipo) && (!r.autorId || String(c.autorId) === String(r.autorId)); })
      .sort(function (a, b) { return Number(b.atualizadoEm) - Number(a.atualizadoEm); }).slice(0, 300);
    var selos = mapaSelos();
    return { conteudos: l.map(function (c) { return metaConteudo(c, curt, selos); }) };
  },
  baixarConteudo: function (r) {
    var c = conteudoAtivo(r.id), dados = lerBlob('c:' + c.id);
    if (dados == null) throw erro('Esse conteúdo não existe mais.');
    if (r.contar) atualizar('Conteudos', c, { jogadas: Number(c.jogadas || 0) + 1 });
    return { conteudo: metaConteudo(c, curtidosPor(contaOpcional(r.token)), mapaSelos()), dados: dados };
  },
  apagarConteudo: function (r) {
    var conta = contaDoToken(r.token).conta, c = conteudoAtivo(r.id);
    if (c.autorEmail !== conta.email) throw erro('Esse conteúdo é de outra pessoa.');
    atualizar('Conteudos', c, { ativo: false }); apagarBlob('c:' + c.id);
    return {};
  },
  curtir: function (r) {
    var conta = contaDoToken(r.token).conta, c = conteudoAtivo(r.id);
    var ja = linhas('Curtidas').filter(function (x) { return x.id === String(c.id) && x.email === conta.email; })[0];
    if (ja) aba('Curtidas').deleteRow(ja._linha); else inserir('Curtidas', { id: String(c.id), email: conta.email, data: Date.now() });
    var n = Math.max(0, Number(c.curtidas || 0) + (ja ? -1 : 1)); atualizar('Conteudos', c, { curtidas: n });
    // um jogo que chega a 1.000 curtidas dá o selo de verificado ao autor (e ele fica, mesmo se as curtidas caírem depois)
    if (!ja && n >= CONFIG.SELO_CURTIDAS) { var autor = achar('Contas', 'email', c.autorEmail); if (autor && !seloDe(autor)) atualizar('Contas', autor, { selo: 'verificado:curtidas:' + Date.now() }); }
    return { curti: !ja, curtidas: n };
  },
  meusConteudos: function (r) {
    var conta = contaDoToken(r.token).conta;
    return { conteudos: linhas('Conteudos').filter(function (c) { return c.autorEmail === conta.email && sim(c.ativo); }).map(function (c) { return metaConteudo(c); }) };
  },
  perfil: function (r) {
    var c = achar('Contas', 'id', String(r.autorId || '')); if (!c || !sim(c.verificado)) throw erro('Perfil não encontrado.');
    var l = linhas('Conteudos').filter(function (x) { return String(x.autorId) === String(c.id) && sim(x.ativo); });
    return { perfil: { id: String(c.id), nome: c.nome, selo: seloDe(c), membroDesde: Number(c.criadoEm), publicacoes: l.length, jogadas: l.reduce(function (a, x) { return a + Number(x.jogadas || 0); }, 0), curtidas: l.reduce(function (a, x) { return a + Number(x.curtidas || 0); }, 0) },
      conteudos: l.map(function (x) { return metaConteudo(x); }) };
  },
  // nuvem: cada conta guarda seus dados (projetos do Studio, notas, progresso dos jogos)
  salvarNuvem: function (r) {
    var conta = contaDoToken(r.token).conta, ch = chaveNuvem(r.chave), valor = String(r.valor == null ? '' : r.valor), agora = Date.now();
    gravarBlob('n:' + conta.id + ':' + ch, valor, limitesDe(conta).blocos);
    var ex = linhas('Nuvem').filter(function (x) { return x.email === conta.email && x.chave === ch; })[0];
    if (ex) atualizar('Nuvem', ex, { atualizadoEm: agora, tamanho: valor.length }); else inserir('Nuvem', { email: conta.email, chave: ch, atualizadoEm: agora, tamanho: valor.length });
    return { atualizadoEm: agora };
  },
  lerNuvem: function (r) {
    var conta = contaDoToken(r.token).conta, ch = chaveNuvem(r.chave);
    var ex = linhas('Nuvem').filter(function (x) { return x.email === conta.email && x.chave === ch; })[0];
    return { valor: ex ? lerBlob('n:' + conta.id + ':' + ch) : null, atualizadoEm: ex ? Number(ex.atualizadoEm) : 0 };
  },
  listarNuvem: function (r) {
    var conta = contaDoToken(r.token).conta;
    return { dados: linhas('Nuvem').filter(function (x) { return x.email === conta.email; }).map(function (x) { return { chave: x.chave, atualizadoEm: Number(x.atualizadoEm), tamanho: Number(x.tamanho) }; }) };
  },
  apagarNuvem: function (r) {
    var conta = contaDoToken(r.token).conta, ch = chaveNuvem(r.chave);
    var ex = linhas('Nuvem').filter(function (x) { return x.email === conta.email && x.chave === ch; })[0];
    if (ex) { aba('Nuvem').deleteRow(ex._linha); apagarBlob('n:' + conta.id + ':' + ch); }
    return {};
  },
};
for (var acaoNova in ACOES_CONTEUDO) ACOES[acaoNova] = ACOES_CONTEUDO[acaoNova];

/* ---------------------------- amizades ----------------------------
   Pedidos entre contas verificadas: pendente → aceita (ou some, se recusar).
   Os ids vão com um "c" na frente: assim a planilha nunca transforma um id em número.
   Presença: o site avisa de tempos em tempos que a pessoa está on-line (e em qual jogo). */
TABELAS.Amizades = ['de', 'para', 'estado', 'criadoEm', 'atualizadoEm'];
TABELAS.Presenca = ['id', 'quando', 'jogo'];
var MAX_AMIGOS = 200, MAX_PEDIDOS = 50, ONLINE_MS = 3 * 60000;
function cid(id) { return 'c' + String(id); }
function codigoAmigo(id) { return String(id).slice(0, 8).toUpperCase(); }
function mapaPresenca() { var m = {}; linhas('Presenca').forEach(function (p) { m[String(p.id)] = p; }); return m; }
function cartaoConta(c, pres) {
  var p = pres[cid(c.id)], on = !!(p && Date.now() - Number(p.quando) < ONLINE_MS);
  return { id: String(c.id), nome: c.nome, foto: String(c.foto || ''), selo: seloDe(c), codigo: codigoAmigo(c.id), desde: Number(c.criadoEm), online: on, vistoEm: p ? Number(p.quando) : 0, jogo: on ? String(p.jogo || '') : '' };
}
function amizadeEntre(a, b) {
  var l = linhas('Amizades'), A = cid(a), B = cid(b);
  for (var i = 0; i < l.length; i++) if ((l[i].de === A && l[i].para === B) || (l[i].de === B && l[i].para === A)) return l[i];
  return null;
}
function relacoesDe(eu) {
  var m = {}, E = cid(eu);
  linhas('Amizades').forEach(function (x) {
    if (x.de === E) m[String(x.para).slice(1)] = x.estado === 'aceita' ? 'amigo' : 'enviado';
    else if (x.para === E) m[String(x.de).slice(1)] = x.estado === 'aceita' ? 'amigo' : 'recebido';
  });
  return m;
}
var ACOES_AMIGOS = {
  // procura contas pelo nome (pedaço) ou pelo código de amigo (exato)
  buscarAmigos: function (r) {
    var conta = contaDoToken(r.token).conta, q = String(r.q || '').trim().replace(/^#/, '');
    if (q.length < 2) throw erro('Digite pelo menos 2 letras do nome, ou o código de amigo.');
    var qn = q.toLowerCase(), qc = q.toUpperCase(), pres = mapaPresenca(), rel = relacoesDe(conta.id);
    var l = linhas('Contas').filter(function (c) { return sim(c.verificado) && String(c.id) !== String(conta.id) && (codigoAmigo(c.id) === qc || String(c.nome).toLowerCase().indexOf(qn) >= 0); })
      .sort(function (a, b) { return (codigoAmigo(b.id) === qc) - (codigoAmigo(a.id) === qc); }).slice(0, 20);
    return { contas: l.map(function (c) { var k = cartaoConta(c, pres); k.relacao = rel[k.id] || ''; return k; }) };
  },
  pedirAmizade: function (r) {
    var conta = contaDoToken(r.token).conta, eu = String(conta.id), outro = achar('Contas', 'id', String(r.id || ''));
    if (!outro || !sim(outro.verificado)) throw erro('Conta não encontrada.');
    if (String(outro.id) === eu) throw erro('Esse é você 🙂');
    var ex = amizadeEntre(eu, outro.id);
    if (ex) {
      if (ex.estado === 'aceita') throw erro('Vocês já são amigos.');
      if (ex.de === cid(eu)) throw erro('Pedido já enviado. Agora é só esperar.');
      atualizar('Amizades', ex, { estado: 'aceita', atualizadoEm: Date.now() }); // os dois pediram: já vira amizade
      return { estado: 'aceita' };
    }
    var todas = linhas('Amizades'), E = cid(eu);
    if (todas.filter(function (x) { return x.de === E && x.estado === 'pendente'; }).length >= MAX_PEDIDOS) throw erro('Você tem pedidos demais esperando resposta. Cancele alguns antes.');
    if (todas.filter(function (x) { return (x.de === E || x.para === E) && x.estado === 'aceita'; }).length >= MAX_AMIGOS) throw erro('Você chegou ao limite de ' + MAX_AMIGOS + ' amigos.');
    inserir('Amizades', { de: E, para: cid(outro.id), estado: 'pendente', criadoEm: Date.now(), atualizadoEm: Date.now() });
    return { estado: 'pendente' };
  },
  responderAmizade: function (r) {
    var eu = String(contaDoToken(r.token).conta.id), ex = amizadeEntre(eu, String(r.id || ''));
    if (!ex || ex.estado !== 'pendente' || ex.para !== cid(eu)) throw erro('Esse pedido não existe mais.');
    if (r.aceitar) atualizar('Amizades', ex, { estado: 'aceita', atualizadoEm: Date.now() }); else aba('Amizades').deleteRow(ex._linha);
    return { estado: r.aceitar ? 'aceita' : '' };
  },
  // desfaz a amizade ou cancela um pedido enviado
  removerAmizade: function (r) {
    var eu = String(contaDoToken(r.token).conta.id), ex = amizadeEntre(eu, String(r.id || ''));
    if (ex) aba('Amizades').deleteRow(ex._linha);
    return {};
  },
  // todos os perfis (contas verificadas), quem está on-line primeiro; de 30 em 30
  listarPerfis: function (r) {
    var conta = contaDoToken(r.token).conta, pres = mapaPresenca(), rel = relacoesDe(conta.id), por = 30, ini = Math.max(0, Math.floor(Number(r.inicio) || 0));
    var l = linhas('Contas').filter(function (c) { return sim(c.verificado) && String(c.id) !== String(conta.id); })
      .map(function (c) { var k = cartaoConta(c, pres); k.relacao = rel[k.id] || ''; return k; })
      .sort(function (a, b) { return (b.online - a.online) || (b.vistoEm - a.vistoEm) || (b.desde - a.desde); });
    return { contas: l.slice(ini, ini + por), total: l.length, proximo: ini + por < l.length ? ini + por : 0 };
  },
  // foto de perfil: um emoji sobre uma cor (ex.: "🦊|#8b5cf6")
  alterarFoto: function (r) {
    var x = contaDoToken(r.token), f = String(r.foto || ''), m = f.split('|');
    if (f && (m.length !== 2 || !m[0] || m[0].length > 12 || /[<>"'&\s]/.test(m[0]) || !/^#[0-9a-fA-F]{6}$/.test(m[1]))) throw erro('Foto inválida.');
    atualizar('Contas', x.conta, { foto: f });
    return { usuario: publico(x.conta) };
  },
  listarAmizades: function (r) {
    var conta = contaDoToken(r.token).conta, E = cid(conta.id), pres = mapaPresenca(), contas = {};
    linhas('Contas').forEach(function (c) { contas[cid(c.id)] = c; });
    var amigos = [], recebidos = [], enviados = [];
    linhas('Amizades').forEach(function (x) {
      if (x.de !== E && x.para !== E) return;
      var c = contas[x.de === E ? x.para : x.de]; if (!c) return;
      var k = cartaoConta(c, pres); k.em = Number(x.atualizadoEm || x.criadoEm);
      if (x.estado === 'aceita') amigos.push(k); else if (x.para === E) recebidos.push(k); else enviados.push(k);
    });
    amigos.sort(function (a, b) { return (b.online - a.online) || (b.vistoEm - a.vistoEm); });
    return { meuCodigo: codigoAmigo(conta.id), amigos: amigos, recebidos: recebidos, enviados: enviados };
  },
  // "estou on-line" (e em qual jogo); devolve quantos pedidos de amizade estão esperando
  presenca: function (r) {
    var conta = contaDoToken(r.token).conta, id = cid(conta.id), p = achar('Presenca', 'id', id), jogo = limparTexto(r.jogo, 60);
    if (p) atualizar('Presenca', p, { quando: Date.now(), jogo: jogo }); else inserir('Presenca', { id: id, quando: Date.now(), jogo: jogo });
    return { pedidos: linhas('Amizades').filter(function (x) { return x.para === id && x.estado === 'pendente'; }).length };
  },
};
for (var acaoAmigo in ACOES_AMIGOS) ACOES[acaoAmigo] = ACOES_AMIGOS[acaoAmigo];

/* ---------------------------- só para o criador ---------------------------- */
ACOES.darSelo = function (r) {
  var eu = contaDoToken(r.token).conta;
  if (!ehCriador(eu)) throw erro('Só o criador da Arcádia pode dar o selo de verificado.');
  var alvo = achar('Contas', 'id', String(r.id || ''));
  if (!alvo || !sim(alvo.verificado)) throw erro('Conta não encontrada.');
  if (ehCriador(alvo)) throw erro('Essa já é uma conta de criador.');
  atualizar('Contas', alvo, { selo: r.dar ? 'verificado:criador:' + Date.now() : '' });
  return { conta: cartaoConta(alvo, mapaPresenca()) };
};

function encerrarSessoes(email, exceto) {
  var n = 0; linhas('Sessoes').forEach(function (s) { if (s.email === email && s.hashToken !== exceto && (s.ativa === true || String(s.ativa) === 'TRUE')) { atualizar('Sessoes', s, { ativa: false }); n++; } });
  return n;
}

/* ---------------------------- e-mails ---------------------------- */
function moldura(titulo, corpo) {
  return '<div style="background:#0d0718;padding:28px 12px;font-family:Segoe UI,Arial,sans-serif">' +
    '<div style="max-width:520px;margin:0 auto;background:#1c1033;border:1px solid #45297c;border-radius:18px;overflow:hidden">' +
    '<div style="background:linear-gradient(135deg,#8b5cf6,#22d3ee);padding:18px 24px;color:#fff;font-size:20px;font-weight:800;letter-spacing:.5px">🎮 ' + CONFIG.NOME + '</div>' +
    '<div style="padding:24px;color:#ece7f8;font-size:15px;line-height:1.6"><h2 style="margin:0 0 12px;font-size:21px;color:#fff">' + titulo + '</h2>' + corpo + '</div>' +
    '<div style="padding:14px 24px;border-top:1px solid #2f2154;color:#9f93c0;font-size:12px;line-height:1.5">Você recebeu este e-mail porque tem uma conta na ' + CONFIG.NOME + ' (<a style="color:#c4b5fd" href="' + CONFIG.SITE + '">' + CONFIG.SITE.replace(/^https?:\/\//, '') + '</a>). Dúvidas: responda este e-mail ou escreva para ' + CONFIG.SUPORTE + '.</div>' +
    '</div></div>';
}
function tabelaDispositivo(d, metodo) {
  var l = [['Quando', agoraBR() + ' (horário de Brasília)'], ['Dispositivo', descreverDispositivo(d)], ['Tipo', d.tipo], ['Idioma', d.idioma], ['Fuso horário do aparelho', d.fuso], ['Tela', d.tela], ['Como entrou', metodo]];
  return '<table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:14px">' + l.filter(function (x) { return x[1]; }).map(function (x) {
    return '<tr><td style="padding:6px 10px;color:#9f93c0;border-bottom:1px solid #2f2154;white-space:nowrap">' + x[0] + '</td><td style="padding:6px 10px;color:#fff;border-bottom:1px solid #2f2154">' + x[1] + '</td></tr>';
  }).join('') + '</table>';
}
function enviar(para, assunto, html, texto) {
  MailApp.sendEmail({ to: para, subject: assunto, htmlBody: html, body: texto || assunto, name: CONFIG.NOME, replyTo: CONFIG.SUPORTE });
}
function enviarCodigo(email, nome, codigo, assunto, texto, disp) {
  var html = moldura(assunto, '<p>Oi' + (nome ? ', <b>' + nome + '</b>' : '') + '!</p><p>' + texto + '</p>' +
    '<div style="font-size:38px;font-weight:800;letter-spacing:10px;text-align:center;background:#120922;border:2px dashed #8b5cf6;border-radius:14px;padding:16px;margin:18px 0;color:#ffd166">' + codigo + '</div>' +
    '<p style="color:#9f93c0;font-size:13px">O código vale por ' + CONFIG.CODIGO_MINUTOS + ' minutos. Nunca passe esse código para ninguém: a equipe da ' + CONFIG.NOME + ' nunca vai pedir ele.</p>' + tabelaDispositivo(disp || {}, ''));
  enviar(email, codigo + ' é o seu código · ' + CONFIG.NOME, html, 'Seu código: ' + codigo + ' (vale por ' + CONFIG.CODIGO_MINUTOS + ' minutos).');
}
function enviarBoasVindas(c) {
  enviar(c.email, 'Bem-vindo(a) à ' + CONFIG.NOME + '!', moldura('Sua conta está pronta, ' + c.nome + '! 🎉',
    '<p>Agora seu nome aparece nos jogos e você pode entrar de qualquer aparelho.</p>' +
    (c.doisFatores === true || String(c.doisFatores) === 'TRUE' ? '<p>🛡️ A <b>verificação em duas etapas</b> está ligada: todo acesso vai pedir um código enviado para cá.</p>' : '<p>Dica: ligue a <b>verificação em duas etapas</b> em "Minha conta" para deixar a conta mais segura.</p>') +
    '<p>Sempre que alguém entrar na sua conta, você recebe um aviso aqui com os detalhes do acesso.</p>' +
    '<p style="text-align:center;margin:22px 0"><a href="' + CONFIG.SITE + '" style="background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">Jogar agora</a></p>'));
}
function avisarAcesso(c, d, metodo) {
  enviarAviso(c, '🔔 Novo acesso à sua conta', '<p>Alguém acabou de entrar na sua conta. Os detalhes do acesso:</p>' + tabelaDispositivo(d, metodo) +
    '<p><b>Foi você?</b> Então está tudo certo, não precisa fazer nada.</p><p><b>Não foi você?</b> Entre no site, vá em <i>Minha conta → Sair de todos os aparelhos</i> e troque sua senha em "Esqueci minha senha". Recomendamos também ligar a verificação em duas etapas.</p>');
}
function avisarBloqueio(c, d) {
  enviarAviso(c, '🚫 Tentativas de acesso bloqueadas', '<p>Alguém errou a senha da sua conta ' + CONFIG.LOGIN_TENTATIVAS + ' vezes seguidas. Por segurança, bloqueamos novos acessos por ' + CONFIG.LOGIN_BLOQUEIO_MIN + ' minutos.</p>' + tabelaDispositivo(d, 'senha errada') + '<p>Se não foi você, sua senha continua segura, mas recomendamos ligar a verificação em duas etapas.</p>');
}
function enviarAviso(c, assunto, corpo) { enviar(c.email, assunto + ' · ' + CONFIG.NOME, moldura(assunto, '<p>Oi, <b>' + c.nome + '</b>!</p>' + corpo)); }
function avisarEmpresaNovaConta(c, d) {
  enviar(CONFIG.SUPORTE, '👤 Nova conta: ' + c.nome, moldura('Nova conta criada', '<p>Uma nova conta foi criada e confirmada.</p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:6px 10px;color:#9f93c0">Nome</td><td style="padding:6px 10px;color:#fff">' + c.nome + '</td></tr><tr><td style="padding:6px 10px;color:#9f93c0">E-mail</td><td style="padding:6px 10px;color:#fff">' + c.email + '</td></tr><tr><td style="padding:6px 10px;color:#9f93c0">Duas etapas</td><td style="padding:6px 10px;color:#fff">' + (c.doisFatores === true || String(c.doisFatores) === 'TRUE' ? 'ligada' : 'desligada') + '</td></tr></table>' + tabelaDispositivo(d, 'cadastro')));
}

/* ---------------------------- manutenção ---------------------------- */
// Rode uma vez pelo editor para criar a planilha e autorizar o envio de e-mails.
function configurar() {
  Object.keys(TABELAS).forEach(aba); pimenta();
  Logger.log('Pronto! Planilha: ' + planilha().getUrl());
  Logger.log('E-mails que ainda dá para mandar hoje: ' + MailApp.getRemainingDailyQuota());
}
// Opcional: agende (Acionadores → por dia) para apagar códigos e sessões vencidos.
function limparVencidos() {
  ['Codigos', 'Sessoes'].forEach(function (nome) {
    var sh = aba(nome), l = linhas(nome);
    for (var i = l.length - 1; i >= 0; i--) if (Date.now() > Number(l[i].expira) + 86400000) sh.deleteRow(l[i]._linha);
  });
}
