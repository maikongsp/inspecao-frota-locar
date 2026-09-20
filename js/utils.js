/**
 * Utilitários do Sistema Locar
 * Prevenção de XSS e formatação de dados
 */

/**
 * Sanitiza strings para exibição segura em innerHTML (Prevenção de XSS)
 * @param {string|any} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
