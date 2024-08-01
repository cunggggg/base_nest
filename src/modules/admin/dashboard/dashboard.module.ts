import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesRepository } from '@modules/votes/votes.repository';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { ContentsRepository } from '@modules/contents/contents.repository';
import { UsersRepository } from '@admin/access/users/users.repository';
import { UserContestVotesRepository } from '@modules/contests/user-contest-votes.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VotesRepository,
      ContestsRepository,
      ContentsRepository,
      UsersRepository,
      UserContestVotesRepository,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
