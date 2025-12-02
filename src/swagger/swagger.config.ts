import { SwaggerConfig } from "./swagger.interface";

export const SWAGGER_CONFIG: SwaggerConfig = {
  title: "Short-Link API",
  description:
    "API RESTful para encurtamento de URLs, desenvolvida com NestJS para o teste técnico da Teddy Open Finance.",
  version: "1.0",
  externalFilePath: "docs/json",
  filter: true,
  tags: ["Auth", "Shorten"],
};
