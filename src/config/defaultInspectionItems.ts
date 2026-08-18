import type { CondicaoItem, Evento } from '../types/vistoria';

export interface DefaultItemTemplate {
  ambiente: string;
  descricao: string;
  quantidade?: number;
  situacaoPadrao: CondicaoItem;
}

export const AMBIENTES_PADRAO = [
  'Parque do Povo — Parte Superior',
  'Parque do Povo — Pirâmide',
  'Parque do Povo — Parte Inferior',
  'Instalações Gerais e Estrutura',
  'Instalações Hidrossanitárias e Elétricas',
  'Mobiliário, Bens e Outros',
];

export const ITENS_VISTORIA_OFICIAIS_SEDE: DefaultItemTemplate[] = [
  {
    ambiente: 'Instalações Gerais e Estrutura',
    descricao: 'Piso / pavimentação',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Gerais e Estrutura',
    descricao: 'Paredes / muros / gradis',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Gerais e Estrutura',
    descricao: 'Portões / portas / fechaduras / acessos',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Gerais e Estrutura',
    descricao: 'Estruturas existentes no local',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Hidrossanitárias e Elétricas',
    descricao: 'Instalações elétricas',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Hidrossanitárias e Elétricas',
    descricao: 'Instalações hidráulicas',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Hidrossanitárias e Elétricas',
    descricao: 'Iluminação',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Instalações Hidrossanitárias e Elétricas',
    descricao: 'Banheiros / instalações sanitárias',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Mobiliário, Bens e Outros',
    descricao: 'Mobiliário / equipamentos / bens disponibilizados',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Mobiliário, Bens e Outros',
    descricao: 'Limpeza / conservação geral',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Mobiliário, Bens e Outros',
    descricao: 'Sinalização / comunicação visual existente',
    situacaoPadrao: 'BOM',
  },
  {
    ambiente: 'Mobiliário, Bens e Outros',
    descricao: 'Outras condições relevantes',
    situacaoPadrao: 'BOM',
  },
];

export const ITENS_VISTORIA_PADRAO = ITENS_VISTORIA_OFICIAIS_SEDE;

/**
 * Gera os itens de vistoria oficiais personalizados com base nas áreas selecionadas do Parque do Povo
 * e nos banheiros que foram disponibilizados para a cessão.
 */
export function getCustomInspectionItems(evento: Partial<Evento>): DefaultItemTemplate[] {
  const isParqueDoPovo =
    evento.espacoCedido?.toLowerCase().includes('parque do povo') ||
    evento.areaEspacoCedido?.toLowerCase().includes('parque do povo');

  const areas = evento.areasParqueDoPovo || [];
  const banheiros = evento.banheirosDisponibilizados || [];

  if (!isParqueDoPovo || areas.length === 0) {
    // Se for outro espaço ou não foram selecionadas subáreas específicas, usa o checklist oficial padrão
    return ITENS_VISTORIA_OFICIAIS_SEDE;
  }

  const items: DefaultItemTemplate[] = [];

  // 1. PARTE SUPERIOR
  if (areas.includes('PARTE_SUPERIOR')) {
    items.push(
      {
        ambiente: 'Parque do Povo — Parte Superior',
        descricao: 'Piso / pavimentação da Parte Superior',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Parte Superior',
        descricao: 'Muros / gradis / guarda-corpos da Parte Superior',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Parte Superior',
        descricao: 'Portões / acessos da Parte Superior',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Parte Superior',
        descricao: 'Iluminação e instalações elétricas da Parte Superior',
        situacaoPadrao: 'BOM',
      }
    );

    if (banheiros.includes('BANHEIRO_SUPERIOR')) {
      items.push({
        ambiente: 'Parque do Povo — Parte Superior',
        descricao: 'Banheiros / instalações sanitárias da Parte Superior',
        situacaoPadrao: 'BOM',
      });
    }
  }

  // 2. PIRÂMIDE
  if (areas.includes('PIRAMIDE')) {
    items.push(
      {
        ambiente: 'Parque do Povo — Pirâmide',
        descricao: 'Piso / pavimentação da Pirâmide Central',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Pirâmide',
        descricao: 'Cobertura e estrutura metálica da Pirâmide',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Pirâmide',
        descricao: 'Portões de acesso e portas da Pirâmide',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Pirâmide',
        descricao: 'Instalações elétricas e iluminação da Pirâmide',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Pirâmide',
        descricao: 'Instalações hidráulicas da Pirâmide',
        situacaoPadrao: 'BOM',
      }
    );

    if (banheiros.includes('BANHEIRO_PIRAMIDE')) {
      items.push({
        ambiente: 'Parque do Povo — Pirâmide',
        descricao: 'Banheiros / instalações sanitárias da Pirâmide',
        situacaoPadrao: 'BOM',
      });
    }
  }

  // 3. PARTE INFERIOR
  if (areas.includes('PARTE_INFERIOR')) {
    items.push(
      {
        ambiente: 'Parque do Povo — Parte Inferior',
        descricao: 'Piso / pavimentação da Parte Inferior',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Parte Inferior',
        descricao: 'Paredes / muros / gradis da Parte Inferior',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Parte Inferior',
        descricao: 'Portões e acessos da Parte Inferior',
        situacaoPadrao: 'BOM',
      },
      {
        ambiente: 'Parque do Povo — Parte Inferior',
        descricao: 'Iluminação e instalações elétricas da Parte Inferior',
        situacaoPadrao: 'BOM',
      }
    );
  }

  // 4. ITENS GERAIS E CONSERVAÇÃO (Aplicados a qualquer cessão do Parque do Povo)
  items.push(
    {
      ambiente: 'Mobiliário, Bens e Outros',
      descricao: 'Mobiliário / equipamentos / bens disponibilizados',
      situacaoPadrao: 'BOM',
    },
    {
      ambiente: 'Mobiliário, Bens e Outros',
      descricao: 'Limpeza / conservação geral do espaço cedido',
      situacaoPadrao: 'BOM',
    },
    {
      ambiente: 'Mobiliário, Bens e Outros',
      descricao: 'Sinalização / comunicação visual existente',
      situacaoPadrao: 'BOM',
    },
    {
      ambiente: 'Mobiliário, Bens e Outros',
      descricao: 'Outras condições relevantes identificadas',
      situacaoPadrao: 'BOM',
    }
  );

  return items;
}
