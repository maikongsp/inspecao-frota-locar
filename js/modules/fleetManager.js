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
    const reservadas = fleet.filter(e => e.status === 'reservada').length;
    const manutencao = fleet.filter(e => e.status === 'manutencao').length;
    const bloqueados = fleet.filter(e => e.status === 'bloqueado').length;
    const locadas = fleet.filter(e => e.status === 'locada').length;
    const taxaAprovacao = total > 0 ? Math.round(((disponiveis + locadas + reservadas) / total) * 100) : 0;

    const badgeBloq = document.getElementById('badge-count-bloqueados');
    if (badgeBloq) badgeBloq.textContent = bloqueados;

    // Métricas segregadas pelas 2 Divisões Oficiais de Negócio da Locar:
    // 1. Divisão PTA (Plataformas Elevatórias: Articuladas, Telescópicas, Tesouras)
    // 2. Divisão Guindastes & Demais Ativos (Guindastes AT/RT/Esteira, Guindautos, Empilhadeiras e Cargas Pesadas)
    const ptaItems = fleet.filter(e => e.type === 'pta');
    const ptaTotal = ptaItems.length;
    const ptaDisp = ptaItems.filter(e => e.status === 'disponivel').length;
    const ptaLoc = ptaItems.filter(e => e.status === 'locada').length;
    const ptaRes = ptaItems.filter(e => e.status === 'reservada').length;
    const ptaMan = ptaItems.filter(e => e.status === 'manutencao').length;
    const ptaTaxa = ptaTotal > 0 ? Math.round(((ptaDisp + ptaLoc + ptaRes) / ptaTotal) * 100) : 0;

    const guindastesItems = fleet.filter(e => e.type !== 'pta');
    const guindTotal = guindastesItems.length;
    const guindDisp = guindastesItems.filter(e => e.status === 'disponivel').length;
    const guindLoc = guindastesItems.filter(e => e.status === 'locada').length;
    const guindRes = guindastesItems.filter(e => e.status === 'reservada').length;
    const guindMan = guindastesItems.filter(e => e.status === 'manutencao').length;
    const guindTaxa = guindTotal > 0 ? Math.round(((guindDisp + guindLoc + guindRes) / guindTotal) * 100) : 0;

    // Sub-segmentação interna da Divisão de Guindastes para auditoria e controle do PCM
    const countGuindastesPuros = guindastesItems.filter(e => e.type === 'guindaste' || e.type === 'guindauto').length;
    const countEmpilhadeirasOutros = guindTotal - countGuindastesPuros;

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

        <div class="kpi-card" style="border-left:4px solid #F59E0B;">
          <div class="kpi-icon-box" style="background:rgba(245,158,11,0.15); color:#F59E0B;">📑</div>
          <div class="kpi-details">
            <span class="kpi-label">Total Reservadas</span>
            <span class="kpi-value" style="color:#F59E0B;">${reservadas}</span>
            <span class="kpi-sub">Comercial / Em Negociação</span>
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
            <span class="kpi-sub">(Locadas + Disp. + Reserv.) / Total</span>
          </div>
        </div>
      </div>

      <!-- PAINEL DETALHADO POR DIVISÃO DE NEGÓCIO OFICIAL LOCAR -->
      <div style="margin-top:0.5rem; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
        <span style="font-size:0.85rem; font-weight:800; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.5px;">
          🏢 Divisões de Negócio Locar Betim / MG
        </span>
        <span style="font-size:0.75rem; color:var(--text-disabled);">Estrutura Oficial de Gestão Comercial & Operacional</span>
      </div>

      <div class="category-kpis-grid">
        <!-- 1. CARD ANALÍTICO: DIVISÃO PTA (PLATAFORMAS ELEVATÓRIAS) -->
        <div class="category-summary-card" style="border-top:3px solid var(--locar-yellow);">
          <div class="category-card-header">
            <div class="category-card-title">
              <span class="category-icon-box">🏗️</span>
              <div class="category-title-text">
                <span class="category-title-main">Divisão PTA (Plataformas Elevatórias)</span>
                <span class="category-title-sub">Articuladas, Telescópicas e Tesouras (Genie, JLG, Haulotte, Skyjack)</span>
              </div>
            </div>
            <span class="category-badge-total">${ptaTotal} Ativos</span>
          </div>

          <div class="category-status-breakdown">
            <div class="status-mini-card">
              <span class="status-mini-label">Disponíveis</span>
              <span class="status-mini-val status-val-disp">${ptaDisp}</span>
              <span class="status-mini-pct">${Math.round((ptaDisp / (ptaTotal || 1)) * 100)}% da frota</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Locadas</span>
              <span class="status-mini-val status-val-loc">${ptaLoc}</span>
              <span class="status-mini-pct">${Math.round((ptaLoc / (ptaTotal || 1)) * 100)}% em campo</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Reservadas</span>
              <span class="status-mini-val" style="color:#F59E0B;">${ptaRes}</span>
              <span class="status-mini-pct">${Math.round((ptaRes / (ptaTotal || 1)) * 100)}% comercial</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Manutenção</span>
              <span class="status-mini-val status-val-man">${ptaMan}</span>
              <span class="status-mini-pct">${Math.round((ptaMan / (ptaTotal || 1)) * 100)}% na oficina</span>
            </div>
          </div>

          <div class="category-summary-footer">
            <span>Disponibilidade Comercial: <strong style="color:var(--locar-yellow);">${ptaTaxa}%</strong></span>
            <span>PCM Betim: <strong>${ptaMan} O.S.</strong></span>
          </div>
        </div>

        <!-- 2. CARD ANALÍTICO: DIVISÃO GUINDASTES E DEMAIS ATIVOS -->
        <div class="category-summary-card" style="border-top:3px solid #38BDF8;">
          <div class="category-card-header">
            <div class="category-card-title">
              <span class="category-icon-box">🏗️</span>
              <div class="category-title-text">
                <span class="category-title-main">Divisão Guindastes & Demais Ativos</span>
                <span class="category-title-sub">Guindastes Industriais, Munck, Empilhadeiras e Cargas Pesadas</span>
              </div>
            </div>
            <span class="category-badge-total" style="background:#38BDF8; color:#0B132B;">${guindTotal} Ativos</span>
          </div>

          <div class="category-status-breakdown">
            <div class="status-mini-card">
              <span class="status-mini-label">Disponíveis</span>
              <span class="status-mini-val status-val-disp">${guindDisp}</span>
              <span class="status-mini-pct">${Math.round((guindDisp / (guindTotal || 1)) * 100)}% no pátio</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Locados</span>
              <span class="status-mini-val status-val-loc">${guindLoc}</span>
              <span class="status-mini-pct">${Math.round((guindLoc / (guindTotal || 1)) * 100)}% em obras</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Reservados</span>
              <span class="status-mini-val" style="color:#F59E0B;">${guindRes}</span>
              <span class="status-mini-pct">${Math.round((guindRes / (guindTotal || 1)) * 100)}% comercial</span>
            </div>
            <div class="status-mini-card">
              <span class="status-mini-label">Manutenção</span>
              <span class="status-mini-val status-val-man">${guindMan}</span>
              <span class="status-mini-pct">${Math.round((guindMan / (guindTotal || 1)) * 100)}% revisão</span>
            </div>
          </div>

          <div class="category-summary-footer">
            <span>Disponibilidade Comercial: <strong style="color:#38BDF8;">${guindTaxa}%</strong></span>
            <span>Composição: <strong>${countGuindastesPuros} Guindastes | ${countEmpilhadeirasOutros} Empilhadeiras/Outros</strong></span>
          </div>
        </div>
      </div>
    `;
  },

  renderFleetGrid(containerElement, filterType = 'todos', filterStatus = 'todos', searchTerm = '') {
    if (!containerElement) return;

    let fleet = Storage.getFleet();

    // Filtro por Divisão de Negócio / Categoria
    if (filterType !== 'todos') {
      if (filterType === 'pta') {
        fleet = fleet.filter(e => e.type === 'pta');
      } else if (filterType === 'guindastes_div' || filterType === 'guindaste') {
        // Na Locar, todos os equipamentos que não são PTA compõem o negócio Guindastes & Demais Ativos
        fleet = fleet.filter(e => e.type !== 'pta');
      } else {
        fleet = fleet.filter(e => e.type === filterType);
      }
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
        reservada: {
          badge: '<span class="fleet-badge" style="background:rgba(245,158,11,0.15); color:#F59E0B; border:1px solid rgba(245,158,11,0.4);"><span class="dot" style="background:#F59E0B;"></span> RESERVADA (COMERCIAL)</span>',
          cardClass: 'card-reserved'
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
        pta: { label: 'PTA - Plataforma', icon: '🏗', division: 'Divisão PTA' },
        guindaste: { label: 'Guindaste', icon: '🏗️', division: 'Divisão Guindastes' },
        guindauto: { label: 'Guindauto / Munck', icon: '🚛', division: 'Divisão Guindastes' },
        empilhadeira: { label: 'Empilhadeira', icon: '🚜', division: 'Divisão Guindastes' }
      }[eq.type] || { 
        label: (eq.typeName || eq.type).toUpperCase(), 
        icon: '⚙', 
        division: eq.type === 'pta' ? 'Divisão PTA' : 'Divisão Guindastes' 
      };

      return `
        <div class="fleet-equipment-card ${statusMeta.cardClass}" data-id="${eq.id}">
          <div class="fleet-card-header">
            <div class="card-tag-box">
              <span class="tag-title">${eq.tag}</span>
              <span class="type-pill">${typeMeta.icon} ${typeMeta.label}</span>
              <span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:0.15rem 0.45rem; border-radius:4px; border:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
                ${eq.type === 'pta' ? 'Divisão PTA' : 'Divisão Guindastes'}
              </span>
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

          <div class="fleet-card-footer" style="display:flex; flex-direction:column; gap:0.5rem;">
            ${eq.status === 'reservada' ? `
              <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); border-radius:var(--radius-sm); padding:0.5rem; font-size:0.75rem; color:#FDE68A;">
                <div style="font-weight:700; color:#F59E0B; margin-bottom:2px;">
                  📑 Reservado p/ ${eq.reservation?.clientName || 'Cliente Corporativo'}
                </div>
                <div style="font-size:0.7rem; color:var(--text-muted);">
                  Período: ${eq.reservation?.startDate || '--'} até ${eq.reservation?.endDate || '--'} (${eq.reservation?.estimatedDays || 0} dias estimados)
                </div>
              </div>
              <div style="display:flex; gap:0.4rem; width:100%;">
                <button type="button" class="btn btn-sm btn-success btn-activate-rental" data-id="${eq.id}" style="background:#10B981; color:#FFF; font-weight:700; flex:1; justify-content:center;">
                  🚀 Iniciar Operação (Locar)
                </button>
                <button type="button" class="btn btn-sm btn-secondary btn-cancel-reservation" data-id="${eq.id}" title="Cancelar Reserva Comercial">
                  ✕ Cancelar
                </button>
              </div>
            ` : eq.status === 'disponivel' ? `
              <div style="display:flex; gap:0.4rem; width:100%;">
                <button type="button" class="btn btn-primary btn-start-inspection" data-id="${eq.id}" data-type="${eq.type}" style="flex:1;">
                  📋 Inspecionar
                </button>
                <button type="button" class="btn btn-warning btn-open-reserve" data-id="${eq.id}" style="background:#F59E0B; color:#0F172A; font-weight:700; border:none; padding:0.45rem 0.75rem;">
                  📑 Reservar
                </button>
                <button type="button" class="btn btn-secondary btn-view-history" data-id="${eq.id}" title="Histórico de Vistorias">
                  📜
                </button>
              </div>
            ` : `
              <div style="display:flex; gap:0.4rem; width:100%;">
                <button type="button" class="btn btn-primary btn-start-inspection" data-id="${eq.id}" data-type="${eq.type}" style="flex:1;">
                  📋 Iniciar Inspeção
                </button>
                <button type="button" class="btn btn-secondary btn-view-history" data-id="${eq.id}">
                  📜 Histórico
                </button>
              </div>
            `}
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
      'Divisão de Negócio',
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
      eq.type === 'pta' ? 'Divisão PTA' : 'Divisão Guindastes e Demais Ativos',
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
