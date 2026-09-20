/**
 * Classificação Corporativa e Níveis de Rigor Técnico de Clientes
 * Locar Guindastes e Transportes Intermodais - Filial Betim / MG
 */

export const CLIENT_TIERS = {
  AA: {
    id: 'AA',
    code: 'AA',
    name: 'Clientes AA - Grandes Players',
    shortLabel: 'Cliente AA',
    badgeLabel: '💎 AA - Grande Player',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    icon: '💎',
    profile: 'Grandes Players da Mineração, Siderurgia, Celulose e Óleo & Gás',
    rigorLevel: 'Rigor Máximo (Tolerância Zero Absoluta)',
    description: 'Empresas multinacionais e gigantes industriais (Vale, Usiminas, Anglo American, ArcelorMittal, CSN, Gerdau, Petrobras, Samarco) com manuais estritos de auditoria e segurança operacional de ponta.',
    quickClients: [
      'Vale S.A.',
      'Usiminas',
      'Anglo American',
      'ArcelorMittal',
      'CSN (Companhia Siderúrgica Nacional)',
      'Gerdau',
      'Petrobras',
      'Samarco Mineração',
      'Kinross Gold'
    ],
    technicalRequirements: [
      'Kit Mineração completo instalado e operacional',
      'Telemetria e tacógrafo calibrados com rastreamento ativo',
      'Laudo técnico pericial de conformidade com ART (Anotação de Responsabilidade Técnica)',
      'Cintos de segurança de 3 ou 4 pontos com sensor de travamento',
      'Sistema de bloqueio de energias perigosas LOTO (Lockout/Tagout)',
      'Iluminação auxiliar Blue Light / Strobo LED 360°',
      'Pneus e rodantes sem recauchutagem dianteira e travas de porca de roda',
      'Ensaios Não Destrutivos (END) de olhais, ganchos e cabo de aço vigentes'
    ]
  },

  A: {
    id: 'A',
    code: 'A',
    name: 'Clientes A - Terceiros de Grandes Players',
    shortLabel: 'Cliente A',
    badgeLabel: '⭐ A - Terceiro Grandes Players',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    icon: '⭐',
    profile: 'Empreiteiras, Montadoras Industriais e Prestadoras de Serviço',
    rigorLevel: 'Alto Rigor Técnico (Homologação Conforme o Contratante Principal)',
    description: 'Empresas terceirizadas e consórcios que operam alocados dentro das unidades fabris ou minas dos grandes players, sujeitas a vistorias e mobilizações conjuntas de segurança.',
    quickClients: [
      'Manserv Industrial (Vale)',
      'Andrade Gutierrez (Anglo American)',
      'Tenenge / Engevix (Usiminas)',
      'Camargo Corrêa Infra (CSN)',
      'Integral Engenharia (ArcelorMittal)',
      'Constrar Manutenção Industrial',
      'Consórcio Mineração Minas'
    ],
    technicalRequirements: [
      'Homologação prévia no padrão de segurança do grande player contratante',
      'Checklist de mobilização de terceiros 100% sem pendências impeditivas',
      'Documentação técnica, manuais de operação e tabelas de carga visíveis',
      'Equipamentos de segurança coletiva e individual de ponta',
      'Certificados de calibração vigentes de anemômetro e sensores de momento'
    ]
  },

  B: {
    id: 'B',
    code: 'B',
    name: 'Clientes B - Obras Públicas & Infraestrutura',
    shortLabel: 'Cliente B',
    badgeLabel: '🏛️ B - Obras Públicas',
    color: '#C084FC',
    bgColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: 'rgba(192, 132, 252, 0.45)',
    icon: '🏛️',
    profile: 'Prefeituras, Concessionárias Rodoviárias, Autarquias e Infraestrutura',
    rigorLevel: 'Rigor Técnico Moderado / Obras Civis e Viárias',
    description: 'Órgãos governamentais, prefeituras municipais, órgãos viários (DER-MG, DNIT), saneamento (Copasa) e empreiteiras de obras de infraestrutura urbana.',
    quickClients: [
      'Prefeitura Municipal de Betim',
      'Prefeitura Municipal de Belo Horizonte',
      'DER-MG (Dep. Estradas de Rodagem)',
      'DNIT (Infraestrutura de Transportes)',
      'Copasa - Saneamento de Minas Gerais',
      'Concessionária Via 040 / EPR',
      'Prefeitura Municipal de Contagem'
    ],
    technicalRequirements: [
      'Conformidade integral com NR-11 (Transporte/Movimentação), NR-12 (Máquinas) e NR-18 (Construção)',
      'Sinalização viária de advertência conforme normas de trânsito locais',
      'Extintor de incêndio pressurizado e inspecionado',
      'Plano de manutenção preventiva preventiva atualizado',
      'Testes de comandos operacionais e parada de emergência'
    ]
  },

  C: {
    id: 'C',
    code: 'C',
    name: 'Clientes C - Locação de Frotas Funcionais',
    shortLabel: 'Cliente C',
    badgeLabel: '📦 C - Frotas Funcionais',
    color: '#34D399',
    bgColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
    icon: '📦',
    profile: 'Galpões Logísticos, Manutenção Predial, Eventos e Indústria Leve',
    rigorLevel: 'Rigor Funcional Básico / Operação Pátio & Manuseio Comercial',
    description: 'Locação comercial voltada para movimentação interna funcional em centros de distribuição, montagem de estruturas de eventos, instalações elétricas e reformas prediais.',
    quickClients: [
      'Galpão Logístico Betim Distribuição',
      'Construtora Residencial & Predial',
      'Empresa de Instalações Elétricas & Iluminação',
      'Montagem de Eventos & Estruturas Metálicas',
      'Centro Industrial Contagem',
      'Manutenção Predial & Fachadas'
    ],
    technicalRequirements: [
      'Inspeção funcional completa de joystick, comandos e buzina',
      'Integridade estrutural da lança, chassi e estabilizadores',
      'Baterias / motor em perfeito estado sem vazamento de fluidos',
      'Pneus e rodantes em condições seguras de manobra',
      'Adesivos obrigatórios de capacidade de carga e alertas de segurança'
    ]
  }
};

/**
 * Retorna metadados de uma classificação específica com fallback
 */
export function getClientTier(tierId) {
  if (!tierId) return null;
  const key = String(tierId).toUpperCase().trim();
  return CLIENT_TIERS[key] || null;
}

/**
 * Lista todos os tiers disponíveis como array
 */
export function getAllClientTiers() {
  return Object.values(CLIENT_TIERS);
}
