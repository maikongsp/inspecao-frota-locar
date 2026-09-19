/**
 * Sistema de Inspeção Locar Guindastes e Transportes Intermodais
 * Banco de Critérios Normativos e Checklists Técnicos
 * Normas: NR-11, NR-12, NR-18 (Anexo IV), NR-35, ABNT NBR 16776, NBR 8400, ASME B30.5
 */

export const CHECKLIST_NORMS = {
  pta: {
    name: 'Plataforma de Trabalho Aéreo (PTA / MEWP)',
    normativeRef: 'NR-18 (Anexo IV), NR-12, NR-35 e ABNT NBR 16776',
    description: 'Inspeção diária/periódica de plataformas tesoura, articuladas e telescópicas.',
    sections: [
      {
        id: 'visual_identity',
        title: '1. Padrão Visual e Identidade Locar (Critério Eliminatório)',
        description: 'Verificação visual rigorosa da lataria, pintura e padronização corporativa.',
        isCritical: true,
        items: [
          {
            id: 'pta_vis_01',
            label: 'Pintura e Lataria sem amassados, deformações ou corrosão',
            norm: 'Padrão de Qualidade Locar & NR-12',
            hint: 'A carenagem deve estar íntegra, na cor cinza chumbo e amarelo Locar, sem avarias de impacto ou soldas clandestinas.',
            requiresPhoto: true,
            photoLabel: 'Foto geral da carenagem/lataria'
          },
          {
            id: 'pta_vis_02',
            label: 'Adesivos Oficiais "LOCAR" íntegros e alinhados nas laterais e cesto',
            norm: 'Identidade Visual Corporativa Locar',
            hint: 'Logotipo legível, sem partes rasgadas, desbotadas ou com fita adesiva improvisada.',
            requiresPhoto: true,
            photoLabel: 'Foto do logotipo Locar na máquina'
          },
          {
            id: 'pta_vis_03',
            label: 'Tabela de Carga Máxima Admissível (SWL) e Lotação de Pessoas legível',
            norm: 'NR-18 Anexo IV & NBR 16776',
            hint: 'Adesivo com capacidade máxima em kg e quantidade máxima de ocupantes na cesta perfeitamente visível.',
            requiresPhoto: true,
            photoLabel: 'Foto da placa de capacidade e ocupantes'
          },
          {
            id: 'pta_vis_04',
            label: 'Adesivos de Advertência de Riscos (Esmagamento, Choque Elétrico e Queda)',
            norm: 'NR-12 e NR-18',
            hint: 'Simbologia de alerta de perigo em alta voltagem e áreas de prensamento presentes e visíveis.',
            requiresPhoto: false
          },
          {
            id: 'pta_vis_05',
            label: 'Adesivos com Telefones de Emergência e SOS Operacional Locar',
            norm: 'Procedimento Operacional Locar',
            hint: 'Etiqueta com número da central de assistência técnica e supervisão de campo legível.',
            requiresPhoto: false
          },
          {
            id: 'pta_vis_06',
            label: 'Faixas Refletivas de Segurança no contorno da base e contrapeso',
            norm: 'NR-18 Anexo IV',
            hint: 'Faixas microprismáticas refletivas sem descolamento ou sujeira impeditiva.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'mechanical_structural',
        title: '2. Inspeção Estrutural, Mecânica e Hidráulica',
        description: 'Integridade física do chassi, lanças, cilindros e componentes de sustentação.',
        isCritical: true,
        items: [
          {
            id: 'pta_mec_01',
            label: 'Braços de elevação / Lança telescópica sem trincas nas soldas ou empenos',
            norm: 'NBR 16776 & NR-12',
            hint: 'Vistoriar minuciosamente articulações, olhais e soldas principais com lanterna.',
            requiresPhoto: true,
            photoLabel: 'Foto da estrutura de elevação/lança'
          },
          {
            id: 'pta_mec_02',
            label: 'Pinos, buchas e travas mecânicas com contrapinos de segurança instalados',
            norm: 'NR-12.87',
            hint: 'Ausência de folgas excessivas e presença de todos os cupilhas/travas originais.',
            requiresPhoto: false
          },
          {
            id: 'pta_mec_03',
            label: 'Cilindros hidráulicos de elevação e extensão isentos de vazamentos ou riscos na haste',
            norm: 'NR-12 e NBR 16776',
            hint: 'Hastes cromadas limpas, retentores secos e ausência de gotejamento de fluido hidráulico.',
            requiresPhoto: true,
            photoLabel: 'Foto dos cilindros hidráulicos'
          },
          {
            id: 'pta_mec_04',
            label: 'Mangueiras e conexões hidráulicas sem atrito, esmagamento ou ressecamento',
            norm: 'NR-12.85',
            hint: 'Mangueiras acondicionadas na esteira guia (cat-track) sem dobras forçadas.',
            requiresPhoto: false
          },
          {
            id: 'pta_mec_05',
            label: 'Pneus / Rodas maciças ou não-marcantes sem rasgos ou delaminação',
            norm: 'Manual do Fabricante',
            hint: 'Aperto dos parafusos de roda e integridade da banda de rodagem.',
            requiresPhoto: false
          },
          {
            id: 'pta_mec_06',
            label: 'Pontos de Ancoragem para Cinto Paraquedista NR-35 no cesto inspecionados',
            norm: 'NR-35 & NR-18 Anexo IV',
            hint: 'Olhais certificados, com gravação de capacidade (mínimo 15 kN ou 1 pessoa por ponto).',
            requiresPhoto: true,
            photoLabel: 'Foto do olhal de ancoragem no cesto'
          }
        ]
      },
      {
        id: 'safety_devices',
        title: '3. Dispositivos de Proteção e Normas Regulamentadoras',
        description: 'Elementos de segurança ativa, intertravamentos e proteções coletivas.',
        isCritical: true,
        items: [
          {
            id: 'pta_seg_01',
            label: 'Botão de Parada de Emergência no Painel da Base funcional',
            norm: 'NR-12.56 & NR-18',
            hint: 'Tipo cogumelo vermelho com retenção mecânica. Deve desligar o motor e frear instantaneamente.',
            requiresPhoto: true,
            photoLabel: 'Foto do painel de controle da base'
          },
          {
            id: 'pta_seg_02',
            label: 'Botão de Parada de Emergência no Painel do Cesto / Plataforma funcional',
            norm: 'NR-12.56 & NR-18',
            hint: 'Acionamento imediato corta qualquer movimento e comandos da plataforma.',
            requiresPhoto: true,
            photoLabel: 'Foto do painel de controle da cesta'
          },
          {
            id: 'pta_seg_03',
            label: 'Inclinômetro / Sensor de Nível (Tilt Sensor) sonoro e bloqueio ativo',
            norm: 'NBR 16776 & NR-18',
            hint: 'Deve soar alarme e impedir elevação/translação caso a inclinação exceda o limite do fabricante (3° a 5°).',
            requiresPhoto: false
          },
          {
            id: 'pta_seg_04',
            label: 'Porta de acesso do cesto com mola de retorno e fecho automático (fechamento gravítico)',
            norm: 'NR-18 Anexo IV',
            hint: 'Não pode ser mantida aberta com arame ou cordas; fechamento espontâneo obrigatório.',
            requiresPhoto: false
          },
          {
            id: 'pta_seg_05',
            label: 'Alarme Sonoro e Giroflex visual durante movimentos de translação e descida',
            norm: 'NR-12 & NR-18',
            hint: 'Sinalização audiovisual intermitente automática de advertência.',
            requiresPhoto: false
          },
          {
            id: 'pta_seg_06',
            label: 'Válvula de retenção antiqueda dos cilindros testada (proteção contra ruptura de mangueira)',
            norm: 'NBR 16776',
            hint: 'Em caso de perda de pressão hidráulica, a cesta deve manter a cota com estabilidade.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'functional_tests',
        title: '4. Testes Funcionais Obrigatórios de Todas as Operações',
        description: 'Execução dinâmica em vazio e verificação de resposta dos comandos (100% de aprovação obrigatória).',
        isCritical: true,
        isOperationTest: true,
        items: [
          {
            id: 'pta_tst_01',
            label: 'Teste de Elevação e Descida Total pelo comando da Base',
            norm: 'NBR 16776',
            hint: 'Verificar suavidade, ausência de ruídos estranhos e parada precisa na altura máxima.',
            requiresPhoto: false
          },
          {
            id: 'pta_tst_02',
            label: 'Teste de Elevação e Descida Total pelo comando da Cesta',
            norm: 'NBR 16776',
            hint: 'Resposta progressiva do joystick, sem trancos ou atrasos perigosos.',
            requiresPhoto: false
          },
          {
            id: 'pta_tst_03',
            label: 'Teste de Giro de Mesa / Torre e Nivelamento Automático do Cesto',
            norm: 'NBR 16776',
            hint: 'Giro suave e cesto permanecendo horizontal em qualquer ângulo de lança.',
            requiresPhoto: false
          },
          {
            id: 'pta_tst_04',
            label: 'Teste de Translação e Direção com redução automática de velocidade em cota alta',
            norm: 'NBR 16776',
            hint: 'Com a lança elevada, a máquina deve transladar apenas na velocidade lenta (creeper).',
            requiresPhoto: false
          },
          {
            id: 'pta_tst_05',
            label: 'Teste de Sistema de Descida de Emergência Manual / Bateria Auxiliar',
            norm: 'NR-18 Anexo IV & NBR 16776',
            hint: 'Acionar a válvula manual de alívio ou bomba elétrica de 12V da base para descer a cesta.',
            requiresPhoto: true,
            photoLabel: 'Foto do acionamento da descida de emergência'
          },
          {
            id: 'pta_tst_06',
            label: 'Teste do Pedal de Homem Morto (Foot Switch) / Dispositivo de Habilitação',
            norm: 'NR-12 & NBR 16776',
            hint: 'Nenhum comando deve funcionar sem que o operador mantenha o pedal/gatilho pressionado.',
            requiresPhoto: false
          }
        ]
      }
    ]
  },

  guindaste: {
    name: 'Guindaste (Rodoviário, RT, Telescópico ou Articulado)',
    normativeRef: 'NR-11, NR-12, ABNT NBR 8400, ASME B30.5',
    description: 'Inspeção rigorosa pré-operacional de guindastes móveis e caminhões com guindauto.',
    sections: [
      {
        id: 'visual_identity',
        title: '1. Padrão Visual e Identidade Locar (Critério Eliminatório)',
        description: 'Inspeção estética industrial, carenagens e padrão de identidade visual Locar.',
        isCritical: true,
        items: [
          {
            id: 'gui_vis_01',
            label: 'Pintura padrão Locar (Amarelo / Chumbo) sem mossas estruturais ou corrosão',
            norm: 'Padrão Locar & NR-11',
            hint: 'Chassi, torre e lanças com pintura uniforme e livre de oxidação evidente ou amassados por colisão.',
            requiresPhoto: true,
            photoLabel: 'Foto da visão geral do guindaste'
          },
          {
            id: 'gui_vis_02',
            label: 'Logomarca "Locar Guindastes e Transportes Intermodais" legível na lança e cabine',
            norm: 'Identidade Corporativa Locar',
            hint: 'Adesivos corporativos aplicados conforme padrão de engenharia de frota Locar.',
            requiresPhoto: true,
            photoLabel: 'Foto da logomarca oficial Locar na lança'
          },
          {
            id: 'gui_vis_03',
            label: 'Tabelas de Carga Oficiais do Fabricante plastificadas e legíveis na cabine',
            norm: 'NR-11 & ASME B30.5',
            hint: 'Gráfico de raio x capacidade e configurações de contrapeso acessíveis ao operador.',
            requiresPhoto: true,
            photoLabel: 'Foto da tabela de carga na cabine'
          },
          {
            id: 'gui_vis_04',
            label: 'Identificação destacada da Capacidade Máxima Nominal no moitão e na torre',
            norm: 'NR-11.1.3.1',
            hint: 'Ex: "CAPACIDADE 75 TONELADAS" legível a distância de solo.',
            requiresPhoto: true,
            photoLabel: 'Foto da identificação de capacidade no moitão'
          },
          {
            id: 'gui_vis_05',
            label: 'Faixas Refletivas de Segurança nas patolas e contrapeso traseiro',
            norm: 'CONTRAN & NR-11',
            hint: 'Sinalização refletiva zebrada padrão segurança veicular e de içamento.',
            requiresPhoto: false
          },
          {
            id: 'gui_vis_06',
            label: 'Adesivo de Advertência de Risco com Linhas de Alta Tensão e Raio de Giro',
            norm: 'NR-10 e NR-12',
            hint: 'Avisos de distância mínima de segurança de linhas energizadas.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'mechanical_structural',
        title: '2. Inspeção Estrutural, Cabos, Moitão e Sistema de Patolamento',
        description: 'Componentes de içamento, cabos de aço e fundação móvel do equipamento.',
        isCritical: true,
        items: [
          {
            id: 'gui_mec_01',
            label: 'Lança telescópica / treliça sem empenamento, trincas em soldas ou amassados nas seções',
            norm: 'ASME B30.5 & NBR 8400',
            hint: 'Inspecionar as almofadas de deslizamento (wear pads) e ausência de torções.',
            requiresPhoto: true,
            photoLabel: 'Foto das seções da lança estendida'
          },
          {
            id: 'gui_mec_02',
            label: 'Cabo de aço de elevação principal e auxiliar conforme critérios da ISO 4309',
            norm: 'ISO 4309 & NR-11',
            hint: 'Sem gaiola de passarinho, arames rompidos, dobras (kinks), corrosão ou redução de diâmetro.',
            requiresPhoto: true,
            photoLabel: 'Foto do cabo de aço no tambor do guincho'
          },
          {
            id: 'gui_mec_03',
            label: 'Moitão, gancho com trava de segurança funcional e polias sem desgastes anormais',
            norm: 'NR-11.1.3 & ASME B30.10',
            hint: 'Gancho sem abertura excessiva de garganta e girando livremente no rolamento axial.',
            requiresPhoto: true,
            photoLabel: 'Foto do conjunto do moitão e trava'
          },
          {
            id: 'gui_mec_04',
            label: 'Vigas e cilindros de patolas estabilizadoras sem vazamentos ou empenamentos',
            norm: 'NBR 8400 & NR-12',
            hint: 'Cilindros verticais não devem apresentar afundamento espontâneo nem vazamento nos retentores.',
            requiresPhoto: true,
            photoLabel: 'Foto das patolas e sapatas estendidas'
          },
          {
            id: 'gui_mec_05',
            label: 'Pranchas de apoio de patola (pads de madeira/polietileno) íntegras e presentes',
            norm: 'Procedimento Rigging Locar',
            hint: 'Conjunto completo de pranchas dimensionadas para distribuição de pressão no solo.',
            requiresPhoto: false
          },
          {
            id: 'gui_mec_06',
            label: 'Coroa de giro e parafusos de fixação sem folga axial/radial ou dentes lascados',
            norm: 'Manual do Fabricante',
            hint: 'Graxa lubrificante adequada na cremalheira e pinhão de giro.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'safety_devices',
        title: '3. Dispositivos de Segurança, LMI e Instrumentação',
        description: 'Sensores de momento de carga, fins de curso e proteções ativas contra tombamento.',
        isCritical: true,
        items: [
          {
            id: 'gui_seg_01',
            label: 'LMI (Indicador de Momento de Carga) operacional com display sem falhas de calibração',
            norm: 'ASME B30.5 & NR-12',
            hint: 'Leitura correta de raio, comprimento de lança, ângulo e peso no gancho.',
            requiresPhoto: true,
            photoLabel: 'Foto do painel do computador de bordo LMI'
          },
          {
            id: 'gui_seg_02',
            label: 'Chave Fim de Curso do Moitão (Anti-Two Block / A2B) com peso e interruptor operacionais',
            norm: 'ASME B30.5 & NR-12',
            hint: 'Deve bloquear imediatamente o içamento e o telescopamento para fora quando o peso é levantado.',
            requiresPhoto: true,
            photoLabel: 'Foto da chave A2B na ponta da lança'
          },
          {
            id: 'gui_seg_03',
            label: 'Anemômetro instalado no topo da lança com indicação em tempo real na cabine',
            norm: 'NBR 8400 & NR-18',
            hint: 'Leitura de velocidade do vento em m/s ou km/h para interrupção de operação com ventos > 38 km/h.',
            requiresPhoto: false
          },
          {
            id: 'gui_seg_04',
            label: 'Nível de bolha físico e inclinômetro eletrônico da base calibrados',
            norm: 'ASME B30.5',
            hint: 'Permite nivelamento a 0° de prumo antes do início de qualquer içamento.',
            requiresPhoto: false
          },
          {
            id: 'gui_seg_05',
            label: 'Extintores de incêndio (cabine do operador e chassi) carregados e dentro da validade',
            norm: 'NR-23',
            hint: 'Manômetro no verde e selo do INMETRO válido.',
            requiresPhoto: false
          },
          {
            id: 'gui_seg_06',
            label: 'Botão de parada de emergência na cabine e acionamento sonoro de buzina/giroflex',
            norm: 'NR-12',
            hint: 'Interrupção instantânea do motor diesel e bloqueio de fluido nas válvulas proporcionais.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'functional_tests',
        title: '4. Testes Funcionais Obrigatórios de Todas as Operações',
        description: 'Simulação dinâmica completa de manobras de içamento e estabilidade.',
        isCritical: true,
        isOperationTest: true,
        items: [
          {
            id: 'gui_tst_01',
            label: 'Teste de Patolamento total e Nivelamento da mesa de giro',
            norm: 'ASME B30.5',
            hint: 'Extensão das 4 sapatas até retirada completa dos pneus do solo e nivelamento perfeito.',
            requiresPhoto: true,
            photoLabel: 'Foto do guindaste 100% patolado e nivelado'
          },
          {
            id: 'gui_tst_02',
            label: 'Teste de Elevação e Telescopamento da lança em extensão máxima',
            norm: 'ASME B30.5',
            hint: 'Sincronismo dos cabos/cilindros internos de telescopamento sem travamentos.',
            requiresPhoto: false
          },
          {
            id: 'gui_tst_03',
            label: 'Teste de Giro de 360° da torre com atuação do freio mecânico de giro',
            norm: 'NBR 8400',
            hint: 'Giro estável, sem solavancos, e parada precisa ao travar o pedal/alavanca de freio.',
            requiresPhoto: false
          },
          {
            id: 'gui_tst_04',
            label: 'Teste de Içamento e Descida do Guincho Principal com teste de retenção do freio de carga',
            norm: 'ASME B30.5',
            hint: 'O freio de retenção do tambor deve segurar a carga sem escorregamento milimétrico.',
            requiresPhoto: false
          },
          {
            id: 'gui_tst_05',
            label: 'Teste de Corte Automático da Chave A2B sob acionamento manual',
            norm: 'NR-12 & ASME B30.5',
            hint: 'Erguer o peso do A2B manualmente e confirmar corte imediato das funções agressivas.',
            requiresPhoto: true,
            photoLabel: 'Foto do teste de acionamento do A2B com alarme'
          },
          {
            id: 'gui_tst_06',
            label: 'Teste de Direção, Frenagem de Serviço e Estacionamento do veículo/chassi',
            norm: 'CTB & NR-12',
            hint: 'Frenagem pneumática eficiente com pressão estável nos reservatórios de ar.',
            requiresPhoto: false
          }
        ]
      }
    ]
  },

  empilhadeira: {
    name: 'Empilhadeira (Combustão GLP/Diesel ou Elétrica)',
    normativeRef: 'NR-11, NR-12, ABNT NBR 15570',
    description: 'Inspeção técnica rigorosa de empilhadeiras industriais e de armazém.',
    sections: [
      {
        id: 'visual_identity',
        title: '1. Padrão Visual e Identidade Locar (Critério Eliminatório)',
        description: 'Verificação estética, carenagem sem avarias e sinalização institucional Locar.',
        isCritical: true,
        items: [
          {
            id: 'emp_vis_01',
            label: 'Pintura corporativa padrão Locar sem amassados profundos, ferrugem ou riscos graves',
            norm: 'Padrão Visual Locar & NR-11',
            hint: 'Carenagem do contrapeso e laterais impecáveis, sem marcas de colisões contra porta-paletes.',
            requiresPhoto: true,
            photoLabel: 'Foto geral da empilhadeira'
          },
          {
            id: 'emp_vis_02',
            label: 'Logomarca oficial "Locar" íntegra nas duas laterais e contrapeso',
            norm: 'Identidade Corporativa Locar',
            hint: 'Adesivos nítidos e limpos, sem descolamento ou fita adesiva de reparo.',
            requiresPhoto: true,
            photoLabel: 'Foto do logotipo Locar na carenagem'
          },
          {
            id: 'emp_vis_03',
            label: 'Diagrama / Placa de Capacidade Residual conforme elevação e centro de carga (500mm)',
            norm: 'NR-11 & NR-12',
            hint: 'Placa metálica ou adesivo inviolável legível contendo curva de peso x altura dos garfos.',
            requiresPhoto: true,
            photoLabel: 'Foto da placa de capacidade residual'
          },
          {
            id: 'emp_vis_04',
            label: 'Adesivos de Advertência de Riscos (Atropelamento, Tombo Lateral e Risco nos Garfos)',
            norm: 'NR-12',
            hint: 'Avisos de advertência para pedestres e proibição de carona em local visível.',
            requiresPhoto: false
          },
          {
            id: 'emp_vis_05',
            label: 'Faixas Refletivas de Segurança no contrapeso traseiro',
            norm: 'NR-11 & NR-12',
            hint: 'Faixas refletivas zebradas vermelha/branca ou amarela/preta.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'mechanical_structural',
        title: '2. Inspeção de Garfos, Correntes, Mastro e Sistema Hidráulico',
        description: 'Órgãos de movimentação e elevação de carga e integridade mecânica.',
        isCritical: true,
        items: [
          {
            id: 'emp_mec_01',
            label: 'Garfos de carga sem trincas, alinhados e com desgaste de talão inferior a 10%',
            norm: 'ISO 5057 & NR-11',
            hint: 'Medição com paquímetro/calibre de garfo; ausência de trincas na curvatura do talão.',
            requiresPhoto: true,
            photoLabel: 'Foto dos garfos e do talão de apoio'
          },
          {
            id: 'emp_mec_02',
            label: 'Correntes de elevação do mastro tensionadas por igual, lubrificadas e sem elos trincados',
            norm: 'NR-11 & NR-12',
            hint: 'Alongamento máximo de 3%; lubrificação adequada com óleo de cadeia penetrante.',
            requiresPhoto: true,
            photoLabel: 'Foto das correntes de elevação'
          },
          {
            id: 'emp_mec_03',
            label: 'Mastro e trilhos de rolamento sem folgas anormais e com batentes íntegros',
            norm: 'NR-11',
            hint: 'Roldanas sem travamento e roletes ajustados nos trilhos internos e externos.',
            requiresPhoto: false
          },
          {
            id: 'emp_mec_04',
            label: 'Cilindros de elevação e inclinação sem vazamentos nas gaxetas ou riscos na haste',
            norm: 'NR-12',
            hint: 'Secura total nos retentores sob pressão de trabalho.',
            requiresPhoto: true,
            photoLabel: 'Foto dos cilindros do mastro'
          },
          {
            id: 'emp_mec_05',
            label: 'Pneus (pneumáticos ou superelásticos) sem arames expostos ou desgaste excessivo',
            norm: 'Manual do Fabricante',
            hint: 'Banda de rodagem acima da linha de desgaste de segurança (linha 60J).',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'safety_devices',
        title: '3. Dispositivos de Proteção e Normas Regulamentadoras',
        description: 'Proteção do operador, intertravamentos elétricos e sinalização de pedestres.',
        isCritical: true,
        items: [
          {
            id: 'emp_seg_01',
            label: 'Estrutura Protetora do Operador (ROPS / FOPS / Santo Antônio) sem danos ou cortes',
            norm: 'NR-11.1.5 & NR-12',
            hint: 'Grelha superior íntegra para impedir queda de caixas/fardos sobre a cabeça do operador.',
            requiresPhoto: true,
            photoLabel: 'Foto da cabine protetora ROPS/FOPS'
          },
          {
            id: 'emp_seg_02',
            label: 'Cinto de Segurança retrátil de 2 pontos com sensor de acoplamento funcional',
            norm: 'NR-11 & NR-12',
            hint: 'Travamento inercial eficiente e aviso sonoro/corte de tração se o cinto estiver solto.',
            requiresPhoto: false
          },
          {
            id: 'emp_seg_03',
            label: 'Sensor de Presença no Assento do Operador (corte de tração e elevação)',
            norm: 'NR-12.86',
            hint: 'Se o operador levantar do banco, a máquina deve interromper tração e movimentos do mastro.',
            requiresPhoto: false
          },
          {
            id: 'emp_seg_04',
            label: 'Blue Spot (farol de advertência azul para pedestres) e Giroflex estroboscópico ativos',
            norm: 'NR-11 & Diretriz Locar',
            hint: 'Luz azul projetada a 4-5 metros de distância no piso anunciando a aproximação da empilhadeira.',
            requiresPhoto: true,
            photoLabel: 'Foto do feixe Blue Spot e giroflex ligados'
          },
          {
            id: 'emp_seg_05',
            label: 'Buzina e Alarme Sonoro de Marcha à Ré operacionais',
            norm: 'NR-11.1.6',
            hint: 'Volume sonoro claro e audível acima do ruído de fundo do pátio/armazém.',
            requiresPhoto: false
          },
          {
            id: 'emp_seg_06',
            label: 'Extintor de Incêndio tipo Pó ABC fixado, pressurizado e com lacre intacto',
            norm: 'NR-23',
            hint: 'Manômetro apontando no arco verde e suporte com trava rápida de fácil alcance.',
            requiresPhoto: false
          }
        ]
      },
      {
        id: 'functional_tests',
        title: '4. Testes Funcionais Obrigatórios de Todas as Operações',
        description: 'Verificação em movimento e teste de retenção hidráulica e frenagem mecânica.',
        isCritical: true,
        isOperationTest: true,
        items: [
          {
            id: 'emp_tst_01',
            label: 'Teste de Elevação Total e Descida dos garfos até a altura máxima do mastro',
            norm: 'NR-11',
            hint: 'Movimento contínuo sem trancos e acionamento dos batentes de fim de curso.',
            requiresPhoto: false
          },
          {
            id: 'emp_tst_02',
            label: 'Teste de Inclinação do mastro para frente e para trás e deslocamento lateral dos garfos',
            norm: 'NR-11',
            hint: 'Válvula de retenção não permitindo escorregamento dos cilindros de inclinação.',
            requiresPhoto: false
          },
          {
            id: 'emp_tst_03',
            label: 'Teste de Deslocamento Frente / Ré e Frenagem de Serviço em velocidade máxima',
            norm: 'NR-11 & NR-12',
            hint: 'Frenagem progressiva e uniforme em ambas as rodas sem puxar para os lados.',
            requiresPhoto: false
          },
          {
            id: 'emp_tst_04',
            label: 'Teste do Freio de Estacionamento mecânico/eletromagnético em rampa ou esforço',
            norm: 'NR-11',
            hint: 'Alavanca ou freio elétrico garantindo imobilização completa do equipamento.',
            requiresPhoto: false
          },
          {
            id: 'emp_tst_05',
            label: 'Teste de Bloqueio Imediato pelo Botão Geral de Desligamento de Emergência',
            norm: 'NR-12.56',
            hint: 'Corte total da alimentação elétrica e imobilização do trem de força.',
            requiresPhoto: true,
            photoLabel: 'Foto do acionamento do botão de emergência'
          }
        ]
      }
    ]
  }
};
