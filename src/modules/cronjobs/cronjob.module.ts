import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { ConfigModule } from '@nestjs/config';
import { ContestStateJob } from './contest-state.job';
import { ContestStateUnlimitedJob } from './contest-state-unlimited.job';
import { VotesRepository } from '@modules/votes/votes.repository';
import { BattlesModule } from '@modules/battles/battles.module';
import { ContestsModule } from '@modules/contests/contests.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => BattlesModule),
    forwardRef(() => ContestsModule),
    TypeOrmModule.forFeature([ContestsRepository, VotesRepository]),
  ],
  providers: [ContestStateJob, ContestStateUnlimitedJob],
})
export class CronJobModule {}
