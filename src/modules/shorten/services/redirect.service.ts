import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { IUrlRepository } from "../../shared/repositories/interfaces/iurl.repository";

@Injectable()
export class RedirectService {
  protected readonly logger = new Logger(RedirectService.name);

  constructor(
    @Inject("IUrlRepository")
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(path: string): Promise<string> {
    this.logger.debug("Redirect to original URL", { path });

    const parts = path.split("/");
    let alias: string | undefined;
    let shortCode: string;

    if (parts.length === 1) {
      // Could be alias or shortCode
      shortCode = parts[0];
      alias = parts[0];
    } else if (parts.length === 2) {
      // alias/shortCode
      alias = parts[0];
      shortCode = parts[1];
    } else {
      throw new NotFoundException("URL não encontrada ou foi removida");
    }

    let url: Partial<ApiTypes.Url> | null = null;

    if (alias && shortCode && parts.length === 2) {
      // Find by both alias and shortCode
      url = await this.urlRepository.findByAlias(alias);
      if (url && url.shortCode !== shortCode) {
        url = null; // Alias exists but shortCode doesn't match
      }
    } else {
      // Find by alias or shortCode
      url = await this.urlRepository.findByShortCode(shortCode);
      if (!url) {
        url = await this.urlRepository.findByAlias(alias!);
      }
    }

    // Verificar se URL existe e não está deletada (soft delete)
    if (!url) {
      throw new NotFoundException("URL não encontrada ou foi removida");
    }

    // Verificação adicional de segurança para soft delete
    if (url.deletedAt) {
      throw new NotFoundException(
        "URL has been deleted and is no longer accessible",
      );
    }

    // Incrementar contador de acessos antes do redirect
    await this.urlRepository.incrementAccessCount(url.id!);

    return url.originalUrl!;
  }
}
