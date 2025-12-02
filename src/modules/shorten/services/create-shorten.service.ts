import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { IUrlRepository } from "../../shared/repositories/interfaces/iurl.repository";
import { CreateShortenDto } from "../dtos/create-shorten.dto";

@Injectable()
export class CreateShortenService {
  protected readonly logger = new Logger(CreateShortenService.name);

  // Alfabeto base62: A-Z, a-z, 0-9 (case-sensitive)
  private readonly BASE62_ALPHABET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Rotas reservadas que não podem ser usadas como alias
  private readonly RESERVED_ROUTES = [
    "auth",
    "docs",
    "shorten",
    "my-urls",
    "api",
    "health",
    "metrics",
  ];

  constructor(
    @Inject("IUrlRepository")
    private readonly urlRepository: IUrlRepository,
  ) {}

  /**
   * Gera um código curto aleatório de 6 caracteres usando base62 [A-Za-z0-9]
   * Conforme requisito: exatamente 6 caracteres, case-sensitive
   */
  private generateBase62Code(length = 6): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(
        Math.random() * this.BASE62_ALPHABET.length,
      );
      result += this.BASE62_ALPHABET[randomIndex];
    }
    return result;
  }

  /**
   * Valida se o alias não colide com rotas reservadas
   */
  private isReservedRoute(alias: string): boolean {
    return this.RESERVED_ROUTES.includes(alias.toLowerCase());
  }

  async execute(
    data: CreateShortenDto,
    userId: string | null,
  ): Promise<Partial<ApiTypes.Url>> {
    this.logger.debug("Create shorten URL", data);

    // Validar e processar alias (se fornecido)
    if (data.alias) {
      // Validar se não é uma rota reservada
      if (this.isReservedRoute(data.alias)) {
        throw new BadRequestException(
          "alias é uma rota reservada (auth, docs, shorten, my-urls, etc.)",
        );
      }

      // Verificar se alias já existe
      const existingAlias = await this.urlRepository.findByAlias(data.alias);
      if (existingAlias) {
        const aliasOwnerId = existingAlias.userId ?? null;
        const requesterId = userId ?? null;
        const isSameOwner = aliasOwnerId === requesterId;
        const isSameOriginalUrl =
          existingAlias.originalUrl === data.originalUrl;

        if (isSameOwner && isSameOriginalUrl) {
          return existingAlias;
        }

        throw new ConflictException("alias já está em uso");
      }

      // Verificar se alias colide com algum shortCode existente
      const existingShortCode = await this.urlRepository.findByShortCode(
        data.alias,
      );
      if (existingShortCode) {
        throw new ConflictException("alias já está em uso");
      }
    }

    // Gerar código curto único (base62: A-Z, a-z, 0-9)
    let shortCode = "";
    let attempts = 0;
    const maxAttempts = 100;
    let isUnique = false;

    while (!isUnique && attempts < maxAttempts) {
      const candidate = this.generateBase62Code(6);
      attempts++;

      const existingShortCode =
        await this.urlRepository.findByShortCode(candidate);
      const existingAlias = await this.urlRepository.findByAlias(candidate);

      if (!existingShortCode && !existingAlias) {
        shortCode = candidate;
        isUnique = true;
      }
    }

    if (!isUnique) {
      throw new BadRequestException(
        "Não foi possível gerar um short code único após várias tentativas",
      );
    }

    // Criar URL encurtada (com ou sem userId)
    const url = await this.urlRepository.create({
      originalUrl: data.originalUrl,
      shortCode,
      alias: data.alias,
      userId: userId || undefined,
    });

    return url;
  }
}
