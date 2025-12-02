import { Module } from "@nestjs/common";
import { ShortenController } from "./controllers/shorten.controller";
import { CreateShortenService } from "./services/create-shorten.service";
import { ListUserUrlsService } from "./services/list-user-urls.service";
import { UpdateShortenService } from "./services/update-shorten.service";
import { DeleteShortenService } from "./services/delete-shorten.service";
import { RedirectService } from "./services/redirect.service";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [SharedModule],
  controllers: [ShortenController],
  providers: [
    CreateShortenService,
    ListUserUrlsService,
    UpdateShortenService,
    DeleteShortenService,
    RedirectService,
  ],
  exports: [
    CreateShortenService,
    ListUserUrlsService,
    UpdateShortenService,
    DeleteShortenService,
    RedirectService,
  ],
})
export class ShortenModule {}
