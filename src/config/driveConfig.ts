import type { GoogleDriveConfig } from '../types/vistoria';

/**
 * CONFIGURAÇÃO GLOBAL DO GOOGLE DRIVE DA SEDE CAMPINA GRANDE
 * 
 * Pasta no Google Drive: https://drive.google.com/drive/u/0/folders/14oQVraHMiuWGYb1EuYl17S32-41oKGVQ
 * ID da Pasta: 14oQVraHMiuWGYb1EuYl17S32-41oKGVQ
 */
export const GLOBAL_DEFAULT_DRIVE_CONFIG: GoogleDriveConfig = {
  folderName: 'Vistorias SEDE — Parque do Povo',
  folderId: '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ',
  webhookUrl: 'https://script.google.com/macros/s/AKfycbwFHL7gb7_xA8eETxt1cpVEpgbdlKaBxy9UXBgEsy1_9Iz18oTkzNssMFRhvfdNsK0Z/exec',
  clientId: '',
  autoSync: true,
};
