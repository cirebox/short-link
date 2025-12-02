import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { DeleteShortenService } from "../delete-shorten.service";
import { IUrlRepository } from "../../../shared/repositories/interfaces/iurl.repository";

describe("DeleteShortenService", () => {
  let service: DeleteShortenService;
  let urlRepository: jest.Mocked<IUrlRepository>;

  const mockUrlRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteShortenService,
        {
          provide: "IUrlRepository",
          useValue: mockUrlRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteShortenService>(DeleteShortenService);
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

    const mockUrl = {
      id: urlId,
      originalUrl: "https://example.com",
      shortCode: "abc123",
      userId,
      accessCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should delete URL successfully", async () => {
      urlRepository.findById.mockResolvedValue(mockUrl);
      urlRepository.delete.mockResolvedValue(mockUrl);

      await service.execute(urlId, userId);

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.delete).toHaveBeenCalledWith(urlId);
    });

    it("should throw NotFoundException if URL not found", async () => {
      urlRepository.findById.mockResolvedValue(null);

      await expect(service.execute(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execute(urlId, userId)).rejects.toThrow(
        "URL não encontrada",
      );

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if user does not own the URL", async () => {
      const otherUserUrl = {
        ...mockUrl,
        userId: "other-user-id",
      };

      urlRepository.findById.mockResolvedValue(otherUserUrl);

      await expect(service.execute(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execute(urlId, userId)).rejects.toThrow(
        "URL não encontrada",
      );

      expect(urlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(urlRepository.delete).not.toHaveBeenCalled();
    });
  });
});
