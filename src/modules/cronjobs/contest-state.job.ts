import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { ContestStates } from '@common/enums/contest-state.enum';
import { DateHelper } from '../../helpers/date.helper';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { VotesRepository } from '@modules/votes/votes.repository';
import { BattlesService } from '@modules/battles/battles.service';
import { ContestsService } from '@modules/contests/contests.service';

@Injectable()
export class ContestStateJob {
  private readonly logger = new Logger(ContestStateJob.name);

  constructor(
    @InjectRepository(ContestsRepository)
    private contestsRepository: ContestsRepository,
    @InjectRepository(VotesRepository)
    private votesRepository: VotesRepository,
    private battlesService: BattlesService,
    private contestsService: ContestsService,
  ) {}

  // @Cron('1 * * * * *')
  async handleCron() {
    this.logger.debug('>>>>>>>>>CONTEST STATE JOB STARTING...');
    try {
      const states = [
        ContestStates.NEW,
        ContestStates.UPCOMING,
        ContestStates.OPEN,
        ContestStates.VOTING,
        ContestStates.VOID,
        ContestStates.END,
      ];
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
        } else if (state === ContestStates.OPEN) {
          this.processOpenState(contest);
        } else if (state === ContestStates.VOTING) {
          this.processVotingState(contest);
        } else if (state === ContestStates.VOID) {
          this.processVoidState(contest);
        } else if (state === ContestStates.END) {
          this.processEndState(contest);
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
      await this.updateContestState(contest, ContestStates.OPEN);
    }
  }

  async processOpenState(contest: ContestEntity) {
    this.logger.debug(
      '>>>processOpenState, ' +
        contest.name +
        ', submissionDeadline: ' +
        contest.submissionDeadline,
    );
    const totalParticipants = (await contest.contents).length;

    if (contest.submissionDeadline) {
      if (DateHelper.checkIsCurrentAfter(contest.submissionDeadline)) {
        if (totalParticipants < contest.minParticipants) {
          await this.updateContestState(contest, ContestStates.VOID);
        } else {
          await this.updateContestState(contest, ContestStates.VOTING);
        }
      } else {
        if (
          contest.maxParticipants !== 0 &&
          totalParticipants == contest.maxParticipants
        ) {
          await this.updateContestState(contest, ContestStates.VOTING);
        }
      }
    } else {
      this.logger.debug(
        '>>>processOpenState, submissionDeadline Null, check expireTime: ' +
          contest.expireTime,
      );
      if (DateHelper.checkIsCurrentAfter(contest.expireTime)) {
        await this.updateContestState(contest, ContestStates.EXPIRED);
      }
    }
  }

  async processVotingState(contest: ContestEntity) {
    this.logger.debug(
      '>>>processVotingState: ' +
        contest.name +
        ', endTime: ' +
        contest.endTime +
        ', expireTime: ' +
        contest.expireTime,
    );

    const battleIDs = (await contest.battles).map((b) => b.id);
    const votes = (await this.votesRepository.getByBattles(battleIDs)).length;

    if (DateHelper.checkIsCurrentAfter(contest.expireTime)) {
      await this.updateContestState(contest, ContestStates.EXPIRED);
    } else if (DateHelper.checkIsCurrentAfter(contest.endTime)) {
      if (votes >= contest.minVote) {
        await this.updateContestState(contest, ContestStates.END);
      }
    }
  }

  async processEndState(contest: ContestEntity) {
    this.logger.debug(
      '>>>processEndState: ' +
        contest.name +
        ', expireTime: ' +
        contest.expireTime,
    );

    if (DateHelper.checkIsCurrentAfter(contest.expireTime)) {
      await this.updateContestState(contest, ContestStates.EXPIRED);
    }
  }

  async processVoidState(contest: ContestEntity) {
    this.logger.debug(
      '>>>processVoidState: ' +
        contest.name +
        ', expireTime: ' +
        contest.expireTime,
    );

    if (DateHelper.checkIsCurrentAfter(contest.expireTime)) {
      await this.updateContestState(contest, ContestStates.EXPIRED);
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
    if (state === ContestStates.VOTING) {
      await this.battlesService.createBattles(contest);
    } else if (state === ContestStates.END) {
      await this.contestsService.processRewards(contest);
    }
    await this.contestsRepository.save(contest);
  }
}
