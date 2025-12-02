import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "./modules/shared/decorators/public.decorator";

@ApiTags("Health")
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Health check da aplicação" })
  @ApiResponse({
    status: 200,
    description: "Aplicação está funcionando",
  })
  getHello(): { message: string } {
    return { message: "Short-Link API is running!" };
  }
}
