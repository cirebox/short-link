import { Inject, Injectable, Logger, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { IUserRepository } from "../../shared/repositories/interfaces/iuser.repository";
import { RegisterDto } from "../dtos/register.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RegisterService {
  protected readonly logger = new Logger(RegisterService.name);

  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    data: RegisterDto,
  ): Promise<{ access_token: string; user: any }> {
    this.logger.debug("Register", data);

    // Verificar se usuário já existe
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException("Email já está cadastrado");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    // Gerar token JWT
    const payload = { email: user.email, sub: user.id };
    const secret =
      this.configService.get<string>("JWT_SECRET_KEY") || "fallback-secret-key";
    const access_token = this.jwtService.sign(payload, { secret });

    // Remover password do retorno
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }
}
