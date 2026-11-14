# Guia de Instalação e Execução no WampServer (MySQL / MariaDB)

O **Sistema de Gestão Marítima e Portuária do IMP (Guiné-Bissau)** foi arquitetado para suportar **dois motores de base de dados** em simultâneo:
1. **PostgreSQL** (para ambientes em nuvem, ex: Cloud SQL / Render / Supabase).
2. **MySQL / MariaDB** (para servidores locais, incluindo **WampServer** e **XAMPP**).

---

## Passo 1: Importar a Base de Dados no WampServer (phpMyAdmin)
1. Inicie o **WampServer** (o ícone na barra de tarefas deve ficar a **verde**).
2. Abra o browser e aceda a [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/).
3. Inicie sessão (por defeito: utilizador `root`, sem palavra-passe).
4. Clique no separador **SQL** ou crie uma nova base de dados com o nome `imp_sistema_maritimo`.
5. Em alternativa, pode importar diretamente o ficheiro **`database_wamp_mysql.sql`** fornecido na raiz do projeto através do menu **Importar** do phpMyAdmin.

---

## Passo 2: Configurar o Ficheiro `.env` para WampServer
Na pasta raiz do projeto, crie ou edite o ficheiro `.env` com as seguintes variáveis para ligar ao MySQL do WampServer:

```env
# Configuração do Servidor
PORT=3000

# Se optar por usar MySQL (WampServer local)
DB_DRIVER=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=imp_sistema_maritimo

# (Opcional) Se mantiver PostgreSQL / Cloud SQL
SQL_HOST=
SQL_DB_NAME=
SQL_USER=
SQL_PASSWORD=
```

---

## Passo 3: Executar a Aplicação Localmente
Abra o terminal na pasta do projeto e execute:

```bash
# Instalar dependências (caso ainda não tenha feito)
npm install

# Iniciar o servidor de desenvolvimento e API backend
npm run dev
```

O sistema ficará disponível em **`http://localhost:3000`**. Os utilizadores pré-configurados para acesso imediato no WampServer são:
- **Faturação**: `faturacao@imp.gw` / `faturacao123`
- **Caixa / Tesouraria**: `caixa@imp.gw` / `caixa123`
- **SuperAdmin / PCA**: `admin@imp.gw` / `superadmin123`
