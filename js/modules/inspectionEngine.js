/**
 * Motor de Inspeção e Validação Estrita Normativa
 * Aplica a regra de Tolerância Zero para Não Conformidades,
 * Bloqueio Automático, Gestão de Evidências, Geração de S.S. para o PCM e E-mail Automático
 */

import { CHECKLIST_NORMS } from '../data/checklistNorms.js';
import { Storage } from '../storage.js';

export const InspectionEngine = {
  currentInspection: null,

  /**
   * Inicia uma nova sessão de inspeção para um equipamento
   */
  startNewInspection(equipment, inspectorData = {}) {
    const checklistConfig = CHECKLIST_NORMS[equipment.type];
    if (!checklistConfig) {
      throw new Error(`Tipo de equipamento não suportado: ${equipment.type}`);
    }

    const now = new Date();
    const inspectionId = `INSP-LOC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    this.currentInspection = {
      id: inspectionId,
      equipmentId: equipment.id,
      equipmentTag: equipment.tag,
      equipmentName: `${equipment.brand} ${equipment.model}`,
      equipmentType: equipment.type,
      equipmentTypeName: checklistConfig.name,
      equipmentDetails: { ...equipment },
      normativeRef: checklistConfig.normativeRef,
      startedAt: now.toISOString(),
      formattedDate: now.toLocaleDateString('pt-BR'),
      formattedTime: now.toLocaleTimeString('pt-BR'),
      inspectorFirstName: inspectorData.firstName || '',
      inspectorLastName: inspectorData.lastName || '',
      inspectorFullName: `${inspectorData.firstName || ''} ${inspectorData.lastName || ''}`.trim(),
      inspectorPhone: inspectorData.phone || '',
      inspectorName: `${inspectorData.firstName || ''} ${inspectorData.lastName || ''}`.trim(),
      inspectorReg: inspectorData.registry || '',
      inspectorShift: inspectorData.shift || 'Turno Diurno',
      hourmeter: inspectorData.hourmeter || equipment.hourmeter || 0,
      currentStepIndex: 0,
      totalSteps: checklistConfig.sections.length + 1, // Seções + Resumo/Assinatura
      answers: {},
      visualDefectsDetected: false,
      functionalFailuresDetected: false,
      totalNonConformities: 0,
      finalStatus: null, // 'liberado' | 'reprovado_bloqueado'
      technicalOpinion: '',
      inspectorSignature: null,
      associatedServiceRequest: null
    };

    return this.currentInspection;
  },

  getCurrentSection() {
    if (!this.currentInspection) return null;
    const checklistConfig = CHECKLIST_NORMS[this.currentInspection.equipmentType];
    const index = this.currentInspection.currentStepIndex;
    if (index < checklistConfig.sections.length) {
      return checklistConfig.sections[index];
    }
    return null;
  },

  setItemAnswer(itemId, status, observation = '', photo = null, itemMeta = {}) {
    if (!this.currentInspection) return;

    const existingAns = this.currentInspection.answers[itemId] || {};

    this.currentInspection.answers[itemId] = {
      status,
      observation,
      photo,
      label: itemMeta.label || existingAns.label || '',
      norm: itemMeta.norm || existingAns.norm || '',
      requiresPhoto: itemMeta.requiresPhoto !== undefined ? itemMeta.requiresPhoto : existingAns.requiresPhoto || false,
      sectionId: itemMeta.sectionId || existingAns.sectionId || '',
      sectionTitle: itemMeta.sectionTitle || existingAns.sectionTitle || '',
      aiAudit: itemMeta.aiAudit !== undefined ? itemMeta.aiAudit : existingAns.aiAudit || null,
      updatedAt: new Date().toISOString()
    };

    this.recalculateInspectionStatus();
  },

  recalculateInspectionStatus() {
    if (!this.currentInspection) return;

    let ncCount = 0;
    let visualDefects = false;
    let functionalFailures = false;

    Object.entries(this.currentInspection.answers).forEach(([itemId, data]) => {
      if (data.status === 'nao_conforme') {
        ncCount++;
        if (data.sectionId === 'visual_identity' || itemId.includes('_vis_')) {
          visualDefects = true;
        }
        if (data.sectionId === 'functional_tests' || itemId.includes('_tst_')) {
          functionalFailures = true;
        }
      }
    });

    this.currentInspection.totalNonConformities = ncCount;
    this.currentInspection.visualDefectsDetected = visualDefects;
    this.currentInspection.functionalFailuresDetected = functionalFailures;
  },

  validateCurrentSection() {
    const section = this.getCurrentSection();
    if (!section) return { valid: true };

    for (const item of section.items) {
      const ans = this.currentInspection.answers[item.id];
      if (!ans || !ans.status) {
        return {
          valid: false,
          message: `O item obrigatório "${item.label.substring(0, 45)}..." ainda não foi inspecionado.`
        };
      }

      if (ans.status === 'nao_conforme' && (!ans.observation || ans.observation.trim().length < 5)) {
        return {
          valid: false,
          message: `Justificativa técnica obrigatória para o item não conforme: "${item.label.substring(0, 40)}...". Descreva o defeito encontrado para a Solicitação do PCM.`
        };
      }

      if (item.requiresPhoto && !ans.photo) {
        return {
          valid: false,
          message: `Evidência fotográfica obrigatória exigida para: "${item.photoLabel || item.label}". Tire uma foto ou anexe o registro.`
        };
      }

      if (ans.status === 'nao_conforme' && !ans.photo) {
        return {
          valid: false,
          message: `Aviso de auditoria: É obrigatório fotografar a não-conformidade em "${item.label.substring(0, 40)}..." para evidência pericial ao PCM.`
        };
      }
    }

    return { valid: true };
  },

  nextStep() {
    const validation = this.validateCurrentSection();
    if (!validation.valid) {
      return validation;
    }

    if (this.currentInspection.currentStepIndex < this.currentInspection.totalSteps - 1) {
      this.currentInspection.currentStepIndex++;
      return { valid: true, completed: false };
    }

    return { valid: true, completed: true };
  },

  prevStep() {
    if (this.currentInspection && this.currentInspection.currentStepIndex > 0) {
      this.currentInspection.currentStepIndex--;
      return true;
    }
    return false;
  },

  /**
   * Finaliza a inspeção:
   * - Se houver QUALQUER não conformidade: Bloqueia a máquina, envia para manutenção,
   *   gera SOLICITAÇÃO DE SERVIÇO (S.S.) PARA O PCM e dispara o e-mail padrão.
   * - Se 100% conforme: Libera para a frota operacional.
   */
  finishInspection(technicalOpinion = '', signature = null, aiExpertAppraisal = null) {
    if (!this.currentInspection) return null;

    this.recalculateInspectionStatus();
    this.currentInspection.finishedAt = new Date().toISOString();
    this.currentInspection.technicalOpinion = technicalOpinion;
    this.currentInspection.inspectorSignature = signature;
    if (aiExpertAppraisal) {
      this.currentInspection.aiExpertAppraisal = aiExpertAppraisal;
    }

    const hasNC = this.currentInspection.totalNonConformities > 0;

    if (hasNC) {
      // REPROVADO E BLOQUEADO
      this.currentInspection.finalStatus = 'reprovado_bloqueado';
      this.currentInspection.verdict = 'BLOQUEADO PARA OPERAÇÃO - SOLICITAÇÃO ENVIADA AO PCM';

      let reason = 'Não conformidades impeditivas detectadas.';
      if (this.currentInspection.visualDefectsDetected && this.currentInspection.functionalFailuresDetected) {
        reason = 'Reprovado por avarias visuais/padrão Locar e falhas em testes funcionais das operações.';
      } else if (this.currentInspection.visualDefectsDetected) {
        reason = 'Reprovado por inconformidade com o padrão visual/identidade da Locar Guindastes ou lataria danificada.';
      } else if (this.currentInspection.functionalFailuresDetected) {
        reason = 'Reprovado por falha operacional nos testes de funcionamento dos comandos de segurança.';
      }
      this.currentInspection.blockReason = reason;

      // Gera SOLICITAÇÃO DE SERVIÇO (S.S.) PARA O PCM
      const createdSS = Storage.createServiceRequestFromInspection(this.currentInspection);
      this.currentInspection.associatedServiceRequest = createdSS.id;

      // Atualiza frota para MANUTENÇÃO
      Storage.updateEquipmentStatus(
        this.currentInspection.equipmentId,
        'manutencao',
        this.currentInspection.formattedDate,
        `${this.currentInspection.inspectorName} (${this.currentInspection.inspectorReg})`,
        `RETIDO EM MANUTENÇÃO: ${createdSS.id} enviada ao PCM (${createdSS.pcmRecipient}). ${reason}`
      );

    } else {
      // 100% APROVADO E LIBERADO
      this.currentInspection.finalStatus = 'liberado';
      this.currentInspection.verdict = 'EQUIPAMENTO 100% CONFORME - LIBERADO PARA OPERAÇÃO / LOCAÇÃO';
      this.currentInspection.blockReason = null;
      this.currentInspection.associatedServiceRequest = null;

      // Atualiza frota para DISPONÍVEL
      Storage.updateEquipmentStatus(
        this.currentInspection.equipmentId,
        'disponivel',
        this.currentInspection.formattedDate,
        `${this.currentInspection.inspectorName} (${this.currentInspection.inspectorReg})`,
        'Inspecionado e aprovado com 100% de conformidade visual, mecânica e testes funcionais.'
      );
    }

    // Persiste inspeção no histórico permanente
    Storage.saveInspection(this.currentInspection);

    return this.currentInspection;
  }
};
