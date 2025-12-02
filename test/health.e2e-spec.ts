import { TestHelper } from "./test-setup";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

describe("Health Check E2E Tests", () => {
  let app: NestFastifyApplication;

  beforeAll(() => {
    app = TestHelper.app;
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("status");
      expect(body).toHaveProperty("info");
      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("details");
    });

    it("should not require authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("GET /", () => {
    it("should return welcome message", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("message");
    });

    it("should not require authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
