# Prompt para o Antigravity — Aplicativo de Vistoria de Cessão de Espaço

Crie um aplicativo web simples, funcional e responsivo para realizar o controle de vistorias de cessão de espaço antes e depois de eventos.

## 1. Objetivo do aplicativo

O aplicativo deverá permitir que uma única equipe registre cada evento, realize uma vistoria inicial antes da ocupação do espaço, anexe fotografias, realize uma vistoria final somente após o encerramento do evento e compare automaticamente as condições encontradas nas duas etapas.

Ao final, o sistema deverá gerar um **Termo de Responsabilidade e Vistoria em PDF**, preenchido automaticamente com os dados do evento, os responsáveis, os itens vistoriados, as observações, as fotos selecionadas e o resultado da comparação entre a vistoria inicial e a final.

O sistema deve priorizar simplicidade, rapidez de preenchimento e facilidade de uso em computador, tablet e celular.

## 2. Premissas importantes

Considere as seguintes regras de negócio:

1. O aplicativo será utilizado por uma única equipe, portanto não é necessário criar múltiplos perfis de usuário ou níveis de permissão nesta primeira versão.
2. Cada evento deverá possuir um único cadastro, contendo a vistoria inicial e a vistoria final.
3. A vistoria inicial será realizada antes do evento e servirá como registro da condição original do espaço.
4. A vistoria final somente poderá ser aberta após o evento. Ela deverá ser comparada com a vistoria inicial para identificar alterações, danos, perdas, sujeira ou qualquer outra diferença.
5. O sistema não terá assinatura digital, assinatura desenhada na tela ou fluxo de autenticação de assinatura. Deve haver apenas campos de nome, cargo ou função, data e hora do responsável pelo preenchimento.
6. O documento final deverá ser gerado em PDF.
7. Os campos, textos, itens e redação dos documentos de referência deverão ser reproduzidos com fidelidade quando forem disponibilizados no projeto. Não invente cláusulas jurídicas ou campos que não estejam no modelo sem sinalizá-los como sugestão.

## 3. Fluxo principal do usuário

### 3.1. Tela inicial — Lista de eventos

Criar uma tela inicial com:

- Nome do aplicativo no topo: “Vistoria de Cessão de Espaço”.
- Botão destacado “Novo evento”.
- Lista ou tabela dos eventos cadastrados.
- Busca por nome do evento, espaço, contratante ou número do evento.
- Filtros por status: “Rascunho”, “Vistoria inicial preenchida”, “Evento em andamento”, “Aguardando vistoria final”, “Concluído” e “PDF gerado”.
- Exibição da data do evento, espaço utilizado, responsável e status.
- Ações rápidas: abrir, editar, duplicar, gerar PDF e arquivar.

A interface deve apresentar mensagens claras e evitar excesso de elementos visuais.

### 3.2. Cadastro do evento

Criar um formulário para registrar os dados gerais do evento, com os campos encontrados nos modelos de referência. Caso algum campo não esteja disponível no modelo, utilizar os seguintes campos-base:

- Número ou código do evento.
- Nome do evento.
- Tipo de evento.
- Nome do contratante ou empresa responsável.
- CNPJ ou CPF, se aplicável.
- Nome do responsável pelo evento.
- Telefone e e-mail do responsável.
- Espaço ou ambiente cedido.
- Endereço ou identificação do local.
- Data de início do evento.
- Data e hora previstas para início e término.
- Data e hora reais de encerramento, preenchidas na etapa final.
- Observações gerais.

Após salvar o evento, mostrar uma página de detalhes com duas etapas claramente separadas:

1. **Vistoria inicial — antes do evento**.
2. **Vistoria final — após o evento**.

A vistoria final deve aparecer bloqueada até que a vistoria inicial seja salva ou marcada como concluída.

## 4. Vistoria inicial

Criar um formulário de vistoria inicial baseado fielmente na ficha de referência fornecida pelo usuário.

