# WebhookHub

Plataforma para ingestão, armazenamento e redirecionamento de webhooks. Inspirada em soluções como Hookdeck, oferece fila de entregas com retries, múltiplos destinos por rota e painel React para monitoramento.

## Stack

- Vite + React + TypeScript + shadcn-ui (frontend)
- Fastify + Prisma + BullMQ (backend)
- Postgres 16 (persistência) e Redis 7 (fila)

## Pré-requisitos

- Node.js 20+
- npm
- Docker (opcional, para subida via compose)

## Configuração local

1. Instale dependências:
   ```sh
   npm install
   ```
2. Gere o client Prisma:
   ```sh
   npm run prisma:generate
   ```
3. Configure variáveis copiando `.env.example` para `.env` e ajustando URLs conforme seu banco/Redis.
4. Execute migrações:
   ```sh
   npx prisma migrate dev
   ```
5. Suba backend e frontend em terminais separados:
   ```sh
   npm run server:dev
   npm run dev
   ```

## Docker

Há dois Dockerfiles: `Dockerfile.server` (API) e `Dockerfile.web` (frontend). Para subir tudo de uma vez use o compose:

```sh
docker compose up --build -d
```

Aplique migrações dentro do contêiner da API (o entrypoint já executa `npx prisma migrate deploy` automaticamente ao subir em produção, mas você pode rodar manualmente se precisar):

```sh
docker compose run --rm server npx prisma migrate deploy
```

Serviços expostos (padrão do compose):

- Frontend: http://localhost:8081
- API Fastify: http://localhost:4100
- Postgres/Redis: usar as instâncias externas configuradas (por exemplo `postgres-db` e `redis-db` na rede `proxy`)

Se já houver Postgres/Redis externos (por exemplo, instâncias rodando em Portainer), remova-os do `docker-compose.yml` e ajuste `DATABASE_URL` / `REDIS_URL` nas variáveis de ambiente.

No Portainer, este stack assume que já existem contêineres `postgres-db` e `redis-db` na rede `proxy`. Ajuste o arquivo `stack.env` se os nomes mudarem e garanta que a rede `proxy` esteja marcada como externa no compose ou substitua pelo nome utilizado no seu ambiente.

## Scripts úteis

- `npm run lint` — ESLint
- `npm run server:build` — compila a API
- `npm run server:start` — inicia o bundle compilado
- `npm run prisma:generate` — atualiza o client Prisma

## Fluxo de uso

1. Cadastre um projeto via API (`POST /api/projects`) ou ajuste para expor um formulário no front.
2. Crie rotas usando o modal “Nova Rota” e defina múltiplos destinos.
3. Direcione seus provedores externos para `POST /api/inbound/:slug?secret=...` com o segredo fornecido no painel.
4. Utilize as abas “Eventos” e “Rotas” para monitorar entregas, consultar payloads, tentativas e reenfileirar eventos.
