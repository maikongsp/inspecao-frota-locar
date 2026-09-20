/**
 * CLIENTE APPWRITE CLOUD ENTERPRISE COM SUPORTE OFFLINE-FIRST
 * Locar Guindastes e Transportes Intermodais
 * 
 * Totalmente integrado com a nuvem Appwrite:
 * - Se configurado (PROJECT_ID e DATABASE_ID), sincroniza laudos, inspeções e S.S. em tempo real.
 * - Se offline ou sem credenciais, opera em modo 100% resiliente via LocalStorage no pátio.
 */

export class AppwriteClient {
    constructor() {
        this.endpoint = window.LOCAR_CONFIG?.APPWRITE_ENDPOINT || localStorage.getItem('locar_appwrite_endpoint') || 'https://cloud.appwrite.io/v1';
        this.projectId = window.LOCAR_CONFIG?.APPWRITE_PROJECT_ID || localStorage.getItem('locar_appwrite_project_id') || '';
        this.databaseId = window.LOCAR_CONFIG?.APPWRITE_DATABASE_ID || localStorage.getItem('locar_appwrite_database_id') || 'locar_betim_db';
        this.collectionInspections = 'inspections';
        this.collectionPCM = 'pcm_service_requests';
        this.bucketPhotos = 'inspection_photos';

        this.isCloudEnabled = Boolean(this.endpoint && this.projectId);
    }

    /**
     * Configura as credenciais do Appwrite Cloud
     */
    configure(projectId, databaseId = 'locar_betim_db', endpoint = 'https://cloud.appwrite.io/v1') {
        this.endpoint = endpoint;
        this.projectId = projectId;
        this.databaseId = databaseId;

        localStorage.setItem('locar_appwrite_endpoint', endpoint);
        localStorage.setItem('locar_appwrite_project_id', projectId);
        localStorage.setItem('locar_appwrite_database_id', databaseId);

        this.isCloudEnabled = Boolean(endpoint && projectId);
    }

    /**
     * Sincroniza inspeção com a coleção de documentos do Appwrite
     */
    async syncInspection(inspectionData) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            console.log('[Appwrite] Modo Offline / Armazenamento Local ativo para inspeção:', inspectionData.id);
            return { success: true, mode: 'local' };
        }

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
                return { success: true, mode: 'cloud' };
            } else {
                const errData = await response.json();
                console.warn('[Appwrite] Falha na sincronização cloud (mantido local):', errData.message);
                return { success: false, mode: 'local_fallback', error: errData.message };
            }
        } catch (err) {
            console.error('[Appwrite] Erro de rede ou conexão:', err);
            return { success: false, mode: 'local_fallback' };
        }
    }

    /**
     * Sincroniza Solicitação de Serviço do PCM com o Appwrite
     */
    async syncPCMRequest(pcmRequest) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            return { success: true, mode: 'local' };
        }

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

            return { success: response.ok, mode: response.ok ? 'cloud' : 'local_fallback' };
        } catch (err) {
            return { success: false, mode: 'local_fallback' };
        }
    }
}

export const appwriteClient = new AppwriteClient();
