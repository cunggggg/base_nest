import { BattleDto } from '@modules/battles/dto/battle.dto';
import { BattleGeneratorType } from '@common/enums/battle-generator-type.enum';
import { BattleRandomGenerator } from './battle-generator/battle-generator.random';
import { BattleEloGenerator } from './battle-generator/battle-generator.elo';
import { BattleRandomWithoutUniqueContestantGenerator } from './battle-generator/battle-generator.random2';

export class BattleHelper {
  /**
   * generate battles
   */
  public static generateBattles(
    generatorType: BattleGeneratorType,
    allBattles: BattleDto[],
    usedBattles: BattleDto[],
    total = 5,
  ): BattleDto[] {
    let generator;
    if (generatorType === BattleGeneratorType.RANDOM) {
      generator = new BattleRandomGenerator(allBattles, usedBattles, total);
    } else if (
      generatorType === BattleGeneratorType.RANDOM_WITHOUT_UNIQUE_CONTESTANT
    ) {
      generator = new BattleRandomWithoutUniqueContestantGenerator(
        allBattles,
        usedBattles,
        total,
      );
    } else {
      generator = new BattleEloGenerator(allBattles, usedBattles, total);
    }

    return generator.generate();
  }
}
