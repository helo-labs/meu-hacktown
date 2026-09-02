# Meu HackTown

Um planejador pessoal para o **HackTown 2026**, criado para transformar uma programação de mais de 1.000 atividades em um cronograma que realmente faça sentido para mim.

O app combina **busca, filtros, curadoria personalizada, anotações e planejamento por dia** e o principal: permite compartilhar a seleção com outras pessoas por meio de imagens. Tudo isso em uma aplicação simples, leve e capaz de funcionar mesmo com a internet instável típica de eventos.

**→ [meu-hacktown.pages.dev](https://meu-hacktown.pages.dev)**

<p align="center">
  <img src="docs/img/mobile-programacao.png" width="270" alt="Lista da programação por dia">
  <img src="docs/img/mobile-curadoria.png" width="270" alt="Aba de curadoria com destaques">
  <img src="docs/img/carregando.png" width="270" alt="Tela de carregamento com esqueleto">
</p>

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

<p align="center">
  <img src="docs/img/desktop.png" width="700" alt="Versão desktop com barra lateral">
</p>

## Funcionamento

O projeto foi deliberadamente mantido pequeno: **um único arquivo HTML**, sem build, bundler ou `node_modules`.

```text
index.html    ~57 KB — estilos, componentes React e lógica
```

React e Babel são carregados por CDN, e o JSX é compilado no próprio navegador. Isso não é a solução mais performática possível, mas tornou o projeto extremamente simples de editar, publicar e transportar, inclusive pelo celular.

Os dados vêm da API pública utilizada pelo HackTown. O processamento acontece inteiramente no cliente:

```text
fetchAll() → normalize() → filtros → agrupamento → render
     ↓            ↓
  Supabase    normalização,
              temas e curadoria
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

## Rodar localmente

```bash
git clone https://github.com/helo-labs/meu-hacktown.git
cd meu-hacktown
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000`.

O projeto precisa ser servido por HTTP. Abrir o `index.html` diretamente com `file://` não funciona porque a origem `null` é bloqueada pelo CORS da API.

## Limites conhecidos

O projeto também tem algumas limitações conhecidas:

* **Babel no navegador:** representa cerca de 617 KB comprimidos, contra ~17 KB do app e ~46 KB do React. É o maior custo do carregamento. Precompilar o JSX resolveria isso, mas exigiria introduzir justamente o processo de build que o projeto busca evitar.
* **Busca:** atualmente recalcula os resultados sobre todas as atividades a cada tecla e os cards não são memoizados. Em dias com muitas atividades, isso pode causar pequenos delays em celulares.
* **Dados:** a edição inteira é baixada e filtrada em memória. Funciona bem na escala atual, mas uma programação muito maior exigiria paginação ou processamento no servidor.
* **Paginação:** o carregamento possui um limite de 8.000 atividades (contra as ~1200 do evento, não há problemas).
* **Filtros:** nas abas **Curadoria** e **Meu cronograma**, os filtros de tema continuam ativos mesmo quando não estão visíveis na interface. -- resolvido 02/09

Esses pontos são conhecidos e fazem parte das decisões e trade-offs deste projeto, não bugs desconhecidos.

## Sobre

Feito  para uso próprio durante o HackTown 2026.

**Este projeto não possui vínculo com a organização do evento.**

Se você vai ao HackTown, fique à vontade para usar: [meu-hacktown.pages.dev](https://meu-hacktown.pages.dev).

Se quiser adaptar a ideia para outro evento, o principal ponto de integração é o `normalize()`: basta adaptar a consulta e o mapeamento dos dados para que o restante da aplicação continue funcionando.

O código pode ser usado, copiado e adaptado livremente. Os dados da programação pertencem ao HackTown.
