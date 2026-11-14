<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# IMP / NHOMINCA - Sistema de Gestão Marítima e Financeira

Aplicação web (React + Vite + Express/TypeScript) para gestão portuária, faturação, tesouraria e relatórios.

## Executar localmente

**Pré-requisitos:** Node.js 20+

1. Instalar dependências:
   - `npm install` (no Windows PowerShell, se `npm` estiver bloqueado pela Execution Policy, use `cmd /c "npm install"`)
2. Criar `.env` ou `.env.local` com base em `.env.example`
3. Iniciar em desenvolvimento:
   - `npm run dev`
4. Aceder em: `http://localhost:3000`

> Sem base de dados configurada, o sistema entra em modo de fallback com dados mock (útil para testes locais), mas **não partilha dados entre computadores**.

## Segurança (melhorias implementadas)

- Autenticação de API com sessão/token no servidor (`/api/auth/login`, `/api/auth/logout`)
- Proteção das rotas `/api/*` em produção (ou quando `ENABLE_API_AUTH=true`)
- Headers de segurança básicos (CORS configurável, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.)
- Limite de tentativas de login (rate limiting básico no servidor)
- Suporte a sessão no cliente com token Bearer para chamadas à API

### Variáveis de segurança/servidor
- `CORS_ORIGIN`: origens permitidas (separadas por vírgula) em produção
- `ENABLE_API_AUTH=true`: força autenticação da API em desenvolvimento
- `DISABLE_API_AUTH=true`: desativa autenticação da API (apenas para cenários controlados)
- `JSON_LIMIT`: limite de tamanho do corpo JSON (ex.: `10mb`)

## Uso simultâneo em vários computadores (5+)

Para funcionar corretamente com vários computadores ao mesmo tempo, o sistema deve usar um **backend partilhado** e uma **base de dados partilhada**:

1. Hospedar a aplicação num servidor acessível pela rede/internet
2. Configurar `DATABASE_URL` (PostgreSQL recomendado) para todos os utilizadores apontarem para a mesma base de dados
3. Garantir que todos acedem à mesma URL do sistema (mesma instância/cluster configurado)
4. Usar HTTPS em produção

Sem uma base de dados partilhada, cada instalação/ambiente pode operar com dados locais/mock e não haverá sincronização entre computadores.

## Preparação para hospedagem

### Build e arranque (produção)
- Build: `npm run build`
- Start: `npm start`

### Requisitos recomendados em produção
- `NODE_ENV=production`
- `DATABASE_URL` configurada (PostgreSQL)
- `CORS_ORIGIN` configurado para o domínio da aplicação
- Autenticação da API ativa (padrão em produção)
- HTTPS (terminado no provedor/proxy/reverse proxy)

### Render (exemplo)
O ficheiro `render.yaml` já inclui uma configuração base para hospedagem no Render. Configure as variáveis sensíveis no painel do provedor (`DATABASE_URL`, `CORS_ORIGIN`, etc.).

## Observações
- Se houver erro de acesso ao `npm.ps1` no PowerShell (Execution Policy), execute os comandos via `cmd /c "npm ..."` ou ajuste a política de execução da sessão.
- Em produção, valide credenciais, políticas de acesso e backups da base de dados antes de uso institucional.
