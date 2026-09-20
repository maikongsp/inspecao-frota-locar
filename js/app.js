/**
 * Aplicação Principal - Sistema de Inspeção Locar Guindastes e Transportes Intermodais
 * Orquestração de Telas, Stepper de Inspeção, Validações, S.S. ao PCM e E-mails
 */

import { Storage } from './storage.js';
import { FleetManager } from './modules/fleetManager.js';
import { InspectionEngine } from './modules/inspectionEngine.js';
import { CameraManager } from './modules/cameraManager.js';
import { ReportGenerator } from './modules/reportGenerator.js';
import { PCMServiceRequests } from './modules/pcmServiceRequests.js';
import { CHECKLIST_NORMS } from './data/checklistNorms.js';
import { aiVisionInspector } from './modules/aiVisionInspector.js';
import { aiCopilot } from './modules/aiCopilot.js';
import { appwriteClient } from './appwriteClient.js';
import { escapeHTML } from './utils.js';

// Estado global da interface
const AppState = {
  currentTab: 'dashboard',
  fleetFilterType: 'todos',
  fleetFilterStatus: 'todos',
  fleetSearchTerm: '',
  activeCameraTargetItemId: null,
  activeCameraItemLabel: '',
  signatureCanvas: null,
  signatureCtx: null,
  isDrawingSignature: false,
  hasSignatureStroke: false,
  lastGeneratedEmailText: ''
};

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
  registerPWA();
  initClock();
  initNavigation();
  initFleetView();
  initInspectionEvents();
  initPCMServiceRequestsView();
  initHistoryView();
  initNewEquipmentForm();
  initModals();
  initPCMSettings();
});

function registerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registrado:', reg.scope))
      .catch(err => console.warn('[PWA] Falha ao registrar Service Worker:', err));
  }
}

function initClock() {
  const clockEl = document.getElementById('system-clock-display');
  function updateTime() {
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    }
  }
  updateTime();
  setInterval(updateTime, 1000);
}

function initNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

export function switchTab(tabId) {
  AppState.currentTab = tabId;

  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === `tab-${tabId}`);
  });

  if (tabId === 'dashboard') {
    refreshDashboard();
  } else if (tabId === 'manutencao') {
    refreshPCMView();
  } else if (tabId === 'laudos') {
    refreshHistory();
  }
}

// --- ABA 1: DASHBOARD & FROTA ---
function initFleetView() {
  const typeFilterBtns = document.querySelectorAll('.filter-type-btn');
  typeFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.fleetFilterType = btn.getAttribute('data-type');
      FleetManager.currentLimit = 24;
      renderFleet();
    });
  });

  const statusFilterBtns = document.querySelectorAll('.filter-status-btn');
  statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.fleetFilterStatus = btn.getAttribute('data-status');
      FleetManager.currentLimit = 24;
      renderFleet();
    });
  });

  const searchInput = document.getElementById('fleet-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.fleetSearchTerm = e.target.value;
      FleetManager.currentLimit = 24;
      renderFleet();
    });
  }

  const btnExportCSV = document.getElementById('btn-export-fleet-csv');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      FleetManager.exportFleetToCSV();
      showToast('Relatório completo da frota de Betim exportado com sucesso!', 'success');
    });
  }

  const fleetGrid = document.getElementById('fleet-grid-container');
  if (fleetGrid) {
    fleetGrid.addEventListener('click', (e) => {
      const loadMoreBtn = e.target.closest('.btn-load-more-fleet');
      if (loadMoreBtn) {
        FleetManager.currentLimit += 24;
        renderFleet();
        return;
      }

      const loadAllBtn = e.target.closest('.btn-load-all-fleet');
      if (loadAllBtn) {
        FleetManager.currentLimit = 9999;
        renderFleet();
        return;
      }

      const startBtn = e.target.closest('.btn-start-inspection');
      if (startBtn) {
        const eqId = startBtn.getAttribute('data-id');
        promptStartInspection(eqId);
        return;
      }

      const historyBtn = e.target.closest('.btn-view-history');
      if (historyBtn) {
        const eqId = historyBtn.getAttribute('data-id');
        openEquipmentHistoryModal(eqId);
      }
    });
  }

  refreshDashboard();
}

function refreshDashboard() {
  const kpiContainer = document.getElementById('kpi-metrics-container');
  FleetManager.renderMetrics(kpiContainer);
  renderFleet();
  updateNavCounters();
}

function renderFleet() {
  const fleetGrid = document.getElementById('fleet-grid-container');
  FleetManager.renderFleetGrid(
    fleetGrid,
    AppState.fleetFilterType,
    AppState.fleetFilterStatus,
    AppState.fleetSearchTerm
  );
}

function updateNavCounters() {
  const fleet = Storage.getFleet();
  const serviceRequests = Storage.getServiceRequests();
  const inspections = Storage.getInspections();

  const badgeFleet = document.getElementById('nav-count-fleet');
  if (badgeFleet) badgeFleet.textContent = fleet.length;

  const badgeSS = document.getElementById('nav-count-ss');
  if (badgeSS) {
    const abertas = serviceRequests.filter(s => s.status !== 'concluida').length;
    badgeSS.textContent = abertas;
  }

  const badgeLaudos = document.getElementById('nav-count-laudos');
  if (badgeLaudos) badgeLaudos.textContent = inspections.length;
}

