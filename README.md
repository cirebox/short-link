# Short Link API

API RESTful para encurtamento de URLs, desenvolvida como projeto pessoal com Node.js e NestJS.

## Funcionalidades

- Encurtamento de URLs com slugs customizados ou automáticos
- Redirecionamento rápido (HTTP 302)
- Gerenciamento de links (criar, editar, deletar)
- Contagem de acessos
- Autenticação JWT

## Tecnologias

- **Node.js** + **NestJS**
- **PostgreSQL** + **Prisma ORM**
- **Docker** + **Docker Compose**
- **Swagger/OpenAPI** para documentação
- **Jest** para testes

## Instalação

### Com Docker

\\\ash
docker-compose up --build
\\\

### Local

\\\ash
npm install
cp .env.example .env
npm run start:dev
\\\

Acesse a documentação em: http://localhost:3000/docs

## Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /auth/register | Registrar usuário |
| POST | /auth/login | Login |
| POST | /shorten | Encurtar URL |
| GET | /:short | Redirecionar |
| GET | /my-urls | Listar meus links |
| DELETE | /my-urls/:id | Deletar link |

## Autor

**Eric Pereira** - [github.com/cirebox](https://github.com/cirebox)

## License

MIT