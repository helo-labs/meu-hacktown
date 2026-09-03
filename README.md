# Meu HackTown

Um planejador pessoal para o **HackTown 2026**, criado para transformar uma programação de mais de 1.300 atividades em um cronograma que realmente faça sentido para mim.

O app combina **busca, filtros, curadoria personalizada, anotações e planejamento por dia** e o principal: permite compartilhar a seleção com outras pessoas por meio de imagens. Tudo isso em uma aplicação simples, leve e capaz de funcionar mesmo com a internet instável típica de eventos.

**→ [meu-hacktown.pages.dev](https://meu-hacktown.pages.dev)**

## Contexto

O HackTown tem uma programação enorme, distribuída por vários dias e locais. Para quem quer participar de forma intencional, o problema deixa de ser **encontrar atividades** (pois isso é o que não falta) e passa a ser decidir o que vale a pena priorizar em meio a tantas atrações variadas.

Eu queria um lugar para montar essa seleção, fazer anotações e consultar meu cronograma durante o evento. Também queria algo que pudesse ser facilmente compartilhado com os colegas, em vez de depender de prints ou listas enviadas no grupo.

Foi daí que surgiu o **Meu HackTown**.

Além dos filtros oficiais do evento, criei uma camada de **curadoria própria**, organizada em temas como **IA, Desenvolvimento, Automação, Segurança, Empreendedorismo, Liderança, Design e Networking**. Os filtros para essa curadoria foram definidos com ajuda do Claude e aplicados ao conteúdo das atividades, buscando refletir meus interesses e áreas de atuação.

## Recursos

* **Programação por dia**, com busca tolerante a acentos (`sessao` encontra `Sessão`)
* **Filtros por tema**, além dos filtros oficiais de trilha, formato e local
* **Curadoria personalizada**, com destaques baseados no conteúdo das atividades e nos palestrantes
* **Favoritar (★) e anotar** atividades diretamente no navegador
* **Meu cronograma**, reunindo apenas as atividades selecionadas e agrupando-as por dia
* **Compartilhamento em PNG**, gerando uma imagem do cronograma do dia para enviar para colegas ou salvar na galeria
* **Funcionamento offline**, mantendo a última programação carregada em cache para uso sem conexão
* **Tema claro e escuro**, acompanhando a preferência do sistema (esse foi só pra fazer charme)

## Funcionamento

O projeto foi deliberadamente mantido pequeno: **um único arquivo HTML** com o app inteiro dentro.

```text
index.html                 ~55 KB — estilos, componentes React e lógica
functions/api/events.js     ~3 KB — busca a programação e guarda em cache
build.mjs                          compila o JSX antes de publicar
```

React é carregado por CDN. O JSX era compilado no próprio navegador de quem usava o app, o que tornava o projeto extremamente simples de editar, publicar e transportar, inclusive pelo celular — mas cobrava caro no carregamento (ver [Limites conhecidos](#limites-conhecidos)). Hoje essa compilação acontece uma vez, antes de publicar. Durante o desenvolvimento o Babel continua trabalhando no navegador, então editar segue sendo abrir o arquivo, salvar e recarregar.

Os dados vêm da API pública utilizada pelo HackTown. O processamento acontece inteiramente no cliente:

```text
fetchAll() → normalize() → filtros → agrupamento → render
     ↓            ↓
/api/events   normalização,
     ↓        temas e curadoria
  Supabase
```

O `normalize()` transforma a estrutura retornada pela API em um formato mais simples para a aplicação e também deriva os temas e informações utilizadas pela curadoria.

As atividades favoritedas e as anotações são armazenadas no `localStorage`.

Optei por não criar contas ou sincronização entre dispositivos porque o objetivo inicial era resolver um problema pessoal e compartilhar o resultado com apenas alguns colegas. Adicionar autenticação e um backend próprio aumentaria bastante a complexidade sem resolver uma necessidade real do MVP.

### Offline

A programação é baixada e armazenada em cache no navegador. Se o usuário estiver sem conexão, o aplicativo tenta utilizar essa última versão disponível e informa que está trabalhando com dados em cache.

Isso é especialmente importante para o contexto do projeto: **um app de programação de evento precisa continuar útil justamente quando a rede do evento está ruim.** As imagens compartilhaveis das atividades escolhidas também ajudam nisso.


### Sobre a chave do Supabase / API propría do hacktown

A chave presente no código é uma `sb_publishable_…`, destinada ao uso no cliente. Ela não funciona como uma senha administrativa ou como uma credencial privada.

O aplicativo utiliza o mesmo endpoint público de leitura disponibilizado para a programação do evento e não tenta contornar as regras de acesso do servidor.

A chave foi mantida no repositório para que o projeto continue funcionando após ser clonado. Caso a organização do HackTown prefira que ela seja removida, posso alterar a implementação.

Desde 03/09 o app também deixou de consultar o endpoint deles a cada abertura. A leitura passa por uma rota própria, `/api/events`, que busca a programação e a guarda em cache por 5 minutos — o número de requisições ao servidor do evento deixou de crescer junto com o número de pessoas usando o app. A chave passou a ficar nessa rota, fora do arquivo que vai para o navegador.

## Rodar localmente

```bash
git clone https://github.com/helo-labs/meu-hacktown.git
cd meu-hacktown
npm install
npm run dev
```

Depois, abra `http://localhost:8788`.

Um servidor estático simples não basta mais: a programação é servida por `/api/events`, que só existe quando o `wrangler` está rodando. Com `python3 -m http.server`, o app abre sem dados.

## Limites conhecidos

O projeto também tem algumas limitações conhecidas:

* **Babel no navegador:** representava cerca de 617 KB comprimidos, contra ~17 KB do app e ~46 KB do React. Era o maior custo do carregamento. -- resolvido 03/09: o JSX passou a ser compilado antes de publicar, e o compilador saiu do que chega ao navegador. O preço foi aceitar um passo de build, que o projeto evitava até então.
* **Atraso da programação:** a resposta fica 5 minutos em cache, então uma alteração feita pela organização pode levar esse tempo até aparecer no app.
* **Busca:** atualmente recalcula os resultados sobre todas as atividades a cada tecla e os cards não são memoizados. Em dias com muitas atividades, isso pode causar pequenos delays em celulares.
* **Dados:** a edição inteira é baixada e filtrada em memória. Funciona bem na escala atual, mas uma programação muito maior exigiria paginação ou processamento no servidor.
* **Paginação:** o carregamento possui um limite de 8.000 atividades (contra as ~1300 do evento, não há problemas).
* **Filtros:** nas abas **Curadoria** e **Meu cronograma**, os filtros de tema continuam ativos mesmo quando não estão visíveis na interface. -- resolvido 02/09

Esses pontos são conhecidos e fazem parte das decisões e trade-offs deste projeto, não bugs desconhecidos.

## Sobre

Feito  para uso próprio durante o HackTown 2026.

**Este projeto não possui vínculo com a organização do evento.**

Se você vai ao HackTown, fique à vontade para usar: [meu-hacktown.pages.dev](https://meu-hacktown.pages.dev).

Se quiser adaptar a ideia para outro evento, o principal ponto de integração é o `normalize()`: basta adaptar a consulta e o mapeamento dos dados para que o restante da aplicação continue funcionando.

O código pode ser usado, copiado e adaptado livremente. Os dados da programação das atividades do evento pertencem ao HackTown.
