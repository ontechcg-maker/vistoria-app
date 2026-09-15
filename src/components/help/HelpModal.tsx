import React, { useState } from 'react';
import { AppIcon } from '../common/AppIcon';
import {
  X,
  HelpCircle,
  AlertTriangle,
  FileText,
  Camera,
  Database,
  Search,
  ArrowRight,
  ShieldCheck,
  Printer,
  Sparkles,
  Info,
  MapPin,
  ListOrdered,
  Building2,
  Scale,
  Download,
  ExternalLink,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewEvent?: () => void;
}

type HelpTab = 'passos' | 'identidade' | 'faq' | 'offline' | 'contato';

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onOpenNewEvent,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('passos');
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: '1. Lista e Gestão de Cessões',
      subtitle: 'Visão geral de todos os processos, busca e filtros',
      badge: 'Painel Principal',
      summary:
        'Na tela inicial você acompanha todos os processos de cessão no Parque do Povo, filtrando por estágio e visualizando o status em tempo real.',
      callouts: [
        { num: '1', title: 'Status do Firebase Firestore', desc: 'Indica se os dados estão sincronizados na nuvem em tempo real (bolinha verde).' },
        { num: '2', title: 'Barra de Pesquisa', desc: 'Permite buscar por número do processo (ex: PA-2026/0412), cessionário ou evento.' },
        { num: '3', title: 'Filtros Rápidos', desc: 'Filtre entre "Inicial Pendente", "Aguardando Final" e "Concluídos".' },
        { num: '4', title: 'Botão Nova Cessão', desc: 'Abre o formulário oficial para cadastrar um novo evento e processo administrativo.' },
      ],
      tips: [
        'Você pode duplicar um evento já existente para reaproveitar checklist e dados em eventos recorrentes.',
        'No celular, a lista se adapta com toques confortáveis para operação em campo.',
      ],
      // Visual Component Preview
      renderMockup: () => (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/80 text-xs shadow-inner space-y-2.5 font-sans">
          {/* Header Mockup */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-[10px]">
                SEDE
              </div>
              <span className="font-bold text-slate-200">SEDE Vistorias</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                (1) Nuvem: Conectada
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-lg bg-teal-400 text-slate-950 font-bold text-[10px]">
                (4) + Nova Cessão
              </span>
            </div>
          </div>

          {/* Search & Filter Mockup */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-400">
              <Search className="w-3.5 h-3.5" />
              <span>(2) Buscar por processo, evento ou cessionário...</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
              <span className="bg-teal-400 text-slate-950 px-2 py-0.5 rounded font-bold">Todos (3)</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">(3) Inicial Pendente</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">Aguardando Final</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">Concluídos</span>
            </div>
          </div>

          {/* Card Mockup */}
          <div className="bg-slate-800/80 border border-teal-500/30 rounded-xl p-2.5 space-y-1.5 hover:border-teal-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="font-mono text-teal-300 font-bold text-[11px]">PA-2026/0412-SEDE</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                INICIAL PENDENTE
              </span>
            </div>
            <p className="font-bold text-slate-100 text-sm">Festival de Quadrilhas Juninas 2026</p>
            <p className="text-slate-400 text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-400" />
              Parque do Povo — Pirâmide e Parte Superior
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[10px]">
              <span className="text-slate-400">Liga das Quadrilhas de CG</span>
              <span className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold px-2 py-0.5 rounded">
                Abrir Vistoria →
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Cadastro da Cessão e Áreas',
      subtitle: 'Registro do processo administrativo, cessionário e áreas do Parque do Povo',
      badge: 'Formalização',
      summary:
        'Informe o número de processo administrativo da SEDE, dados completos do cessionário e selecione quais áreas e sanitários do Parque do Povo serão entregues.',
      callouts: [
        { num: '1', title: 'Processo Administrativo', desc: 'Preencha com o número oficial do protocolo da SEDE (ex: PA-2026/XXXX-SEDE).' },
        { num: '2', title: 'Dados do Cessionário', desc: 'Nome ou Razão Social, CNPJ/CPF, representante legal e telefone com WhatsApp.' },
        { num: '3', title: 'Seleção das Áreas', desc: 'Clique nos chips do Parque do Povo: Pirâmide, Parte Superior, Parte Inferior e Sanitários.' },
        { num: '4', title: 'Prazos de Montagem/Desmontagem', desc: 'Defina as datas e horários estipulados para início e devolução do espaço.' },
        { num: '5', title: 'Edição a Qualquer Momento', desc: 'Precisa atualizar razão social, CPF/CNPJ ou telefone? Basta clicar no botão "Editar Cessionário" na tela da cessão.' },
      ],
      tips: [
        'Ao clicar nos chips de áreas, o sistema descreve automaticamente a cláusula de localização oficial do espaço cedido.',
        'Se o evento tiver dias de montagem prévia, cadastre os prazos para controle preciso da vistoria inicial.',
        'Você pode editar os dados do cessionário a qualquer momento sem perder o checklist ou as fotos já registradas.',
      ],
      renderMockup: () => (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/80 text-xs shadow-inner space-y-2.5 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 text-sm">Nova Cessão de Espaço Público</span>
            <span className="text-[10px] text-teal-400 font-bold">SEDE Campina Grande</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block">(1) Nº Processo / Protocolo</span>
              <span className="font-mono text-teal-300 font-bold">PA-2026/0892-SEDE</span>
            </div>
            <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Nome do Evento</span>
              <span className="text-slate-100 font-semibold truncate block">Feira de Artesanato & Gastronomia</span>
            </div>
          </div>

          <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 block">(2) Cessionário / Representante Legal</span>
            <div className="text-slate-200 font-medium">Associação dos Artesãos da Paraíba (CNPJ 12.345.678/0001-90)</div>
          </div>

          <div className="bg-slate-800/90 p-2 rounded-lg border border-slate-700 space-y-1.5">
            <span className="text-[10px] text-slate-400 block">(3) Áreas Cedidas no Parque do Povo</span>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold text-[10px]">
                ✓ Pirâmide
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold text-[10px]">
                ✓ Parte Superior
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold text-[10px]">
                ✓ Sanitários Pirâmide
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                + Parte Inferior
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <span className="bg-teal-400 text-slate-950 font-bold px-3 py-1 rounded text-[11px]">
              Cadastrar Cessão
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Vistoria Inicial (Entrega do Espaço)',
      subtitle: 'Inspeção minuciosa antes da montagem e emissão do Termo de Entrega',
      badge: 'Fase 1: Entrada',
      summary:
        'Realizada no local pelo fiscal da SEDE acompanhado pelo cessionário. Verifica-se o estado de pisos, estrutura metálica, cobertura, sanitários e iluminação antes de qualquer montagem.',
      callouts: [
        { num: '1', title: 'Dados dos Responsáveis', desc: 'Informe nome e matrícula do fiscal da SEDE e confira os dados do cessionário.' },
        { num: '2', title: 'Checklist de Ambientes', desc: 'Selecione a situação de cada item: BOM, REGULAR, RUIM, INOPERANTE ou AVARIADO.' },
        { num: '3', title: 'Conferência em Campo', desc: 'Marque a caixinha "Conferido" conforme inspeciona cada setor no Parque do Povo.' },
        { num: '4', title: 'Fotos e Observações', desc: 'Tire fotos imediatas com a câmera do celular de qualquer detalhe ou avaria já existente.' },
        { num: '5', title: 'Concluir Vistoria Inicial', desc: 'Gera o Termo de Entrega assinado e congela o laudo inicial para comparação futura.' },
      ],
      tips: [
        'Registre com foto qualquer mancha, pichação ou piso trincado pré-existente. Isso protegerá tanto a Prefeitura quanto o Cessionário.',
        'Após concluir, você pode emitir imediatamente o Termo de Entrega no botão superior.',
      ],
      renderMockup: () => (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/80 text-xs shadow-inner space-y-2.5 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">1. Vistoria Inicial — Entrega do Espaço</span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
              EM PREENCHIMENTO
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px]">(1) Fiscal Responsável (SEDE)</span>
              <span className="text-slate-200 font-bold">Carlos Eduardo (Mat. 98432)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Representante Cessionário</span>
              <span className="text-slate-200 font-bold">João Pedro Silva (CPF ...)</span>
            </div>
          </div>

          {/* Checklist Item Row */}
          <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <span className="w-4 h-4 rounded bg-teal-400/20 text-teal-400 flex items-center justify-center text-[10px]">
                  (3) ✓
                </span>
                <span>Piso e Pavimentação — Pirâmide</span>
              </div>
              <span className="text-[10px] text-teal-300 font-semibold bg-teal-950/60 px-1.5 py-0.2 rounded border border-teal-800">
                Conferido
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">(2) Situação:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                BOM
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                REGULAR
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                AVARIADO
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[10px]">
              <span className="text-slate-400 italic">"Piso limpo, sem fissuras novas aparentes"</span>
              <span className="flex items-center gap-1 text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
                <Camera className="w-3 h-3" /> (4) 2 Fotos
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-slate-400 text-[10px]">14 de 14 itens inspecionados</span>
            <span className="bg-teal-400 text-slate-950 font-bold px-3 py-1 rounded text-[11px]">
              (5) Concluir Vistoria Inicial
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. Vistoria Final e Comparativo Automático',
      subtitle: 'Inspeção de devolução pós-evento com comparação automática Antes vs Depois',
      badge: 'Fase 2: Devolução',
      summary:
        'Após a desmontagem do evento, o fiscal libera a Vistoria Final. O sistema clona os itens e compara automaticamente o estado inicial com o estado pós-evento, alertando avarias e sujeira.',
      callouts: [
        { num: '1', title: 'Liberação Pós-Evento', desc: 'Clique em "Liberar Vistoria Final" informando data e hora real de encerramento da desmontagem.' },
        { num: '2', title: 'Painel de Comparação', desc: 'O sistema calcula e exibe em tempo real itens conformes, avarias novas, sujeira e extravios.' },
        { num: '3', title: 'Comparativo Lado a Lado', desc: 'Veja como cada ambiente estava na entrega e marque a situação atual de devolução.' },
        { num: '4', title: 'Parecer Conclusivo', desc: 'Classifique a devolução como Conforme, Com Pendências ou Recusado.' },
      ],
      tips: [
        'Se houver avarias novas, anote na observação do item e adicione fotos para anexar ao Laudo Oficial de cobrança de reparo.',
        'Se o cessionário corrigir o problema antes do encerramento oficial, você pode atualizar a situação antes de concluir.',
      ],
      renderMockup: () => (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/80 text-xs shadow-inner space-y-2.5 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">2. Vistoria Final — Devolução do Espaço</span>
            <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold">
              LIBERADA PARA INSPEÇÃO
            </span>
          </div>

          {/* Alert Summary Box */}
          <div className="bg-amber-950/40 border border-amber-800/80 p-2 rounded-lg text-amber-200 space-y-1">
            <div className="flex items-center justify-between font-bold text-[11px]">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                (2) Resumo Comparativo: 1 Avaria Nova Detectada
              </span>
              <span className="text-[10px] bg-amber-900/60 px-1.5 py-0.5 rounded">13 Conformes</span>
            </div>
            <p className="text-[10px] text-amber-300/80">
              Detector automático identificou alteração negativa no setor: Sanitários Pirâmide.
            </p>
          </div>

          {/* Compare Item */}
          <div className="bg-slate-800/90 border border-slate-700 p-2 rounded-lg space-y-1 text-[11px]">
            <div className="font-bold text-slate-200">Sanitários — Torneiras e Pias</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-700">
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Na Entrega (Inicial):</span>
                <span className="text-emerald-400 font-bold">BOM / Conforme</span>
              </div>
              <div className="bg-rose-950/40 p-1.5 rounded border border-rose-800">
                <span className="text-rose-300 block text-[9px]">(3) Na Devolução (Final):</span>
                <span className="text-rose-400 font-bold">AVARIADO (Torneira quebrada)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">(4) Parecer:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                Com Pendências
              </span>
            </div>
            <span className="bg-teal-400 text-slate-950 font-bold px-3 py-1 rounded text-[11px]">
              Concluir Vistoria Final
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. Laudo Oficial em PDF e Assinaturas',
      subtitle: 'Emissão de termo oficial com padrão da Prefeitura, relatório fotográfico e backup',
      badge: 'Documento Oficial',
      summary:
        'Gere instantaneamente o Termo de Entrega ou o Laudo Completo de Devolução em PDF institucional formatado, pronto para impressão, assinatura das partes e envio para o Google Drive.',
      callouts: [
        { num: '1', title: 'Termo Inicial vs Laudo Completo', desc: 'Emita o termo inicial logo após a entrega, ou o laudo final com tabela comparativa e anexo de fotos.' },
        { num: '2', title: 'Padrão Institucional A4', desc: 'Documento oficial com brasão de Campina Grande, dados da SEDE e processo administrativo.' },
        { num: '3', title: 'Relatório Fotográfico', desc: 'Todas as fotos anexadas aparecem com ambiente, legenda, data/hora no final do PDF.' },
        { num: '4', title: 'Impressão e Google Drive', desc: 'Imprima diretamente pelo navegador ou sincronize com o Google Drive da secretaria.' },
      ],
      tips: [
        'O documento possui campos prontos para assinatura presencial ou aposição de assinatura digital.',
        'O nome do arquivo gerado segue o padrão da SEDE: Termo_Vistoria_[PROCESSO]_OFICIAL.pdf.',
      ],
      renderMockup: () => (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/80 text-xs shadow-inner space-y-2.5 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-slate-200">Laudo de Vistoria Oficial em PDF</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 text-[10px] flex items-center gap-1">
                <Printer className="w-3 h-3" /> Imprimir
              </span>
              <span className="bg-teal-400 text-slate-950 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1">
                Baixar PDF
              </span>
            </div>
          </div>

          {/* Document Simulation Sheet */}
          <div className="bg-white text-slate-900 p-3 rounded shadow space-y-2 text-[10px] border border-slate-300">
            <div className="text-center border-b pb-1.5">
              <p className="font-black text-[11px] tracking-tight text-slate-900 uppercase">
                Prefeitura Municipal de Campina Grande
              </p>
              <p className="text-[9px] text-slate-600 font-semibold">
                Secretaria de Desenvolvimento Econômico — SEDE
              </p>
              <p className="font-bold text-teal-800 text-[10px] mt-0.5">
                TERMO DE VISTORIA E RECEBIMENTO DE ESPAÇO PÚBLICO
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Processo: PA-2026/0412-SEDE</span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[8.5px] bg-slate-50 p-1.5 rounded border border-slate-200">
              <div>
                <strong>Local:</strong> Parque do Povo (Pirâmide e Sanitários)
              </div>
              <div>
                <strong>Cessionário:</strong> Associação das Quadrilhas Juninas
              </div>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden text-[8px]">
              <div className="bg-slate-200 font-bold p-1 flex justify-between">
                <span>Item Inspecionado</span>
                <span>Inicial ➔ Final</span>
              </div>
              <div className="p-1 flex justify-between border-t border-slate-200">
                <span>Piso da Pirâmide</span>
                <span className="text-emerald-700 font-bold">BOM ➔ BOM (Sem Danos)</span>
              </div>
              <div className="p-1 flex justify-between border-t border-slate-200 bg-amber-50">
                <span>Sanitários — Torneiras</span>
                <span className="text-rose-700 font-bold">BOM ➔ AVARIADO (Reparo exigido)</span>
              </div>
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-4 pt-2 text-center text-[7.5px] border-t border-slate-200">
              <div>
                <div className="border-t border-slate-400 pt-0.5 font-bold">Fiscal da SEDE</div>
                <div className="text-slate-500">Matrícula nº 98432</div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-0.5 font-bold">Representante Cessionário</div>
                <div className="text-slate-500">CPF do Responsável</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const faqs = [
    {
      q: 'O aplicativo funciona se eu perder a conexão com a internet no Parque do Povo?',
      a: 'Sim, 100%! O sistema foi desenvolvido com arquitetura Offline-First. Todas as inspeções, anotações de checklist e fotos são salvas instantaneamente no banco de dados local do seu navegador (IndexedDB). Assim que você se conectar a uma rede Wi-Fi ou sinal 4G/5G, o indicador da barra superior piscará e todos os dados serão sincronizados automaticamente com a nuvem Firebase Firestore da SEDE.',
    },
    {
      q: 'Como anexar fotos durante a vistoria em campo?',
      a: 'Você pode adicionar fotos de duas formas: diretamente na linha do item que você estiver avaliando (clicando no ícone de Câmera daquele item) ou acessando a aba "3. Fotos" na tela do evento para enviar múltiplas fotos da galeria ou tirar na hora com a câmera do celular.',
    },
    {
      q: 'O que fazer se eu concluir uma vistoria por engano e precisar retificar algo?',
      a: 'Para preservar a integridade jurídica do laudo, a vistoria é bloqueada após concluída. No entanto, o fiscal pode reabrir a vistoria clicando em "Reabrir Vistoria" ou inserindo a justificativa administrativa. A ação ficará registrada no Histórico de Auditoria para transparência total.',
    },
    {
      q: 'Como gerar o PDF oficial e salvar no Google Drive?',
      a: 'Nos botões do topo da tela da cessão, clique em "Termo Entrega (Inicial)" ou "Laudo Completo PDF". O visualizador exibirá o laudo oficial em A4. Nele você pode clicar em "Baixar PDF", "Imprimir" ou "Salvar no Google Drive" para enviar direto para a pasta compartilhada da secretaria.',
    },
    {
      q: 'O que o sistema faz se encontrar avarias na Vistoria Final?',
      a: 'O sistema faz um comparativo automático das situações registradas na entrega e na devolução. Qualquer item que tenha piorado de estado (ex: de BOM para AVARIADO ou RUIM) é destacado em vermelho com contagem de alertas. O laudo em PDF gera uma seção específica de avarias detectadas para fundamentar eventuais notificações ou cobranças.',
    },
    {
      q: 'Posso usar o aplicativo no celular e no computador simultaneamente?',
      a: 'Sim! Com o Firebase Firestore em nuvem, se um fiscal realizar uma alteração ou adicionar fotos no celular em campo, qualquer outro membro da equipe com o sistema aberto no computador do escritório receberá as atualizações em tempo real, sem precisar recarregar a página.',
    },
    {
      q: 'Como alterar ou retificar os dados do cessionário após o cadastro?',
      a: 'Na tela do evento de cessão, clique no botão "Editar Cessionário" (ao lado do nome do evento ou no card de informações do cessionário). Você poderá corrigir o Nome/Razão Social, CPF/CNPJ, Representante Legal, E-mail e Telefone a qualquer momento.',
    },
    {
      q: 'Como funciona a segurança e o backup de dados sem depender de planilhas?',
      a: 'A sincronização ocorre em tempo real via Firebase Firestore diretamente com os servidores em nuvem. Além disso, no menu "Backup e Google Drive" na barra superior, você pode clicar em "Baixar Backup Completo" para salvar um arquivo JSON com 100% dos dados, fotos e vistorias.',
    },
  ];

  const currentStep = steps.find((s) => s.id === selectedStep) || steps[0];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.a.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  Manual de Uso & Guia do Sistema
                </h2>
                <span className="hidden xs:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  SEDE Vistorias
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Instruções práticas com prints das telas e passo a passo para o fiscal em campo
              </p>
            </div>
          </div>

          <button
            id="btn-close-help-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition active:scale-95 shrink-0"
            title="Fechar Manual de Ajuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto scrollbar-none shrink-0">
          <button
            id="tab-help-passos"
            onClick={() => setActiveTab('passos')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'passos'
                ? 'text-teal-400 border-teal-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Passo a Passo com Prints</span>
          </button>

          <button
            id="tab-help-identidade"
            onClick={() => setActiveTab('identidade')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'identidade'
                ? 'text-teal-400 border-teal-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Ícone & Identidade do Sistema</span>
          </button>

          <button
            id="tab-help-faq"
            onClick={() => setActiveTab('faq')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'faq'
                ? 'text-teal-400 border-teal-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Dúvidas Frequentes (FAQ)</span>
          </button>

          <button
            id="tab-help-offline"
            onClick={() => setActiveTab('offline')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'offline'
                ? 'text-teal-400 border-teal-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Nuvem & Modo Offline</span>
          </button>

          <button
            id="tab-help-contato"
            onClick={() => setActiveTab('contato')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contato'
                ? 'text-teal-400 border-teal-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Sobre a SEDE / Normas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Passo a Passo com Prints das Telas */}
          {activeTab === 'passos' && (
            <div className="space-y-6">
              {/* Steps Carousel / Navigation Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {steps.map((s) => (
                  <button
                    key={s.id}
                    id={`btn-select-step-${s.id}`}
                    onClick={() => setSelectedStep(s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                      selectedStep === s.id
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>

              {/* Active Step Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Visual UI Mockup Screen (Print da Tela) */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-teal-300">
                        Visualização da Tela ({currentStep.badge})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Layout Oficial SEDE</span>
                  </div>

                  {/* Browser Window Frame Wrapper */}
                  <div className="bg-slate-950 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl relative group">
                    {/* Simulated Window Dots */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        sede.campinagrande.pb.gov.br/vistorias
                      </span>
                    </div>

                    {/* Rendered Mockup Component */}
                    {currentStep.renderMockup()}
                  </div>

                  <p className="text-[11px] text-slate-400 italic text-center">
                    Simulação fiel da tela operacional utilizada pelos fiscais da SEDE.
                  </p>
                </div>

                {/* Explanations & Checklist Details */}
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        {currentStep.badge}
                      </span>
                      <span className="text-xs text-slate-400">Etapa {currentStep.id} de 5</span>
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight mt-1">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {currentStep.summary}
                    </p>
                  </div>

                  {/* Callout Explanations (Keyed to numbers) */}
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
                    <h4 className="text-xs font-extrabold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      O que fazer nesta tela:
                    </h4>
                    <div className="space-y-2 text-xs">
                      {currentStep.callouts.map((co, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {co.num}
                          </span>
                          <div>
                            <span className="font-bold text-slate-200 block text-xs">{co.title}</span>
                            <span className="text-slate-300 text-[11px] leading-tight">{co.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Practical Tips */}
                  <div className="bg-teal-950/30 border border-teal-800/60 rounded-xl p-3 space-y-1.5">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Dicas Práticas para o Fiscal:
                    </span>
                    <ul className="space-y-1 text-xs text-teal-200/90 pl-4 list-disc">
                      {currentStep.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Navigation Button for next step */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setSelectedStep(Math.max(1, selectedStep - 1))}
                      disabled={selectedStep === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition"
                    >
                      ← Etapa Anterior
                    </button>

                    <button
                      onClick={() => setSelectedStep(Math.min(5, selectedStep + 1))}
                      disabled={selectedStep === 5}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-400 text-slate-950 hover:bg-teal-300 disabled:opacity-30 transition flex items-center gap-1"
                    >
                      <span>Próxima Etapa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-white">Dúvidas Frequentes da Fiscalização</h3>
                  <p className="text-xs text-slate-400">Respostas rápidas para as situações mais comuns em campo</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Pesquisar dúvida..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs sm:text-sm font-bold text-teal-300 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        ?
                      </span>
                      <span>{faq.q}</span>
                    </h4>
                    <p className="text-xs text-slate-300 pl-7 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Nuvem & Offline */}
          {activeTab === 'offline' && (
            <div className="space-y-6">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Como Funciona a Nuvem e o Modo Offline</h3>
                    <p className="text-xs text-slate-400">
                      Sincronização em tempo real entre celulares de campo e computadores do setor administrativo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                    <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
                      1
                    </span>
                    <h4 className="font-bold text-sm text-slate-200">Firebase Firestore</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Banco de dados em nuvem central. Qualquer alteração feita por um fiscal é transmitida imediatamente para toda a equipe.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
                      2
                    </span>
                    <h4 className="font-bold text-sm text-slate-200">Cache Local (IndexedDB)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Permite que você use o app no Parque do Povo mesmo sem sinal de internet. Nenhum dado é perdido ao recarregar ou desligar o aparelho.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                      3
                    </span>
                    <h4 className="font-bold text-sm text-slate-200">Auto-Reconexão</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Assim que o sinal de internet retorna, o sistema detecta e envia em segundo plano todas as fotos e vistorias pendentes.
                    </p>
                  </div>
                </div>

                {/* Status Indicator Explanation */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-200 block">Legenda do Indicador no Cabeçalho:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300"><strong>Nuvem: Conectada</strong> — Sincronização 100% atualizada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-slate-300"><strong>Nuvem: Enviando...</strong> — Dados sendo replicados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-slate-300"><strong>Modo Offline</strong> — Salvando no aparelho com segurança</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Sobre a SEDE / Normas */}
          {activeTab === 'contato' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Prefeitura Municipal de Campina Grande</h3>
                    <p className="text-xs text-slate-400">
                      Secretaria de Desenvolvimento Econômico — SEDE / Fiscalização de Patrimônio Público
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-700 pt-3">
                  <p>
                    O Parque do Povo é o principal complexo cultural e de eventos de Campina Grande. A cessão de suas dependências (Pirâmide, Pátio Superior, Sanitários e Pátio Inferior) é regida por termo administrativo com obrigações formais de zelo e conservação.
                  </p>
                  <p>
                    O Termo de Vistoria emitido por este aplicativo constitui documento administrativo com fé pública, servindo de base para devolução de cauções, apuração de responsabilidades e eventual aplicação de sanções previstas no Termo de Cessão de Uso.
                  </p>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-200 block">Orientações aos Fiscais em Campo:</span>
                  <ul className="space-y-1 list-disc pl-4 text-slate-300 text-[11px]">
                    <li>Sempre realize a vistoria inicial e a final na presença do cessionário ou de seu representante credenciado.</li>
                    <li>Fotografe itens em ângulos claros com boa iluminação.</li>
                    <li>Colete as assinaturas no termo em PDF logo após a vistoria para conclusão do processo.</li>
                  </ul>
                </div>

                {/* Developer Information Card */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-400 block">
                      Desenvolvimento do Sistema
                    </span>
                    <h4 className="text-sm font-bold text-white">Herverton S. Moreira</h4>
                    <p className="text-xs text-slate-400">Analista & Desenvolvedor de Software</p>
                  </div>
                  <a
                    href="tel:+5583996067600"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
                  >
                    📞 (83) 99606.7600
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Ícone & Identidade Visual do Sistema */}
          {activeTab === 'identidade' && (
            <div className="space-y-6">
              {/* Hero Banner / Showcase */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950/60 p-6 rounded-2xl border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-center gap-6">
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-950 p-2 border-2 border-teal-400/60 shadow-2xl shadow-teal-500/20 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-teal-400/20 blur-xl -z-10 rounded-full group-hover:bg-teal-300/30 transition" />
                    <img
                      src="/app-icon.svg"
                      alt="Ícone SEDE Vistorias"
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  <span className="mt-2 text-[10px] uppercase font-extrabold tracking-wider text-teal-300 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                    Identidade Oficial 2026
                  </span>
                </div>

                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Proposta de Identidade Visual
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Ícone Oficial: SEDE Vistorias • Parque do Povo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Criado especificamente para representar a <strong>fiscalização e salvaguarda do patrimônio público</strong> nas áreas de eventos de Campina Grande, unindo o monumento mais célebre da cidade com os conceitos de técnica e conformidade.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <a
                      href="/app-icon.svg"
                      download="icone-sede-vistorias-campinagrande.svg"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar Vetor (SVG)
                    </a>
                    <a
                      href="/app-icon.svg"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir em Tela Cheia
                    </a>
                  </div>
                </div>
              </div>

              {/* Symbolism Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Significado de Cada Elemento do Ícone
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Element 1 */}
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-black text-xs border border-teal-500/40">
                        1
                      </div>
                      <h5 className="text-sm font-bold text-slate-100">A Pirâmide do Parque do Povo</h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      A silhueta arquitetônica geométrica facetada com suas arestas e patamares reproduz a famosa <strong>Pirâmide do Parque do Povo</strong>, cartão postal de Campina Grande e coração das grandes cessões públicas da cidade.
                    </p>
                  </div>

                  {/* Element 2 */}
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-black text-xs border border-teal-500/40">
                        2
                      </div>
                      <h5 className="text-sm font-bold text-slate-100">O Escudo de Proteção Patrimonial</h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      A moldura no formato de <strong>escudo e squircle de segurança</strong> expressa o dever institucional da SEDE: resguardar e proteger o patrimônio público municipal contra danos e depreciação indevida.
                    </p>
                  </div>

                  {/* Element 3 */}
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xs border border-emerald-500/40">
                        3
                      </div>
                      <h5 className="text-sm font-bold text-slate-100">Selo de Vistoria e Conformidade (Check ✓)</h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      O selo esmeralda sobreposto com o sinal de validação (<strong>check mark</strong>) sintetiza a função do app: realizar vistorias com precisão técnica e emitir o termo formal de aprovação ou apontamento de avarias.
                    </p>
                  </div>

                  {/* Element 4 */}
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs border border-amber-500/40">
                        4
                      </div>
                      <h5 className="text-sm font-bold text-slate-100">A Estrela Dourada da Paraíba</h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      O ponto luminoso em amarelo-ouro no canto superior remete à luz, energia e tradição dos eventos em Campina Grande, dialogando com as cores solares da bandeira da Paraíba e com o brasão oficial.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Scale Demonstrations */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Exibição em Diferentes Tamanhos e Contextos
                </h4>
                <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <AppIcon className="w-12 h-12" />
                    <div className="text-[11px]">
                      <span className="font-bold text-white block">Cabeçalho do App</span>
                      <span className="text-slate-400">48 × 48 px</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                  <div className="flex items-center gap-3">
                    <AppIcon className="w-8 h-8" />
                    <div className="text-[11px]">
                      <span className="font-bold text-white block">Ícone Mobile / PWA</span>
                      <span className="text-slate-400">32 × 32 px</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                  <div className="flex items-center gap-3">
                    <AppIcon className="w-5 h-5" />
                    <div className="text-[11px]">
                      <span className="font-bold text-white block">Aba do Navegador (Favicon)</span>
                      <span className="text-slate-400">20 × 20 px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Documentação oficial e homologada para fiscais da SEDE</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {onOpenNewEvent && (
              <button
                id="btn-help-go-new-event"
                onClick={() => {
                  onClose();
                  onOpenNewEvent();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition active:scale-95"
              >
                + Nova Cessão
              </button>
            )}
            <button
              id="btn-help-close-bottom"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
            >
              Fechar Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
