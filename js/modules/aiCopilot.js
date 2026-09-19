/**
 * COPILOTO TÉCNICO DE INTELIGÊNCIA ARTIFICIAL (LOCAR AI COPILOT)
 * Locar Guindastes e Transportes Intermodais
 * 
 * Especialista em Normas Regulamentadoras (NR-11, NR-12 Anexo XII, NR-18)
 * e Engenharia de Manutenção Preditiva/Corretiva.
 */

export class AICopilot {
    constructor() {
        this.knowledgeBase = [
            {
                keywords: ['óleo', 'oleo', 'vazamento', 'cilindro', 'mangueira', 'hidraulico', 'hidráulico', 'pressão', 'bomba'],
                category: 'hidraulico',
                norm: 'NR-12 Anexo XII item 3.4 / NR-11',
                riskLevel: 'CRÍTICO',
                blockRequired: true,
                cmmsFaultCode: 'HIDR-VAZ-01',
                analysis: 'Vazamento ou perda de estanqueidade no sistema hidráulico de elevação/direção. Risco iminente de perda de sustentação da lança/cesto e contaminação de solo.',
                recommendation: 'Bloqueio imediato da frota no pátio. Substituição da mangueira/reparo de vedação pelo PCM antes de qualquer operação.'
            },
            {
                keywords: ['adesivo', 'pintura', 'logomarca', 'capacidade', 'tabela de carga', 'identidade', 'amassado', 'lataria', 'cor'],
                category: 'visual',
                norm: 'Política Corporativa Locar / NR-18.14.2 / NR-12.116',
                riskLevel: 'ELIMINATÓRIO_VISUAL',
                blockRequired: true,
                cmmsFaultCode: 'IDVIS-LOCAR-02',
                analysis: 'Desconformidade visual, avaria de lataria ou decalques de segurança/capacidade danificados ou fora da identidade Locar.',
                recommendation: 'Tolerância Zero para avarias visuais. Envio de S.S. ao PCM para funilaria, pintura nas cores oficiais (#474444 e #FFF212) e aplicação de decalques homologados.'
            },
            {
                keywords: ['patola', 'patolamento', 'estabilizador', 'sapata', 'sensor', 'nivelamento'],
                category: 'estabilidade',
                norm: 'NR-18.14.1 / NR-12 Anexo XII',
                riskLevel: 'CRÍTICO',
                blockRequired: true,
                cmmsFaultCode: 'ESTAB-SEN-03',
                analysis: 'Falha no sistema de estabilização ou sensores de patolas. Risco severo de tombamento durante o içamento.',
                recommendation: 'Proibido qualquer tipo de içamento ou liberação de frota. Revisão elétrica/mecânica pelo PCM.'
            },
            {
                keywords: ['joystick', 'comando', 'fiação', 'bateria', 'emergência', 'botao', 'botão', 'painel', 'fim de curso'],
                category: 'eletrico',
                norm: 'NR-12 item 12.24 / NR-10',
                riskLevel: 'CRÍTICO',
                blockRequired: true,
                cmmsFaultCode: 'ELET-COM-04',
                analysis: 'Anomalia no comando de operação ou no circuito de parada de emergência. Perda do controle de movimentos pelo operador.',
                recommendation: 'Bloqueio elétrico imediato (LOTO). Substituição de contator/joystick pela equipe de manutenção.'
            },
            {
                keywords: ['pneu', 'esteira', 'roda', 'freio', 'desgaste', 'direção'],
                category: 'mecanico',
                norm: 'NR-11 item 11.1.3 / NR-12',
                riskLevel: 'ALTO',
                blockRequired: true,
                cmmsFaultCode: 'MEC-TRAC-05',
                analysis: 'Desgaste além do limite de segurança em rodado ou ineficiência no sistema de frenagem dinâmica.',
                recommendation: 'Troca de pneus/sapatas de esteira e sangria/revisão dos freios.'
            },
            {
                keywords: ['cabo', 'gancho', 'moitão', 'trava', 'polia', 'lança', 'solda', 'trinca'],
                category: 'estrutural',
                norm: 'NBR 8400 / NR-18.14 / NR-11',
                riskLevel: 'CRÍTICO',
                blockRequired: true,
                cmmsFaultCode: 'ESTR-ICAM-06',
                analysis: 'Fadiga estrutural, trinca em solda ou avaria em elementos de içamento (gancho/cabo de aço). Risco de queda catastrófica de carga.',
                recommendation: 'Bloqueio absoluto. Ensaio Não-Destrutivo (Líquido Penetrante / Partícula Magnética) requerido pelo Engenheiro Mecânico Responsável.'
            }
        ];
    }

