# Configuração OAuth do Supabase - Instruções

## Problema
O OAuth está redirecionando para localhost porque as URLs de callback precisam ser configuradas no dashboard do Supabase.

## Solução - Passo a Passo

### 1. Acesse o Dashboard do Supabase
- Entre em https://app.supabase.com
- Selecione seu projeto

### 2. Configure as URLs de Callback
1. No menu lateral, vá para **Authentication** > **URL Configuration**
2. Em **Redirect URLs**, adicione TODAS as seguintes URLs:

```
http://localhost:3000/api/auth/callback
https://socialmedia-k42w39h88-lucianos-projects-b0bcbedf.vercel.app/api/auth/callback
https://genid.theforce.cc/api/auth/callback
```

### 3. Configure o Google OAuth (se ainda não fez)
1. Vá para **Authentication** > **Providers**
2. Clique em **Google**
3. Ative o provider
4. Adicione suas credenciais do Google Cloud Console:
   - Client ID
   - Client Secret

### 4. No Google Cloud Console
Se você ainda não configurou no Google Cloud Console:

1. Acesse https://console.cloud.google.com
2. Vá para **APIs & Services** > **Credentials**
3. Em **Authorized redirect URIs**, adicione APENAS este URL do Supabase:
   - `https://yourproject.supabase.co/auth/v1/callback` (substitua "yourproject" pelo ID do seu projeto Supabase)
   
   **IMPORTANTE**: Este é o URL que o Google usa para redirecionar para o Supabase. O Supabase então redireciona para as URLs da sua aplicação configuradas no passo 2.

### 5. Teste a Autenticação
Após configurar tudo:
1. Acesse https://genid.theforce.cc
2. Clique em "Login with Google"
3. Deve redirecionar corretamente para a aplicação após o login

## URLs de Produção
- Vercel: https://socialmedia-k42w39h88-lucianos-projects-b0bcbedf.vercel.app
- Domínio customizado: https://genid.theforce.cc

## Importante - Fluxo de Redirecionamento
O fluxo OAuth com Supabase funciona assim:
1. Usuário clica em "Login with Google"
2. Google redireciona para: `https://yourproject.supabase.co/auth/v1/callback`
3. Supabase processa e redireciona para sua aplicação: `/api/auth/callback`

**Resumo das URLs:**
- **No Google Cloud Console**: Apenas o URL do Supabase com `/auth/v1/callback`
- **No Supabase Dashboard**: URLs da sua aplicação com `/api/auth/callback`
- As URLs devem corresponder EXATAMENTE ao que está configurado no código

## Verificação
Para verificar se está funcionando:
1. Abra o console do navegador (F12)
2. Tente fazer login
3. Observe a URL de redirecionamento no OAuth
4. Deve mostrar a URL de produção, não localhost