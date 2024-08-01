import { UpdateSettingDto } from './dto/update-setting.dto';
import { XpLevelsService } from './../xp-levels/xp-levels.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Put,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserEntity } from '@admin/access/users/user.entity';
import { InvalidVideoFileTypeException } from '@common/exeptions/invalid-video-file-type.exception';
import { UploadHelper } from '@helpers';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Settings')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly xpLevelsService: XpLevelsService,
    private readonly configService: ConfigService,
    private readonly fireBaseService: FireBaseService,
  ) {}
  @Get()
  async discovery() {
    const settings = await this.settingsService.getSettings();
    const xpLevels = await this.xpLevelsService.explore();

    return { settings, xpLevels };
  }

  @Put()
  async update(@Body() updateSettingDto: UpdateSettingDto) {
    const { xpLevels, settings } = updateSettingDto;
    const xpLevelsUpdated = await this.xpLevelsService.update(xpLevels);

    const settingsUpdated = await this.settingsService.update(settings);

    return { xpLevelsUpdated, settingsUpdated };
  }

  @Post('/video-onboarding')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideoOnboarding(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    if (!file || file.mimetype.indexOf('video/mp4') === -1) {
      throw new InvalidVideoFileTypeException('mp4');
    }

    const maxLength = +this.configService.get('UPLOAD_VIDEO_LENGTH_LIMIT');
    await UploadHelper.validateVideoLength(file.path, maxLength);

    const media = this.configService.get('FIREBASE_STORAGE_ON_BOARDING_PATH');
    const url = await this.fireBaseService.uploadNoCache(file.path, media);

    return { url };
  }
}
