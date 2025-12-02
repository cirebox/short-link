import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { LoginService } from "../login.service";
import { IUserRepository } from "../../../shared/repositories/interfaces/iuser.repository";
import { LoginDto } from "../../dtos/login.dto";

describe("LoginService", () => {
  let service: LoginService;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserRepository = {
    findByEmail: jest.fn(),
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
        LoginService,
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

    service = module.get<LoginService>(LoginService);
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
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    const mockUser = {
      id: "user-id",
      name: "Test User",
      email: loginDto.email,
      password: "hashed_password",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should login user successfully", async () => {
      const accessToken = "jwt_token";

      userRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockImplementation(() => true);
      configService.get.mockReturnValue("secret-key");
      jwtService.sign.mockReturnValue(accessToken);

      const result = await service.execute(loginDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: mockUser.email, sub: mockUser.id },
        { secret: "secret-key" },
      );
      expect(result).toEqual({
        access_token: accessToken,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.execute(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.execute(loginDto)).rejects.toThrow(
        "Credenciais inválidas",
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockImplementation(() => false);

      await expect(service.execute(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.execute(loginDto)).rejects.toThrow(
        "Credenciais inválidas",
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should use fallback secret if JWT_SECRET_KEY is not configured", async () => {
      const accessToken = "jwt_token";

      userRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockImplementation(() => true);
      configService.get.mockReturnValue(undefined);
      jwtService.sign.mockReturnValue(accessToken);

      await service.execute(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: mockUser.email, sub: mockUser.id },
        { secret: "fallback-secret-key" },
      );
    });
  });
});
