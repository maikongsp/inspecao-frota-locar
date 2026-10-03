/**
 * Sistema de Inspeção Locar - Camada de Persistência Local
 * Base Oficial CMMS Locar Betim / MG
 */

import { INITIAL_FLEET } from './data/fleetData.js';
import { idbStorage } from './modules/indexedDBStorage.js';
import { CLIENT_TIERS, getClientTier } from './data/clientTiers.js';

const STORAGE_KEYS = {
  FLEET: 'locar_inspection_fleet_v3_betim',
  INSPECTIONS: 'locar_inspection_history_v2_betim',
  SERVICE_REQUESTS: 'locar_pcm_service_requests_v2_betim',
  PCM_CONFIG: 'locar_pcm_config_v2'
};

export const Storage = {
  // Limpa chaves legadas fictícias
  clearLegacyData() {
    try {
      localStorage.removeItem('locar_inspection_fleet_v1');
      localStorage.removeItem('locar_inspection_fleet_v2_betim');
      localStorage.removeItem('locar_inspection_history_v1');
      localStorage.removeItem('locar_work_orders_v1');
      localStorage.removeItem('locar_pcm_service_requests_v1');
    } catch (e) {
      console.warn('Erro ao limpar dados legados:', e);
    }
  },

  // --- CONFIGURAÇÃO DO PCM ---
  getPCMConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PCM_CONFIG);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao ler config do PCM:', e);
    }
    const defaultConfig = {
      pcmEmail: 'pcm.betim@locar.com.br',
      pcmManagerName: 'Engenharia de Manutenção & PCM Locar - Filial Betim/MG',
      autoSendEmail: true
    };
    localStorage.setItem(STORAGE_KEYS.PCM_CONFIG, JSON.stringify(defaultConfig));
    return defaultConfig;
  },

  savePCMConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.PCM_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Erro ao salvar config do PCM:', e);
    }
  },

  // --- GESTÃO DA FROTA REAL (ENGEMAN® CMMS BETIM) ---
  getFleet() {
    this.clearLegacyData();
    const FLEET_VERSION_TAG = 'locar_fleet_v4_fleet1_fleet2_betim_272';
    const currentVersion = localStorage.getItem('locar_fleet_version_tag');

    let fleet = null;
    try {
      // Se a versão em cache for anterior à unificação de fleet 1 e fleet 2, força atualização
      if (currentVersion === FLEET_VERSION_TAG) {
        const data = localStorage.getItem(STORAGE_KEYS.FLEET);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length >= 270) {
            fleet = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao ler frota do localStorage, recarregando dados oficiais de fleet 1 e fleet 2:', e);
    }
    
    if (!fleet) {
      // Inicializa com a frota oficial de 272 equipamentos reais de fleet 1.xls e fleet 2.xls
      fleet = JSON.parse(JSON.stringify(INITIAL_FLEET));
      localStorage.setItem('locar_fleet_version_tag', FLEET_VERSION_TAG);
    }

    // Enriquece frotas locadas/reservadas com metadados de classificação de clientes se ainda não possuírem
    fleet = this.enrichFleetWithClientTiers(fleet);
    localStorage.setItem(STORAGE_KEYS.FLEET, JSON.stringify(fleet));
    return fleet;
  },

  enrichFleetWithClientTiers(fleet) {
    if (!Array.isArray(fleet)) return fleet;

    // Em operação real, preserva apenas classificações legítimas já associadas aos ativos
    fleet.forEach(eq => {
      const tier = eq.clientTier || eq.reservation?.clientTier;
      if (tier) {
        const tierMeta = getClientTier(tier);
        if (tierMeta) {
          eq.clientTierBadge = tierMeta.badgeLabel || tier;
        }
      }
    });

    return fleet;
  },

  saveFleet(fleet) {
    try {
      localStorage.setItem(STORAGE_KEYS.FLEET, JSON.stringify(fleet));
    } catch (e) {
      console.error('Erro ao salvar frota:', e);
    }
  },

  getEquipmentById(id) {
    const fleet = this.getFleet();
    return fleet.find(item => item.id === id || item.tag === id);
  },

  updateEquipmentStatus(id, newStatus, lastInspectionDate, lastInspector, notes) {
    const fleet = this.getFleet();
    const index = fleet.findIndex(item => item.id === id || item.tag === id);
    if (index !== -1) {
      fleet[index].status = newStatus;
      if (newStatus === 'disponivel') {
        fleet[index].reservation = null;
        fleet[index].reservationData = null;
      } else if (newStatus === 'manutencao' && (fleet[index].reservation || fleet[index].reservationData)) {
        fleet[index].lastCancelledReservation = {
          ...(fleet[index].reservation || fleet[index].reservationData || {}),
          reason: notes || 'Retido em manutenção corretiva pelo PCM',
          cancelledAt: new Date().toISOString()
        };
        fleet[index].reservation = null;
        fleet[index].reservationData = null;
      }
      if (lastInspectionDate) fleet[index].lastInspectionDate = lastInspectionDate;
      if (lastInspector) fleet[index].lastInspector = lastInspector;
      if (notes) fleet[index].notes = notes;
      this.saveFleet(fleet);
      return fleet[index];
    }
    return null;
  },

  addEquipment(equipment) {
    const fleet = this.getFleet();
    fleet.unshift(equipment);
    this.saveFleet(fleet);
    return equipment;
  },

  // --- GESTÃO COMERCIAL DE RESERVAS E LOCAÇÃO ---
  reserveEquipment(id, reservationData) {
    const fleet = this.getFleet();
    const index = fleet.findIndex(item => item.id === id || item.tag === id);
    if (index === -1) {
      throw new Error(`Equipamento ${id} não encontrado na frota de Betim.`);
    }

    const eq = fleet[index];
    if (eq.status !== 'disponivel') {
      throw new Error(`Regra Comercial Locar: Apenas frotas com status 'DISPONÍVEL' podem ser reservadas. O equipamento ${eq.tag} está '${eq.status.toUpperCase()}'.`);
    }

    const tierId = (reservationData.clientTier || 'AA').toUpperCase().trim();
    const tierMeta = getClientTier(tierId) || CLIENT_TIERS.AA;

    const reservation = {
      id: `RES-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      clientTier: tierId,
      clientTierName: tierMeta.name,
      clientTierBadge: tierMeta.badgeLabel,
      clientTierColor: tierMeta.color,
      clientName: reservationData.clientName || 'Cliente Corporativo',
      contractRef: reservationData.contractRef || 'Proposta Comercial',
      startDate: reservationData.startDate,
      endDate: reservationData.endDate,
      estimatedDays: reservationData.estimatedDays || 0,
      siteLocation: reservationData.siteLocation || 'Betim / Região',
      commercialAgent: reservationData.commercialAgent || 'Time Comercial Locar',
      notes: reservationData.notes || '',
      reservedAt: new Date().toISOString()
    };

    eq.status = 'reservada';
    eq.clientTier = tierId;
    eq.client = reservation.clientName;
    eq.clientTierBadge = tierMeta.badgeLabel;
    eq.reservation = reservation;
    eq.reservationData = reservation;
    eq.notes = `RESERVADO [${tierId}] p/ ${reservation.clientName} (${reservation.startDate} até ${reservation.endDate})`;

    this.saveFleet(fleet);
    return eq;
  },

  activateRental(id) {
    const fleet = this.getFleet();
    const index = fleet.findIndex(item => item.id === id || item.tag === id);
    if (index === -1) {
      throw new Error(`Equipamento ${id} não encontrado.`);
    }

    const eq = fleet[index];
    if (eq.status !== 'reservada') {
      throw new Error(`Apenas frotas com status 'RESERVADA' podem ter a operação iniciada como 'Locada'.`);
    }

    const client = eq.reservation?.clientName || eq.reservationData?.clientName || 'Cliente Locar';
    const tierId = eq.reservation?.clientTier || eq.clientTier || 'AA';
    const tierMeta = getClientTier(tierId) || CLIENT_TIERS.AA;
    const contract = eq.reservation?.contractRef || eq.reservationData?.contractRef || 'Contrato Ativo';
    const nowIso = new Date().toISOString();

    eq.status = 'locada';
    eq.client = client;
    eq.clientTier = tierId;
    eq.clientTierBadge = tierMeta.badgeLabel;
    eq.currentContract = `${client} (${contract})`;
    if (eq.reservation) eq.reservation.rentalStartedAt = nowIso;
    if (eq.reservationData) eq.reservationData.rentalStartedAt = nowIso;
    eq.notes = `EM OPERAÇÃO / LOCADA [${tierId}] para ${client}. Início: ${eq.reservation?.startDate || 'Hoje'}`;

    this.saveFleet(fleet);
    return eq;
  },

  cancelReservation(id, reason = 'Reserva cancelada pelo time comercial.') {
    const fleet = this.getFleet();
    const index = fleet.findIndex(item => item.id === id || item.tag === id);
    if (index === -1) {
      throw new Error(`Equipamento ${id} não encontrado.`);
    }

    const eq = fleet[index];
    if (eq.status !== 'reservada') {
      throw new Error(`O equipamento ${eq.tag} não está reservado.`);
    }

    eq.lastCancelledReservation = {
      ...(eq.reservation || eq.reservationData || {}),
      reason,
      cancelledAt: new Date().toISOString()
    };

    eq.status = 'disponivel';
    eq.reservation = null;
    eq.reservationData = null;
    eq.notes = reason;

    this.saveFleet(fleet);
    return eq;
  },

  // --- HISTÓRICO DE INSPEÇÕES (COM INDEXEDDB & LOCALSTORAGE DUAL LAYER) ---
  getInspections() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao ler inspeções:', e);
    }
    return [];
  },

  saveInspection(inspection) {
    // 1. Grava no IndexedDB de alta capacidade (fotos e laudo completos)
    try {
      idbStorage.saveInspection(inspection).catch(e => {
        console.warn('[Storage] Fallback IndexedDB:', e);
      });
    } catch (errIdb) {
      console.warn('[Storage] IndexedDB não disponível:', errIdb);
    }

    // 2. Grava no LocalStorage para acesso síncrono ultra-rápido na UI
    const history = this.getInspections();
    history.unshift(inspection);
    try {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(history));
    } catch (e) {
      console.warn('Cota excedida no localStorage, otimizando fotos de vistorias antigas:', e);
      const reducedHistory = history.map((item, idx) => {
        if (idx > 4 && item.answers) {
          const cleanedAnswers = {};
          for (const [k, v] of Object.entries(item.answers)) {
            cleanedAnswers[k] = v && v.photo ? { ...v, photo: null } : v;
          }
          return { ...item, answers: cleanedAnswers };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(reducedHistory));
      } catch (errRetry) {
        console.error('Falha crítica de armazenamento local:', errRetry);
      }
    }
    return inspection;
  },

  getInspectionById(id) {
    const history = this.getInspections();
    return history.find(item => item.id === id);
  },

  async getInspectionWithFullEvidence(id) {
    // Busca prioritariamente no IndexedDB com todas as evidências fotográficas em alta resolução
    try {
      const fromIdb = await idbStorage.getInspectionById(id);
      if (fromIdb) return fromIdb;
    } catch (e) {
      console.warn('[Storage] Falha ao ler IndexedDB, lendo LocalStorage:', e);
    }
    return this.getInspectionById(id);
  },

  // --- SOLICITAÇÕES DE SERVIÇO (SS) PARA O PCM ---
  getServiceRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICE_REQUESTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao ler solicitações de serviço:', e);
    }
    return [];
  },

  saveServiceRequests(requests) {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Erro ao salvar Solicitações de Serviço:', e);
    }
  },

  createServiceRequestFromInspection(inspection) {
    const requests = this.getServiceRequests();
    const pcmConfig = this.getPCMConfig();
    const ssNumber = `SS-PCM-BETIM-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`;
    
    const ncList = [];
    if (inspection.answers) {
      Object.entries(inspection.answers).forEach(([itemId, data]) => {
        if (data.status === 'nao_conforme') {
          ncList.push({
            item: data.label || itemId,
            norm: data.norm || 'Norma Regulamentadora',
            note: data.observation || 'Não conformidade detectada em inspeção técnica.',
            photo: data.photo || null,
            type: data.sectionTitle || 'Geral'
          });
        }
      });
    }

    const clientTier = inspection.clientTier || inspection.equipmentDetails?.clientTier || inspection.equipmentDetails?.reservation?.clientTier || null;
    const clientName = inspection.clientName || inspection.equipmentDetails?.client || inspection.equipmentDetails?.reservation?.clientName || null;
    const isClientAA = clientTier === 'AA';

    const newRequest = {
      id: ssNumber,
      equipmentId: inspection.equipmentId,
      equipmentTag: inspection.equipmentTag,
      equipmentName: inspection.equipmentName,
      type: inspection.equipmentType,
      hourmeter: inspection.hourmeter,
      branch: inspection.equipmentDetails?.branch || '2-Betim / MG',
      openedDate: new Date().toLocaleString('pt-BR'),
      openedBy: inspection.inspectorFullName || `${inspection.inspectorFirstName} ${inspection.inspectorLastName}`,
      inspectorPhone: inspection.inspectorPhone || 'Não informado',
      status: 'aberta',
      severity: isClientAA ? 'critica' : (ncList.some(nc => nc.type.includes('Visual') || nc.type.includes('Operação')) ? 'critica' : 'alta'),
      clientTier,
      clientName,
      pcmEmailSent: true,
      pcmEmailDate: new Date().toLocaleString('pt-BR'),
      pcmRecipient: pcmConfig.pcmEmail,
      nonConformities: ncList,
      solutionNotes: isClientAA 
        ? `🚨 ATENÇÃO PCM BETIM: Frota destinada a Cliente Classe AA (${clientName || 'Grande Player'}). Prioridade emergencial na oficina e testes de liberação!`
        : 'Solicitação gerada e encaminhada ao PCM Betim. Equipamento retido no pátio até reparo e nova inspeção.'
    };

    requests.unshift(newRequest);
    this.saveServiceRequests(requests);
    return newRequest;
  },

  updateServiceRequestStatus(ssId, status, solutionNotes) {
    const requests = this.getServiceRequests();
    const index = requests.findIndex(s => s.id === ssId);
    if (index !== -1) {
      requests[index].status = status;
      if (solutionNotes) requests[index].solutionNotes = solutionNotes;
      this.saveServiceRequests(requests);
      return requests[index];
    }
    return null;
  },

  /**
   * Limpa integralmente dados de teste (inspeções, solicitações do PCM, filas e usuários)
   * Deixando o sistema 100% preparado para entrada em operação real.
   */
  async clearAllTestData() {
    try {
      // 1. Limpa histórico de laudos e inspeções locais
      localStorage.removeItem(STORAGE_KEYS.INSPECTIONS);
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify([]));

      // 2. Limpa solicitações de serviço do PCM
      localStorage.removeItem(STORAGE_KEYS.SERVICE_REQUESTS);
      localStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify([]));

      // 3. Limpa filas de contingência Appwrite
      localStorage.removeItem('locar_appwrite_queue_inspections_v1');
      localStorage.removeItem('locar_appwrite_queue_pcm_v1');

      // 4. Limpa sessões ativas e auditorias de teste
      localStorage.removeItem('locar_auth_session_v1');
      localStorage.removeItem('locar_auth_lockout_v1');
      localStorage.removeItem('locar_audit_log_v1');
      localStorage.removeItem('locar_corporate_users_v1');

      // 5. Limpa IndexedDB de alta capacidade
      try {
        await idbStorage.clearAll();
      } catch (eIdb) {
        console.warn('Erro ao limpar IndexedDB:', eIdb);
      }

      // 6. Limpa chaves legadas
      this.clearLegacyData();

      // 7. Limpa dados de vistorias prévias e reservas fictícias na frota
      const fleet = this.getFleet();
      if (Array.isArray(fleet)) {
        fleet.forEach(eq => {
          eq.lastInspectionDate = null;
          eq.lastInspector = null;
          eq.reservation = null;
          eq.reservationData = null;
          eq.lastCancelledReservation = null;
        });
        this.saveFleet(fleet);
      }

      console.log('✓ [Locar] Sistema preparado para entrada em operação: Todos os dados de teste e usuários fictícios foram limpos.');
      return true;
    } catch (e) {
      console.error('Erro ao limpar dados de teste:', e);
      return false;
    }
  },

  /**
   * Atualização em lote do status das frotas
   * @param {Array<object>} updates 
   */
  updateFleetBatch(updates) {
    if (!Array.isArray(updates)) return { success: false, error: 'A carga deve ser uma lista de ativos.' };
    const fleet = this.getFleet();
    let updatedCount = 0;

    updates.forEach(up => {
      const tagOrId = String(up.tag || up.id || up.prefixo || '').trim();
      if (!tagOrId) return;
      const eq = fleet.find(item => 
        item.tag?.toLowerCase() === tagOrId.toLowerCase() || 
        item.id?.toLowerCase() === tagOrId.toLowerCase()
      );
      if (eq) {
        if (up.status) {
          const s = String(up.status).toLowerCase().trim();
          eq.status = s;
          eq.statusRaw = up.statusRaw || s.toUpperCase();
        }
        if (up.client !== undefined) eq.client = up.client;
        if (up.clientTier !== undefined) {
          eq.clientTier = up.clientTier;
          const tierMeta = getClientTier(up.clientTier);
          eq.clientTierBadge = tierMeta?.badgeLabel || up.clientTier;
        }
        if (up.currentContract !== undefined) eq.currentContract = up.currentContract;
        if (up.siteLocation !== undefined) eq.siteLocation = up.siteLocation;
        if (up.hourmeter !== undefined) eq.hourmeter = Number(up.hourmeter) || eq.hourmeter;
        if (up.notes !== undefined) eq.notes = up.notes;
        if (up.branch !== undefined) eq.branch = up.branch;
        if (up.reservation !== undefined) eq.reservation = up.reservation;
        updatedCount++;
      }
    });

    this.saveFleet(fleet);
    return { success: true, updatedCount, totalFleet: fleet.length };
  }
};
