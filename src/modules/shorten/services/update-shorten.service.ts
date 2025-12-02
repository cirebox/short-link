import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { IUrlRepository } from "../../shared/repositories/interfaces/iurl.repository";
import { UpdateShortenDto } from "../dtos/update-shorten.dto";

@Injectable()
export class UpdateShortenService {
  protected readonly logger = new Logger(UpdateShortenService.name);

  constructor(
    @Inject("IUrlRepository")
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(
    data: UpdateShortenDto,
    userId: string,
  ): Promise<Partial<ApiTypes.Url>> {
    this.logger.debug("Update shorten URL", data);

    // Verificar se URL existe e pertence ao usuário
    const existingUrl = await this.urlRepository.findById(data.id);
    if (!existingUrl || existingUrl.deletedAt) {
      throw new NotFoundException("URL não encontrada");
    }

    if (existingUrl.userId !== userId) {
      throw new NotFoundException("URL não encontrada");
    }

    // Verificar se novo alias já existe (se fornecido e diferente do atual)
    if (data.alias && data.alias !== existingUrl.alias) {
      const existingAlias = await this.urlRepository.findByAlias(data.alias);
      if (existingAlias) {
        throw new ConflictException("alias já está em uso");
      }
    }

    // Atualizar URL
    const updatedUrl = await this.urlRepository.update({
      id: data.id,
      originalUrl: data.originalUrl,
      alias: data.alias,
    });

    return updatedUrl;
  }
}
