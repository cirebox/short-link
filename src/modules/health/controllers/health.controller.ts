import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../../shared/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Verificar saúde da aplicação" })
  @ApiResponse({
    status: 200,
    description: "Aplicação está saudável",
  })
  check(): {
    status: string;
    info: Record<string, any> | null;
    error: Record<string, any> | null;
    details: Record<string, any>;
  } {
    return {
      status: "ok",
      info: {
        database: {
          status: "up",
        },
      },
      error: null,
      details: {
        database: {
          status: "up",
        },
      },
    };
  }
}
