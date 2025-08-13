# Passo a Passo - Configuração do Supabase Auth

## 📋 Pré-requisitos
- Conta no Supabase (https://supabase.com)
- Projeto criado no Supabase
- Credenciais do Google OAuth (Google Cloud Console)

---

## 1️⃣ Obter Credenciais do Supabase

### No Dashboard do Supabase:
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Settings** (⚙️)
4. Vá para **API**
5. Copie e salve:
   - **Project URL**: `https://[seu-projeto].supabase.co`
   - **Anon/Public Key**: `eyJhbGciOi...` (chave longa)
   - **Service Role Key**: (não usar no frontend!)

### Connection String do Banco:
1. Em **Settings** → **Database**
2. Em **Connection string**, selecione **URI**
3. Copie o URL e substitua `[YOUR-PASSWORD]` pela senha do banco
   ```
   postgresql://postgres:[SUA-SENHA]@db.[seu-projeto].supabase.co:5432/postgres
   ```

---

## 2️⃣ Configurar Google OAuth no Google Cloud Console

### Criar Projeto no Google Cloud (se ainda não tiver):
1. Acesse https://console.cloud.google.com
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ (se necessário)

### Configurar OAuth 2.0:
1. Vá para **APIs & Services** → **Credentials**
2. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Selecione **Web application**
4. Configure:
   - **Name**: OpenCut Supabase Auth
   - **Authorized JavaScript origins**:
     ```
     https://[seu-projeto].supabase.co
     http://localhost:3001
     ```
   - **Authorized redirect URIs**:
     ```
     https://[seu-projeto].supabase.co/auth/v1/callback
     http://localhost:3001/api/auth/callback
     https://genid.theforce.cc/api/auth/callback
     ```
5. Clique em **CREATE**
6. Copie:
   - **Client ID**: `xxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxx`

---

## 3️⃣ Configurar Google OAuth no Supabase

### No Dashboard do Supabase:
1. Vá para **Authentication** no menu lateral
2. Clique em **Providers**
3. Encontre **Google** na lista
4. Ative o toggle para **Enable Google**
5. Cole as credenciais:
   - **Client ID**: (cole o Client ID do Google)
   - **Client Secret**: (cole o Client Secret do Google)
6. Em **Authorized Client IDs** (opcional), adicione:
   ```
   [seu-client-id].apps.googleusercontent.com
   ```
7. Clique em **Save**

---

## 4️⃣ Configurar Variáveis de Ambiente no Vercel

### No Dashboard do Vercel:
1. Acesse https://vercel.com/dashboard
2. Selecione o projeto **genid**
3. Vá para **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (sua anon key)

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[seu-projeto].supabase.co:5432/postgres

# Manter as existentes:
UPSTASH_REDIS_REST_URL=[manter a atual]
UPSTASH_REDIS_REST_TOKEN=[manter a atual]
OPENAI_API_KEY=[manter a atual]
RUNWARE_API_KEY=[manter a atual]
FREESOUND_CLIENT_ID=[manter a atual]
FREESOUND_API_KEY=[manter a atual]
```

5. Marque todas as variáveis para:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. Clique em **Save**

---

## 5️⃣ Configurar Arquivo .env.local (Desenvolvimento Local)

Crie ou atualize `OpenCut/apps/web/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (sua anon key)

# Database
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[seu-projeto].supabase.co:5432/postgres

# Redis (copiar do .env.local atual)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# AI Services (copiar do .env.local atual)
OPENAI_API_KEY=...
RUNWARE_API_KEY=...

# Audio (copiar do .env.local atual)
FREESOUND_CLIENT_ID=...
FREESOUND_API_KEY=...
```

---

## 6️⃣ Migrar Dados do Banco (Se Necessário)

### Sincronizar Usuários:
Se você tem usuários existentes no Better Auth, você precisa:

1. Criar usuários no Supabase Auth manualmente via Dashboard
2. OU usar a API do Supabase para criar usuários programaticamente
3. Manter o mesmo ID do usuário para não quebrar as referências

### Limpar Tabelas do Better Auth:
Após confirmar que tudo funciona:

```sql
-- Execute no SQL Editor do Supabase
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
```

---

## 7️⃣ Deploy e Teste

### Fazer Deploy:
```bash
# Commit das mudanças
git add .
git commit -m "feat: migrate to Supabase Auth"
git push origin master
```

### Testar Localmente:
```bash
cd OpenCut/apps/web
npm run dev
# Acessar http://localhost:3001
```

### Verificar em Produção:
1. Aguardar o deploy no Vercel completar
2. Acessar https://genid.theforce.cc
3. Testar o login com Google

---

## 8️⃣ Troubleshooting

### Erro "Invalid Redirect URL":
- Verifique se as URLs de callback estão corretas no Google Cloud Console
- Confirme que incluiu `/api/auth/callback` no final

### Erro "Missing Supabase URL":
- Verifique se as variáveis de ambiente estão configuradas
- No Vercel, pode ser necessário fazer redeploy após adicionar variáveis

### Usuários não aparecem no Supabase:
- Verifique em **Authentication** → **Users** no Dashboard
- Novos usuários são criados automaticamente no primeiro login

### Erro de CORS:
- Adicione seu domínio em **Authentication** → **URL Configuration**
- Site URL: `https://genid.theforce.cc`
- Redirect URLs: `https://genid.theforce.cc/api/auth/callback`

---

## ✅ Checklist Final

- [ ] Credenciais do Supabase copiadas
- [ ] Google OAuth configurado no Google Cloud Console
- [ ] Google Provider ativado no Supabase
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] .env.local atualizado para desenvolvimento
- [ ] Deploy realizado
- [ ] Login testado em localhost
- [ ] Login testado em produção

---

## 📞 Suporte

### Documentação:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js Integration](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Vídeos Úteis:
- [Supabase Auth with Next.js](https://www.youtube.com/watch?v=hpqGB9pMTNE)
- [Google OAuth Setup Tutorial](https://www.youtube.com/watch?v=_XM9ziOzWk4)