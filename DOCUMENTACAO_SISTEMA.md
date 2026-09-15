# SEDE Vistorias — Sistema de Vistoria de Cessão de Espaço Público
### Prefeitura Municipal de Campina Grande — Secretaria de Desenvolvimento Econômico (SEDE)

---

## 📖 1. Visão Geral do Sistema

O **SEDE Vistorias** é uma plataforma web progressiva (PWA) desenvolvida especialmente para a **Secretaria de Desenvolvimento Econômico de Campina Grande (SEDE)** para realizar o controle, fiscalização e registro formal da cessão de espaços públicos municipais — com ênfase no **Parque do Povo** (Pirâmide, Parte Superior, Parte Inferior, sanitários e anexos) e outros locais públicos cedidos para eventos culturais, esportivos, religiosos e comerciais.

### Objetivos Principais
1. **Garantir a preservação do patrimônio público municipal:** Assegurar que os bens públicos sejam entregues e devolvidos em condições ideais.
2. **Comparativo Transparente (Antes vs. Depois):** Rastrear com rigor qualquer avaria nova, extravio, sujeira residual ou alteração ocorrida durante o período da cessão.
3. **Laudos Oficiais com Validade Administrativa:** Gerar instantaneamente Termos de Entrega e Devolução em PDF institucional com brasão/logomarca, detalhamento item a item, relatório fotográfico e campo para assinaturas do Fiscal da SEDE e do Cessionário.
4. **Operação em Campo (Offline-First) & Nuvem (Firebase):** O fiscal pode realizar a vistoria em campo sem sinal de internet; os dados são salvos localmente e sincronizados em tempo real com o banco de dados Firebase Firestore e Google Drive/Sheets assim que a conexão estiver disponível.

---

## ☁️ 2. Arquitetura do Banco de Dados e Sincronização

| Componente | Tecnologia | Função no Sistema |
| :--- | :--- | :--- |
| **Banco Central em Nuvem** | **Firebase Firestore** | Persistência definitiva de todos os eventos, vistorias, itens de checklist, fotos e histórico. Sincronização bidirecional em tempo real entre dispositivos. |
| **Cache Local Resiliente** | **Dexie / IndexedDB** | Permite funcionamento completo sem internet (*offline-first*), carregamento ultrarrápido e reatividade instantânea na interface. |
| **Integração Externa** | **Google Sheets & Drive** | Espelhamento de cadastros em planilha institucional da prefeitura e backup dos termos em PDF e fotos na nuvem. |
| **Segurança e Auditoria** | **Firestore Rules & Audit Log** | Regras de segurança em nuvem e histórico imutável de todas as ações executadas no sistema. |

---

## 📱 3. Análise Detalhada das Telas e Funcionalidades

### 3.1. Tela Inicial — Lista de Cessões de Espaço
* **Acesso:** Rota principal (`/`).
* **Elementos e Recursos:**
  * **Barra de Ferramentas Superior:** Logomarca oficial, indicador de conexão com Firebase Firestore (`Nuvem: Conectada` / `🟢`), botão de sincronização com Google Sheets, configuração do Google Drive e botão `+ Nova Cessão`.
  * **Campo de Busca:** Filtra por número de processo/protocolo, nome do evento, local ou cessionário em tempo real.
  * **Filtros Rápidos por Status:**
    * `Todos`: Exibe o total de eventos cadastrados.
    * `Inicial Pendente`: Eventos cadastrados que ainda não tiveram o Termo de Entrega concluído.
    * `Aguardando Final`: Eventos com vistoria inicial concluída, aguardando o encerramento do evento e desmontagem para a vistoria final.
    * `Concluídos (PDF)`: Eventos com vistoria final finalizada e laudo liberado.
  * **Cartões de Evento:** Exibem o número do processo (ex: `PA-2026/4412-SEDE`), status colorido com ícone, datas de realização, cessionário, local e atalhos rápidos para editar, duplicar, excluir ou abrir o fluxo de vistoria.

---

