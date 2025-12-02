import { BaseFilterDto } from "../../../core/dtos/base-filter.dto";
import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UserFilterDto extends BaseFilterDto {
  @ApiProperty({
    required: false,
    description: "Filtrar por email",
  })
  @IsOptional()
  @IsString({ message: "O email deve ser uma string" })
  email?: string;
}
