/**
 * MÓDULO DE INFORMATIVO DE FALHAS E SUGESTÕES (FEEDBACK & BUG REPORT)
 * Sistema de Inspeção de Frota - Locar Guindastes e Transportes Intermodais
 * 
 * Permite que usuários e operadores de campo relatem falhas, bugs, dúvidas e sugestões.
 * O envio é registrado no sistema e despachado automaticamente por e-mail para o Administrador Geral:
 * maikon.pinho@locar.com.br
 */

import { Storage } from '../storage.js';
import { escapeHTML } from '../utils.js';

export const FEEDBACK_TYPES = {
  falha: { label: '🐛 Falha / Erro Técnico no Sistema (Bug)', color: '#EF4444', badgeClass: 'badge-danger' },
  sugestao: { label: '💡 Sugestão de Melhoria Operacional', color: '#F59E0B', badgeClass: 'badge-warning' },
  duvida: { label: '❓ Dúvida sobre o Sistema / Procedimento', color: '#38BDF8', badgeClass: 'badge-info' },
  elogio: { label: '⭐ Elogio / Outros', color: '#10B981', badgeClass: 'badge-success' }
};

export const FEEDBACK_SEVERITIES = {
  baixa: { label: 'Baixa (Pode aguardar)', color: '#10B981' },
  media: { label: 'Média (Inconveniente operacional)', color: '#F59E0B' },
  alta: { label: 'Alta (Dificulta vistorias/rotina)', color: '#F97316' },
  critica: { label: 'Crítica / Impeditiva (Bloqueia trabalho)', color: '#EF4444' }
};

export const FEEDBACK_MODULES = {
  frota: '🚜 Frota & Dashboard de Betim',
  inspecao: '📋 Nova Inspeção Técnica & Checklists',
  pcm: '📨 Solicitações de Serviço (PCM)',
  laudos: '📜 Laudos Periciais & Validador QR',
  auth: '🔐 Login, Usuários & Permissões',
  camera: '📷 Câmera / Assinatura Digital Touch',
  geral: '🌐 Sistema Geral / Interface / Outros'
};

