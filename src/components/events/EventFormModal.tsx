import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Building, User, Mail, Phone, FileText, Clock, Check, Sparkles, UserCheck } from 'lucide-react';
import type { Evento } from '../../types/vistoria';

interface EventFormModalProps {
  isOpen: boolean;
  eventToEdit?: Evento | null;
  onClose: () => void;
  onSave: (eventData: Partial<Evento>) => Promise<void>;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  eventToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    codigo: '',
    processoProtocolo: '',
    nome: '',
    tipo: 'Evento / Cessão de Espaço Público',
    contratante: '',
    docContratante: '',
    representanteLegal: '',
    cpfRepresentanteLegal: '',
    responsavelEvento: '',
    telefoneResponsavel: '',
    emailResponsavel: '',
    espacoCedido: 'Parque do Povo',
    areaEspacoCedido: 'Pirâmide',
    areasParqueDoPovo: ['PIRAMIDE'] as ('PARTE_SUPERIOR' | 'PIRAMIDE' | 'PARTE_INFERIOR')[],
    banheirosDisponibilizados: ['BANHEIRO_PIRAMIDE'] as ('BANHEIRO_SUPERIOR' | 'BANHEIRO_PIRAMIDE')[],
    enderecoLocal: 'Rua Sebastião Donato, Centro - Campina Grande/PB',
    dataInicio: new Date().toISOString().slice(0, 10),
    dataHoraPrevisaoInicio: `${new Date().toISOString().slice(0, 10)}T08:00`,
    dataHoraPrevisaoFim: `${new Date().toISOString().slice(0, 10)}T22:00`,
    periodoMontagem: '08:00 às 18:00 do dia anterior',
    periodoDesmontagem: 'Até as 14:00 do dia seguinte',
    responsavelSedeNome: 'Fiscal de Vistoria da SEDE',
    responsavelSedeMatricula: 'SEDE-4412',
    observacoesGerais: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isParqueDoPovo = formData.espacoCedido.toLowerCase().includes('parque do povo');