// --- ABA 2: SISTEMA DE INSPEÇÃO (WIZARD GUIADO) ---
function promptStartInspection(equipmentId) {
  const equipment = Storage.getEquipmentById(equipmentId);
  if (!equipment) {
    showToast('Equipamento não encontrado!', 'danger');
    return;
  }

  document.getElementById('modal-start-tag').textContent = equipment.tag;
  document.getElementById('modal-start-name').textContent = `${equipment.brand} ${equipment.model} (${equipment.typeName})`;
  document.getElementById('modal-start-eq-id').value = equipment.id;
  document.getElementById('input-insp-hourmeter').value = equipment.hourmeter || '';

  // Verifica se há Solicitação de Serviço pendente no PCM para este equipamento
  const activeSS = Storage.getServiceRequests().find(s => 
    (s.equipmentId === equipment.id || s.equipmentTag === equipment.tag) && 
    s.status !== 'concluida'
  );
  const ssNoticeEl = document.getElementById('modal-start-ss-notice');
  if (ssNoticeEl) {
    if (activeSS) {
      ssNoticeEl.style.display = 'block';
      ssNoticeEl.innerHTML = `
        <div style="background:rgba(245, 158, 11, 0.15); border:1px solid var(--locar-yellow); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:1rem; font-size:0.78rem; color:#FDE68A;">
          <strong>⚠ ATENÇÃO: EQUIPAMENTO COM S.S. PENDENTE NO PCM:</strong><br/>
          Existe a solicitação <strong>${escapeHTML(activeSS.id)}</strong> (${escapeHTML(activeSS.status.toUpperCase())}) em aberto para este equipamento.<br/>
          <em>Esta nova inspeção servirá como vistoria técnica de comprovação de reparos para eventual liberação.</em>
        </div>
      `;
    } else {
      ssNoticeEl.style.display = 'none';
      ssNoticeEl.innerHTML = '';
    }
  }

  openModal('modal-start-inspection');
}

function initInspectionEvents() {
  const formStart = document.getElementById('form-confirm-start-inspection');
  if (formStart) {
    formStart.addEventListener('submit', (e) => {
      e.preventDefault();
      const eqId = document.getElementById('modal-start-eq-id').value;
      const firstName = document.getElementById('input-insp-first-name').value.trim();
      const lastName = document.getElementById('input-insp-last-name').value.trim();
      const phone = document.getElementById('input-insp-phone').value.trim();
      const inspectorShift = document.getElementById('select-insp-shift').value;
      const hourmeter = Number(document.getElementById('input-insp-hourmeter').value);

      if (!firstName || !lastName) {
        showToast('Preencha o Nome e Sobrenome do inspetor responsável!', 'warning');
        return;
      }

      if (!phone || phone.length < 8) {
        showToast('O telefone de contato do inspetor é obrigatório por norma corporativa!', 'danger');
        return;
      }

      const equipment = Storage.getEquipmentById(eqId);
      const currentEqHourmeter = Number(equipment.hourmeter) || 0;
      if (isNaN(hourmeter) || hourmeter < 0) {
        showToast('Informe um horímetro válido (numérico)!', 'danger');
        return;
      }

      if (hourmeter < currentEqHourmeter) {
        showToast(`Horímetro inconsistente! O horímetro informado (${hourmeter} h) não pode ser inferior ao já registrado no Engeman® (${currentEqHourmeter} h).`, 'danger');
        return;
      }

      InspectionEngine.startNewInspection(equipment, {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        registry: 'Inspetor Técnico Homologado',
        shift: inspectorShift,
        hourmeter: hourmeter
      });

      closeModal('modal-start-inspection');
      switchTab('inspecao');
      renderInspectionWizard();
      showToast(`Inspeção iniciada para ${equipment.tag} por ${firstName} ${lastName} (Tel: ${phone}).`, 'warning');
    });
  }

  const btnPrev = document.getElementById('btn-wizard-prev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (InspectionEngine.prevStep()) {
        renderInspectionWizard();
      }
    });
  }

  const btnNext = document.getElementById('btn-wizard-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const result = InspectionEngine.nextStep();
      if (!result.valid) {
        showToast(result.message, 'danger');
        return;
      }
      renderInspectionWizard();
    });
  }

  // Conclusão e Emissão
  const formFinish = document.getElementById('form-finish-inspection');
  if (formFinish) {
    formFinish.addEventListener('submit', (e) => {
      e.preventDefault();
      const opinionText = document.getElementById('tech-opinion-input').value.trim();
      
      // Validação de assinatura obrigatória
      if (!AppState.hasSignatureStroke) {
        showToast('Assinatura digital obrigatória! O inspetor deve assinar no quadro de assinatura antes de finalizar.', 'danger');
        const sigCanvas = document.getElementById('canvas-inspector-signature');
        if (sigCanvas) {
          sigCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
          sigCanvas.style.border = '2px solid #EF4444';
          setTimeout(() => { sigCanvas.style.border = '1px solid #CBD5E1'; }, 2500);
        }
        return;
      }

      let signatureData = null;
      if (AppState.signatureCanvas) {
        signatureData = AppState.signatureCanvas.toDataURL('image/png');
      }

      const currentInsp = InspectionEngine.currentInspection;
      const aiAppraisal = currentInsp?.aiExpertAppraisal || null;

      try {
        const completed = InspectionEngine.finishInspection(opinionText, signatureData, aiAppraisal);
        if (completed) {
          // Sincronização em nuvem resiliente com Appwrite Cloud (offline-first)
          appwriteClient.syncInspection(completed);

          refreshDashboard();
          refreshPCMView();
          refreshHistory();

          if (completed.finalStatus === 'liberado') {
            showToast('✓ Equipamento 100% Conforme! LIBERADO para operação!', 'success');
            openReportModal(completed);
          } else {
            showToast(`⛔ Equipamento REPROVADO e BLOQUEADO! S.S. ${completed.associatedServiceRequest} enviada ao PCM.`, 'danger');
            
            // Exibe o E-mail enviado ao PCM imediatamente
            const requests = Storage.getServiceRequests();
            const targetSS = requests.find(s => s.id === completed.associatedServiceRequest);
            if (targetSS) {
              appwriteClient.syncPCMRequest(targetSS);
              openPCMEmailModal(targetSS);
            } else {
              openReportModal(completed);
            }
          }
        }
      } catch (err) {
        showToast(err.message, 'danger');
        return;
      }
    });
  }
}