export const FeedbackManager = {
  /**
   * Cria e persiste um novo informativo de falha ou sugestão
   */
  createFeedback(params) {
    const {
      type = 'falha',
      severity = 'media',
      moduleKey = 'geral',
      subject = '',
      description = '',
      senderName = 'Operador Anônimo',
      senderEmail = '',
      senderPhone = '',
      senderRole = 'Modo Consulta',
      photoAttachment = null
    } = params;

    const adminEmail = Storage.getAdminEmail(); // maikon.pinho@locar.com.br
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = `INF-LOC-${dateStr}-${rand}`;

    const typeMeta = FEEDBACK_TYPES[type] || FEEDBACK_TYPES.falha;
    const severityMeta = FEEDBACK_SEVERITIES[severity] || FEEDBACK_SEVERITIES.media;
    const moduleName = FEEDBACK_MODULES[moduleKey] || FEEDBACK_MODULES.geral;

    const report = {
      id,
      type,
      typeLabel: typeMeta.label,
      severity,
      severityLabel: severityMeta.label,
      moduleKey,
      moduleName,
      subject: subject.trim() || 'Informativo sem título',
      description: description.trim(),
      senderName: senderName.trim() || 'Colaborador Locar',
      senderEmail: senderEmail.trim(),
      senderPhone: senderPhone.trim(),
      senderRole: senderRole || 'Operador',
      adminRecipient: adminEmail,
      status: 'pendente', // 'pendente', 'em_analise', 'resolvido'
      createdAt: now.toISOString(),
      formattedDate: now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }),
      deviceInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Test',
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
        url: typeof window !== 'undefined' ? window.location.href : 'https://inspecao-frota-locar.vercel.app/'
      },
      hasPhoto: Boolean(photoAttachment),
      photoAttachment: photoAttachment || null
    };

    // Salva no storage persistente local
    Storage.saveFeedbackReport(report);

    // Prepara formatos de envio de e-mail ao Administrador
    const emailPayload = this.generateEmailPayload(report);

    return {
      success: true,
      report,
      emailPayload
    };
  },

  /**
   * Constrói o conteúdo estruturado para e-mail corporativo ao Administrador
   */
  generateEmailPayload(report) {
    const adminEmail = report.adminRecipient || Storage.getAdminEmail();
    const typeMeta = FEEDBACK_TYPES[report.type] || FEEDBACK_TYPES.falha;
    const severityMeta = FEEDBACK_SEVERITIES[report.severity] || FEEDBACK_SEVERITIES.media;

    const emailSubject = `[Locar Frota] ${report.type.toUpperCase()}: ${report.subject} (${report.id})`;

    const textBody = 
`PREZADO ADMINISTRADOR (MAIKON PINHO),

Um novo informativo foi registrado através do Sistema de Inspeção de Frota Locar (Filial Betim/MG).

============================================================
DADOS DO PROTOCOLO:
- Protocolo: ${report.id}
- Tipo: ${typeMeta.label}
- Severidade: ${severityMeta.label}
- Módulo Afetado: ${report.moduleName}
- Data/Hora: ${report.formattedDate}
- Status: PENDENTE DE ANÁLISE
============================================================

DADOS DO COLABORADOR:
- Nome: ${report.senderName}
- E-mail: ${report.senderEmail || 'Não informado'}
- Telefone/WhatsApp: ${report.senderPhone || 'Não informado'}
- Perfil no Sistema: ${report.senderRole}

------------------------------------------------------------
TÍTULO:
${report.subject}

DESCRIÇÃO DETALHADA:
${report.description}
------------------------------------------------------------

DIAGNÓSTICO TÉCNICO DO DISPOSITIVO:
- Plataforma/Navegador: ${report.deviceInfo?.userAgent || 'N/A'}
- Resolução de Tela: ${report.deviceInfo?.screen || 'N/A'}
- URL de Origem: ${report.deviceInfo?.url || 'N/A'}
${report.hasPhoto ? '- Anexo: Evidência de imagem anexada no sistema.' : ''}

============================================================
Locar Guindastes e Transportes Intermodais S/A
Sistema de Inspeção & Qualidade de Frota • Filial Betim/MG
Destinatário Oficial: ${adminEmail}
============================================================`;

    const mailtoUrl = `mailto:${encodeURIComponent(adminEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(textBody)}`;

    // Link para despacho rápido via WhatsApp
    const whatsappText = `*Informativo Locar Frota (${report.id})*\n*Tipo:* ${typeMeta.label}\n*De:* ${report.senderName}\n*Assunto:* ${report.subject}\n*Descrição:* ${report.description}`;
    const whatsappUrl = `https://wa.me/5531999999999?text=${encodeURIComponent(whatsappText)}`;

    return {
      adminEmail,
      emailSubject,
      textBody,
      mailtoUrl,
      whatsappUrl
    };
  },

  /**
   * Recupera histórico de informativos
   */
  getReports() {
    return Storage.getFeedbackReports();
  },

  /**
   * Atualiza status de um informativo
   */
  updateStatus(reportId, newStatus) {
    return Storage.updateFeedbackReportStatus(reportId, newStatus);
  },

  /**
   * Renderiza a lista de chamados/informativos no painel administrativo
   */
  renderAdminList(containerElement) {
    if (!containerElement) return;

    const reports = this.getReports();

    if (!reports || reports.length === 0) {
      containerElement.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.85rem;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">📭</div>
          <strong>Nenhum informativo ou sugestão pendente.</strong>
          <p style="margin-top:0.25rem; font-size:0.75rem;">Todas as mensagens de usuários e operadores enviadas ao Administrador aparecerão listadas aqui.</p>
        </div>
      `;
      return;
    }

    containerElement.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        ${reports.map(rep => {
          const typeMeta = FEEDBACK_TYPES[rep.type] || FEEDBACK_TYPES.falha;
          const severityMeta = FEEDBACK_SEVERITIES[rep.severity] || FEEDBACK_SEVERITIES.media;
          const isResolved = rep.status === 'resolvido';
          const isInProgress = rep.status === 'em_analise';

          const statusBadge = isResolved
            ? '<span class="badge badge-success" style="font-size:0.7rem;">✓ Resolvido</span>'
            : (isInProgress
                ? '<span class="badge badge-warning" style="font-size:0.7rem;">⏳ Em Análise</span>'
                : '<span class="badge badge-danger" style="font-size:0.7rem;">● Pendente</span>');

          return `
            <div class="feedback-admin-card" style="background:var(--locar-chumbo-surface); border:1px solid var(--locar-chumbo-border); border-left:4px solid ${typeMeta.color}; border-radius:var(--radius-md); padding:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
                <div>
                  <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <span style="font-family:var(--font-mono); font-weight:800; color:var(--locar-yellow); font-size:0.85rem;">${escapeHTML(rep.id)}</span>
                    <span style="font-size:0.75rem; font-weight:700; color:#FFF; background:rgba(255,255,255,0.08); padding:0.15rem 0.45rem; border-radius:4px;">${escapeHTML(typeMeta.label)}</span>
                    ${statusBadge}
                  </div>
                  <strong style="display:block; color:#FFF; font-size:0.95rem; margin-top:0.35rem;">${escapeHTML(rep.subject)}</strong>
                </div>
                <span style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">${escapeHTML(rep.formattedDate)}</span>
              </div>

              <div style="font-size:0.82rem; color:var(--text-secondary); background:rgba(0,0,0,0.25); border-radius:var(--radius-sm); padding:0.75rem; margin-bottom:0.75rem; line-height:1.5; white-space:pre-wrap;">${escapeHTML(rep.description)}</div>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; font-size:0.75rem; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem;">
                <div>
                  <span>Enviado por: <strong style="color:#FFF;">${escapeHTML(rep.senderName)}</strong> (${escapeHTML(rep.senderRole)})</span>
                  ${rep.senderEmail ? ` • <a href="mailto:${escapeHTML(rep.senderEmail)}" style="color:var(--locar-yellow); text-decoration:none;">${escapeHTML(rep.senderEmail)}</a>` : ''}
                  ${rep.senderPhone ? ` • <span>Tel: ${escapeHTML(rep.senderPhone)}</span>` : ''}
                </div>

                <div style="display:flex; gap:0.4rem;">
                  ${!isResolved ? `
                    <button type="button" class="btn btn-sm btn-primary btn-feedback-resolve" data-id="${rep.id}" style="padding:0.25rem 0.6rem; font-size:0.72rem;">
                      ✓ Marcar como Resolvido
                    </button>
                  ` : `
                    <button type="button" class="btn btn-sm btn-secondary btn-feedback-reopen" data-id="${rep.id}" style="padding:0.25rem 0.6rem; font-size:0.72rem;">
                      ↩ Reabrir
                    </button>
                  `}
                  ${rep.senderEmail ? `
                    <a href="mailto:${escapeHTML(rep.senderEmail)}?subject=${encodeURIComponent(`[Resposta Locar] ${rep.subject} (${rep.id})`)}" class="btn btn-sm btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.72rem; text-decoration:none;">
                      ✉️ Responder
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
