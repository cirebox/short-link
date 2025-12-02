import {
  RequiredEmail,
  RequiredString,
} from "../../../core/decorators/validation.decorators";

export class LoginDto {
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
