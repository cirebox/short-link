# Autenticação Opcional no Endpoint de Encurtamento

## Visão Geral

O endpoint `POST /shorten` suporta **autenticação opcional**, permitindo que URLs sejam encurtadas tanto por usuários autenticados quanto por usuários anônimos.

## Comportamentos

### 1. Com Autenticação (Bearer Token)

Quando um usuário está autenticado, a URL encurtada é associada ao seu perfil, permitindo:
- Listagem das URLs em `GET /my-urls`
- Atualização via `PUT /my-urls`
- Exclusão via `DELETE /my-urls/:id`

**Exemplo de Requisição:**

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "originalUrl": "https://www.example.com/very/long/url",
    "alias": "my-custom-link"
  }'
```

**Resposta:**
```json
{
  "code": 201,
  "message": "URL encurtada com sucesso!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalUrl": "https://www.example.com/very/long/url",
    "shortCode": "aBc123",
    "alias": "my-custom-link",
    "userId": "user-uuid-here",
    "accessCount": 0,
    "createdAt": "2025-12-02T05:43:00.000Z",
    "updatedAt": "2025-12-02T05:43:00.000Z"
  }
}
```

### 2. Sem Autenticação (Anônimo)

Quando nenhum token é fornecido, a URL é criada sem vínculo com usuário:
- URL é pública e permanente
- Não pode ser editada ou deletada posteriormente
- Não aparece em listagens de usuários

**Exemplo de Requisição:**

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://www.example.com/another/long/url"
  }'
```

**Resposta:**
```json
{
  "code": 201,
  "message": "URL encurtada com sucesso!",
  "data": {
    "id": "660f9511-f3ac-52e5-b827-557766551111",
    "originalUrl": "https://www.example.com/another/long/url",
    "shortCode": "xYz789",
    "accessCount": 0,
    "createdAt": "2025-12-02T05:45:00.000Z",
    "updatedAt": "2025-12-02T05:45:00.000Z"
  }
}
```

## Redirecionamento

Ambas as URLs (autenticadas e anônimas) funcionam da mesma forma no redirecionamento:

```bash
curl -L http://localhost:3000/xYz789
# Redireciona (HTTP 302) para https://www.example.com/another/long/url
```

ou usando alias:

```bash
curl -L http://localhost:3000/my-custom-link
# Redireciona (HTTP 302) para https://www.example.com/very/long/url
```

## Implementação Técnica

### OptionalJwtGuard

O guard `OptionalJwtGuard` implementa a lógica de autenticação opcional:

```typescript
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // Permite acesso sem autenticação
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("JWT_SECRET_KEY")
      });
      // Token válido: adiciona usuário ao request
      request["user"] = payload;
    } catch (error) {
      // Token inválido: permite acesso sem autenticação
    }

    return true;
  }
}
```

### Controller

```typescript
@Post("shorten")
@UseGuards(OptionalJwtGuard)
@ApiBearerAuth("JWT")
async create(@Body() data: CreateShortenDto, @Req() req: any) {
  const userId = req.user?.sub ?? null; // null se não autenticado
  const response = await this.createShortenService.execute(data, userId);
  // ...
}
```

### Service

```typescript
async execute(
  data: CreateShortenDto,
  userId: string | null, // Aceita null
): Promise<Partial<ApiTypes.Url>> {
  // ...
  const url = await this.urlRepository.create({
    originalUrl: data.originalUrl,
    shortCode,
    alias: data.alias,
    userId: userId ?? undefined, // Converte null para undefined
  });
  return url;
}
```

### Schema do Banco de Dados

```prisma
model Url {
  id          String    @id @default(uuid())
  originalUrl String
  shortCode   String    @unique
  alias       String?   @unique
  userId      String?   // ⬅️ Opcional (permite null)
  accessCount Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  user        User?     @relation(fields: [userId], references: [id])
}
```

## Casos de Uso

### Caso 1: Usuário Registrado
1. Faz login e obtém token JWT
2. Encurta URLs autenticado
3. Gerencia suas URLs (listar, editar, deletar)

### Caso 2: Usuário Anônimo
1. Acessa diretamente o endpoint sem token
2. Encurta URL rapidamente sem cadastro
3. URL permanece acessível mas não editável

### Caso 3: Uso Misto
1. URLs anônimas para compartilhamento rápido
2. URLs autenticadas para links importantes que precisam de gestão
3. Todos os links são redirecionados e contabilizados da mesma forma

## Segurança

- ✅ URLs anônimas **não podem ser editadas ou deletadas**
- ✅ Apenas o proprietário pode modificar URLs autenticadas
- ✅ Tokens inválidos são tratados como acesso anônimo
- ✅ Alias únicos previnem colisões entre URLs anônimas e autenticadas
- ✅ Validação de formato de URL em ambos os casos

## Testes

Execute os testes unitários:

```bash
npm test create-shorten.service.spec.ts
```

O teste `"should create shortened URL without authentication (userId null)"` valida especificamente o comportamento sem autenticação.
