import { TestHelper } from "./test-setup";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { randomUUID } from "crypto";

describe("My URLs E2E Tests", () => {
  let app: NestFastifyApplication;
  let authToken: string;
  let userId: string;
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
        name: "URL Manager",
        email: "manager@example.com",
        password: "Password123!",
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    authToken = registerBody.access_token;
    userId = registerBody.user.id;

    // Criar uma URL para testes
    const createUrlResponse = await app.inject({
      method: "POST",
      url: "/shorten",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        originalUrl: "https://www.example.com/test",
      },
    });

    const urlBody = JSON.parse(createUrlResponse.body);
    urlId = urlBody.data.id;
  });

  describe("GET /my-urls", () => {
    it("should list all URLs of authenticated user", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("meta");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0]).toMatchObject({
        id: urlId,
        originalUrl: "https://www.example.com/test",
        userId: userId,
      });
      expect(body.meta).toMatchObject({ page: 1, limit: 10 });
    });

    it("should return empty list for user without URLs", async () => {
      // Criar outro usuário
      const newUserResponse = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "New User",
          email: "newuser@example.com",
          password: "Password123!",
        },
      });

      const newUserBody = JSON.parse(newUserResponse.body);
      const newUserToken = newUserBody.access_token;

      const response = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${newUserToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it("should fail without authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/my-urls",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should support pagination", async () => {
      // Criar múltiplas URLs
      for (let i = 1; i <= 5; i++) {
        await app.inject({
          method: "POST",
          url: "/shorten",
          headers: {
            authorization: `Bearer ${authToken}`,
          },
          payload: {
            originalUrl: `https://www.example.com/test-${i}`,
          },
        });
      }

      const response = await app.inject({
        method: "GET",
        url: "/my-urls?page=1&limit=3",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.length).toBeLessThanOrEqual(3);
      expect(body.meta).toHaveProperty("page", 1);
      expect(body.meta).toHaveProperty("limit", 3);
      expect(body.meta).toHaveProperty("total");
    });

    it("should apply default pagination when page and limit are omitted", async () => {
      // Garantir que existam mais de 10 URLs
      for (let i = 1; i <= 12; i++) {
        await app.inject({
          method: "POST",
          url: "/shorten",
          headers: {
            authorization: `Bearer ${authToken}`,
          },
          payload: {
            originalUrl: `https://www.example.com/default-${i}`,
          },
        });
      }

      const response = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta).toMatchObject({ page: 1, limit: 10 });
      expect(body.meta.total).toBeGreaterThan(10);
      expect(body.data.length).toBeLessThanOrEqual(10);
    });

    it("should not include soft-deleted URLs", async () => {
      // Soft delete a URL
      await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const foundUrl = body.data.find((url: any) => url.id === urlId);
      expect(foundUrl).toBeUndefined();
    });

    it("should not list URLs from other users", async () => {
      // Criar outro usuário com URL
      const otherUserResponse = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Other User",
          email: "other@example.com",
          password: "Password123!",
        },
      });

      const otherUserBody = JSON.parse(otherUserResponse.body);
      const otherUserToken = otherUserBody.access_token;

      await app.inject({
        method: "POST",
        url: "/shorten",
        headers: {
          authorization: `Bearer ${otherUserToken}`,
        },
        payload: {
          originalUrl: "https://www.example.com/other-user-url",
        },
      });

      // Verificar que primeiro usuário não vê URL do outro
      const response = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const otherUserUrl = body.data.find((url: any) =>
        url.originalUrl.includes("other-user-url"),
      );
      expect(otherUserUrl).toBeUndefined();
    });
  });

  describe("PUT /my-urls", () => {
    it("should update URL successfully", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          id: urlId,
          originalUrl: "https://www.example.com/updated",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.id).toBe(urlId);
      expect(body.data.originalUrl).toBe("https://www.example.com/updated");
    });

    it("should fail without authentication", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/my-urls",
        payload: {
          id: urlId,
          originalUrl: "https://www.example.com/updated",
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it("should fail with invalid URL format", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          id: urlId,
          originalUrl: "not-a-valid-url",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should fail when updating URL of another user", async () => {
      // Criar outro usuário
      const otherUserResponse = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Other User",
          email: "other2@example.com",
          password: "Password123!",
        },
      });

      const otherUserBody = JSON.parse(otherUserResponse.body);
      const otherUserToken = otherUserBody.access_token;

      // Tentar atualizar URL do primeiro usuário
      const response = await app.inject({
        method: "PUT",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${otherUserToken}`,
        },
        payload: {
          id: urlId,
          originalUrl: "https://www.example.com/hacked",
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should fail with non-existent URL ID", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          id: randomUUID(),
          originalUrl: "https://www.example.com/updated",
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should fail without required fields", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE /my-urls/:id", () => {
    it("should soft delete URL successfully", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("message");
      expect(body.message).toContain("deletada com sucesso");

      // Verificar que URL não aparece mais na listagem
      const listResponse = await app.inject({
        method: "GET",
        url: "/my-urls",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const listBody = JSON.parse(listResponse.body);
      const deletedUrl = listBody.data.find((url: any) => url.id === urlId);
      expect(deletedUrl).toBeUndefined();
    });

    it("should fail without authentication", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it("should fail when deleting URL of another user", async () => {
      // Criar outro usuário
      const otherUserResponse = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Other User",
          email: "other3@example.com",
          password: "Password123!",
        },
      });

      const otherUserBody = JSON.parse(otherUserResponse.body);
      const otherUserToken = otherUserBody.access_token;

      // Tentar deletar URL do primeiro usuário
      const response = await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
        headers: {
          authorization: `Bearer ${otherUserToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should fail with non-existent URL ID", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: `/my-urls/${randomUUID()}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should fail when trying to delete already deleted URL", async () => {
      // Primeira deleção
      await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      // Segunda tentativa
      const response = await app.inject({
        method: "DELETE",
        url: `/my-urls/${urlId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
