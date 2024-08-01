import { ContentEntity } from '@modules/contents/entities/content.entity';
import { ContentResponseDto } from '@modules/contents/dto/content-response.dto';
import { CreateContentDto } from '@modules/contents/dto/create-content.dto';
import { UserEntity } from '@admin/access/users/user.entity';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { UserMapper } from '@admin/access/users/users.mapper';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';

export class ContentMapper {
  public static toCreateEntity(dto: CreateContentDto): ContentEntity {
    const entity = new ContentEntity();
    entity.fileOriginalName = dto.fileOriginalName;
    entity.fileName = dto.fileName;
    entity.fileUrl = dto.fileUrl;
    entity.thumbnailUrl = dto.thumbnailUrl;
    if (dto.userId) {
      entity.user = Promise.resolve(new UserEntity({ id: dto.userId }));
    }
    if (dto.contestId) {
      entity.contests = Promise.resolve([
        new ContestEntity({ id: dto.contestId }),
      ]);
    }
    return entity;
  }

  public static async toDto(
    entity: ContentEntity,
    countVoteForContest = null,
  ): Promise<ContentResponseDto> {
    const dto = new ContentResponseDto();

    dto.id = entity.id;
    dto.fileOriginalName = entity.fileOriginalName;
    dto.url = entity.fileUrl;
    if (countVoteForContest) {
      const votes = await entity.votes;
      let voteCount = 0;
      for (let i = 0; i < votes.length; i++) {
        const battle = await votes[i].battle;
        if ((await battle.contest).id === countVoteForContest) {
          voteCount += 1;
        }
      }
      dto.votes = voteCount;
    } else {
      dto.votes = (await entity.votes).length;
    }
    dto.thumbnailUrl = entity.thumbnailUrl;
    dto.user = UserMapper.toDtoShort(await entity.user);
    return dto;
  }

  public static async toSimpleVotingDto(
    entity: ContentEntity,
    userId: string,
    contestId: number,
  ): Promise<ContentResponseDto> {
    const dto = new ContentResponseDto();

    dto.id = entity.id;
    dto.fileOriginalName = entity.fileOriginalName;
    dto.url = entity.fileUrl;

    const votes = await entity.contestVotes;
    const voteFilter = votes.filter((v) => v.contestId === contestId);
    dto.votes = voteFilter.length;
    if (userId) {
      dto.voted = voteFilter.some((v) => v.userId === userId);
    }
    dto.thumbnailUrl = entity.thumbnailUrl;
    dto.user = UserMapper.toDtoShort(await entity.user);
    return dto;
  }

  public static async toDtoBasic(
    entity: ContentEntity,
  ): Promise<ContentResponseDto> {
    const dto = new ContentResponseDto();

    dto.id = entity.id;
    dto.url = entity.fileUrl;
    dto.fileOriginalName = entity.fileOriginalName;
    dto.thumbnailUrl = entity.thumbnailUrl;
    return dto;
  }

  public static async toDtoWithUserProfile(
    entity: ContentEntity,
    countVoteForBattle = null,
  ): Promise<ContentResponseDto> {
    const dto = new ContentResponseDto();

    dto.id = entity.id;
    dto.url = entity.fileUrl;
    dto.fileOriginalName = entity.fileOriginalName;
    if (countVoteForBattle) {
      const votes = await entity.votes;
      let voteCount = 0;
      for (let i = 0; i < votes.length; i++) {
        if ((await votes[i].battle).id === countVoteForBattle) {
          voteCount += 1;
        }
      }
      dto.votes = voteCount;
    } else {
      dto.votes = (await entity.votes).length;
    }
    dto.thumbnailUrl = entity.thumbnailUrl;
    dto.user = await UserMapper.toProfileDto(await entity.user);
    return dto;
  }

  public static async toDtoWithBattleVote(
    entity: ContentEntity,
    countVoteForBattle = null,
  ): Promise<ContentResponseDto> {
    const dto = new ContentResponseDto();

    dto.id = entity.id;
    if (countVoteForBattle) {
      const votes = await entity.votes;
      let voteCount = 0;
      for (let i = 0; i < votes.length; i++) {
        if ((await votes[i].battle).id === countVoteForBattle) {
          voteCount += 1;
        }
      }
      dto.votes = voteCount;
    } else {
      dto.votes = (await entity.votes).length;
    }
    dto.user = await UserMapper.toProfileDto(await entity.user);
    return dto;
  }

  public static async toDtoWithRelations(
    entity: ContentEntity,
  ): Promise<UserContentResponseDto> {
    const contestEntities = await entity.contests;
    const dto = new UserContentResponseDto();
    dto.id = entity.id;
    dto.url = entity.fileUrl;
    dto.fileOriginalName = entity.fileOriginalName;
    dto.thumbnailUrl = entity.thumbnailUrl;
    dto.votes = (await entity.contestVotes).length;
    dto.userId = (await entity.user).id;
    dto.contests = [];
    if (contestEntities && contestEntities.length > 0) {
      for (let i = 0; i < contestEntities.length; i++) {
        const contestEntity = contestEntities[i];
        dto.contests.push({
          id: contestEntity.id,
          name: contestEntity.name,
        });
      }
    }
    return dto;
  }
}