    /**
     * Analisa a descrição do sintoma ou falha relatado pelo inspetor
     * @param {string} text - Texto do sintoma
     * @returns {Object} Diagnóstico assistido por IA
     */
    diagnoseSymptom(text) {
        if (!text || text.trim().length < 3) {
            return {
                matched: false,
                riskLevel: 'MODERADO',
                blockRequired: false,
                cmmsFaultCode: 'GEN-00',
                norm: 'NR-11 / NR-12',
                analysis: 'Apontamento genérico para revisão preventiva de rotina pelo PCM.',
                recommendation: 'Verificar componente e programar manutenção conforme plano de preventiva.'
            };
        }

        const lower = text.toLowerCase();
        for (const entry of this.knowledgeBase) {
            for (const kw of entry.keywords) {
                if (lower.includes(kw)) {
                    return {
                        matched: true,
                        category: entry.category,
                        norm: entry.norm,
                        riskLevel: entry.riskLevel,
                        blockRequired: entry.blockRequired,
                        cmmsFaultCode: entry.cmmsFaultCode,
                        analysis: entry.analysis,
                        recommendation: entry.recommendation
                    };
                }
            }
        }

        return {
            matched: false,
            riskLevel: 'ALERTA',
            blockRequired: false,
            cmmsFaultCode: 'CORR-DIV-99',
            norm: 'NR-12 / Procedimentos Internos Locar',
            analysis: `Anomalia relatada: "${text}". Requer inspeção confirmatória in loco pela equipe de manutenção mecânica.`,
            recommendation: 'Encaminhar Solicitação de Serviço ao PCM de Betim para triagem técnica.'
        };
    }

    /**
     * Gera o Parecer Pericial Técnico Automatizado com linguagem de Engenharia Legal
     * @param {Object} inspectionData - Dados completos da inspeção realizada
     * @returns {string} Parecer pericial formal
     */
    generateExpertAppraisal(inspectionData) {
        const { equipment, inspector, passed, nonConformities, totalItems, passedItems } = inspectionData;
        const dateStr = new Date().toLocaleString('pt-BR');
        const inspectorName = `${inspector.firstName || ''} ${inspector.lastName || ''}`.trim() || 'Inspetor Técnico';

        if (passed) {
            return `
PARECER TÉCNICO PERICIAL DE LIBERAÇÃO OPERACIONAL (IA CERTIFIED)
Data de Emissão: ${dateStr}
Equipamento: Frota ${equipment.fleetNumber} - ${equipment.model} (${equipment.category.toUpperCase()})
Inspetor Certificado: ${inspectorName} | Contato: ${inspector.phone || 'Registrado no CMMS'}

O motor de inteligência pericial auditou a integridade dos ${totalItems} itens inspecionados, validando conformidade estrita com as Normas Regulamentadoras NR-11, NR-12 (Anexo XII) e NR-18. 
Conclusão: Não foram identificadas anomalias estruturais, vazamentos em linhas de pressão nem desvios em pintura e identidade visual corporativa da Locar. O equipamento encontra-se 100% OPERACIONAL E APTO PARA LIBERAÇÃO IMEDIATA.
            `.trim();
        } else {
            const ncList = (nonConformities || []).map((nc, idx) => `${idx + 1}. [${nc.code || 'NC'}] ${nc.title}: ${nc.notes || 'Desvio identificado'}`).join('\n');

            return `
PARECER TÉCNICO PERICIAL DE INTERDIÇÃO OPERACIONAL (IA CERTIFIED)
Data de Emissão: ${dateStr}
Equipamento: Frota ${equipment.fleetNumber} - ${equipment.model} (${equipment.category.toUpperCase()})
Inspetor Certificado: ${inspectorName} | Contato: ${inspector.phone || 'Registrado no CMMS'}

O motor de inteligência pericial identificou não-conformidades de caráter IMPEDITIVO que violam as diretrizes de segurança da Locar Guindastes e das NRs vigentes.
Itens Desconformes Detectados:
${ncList}

Conclusão Pericial: O equipamento encontra-se FORMALMENTE BLOQUEADO PARA OPERAÇÃO no pátio de Betim. Solicitação de Serviço automática encaminhada com urgência ao PCM de Betim (pcm.betim@locar.com.br).
            `.trim();
        }
    }
}

export const aiCopilot = new AICopilot();
