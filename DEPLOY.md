# Como colocar tudo no ar de graça

Duas peças para publicar: o **frontend** (esta pasta, `webapp/`) e o **backend**
(pasta `backend/`, entregue à parte). Dá para publicar as duas 100% de graça.

## 1. Frontend (Vercel — gratuito)

O jeito mais simples é sem nem usar linha de comando:

1. Crie uma conta em **github.com** (se ainda não tiver) e um repositório novo, por exemplo `auditoria-solar-frontend`.
2. Suba o conteúdo desta pasta (`webapp/`) para esse repositório — pelo site do GitHub mesmo: botão **"Add file" → "Upload files"**, arraste todos os arquivos e pastas (menos `node_modules`, que nem deveria existir aí) e clique em **Commit**.
3. Crie uma conta em **vercel.com** usando "Continue with GitHub" (login único, sem precisar criar senha nova).
4. No painel da Vercel, clique em **"Add New" → "Project"**, escolha o repositório que você acabou de criar.
5. A Vercel detecta sozinha que é um projeto Vite — não precisa mudar nada, só clicar em **"Deploy"**.
6. Em 1-2 minutos você recebe uma URL do tipo `https://auditoria-solar-frontend.vercel.app` — já é pública, com HTTPS, de graça, para sempre (dentro do uso normal de um protótipo interno).

Toda vez que você atualizar o código no GitHub, a Vercel republica sozinha.

### Alternativas igualmente gratuitas
- **Netlify** (netlify.com) — mesmo fluxo, arrastar a pasta ou conectar o GitHub.
- **GitHub Pages** — funciona, mas exige um passo extra de configurar o `base` no `vite.config.js`; a Vercel é mais direta para este caso.

## 2. Backend (Render + Neon — gratuito)

O backend precisa de duas coisas: onde rodar a API e onde guardar o banco de dados.

### 2.1 Banco de dados — Neon (Postgres gratuito, permanente)
1. Crie uma conta em **neon.tech** (tem opção de login com GitHub).
2. Crie um projeto novo — ele já entrega uma **Connection String** pronta, algo como:
   `postgresql://usuario:senha@ep-xxxx.neon.tech/neondb`
3. Guarde essa string — é o valor que vai virar `DATABASE_URL` no próximo passo. Troque o início de `postgresql://` para `postgresql+psycopg2://` (o backend usa SQLAlchemy com esse driver).

### 2.2 API — Render (gratuito, com um detalhe)
1. Suba a pasta `backend/` para um repositório do GitHub (mesmo processo do frontend).
2. Crie uma conta em **render.com** com "Continue with GitHub".
3. **"New" → "Web Service"**, escolha o repositório do backend.
4. Configure:
   - **Runtime**: Docker (o `Dockerfile` já está pronto na pasta)
   - **Instance type**: Free
5. Em **Environment**, adicione a variável `DATABASE_URL` com a connection string do Neon (já com `+psycopg2`).
6. Clique em **Deploy**. Em alguns minutos você recebe uma URL do tipo `https://auditoria-solar-api.onrender.com`.

**Detalhe do plano gratuito do Render**: o serviço "dorme" depois de ~15 minutos sem uso e demora ~30-50 segundos para acordar na primeira requisição seguinte. Para um painel de uso interno isso costuma ser aceitável; se incomodar, dá para trocar depois para o plano pago mais barato do Render (a partir de poucos dólares/mês) sem mudar nada no código.

### Alternativas ao Render
- **Fly.io** — tem uma camada gratuita, exige instalar a CLI `flyctl` (um passo a mais, mas não dorme tão agressivamente).
- **Railway** — hoje cobra depois de um período de teste; não é mais gratuito de forma permanente.

## 3. Conectando o frontend ao backend real

Hoje o `webapp/src/App.jsx` usa dados de exemplo direto no código (os arrays `USINAS`, `UCS` etc.), para você já ver a tela funcionando sem depender do backend estar no ar. Quando quiser conectar de verdade:

1. Depois de publicar o backend, adicione ao `webapp` um arquivo `.env` com:
   ```
   VITE_API_URL=https://auditoria-solar-api.onrender.com
   ```
2. Troque os arrays fixos por chamadas `fetch(`${import.meta.env.VITE_API_URL}/dashboard?competencia=...`)`.
3. Redeploy — a Vercel também lê `VITE_API_URL` se você adicionar essa variável nas configurações do projeto lá (Settings → Environment Variables).

Esse é o próximo passo natural depois de validar que as duas partes estão publicadas e no ar.