A ficha deve permitir avaliar todos os ambientes, equipamentos, móveis, estruturas e itens existentes no modelo. Para cada item, utilizar uma estrutura flexível com:

- Nome ou descrição do item.
- Ambiente ou localização.
- Situação ou estado de conservação.
- Campo de observações.
- Quantidade, quando aplicável.
- Campo para indicar se o item foi conferido.
- Possibilidade de marcar o item como “Conforme”, “Com ressalva”, “Não conforme” ou “Não se aplica”, caso essa classificação seja compatível com o modelo.
- Possibilidade de adicionar uma ou mais fotos específicas do item.

Permitir também incluir itens personalizados, caso a equipe encontre algo que não esteja previamente cadastrado.

No fim da vistoria inicial, incluir:

- Observações gerais da condição do espaço.
- Nome do responsável pelo preenchimento.
- Cargo ou função.
- Data e hora do preenchimento, preenchidas automaticamente, mas editáveis se necessário.
- Campo de confirmação: “Vistoria inicial concluída”.

Ao concluir a vistoria inicial, salvar um retrato imutável da condição inicial, mantendo histórico de alterações. Se houver edição posterior, solicitar confirmação e registrar data e responsável pela alteração.

## 5. Registro de fotografias

Criar um componente simples para anexar fotografias por meio da câmera do celular ou do armazenamento do dispositivo.

Para cada foto, armazenar:

- Imagem original.
- Etapa da vistoria: inicial ou final.
- Item ou ambiente relacionado.
- Legenda opcional.
- Data e hora do registro.
- Responsável pelo envio.

Permitir visualizar a foto, substituir, excluir antes da conclusão da vistoria e reorganizar a ordem das fotos.

Na geração do PDF, incluir as fotos de forma organizada, com legenda, identificação do ambiente ou item e indicação da etapa da vistoria. Se houver muitas fotos, criar uma seção de anexos fotográficos no final do PDF, evitando que o documento fique visualmente confuso.

## 6. Vistoria final após o evento

Criar a vistoria final utilizando exatamente a mesma estrutura de itens da vistoria inicial para permitir comparação direta.

A vistoria final deverá ficar indisponível até que o evento tenha chegado ao momento posterior ao encerramento. Para simplificar a primeira versão, permitir que a equipe clique em “Liberar vistoria final” e informe ou confirme a data e hora de encerramento do evento.

Na vistoria final, exibir lado a lado ou em sequência comparável:

| Informação | Vistoria inicial | Vistoria final |
|---|---|---|
| Situação do item | Condição registrada antes do evento | Condição encontrada após o evento |
| Observações | Registro inicial | Registro final |
| Fotografias | Fotos antes do evento | Fotos depois do evento |

Para cada item, calcular e exibir automaticamente o resultado da comparação:

- “Sem alteração identificada”.
- “Alteração identificada”.
- “Dano identificado”.
- “Item ausente ou não localizado”.
- “Melhoria ou ajuste realizado”.
- “Não foi possível comparar”.

A equipe deve poder revisar ou corrigir manualmente o resultado, sempre com campo obrigatório de justificativa quando o resultado for “Alteração identificada”, “Dano identificado” ou “Item ausente ou não localizado”.

No encerramento da vistoria final, incluir:

- Resumo automático das diferenças encontradas.
- Observações gerais após o evento.
- Lista de pendências ou providências necessárias.
- Indicação se o espaço foi devolvido conforme, com ressalvas ou não conforme.
- Nome do responsável pelo preenchimento.
- Cargo ou função.
- Data e hora do preenchimento.
- Botão “Concluir vistoria final”.

## 7. Geração automática do termo em PDF

Após a conclusão da vistoria final, disponibilizar o botão “Gerar Termo de Responsabilidade e Vistoria”.

O sistema deverá preencher automaticamente o documento utilizando o modelo de termo fornecido pelo usuário, preservando sua estrutura, títulos, redação e ordem das informações.

O PDF deverá conter, conforme aplicável ao modelo:

