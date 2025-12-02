import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { useContainer } from "class-validator";
import { SWAGGER_CONFIG } from "./swagger/swagger.config";
import { createSwaggerDocumentation } from "./swagger/swagger.create-document";
import { join } from "path";
import fastifyCompress from "@fastify/compress";
import fastifyStatic from "@fastify/static";
import { config } from "dotenv";
config();

async function bootstrap() {
  // Criar aplicação usando o adaptador Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      // Aumentar o limite de tamanho do payload
      bodyLimit: 209715200, // 200MB em bytes
    }),
  );

  // Configurar pasta pública para arquivos estáticos
  await app.register(fastifyStatic, {
    root: join(__dirname, "..", "public/assets"),
    prefix: "/assets/",
  });

  // Remover x-powered-by
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onSend", (request, reply, payload, done) => {
      reply.removeHeader("x-powered-by");
      done(null, payload);
    });

  // Habilitar versionamento
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: "version",
  });

  // Habilitar CORS
  app.enableCors();

  // Habilitar compressão
  await app.register(fastifyCompress);

  // Aplicar pipes globais
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      validateCustomDecorators: true,
      transform: true,
    }),
  );

  // Configuração para Swagger com autenticação básica (apenas em produção)
  const isTestEnv = process.env.NODE_ENV === "test";

  if (!isTestEnv) {
    const users = process.env.DOCS_USER;

    // Adicionar autenticação básica para Swagger
    app
      .getHttpAdapter()
      .getInstance()
      .addHook("preHandler", (request, reply, done) => {
        if (request.url.startsWith("/docs")) {
          // Extrai as credenciais da requisição
          const authHeader = request.headers.authorization;

          if (!authHeader || !authHeader.startsWith("Basic ")) {
            reply
              .code(401)
              .header("WWW-Authenticate", 'Basic realm="Restricted Area"')
              .send({ message: "Authentication required" });
            return;
          }

          const base64Credentials = authHeader.split(" ")[1];
          const credentials = Buffer.from(base64Credentials, "base64").toString(
            "utf-8",
          );
          const [username, password] = credentials.split(":");

          const allowedUsers = JSON.parse(users as string);

          if (!allowedUsers[username] || allowedUsers[username] !== password) {
            reply
              .code(401)
              .header("WWW-Authenticate", 'Basic realm="Restricted Area"')
              .send({ message: "Invalid credentials" });
            return;
          }
        }
        done();
      });
  }

  // Configurar container para validação
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Criar documentação Swagger
  createSwaggerDocumentation("docs", app, SWAGGER_CONFIG);

  // Iniciar aplicação
  await app.listen(process.env.HTTP_PORT ?? 3000, "0.0.0.0");
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/docs`);
}

bootstrap();
