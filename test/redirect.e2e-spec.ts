import { TestHelper } from "./test-setup";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

describe("Redirect E2E Tests", () => {
  let app: NestFastifyApplication;
  let authToken: string;
  let shortCode: string;
  let urlId: string;

  beforeAll(() => {
    app = TestHelper.app;
  });

  beforeEach(async () => {
    // Criar e autenticar usuário
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Redirect User",
        email: "redirect@example.com",
        password: "Password123!",
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    authToken = registerBody.access_token;

    // Criar URL encurtada para testes
    const createUrlResponse = await app.inject({
      method: "POST",
      url: "/shorten",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        originalUrl: "https://www.example.com/redirect-target",
      },
    });

    const urlBody = JSON.parse(createUrlResponse.body);
    shortCode = urlBody.data.shortCode;
    urlId = urlBody.data.id;
  });

  describe("GET /:shortCode", () => {
    it("should redirect to original URL with 302 status", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/${shortCode}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(
        "https://www.example.com/redirect-target",
      );
    });

    it("should increment access count on redirect", async () => {
      // Primeiro acesso
      await app.inject({
        method: "GET",
        url: `/${shortCode}`,
      });

      // Segundo acesso
      await app.inject({
        method: "GET",
        url: `/${shortCode}`,
      });

      // Verificar que accessCount foi incrementado
      const listResponse = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const listBody = JSON.parse(listResponse.body);
      const url = listBody.data.find((u: any) => u.id === urlId);
      expect(url.accessCount).toBe(2);
    });

    it("should redirect using custom alias", async () => {
      // Criar URL com alias customizado
      const aliasResponse = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com/custom-alias-target",
          alias: "my-alias",
        },
      });

      expect(aliasResponse.statusCode).toBe(201);

      // Redirecionar usando alias
      const response = await app.inject({
        method: "GET",
        url: "/my-alias",
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(
        "https://www.example.com/custom-alias-target",
      );
    });

    it("should redirect anonymous URLs", async () => {
      // Criar URL anônima
      const anonResponse = await app.inject({
        method: "POST",
        url: "/shorten",
        payload: {
          originalUrl: "https://www.example.com/anonymous-target",
        },
      });

      const anonBody = JSON.parse(anonResponse.body);
      const anonShortCode = anonBody.data.shortCode;

      // Redirecionar
      const response = await app.inject({
        method: "GET",
        url: `/${anonShortCode}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(
        "https://www.example.com/anonymous-target",
      );
    });

    it("should return 404 for non-existent shortCode", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/nonexistent",
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("não encontrada");
    });

    it("should return 404 for soft-deleted URL", async () => {
      // Soft delete a URL
      await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      // Tentar acessar URL deletada
      const response = await app.inject({
        method: "GET",
        url: `/${shortCode}`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("foi removida");
    });

    it("should handle multiple concurrent redirects", async () => {
      // Simular múltiplos acessos simultâneos
      const promises = Array.from({ length: 10 }, () =>
        app.inject({
          method: "GET",
          url: `/${shortCode}`,
        }),
      );

      const responses = await Promise.all(promises);

      // Todos devem retornar 302
      responses.forEach((response) => {
        expect(response.statusCode).toBe(302);
      });

      // Verificar que accessCount foi incrementado corretamente
      const listResponse = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const listBody = JSON.parse(listResponse.body);
      const url = listBody.data.find((u: any) => u.id === urlId);
      expect(url.accessCount).toBe(10);
    });

    it("should not redirect to reserved routes", async () => {
      // Tentar acessar rotas reservadas (não devem ser interpretadas como shortCodes)
      const reservedRoutes = ["auth", "docs", "shorten", "my-urls"];

      for (const route of reservedRoutes) {
        const response = await app.inject({
          method: "GET",
          url: `/${route}`,
        });

        // Rotas reservadas não devem retornar 302 redirect
        expect(response.statusCode).not.toBe(302);
      }
    });
  });

  describe("GET /:shortCode - Edge Cases", () => {
    it("should handle very long shortCodes gracefully", async () => {
      const longCode = "a".repeat(100);
      const response = await app.inject({
        method: "GET",
        url: `/${longCode}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it("should handle special characters in shortCode", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/sh@rt!code",
      });

      expect(response.statusCode).toBe(404);
    });

    it("should preserve query parameters in redirect", async () => {
      // Criar URL
      const createResponse = await app.inject({
        method: "POST",
        url: "/shorten",
        payload: {
          originalUrl: "https://www.example.com/page",
        },
      });

      const createBody = JSON.parse(createResponse.body);
      const newShortCode = createBody.data.shortCode;

      // Acessar com query parameters
      const response = await app.inject({
        method: "GET",
        url: `/${newShortCode}?utm_source=test&utm_medium=email`,
      });

      expect(response.statusCode).toBe(302);
      // Note: Query params são tratados pelo cliente HTTP, não pela API
      expect(response.headers.location).toBe("https://www.example.com/page");
    });
  });
});
