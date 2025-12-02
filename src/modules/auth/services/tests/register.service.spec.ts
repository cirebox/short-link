import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { RegisterService } from "../register.service";
import { IUserRepository } from "../../../shared/repositories/interfaces/iuser.repository";
import { RegisterDto } from "../../dtos/register.dto";

describe("RegisterService", () => {
  let service: RegisterService;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: "IUserRepository",
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RegisterService>(RegisterService);
    userRepository = module.get("IUserRepository");
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("execute", () => {
    const registerDto: RegisterDto = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    it("should register a new user successfully", async () => {
      const hashedPassword = "hashed_password";
      const createdUser = {
        id: "user-id",
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const accessToken = "jwt_token";

      userRepository.findByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, "hash").mockImplementation(() => hashedPassword);
      userRepository.create.mockResolvedValue(createdUser);
      configService.get.mockReturnValue("secret-key");
      jwtService.sign.mockReturnValue(accessToken);

      const result = await service.execute(registerDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: createdUser.email, sub: createdUser.id },
        { secret: "secret-key" },
      );
      expect(result).toEqual({
        access_token: accessToken,
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        },
      });
    });

    it("should throw ConflictException if user already exists", async () => {
      const existingUser = {
        id: "existing-id",
        name: "Existing User",
        email: registerDto.email,
        password: "hashed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.execute(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.execute(registerDto)).rejects.toThrow(
        "Email já está cadastrado",
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should use fallback secret if JWT_SECRET_KEY is not configured", async () => {
      const hashedPassword = "hashed_password";
      const createdUser = {
        id: "user-id",
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const accessToken = "jwt_token";

      userRepository.findByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, "hash").mockImplementation(() => hashedPassword);
      userRepository.create.mockResolvedValue(createdUser);
      configService.get.mockReturnValue(undefined);
      jwtService.sign.mockReturnValue(accessToken);

      await service.execute(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: createdUser.email, sub: createdUser.id },
        { secret: "fallback-secret-key" },
      );
    });
  });
});
