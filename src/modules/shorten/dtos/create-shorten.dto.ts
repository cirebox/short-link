import {
  RequiredString,
  OptionalString,
} from "../../../core/decorators/validation.decorators";
import { Matches, IsUrl } from "class-validator";
import { Transform } from "class-transformer";

export class CreateShortenDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @RequiredString({
    description: "URL original a ser encurtada (máx. 2048 caracteres)",
    example:
      "https://teddy360.com.br/material/marco-legal-das-garantias-sancionado-entenda-o-que-muda/",
    maxLength: 2048,
  })
  @IsUrl(
    { require_tld: false, require_protocol: true },
    {
      message: "URL deve ser válida e incluir http:// ou https://",
    },
  )
  @Matches(/^https?:\/\/[^\s$.?#].[^\s]*$/, {
    message:
      "URL deve ser válida, começar com http:// ou https:// e não conter espaços",
  })
  originalUrl!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @OptionalString({
    description:
      "Alias customizado (3-30 caracteres, lowercase alphanumeric, hífens e underscores)",
    minLength: 3,
    maxLength: 30,
    example: "meu-link",
  })
  @Matches(/^[a-z0-9_-]{3,30}$/, {
    message:
      "Alias deve ter 3-30 caracteres e conter apenas letras minúsculas, números, hífens e underscores",
  })
  alias?: string;
}
