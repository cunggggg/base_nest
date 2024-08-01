import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentsModule } from '@modules/contents/contents.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as uuid from 'uuid';
import * as path from 'path';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { UserXpLevelsRepository } from '@admin/access/users/user-xp-levels.repository';
import { SettingsRepository } from '@modules/settings/settings.repository';
import { XpLevelsRepository } from '@modules/xp-levels/xp-levels.repository';
import { IntegrationModule } from '@modules/integration/integration.module';
import { ContestsModule } from '@modules/contests/contests.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UsersRepository,
      UserXpLevelsRepository,
      SettingsRepository,
      XpLevelsRepository,
    ]),
    forwardRef(() => ContestsModule),
    ContentsModule,
    FireBaseModule,
    IntegrationModule,
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
        fileFilter: (req, file, cb) => {
          console.log('TODO: file filter: ' + JSON.stringify(file));
          if (!file.mimetype.startsWith('image')) {
            cb(null, false);
          } else {
            cb(null, true);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
