import { Module } from "@nestjs/common";
import { SharedModule } from "./modules/shared/shared.module";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ExceptionFilterHttpFilter } from "./core/filters/execption-filter-http.filter";
import { JwtGuard } from "./modules/shared/guards/jwt.guard";
import { RolesGuard } from "./modules/shared/guards/roles.guard";
import { HealthModule } from "./modules/health/health.module";
import { AppController } from "./app.controller";
import { ValidationPipe } from "./core/pipes/validation.pipe";
import { ValidationInterceptor } from "./core/interceptors/validation.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { ShortenModule } from "./modules/shorten/shorten.module";

@Module({
  imports: [SharedModule, HealthModule, AuthModule, ShortenModule],
  providers: [
    // Filtro de exceção, pipe e interceptor customizados apenas em ambiente não-teste
    ...(process.env.NODE_ENV !== "test"
      ? [
          {
            provide: APP_FILTER,
            useClass: ExceptionFilterHttpFilter,
          },
          {
            provide: APP_PIPE,
            useClass: ValidationPipe,
          },
          {
            provide: APP_INTERCEPTOR,
            useClass: ValidationInterceptor,
          },
        ]
      : []),
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
