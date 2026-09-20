/**
 * Sistema de Inspeção Locar - Camada de Persistência Local
 * Base Oficial CMMS Locar Betim / MG
 */

import { INITIAL_FLEET } from './data/fleetData.js';
import { idbStorage } from './modules/indexedDBStorage.js';
import { CLIENT_TIERS, getClientTier } from './data/clientTiers.js';

const STORAGE_KEYS = {
  FLEET: 'locar_inspection_fleet_v2_betim',
  INSPECTIONS: 'locar_inspection_history_v2_betim',
  SERVICE_REQUESTS: 'locar_pcm_service_requests_v2_betim',
  PCM_CONFIG: 'locar_pcm_config_v2'
};

export const Storage = {
  // Limpa chaves legadas fictícias
  clearLegacyData() {
    try {
      localStorage.removeItem('locar_inspection_fleet_v1');
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
    let fleet = null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLEET);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 50) {
          fleet = parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler frota do localStorage, recarregando dados do Engeman® CMMS Betim:', e);
    }
    
    if (!fleet) {
      // Inicializa com a frota oficial de 273 equipamentos do Engeman® CMMS
      fleet = JSON.parse(JSON.stringify(INITIAL_FLEET));
    }

    // Enriquece frotas locadas/reservadas com metadados de classificação de clientes se ainda não possuírem
    fleet = this.enrichFleetWithClientTiers(fleet);
    localStorage.setItem(STORAGE_KEYS.FLEET, JSON.stringify(fleet));
    return fleet;
  },

  enrichFleetWithClientTiers(fleet) {
    if (!Array.isArray(fleet)) return fleet;

    const samplePool = [
      { tier: 'AA', client: 'Vale S.A.', site: 'Mina Pau Branco / Brucutu' },
      { tier: 'AA', client: 'Usiminas', site: 'Usina Intendente Câmara - Ipatinga' },
      { tier: 'AA', client: 'Anglo American', site: 'Minas-Rio - Conceição do Mato Dentro' },
      { tier: 'AA', client: 'ArcelorMittal', site: 'Usina Monlevade' },
      { tier: 'AA', client: 'CSN (Companhia Siderúrgica Nacional)', site: 'Mina Casa de Pedra - Congonhas' },
      { tier: 'AA', client: 'Gerdau', site: 'Usina Ouro Branco' },
      { tier: 'A', client: 'Manserv Industrial (Vale)', site: 'Parada Programada Vale Vargem Grande' },
      { tier: 'A', client: 'Andrade Gutierrez (Anglo American)', site: 'Obras de Expansão Minas-Rio' },
      { tier: 'A', client: 'Tenenge / Engevix (Usiminas)', site: 'Montagem Industrial Alto Forno 3' },
      { tier: 'A', client: 'Camargo Corrêa Infra (CSN)', site: 'Estruturas Metálicas CSN Mineração' },
      { tier: 'B', client: 'Prefeitura Municipal de Betim', site: 'Obras Viárias Avenida das Américas' },
      { tier: 'B', client: 'DER-MG (Dep. Estradas de Rodagem)', site: 'Manutenção Viária MG-050 / BR-381' },
      { tier: 'B', client: 'Copasa - Saneamento', site: 'Estação de Tratamento Betim' },
      { tier: 'B', client: 'DNIT (Infraestrutura de Transportes)', site: 'Passarela de Pedestres BR-381 Betim' },
      { tier: 'C', client: 'Galpão Logístico Betim Distribuição', site: 'Condomínio Logístico Via Expressa' },
      { tier: 'C', client: 'Construtora Residencial & Predial', site: 'Edifício Residencial Jardins Betim' },
      { tier: 'C', client: 'Instalações Elétricas & Iluminação', site: 'Parque Industrial Betim' }
    ];

    let poolIdx = 0;
    fleet.forEach(eq => {
      if (eq.status === 'locada' && !eq.clientTier) {
        const item = samplePool[poolIdx % samplePool.length];
        poolIdx++;
        eq.clientTier = item.tier;
        eq.client = eq.client || item.client;
        eq.siteLocation = eq.siteLocation || item.site;
        const tierMeta = getClientTier(item.tier);
        eq.clientTierBadge = tierMeta?.badgeLabel || item.tier;
        if (!eq.currentContract) {
          eq.currentContract = `${eq.client} (Contrato Vigente)`;
        }
      } else if (eq.status === 'reservada') {
        const tier = eq.reservation?.clientTier || eq.clientTier || 'AA';
        eq.clientTier = tier;
        const tierMeta = getClientTier(tier);
        eq.clientTierBadge = tierMeta?.badgeLabel || tier;
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

    // Inicializa solicitações de serviço com base nos equipamentos reais do CMMS Betim já em manutenção
    const initialSS = [
      {
        id: 'SS-PCM-BETIM-2026-001',
        equipmentId: '40/250/32',
        equipmentTag: '40/250/32',
        equipmentName: 'SANY SAC 2500S (GUINDASTE 250 TON)',
        type: 'guindaste',
        branch: '2-Betim / MG',
        openedDate: '17/09/2026 09:30',
        openedBy: 'Carlos Eduardo Mendes',
        inspectorPhone: '(31) 98765-4321',
        status: 'em_planejamento',
        severity: 'critica',
        pcmEmailSent: true,
        pcmEmailDate: '17/09/2026 09:32',
        pcmRecipient: 'pcm.betim@locar.com.br',
        nonConformities: [
          {
            item: 'Chave Fim de Curso do Moitão (Anti-Two Block / A2B)',
            norm: 'ASME B30.5 & NR-12',
            note: 'Chave A2B com defeito intermitente de sinal no moitão principal de 250t.',
            type: 'Segurança / LMI'
          },
          {
            item: 'Padrão Visual Locar & Faixas Refletivas',
            norm: 'Identidade Locar',
            note: 'Faixa zebrada da patola traseira esquerda danificada durante transporte.',
            type: 'Padrão Visual Locar'
          }
        ],
        solutionNotes: 'PCM Betim: Peças requisitadas ao fornecedor SANY. Previsão de liberação no Engeman®: 06/10/2026.'
      },
      {
        id: 'SS-PCM-BETIM-2026-002',
        equipmentId: '40/100/40',
        equipmentTag: '40/100/40',
        equipmentName: 'GUINDASTE 100 TON (Liebherr LTM 1090)',
        type: 'guindaste',
        severity: 'urgente',
        status: 'em_analise',
        openedDate: '15/09/2026 14:10',
        openedBy: 'Carlos Eduardo Mendes',
        inspectorPhone: '(31) 98765-4321',
        nonConformities: [
          {
            item: 'Sistema Hidráulico e Cilindros de Elevação',
            norm: 'NR-12 Anexo XII item 3.4',
            note: 'Vazamento constatado na conexão do cilindro primário da lança telescópica.',
            type: 'Falha Crítica'
          }
        ],
        solutionNotes: 'PCM Betim: Manutenção em andamento na oficina de Betim. Previsão de liberação no Engeman®: 16/10/2026.'
      }
    ];

    localStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(initialSS));
    return initialSS;
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
  }
};
