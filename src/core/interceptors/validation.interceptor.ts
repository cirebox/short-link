import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ValidationInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof BadRequestException) {
          const response = err.getResponse() as any;

          // Se já for uma resposta formatada pelo pipe de validação
          if (response.errors) {
            return throwError(() => err);
          }

          // Verifica se é um array de erros de validação simples
          if (Array.isArray(response.message)) {
            const formattedErrors = response.message.map((message: string) => {
              // Tenta extrair o nome da propriedade do erro
              const matches = message.match(/^([a-zA-Z0-9]+)\.?/);
              const property = matches ? matches[1] : "unknown";

              return {
                property,
                message,
              };
            });

            const formattedResponse = {
              statusCode: 422,
              message: "Erro de validação",
              errors: formattedErrors,
            };

            this.logger.warn(
              `Validation failed: ${JSON.stringify(formattedResponse)}`,
            );

            return throwError(() => new BadRequestException(formattedResponse));
          }
        }

        return throwError(() => err);
      }),
    );
  }
}
