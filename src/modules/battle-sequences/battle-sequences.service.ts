import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BattleSequencesRepository } from '@modules/battle-sequences/battle-sequences.repository';
import { BattleSequenceMapper } from '@modules/battle-sequences/battle-sequence.mapper';
import { BattleSequenceDto } from '@modules/battle-sequences/dto/battle-sequence.dto';
import { BattleDto } from '@modules/battles/dto/battle.dto';
import { DBErrorCode } from '@common/enums';
import { ForeignKeyConflictException } from '@common/exeptions';
import { TimeoutError } from 'rxjs';
import { BattleMapper } from '@modules/battles/battles.mapper';
import { BattleGenerationNotFoundException } from '@common/exeptions/battle-sequence-not-found.exception';
import { BattleSequenceStatus } from '@common/enums/battle-sequence-status.enum';
import { BattleSequenceNotFinishException } from '@common/exeptions/battle-sequence-not-finish.exception';
import { BattleSequenceResultDto } from '@modules/battle-sequences/dto/battle-sequence-result.dto';
import { BattleResponseDto } from '@modules/battles/dto/response-battle.dto';
import { ContentNotExistInBattleException } from '@common/exeptions/content-not-exist-in-battle.exception';
import { VoteBattleSequenceDto } from '@modules/battle-sequences/dto/vote-battle-sequence.dto';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { BattleSequenceStepsRepository } from '@modules/battle-sequences/battle-sequence-steps.repository';
import { ContentMapper } from '@modules/contents/content.mapper';
import { BattleSequenceStepMapper } from '@modules/battle-sequences/battle-sequence-step.mapper';
import { BattleSequenceStepDto } from '@modules/battle-sequences/dto/battle-sequence-step.dto';
import { RewardsHelper } from '../../helpers/rewards.helper';

@Injectable()
export class BattleSequencesService {
  private readonly logger = new Logger(BattleSequencesService.name);

  constructor(
    @InjectRepository(BattleSequencesRepository)
    private battleSequencesRepository: BattleSequencesRepository,
    @InjectRepository(BattleSequenceStepsRepository)
    private battleSequenceStepsRepository: BattleSequenceStepsRepository,
  ) {}

  async getInVotingFlow(
    userId: string,
    contestId: number,
  ): Promise<BattleSequenceDto[]> {
    const battleSequences =
      await this.battleSequencesRepository.getByUserAndContestId(
        userId,
        contestId,
      );

    return Promise.all(battleSequences.map(BattleSequenceMapper.toDto));
  }

