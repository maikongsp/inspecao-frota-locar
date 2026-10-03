/**
 * TESTES DO SISTEMA DE INFORMATIVO DE FALHAS E SUGESTÕES (FEEDBACK & BUG REPORT)
 * Validação do envio por e-mail para o Administrador (maikon.pinho@locar.com.br)
 */

// Mock de ambiente para Node.js
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

const { Storage } = await import('../js/storage.js');
const { FeedbackManager, FEEDBACK_TYPES, FEEDBACK_SEVERITIES } = await import('../js/modules/feedbackManager.js');
const { aiCopilot } = await import('../js/modules/aiCopilot.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✕ FALHA: ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('🧪 TESTANDO SISTEMA DE INFORMATIVOS DE FALHAS E SUGESTÕES');
console.log('================================================================\n');

// 1. Limpa dados prévios de teste
Storage.clearFeedbackReports();
assert(Storage.getFeedbackReports().length === 0, 'Storage de informativos inicia vazio');

// 2. Destinatário Oficial
const adminEmail = Storage.getAdminEmail();
assert(adminEmail === 'maikon.pinho@locar.com.br', `E-mail do Administrador Master é ${adminEmail}`);

// 3. Criação de Informativo de Falha (Bug)
const bugReport = FeedbackManager.createFeedback({
  type: 'falha',
  severity: 'alta',
  moduleKey: 'inspecao',
  subject: 'Botão de captura de foto não abre câmera no Android antigo',
  description: 'Ao clicar no botão "Câmera ao Vivo" no item 3 do checklist da PTA, a tela fica preta.',
  senderName: 'Carlos Inspetor',
  senderEmail: 'carlos.inspetor@locar.com.br',
  senderPhone: '(31) 98888-1122',
  senderRole: 'Inspetor Técnico'
});

assert(bugReport.success === true, 'Informativo de falha criado com sucesso');
assert(bugReport.report.id.startsWith('INF-LOC-'), `ID gerado no padrão oficial: ${bugReport.report.id}`);
assert(bugReport.report.adminRecipient === 'maikon.pinho@locar.com.br', 'Destinatário do relato é maikon.pinho@locar.com.br');
assert(bugReport.report.status === 'pendente', 'Status inicial é pendente');

// 4. Validação do Payload de E-mail
const emailPayload = bugReport.emailPayload;
assert(emailPayload.adminEmail === 'maikon.pinho@locar.com.br', 'E-mail do admin no payload está correto');
assert(emailPayload.emailSubject.includes('[Locar Frota] FALHA:'), `Assunto do e-mail formatado: ${emailPayload.emailSubject}`);
assert(emailPayload.emailSubject.includes(bugReport.report.id), 'Assunto contém o número de protocolo');
assert(emailPayload.textBody.includes('Carlos Inspetor'), 'Corpo do e-mail inclui o nome do solicitante');
assert(emailPayload.textBody.includes('carlos.inspetor@locar.com.br'), 'Corpo do e-mail inclui o e-mail do solicitante');
assert(emailPayload.textBody.includes('Botão de captura de foto'), 'Corpo do e-mail inclui o assunto');
assert(emailPayload.mailtoUrl.startsWith('mailto:maikon.pinho%40locar.com.br'), 'URL mailto gerada apontando para o Administrador');

// 5. Criação de Informativo de Sugestão de Melhoria
const suggestionReport = FeedbackManager.createFeedback({
  type: 'sugestao',
  severity: 'baixa',
  moduleKey: 'frota',
  subject: 'Incluir filtro por horímetro no Dashboard',
  description: 'Seria muito útil filtrar equipamentos com mais de 250 horas diretamente no topo da lista.',
  senderName: 'Maria PCM',
  senderEmail: 'maria.pcm@locar.com.br',
  senderPhone: '(31) 97777-2233',
  senderRole: 'Gestor PCM'
});

assert(suggestionReport.success === true, 'Informativo de sugestão criado com sucesso');
assert(suggestionReport.emailPayload.emailSubject.includes('[Locar Frota] SUGESTAO:'), 'Assunto reflete SUGESTAO');

// 6. Teste de Persistência no Storage
const allReports = Storage.getFeedbackReports();
assert(allReports.length === 2, `Total de 2 informativos persistidos (atual: ${allReports.length})`);
assert(allReports[0].id === suggestionReport.report.id, 'Mais recente aparece no topo da lista');

// 7. Teste de Atualização de Status pelo Administrador
const updated = Storage.updateFeedbackReportStatus(bugReport.report.id, 'resolvido');
assert(updated === true, 'Status do relato atualizado para resolvido');
const reloaded = Storage.getFeedbackReports().find(r => r.id === bugReport.report.id);
assert(reloaded.status === 'resolvido', 'Status verificado como resolvido');

// 8. Teste de Resposta da IA sobre Falhas e Sugestões
const aiResp = aiCopilot.askSystemQuestion('onde posso enviar uma sugestão ou relatar falha no sistema?');
assert(aiResp.text.includes('maikon.pinho@locar.com.br'), 'IA informa o e-mail do Administrador Maikon Pinho');
assert(aiResp.text.includes('Sugestões / Falhas'), 'IA indica o botão de Sugestões / Falhas');

// 9. Renderização do Painel do Administrador
const mockContainer = { innerHTML: '' };
FeedbackManager.renderAdminList(mockContainer);
assert(mockContainer.innerHTML.includes(bugReport.report.id), 'Lista do admin exibe o protocolo do bug');
assert(mockContainer.innerHTML.includes(suggestionReport.report.id), 'Lista do admin exibe o protocolo da sugestão');
assert(mockContainer.innerHTML.includes('Resolvido'), 'Lista do admin exibe badge de Resolvido');
assert(mockContainer.innerHTML.includes('Pendente'), 'Lista do admin exibe badge de Pendente');

console.log('\n================================================================');
console.log(`📊 RESULTADO DOS TESTES: ${passed} passaram, ${failed} falharam.`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
