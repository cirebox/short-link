import { UserFilterDto } from "../../../auth/dtos/user.filter.dto";

export interface IUserRepository {
  create(data: Partial<ApiTypes.User>): Promise<Partial<ApiTypes.User>>;
  update(data: Partial<ApiTypes.User>): Promise<Partial<ApiTypes.User>>;
  delete(id: string): Promise<Partial<ApiTypes.User>>;
  findById(id: string): Promise<Partial<ApiTypes.User> | null>;
  find(): Promise<Partial<ApiTypes.User>[]>;
  findWithPagination(
    filter?: UserFilterDto,
    skip?: number,
    limit?: number,
  ): Promise<[Partial<ApiTypes.User>[], number]>;
  findByEmail(email: string): Promise<Partial<ApiTypes.User> | null>;
}
