import { FaturaIMP, ReciboIMP, CaixaMov, AuditoriaLog, Embarcacao, AgenciaMaritima, Armador, Atracacao, Utilizador } from '../types';

const SESSION_LOGGED_IN_KEY = 'imp_session_logged_in';
const SESSION_USER_ID_KEY = 'imp_session_user_id';
const SESSION_ACTIVE_MODULE_KEY = 'imp_session_active_module';
const SESSION_TOKEN_KEY = 'imp_session_token';

export const sessionManager = {
  saveSession(user: Utilizador, activeModule?: string, token?: string) {
    try {
      localStorage.setItem(SESSION_LOGGED_IN_KEY, 'true');
      localStorage.setItem(SESSION_USER_ID_KEY, user.id);
      if (activeModule) localStorage.setItem(SESSION_ACTIVE_MODULE_KEY, activeModule);
      if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch (e) {
      console.warn('Could not save session to localStorage', e);
    }
  },

  updateActiveModule(moduleKey: string) {
    try {
      localStorage.setItem(SESSION_ACTIVE_MODULE_KEY, moduleKey);
    } catch (e) {
      console.warn('Could not update active module in localStorage', e);
    }
  },

  getSession(): { isLoggedIn: boolean; userId: string | null; activeModule: string | null; token: string | null } {
    try {
      const isLoggedIn = localStorage.getItem(SESSION_LOGGED_IN_KEY) === 'true';
      const userId = localStorage.getItem(SESSION_USER_ID_KEY);
      const activeModule = localStorage.getItem(SESSION_ACTIVE_MODULE_KEY);
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      return { isLoggedIn, userId, activeModule, token };
    } catch (e) {
      return { isLoggedIn: false, userId: null, activeModule: null, token: null };
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(SESSION_LOGGED_IN_KEY);
      localStorage.removeItem(SESSION_USER_ID_KEY);
      localStorage.removeItem(SESSION_ACTIVE_MODULE_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (e) {
      console.warn('Could not clear session', e);
    }
  }
};

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = sessionManager.getSession().token;
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = authHeaders(init.headers);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    // token invalid/expired; keep local session clearing to caller when needed
  }
  return res;
}

export async function apiLogin(email: string, password: string): Promise<{ ok: boolean; user?: Utilizador; token?: string; error?: string }> {
  try {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || 'Falha na autenticação.' };
    return { ok: true, user: data.user, token: data.token };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Servidor indisponível.' };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {}
}

// API calls with automatic backend synchronization
export async function apiFetchFaturas(): Promise<FaturaIMP[] | null> {
  try {
    const res = await apiRequest('/api/faturas');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Using client cache for faturas:', e);
  }
  return null;
}

export async function apiSaveFatura(fatura: FaturaIMP): Promise<void> {
  try {
    await apiRequest('/api/faturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fatura),
    });
  } catch (e) {
    console.warn('Failed to sync fatura to PostgreSQL:', e);
  }
}

