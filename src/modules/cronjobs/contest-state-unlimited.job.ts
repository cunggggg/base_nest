import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { ContestStates } from '@common/enums/contest-state.enum';
import { DateHelper } from '../../helpers/date.helper';
import { ContestEntity } from '@modules/contests/entities/contest.entity';

@Injectable()
export class ContestStateUnlimitedJob {
  private readonly logger = new Logger(ContestStateUnlimitedJob.name);

  constructor(
    @InjectRepository(ContestsRepository)
    private contestsRepository: ContestsRepository,
  ) {}

  @Cron('1 * * * * *')
  async handleCron() {
    this.logger.debug('>>>>>>>>>CONTEST STATE JOB STARTING...');
    try {
      const states = [ContestStates.NEW, ContestStates.UPCOMING];
      const contests = await this.contestsRepository.getContestsForCronJob(
        states,
      );
      this.logger.debug('>>>total contests: ' + contests.length);

      contests.forEach((contest) => {
        const state = contest.state;
        this.logger.debug(
          '>>>Starting to process contest: ' +
            contest.name +
            ', state: ' +
            state,
        );
        if (state === ContestStates.NEW) {
          this.processNewState(contest);
        } else if (state === ContestStates.UPCOMING) {
          this.processUpComingState(contest);
        }
      });
    } catch (ex) {
      this.logger.debug('>>>>>>JOB RUN WITH AN ERROR');
      this.logger.error(ex);
    }
  }

  async processNewState(contest: ContestEntity) {
    this.logger.debug(
      '>>>processNewState: ' +
        contest.name +
        ', startTime: ' +
        contest.startTime,
    );
    if (DateHelper.checkIsCurrentAfter(contest.startTime, 1)) {
      await this.updateContestState(contest, ContestStates.UPCOMING);
    }
  }

  async processUpComingState(contest: ContestEntity) {
    this.logger.debug(
      '>>>processUpComingState: ' +
        contest.name +
        ',startTime: ' +
        contest.startTime,
    );
    if (DateHelper.checkIsCurrentAfter(contest.startTime)) {
      await this.updateContestState(contest, ContestStates.VOTING);
    }
  }

  private async updateContestState(
    contest: ContestEntity,
    state: ContestStates,
  ) {
    this.logger.debug(
      '>>>UPDATE CONTEST STATE: ' +
        contest.name +
        ', state: ' +
        ContestStates[state],
    );

    contest.state = state;
    await this.contestsRepository.save(contest);
  }
}