### 3.2. Modal de Cadastro / Edição da Cessão
* **Acionamento:** Botão `Nova Cessão` ou ícone de lápis (`Editar`) no cartão do evento.
* **Campos Padronizados da SEDE:**
  1. **Identificação Administrativa:** Número de Processo / Protocolo Administrativo (ex: `PA-2026/8921-SEDE`), Código interno e Nome do Evento.
  2. **Dados do Cessionário:** Nome / Razão Social, CNPJ ou CPF, Nome do Representante Legal e CPF do Representante.
  3. **Contatos Operacionais:** Responsável no local do evento, telefone WhatsApp e e-mail.
  4. **Definição das Áreas Cedidas (Parque do Povo):**
     * Seleção visual por chips das áreas: *Parte Superior*, *Pirâmide*, *Parte Inferior*.
     * Sanitários disponibilizados: *Sanitários Superior*, *Sanitários Pirâmide*.
     * O sistema compõe automaticamente a descrição oficial do espaço cedido.
  5. **Período e Prazos:** Data de Início, Horário de Previsão de Início, Horário de Previsão de Fim, Período de Montagem e Período de Desmontagem.
  6. **Observações Gerais:** Campo livre para anotações contratuais ou restrições de uso.

---

### 3.3. Tela de Detalhes da Cessão & Stepper Temporal
* **Acionamento:** Clique no cartão do evento na lista inicial.
* **Componentes da Tela:**
  * **Cabeçalho de Controle:** Botão voltar, dados essenciais do processo, atalho de edição cadastral, sincronização direta com o Google Drive e botões de emissão imediata do **Termo de Entrega (Inicial)** e do **Laudo Completo (Final)**.
  * **Linha do Tempo Visual (Stepper):** Indica o progresso do processo em 4 etapas claras:
    1. *Cessão Cadastrada* (Concluído)
    2. *Vistoria Inicial* (Pendente ou Concluída)
    3. *Realização do Evento* (Em andamento)
    4. *Vistoria Final & Termo* (Aguardando ou Concluída)
  * **Ficha Resumo:** Quadro compacto com dados do cessionário, representante, local e período de utilização.
  * **Abas de Navegação:**
    * **Aba 1: Vistoria Inicial (Entrega do Espaço)**
    * **Aba 2: Vistoria Final (Devolução do Espaço)**
    * **Aba 3: Galeria de Fotos**
    * **Aba 4: Histórico de Auditoria**

---

### 3.4. Aba 1 — Formulário de Vistoria Inicial (Entrega do Espaço)
* **Objetivo:** Registrar com precisão milimétrica como o espaço público foi entregue ao cessionário antes de qualquer montagem.
* **Funcionalidades:**
  * **Identificação Oficial:** Nome e Matrícula do Fiscal da SEDE; Nome e CPF do Representante do Cessionário; Data e Hora do preenchimento.
  * **Checklist dos Ambientes:** Cobertura, Estrutura metálica, Piso/Pavimentação, Iluminação e Refletores, Sanitários (Portas, Vasos, Pias, Torneiras), Portões de Acesso, Grades de Proteção, etc.
  * **Controles por Item:**
    * Situação: `BOM`, `REGULAR`, `RUIM`, `INOPERANTE`, `AVARIADO`.
    * Caixa de seleção de conferência em campo (`Conferido`).
    * Campo de observação técnica específica para o item.
    * Botão de câmera para capturar foto imediata vinculada ao item.
  * **Personalização:** Botão `+ Adicionar Item / Ambiente` para incluir itens não previstos no modelo padrão.
  * **Ações:**
    * `Salvar Rascunho`: Permite salvar o progresso para continuar depois.
    * `Concluir Vistoria Inicial`: Valida o checklist, congela o formulário contra edições acidentais (com opção de desbloqueio por senha/confirmação) e habilita a emissão do **Termo de Entrega**.

---

### 3.5. Aba 2 — Formulário de Vistoria Final (Devolução do Espaço)
* **Condição de Acesso:** Exige a conclusão prévia da Vistoria Inicial e a liberação do pós-evento.
* **Liberação Pós-evento:** Ao término do evento, o fiscal clica em `Liberar Vistoria Final`, informa a data e horário real de encerramento da desmontagem, e o sistema clona os itens da vistoria inicial para comparação espelhada.
* **Painel Comparativo de Alertas:**
  * O sistema exibe um sumário visual destacando em tempo real:
    * Total de itens sem alteração (conformes).
    * Total de avarias novas detectadas.
    * Ocorrências de sujeira residual.
    * Equipamentos que se tornaram inoperantes.
    * Extravios ou itens faltantes.
* **Avaliação da Devolução:**
  * `Conforme (Sem Pendências)`: O espaço foi entregue exatamente como recebido.
  * `Com Pendências / Avarias`: Identificados danos que exigem reparo ou compensação pelo cessionário.
  * `Recusado`: Danos graves que impedem o recebimento imediato do espaço.
