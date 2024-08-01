import { UserMapper } from '@admin/access/users/users.mapper';
import { BattleSequenceDto } from '@modules/battle-sequences/dto/battle-sequence.dto';
import { BattleSequenceEntity } from '@modules/battle-sequences/entities/battle-sequence.entity';
import {
  BattleSequenceStepDto,
  BattleStepDto,
} from '@modules/battle-sequences/dto/battle-sequence-step.dto';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { ContentMapper } from '@modules/contents/content.mapper';
import { BattleDto } from '@modules/battles/dto/battle.dto';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { UserEntity } from '@admin/access/users/user.entity';
import { BattleSequenceStatus } from '@common/enums/battle-sequence-status.enum';
import { BattleSequenceStepEntity } from '@modules/battle-sequences/entities/battle-sequence-step.entity';

export class BattleSequenceMapper {
  public static toCreateEntity(
    userId: string,
    contestId: number,
    battles: BattleDto[],
  ): BattleSequenceEntity {
    const entity = new BattleSequenceEntity();
    entity.currentStep = 1;
    entity.status = BattleSequenceStatus.IN_PROGRESS;
    entity.contest = Promise.resolve(new ContestEntity({ id: contestId }));
    entity.votedUser = Promise.resolve(new UserEntity({ id: userId }));

    const battleSequenceSteps = [];
    for (let i = 0; i < battles.length; i += 1) {
      battleSequenceSteps.push(
        BattleSequenceMapper.toBattleStepEntity(battles[i], i + 1),
      );
    }

    entity.battleSequenceSteps = Promise.resolve(battleSequenceSteps);
    return entity;
  }

  private static toBattleStepEntity(
    battle: BattleDto,
    step: number,
  ): BattleSequenceStepEntity {
    const entity = new BattleSequenceStepEntity();
    entity.step = step;
    entity.battle = Promise.resolve(new BattleEntity({ id: battle.id }));
    return entity;
  }

  public static async toDto(
    entity: BattleSequenceEntity,
  ): Promise<BattleSequenceDto> {
    const dto = new BattleSequenceDto();
    dto.id = entity.id;
    dto.contestId = (await entity.contest).id;
    dto.currentStep = entity.currentStep;
    dto.status = entity.status;
    dto.votedUser = await UserMapper.toProfileDto(await entity.votedUser);

    const bSSs = await entity.battleSequenceSteps;
    const battleSequenceSteps = [];
    for (let i = 0; i < bSSs.length; i++) {
      const e = bSSs[i];
      const bss = new BattleSequenceStepDto();
      bss.id = e.id;
      bss.step = e.step;
      bss.battle = await BattleSequenceMapper.toBattleStepDto(
        await e.battle,
        dto.votedUser.id,
      );
      battleSequenceSteps.push(bss);
    }

    dto.battles = battleSequenceSteps;
    return dto;
  }

  public static async toBasicDto(
    entity: BattleSequenceEntity,
  ): Promise<BattleSequenceDto> {
    const dto = new BattleSequenceDto();
    dto.id = entity.id;
    dto.contestId = (await entity.contest).id;
    dto.currentStep = entity.currentStep;
    dto.status = entity.status;
    return dto;
  }

  private static async toBattleStepDto(
    battle: BattleEntity,
    currentUserId = null,
  ): Promise<BattleDto> {
    const dto = new BattleStepDto();
    dto.id = battle.id;
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
}
