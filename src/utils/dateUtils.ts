/**
 * Utilitários para tratamento e exibição de datas e horários locais no sistema de Vistorias.
 * Evita problemas de descompasso de fuso horário (UTC vs Horário Local do Brasil / Dispositivo).
 */

/**
 * Retorna a data e hora local do dispositivo no formato 'YYYY-MM-DDTHH:mm'
 * adequado para inputs do tipo datetime-local, sem distorção de fuso horário UTC.
 */
export function getNowLocalDateTimeString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Normaliza qualquer valor de data/hora para o formato 'YYYY-MM-DDTHH:mm'
 * compatível com `<input type="datetime-local" />`.
 */
export function toInputDateTimeLocal(dateVal?: string | Date | null): string {
  if (!dateVal) return getNowLocalDateTimeString();
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return getNowLocalDateTimeString();
    return getNowLocalDateTimeString(dateVal);
  }
  const str = String(dateVal).trim();
  // Se já estiver no formato 'YYYY-MM-DDTHH:mm' (sem Z)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  // Se for 'YYYY-MM-DDTHH:mm:ss...' sem Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !str.includes('Z')) {
    return str.slice(0, 16);
  }
  // Se for apenas data 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T08:00`;
  }
  // Se for ISO com Z ou outro formato parseável
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return getNowLocalDateTimeString(parsed);
  }
  return getNowLocalDateTimeString();
}

/**
 * Formata para exibição em português 'DD/MM/YYYY às HH:mm'
 */
export function formatDateTimeBR(dateVal?: string | Date | null): string {
  if (!dateVal) return '-';
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '-';
    return dateVal.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
  const str = String(dateVal).trim();
  // Formato local 'YYYY-MM-DDTHH:mm...' (sem Z)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !str.includes('Z')) {
    const [datePart, timePart] = str.split('T');
    const [y, m, d] = datePart.split('-');
    const time = timePart.slice(0, 5);
    return `${d}/${m}/${y} às ${time}`;
  }
  // Se for apenas 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
  return str;
}

/**
 * Formata apenas a data 'DD/MM/YYYY'
 */
export function formatDateOnlyBR(dateVal?: string | Date | null): string {
  if (!dateVal) return '-';
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const datePart = str.split('T')[0];
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('pt-BR');
  }
  return str;
}
