# SEDE Vistorias — Aplicativo de Vistoria de Cessão de Espaço Público
### Prefeitura Municipal de Campina Grande — Secretaria de Desenvolvimento Econômico (SEDE)

Sistema oficial para fiscalização, controle, vistoria inicial (entrega), vistoria final (devolução) e emissão de laudos técnicos em PDF para cessão de espaços públicos municipais, como o Parque do Povo de Campina Grande.

---

## 🚀 Principais Recursos

- **Cadastro Completo de Cessões:** Número de processo administrativo, dados do cessionário, áreas cedidas no Parque do Povo, prazos de montagem e desmontagem.
- **Vistoria Inicial (Entrega):** Checklist de integridade do patrimônio com conferência item a item e emissão do Termo de Entrega.
- **Vistoria Final (Devolução):** Comparativo visual automatizado entre o estado inicial e final, com detecção de avarias novas, sujeira residual e extravios.
- **Laudos Oficiais em PDF:** Termos com padrão institucional da PMCG/SEDE, com logomarca, tabelas comparativas e anexo fotográfico.
- **Banco de Dados em Nuvem (Firebase Firestore):** Sincronização em tempo real e persistência na nuvem com funcionamento offline-first resiliente via IndexedDB.
- **Integração com Google Sheets & Google Drive:** Backup de relatórios, fotos e espelhamento em planilhas da secretaria.

---

## 📚 Documentação Completa

Para ler o guia detalhado, telas e passo a passo de operação para os fiscais da SEDE, consulte:
👉 **[DOCUMENTACAO_SISTEMA.md](./DOCUMENTACAO_SISTEMA.md)**

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React
- **Banco de Dados & Nuvem:** Firebase Firestore + Dexie.js (IndexedDB) para cache offline
- **Geração de Documentos:** jsPDF + jsPDF-AutoTable
- **Build Tool:** Vite
