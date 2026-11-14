-- =====================================================================
-- INSTITUTO MARÍTIMO PORTUÁRIO DA GUINÉ-BISSAU (IMP)
-- Schema MySQL para WampServer / XAMPP / MariaDB / MySQL Local
-- =====================================================================

CREATE DATABASE IF NOT EXISTS imp_sistema_maritimo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE imp_sistema_maritimo;

-- 1. Tabela de Utilizadores / Operadores
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(64) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  funcao VARCHAR(50) NOT NULL, -- superadmin | admin | faturacao | caixa
  role VARCHAR(50),
  departamento VARCHAR(100) NOT NULL DEFAULT 'Operações Marítimas',
  status VARCHAR(30) NOT NULL DEFAULT 'Ativo',
  active BOOLEAN DEFAULT TRUE,
  avatar VARCHAR(255),
  foto_url TEXT,
  telefone VARCHAR(30),
  senha VARCHAR(255),
  ultimo_acesso VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabela de Faturas Portuárias
CREATE TABLE IF NOT EXISTS faturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fatura_uid VARCHAR(64) NOT NULL UNIQUE,
  ano INT NOT NULL DEFAULT 2026,
  seq INT NOT NULL DEFAULT 1,
  n_fatura VARCHAR(50) NOT NULL,
  data VARCHAR(30) NOT NULL,
  cliente VARCHAR(200) NOT NULL,
  nif VARCHAR(50) NOT NULL,
  navio VARCHAR(150) NOT NULL,
  tipo VARCHAR(100) NOT NULL DEFAULT 'Pesqueiro',
  gross_tonnage DOUBLE NOT NULL DEFAULT 0,
  itens JSON NOT NULL,
  subtotal DOUBLE NOT NULL DEFAULT 0,
  iva DOUBLE NOT NULL DEFAULT 0,
  total DOUBLE NOT NULL DEFAULT 0,
  saldo_pago DOUBLE NOT NULL DEFAULT 0,
  saldo_pendente DOUBLE NOT NULL DEFAULT 0,
  recibos JSON,
  estado VARCHAR(30) NOT NULL DEFAULT 'rascunho', -- rascunho | confirmada | parcial | paga | anulada
  criado_por VARCHAR(150) NOT NULL DEFAULT 'Sistema IMP',
  justificativa_anulacao TEXT,
  anulado_por VARCHAR(150),
  data_anulacao VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabela de Recibos de Quitação
CREATE TABLE IF NOT EXISTS recibos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recibo_uid VARCHAR(64) NOT NULL UNIQUE,
  n_recibo VARCHAR(50) NOT NULL,
  fatura_id VARCHAR(64) NOT NULL,
  n_fatura VARCHAR(50) NOT NULL,
  total_fatura DOUBLE NOT NULL DEFAULT 0,
  valor_anterior_pago DOUBLE NOT NULL DEFAULT 0,
  valor DOUBLE NOT NULL DEFAULT 0,
  saldo_restante DOUBLE NOT NULL DEFAULT 0,
  is_liquidacao_total BOOLEAN NOT NULL DEFAULT TRUE,
  banco VARCHAR(50) NOT NULL DEFAULT 'CORIS BANK',
  talao VARCHAR(100) NOT NULL,
  data VARCHAR(30) NOT NULL,
  hora VARCHAR(10) NOT NULL,
  emissor VARCHAR(150) NOT NULL,
  cliente VARCHAR(200) NOT NULL,
  navio VARCHAR(150),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela de Movimentos de Caixa (Tesouraria & Folha de Caixa)
CREATE TABLE IF NOT EXISTS caixa_movs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mov_uid VARCHAR(64) NOT NULL UNIQUE,
  data VARCHAR(30) NOT NULL,
  hora VARCHAR(10) NOT NULL,
  descricao TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- entrada | saida
  valor DOUBLE NOT NULL,
  saldo_apos DOUBLE NOT NULL,
  criado_por VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  talao VARCHAR(100),
  banco VARCHAR(50),
  documento_comprovativo VARCHAR(100),
  beneficiario VARCHAR(200),
  autorizado_por VARCHAR(150),
  justificativa TEXT,
  comprovativo_anexo LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela de Logs de Auditoria Criptográfica
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_uid VARCHAR(64) NOT NULL UNIQUE,
  timestamp VARCHAR(50) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  user_email VARCHAR(150) NOT NULL,
  acao VARCHAR(100) NOT NULL,
  tabela VARCHAR(100) NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  payload_json TEXT NOT NULL,
  hash_sha256 VARCHAR(128) NOT NULL,
  prev_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela de Embarcações
CREATE TABLE IF NOT EXISTS embarcacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  embarcacao_uid VARCHAR(64) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  numero_imo VARCHAR(50) NOT NULL,
  indicativo_chamada VARCHAR(50) NOT NULL,
  bandeira VARCHAR(50) NOT NULL,
  porto_registo VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  tonelagem_bruta DOUBLE NOT NULL DEFAULT 0,
  comprimento_fora_fora DOUBLE NOT NULL DEFAULT 0,
  calado_maximo DOUBLE NOT NULL DEFAULT 0,
  ano_construcao INT NOT NULL DEFAULT 2020,
  armador_id VARCHAR(64) NOT NULL,
  armador_nome VARCHAR(150) NOT NULL,
  agencia_id VARCHAR(64) NOT NULL,
  agencia_nome VARCHAR(150) NOT NULL,
  status_certificacao VARCHAR(50) NOT NULL DEFAULT 'Válida',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabela de Agências Marítimas
CREATE TABLE IF NOT EXISTS agencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agencia_uid VARCHAR(64) NOT NULL UNIQUE,
  nome_comercial VARCHAR(200) NOT NULL,
  nif VARCHAR(50) NOT NULL,
  licenca_atividade VARCHAR(100) NOT NULL,
  responsavel_legal VARCHAR(150) NOT NULL,
  telefone VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL,
  endereco TEXT NOT NULL,
  embarcacoes_representadas INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Ativa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir Utilizadores Iniciais para WampServer (Faturação, Caixa, Admin)
INSERT INTO users (uid, nome, email, cargo, funcao, departamento, telefone, senha) VALUES
('USR-FAT', 'Eng. Faturação IMP', 'faturacao@imp.gw', 'Operador de Faturação', 'faturacao', 'Faturação & Tarifas', '+245 95 555 28 79', 'faturacao123'),
('USR-CAIXA', 'Álvaro Luis Da Silva', 'caixa@imp.gw', 'Chefe de Tesouraria', 'caixa', 'Tesouraria & Caixa', '+245 96 111 22 33', 'caixa123'),
('USR-ADMIN', 'Dr. Gualdino Afonso Té', 'admin@imp.gw', 'Presidente do Conselho de Administração (PCA)', 'superadmin', 'Administração Geral', '+245 97 999 88 77', 'superadmin123')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);
