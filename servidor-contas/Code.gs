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
};

/* ---------------------------- entrada HTTP ---------------------------- */
function doPost(e) {
  var resp;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = ACOES[req.acao];
    if (!fn) throw erro('Ação desconhecida.');
    var lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try { resp = fn(req); } finally { lock.releaseLock(); }
    resp.ok = true;
  } catch (err) {
    resp = { ok: false, erro: err && err.publico ? err.message : 'Erro no servidor. Tente de novo.' };
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
  Contas: ['id', 'email', 'nome', 'sal', 'hash', 'verificado', 'doisFatores', 'criadoEm', 'falhas', 'bloqueadoAte', 'ultimoAcesso'],
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
  }
  return sh;
}
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
  var s = achar('Sessoes', 'hashToken', sha256(String(token || '')));
  if (!s || !(s.ativa === true || String(s.ativa) === 'TRUE') || Date.now() > Number(s.expira)) throw erro('Sua sessão terminou. Entre de novo.', { sessao: false });
  var c = achar('Contas', 'email', s.email); if (!c) throw erro('Conta não encontrada.', { sessao: false });
  return { conta: c, sessao: s };
}
function publico(c) { return { nome: c.nome, email: c.email, doisFatores: c.doisFatores === true || String(c.doisFatores) === 'TRUE', criadoEm: Number(c.criadoEm) }; }
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
