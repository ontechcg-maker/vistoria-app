import type { ItemVistoria, ComparisonResult } from '../types/vistoria';

export interface ComparisonSummary {
  totalItens: number;
  semAlteracao: number;
  alteracoes: number;
  danos: number;
  itensAusentes: number;
  melhorias: number;
  naoComparados: number;
  itensDivergentes: {
    item: ItemVistoria;
    motivo: string;
  }[];
}

/**
 * Calcula a comparação automática entre a situação do item na vistoria inicial e na final
 */
export function calculateComparisonResult(
  situacaoInicial: string,
  situacaoFinal: string,
  _observacaoFinal?: string
): ComparisonResult {
  if (!situacaoInicial || !situacaoFinal) {
    return 'NAO_FOI_POSSIVEL_COMPARAR';
  }

  if (situacaoInicial === 'NAO_SE_APLICA' && situacaoFinal === 'NAO_SE_APLICA') {
    return 'SEM_ALTERACAO';
  }

  // De qualquer situação para RUIM -> Dano identificado
  if (situacaoFinal === 'RUIM' || situacaoFinal === 'NAO_CONFORME') {
    return 'DANO_IDENTIFICADO';
  }

  // De BOM para REGULAR -> Alteração identificada
  if (situacaoInicial === 'BOM' && situacaoFinal === 'REGULAR') {
    return 'ALTERACAO_IDENTIFICADA';
  }

  // De REGULAR para RUIM -> Dano identificado
  if (situacaoInicial === 'REGULAR' && situacaoFinal === 'RUIM') {
    return 'DANO_IDENTIFICADO';
  }

  // De NAO_SE_APLICA para REGULAR -> Alteração identificada
  if (situacaoInicial === 'NAO_SE_APLICA' && situacaoFinal === 'REGULAR') {
    return 'ALTERACAO_IDENTIFICADA';
  }

  // Se melhorou (ex: de REGULAR/RUIM para BOM)
  if ((situacaoInicial === 'RUIM' || situacaoInicial === 'REGULAR') && situacaoFinal === 'BOM') {
    return 'MELHORIA_OU_AJUSTE';
  }

  // Compatibilidade legada
  if (situacaoInicial === 'CONFORME' && situacaoFinal === 'NAO_CONFORME') return 'DANO_IDENTIFICADO';
  if (situacaoInicial === 'CONFORME' && situacaoFinal === 'COM_RESSALVA') return 'ALTERACAO_IDENTIFICADA';

  if (situacaoInicial === situacaoFinal) {
    return 'SEM_ALTERACAO';
  }

  if (situacaoFinal === 'REGULAR' || situacaoFinal === 'COM_RESSALVA') {
    return 'ALTERACAO_IDENTIFICADA';
  }

  return 'ALTERACAO_IDENTIFICADA';
}

/**
 * Gera um resumo consolidado de divergências da vistoria final
 */
export function generateComparisonSummary(
  itensFinais: ItemVistoria[],
  itensIniciais: ItemVistoria[]
): ComparisonSummary {
  const mapIniciais = new Map<string, ItemVistoria>();
  itensIniciais.forEach(i => {
    mapIniciais.set(i.id, i);
    mapIniciais.set(`${i.ambiente}:::${i.descricao}`, i);
  });

  const summary: ComparisonSummary = {
    totalItens: itensFinais.length,
    semAlteracao: 0,
    alteracoes: 0,
    danos: 0,
    itensAusentes: 0,
    melhorias: 0,
    naoComparados: 0,
    itensDivergentes: [],
  };

  itensFinais.forEach(itemFinal => {
    const itemInicial = itemFinal.itemOriginalId 
      ? mapIniciais.get(itemFinal.itemOriginalId) 
      : mapIniciais.get(`${itemFinal.ambiente}:::${itemFinal.descricao}`);

    const resultado = itemFinal.resultadoComparacao || 
      (itemInicial ? calculateComparisonResult(itemInicial.situacao, itemFinal.situacao, itemFinal.observacao) : 'NAO_FOI_POSSIVEL_COMPARAR');

    switch (resultado) {
      case 'SEM_ALTERACAO':
        summary.semAlteracao++;
        break;
      case 'ALTERACAO_IDENTIFICADA':
        summary.alteracoes++;
        summary.itensDivergentes.push({
          item: itemFinal,
          motivo: itemFinal.justificativaDivergencia || itemFinal.observacao || 'Alteração identificada após o evento',
        });
        break;
      case 'DANO_IDENTIFICADO':
        summary.danos++;
        summary.itensDivergentes.push({
          item: itemFinal,
          motivo: itemFinal.justificativaDivergencia || itemFinal.observacao || 'Dano ou avaria identificada após o evento',
        });
        break;
      case 'ITEM_AUSENTE':
        summary.itensAusentes++;
        summary.itensDivergentes.push({
          item: itemFinal,
          motivo: itemFinal.justificativaDivergencia || itemFinal.observacao || 'Item ausente ou não localizado',
        });
        break;
      case 'MELHORIA_OU_AJUSTE':
        summary.melhorias++;
        break;
      default:
        summary.naoComparados++;
        break;
    }
  });

  return summary;
}

export function getComparisonLabel(result?: ComparisonResult): { label: string; color: string; badgeClass: string } {
  switch (result) {
    case 'SEM_ALTERACAO':
      return { label: 'Sem alteração identificada', color: '#16a34a', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'ALTERACAO_IDENTIFICADA':
      return { label: 'Alteração identificada', color: '#d97706', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'DANO_IDENTIFICADO':
      return { label: 'Dano identificado', color: '#dc2626', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
    case 'ITEM_AUSENTE':
      return { label: 'Item ausente / não localizado', color: '#9333ea', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'MELHORIA_OU_AJUSTE':
      return { label: 'Melhoria ou ajuste realizado', color: '#2563eb', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'NAO_FOI_POSSIVEL_COMPARAR':
    default:
      return { label: 'Não foi possível comparar', color: '#64748b', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getItemStatusLabel(status: string): { label: string; badgeClass: string } {
  switch (status) {
    case 'BOM':
    case 'CONFORME':
      return { label: 'Bom', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'REGULAR':
    case 'COM_RESSALVA':
      return { label: 'Regular', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'RUIM':
    case 'NAO_CONFORME':
      return { label: 'Ruim', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'NAO_SE_APLICA':
      return { label: 'N/A', badgeClass: 'bg-slate-100 text-slate-600 border-slate-300' };
    default:
      return { label: status, badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
}
