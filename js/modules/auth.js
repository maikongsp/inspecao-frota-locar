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

export function cleanCPF(cpf) {
  if (!cpf) return '';
  return String(cpf).replace(/\D/g, '');
}

export function formatCPF(cpf) {
  const digits = cleanCPF(cpf);
  if (digits.length !== 11) return digits || '';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Administrador Único e Soberano do Sistema
export const MASTER_ADMIN = {
  id: 'usr_admin_master_001',
  registration: 'maikon.pinho',
  name: 'Maikon Pinho',
  email: 'maikon.pinho@locar.com.br',
  cpf: '',
  role: 'admin',
  roleName: 'Administrador Geral Corporativo',
  phone: '(31) 99999-9999',
  pinHash: 'c7f7d4ea88792fc954a096d15b35bc74e795cefeebb5b62cbd4bcdc01202bd11' // SHA-256 de 'Esqueci1!'
};

const DEFAULT_USERS = [MASTER_ADMIN];

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

          // Garante que o administrador exclusivo Maikon Pinho está sempre presente com as credenciais corretas
          const adminIdx = parsed.findIndex(u => 
            u.email?.toLowerCase() === 'maikon.pinho@locar.com.br' || 
            u.registration?.toLowerCase() === 'maikon.pinho'
          );

          if (adminIdx === -1) {
            parsed.unshift(MASTER_ADMIN);
            updated = true;
          } else {
            // Garante que o papel é estritamente admin e o pinHash é o oficial
            if (parsed[adminIdx].role !== 'admin' || parsed[adminIdx].pinHash !== MASTER_ADMIN.pinHash) {
              parsed[adminIdx] = { ...parsed[adminIdx], ...MASTER_ADMIN };
              updated = true;
            }
          }

          // Regra Estrita: Somente Maikon Pinho pode ter perfil 'admin'
          parsed.forEach((u, idx) => {
            const isMaikon = (u.email?.toLowerCase() === 'maikon.pinho@locar.com.br' || u.registration?.toLowerCase() === 'maikon.pinho');
            if (!isMaikon && u.role === 'admin') {
              u.role = 'manager';
              u.roleName = ROLE_DEFINITIONS.manager.name;
              updated = true;
            }

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
   * Suporta cadastro informando CPF ou E-mail ou Matrícula
   * @param {Array<object>} usersList 
   * @param {boolean} replaceExisting Se true, substitui a lista inteira (mantendo o admin master)
   */
  async importUsers(usersList, replaceExisting = true) {
    if (!Array.isArray(usersList)) {
      throw new Error('A lista de usuários deve ser um array de colaboradores.');
    }

    const current = replaceExisting ? [MASTER_ADMIN] : this.getRegisteredUsers();
    let importedCount = 0;

    for (let i = 0; i < usersList.length; i++) {
      const raw = usersList[i];
      if (!raw || (!raw.name && !raw.email && !raw.registration && !raw.cpf && !raw.documento)) continue;

      const rawEmail = (raw.email || raw.login || '').toLowerCase().trim();
      const rawReg = (raw.registration || raw.matricula || '').toUpperCase().trim();

      // Suporte a CPF explícito ou inferido
      let rawCpf = formatCPF(raw.cpf || raw.CPF || raw.documento || raw.doc || '');
      if (!rawCpf && cleanCPF(rawReg).length === 11) {
        rawCpf = formatCPF(rawReg);
      }
      const cleanRawCpf = cleanCPF(rawCpf);

      // Regra Soberana: Se for maikon.pinho, é o MASTER_ADMIN
      const isMaikon = (rawEmail === 'maikon.pinho@locar.com.br' || rawReg.toLowerCase() === 'maikon.pinho');

      // Se não for Maikon Pinho, NÃO PODE ter perfil 'admin'
      let normRole = normalizeRole(raw.role || raw.perfil || 'inspector');
      if (!isMaikon && normRole === 'admin') {
        normRole = 'manager'; // rebaixa automaticamente para gestor
      } else if (isMaikon) {
        normRole = 'admin';
      }

      const roleMeta = ROLE_DEFINITIONS[normRole] || ROLE_DEFINITIONS.inspector;

      let pinHash = raw.pinHash;
      if (!pinHash) {
        if (isMaikon) {
          pinHash = MASTER_ADMIN.pinHash;
        } else {
          const rawPin = raw.pin || raw.senha || '1234';
          pinHash = await generateAuditHash(String(rawPin).trim());
        }
      }

      let effectiveReg = rawReg;
      if (!effectiveReg) {
        if (rawCpf) {
          effectiveReg = rawCpf;
        } else if (rawEmail) {
          effectiveReg = rawEmail.split('@')[0].toUpperCase();
        } else {
          effectiveReg = `LOC-${String(1000 + i)}`;
        }
      }

      const userObj = {
        id: isMaikon ? MASTER_ADMIN.id : (raw.id || `usr_${normRole}_${Date.now()}_${i + 1}`),
        registration: isMaikon ? 'maikon.pinho' : effectiveReg,
        cpf: isMaikon ? (MASTER_ADMIN.cpf || '') : rawCpf,
        name: isMaikon ? 'Maikon Pinho' : (raw.name || raw.nome || 'Operador Locar').trim(),
        email: isMaikon ? 'maikon.pinho@locar.com.br' : rawEmail,
        role: normRole,
        roleName: isMaikon ? MASTER_ADMIN.roleName : (raw.roleName || raw.cargo || roleMeta.name),
        phone: raw.phone || raw.telefone || (isMaikon ? MASTER_ADMIN.phone : ''),
        pinHash
      };

      // Substitui se já existir mesmo CPF, matrícula ou e-mail
      const existingIdx = current.findIndex(u => {
        const uCleanCpf = cleanCPF(u.cpf || (cleanCPF(u.registration).length === 11 ? u.registration : ''));
        const matchCpf = cleanRawCpf && uCleanCpf && cleanRawCpf === uCleanCpf;
        const matchEmail = rawEmail && u.email && u.email.toLowerCase() === rawEmail;
        const matchReg = userObj.registration && u.registration && u.registration.toLowerCase() === userObj.registration.toLowerCase();
        return Boolean(matchCpf || matchEmail || matchReg);
      });

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
   * Limpa todos os colaboradores mantendo o Administrador Soberano Maikon Pinho
   */
  clearUsers() {
    try {
      this.setRegisteredUsers([MASTER_ADMIN]);
      this.failedAttempts.clear();
      this.logout();
      this.logAudit('USERS_CLEARED', 'Base de usuários foi resetada mantendo exclusivamente o Administrador Master.');
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
    const cleanDigits = cleanCPF(cleanId);
    const users = this.getRegisteredUsers();
    const user = users.find(u => {
      const uCleanCpf = cleanCPF(u.cpf || (cleanCPF(u.registration).length === 11 ? u.registration : ''));
      const matchCpf = Boolean(cleanDigits && cleanDigits.length === 11 && uCleanCpf && cleanDigits === uCleanCpf);
      const matchEmail = Boolean(u.email && u.email.toLowerCase() === cleanId);
      const matchReg = Boolean(u.registration && u.registration.toLowerCase() === cleanId);
      const matchDirectCpf = Boolean(u.cpf && u.cpf.toLowerCase() === cleanId);

      const matchId = matchCpf || matchEmail || matchReg || matchDirectCpf;
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
      error: 'CPF, E-mail, Matrícula ou Senha/PIN incorreto. Verifique suas credenciais corporativas.' 
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

  quickSwitchUserById(idOrRegOrCpf) {
    const users = this.getRegisteredUsers();
    const clean = String(idOrRegOrCpf).trim().toLowerCase();
    const cleanDigits = cleanCPF(clean);
    const user = users.find(u => {
      const uCleanCpf = cleanCPF(u.cpf || (cleanCPF(u.registration).length === 11 ? u.registration : ''));
      const matchCpf = Boolean(cleanDigits && cleanDigits.length === 11 && uCleanCpf && cleanDigits === uCleanCpf);
      return (
        matchCpf ||
        u.id?.toLowerCase() === clean || 
        u.registration?.toLowerCase() === clean ||
        u.email?.toLowerCase() === clean ||
        u.cpf?.toLowerCase() === clean
      );
    });
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

  /**
   * Verifica se o usuário autenticado é estritamente o Administrador Master (Maikon Pinho)
   */
  isAdminMaster() {
    if (!this.currentUser) return false;
    const isMaikon = (
      this.currentUser.role === 'admin' &&
      (this.currentUser.email?.toLowerCase() === 'maikon.pinho@locar.com.br' ||
       this.currentUser.registration?.toLowerCase() === 'maikon.pinho')
    );
    return isMaikon;
  }

  /**
   * Valida permissão soberana: Apenas o Administrador Master pode alterar bases de dados fora dos fluxos,
   * criar usuários, alterar senhas ou alterar perfis.
   */
  canManageSystemAdministration() {
    return this.isAdminMaster();
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
