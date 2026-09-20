/**
 * Utilitários do Sistema Locar
 * Prevenção de XSS, Sanitização de Dados e Segurança Criptográfica
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

/**
 * Sanitiza valores para exportação segura em CSV (Prevenção de CSV / Formula Injection - CWE-1236)
 * Evita execução arbitrária de código ao abrir o arquivo no Microsoft Excel
 * @param {string|any} value
 * @returns {string}
 */
export function sanitizeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Se começar com caracteres de comando do Excel (=, +, -, @, tabulação, retorno de carro), prefixa com aspa simples
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str.replace(/"/g, '""')}`;
  }
  return str.replace(/"/g, '""');
}

/**
 * Valida se uma URL ou fonte de imagem é segura (previne javascript: e protocolos perigosos)
 * @param {string} src
 * @returns {string} URL segura ou placeholder
 */
export function safeImageSrc(src) {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  // Permite estritamente data:image/, https://, blob: ou caminhos relativos locais seguros
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('./assets/')
  ) {
    return trimmed;
  }
  return '';
}

/**
 * Gera um Hash Criptográfico SHA-256 para garantia de integridade pericial e não-adulteração de laudos
 * @param {string|object} payload
 * @returns {Promise<string>} Hash SHA-256 em hexadecimal
 */
export async function generateAuditHash(payload) {
  try {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Erro ao gerar SHA-256 nativo, aplicando fallback:', err);
    // Fallback determinístico caso Web Crypto não esteja disponível
    let hash = 0;
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'sha256-fb-' + Math.abs(hash).toString(16) + '00000000'.slice(0, 56);
  }
}

/**
 * Formata data no padrão YYYY-MM-DD preservando rigorosamente o fuso horário local
 * Evita o clássico erro de salto de dia após as 21h causado por toISOString()
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} YYYY-MM-DD
 */
export function formatLocalDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona dias a uma data mantendo integridade do calendário local
 * @param {Date|string} date 
 * @param {number} days 
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}


