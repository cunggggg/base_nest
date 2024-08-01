
import { BattleDto } from '@modules/battles/dto/battle.dto';
import { BattleGenerator } from './index';
import { BattleGenerationException } from '@common/exeptions/battle-generation.exception';

export class BattleRandomWithoutUniqueContestantGenerator extends BattleGenerator {
  private usedBattleDict = {};
  constructor(
    readonly allBattles: BattleDto[],
    readonly usedBattles: BattleDto[],
    readonly total: number,
  ) {
    super(allBattles, usedBattles, total);
    usedBattles.forEach((b) => {
      this.usedBattleDict[b.id] = true;
    });
  }
  /**
   * generate battles
   */
  public generate(): BattleDto[] {
    const battles = [];
    for (let i = 0; i < this.total; i += 1) {
      const battle = this.getRandomBattle();
      if (!battle) {
        console.log('>>>>>>>>>>>>>>can not generate battle');
        return [];
      }
      this.usedBattleDict[battle.id] = true;
      battles.push(battle);
    }
    return battles;
  }

  private getRandomBattle() {
    const availableBattles = this.allBattles.filter(
      (b) => !this.usedBattleDict[b.id],
    );

    if (availableBattles.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * availableBattles.length);
    return availableBattles[index];
  }
}