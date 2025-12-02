import { UrlFilterDto } from "../../../shorten/dtos/url.filter.dto";

export interface IUrlRepository {
  create(data: Partial<ApiTypes.Url>): Promise<Partial<ApiTypes.Url>>;
  update(data: Partial<ApiTypes.Url>): Promise<Partial<ApiTypes.Url>>;
  delete(id: string): Promise<Partial<ApiTypes.Url>>;
  findById(id: string): Promise<Partial<ApiTypes.Url> | null>;
  find(): Promise<Partial<ApiTypes.Url>[]>;
  findWithPagination(
    filter?: UrlFilterDto,
    skip?: number,
    limit?: number,
  ): Promise<[Partial<ApiTypes.Url>[], number]>;
  findByShortCode(shortCode: string): Promise<Partial<ApiTypes.Url> | null>;
  findByAlias(alias: string): Promise<Partial<ApiTypes.Url> | null>;
  findByUserId(userId: string): Promise<Partial<ApiTypes.Url>[]>;
  incrementAccessCount(id: string): Promise<Partial<ApiTypes.Url>>;
}
