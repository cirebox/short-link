import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { RegisterService } from "./services/register.service";
import { LoginService } from "./services/login.service";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [SharedModule],
  controllers: [AuthController],
  providers: [RegisterService, LoginService],
  exports: [RegisterService, LoginService],
})
export class AuthModule {}
