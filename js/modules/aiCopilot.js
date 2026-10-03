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

    /**
     * Responde dúvidas sobre o sistema, fluxos operacionais, normas e como utilizar
     * @param {string} question - Pergunta formulada pelo usuário
     * @returns {Object} Resposta rica formatada em HTML/Markdown amigável
     */
    askSystemQuestion(question) {
        if (!question || question.trim().length === 0) {
            return {
                text: "Olá! Como posso te ajudar hoje? Você pode me perguntar sobre vistorias, cadastro por CPF/e-mail, regras do PCM, Tolerância Zero ou gestão da frota de Betim!",
                suggestions: [
                    "Como fazer uma inspeção?",
                    "Como cadastrar usuário por CPF ou e-mail?",
                    "O que é a Tolerância Zero?",
                    "Como funciona o fluxo do PCM?"
                ]
            };
        }

        const q = question.toLowerCase().trim();

        // 1. Saudações e Apresentação
        if (q.match(/^(oi|olá|ola|bom dia|boa tarde|boa noite|opa|ei|hey)\b/)) {
            return {
                text: `<strong>Olá! Sou o Copiloto de Inteligência Artificial da Locar Guindastes. 🤖</strong><br><br>
                Estou aqui para orientá-lo sobre todas as funcionalidades do sistema, vistorias técnicas, despacho ao PCM, normas regulamentadoras (NRs) e regras corporativas.<br><br>
                <em>Sobre o que você deseja tirar dúvidas agora?</em>`,
                suggestions: [
                    "Como fazer uma inspeção?",
                    "Como cadastrar usuário por CPF?",
                    "Regras do Administrador Master",
                    "Como funciona a reserva comercial?"
                ]
            };
        }

        // 2. Como fazer inspeção / vistoria técnica
        if (q.includes('como fazer') && (q.includes('inspe') || q.includes('vistoria')) || q.includes('iniciar inspe') || q.includes('passo a passo') || q.includes('como inspecionar')) {
            return {
                text: `<strong>📋 Como Realizar uma Vistoria Técnica:</strong><br><br>
                <strong>1. Localize o Ativo:</strong> Na aba <em>Frota de Betim</em>, busque pela TAG ou filtre por Divisão (PTA ou Guindastes).<br>
                <strong>2. Inicie a Vistoria:</strong> Clique no equipamento desejado e pressione <strong>"Iniciar Vistoria Técnica"</strong> (requer perfil de Inspetor, Gestor ou Admin).<br>
                <strong>3. Preencha os 4 Blocos Normativos:</strong>
                • <em>Estrutural:</em> Chassi, lança, trincas, soldas e cabos.<br>
                • <em>Hidráulico:</em> Cilindros, mangueiras, bombas e estanqueidade.<br>
                • <em>Segurança:</em> Parada de emergência, limites, sapatas e sinalização.<br>
                • <em>Operacional:</em> Comandos, joysticks, baterias e motor.<br>
                <strong>4. Fotos com Carimbo Pericial:</strong> Tire fotos das anomalias diretamente pela câmera do celular/tablet (com registro forense de data, hora e TAG).<br>
                <strong>5. Assinatura e Conclusão:</strong> Assine digitalmente e finalize. Se houver qualquer falha, a <strong>Tolerância Zero</strong> é acionada e o ativo é retido com S.S. imediata para o PCM!`,
                suggestions: [
                    "O que é a Tolerância Zero?",
                    "Como funciona o fluxo do PCM?",
                    "Como validar um laudo por QR Code?"
                ]
            };
        }

        // 3. Cadastro de Usuários por CPF ou E-mail
        if (q.includes('cpf') || q.includes('cadastr') || (q.includes('usuario') && (q.includes('criar') || q.includes('adicionar') || q.includes('importar'))) || q.includes('novo usuario') || q.includes('email') || q.includes('e-mail')) {
            return {
                text: `<strong>👥 Cadastro e Login por CPF ou E-mail:</strong><br><br>
                <strong>Quem pode cadastrar:</strong> Exclusivamente o <strong>Administrador Master (Maikon Pinho)</strong> possui autorização para criar usuários ou alterar perfis/senhas.<br><br>
                <strong>Como Cadastrar:</strong><br>
                1. No cabeçalho, clique em <strong>"+ Carregar Dados"</strong>.<br>
                2. Na aba <em>"1. Carga de Usuários & Perfis"</em>, insira os colaboradores em formato <strong>JSON</strong> ou <strong>CSV</strong>.<br>
                3. Você pode cadastrar informando o <strong>CPF</strong> (ex: <code>123.456.789-00</code> ou apenas os 11 dígitos <code>12345678900</code>) ou <strong>E-mail</strong> corporativo, além de nome, perfil e PIN.<br><br>
                <strong>Como os Usuários Fazem Login:</strong><br>
                Na tela de login, basta digitar o <strong>CPF</strong> (formatado ou só dígitos), o <strong>E-mail</strong> ou a <strong>Matrícula</strong> + o PIN/senha de segurança!`,
                suggestions: [
                    "Quem é o Administrador Master?",
                    "Quais são os perfis de acesso (RBAC)?",
                    "Como resetar ou zerar usuários?"
                ]
            };
        }

        // 4. Administrador Master (Maikon Pinho)
        if (q.includes('admin') || q.includes('maikon') || q.includes('master') || q.includes('soberano') || q.includes('permiss')) {
            return {
                text: `<strong>🛡️ Regras do Administrador Master (Maikon Pinho):</strong><br><br>
                • <strong>Administrador Soberano:</strong> Apenas <strong>Maikon Pinho</strong> (<code>maikon.pinho@locar.com.br</code>) possui o perfil <code>admin</code> oficial com plenos poderes no sistema.<br>
                • <strong>Ações Exclusivas do Admin Master:</strong> Criar colaboradores, redefinir senhas, alterar perfis de acesso e atualizar dados da frota fora dos fluxos regulares.<br>
                • <strong>Regra Estrita de Governança:</strong> Qualquer outro colaborador cadastrado com perfil <code>admin</code> é <strong>automaticamente rebaixado para gestor (manager)</strong>.<br>
                • <strong>Proteção Anti-Força Bruta:</strong> Após 5 tentativas de login incorretas, o sistema aplica um lockout de segurança de 60 segundos.`,
                suggestions: [
                    "Como cadastrar usuário por CPF ou e-mail?",
                    "Quais são os outros perfis de acesso?",
                    "O que é o Modo Consulta Livre?"
                ]
            };
        }

        // 5. Tolerância Zero
        if (q.includes('tolerancia') || q.includes('tolerância') || q.includes('reprovad') || q.includes('bloqueio') || q.includes('interdi')) {
            return {
                text: `<strong>🛑 Política de Tolerância Zero da Locar:</strong><br><br>
                A Locar adota o protocolo de <strong>Tolerância Zero</strong> para falhas que comprometam a integridade física, estabilidade da máquina ou a identidade visual corporativa:<br><br>
                • <strong>Falhas Mecânicas/Hidráulicas Críticas:</strong> Vazamento em cilindros/mangueiras, folgas excessivas, trincas em soldas de lanças ou anomalias nos comandos de emergência (NR-11 e NR-12 Anexo XII).<br>
                • <strong>Avarias Visuais e Decalques:</strong> Lataria amassada, pintura desbotada fora do padrão Locar (Cinza #474444 e Amarelo #FFF212) ou ausência de tabela de carga legível.<br><br>
                <strong>Efeito Imediato:</strong> O equipamento é <strong>bloqueado compulsoriamente</strong>, seu status muda para <code>manutencao</code> e uma Solicitação de Serviço (S.S.) é emitida automaticamente para o PCM da oficina de Betim!`,
                suggestions: [
                    "Como funciona o fluxo do PCM?",
                    "Como fazer uma inspeção?",
                    "Como validar laudo por QR Code?"
                ]
            };
        }

        // 6. PCM / Solicitações de Serviço
        if (q.includes('pcm') || q.includes('solicita') || /\bss\b/.test(q) || q.includes('s.s.') || q.includes('ordem de serviço') || q.includes('manuten') || q.includes('oficina')) {
            return {
                text: `<strong>⚙️ Integração com PCM (Planejamento e Manutenção):</strong><br><br>
                <strong>1. Geração Automática de S.S.:</strong> Sempre que uma máquina é reprovada na vistoria, o sistema cria uma Solicitação de Serviço oficial numerada (ex: <code>SS-PCM-BETIM-2026-001</code>).<br>
                <strong>2. Despacho Rápido:</strong> Com 1 clique, o inspetor pode enviar a S.S. por <strong>E-mail</strong> para <code>pcm.betim@locar.com.br</code> ou via <strong>WhatsApp</strong> para a chefia de oficina.<br>
                <strong>3. Ciclo de Vida da O.S.:</strong><br>
                • <em>Aberta:</em> Aguardando triagem do planejador PCM.<br>
                • <em>Em Planejamento:</em> Separação de peças, sobressalentes e técnicos.<br>
                • <em>Em Execução:</em> Manutenção mecânica/elétrica em andamento.<br>
                • <em>Concluída:</em> Reparo finalizado. A máquina fica disponível para nova vistoria de liberação!`,
                suggestions: [
                    "O que é a Tolerância Zero?",
                    "Como cadastrar usuário do PCM?",
                    "Quantos ativos estão em manutenção em Betim?"
                ]
            };
        }

        // 7. Frota de Betim / Divisões
        if (q.includes('frota') || q.includes('betim') || q.includes('pta') || q.includes('guindaste') || q.includes('quantos') || q.includes('equipamento')) {
            return {
                text: `<strong>🚜 Frota Operacional da Filial Betim/MG:</strong><br><br>
                A base conta com <strong>272 equipamentos reais</strong> cadastrados (Fleet 1 e Fleet 2):<br><br>
                • <strong>Divisão PTA (245 plataformas elevatórias):</strong> Tesouras elétricas/diesel, lanças articuladas e telescópicas das marcas Genie, JLG e Haulotte.<br>
                • <strong>Divisão Guindastes & Pesados (27 ativos):</strong> Guindastes todo-terreno e esteiras (Liebherr, Madal, XCMG), guindautos (Munck) e empilhadeiras pesadas.<br><br>
                <strong>Status em Tempo Real:</strong><br>
                • <em>Disponíveis:</em> Prontos para locação no pátio.<br>
                • <em>Locadas:</em> Em contrato ativo em clientes.<br>
                • <em>Manutenção:</em> Na oficina de Betim com prazo estimado de liberação.<br>
                • <em>Reservadas:</em> Com reserva comercial vinculada.`,
                suggestions: [
                    "Como reservar um equipamento?",
                    "Como exportar relatórios da frota?",
                    "Como filtrar por Divisão PTA?"
                ]
            };
        }

        // 8. Reservas Comerciais & Clientes Tier AA / A
        if (q.includes('reserva') || q.includes('comercial') || q.includes('cliente') || q.includes('tier') || q.includes('locar') || q.includes('alugar')) {
            return {
                text: `<strong>💼 Gestão Comercial de Reservas & Locações:</strong><br><br>
                <strong>Como Reservar:</strong><br>
                1. No menu superior, acerte a visão para <em>Frota Comercial</em>.<br>
                2. Selecione uma máquina com status <strong>DISPONÍVEL</strong> e clique em <strong>"Reservar Equipamento"</strong>.<br>
                3. Informe o cliente e a classificação corporativa (Tier):<br>
                • <strong>Tier AA (Estratégico):</strong> Vale S.A., Petrobras (máquinas com laudo pericial 100% verde).<br>
                • <strong>Tier A (Grandes Contas):</strong> Usiminas, Gerdau, CSN, ArcelorMittal.<br>
                • <strong>Tier B:</strong> Construtoras e locações intermediárias.<br>
                • <strong>Tier C:</strong> Locações spot e novos clientes.<br>
                4. Da reserva, o comercial pode clicar em <strong>"Efetivar Locação"</strong> (gerando contrato ativo) ou <strong>"Cancelar Reserva"</strong>.`,
                suggestions: [
                    "Quem pode fazer reservas?",
                    "Como fazer uma vistoria de devolução?",
                    "Como exportar a frota disponível?"
                ]
            };
        }

        // 9. Normas Regulamentadoras
        if (q.includes('norma') || q.includes('nr') || q.includes('11') || q.includes('12') || q.includes('18') || q.includes('35') || q.includes('nbr')) {
            return {
                text: `<strong>⚖️ Normas Regulamentadoras (NRs) Atendidas:</strong><br><br>
                • <strong>NR-11:</strong> Transporte, movimentação, armazenagem e manuseio de materiais e içamento seguro.<br>
                • <strong>NR-12 (Anexo XII):</strong> Dispositivos de segurança em plataformas móveis de trabalho sobre elevação e guindastes.<br>
                • <strong>NR-18 (Anexo IV):</strong> Condições e meio ambiente de trabalho na indústria da construção.<br>
                • <strong>NR-35:</strong> Trabalho em altura, pontos de ancoragem do cesto e linhas de vida.<br>
                • <strong>ABNT NBR 16776:</strong> Requisitos de projeto, fabricação e inspeção de plataformas elevatórias (PTA).<br>
                • <strong>ABNT NBR 8400 & ASME B30.5:</strong> Cálculo de esforços e diretrizes para guindastes móveis.`,
                suggestions: [
                    "Como fazer uma inspeção?",
                    "O que a Tolerância Zero reprova?",
                    "Como funciona a validação pericial?"
                ]
            };
        }

        // 10. Validação Forense e QR Code
        if (q.includes('qr') || q.includes('qrcode') || q.includes('validar') || q.includes('laudo') || q.includes('hash') || q.includes('forense')) {
            return {
                text: `<strong>🛡️ Validação Pericial & Custódia de Laudo:</strong><br><br>
                • <strong>Número e Hash SHA-256:</strong> Cada laudo concluído no pátio recebe uma numeração única (ex: <code>INSP-LOC-20261003-4896</code>) e uma assinatura criptográfica imutável.<br>
                • <strong>QR Code no Laudo:</strong> O laudo impresso ou em PDF contém um QR Code de verificação instantânea.<br>
                • <strong>Como Conferir:</strong> No topo da página, clique no botão <strong>"Validar Laudo / QR Code"</strong> e digite o número do laudo para atestar se o documento é autêntico, aprovado e sem alterações para auditorias do MTE/clientes!`,
                suggestions: [
                    "Como gerar o PDF do laudo?",
                    "Onde fica o histórico de laudos?",
                    "Como fazer uma inspeção?"
                ]
            };
        }

        // 11. Modo Offline e Sincronização
        if (q.includes('offline') || q.includes('internet') || q.includes('sem rede') || q.includes('sincroniz') || q.includes('conexao')) {
            return {
                text: `<strong>📶 Funcionamento Offline (Offline-First):</strong><br><br>
                • <strong>Trabalhe sem Internet:</strong> O sistema foi projetado para pátios de máquinas e canteiros remotos. Todas as vistorias, fotos e cadastros funcionam 100% offline.<br>
                • <strong>Armazenamento Local Seguro:</strong> Os laudos e fotos são gravados no <strong>IndexedDB</strong> e <strong>LocalStorage</strong> do navegador.<br>
                • <strong>Sincronização Automática:</strong> Assim que o dispositivo restabelecer conexão (Wi-Fi ou 4G/5G), os dados são sincronizados automaticamente com a nuvem (Appwrite Cloud) sem risco de perda!`,
                suggestions: [
                    "Como funciona o login offline?",
                    "Onde as fotos ficam salvas?",
                    "Como fazer uma inspeção?"
                ]
            };
        }

        // 12. Perfis de Acesso (RBAC)
        if (q.includes('perfil') || q.includes('perfis') || q.includes('rbac') || q.includes('papel') || q.includes('papeis') || q.includes('cargo')) {
            return {
                text: `<strong>👔 Perfis de Acesso Corporativos (RBAC):</strong><br><br>
                • 👷 <strong>Inspetor Técnico (<code>inspector</code>):</strong> Realiza vistorias, checklists normativos, tira fotos e assina laudos.<br>
                • ⚙️ <strong>PCM / Manutenção (<code>pcm</code>):</strong> Gerencia Solicitações de Serviço, ordens de reparo e liberação técnica.<br>
                • 📊 <strong>Gestor de Frota (<code>manager</code>):</strong> Cadastro de equipamentos, auditorias, exportação de relatórios e controle geral.<br>
                • 💼 <strong>Comercial (<code>commercial</code>):</strong> Reservas de equipamentos, contratos e gestão de clientes por Tier.<br>
                • 🛡️ <strong>Administrador Geral (<code>admin</code>):</strong> Soberano exclusivo (Maikon Pinho) com acesso pleno irrestrito.`,
                suggestions: [
                    "Como cadastrar usuário por CPF ou e-mail?",
                    "Como alternar de perfil rapidamente?",
                    "Regras do Administrador Master"
                ]
            };
        }

        // 13. Relato de Falhas, Bugs e Sugestões ao Administrador
        if (q.includes('falha') || q.includes('bug') || q.includes('erro') || q.includes('sugest') || q.includes('sugestão') || q.includes('problema') || q.includes('reclam') || q.includes('suporte')) {
            return {
                text: `<strong>📢 Relato de Falhas, Bugs e Sugestões:</strong><br><br>
                Você pode enviar informativos e relatórios diretamente ao <strong>Administrador Geral (Maikon Pinho)</strong>:<br><br>
                • <strong>Botão no Cabeçalho / Rodapé:</strong> Clique em <strong>"💡 Sugestões / Falhas"</strong> no topo da tela ou no link do rodapé.<br>
                • <strong>Categorias:</strong> Relate falhas técnicas (bugs), envie sugestões de melhoria, tire dúvidas ou faça elogios.<br>
                • <strong>Despacho Oficial por E-mail:</strong> O sistema gera um protocolo exclusivo (ex: <code>INF-LOC-20261003-8821</code>) e dispara automaticamente por e-mail para <code>maikon.pinho@locar.com.br</code>.<br>
                • <strong>Despacho via WhatsApp:</strong> Há também um botão direto para enviar a mensagem formatada no WhatsApp corporativo!`,
                suggestions: [
                    "Quem é o Administrador Master?",
                    "Como cadastrar usuário por CPF ou e-mail?",
                    "Como fazer uma inspeção?"
                ]
            };
        }

        // 14. Resposta Inteligente Genérica / Contextual

        return {
            text: `<strong>💡 Informações do Sistema de Inspeção Locar:</strong><br><br>
            Entendi sua dúvida sobre <em>"${escapeHTML(question)}"</em>.<br><br>
            O Sistema de Inspeção e Qualidade de Frota da Locar Guindastes atende às filiais operacionais integrando:<br>
            • <strong>Vistorias Técnicas</strong> com checklists normativos (NR-11, NR-12, NR-18, NR-35 e NBR 16776).<br>
            • <strong>Tolerância Zero</strong> para retenção e abertura imediata de S.S. para o PCM de Betim.<br>
            • <strong>Cadastro e Login Flexíveis</strong> informando CPF ou E-mail corporativo com PIN criptografado SHA-256.<br>
            • <strong>Governança Estrita</strong> com Maikon Pinho como Administrador Soberano.<br>
            • <strong>Gestão de Frota e Reservas</strong> com classificação de clientes por Tier AA/A/B/C.<br><br>
            <em>Escolha um dos tópicos rápidos abaixo ou formule outra pergunta detalhada:</em>`,
            suggestions: [
                "Como fazer uma inspeção?",
                "Como cadastrar usuário por CPF ou e-mail?",
                "Como funciona o fluxo com o PCM?",
                "Regras do Administrador Master"
            ]
        };
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export const aiCopilot = new AICopilot();

