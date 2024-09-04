# Anime Explorer

Anime Explorer é uma aplicação web para gerenciamento de listas de animes, permitindo aos usuários pesquisar, favoritar e planejar os animes que desejam assistir.

## Funcionalidades

- Autenticação de usuários (registro e login)
- Pesquisa de animes
- Visualização detalhada de informações sobre animes
- Gerenciamento de lista de favoritos
- Gerenciamento de lista "assistir depois"

## Tecnologias Utilizadas

- Backend:

  - Node.js
  - Hono.js (framework web)
  - Prisma (ORM)
  - PostgreSQL (banco de dados)
  - JWT para autenticação
  - Zod para validação de esquemas

- Frontend:
  - Next.js
  - React
  - Chakra UI
  - React Query

## Pré-requisitos

- Node.js (versão 14 ou superior)
- Docker e Docker Compose
- Yarn

## Instalação

1. Clone o repositório:

   ```
   git clone https://github.com/leandrakelly/anime-list-app.git
   cd anime-list-app
   ```

2. Instale as dependências:

   ```
   yarn install
   ```

3. Configure as variáveis de ambiente:

   - Crie um arquivo `.env` na pasta `packages/backend`
   - Adicione as seguintes variáveis:
     ```
     DATABASE_URL=postgresql://user:password@localhost:5432/anime_explorer
     JWT_SECRET=seu_segredo_jwt
     ```

4. Inicie o banco de dados PostgreSQL usando Docker Compose:

   ```
   cd packages/backend
   docker-compose up -d
   ```

5. Execute as migrações do banco de dados:

   ```
   yarn prisma migrate dev
   ```

6. Inicie o servidor de desenvolvimento:
   ```
   cd ../..
   yarn dev
   ```

A aplicação estará disponível em `http://localhost:3000`.

## Uso

Após iniciar a aplicação, você pode:

1. Criar uma conta ou fazer login
2. Pesquisar animes usando a barra de busca
3. Visualizar detalhes dos animes
4. Adicionar animes à sua lista de favoritos ou "assistir depois"
5. Gerenciar suas listas pessoais
