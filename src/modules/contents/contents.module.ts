import { forwardRef, Module } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { ContentsController } from './contents.controller';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as uuid from 'uuid';
import * as path from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentsRepository } from '@modules/contents/contents.repository';
import { ContestsModule } from '@modules/contests/contests.module';
import { BattlesModule } from '@modules/battles/battles.module';
import { BattlesRepository } from '@modules/battles/battles.repository';
import { VotesRepository } from '@modules/votes/votes.repository';
import { MuxModule } from '@modules/integration/mux/mux.module';

@Module({
  imports: [
    ConfigModule,
    FireBaseModule,
    MuxModule,
    BattlesModule,
    forwardRef(() => ContestsModule),
    TypeOrmModule.forFeature([
      ContentsRepository,
      BattlesRepository,
      VotesRepository,
    ]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, __dirname);
          },
          filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
          },
        }),
        fileFilter: (req, file, cb) => {
          console.log('TODO: file filter: ' + file.mimetype);
          if (!file.mimetype.startsWith('video')) {
            cb(null, false);
          } else {
            cb(null, true);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
