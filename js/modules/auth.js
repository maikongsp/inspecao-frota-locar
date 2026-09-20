/**
 * MÓDULO DE AUTENTICAÇÃO E CONTROLE DE ACESSO BASEADO EM PAPÉIS (RBAC)
 * Padrão Corporativo Locar Guindastes e Transportes Intermodais
 * 
 * Papéis Suportados:
 * - 'inspector': Inspetor Técnico de Campo (Realiza vistorias, checklists e fotos)
 * - 'pcm': Planejamento e Controle de Manutenção (Gerencia S.S., ordens e alertas)
 * - 'manager': Gestão de Frota (Cadastra equipamentos, exporta dados, audita)
 * - 'commercial': Comercial (Gestão de reservas e locações)
 * - 'admin': Administrador Geral (Acesso irrestrito a todos os módulos)
 */

import { generateAuditHash } from '../utils.js';

const AUTH_STORAGE_KEY = 'locar_auth_session_v1';
const USERS_STORAGE_KEY = 'locar_corporate_users_v1';
const AUDIT_STORAGE_KEY = 'locar_audit_log_v1';
const LOCKOUT_STORAGE_KEY = 'locar_auth_lockout_v1';

// Hash SHA-256 oficial do PIN padrão '1234'
const DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

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
    pinHash: DEFAULT_PIN_HASH
  },
  {
    id: 'usr_pcm_01',
    email: 'pcm.betim@locar.com.br',
    registration: 'LOC-5510',
    name: 'Eng. Roberto Albuquerque',
    role: 'pcm',
    roleName: 'Gestor PCM / Manutenção',
    phone: '(31) 98765-4321',
    pinHash: DEFAULT_PIN_HASH
  },
  {
    id: 'usr_mgr_01',
    email: 'gestor.frota@locar.com.br',
    registration: 'LOC-3001',
    name: 'Mariana Duarte',
    role: 'manager',
    roleName: 'Gestão de frota',
    phone: '(31) 99123-9876',
    pinHash: DEFAULT_PIN_HASH
  },
  {
    id: 'usr_com_01',
    email: 'comercial.betim@locar.com.br',
    registration: 'LOC-4200',
    name: 'Juliana Vasconcelos',
    role: 'commercial',
    roleName: 'Comercial',
    phone: '(31) 98321-7788',
    pinHash: DEFAULT_PIN_HASH
  },
  {
    id: 'usr_adm_01',
    email: 'admin@locar.com.br',
    registration: 'LOC-0001',
    name: 'Administrador Corporativo',
    role: 'admin',
    roleName: 'Administrador Geral QSMS',
    phone: '(31) 99999-0000',
    pinHash: DEFAULT_PIN_HASH
  }
];

export class AuthManager {
  constructor() {
    // O sistema abre sempre sem indicação de perfil (Modo Consulta Livre).
    // O login de perfil é obrigatório apenas ao executar ações operacionais.
    this.currentUser = null;
    this.failedAttempts = new Map();
  }

  getRegisteredUsers() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let updated = false;
        // Migração automática de PIN em texto plano legado para hash criptográfico SHA-256
        parsed.forEach(u => {
          if (!u.pinHash && u.pin) {
            if (u.pin === '1234') {
              u.pinHash = DEFAULT_PIN_HASH;
            }
            delete u.pin;
            updated = true;
          } else if (u.pin && u.pinHash) {
            delete u.pin;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar usuários cadastrados:', e);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }

  loadSession() {
    // Retorna null na inicialização para garantir modo de consulta livre sem perfil pré-definido
    return null;
  }

  saveSession(user) {
    // Sanitiza objeto removendo credenciais antes de persistir
    const sanitized = { ...user };
    delete sanitized.pin;
    delete sanitized.pinHash;

    this.currentUser = sanitized;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitized));
      this.logAudit('LOGIN_SESSION', `Sessão ativa para ${sanitized.name} (${sanitized.role})`);
    } catch (e) {
      console.error('Erro ao salvar sessão local:', e);
    }
  }

