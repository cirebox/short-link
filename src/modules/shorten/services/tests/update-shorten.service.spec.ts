import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { UpdateShortenService } from "../update-shorten.service";
import { IUrlRepository } from "../../../shared/repositories/interfaces/iurl.repository";
import { UpdateShortenDto } from "../../dtos/update-shorten.dto";

describe("UpdateShortenService", () => {
  let service: UpdateShortenService;
  let urlRepository: jest.Mocked<IUrlRepository>;

  const mockUrlRepository = {
    findById: jest.fn(),
    findByAlias: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateShortenService,
        {
          provide: "IUrlRepository",
          useValue: mockUrlRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateShortenService>(UpdateShortenService);
    urlRepository = module.get("IUrlRepository");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("execute", () => {
    const userId = "user-id";
    const urlId = "url-id";
    const updateDto: UpdateShortenDto = {
      id: urlId,
      originalUrl: "https://updated.com",
      alias: "new-alias",
    };

    const mockUrl = {
      id: urlId,
      originalUrl: "https://example.com",
      shortCode: "abc123",
      alias: undefined,
      userId,
      accessCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should update URL successfully", async () => {
      const updatedUrl = {
        ...mockUrl,
        originalUrl: updateDto.originalUrl,
        alias: updateDto.alias,
        updatedAt: new Date(),
      };

      urlRepository.findById.mockResolvedValue(mockUrl);
      urlRepository.findByAlias.mockResolvedValue(null);
      urlRepository.update.mockResolvedValue(updatedUrl);

      const result = await service.execute(updateDto, userId);

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.findByAlias).toHaveBeenCalledWith(updateDto.alias);
      expect(urlRepository.update).toHaveBeenCalledWith({
        id: updateDto.id,
        originalUrl: updateDto.originalUrl,
        alias: updateDto.alias,
      });
      expect(result).toEqual(updatedUrl);
    });

    it("should throw NotFoundException if URL not found", async () => {
      urlRepository.findById.mockResolvedValue(null);

      await expect(service.execute(updateDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execute(updateDto, userId)).rejects.toThrow(
        "URL não encontrada",
      );

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if user does not own the URL", async () => {
      const otherUserUrl = {
        ...mockUrl,
        userId: "other-user-id",
      };

      urlRepository.findById.mockResolvedValue(otherUserUrl);

      await expect(service.execute(updateDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execute(updateDto, userId)).rejects.toThrow(
        "URL não encontrada",
      );

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.update).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if new alias already exists", async () => {
      const existingAliasUrl = {
        id: "other-url-id",
        originalUrl: "https://other.com",
        shortCode: "xyz789",
        alias: updateDto.alias,
        userId: "other-user",
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      urlRepository.findById.mockResolvedValue(mockUrl);
      urlRepository.findByAlias.mockResolvedValue(existingAliasUrl);

      await expect(service.execute(updateDto, userId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.execute(updateDto, userId)).rejects.toThrow(
        "alias já está em uso",
      );

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.findByAlias).toHaveBeenCalledWith(updateDto.alias);
      expect(urlRepository.update).not.toHaveBeenCalled();
    });

    it("should allow updating with same alias (no conflict)", async () => {
      const urlWithAlias = {
        ...mockUrl,
        alias: "existing-alias",
      };

      const updateSameAlias: UpdateShortenDto = {
        id: urlId,
        originalUrl: "https://updated.com",
        alias: "existing-alias",
      };

      const updatedUrl = {
        ...urlWithAlias,
        originalUrl: updateSameAlias.originalUrl,
        updatedAt: new Date(),
      };

      urlRepository.findById.mockResolvedValue(urlWithAlias);
      urlRepository.findByAlias.mockResolvedValue(urlWithAlias);
      urlRepository.update.mockResolvedValue(updatedUrl);

      const result = await service.execute(updateSameAlias, userId);

      expect(urlRepository.update).toHaveBeenCalledWith({
        id: updateSameAlias.id,
        originalUrl: updateSameAlias.originalUrl,
        alias: updateSameAlias.alias,
      });
      expect(result).toEqual(updatedUrl);
    });

    it("should update without checking alias if not provided", async () => {
      const updateNoAlias: UpdateShortenDto = {
        id: urlId,
        originalUrl: "https://updated.com",
      };

      const updatedUrl = {
        ...mockUrl,
        originalUrl: updateNoAlias.originalUrl,
        updatedAt: new Date(),
      };

      urlRepository.findById.mockResolvedValue(mockUrl);
      urlRepository.update.mockResolvedValue(updatedUrl);

      const result = await service.execute(updateNoAlias, userId);

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.findByAlias).not.toHaveBeenCalled();
      expect(urlRepository.update).toHaveBeenCalledWith({
        id: updateNoAlias.id,
        originalUrl: updateNoAlias.originalUrl,
        alias: updateNoAlias.alias,
      });
      expect(result).toEqual(updatedUrl);
    });
  });
});
