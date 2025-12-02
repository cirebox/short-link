import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { IUrlRepository } from "../../shared/repositories/interfaces/iurl.repository";

@Injectable()
export class DeleteShortenService {
  protected readonly logger = new Logger(DeleteShortenService.name);

  constructor(
    @Inject("IUrlRepository")
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(id: string, userId: string): Promise<Partial<ApiTypes.Url>> {
    this.logger.debug("Delete shorten URL", { id, userId });

    // Verificar se URL existe e pertence ao usuário
    const existingUrl = await this.urlRepository.findById(id);
    if (!existingUrl || existingUrl.deletedAt) {
      throw new NotFoundException("URL não encontrada");
    }

    if (existingUrl.userId !== userId) {
      throw new NotFoundException("URL não encontrada");
    }

    // Soft delete
    return await this.urlRepository.delete(id);
  }
}