  async generateNew(
    userId: string,
    contestId: number,
    battles: BattleDto[],
  ): Promise<BattleSequenceDto> {
    try {
      const entity = BattleSequenceMapper.toCreateEntity(
        userId,
        contestId,
        battles,
      );
      const newEntity = await this.battleSequencesRepository.save(entity);
      return BattleSequenceMapper.toDto(newEntity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async vote(dto: VoteBattleSequenceDto, userId: string, voteMax: number) {
    try {
      const battleSequence =
        await this.battleSequencesRepository.getByIdAndUser(
          dto.battleSequenceId,
          userId,
        );

      if (!battleSequence) {
        throw new BattleGenerationNotFoundException();
      }

      const battleStep = (await battleSequence.battleSequenceSteps).find(
        (bss) => bss.step === battleSequence.currentStep,
      );

      const battle = await battleStep.battle;
      const contentA = await ContentMapper.toDtoWithBattleVote(
        await battle.contentA,
        battle.id,
      );
      const contentB = await ContentMapper.toDtoWithBattleVote(
        await battle.contentB,
        battle.id,
      );

      if (dto.contentId !== contentA.id && dto.contentId !== contentB.id) {
        throw new ContentNotExistInBattleException();
      }

      // update battle sequence step
      battleStep.xpWatchingBonus = dto.xpWatchingBonus
        ? dto.xpWatchingBonus
        : 0;
      battleStep.voteFor = Promise.resolve(
        new ContentEntity({ id: dto.contentId }),
      );
      const votes =
        dto.contentId === contentA.id ? contentA.votes + 1 : contentB.votes + 1;

      battleStep.voteRate =
        Math.round((votes / (contentA.votes + contentB.votes + 1)) * 100) / 100;

      // update current step
      if (battleSequence.currentStep === voteMax) {
        battleSequence.status = BattleSequenceStatus.DONE;
      } else {
        battleSequence.currentStep = battleSequence.currentStep + 1;
      }
      await this.battleSequenceStepsRepository.save(battleStep);
      await this.battleSequencesRepository.save(battleSequence);

      const battleSequenceStep = new BattleSequenceStepDto();
      battleSequenceStep.id = battleSequence.id;
      battleSequenceStep.voteFor = dto.contentId;
      battleSequenceStep.voteRate = battleStep.voteRate;
      battleSequenceStep.xpWatchingBonus = battleStep.xpWatchingBonus;

      const battleResult = new BattleResponseDto();
      battleResult.id = battle.id;
      battleResult.youVoted = dto.contentId;
      battleResult.youWin = battleStep.voteRate >= 0.5;
      battleResult.contentA = contentA;
      battleResult.contentB = contentB;

      battleSequenceStep.battle = battleResult;
      const contest = await battle.contest;
      battleSequenceStep.xpReward = RewardsHelper.getXpRewards(
        battleResult.youWin,
        contest.xpRewards,
      );
      return {
        isEndFlow: battleSequence.status === BattleSequenceStatus.DONE,
        contestId: contest.id,
        battleSequenceStep,
      };
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof BattleGenerationNotFoundException) {
        throw error;
      } else if (error instanceof ContentNotExistInBattleException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async updateStep(id: number, max: number) {
    try {
      const entity = await this.battleSequencesRepository.findOne(id);
      if (!entity) {
        throw new NotFoundException();
      }
      if (entity.currentStep === max) {
        entity.status = BattleSequenceStatus.DONE;
      } else {
        entity.currentStep = entity.currentStep + 1;
      }
      await this.battleSequencesRepository.save(entity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getBattleSteps(id: number, userId: string) {
    try {
      const battleSequence = await this.battleSequencesRepository.findOne(id);

      if (!battleSequence || (await battleSequence.votedUser).id !== userId) {
        throw new BattleGenerationNotFoundException();
      }

      const battleSteps = await battleSequence.battleSequenceSteps;
      const contest = await battleSequence.contest;
      return Promise.all(
        battleSteps.map((bs) =>
          BattleSequenceStepMapper.toDtoWithRewards(bs, contest.xpRewards),
        ),
      );
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof BattleGenerationNotFoundException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getResult(id: number, userId: string) {
    try {
      const battleSequence = await this.battleSequencesRepository.findOne(id);
      if (!battleSequence) {
        throw new BattleGenerationNotFoundException();
      }

      const user = await battleSequence.votedUser;
      if (user.id !== userId) {
        throw new BattleGenerationNotFoundException();
      }

      if (battleSequence.status !== BattleSequenceStatus.DONE) {
        throw new BattleSequenceNotFinishException();
      }

      const result = new BattleSequenceResultDto();

      const bSSs = await battleSequence.battleSequenceSteps;
      const voteForWinners = [];
      for (let i = 0; i < bSSs.length; i++) {
        const e = bSSs[i];
        const battle = await BattleMapper.toDtoWithVote(await e.battle, userId);
        if (battle.youWin) {
          if (battle.youVoted === battle.contentA.id) {
            voteForWinners.push(battle.contentA.user);
          } else {
            voteForWinners.push(battle.contentB.user);
          }
        }
      }

      const level = await user.userXpLevel;
      result.userXps = level ? level.xp : 0;
      result.totalXps = 10 * voteForWinners.length;
      result.voteForWinners = voteForWinners;

      return result;
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof BattleGenerationNotFoundException) {
        throw error;
      } else if (error instanceof BattleSequenceNotFinishException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
