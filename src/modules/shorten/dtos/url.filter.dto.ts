import { BaseFilterDto } from "../../../core/dtos/base-filter.dto";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UrlFilterDto extends BaseFilterDto {
  @ApiProperty({
    required: false,
    description: "Filtrar por ID do usuário",
  })
  @IsOptional()
  @IsUUID("4", { message: "O ID do usuário deve ser um UUID válido" })
  userId?: string;

  @ApiProperty({
    required: false,
    description: "Filtrar por URL original",
  })
  @IsOptional()
  @IsString({ message: "A URL original deve ser uma string" })
  originalUrl?: string;

  @ApiProperty({
    required: false,
    description: "Filtrar por código curto",
  })
  @IsOptional()
  @IsString({ message: "O código curto deve ser uma string" })
  shortCode?: string;

  @ApiProperty({
    required: false,
    description: "Filtrar por alias",
  })
  @IsOptional()
  @IsString({ message: "O alias deve ser uma string" })
  alias?: string;
}
