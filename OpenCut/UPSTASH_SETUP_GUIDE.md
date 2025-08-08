# Configuração do Upstash PostgreSQL

## Passo 1: Criar Banco PostgreSQL no Upstash

1. Acesse https://console.upstash.com/
2. Clique em "PostgreSQL"
3. Clique em "Create Database"
4. Configure:
   - **Database Name**: `opencut-production`
   - **Region**: `us-east-1` (ou região mais próxima do seu Vercel)
   - **Plan**: Free (ou pago conforme necessidade)
5. Clique em "Create"

## Passo 2: Obter Credenciais

Após criar o banco, você verá as credenciais:

```
POSTGRES_URL="postgresql://[username]:[password]@[host]:[port]/[database]"
POSTGRES_PRISMA_URL="postgresql://[username]:[password]@[host]:[port]/[database]?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=disable"
POSTGRES_URL_NON_POOLING="postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require"
POSTGRES_USER="[username]"
POSTGRES_HOST="[host]"
POSTGRES_PASSWORD="[password]"
POSTGRES_DATABASE="[database]"
```

## Passo 3: Configurar Redis do Upstash (se não tiver)

1. Na console do Upstash, clique em "Redis"
2. Clique em "Create Database"
3. Configure:
   - **Name**: `opencut-redis`
   - **Region**: mesma região do PostgreSQL
   - **Plan**: Free
4. Obtenha as credenciais:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Próximos Passos

Depois de obter as credenciais, me informe e eu vou:
1. Atualizar as variáveis de ambiente
2. Executar as migrações
3. Testar a conexão
4. Deployar para produção

## Credenciais Necessárias

Cole aqui suas credenciais quando obtê-las:

```env
# PostgreSQL Upstash
DATABASE_URL="postgresql://..."

# Redis Upstash (se não tiver ainda)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."