import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { SwaggerConfig } from "./swagger.interface";

export function createSwaggerDocumentation(
  path: string,
  app: INestApplication,
  config: SwaggerConfig,
): void {
  const builder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description ?? "")
    .setVersion(config.version ?? "")
    .addServer(`http://localhost:${process.env.HTTP_PORT ?? 3000}`)
    .setOpenAPIVersion("3.1.0")
    .addBearerAuth(
      {
        type: "apiKey",
        scheme: "Bearer",
        bearerFormat: "JWT",
        name: "authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT",
    );

  if (config.tags) {
    for (const tag of config.tags) {
      builder.addTag(tag);
    }
  }

  if (config.externalFilePath)
    builder.setExternalDoc("Export to json file", config.externalFilePath);

  const options = builder.build();
  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup(path, app, document, {
    customSiteTitle: config.title,
    jsonDocumentUrl: config.externalFilePath,
    swaggerOptions: {
      docExpansion: "none",
      filter: config.filter ?? true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
      displayRequestDuration: true,
    },
  });
}
