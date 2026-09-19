/**
 * Módulo de Solicitações de Serviço (S.S.) para o PCM (Planejamento e Controle de Manutenção)
 * Locar Guindastes e Transportes Intermodais
 */

import { Storage } from '../storage.js';

export const PCMServiceRequests = {
  /**
   * Gera o link para despacho direto via WhatsApp para a liderança do PCM
   */
  generateWhatsAppLink(ss) {
    const faultsText = (ss.nonConformities || []).map((nc, idx) => `• ${nc.item}: ${nc.note}`).join('\n');
    const msg = `🚨 *SOLICITAÇÃO DE SERVIÇO AO PCM - LOCAR GUINDASTES (BETIM)*\n\n` +
      `*S.S. Nº:* ${ss.id}\n` +
      `*Equipamento:* ${ss.equipmentTag} (${ss.equipmentName})\n` +
      `*Status:* ⛔ BLOQUEADO NO PÁTIO DE BETIM\n` +
      `*Inspetor:* ${ss.openedBy}\n` +
      `*Telefone do Inspetor:* ${ss.inspectorPhone || 'Não informado'}\n` +
      `*Data:* ${ss.openedDate}\n\n` +
      `*NÃO CONFORMIDADES APONTADAS:*\n${faultsText}\n\n` +
      `_Encaminhado automaticamente pelo Sistema de Inspeção e Qualidade Locar._`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  },

  /**
   * Gera o corpo e assunto do E-mail Padrão Formal para o PCM
   */
  generatePCMEmail(ss) {
    const config = Storage.getPCMConfig();
    const recipient = ss.pcmRecipient || config.pcmEmail;
    const subject = `[SOLICITAÇÃO DE SERVIÇO PCM - LOCAR] Retenção de Frota por Não Conformidade - TAG: ${ss.equipmentTag} (${ss.equipmentName})`;
    
    // Versão texto simples para mailto
    const textBody = `À EQUIPE DE PLANEJAMENTO E CONTROLE DE MANUTENÇÃO (PCM) - LOCAR GUINDASTES

Prezados,

Informamos que o equipamento abaixo foi REPROVADO em inspeção técnica regulamentar e encontra-se IMEDIATAMENTE BLOQUEADO e retido no pátio, não podendo ser disponibilizado para locação ou operação.

Solicitamos o planejamento e a abertura de Ordem de Trabalho para execução dos reparos corretivos necessários.

=======================================================
DADOS DA SOLICITAÇÃO DE SERVIÇO: ${ss.id}
=======================================================
• Equipamento / TAG: ${ss.equipmentTag}
• Descrição / Modelo: ${ss.equipmentName}
• Categoria: ${ss.type.toUpperCase()}
• Filial / Base: ${ss.branch || '2-Betim / MG'}
• Horímetro: ${ss.hourmeter || 'N/A'} h
• Data / Hora da Vistoria: ${ss.openedDate}
• Inspetor Responsável: ${ss.openedBy}
• Telefone de Contato do Inspetor: ${ss.inspectorPhone || 'Não informado'}
• Gravidade do Bloqueio: ${ss.severity.toUpperCase()}

=======================================================
NÃO CONFORMIDADES DETECTADAS (${ss.nonConformities?.length || 0} ITENS):
=======================================================
${(ss.nonConformities || []).map((nc, idx) => `
${idx + 1}. [${nc.type || 'Critério Normativo'}]
   Item: ${nc.item}
   Norma: ${nc.norm}
   Defeito Apontado: ${nc.note}
`).join('')}

DIRETRIZ DA GERÊNCIA DE FROTA & QSMS:
Conforme procedimento corporativo da Locar Guindastes, o equipamento somente retornará ao status "DISPONÍVEL" após a conclusão de 100% dos reparos e aprovação em nova inspeção técnica.

Atenciosamente,
Sistema Integrado de Inspeção e Qualidade de Frota
Locar Guindastes e Transportes Intermodais S/A
`;

    // Versão HTML Rica para visualização e envio
    const htmlBody = `
      <div style="font-family:'Segoe UI', Arial, sans-serif; max-width:680px; margin:0 auto; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:8px; overflow:hidden; color:#1E293B;">
        <div style="background:#474444; padding:18px 24px; border-bottom:4px solid #FFF212; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <img src="assets/locar_logo.png" alt="Locar Guindastes" style="max-height:48px; width:auto; display:block;" />
          </div>
          <div style="text-align:right;">
            <span style="color:#FFF212; font-size:12px; font-weight:bold; letter-spacing:1px; display:block;">SOLICITAÇÃO DE SERVIÇO AO PCM</span>
            <span style="color:#FFFFFF; font-size:11px; opacity:0.9;">RETENÇÃO DE FROTA POR NÃO CONFORMIDADE</span>
          </div>
        </div>

        <div style="padding:24px;">
          <div style="background:#FEF2F2; border-left:4px solid #EF4444; padding:12px 16px; margin-bottom:20px; border-radius:4px;">
            <strong style="color:#991B1B; font-size:14px; display:block;">EQUIPAMENTO BLOQUEADO NO PÁTIO DE MANUTENÇÃO</strong>
            <span style="font-size:12px; color:#7F1D1D;">Solicitação formal de intervenção corretiva gerada automaticamente após reprovação em checklist normativo.</span>
          </div>

          <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
            <tr style="background:#F8FAFC;">
              <td style="padding:8px 12px; border:1px solid #E2E8F0; width:35%;"><strong>Número da S.S.:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0; font-family:monospace; font-weight:bold; color:#B45309;">${ss.id}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px; border:1px solid #E2E8F0;"><strong>Equipamento / TAG:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0; font-weight:bold; color:#14171D;">${ss.equipmentTag} - ${ss.equipmentName}</td>
            </tr>
            <tr style="background:#F8FAFC;">
              <td style="padding:8px 12px; border:1px solid #E2E8F0;"><strong>Filial / Base:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0;">${ss.branch || 'Locar Matriz'}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px; border:1px solid #E2E8F0;"><strong>Horímetro Registrado:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0;">${ss.hourmeter || 'N/A'} h</td>
            </tr>
            <tr style="background:#F8FAFC;">
              <td style="padding:8px 12px; border:1px solid #E2E8F0;"><strong>Data / Inspetor:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0;">${ss.openedDate} por <strong>${ss.openedBy}</strong></td>
            </tr>
            <tr>
              <td style="padding:8px 12px; border:1px solid #E2E8F0;"><strong>Tel. Contato Inspetor:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0; font-weight:bold; color:#B45309;">${ss.inspectorPhone || 'Não informado'}</td>
            </tr>
            <tr style="background:#F8FAFC;">
              <td style="padding:8px 12px; border:1px solid #E2E8F0;"><strong>E-mail do PCM:</strong></td>
              <td style="padding:8px 12px; border:1px solid #E2E8F0; color:#2563EB;">${recipient}</td>
            </tr>
          </table>

          <h3 style="font-size:14px; color:#0F172A; border-bottom:2px solid #E2E8F0; padding-bottom:6px; margin-bottom:12px;">RELAÇÃO DE NÃO CONFORMIDADES PARA O PCM PROGRAMAR:</h3>

          <div style="margin-bottom:20px;">
            ${(ss.nonConformities || []).map((nc, idx) => `
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <strong style="color:#0F172A; font-size:13px;">#${idx + 1} - ${nc.item}</strong>
                  <span style="font-size:11px; background:#FEF3C7; color:#92400E; padding:2px 6px; border-radius:3px; font-weight:bold;">${nc.norm}</span>
                </div>
                <div style="font-size:12px; color:#EF4444; font-weight:600; margin-bottom:6px;">
                  Defeito Apontado: ${nc.note}
                </div>
                ${nc.photo ? `
                  <div style="margin-top:8px;">
                    <img src="${nc.photo}" style="max-height:120px; border-radius:4px; border:1px solid #CBD5E1;" alt="Evidência Fotográfica" />
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:6px; padding:12px; font-size:12px; color:#92400E;">
            <strong>Ação do PCM:</strong> Favor incluir este equipamento no cronograma de serviços prioritários, providenciar peças e recursos necessários e sinalizar a conclusão através do sistema para agendamento da reinspeção.
          </div>
        </div>

        <div style="background:#F1F5F9; padding:12px 20px; font-size:11px; color:#64748B; border-top:1px solid #E2E8F0; text-align:center;">
          Notificação automática do Sistema de Inspeção de Frotas | Locar Guindastes e Transportes Intermodais S/A
        </div>
      </div>
    `;

    return {
      recipient,
      subject,
      textBody,
      htmlBody,
      mailtoUrl: `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`
    };
  },

  renderServiceRequestsList(containerElement, filterStatus = 'todos', filterType = 'todos') {
    if (!containerElement) return;

    let requests = Storage.getServiceRequests();

    if (filterStatus !== 'todos') {
      requests = requests.filter(s => s.status === filterStatus);
    }
    if (filterType !== 'todos') {
      requests = requests.filter(s => s.type === filterType);
    }

    if (requests.length === 0) {
      containerElement.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📨</div>
          <h3>Nenhuma Solicitação de Serviço para o PCM</h3>
          <p>Nenhum equipamento retido para os filtros selecionados. A frota está operando dentro dos parâmetros de qualidade e disponibilidade.</p>
        </div>
      `;
      return;
    }

    const html = requests.map(ss => {
      const statusBadge = {
        aberta: '<span class="badge badge-danger">S.S. Aberta / Aguardando PCM</span>',
        em_planejamento: '<span class="badge badge-warning">Em Planejamento no PCM</span>',
        em_execucao: '<span class="badge badge-warning">Em Execução na Oficina</span>',
        concluida: '<span class="badge badge-success">Serviço Concluído (Pronto p/ Reinspeção)</span>'
      }[ss.status] || `<span class="badge">${ss.status}</span>`;

      const typeLabel = {
        pta: 'Plataforma Elevatória',
        guindaste: 'Guindaste',
        empilhadeira: 'Empilhadeira'
      }[ss.type] || ss.type.toUpperCase();

      return `
        <div class="os-card" data-ss-id="${ss.id}">
          <div class="os-card-header">
            <div class="os-header-left">
              <span class="os-id">${ss.id}</span>
              <span class="os-tag">${ss.equipmentTag}</span>
              <span class="os-type-tag">${typeLabel}</span>
            </div>
            <div class="os-header-right" style="display:flex; align-items:center; gap:0.5rem;">
              <span class="badge" style="background:rgba(59,130,246,0.15); color:#60A5FA; border:1px solid rgba(59,130,246,0.3);">
                ✉ E-mail Enviado ao PCM (${ss.pcmRecipient || 'pcm@locar.com.br'})
              </span>
              ${statusBadge}
            </div>
          </div>

          <div class="os-card-body">
            <h4 class="os-equipment-name">${ss.equipmentName}</h4>
            <p class="os-date">
              Abertura: <strong>${ss.openedDate}</strong> | 
              Inspetor: <strong>${ss.openedBy}</strong> | 
              Tel. Contato: <strong style="color:var(--locar-yellow);">${ss.inspectorPhone || 'Não informado'}</strong> | 
              Filial: <strong>${ss.branch || '2-Betim'}</strong>
            </p>
            
            <div class="os-nc-list">
              <h5>Não Conformidades Solicitadas ao PCM (${ss.nonConformities?.length || 0}):</h5>
              <ul>
                ${(ss.nonConformities || []).map(nc => `
                  <li>
                    <strong>[${nc.type || 'Critério'}]:</strong> ${nc.item} - 
                    <span class="nc-note">${nc.note}</span>
                    ${nc.photo ? `<button class="btn-view-evidence" data-photo="${nc.photo}" title="Ver foto">📷 Foto</button>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="os-solution-box">
              <label><strong>Parecer e Acompanhamento do PCM:</strong></label>
              <p class="solution-text">${ss.solutionNotes || 'Aguardando cronograma de planejamento de recursos e oficina pelo PCM.'}</p>
            </div>
          </div>

          <div class="os-card-footer">
            <div class="os-actions" style="flex-wrap:wrap;">
              ${ss.status !== 'concluida' ? `
                <button class="btn btn-sm btn-outline-warning btn-advance-ss" data-id="${ss.id}" data-current="${ss.status}">
                  ${ss.status === 'aberta' ? '▶ PCM: Iniciar Planejamento' : (ss.status === 'em_planejamento' ? '⚙ Enviar para Oficina' : '✓ Concluir Reparo')}
                </button>
              ` : `
                <button class="btn btn-sm btn-success btn-reinspect" data-tag="${ss.equipmentTag}" data-type="${ss.type}">
                  🔍 Iniciar Nova Inspeção Técnica de Liberação
                </button>
              `}
              <button class="btn btn-sm btn-secondary btn-view-pcm-email" data-id="${ss.id}">
                📧 Visualizar E-mail do PCM
              </button>
              <button class="btn btn-sm btn-secondary btn-edit-solution" data-id="${ss.id}">
                📝 Adicionar Nota do PCM
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    containerElement.innerHTML = html;
  }
};
