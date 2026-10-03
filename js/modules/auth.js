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
export const DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

// Nomes e descrições oficiais dos perfis operacionais da Locar
export const ROLE_DEFINITIONS = {
  inspector: {
    name: 'Inspetor Técnico de Campo',
    icon: '👷',
    description: 'Vistorias, laudos de checklist, fotos periciais e assinaturas técnicas'
  },
  pcm: {
    name: 'Gestor PCM / Manutenção',
    icon: '⚙️',
    description: 'Gestão de Solicitações de Serviço, ordens de reparo e liberação de ativos'
  },
  manager: {
    name: 'Gestão de frota',
    icon: '📊',
    description: 'Cadastro de equipamentos, auditoria, exportações e controle geral'
  },
  commercial: {
    name: 'Comercial',
    icon: '💼',
    description: 'Gestão de reservas, propostas comerciais e ativação de locações'
  },
  admin: {
    name: 'Administrador Geral QSMS',
    icon: '🛡️',
    description: 'Acesso irrestrito a todos os módulos operacionais, de segurança e auditoria'
  }
};

export function getRoleName(role) {
  const norm = normalizeRole(role);
  return ROLE_DEFINITIONS[norm]?.name || 'Operador Corporativo';
}

export function normalizeRole(role) {
  if (!role) return 'inspector';
  const clean = String(role).toLowerCase().trim();
  if (clean.includes('insp') || clean.includes('campo')) return 'inspector';
  if (clean.includes('pcm') || clean.includes('manut')) return 'pcm';
  if (clean.includes('gest') || clean.includes('frot') || clean.includes('manag')) return 'manager';
  if (clean.includes('comerc') || clean.includes('comm')) return 'commercial';
  if (clean.includes('adm') || clean.includes('qsms') || clean.includes('geral')) return 'admin';
  return clean;
}

// Em operação real, inicia com lista limpa pronta para carga oficial de colaboradores
const DEFAULT_USERS = [];

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
        if (Array.isArray(parsed)) {
          let updated = false;
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
      }
    } catch (e) {
      console.warn('Erro ao carregar usuários cadastrados:', e);
    }
    return DEFAULT_USERS;
  }

  setRegisteredUsers(users) {
    if (!Array.isArray(users)) return false;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      this.logAudit('USERS_UPDATED', `Base de usuários atualizada com ${users.length} operador(es).`);
      return true;
    } catch (e) {
      console.error('Erro ao salvar usuários registrados:', e);
      return false;
    }
  }

  /**
   * Importa e cadastra uma lista oficial de usuários com perfis e PINs com hash SHA-256
   * @param {Array<object>} usersList 
   * @param {boolean} replaceExisting Se true, substitui a lista inteira
   */
  async importUsers(usersList, replaceExisting = true) {
    if (!Array.isArray(usersList)) {
      throw new Error('A lista de usuários deve ser um array de colaboradores.');
    }

    const current = replaceExisting ? [] : this.getRegisteredUsers();
    let importedCount = 0;

    for (let i = 0; i < usersList.length; i++) {
      const raw = usersList[i];
      if (!raw || (!raw.name && !raw.email && !raw.registration)) continue;

      const normRole = normalizeRole(raw.role || raw.perfil || 'inspector');
      const roleMeta = ROLE_DEFINITIONS[normRole] || ROLE_DEFINITIONS.inspector;

      let pinHash = raw.pinHash;
      if (!pinHash) {
        const rawPin = raw.pin || raw.senha || '1234';
        pinHash = await generateAuditHash(String(rawPin).trim());
      }

      const userObj = {
        id: raw.id || `usr_${normRole}_${Date.now()}_${i + 1}`,
        registration: (raw.registration || raw.matricula || `LOC-${String(1000 + i)}`).toUpperCase().trim(),
        name: (raw.name || raw.nome || 'Operador Locar').trim(),
        email: (raw.email || raw.login || '').toLowerCase().trim(),
        role: normRole,
        roleName: raw.roleName || raw.cargo || roleMeta.name,
        phone: raw.phone || raw.telefone || '',
        pinHash
      };

      // Substitui se já existir mesma matrícula ou e-mail
      const existingIdx = current.findIndex(u => 
        (u.registration && u.registration === userObj.registration) ||
        (u.email && userObj.email && u.email === userObj.email)
      );

      if (existingIdx !== -1) {
        current[existingIdx] = userObj;
      } else {
        current.push(userObj);
      }
      importedCount++;
    }

    this.setRegisteredUsers(current);
    return { success: true, count: importedCount, totalUsers: current.length };
  }

  /**
   * Limpa todos os usuários cadastrados e encerra sessão
   */
  clearUsers() {
    try {
      localStorage.removeItem(USERS_STORAGE_KEY);
      this.failedAttempts.clear();
      this.logout();
      this.logAudit('USERS_CLEARED', 'Base de usuários foi completamente resetada para entrada em operação.');
      return true;
    } catch (e) {
      console.warn('Erro ao limpar usuários:', e);
      return false;
    }
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

  quickSwitchUserById(idOrReg) {
    const users = this.getRegisteredUsers();
    const clean = String(idOrReg).trim().toLowerCase();
    const user = users.find(u => 
      u.id?.toLowerCase() === clean || 
      u.registration?.toLowerCase() === clean ||
      u.email?.toLowerCase() === clean
    );
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
