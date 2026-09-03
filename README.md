# Meu HackTown

Planejador pessoal da programação do HackTown 2026 (2–7 set, Santa Rita do Sapucaí).
Uso pessoal, sem login: cada pessoa usa no próprio aparelho e o que ela marca fica
no navegador dela.

No ar: **https://meu-hacktown.pages.dev**

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O app inteiro. É o que você edita. Carrega React por CDN e o JSX é compilado no build. |
| `functions/api/events.js` | Pages Function: busca a programação no Supabase e cacheia no edge. Vira a rota `/api/events`. |
| `build.mjs` | Compila o JSX e escreve `dist/` — o que vai pro ar. |
| `dist/` | Gerado. Nunca editar à mão. |

## Rodar local

```bash
npm install          # só na primeira vez
npm run dev          # wrangler pages dev . → http://127.0.0.1:8788
```

Tem que ser por aqui, não por `python3 -m http.server`: o app pede a programação
pra `/api/events`, e essa rota só existe quando o wrangler está servindo a pasta
`functions/`. Com um servidor estático comum, o app abre e mostra erro de carga.

Nesse modo o `index.html` é servido como está, com o Babel compilando no navegador
— mais lento, mas edita e recarrega sem passo de build.

## Fonte de dados

Supabase público do HackTown, só leitura, chave *publishable* (não é segredo).
Tabela `events` com `status=eq.publicado`, embeds de `venue`, `event_tracks→tracks`
e `event_speakers→speakers`. O `SELECT` completo está em `functions/api/events.js`.

**O app não fala com o Supabase direto.** Ele pede pra `/api/events`, e a Function
faz o resto:

- Busca paginada de 1000 em 1000 (teto de 8 páginas — hoje são ~1.300 atividades,
  e acima de 8.000 truncaria em silêncio).
- Guarda a resposta no cache da Cloudflare por **5 minutos**. Enquanto ela está
  quente, ninguém toca no Supabase, tenha o app 2 ou 2.000 visitantes.
- Guarda também uma **cópia de reserva de 24 h**, usada só se o Supabase falhar.
  Se cair no meio do evento, o app continua servindo a última versão boa em vez de
  mostrar erro pra quem abre pela primeira vez.
- Devolve o header `x-mht-cache: hit | miss | reserva` — dá pra conferir de onde
  veio a resposta sem abrir o painel da Cloudflare.

Sem esse cache, cada abertura do app fazia 2 requisições no backend deles, inclusive
pra mesma pessoa reabrindo pela quinta vez. Era carga na infraestrutura de terceiro,
proporcional ao número de usuários.

A chave está no topo da Function como padrão, pro deploy funcionar sem passo extra.
Pra sobrescrever, definir `SB_KEY` nas variáveis de ambiente do projeto no Cloudflare.

**Pegadinha:** `guarda_chuva` é **booleano**, não string. Tratar como string quebra
o `normalize()` inteiro — por isso a leitura passa por
`typeof r.guarda_chuva==="string" ? … : ""`. Já quebrou uma vez.

## Estrutura do `index.html`

| Faixa | O que é |
|---|---|
| `<style>` | Tokens de cor (claro/escuro), layout mobile, e o bloco desktop em `@media (min-width:960px)` / `1360px` |
| Constantes | Chaves do localStorage, listas de temas e marcas |
| Puras | `norm`, `dLabel`, `temasFor`, `bigBrand`, `heloFor`, `normalize` — sem I/O, sem React |
| `fetchAll` | Único ponto que fala com a rede — hoje é uma linha, pedindo `/api/events` |
| Componentes | `Icon`, `Card`, `FiltersPanel`, `Skeleton`, `App` |

Fluxo de um carregamento: `fetchAll()` → `normalize()` (achata os embeds e deriva
temas/curadoria) → `App` guarda em estado e no cache → `match()` filtra → `groups`
agrupa por horário (aba Programação) ou por dia (Curadoria e Meu cronograma).

## localStorage — leia antes de mexer

```
mht_theme      claro/escuro
mht_saved      ids das atividades marcadas   ← histórico do usuário
mht_notes      anotações por id              ← histórico do usuário
mht_cache_ev   cópia offline da programação  (descartável, rebaixa sozinho)
mht_cache_at   quando o cache foi gravado    (descartável)
```

