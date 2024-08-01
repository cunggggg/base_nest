import { ContestStates } from '@common/enums/contest-state.enum';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { CreateContestDto } from '@modules/contests/dto/create-contest.dto';
import { UpdateContestDto } from '@modules/contests/dto/update-contest.dto';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { UserEntity } from '@admin/access/users/user.entity';
import { ContestResponseDto } from '@modules/contests/dto/contest-response.dto';
import { CreatedContestResponseDto } from '@modules/contests/dto/create-contest-response.dto';
import { ContentMapper } from '@modules/contents/content.mapper';
import { ContestBattleDto } from '@modules/contests/dto/contest-battle.dto';
import { DateHelper } from '../../helpers/date.helper';
import { BattleMapper } from '@modules/battles/battles.mapper';
import { BattleDto } from '@modules/battles/dto/battle.dto';
import { CreateContestV2Dto } from '@modules/contests/dto/create-contest-v2.dto';
import { CreateContestV3Dto } from '@modules/contests/dto/create-contest-v3.dto';
import { UpdateContestV3Dto } from '@modules/contests/dto/update-contest-v3.dto';

export class ContestMapper {
  public static async toDto(
    entity: ContestEntity,
  ): Promise<CreatedContestResponseDto> {
    const dto = new CreatedContestResponseDto();

    dto.id = entity.id;
    return dto;
  }

  public static async toDtoBasic(
    entity: ContestEntity,
    userCanUpload = null,
  ): Promise<ContestResponseDto> {
    const dto = new ContestResponseDto();

    dto.id = entity.id;
    dto.name = entity.name;
    dto.videoMaxLength = entity.videoMaxLength;

    if (userCanUpload) {
      dto.canUpload = true;

      if (entity.singleUpload) {
        const contents = await entity.contents;
        let count = 0;
        for (let i = 0; i < contents.length; i++) {
          const user = await contents[i].user;
          if (user.id === userCanUpload) {
            count++;
          }
        }

        dto.canUpload = count < 1;
      }
    }

    return dto;
  }

  public static async toDtoContestFeed(
    entity: ContestEntity,
  ): Promise<ContestResponseDto> {
    const dto = new ContestResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.longDescription = entity.longDescription;
    dto.creatorName = entity.creatorName;
    dto.creatorAvatar = entity.creatorAvatar;
    dto.creatorCountry = entity.creatorCountry;
    dto.rewards = entity.rewards;
    dto.state = entity.state;
    dto.rules = entity.rules.map(decodeURIComponent);
    dto.videoMaxLength = entity.videoMaxLength;
    dto.minParticipants = entity.minParticipants;
    dto.totalParticipants = (await entity.contents).length;
    dto.startTime = entity.startTime?.getTime();
    dto.xpRewards = entity.xpRewards;
    dto.videoIntro = entity.videoIntro;
    dto.videoIntroImg = entity.videoIntroImg;
    dto.contents = [];
    return dto;
  }

  public static async toUnlimitedDto(
    entity: ContestEntity,
    countVote = false,
  ): Promise<ContestResponseDto> {
    const dto = new ContestResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.longDescription = entity.longDescription;
    dto.creatorName = entity.creatorName;
    dto.creatorAvatar = entity.creatorAvatar;
    dto.creatorCountry = entity.creatorCountry;
    dto.rewards = entity.rewards;
    dto.state = entity.state;
    dto.rules = entity.rules.map(decodeURIComponent);
    dto.videoMaxLength = entity.videoMaxLength;
    dto.minParticipants = entity.minParticipants;
    dto.startTime = entity.startTime?.getTime();
    dto.xpRewards = entity.xpRewards;
    dto.videoIntro = entity.videoIntro;
    dto.videoIntroImg = entity.videoIntroImg;

    const contents = (await entity.contents).sort((c1, c2) => {
      return c2.id - c1.id;
    });
    dto.contents = await Promise.all(
      contents.map((c) => ContentMapper.toDto(c, countVote ? entity.id : null)),
    );
    return dto;
  }

