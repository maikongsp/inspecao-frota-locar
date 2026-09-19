/**
 * Módulo de Gestão de Frota e Dashboard de Disponibilidade
 * Locar Guindastes e Transportes Intermodais
 */

import { Storage } from '../storage.js';

export const FleetManager = {
  renderMetrics(containerElement) {
    if (!containerElement) return;

    const fleet = Storage.getFleet();
    const total = fleet.length;
    const disponiveis = fleet.filter(e => e.status === 'disponivel').length;
    const manutencao = fleet.filter(e => e.status === 'manutencao').length;
    const locadas = fleet.filter(e => e.status === 'locada').length;
    const bloqueados = fleet.filter(e => e.status === 'bloqueado').length;
    const taxaAprovacao = total > 0 ? Math.round(((disponiveis + locadas) / total) * 100) : 0;

    containerElement.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon-box kpi-icon-total">🚜</div>
        <div class="kpi-details">
          <span class="kpi-label">Frota CMMS Betim/MG</span>
          <span class="kpi-value">${total}</span>
          <span class="kpi-sub">PTA (245), Guindastes (26), Empilhadeiras (2)</span>
        </div>
      </div>

      <div class="kpi-card kpi-card-success">
        <div class="kpi-icon-box kpi-icon-ok">✓</div>
        <div class="kpi-details">
          <span class="kpi-label">Disponíveis no Pátio</span>
          <span class="kpi-value text-success">${disponiveis}</span>
          <span class="kpi-sub">Aptos para Próxima Locação</span>
        </div>
      </div>

      <div class="kpi-card" style="border-left:4px solid #38BDF8;">
        <div class="kpi-icon-box" style="background:rgba(56,189,248,0.15); color:#38BDF8;">🏗️</div>
        <div class="kpi-details">
          <span class="kpi-label">Locadas em Clientes</span>
          <span class="kpi-value" style="color:#38BDF8;">${locadas}</span>
          <span class="kpi-sub">Operando em Contratos</span>
        </div>
      </div>

      <div class="kpi-card kpi-card-warning">
        <div class="kpi-icon-box kpi-icon-warn">🔧</div>
        <div class="kpi-details">
          <span class="kpi-label">Em Manutenção (PCM)</span>
          <span class="kpi-value text-warning">${manutencao}</span>
          <span class="kpi-sub">Programadas na Oficina</span>
        </div>
      </div>

      <div class="kpi-card kpi-card-locar">
        <div class="kpi-icon-box kpi-icon-locar">📊</div>
        <div class="kpi-details">
          <span class="kpi-label">Aproveitamento Operacional</span>
          <span class="kpi-value text-locar">${taxaAprovacao}%</span>
          <span class="kpi-sub">Locadas + Disponíveis / Total</span>
        </div>
      </div>
    `;
  },

  renderFleetGrid(containerElement, filterType = 'todos', filterStatus = 'todos', searchTerm = '') {
    if (!containerElement) return;

    let fleet = Storage.getFleet();

    // Filtro por tipo
    if (filterType !== 'todos') {
      fleet = fleet.filter(e => e.type === filterType);
    }

    // Filtro por status
    if (filterStatus !== 'todos') {
      fleet = fleet.filter(e => e.status === filterStatus);
    }

    // Busca textual por tag, modelo ou marca
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      fleet = fleet.filter(e => 
        e.tag.toLowerCase().includes(term) ||
        e.model.toLowerCase().includes(term) ||
        e.brand.toLowerCase().includes(term) ||
        (e.serialNumber && e.serialNumber.toLowerCase().includes(term))
      );
    }

    if (fleet.length === 0) {
      containerElement.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">🔍</div>
          <h3>Nenhum Equipamento Encontrado</h3>
          <p>Nenhum equipamento da frota corresponde aos critérios de busca selecionados.</p>
        </div>
      `;
      return;
    }

    const html = fleet.map(eq => {
      const statusMeta = {
        disponivel: {
          badge: '<span class="fleet-badge badge-liberado"><span class="dot"></span> DISPONÍVEL NO PÁTIO</span>',
          cardClass: 'card-available'
        },
        locada: {
          badge: '<span class="fleet-badge" style="background:rgba(56,189,248,0.15); color:#38BDF8; border:1px solid rgba(56,189,248,0.4);"><span class="dot" style="background:#38BDF8;"></span> LOCADA EM OBRA</span>',
          cardClass: 'card-rented'
        },
        manutencao: {
          badge: '<span class="fleet-badge badge-manutencao"><span class="dot"></span> EM MANUTENÇÃO (PCM)</span>',
          cardClass: 'card-maintenance'
        },
        bloqueado: {
          badge: '<span class="fleet-badge badge-bloqueado"><span class="dot"></span> BLOQUEADO (CRÍTICO)</span>',
          cardClass: 'card-blocked'
        },
        em_inspecao: {
          badge: '<span class="fleet-badge badge-inspecao"><span class="dot"></span> EM VISTORIA</span>',
          cardClass: 'card-inspecting'
        }
      }[eq.status] || {
        badge: `<span class="fleet-badge">${eq.status}</span>`,
        cardClass: ''
      };

      const typeMeta = {
        pta: { label: 'PTA - Plataforma', icon: '🏗' },
        guindaste: { label: 'Guindaste', icon: '🏗️' },
        empilhadeira: { label: 'Empilhadeira', icon: '🚜' }
      }[eq.type] || { label: eq.type.toUpperCase(), icon: '⚙' };

      return `
        <div class="fleet-equipment-card ${statusMeta.cardClass}" data-id="${eq.id}">
          <div class="fleet-card-header">
            <div class="card-tag-box">
              <span class="tag-title">${eq.tag}</span>
              <span class="type-pill">${typeMeta.icon} ${typeMeta.label}</span>
            </div>
            ${statusMeta.badge}
          </div>

          <div class="fleet-card-body">
            <h3 class="eq-name">${eq.brand} ${eq.model}</h3>
            <p class="eq-sub">${eq.typeName} | Ano: ${eq.year}</p>

            <div class="eq-specs-grid">
              <div class="spec-item">
                <span class="spec-label">Capacidade:</span>
                <span class="spec-val">${eq.capacity}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Horímetro:</span>
                <span class="spec-val">${eq.hourmeter} h</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Alcance / Elevação:</span>
                <span class="spec-val">${eq.maxHeight || 'Conforme Tabela'}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Filial / Base:</span>
                <span class="spec-val">${eq.branch}</span>
              </div>
            </div>

            <div class="eq-audit-box">
              <div class="audit-row">
                <span class="audit-label">Última Inspeção:</span>
                <span class="audit-val">${eq.lastInspectionDate || 'Nunca'}</span>
              </div>
              <p class="audit-notes" title="${eq.notes || ''}">
                ${eq.notes ? (eq.notes.length > 75 ? eq.notes.substring(0, 72) + '...' : eq.notes) : 'Equipamento registrado no sistema.'}
              </p>
            </div>
          </div>

          <div class="fleet-card-footer">
            <button class="btn btn-primary btn-start-inspection" data-id="${eq.id}" data-type="${eq.type}">
              📋 Iniciar Inspeção Técnica
            </button>
            <button class="btn btn-secondary btn-view-history" data-id="${eq.id}">
              📜 Histórico
            </button>
          </div>
        </div>
      `;
    }).join('');

    containerElement.innerHTML = html;
  }
};