* **Checklist Comparativo Lado a Lado:**
  * O fiscal vê como o item estava na Vistoria Inicial e marca o estado atual na Vistoria Final. O sistema calcula a variação automaticamente.

---

### 3.6. Aba 3 — Galeria e Registro Fotográfico
* **Objetivo:** Comprovação visual irrefutável do estado das instalações.
* **Recursos:**
  * Filtro por fase da vistoria (`Todas`, `Apenas Vistoria Inicial`, `Apenas Vistoria Final`).
  * Upload múltiplo com suporte a câmera do dispositivo móvel e seleção de arquivos.
  * Associação de cada foto a um ambiente (ex: Pirâmide, Sanitários, Área Externa).
  * Data e hora automáticas em cada imagem.
  * Visualizador em tela cheia com zoom, dados da captura e opção de exclusão.
  * As fotos são anexadas automaticamente ao laudo PDF oficial.

---

### 3.7. Aba 4 — Histórico de Auditoria do Processo
* **Objetivo:** Rastreabilidade administrativa total.
* **Registros Automáticos:**
  * Criação do processo, edição cadastral, salvamento de rascunhos.
  * Conclusão de vistoria inicial, liberação de vistoria final e conclusão definitiva.
  * Emissão de termos em PDF e sincronização com a nuvem/Google Drive.
  * Cada entrada exibe o responsável pela ação, data/hora no padrão brasileiro e descrição das alterações.

---

### 3.8. Modal do Visualizador de Laudo Oficial em PDF
* **Acionamento:** Botões `Termo Entrega (Inicial)` ou `Laudo Completo PDF`.
* **Recursos do Visualizador:**
  * Visualização incorporada do PDF formatado no padrão A4 da Prefeitura de Campina Grande.
  * **Opção de Download:** Salva o arquivo `.pdf` no computador ou smartphone com nome padronizado (ex: `Termo_Vistoria_PA-2026-4412-SEDE_OFICIAL.pdf`).
  * **Opção de Impressão Direta:** Envia para a impressora local ou gera impressão via driver do navegador.
  * **Backup no Google Drive:** Envia o arquivo e as imagens para a pasta configurada na nuvem institucional com apenas um clique.

---

### 3.9. Modal de Configuração do Google Drive & Planilhas
* **Acionamento:** Botão `Google Drive & Sheets` na barra superior.
* **Recursos:**
  * Configuração da pasta do Google Drive (`ID da Pasta` ou `Nome da Pasta`).
  * Configuração da URL da planilha ou Webhook do Google Apps Script para sincronização bidirecional automática.
  * Opção de backup local em formato JSON e restauração de dados.

---

### 3.10. Modal e Menu de Ajuda com Prints das Telas e Passo a Passo
* **Acionamento:** Botão **`Ajuda`** na barra de navegação superior (ao lado do Google Drive) ou pelo rodapé **`Manual & Ajuda do Fiscal`**.
* **Recursos Integrados:**
  * **Passo a Passo Visual com Prints de Telas:**
    1. *Lista e Gestão de Cessões:* Print com busca, filtros de status, indicador de nuvem e novos eventos.
    2. *Cadastro da Cessão e Áreas:* Print com processo administrativo, dados do cessionário e chips do Parque do Povo.
    3. *Vistoria Inicial (Entrega):* Print do formulário em campo com situações (Bom/Regular/Avariado), checklist e fotos.
    4. *Vistoria Final (Devolução):* Print do comparativo automático Antes vs Depois e alertas de avarias novas.
    5. *Laudo Oficial em PDF:* Print do termo institucional A4 pronto para impressão e assinaturas.
  * **Numeração de Ações (Callouts):** Cada print traz números destacados e explicações diretas de "O que fazer nesta tela".
  * **Dicas Práticas para o Fiscal:** Recomendações de melhores práticas para vistorias no Parque do Povo.
  * **Dúvidas Frequentes (FAQ):** Perguntas frequentes com campo de busca em tempo real.
  * **Guia de Nuvem e Funcionamento Offline:** Explicação clara de como o Firebase Firestore e o cache local salvam tudo sem sinal de internet.

---

