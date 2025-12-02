import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  HttpCode,
  Res,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { CreateShortenService } from "../services/create-shorten.service";
import { ListUserUrlsService } from "../services/list-user-urls.service";
import { UpdateShortenService } from "../services/update-shorten.service";
import { DeleteShortenService } from "../services/delete-shorten.service";
import { RedirectService } from "../services/redirect.service";
import { CreateShortenDto } from "../dtos/create-shorten.dto";
import { UpdateShortenDto } from "../dtos/update-shorten.dto";
import { JwtGuard } from "../../shared/guards/jwt.guard";
import { OptionalJwtGuard } from "../../shared/guards/optional-jwt.guard";
import { Public } from "../../shared/decorators/public.decorator";

@ApiTags("Shorten")
@Controller()
export class ShortenController {
  protected logger = new Logger(ShortenController.name);

  private buildShortUrl(shortPath: string, req: any): string {
    const envBaseUrl =
      process.env.BASE_URL?.trim() ?? process.env.APP_URL?.trim();
    const protocol = req?.protocol ?? "http";
    const host =
      req?.hostname ??
      req?.headers?.host ??
      `localhost:${process.env.HTTP_PORT ?? 3000}`;
    const baseUrl = envBaseUrl ?? `${protocol}://${host}`;
    const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${trimmedBase}/${shortPath}`;
  }

  constructor(
    private readonly createShortenService: CreateShortenService,
    private readonly listUserUrlsService: ListUserUrlsService,
    private readonly updateShortenService: UpdateShortenService,
    private readonly deleteShortenService: DeleteShortenService,
    private readonly redirectService: RedirectService,
  ) {}

  @Post("shorten")
  @Public()
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth("JWT")
  @ApiBody({ type: CreateShortenDto, required: true })
  @ApiOperation({
    summary: "Encurtar uma URL (com ou sem autenticação)",
    description:
      "Encurta uma URL. Se autenticado, a URL será associada ao usuário. Se não autenticado, a URL será criada sem vínculo.",
  })
  @ApiResponse({
    status: 201,
    description: "URL encurtada com sucesso",
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: CreateShortenDto,
    @Req() req: any,
  ): Promise<Core.ResponseData> {
    const userId = req.user?.sub ?? null;
    const response = await this.createShortenService.execute(data, userId);
    const shortUrl = response.shortCode
      ? this.buildShortUrl(
          response.alias
            ? `${response.alias}/${response.shortCode}`
            : response.shortCode,
          req,
        )
      : undefined;
    return {
      code: 201,
      message: "URL encurtada com sucesso!",
      data: {
        ...response,
        shortUrl,
      },
    };
  }

  @Get("my-urls")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Listar URLs do usuário" })
  @ApiResponse({
    status: 200,
    description: "URLs listadas com sucesso",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Página (default 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Quantidade por página (default 10)",
    example: 10,
  })
  @HttpCode(HttpStatus.OK)
  async findByUser(
    @Req() req: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<Core.ResponseData> {
    const userId = req.user?.sub ?? null;
    const result = await this.listUserUrlsService.execute(
      userId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
    return {
      code: 200,
      message: "URLs encontradas!",
      data: result.data,
      meta: result.meta,
    };
  }

  @Put("my-urls")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("JWT")
  @ApiBody({ type: UpdateShortenDto, required: true })
  @ApiOperation({ summary: "Atualizar uma URL" })
  @ApiResponse({
    status: 200,
    description: "URL atualizada com sucesso",
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Body() data: UpdateShortenDto,
    @Req() req: any,
  ): Promise<Core.ResponseData> {
    const userId = req.user.sub;
    const response = await this.updateShortenService.execute(data, userId);
    return {
      code: 200,
      message: "URL atualizada com sucesso!",
      data: response,
    };
  }

  @Delete("my-urls/:id")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("JWT")
  @ApiParam({ name: "id", type: "string", required: true })
  @ApiOperation({ summary: "Deletar uma URL (soft delete)" })
  @ApiResponse({
    status: 200,
    description: "URL deletada com sucesso",
  })
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param("id") id: string,
    @Req() req: any,
  ): Promise<Core.ResponseData> {
    const userId = req.user.sub;
    const response = await this.deleteShortenService.execute(id, userId);
    return {
      code: 200,
      message: "URL deletada com sucesso!",
      data: response,
    };
  }

  @Get("*")
  @Public()
  @ApiParam({ name: "path", type: "string", required: true })
  @ApiOperation({ summary: "Redirecionar para URL original" })
  @ApiResponse({
    status: 302,
    description: "Redirecionamento para URL original",
  })
  async redirect(@Req() req: any, @Res() res: any): Promise<void> {
    const path = req.params['*'];
    const originalUrl = await this.redirectService.execute(path);
    res.status(302).redirect(originalUrl);
  }
}
