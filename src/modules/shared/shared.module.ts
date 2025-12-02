import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./services/prisma.service";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserRepository } from "./repositories/prisma/user.repository";
import { UrlRepository } from "./repositories/prisma/url.repository";
import { JwtStrategy } from "./config/jwt.strategy";
import { Reflector } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { Logger } from "@nestjs/common";

const logger = new Logger("SharedModule");

logger.debug("JWT_SECRET_KEY in SharedModule:", process.env.JWT_SECRET_KEY);

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET_KEY || "fallback-secret-key",
        signOptions: { expiresIn: "30m" },
      }),
    }),
  ],
  providers: [
    Reflector,
    JwtService,
    JwtStrategy,
    PrismaService,
    {
      provide: "IUserRepository",
      useClass: UserRepository,
    },
    {
      provide: "IUrlRepository",
      useClass: UrlRepository,
    },
  ],
  exports: [
    JwtService,
    JwtStrategy,
    PrismaService,
    {
      provide: "IUserRepository",
      useClass: UserRepository,
    },
    {
      provide: "IUrlRepository",
      useClass: UrlRepository,
    },
  ],
})
export class SharedModule {}
