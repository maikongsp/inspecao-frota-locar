/**
 * Módulo de Gestão de Frota e Dashboard de Disponibilidade
 * Locar Guindastes e Transportes Intermodais
 */

import { Storage } from '../storage.js';
import { sanitizeCSV } from '../utils.js';

export const FleetManager = {
  currentLimit: 24,

  renderMetrics(containerElement) {
    if (!containerElement) return;

    const fleet = Storage.getFleet();
    const total = fleet.length;
    const disponiveis = fleet.filter(e => e.status === 'disponivel').length;
    const manutencao = fleet.filter(e => e.status === 'manutencao').length;
    const bloqueados = fleet.filter(e => e.status === 'bloqueado').length;
    const locadas = fleet.filter(e => e.status === 'locada').length;
    const taxaAprovacao = total > 0 ? Math.round(((disponiveis + locadas) / total) * 100) : 0;

    const badgeBloq = document.getElementById('badge-count-bloqueados');
    if (badgeBloq) badgeBloq.textContent = bloqueados;

    // Métricas segregadas por Categoria (PTA, Guindastes, Empilhadeiras)
    const getCatStats = (catType) => {
      const items = fleet.filter(e => e.type === catType);
      const catTotal = items.length;
      const catDisp = items.filter(e => e.status === 'disponivel').length;
      const catLoc = items.filter(e => e.status === 'locada').length;
      const catMan = items.filter(e => e.status === 'manutencao').length;
      const catOp = catTotal > 0 ? Math.round(((catDisp + catLoc) / catTotal) * 100) : 0;
      return { total: catTotal, disp: catDisp, loc: catLoc, man: catMan, taxa: catOp };
    };

    const pta = getCatStats('pta');
    const guindastes = getCatStats('guindaste');
    const empilhadeiras = getCatStats('empilhadeira');

    containerElement.innerHTML = `
      <!-- CARDS GERAIS CONSOLIDADOS DA BASE BETIM -->
      <div class="kpis-grid">
        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-total">🚜</div>
          <div class="kpi-details">
            <span class="kpi-label">Frota Engeman® CMMS | Betim/MG</span>
            <span class="kpi-value">${total}</span>
            <span class="kpi-sub">Total de Ativos Cadastrados</span>
          </div>
        </div>

        <div class="kpi-card kpi-card-success">
          <div class="kpi-icon-box kpi-icon-ok">✓</div>
          <div class="kpi-details">
            <span class="kpi-label">Total Disponíveis</span>
            <span class="kpi-value text-success">${disponiveis}</span>
            <span class="kpi-sub">Aptos para Locação</span>
          </div>
        </div>

        <div class="kpi-card" style="border-left:4px solid #38BDF8;">
          <div class="kpi-icon-box" style="background:rgba(56,189,248,0.15); color:#38BDF8;">🏗️</div>
          <div class="kpi-details">
            <span class="kpi-label">Total Locadas</span>
            <span class="kpi-value" style="color:#38BDF8;">${locadas}</span>
            <span class="kpi-sub">Em Operação em Clientes</span>
          </div>
        </div>

        <div class="kpi-card kpi-card-warning">
          <div class="kpi-icon-box kpi-icon-warn">🔧</div>
          <div class="kpi-details">
            <span class="kpi-label">Total em Manutenção</span>
            <span class="kpi-value text-warning">${manutencao}</span>
            <span class="kpi-sub">Na Oficina / PCM</span>
          </div>
        </div>

        <div class="kpi-card kpi-card-locar">
          <div class="kpi-icon-box kpi-icon-locar">📊</div>
          <div class="kpi-details">
            <span class="kpi-label">Eficiência Operacional</span>
            <span class="kpi-value text-locar">${taxaAprovacao}%</span>
            <span class="kpi-sub">(Locadas + Disponíveis) / Total</span>
          </div>
        </div>
      </div>

      <!-- PAINEL DETALHADO POR CATEGORIA DE EQUIPAMENTO -->
      <div style="margin-top:0.5rem; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:0.85rem; font-weight:800; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.5px;">
          📊 Status Detalhado por Família de Equipamentos (Engeman®)
        </span>
        <span style="font-size:0.75rem; color:var(--text-disabled);">Filial 2-Betim / MG</span>
      </div>

      <div class="category-kpis-grid">
        <!-- 1. CARD ANALÍTICO: PLATAFORMAS ELEVATÓRIAS (PTA) -->
        <div class="category-summary-card" style="border-top:3px solid var(--locar-yellow);">
          <div class="category-card-header">
            <div class="category-card-title">
              <span class="category-icon-box">🏗️</span>
              <div class="category-title-text">
                <span class="category-title-main">Plataformas Elevatórias (PTA)</span>
                <span class="category-title-sub">Articuladas, Telescópicas e Tesouras</span>
              </div>
            </div>
            <span class="category-badge-total">${pta.total} Ativos</span>
          </div>

          <div class="category-status-breakdown">
            <div class="status-mini-card">
              <span class="status-mini-label">Disponíveis</span>
              <span class="status-mini-val status-val-disp">${pta.disp}</span>
              <span class="status-mini-pct">${Math.round((pta.disp / pta.total) * 100)}% da frota</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Locadas</span>
              <span class="status-mini-val status-val-loc">${pta.loc}</span>
              <span class="status-mini-pct">${Math.round((pta.loc / pta.total) * 100)}% em campo</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Manutenção</span>
              <span class="status-mini-val status-val-man">${pta.man}</span>
              <span class="status-mini-pct">${Math.round((pta.man / pta.total) * 100)}% na oficina</span>
            </div>
          </div>

          <div class="category-summary-footer">
            <span>Aproveitamento: <strong style="color:var(--locar-yellow);">${pta.taxa}%</strong></span>
            <span>PCM Betim: <strong>${pta.man} O.S.</strong></span>
          </div>
        </div>

        <!-- 2. CARD ANALÍTICO: GUINDASTES INDUSTRIAIS -->
        <div class="category-summary-card" style="border-top:3px solid #38BDF8;">
          <div class="category-card-header">
            <div class="category-card-title">
              <span class="category-icon-box">🏗️</span>
              <div class="category-title-text">
                <span class="category-title-main">Guindastes Industriais</span>
                <span class="category-title-sub">Liebherr, Grove, Tadano e XCMG</span>
              </div>
            </div>
            <span class="category-badge-total" style="background:#38BDF8; color:#0B132B;">${guindastes.total} Ativos</span>
          </div>

          <div class="category-status-breakdown">
            <div class="status-mini-card">
              <span class="status-mini-label">Disponíveis</span>
              <span class="status-mini-val status-val-disp">${guindastes.disp}</span>
              <span class="status-mini-pct">${Math.round((guindastes.disp / guindastes.total) * 100)}% no pátio</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Locados</span>
              <span class="status-mini-val status-val-loc">${guindastes.loc}</span>
              <span class="status-mini-pct">${Math.round((guindastes.loc / guindastes.total) * 100)}% em obras</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Manutenção</span>
              <span class="status-mini-val status-val-man">${guindastes.man}</span>
              <span class="status-mini-pct">${Math.round((guindastes.man / guindastes.total) * 100)}% revisão</span>
            </div>
          </div>

          <div class="category-summary-footer">
            <span>Aproveitamento: <strong style="color:#38BDF8;">${guindastes.taxa}%</strong></span>
            <span>PCM Betim: <strong>${guindastes.man} O.S.</strong></span>
          </div>
        </div>

        <!-- 3. CARD ANALÍTICO: EMPILHADEIRAS OPERACIONAIS -->
        <div class="category-summary-card" style="border-top:3px solid #F59E0B;">
          <div class="category-card-header">
            <div class="category-card-title">
              <span class="category-icon-box">🚜</span>
              <div class="category-title-text">
                <span class="category-title-main">Empilhadeiras Operacionais</span>
                <span class="category-title-sub">Yale e Hyster (Movimentação)</span>
              </div>
            </div>
            <span class="category-badge-total" style="background:#F59E0B; color:#0B132B;">${empilhadeiras.total} Ativos</span>
          </div>

          <div class="category-status-breakdown">
            <div class="status-mini-card">
              <span class="status-mini-label">Disponíveis</span>
              <span class="status-mini-val status-val-disp">${empilhadeiras.disp}</span>
              <span class="status-mini-pct">${Math.round((empilhadeiras.disp / empilhadeiras.total) * 100)}% ativa</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Locadas</span>
              <span class="status-mini-val status-val-loc">${empilhadeiras.loc}</span>
              <span class="status-mini-pct">0% em campo</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Manutenção</span>
              <span class="status-mini-val status-val-man">${empilhadeiras.man}</span>
              <span class="status-mini-pct">${Math.round((empilhadeiras.man / empilhadeiras.total) * 100)}% na base</span>
            </div>
          </div>

          <div class="category-summary-footer">
            <span>Aproveitamento: <strong style="color:#F59E0B;">${empilhadeiras.taxa}%</strong></span>
            <span>PCM Betim: <strong>${empilhadeiras.man} O.S.</strong></span>
          </div>
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
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔍</div>
          <h3>Nenhum Equipamento Encontrado</h3>
          <p>Nenhum equipamento da frota corresponde aos critérios de busca selecionados.</p>
        </div>
      `;
      return;
    }

    const totalMatching = fleet.length;
    const displayedItems = fleet.slice(0, this.currentLimit);
    const hasMore = this.currentLimit < totalMatching;

    const cardsHtml = displayedItems.map(eq => {
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

    const paginationHtml = hasMore ? `
      <div class="load-more-box" style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; gap:0.75rem; margin: 2rem 0; padding:1.5rem; background:var(--locar-chumbo-surface); border-radius:var(--radius-md); border:1px solid var(--locar-chumbo-border);">
        <span style="font-size:0.85rem; color:var(--text-muted);">
          Exibindo <strong>${displayedItems.length}</strong> de <strong>${totalMatching}</strong> equipamentos da frota de Betim
        </span>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; justify-content:center;">
          <button type="button" class="btn btn-primary btn-load-more-fleet" style="padding:0.75rem 1.75rem;">
            ⬇ Carregar Mais (+24 Equipamentos)
          </button>
          <button type="button" class="btn btn-secondary btn-load-all-fleet" style="padding:0.75rem 1.75rem;">
            Mostrar Todos (${totalMatching})
          </button>
        </div>
      </div>
    ` : `
      <div style="grid-column: 1 / -1; text-align:center; padding:1rem; color:var(--text-muted); font-size:0.8rem;">
        ✓ Todos os ${totalMatching} equipamentos correspondentes estão exibidos.
      </div>
    `;

    containerElement.innerHTML = cardsHtml + paginationHtml;
  },

  /**
   * Exporta a frota completa para arquivo Excel / CSV (com UTF-8 BOM)
   */
  exportFleetToCSV() {
    const fleet = Storage.getFleet();
    const headers = [
      'TAG / Prefixo',
      'Categoria',
      'Marca',
      'Modelo',
      'Ano',
      'Chassi / Série',
      'Capacidade',
      'Horímetro (h)',
      'Filial / Base',
      'Status Operacional',
      'Última Inspeção',
      'Observações Técnicas'
    ];

    const rows = fleet.map(eq => [
      eq.tag,
      eq.typeName || eq.type,
      eq.brand,
      eq.model,
      eq.year,
      eq.serialNumber || 'N/A',
      eq.capacity || 'N/A',
      eq.hourmeter || 0,
      eq.branch || 'Betim - MG',
      eq.status.toUpperCase(),
      eq.lastInspectionDate || 'Nunca',
      (eq.notes || '').replace(/[\n\r;]/g, ' ')
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.map(field => `"${sanitizeCSV(field)}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Frota_Locar_Betim_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
