export type EventStatus = 
  | 'RASCUNHO'
  | 'VISTORIA_INICIAL_PENDENTE'
  | 'VISTORIA_INICIAL_CONCLUIDA'
  | 'EVENTO_EM_ANDAMENTO'
  | 'AGUARDANDO_VISTORIA_FINAL'
  | 'VISTORIA_FINAL_CONCLUIDA'
  | 'CONCLUIDO';

export type CondicaoItem = 'BOM' | 'REGULAR' | 'RUIM' | 'NAO_SE_APLICA';

export type ItemStatus = CondicaoItem;

export type ComparisonResult = 
  | 'SEM_ALTERACAO'
  | 'ALTERACAO_IDENTIFICADA'
  | 'DANO_IDENTIFICADO'
  | 'ITEM_AUSENTE'
  | 'MELHORIA_OU_AJUSTE'
  | 'NAO_FOI_POSSIVEL_COMPARAR';

export type SpaceReturnStatus = 
  | 'CONFORME'
  | 'COM_RESSALVAS'
  | 'COM_DANOS'
  | 'AGUARDA_REGULARIZACAO';

export interface Evento {
  id: string;
  codigo: string; // Processo / Protocolo ou Código
  processoProtocolo?: string; // Processo/Protocolo Administrativo nº
  nome: string; // Evento/Atividade
  tipo: string;
  contratante: string; // Cessionário(a)
  docContratante?: string; // CPF/CNPJ do Cessionário
  representanteLegal?: string; // Representante Legal
  cpfRepresentanteLegal?: string; // CPF do Representante Legal
  responsavelEvento: string; // Responsável ou Contato
  telefoneResponsavel?: string; // Telefone
  emailResponsavel?: string; // E-mail
  espacoCedido: string; // Local Cedido (Ex: Parque do Povo, Estação Cidadania, Auditório)
  areaEspacoCedido?: string; // Área / Espaço Específico
  areasParqueDoPovo?: ('PARTE_SUPERIOR' | 'PIRAMIDE' | 'PARTE_INFERIOR')[]; // Áreas do Parque do Povo
  banheirosDisponibilizados?: ('BANHEIRO_SUPERIOR' | 'BANHEIRO_PIRAMIDE')[]; // Banheiros liberados na cessão
  enderecoLocal: string; // Endereço do local
  dataInicio: string; // YYYY-MM-DD
  dataHoraPrevisaoInicio: string; // Início do período de utilização
  dataHoraPrevisaoFim: string; // Término do período de utilização
  periodoMontagem?: string; // Período de Montagem
  periodoDesmontagem?: string; // Período de Desmontagem
  dataHoraRealFim?: string; // Data e hora real de encerramento
  observacoesGerais?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  googleDriveFolderId?: string;
  googleDriveSyncedAt?: string;
}

export type TipoDocumentoPdf = 'INICIAL_ENTREGA' | 'FINAL_DEVOLUCAO' | 'COMPLETO';

export interface Vistoria {
  id: string;
  eventoId: string;
  tipo: 'INICIAL' | 'FINAL';
  status: 'RASCUNHO' | 'CONCLUIDA';
  responsavelSedeNome: string; // Responsável SEDE
  responsavelSedeMatricula?: string; // Matrícula SEDE
  representanteCessionarioNome?: string; // Representante Cessionário
  representanteCessionarioCpf?: string; // CPF Representante Cessionário
  responsavelNome: string; // Fallback compatibilidade
  responsavelCargo: string; // Fallback compatibilidade
  dataHoraPreenchimento: string;
  observacoesGerais?: string;
  devolucaoStatus?: SpaceReturnStatus; // Usado na vistoria final
  providenciasPendencias?: string; // Usado na vistoria final
  concluidaEm?: string;
  editadaAposConclusaoEm?: string;
  motivoEdicaoAposConclusao?: string;
}

export interface PendenciaOcorrencia {
  id: string;
  numero: string; // 01, 02...
  ocorrencia: string;
  providencia: string;
  responsavel: string;
  prazo: string;
  situacao?: string;
}

export interface ItemVistoria {
  id: string;
  eventoId: string;
  vistoriaTipo: 'INICIAL' | 'FINAL';
  ambiente: string; // Grupo / Categoria
  descricao: string; // Nome do item (ex: Piso / pavimentação)
  quantidade?: number;
  conferido: boolean;
  situacao: CondicaoItem; // Bom | Regular | Ruim | Não se aplica
  houveAlteracaoDano?: boolean; // Vistoria final: Sim/Não
  providenciaNecessaria?: string; // Vistoria final
  observacao?: string;
  resultadoComparacao?: ComparisonResult;
  justificativaDivergencia?: string;
  itemOriginalId?: string;
  ordem: number;
}

export interface FotoVistoria {
  id: string;
  eventoId: string;
  vistoriaTipo: 'INICIAL' | 'FINAL';
  itemId?: string;
  ambiente: string;
  legenda?: string;
  dataHora: string;
  responsavelEnvio?: string;
  dataUrl: string;
  ordem: number;
}

export interface HistoricoEvento {
  id: string;
  eventoId: string;
  dataHora: string;
  responsavel: string;
  acao: string;
  detalhes?: string;
}

export interface GoogleDriveConfig {
  clientId?: string;
  apiKey?: string;
  webhookUrl?: string;
  folderName: string;
  folderId?: string;
  autoSync: boolean;
  lastConnectedEmail?: string;
}