  public static async toSimpleVotingVersionDto(
    entity: ContestEntity,
    userId = null,
  ): Promise<ContestResponseDto> {
    const dto = new ContestResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.longDescription = entity.longDescription;
    dto.creatorName = entity.creatorName;
    dto.creatorAvatar = entity.creatorAvatar;
    dto.creatorCountry = entity.creatorCountry;
    dto.rewards = entity.rewards;
    dto.state = entity.state;
    dto.rules = entity.rules.map(decodeURIComponent);
    dto.videoMaxLength = entity.videoMaxLength;
    dto.minParticipants = entity.minParticipants;
    dto.startTime = entity.startTime?.getTime();
    dto.xpRewards = entity.xpRewards;
    dto.videoIntro = entity.videoIntro;
    dto.videoIntroImg = entity.videoIntroImg;

    const contents = await entity.contents;
    contents.sort((c1, c2) => {
      return c2.createdAt.getTime() - c1.createdAt.getTime();
    });
    dto.contents = await Promise.all(
      contents.map((c) =>
        ContentMapper.toSimpleVotingDto(c, userId, entity.id),
      ),
    );
    dto.totalVotes = dto.contents.reduce((acc, curr) => acc + curr.votes, 0);
    dto.totalParticipants = contents.length;
    return dto;
  }

  public static async toDtoWithContentRelations(
    entity: ContestEntity,
  ): Promise<ContestResponseDto> {
    const dto = new ContestResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.contents = await Promise.all(
      (await entity.contents).map(ContentMapper.toDto),
    );
    return dto;
  }

  public static async toDtoBattles(
    entity: ContestEntity,
  ): Promise<ContestBattleDto[]> {
    const dtos = [];

    const battles = await entity.battles;
    for (let i = 0; i < battles.length; i++) {
      const battle = battles[i];
      const dto = new ContestBattleDto();
      dto.id = battle.id;
      dto.winner = battle.winner;
      dto.contentA = await ContentMapper.toDtoWithUserProfile(
        await battle.contentA,
        battle.id,
      );
      dto.contentB = await ContentMapper.toDtoWithUserProfile(
        await battle.contentB,
        battle.id,
      );
      dto.votes = dto.contentA.votes + dto.contentB.votes;

      dtos.push(dto);
    }

    return dtos;
  }

  public static toCreateEntity(dto: CreateContestDto): ContestEntity {
    const entity = new ContestEntity();
    entity.name = dto.name;
    entity.description = dto.description;
    entity.imageCover = dto.imageCover;
    // entity.singleUpload = dto.singleUpload;
    entity.singleUpload = true; //always true
    entity.promote = dto.promote;
    entity.owner = Promise.resolve(new UserEntity({ id: dto.owner }));
    entity.state = ContestStates.NEW;
    entity.rules = dto.rules.map(encodeURIComponent);
    entity.participantPrize = dto.participantPrize;
    entity.contestantRewards = dto.contestantRewards;
    entity.voteRewards = dto.voteRewards;
    entity.xpRewards = dto.xpRewards;
    entity.videoMaxLength = dto.videoMaxLength;
    entity.minVote = dto.minVote;
    entity.minParticipants = dto.minParticipants;
    entity.maxParticipants = dto.maxParticipants;
    entity.startTime = DateHelper.removeSecond(new Date(dto.startTime));
    entity.endTime = DateHelper.removeSecond(new Date(dto.endTime));
    entity.videoIntro = dto.videoIntro;
    entity.videoIntroImg = dto.videoIntroImg;
    if (dto.submissionDeadline) {
      entity.submissionDeadline = DateHelper.removeSecond(
        new Date(dto.submissionDeadline),
      );
    }
    entity.expireTime = DateHelper.removeSecond(new Date(dto.expireTime));
    entity.contents = Promise.resolve(
      dto.contents.map((id) => new ContentEntity({ id })),
    );
    if (dto.users) {
      entity.users = Promise.resolve(
        dto.users.map((id) => new UserEntity({ id })),
      );
    }
    return entity;
  }

  public static toCreateV2Entity(dto: CreateContestV2Dto): ContestEntity {
    const entity = new ContestEntity();
    entity.name = dto.name;
    entity.description = dto.description;
    entity.imageCover = dto.imageCover;
    entity.singleUpload = true;
    entity.promote = false;
    entity.owner = Promise.resolve(new UserEntity({ id: dto.owner }));
    entity.state = ContestStates.VOTING;
    entity.rules = [];
    entity.participantPrize = ['3', '1'];
    entity.contestantRewards = ['10', '6', '4'];
    entity.voteRewards = 1;
    entity.xpRewards = ['10', '0', '20', '10'];
    entity.videoMaxLength = 30;
    entity.minVote = 5;
    entity.minParticipants = 10;
    entity.maxParticipants = 100;

    const currentDate = DateHelper.removeSecond(new Date());
    entity.startTime = DateHelper.beforeNDay(currentDate, 1);
    entity.endTime = DateHelper.afterNDay(currentDate, 365);
    entity.submissionDeadline = currentDate;
    entity.expireTime = DateHelper.afterNDay(currentDate, 366);
    entity.contents = Promise.resolve(
      dto.contents.map((c) => new ContentEntity({ id: c.contentId })),
    );
    return entity;
  }

