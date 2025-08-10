# Guia de Configuração Supabase - Server-First Architecture

## Passo 1: Executar SQL Migration no Supabase

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com) 
   - Entre na sua conta
   - Selecione seu projeto

2. **Execute a Migration SQL**
   - Vá para "SQL Editor" no menu lateral
   - Abra o arquivo `OpenCut/supabase-migration.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" para executar

## Passo 2: Configurar Variáveis de Ambiente

Crie ou atualize o arquivo `.env.local` na pasta `OpenCut/apps/web/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Better Auth Configuration  
BETTER_AUTH_SECRET=seu-secret-key-de-32-caracteres-aqui
BETTER_AUTH_URL=http://localhost:3000
# Para produção: BETTER_AUTH_URL=https://seu-dominio.com

# Database Configuration
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Runware API (manter existente)
RUNWARE_API_KEY=sua-runware-key-existente
```

## Passo 3: Obter as Keys do Supabase

1. **No Supabase Dashboard:**
   - Vá para "Settings" → "API"
   - Copie a "Project URL" → use em `NEXT_PUBLIC_SUPABASE_URL`
   - Copie a "anon public" key → use em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copie a "service_role" key → use em `SUPABASE_SERVICE_ROLE_KEY`

2. **Para DATABASE_URL:**
   - Vá para "Settings" → "Database"
   - Na seção "Connection string"
   - Copie a "URI" e substitua [PASSWORD] pela sua senha do banco

## Passo 4: Configurar Storage Bucket

1. **No Supabase Dashboard:**
   - Vá para "Storage"
   - O bucket "media-files" deve ter sido criado automaticamente pela migration
   - Se não existir, crie manualmente:
     - Nome: `media-files`
     - Público: ❌ (deixe privado)
     - File size limit: 100MB
     - Allowed MIME types: `image/*,video/*,audio/*`

## Passo 5: Configurar Better Auth Secret

```bash
# Gerar um secret key de 32 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o resultado no `BETTER_AUTH_SECRET`

## Passo 6: Teste Local

```bash
cd OpenCut/apps/web
npm run dev
```

1. Acesse http://localhost:3000
2. Deve ser redirecionado para tela de login
3. Registre uma nova conta
4. Teste criação de projeto
5. Teste geração de imagem AI
6. Verifique se dados estão sendo salvos no Supabase

## Passo 7: Deploy na Vercel

1. **Configure as Variáveis no Vercel:**
   - Vá para seu projeto no Vercel Dashboard
   - "Settings" → "Environment Variables"
   - Adicione todas as variáveis do `.env.local`
   - **IMPORTANTE:** Altere `BETTER_AUTH_URL` para sua URL de produção

2. **Deploy:**
```bash
# Na pasta OpenCut/
git add .
git commit -m "Add server-first architecture with Supabase migration"
git push origin main
```

## Passo 8: Verificação Final

### No Supabase:
- ✅ Tabelas criadas (7 tabelas principais)
- ✅ RLS policies ativas 
- ✅ Storage bucket configurado
- ✅ Índices de performance criados

### No Vercel:
- ✅ Deploy sem erros
- ✅ Variáveis de ambiente configuradas
- ✅ Aplicação acessível

### Funcionalidades:
- ✅ Login/registro funcionando
- ✅ Criação de projetos
- ✅ Geração de imagens AI
- ✅ Timeline funcionando
- ✅ Dados persistindo no servidor
- ✅ Acesso multi-dispositivo

## Migração de Dados Existentes

Se você tem dados locais (IndexedDB), use a ferramenta de migração:

1. Faça login na aplicação
2. Acesse qualquer projeto
3. Deve aparecer um dialog de migração
4. Clique em "Migrar Dados"
5. Aguarde a transferência completa

## Troubleshooting

### Erro de Conexão com Banco:
- Verifique se a `DATABASE_URL` está correta
- Confirme que a senha do Postgres está certa
- Teste conexão no Supabase SQL Editor

### Erro de Autenticação:
- Confirme que o `BETTER_AUTH_SECRET` tem 32 caracteres
- Verifique se a `BETTER_AUTH_URL` está correta para o ambiente

### Erro de Upload de Arquivos:
- Confirme que o bucket "media-files" existe
- Verifique se as RLS policies foram aplicadas
- Teste com arquivo pequeno primeiro

### Performance Lenta:
- Confirme que os índices foram criados
- Verifique se há dados desnecessários no banco
- Use o SQL Editor para verificar queries lentas

## Status Final

✅ **Arquitetura Server-First Completa**
- Migração completa de IndexedDB → PostgreSQL
- Sistema de autenticação integrado
- Armazenamento seguro de arquivos
- Acesso multi-dispositivo habilitado
- Dados isolados por usuário
- Performance otimizada com índices