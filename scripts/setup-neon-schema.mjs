import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const sql = `
-- ==========================================================
-- IMP / NHOMINCA - Estrutura da base de dados (PostgreSQL/Neon)
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT NOT NULL,
  funcao TEXT NOT NULL,
  role TEXT,
  departamento TEXT NOT NULL DEFAULT 'Operações Marítimas',
  status TEXT NOT NULL DEFAULT 'Ativo',
  active BOOLEAN DEFAULT TRUE,
  avatar TEXT,
  foto_url TEXT,
  telefone TEXT,
  senha TEXT,
  ultimo_acesso TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faturas (
  id SERIAL PRIMARY KEY,
  fatura_uid TEXT NOT NULL UNIQUE,
  ano INTEGER NOT NULL DEFAULT 2026,
  seq INTEGER NOT NULL DEFAULT 1,
  n_fatura TEXT NOT NULL,
  data TEXT NOT NULL,
  cliente TEXT NOT NULL,
  nif TEXT NOT NULL,
  navio TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Pesqueiro',
  gross_tonnage DOUBLE PRECISION NOT NULL DEFAULT 0,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
  iva DOUBLE PRECISION NOT NULL DEFAULT 0,
  total DOUBLE PRECISION NOT NULL DEFAULT 0,
  saldo_pago DOUBLE PRECISION NOT NULL DEFAULT 0,
  saldo_pendente DOUBLE PRECISION NOT NULL DEFAULT 0,
  recibos JSONB DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'rascunho',
  criado_por TEXT NOT NULL DEFAULT 'Sistema IMP',
  justificativa_anulacao TEXT,
  anulado_por TEXT,
  data_anulacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recibos (
  id SERIAL PRIMARY KEY,
  recibo_uid TEXT NOT NULL UNIQUE,
  n_recibo TEXT NOT NULL,
  fatura_id TEXT NOT NULL,
  n_fatura TEXT NOT NULL,
  total_fatura DOUBLE PRECISION NOT NULL DEFAULT 0,
  valor_anterior_pago DOUBLE PRECISION NOT NULL DEFAULT 0,
  valor DOUBLE PRECISION NOT NULL DEFAULT 0,
  saldo_restante DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_liquidacao_total BOOLEAN NOT NULL DEFAULT TRUE,
  banco TEXT NOT NULL DEFAULT 'CORIS BANK',
  talao TEXT NOT NULL,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  emissor TEXT NOT NULL,
  cliente TEXT NOT NULL,
  navio TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa_movs (
  id SERIAL PRIMARY KEY,
  mov_uid TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor DOUBLE PRECISION NOT NULL,
  saldo_apos DOUBLE PRECISION NOT NULL,
  criado_por TEXT NOT NULL,
  categoria TEXT NOT NULL,
  talao TEXT,
  banco TEXT,
  documento_comprovativo TEXT,
  beneficiario TEXT,
  autorizado_por TEXT,
  justificativa TEXT,
  comprovativo_anexo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria_logs (
  id SERIAL PRIMARY KEY,
  log_uid TEXT NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  item_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS embarcacoes (
  id SERIAL PRIMARY KEY,
  embarcacao_uid TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  numero_imo TEXT NOT NULL,
  indicativo_chamada TEXT NOT NULL,
  bandeira TEXT NOT NULL,
  porto_registo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tonelagem_bruta DOUBLE PRECISION NOT NULL DEFAULT 0,
  comprimento_fora_fora DOUBLE PRECISION NOT NULL DEFAULT 0,
  calado_maximo DOUBLE PRECISION NOT NULL DEFAULT 0,
  ano_construcao INTEGER NOT NULL DEFAULT 2020,
  armador_id TEXT NOT NULL,
  armador_nome TEXT NOT NULL,
  agencia_id TEXT NOT NULL,
  agencia_nome TEXT NOT NULL,
  status_certificacao TEXT NOT NULL DEFAULT 'Válida',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agencias (
  id SERIAL PRIMARY KEY,
  agencia_uid TEXT NOT NULL UNIQUE,
  nome_comercial TEXT NOT NULL,
  nif TEXT NOT NULL,
  licenca_atividade TEXT NOT NULL,
  responsavel_legal TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco TEXT NOT NULL,
  embarcacoes_representadas INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Ativa',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS armadores (
  id SERIAL PRIMARY KEY,
  armador_uid TEXT NOT NULL UNIQUE,
  nome_razao_social TEXT NOT NULL,
  pais_origem TEXT NOT NULL,
  tipo_entidade TEXT NOT NULL DEFAULT 'Nacional',
  contacto_oficial TEXT NOT NULL,
  email TEXT NOT NULL,
  frota_contada INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atracacoes (
  id SERIAL PRIMARY KEY,
  atracacao_uid TEXT NOT NULL UNIQUE,
  codigo_escala TEXT NOT NULL,
  embarcacao_id TEXT NOT NULL,
  embarcacao_nome TEXT NOT NULL,
  agencia_nome TEXT NOT NULL,
  porto_nome TEXT NOT NULL,
  cais_designado TEXT NOT NULL,
  data_chegada_prevista TEXT NOT NULL,
  data_atracacao_efetiva TEXT,
  data_saida_prevista TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Anunciada',
  servicos_solicitados JSONB DEFAULT '[]'::jsonb,
  manifesto_carga JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_faturas_estado ON faturas (estado);
CREATE INDEX IF NOT EXISTS idx_faturas_data ON faturas (data);
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON faturas (cliente);
CREATE INDEX IF NOT EXISTS idx_recibos_data ON recibos (data);
CREATE INDEX IF NOT EXISTS idx_recibos_fatura_id ON recibos (fatura_id);
CREATE INDEX IF NOT EXISTS idx_caixa_movs_data ON caixa_movs (data);
CREATE INDEX IF NOT EXISTS idx_caixa_movs_tipo ON caixa_movs (tipo);
CREATE INDEX IF NOT EXISTS idx_caixa_movs_categoria ON caixa_movs (categoria);
CREATE INDEX IF NOT EXISTS idx_caixa_movs_banco ON caixa_movs (banco);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_timestamp ON auditoria_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_userid ON auditoria_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_acao ON auditoria_logs (acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_tabela ON auditoria_logs (tabela);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id SERIAL PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox (status);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox (entity);

CREATE TABLE IF NOT EXISTS deleted_data (
  id SERIAL PRIMARY KEY,
  trash_uid TEXT NOT NULL UNIQUE,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  label TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_by TEXT,
  deleted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  restored_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deleted_data_entity ON deleted_data (entity);
CREATE INDEX IF NOT EXISTS idx_deleted_data_expires ON deleted_data (expires_at);
`;

const needsSsl = /sslmode=require/i.test(connectionString) || /neon\.tech/i.test(connectionString);
const client = new Client({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

try {
  await client.connect();
  await client.query(sql);
  console.log('NEON_SCHEMA_OK');
} catch (err) {
  console.error('NEON_SCHEMA_ERROR');
  console.error(err);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
