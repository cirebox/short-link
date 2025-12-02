import {
  Body,
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RegisterService } from "../services/register.service";
import { LoginService } from "../services/login.service";
import { RegisterDto } from "../dtos/register.dto";
import { LoginDto } from "../dtos/login.dto";
import { Public } from "../../shared/decorators/public.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  protected logger = new Logger(AuthController.name);

  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
  ) {}

  @Post("register")
  @Public()
  @ApiBody({ type: RegisterDto, required: true })
  @ApiOperation({ summary: "Registrar um novo usuário" })
  @ApiResponse({
    status: 201,
    description: "Usuário registrado com sucesso",
    schema: {
      type: "object",
      properties: {
        access_token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() data: RegisterDto,
  ): Promise<{ access_token: string; user: any }> {
    return await this.registerService.execute(data);
  }

  @Post("login")
  @Public()
  @ApiBody({ type: LoginDto, required: true })
  @ApiOperation({ summary: "Fazer login" })
  @ApiResponse({
    status: 200,
    description: "Login realizado com sucesso",
    schema: {
      type: "object",
      properties: {
        access_token: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() data: LoginDto,
  ): Promise<{ access_token: string; user: any }> {
    return await this.loginService.execute(data);
  }
}