### 3.11. Identidade Visual e Ícone Oficial do Sistema
* **Arquivos do Ícone:** `/public/app-icon.svg`, `/public/pwa-192x192.png`, `/public/pwa-512x512.png`, `/public/pwa-maskable-512x512.png` e `/public/apple-touch-icon.png`.
* **Conceito & Simbologia:**
  1. **A Pirâmide do Parque do Povo:** Silhueta arquitetônica geométrica facetada do monumento central de Campina Grande em tons de verde-turquesa e esmeralda.
  2. **Escudo de Proteção Patrimonial:** Moldura estilo squircle/escudo em azul noturno institucional (`#0B192C`), simbolizando a salvaguarda dos bens públicos municipais pela SEDE.
  3. **Selo de Vistoria (Check Mark ✓):** Badge de aprovação e conformidade técnica no canto inferior direito.
  4. **Estrela Dourada da Paraíba:** Ponto de luz e celebração em ouro/âmbar, dialogando com as cores da Paraíba e a grandiosidade dos eventos.
* **Aplicações:** Favicon na aba do navegador, atalho de app (PWA) na tela inicial de celulares/tablets dos fiscais, barra de navegação superior e aba de consulta no Manual de Ajuda.

---

### 3.12. Aplicativo Móvel PWA (Progressive Web App)
* **Instalação Direta no Celular:** O sistema funciona como aplicativo autônomo (*standalone*) em smartphones Android e iOS (iPhone/iPad).
* **Barra Inferior Móvel (*Mobile Bottom Bar*):** Em telas de celular, uma barra de navegação ergonômica com polegar fica fixada na parte inferior com botões rápidos: `Cessões`, `Nuvem`, `+ Nova Cessão (destaque)`, `Manual` e `Instalar App`.
* **Modo Offline & Caching Automático:** Graças ao Service Worker e IndexedDB, o fiscal pode preencher vistorias completas e tirar fotos mesmo em pontos do Parque do Povo sem sinal de 4G/Wi-Fi.
* **Suporte à Área Segura (*Safe Area Insets*):** Adaptado para entalhes (notches) e barras gestuais de iPhones e smartphones modernos.

---

## 📋 4. Passo a Passo de Uso (Guia Prático para o Fiscal)

### Cenário 1: Nova Cessão Aprovada
1. Clique no botão **`+ Nova Cessão`** no canto superior direito.
2. Digite o número do processo administrativo da SEDE (ex: `PA-2026/012-SEDE`).
3. Preencha o nome do evento, dados do cessionário (CNPJ/CPF, representante legal e telefone).
4. Selecione as áreas do Parque do Povo que serão utilizadas (Superior, Pirâmide, Inferior e Banheiros).
5. Defina os horários de início, término e prazos de montagem/desmontagem.
6. Clique em **`Cadastrar Cessão`**.

### Cenário 2: Realizando a Vistoria Inicial (Entrega do Espaço)
1. Localize a cessão na lista inicial e clique em **`Abrir Vistoria`**.
2. Na aba **`1. Vistoria Inicial`**, insira seu nome e matrícula de fiscal da SEDE.
3. Percorra o espaço com o representante do cessionário presente:
   * Para cada item, marque a situação (`BOM`, `REGULAR`, etc.) e clique no checkbox `Conferido`.
   * Se houver algum defeito pré-existente, anote na observação do item e tire fotos usando o botão de câmera.
4. Após inspecionar todos os itens, clique em **`Concluir Vistoria Inicial`**.
5. Clique em **`Termo Entrega (Inicial)`** para visualizar e imprimir/baixar o termo assinado pelas partes.

### Cenário 3: Realizando a Vistoria Final (Devolução Pós-Evento)
1. Após o encerramento do evento e retirada das estruturas, abra a cessão no sistema.
2. Na aba **`2. Vistoria Final`**, clique em **`Liberar Vistoria Final Pós-Evento`** e confirme o horário real da devolução.
3. Percorra novamente o espaço conferindo cada item contra o estado inicial registrado.
4. Se houver danos novos (ex: piso trincado, lâmpada quebrada, sanitário entupido, sujeira):
   * Altere a situação do item para o estado atual.
   * Adicione fotos detalhadas do dano na galeria.
5. Selecione a conclusão da devolução (**Conforme**, **Com Pendências** ou **Recusado**).
6. Clique em **`Concluir Vistoria Final`**.
7. Clique em **`Laudo Completo PDF`** para gerar o documento final oficial com relatório fotográfico comparativo.

---

## 🔒 5. Segurança, Backup e Auditoria

* **Validação de Dados:** Todos os formulários possuem verificação de integridade para evitar laudos com campos obrigatórios vazios.
* **Bloqueio de Laudos Concluídos:** Evita alterações acidentais após a concordância das partes.
* **Sincronização Nuvem Ativa:** As vistorias salvas no dispositivo do fiscal são replicadas imediatamente para a nuvem da SEDE, protegendo os dados contra perdas de celular ou falhas de hardware.
