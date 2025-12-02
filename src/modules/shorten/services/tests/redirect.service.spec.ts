import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { RedirectService } from "../redirect.service";
import { IUrlRepository } from "../../../shared/repositories/interfaces/iurl.repository";

describe("RedirectService", () => {
  let service: RedirectService;
  let urlRepository: jest.Mocked<IUrlRepository>;

  const mockUrlRepository = {
    findByShortCode: jest.fn(),
    findByAlias: jest.fn(),
    incrementAccessCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectService,
        {
          provide: "IUrlRepository",
          useValue: mockUrlRepository,
        },
      ],
    }).compile();

    service = module.get<RedirectService>(RedirectService);
    urlRepository = module.get("IUrlRepository");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("execute", () => {
    const shortCode = "abc123";

    const mockUrl = {
      id: "url-id",
      originalUrl: "https://example.com",
      shortCode,
      userId: "user-id",
      accessCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should redirect by shortCode successfully", async () => {
      urlRepository.findByShortCode.mockResolvedValue(mockUrl);
      urlRepository.incrementAccessCount.mockResolvedValue({
        ...mockUrl,
        accessCount: 6,
      });

      const result = await service.execute(shortCode);

      expect(urlRepository.findByShortCode).toHaveBeenCalledWith(shortCode);
      expect(urlRepository.findByAlias).not.toHaveBeenCalled();
      expect(urlRepository.incrementAccessCount).toHaveBeenCalledWith(
        mockUrl.id,
      );
      expect(result).toBe(mockUrl.originalUrl);
    });

    it("should redirect by alias if shortCode not found", async () => {
      const alias = "my-alias";
      const urlWithAlias = {
        ...mockUrl,
        alias,
      };

      urlRepository.findByShortCode.mockResolvedValue(null);
      urlRepository.findByAlias.mockResolvedValue(urlWithAlias);
      urlRepository.incrementAccessCount.mockResolvedValue({
        ...urlWithAlias,
        accessCount: 6,
      });

      const result = await service.execute(alias);

      expect(urlRepository.findByShortCode).toHaveBeenCalledWith(alias);
      expect(urlRepository.findByAlias).toHaveBeenCalledWith(alias);
      expect(urlRepository.incrementAccessCount).toHaveBeenCalledWith(
        urlWithAlias.id,
      );
      expect(result).toBe(urlWithAlias.originalUrl);
    });

    it("should throw NotFoundException if URL not found", async () => {
      urlRepository.findByShortCode.mockResolvedValue(null);
      urlRepository.findByAlias.mockResolvedValue(null);

      await expect(service.execute(shortCode)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execute(shortCode)).rejects.toThrow(
        "URL não encontrada ou foi removida",
      );

      expect(urlRepository.findByShortCode).toHaveBeenCalledWith(shortCode);
      expect(urlRepository.findByAlias).toHaveBeenCalledWith(shortCode);
      expect(urlRepository.incrementAccessCount).not.toHaveBeenCalled();
    });

    it("should increment access count before returning URL", async () => {
      let accessCountIncremented = false;

      urlRepository.findByShortCode.mockResolvedValue(mockUrl);
      urlRepository.incrementAccessCount.mockImplementation(async () => {
        accessCountIncremented = true;
        return { ...mockUrl, accessCount: 6 };
      });

      const result = await service.execute(shortCode);

      expect(accessCountIncremented).toBe(true);
      expect(result).toBe(mockUrl.originalUrl);
    });

    it("should throw NotFoundException if URL is soft-deleted (deletedAt set)", async () => {
      const deletedUrl = {
        ...mockUrl,
        deletedAt: new Date(),
      };

      urlRepository.findByShortCode.mockResolvedValue(deletedUrl);

      await expect(service.execute(shortCode)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execute(shortCode)).rejects.toThrow(/deleted/i);

      expect(urlRepository.incrementAccessCount).not.toHaveBeenCalled();
    });
  });
});