- Identificação do evento.
- Identificação do espaço cedido.
- Dados do contratante e dos responsáveis.
- Data e período de utilização.
- Declarações e responsabilidades previstas no modelo.
- Resumo da vistoria inicial.
- Resumo da vistoria final.
- Tabela de comparação entre as duas vistorias.
- Relação de alterações, danos, perdas ou pendências.
- Observações gerais.
- Identificação dos responsáveis pelo preenchimento.
- Data e hora de emissão.
- Fotografias e anexos fotográficos.

O PDF deve possuir boa paginação, cabeçalho, rodapé, numeração de páginas, campos legíveis e quebra automática de tabelas e imagens. Fotos muito grandes devem ser redimensionadas sem perder legibilidade.

Como não haverá assinatura digital, não inserir campos de assinatura eletrônica. Se o modelo possuir uma área de assinatura, manter apenas o espaço destinado à assinatura física, acompanhado do nome, cargo e data, sem simular uma assinatura.

Após a geração, permitir:

- Visualizar o PDF.
- Baixar o PDF.
- Gerar novamente após uma alteração autorizada.
- Identificar no histórico a data e hora da geração.

## 8. Histórico e status

Cada evento deverá apresentar uma linha do tempo simples com:

- Evento criado.
- Cadastro geral concluído.
- Vistoria inicial iniciada e concluída.
- Vistoria final liberada.
- Vistoria final iniciada e concluída.
- PDF gerado.
- Alterações relevantes realizadas.

Exibir status visualmente, mas sem depender apenas de cores. Usar também texto e ícones acessíveis.

## 9. Requisitos de usabilidade

A experiência deve ser simples para uma equipe que realiza vistorias em campo. O formulário deve permitir salvar como rascunho a qualquer momento, evitar perda de dados e exibir uma barra de progresso ou indicação da etapa atual.

O sistema deve funcionar bem em telas pequenas. Os botões devem ser grandes o suficiente para uso em celular. O upload de fotos deve aceitar câmera e galeria. Campos obrigatórios devem ser claramente identificados e validados antes da conclusão de cada etapa.

Sempre que houver risco de perda de dados, exibir confirmação. Não apagar um evento ou uma vistoria definitivamente sem confirmação explícita.

## 10. Estrutura de dados sugerida

Criar entidades equivalentes às seguintes:

| Entidade | Conteúdo principal |
|---|---|
| Evento | Identificação, contratante, espaço, datas, responsáveis e status |
| Vistoria | Evento, tipo inicial/final, status, observações, responsável e datas |
| Item de vistoria | Descrição, ambiente, quantidade, situação, observações e resultado |
| Foto | Arquivo, etapa, item, ambiente, legenda, data e ordem |
| Comparação | Item, situação inicial, situação final, resultado e justificativa |
| Documento | Evento, tipo, versão, arquivo PDF, data de geração e histórico |

Use uma estrutura que mantenha a vistoria inicial preservada para comparação, sem sobrescrever seus dados quando a vistoria final for preenchida.

## 11. Validações obrigatórias

O aplicativo deverá impedir a conclusão da vistoria inicial sem os campos essenciais do modelo preenchidos.

O aplicativo deverá impedir a abertura da vistoria final antes da conclusão da vistoria inicial.

O aplicativo deverá impedir a conclusão da vistoria final se houver itens sem avaliação, salvo quando a equipe selecionar explicitamente “Não se aplica” ou justificar a ausência de informação.

Para cada dano, alteração ou item ausente, exigir observação ou justificativa.

O PDF somente poderá ser gerado depois da conclusão da vistoria final, a menos que exista uma ação separada para gerar um relatório preliminar claramente identificado como “Rascunho”.

## 12. Interface visual

Utilize uma interface profissional, limpa e objetiva, com aparência de sistema operacional de campo. Preferir fundo claro, alto contraste, tipografia legível, cards para etapas, tabelas responsivas e destaque visual para pendências.

