# Short-Link API

[![CI/CD Pipeline](https://github.com/seu-usuario/short-link-teddy/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/seu-usuario/short-link-teddy/actions/workflows/ci-cd.yml)
[![CodeQL](https://github.com/seu-usuario/short-link-teddy/actions/workflows/codeql.yml/badge.svg)](https://github.com/seu-usuario/short-link-teddy/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/seu-usuario/short-link-teddy/branch/main/graph/badge.svg)](https://codecov.io/gh/seu-usuario/short-link-teddy)

API RESTful para encurtamento de URLs, desenvolvida com NestJS para o teste técnico da Teddy Open Finance.

## Funcionalidades

- Cadastro e autenticação de usuários (JWT)
- **Encurtamento de URLs com ou sem autenticação**
- Slugs automáticos de 6 caracteres ou aliases customizados
- CRUD para URLs de usuários autenticados
- Contagem de acessos e redirecionamento (HTTP 302)
- Soft delete para URLs
- Documentação completa com Swagger

## Tecnologias

- Node.js + NestJS
- PostgreSQL + TypeORM
- JWT para autenticação
- Docker + Docker Compose
- Jest para testes
- Swagger/OpenAPI

## Instalação e Execução

### Com Docker (Recomendado)

1. Clone o repositório
2. Execute `docker-compose up --build`
3. A API estará disponível em `http://localhost:3000`
4. Documentação Swagger em `http://localhost:3000/docs`

### Local

1. Instale Node.js e PostgreSQL
2. Configure variáveis de ambiente (veja `.env.example`)
3. Execute `npm install`
4. Execute `npm run start:dev`

## Endpoints

- `POST /auth/register` - Registro de novo usuário
- `POST /auth/login` - Login com email/password (retorna Bearer Token)
- `POST /shorten` - **Encurtar URL (com ou sem autenticação)** ⭐
- `GET /my-urls` - Listar URLs do usuário autenticado
- `PUT /my-urls` - Atualizar URL original
- `DELETE /my-urls/:id` - Soft delete da URL
- `GET /:short` - Redirecionar para URL original (público)

> ⭐ **Novidade:** O endpoint `/shorten` aceita requisições **com ou sem autenticação**. URLs autenticadas podem ser gerenciadas; URLs anônimas são permanentes. [Saiba mais](./AUTHENTICATION.md)

## Testes

```bash
npm run test
```

## Escalabilidade

Para produção, considere:
- Load balancer para múltiplas instâncias
- Redis para cache de redirecionamentos
- CDN para distribuição
- Kubernetes para orquestração

## Arquitetura

![Diagrama](architecture.png)  # Adicionar imagem do diagrama

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## CI/CD Pipeline

Este projeto utiliza GitHub Actions para automação completa de CI/CD:

### Workflows Disponíveis

- **CI/CD Pipeline** (`ci-cd.yml`): Pipeline principal com 8 jobs
  - ✅ Code Quality (ESLint + TypeScript)
  - ✅ Unit Tests (Jest + Coverage)
  - ✅ E2E Tests (com PostgreSQL)
  - ✅ Build da aplicação
  - ✅ Docker Build/Push (GHCR)
  - ✅ Security Scan (npm audit)
  - ✅ Deploy Staging (branch develop)
  - ✅ Deploy Production (branch main)

- **PR Checks** (`pr-checks.yml`): Validação de Pull Requests
  - Lint + Type-check + Tests
  - Verificação de título semântico
  - Análise de tamanho do bundle

- **Release** (`release.yml`): Automação de releases
  - Triggered por tags v*.*.*
  - Geração de changelog
  - Criação de GitHub Release
  - Tag de imagem Docker com versão

- **CodeQL** (`codeql.yml`): Análise de segurança
  - Scan semanal do código
  - Detecção de vulnerabilidades

- **Dependabot** (`.github/dependabot.yml`): Atualizações automáticas
  - Dependências npm (semanal)
  - GitHub Actions (mensal)
  - Docker base images (semanal)

### Configuração Necessária

Para ativar o pipeline completo, configure no GitHub:

1. **Secrets** (Settings → Secrets and variables → Actions):
   - `CODECOV_TOKEN`: Token do Codecov (opcional, para relatórios de cobertura)

2. **Container Registry** (já configurado para usar GHCR - GitHub Container Registry):
   - O workflow usa `ghcr.io/seu-usuario/short-link-teddy`
   - Permissões automáticas via `GITHUB_TOKEN`

3. **Environments** (Settings → Environments):
   - `staging`: Para deploy no ambiente de homologação
   - `production`: Para deploy em produção (adicione protection rules)

### Como Usar

- **Desenvolvimento**: Commits em `develop` → Deploy automático em staging
- **Produção**: Commits em `main` → Deploy automático em produção
- **Release**: `git tag v1.0.0 && git push origin v1.0.0` → Release completo

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