function renderInspectionWizard() {
  const currentInsp = InspectionEngine.currentInspection;
  const wizardContainer = document.getElementById('inspection-wizard-container');
  const emptyPrompt = document.getElementById('inspection-empty-prompt');

  if (!currentInsp) {
    wizardContainer.style.display = 'none';
    emptyPrompt.style.display = 'block';
    populateEquipmentSelectDropdown();
    return;
  }

  emptyPrompt.style.display = 'none';
  wizardContainer.style.display = 'block';

  document.getElementById('insp-display-tag').textContent = currentInsp.equipmentTag;
  document.getElementById('insp-display-name').textContent = currentInsp.equipmentName;
  document.getElementById('insp-display-norm').textContent = currentInsp.normativeRef;
  document.getElementById('insp-display-hourmeter').textContent = `${currentInsp.hourmeter} h`;

  const checklistConfig = CHECKLIST_NORMS[currentInsp.equipmentType];
  const stepIndex = currentInsp.currentStepIndex;
  const totalSections = checklistConfig.sections.length;
  const isFinalStep = stepIndex >= totalSections;

  renderStepperNav(checklistConfig, stepIndex, isFinalStep);

  const sectionContainer = document.getElementById('wizard-section-content');

  if (!isFinalStep) {
    const section = checklistConfig.sections[stepIndex];
    document.getElementById('wizard-section-title').textContent = section.title;
    document.getElementById('wizard-section-desc').textContent = section.description;

    renderChecklistItems(sectionContainer, section, currentInsp);

    document.getElementById('btn-wizard-prev').style.display = stepIndex > 0 ? 'inline-flex' : 'none';
    document.getElementById('btn-wizard-next').style.display = 'inline-flex';
    document.getElementById('btn-wizard-next').textContent = stepIndex === totalSections - 1 ? 'Revisar e Emitir Laudo ➔' : 'Avançar Etapa ➔';
    document.getElementById('wizard-finish-box').style.display = 'none';
  } else {
    renderFinalReviewStep(sectionContainer, currentInsp);

    document.getElementById('btn-wizard-prev').style.display = 'inline-flex';
    document.getElementById('btn-wizard-next').style.display = 'none';
    document.getElementById('wizard-finish-box').style.display = 'block';
  }

  updateLiveNCBadge(currentInsp);
}

function renderStepperNav(checklistConfig, activeIndex, isFinal) {
  const navContainer = document.getElementById('inspection-stepper-nav');
  const steps = [
    { label: 'Padrão Visual' },
    { label: 'Mecânica / Hidr.' },
    { label: 'Proteção / NR' },
    { label: 'Testes Operacionais' },
    { label: 'Laudo / Liberação' }
  ];

  const html = steps.map((s, idx) => {
    let statusClass = '';
    if (idx < activeIndex) statusClass = 'completed';
    else if (idx === activeIndex) statusClass = 'active';

    return `
      <div class="stepper-step ${statusClass}">
        <div class="step-circle">${idx < activeIndex ? '✓' : idx + 1}</div>
        <span class="step-label">${s.label}</span>
      </div>
    `;
  }).join('');

  navContainer.innerHTML = html;
}

