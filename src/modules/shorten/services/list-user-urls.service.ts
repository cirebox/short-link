import { Inject, Injectable, Logger } from "@nestjs/common";
import { IUrlRepository } from "../../shared/repositories/interfaces/iurl.repository";

@Injectable()
export class ListUserUrlsService {
  protected readonly logger = new Logger(ListUserUrlsService.name);

  constructor(
    @Inject("IUrlRepository")
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Partial<ApiTypes.Url>[];
    meta: { page: number; limit: number; total: number };
  }> {
    this.logger.debug("Find URLs by user", { userId, page, limit });
    const urls = await this.urlRepository.findByUserId(userId);

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const pageNumber =
      Number.isFinite(parsedPage) && parsedPage > 0
        ? Math.floor(parsedPage)
        : 1;
    const pageLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.floor(parsedLimit)
        : 10;

    const startIndex = (pageNumber - 1) * pageLimit;
    const paginatedUrls = urls.slice(startIndex, startIndex + pageLimit);

    return {
      data: paginatedUrls,
      meta: {
        page: pageNumber,
        limit: pageLimit,
        total: urls.length,
      },
    };
  }
}
