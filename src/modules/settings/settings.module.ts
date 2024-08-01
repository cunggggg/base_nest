import { XpLevelsModule } from '@modules/xp-levels/xp-levels.module';
import { XpLevelsRepository } from './../xp-levels/xp-levels.repository';
import { SettingsRepository } from './settings.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as uuid from 'uuid';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule,
    FireBaseModule,
    forwardRef(() => XpLevelsModule),
    TypeOrmModule.forFeature([SettingsRepository, XpLevelsRepository]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, configService.get('UPLOAD_TEMP_FOLDER'));
          },
          filename: (req, file, cb) => {
            cb(null, uuid.v4() + path.extname(file.originalname));
          },
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