function renderChecklistItems(container, section, currentInsp) {
  const html = `
    <div class="checklist-items-list">
      ${section.items.map(item => {
        const currentAns = currentInsp.answers[item.id] || {};
        const isOk = currentAns.status === 'conforme';
        const isNc = currentAns.status === 'nao_conforme';
        const cardClass = isOk ? 'answered-ok' : (isNc ? 'answered-nc' : '');

        return `
          <div class="checklist-item-card ${cardClass}" id="card-item-${item.id}">
            <div class="item-header">
              <div class="item-title-box">
                <span class="item-label">${item.label}</span>
                <div class="item-meta">
                  <span class="norm-pill">${item.norm}</span>
                  ${item.requiresPhoto ? '<span class="photo-required-pill">📷 Foto Obrigatória</span>' : ''}
                </div>
              </div>
            </div>

            <div class="item-hint">
              ℹ <strong>Critério Técnico:</strong> ${item.hint}
            </div>

            <div class="item-actions-row">
              <div class="status-toggle-group">
                <button type="button" class="btn-toggle-ok ${isOk ? 'selected' : ''}" data-item-id="${item.id}">
                  ✓ CONFORME
                </button>
                <button type="button" class="btn-toggle-nc ${isNc ? 'selected' : ''}" data-item-id="${item.id}">
                  ✖ NÃO CONFORME
                </button>
              </div>

              <div class="photo-controls-bar">
                <button type="button" class="btn btn-sm btn-secondary btn-open-camera" data-item-id="${item.id}" data-label="${item.label}">
                  📷 Câmera ao Vivo
                </button>
                <button type="button" class="btn btn-sm btn-secondary btn-simulate-photo" data-item-id="${item.id}" data-label="${item.photoLabel || item.label}">
                  ⚡ Simular Foto Técnica
                </button>
                <label class="btn btn-sm btn-secondary" style="margin-bottom:0; cursor:pointer;">
                  📁 Anexar
                  <input type="file" accept="image/*" class="file-upload-input" data-item-id="${item.id}" data-label="${item.label}" style="display:none;" />
                </label>
              </div>
            </div>

            <div id="photo-preview-wrap-${item.id}">
              ${currentAns.photo ? `
                <div class="photo-preview-box">
                  <img src="${currentAns.photo}" class="photo-thumb" alt="Evidência" />
                  <div class="photo-info">
                    <span class="photo-tag">✓ Evidência Fotográfica Anexada</span>
                    <span style="font-size:0.7rem; color:var(--text-muted);">${item.photoLabel || 'Foto registrada'}</span>
                  </div>
                  <button type="button" class="photo-remove-btn" data-item-id="${item.id}" title="Remover Foto">✕</button>
                </div>
                ${currentAns.aiAudit ? aiVisionInspector.renderAIBadge(currentAns.aiAudit) : ''}
              ` : ''}
            </div>

            <div class="nc-warning-box" id="nc-box-${item.id}" style="display: ${isNc ? 'block' : 'none'};">
              <div class="nc-box-header">
                <span>⛔ NÃO CONFORME - ENCAMINHAMENTO AO PCM:</span>
              </div>
              <textarea class="nc-textarea" data-item-id="${item.id}" placeholder="Descreva tecnicamente o defeito encontrado para a Solicitação de Serviço do PCM (obrigatório)...">${currentAns.observation || ''}</textarea>
              <div style="display:flex; justify-content:flex-end; margin-top:6px;">
                <button type="button" class="btn btn-sm btn-outline-warning btn-ai-diagnose" data-item-id="${item.id}" style="font-size:0.75rem;">
                  🤖 Diagnóstico IA Copilot (Código CMMS & Normas)
                </button>
              </div>
              <div class="ai-diag-output" id="ai-diag-output-${item.id}" style="display:none; margin-top:8px;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.btn-ai-diagnose').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      const txt = container.querySelector(`.nc-textarea[data-item-id="${itemId}"]`);
      const itemConfig = findItemConfig(section, itemId);
      const queryText = (txt?.value || '') + ' ' + (itemConfig.label || '');
      const diag = aiCopilot.diagnoseSymptom(queryText);

      const outBox = container.querySelector(`#ai-diag-output-${itemId}`);
      if (outBox) {
        outBox.style.display = 'block';
        outBox.innerHTML = `
          <div style="background:rgba(255, 242, 18, 0.08); border:1px solid var(--locar-yellow); border-radius:6px; padding:10px; font-size:0.78rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:var(--locar-yellow);">🤖 Locar AI Copilot - Diagnóstico:</strong>
              <span class="badge ${diag.riskLevel === 'CRÍTICO' ? 'badge-danger' : 'badge-warning'}">${diag.riskLevel}</span>
            </div>
            <div style="color:#FFFFFF; margin-bottom:4px;"><strong>Norma Afetada:</strong> ${diag.norm}</div>
            <div style="color:#D1D5DB; margin-bottom:4px;"><strong>Código CMMS Sugerido:</strong> <code>${diag.cmmsFaultCode}</code></div>
            <div style="color:#E2E8F0; margin-bottom:8px;">${diag.analysis}</div>
            <button type="button" class="btn btn-sm btn-primary btn-apply-ai-diag" data-item-id="${itemId}" style="padding:4px 10px; font-size:0.72rem;">
              Inserir Recomendação Técnica no Relato ➔
            </button>
          </div>
        `;

        outBox.querySelector('.btn-apply-ai-diag')?.addEventListener('click', () => {
          if (txt) {
            const prefix = txt.value.trim() ? txt.value.trim() + ' | ' : '';
            txt.value = `${prefix}[${diag.cmmsFaultCode} - ${diag.norm}] ${diag.recommendation}`;
            if (currentInsp.answers[itemId]) {
              currentInsp.answers[itemId].observation = txt.value;
            }
            showToast('Recomendação da IA inserida no relato!', 'success');
          }
        });
      }
    });
  });

  container.querySelectorAll('.btn-toggle-ok').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      const itemConfig = findItemConfig(section, itemId);
      const obs = '';
      const existingPhoto = currentInsp.answers[itemId]?.photo || null;
      const existingAudit = currentInsp.answers[itemId]?.aiAudit || null;

      InspectionEngine.setItemAnswer(itemId, 'conforme', obs, existingPhoto, {
        label: itemConfig.label,
        norm: itemConfig.norm,
        requiresPhoto: itemConfig.requiresPhoto,
        sectionId: section.id,
        sectionTitle: section.title,
        aiAudit: existingAudit
      });

      renderInspectionWizard();
    });
  });

  container.querySelectorAll('.btn-toggle-nc').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      const itemConfig = findItemConfig(section, itemId);
      const existingObs = currentInsp.answers[itemId]?.observation || '';
      const existingPhoto = currentInsp.answers[itemId]?.photo || null;
      const existingAudit = currentInsp.answers[itemId]?.aiAudit || null;

      InspectionEngine.setItemAnswer(itemId, 'nao_conforme', existingObs, existingPhoto, {
        label: itemConfig.label,
        norm: itemConfig.norm,
        requiresPhoto: itemConfig.requiresPhoto,
        sectionId: section.id,
        sectionTitle: section.title,
        aiAudit: existingAudit
      });

      renderInspectionWizard();
      const txt = document.querySelector(`.nc-textarea[data-item-id="${itemId}"]`);
      if (txt) txt.focus();
    });
  });

  container.querySelectorAll('.nc-textarea').forEach(txt => {
    txt.addEventListener('input', (e) => {
      const itemId = txt.getAttribute('data-item-id');
      if (currentInsp.answers[itemId]) {
        currentInsp.answers[itemId].observation = e.target.value;
      }
    });
  });

  container.querySelectorAll('.btn-open-camera').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      const label = btn.getAttribute('data-label');
      openCameraModal(itemId, label);
    });
  });

  container.querySelectorAll('.btn-simulate-photo').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = btn.getAttribute('data-item-id');
      const label = btn.getAttribute('data-label');
      const itemConfig = findItemConfig(section, itemId);
      const isNc = currentInsp.answers[itemId]?.status === 'nao_conforme';
      
      const photoData = CameraManager.generateSimulatedInspectionPhoto(
        currentInsp.equipmentTag,
        label,
        isNc ? 'nao_conforme' : 'conforme',
        isNc ? 'Avaria/Inconformidade encaminhada ao PCM' : 'Item verificado conforme padrão Locar'
      );

      showToast('Auditoria Visual da IA em andamento...', 'info');
      const audit = await aiVisionInspector.auditPhoto(photoData, { category: section.id, itemTitle: label });

      InspectionEngine.setItemAnswer(
        itemId,
        currentInsp.answers[itemId]?.status || 'conforme',
        currentInsp.answers[itemId]?.observation || '',
        photoData,
        {
          label: itemConfig.label,
          norm: itemConfig.norm,
          requiresPhoto: itemConfig.requiresPhoto,
          sectionId: section.id,
          sectionTitle: section.title,
          aiAudit: audit
        }
      );

      renderInspectionWizard();
      showToast('Evidência técnica gerada e auditada por IA!', 'success');
    });
  });

  container.querySelectorAll('.file-upload-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const itemId = input.getAttribute('data-item-id');
      const label = input.getAttribute('data-label');
      const itemConfig = findItemConfig(section, itemId);

      try {
        const photoData = await CameraManager.processUploadedFile(file, currentInsp.equipmentTag, label);
        showToast('Auditoria Visual da IA em processamento...', 'info');
        const audit = await aiVisionInspector.auditPhoto(photoData, { category: section.id, itemTitle: label });

        InspectionEngine.setItemAnswer(
          itemId,
          currentInsp.answers[itemId]?.status || 'conforme',
          currentInsp.answers[itemId]?.observation || '',
          photoData,
          {
            label: itemConfig.label,
            norm: itemConfig.norm,
            requiresPhoto: itemConfig.requiresPhoto,
            sectionId: section.id,
            sectionTitle: section.title,
            aiAudit: audit
          }
        );
        renderInspectionWizard();
        showToast('Foto anexada e auditada pela IA com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao processar imagem: ' + err.message, 'danger');
      }
    });
  });

  container.querySelectorAll('.photo-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      if (currentInsp.answers[itemId]) {
        currentInsp.answers[itemId].photo = null;
        renderInspectionWizard();
        showToast('Foto removida.', 'info');
      }
    });
  });
}