  public static toCreateV3Entity(dto: CreateContestV3Dto): ContestEntity {
    const entity = new ContestEntity();
    entity.name = dto.name;
    entity.description = dto.description;
    entity.longDescription = dto.longDescription;
    entity.creatorName = dto.creatorName;
    entity.creatorAvatar = dto.creatorAvatar;
    entity.creatorCountry = dto.creatorCountry;
    entity.rewards = dto.rewards;
    entity.owner = Promise.resolve(new UserEntity({ id: dto.owner }));
    entity.state = ContestStates.NEW;
    entity.rules = dto.rules.map(encodeURIComponent);
    entity.xpRewards = [dto.xpRewards[0], '0', '0', '0'];
    entity.videoMaxLength = dto.videoMaxLength;
    entity.minVote = 0;
    entity.minParticipants = dto.minParticipants;
    entity.videoIntro = dto.videoIntro;
    entity.videoIntroImg = dto.videoIntroImg;
    entity.contents = Promise.resolve(
      dto.contents.map((c) => new ContentEntity({ id: c.contentId })),
    );

    const startTime = DateHelper.removeSecond(new Date(dto.startTime));
    entity.startTime = startTime;
    entity.submissionDeadline = DateHelper.afterNDay(startTime, 364);
    entity.endTime = DateHelper.afterNDay(startTime, 365);
    entity.expireTime = DateHelper.afterNDay(startTime, 366);
    return entity;
  }

  public static toUpdateEntity(
    entity: ContestEntity,
    dto: UpdateContestDto,
  ): ContestEntity {
    entity.name = dto.name ? dto.name : entity.name;
    entity.description = dto.description ? dto.description : entity.description;
    entity.promote = dto.promote;
    entity.imageCover = dto.imageCover ? dto.imageCover : entity.imageCover;
    entity.rules = dto.rules.map(encodeURIComponent);
    entity.participantPrize = dto.participantPrize;
    entity.maxParticipants = dto.maxParticipants;
    entity.contestantRewards = dto.contestantRewards;
    entity.voteRewards = dto.voteRewards ? dto.voteRewards : entity.voteRewards;
    entity.videoMaxLength = dto.videoMaxLength;
    entity.minVote = dto.minVote;
    entity.minParticipants = dto.minParticipants;
    entity.videoIntro = dto.videoIntro;
    entity.videoIntroImg = dto.videoIntroImg;
    entity.startTime = DateHelper.removeSecond(new Date(dto.startTime));
    entity.endTime = DateHelper.removeSecond(new Date(dto.endTime));
    entity.submissionDeadline = dto.submissionDeadline
      ? DateHelper.removeSecond(new Date(dto.submissionDeadline))
      : null;
    entity.expireTime = DateHelper.removeSecond(new Date(dto.expireTime));
    entity.xpRewards = dto.xpRewards;
    if (dto.contents) {
      entity.contents = Promise.resolve(
        dto.contents.map((id) => new ContentEntity({ id })),
      );
    }

    if (dto.users) {
      entity.users = Promise.resolve(
        dto.users.map((id) => new UserEntity({ id })),
      );
    }
    return entity;
  }

  public static toUpdateV3Entity(
    entity: ContestEntity,
    dto: UpdateContestV3Dto,
  ): ContestEntity {
    entity.name = dto.name;
    entity.description = dto.description;
    entity.longDescription = dto.longDescription;
    entity.creatorName = dto.creatorName;
    entity.creatorAvatar = dto.creatorAvatar;
    entity.creatorCountry = dto.creatorCountry;
    entity.rewards = dto.rewards;
    entity.rules = dto.rules.map(encodeURIComponent);
    entity.xpRewards = [dto.xpRewards[0], '0', '0', '0'];
    entity.videoMaxLength = dto.videoMaxLength;
    entity.minParticipants = dto.minParticipants;
    entity.videoIntro = dto.videoIntro;
    entity.videoIntroImg = dto.videoIntroImg;
    entity.startTime = DateHelper.removeSecond(new Date(dto.startTime));
    return entity;
  }

  public static async toBattles(entity: ContestEntity): Promise<BattleDto[]> {
    const battles = await entity.battles;
    const dtos = [];

    for (let i = 0; i < battles.length; i += 1) {
      dtos.push(await BattleMapper.toDtoWithContent(battles[i]));
    }
    return dtos;
  }
}
