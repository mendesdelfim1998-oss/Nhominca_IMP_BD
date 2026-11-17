import { pgTable, text, serial, integer, doublePrecision, jsonb, timestamp, boolean, index } from 'drizzle-orm/pg-core';

// Users table (IMP operators, admins, inspectors, cashiers)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Unique identifier (e.g. USR-FAT or Firebase UID)
  nome: text('nome').notNull(),
  email: text('email').notNull(),
  cargo: text('cargo').notNull(),
  funcao: text('funcao').notNull(), // superadmin | admin | faturacao | caixa | INSPECTOR | etc.
  role: text('role'),
  departamento: text('departamento').notNull().default('Operações Marítimas'),
  status: text('status').notNull().default('Ativo'),
  active: boolean('active').default(true),
  avatar: text('avatar'),
  fotoUrl: text('foto_url'),
  telefone: text('telefone'),
  senha: text('senha'),
  ultimoAcesso: text('ultimo_acesso'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
}));

// Official IMP Invoices table
export const faturas = pgTable('faturas', {
  id: serial('id').primaryKey(),
  faturaUid: text('fatura_uid').notNull().unique(), // ID client-side (e.g. FAT-2026-0001)
  ano: integer('ano').notNull().default(2026),
  seq: integer('seq').notNull().default(1),
  nFatura: text('n_fatura').notNull(),
  data: text('data').notNull(),
  cliente: text('cliente').notNull(),
  nif: text('nif').notNull(),
  navio: text('navio').notNull(),
  tipo: text('tipo').notNull().default('Pesqueiro'),
  grossTonnage: doublePrecision('gross_tonnage').notNull().default(0),
  itens: jsonb('itens').notNull().default([]), // List of invoice items
  subtotal: doublePrecision('subtotal').notNull().default(0),
  iva: doublePrecision('iva').notNull().default(0),
  total: doublePrecision('total').notNull().default(0),
  saldoPago: doublePrecision('saldo_pago').notNull().default(0),
  saldoPendente: doublePrecision('saldo_pendente').notNull().default(0),
  recibos: jsonb('recibos').default([]), // List of receipt numbers
  estado: text('estado').notNull().default('rascunho'), // rascunho | confirmada | parcial | paga | anulada
  criadoPor: text('criado_por').notNull().default('Sistema IMP'),
  justificativaAnulacao: text('justificativa_anulacao'),
  anuladoPor: text('anulado_por'),
  dataAnulacao: text('data_anulacao'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  estadoIdx: index('idx_faturas_estado').on(table.estado),
  dataIdx: index('idx_faturas_data').on(table.data),
  clienteIdx: index('idx_faturas_cliente').on(table.cliente),
}));

// Official IMP Receipts table
export const recibos = pgTable('recibos', {
  id: serial('id').primaryKey(),
  reciboUid: text('recibo_uid').notNull().unique(), // e.g. REC-2026-0001
  nRecibo: text('n_recibo').notNull(),
  faturaId: text('fatura_id').notNull(),
  nFatura: text('n_fatura').notNull(),
  totalFatura: doublePrecision('total_fatura').notNull().default(0),
  valorAnteriorPago: doublePrecision('valor_anterior_pago').notNull().default(0),
  valor: doublePrecision('valor').notNull().default(0),
  saldoRestante: doublePrecision('saldo_restante').notNull().default(0),
  isLiquidacaoTotal: boolean('is_liquidacao_total').notNull().default(true),
  banco: text('banco').notNull().default('CORIS BANK'),
  talao: text('talao').notNull(),
  data: text('data').notNull(),
  hora: text('hora').notNull(),
  emissor: text('emissor').notNull(),
  cliente: text('cliente').notNull(),
  navio: text('navio'),
  observacoes: text('observacoes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dataIdx: index('idx_recibos_data').on(table.data),
  faturaIdIdx: index('idx_recibos_fatura_id').on(table.faturaId),
}));

// Cash movements / Folha de Caixa table with Optimized Indexes for Supabase & Vercel
export const caixaMovs = pgTable('caixa_movs', {
  id: serial('id').primaryKey(),
  movUid: text('mov_uid').notNull().unique(),
  data: text('data').notNull(),
  hora: text('hora').notNull(),
  descricao: text('descricao').notNull(),
  tipo: text('tipo').notNull(), // entrada | saida
  valor: doublePrecision('valor').notNull(),
  saldoApos: doublePrecision('saldo_apos').notNull(),
  criadoPor: text('criado_por').notNull(),
  categoria: text('categoria').notNull(),
  talao: text('talao'),
  banco: text('banco'),
  documentoComprovativo: text('documento_comprovativo'),
  beneficiario: text('beneficiario'),
  autorizadoPor: text('autorizado_por'),
  justificativa: text('justificativa'),
  comprovativoAnexo: text('comprovativo_anexo'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dataIdx: index('idx_caixa_movs_data').on(table.data),
  tipoIdx: index('idx_caixa_movs_tipo').on(table.tipo),
  categoriaIdx: index('idx_caixa_movs_categoria').on(table.categoria),
  bancoIdx: index('idx_caixa_movs_banco').on(table.banco),
}));

