import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { DBErrorCode } from '@common/enums';
import { ForeignKeyConflictException } from '@common/exeptions';
import { TimeoutError } from 'rxjs';
import { ContestMapper } from '@modules/contests/contests.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { ContestsRepository } from '@modules/contests/contests.repository';
import { PaginationRequest } from '@common/interfaces';
import { PaginationResponseDto } from '@common/dtos';
import { Pagination } from '@helpers';
import {
  ContestantTopDto,
  ContestResponseDto,
} from '@modules/contests/dto/contest-response.dto';
import { ContestExistsException } from '@common/exeptions/contest-exists.exception';
import { PromotedContestDto } from '@modules/contests/dto/update-promoted-contests.dto';
import { ContestPromoteLimitException } from '@common/exeptions/contest-promote-limit.exception';
import { UserContestExistsException } from '@common/exeptions/user-contest-exist.exception';
import { UserEntity } from '@admin/access/users/user.entity';
import { UsersRepository } from '@admin/access/users/users.repository';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { BattlesRepository } from '@modules/battles/battles.repository';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { AddContestContentDto } from '@modules/contests/dto/add-contest-content.dto';
import { UserNotFoundException } from '@common/exeptions/user-not-found.exception';
import { ContentExistInContestException } from '@common/exeptions/content-exist-in-contest.exception';
import { ContentNotExistInContestException } from '@common/exeptions/content-not-exist-in-contest.exception';
import { VotesRepository } from '@modules/votes/votes.repository';
import { ContestOverMaxParticipantException } from '@common/exeptions/contest-over-max-participant.exception';
import { ContestUpdateTimeInvalidException } from '@common/exeptions/contest-update-time-invalid.exception';
import { ContestStates } from '@common/enums/contest-state.enum';
import { ContestUploadStateException } from '@common/exeptions/contest-upload-state.exception';
import { ContestInVotingException } from '@common/exeptions/contest-in-voting.exception';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { ContestRanksRepository } from '@modules/contests/contest-ranks.repository';
import { ContestRankEntity } from '@modules/contests/entities/contest-rank.entity';
import { ContestClaimsRepository } from '@modules/contests/contest-claims.repository';
import { ContestClaimsEntity } from '@modules/contests/entities/contest-claims.entity';
import { ParticipantType } from '@modules/contests/participant-type.enum';
import { UserVotesEntity } from '@modules/votes/entities/vote.entity';
import { SettingsRepository } from '@modules/settings/settings.repository';
import { RewardsHelper } from '../../helpers/rewards.helper';
import { ContestClaimException } from '@common/exeptions/contest-claim.exception';
import { UsersService } from '@admin/access/users/users.service';
import { CreateContestV2Dto } from '@modules/contests/dto/create-contest-v2.dto';
import { ContentsRepository } from '@modules/contents/contents.repository';
import { BattleSequencesRepository } from '@modules/battle-sequences/battle-sequences.repository';
import { BattleSequenceStepsRepository } from '@modules/battle-sequences/battle-sequence-steps.repository';
import { CreateContestV3Dto } from '@modules/contests/dto/create-contest-v3.dto';
import { UnlimitedContestUploadStateException } from '@common/exeptions/unlimited-contest-upload-state.exception';
import { BattlesService } from '@modules/battles/battles.service';
import { UpdateContestV3Dto } from '@modules/contests/dto/update-contest-v3.dto';
import { UserContestVotesRepository } from '@modules/contests/user-contest-votes.repository';
import { UserContestVoteEntity } from '@modules/contests/entities/user-contest-vote.entity';
import { UserContestAlreadyVoteException } from '@common/exeptions/user-contest-already-vote.exception';
import * as uuid from 'uuid';
import { UserMapper } from '@admin/access/users/users.mapper';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { UserEnergyNotEnoughException } from '@common/exeptions/user-energy-not-enough.exception';

@Injectable()
export class ContestsService {
  private readonly logger = new Logger(ContestsService.name);

  constructor(
    @InjectRepository(ContestsRepository)
    private contestsRepository: ContestsRepository,
    @InjectRepository(ContentsRepository)
    private contentsRepository: ContentsRepository,
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    @InjectRepository(BattlesRepository)
    private battlesRepository: BattlesRepository,
    @InjectRepository(VotesRepository)
    private votesRepository: VotesRepository,
    @InjectRepository(ContestRanksRepository)
    private contestRanksRepository: ContestRanksRepository,
    @InjectRepository(ContestClaimsRepository)
    private contestClaimsRepository: ContestClaimsRepository,
    @InjectRepository(SettingsRepository)
    private settingsRepository: SettingsRepository,
    @InjectRepository(BattleSequencesRepository)
    private battleSequencesRepository: BattleSequencesRepository,
    @InjectRepository(BattleSequenceStepsRepository)
    private battleSequenceStepsRepository: BattleSequenceStepsRepository,
    @InjectRepository(UserContestVotesRepository)
    private userContestVotesRepository: UserContestVotesRepository,
    private usersService: UsersService,
    private battlesService: BattlesService,
    private fireBaseService: FireBaseService,
  ) {}

