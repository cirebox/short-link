import { Injectable, Logger } from "@nestjs/common";
import { IUserRepository } from "../interfaces/iuser.repository";
import { PrismaService } from "../../services/prisma.service";
import { UserFilterDto } from "../../../auth/dtos/user.filter.dto";

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private prisma: PrismaService) {}

  async create(data: Partial<ApiTypes.User>): Promise<Partial<ApiTypes.User>> {
    const result = await this.prisma.user.create({
      data: {
        ...data,
        name: data.name ?? "",
        email: data.email ?? "",
        password: data.password ?? "",
      },
    });

    return {
      ...result,
    };
  }

  async update(data: Partial<ApiTypes.User>): Promise<Partial<ApiTypes.User>> {
    const { id, ...updateData } = data;
    const result = await this.prisma.user.update({
      data: updateData,
      where: { id },
    });

    return {
      ...result,
    };
  }

  async delete(id: string): Promise<Partial<ApiTypes.User>> {
    const result = await this.prisma.user.delete({ where: { id } });

    return {
      ...result,
    };
  }

  async findById(id: string): Promise<Partial<ApiTypes.User> | null> {
    const rawData = await this.prisma.user.findUnique({ where: { id } });

    if (!rawData) return null;

    return {
      ...rawData,
    };
  }

  async find(): Promise<Partial<ApiTypes.User>[]> {
    const rawData = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return rawData.map((item) => ({
      ...item,
    }));
  }

  async findWithPagination(
    filter?: UserFilterDto,
    skip = 0,
    limit = 10,
  ): Promise<[Partial<ApiTypes.User>[], number]> {
    this.logger.debug("findWithPagination", { filter, skip, limit });

    // Construir where com base nos filtros
    const where: any = {};

    // Filtrar por email
    if (filter?.email) {
      where.email = {
        contains: filter.email,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: filter?.getOrderBy() || { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return [data, total];
  }

  async findByEmail(email: string): Promise<Partial<ApiTypes.User> | null> {
    const rawData = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!rawData) return null;

    return {
      ...rawData,
    };
  }
}
