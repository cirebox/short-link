import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transforma o valor recebido para instância da classe
    const object = plainToInstance(metatype, value);

    // Executa a validação com class-validator
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      },
    });

    // Se encontrou erros, formata a resposta
    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      this.logger.warn(`Validation failed: ${JSON.stringify(formattedErrors)}`);

      throw new BadRequestException({
        statusCode: 422,
        message: "Erro de validação",
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): any[] {
    return errors.map((err) => {
      const constraints = err.constraints
        ? Object.values(err.constraints)
        : ["Erro de validação"];

      return {
        property: err.property,
        message: constraints[0],
        children:
          err.children?.length > 0
            ? this.formatErrors(err.children)
            : undefined,
      };
    });
  }
}
