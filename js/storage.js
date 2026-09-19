/**
 * Sistema de Inspeção Locar - Camada de Persistência Local
 * Base Oficial CMMS Locar Betim / MG
 */

import { INITIAL_FLEET } from './data/fleetData.js';

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

  // --- GESTÃO DA FROTA REAL (CMMS BETIM) ---
  getFleet() {
    this.clearLegacyData();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLEET);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 50) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler frota do localStorage, recarregando dados do CMMS Betim:', e);
    }
    // Inicializa com a frota oficial de 273 equipamentos do CMMS
    localStorage.setItem(STORAGE_KEYS.FLEET, JSON.stringify(INITIAL_FLEET));
    return INITIAL_FLEET;
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

  // --- HISTÓRICO DE INSPEÇÕES ---
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
    const history = this.getInspections();
    history.unshift(inspection);
    try {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(history));
    } catch (e) {
      console.warn('Cota excedida, otimizando fotos antigas:', e);
      const reducedHistory = history.map((item, idx) => {
        if (idx > 3 && item.photos) {
          return { ...item, photos: {} };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(reducedHistory));
    }
    return inspection;
  },

  getInspectionById(id) {
    const history = this.getInspections();
    return history.find(item => item.id === id);
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
        solutionNotes: 'PCM Betim: Peças requisitadas ao fornecedor SANY. Previsão de liberação no CMMS: 06/10/2026.'
      },
      {
        id: 'SS-PCM-BETIM-2026-002',
        equipmentId: '60/15/148',
        equipmentTag: '60/15/148',
        equipmentName: 'JLG 450 AJ (Boom articulado até 15m)',
        type: 'pta',
        branch: '2-Betim / MG',
        openedDate: '16/07/2026 14:15',
        openedBy: 'Marcos Vinicius Silva',
        inspectorPhone: '(31) 99123-4567',
        status: 'em_execucao',
        severity: 'alta',
        pcmEmailSent: true,
        pcmEmailDate: '16/07/2026 14:18',
        pcmRecipient: 'pcm.betim@locar.com.br',
        nonConformities: [
          {
            item: 'Cilindros hidráulicos de elevação e extensão',
            norm: 'NR-12 e NBR 16776',
            note: 'Vazamento na vedação do cilindro secundário da lança articulada.',
            type: 'Mecânica / Hidráulica'
          }
        ],
        solutionNotes: 'PCM Betim: Manutenção em andamento na oficina de Betim. Previsão CMMS de liberação: 16/10/2026.'
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
      severity: ncList.some(nc => nc.type.includes('Visual') || nc.type.includes('Operação')) ? 'critica' : 'alta',
      pcmEmailSent: true,
      pcmEmailDate: new Date().toLocaleString('pt-BR'),
      pcmRecipient: pcmConfig.pcmEmail,
      nonConformities: ncList,
      solutionNotes: 'Solicitação gerada e encaminhada ao PCM Betim. Equipamento retido no pátio até reparo e nova inspeção.'
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