function findItemConfig(section, itemId) {
  return section.items.find(i => i.id === itemId) || { label: 'Item', norm: 'Norma' };
}

function renderFinalReviewStep(container, currentInsp) {
  InspectionEngine.recalculateInspectionStatus();
  const totalNC = currentInsp.totalNonConformities;
  const isApproved = totalNC === 0;

  const aiAppraisal = aiCopilot.generateExpertAppraisal({
    equipment: {
      fleetNumber: currentInsp.equipmentTag,
      model: currentInsp.equipmentName,
      category: currentInsp.equipmentType
    },
    inspector: {
      firstName: currentInsp.inspectorFirstName,
      lastName: currentInsp.inspectorLastName,
      phone: currentInsp.inspectorPhone
    },
    passed: isApproved,
    nonConformities: Object.values(currentInsp.answers).filter(a => a.status === 'nao_conforme').map(n => ({
      code: n.norm,
      title: n.label,
      notes: n.observation
    })),
    totalItems: Object.keys(currentInsp.answers).length,
    passedItems: Object.values(currentInsp.answers).filter(a => a.status === 'conforme').length
  });
  currentInsp.aiExpertAppraisal = aiAppraisal;

  const html = `
    <div class="final-review-panel">
      ${isApproved ? `
        <div class="verdict-banner-approved">
          <div class="verdict-icon">✓</div>
          <div class="verdict-info">
            <h2 style="color:var(--status-liberado);">EQUIPAMENTO 100% CONFORME - APTO PARA OPERAÇÃO</h2>
            <p>Todas as inspeções visuais, estruturais, itens de segurança e testes de funcionamento de todas as operações foram aprovados sem restrições. O equipamento será marcado como <strong>DISPONÍVEL</strong> na frota da Locar.</p>
          </div>
        </div>
      ` : `
        <div class="verdict-banner-rejected">
          <div class="verdict-icon">⛔</div>
          <div class="verdict-info">
            <h2 style="color:var(--status-bloqueado);">EQUIPAMENTO REPROVADO - BLOQUEADO PARA OPERAÇÃO</h2>
            <p><strong>REGRA DE TOLERÂNCIA ZERO:</strong> Foram detectadas <strong>${totalNC} Não Conformidade(s)</strong>. Uma <strong>Solicitação de Serviço (S.S.) será encaminhada imediatamente ao PCM com envio de e-mail formal</strong> e o equipamento permanecerá retido no pátio.</p>
          </div>
        </div>
      `}

      ${totalNC > 0 ? `
        <div class="os-nc-list" style="background:var(--locar-chumbo-card); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--status-bloqueado-border); margin-bottom:1.5rem;">
          <h4 style="color:var(--status-bloqueado); margin-bottom:0.75rem;">Itens que constarão na Solicitação de Serviço ao PCM:</h4>
          <ul>
            ${Object.values(currentInsp.answers).filter(a => a.status === 'nao_conforme').map(nc => `
              <li>
                <strong>[${nc.norm}]:</strong> ${nc.label} - 
                <span class="nc-note">${nc.observation || 'Não especificado'}</span>
                ${nc.photo ? '<span style="color:var(--locar-yellow); font-size:0.75rem;">(📷 Evidência auditada por IA)</span>' : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- PARECER PERICIAL AUTOMÁTICO DE IA -->
      <div class="ai-appraisal-box" style="background:#1E232B; border:1px solid #474444; border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span style="font-weight:700; color:#FFF212; font-size:0.85rem;">
            🤖 Parecer Pericial de Engenharia (Locar AI Copilot)
          </span>
          <span style="background:#474444; color:#FFF212; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-family:monospace;">
            ANÁLISE NORMATIVA AUTOMATIZADA
          </span>
        </div>
        <pre style="white-space:pre-wrap; font-family:inherit; font-size:0.8rem; color:#E2E8F0; margin:0; line-height:1.4;">${aiAppraisal}</pre>
      </div>

      <div style="margin-bottom:1.5rem;">
        <label style="font-weight:700; font-size:0.9rem; margin-bottom:0.5rem; display:block;">
          Parecer Técnico Conclusivo do Inspetor:
        </label>
        <textarea id="tech-opinion-input" class="nc-textarea" style="border-color:var(--locar-chumbo-border); min-height:80px;" placeholder="Insira considerações complementares da vistoria (opcional)...">${isApproved ? 'Equipamento inspecionado e testado em sua plenitude operacional, atendendo a todos os requisitos normativos e padrões de segurança e apresentação visual da Locar Guindastes.' : 'Equipamento retido por não conformidade impeditiva. Solicitação de Serviço com e-mail formal despachada ao PCM para abertura de cronograma de reparo.'}</textarea>
      </div>

      <div class="signature-capture-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <label style="font-weight:700; font-size:0.85rem; color:#FFFFFF;">
            Assinatura Digital do Inspetor (${currentInsp.inspectorName}):
          </label>
          <button type="button" class="btn btn-sm btn-secondary" id="btn-clear-signature">Limpar Assinatura</button>
        </div>
        <canvas id="canvas-inspector-signature" class="signature-canvas" width="480" height="120"></canvas>
        <p style="font-size:0.72rem; color:var(--text-muted); margin-top:0.35rem;">
          Assine com o mouse ou toque na tela para validar a responsabilidade técnica da inspeção.
        </p>
      </div>
    </div>
  `;

  container.innerHTML = html;
  initSignaturePad();
}

function initSignaturePad() {
  const canvas = document.getElementById('canvas-inspector-signature');
  if (!canvas) return;

  AppState.hasSignatureStroke = false;
  AppState.signatureCanvas = canvas;
  const ctx = canvas.getContext('2d');
  AppState.signatureCtx = ctx;

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(e) {
    AppState.isDrawingSignature = true;
    AppState.hasSignatureStroke = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  }

  function draw(e) {
    if (!AppState.isDrawingSignature) return;
    AppState.hasSignatureStroke = true;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  }

  function stopDraw() {
    AppState.isDrawingSignature = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', stopDraw);

  const btnClear = document.getElementById('btn-clear-signature');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      AppState.hasSignatureStroke = false;
    });
  }
}

