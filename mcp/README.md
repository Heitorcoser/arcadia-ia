# Arcádia Studio · servidor MCP

Liga uma IA (Claude Code, Claude Desktop ou qualquer cliente MCP) ao **Arcádia Studio** aberto no navegador. Com ele a IA cria e edita jogos dentro do Studio: insere partes, escreve scripts em Lua ou JavaScript, testa, lê os erros, tira foto da cena e publica.

```
IA  ⇄ (MCP, stdio)  ⇄  mcp/servidor.js  ⇄ (HTTP 127.0.0.1:47823)  ⇄  Studio no navegador
```

Precisa só do **Node.js 18 ou mais novo**. Não tem dependências para instalar.

## 1. Adicionar ao seu cliente de IA

**Claude Code**

```bash
claude mcp add arcadia-studio -- node "C:/caminho/para/ArcadiaIA/mcp/servidor.js"
```

**Claude Desktop** (`claude_desktop_config.json`)

```json
{ "mcpServers": { "arcadia-studio": { "command": "node", "args": ["C:/caminho/para/ArcadiaIA/mcp/servidor.js"] } } }
```

## 2. Conectar o Studio

Abra o Studio (`studio/index.html`, pela plataforma ou pelo GitHub Pages), clique no botão **MCP** no topo e em **Conectar**. Abrir `studio/index.html?mcp=1` conecta sozinho.

Só uma janela do Studio fica conectada por vez: a que você abriu ou conectou por último assume, e as outras avisam na Saída.

## Ferramentas

| Grupo | Ferramentas |
|---|---|
| Projeto | `estado_do_studio`, `documentacao`, `listar_projetos`, `criar_projeto`, `abrir_projeto`, `salvar`, `desfazer` |
| Jogo 3D | `ver_cena`, `ler_objeto`, `criar_objeto`, `criar_varios`, `editar_objeto`, `apagar_objeto`, `criar_script`, `ler_script`, `inserir_modelo`, `listar_modelos`, `selecionar`, `posicionar_camera` |
| Projeto de arquivos | `listar_arquivos`, `ler_arquivo`, `escrever_arquivo`, `apagar_arquivo`, `definir_entrada` |
| Testar | `jogar`, `parar`, `ler_saida`, `capturar_tela`, `executar_no_studio` |
| Publicar | `publicar`, `link_do_jogo`, `publicar_na_comunidade` |

`publicar_na_comunidade` salva o jogo em `comunidade/<id>.arcadia.json`, a capa em `comunidade/capas/` e atualiza `comunidade/index.json`. Depois de um commit e push, o jogo aparece para todo mundo na aba **Jogos de Players** da plataforma.

## Opções

| | |
|---|---|
| `--porta 47900` ou `ARCADIA_PORTA=47900` | muda a porta da ponte (troque também no botão MCP do Studio) |
| `ARCADIA_COMUNIDADE=C:/outra/pasta` | onde `publicar_na_comunidade` grava os arquivos |

## Testar sem IA

```bash
node mcp/testar.js
```

Sobe o servidor, espera o Studio conectar e chama `estado_do_studio` e `ver_cena`. Também aceita um roteiro: `node mcp/testar.js roteiro.json`, com uma lista de `{ "ferramenta": "...", "args": { ... } }` (e `{ "esperar": 3000 }` para pausar).
