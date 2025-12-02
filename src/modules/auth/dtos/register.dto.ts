import {
  RequiredEmail,
  RequiredString,
} from "../../../core/decorators/validation.decorators";

export class RegisterDto {
  @RequiredString({
    description: "Nome do usuário",
    minLength: 2,
    maxLength: 100,
    example: "João Silva",
  })
  name!: string;

  @RequiredEmail({
    description: "Email do usuário",
    example: "user@example.com",
  })
  email!: string;

  @RequiredString({
    description: "Senha do usuário",
    minLength: 6,
    maxLength: 100,
    example: "password123",
  })
  password!: string;
}
