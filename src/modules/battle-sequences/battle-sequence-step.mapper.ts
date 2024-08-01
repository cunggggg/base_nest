import { BattleSequenceStepDto } from '@modules/battle-sequences/dto/battle-sequence-step.dto';
import { BattleSequenceStepEntity } from '@modules/battle-sequences/entities/battle-sequence-step.entity';
import { BattleMapper } from '@modules/battles/battles.mapper';
import { RewardsHelper } from '../../helpers/rewards.helper';

export class BattleSequenceStepMapper {
  public static async toDto(
    entity: BattleSequenceStepEntity,
  ): Promise<BattleSequenceStepDto> {
    const dto = new BattleSequenceStepDto();
    dto.id = entity.id;
    dto.step = entity.step;
    dto.battle = await BattleMapper.toDtoBasic(await entity.battle);
    dto.voteFor = (await entity.voteFor).id;
    dto.voteRate = entity.voteRate;
    dto.xpWatchingBonus = entity.xpWatchingBonus;
    return dto;
  }

  public static async toDtoWithRewards(
    entity: BattleSequenceStepEntity,
    rewards: string[],
  ): Promise<BattleSequenceStepDto> {
    const dto = new BattleSequenceStepDto();
    dto.id = entity.id;
    dto.step = entity.step;
    dto.battle = await BattleMapper.toDtoBasic(await entity.battle);
    dto.voteFor = (await entity.voteFor).id;
    dto.voteRate = entity.voteRate;
    dto.xpWatchingBonus = entity.xpWatchingBonus;
    dto.xpReward = RewardsHelper.getXpRewards(entity.voteRate >= 0.5, rewards);
    return dto;
  }
}
