import {
  RequiredString,
  OptionalString,
  RequiredUUID,
} from "../../../core/decorators/validation.decorators";
import { Matches } from "class-validator";

export class UpdateShortenDto {
  @RequiredUUID({
    description: "ID da URL a ser atualizada",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id!: string;

  @RequiredString({
    description: "Nova URL original",
    example: "https://www.example.com",
  })
  @Matches(/^https?:\/\/.+/, {
    message: "URL deve começar com http:// ou https://",
  })
  originalUrl!: string;

  @OptionalString({
    description:
      "Novo alias customizado (3-30 caracteres, lowercase alphanumeric + hyphens/underscores)",
    minLength: 3,
    maxLength: 30,
    example: "new-link",
  })
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      "Alias deve conter apenas letras minúsculas, números, hífens e underscores",
  })
  alias?: string;
}
