/**
 * Módulo de Ordens de Serviço e Manutenção
 * Controla os equipamentos bloqueados por não conformidade
 */

import { Storage } from '../storage.js';

export const MaintenanceOS = {
  renderWorkOrdersList(containerElement, filterStatus = 'todos', filterType = 'todos') {
    if (!containerElement) return;

    let orders = Storage.getWorkOrders();

    if (filterStatus !== 'todos') {
      orders = orders.filter(o => o.status === filterStatus);
    }
    if (filterType !== 'todos') {
      orders = orders.filter(o => o.type === filterType);
    }

    if (orders.length === 0) {
      containerElement.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🔧</div>
          <h3>Nenhuma Ordem de Serviço Encontrada</h3>
          <p>Nenhum equipamento retido para os filtros selecionados. A frota está operando dentro dos parâmetros de qualidade.</p>
        </div>
      `;
      return;
    }

    const html = orders.map(os => {
      const statusBadge = {
        aberta: '<span class="badge badge-danger">Aberta / Aguardando Peças</span>',
        em_execucao: '<span class="badge badge-warning">Em Execução na Oficina</span>',
        concluida: '<span class="badge badge-success">Reparo Concluído (Apto a Reinspeção)</span>'
      }[os.status] || `<span class="badge">${os.status}</span>`;

      const typeLabel = {
        pta: 'Plataforma Elevatória',
        guindaste: 'Guindaste',
        empilhadeira: 'Empilhadeira'
      }[os.type] || os.type.toUpperCase();

      return `
        <div class="os-card" data-os-id="${os.id}">
          <div class="os-card-header">
            <div class="os-header-left">
              <span class="os-id">${os.id}</span>
              <span class="os-tag">${os.equipmentTag}</span>
              <span class="os-type-tag">${typeLabel}</span>
            </div>
            <div class="os-header-right">
              ${statusBadge}
            </div>
          </div>

          <div class="os-card-body">
            <h4 class="os-equipment-name">${os.equipmentName}</h4>
            <p class="os-date">Abertura: <strong>${os.openedDate}</strong> | Aberta por: <strong>${os.openedBy}</strong></p>
            
            <div class="os-nc-list">
              <h5>Não Conformidades Registradas na Inspeção (${os.nonConformities?.length || 0}):</h5>
              <ul>
                ${(os.nonConformities || []).map(nc => `
                  <li>
                    <strong>[${nc.type || 'Critério'}]:</strong> ${nc.item} - 
                    <span class="nc-note">${nc.note}</span>
                    ${nc.photo ? `<button class="btn-view-evidence" data-photo="${nc.photo}" title="Ver foto">📷 Foto</button>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="os-solution-box">
              <label><strong>Apontamento da Oficina / Ações Corretivas:</strong></label>
              <p class="solution-text">${os.solutionNotes || 'Aguardando diagnóstico mecânico e funilaria/adesivagem.'}</p>
            </div>
          </div>

          <div class="os-card-footer">
            <div class="os-actions">
              ${os.status !== 'concluida' ? `
                <button class="btn btn-sm btn-outline-warning btn-advance-os" data-id="${os.id}" data-current="${os.status}">
                  ${os.status === 'aberta' ? '▶ Iniciar Manutenção' : '✓ Concluir Reparo'}
                </button>
              ` : `
                <button class="btn btn-sm btn-success btn-reinspect" data-tag="${os.equipmentTag}" data-type="${os.type}">
                  🔍 Iniciar Nova Inspeção de Liberação
                </button>
              `}
              <button class="btn btn-sm btn-secondary btn-edit-solution" data-id="${os.id}">
                📝 Adicionar Apontamento Técnico
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    containerElement.innerHTML = html;
  }
};