  async create(contestDto: CreateContestDto) {
    try {
      let contestEntity = ContestMapper.toCreateEntity(contestDto);
      if (contestDto.promote) {
        const totalPromotedContests = await this.countPromotedContests();
        if (totalPromotedContests >= 10) {
          throw new ContestPromoteLimitException();
        }
      }
      contestEntity = await this.contestsRepository.save(contestEntity);
      if (contestDto.promote) {
        await this.reorderPromotedContests();
      }
      return ContestMapper.toDtoWithContentRelations(contestEntity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new ContestExistsException(contestDto.name);
      }

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof ContestPromoteLimitException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async createNew(
    contestDto: CreateContestV2Dto | CreateContestV3Dto,
    version = 2,
  ) {
    try {
      let contestEntity;
      if (version === 2) {
        contestEntity = ContestMapper.toCreateV2Entity(
          contestDto as CreateContestV2Dto,
        );
      } else {
        contestEntity = ContestMapper.toCreateV3Entity(
          contestDto as CreateContestV3Dto,
        );
      }

      const contentUserDict = {};
      for (let i = 0; i < contestDto.contents.length; i += 1) {
        const userContent = contestDto.contents[i];
        const newUsername = await this.usersService.generateUsername();
        const user = await this.usersService.createUser({
          provider: 'local',
          providerId: '1',
          password: uuid.v4(),
          name: userContent.username,
          username: newUsername,
          avatar: userContent.avatar,
          roles: [],
          permissions: [],
        });

        contentUserDict[userContent.contentId] = user.id;
      }

      contestEntity = await this.contestsRepository.save(contestEntity);
      const contents = await contestEntity.contents;
      contents.forEach((c) => {
        c.user = Promise.resolve(new UserEntity({ id: contentUserDict[c.id] }));
      });

      await this.contentsRepository.save(contents);
      return contestEntity;
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new ContestExistsException(contestDto.name);
      }

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

  /**
   * Search Contest
   * @returns {Promise<ContestResponseDto>}
   */
  public async getContestsAndBuildVotesJson(
    all = false,
    contestIds: number[],
  ): Promise<any> {
    try {
      let contests;
      if (all) {
        contests = await this.contestsRepository.find();
      } else {
        contests = await this.contestsRepository.findByIds(contestIds);
      }

      const result = {};
      for (let i = 0; i < contests.length; i++) {
        const contest = contests[i];
        const battles = await contest.battles;
        if (!battles || battles.length === 0) {
          continue;
        }

        const c = {};
        for (let j = 0; j < battles.length; j++) {
          const battle = battles[j];
          const bVotes = await battle.votes;
          if (!bVotes || bVotes.length === 0) {
            continue;
          }

          const contentA = await battle.contentA;
          const contentB = await battle.contentB;
          const tmpA = {
            voteCount: 0,
            votes: [],
          };

          const tmpB = {
            voteCount: 0,
            votes: [],
          };

          for (let k = 0; k < bVotes.length; k++) {
            const vote = bVotes[k];
            const contentId = (await vote.content).id;
            if (contentId === contentA.id) {
              tmpA.voteCount += 1;
              tmpA.votes.push((await vote.user).id);
            } else if (contentId === contentB.id) {
              tmpB.voteCount += 1;
              tmpB.votes.push((await vote.user).id);
            }
          }
          c[battle.id] = {};
          if (tmpA.voteCount > 0) {
            c[battle.id][contentA.id] = tmpA;
          }
          if (tmpB.voteCount > 0) {
            c[battle.id][contentB.id] = tmpB;
          }
        }
        result[contest.id] = c;
      }

      return result;
    } catch (error) {
      console.log(error);

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Search Contest by name
   * @returns {Promise<ContestResponseDto>}
   */
  public async searchByName(name: string): Promise<ContestResponseDto[]> {
    try {
      const entities = await this.contestsRepository.searchByName(name);
      return await Promise.all(entities.map(ContestMapper.toDtoBasic));
    } catch (error) {
      console.log(error);

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get a paginated contest list
   * @param pagination {PaginationRequest}
   * @returns {Promise<PaginationResponseDto<ContestResponseDto>>}
   */
  public async search(
    pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<ContestResponseDto>> {
    try {
      const [contestEntities, totalContests] =
        await this.contestsRepository.getContestsAndCount(pagination);

      const contestDtos = await Promise.all(
        contestEntities.map((c) => ContestMapper.toSimpleVotingVersionDto(c)),
      );
      return Pagination.of(pagination, totalContests, contestDtos);
    } catch (error) {
      console.log(error);

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get contests feeds
   * @returns {Promise<PaginationResponseDto<ContestResponseDto>>}
   */
  public async getContestsFeeds() {
    try {
      const contestEntities = await this.contestsRepository.getContestsFeeds();

      const contestDtos = [];
      for (let i = 0; i < contestEntities.length; i++) {
        const contest = contestEntities[i];
        const dto = await ContestMapper.toDtoContestFeed(contest);
        contestDtos.push(dto);
      }

      return await Promise.all(contestDtos);
    } catch (error) {
      console.log(error);

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  private getRank(position, ranks: ContestRankEntity[]) {
    if (position < ranks.length) {
      return ranks[position];
    }
    return null;
  }

  public async vote(userId: string, contestId: number, contentId: number) {
    try {
      const entity =
        await this.userContestVotesRepository.getByUserAndContestIdAndContentId(
          userId,
          contestId,
          contentId,
        );
      if (entity) {
        throw new UserContestAlreadyVoteException();
      }
      const userLevelEntity = await this.usersService.checkEnergy(userId);
      const vote = new UserContestVoteEntity();
      vote.content = Promise.resolve(new ContentEntity({ id: contentId }));
      vote.userId = userId;
      vote.contestId = contestId;
      await this.userContestVotesRepository.save(vote);

      return this.usersService.useEnergy(userLevelEntity);
    } catch (error) {
      console.log(error);

      if (error instanceof UserEnergyNotEnoughException) {
        throw error;
      } else if (error instanceof UserContestAlreadyVoteException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * explore contest
   * @param userId
   * @param pagination {PaginationRequest}
   * @returns {Promise<PaginationResponseDto<ContestResponseDto>>}
   */
  public async explore(
    userId: string,
    pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<ContestResponseDto>> {
    try {
      const [contestEntities, totalContests] =
        await this.contestsRepository.getExploringContestsAndCount(pagination);

      const contestDtos = [];
      for (let i = 0; i < contestEntities.length; i++) {
        const contest = contestEntities[i];
        const dto = await ContestMapper.toSimpleVotingVersionDto(contest);
        dto.canUpload = await this.canUploadMoreObj(userId, contest);
        contestDtos.push(dto);
      }

      return Pagination.of(pagination, totalContests, contestDtos);
    } catch (error) {
      console.log(error);

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Find top contests
   * @returns {Promise<UserResponseDto>}
   * @param limit
   */
  async findTop(limit = 10) {
    try {
      const contests = await this.contestsRepository.find({
        relations: ['owner', 'contents', 'users'],
        order: {
          createdAt: 'DESC',
        },
        take: limit,
      });
      return await Promise.all(
        contests.map((c) => ContestMapper.toSimpleVotingVersionDto(c)),
      );
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

  /**
   * Find promoted contests
   * @returns {Promise<void>}
   */
  async countPromotedContests(): Promise<number> {
    try {
      const contests = await this.contestsRepository.find({
        where: {
          promote: true,
        },
      });
      return contests.length;
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

  /**
   * Find promoted contests
   * @returns {Promise<void>}
   */
  async findPromotedContests(userId: string) {
    try {
      const contests = await this.contestsRepository.find({
        relations: ['owner'],
        order: {
          promoteOrder: 'ASC',
        },
        where: {
          promote: true,
        },
      });

      const contestDtos = [];
      for (let i = 0; i < contests.length; i++) {
        const contest = contests[i];
        const dto = await ContestMapper.toSimpleVotingVersionDto(contest);
        dto.canUpload = await this.canUploadMoreObj(userId, contest);
        contestDtos.push(dto);
      }

      return await Promise.all(contestDtos);
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

  /**
   * Update promoted contests
   * @returns {Promise<void>}
   */
  async updatePromotedContests(contests: PromotedContestDto[]) {
    try {
      const currContests = await this.contestsRepository.find({
        relations: ['owner'],
        order: {
          promoteOrder: 'ASC',
        },
        where: {
          promote: true,
        },
      });

      currContests.forEach((contest) => {
        contest.promote = false;
        contest.promoteOrder = 0;
      });

      await this.contestsRepository.save(currContests);

      const promoteOrderDict = {};
      const newPromotedContestIds = contests.map((c) => {
        promoteOrderDict[c.id] = c.promoteOrder;
        return c.id;
      });
      const newPromotedContests = await this.contestsRepository.findByIds(
        newPromotedContestIds,
      );

      if (newPromotedContests.length !== contests.length) {
        throw new NotFoundException();
      }

      newPromotedContests.forEach((contest) => {
        contest.promote = true;
        contest.promoteOrder = promoteOrderDict[contest.id];
      });

      await this.contestsRepository.save(newPromotedContests);
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

  /**
   * reorder promoted contests
   * @returns {Promise<void>}
   */
  private async reorderPromotedContests() {
    try {
      const currContests = await this.contestsRepository.find({
        order: {
          promoteOrder: 'ASC',
        },
        where: {
          promote: true,
        },
      });

      for (let i = 0; i < currContests.length; i++) {
        currContests[i].promoteOrder = i + 1;
      }

      await this.contestsRepository.save(currContests);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get contest by id
   * @param id {number}
   * @returns {Promise<UserResponseDto>}
   */
  async getById(id: number) {
    const contest = await this.contestsRepository.findOne(id, {
      relations: ['owner', 'contents', 'users'],
    });

    if (!contest) {
      throw new NotFoundException();
    }

    return ContestMapper.toSimpleVotingVersionDto(contest);
  }

  /**
   * verify contest must be in voting state
   * @param id {number}
   */
  async verifyContestInVoting(id: number) {
    const contest = await this.contestsRepository.findOne(id);

    if (!contest) {
      throw new NotFoundException();
    }

    if (contest.state !== ContestStates.VOTING) {
      throw new ContestInVotingException();
    }
  }

  /**
   * Get battles by contest id
   * @param contestId {number}
   * @returns {Promise<UserResponseDto>}
   */
  async getBattlesByContestId(contestId: number) {
    const contest = await this.contestsRepository.findOne(contestId);

    if (!contest) {
      return [];
    }

    return await ContestMapper.toBattles(contest);
  }

  /**
   * Get basic contest by id
   * @param id {number}
   * @returns {Promise<UserResponseDto>}
   */
  async getBasicContest(id: number) {
    const contest = await this.contestsRepository.findOne(id);

    if (!contest) {
      throw new NotFoundException();
    }

    return ContestMapper.toDtoBasic(contest);
  }

  /**
   * Get contest by id
   * @param userId
   * @param id {number}
   * @returns {Promise<UserResponseDto>}
   */
  async getDetail(userId: string, id: number) {
    const contest = await this.contestsRepository.findOne(id);

    if (!contest) {
      throw new NotFoundException();
    }
    const dto = await ContestMapper.toSimpleVotingVersionDto(contest, userId);
    const contentUploaded = await this.contentsRepository.getByUserAndContest(
      userId,
      contest.id,
    );
    dto.canUpload = !contentUploaded;

    const topWinners = [];
    const topRanks = await this.contestRanksRepository.getByContestId(id);
    const tLength = Math.min(topRanks.length, 3);
    for (let i = 0; i < tLength; i++) {
      const contestant = new ContestantTopDto();
      const rank = topRanks[i];
      const user = await rank.user;

      contestant.top = i + 1;
      contestant.userId = user.id;
      contestant.name = user.name;
      contestant.username = user.username;
      contestant.avatar = user.avatar;
      contestant.votes = rank.totalVotes;
      topWinners.push(contestant);
    }

    dto.weeklyWinners = topWinners;
    return dto;
  }

  /**
   * Update contest by id
   * @param id {number}
   * @param contestDto {UpdateContestDto}
   * @returns {Promise<UserResponseDto>}
   */
  async update(id: number, contestDto: UpdateContestDto) {
    let contestEntity = await this.contestsRepository.findOne(id, {
      relations: ['contents', 'battles'],
    });
    if (!contestEntity) {
      throw new NotFoundException();
    }

    try {
      const isPromoted = !contestEntity.promote && contestDto.promote;
      if (isPromoted) {
        const totalPromotedContests = await this.countPromotedContests();
        if (totalPromotedContests >= 10) {
          throw new ContestPromoteLimitException();
        }
      }

      contestEntity = ContestMapper.toUpdateEntity(contestEntity, contestDto);
      if (isPromoted) {
        contestEntity.promoteOrder = 0;
        contestEntity = await this.contestsRepository.save(contestEntity);
        await this.reorderPromotedContests();
      } else {
        contestEntity = await this.contestsRepository.save(contestEntity);
      }

      return ContestMapper.toDto(contestEntity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new ContestExistsException(contestDto.name);
      }

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof ContestPromoteLimitException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Update contest by id
   * @param id {number}
   * @param contestDto {UpdateContestDto}
   * @returns {Promise<UserResponseDto>}
   */
  async updateV3(id: number, contestDto: UpdateContestV3Dto) {
    let contestEntity = await this.contestsRepository.findOne(id);
    if (!contestEntity) {
      throw new NotFoundException();
    }

    try {
      contestEntity = ContestMapper.toUpdateV3Entity(contestEntity, contestDto);
      contestEntity = await this.contestsRepository.save(contestEntity);
      return ContestMapper.toDto(contestEntity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new ContestExistsException(contestDto.name);
      }

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof ContestPromoteLimitException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  private validateTime(newContest: UpdateContestDto, contest: ContestEntity) {
    const current = new Date().getTime();
    const start = contest.startTime.getTime();
    const join = contest.submissionDeadline?.getTime();
    const end = contest.endTime.getTime();
    const expire = contest.expireTime.getTime();

    if (contest.state == ContestStates.OPEN && current >= start) {
      throw new ContestUpdateTimeInvalidException('start');
    }

    if (join && current >= join) {
      throw new ContestUpdateTimeInvalidException('start');
    }

    // if (join) {
    //   if (current >= start || start >= join || join >= end || end >= expire) {
    //     throw new ContestTimeInvalidException();
    //   }
    // } else {
    //   if (current >= start || start >= end || end >= expire) {
    //     throw new ContestTimeInvalidException();
    //   }
    // }
  }

  /**
   * Remove contest by id
   * @param id {number}
   * @returns {Promise<UserResponseDto>}
   */
  async remove(id: number) {
    const contestEntity = await this.contestsRepository.findOne(id);
    if (!contestEntity) {
      throw new NotFoundException();
    }

    try {
      const battles = await contestEntity.battles;
      const battleIdList = battles.map((b) => b.id);
      const votes = await this.votesRepository.getByBattles(battleIdList);
      const contestVotes = await this.userContestVotesRepository.getByContestId(
        id,
      );
      const battleSequences =
        await this.battleSequencesRepository.getByContestId(id);

      const battleSequenceSteps = [];
      for (let i = 0; i < battleSequences.length; i += 1) {
        const sequenceSteps = await battleSequences[i].battleSequenceSteps;
        battleSequenceSteps.push(...sequenceSteps);
      }

      await this.battleSequenceStepsRepository.remove(battleSequenceSteps);
      await this.battleSequencesRepository.remove(battleSequences);
      await this.votesRepository.remove(votes);
      await this.userContestVotesRepository.remove(contestVotes);
      await this.battlesRepository.remove(await contestEntity.battles);
      await this.contestsRepository.remove(contestEntity);
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

  /**
   * Check user can upload content more
   * @returns {Promise<boolean>}
   * @param userId
   * @param contestId
   */
  async canUploadMore(userId: string, contestId: number): Promise<boolean> {
    const contest = await this.contestsRepository.getContestDetail(contestId);
    return this.canUploadMoreObj(userId, contest);
  }

  /**
   * Check user can upload content more
   * @returns {Promise<boolean>}
   * @param userId
   * @param contest
   */
  async canUploadMoreObj(
    userId: string,
    contest: ContestEntity,
  ): Promise<boolean> {
    if (!contest) {
      throw new NotFoundException();
    }

    if (!contest.singleUpload) {
      return true;
    }

    const contents = await contest.contents;
    let count = 0;
    for (let i = 0; i < contents.length; i++) {
      const content = await contents[i].user;
      if (content.id === userId) {
        count++;
      }
    }

    return count < 1;
  }

  /**
   * Check user can upload content more and is creator or not
   * @returns {Promise<boolean>}
   * @param userId
   * @param contest
   */
  async getCanUploadAndIsCreator(
    userId: string,
    contest: ContestEntity,
  ): Promise<any> {
    if (!contest) {
      throw new NotFoundException();
    }

    const contents = await contest.contents;
    let content = null;
    for (let i = 0; i < contents.length; i++) {
      const user = await contents[i].user;
      if (user.id === userId) {
        content = contents[i];
      }
    }

    return {
      canUpload: !content,
      isCreator: !!content,
      content: content,
    };
  }

  /**
   * Add user to contest
   * @returns {Promise<void>}
   */
  async addContestUser(contestId: number, username: string) {
    try {
      const contest = await this.contestsRepository.findOne(contestId, {
        relations: ['users'],
      });
      const user = await this.usersRepository.findUserByUsername(username);

      if (!contest || !user) {
        throw new NotFoundException();
      }

      const users = await contest.users;
      if (users.some((u) => u.id === user.id)) {
        throw new UserContestExistsException();
      }

      users.push(new UserEntity({ id: user.id }));
      contest.users = Promise.resolve(users);
      await this.contestsRepository.save(contest);
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
      } else if (error instanceof UserContestExistsException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get contest battles
   * @param id {number}
   * @returns {Promise<UserResponseDto>}
   */
  async getContestBattles(id: number) {
    const contest = await this.contestsRepository.findOne(id, {
      relations: ['battles'],
    });

    if (!contest) {
      throw new NotFoundException();
    }

    return ContestMapper.toDtoBattles(contest);
  }

  /**
   * add content to contest
   * @param id {number}
   * @param dto
   * @returns {Promise<ContestResponseDto>}
   */
  async addContent(
    id: number,
    dto: AddContestContentDto,
  ): Promise<ContestResponseDto> {
    try {
      const entity = await this.contestsRepository.findOne(id, {
        relations: ['battles'],
      });

      if (!entity) {
        throw new NotFoundException();
      }

      if (entity.state != ContestStates.OPEN) {
        throw new ContestUploadStateException();
      }

      const contents = await entity.contents;

      if (contents.length >= entity.maxParticipants) {
        throw new ContestOverMaxParticipantException();
      }

      if (contents.some((c) => c.id === dto.content)) {
        throw new ContentExistInContestException();
      }

      contents.push(new ContentEntity({ id: dto.content }));
      entity.contents = Promise.resolve(contents);

      if (dto.users && dto.users.length > 0) {
        const users = await entity.users;
        for (let i = 0; i < dto.users.length; i++) {
          const user = await this.usersRepository.findUserByUsername(
            dto.users[i],
          );
          if (!user) {
            throw new UserNotFoundException(dto.users[i]);
          }
          if (!users.some((u) => u.id === user.id)) {
            users.push(new UserEntity({ id: user.id }));
          }
        }

        entity.users = Promise.resolve(users);
      }

      const contest = await this.contestsRepository.save(entity);

      return ContestMapper.toSimpleVotingVersionDto(contest);
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
      } else if (error instanceof ContentExistInContestException) {
        throw error;
      } else if (error instanceof ContestOverMaxParticipantException) {
        throw error;
      } else if (error instanceof ContestUploadStateException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * add content to contest
   * @param contentId {number}
   * @param contestId {number}
   * @returns {Promise<ContestResponseDto>}
   */
  async addContentToUnlimitedContest(
    contestId: number,
    contentId: number,
  ): Promise<ContestResponseDto> {
    try {
      const entity = await this.contestsRepository.findOne(contestId);

      if (!entity) {
        throw new NotFoundException();
      }

      const currentState = entity.state;
      if (
        currentState != ContestStates.OPEN &&
        currentState != ContestStates.VOTING
      ) {
        throw new UnlimitedContestUploadStateException();
      }

      const contents = await entity.contents;

      if (contents.some((c) => c.id === contentId)) {
        throw new ContentExistInContestException();
      }

      contents.push(new ContentEntity({ id: contentId }));
      entity.contents = Promise.resolve(contents);

      let isChangeFromOpenToVoting = false;
      if (
        currentState === ContestStates.OPEN &&
        contents.length >= entity.minParticipants
      ) {
        isChangeFromOpenToVoting = true;
        entity.state = ContestStates.VOTING;
      }

      const contest = await this.contestsRepository.save(entity);

      if (isChangeFromOpenToVoting) {
        await this.battlesService.createBattles(contest);
      } else if (currentState === ContestStates.VOTING) {
        await this.battlesService.appendBattles(contest, contentId);
      }

      return ContestMapper.toUnlimitedDto(contest);
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
      } else if (error instanceof ContentExistInContestException) {
        throw error;
      } else if (error instanceof ContestOverMaxParticipantException) {
        throw error;
      } else if (error instanceof UnlimitedContestUploadStateException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * add content to contest
   * @param contentId {number}
   * @param contestId {number}
   * @returns {Promise<ContestResponseDto>}
   */
  async addContentToSimpleVotingContest(
    contestId: number,
    contentId: number,
  ): Promise<ContestResponseDto> {
    try {
      const entity = await this.contestsRepository.findOne(contestId);

      if (!entity) {
        throw new NotFoundException();
      }

      const currentState = entity.state;
      if (currentState != ContestStates.VOTING) {
        throw new ContestInVotingException();
      }

      const contents = await entity.contents;

      if (contents.some((c) => c.id === contentId)) {
        throw new ContentExistInContestException();
      }

      contents.push(new ContentEntity({ id: contentId }));
      entity.contents = Promise.resolve(contents);
      await this.contestsRepository.save(entity);
      const contest = await this.contestsRepository.findOne(contestId);
      return ContestMapper.toSimpleVotingVersionDto(contest);
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
      } else if (error instanceof ContentExistInContestException) {
        throw error;
      } else if (error instanceof ContestOverMaxParticipantException) {
        throw error;
      } else if (error instanceof UnlimitedContestUploadStateException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * remove content from contest
   * @param contestId {number}
   * @param contentId {number}
   * @returns {Promise<ContestResponseDto>}
   */
  async removeContent(
    contestId: number,
    contentId: number,
  ): Promise<ContestResponseDto> {
    try {
      const entity = await this.contestsRepository.findOne(contestId, {
        relations: ['battles'],
      });

      if (!entity) {
        throw new NotFoundException();
      }

      let contents = await entity.contents;
      if (!contents.some((c) => c.id === contentId)) {
        throw new ContentNotExistInContestException();
      }
      contents = contents.filter((c) => c.id != contentId);

      entity.contents = Promise.resolve(contents);
      const contest = await this.contestsRepository.save(entity);

      return ContestMapper.toSimpleVotingVersionDto(contest);
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
      } else if (error instanceof ContentExistInContestException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  public async processRewards(contest: ContestEntity) {
    try {
      // 1. ranking
      const voters = {};
      const contentWin = {};
      const battles = await contest.battles;

      const contents = await contest.contents;
      const contentDict = {};
      contents.forEach((c) => {
        contentDict[c.id] = c;
      });

      for (let i = 0; i < battles.length; i += 1) {
        const battle = battles[i];
        const votes = await battle.votes;
        for (let j = 0; j < votes.length; j += 1) {
          const voteUser = await votes[j].user;
          voters[voteUser.id] = voteUser;
        }
        const wins = await this.getContentWin(battle, votes);
        wins.forEach((content) => {
          if (contentWin[content.id]) {
            contentWin[content.id] = contentWin[content.id] + 1;
          } else {
            contentWin[content.id] = 1;
          }
        });
      }

      const contentsSorted = Object.keys(contentWin).sort((k1, k2) => {
        return contentWin[k2] - contentWin[k1];
      });

      const rankingContents = [
        contentDict[contentsSorted[0]],
        contentDict[contentsSorted[1]],
        contentDict[contentsSorted[2]],
      ];

      const ranks = [];
      const top3Users = [];
      const top3UserDict = {};
      for (let i = 0; i < rankingContents.length; i += 1) {
        const c = rankingContents[i];
        const user = await c.user;
        top3Users.push(user);
        top3UserDict[user.id] = true;

        const rank = new ContestRankEntity();
        rank.contest = Promise.resolve(new ContestEntity({ id: contest.id }));
        rank.user = Promise.resolve(new UserEntity({ id: user.id }));
        rank.rank = i + 1;
        ranks.push(rank);
      }

      // 2. create claim records for creators / voters
      const contestClaims = [];
      for (let i = 0; i < contents.length; i += 1) {
        const u = await contents[i].user;
        const contestClaim = new ContestClaimsEntity();
        contestClaim.participantType = ParticipantType.CREATOR;
        contestClaim.claimed = false;
        contestClaim.user = Promise.resolve(new UserEntity({ id: u.id }));
        contestClaim.contest = Promise.resolve(
          new ContestEntity({ id: contest.id }),
        );
        contestClaims.push(contestClaim);
      }

      const keys = Object.keys(voters);
      for (let i = 0; i < keys.length; i += 1) {
        const vUser = voters[keys[i]] as UserEntity;
        const contestClaim = new ContestClaimsEntity();
        contestClaim.participantType = ParticipantType.VOTER;
        contestClaim.claimed = false;
        contestClaim.user = Promise.resolve(new UserEntity({ id: vUser.id }));
        contestClaim.contest = Promise.resolve(
          new ContestEntity({ id: contest.id }),
        );
        contestClaims.push(contestClaim);
      }

      await this.contestRanksRepository.save(ranks);
      await this.contestClaimsRepository.save(contestClaims);
    } catch (error) {
      this.logger.error(error.stack.toString());

      throw new InternalServerErrorException();
    }
  }

  public async makeTopWinners() {
    const contests = await this.contestsRepository.getContestsForCronJob([
      ContestStates.VOTING,
    ]);

    const contestsDict = {};
    for (let i = 0; i < contests.length; i += 1) {
      const contest = contests[i];
      const top3Winners = await this.userContestVotesRepository.getTopWinners(
        contest.id,
      );

      const ranks = [];
      const top3Users = [];
      for (let j = 0; j < top3Winners.length; j += 1) {
        const c = top3Winners[j];
        const contentId = c.content_id;
        const content = await this.contentsRepository.findOne(contentId);
        const user = await content.user;

        const rank = new ContestRankEntity();
        rank.contest = Promise.resolve(new ContestEntity({ id: contest.id }));
        rank.user = Promise.resolve(new UserEntity({ id: user.id }));
        rank.rank = j + 1;
        rank.totalVotes = c.votes;
        ranks.push(rank);
        top3Users.push({
          top: j + 1,
          user: UserMapper.toDtoShort(user),
          contentId: contentId,
        });
      }

      const oldRanks = await this.contestRanksRepository.getByContestId(
        contest.id,
      );
      await this.contestRanksRepository.remove(oldRanks);
      await this.contestRanksRepository.save(ranks);
      contestsDict[`${contest.id}`] = top3Users;
    }
    return contestsDict;
  }

  public async pushNotificationsContestEnd(contestsDict) {
    const contestIds = Object.keys(contestsDict);
    const usersDict = {};
    for (let i = 0; i < contestIds.length; i += 1) {
      const contestId = +contestIds[i];
      const contestEntity = await this.contestsRepository.findOne(contestId);
      const contentIds = [];
      const topWinners = contestsDict[`${contestId}`];
      const topWinnersDict = {};
      topWinners.forEach((topWinner) => {
        contentIds.push(topWinner.contentId);
        topWinnersDict[`${topWinner.user.contentId}`] = topWinner.user;
      });
      const votedUsers =
        await this.userContestVotesRepository.getByContestIdAndContentIds(
          contestId,
          contentIds,
        );
      const uniqueUsers = {};
      for (let j = 0; j < votedUsers.length; j += 1) {
        const userVote = votedUsers[j];
        const _user = await userVote.user;
        if (!usersDict[userVote.userId]) {
          usersDict[userVote.userId] = {
            devices: _user.devices ? _user.devices : [],
            contests: [],
          };
        }
        if (
          usersDict[userVote.userId].contests.some(
            (c) => c.contestId === contestId,
          )
        ) {
          continue;
        }
        usersDict[userVote.userId].contests.push({
          contestId: contestId,
          contestName: contestEntity.name,
          topWinners: topWinners,
        });
        uniqueUsers[userVote.userId] = true;
      }

      const contestClaims = [];
      const keys = Object.keys(uniqueUsers);
      const oldClaims = await this.contestClaimsRepository.getByContestId(
        contestId,
      );
      for (let k = 0; k < keys.length; k += 1) {
        const contestClaim = new ContestClaimsEntity();
        contestClaim.participantType = ParticipantType.VOTER;
        contestClaim.claimed = false;
        contestClaim.user = Promise.resolve(new UserEntity({ id: keys[k] }));
        contestClaim.contest = Promise.resolve(
          new ContestEntity({ id: contestId }),
        );
        contestClaims.push(contestClaim);
      }
      await this.contestClaimsRepository.remove(oldClaims);
      await this.contestClaimsRepository.save(contestClaims);
    }

    await this.fireBaseService.pushNotificationsContestEnd(usersDict);
  }

  private async getContentWin(
    battle: BattleEntity,
    votes: UserVotesEntity[],
  ): Promise<any[]> {
    const contentA = await battle.contentA;
    const contentB = await battle.contentB;
    let contentACount = 0;
    let contentBCount = 0;
    for (let j = 0; j < votes.length; j += 1) {
      const vote = votes[j];
      if ((await vote.content).id === contentA.id) {
        contentACount++;
      } else {
        contentBCount++;
      }
    }

    if (contentACount === contentBCount) {
      return [contentA, contentB];
    } else if (contentACount > contentBCount) {
      return [contentA];
    } else {
      return [contentB];
    }
  }

  public async claimOld(userId: string, contestId: number) {
    try {
      const contest = await this.contestsRepository.findOne(contestId);
      const claims = await this.contestClaimsRepository.getByUserAndContestId(
        userId,
        contestId,
      );
      const needClaimForCreator = claims.some(
        (c) => !c.claimed && c.participantType === ParticipantType.CREATOR,
      );
      const needClaimForVoter = claims.some(
        (c) => !c.claimed && c.participantType === ParticipantType.VOTER,
      );

      if (!needClaimForCreator && !needClaimForVoter) {
        throw new ContestClaimException();
      }

      let token = 0;
      let energy = 0;
      let xp = 0;
      if (needClaimForCreator) {
        const rank = await this.contestRanksRepository.getByUserAndContestId(
          userId,
          contestId,
        );
        if (rank) {
          token += RewardsHelper.getWinRewards(
            rank.rank,
            contest.contestantRewards,
          );
          token += RewardsHelper.getParticipantPrize(
            true,
            contest.participantPrize,
          );
          energy += 1;
          xp += RewardsHelper.getXpBonusRewards(true, contest.xpRewards);
        } else {
          token += RewardsHelper.getParticipantPrize(
            true,
            contest.participantPrize,
          );
          energy += 1;
          xp += RewardsHelper.getXpBonusRewards(false, contest.xpRewards);
        }
      }

      if (needClaimForVoter) {
        const userVotes = await this.votesRepository.getByUserAndContest(
          userId,
          contest.id,
        );
        token += RewardsHelper.getParticipantPrize(
          false,
          contest.participantPrize,
        );
        energy += 1;
        const ranks = await contest.ranks;
        const topUserRank = {};
        for (let j = 0; j < ranks.length; j += 1) {
          topUserRank[(await ranks[j].user).id] = true;
        }

        let totalVoteWin = 0;
        for (let j = 0; j < userVotes.length; j += 1) {
          const user = await userVotes[j].user;
          if (topUserRank[user.id]) {
            totalVoteWin += 1;
          }
        }
        if (totalVoteWin > 0) {
          xp +=
            totalVoteWin *
            RewardsHelper.getXpBonusRewards(true, contest.xpRewards);
        } else {
          xp += RewardsHelper.getXpBonusRewards(false, contest.xpRewards);
        }
      }

      await this.usersService.addUserXp(userId, xp, token, energy);
      claims.forEach((c) => {
        c.claimed = true;
      });
      await this.contestClaimsRepository.save(claims);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof ContestClaimException) {
        throw error;
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  public async claim(userId: string, contestId: number) {
    try {
      const allClaims =
        await this.contestClaimsRepository.getByUserAndContestId(
          userId,
          contestId,
        );
      const needClaims = allClaims.filter(
        (c) => !c.claimed && c.participantType === ParticipantType.VOTER,
      );

      if (needClaims.length === 0) {
        throw new ContestClaimException();
      }

      needClaims.forEach((c) => {
        c.claimed = true;
      });

      await this.contestClaimsRepository.save(needClaims);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof ContestClaimException) {
        throw error;
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  public async getClaims(userId: string) {
    const claims = [];
    try {
      const allClaims = await this.contestClaimsRepository.getByUser(userId);

      for (let i = 0; i < allClaims.length; i += 1) {
        const contest = await allClaims[i].contest;
        const top3Winners = await this.userContestVotesRepository.getTopWinners(
          contest.id,
        );
        const top3Users = [];
        for (let j = 0; j < top3Winners.length; j += 1) {
          const c = top3Winners[j];
          const contentId = c.content_id;
          const content = await this.contentsRepository.findOne(contentId);
          const user = await content.user;
          top3Users.push({
            top: j + 1,
            user: UserMapper.toDtoShort(user),
            contentId: contentId,
          });
        }
        claims.push({
          contestId: contest.id,
          contestName: contest.name,
          topWinners: top3Users,
        });
      }

      return claims;
    } catch (error) {
      this.logger.error(error.stack.toString());
      throw new InternalServerErrorException();
    }
  }
}