// Cryptographic Chained Audit Logs with Optimized Indexes for Supabase & Vercel
export const auditoriaLogs = pgTable('auditoria_logs', {
  id: serial('id').primaryKey(),
  logUid: text('log_uid').notNull().unique(),
  timestamp: text('timestamp').notNull(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  acao: text('acao').notNull(),
  tabela: text('tabela').notNull(),
  itemId: text('item_id').notNull(),
  payloadJson: text('payload_json').notNull(),
  hashSha256: text('hash_sha256').notNull(),
  prevHash: text('prev_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  timestampIdx: index('idx_auditoria_logs_timestamp').on(table.timestamp),
  userIdIdx: index('idx_auditoria_logs_userid').on(table.userId),
  acaoIdx: index('idx_auditoria_logs_acao').on(table.acao),
  tabelaIdx: index('idx_auditoria_logs_tabela').on(table.tabela),
}));

// Embarcações (Vessels)
export const embarcacoes = pgTable('embarcacoes', {
  id: serial('id').primaryKey(),
  embarcacaoUid: text('embarcacao_uid').notNull().unique(),
  nome: text('nome').notNull(),
  numeroImo: text('numero_imo').notNull(),
  indicativoChamada: text('indicativo_chamada').notNull(),
  bandeira: text('bandeira').notNull(),
  portoRegisto: text('porto_registo').notNull(),
  tipo: text('tipo').notNull(),
  tonelagemBruta: doublePrecision('tonelagem_bruta').notNull().default(0),
  comprimentoForaFora: doublePrecision('comprimento_fora_fora').notNull().default(0),
  caladoMaximo: doublePrecision('calado_maximo').notNull().default(0),
  anoConstrucao: integer('ano_construcao').notNull().default(2020),
  armadorId: text('armador_id').notNull(),
  armadorNome: text('armador_nome').notNull(),
  agenciaId: text('agencia_id').notNull(),
  agenciaNome: text('agencia_nome').notNull(),
  statusCertificacao: text('status_certificacao').notNull().default('Válida'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Agências Marítimas
export const agencias = pgTable('agencias', {
  id: serial('id').primaryKey(),
  agenciaUid: text('agencia_uid').notNull().unique(),
  nomeComercial: text('nome_comercial').notNull(),
  nif: text('nif').notNull(),
  licencaAtividade: text('licenca_atividade').notNull(),
  responsavelLegal: text('responsavel_legal').notNull(),
  telefone: text('telefone').notNull(),
  email: text('email').notNull(),
  endereco: text('endereco').notNull(),
  embarcacoesRepresentadas: integer('embarcacoes_representadas').notNull().default(0),
  status: text('status').notNull().default('Ativa'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Armadores
export const armadores = pgTable('armadores', {
  id: serial('id').primaryKey(),
  armadorUid: text('armador_uid').notNull().unique(),
  nomeRazaoSocial: text('nome_razao_social').notNull(),
  paisOrigem: text('pais_origem').notNull(),
  tipoEntidade: text('tipo_entidade').notNull().default('Nacional'),
  contactoOficial: text('contacto_oficial').notNull(),
  email: text('email').notNull(),
  frotaContada: integer('frota_contada').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Atracações
export const atracacoes = pgTable('atracacoes', {
  id: serial('id').primaryKey(),
  atracacaoUid: text('atracacao_uid').notNull().unique(),
  codigoEscala: text('codigo_escala').notNull(),
  embarcacaoId: text('embarcacao_id').notNull(),
  embarcacaoNome: text('embarcacao_nome').notNull(),
  agenciaNome: text('agencia_nome').notNull(),
  portoNome: text('porto_nome').notNull(),
  caisDesignado: text('cais_designado').notNull(),
  dataChegadaPrevista: text('data_chegada_prevista').notNull(),
  dataAtracacaoEfetiva: text('data_atracacao_efetiva'),
  dataSaidaPrevista: text('data_saida_prevista').notNull(),
  status: text('status').notNull().default('Anunciada'),
  servicosSolicitados: jsonb('servicos_solicitados').default([]),
  manifestoCarga: jsonb('manifesto_carga').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fila de sincronização local -> remoto (Neon)
export const syncOutbox = pgTable('sync_outbox', {
  id: serial('id').primaryKey(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation').notNull(), // upsert | delete
  payload: jsonb('payload').notNull().default({}),
  status: text('status').notNull().default('pending'), // pending | synced | failed
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
}, (table) => ({
  statusIdx: index('idx_sync_outbox_status').on(table.status),
  entityIdx: index('idx_sync_outbox_entity').on(table.entity),
}));

// Lixeira / dados apagados com retenção para recuperação
export const deletedData = pgTable('deleted_data', {
  id: serial('id').primaryKey(),
  trashUid: text('trash_uid').notNull().unique(),
  entity: text('entity').notNull(), // e.g. faturas, recibos, users
  entityId: text('entity_id').notNull(),
  label: text('label'),
  payload: jsonb('payload').notNull().default({}),
  deletedBy: text('deleted_by'),
  deletedAt: timestamp('deleted_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  restoredAt: timestamp('restored_at'),
}, (table) => ({
  entityIdx: index('idx_deleted_data_entity').on(table.entity),
  expiresIdx: index('idx_deleted_data_expires').on(table.expiresAt),
}));
