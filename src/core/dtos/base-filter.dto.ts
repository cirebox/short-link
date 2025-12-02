import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class BaseFilterDto {
  @ApiProperty({
    required: false,
    type: Number,
    default: 1,
    description: "Número da página",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "O número da página deve ser um número inteiro" })
  @Min(1, { message: "O número da página deve ser maior ou igual a 1" })
  page?: number = 1;

  @ApiProperty({
    required: false,
    type: Number,
    default: 10,
    description: "Quantidade de registros por página",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "O limite deve ser um número inteiro" })
  @Min(1, { message: "O limite deve ser maior ou igual a 1" })
  @Max(100, { message: "O limite deve ser menor ou igual a 100" })
  limit?: number = 10;

  @ApiProperty({
    required: false,
    description: "Campo para ordenação",
  })
  @IsOptional()
  @IsString({ message: "O campo de ordenação deve ser uma string" })
  sortBy?: string;

  @ApiProperty({
    required: false,
    enum: SortOrder,
    default: SortOrder.ASC,
    description: "Direção da ordenação",
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: `A direção da ordenação deve ser: ${Object.values(SortOrder).join(
      ", ",
    )}`,
  })
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiProperty({
    required: false,
    description: "Termo de busca",
  })
  @IsOptional()
  @IsString({ message: "O termo de busca deve ser uma string" })
  @Transform(({ value }) => (value ? value.trim() : value))
  search?: string;

  // Métodos auxiliares
  getSkip(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }

  getOrderBy(): { [key: string]: string } | undefined {
    if (!this.sortBy) return undefined;
    return { [this.sortBy]: this.sortOrder || SortOrder.ASC };
  }
}
