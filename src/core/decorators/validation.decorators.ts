import { ApiProperty, ApiPropertyOptions } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsEmail,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Decorator para campos obrigatórios tipo string com validações e documentação Swagger
 */
export function RequiredString(
  options: ApiPropertyOptions & {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  } = {},
) {
  const { minLength, maxLength, pattern, message, ...apiOptions } = options;

  return function (target: any, propertyKey: string) {
    // Swagger documentation
    ApiProperty({
      ...apiOptions,
    })(target, propertyKey);

    // Validations
    IsString({ message: message || "Este campo deve ser uma string" })(
      target,
      propertyKey,
    );

    if (minLength !== undefined) {
      MinLength(minLength, {
        message: `Este campo deve ter no mínimo ${minLength} caracteres`,
      })(target, propertyKey);
    }

    if (maxLength !== undefined) {
      MaxLength(maxLength, {
        message: `Este campo deve ter no máximo ${maxLength} caracteres`,
      })(target, propertyKey);
    }

    if (pattern) {
      Matches(pattern, {
        message: message || "Este campo possui um formato inválido",
      })(target, propertyKey);
    }
  };
}

/**
 * Decorator para campos opcionais tipo string com validações e documentação Swagger
 */
export function OptionalString(
  options: ApiPropertyOptions & {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  } = {},
) {
  const { minLength, maxLength, pattern, message, ...apiOptions } = options;

  return function (target: any, propertyKey: string) {
    // Swagger documentation
    ApiProperty({
      ...apiOptions,
    })(target, propertyKey);

    // Validations
    IsOptional()(target, propertyKey);
    IsString({ message: message || "Este campo deve ser uma string" })(
      target,
      propertyKey,
    );

    if (minLength !== undefined) {
      MinLength(minLength, {
        message: `Este campo deve ter no mínimo ${minLength} caracteres`,
      })(target, propertyKey);
    }

    if (maxLength !== undefined) {
      MaxLength(maxLength, {
        message: `Este campo deve ter no máximo ${maxLength} caracteres`,
      })(target, propertyKey);
    }

    if (pattern) {
      Matches(pattern, {
        message: message || "Este campo possui um formato inválido",
      })(target, propertyKey);
    }
  };
}

/**
 * Decorator para campos obrigatórios tipo number com validações e documentação Swagger
 */
export function RequiredNumber(
  options: ApiPropertyOptions & {
    min?: number;
    max?: number;
    message?: string;
  } = {},
) {
  const { min, max, message, ...apiOptions } = options;

  return function (target: any, propertyKey: string) {
    // Swagger documentation
    ApiProperty({
      ...apiOptions,
    })(target, propertyKey);

    // Validations
    Type(() => Number)(target, propertyKey);
    IsNumber({}, { message: message || "Este campo deve ser um número" })(
      target,
      propertyKey,
    );

    if (min !== undefined) {
      Min(min, {
        message: `Este campo deve ser maior ou igual a ${min}`,
      })(target, propertyKey);
    }

    if (max !== undefined) {
      Max(max, {
        message: `Este campo deve ser menor ou igual a ${max}`,
      })(target, propertyKey);
    }
  };
}

/**
 * Decorator para campos obrigatórios tipo email com validações e documentação Swagger
 */
export function RequiredEmail(
  options: ApiPropertyOptions & {
    message?: string;
  } = {},
) {
  const { message, ...apiOptions } = options;

  return function (target: any, propertyKey: string) {
    // Swagger documentation
    ApiProperty({
      ...apiOptions,
    })(target, propertyKey);

    // Validations
    IsEmail({}, { message: message || "Este campo deve ser um email válido" })(
      target,
      propertyKey,
    );
  };
}

/**
 * Decorator para campos obrigatórios tipo UUID com validações e documentação Swagger
 */
export function RequiredUUID(
  options: ApiPropertyOptions & {
    message?: string;
  } = {},
) {
  const { message, ...apiOptions } = options;

  return function (target: any, propertyKey: string) {
    // Swagger documentation
    ApiProperty({
      ...apiOptions,
    })(target, propertyKey);

    // Validations
    IsUUID("4", { message: message || "Este campo deve ser um UUID válido" })(
      target,
      propertyKey,
    );
  };
}
