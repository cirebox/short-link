import { Test, TestingModule } from "@nestjs/testing";
import { ListUserUrlsService } from "../list-user-urls.service";
import { IUrlRepository } from "../../../shared/repositories/interfaces/iurl.repository";

describe("ListUserUrlsService", () => {
  let service: ListUserUrlsService;
  let urlRepository: jest.Mocked<IUrlRepository>;

  const mockUrlRepository = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListUserUrlsService,
        {
          provide: "IUrlRepository",
          useValue: mockUrlRepository,
        },
      ],
    }).compile();

    service = module.get<ListUserUrlsService>(ListUserUrlsService);
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

    it("should return all user URLs", async () => {
      const mockUrls = [
        {
          id: "url-1",
          originalUrl: "https://example1.com",
          shortCode: "abc123",
          userId,
          accessCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "url-2",
          originalUrl: "https://example2.com",
          shortCode: "def456",
          alias: "my-alias",
          userId,
          accessCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      urlRepository.findByUserId.mockResolvedValue(mockUrls);

      const result = await service.execute(userId);

      expect(urlRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        data: mockUrls,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
        },
      });
      expect(result.data).toHaveLength(2);
    });

    it("should return empty array if user has no URLs", async () => {
      urlRepository.findByUserId.mockResolvedValue([]);

      const result = await service.execute(userId);

      expect(urlRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
        },
      });
      expect(result.data).toHaveLength(0);
    });

    it("should paginate results when page and limit are provided", async () => {
      const mockUrls = Array.from({ length: 5 }, (_, index) => ({
        id: `url-${index}`,
        originalUrl: `https://example${index}.com`,
        shortCode: `code${index}`,
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      urlRepository.findByUserId.mockResolvedValue(mockUrls);

      const result = await service.execute(userId, 2, 2);

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
      });
      expect(result.data[0].id).toBe("url-2");
    });
  });
});
