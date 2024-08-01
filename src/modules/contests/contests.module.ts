import { forwardRef, Module } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { ContentsModule } from '@modules/contents/contents.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as uuid from 'uuid';
import * as path from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { UsersRepository } from '@admin/access/users/users.repository';
import { BattlesModule } from '@modules/battles/battles.module';
import { BattlesRepository } from '@modules/battles/battles.repository';
import { VotesRepository } from '@modules/votes/votes.repository';
import { ContestRanksRepository } from '@modules/contests/contest-ranks.repository';
import { ContestClaimsRepository } from '@modules/contests/contest-claims.repository';
import { SettingsRepository } from '@modules/settings/settings.repository';
import { UsersModule } from '@admin/access/users/users.module';
import { ContentsRepository } from '@modules/contents/contents.repository';
import { BattleSequencesRepository } from '@modules/battle-sequences/battle-sequences.repository';
import { BattleSequenceStepsRepository } from '@modules/battle-sequences/battle-sequence-steps.repository';
import { UserContestVotesRepository } from '@modules/contests/user-contest-votes.repository';

@Module({
  imports: [
    ConfigModule,
    FireBaseModule,
    BattlesModule,
    forwardRef(() => ContentsModule),
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([
      ContestsRepository,
      UsersRepository,
      BattlesRepository,
      VotesRepository,
      ContestRanksRepository,
      ContestClaimsRepository,
      SettingsRepository,
      ContentsRepository,
      BattleSequencesRepository,
      BattleSequenceStepsRepository,
      UserContestVotesRepository,
    ]),
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
  controllers: [ContestsController],
  providers: [ContestsService],
  exports: [ContestsService],
})
export class ContestsModule {}