As duas do meio são o cronograma que a pessoa montou. Três regras:

1. **Nunca renomear essas chaves.** Elas viraram as constantes `K_*` no topo do
   script justamente pra ninguém digitar errado. Trocar uma string apaga o
   cronograma de todo mundo, sem aviso e sem recuperação.
2. **Deploy não apaga nada.** Os dados moram no navegador, não no arquivo
   publicado. Subir versão quebrada e reverter não perde nada.
3. **URL de preview é outra origem.** Cada deploy gera algo como
   `8411869d.meu-hacktown.pages.dev`. Quem marcar atividades por esse link tem o
   histórico preso lá, invisível na URL oficial. Apontar um domínio próprio um dia
   tem o mesmo efeito para todos.

`mht_saved` guarda ids do Supabase: se uma atividade for republicada com id novo,
ela some do "Meu cronograma" sozinha. Não tem como evitar do lado do app.

Esse cache do navegador é **rede de segurança offline, não economia de requisição**:
o app sempre tenta a rede primeiro e só cai nele quando o fetch falha. Quem economiza
requisição é o cache da Function.

## Publicar

Conta Cloudflare **helo-labs** (`helolabs.conteudo@gmail.com`), projeto
`meu-hacktown`. Conferir a conta antes — a máquina alterna entre contas de cliente:

```bash
npx --yes wrangler@latest whoami          # tem que ser helolabs.conteudo@gmail.com
npm run deploy                            # build + wrangler pages deploy dist
```

O deploy sobe a pasta `dist/`, que o build gera com o `index.html` já compilado e a
pasta `functions/` junto. Publicar a raiz do projeto por engano sobe a versão com
Babel e o `node_modules`.

Não existe passo de "regerar os dados": o app puxa do Supabase ao vivo, através da
Function, e se atualiza sozinho conforme a programação muda.

## O build

`npm run build` faz uma coisa só: tira o compilador Babel de dentro do navegador.

O JSX precisa virar JavaScript em algum momento. Antes isso acontecia no aparelho de
cada pessoa, a cada abertura, e custava **617 KB gzip** — 36× o tamanho do app e 13×
o do próprio React. Agora acontece aqui, uma vez, antes de publicar.

O app compilado fica ~13 KB maior que o fonte (JSX vira `React.createElement`), e os
617 KB do compilador somem do carregamento.

O build também é a rede de proteção contra sintaxe: o JSX é compilado só no navegador
em dev, então um `</div>` perdido não aparece até a página abrir em branco. O
`transformSync` do build falha com erro claro antes de qualquer coisa subir — não
existe mais o passo manual de compile-check.

## Limites conhecidos

- A programação pode atrasar até **5 minutos** em relação ao Supabase (TTL do cache).
  Encurtar isso é trocar frescor por carga na infraestrutura do HackTown: o número
  está em `TTL`, no topo da Function.
- O cache da Cloudflare é **por datacenter**, não global. Com público espalhado, o
  Supabase leva algumas requisições a mais do que o TTL sugere — ainda assim, ordens
  de grandeza menos que uma por visitante. Cache único de verdade exigiria Workers KV.
- `fetchAll` na Function para em `MAX_PAGINAS` (8 × 1000 = 8.000 atividades) e
  **trunca em silêncio** se passar disso. Hoje são ~1.300.
- O app baixa a edição inteira e filtra em memória. Tranquilo nessa escala; se um dia
  passar de ~5.000, precisa de paginação no servidor.
- Filtro e busca recalculam sobre todos os eventos a cada tecla, e os cards não são
  memoizados — digitar num dia cheio (318 atividades) engasga no celular.
- PDFs, OCR, login e sincronização entre aparelhos estão fora de escopo por decisão.

## Pendências

- Botão de Filtros na aba **Meu cronograma**: os filtros se aplicam ali mas não há
  como configurá-los, mesmo problema já corrigido na Curadoria.
- Chips de tema (IA, Dev…) seguem aplicados fora da aba Programação sem aparecer lá.
- Memoizar os cards e o filtro, pra parar o engasgo ao digitar em dia cheio.
