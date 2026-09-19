/**
 * CLIENTE SUPABASE ENTERPRISE COM SUPORTE OFFLINE-FIRST
 * Locar Guindastes e Transportes Intermodais
 * 
 * Funciona de forma resiliente:
 * - Se configurado (SUPABASE_URL e ANON_KEY), sincroniza em tempo real com a nuvem.
 * - Se offline ou sem chaves, armazena perfeitamente no LocalStorage sem interrupção.
 */

export class SupabaseClient {
    constructor() {
        // As chaves podem ser configuradas no window ou no localStorage
        this.supabaseUrl = window.LOCAR_CONFIG?.SUPABASE_URL || localStorage.getItem('locar_supabase_url') || '';
        this.supabaseKey = window.LOCAR_CONFIG?.SUPABASE_ANON_KEY || localStorage.getItem('locar_supabase_key') || '';
        this.isCloudEnabled = Boolean(this.supabaseUrl && this.supabaseKey);
    }

    /**
     * Atualiza as credenciais de conexão do Supabase
     */
    configure(url, key) {
        this.supabaseUrl = url;
        this.supabaseKey = key;
        localStorage.setItem('locar_supabase_url', url);
        localStorage.setItem('locar_supabase_key', key);
        this.isCloudEnabled = Boolean(url && key);
    }

    /**
     * Sincroniza inspeção com a nuvem (Supabase)
     */
    async syncInspection(inspectionData) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            console.log('[Supabase] Modo Offline / LocalStorage ativo para inspeção:', inspectionData.code);
            return { success: true, mode: 'local' };
        }

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/inspections`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    inspection_code: inspectionData.code,
                    fleet_number: inspectionData.equipment.fleetNumber,
                    inspector_first_name: inspectionData.inspector.firstName,
                    inspector_last_name: inspectionData.inspector.lastName,
                    inspector_phone: inspectionData.inspector.phone,
                    inspector_reg: inspectionData.inspector.registration || null,
                    horimeter: inspectionData.horimeter || null,
                    status: inspectionData.passed ? 'aprovado' : 'reprovado_pcm',
                    passed: inspectionData.passed,
                    total_items: inspectionData.totalItems,
                    passed_items: inspectionData.passedItems,
                    checklist_data: inspectionData.items,
                    non_conformities: inspectionData.nonConformities,
                    ai_expert_appraisal: inspectionData.expertAppraisal || null,
                    signature_url: inspectionData.signature || null,
                    started_at: inspectionData.startedAt || new Date().toISOString(),
                    completed_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('[Supabase] Inspeção sincronizada com a nuvem com sucesso!');
                return { success: true, mode: 'cloud' };
            } else {
                console.warn('[Supabase] Falha ao enviar para Supabase, mantido em cache local.');
                return { success: false, mode: 'local_fallback' };
            }
        } catch (err) {
            console.error('[Supabase] Erro de rede:', err);
            return { success: false, mode: 'local_fallback' };
        }
    }

    /**
     * Sincroniza Solicitação de Serviço do PCM com a nuvem
     */
    async syncPCMRequest(pcmRequest) {
        if (!this.isCloudEnabled || !navigator.onLine) {
            return { success: true, mode: 'local' };
        }

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/pcm_service_requests`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    request_number: pcmRequest.id,
                    fleet_number: pcmRequest.fleetNumber,
                    equipment_model: pcmRequest.equipmentModel,
                    urgency: pcmRequest.urgency || 'CRÍTICA',
                    status: 'aberta_pcm',
                    inspector_name: pcmRequest.inspectorName,
                    inspector_phone: pcmRequest.inspectorPhone,
                    fault_summary: pcmRequest.faults.map(f => `[${f.item}] ${f.notes}`).join('; '),
                    email_sent_to: 'pcm.betim@locar.com.br'
                })
            });

            return { success: response.ok, mode: response.ok ? 'cloud' : 'local_fallback' };
        } catch (err) {
            return { success: false, mode: 'local_fallback' };
        }
    }
}

export const supabaseClient = new SupabaseClient();
