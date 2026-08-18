import React, { useState, useEffect, useRef } from 'react';
import { X, HardDrive, Download, Upload, CheckCircle2, AlertCircle, Save, Link as LinkIcon, Play, Copy, Check, ChevronDown, ChevronUp, Loader2, RefreshCw, FileSpreadsheet, ExternalLink, FolderOpen } from 'lucide-react';
import type { GoogleDriveConfig } from '../../types/vistoria';
import { getGoogleDriveConfig, saveGoogleDriveConfig } from '../../db/database';
import { exportFullDatabaseBackup, importFullDatabaseBackup, testGoogleDriveConnection } from '../../services/googleDriveService';
import { pullFromGoogleSheets, pushAllToGoogleSheets } from '../../services/googleSheetsSyncService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'backup'>('sheets');
  const [config, setConfig] = useState<GoogleDriveConfig>({
    folderName: 'Vistorias SEDE — Parque do Povo',
    folderId: '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ',
    autoSync: true,
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      getGoogleDriveConfig().then((cfg) => setConfig(cfg));
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!config.webhookUrl) {
      setStatusMessage({ type: 'error', text: 'Por favor, informe a URL do Webhook do Google Apps Script antes de testar.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);
    try {
      const result = await testGoogleDriveConnection(config.webhookUrl, config.folderName);
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveGoogleDriveConfig(config);
      setStatusMessage({ type: 'success', text: 'Configurações salvas! Sincronização automática ativada.' });
      if (config.webhookUrl) {
        await pullFromGoogleSheets(true);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushAllToSheets = async () => {
    setIsSyncingAll(true);
    setStatusMessage(null);
    try {
      const res = await pushAllToGoogleSheets();
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePullAllFromSheets = async () => {
    setIsSyncingAll(true);
    setStatusMessage(null);
    try {
      const res = await pullFromGoogleSheets(true);
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success && onDataRestored) {
        onDataRestored();
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const googleAppsScriptCode = `/**
 * GOOGLE APPS SCRIPT - SEDE VISTORIAS
 * Backend de Sincronização Multi-Dispositivos (Google Sheets + Google Drive)
 * Prefeitura Municipal de Campina Grande — SEDE
 * 
 * PASTA CONFIGURADA:
 * https://drive.google.com/drive/u/0/folders/14oQVraHMiuWGYb1EuYl17S32-41oKGVQ
 */

var ROOT_FOLDER_ID = "14oQVraHMiuWGYb1EuYl17S32-41oKGVQ";

function getTargetFolder(customFolderId, customFolderName) {
  var folderId = customFolderId || ROOT_FOLDER_ID;
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      Logger.log("Não foi possível abrir pelo ID, tentando por nome: " + e);
    }
  }
  var name = customFolderName || "Vistorias SEDE — Parque do Povo";
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function getOrCreateSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  
  var targetFolder = getTargetFolder();
  var files = targetFolder.getFilesByName("Vistorias SEDE — Base de Dados");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // Cria a planilha diretamente dentro da pasta configurada no Drive
  var newSS = SpreadsheetApp.create("Vistorias SEDE — Base de Dados");
  var file = DriveApp.getFileById(newSS.getId());
  targetFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return newSS;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "getAll";
    var ss = getOrCreateSpreadsheet();
    
    if (action === "getAll") {
      var eventosSheet = getOrCreateSheet(ss, "Eventos", ["ID", "Processo", "Nome", "Contratante", "Status", "Local", "DataInicio", "JSON_DATA", "AtualizadoEm"]);
      var vistoriasSheet = getOrCreateSheet(ss, "Vistorias", ["ID", "EventoID", "Tipo", "Status", "Responsavel", "JSON_DATA"]);
      var itensSheet = getOrCreateSheet(ss, "Itens", ["ID", "EventoID", "VistoriaTipo", "Ambiente", "Descricao", "Situacao", "JSON_DATA"]);
      var historicoSheet = getOrCreateSheet(ss, "Historico", ["ID", "EventoID", "DataHora", "Responsavel", "Acao", "Detalhes"]);
      
      var eventos = readObjectsFromSheet(eventosSheet);
      var vistorias = readObjectsFromSheet(vistoriasSheet);
      var itens = readObjectsFromSheet(itensSheet);
      var historico = readObjectsFromSheet(historicoSheet);
      
      return createJsonResponse({
        status: "success",
        eventos: eventos,
        vistorias: vistorias,
        itens: itens,
        historico: historico,
        timestamp: new Date().toISOString()
      });
    }
    
    return createJsonResponse({ status: "success", message: "API SEDE Vistorias Online" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || (data.test ? "test" : "saveVistoriaFull");
    
    if (action === "test" || data.test) {
      return createJsonResponse({ status: "success", message: "Conexão com Google Sheets e Google Drive estabelecida com sucesso!" });
    }
    
    var ss = getOrCreateSpreadsheet();
    var eventosSheet = getOrCreateSheet(ss, "Eventos", ["ID", "Processo", "Nome", "Contratante", "Status", "Local", "DataInicio", "JSON_DATA", "AtualizadoEm"]);
    var vistoriasSheet = getOrCreateSheet(ss, "Vistorias", ["ID", "EventoID", "Tipo", "Status", "Responsavel", "JSON_DATA"]);
    var itensSheet = getOrCreateSheet(ss, "Itens", ["ID", "EventoID", "VistoriaTipo", "Ambiente", "Descricao", "Situacao", "JSON_DATA"]);
    var historicoSheet = getOrCreateSheet(ss, "Historico", ["ID", "EventoID", "DataHora", "Responsavel", "Acao", "Detalhes"]);
    
    // 1. Salvar ou atualizar evento completo + PDF no Drive
    if (action === "saveVistoriaFull" || action === "saveEvent") {
      var evento = data.evento;
      if (evento && evento.id) {
        upsertObject(eventosSheet, evento.id, [
          evento.id,
          evento.processoProtocolo || evento.codigo || "",
          evento.nome || "",
          evento.contratante || "",
          evento.status || "",
          evento.espacoCedido || "",
          evento.dataInicio || "",
          JSON.stringify(evento),
          new Date().toISOString()
        ]);
      }
      
      if (data.vistorias && Array.isArray(data.vistorias)) {
        data.vistorias.forEach(function(v) {
          upsertObject(vistoriasSheet, v.id, [v.id, v.eventoId, v.tipo, v.status, v.responsavelSedeNome || v.responsavelNome || "", JSON.stringify(v)]);
        });
      }
      
      if (data.itens && Array.isArray(data.itens)) {
        data.itens.forEach(function(i) {
          upsertObject(itensSheet, i.id, [i.id, i.eventoId, i.vistoriaTipo, i.ambiente, i.descricao, i.situacao, JSON.stringify(i)]);
        });
      }
      
      if (data.historico && Array.isArray(data.historico)) {
        data.historico.forEach(function(h) {
          upsertObject(historicoSheet, h.id, [h.id, h.eventoId, h.dataHora, h.responsavel, h.acao, h.detalhes || ""]);
        });
      }
      
      // Salvar Termo Oficial em PDF na pasta designada do Google Drive
      if (data.pdfBase64 && evento) {
        try {
          var targetFolder = getTargetFolder(data.folderId, data.folderName);
          var subfolderName = (evento.processoProtocolo || evento.codigo || "Processo") + " - " + (evento.nome || "Evento");
          var subfolders = targetFolder.getFoldersByName(subfolderName);
          var eventFolder = subfolders.hasNext() ? subfolders.next() : targetFolder.createFolder(subfolderName);
          
          var decodedPdf = Utilities.base64Decode(data.pdfBase64);
          var blob = Utilities.newBlob(decodedPdf, "application/pdf", data.pdfFileName || "Termo_Vistoria.pdf");
          eventFolder.createFile(blob);
        } catch (driveErr) {
          Logger.log("Erro ao salvar PDF no Drive: " + driveErr);
        }
      }
      
      return createJsonResponse({ status: "success", message: "Dados sincronizados com o Google Sheets & Drive!" });
    }
    
    // 2. Excluir evento e dependências
    if (action === "deleteEvent") {
      var delId = data.eventoId;
      deleteRowsMatching(eventosSheet, 1, delId);
      deleteRowsMatching(vistoriasSheet, 2, delId);
      deleteRowsMatching(itensSheet, 2, delId);
      deleteRowsMatching(historicoSheet, 2, delId);
      return createJsonResponse({ status: "success", message: "Evento excluído da Planilha Google!" });
    }
    
    // 3. Sincronização em lote (Push All)
    if (action === "syncPushAll") {
      if (data.eventos && Array.isArray(data.eventos)) {
        data.eventos.forEach(function(ev) {
          upsertObject(eventosSheet, ev.id, [ev.id, ev.processoProtocolo || ev.codigo || "", ev.nome || "", ev.contratante || "", ev.status || "", ev.espacoCedido || "", ev.dataInicio || "", JSON.stringify(ev), new Date().toISOString()]);
        });
      }
      if (data.vistorias && Array.isArray(data.vistorias)) {
        data.vistorias.forEach(function(v) {
          upsertObject(vistoriasSheet, v.id, [v.id, v.eventoId, v.tipo, v.status, v.responsavelSedeNome || v.responsavelNome || "", JSON.stringify(v)]);
        });
      }
      if (data.itens && Array.isArray(data.itens)) {
        data.itens.forEach(function(i) {
          upsertObject(itensSheet, i.id, [i.id, i.eventoId, i.vistoriaTipo, i.ambiente, i.descricao, i.situacao, JSON.stringify(i)]);
        });
      }
      if (data.historico && Array.isArray(data.historico)) {
        data.historico.forEach(function(h) {
          upsertObject(historicoSheet, h.id, [h.id, h.eventoId, h.dataHora, h.responsavel, h.acao, h.detalhes || ""]);
        });
      }
      return createJsonResponse({ status: "success", message: "Todos os dados foram enviados para a Planilha Google!" });
    }
    
    return createJsonResponse({ status: "error", message: "Ação não reconhecida" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function readObjectsFromSheet(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    for (var c = 0; c < row.length; c++) {
      var val = String(row[c]);
      if (val.startsWith("{") && val.endsWith("}")) {
        try {
          result.push(JSON.parse(val));
          break;
        } catch (e) {}
      }
    }
  }
  return result;
}

function upsertObject(sheet, id, rowData) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

function deleteRowsMatching(sheet, colIndex1Based, matchValue) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIndex1Based - 1]) === String(matchValue)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleExportBackup = async () => {
    try {
      await exportFullDatabaseBackup();
      setStatusMessage({ type: 'success', text: 'Arquivo de backup completo exportado com sucesso!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro ao exportar backup.' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const res = await importFullDatabaseBackup(files[0]);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        if (onDataRestored) onDataRestored();
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }
    e.target.value = '';
  };

  const folderUrl = `https://drive.google.com/drive/u/0/folders/${config.folderId || '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Google Sheets & Google Drive</h2>
              <p className="text-xs text-slate-400">
                Banco de Dados Centralizado e Sincronização em Nuvem Multi-Aparelhos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sheets'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sincronização em Nuvem (Google)</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Backup e Restauração Local</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Google Sheets & Drive */}
        {activeTab === 'sheets' && (
          <form onSubmit={handleSaveConfig} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Pasta do Google Drive Vinculada */}
            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-teal-900">
                  <FolderOpen className="w-4 h-4 text-teal-700" />
                  Pasta Vinculada no Google Drive:
                </span>
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 underline"
                >
                  <span>Abrir no Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-teal-800 font-mono bg-white/70 p-2 rounded-lg border border-teal-200 break-all">
                {folderUrl}
              </p>
              <p className="text-[11px] text-teal-700">
                A Planilha Google e todos os Termos em PDF gerados serão armazenados dentro desta pasta.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
                  URL do Webhook do Google Apps Script
                </label>
                <button
                  type="button"
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                >
                  <span>{showScriptGuide ? 'Ocultar Instruções' : 'Ver Passo a Passo'}</span>
                  {showScriptGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <input
                type="url"
                value={config.webhookUrl || ''}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                URL da implantação da aplicação Web gerada no Google Apps Script.
              </p>
            </div>

            {/* Guia Expansível com o Código do Google Apps Script */}
            {showScriptGuide && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-3 animate-fade-in border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-400">Instalação na sua Pasta do Drive</span>
                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Abra a sua pasta no Google Drive: <a href={folderUrl} target="_blank" rel="noopener noreferrer" className="text-teal-300 underline font-bold">Clique aqui para abrir</a>
                  </li>
                  <li>
                    Dentro da pasta, clique em <strong>+ Novo &gt; Planilhas Google &gt; Criar e compartilhar</strong> (nomeie como <em>Vistorias SEDE — Base de Dados</em>).
                  </li>
                  <li>Na planilha, clique no menu superior em <strong>Extensões &gt; Apps Script</strong>.</li>
                  <li>Apague qualquer código que estiver lá, <strong>cole o código abaixo</strong> e salve (Ctrl+S).</li>
                  <li>Clique no botão azul superior <strong>Implantar &gt; Nova implantação</strong>:
                    <ul className="list-disc list-inside pl-4 text-teal-200">
                      <li>Tipo: <strong>App da Web</strong> (ícone de engrenagem)</li>
                      <li>Executar como: <strong>Eu (seu email Google)</strong></li>
                      <li>Quem pode acessar: <strong>Qualquer pessoa (Anyone)</strong> *(necessário para os celulares sincronizarem)*</li>
                    </ul>
                  </li>
                  <li>Clique em <strong>Implantar</strong>, autorize as permissões da conta e copie o link gerado (terminado em <code className="text-teal-300">/exec</code>).</li>
                </ol>

                <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[10px] text-teal-200 font-mono max-h-40">
                  {googleAppsScriptCode}
                </pre>
              </div>
            )}

            {/* Ações de Sincronização em Massa */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Sincronização em Massa:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isSyncingAll || !config.webhookUrl}
                  onClick={handlePushAllToSheets}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[38px]"
                >
                  {isSyncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-teal-600" />}
                  <span>Enviar Dados Locais p/ Planilha</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingAll || !config.webhookUrl}
                  onClick={handlePullAllFromSheets}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[38px]"
                >
                  {isSyncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-teal-600" />}
                  <span>Puxar Dados da Planilha</span>
                </button>
              </div>
            </div>

            {/* Ações: Testar Conexão e Salvar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isTesting || !config.webhookUrl}
                onClick={handleTestConnection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition active:scale-95 disabled:opacity-50 min-h-[40px]"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 transition active:scale-95 disabled:opacity-50 min-h-[40px]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Backup e Restauração */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Exportar */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 w-fit">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Exportar Banco de Dados</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Baixe um arquivo JSON contendo todos os eventos, vistorias, checklists e fotos registradas neste aparelho.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup Completo</span>
                </button>
              </div>

              {/* Card Importar */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 w-fit">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Restaurar de um Arquivo</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Importe um arquivo de backup previamente exportado para recuperar dados off-line.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Selecionar Arquivo JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
