import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { CanActivate } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

/**
 * Guard que permite autenticação opcional via JWT.
 * Se o token estiver presente e válido, adiciona req.user.
 * Se não houver token ou for inválido, permite acesso sem autenticação.
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  protected logger = new Logger(OptionalJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.debug("No token provided, allowing unauthenticated access");
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          this.configService.get<string>("JWT_SECRET_KEY") ||
          "fallback-secret-key",
      });
      this.logger.debug("Token verified successfully, user authenticated");
      request["user"] = payload;
    } catch {
      this.logger.debug(
        "Invalid token provided, allowing unauthenticated access",
      );
      // Token inválido, mas permite acesso sem autenticação
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
