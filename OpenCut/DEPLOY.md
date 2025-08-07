# Deploy no Vercel - OpenCut Social Media Generator

Este guia contém todas as instruções para fazer o deploy do OpenCut no Vercel.

## Pré-requisitos

1. **Conta no Vercel**: Acesse [vercel.com](https://vercel.com) e crie uma conta
2. **Serviços Externos**: Configure os seguintes serviços:
   - **PostgreSQL Database** (Sugestão: Neon, Supabase, ou Vercel Postgres)
   - **Redis** (Upstash Redis)
   - **OpenAI API** (Para geração de texto)
   - **Runware API** (Para geração de imagens)
   - **Freesound API** (Para assets de áudio)

## Configuração das Variáveis de Ambiente

No painel do Vercel, configure as seguintes variáveis de ambiente:

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Authentication
```
BETTER_AUTH_SECRET=your-better-auth-secret-key-min-32-chars
NEXT_PUBLIC_BETTER_AUTH_URL=https://seu-dominio.vercel.app
```

### Redis (Upstash)
```
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### AI Services
```
OPENAI_API_KEY=sk-your-openai-api-key
RUNWARE_API_KEY=your-runware-api-key
```

### Audio Services
```
FREESOUND_CLIENT_ID=your-freesound-client-id
FREESOUND_API_KEY=your-freesound-api-key
```

### Build Configuration (Opcional)
```
ANALYZE=false
NODE_ENV=production
```

## Deploy pelo Dashboard Vercel

1. **Conectar Repositório**:
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Conecte seu repositório GitHub

2. **Configurar Projeto**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `OpenCut/apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Configurar Variáveis de Ambiente**:
   - Na aba "Environment Variables", adicione todas as variáveis listadas acima
   - Configure para todos os ambientes (Production, Preview, Development)

4. **Deploy**:
   - Clique em "Deploy"
   - Aguarde o processo de build completar

## Deploy via CLI Vercel

1. **Instalar CLI**:
```bash
npm i -g vercel
```

2. **Fazer Login**:
```bash
vercel login
```

3. **Configurar Projeto**:
```bash
cd OpenCut
vercel
```

4. **Configurar Variáveis**:
```bash
vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET
vercel env add NEXT_PUBLIC_BETTER_AUTH_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add OPENAI_API_KEY
vercel env add RUNWARE_API_KEY
vercel env add FREESOUND_CLIENT_ID
vercel env add FREESOUND_API_KEY
```

5. **Deploy para Production**:
```bash
vercel --prod
```

## Configuração do Banco de Dados

Após o deploy, execute as migrações do banco:

```bash
# Local (com DATABASE_URL de produção)
npm run db:push:prod
```

## Pós-Deploy

1. **Verificar Funcionalidades**:
   - ✅ Login/Registro de usuários
   - ✅ Upload de mídia
   - ✅ Edição de timeline
   - ✅ Geração de carrosséis IA
   - ✅ Background generation
   - ✅ Canvas navigation

2. **Configurar Domínio Personalizado** (Opcional):
   - No dashboard Vercel, vá em "Domains"
   - Adicione seu domínio personalizado
   - Configure DNS conforme instruído

3. **Monitoramento**:
   - Verifique logs em tempo real no dashboard Vercel
   - Configure alertas de erro se necessário

## Estrutura de Arquivos Relevantes

```
OpenCut/
├── vercel.json                 # Configuração Vercel
├── apps/web/
│   ├── next.config.mjs        # Configuração Next.js
│   ├── .env.example           # Exemplo de variáveis
│   ├── package.json           # Dependências
│   └── src/
│       ├── env.ts             # Validação de env vars
│       └── lib/
│           ├── auth/keys.ts   # Auth variables
│           └── db/keys.ts     # Database variables
```

## Troubleshooting

### Build Errors
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se a versão do Node.js é compatível (18+)
- Verifique os logs de build no dashboard Vercel

### Runtime Errors
- Verifique conexão com banco de dados
- Confirme se as APIs externas estão funcionando
- Verifique logs de função no dashboard Vercel

### Performance
- O projeto usa Next.js 15 com otimizações automáticas
- WebAssembly (FFmpeg) é carregado sob demanda
- Assets são otimizados automaticamente pelo Vercel

## Recursos Utilizados

- **Framework**: Next.js 15 com App Router
- **Database**: PostgreSQL com Drizzle ORM
- **Storage**: Vercel OPFS para arquivos temporários
- **AI**: OpenAI + Runware para geração de conteúdo
- **Cache**: Redis para performance
- **Auth**: Better Auth para autenticação

## Suporte

Para problemas específicos do deploy, verifique:
1. [Documentação Vercel](https://vercel.com/docs)
2. [Next.js Deployment](https://nextjs.org/docs/deployment)
3. Logs no dashboard do Vercel