function updateLiveNCBadge(currentInsp) {
  const badge = document.getElementById('live-nc-pill');
  if (!badge) return;

  const count = currentInsp.totalNonConformities || 0;
  if (count === 0) {
    badge.className = 'nc-count-pill nc-count-zero';
    badge.textContent = '✓ 0 Não Conformidades';
  } else {
    badge.className = 'nc-count-pill nc-count-alert';
    badge.textContent = `⛔ ${count} Não Conformidade(s) - DISPARO AO PCM`;
  }
}

function populateEquipmentSelectDropdown() {
  const select = document.getElementById('select-equipment-prompt');
  if (!select) return;

  const fleet = Storage.getFleet();
  select.innerHTML = '<option value="">-- Selecione o Equipamento da Frota --</option>' + 
    fleet.map(eq => `
      <option value="${eq.id}">[${eq.tag}] ${eq.brand} ${eq.model} - ${eq.typeName} (${eq.status.toUpperCase()})</option>
    `).join('');

  const btnStartFromPrompt = document.getElementById('btn-start-from-prompt');
  if (btnStartFromPrompt) {
    btnStartFromPrompt.onclick = () => {
      const eqId = select.value;
      if (eqId) {
        promptStartInspection(eqId);
      } else {
        showToast('Selecione um equipamento da lista!', 'warning');
      }
    };
  }
}

// --- ABA 3: SOLICITAÇÕES DE SERVIÇO (PCM) ---
function initPCMServiceRequestsView() {
  const ssContainer = document.getElementById('ss-list-container');
  if (ssContainer) {
    ssContainer.addEventListener('click', (e) => {
      // Avançar fluxo de trabalho da SS do PCM
      const btnAdvance = e.target.closest('.btn-advance-ss');
      if (btnAdvance) {
        const ssId = btnAdvance.getAttribute('data-id');
        const currentStatus = btnAdvance.getAttribute('data-current');
        
        let nextStatus = 'em_planejamento';
        let defaultNote = 'PCM incluiu a solicitação na programação de serviços.';
        if (currentStatus === 'aberta') {
          nextStatus = 'em_planejamento';
          defaultNote = 'PCM iniciou planejamento de materiais e equipe técnica.';
        } else if (currentStatus === 'em_planejamento') {
          nextStatus = 'em_execucao';
          defaultNote = 'Equipamento em execução na oficina da Locar.';
        } else {
          nextStatus = 'concluida';
          defaultNote = 'Reparos concluídos pela oficina. Equipamento liberado para reinspeção.';
        }

        const note = prompt('Informe a nota de acompanhamento do PCM:', defaultNote) || defaultNote;
        Storage.updateServiceRequestStatus(ssId, nextStatus, note);
        refreshPCMView();
        refreshDashboard();
        showToast(`Solicitação ${ssId} atualizada para "${nextStatus.toUpperCase()}".`, 'success');
        return;
      }

      // Reinspecionar equipamento
      const btnReinspect = e.target.closest('.btn-reinspect');
      if (btnReinspect) {
        const tag = btnReinspect.getAttribute('data-tag');
        promptStartInspection(tag);
        return;
      }

      // Visualizar E-mail do PCM
      const btnViewEmail = e.target.closest('.btn-view-pcm-email');
      if (btnViewEmail) {
        const ssId = btnViewEmail.getAttribute('data-id');
        const requests = Storage.getServiceRequests();
        const targetSS = requests.find(s => s.id === ssId);
        if (targetSS) {
          openPCMEmailModal(targetSS);
        }
        return;
      }

      // Ver foto de evidência da SS
      const btnPhoto = e.target.closest('.btn-view-evidence');
      if (btnPhoto) {
        const photoSrc = btnPhoto.getAttribute('data-photo');
        openImagePreviewModal(photoSrc);
      }
    });
  }

  // Filtros de SS
  const filterBtns = document.querySelectorAll('.filter-ss-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.getAttribute('data-status');
      PCMServiceRequests.renderServiceRequestsList(ssContainer, status);
    });
  });
}

