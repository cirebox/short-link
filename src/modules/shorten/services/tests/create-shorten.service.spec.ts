import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { CreateShortenService } from "../create-shorten.service";
import { IUrlRepository } from "../../../shared/repositories/interfaces/iurl.repository";
import { CreateShortenDto } from "../../dtos/create-shorten.dto";

describe("CreateShortenService", () => {
  let service: CreateShortenService;
  let urlRepository: jest.Mocked<IUrlRepository>;

  const mockUrlRepository = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByUserId: jest.fn(),
    findByShortCode: jest.fn(),
    findByAlias: jest.fn(),
    incrementAccessCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateShortenService,
        {
          provide: "IUrlRepository",
          useValue: mockUrlRepository,
        },
      ],
    }).compile();

    service = module.get<CreateShortenService>(CreateShortenService);
    urlRepository = module.get("IUrlRepository");

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const userId = "user-123";
    const createShortenDto: CreateShortenDto = {
      originalUrl: "https://teddy360.com.br/material/test",
    };

    it("should create shortened URL successfully without alias", async () => {
      const createdUrl = {
        id: "url-id",
        originalUrl: createShortenDto.originalUrl,
        shortCode: "aBc123", // 6 caracteres base62
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      urlRepository.findByShortCode.mockResolvedValue(null);
      urlRepository.findByAlias.mockResolvedValue(null);
      urlRepository.create.mockResolvedValue(createdUrl);

      const result = await service.execute(createShortenDto, userId);

      expect(urlRepository.findByShortCode).toHaveBeenCalled();
      expect(urlRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createShortenDto.originalUrl,
          shortCode: expect.stringMatching(/^[A-Za-z0-9]{6}$/), // Regex base62
          userId,
        }),
      );
      expect(result).toEqual(createdUrl);
    });

    it("should create shortened URL with custom alias", async () => {
      const dtoWithAlias: CreateShortenDto = {
        originalUrl: "https://teddy360.com.br/material/test",
        alias: "meu-link",
      };

      const createdUrl = {
        id: "url-id",
        originalUrl: dtoWithAlias.originalUrl,
        shortCode: "xYz789",
        alias: dtoWithAlias.alias,
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      urlRepository.findByAlias.mockResolvedValue(null);
      urlRepository.findByShortCode.mockResolvedValue(null);
      urlRepository.create.mockResolvedValue(createdUrl);

      const result = await service.execute(dtoWithAlias, userId);

      expect(urlRepository.findByAlias).toHaveBeenCalledWith("meu-link");
      expect(urlRepository.findByShortCode).toHaveBeenCalledWith("meu-link");
      expect(result.alias).toBe("meu-link");
      expect(result.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
    });

    it("should throw ConflictException if alias already exists", async () => {
      const dtoWithAlias: CreateShortenDto = {
        originalUrl: "https://teddy360.com.br/test",
        alias: "existing-alias",
      };

      urlRepository.findByAlias.mockResolvedValue({
        id: "existing-id",
        shortCode: "abc123",
        alias: "existing-alias",
        originalUrl: "https://another-url.com",
        userId: "another-user",
      });

      await expect(service.execute(dtoWithAlias, userId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.execute(dtoWithAlias, userId)).rejects.toThrow(
        "alias já está em uso",
      );
    });

    it("should throw BadRequestException if alias is a reserved route", async () => {
      const reservedAliases = ["auth", "docs", "shorten", "my-urls", "api"];

      for (const alias of reservedAliases) {
        const dtoWithReserved: CreateShortenDto = {
          originalUrl: "https://teddy360.com.br/test",
          alias,
        };

        await expect(service.execute(dtoWithReserved, userId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.execute(dtoWithReserved, userId)).rejects.toThrow(
          /reservada|reserved route/i,
        );
      }
    });

    it("should throw ConflictException if alias conflicts with existing shortCode", async () => {
      const dtoWithAlias: CreateShortenDto = {
        originalUrl: "https://teddy360.com.br/test",
        alias: "abc123",
      };

      urlRepository.findByAlias.mockResolvedValue(null);
      urlRepository.findByShortCode.mockResolvedValue({
        id: "existing-id",
        shortCode: "abc123",
      });

      await expect(service.execute(dtoWithAlias, userId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.execute(dtoWithAlias, userId)).rejects.toThrow(
        "alias já está em uso",
      );
    });

    it("should return existing alias when user and originalUrl match", async () => {
      const dtoWithAlias: CreateShortenDto = {
        originalUrl: "https://teddy360.com.br/test",
        alias: "reusable-alias",
      };

      const existingAliasUrl = {
        id: "existing-id",
        originalUrl: dtoWithAlias.originalUrl,
        shortCode: "abc123",
        alias: dtoWithAlias.alias,
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      urlRepository.findByAlias.mockResolvedValue(existingAliasUrl);

      const result = await service.execute(dtoWithAlias, userId);

      expect(result).toEqual(existingAliasUrl);
      expect(urlRepository.create).not.toHaveBeenCalled();
      expect(urlRepository.findByShortCode).not.toHaveBeenCalled();
    });

    it("should handle shortCode collision and retry", async () => {
      const createdUrl = {
        id: "url-id",
        originalUrl: createShortenDto.originalUrl,
        shortCode: "newCode",
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Primeira tentativa: colisão com shortCode existente
      // Segunda tentativa: colisão com alias existente
      // Terceira tentativa: sucesso
      urlRepository.findByShortCode
        .mockResolvedValueOnce({ id: "1", shortCode: "collision1" })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      urlRepository.findByAlias
        .mockResolvedValueOnce({ id: "2", alias: "collision2" })
        .mockResolvedValueOnce(null);

      urlRepository.create.mockResolvedValue(createdUrl);

      const result = await service.execute(createShortenDto, userId);

      expect(urlRepository.findByShortCode).toHaveBeenCalled();
      expect(urlRepository.findByAlias).toHaveBeenCalled();
      expect(result).toEqual(createdUrl);
    });

    it("should create shortened URL without authentication (userId null)", async () => {
      const createDtoUnauthenticated: CreateShortenDto = {
        originalUrl: "https://unauthenticated.com",
      };

      const createdUrl = {
        id: "url-id-unauth",
        originalUrl: createDtoUnauthenticated.originalUrl,
        shortCode: "xyz789",
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      urlRepository.findByShortCode.mockResolvedValue(null);
      urlRepository.findByAlias.mockResolvedValue(null);
      urlRepository.create.mockResolvedValue(createdUrl);

      const result = await service.execute(createDtoUnauthenticated, null);

      expect(urlRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createDtoUnauthenticated.originalUrl,
          shortCode: expect.stringMatching(/^[A-Za-z0-9]{6}$/),
          alias: undefined,
          userId: undefined,
        }),
      );
      expect(result).toEqual(createdUrl);
    });

    it("should generate base62 shortCode with exactly 6 characters", async () => {
      const createdUrl = {
        id: "url-id",
        originalUrl: createShortenDto.originalUrl,
        shortCode: "Test12", // Exemplo: maiúsculas, minúsculas e números
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      urlRepository.findByShortCode.mockResolvedValue(null);
      urlRepository.findByAlias.mockResolvedValue(null);
      urlRepository.create.mockResolvedValue(createdUrl);

      await service.execute(createShortenDto, userId);

      const createCall = urlRepository.create.mock.calls[0][0];
      const shortCode = createCall.shortCode;

      // Validar regex: ^[A-Za-z0-9]{6}$
      expect(shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(shortCode).toHaveLength(6);
    });
  });
});
