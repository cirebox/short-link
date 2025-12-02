// Definir ambiente de teste ANTES de qualquer importação
process.env.NODE_ENV = "test";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { PrismaService } from "../src/modules/shared/services/prisma.service";

export class TestHelper {
  static app: NestFastifyApplication;
  static prisma: PrismaService;

  static async createTestApp(): Promise<NestFastifyApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );

    // Configurações básicas para testes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors();

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    this.app = app;
    this.prisma = app.get(PrismaService);

    return app;
  }

  static async cleanDatabase(): Promise<void> {
    if (!this.prisma) {
      throw new Error("Prisma service not initialized");
    }

    // Limpar dados em ordem para respeitar foreign keys
    await this.prisma.url.deleteMany({});
    await this.prisma.user.deleteMany({});
  }

  static async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}

// Setup global antes de todos os testes
beforeAll(async () => {
  await TestHelper.createTestApp();
});

// Limpar banco entre cada teste
beforeEach(async () => {
  await TestHelper.cleanDatabase();
});

// Fechar app após todos os testes
afterAll(async () => {
  await TestHelper.cleanDatabase();
  await TestHelper.closeApp();
});
