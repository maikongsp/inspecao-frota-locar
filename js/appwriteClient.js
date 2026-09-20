/**
 * CLIENTE APPWRITE CLOUD ENTERPRISE COM SUPORTE OFFLINE-FIRST E FILA AUTOMÁTICA DE SINCRONIZAÇÃO
 * Locar Guindastes e Transportes Intermodais (Filial Betim / MG)
 * 
 * Funcionalidades:
 * 1. Sincronização em tempo real de laudos, vistorias e solicitações ao PCM no Appwrite Cloud.
 * 2. Operação 100% resiliente em modo Offline no pátio (sem sinal de rede).
 * 3. Fila de contingência (Sync Queue) com auto-envio assim que a conexão for restabelecida.
 */

const QUEUE_KEYS = {
    INSPECTIONS: 'locar_appwrite_queue_inspections_v1',
    PCM: 'locar_appwrite_queue_pcm_v1'
};

export class AppwriteClient {
    constructor() {
        // Configurações do Appwrite Cloud (Região Nova York / NYC onde o projeto foi provisionado)
        this.endpoint = localStorage.getItem('locar_appwrite_endpoint') || 'https://nyc.cloud.appwrite.io/v1';
        this.projectId = localStorage.getItem('locar_appwrite_project_id') || '6aaf35a1003b73ac8b04';
        this.databaseId = localStorage.getItem('locar_appwrite_database_id') || 'locar_betim_db';
        this.collectionInspections = 'inspections';
        this.collectionPCM = 'pcm_service_requests';
        this.bucketPhotos = 'inspection_photos';

        this.isCloudEnabled = Boolean(this.endpoint && this.projectId);

        // Auto-sincronização quando o dispositivo recuperar sinal de internet (Wi-Fi / 4G)
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('[Appwrite] Conexão restabelecida! Iniciando sincronização da fila offline no pátio...');
                this.flushSyncQueue();
            });

            // Se iniciar com internet, verifica pendências em segundo plano
            setTimeout(() => {
                if (navigator.onLine && this.isCloudEnabled) {
                    this.flushSyncQueue();
                }
            }, 3000);
        }
    }

    /**
     * Configura as credenciais do Appwrite Cloud
     */
    configure(projectId, databaseId = 'locar_betim_db', endpoint = 'https://nyc.cloud.appwrite.io/v1') {
        this.endpoint = endpoint;
        this.projectId = projectId;
        this.databaseId = databaseId;

        localStorage.setItem('locar_appwrite_endpoint', endpoint);
        localStorage.setItem('locar_appwrite_project_id', projectId);
        localStorage.setItem('locar_appwrite_database_id', databaseId);

        this.isCloudEnabled = Boolean(endpoint && projectId);
    }

    // --- GESTÃO DA FILA DE CONTINGÊNCIA OFFLINE ---
    getPendingInspections() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEYS.INSPECTIONS) || '[]');
        } catch (e) {
            return [];
        }
    }

    getPendingPCMRequests() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEYS.PCM) || '[]');
        } catch (e) {
            return [];
        }
    }

    getPendingCount() {
        return this.getPendingInspections().length + this.getPendingPCMRequests().length;
    }

    enqueuePendingInspection(inspectionData) {
        const queue = this.getPendingInspections();
        if (!queue.some(item => item.id === inspectionData.id)) {
            queue.push(inspectionData);
            try {
                localStorage.setItem(QUEUE_KEYS.INSPECTIONS, JSON.stringify(queue));
                console.log('[Appwrite] Inspeção arquivada na fila offline para envio posterior:', inspectionData.id);
            } catch (e) {
                console.warn('Erro ao enfileirar inspeção offline:', e);
            }
        }
    }

    enqueuePendingPCMRequest(pcmRequest) {
        const queue = this.getPendingPCMRequests();
        if (!queue.some(item => item.id === pcmRequest.id)) {
            queue.push(pcmRequest);
            try {
                localStorage.setItem(QUEUE_KEYS.PCM, JSON.stringify(queue));
                console.log('[Appwrite] S.S. PCM arquivada na fila offline para envio posterior:', pcmRequest.id);
            } catch (e) {
                console.warn('Erro ao enfileirar S.S. offline:', e);
            }
        }
    }

    /**
     * Descarrega toda a fila de pendências para o Appwrite Cloud
     */
    async flushSyncQueue() {
        if (!this.isCloudEnabled || !navigator.onLine) {
            return { synced: 0, remaining: this.getPendingCount() };
        }

        let syncedCount = 0;
        const pendingInspections = this.getPendingInspections();
        const remainingInspections = [];

        for (const insp of pendingInspections) {
            const res = await this._postInspection(insp);
            if (res.success || res.status === 409) {
                syncedCount++;
            } else {
                remainingInspections.push(insp);
            }
        }
        localStorage.setItem(QUEUE_KEYS.INSPECTIONS, JSON.stringify(remainingInspections));

        const pendingPCM = this.getPendingPCMRequests();
        const remainingPCM = [];
        for (const ss of pendingPCM) {
            const res = await this._postPCMRequest(ss);
            if (res.success || res.status === 409) {
                syncedCount++;
            } else {
                remainingPCM.push(ss);
            }
        }
        localStorage.setItem(QUEUE_KEYS.PCM, JSON.stringify(remainingPCM));

        if (syncedCount > 0) {
            console.log(`[Appwrite] Sincronização concluída! ${syncedCount} registro(s) transmitidos à nuvem.`);
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('locar-cloud-synced', { detail: { synced: syncedCount } }));
            }
        }

        return { synced: syncedCount, remaining: this.getPendingCount() };
    }

    /**
     * Sincroniza inspeção com a coleção de documentos do Appwrite
     */
    async syncInspection(inspectionData) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            this.enqueuePendingInspection(inspectionData);
            return { success: true, mode: 'local_queued' };
        }

        const res = await this._postInspection(inspectionData);
        if (!res.success && res.status !== 409) {
            this.enqueuePendingInspection(inspectionData);
            return { success: false, mode: 'local_queued_fallback' };
        }

        return { success: true, mode: 'cloud' };
    }

    /**
     * Requisição interna de post de inspeção
     */
    async _postInspection(inspectionData) {
        try {
            const documentId = 'insp_' + inspectionData.id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
            const url = `${this.endpoint}/databases/${this.databaseId}/collections/${this.collectionInspections}/documents`;

            const payload = {
                documentId: documentId,
                data: {
                    inspection_id: inspectionData.id,
                    equipment_tag: inspectionData.equipmentTag,
                    equipment_name: inspectionData.equipmentName,
                    equipment_type: inspectionData.equipmentType,
                    inspector_first_name: inspectionData.inspectorFirstName || '',
                    inspector_last_name: inspectionData.inspectorLastName || '',
                    inspector_full_name: inspectionData.inspectorFullName || inspectionData.inspectorName || '',
                    inspector_phone: inspectionData.inspectorPhone || '',
                    inspector_reg: inspectionData.inspectorReg || '',
                    hourmeter: Number(inspectionData.hourmeter) || 0,
                    final_status: inspectionData.finalStatus,
                    verdict: inspectionData.verdict,
                    total_non_conformities: inspectionData.totalNonConformities || 0,
                    technical_opinion: inspectionData.technicalOpinion || '',
                    ai_expert_appraisal: inspectionData.aiExpertAppraisal || '',
                    crypto_hash: inspectionData.cryptoHash || inspectionData.qrCodeHash || '',
                    started_at: inspectionData.startedAt,
                    finished_at: inspectionData.finishedAt || new Date().toISOString()
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': this.projectId
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('[Appwrite] Inspeção sincronizada com sucesso no Appwrite Cloud!');
                return { success: true, status: 200 };
            } else {
                return { success: false, status: response.status };
            }
        } catch (err) {
            return { success: false, status: 0, error: err };
        }
    }

    /**
     * Sincroniza Solicitação de Serviço do PCM com o Appwrite
     */
    async syncPCMRequest(pcmRequest) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            this.enqueuePendingPCMRequest(pcmRequest);
            return { success: true, mode: 'local_queued' };
        }

        const res = await this._postPCMRequest(pcmRequest);
        if (!res.success && res.status !== 409) {
            this.enqueuePendingPCMRequest(pcmRequest);
            return { success: false, mode: 'local_queued_fallback' };
        }

        return { success: true, mode: 'cloud' };
    }

    /**
     * Requisição interna de post de SS PCM
     */
    async _postPCMRequest(pcmRequest) {
        try {
            const documentId = 'ss_' + pcmRequest.id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
            const url = `${this.endpoint}/databases/${this.databaseId}/collections/${this.collectionPCM}/documents`;

            const payload = {
                documentId: documentId,
                data: {
                    request_id: pcmRequest.id,
                    equipment_tag: pcmRequest.equipmentTag,
                    equipment_name: pcmRequest.equipmentName,
                    status: pcmRequest.status || 'aberta',
                    severity: pcmRequest.severity || 'CRÍTICA',
                    inspector_name: pcmRequest.openedBy,
                    inspector_phone: pcmRequest.inspectorPhone || '',
                    opened_date: pcmRequest.openedDate,
                    recipient_email: pcmRequest.pcmRecipient || 'pcm.betim@locar.com.br',
                    faults_summary: (pcmRequest.nonConformities || []).map(f => `[${f.item}] ${f.note}`).join('; ')
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': this.projectId
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return { success: true, status: 200 };
            } else {
                return { success: false, status: response.status };
            }
        } catch (err) {
            return { success: false, status: 0, error: err };
        }
    }

    /**
     * Autentica usuário corporativo diretamente via API de Sessões do Appwrite Cloud
     */
    async createSession(email, password) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            return { success: false, error: 'Dispositivo em modo offline' };
        }
        try {
            const url = `${this.endpoint}/account/sessions/email`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': this.projectId
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, session: data };
            } else {
                return { success: false, error: data.message || 'Falha na autenticação corporativa Appwrite' };
            }
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

export const appwriteClient = new AppwriteClient();