  /**
   * Verifica proteção contra ataques de força bruta (Lockout temporário)
   */
  checkLockout(cleanId) {
    try {
      const now = Date.now();
      const attempts = this.failedAttempts.get(cleanId);
      if (attempts && attempts.count >= 5) {
        const remainingSeconds = Math.ceil((attempts.lockedUntil - now) / 1000);
        if (remainingSeconds > 0) {
          return {
            locked: true,
            message: `Muitas tentativas incorretas. Por segurança operacional, aguarde ${remainingSeconds}s antes de tentar novamente.`
          };
        } else {
          // Bloqueio expirou
          this.failedAttempts.delete(cleanId);
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar lockout:', e);
    }
    return { locked: false };
  }

  recordFailedAttempt(cleanId) {
    const now = Date.now();
    const current = this.failedAttempts.get(cleanId) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 60000; // 60 segundos de bloqueio temporário
    }
    this.failedAttempts.set(cleanId, current);
  }

  clearFailedAttempts(cleanId) {
    this.failedAttempts.delete(cleanId);
  }

  async login(identifier, pinOrPassword) {
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanSecret = String(pinOrPassword).trim();

    // 0. Verifica proteção contra força bruta
    const lockout = this.checkLockout(cleanId);
    if (lockout.locked) {
      this.logAudit('LOGIN_LOCKED', `Tentativa bloqueada por força bruta para ${cleanId}`);
      return { success: false, error: lockout.message };
    }

    // 1. Tenta autenticação corporativa online via Appwrite Cloud se for e-mail e senha de 8+ caracteres
    if (typeof navigator !== 'undefined' && navigator.onLine && cleanId.includes('@') && cleanSecret.length >= 8) {
      try {
        const { appwriteClient } = await import('../appwriteClient.js');
        const cloudRes = await appwriteClient.createSession(cleanId, cleanSecret);
        if (cloudRes.success) {
          const user = {
            id: cloudRes.session.userId || `usr_${Date.now()}`,
            email: cleanId,
            registration: 'LOC-CLOUD',
            name: cleanId.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            role: cleanId.includes('admin') ? 'admin' : (cleanId.includes('pcm') ? 'pcm' : (cleanId.includes('comercial') ? 'commercial' : 'inspector')),
            roleName: 'Operador Autenticado (Appwrite Cloud)',
            phone: '',
            authSource: 'appwrite_cloud'
          };
          this.clearFailedAttempts(cleanId);
          this.saveSession(user);
          this.logAudit('LOGIN_APPWRITE', `Autenticação na nuvem Appwrite para ${cleanId}`);
          return { success: true, user, authSource: 'appwrite_cloud' };
        }
      } catch (errCloud) {
        console.warn('Tentativa Appwrite Cloud falhou, tentando base homologada local:', errCloud);
      }
    }

    // 2. Base corporativa homologada para operação em campo (offline-first com Hash SHA-256)
    const inputHash = await generateAuditHash(cleanSecret);
    const users = this.getRegisteredUsers();
    const user = users.find(u => {
      const matchId = (u.email.toLowerCase() === cleanId || u.registration.toLowerCase() === cleanId);
      if (!matchId) return false;
      // Valida com hash SHA-256 ou legado em migração
      return u.pinHash === inputHash || u.pin === cleanSecret;
    });

    if (user) {
      this.clearFailedAttempts(cleanId);
      const sessionUser = { ...user, authSource: 'local_pin' };
      delete sessionUser.pin;
      delete sessionUser.pinHash;
      this.saveSession(sessionUser);
      this.logAudit('LOGIN_LOCAL', `Autenticação homologada para ${user.name}`);
      return { success: true, user: sessionUser, authSource: 'local_pin' };
    }

    this.recordFailedAttempt(cleanId);
    this.logAudit('LOGIN_FAILED', `Credencial incorreta informada para ${cleanId}`);
    return { 
      success: false, 
      error: 'Matrícula/E-mail ou PIN incorreto. Verifique suas credenciais corporativas.' 
    };
  }

  quickSwitchUser(role) {
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      const sessionUser = { ...user, authSource: 'quick_switch' };
      delete sessionUser.pin;
      delete sessionUser.pinHash;
      this.saveSession(sessionUser);
      return sessionUser;
    }
    return null;
  }

  logout() {
    this.logAudit('LOGOUT_SESSION', `Usuário ${this.currentUser?.name} desconectado.`);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUser = null;
  }

  getCurrentUser() {
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
