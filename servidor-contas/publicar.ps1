# Arcádia IA · publica o servidor de contas no Google Apps Script com um comando.
# Rodar no Windows (PowerShell), logado no computador:
#   powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/Heitorcoser/arcadia-ia/main/servidor-contas/publicar.ps1 | iex"
# Pode rodar de novo quando o Code.gs mudar: atualiza o mesmo projeto e mantém o mesmo link.

# 'Continue': avisos do npm no stderr não podem derrubar o script; os erros são conferidos à mão
$ErrorActionPreference = 'Continue'
$REPO = 'https://raw.githubusercontent.com/Heitorcoser/arcadia-ia/main/servidor-contas'
$CLASP = '@google/clasp@2.4.2'
$PASTA = Join-Path $env:USERPROFILE 'arcadia-contas'

function Passo($n, $t) { Write-Host ''; Write-Host "[$n/6] $t" -ForegroundColor Cyan }
function Clasp { & npx --yes $CLASP @args; if ($LASTEXITCODE -ne 0) { throw "clasp $($args -join ' ') falhou" } }
function Gravar($arq, $txt) { [IO.File]::WriteAllText($arq, $txt, (New-Object Text.UTF8Encoding($false))) }

Write-Host '=== Arcádia IA · servidor de contas ===' -ForegroundColor Yellow

Passo 1 'Conferindo o Node.js'
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Host 'Falta o Node.js. Instale com o comando abaixo, feche e abra o PowerShell e rode este comando de novo:' -ForegroundColor Red
  Write-Host '  winget install OpenJS.NodeJS.LTS'
  return
}
New-Item -ItemType Directory -Force -Path $PASTA | Out-Null
Set-Location $PASTA

Passo 2 'Ligando a API do Apps Script (só precisa uma vez)'
Write-Host 'Vai abrir uma página do Google. Entre com arcadiaaisupport@gmail.com e LIGUE a opção "API do Google Apps Script".'
Start-Process 'https://script.google.com/home/usersettings'
Read-Host 'Depois de ligar, aperte Enter aqui'

Passo 3 'Entrando na conta Google (use arcadiaaisupport@gmail.com)'
try { & npx --yes $CLASP logout *> $null } catch {}
Clasp login

Passo 4 'Criando o projeto e enviando o código'
if (-not (Test-Path '.clasp.json')) { Clasp create --type standalone --title 'Arcadia IA - Contas' --rootDir . }
Invoke-WebRequest -UseBasicParsing "$REPO/Code.gs" -OutFile 'Code.js' -ErrorAction Stop
Gravar 'appsscript.json' @'
{
  "timeZone": "America/Sao_Paulo",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }
}
'@
Clasp push --force

Passo 5 'Publicando como App da Web'
$id = if (Test-Path 'implantacao.txt') { (Get-Content 'implantacao.txt' -Raw).Trim() } else { '' }
$saida = if ($id) { & npx --yes $CLASP deploy -i $id -d contas 2>&1 | Out-String } else { & npx --yes $CLASP deploy -d contas 2>&1 | Out-String }
Write-Host $saida
$m = [regex]::Match($saida, 'AKfyc[\w-]+')
if (-not $m.Success) { throw 'Não consegui ler o ID da implantação na saída acima.' }
$id = $m.Value; Gravar 'implantacao.txt' $id
$URL = "https://script.google.com/macros/s/$id/exec"

Passo 6 'Dando permissão para planilha e e-mail (só precisa uma vez)'
$scriptId = (Get-Content '.clasp.json' -Raw -ErrorAction Stop | ConvertFrom-Json).scriptId
Write-Host 'Vai abrir o editor do script. Lá em cima, escolha a função "configurar" e clique em Executar.'
Write-Host 'Clique em Revisar permissões > escolha arcadiaaisupport@gmail.com > Avançado > Acessar (não seguro) > Permitir.'
Write-Host '(O aviso de "não seguro" é normal: o script é seu e não passou por revisão do Google.)'
Start-Process "https://script.google.com/d/$scriptId/edit"
Read-Host 'Quando aparecer "Execução concluída" no editor, aperte Enter aqui'

try { $r = Invoke-RestMethod $URL; Write-Host "Teste do servidor: $($r | ConvertTo-Json -Compress)" -ForegroundColor Green } catch { Write-Host "Teste do servidor falhou: $($_.Exception.Message)" -ForegroundColor Red }
try { Set-Clipboard $URL } catch {}
Write-Host ''
Write-Host 'PRONTO! Link do servidor de contas (já copiado):' -ForegroundColor Yellow
Write-Host $URL -ForegroundColor Green
Write-Host 'Mande esse link para o Claude ligar as contas no site.'
