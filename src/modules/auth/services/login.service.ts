import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { IUserRepository } from "../../shared/repositories/interfaces/iuser.repository";
import { LoginDto } from "../dtos/login.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LoginService {
  protected readonly logger = new Logger(LoginService.name);

  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(data: LoginDto): Promise<{ access_token: string; user: any }> {
    this.logger.debug("Login", data);

    // Buscar usuário por email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(data.password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // Gerar token JWT
    const payload = { email: user.email, sub: user.id };
    const secret =
      this.configService.get<string>("JWT_SECRET_KEY") || "fallback-secret-key";
    const access_token = this.jwtService.sign(payload, { secret });

    // Retornar token e usuário sem senha
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      access_token,
      user: userWithoutPassword,
    };
  }
}