export async function apiUpdateFatura(faturaUid: string, updates: Partial<FaturaIMP>): Promise<void> {
  try {
    await apiRequest(`/api/faturas/${encodeURIComponent(faturaUid)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (e) {
    console.warn('Failed to update fatura in PostgreSQL:', e);
  }
}

export async function apiFetchRecibos(): Promise<ReciboIMP[] | null> {
  try {
    const res = await apiRequest('/api/recibos');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for recibos:', e);
  }
  return null;
}

export async function apiSaveRecibo(recibo: ReciboIMP): Promise<void> {
  try {
    await apiRequest('/api/recibos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recibo),
    });
  } catch (e) {
    console.warn('Failed to sync recibo to PostgreSQL:', e);
  }
}

export async function apiFetchCaixa(): Promise<CaixaMov[] | null> {
  try {
    const res = await apiRequest('/api/caixa');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for caixa:', e);
  }
  return null;
}

export async function apiSaveCaixaMov(mov: CaixaMov): Promise<void> {
  try {
    await apiRequest('/api/caixa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mov),
    });
  } catch (e) {
    console.warn('Failed to sync caixa mov to PostgreSQL:', e);
  }
}

export async function apiFetchAuditoria(): Promise<AuditoriaLog[] | null> {
  try {
    const res = await apiRequest('/api/auditoria');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for auditoria:', e);
  }
  return null;
}

export async function apiSaveAuditoriaLog(log: AuditoriaLog): Promise<void> {
  try {
    await apiRequest('/api/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (e) {
    console.warn('Failed to sync audit log to PostgreSQL:', e);
  }
}

export async function apiFetchEmbarcacoes(): Promise<Embarcacao[] | null> {
  try {
    const res = await apiRequest('/api/embarcacoes');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for embarcacoes:', e);
  }
  return null;
}

export async function apiSaveEmbarcacao(emb: Embarcacao): Promise<void> {
  try {
    await apiRequest('/api/embarcacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emb),
    });
  } catch (e) {
    console.warn('Failed to sync embarcacao to PostgreSQL:', e);
  }
}

export async function apiFetchAgencias(): Promise<AgenciaMaritima[] | null> {
  try {
    const res = await apiRequest('/api/agencias');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for agencias:', e);
  }
  return null;
}

export async function apiSaveAgencia(ag: AgenciaMaritima): Promise<void> {
  try {
    await apiRequest('/api/agencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ag),
    });
  } catch (e) {
    console.warn('Failed to sync agencia to PostgreSQL:', e);
  }
}

export async function apiFetchArmadores(): Promise<Armador[] | null> {
  try {
    const res = await apiRequest('/api/armadores');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for armadores:', e);
  }
  return null;
}

export async function apiSaveArmador(arm: Armador): Promise<void> {
  try {
    await apiRequest('/api/armadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arm),
    });
  } catch (e) {
    console.warn('Failed to sync armador to PostgreSQL:', e);
  }
}

export async function apiFetchAtracacoes(): Promise<Atracacao[] | null> {
  try {
    const res = await apiRequest('/api/atracacoes');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for atracacoes:', e);
  }
  return null;
}

export async function apiSaveAtracacao(atr: Atracacao): Promise<void> {
  try {
    await apiRequest('/api/atracacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(atr),
    });
  } catch (e) {
    console.warn('Failed to sync atracacao to PostgreSQL:', e);
  }
}

export async function apiFetchUsers(): Promise<Utilizador[] | null> {
  try {
    const res = await apiRequest('/api/users');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Using client cache for users:', e);
  }
  return null;
}

export async function apiSaveUser(user: Partial<Utilizador>): Promise<void> {
  try {
    await apiRequest('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (e) {
    console.warn('Failed to sync user to PostgreSQL:', e);
  }
}

export async function apiGetSyncStatus(): Promise<any> {
  try {
    const res = await apiRequest('/api/sync/status');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Failed to fetch sync status:', e);
  }
  return null;
}

export async function apiRunSync(): Promise<any> {
  try {
    const res = await apiRequest('/api/sync/run', { method: 'POST' });
    return await res.json().catch(() => ({}));
  } catch (e: any) {
    return { ok: false, error: e?.message || 'sync_failed' };
  }
}

export async function apiGetDevDataSummary(): Promise<any> {
  try {
    const res = await apiRequest('/api/dev/data-summary');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Failed to fetch dev data summary:', e);
  }
  return null;
}

export async function apiClearEntityData(entity: string, deletedBy?: string): Promise<any> {
  try {
    const res = await apiRequest('/api/dev/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, deletedBy }),
    });
    return await res.json().catch(() => ({}));
  } catch (e: any) {
    return { ok: false, error: e?.message || 'clear_failed' };
  }
}

export async function apiRestoreTrashItem(trashUid: string): Promise<any> {
  try {
    const res = await apiRequest('/api/dev/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashUid }),
    });
    return await res.json().catch(() => ({}));
  } catch (e: any) {
    return { ok: false, error: e?.message || 'restore_failed' };
  }
}
