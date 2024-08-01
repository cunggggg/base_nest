import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { CreateBattleDto } from '@modules/battles/dto/create-battle.dto';
import { ContentMapper } from '@modules/contents/content.mapper';
import { BattleResponseDto } from '@modules/battles/dto/response-battle.dto';
import { ContestMapper } from '@modules/contests/contests.mapper';
import { BattleDto } from '@modules/battles/dto/battle.dto';

export class BattleMapper {
  public static async toDto(entity: BattleEntity): Promise<CreateBattleDto> {
    const dto = new CreateBattleDto();

    dto.id = entity.id;
    return dto;
  }

  public static async toDtoBasic(
    entity: BattleEntity,
  ): Promise<BattleResponseDto> {
    const dto = new BattleResponseDto();
    dto.id = entity.id;
    dto.contest = await ContestMapper.toDtoBasic(await entity.contest);
    return dto;
  }

  public static async toDtoWithContent(
    entity: BattleEntity,
  ): Promise<BattleDto> {
    const dto = new BattleDto();
    dto.id = entity.id;
    dto.contentA = await ContentMapper.toDtoBasic(await entity.contentA);
    dto.contentB = await ContentMapper.toDtoBasic(await entity.contentB);
    return dto;
  }

  public static async toDtoWithRelations(
    battle: BattleEntity,
    currentUserId = null,
  ): Promise<BattleResponseDto> {
    const dto = new BattleResponseDto();
    dto.id = battle.id;
    dto.status = 1;
    dto.contest = await ContestMapper.toDtoBasic(
      await battle.contest,
      currentUserId,
    );
    dto.contentA = await ContentMapper.toDtoWithUserProfile(
      await battle.contentA,
      battle.id,
    );
    dto.contentB = await ContentMapper.toDtoWithUserProfile(
      await battle.contentB,
      battle.id,
    );

    dto.votes = dto.contentA.votes + dto.contentB.votes;
    dto.youVoted = null;
    if (currentUserId) {
      const bVotes = await battle.votes;
      for (let i = 0; i < bVotes.length; i++) {
        const user = await bVotes[i].user;
        if (user.id === currentUserId) {
          dto.youVoted = (await bVotes[i].content).id;
          break;
        }
      }
    }

    return dto;
  }

  public static async toDtoWithVote(
    battle: BattleEntity,
    currentUserId = null,
  ): Promise<BattleResponseDto> {
    const dto = new BattleResponseDto();
    dto.id = battle.id;
    dto.contentA = await ContentMapper.toDtoWithBattleVote(
      await battle.contentA,
      battle.id,
    );
    dto.contentB = await ContentMapper.toDtoWithBattleVote(
      await battle.contentB,
      battle.id,
    );

    dto.votes = dto.contentA.votes + dto.contentB.votes;
    dto.youVoted = null;
    if (currentUserId) {
      const bVotes = await battle.votes;
      for (let i = 0; i < bVotes.length; i++) {
        const user = await bVotes[i].user;
        if (user.id === currentUserId) {
          dto.youVoted = (await bVotes[i].content).id;
          break;
        }
      }

      const winner =
        dto.contentA.votes > dto.contentB.votes
          ? dto.contentA.id
          : dto.contentB.id;
      if (dto.contentA.votes === dto.contentB.votes) {
        dto.youWin = true;
      } else {
        dto.youWin = dto.youVoted === winner;
      }
    }

    return dto;
  }

  public static toCreateEntity(dto: CreateBattleDto): BattleEntity {
    const entity = new BattleEntity();
    entity.contest = Promise.resolve(new ContestEntity({ id: dto.contestId }));
    entity.contentA = Promise.resolve(
      new ContentEntity({ id: dto.contentAId }),
    );
    entity.contentB = Promise.resolve(
      new ContentEntity({ id: dto.contentBId }),
    );
    return entity;
  }
}