A tela de detalhes do evento deve ser o centro da aplicação. Nela, a equipe deve conseguir consultar os dados do evento, abrir a vistoria inicial, liberar a vistoria final, visualizar o comparativo, consultar as fotos e gerar o PDF.

Não criar funcionalidades complexas que não sejam necessárias, como chat, pagamentos, assinatura digital, múltiplas organizações, gestão financeira ou agenda avançada.

## 13. Dados de demonstração

Criar dados fictícios de demonstração para que seja possível testar o fluxo completo. Usar um evento fictício, alguns ambientes, itens com condições diferentes e fotos de exemplo ou placeholders claramente identificados como demonstração.

O usuário deve conseguir testar o seguinte cenário:

1. Criar um evento.
2. Preencher e concluir a vistoria inicial.
3. Liberar a vistoria final após o evento.
4. Registrar uma alteração em um item, um dano em outro e nenhum problema nos demais.
5. Adicionar fotos nas duas etapas.
6. Concluir a vistoria final.
7. Gerar e baixar o termo final em PDF.

## 14. Critérios de aceite

Considere o aplicativo concluído somente quando:

- For possível cadastrar e consultar eventos.
- For possível preencher a vistoria inicial e salvá-la como referência.
- A vistoria final estiver bloqueada até a conclusão da inicial.
- For possível adicionar fotos em ambas as etapas.
- A mesma lista de itens puder ser comparada antes e depois do evento.
- O sistema identificar e exibir diferenças entre as duas etapas.
- For possível registrar observações e pendências.
- O termo for preenchido automaticamente com os dados cadastrados.
- O PDF for gerado com boa formatação e anexos fotográficos.
- O fluxo funcionar em computador e celular.
- Os dados não forem perdidos ao sair ou atualizar a página.
- O usuário conseguir entender claramente em que etapa do processo está.

## 15. Tratamento dos documentos de referência

Os dois documentos fornecidos pelo usuário são a fonte principal para os campos e textos oficiais:

- Ficha de vistoria inicial e final: https://docs.google.com/document/d/1WqpV_bnTWcUvzOSSZrVoVvgEQSlZcKd9ONpNt9f_2tE/edit?tab=t.0
- Termo de responsabilidade e vistoria: https://docs.google.com/document/d/1tQqGO6VEM7MAfcZoIvVDdQiD62TvxaeqL7QPswHBa7Q/edit?tab=t.0#heading=h.k1vys1u99w11

Se os documentos estiverem acessíveis no ambiente de desenvolvimento, leia-os e reproduza os campos, títulos, tabelas e textos com fidelidade. Caso não estejam acessíveis, implemente a estrutura-base descrita neste prompt e deixe os campos do modelo organizados para substituição posterior, sem criar conteúdo jurídico novo.

Antes de finalizar, explique quais campos foram reproduzidos dos documentos e quais foram criados como campos provisórios ou sugestões de estrutura.

## 16. Entrega esperada

Entregue um MVP funcional, simples e visualmente organizado. Priorize o fluxo completo de ponta a ponta em vez de adicionar funcionalidades secundárias.

Ao finalizar, apresente:

1. O fluxo implementado.
2. A estrutura de dados utilizada.
3. As validações aplicadas.
4. O local onde o modelo da ficha pode ser ajustado.
5. O local onde o modelo do termo em PDF pode ser ajustado.
6. As limitações conhecidas e os próximos passos recomendados.

Não finalize apenas com telas estáticas. Todas as ações principais — cadastro, salvamento, fotos, comparação, conclusão e geração do PDF — devem funcionar no MVP.

---

## Observação para o usuário

Este prompt já incorpora as decisões confirmadas: **uma única equipe**, **vistoria inicial e final no mesmo evento**, **vistoria final somente após o evento**, **geração em PDF** e **ausência de assinatura digital**. Para reproduzir fielmente os modelos, ainda será necessário disponibilizar os documentos com acesso de leitura ou enviar os arquivos em PDF/DOCX, pois os links atuais exigem login do Google.
