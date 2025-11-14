# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d419677f-892e-44f7-aeaa-50aa90d000e2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d419677f-892e-44f7-aeaa-50aa90d000e2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend e infraestrutura

- Fastify + Prisma para expor a API REST (`server/src`)
- Postgres 16 (dados principais) e Redis 7 (fila BullMQ) — os serviços já existem na stack Portainer descrita pelo usuário
- Rotas com múltiplos destinos, histórico de tentativas por destino e replays a partir da API/UX

### Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```
DATABASE_URL=postgresql://appuser4r3:9wg4hw948gha048gh@postgres-db:5432/appdb134
REDIS_URL=redis://redis-db:6379
SERVER_PORT=4000
WEBHOOK_DEFAULT_SECRET=change-this-secret
VITE_API_URL=http://localhost:4000
```

### Rodando a API / fila de entregas

```
npm install
npx prisma generate
npm run server:dev
```

Use `npm run prisma:generate` e `npx prisma migrate dev` para aplicar o schema no Postgres do Portainer. A aplicação frontend continua com `npm run dev`, agora consumindo `VITE_API_URL`.

### Docker

1. Copie `.env.example` para `.env` (ajuste `DATABASE_URL`/`REDIS_URL` se usar recursos externos em vez dos contêineres locais).
2. Construa e suba todos os serviços:

```sh
docker compose up --build -d
```

3. Aplique as migrações no banco que roda dentro do compose:

```sh
docker compose run --rm server npx prisma migrate deploy
```

Os serviços expõem:

- Frontend: http://localhost:5173
- API Fastify: http://localhost:4000
- Postgres: localhost:5432
- Redis: localhost:6379

Se você já tiver Postgres/Redis externos (ex.: stack Portainer existente), basta desligar esses serviços no `docker-compose.yml` e apontar `DATABASE_URL`/`REDIS_URL` para os hosts corretos.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d419677f-892e-44f7-aeaa-50aa90d000e2) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
