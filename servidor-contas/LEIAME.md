# Servidor de contas da Arcádia IA

O site é estático (GitHub Pages) e não consegue mandar e-mails sozinho. Por isso as contas ficam num **Google Apps Script** que roda na conta Google da empresa, **arcadiaaisupport@gmail.com**:

- as contas ficam numa planilha no Google Drive da empresa (“Arcádia IA · Contas (não apagar)”);
- os e-mails (códigos, boas-vindas, avisos de acesso) saem do próprio Gmail da empresa;
- é grátis e ninguém precisa saber a senha do e-mail.

## O que o sistema faz

- **Criar conta** com nome, e-mail e senha, e confirmação do e-mail por código de 6 números.
- **Verificação em duas etapas por e-mail** (a pessoa escolhe ao criar a conta e pode ligar ou desligar em “Minha conta”, confirmando a senha).
- **Aviso de acesso** para o dono da conta toda vez que alguém entra, com data e hora, navegador, sistema, tipo de aparelho, idioma, fuso horário, tela e forma de entrada (senha, senha + código, cadastro, senha nova).
- **Aviso de bloqueio**: depois de 6 senhas erradas seguidas, a conta fica bloqueada por 15 minutos e o dono recebe um e-mail.
- **Esqueci minha senha** com código por e-mail. Trocar a senha encerra todas as sessões abertas.
- **Minha conta**: acessos recentes, quantos aparelhos estão com a conta aberta, sair, sair de todos os aparelhos e trocar o nome usado nos jogos.
- **Aviso para a empresa** (arcadiaaisupport@gmail.com) a cada conta nova. Dá para desligar em `CONFIG.AVISAR_EMPRESA_NOVA_CONTA`.

### Segurança

- A senha nunca sai do aparelho: o site a transforma com PBKDF2 (150 mil rodadas) antes de enviar, e o servidor guarda um hash com sal individual e uma “pimenta” secreta.
- Os códigos valem 10 minutos e aceitam 5 tentativas. Só o hash deles fica guardado.
- As sessões duram 30 dias. Só o hash do token fica guardado.
- “Esqueci minha senha” responde igual para e-mails cadastrados e não cadastrados, para não revelar quem tem conta.

## Jeito rápido: um comando (Windows)

No PowerShell do computador:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/Heitorcoser/arcadia-ia/main/servidor-contas/publicar.ps1 | iex"
```

Ele liga a API do Apps Script, entra na conta da empresa, cria o projeto, envia o `Code.gs`, publica como App da Web, pede a permissão de planilha/e-mail e mostra o link `/exec` (já copiado). Rodar de novo atualiza o mesmo projeto, com o mesmo link. Precisa do Node.js (`winget install OpenJS.NodeJS.LTS`).

## Como publicar (uma vez, uns 5 minutos)

1. Entre no Google com **arcadiaaisupport@gmail.com** e abra <https://script.google.com>.
2. Clique em **Novo projeto** e dê o nome “Arcádia IA · Contas”.
3. Apague o que estiver no editor, cole todo o conteúdo de `Code.gs` e salve (Ctrl+S).
4. No menu de funções lá em cima, escolha **configurar** e clique em **Executar**. O Google vai pedir permissão (planilhas e envio de e-mail): clique em *Revisar permissões* → escolha a conta da empresa → *Avançado* → *Acessar Arcádia IA · Contas (não seguro)* → *Permitir*. O aviso de “não seguro” aparece porque o script é seu e não passou por revisão do Google; é normal.
5. Clique em **Implantar → Nova implantação** → engrenagem → **App da Web**, e preencha:
   - Descrição: `contas`
   - Executar como: **Eu (arcadiaaisupport@gmail.com)**
   - Quem pode acessar: **Qualquer pessoa**
6. Clique em **Implantar** e copie o **URL do app da Web** (termina em `/exec`).
7. Cole esse endereço em `conta.js`, na linha `const URL_SERVIDOR = '';`, faça commit e push. Ou mande o link para o Claude que ele faz isso.

> Sempre que mudar o `Code.gs`, faça **Implantar → Gerenciar implantações → editar (lápis) → Versão: nova versão → Implantar**. Assim o mesmo link continua valendo.

### Opcional: limpeza automática

Em **Acionadores** (ícone de relógio), adicione um acionador para a função `limparVencidos`, “baseado no tempo”, “uma vez por dia”. Ele apaga códigos e sessões vencidos da planilha.

## Limites do Gmail grátis

Uma conta Gmail comum manda até **100 e-mails por dia** pelo Apps Script. Cada cadastro gasta 3 a 4 e-mails (código, boas-vindas, aviso de acesso e aviso para a empresa), e cada login gasta 1 ou 2. Se o site crescer, dá para usar uma conta Google Workspace (1.500 por dia) ou um serviço de e-mail transacional.

## Testar no computador, sem Google

```bash
node servidor-contas/simulador.js
```

O simulador roda o mesmo `Code.gs` com uma planilha em memória e salva cada e-mail como arquivo HTML em `servidor-contas/emails-simulados/`. No site aberto localmente, rode no console do navegador:

```js
localStorage.setItem('arcadia.contasUrl', 'http://127.0.0.1:8790')
```

Para voltar ao servidor de verdade: `localStorage.removeItem('arcadia.contasUrl')`.
