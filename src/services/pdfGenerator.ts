import { jsPDF } from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';
import type { Evento, Vistoria, ItemVistoria, FotoVistoria, TipoDocumentoPdf } from '../types/vistoria';
import { getComparisonLabel, calculateComparisonResult } from './comparisonService';
import { LOGO_SEDE_BASE64 } from '../assets/logoSede';

interface GeneratePdfOptions {
  evento: Evento;
  vistoriaInicial?: Vistoria;
  vistoriaFinal?: Vistoria;
  itensIniciais: ItemVistoria[];
  itensFinais: ItemVistoria[];
  fotos: FotoVistoria[];
  isDraft?: boolean;
  tipoDocumento?: TipoDocumentoPdf;
}

export async function generateTermoVistoriaPdf(options: GeneratePdfOptions): Promise<jsPDF> {
  const {
    evento,
    vistoriaInicial,
    vistoriaFinal,
    itensIniciais,
    itensFinais,
    fotos,
    isDraft,
    tipoDocumento = 'COMPLETO',
  } = options;

  const isTermoInicial = tipoDocumento === 'INICIAL_ENTREGA';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Cores institucionais da Prefeitura de Campina Grande / SEDE
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const secondaryColor: [number, number, number] = [13, 148, 136]; // Teal-600
  const dangerColor: [number, number, number] = [225, 29, 72]; // Rose-600

  // Helper para desenhar cabeçalho de seção
  const drawSectionHeader = (title: string, subTitle?: string) => {
    checkPageBreak(18);
    doc.setFillColor(...primaryColor);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), margin + 3, currentY + 5.2);

    if (subTitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(subTitle, pageWidth - margin - 3, currentY + 5.2, { align: 'right' });
    }

    currentY += 10.5;
  };

  // Helper para verificar quebra de página
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      currentY = margin + 4;
      return true;
    }
    return false;
  };

  // Marca d'água de rascunho
  if (isDraft) {
    doc.setFontSize(32);
    doc.setTextColor(230, 230, 230);
    doc.setFont('helvetica', 'bold');
    doc.text('RASCUNHO PRELIMINAR', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
  }

  // --- CABEÇALHO INSTITUCIONAL OFICIAL SEDE COM LOGOTIPO ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 4, 'F');
  doc.setFillColor(...secondaryColor);
  doc.rect(0, 4, pageWidth, 2, 'F');

  currentY = 10;

  // Inserir Logotipo Oficial da SEDE Campina Grande
  try {
    const logoWidth = 72;
    const logoHeight = 15;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(LOGO_SEDE_BASE64, 'PNG', logoX, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 4;
  } catch (err) {
    console.warn('Erro ao inserir logotipo no PDF:', err);
    currentY += 12;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Rua Dr. Chateaubriand, 176 – São José; CEP 58400-396 • Tel: (83) 3330-0954 • secdesenvolvimentopmcg@gmail.com', pageWidth / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // Título do Instrumento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);

  const mainTitle = isTermoInicial
    ? 'TERMO DE RESPONSABILIDADE E VISTORIA INICIAL DE ENTREGA'
    : 'TERMO DE RESPONSABILIDADE E VISTORIA DE USO DE ESPAÇO PÚBLICO';

  doc.text(mainTitle, pageWidth / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const subDocTitle = isTermoInicial
    ? 'Condições de Entrega do Espaço Público e Visto de Responsabilidade do(a) Cessionário(a)'
    : 'Documento complementar ao Termo de Cessão de Uso por Tempo Determinado (Vistoria Inicial e Final)';

  doc.text(subDocTitle, pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;

  // Preâmbulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(51, 65, 85);
  const preambulo = `Pelo presente instrumento, de um lado, a SECRETARIA DE DESENVOLVIMENTO ECONÔMICO E TURISMO DO MUNICÍPIO DE CAMPINA GRANDE – SEDE, com sede na Rua Dr. Chateaubriand, nº 176, São José, Campina Grande/PB, doravante denominada CEDENTE, e, de outro lado, o(a) CESSIONÁRIO(A) identificado(a) neste instrumento, resolvem firmar o presente TERMO DE RESPONSABILIDADE E VISTORIA, vinculado ao respectivo Termo de Cessão de Uso por Tempo Determinado, mediante as condições abaixo estabelecidas.`;
  const splitPreambulo = doc.splitTextToSize(preambulo, pageWidth - margin * 2);
  doc.text(splitPreambulo, margin, currentY);
  currentY += splitPreambulo.length * 3.2 + 3;

  // --- SEÇÃO 1: IDENTIFICAÇÃO DA CESSÃO ---
  drawSectionHeader('1. Identificação da Cessão e Espaços');

  const dadosCessao: [string, string, string, string][] = [
    ['CESSIONÁRIO(A):', evento.contratante || '-', 'CPF/CNPJ:', evento.docContratante || '-'],
    ['REPRESENTANTE LEGAL:', evento.representanteLegal || evento.responsavelEvento || '-', 'CPF REPRESENTANTE:', evento.cpfRepresentanteLegal || '-'],
    ['TELEFONE / CONTATO:', evento.telefoneResponsavel || '-', 'E-MAIL:', evento.emailResponsavel || '-'],
    ['EVENTO / ATIVIDADE:', evento.nome || '-', 'PROCESSO / PROTOCOLO:', evento.processoProtocolo || evento.codigo || '-'],
    ['LOCAL CEDIDO:', evento.espacoCedido || '-', 'ÁREAS / ESPAÇOS:', evento.areaEspacoCedido || evento.enderecoLocal || '-'],
    ['PERÍODO DE UTILIZAÇÃO:', `${formatDate(evento.dataHoraPrevisaoInicio)} até ${formatDate(evento.dataHoraPrevisaoFim)}`, 'ENCERRAMENTO REAL:', evento.dataHoraRealFim ? formatDate(evento.dataHoraRealFim) : (isTermoInicial ? 'Aguardando encerramento' : 'Não registrado')],
    ['PERÍODO MONTAGEM:', evento.periodoMontagem || 'Conforme cronograma', 'PERÍODO DESMONTAGEM:', evento.periodoDesmontagem || 'Conforme cronograma'],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: dadosCessao.map(row => [
      { content: row[0], styles: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 42 } },
      { content: row[1], styles: { textColor: [15, 23, 42] } },
      { content: row[2], styles: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 40 } },
      { content: row[3], styles: { textColor: [15, 23, 42] } },
    ]),
    theme: 'grid',
    styles: { fontSize: 7.2, cellPadding: 1.6, lineColor: [226, 232, 240], lineWidth: 0.1 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  } as UserOptions);

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // --- SEÇÃO 2: DO OBJETO E RESPONSABILIDADES JURÍDICAS (16 CLÁUSULAS OFICIAIS SEDE) ---
  checkPageBreak(30);
  drawSectionHeader('2. Do Objeto e Termo de Responsabilidade');

  const clausulasOficiais = [
    '2.1. O presente Termo tem por finalidade registrar as condições de conservação, integridade e funcionamento do espaço público cedido, antes da montagem/início do evento (Vistoria Inicial) e após o término da desmontagem/devolução (Vistoria Final).',
    '2.2. A vistoria será realizada por servidores formalmente designados pela Secretaria de Desenvolvimento Econômico e Turismo – SEDE, acompanhados pelo(a) CESSIONÁRIO(A) ou por seu representante legal expressamente indicado.',
    '2.3. O(A) CESSIONÁRIO(A) declara que recebe o espaço público nas condições descritas no Laudo/Ficha de Vistoria Inicial, assumindo integral responsabilidade pela guarda, conservação, manutenção e segurança de todas as estruturas, instalações e bens móveis ou imóveis existentes no local.',
    '2.4. São de exclusiva responsabilidade do(a) CESSIONÁRIO(A) todos os custos, encargos, providências e autorizações necessárias à realização do evento, incluindo segurança privada, brigada de incêndio, limpeza contínua e destinação correta dos resíduos sólidos.',
    '2.5. É terminantemente proibida qualquer modificação estrutural, furação de pisos, paredes ou tetos, corte de árvores, intervenção na rede elétrica ou hidráulica, ou instalação de qualquer equipamento que possa causar dano ao patrimônio público, sem autorização prévia e expressa da SEDE.',
    '2.6. O(A) CESSIONÁRIO(A) responderá civil, administrativa e penalmente por quaisquer danos, avarias, furtos, extravios, depredações ou prejuízos causados ao espaço público, às suas instalações ou a terceiros durante todo o período da cessão, inclusive durante a montagem e desmontagem.',
    '2.7. Constatada qualquer avaria ou dano no momento da Vistoria Final, o(a) CESSIONÁRIO(A) será formalmente notificado(a) para proceder ao imediato reparo, substituição ou ressarcimento ao erário municipal, no prazo improrrogável estabelecido pela fiscalização da SEDE.',
    '2.8. O não cumprimento das obrigações de reparação ensejará a imediata adoção das medidas judiciais e administrativas cabíveis, inscrição na dívida ativa municipal, além da suspensão de novas concessões ou autorizações de uso de espaços públicos.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  clausulasOficiais.forEach(clausula => {
    checkPageBreak(10);
    const lines = doc.splitTextToSize(clausula, pageWidth - margin * 2);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 2.8 + 1.2;
  });

  currentY += 2;

  // --- SEÇÃO 3: LAUDO DE VISTORIA ---
  if (isTermoInicial) {
    // --- TERMO DE VISTORIA INICIAL (ENTREGA) ---
    checkPageBreak(35);
    drawSectionHeader(
      '3. Ficha de Vistoria Inicial — Condições de Entrega',
      `Homologada por: ${vistoriaInicial?.responsavelSedeNome || vistoriaInicial?.responsavelNome || 'Fiscal SEDE'}`
    );

    const rowsItensInicial = itensIniciais.map((item, idx) => [
      String(idx + 1).padStart(2, '0'),
      item.ambiente,
      item.descricao,
      item.situacao,
      item.observacao || 'Conforme vistoriado (sem ressalvas)',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Item', 'Ambiente / Área', 'Descrição da Condição Inspecionada', 'Situação', 'Observações / Ressalvas de Entrega']],
      body: rowsItensInicial,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 7.2 },
      styles: { fontSize: 6.8, cellPadding: 1.6, lineColor: [226, 232, 240], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 55 },
        3: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
        4: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.raw as string;
          if (val === 'BOM') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fillColor = [240, 253, 244];
          } else if (val === 'REGULAR') {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fillColor = [254, 243, 199];
          } else if (val === 'RUIM') {
            data.cell.styles.textColor = [190, 18, 60];
            data.cell.styles.fillColor = [255, 228, 230];
          }
        }
      },
    } as UserOptions);

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // --- SEÇÃO 4: DECLARAÇÃO DE RECEBIMENTO E CIÊNCIA DO CESSIONÁRIO ---
    checkPageBreak(30);
    drawSectionHeader('4. Declaração de Recebimento e Ciência do Cessionário');

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.rect(margin, currentY, pageWidth - margin * 2, 16, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('DECLARAÇÃO EXPRESSA DE CIÊNCIA E RECEBIMENTO:', margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    const termoCiencia = `O(A) CESSIONÁRIO(A), por seu representante legal abaixo assinado, DECLARA TER RECEBIDO o espaço público acima especificado nas EXATAS CONDIÇÕES atestadas nesta Ficha de Vistoria Inicial, assumindo plena ciência e inteira responsabilidade pela guarda, conservação e fiel restituição do bem público nas mesmas condições ao término da cessão.`;
    const splitCiencia = doc.splitTextToSize(termoCiencia, pageWidth - margin * 2 - 6);
    doc.text(splitCiencia, margin + 3, currentY + 8.5);

    currentY += 21;
  } else {
    // --- TERMO COMPLETO (INICIAL X FINAL) ---
    checkPageBreak(35);
    drawSectionHeader('3. Laudo Técnico Comparativo de Vistoria (Inicial x Final)');

    const mapIniciais = new Map<string, ItemVistoria>();
    itensIniciais.forEach((i) => {
      mapIniciais.set(i.id, i);
      mapIniciais.set(`${i.ambiente}:::${i.descricao}`, i);
      mapIniciais.set(i.descricao.toLowerCase().trim(), i);
    });

    const rowsComparativo = itensFinais.map((itemFinal, idx) => {
      const itemIni = itemFinal.itemOriginalId
        ? mapIniciais.get(itemFinal.itemOriginalId)
        : (mapIniciais.get(`${itemFinal.ambiente}:::${itemFinal.descricao}`) || mapIniciais.get(itemFinal.descricao.toLowerCase().trim()));

      const sitIni = itemIni?.situacao || 'BOM';
      const sitFin = itemFinal.situacao || 'BOM';
      
      const compResultado = itemFinal.resultadoComparacao || calculateComparisonResult(sitIni, sitFin, itemFinal.observacao);
      const compLabel = getComparisonLabel(compResultado).label;
      
      const isDanoOuAlteracao =
        itemFinal.houveAlteracaoDano ||
        compResultado === 'DANO_IDENTIFICADO' ||
        compResultado === 'ALTERACAO_IDENTIFICADA' ||
        compResultado === 'ITEM_AUSENTE' ||
        sitFin === 'RUIM' ||
        (sitIni === 'BOM' && sitFin === 'REGULAR');

      const alteracao = isDanoOuAlteracao ? 'SIM' : 'NÃO';
      const obsProv = itemFinal.providenciaNecessaria || itemFinal.justificativaDivergencia || itemFinal.observacao || '-';

      return [
        String(idx + 1).padStart(2, '0'),
        itemFinal.descricao,
        sitIni,
        sitFin,
        alteracao,
        compLabel,
        obsProv,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Item', 'Descrição do Item Inspecionado', 'Inicial', 'Final', 'Alteração?', 'Resultado Comparativo', 'Providência / Ocorrência']],
      body: rowsComparativo,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 7 },
      styles: { fontSize: 6.8, cellPadding: 1.6, lineColor: [226, 232, 240], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 32 },
        6: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'SIM') {
            data.cell.styles.textColor = [190, 18, 60];
            data.cell.styles.fillColor = [255, 228, 230];
          }
        }
      },
    } as UserOptions);

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // --- SEÇÃO 4: RESUMO DE PENDÊNCIAS E PROVIDÊNCIAS ---
    checkPageBreak(25);
    drawSectionHeader('4. Registro de Ocorrências, Pendências e Providências');

    const itensComDano = itensFinais.filter((itemFinal) => {
      const itemIni = itemFinal.itemOriginalId
        ? mapIniciais.get(itemFinal.itemOriginalId)
        : (mapIniciais.get(`${itemFinal.ambiente}:::${itemFinal.descricao}`) || mapIniciais.get(itemFinal.descricao.toLowerCase().trim()));

      const sitIni = itemIni?.situacao || 'BOM';
      const sitFin = itemFinal.situacao || 'BOM';
      const compResultado = itemFinal.resultadoComparacao || calculateComparisonResult(sitIni, sitFin, itemFinal.observacao);

      return (
        itemFinal.houveAlteracaoDano ||
        compResultado === 'DANO_IDENTIFICADO' ||
        compResultado === 'ALTERACAO_IDENTIFICADA' ||
        compResultado === 'ITEM_AUSENTE' ||
        sitFin === 'RUIM' ||
        (sitIni === 'BOM' && sitFin === 'REGULAR') ||
        Boolean(itemFinal.justificativaDivergencia?.trim()) ||
        Boolean(itemFinal.providenciaNecessaria?.trim())
      );
    });

    const statusDev = vistoriaFinal?.devolucaoStatus || 'CONFORME';
    const temProvidenciasGerais = Boolean(
      vistoriaFinal?.providenciasPendencias?.trim() || vistoriaFinal?.observacoesGerais?.trim()
    );

    if (itensComDano.length > 0) {
      const rowsDanos = itensComDano.map((item, idx) => {
        const descOcorrencia =
          item.justificativaDivergencia ||
          item.observacao ||
          (item.situacao === 'RUIM' ? 'Avaria / dano constatado no pós-evento' : 'Alteração de estado identificada');
        const prov = item.providenciaNecessaria || 'Reparo, substituição imediata ou ressarcimento ao erário';

        return [
          String(idx + 1),
          `${item.descricao} (${item.ambiente})`,
          descOcorrencia,
          prov,
          'Cessionário',
          '48 Horas',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['#', 'Item Avariado / Ambiente', 'Descrição da Ocorrência / Avaria', 'Providência Exigida', 'Responsável', 'Prazo']],
        body: rowsDanos,
        theme: 'grid',
        headStyles: { fillColor: dangerColor, textColor: 255, fontStyle: 'bold', fontSize: 7.2 },
        styles: { fontSize: 6.8, cellPadding: 1.6, lineColor: [226, 232, 240], lineWidth: 0.1 },
      } as UserOptions);

      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    }

    // Se houver parecer / providências descritas pelo fiscal
    if (temProvidenciasGerais) {
      checkPageBreak(16);
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(254, 205, 211);
      doc.rect(margin, currentY, pageWidth - margin * 2, 13, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(190, 18, 60);
      doc.text('DETERMINAÇÕES E PROVIDÊNCIAS GERAIS DA FISCALIZAÇÃO SEDE:', margin + 3, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      const textoProv = vistoriaFinal?.providenciasPendencias?.trim()
        ? vistoriaFinal.providenciasPendencias
        : vistoriaFinal?.observacoesGerais || '';
      const splitProv = doc.splitTextToSize(textoProv, pageWidth - margin * 2 - 6);
      doc.text(splitProv, margin + 3, currentY + 8);

      currentY += Math.max(15, splitProv.length * 3 + 7);
    } else if (itensComDano.length === 0 && statusDev !== 'CONFORME') {
      checkPageBreak(14);
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(244, 63, 94);
      doc.rect(margin, currentY, pageWidth - margin * 2, 11, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(190, 18, 60);
      doc.text('⚠ DEVOLUÇÃO COM DANOS / PENDÊNCIAS DECLARADAS:', margin + 3, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text(
        'Foram constatadas avarias/pendências na devolução do espaço conforme declarado neste Termo, aplicando-se as responsabilidades de reparação.',
        margin + 3,
        currentY + 8
      );

      currentY += 13;
    } else if (itensComDano.length === 0 && statusDev === 'CONFORME') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(22, 101, 52);
      doc.text('✓ Nenhuma pendência, avaria ou dano ao patrimônio público constatado na vistoria de devolução.', margin + 2, currentY + 3);
      currentY += 7;
    }

    // --- SEÇÃO 5: DECLARAÇÃO FINAL DE ENTREGA ---
    checkPageBreak(25);
    drawSectionHeader('5. Declaração Oficial de Devolução do Espaço');

    const opt1 = statusDev === 'CONFORME' ? '[X]' : '[  ]';
    const opt2 = statusDev === 'COM_RESSALVAS' ? '[X]' : '[  ]';
    const opt3 = statusDev === 'COM_DANOS' ? '[X]' : '[  ]';
    const opt4 = statusDev === 'AGUARDA_REGULARIZACAO' ? '[X]' : '[  ]';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);

    doc.text(`${opt1} FOI DEVOLVIDO EM CONDIÇÕES SATISFATÓRIAS, sem pendências identificadas.`, margin + 2, currentY + 3);
    doc.text(`${opt2} FOI DEVOLVIDO COM PENDÊNCIAS, conforme descrito neste Termo e/ou Relatório de Vistoria Final.`, margin + 2, currentY + 7);
    doc.text(`${opt3} FOI DEVOLVIDO COM DANOS, sendo necessária a adoção das providências descritas neste Termo.`, margin + 2, currentY + 11);
    doc.text(`${opt4} AGUARDA REGULARIZAÇÃO DAS PENDÊNCIAS apontadas pela fiscalização.`, margin + 2, currentY + 15);

    currentY += 20;
  }

  // --- SEÇÃO FINAL: ASSINATURAS OFICIAIS (4 BLOCOS SEDE) ---
  checkPageBreak(45);
  drawSectionHeader(isTermoInicial ? '5. Identificação e Assinaturas Físicas de Entrega' : '6. Identificação dos Vistoriadores e Assinaturas Físicas');

  const hoje = new Date();
  const dataExtenso = `Campina Grande – PB, ${hoje.getDate()} de ${getNomeMes(hoje.getMonth())} de ${hoje.getFullYear()}.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(dataExtenso, margin, currentY);

  currentY += 13;

  const colWidth = (pageWidth - margin * 2 - 10) / 2;

  // Bloco 1: Representante CEDENTE (SEDE)
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, currentY, margin + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text('SECRETARIA DE DESENVOLVIMENTO ECONÔMICO – SEDE', margin, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Representante da CEDENTE', margin, currentY + 7);

  // Bloco 2: CESSIONÁRIO(A)
  const col2X = margin + colWidth + 10;
  doc.line(col2X, currentY, col2X + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text(evento.contratante || 'CESSIONÁRIO(A)', col2X, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${isTermoInicial ? 'Ciente e de Acordo com as Condições' : `CPF/CNPJ: ${evento.docContratante || 'Não informado'}`}`, col2X, currentY + 7);

  currentY += 17;

  // Bloco 3: Responsável pela Vistoria – SEDE
  doc.line(margin, currentY, margin + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text(vistoriaInicial?.responsavelSedeNome || vistoriaFinal?.responsavelSedeNome || vistoriaInicial?.responsavelNome || 'RESPONSÁVEL PELA VISTORIA – SEDE', margin, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Matrícula SEDE: ${vistoriaInicial?.responsavelSedeMatricula || vistoriaFinal?.responsavelSedeMatricula || 'Fiscal Designado'}`, margin, currentY + 7);

  // Bloco 4: Representante do(a) Cessionário(a)
  doc.line(col2X, currentY, col2X + colWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text(evento.representanteLegal || evento.responsavelEvento || 'REPRESENTANTE DO(A) CESSIONÁRIO(A)', col2X, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`CPF: ${evento.cpfRepresentanteLegal || 'Conforme cadastro'} (Visto)`, col2X, currentY + 7);

  currentY += 12;

  // --- ANEXO FOTOGRÁFICO OFICIAL ---
  // Seleciona fotos da Vistoria Inicial ou todas as fotos se for o Termo Completo
  let fotosFiltradas: FotoVistoria[] = [];
  if (isTermoInicial) {
    fotosFiltradas = (fotos || []).filter(
      (f) => !f.vistoriaTipo || f.vistoriaTipo === 'INICIAL' || String(f.vistoriaTipo).toUpperCase() === 'INICIAL'
    );
    // Se não encontrou com a tag 'INICIAL', usa todas as fotos do evento para não deixar o anexo vazio
    if (fotosFiltradas.length === 0 && (fotos || []).length > 0) {
      fotosFiltradas = fotos;
    }
  } else {
    fotosFiltradas = fotos || [];
  }

  if (fotosFiltradas && fotosFiltradas.length > 0) {
    doc.addPage();
    currentY = margin + 4;

    doc.setFillColor(...primaryColor);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      isTermoInicial ? 'ANEXO FOTOGRÁFICO OFICIAL — VISTORIA INICIAL (CONDIÇÕES DE ENTREGA)' : 'ANEXO FOTOGRÁFICO OFICIAL — LAUDO TÉCNICO',
      margin + 3,
      currentY + 5.2
    );

    currentY += 11;

    const photoWidth = (pageWidth - margin * 2 - 8) / 2;
    const photoHeight = 54;
    let photoCol = 0;

    for (let i = 0; i < fotosFiltradas.length; i++) {
      const foto = fotosFiltradas[i];
      const posX = margin + photoCol * (photoWidth + 8);

      if (currentY + photoHeight + 17 > pageHeight - margin - 8) {
        doc.addPage();
        currentY = margin + 6;
        photoCol = 0;
      }

      try {
        // Fundo do quadro da fotografia (cinza suave para fotos com proporção diferente)
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(posX, currentY, photoWidth, photoHeight, 'F');

        if (foto.dataUrl) {
          // Determina o formato da imagem
          let format = 'JPEG';
          if (foto.dataUrl.includes('image/png')) {
            format = 'PNG';
          }

          // Ajuste de Proporção (Aspect Ratio) para evitar distorção (contain)
          let renderWidth = photoWidth;
          let renderHeight = photoHeight;
          let imgX = posX;
          let imgY = currentY;

          try {
            const imgProps = doc.getImageProperties(foto.dataUrl);
            if (imgProps && imgProps.width && imgProps.height) {
              const imgAspect = imgProps.width / imgProps.height;
              const boxAspect = photoWidth / photoHeight;

              if (imgAspect > boxAspect) {
                // Imagem horizontal (mais larga) -> ajusta na largura e centraliza na altura
                renderWidth = photoWidth;
                renderHeight = photoWidth / imgAspect;
                imgX = posX;
                imgY = currentY + (photoHeight - renderHeight) / 2;
              } else {
                // Imagem vertical ou quadrada (mais alta) -> ajusta na altura e centraliza na largura
                renderHeight = photoHeight;
                renderWidth = photoHeight * imgAspect;
                imgX = posX + (photoWidth - renderWidth) / 2;
                imgY = currentY;
              }
            }
          } catch {
            renderWidth = photoWidth;
            renderHeight = photoHeight;
            imgX = posX;
            imgY = currentY;
          }

          doc.addImage(foto.dataUrl, format, imgX, imgY, renderWidth, renderHeight, undefined, 'FAST');
        }

        // Borda externa do container fotográfico
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(posX, currentY, photoWidth, photoHeight);

        // Tarja da Etapa
        const isIni = !foto.vistoriaTipo || foto.vistoriaTipo === 'INICIAL' || String(foto.vistoriaTipo).toUpperCase() === 'INICIAL';
        doc.setFillColor(isIni ? 15 : 190, isIni ? 23 : 18, isIni ? 42 : 60);
        doc.rect(posX, currentY, 28, 4.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text(isIni ? 'VISTORIA INICIAL' : 'VISTORIA FINAL', posX + 2, currentY + 3.2);

        // Legenda e Descrição
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        const descText = foto.legenda || `${foto.ambiente || 'Registro Fotográfico'} (Foto ${i + 1})`;
        const splitDesc = doc.splitTextToSize(descText, photoWidth);
        doc.text(splitDesc, posX, currentY + photoHeight + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(148, 163, 184);
        const dataStr = foto.dataHora ? new Date(foto.dataHora).toLocaleString('pt-BR') : 'Data não informada';
        doc.text(`Data/Hora: ${dataStr}`, posX, currentY + photoHeight + 3.5 + splitDesc.length * 2.8);
      } catch (err) {
        console.warn('Erro ao inserir foto no anexo do PDF:', err);
      }

      if (photoCol === 1) {
        photoCol = 0;
        currentY += photoHeight + 16;
      } else {
        photoCol = 1;
      }
    }
  }

  // Numeração de páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${p} de ${totalPages} • Processo: ${evento.processoProtocolo || evento.codigo} • SEDE Campina Grande`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return isoString;
  }
}

function getNomeMes(mesIndex: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mesIndex] || '';
}
