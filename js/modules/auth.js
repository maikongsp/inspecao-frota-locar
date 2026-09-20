/**
 * MÓDULO DE AUTENTICAÇÃO E CONTROLE DE ACESSO BASEADO EM PAPÉIS (RBAC)
 * Padrão Corporativo Locar Guindastes e Transportes Intermodais
 * 
 * Papéis Suportados:
 * - 'inspector': Inspetor Técnico de Campo (Realiza vistorias, checklists e fotos)
 * - 'pcm': Planejamento e Controle de Manutenção (Gerencia S.S., ordens e alertas)
 * - 'manager': Gestor de Frota & Engenharia (Cadastra equipamentos, exporta dados, audita)
 * - 'admin': Administrador Geral (Acesso irrestrito a todos os módulos)
 */

const AUTH_STORAGE_KEY = 'locar_auth_session_v1';
const USERS_STORAGE_KEY = 'locar_corporate_users_v1';
const AUDIT_STORAGE_KEY = 'locar_audit_log_v1';

// Usuários corporativos padrão para operação em campo (Betim/MG)
const DEFAULT_USERS = [
  {
    id: 'usr_insp_01',
    email: 'inspetor.betim@locar.com.br',
    registration: 'LOC-7842',
    name: 'Carlos Mendes',
    role: 'inspector',
    roleName: 'Inspetor Técnico de Campo',
    phone: '(31) 98844-1234',
    pin: '1234'
  },
  {
    id: 'usr_pcm_01',
    email: 'pcm.betim@locar.com.br',
    registration: 'LOC-5510',
    name: 'Eng. Roberto Albuquerque',
    role: 'pcm',
    roleName: 'Gestor PCM / Manutenção',
    phone: '(31) 98765-4321',
    pin: '1234'
  },
  {
    id: 'usr_mgr_01',
    email: 'gestor.frota@locar.com.br',
    registration: 'LOC-3001',
    name: 'Mariana Duarte',
    role: 'manager',
    roleName: 'Gerente de Frota & Operações',
    phone: '(31) 99123-9876',
    pin: '1234'
  },
  {
    id: 'usr_com_01',
    email: 'comercial.betim@locar.com.br',
    registration: 'LOC-4200',
    name: 'Juliana Vasconcelos',
    role: 'commercial',
    roleName: 'Consultor Comercial / Locações',
    phone: '(31) 98321-7788',
    pin: '1234'
  },
  {
    id: 'usr_adm_01',
    email: 'admin@locar.com.br',
    registration: 'LOC-0001',
    name: 'Administrador Corporativo',
    role: 'admin',
    roleName: 'Administrador Geral QSMS',
    phone: '(31) 99999-0000',
    pin: '1234'
  }
];

export class AuthManager {
  constructor() {
    this.currentUser = this.loadSession();
  }

  getRegisteredUsers() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Erro ao carregar usuários cadastrados:', e);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Erro ao restaurar sessão de autenticação:', e);
    }
    // Sessão padrão inicial para garantir disponibilidade imediata em campo
    const defaultUser = DEFAULT_USERS[0];
    this.saveSession(defaultUser);
    return defaultUser;
  }

  saveSession(user) {
    this.currentUser = user;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      this.logAudit('LOGIN_SESSION', `Sessão ativa para ${user.name} (${user.role})`);
    } catch (e) {
      console.error('Erro ao salvar sessão local:', e);
    }
  }

  login(identifier, pin) {
    const users = this.getRegisteredUsers();
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPin = String(pin).trim();

    const user = users.find(u => 
      (u.email.toLowerCase() === cleanId || u.registration.toLowerCase() === cleanId) &&
      u.pin === cleanPin
    );

    if (user) {
      this.saveSession(user);
      return { success: true, user };
    }

    return { 
      success: false, 
      error: 'Matrícula/E-mail ou PIN incorreto. Verifique suas credenciais corporativas.' 
    };
  }

  quickSwitchUser(role) {
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      this.saveSession(user);
      return user;
    }
    return null;
  }

  logout() {
    this.logAudit('LOGOUT_SESSION', `Usuário ${this.currentUser?.name} desconectado.`);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUser = null;
  }

  getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = this.loadSession();
    }
    return this.currentUser;
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  hasRole(...roles) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true; // Admin tem todas as permissões
    return roles.includes(this.currentUser.role);
  }

  canInspect() {
    return this.hasRole('inspector', 'manager', 'admin');
  }

  canManagePCM() {
    return this.hasRole('pcm', 'admin');
  }

  canManageFleet() {
    return this.hasRole('manager', 'admin');
  }

  canManageReservations() {
    return this.hasRole('commercial', 'manager', 'admin');
  }

  logAudit(action, details) {
    try {
      const logs = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
      const entry = {
        timestamp: new Date().toISOString(),
        user: this.currentUser?.name || 'Sistema',
        role: this.currentUser?.role || 'anônimo',
        action,
        details
      };
      logs.unshift(entry);
      // Mantém últimos 200 logs para não estourar localStorage
      if (logs.length > 200) logs.pop();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Erro ao gravar log de auditoria:', e);
    }
  }

  getAuditLogs() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
}

export const authManager = new AuthManager();
