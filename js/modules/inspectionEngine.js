/**
 * Motor de Inspeção e Validação Estrita Normativa
 * Aplica a regra de Tolerância Zero para Não Conformidades,
 * Bloqueio Automático, Gestão de Evidências, Geração de S.S. para o PCM e E-mail Automático
 */

import { CHECKLIST_NORMS } from '../data/checklistNorms.js';
import { Storage } from '../storage.js';
import { generateAuditHash } from '../utils.js';
import { authManager } from './auth.js';

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
   * Valida se todos os itens de todas as seções foram inspecionados
   */
  getChecklistCompletionStatus() {
    if (!this.currentInspection) return { complete: false, total: 0, answered: 0, pending: 0 };
    const checklistConfig = CHECKLIST_NORMS[this.currentInspection.equipmentType];
    if (!checklistConfig) return { complete: false, total: 0, answered: 0, pending: 0 };

    let total = 0;
    const missingItems = [];

    checklistConfig.sections.forEach(sec => {
      sec.items.forEach(item => {
        total++;
        const ans = this.currentInspection.answers[item.id];
        if (!ans || !ans.status) {
          missingItems.push({ id: item.id, label: item.label, section: sec.title });
        }
      });
    });

    const answered = total - missingItems.length;
    return {
      complete: missingItems.length === 0,
      total,
      answered,
      pending: missingItems.length,
      missingItems
    };
  },

  /**
   * Finaliza a inspeção com validação estrita anti-liberação indevida:
   * - Exige que 100% dos itens normativos tenham sido respondidos.
   * - Exige assinatura digital válida do inspetor.
   * - Gera Hash Criptográfico SHA-256 para validade jurídica e forense.
   * - Se houver QUALQUER não conformidade: Bloqueia a máquina, retém em MANUTENÇÃO
   *   e gera Solicitação de Serviço ao PCM.
   * - Se 100% conforme: Libera para DISPONÍVEL e encerra S.S. anterior se houver.
   */
  async finishInspection(technicalOpinion = '', signature = null, aiExpertAppraisal = null) {
    if (!this.currentInspection) {
      throw new Error('Nenhuma inspeção ativa para ser finalizada.');
    }

    // 1. Validação estrita: 100% dos itens devem estar inspecionados
    const completion = this.getChecklistCompletionStatus();
    if (!completion.complete) {
      throw new Error(`Inspeção incompleta! Existem ${completion.pending} item(ns) normativo(s) obrigatório(s) sem resposta. Todos os itens de todas as seções devem ser verificados antes da liberação.`);
    }

    // 2. Validação estrita: Assinatura obrigatória do inspetor
    if (!signature || typeof signature !== 'string' || signature.length < 100) {
      throw new Error('Assinatura digital do inspetor é obrigatória para emissão do laudo técnico pericial.');
    }

    this.recalculateInspectionStatus();
    this.currentInspection.finishedAt = new Date().toISOString();
    this.currentInspection.technicalOpinion = technicalOpinion || 'Inspeção técnica normativa realizada.';
    this.currentInspection.inspectorSignature = signature;
    if (aiExpertAppraisal) {
      this.currentInspection.aiExpertAppraisal = aiExpertAppraisal;
    }

    const hasNC = this.currentInspection.totalNonConformities > 0;

    if (hasNC) {
      // REPROVADO E BLOQUEADO - TOLERÂNCIA ZERO
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

      // Atualiza frota para MANUTENÇÃO (Tolerância Zero)
      const eqBeforeNC = Storage.getEquipmentById(this.currentInspection.equipmentId);
      let alertReserved = '';
      if (eqBeforeNC && eqBeforeNC.status === 'reservada') {
        const clientName = eqBeforeNC.reservation?.clientName || 'Cliente';
        alertReserved = ` [ALERTA COMERCIAL: Equipamento reservado para "${clientName}" retido em manutenção! Notificar Comercial Betim.]`;
      }

      Storage.updateEquipmentStatus(
        this.currentInspection.equipmentId,
        'manutencao',
        this.currentInspection.formattedDate,
        `${this.currentInspection.inspectorName} (Tel: ${this.currentInspection.inspectorPhone || 'Registrado'})`,
        `RETIDO EM MANUTENÇÃO: ${createdSS.id} enviada ao PCM (${createdSS.pcmRecipient}). ${reason}${alertReserved}`
      );

    } else {
      // 100% APROVADO E LIBERADO - VALIDAÇÃO COMPLETA
      const answeredConforme = Object.values(this.currentInspection.answers).filter(a => a.status === 'conforme').length;
      if (answeredConforme !== completion.total) {
        throw new Error('Erro de integridade no checklist: a quantidade de itens aprovados não corresponde à totalidade exigida.');
      }

      this.currentInspection.finalStatus = 'liberado';
      this.currentInspection.verdict = 'EQUIPAMENTO 100% CONFORME - LIBERADO PARA OPERAÇÃO / LOCAÇÃO';
      this.currentInspection.blockReason = null;
      this.currentInspection.associatedServiceRequest = null;

      // Preserva status de Reserva Comercial ou Locação Ativa se o equipamento já estava nesse ciclo
      const eqBeforeOk = Storage.getEquipmentById(this.currentInspection.equipmentId);
      const targetStatus = (eqBeforeOk && (eqBeforeOk.status === 'reservada' || eqBeforeOk.status === 'locada')) 
        ? eqBeforeOk.status 
        : 'disponivel';

      let approvalNote = 'Inspecionado e aprovado com 100% de conformidade visual, mecânica e testes funcionais.';
      if (targetStatus === 'reservada') {
        approvalNote = `Inspecionado e 100% APROVADO. Liberado para mobilização do cliente ${eqBeforeOk?.reservation?.clientName || 'Contratante'}.`;
      } else if (targetStatus === 'locada') {
        approvalNote = `Vistoria técnica periódica de campo 100% APROVADA e conforme.`;
      }

      Storage.updateEquipmentStatus(
        this.currentInspection.equipmentId,
        targetStatus,
        this.currentInspection.formattedDate,
        `${this.currentInspection.inspectorName} (Tel: ${this.currentInspection.inspectorPhone || 'Registrado'})`,
        approvalNote
      );

      // Se havia Solicitação de Serviço pendente no PCM para este equipamento, registra a baixa técnica
      try {
        const activeRequests = Storage.getServiceRequests();
        const openSS = activeRequests.find(s => 
          (s.equipmentId === this.currentInspection.equipmentId || s.equipmentTag === this.currentInspection.equipmentTag) && 
          s.status !== 'concluida'
        );
        if (openSS) {
          Storage.updateServiceRequestStatus(
            openSS.id,
            'concluida',
            `Equipamento reinspecionado e 100% APROVADO no Laudo ${this.currentInspection.id} em ${this.currentInspection.formattedDate}. Manutenção e itens corretivos validados.`
          );
        }
      } catch (errSS) {
        console.warn('Aviso ao sincronizar S.S. anterior:', errSS);
      }
    }

    // 4. GERAÇÃO DE HASH CRIPTOGRÁFICO FORENSE SHA-256 DE NÃO-ADULTERAÇÃO
    const payloadToHash = {
      id: this.currentInspection.id,
      equipmentTag: this.currentInspection.equipmentTag,
      equipmentName: this.currentInspection.equipmentName,
      inspector: this.currentInspection.inspectorName,
      inspectorPhone: this.currentInspection.inspectorPhone,
      authenticatedUser: authManager.getCurrentUser()?.email || 'inspetor.betim@locar.com.br',
      hourmeter: this.currentInspection.hourmeter,
      finalStatus: this.currentInspection.finalStatus,
      totalNonConformities: this.currentInspection.totalNonConformities,
      finishedAt: this.currentInspection.finishedAt
    };
    this.currentInspection.cryptoHash = await generateAuditHash(payloadToHash);
    this.currentInspection.qrCodeHash = this.currentInspection.cryptoHash.substring(0, 24).toUpperCase();
    this.currentInspection.certifiedBy = authManager.getCurrentUser()?.name || this.currentInspection.inspectorName;

    authManager.logAudit('EMISSAO_LAUDO', `Laudo ${this.currentInspection.id} emitido com veredicto: ${this.currentInspection.finalStatus} (Hash: ${this.currentInspection.qrCodeHash})`);

    // Persiste inspeção no histórico permanente
    Storage.saveInspection(this.currentInspection);

    return this.currentInspection;
  }
};
