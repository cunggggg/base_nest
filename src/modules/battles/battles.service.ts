import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateBattleDto } from './dto/create-battle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BattlesRepository } from '@modules/battles/battles.repository';
import { BattleMapper } from '@modules/battles/battles.mapper';
import { TimeoutError } from 'rxjs';
import { ContestResponseDto } from '@modules/contests/dto/contest-response.dto';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';
import { PaginationRequest } from '@common/interfaces';
import { PaginationResponseDto } from '@common/dtos';
import { Pagination } from '@helpers';
import { BattleResponseDto } from '@modules/battles/dto/response-battle.dto';
import { ContentNotExistInBattleException } from '@common/exeptions/content-not-exist-in-battle.exception';
import { VotesRepository } from '@modules/votes/votes.repository';
import { ContestEntity } from '@modules/contests/entities/contest.entity';

@Injectable()
export class BattlesService {
  private readonly logger = new Logger(BattlesService.name);

  constructor(
    @InjectRepository(BattlesRepository)
    private battlesRepository: BattlesRepository,
    @InjectRepository(VotesRepository)
    private votesRepository: VotesRepository,
  ) {}

  /**
   * explore contest
   * @param pagination {PaginationRequest}
   * @param userId
   * @returns {Promise<PaginationResponseDto<ContestResponseDto>>}
   */
  public async explore(
    pagination: PaginationRequest,
    userId = null,
  ): Promise<PaginationResponseDto<BattleResponseDto>> {
    try {
      const [
        battleEntities,
        totalBattles,
      ] = await this.battlesRepository.getExploringAndCount(pagination);

      const battleDtos = await Promise.all(
        battleEntities.map((b) => BattleMapper.toDtoWithRelations(b, userId)),
      );
      return Pagination.of(pagination, totalBattles, battleDtos);
    } catch (error) {
      console.log(error);

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  generateBattles(contestId: number, contents: number[]) {
    return contents.reduce(
      (acc, v, i) =>
        acc.concat(
          contents.slice(i + 1).map((w) => {
            const dto = new CreateBattleDto();
            dto.contestId = contestId;
            // random position
            if (Math.round(Math.random()) === 1) {
              dto.contentAId = v;
              dto.contentBId = w;
            } else {
              dto.contentAId = w;
              dto.contentBId = v;
            }
            return dto;
          }),
        ),
      [],
    );
  }

  async create(createBattleDto: CreateBattleDto) {
    try {
      await this.battlesRepository.save(
        BattleMapper.toCreateEntity(createBattleDto),
      );
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async createBattles(contest: ContestEntity) {
    try {
      const contentUserDict = {};
      const contents = await contest.contents;
      const content_ids = [];

      for (let i = 0; i < contents.length; i++) {
        content_ids.push(contents[i].id);
        contentUserDict[contents[i].id] = (await contents[i].user).id;
      }

      const createBattleDtos = this.generateBattles(
        contest.id,
        content_ids,
      ).filter(
        (dto) =>
          contentUserDict[dto.contentAId] !== contentUserDict[dto.contentBId],
      );

      const battleEntities = [];
      createBattleDtos.forEach((dto) => {
        battleEntities.push(BattleMapper.toCreateEntity(dto));
      });
      await this.battlesRepository.save(battleEntities);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async appendBattles(contest: ContestEntity, contentId) {
    try {
      const createBattleDtos = [];
      const contents = await contest.contents;
      for (let i = 0; i < contents.length; i += 1) {
        const c = contents[i];
        if (contentId === c.id) {
          continue;
        }

        const dto = new CreateBattleDto();
        dto.contestId = contest.id;
        // random position
        if (Math.round(Math.random()) === 1) {
          dto.contentAId = contentId;
          dto.contentBId = c.id;
        } else {
          dto.contentAId = c.id;
          dto.contentBId = contentId;
        }
        createBattleDtos.push(dto);
      }

      const battleEntities = [];
      createBattleDtos.forEach((dto) => {
        battleEntities.push(BattleMapper.toCreateEntity(dto));
      });
      await this.battlesRepository.save(battleEntities);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async removeBattles(contestId: number, content: UserContentResponseDto) {
    try {
      const battles = await this.battlesRepository.getByContestAndContent(
        contestId,
        content.id,
      );
      const battleIds = battles.map((b) => b.id);
      const votes = await this.votesRepository.getByBattles(battleIds);
      await this.votesRepository.remove(votes);
      await this.battlesRepository.remove(battles);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async verifyBeforeVote(battleId: number, contentId: number) {
    try {
      const battle = await this.battlesRepository.findOne(battleId);

      if (!battle) {
        throw new NotFoundException();
      }

      const contentA = (await battle.contentA).id;
      const contentB = (await battle.contentB).id;

      if (contentId !== contentA && contentId !== contentB) {
        throw new ContentNotExistInBattleException();
      }
      return BattleMapper.toDtoBasic(battle);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof NotFoundException) {
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

  async getBattleWithVoteResult(battleId: number, userId: string) {
    try {
      const battle = await this.battlesRepository.findOne(battleId);

      if (!battle) {
        throw new NotFoundException();
      }

      return BattleMapper.toDtoWithVote(battle, userId);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof NotFoundException) {
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
}
