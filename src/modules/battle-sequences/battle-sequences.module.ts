import { forwardRef, Module } from '@nestjs/common';
import { BattleSequencesService } from './battle-sequences.service';
import { BattleSequencesController } from './battle-sequences.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleSequencesRepository } from '@modules/battle-sequences/battle-sequences.repository';
import { BattleSequenceStepsRepository } from '@modules/battle-sequences/battle-sequence-steps.repository';
import { ConfigModule } from '@nestjs/config';
import { ContestsModule } from '@modules/contests/contests.module';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { VotesModule } from '@modules/votes/votes.module';
import { BattlesModule } from '@modules/battles/battles.module';
import { UsersModule } from '@admin/access/users/users.module';

@Module({
  imports: [
    ConfigModule,
    FireBaseModule,
    VotesModule,
    BattlesModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ContestsModule),
    TypeOrmModule.forFeature([
      BattleSequencesRepository,
      BattleSequenceStepsRepository,
    ]),
  ],
  controllers: [BattleSequencesController],
  providers: [BattleSequencesService],
})
export class BattleSequencesModule {}
