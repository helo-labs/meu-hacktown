# Meu HackTown

Um planejador pessoal para a programação do **HackTown 2026** — 1.255 atividades,
seis dias, cinco pontos da cidade. Feito para caber no bolso e funcionar com a
internet ruim de evento.

**→ [meu-hacktown.pages.dev](https://meu-hacktown.pages.dev)**

<p align="center">
  <img src="docs/img/mobile-programacao.png" width="270" alt="Lista da programação por dia">
  <img src="docs/img/mobile-curadoria.png" width="270" alt="Aba de curadoria com destaques">
  <img src="docs/img/carregando.png" width="270" alt="Tela de carregamento com esqueleto">
</p>

## Por que eu fiz isso

A ideia surgiu de uma dificuldade prática: com mais de mil atividades espalhadas por
seis dias e cinco locais, ficou difícil organizar **quais eu queria priorizar**. Eu
precisava de um lugar para decidir e guardar a minha seleção — e de algo
**compartilhável com os colegas** que também vão ao evento, em vez de mandar print de
lista no grupo.

Os filtros por tema (IA, Dev, Automação, Segurança, Empreender, Liderança, Design,
Networking) eu montei **com ajuda do Claude**, para que ficassem direcionados aos meus
interesses e áreas de atuação, em vez de seguir só as trilhas oficiais do evento.

O site está publicado e no ar em **[meu-hacktown.pages.dev](https://meu-hacktown.pages.dev)**
— é o link que eu compartilho com quem quiser usar.

## O que ele faz

- **Programação por dia**, com busca que ignora acento (`sessao` acha `Sessão`)
- **Filtros por tema** — IA, Dev, Automação, Segurança, Empreender, Liderança,
  Design, Networking — derivados do conteúdo, além dos filtros oficiais de trilha,
  formato e local
- **Curadoria**: uma camada minha de destaques, incluindo um detector de palestrantes
  de empresas grandes lido do cargo de quem fala
- **Marcar (★) e anotar** cada atividade, salvos no navegador
- **Meu cronograma**: só o que você marcou, agrupado por dia
- **Baixar a imagem do dia** em PNG, para mandar no grupo ou deixar salvo na galeria
- **Offline**: a última programação baixada fica em cache; sem rede, o app abre com
  ela e avisa
- Tema claro e escuro, acompanhando o sistema

<p align="center">
  <img src="docs/img/desktop.png" width="700" alt="Versão desktop com barra lateral">
</p>

## Como funciona

É **um arquivo HTML**. Sem build, sem bundler, sem `node_modules`. Abre e roda.

```
index.html    ~57 KB — estilos, componentes React e lógica
```

React e Babel entram por CDN e o JSX é compilado no próprio navegador. É uma escolha
deliberada, com um custo real que está honestamente listado lá embaixo: em troca, o
projeto inteiro é um arquivo que eu edito no celular se precisar, publico arrastando,
e que não apodrece quando uma dependência muda de versão.

Os dados vêm da API pública do HackTown. O fluxo é curto:

```
fetchAll()  →  normalize()  →  filtros  →  agrupamento  →  render
   ↓              ↓
 Supabase    achata os embeds e deriva
 (1 request   temas + curadoria de cada
  paginado)   atividade
```

Tudo que você marca fica no `localStorage` do seu aparelho. A escolha foi por
**simplicidade durante o desenvolvimento**: é um projeto pequeno, feito a princípio só
para mim e alguns colegas, e sincronizar entre aparelhos exigiria login, banco e
servidor para resolver um problema que eu não tenho. Sem conta, sem servidor meu — o
que você anota não sai do seu navegador.

### Sobre a chave do Supabase que está no código

Ela está ali à vista, e isso é esperado: `sb_publishable_…` é uma **publishable key**
do Supabase, o tipo de chave feito para ir no código do cliente. É exatamente a mesma
chave que o site oficial do HackTown entrega para o navegador de qualquer pessoa que
acessa a programação — quem protege os dados é o Row Level Security no servidor deles,
não o segredo da chave.

Ou seja: **não é credencial vazada, e este projeto não contorna proteção nenhuma.**
Ele lê o mesmo endpoint público de leitura que o site oficial lê, só que com uma
interface que serve pro meu uso. Deixei a chave no arquivo para o projeto rodar ao
clonar; se o HackTown preferir que eu tire, é só me avisar.

## Rodar local

```bash
git clone https://github.com/helo-labs/meu-hacktown.git
cd meu-hacktown
python3 -m http.server 8000
# abre http://localhost:8000
```

Precisa ser por HTTP. Abrir o arquivo direto com `file://` não funciona — a origem
`null` é barrada pelo CORS e o app abre vazio.

## Limites conhecidos

Coisas que eu sei que estão erradas ou pendentes, medidas e não chutadas:

- **O Babel no navegador custa 617 KB comprimidos**, contra 17 KB do app e 46 KB do
  React. É de longe o item mais pesado do carregamento, e some se o JSX for
  precompilado no deploy. Adiado de propósito — resolver exige introduzir um passo de
  build, que é justamente o que este projeto não tem.
- A busca recalcula sobre as 1.255 atividades a cada tecla e os cards não são
  memoizados. Num dia cheio (328 atividades) a digitação engasga no celular.
- O app baixa a edição inteira e filtra na memória. Tranquilo nessa escala; acima de
  ~5.000 atividades precisaria de paginação no servidor.
- A paginação para em 8.000 atividades e **trunca em silêncio** se passar disso.
- Nas abas Curadoria e Meu cronograma os filtros de tema continuam valendo sem
  aparecer na tela.

## Sobre

Feito por [@helo-labs](https://github.com/helo-labs), estudante de Ciência da
Computação na UNIFAL-MG, para uso próprio no HackTown 2026. Sem vínculo com a
organização do evento.

Se você vai ao HackTown e quiser usar, fique à vontade — é só abrir o link. E se
quiser adaptar para outro evento, o pedaço que importa é o `normalize()`: troque o
`SELECT` e o mapeamento e o resto continua de pé.

Não reivindico direito nenhum sobre isto: use, copie e adapte como quiser. Os dados da
programação são do HackTown, não meus.