  // Atualiza a descrição automática do espaço cedido com base nas áreas e banheiros selecionados
  const updateAreaDescription = (
    areas: ('PARTE_SUPERIOR' | 'PIRAMIDE' | 'PARTE_INFERIOR')[],
    banheiros: ('BANHEIRO_SUPERIOR' | 'BANHEIRO_PIRAMIDE')[]
  ) => {
    if (areas.length === 3) {
      return 'Todo o Parque do Povo (Parte Superior, Pirâmide e Parte Inferior)';
    }

    const nomesAreas = areas.map((a) => {
      if (a === 'PARTE_SUPERIOR') return 'Parte Superior';
      if (a === 'PIRAMIDE') return 'Pirâmide';
      if (a === 'PARTE_INFERIOR') return 'Parte Inferior';
      return a;
    });

    let desc = nomesAreas.join(' + ');
    const banheirosDesc: string[] = [];
    if (banheiros.includes('BANHEIRO_SUPERIOR') && areas.includes('PARTE_SUPERIOR')) {
      banheirosDesc.push('Sanitários Superior');
    }
    if (banheiros.includes('BANHEIRO_PIRAMIDE') && areas.includes('PIRAMIDE')) {
      banheirosDesc.push('Sanitários Pirâmide');
    }

    if (banheirosDesc.length > 0) {
      desc += ` (com ${banheirosDesc.join(' e ')})`;
    }

    return desc;
  };

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        codigo: eventToEdit.codigo || '',
        processoProtocolo: eventToEdit.processoProtocolo || eventToEdit.codigo || '',
        nome: eventToEdit.nome || '',
        tipo: eventToEdit.tipo || 'Evento / Cessão de Espaço Público',
        contratante: eventToEdit.contratante || '',
        docContratante: eventToEdit.docContratante || '',
        representanteLegal: eventToEdit.representanteLegal || '',
        cpfRepresentanteLegal: eventToEdit.cpfRepresentanteLegal || '',
        responsavelEvento: eventToEdit.responsavelEvento || '',
        telefoneResponsavel: eventToEdit.telefoneResponsavel || '',
        emailResponsavel: eventToEdit.emailResponsavel || '',
        espacoCedido: eventToEdit.espacoCedido || 'Parque do Povo',
        areaEspacoCedido: eventToEdit.areaEspacoCedido || '',
        areasParqueDoPovo: eventToEdit.areasParqueDoPovo || ['PIRAMIDE'],
        banheirosDisponibilizados: eventToEdit.banheirosDisponibilizados || ['BANHEIRO_PIRAMIDE'],
        enderecoLocal: eventToEdit.enderecoLocal || 'Rua Sebastião Donato, Centro - Campina Grande/PB',
        dataInicio: eventToEdit.dataInicio || new Date().toISOString().slice(0, 10),
        dataHoraPrevisaoInicio: eventToEdit.dataHoraPrevisaoInicio || `${new Date().toISOString().slice(0, 10)}T08:00`,
        dataHoraPrevisaoFim: eventToEdit.dataHoraPrevisaoFim || `${new Date().toISOString().slice(0, 10)}T22:00`,
        periodoMontagem: eventToEdit.periodoMontagem || '',
        periodoDesmontagem: eventToEdit.periodoDesmontagem || '',
        responsavelSedeNome: eventToEdit.responsavelSedeNome || 'Fiscal de Vistoria da SEDE',
        responsavelSedeMatricula: eventToEdit.responsavelSedeMatricula || 'SEDE-4412',
        observacoesGerais: eventToEdit.observacoesGerais || '',
      });
    } else {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const defaultAreas: ('PARTE_SUPERIOR' | 'PIRAMIDE' | 'PARTE_INFERIOR')[] = ['PIRAMIDE'];
      const defaultBanheiros: ('BANHEIRO_SUPERIOR' | 'BANHEIRO_PIRAMIDE')[] = ['BANHEIRO_PIRAMIDE'];

      setFormData({
        codigo: `PROC-${year}/${rand}`,
        processoProtocolo: `PA-${year}/${rand}-SEDE`,
        nome: '',
        tipo: 'Evento / Cessão de Espaço Público',
        contratante: '',
        docContratante: '',
        representanteLegal: '',
        cpfRepresentanteLegal: '',
        responsavelEvento: '',
        telefoneResponsavel: '',
        emailResponsavel: '',
        espacoCedido: 'Parque do Povo',
        areaEspacoCedido: updateAreaDescription(defaultAreas, defaultBanheiros),
        areasParqueDoPovo: defaultAreas,
        banheirosDisponibilizados: defaultBanheiros,
        enderecoLocal: 'Rua Sebastião Donato, Centro - Campina Grande/PB',
        dataInicio: new Date().toISOString().slice(0, 10),
        dataHoraPrevisaoInicio: `${new Date().toISOString().slice(0, 10)}T08:00`,
        dataHoraPrevisaoFim: `${new Date().toISOString().slice(0, 10)}T22:00`,
        periodoMontagem: '08:00 às 18:00',
        periodoDesmontagem: 'Até as 14:00',
        responsavelSedeNome: 'Fiscal de Vistoria da SEDE',
        responsavelSedeMatricula: 'SEDE-4412',
        observacoesGerais: '',
      });
    }
    setErrorMessage('');
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleArea = (area: 'PARTE_SUPERIOR' | 'PIRAMIDE' | 'PARTE_INFERIOR') => {
    let newAreas = [...formData.areasParqueDoPovo];
    if (newAreas.includes(area)) {
      if (newAreas.length === 1) {
        alert('Pelo menos uma área do Parque do Povo deve permanecer selecionada.');
        return;
      }
      newAreas = newAreas.filter((a) => a !== area);
    } else {
      newAreas.push(area);
    }

    // Ajusta banheiros se a área for desmarcada
    let newBanheiros = [...formData.banheirosDisponibilizados];
    if (!newAreas.includes('PARTE_SUPERIOR')) {
      newBanheiros = newBanheiros.filter((b) => b !== 'BANHEIRO_SUPERIOR');
    }
    if (!newAreas.includes('PIRAMIDE')) {
      newBanheiros = newBanheiros.filter((b) => b !== 'BANHEIRO_PIRAMIDE');
    }

    const newDesc = updateAreaDescription(newAreas, newBanheiros);
    setFormData({
      ...formData,
      areasParqueDoPovo: newAreas,
      banheirosDisponibilizados: newBanheiros,
      areaEspacoCedido: newDesc,
    });
  };

  const handleToggleBanheiro = (banheiro: 'BANHEIRO_SUPERIOR' | 'BANHEIRO_PIRAMIDE') => {
    let newBanheiros = [...formData.banheirosDisponibilizados];
    if (newBanheiros.includes(banheiro)) {
      newBanheiros = newBanheiros.filter((b) => b !== banheiro);
    } else {
      newBanheiros.push(banheiro);
    }

    const newDesc = updateAreaDescription(formData.areasParqueDoPovo, newBanheiros);
    setFormData({
      ...formData,
      banheirosDisponibilizados: newBanheiros,
      areaEspacoCedido: newDesc,
    });
  };

  const handleSelectAllParque = () => {
    const allAreas: ('PARTE_SUPERIOR' | 'PIRAMIDE' | 'PARTE_INFERIOR')[] = ['PARTE_SUPERIOR', 'PIRAMIDE', 'PARTE_INFERIOR'];
    const allBanheiros: ('BANHEIRO_SUPERIOR' | 'BANHEIRO_PIRAMIDE')[] = ['BANHEIRO_SUPERIOR', 'BANHEIRO_PIRAMIDE'];
    setFormData({
      ...formData,
      areasParqueDoPovo: allAreas,
      banheirosDisponibilizados: allBanheiros,
      areaEspacoCedido: updateAreaDescription(allAreas, allBanheiros),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErrorMessage('O nome do evento/atividade é obrigatório.');
      return;
    }
    if (!formData.contratante.trim()) {
      setErrorMessage('O Cessionário(a) é obrigatório.');
      return;
    }
    if (!formData.espacoCedido.trim()) {
      setErrorMessage('O local cedido é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        responsavelEvento: formData.representanteLegal || formData.responsavelEvento || formData.contratante,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao salvar cessão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-4 sm:my-8 animate-scale-in">
        {/* Modal Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {eventToEdit ? 'Editar Dados da Cessão de Espaço' : 'Cadastro de Cessão — SEDE Campina Grande'}
              </h2>
              <p className="text-xs text-slate-400">
                Secretaria de Desenvolvimento Econômico e Turismo • Município de Campina Grande
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Seção 1: Processo e Dados do Evento */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <FileText className="w-4 h-4 text-teal-600" />
              1. Processo e Identificação do Evento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Processo / Protocolo SEDE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.processoProtocolo}
                  onChange={(e) =>
                    setFormData({ ...formData, processoProtocolo: e.target.value, codigo: e.target.value })
                  }
                  placeholder="Ex: PA-2026/0442-SEDE"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Evento / Atividade *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: 38º Salão de Artesanato da Paraíba"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo / Finalidade da Cessão
              </label>
              <input
                type="text"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex: Feira / Exposição Cultural / Show Musical"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
              />
            </div>
          </div>

          {/* Seção 2: Cessionário(a) e Representante Legal */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <User className="w-4 h-4 text-teal-600" />
              2. Dados do(a) Cessionário(a) e Representante
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cessionário(a) (Pessoa Física ou Jurídica) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contratante}
                  onChange={(e) => setFormData({ ...formData, contratante: e.target.value })}
                  placeholder="Ex: Associação dos Produtores da PB"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPF / CNPJ do Cessionário
                </label>
                <input
                  type="text"
                  value={formData.docContratante}
                  onChange={(e) => setFormData({ ...formData, docContratante: e.target.value })}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Representante Legal
                </label>
                <input
                  type="text"
                  value={formData.representanteLegal}
                  onChange={(e) => setFormData({ ...formData, representanteLegal: e.target.value })}
                  placeholder="Ex: Dr. Antônio Marcos Nóbrega"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPF do Representante Legal
                </label>
                <input
                  type="text"
                  value={formData.cpfRepresentanteLegal}
                  onChange={(e) => setFormData({ ...formData, cpfRepresentanteLegal: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={formData.telefoneResponsavel}
                  onChange={(e) => setFormData({ ...formData, telefoneResponsavel: e.target.value })}
                  placeholder="(83) 99999-9999"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={formData.emailResponsavel}
                  onChange={(e) => setFormData({ ...formData, emailResponsavel: e.target.value })}
                  placeholder="contato@exemplo.com.br"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Espaço Cedido & Áreas do Parque do Povo com Banheiros */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <MapPin className="w-4 h-4 text-teal-600" />
              3. Espaço Cedido e Áreas do Parque do Povo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local Cedido *
                </label>
                <select
                  value={formData.espacoCedido}
                  onChange={(e) => setFormData({ ...formData, espacoCedido: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white min-h-[42px]"
                >
                  <option value="Parque do Povo">Parque do Povo (Campina Grande)</option>
                  <option value="Estação Cidadania">Estação Cidadania</option>
                  <option value="Auditório SEDE">Auditório da SEDE</option>
                  <option value="Complexo Multiuso">Complexo Multiuso</option>
                  <option value="Outro Espaço Público">Outro Espaço Público</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço do Local
                </label>
                <input
                  type="text"
                  value={formData.enderecoLocal}
                  onChange={(e) => setFormData({ ...formData, enderecoLocal: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>
            </div>

            {/* SELETOR INTERATIVO DAS 3 ÁREAS DO PARQUE DO POVO */}
            {isParqueDoPovo && (
              <div className="bg-teal-50/60 p-4 sm:p-5 rounded-2xl border border-teal-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Áreas do Parque do Povo Incluídas na Cessão
                    </h4>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      Selecione 1, 2 ou todas as 3 áreas que farão parte do termo de cessão e vistoria:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllParque}
                    className="text-[11px] font-bold text-teal-800 hover:text-teal-950 bg-teal-200/70 hover:bg-teal-200 px-3 py-1.5 rounded-lg transition self-start sm:self-center"
                  >
                    Todo o Parque do Povo
                  </button>
                </div>

                {/* 3 Áreas Principais */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Área 1: Parte Superior */}
                  <button
                    type="button"
                    onClick={() => handleToggleArea('PARTE_SUPERIOR')}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                      formData.areasParqueDoPovo.includes('PARTE_SUPERIOR')
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">1. Parte Superior</div>
                      <div className={`text-[10px] mt-0.5 ${formData.areasParqueDoPovo.includes('PARTE_SUPERIOR') ? 'text-teal-100' : 'text-slate-500'}`}>
                        Área superior e acessos
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        formData.areasParqueDoPovo.includes('PARTE_SUPERIOR')
                          ? 'bg-white text-teal-700 border-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.areasParqueDoPovo.includes('PARTE_SUPERIOR') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>

                  {/* Área 2: Pirâmide */}
                  <button
                    type="button"
                    onClick={() => handleToggleArea('PIRAMIDE')}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                      formData.areasParqueDoPovo.includes('PIRAMIDE')
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">2. Pirâmide</div>
                      <div className={`text-[10px] mt-0.5 ${formData.areasParqueDoPovo.includes('PIRAMIDE') ? 'text-teal-100' : 'text-slate-500'}`}>
                        Pavilhão central coberto
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        formData.areasParqueDoPovo.includes('PIRAMIDE')
                          ? 'bg-white text-teal-700 border-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.areasParqueDoPovo.includes('PIRAMIDE') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>

                  {/* Área 3: Parte Inferior */}
                  <button
                    type="button"
                    onClick={() => handleToggleArea('PARTE_INFERIOR')}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                      formData.areasParqueDoPovo.includes('PARTE_INFERIOR')
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">3. Parte Inferior</div>
                      <div className={`text-[10px] mt-0.5 ${formData.areasParqueDoPovo.includes('PARTE_INFERIOR') ? 'text-teal-100' : 'text-slate-500'}`}>
                        Área inferior e pátio
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        formData.areasParqueDoPovo.includes('PARTE_INFERIOR')
                          ? 'bg-white text-teal-700 border-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.areasParqueDoPovo.includes('PARTE_INFERIOR') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                </div>

                {/* DISPONIBILIZAÇÃO DE SANITÁRIOS / BANHEIROS */}
                {(formData.areasParqueDoPovo.includes('PARTE_SUPERIOR') || formData.areasParqueDoPovo.includes('PIRAMIDE')) && (
                  <div className="pt-2 border-t border-teal-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-teal-950 uppercase tracking-wider block">
                      Disponibilização de Sanitários / Banheiros:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {formData.areasParqueDoPovo.includes('PARTE_SUPERIOR') && (
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-teal-200 cursor-pointer hover:bg-teal-50/50 transition">
                          <input
                            type="checkbox"
                            checked={formData.banheirosDisponibilizados.includes('BANHEIRO_SUPERIOR')}
                            onChange={() => handleToggleBanheiro('BANHEIRO_SUPERIOR')}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            Disponibilizar Banheiros da Parte Superior
                          </span>
                        </label>
                      )}

                      {formData.areasParqueDoPovo.includes('PIRAMIDE') && (
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-teal-200 cursor-pointer hover:bg-teal-50/50 transition">
                          <input
                            type="checkbox"
                            checked={formData.banheirosDisponibilizados.includes('BANHEIRO_PIRAMIDE')}
                            onChange={() => handleToggleBanheiro('BANHEIRO_PIRAMIDE')}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            Disponibilizar Banheiros da Pirâmide
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-teal-950 mb-1">
                    Descrição Consolidada do Espaço Cedido:
                  </label>
                  <input
                    type="text"
                    value={formData.areaEspacoCedido}
                    onChange={(e) => setFormData({ ...formData, areaEspacoCedido: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-teal-300 bg-white font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seção 4: Datas e Horários Oficiais */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <Calendar className="w-4 h-4 text-teal-600" />
              4. Período de Utilização, Montagem e Desmontagem
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Início do Período de Utilização *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dataHoraPrevisaoInicio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dataHoraPrevisaoInicio: e.target.value,
                      dataInicio: e.target.value.slice(0, 10),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Término do Período de Utilização *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dataHoraPrevisaoFim}
                  onChange={(e) => setFormData({ ...formData, dataHoraPrevisaoFim: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Período de Montagem
                </label>
                <input
                  type="text"
                  value={formData.periodoMontagem}
                  onChange={(e) => setFormData({ ...formData, periodoMontagem: e.target.value })}
                  placeholder="Ex: Das 08h às 18h do dia anterior"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Período de Desmontagem
                </label>
                <input
                  type="text"
                  value={formData.periodoDesmontagem}
                  onChange={(e) => setFormData({ ...formData, periodoDesmontagem: e.target.value })}
                  placeholder="Ex: Até as 12h do dia seguinte ao término"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações Gerais da Cessão
              </label>
              <textarea
                rows={2}
                value={formData.observacoesGerais}
                onChange={(e) => setFormData({ ...formData, observacoesGerais: e.target.value })}
                placeholder="Observações complementares, restrições ou termos vinculados ao processo..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* 5. FISCALIZAÇÃO E RESPONSÁVEL SEDE */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              5. Fiscalização e Responsável da Vistoria (SEDE)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fiscal / Responsável Designado SEDE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.responsavelSedeNome}
                  onChange={(e) => setFormData({ ...formData, responsavelSedeNome: e.target.value })}
                  placeholder="Nome completo do fiscal da SEDE..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Matrícula Funcional SEDE
                </label>
                <input
                  type="text"
                  value={formData.responsavelSedeMatricula}
                  onChange={(e) => setFormData({ ...formData, responsavelSedeMatricula: e.target.value })}
                  placeholder="Ex: SEDE-4412 ou matrícula do servidor"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition min-h-[40px]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 active:scale-95 transition min-h-[40px]"
            >
              {isSubmitting ? 'Salvando...' : eventToEdit ? 'Atualizar Cessão' : 'Cadastrar Cessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
