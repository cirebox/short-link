import { Injectable, Logger } from "@nestjs/common";
import { IUrlRepository } from "../interfaces/iurl.repository";
import { PrismaService } from "../../services/prisma.service";
import { UrlFilterDto } from "../../../shorten/dtos/url.filter.dto";

@Injectable()
export class UrlRepository implements IUrlRepository {
  private readonly logger = new Logger(UrlRepository.name);

  constructor(private prisma: PrismaService) {}

  async create(data: Partial<ApiTypes.Url>): Promise<Partial<ApiTypes.Url>> {
    const createData: any = {
      originalUrl: data.originalUrl ?? "",
      shortCode: data.shortCode ?? "",
      accessCount: data.accessCount ?? 0,
    };

    // Só adiciona userId se for uma string válida (não null, não undefined, não vazio)
    if (
      data.userId &&
      typeof data.userId === "string" &&
      data.userId.trim() !== ""
    ) {
      createData.userId = data.userId;
    }

    // Adiciona alias se fornecido
    if (data.alias) {
      createData.alias = data.alias;
    }

    const result = await this.prisma.url.create({
      data: createData,
    });

    return {
      ...result,
    };
  }

  async update(data: Partial<ApiTypes.Url>): Promise<Partial<ApiTypes.Url>> {
    const { id, ...updateData } = data;
    const result = await this.prisma.url.update({
      data: updateData,
      where: { id },
    });

    return {
      ...result,
    };
  }

  async delete(id: string): Promise<Partial<ApiTypes.Url>> {
    const result = await this.prisma.url.update({
      data: { deletedAt: new Date() },
      where: { id },
    });

    return {
      ...result,
    };
  }

  async findById(id: string): Promise<Partial<ApiTypes.Url> | null> {
    const rawData = await this.prisma.url.findUnique({
      where: { id },
    });

    if (!rawData) return null;

    return {
      ...rawData,
    };
  }

  async find(): Promise<Partial<ApiTypes.Url>[]> {
    const rawData = await this.prisma.url.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return rawData.map((item) => ({
      ...item,
    }));
  }

  async findWithPagination(
    filter?: UrlFilterDto,
    skip = 0,
    limit = 10,
  ): Promise<[Partial<ApiTypes.Url>[], number]> {
    this.logger.debug("findWithPagination", { filter, skip, limit });

    // Construir where com base nos filtros
    const where: any = {
      deletedAt: null, // Não incluir URLs deletadas
    };

    // Filtrar por userId
    if (filter?.userId) {
      where.userId = filter.userId;
    }

    // Filtrar por originalUrl
    if (filter?.originalUrl) {
      where.originalUrl = {
        contains: filter.originalUrl,
      };
    }

    // Filtrar por shortCode
    if (filter?.shortCode) {
      where.shortCode = {
        contains: filter.shortCode,
      };
    }

    // Filtrar por alias
    if (filter?.alias) {
      where.alias = {
        contains: filter.alias,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.url.findMany({
        where,
        skip,
        take: limit,
        orderBy: filter?.getOrderBy() || { createdAt: "desc" },
      }),
      this.prisma.url.count({ where }),
    ]);

    return [
      data.map((item) => ({
        ...item,
      })),
      total,
    ];
  }

  async findByShortCode(
    shortCode: string,
  ): Promise<Partial<ApiTypes.Url> | null> {
    const rawData = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!rawData || rawData.deletedAt) return null;

    return {
      ...rawData,
    };
  }

  async findByAlias(alias: string): Promise<Partial<ApiTypes.Url> | null> {
    const rawData = await this.prisma.url.findUnique({
      where: { alias },
    });

    if (!rawData || rawData.deletedAt) return null;

    return {
      ...rawData,
    };
  }

  async findByUserId(userId: string): Promise<Partial<ApiTypes.Url>[]> {
    const rawData = await this.prisma.url.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return rawData.map((item) => ({
      ...item,
    }));
  }

  async incrementAccessCount(id: string): Promise<Partial<ApiTypes.Url>> {
    const result = await this.prisma.url.update({
      data: {
        accessCount: {
          increment: 1,
        },
      },
      where: { id },
    });

    return {
      ...result,
    };
  }
}
