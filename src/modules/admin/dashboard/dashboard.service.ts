import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { TimeoutError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { VotesRepository } from '@modules/votes/votes.repository';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { ContentsRepository } from '@modules/contents/contents.repository';
import { DashboardSummaryDto, DashboardTopDto } from '@admin/dashboard/dto/dashboard-summary.dto';
import { UsersRepository } from '@admin/access/users/users.repository';
import { UserContestVotesRepository } from '@modules/contests/user-contest-votes.repository';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(ContestsRepository)
    private contestsRepository: ContestsRepository,
    @InjectRepository(ContentsRepository)
    private contentsRepository: ContentsRepository,
    @InjectRepository(VotesRepository)
    private votesRepository: VotesRepository,
    @InjectRepository(UserContestVotesRepository)
    private userContestVotesRepository: UserContestVotesRepository,
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async summary(): Promise<DashboardSummaryDto> {
    try {
      const dto = new DashboardSummaryDto();
      dto.challenges = await this.contestsRepository.count();
      dto.videos = await this.contentsRepository.count();
      dto.votes = await this.userContestVotesRepository.count();

      dto.topUsers = [];
      const topUsers = await this.usersRepository.getTopUsersWithoutBattle();
      const uLength = Math.min(topUsers.length, 5);
      for (let i = 0; i < uLength; i++) {
        const top = new DashboardTopDto();
        top.no = i + 1;
        top.name = topUsers[i].u_username;
        top.info = topUsers[i].votes;
        dto.topUsers.push(top);
      }

      dto.topContests = [];
      const topContests =
        await this.contestsRepository.getTopContestsWithoutBattle();
      const tLength = Math.min(topContests.length, 5);
      for (let i = 0; i < tLength; i++) {
        const top = new DashboardTopDto();
        top.no = i + 1;
        top.name = topContests[i].c_name;
        top.info = topContests[i].votes;
        dto.topContests.push(top);
      }

      return dto;
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
