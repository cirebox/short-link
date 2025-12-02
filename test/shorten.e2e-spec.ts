import { TestHelper } from "./test-setup";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

describe("Shorten URL E2E Tests", () => {
  let app: NestFastifyApplication;
  let authToken: string;
  let userId: string;

  beforeAll(() => {
    app = TestHelper.app;
  });

  beforeEach(async () => {
    // Criar e autenticar usuário para testes
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "URL Creator",
        email: "creator@example.com",
        password: "Password123!",
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    authToken = registerBody.access_token;
    userId = registerBody.user.id;
  });

  describe("POST /shorten (Authenticated)", () => {
    it("should create shortened URL with authentication", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com/very/long/path/to/resource",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty("id");
      expect(body.data).toHaveProperty("shortCode");
      expect(body.data.shortCode).toHaveLength(6);
      expect(body.data.shortUrl).toMatch(/^https?:\/\//i);
      expect(body.data.shortUrl).toContain(body.data.shortCode);
      expect(body.data.aliasUrl).toBeUndefined();
      expect(body.data.originalUrl).toBe(
        "https://www.example.com/very/long/path/to/resource",
      );
      expect(body.data.userId).toBe(userId);
      expect(body.data.accessCount).toBe(0);
      expect(body.data.deletedAt).toBeNull();
    });

    it("should create URL with custom alias when authenticated", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com",
          alias: "my-custom-link",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(body.data.shortUrl).toMatch(/^https?:\/\//i);
      expect(body.data.shortUrl).toContain(`my-custom-link/${body.data.shortCode}`);
      expect(body.data.aliasUrl).toBeUndefined();
      expect(body.data.userId).toBe(userId);
    });
  });

  describe("POST /shorten (Anonymous)", () => {
    it("should create shortened URL without authentication", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        payload: {
          originalUrl: "https://www.example.com/anonymous",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty("shortCode");
      expect(body.data.shortCode).toHaveLength(6);
      expect(body.data.shortUrl).toMatch(/^https?:\/\//i);
      expect(body.data.shortUrl).toContain(body.data.shortCode);
      expect(body.data.aliasUrl).toBeUndefined();
      expect(body.data.originalUrl).toBe("https://www.example.com/anonymous");
      expect(body.data.userId).toBeNull();
      expect(body.data.accessCount).toBe(0);
    });

    it("should create anonymous URL with custom alias", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        payload: {
          originalUrl: "https://www.example.com",
          alias: "anon-link",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(body.data.shortUrl).toMatch(/^https?:\/\//i);
      expect(body.data.shortUrl).toContain(`anon-link/${body.data.shortCode}`);
      expect(body.data.aliasUrl).toBeUndefined();
      expect(body.data.userId).toBeNull();
    });
  });

  describe("POST /shorten - Alias Validation", () => {
    it("should fail with duplicate alias", async () => {
      // Criar primeira URL com alias
      await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com/first",
          alias: "duplicate-alias",
        },
      });

      // Tentar criar segunda URL com mesmo alias
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com/second",
          alias: "duplicate-alias",
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("já está em uso");
    });

    it("should return existing URL when alias already exists for same user and URL", async () => {
      const payload = {
        originalUrl: "https://www.example.com/idempotent",
        alias: "idempotent-alias",
      };

      const firstResponse = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload,
      });

      const secondResponse = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload,
      });

      expect(firstResponse.statusCode).toBe(201);
      expect(secondResponse.statusCode).toBe(201);

      const firstBody = JSON.parse(firstResponse.body);
      const secondBody = JSON.parse(secondResponse.body);

      expect(secondBody.data.id).toBe(firstBody.data.id);
      expect(secondBody.data.shortCode).toBe(firstBody.data.shortCode);
      expect(secondBody.data.shortUrl).toBe(firstBody.data.shortUrl);
      expect(secondBody.data.aliasUrl).toBe(firstBody.data.aliasUrl);
    });

    it("should fail with reserved route as alias", async () => {
      const reservedRoutes = ["auth", "docs", "shorten", "my-urls", "api"];

      for (const route of reservedRoutes) {
        const response = await app.inject({
          method: "POST",
          url: "/shorten",
          headers: {
            authorization: `Bearer ${authToken}`,
          },
          payload: {
            originalUrl: "https://www.example.com",
            alias: route,
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.message).toContain("reservada");
      }
    });

    it("should fail with invalid alias format (uppercase)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com",
          alias: "InvalidAlias",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      const aliasMessage = Array.isArray(body.message)
        ? body.message.join(" ")
        : String(body.message);
      expect(aliasMessage.toLowerCase()).toContain("alias deve");
    });

    it("should fail with alias too short (< 3 chars)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com",
          alias: "ab",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should fail with alias too long (> 30 chars)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com",
          alias: "this-alias-is-way-too-long-to-be-accepted",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should accept valid alias with hyphens and underscores", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com",
          alias: "valid-alias_123",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(body.data.shortUrl).toMatch(/^https?:\/\//i);
      expect(body.data.shortUrl).toContain(`valid-alias_123/${body.data.shortCode}`);
      expect(body.data.aliasUrl).toBeUndefined();
    });
  });

  describe("POST /shorten - URL Validation", () => {
    it("should fail with invalid URL format (no protocol)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "www.example.com",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      const urlMessage = Array.isArray(body.message)
        ? body.message.join(" ")
        : String(body.message);
      expect(urlMessage.toLowerCase()).toContain("url deve ser válida");
    });

    it("should fail with URL containing spaces", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com/path with spaces",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should fail with URL exceeding 2048 characters", async () => {
      const longPath = "a".repeat(2100);
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: `https://www.example.com/${longPath}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should accept valid HTTP URL", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "http://www.example.com",
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it("should accept valid HTTPS URL", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com",
        },
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe("POST /shorten - Edge Cases", () => {
    it("should generate unique shortCodes for same URL", async () => {
      const url = "https://www.example.com/same-url";

      const response1 = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { originalUrl: url },
      });

      const response2 = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { originalUrl: url },
      });

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      expect(response1.statusCode).toBe(201);
      expect(response2.statusCode).toBe(201);
      expect(body1.data.shortCode).not.toBe(body2.data.shortCode);
      expect(body1.data.shortUrl).toContain(body1.data.shortCode);
      expect(body2.data.shortUrl).toContain(body2.data.shortCode);
    });

    it("should fail without originalUrl", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