function refreshPCMView() {
  const ssContainer = document.getElementById('ss-list-container');
  PCMServiceRequests.renderServiceRequestsList(ssContainer);
  updateNavCounters();
}

// --- ABA 4: HISTÓRICO DE LAUDOS PERICIAIS ---
function initHistoryView() {
  const historyContainer = document.getElementById('history-table-body');
  if (historyContainer) {
    historyContainer.addEventListener('click', (e) => {
      const btnView = e.target.closest('.btn-view-report');
      if (btnView) {
        const inspId = btnView.getAttribute('data-id');
        const inspection = Storage.getInspectionById(inspId);
        if (inspection) {
          openReportModal(inspection);
        }
      }
    });
  }
}

function refreshHistory() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  const inspections = Storage.getInspections();
  if (inspections.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
          Nenhum laudo técnico pericial emitido até o momento.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = inspections.map(insp => {
    const isApproved = insp.finalStatus === 'liberado';
    return `
      <tr>
        <td><strong>${insp.id}</strong></td>
        <td><span class="tag-title" style="font-size:0.85rem;">${insp.equipmentTag}</span></td>
        <td>${insp.equipmentName}</td>
        <td>${insp.formattedDate} às ${insp.formattedTime}</td>
        <td>${insp.inspectorName}</td>
        <td>
          <span class="badge ${isApproved ? 'badge-success' : 'badge-danger'}">
            ${isApproved ? '✓ LIBERADO' : '⛔ BLOQUEADO'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary btn-view-report" data-id="${insp.id}">
            📄 Ver Laudo
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// --- ABA 5: CADASTRO DE NOVO EQUIPAMENTO ---
function initNewEquipmentForm() {
  const form = document.getElementById('form-add-equipment');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const tag = document.getElementById('new-eq-tag').value.trim().toUpperCase();
      const type = document.getElementById('new-eq-type').value;
      const brand = document.getElementById('new-eq-brand').value.trim();
      const model = document.getElementById('new-eq-model').value.trim();
      const year = Number(document.getElementById('new-eq-year').value);
      const serial = document.getElementById('new-eq-serial').value.trim();
      const capacity = document.getElementById('new-eq-capacity').value.trim();
      const branch = document.getElementById('new-eq-branch').value.trim();

      const typeNames = {
        pta: 'Plataforma de Trabalho Aéreo',
        guindaste: 'Guindaste Industrial',
        empilhadeira: 'Empilhadeira Operacional'
      };

      const newEq = {
        id: tag,
        tag: tag,
        type: type,
        typeName: typeNames[type] || 'Equipamento',
        brand: brand,
        model: model,
        year: year,
        serialNumber: serial,
        capacity: capacity,
        hourmeter: 0,
        branch: branch,
        status: 'bloqueado',
        lastInspectionDate: null,
        notes: 'Equipamento novo cadastrado. Aguardando 1ª inspeção técnica obrigatória para liberação de frota.'
      };

      Storage.addEquipment(newEq);
      form.reset();
      refreshDashboard();
      switchTab('dashboard');
      showToast(`Equipamento ${tag} cadastrado com sucesso! Status inicial: BLOQUEADO (Aguardando Inspeção).`, 'warning');
    });
  }
}

// --- CONFIGURAÇÕES DO PCM ---
function initPCMSettings() {
  const btnOpen = document.getElementById('btn-open-pcm-settings');
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      const config = Storage.getPCMConfig();
      document.getElementById('input-pcm-email').value = config.pcmEmail || 'pcm@locar.com.br';
      document.getElementById('input-pcm-manager').value = config.pcmManagerName || 'Engenharia de Manutenção & PCM Locar';
      document.getElementById('check-auto-send-email').checked = config.autoSendEmail !== false;
      openModal('modal-pcm-settings');
    });
  }

  const formSettings = document.getElementById('form-pcm-settings');
  if (formSettings) {
    formSettings.addEventListener('submit', (e) => {
      e.preventDefault();
      const newConfig = {
        pcmEmail: document.getElementById('input-pcm-email').value.trim(),
        pcmManagerName: document.getElementById('input-pcm-manager').value.trim(),
        autoSendEmail: document.getElementById('check-auto-send-email').checked
      };
      Storage.savePCMConfig(newConfig);
      closeModal('modal-pcm-settings');
      showToast('Configurações do PCM salvas com sucesso!', 'success');
    });
  }
}

// --- MODAIS DO SISTEMA ---
function initModals() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.btn-close-modal')) {
        closeModal(modal.id);
        if (modal.id === 'modal-camera-capture') {
          CameraManager.stopLiveCamera();
        }
      }
    });
  });

  const btnCaptureLive = document.getElementById('btn-capture-live-frame');
  if (btnCaptureLive) {
    btnCaptureLive.addEventListener('click', () => {
      const videoEl = document.getElementById('camera-video-stream');
      const targetItemId = AppState.activeCameraTargetItemId;
      const targetLabel = AppState.activeCameraItemLabel;
      const currentInsp = InspectionEngine.currentInspection;

      if (videoEl && targetItemId && currentInsp) {
        const photoData = CameraManager.captureFromVideo(videoEl, currentInsp.equipmentTag, targetLabel);
        CameraManager.stopLiveCamera();
        closeModal('modal-camera-capture');

        const section = InspectionEngine.getCurrentSection();
        const itemConfig = findItemConfig(section, targetItemId);

        showToast('Auditoria Visual da IA em processamento...', 'info');
        aiVisionInspector.auditPhoto(photoData, { category: section?.id, itemTitle: targetLabel }).then(audit => {
          InspectionEngine.setItemAnswer(
            targetItemId,
            currentInsp.answers[targetItemId]?.status || 'conforme',
            currentInsp.answers[targetItemId]?.observation || '',
            photoData,
            {
              label: itemConfig.label,
              norm: itemConfig.norm,
              requiresPhoto: itemConfig.requiresPhoto,
              sectionId: section?.id,
              sectionTitle: section?.title,
              aiAudit: audit
            }
          );

          renderInspectionWizard();
          showToast('Foto capturada da câmera e auditada por IA com sucesso!', 'success');
        });
      }
    });
  }

  const btnPrintReport = document.getElementById('btn-print-report');
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
      window.print();
    });
  }

  // Botão Copiar Texto do E-mail do PCM
  const btnCopyEmail = document.getElementById('btn-copy-pcm-email-text');
  if (btnCopyEmail) {
    btnCopyEmail.addEventListener('click', () => {
      if (AppState.lastGeneratedEmailText) {
        navigator.clipboard.writeText(AppState.lastGeneratedEmailText).then(() => {
          showToast('Texto do e-mail do PCM copiado para a área de transferência!', 'success');
        }).catch(() => {
          showToast('Erro ao copiar texto.', 'danger');
        });
      }
    });
  }
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

async function openCameraModal(itemId, label) {
  AppState.activeCameraTargetItemId = itemId;
  AppState.activeCameraItemLabel = label;

  openModal('modal-camera-capture');
  document.getElementById('camera-modal-item-title').textContent = label;

  const videoEl = document.getElementById('camera-video-stream');
  const opened = await CameraManager.openLiveCamera(videoEl);

  if (!opened) {
    showToast('Câmera física não disponível no navegador. Use o botão "Simular Foto Técnica" ou "Anexar".', 'warning');
  }
}

export function openReportModal(inspection) {
  const container = document.getElementById('report-modal-content');
  if (!container) return;

  container.innerHTML = ReportGenerator.generateReportHTML(inspection);

  const qrBox = container.querySelector('#report-qr-code-box');
  if (qrBox) {
    ReportGenerator.renderQRCodeCanvas(qrBox, inspection.id, inspection.finalStatus === 'liberado');
  }

  openModal('modal-view-report');
}

// Abre o Modal com o E-mail Padrão do PCM
export function openPCMEmailModal(serviceRequest) {
  const emailData = PCMServiceRequests.generatePCMEmail(serviceRequest);
  AppState.lastGeneratedEmailText = emailData.textBody;

  document.getElementById('pcm-modal-email-target').textContent = `Destinatário Oficial: ${emailData.recipient}`;
  document.getElementById('pcm-email-preview-container').innerHTML = emailData.htmlBody;
  
  const btnMailto = document.getElementById('btn-open-mailto-client');
  if (btnMailto) {
    btnMailto.href = emailData.mailtoUrl;
  }

  const btnWhatsApp = document.getElementById('btn-open-whatsapp-pcm');
  if (btnWhatsApp) {
    btnWhatsApp.href = PCMServiceRequests.generateWhatsAppLink(serviceRequest);
  }

  openModal('modal-pcm-email');
}

function openImagePreviewModal(imgSrc) {
  const previewImg = document.getElementById('full-preview-image');
  if (previewImg) {
    previewImg.src = imgSrc;
    openModal('modal-preview-photo');
  }
}

function openEquipmentHistoryModal(equipmentId) {
  const equipment = Storage.getEquipmentById(equipmentId);
  const inspections = Storage.getInspections().filter(i => i.equipmentId === equipmentId);

  const container = document.getElementById('eq-history-modal-content');
  if (!container) return;

  document.getElementById('eq-history-title').textContent = `Histórico de Vistorias: ${equipment.tag} - ${equipment.brand} ${equipment.model}`;

  if (inspections.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <p>Nenhuma inspeção registrada para este equipamento ainda.</p>
      </div>
    `;
  } else {
    container.innerHTML = inspections.map(i => `
      <div style="background:var(--locar-chumbo-surface); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--locar-chumbo-border); margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:var(--locar-yellow);">${i.id}</strong> - ${i.formattedDate} às ${i.formattedTime}<br/>
          <span style="font-size:0.8rem; color:var(--text-muted);">Inspetor: ${i.inspectorName} | Contato: ${i.inspectorPhone || 'Registrado'}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="badge ${i.finalStatus === 'liberado' ? 'badge-success' : 'badge-danger'}">
            ${i.finalStatus === 'liberado' ? '✓ LIBERADO' : '⛔ REPROVADO'}
          </span>
          <button class="btn btn-sm btn-secondary btn-view-report" data-id="${i.id}">Laudo</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const insp = Storage.getInspectionById(id);
        openReportModal(insp);
      });
    });
  }

  openModal('modal-equipment-history');
}

function showToast(message, type = 'info') {
  let toastEl = document.getElementById('app-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'app-toast';
    toastEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
      transform: translateY(100px);
      opacity: 0;
      max-width: 420px;
    `;
    document.body.appendChild(toastEl);
  }

  const colors = {
    success: { bg: '#10B981', color: '#FFFFFF' },
    danger: { bg: '#EF4444', color: '#FFFFFF' },
    warning: { bg: '#F59E0B', color: '#101318' },
    info: { bg: '#202632', color: '#FFFFFF' }
  }[type] || { bg: '#202632', color: '#FFFFFF' };

  toastEl.style.backgroundColor = colors.bg;
  toastEl.style.color = colors.color;
  toastEl.innerHTML = message;
  toastEl.style.transform = 'translateY(0)';
  toastEl.style.opacity = '1';

  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.style.transform = 'translateY(100px)';
    toastEl.style.opacity = '0';
  }, 4500);
}
