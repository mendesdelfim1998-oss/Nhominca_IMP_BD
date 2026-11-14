import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as dbQueries from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const API_TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12h
  const sessions = new Map<string, { userId: string; email: string; role?: string; expiresAt: number }>();
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: process.env.JSON_LIMIT || '10mb' }));

  // Basic security headers + CORS for multi-client access
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (origin && (allowed.length === 0 || allowed.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (allowed.length === 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const getClientIp = (req: express.Request) => (req.ip || req.socket.remoteAddress || 'unknown');
  const isLoginRateLimited = (ip: string) => {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const max = 20;
    const entry = loginAttempts.get(ip);
    if (!entry || entry.resetAt <= now) {
      loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    if (entry.count > max) return true;
    return false;
  };

  const extractToken = (req: express.Request) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    return null;
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authEnabled = process.env.DISABLE_API_AUTH === 'true'
      ? false
      : (process.env.NODE_ENV === 'production' || process.env.ENABLE_API_AUTH === 'true');
    if (!authEnabled) return next();

    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Não autenticado. Inicie sessão novamente.' });
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) sessions.delete(token);
      return res.status(401).json({ error: 'Sessão expirada ou inválida. Inicie sessão novamente.' });
    }
    (req as any).authUser = session;
    next();
  };

  // Run initial database seeding on launch
  try {
    await dbQueries.seedDatabaseIfEmpty();
  } catch (err) {
    console.error('Initial DB seed warning:', err);
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', env: NODE_ENV, uptime: process.uptime() });
  });

  // Auth: login (issues session token for multi-client usage)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const ip = getClientIp(req);
      if (isLoginRateLimited(ip)) {
        return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente mais tarde.' });
      }
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios.' });

      const users = await dbQueries.getUsers();
      const user = users.find((u: any) => String(u.email || '').toLowerCase() === String(email).toLowerCase());
      if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

      const expected = user.senha ?? user.password ?? '';
      if (String(password) !== String(expected)) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (user.active === false || String(user.status || '').toLowerCase() === 'inativo') {
        return res.status(403).json({ error: 'Conta inativa. Contacte o administrador.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, {
        userId: user.uid || user.id,
        email: user.email,
        role: user.role || user.funcao,
        expiresAt: Date.now() + API_TOKEN_TTL_MS,
      });
      const safeUser = { ...user };
      delete (safeUser as any).senha;
      delete (safeUser as any).password;
      res.json({ token, expiresInMs: API_TOKEN_TTL_MS, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Falha no login.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractToken(req);
    if (token) sessions.delete(token);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    res.json({ user: (req as any).authUser });
  });

  // Protect API routes (except auth/health above)
  app.use('/api', requireAuth);

  // Database Connection Status & Diagnostics
  app.get('/api/db/status', async (_req, res) => {
    try {
      const [faturasCount, usersCount, recibosCount, caixaCount, auditCount] = await Promise.all([
        dbQueries.getFaturas().then(r => r.length).catch(() => 0),
        dbQueries.getUsers().then(r => r.length).catch(() => 0),
        dbQueries.getRecibos().then(r => r.length).catch(() => 0),
        dbQueries.getCaixaMovs().then(r => r.length).catch(() => 0),
        dbQueries.getAuditoriaLogs().then(r => r.length).catch(() => 0)
      ]);

      res.json({
        status: 'connected',
        engine: 'PostgreSQL (Cloud SQL)',
        host: process.env.SQL_HOST ? 'Connected via Cloud SQL Proxy' : 'Local / Dev',
        database: process.env.SQL_DB_NAME || 'postgres',
        appUser: process.env.SQL_USER || 'ai_studio_app',
        tables: {
          faturas: faturasCount,
          users: usersCount,
          recibos: recibosCount,
          caixaMovs: caixaCount,
          auditoriaLogs: auditCount
        }
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Database seed trigger
  app.post('/api/db/seed', async (_req, res) => {
    try {
      const result = await dbQueries.seedDatabaseIfEmpty();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Seed failed' });
    }
  });

  // Users / Operators
  app.get('/api/users', async (_req, res) => {
    try {
      const data = await dbQueries.getUsers();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const user = await dbQueries.upsertUser(req.body);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Faturas (Invoices)
  app.get('/api/faturas', async (_req, res) => {
    try {
      const data = await dbQueries.getFaturas();
      // Format to match client state format
      const formatted = data.map((f) => ({
        id: f.faturaUid,
        ano: f.ano,
        seq: f.seq,
        nFatura: f.nFatura,
        data: f.data,
        cliente: f.cliente,
        nif: f.nif,
        navio: f.navio,
        tipo: f.tipo,
        gross_tonnage: f.grossTonnage,
        itens: f.itens,
        subtotal: f.subtotal,
        iva: f.iva,
        total: f.total,
        saldo_pago: f.saldoPago,
        saldo_pendente: f.saldoPendente,
        recibos: f.recibos,
        estado: f.estado,
        criado_por: f.criadoPor,
        justificativaAnulacao: f.justificativaAnulacao,
        anulado_por: f.anuladoPor,
        data_anulacao: f.dataAnulacao
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/faturas', async (req, res) => {
    try {
      const fatura = await dbQueries.insertFatura(req.body);
      res.json(fatura);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/faturas/:uid', async (req, res) => {
    try {
      const updated = await dbQueries.updateFatura(req.params.uid, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Recibos (Receipts)
  app.get('/api/recibos', async (_req, res) => {
    try {
      const data = await dbQueries.getRecibos();
      const formatted = data.map((r) => ({
        id: r.reciboUid,
        nRecibo: r.nRecibo,
        fatura_id: r.faturaId,
        nFatura: r.nFatura,
        totalFatura: r.totalFatura,
        valorAnteriorPago: r.valorAnteriorPago,
        valor: r.valor,
        saldoRestante: r.saldoRestante,
        isLiquidacaoTotal: r.isLiquidacaoTotal,
        banco: r.banco,
        talao: r.talao,
        data: r.data,
        hora: r.hora,
        emissor: r.emissor,
        cliente: r.cliente,
        navio: r.navio,
        observacoes: r.observacoes
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/recibos', async (req, res) => {
    try {
      const recibo = await dbQueries.insertRecibo(req.body);
      res.json(recibo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Folha de Caixa (Cash ledger)
  app.get('/api/caixa', async (_req, res) => {
    try {
      const data = await dbQueries.getCaixaMovs();
      const formatted = data.map((m) => ({
        id: m.movUid,
        data: m.data,
        hora: m.hora,
        descricao: m.descricao,
        tipo: m.tipo,
        valor: m.valor,
        saldoApos: m.saldoApos,
        criado_por: m.criadoPor,
        categoria: m.categoria,
        talao: m.talao,
        banco: m.banco,
        documentoComprovativo: m.documentoComprovativo,
        beneficiario: m.beneficiario,
        autorizado_por: m.autorizadoPor,
        justificativa: m.justificativa,
        comprovativoAnexo: m.comprovativoAnexo
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/caixa', async (req, res) => {
    try {
      const mov = await dbQueries.insertCaixaMov(req.body);
      res.json(mov);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auditoria Logs (Chained SHA-256)
  app.get('/api/auditoria', async (_req, res) => {
    try {
      const data = await dbQueries.getAuditoriaLogs();
      const formatted = data.map((l) => ({
        id: l.logUid,
        timestamp: l.timestamp,
        user_id: l.userId,
        user_email: l.userEmail,
        acao: l.acao,
        tabela: l.tabela,
        item_id: l.itemId,
        payload_json: l.payloadJson,
        hash_sha256: l.hashSha256,
        prev_hash: l.prevHash
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auditoria', async (req, res) => {
    try {
      const log = await dbQueries.insertAuditoriaLog(req.body);
      res.json(log);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Embarcações
  app.get('/api/embarcacoes', async (_req, res) => {
    try {
      const data = await dbQueries.getEmbarcacoes();
      const formatted = data.map((e) => ({
        id: e.embarcacaoUid,
        nome: e.nome,
        numeroIMO: e.numeroImo,
        indicativoChamada: e.indicativoChamada,
        bandeira: e.bandeira,
        portoRegisto: e.portoRegisto,
        tipo: e.tipo,
        tonelagemBruta: e.tonelagemBruta,
        comprimentoForaFora: e.comprimentoForaFora,
        caladoMaximo: e.caladoMaximo,
        anoConstrucao: e.anoConstrucao,
        armadorId: e.armadorId,
        armadorNome: e.armadorNome,
        agenciaId: e.agenciaId,
        agenciaNome: e.agenciaNome,
        statusCertificacao: e.statusCertificacao
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/embarcacoes', async (req, res) => {
    try {
      const emb = await dbQueries.insertEmbarcacao(req.body);
      res.json(emb);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Agências
  app.get('/api/agencias', async (_req, res) => {
    try {
      const data = await dbQueries.getAgencias();
      const formatted = data.map((a) => ({
        id: a.agenciaUid,
        nomeComercial: a.nomeComercial,
        nif: a.nif,
        licencaAtividade: a.licencaAtividade,
        responsavelLegal: a.responsavelLegal,
        telefone: a.telefone,
        email: a.email,
        endereco: a.endereco,
        embarcacoesRepresentadas: a.embarcacoesRepresentadas,
        status: a.status
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/agencias', async (req, res) => {
    try {
      const ag = await dbQueries.insertAgencia(req.body);
      res.json(ag);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Armadores
  app.get('/api/armadores', async (_req, res) => {
    try {
      const data = await dbQueries.getArmadores();
      const formatted = data.map((a) => ({
        id: a.armadorUid,
        nomeRazaoSocial: a.nomeRazaoSocial,
        paisOrigem: a.paisOrigem,
        tipoEntidade: a.tipoEntidade,
        contactoOficial: a.contactoOficial,
        email: a.email,
        frotaContada: a.frotaContada
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/armadores', async (req, res) => {
    try {
      const arm = await dbQueries.insertArmador(req.body);
      res.json(arm);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Atracações
  app.get('/api/atracacoes', async (_req, res) => {
    try {
      const data = await dbQueries.getAtracacoes();
      const formatted = data.map((a) => ({
        id: a.atracacaoUid,
        codigoEscala: a.codigoEscala,
        embarcacaoId: a.embarcacaoId,
        embarcacaoNome: a.embarcacaoNome,
        agenciaNome: a.agenciaNome,
        portoNome: a.portoNome,
        caisDesignado: a.caisDesignado,
        dataChegadaPrevista: a.dataChegadaPrevista,
        dataAtracacaoEfetiva: a.dataAtracacaoEfetiva,
        dataSaidaPrevista: a.dataSaidaPrevista,
        status: a.status,
        servicosSolicitados: a.servicosSolicitados,
        manifestoCarga: a.manifestoCarga
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/atracacoes', async (req, res) => {
    try {
      const atr = await dbQueries.insertAtracacao(req.body);
      res.json(atr);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IMP Faturação & Marítimo Server running on port ${PORT} with PostgreSQL`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
});
