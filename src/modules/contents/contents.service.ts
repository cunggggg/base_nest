import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateContentDto } from './dto/create-content.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentsRepository } from '@modules/contents/contents.repository';
import { TimeoutError } from 'rxjs';
import { ContentMapper } from '@modules/contents/content.mapper';
import { DBErrorCode } from '@common/enums';
import { ForeignKeyConflictException } from '@common/exeptions';
import { ContentExistsException } from '@common/exeptions/content-exists.exception';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';
import { BattlesRepository } from '@modules/battles/battles.repository';
import { ContentNotByUserException } from '@common/exeptions/content-not-by-user.exception';
import { VotesRepository } from '@modules/votes/votes.repository';

@Injectable()
export class ContentsService {
  private readonly logger = new Logger(ContentsService.name);

  constructor(
    @InjectRepository(ContentsRepository)
    private contentsRepository: ContentsRepository,
    @InjectRepository(BattlesRepository)
    private battlesRepository: BattlesRepository,
    @InjectRepository(VotesRepository)
    private votesRepository: VotesRepository,
  ) {}

  async create(contentDto: CreateContentDto): Promise<UserContentResponseDto> {
    try {
      let contentEntity = ContentMapper.toCreateEntity(contentDto);
      contentEntity = await this.contentsRepository.save(contentEntity);
      return ContentMapper.toDtoWithRelations(contentEntity);
    } catch (error) {
      this.logger.error(error.stack.toString());
      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new ContentExistsException(contentDto.fileUrl);
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

  // async clearContest(contentIds: number[]): Promise<void> {
  //   try {
  //     const contents = await this.contentsRepository.findByIds(contentIds);
  //     contents.forEach((content) => {
  //       content.contest = null;
  //     });
  //
  //     await this.contentsRepository.save(contents);
  //   } catch (error) {
  //     this.logger.error(error.stack.toString());
  //
  //     if (
  //       error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
  //       error.code == DBErrorCode.PgNotNullConstraintViolation
  //     ) {
  //       throw new ForeignKeyConflictException();
  //     }
  //     if (error instanceof TimeoutError) {
  //       throw new RequestTimeoutException();
  //     } else {
  //       throw new InternalServerErrorException();
  //     }
  //   }
  // }

  /**
   * Delete content
   * @param id {string}
   * @param userId
   * @returns {Promise<UserContentResponseDto>}
   */
  public async deleteContent(id: number, userId: string): Promise<number> {
    try {
      const contentEntity = await this.contentsRepository.findOne(id, {
        relations: ['user'],
      });

      if (!contentEntity) {
        throw new NotFoundException();
      }

      if ((await contentEntity.user).id !== userId) {
        throw new ContentNotByUserException();
      }

      const battles = await this.battlesRepository.getByContent(id);
      const battleIds = battles.map((b) => b.id);
      const votes = await this.votesRepository.getByBattles(battleIds);
      await this.votesRepository.remove(votes);
      await this.battlesRepository.remove(battles);
      await this.contentsRepository.remove(contentEntity);

      return contentEntity.id;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Get contents by user
   * @param userId
   * @returns {Promise<UserContentResponseDto>}
   */
  public async getContentsByUser(
    userId: string,
  ): Promise<UserContentResponseDto[]> {
    try {
      const contentEntities = await this.contentsRepository.getContentsByUser(
        userId,
      );

      return Promise.all(contentEntities.map(ContentMapper.toDtoWithRelations));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Get contents by user
   * @param userId
   * @param contentId
   * @returns {Promise<UserContentResponseDto>}
   */
  public async getUserContentById(
    userId: string,
    contentId: number,
  ): Promise<UserContentResponseDto> {
    try {
      const content = await this.contentsRepository.findOne(contentId);
      if (!content) {
        throw new NotFoundException();
      }

      const user = await content.user;
      if (userId !== user.id) {
        throw new ContentNotByUserException();
      }

      return ContentMapper.toDtoWithRelations(content);
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ContentNotByUserException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Verify content before add to contest
   * @param userId
   * @param contentId
   * @returns {Promise<UserContentResponseDto>}
   */
  public async verifyContent(userId: string, contentId: number): Promise<void> {
    try {
      const content = await this.contentsRepository.findOne(contentId);
      if (!content) {
        throw new NotFoundException();
      }

      const user = await content.user;
      if (userId !== user.id) {
        throw new ContentNotByUserException();
      }
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ContentNotByUserException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get content detail
   * @param contentId
   * @returns {Promise<UserContentResponseDto>}
   */
  public async getContent(contentId: number): Promise<UserContentResponseDto> {
    try {
      const content = await this.contentsRepository.findOne(contentId);
      if (!content) {
        throw new NotFoundException();
      }

      return ContentMapper.toDtoWithRelations(content);
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ContentNotByUserException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
