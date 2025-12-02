import { TestHelper } from "./test-setup";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

describe("Auth E2E Tests", () => {
  let app: NestFastifyApplication;

  beforeAll(() => {
    app = TestHelper.app;
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
        },
      });

      if (response.statusCode !== 201) {
        console.error("Response status:", response.statusCode);
        console.error("Response body:", response.body);
      }

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("access_token");
      expect(body).toHaveProperty("user");
      expect(body.user).toMatchObject({
        name: "Test User",
        email: "test@example.com",
      });
      expect(body.user).toHaveProperty("id");
      expect(body.user).not.toHaveProperty("password");
    });

    it("should fail when email already exists", async () => {
      // Primeiro registro
      await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "First User",
          email: "duplicate@example.com",
          password: "Password123!",
        },
      });

      // Tentativa de duplicação
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Second User",
          email: "duplicate@example.com",
          password: "AnotherPass123!",
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("já está cadastrado");
    });

    it("should fail with invalid email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Test User",
          email: "invalid-email",
          password: "Password123!",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("email")]),
      );
    });

    it("should fail with short password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Test User",
          email: "test@example.com",
          password: "123",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("6 caracteres")]),
      );
    });

    it("should fail without required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("string")]),
      );
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: {
          name: "Login User",
          email: "login@example.com",
          password: "Password123!",
        },
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: "login@example.com",
          password: "Password123!",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("access_token");
      expect(body).toHaveProperty("user");
      expect(body.user).toMatchObject({
        name: "Login User",
        email: "login@example.com",
      });
      expect(body.user).not.toHaveProperty("password");
    });

    it("should fail with incorrect password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: "login@example.com",
          password: "WrongPassword123!",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("Credenciais inválidas");
    });

    it("should fail with non-existent email", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: "nonexistent@example.com",
          password: "Password123!",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("Credenciais inválidas");
    });

    it("should fail with invalid email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: "invalid-email",
          password: "Password123!",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should fail without required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
