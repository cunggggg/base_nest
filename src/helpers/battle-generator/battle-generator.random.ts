import { BattleDto } from '@modules/battles/dto/battle.dto';
import { BattleGenerator } from './index';
import { BattleGenerationException } from '@common/exeptions/battle-generation.exception';

export class BattleRandomGenerator extends BattleGenerator {
  constructor(
    readonly allBattles: BattleDto[],
    readonly usedBattles: BattleDto[],
    readonly total: number,
  ) {
    super(allBattles, usedBattles, total);
  }
  /**
   * generate battles
   */
  public generate(): BattleDto[] {
    let battles = [];
    const collectedBattles = {};
    for (let i = 0; i < this.total; i += 1) {
      const battle = this.generateSingle(collectedBattles);
      if (!battle) {
        console.log('>>>>>>>>>>>>>>can not generate battle');
        battles = [];
        break;
        // throw new BattleGenerationException();
      }
      battles.push(battle);
    }
    return battles;
  }

  private generateSingle(collectedBattles: any): BattleDto {
    const contentAId = this.getFirstBestContent(collectedBattles);
    if (!contentAId) {
      return null;
    }

    collectedBattles[contentAId] = true;
    const contentBId = this.getSecondBestContent(contentAId, collectedBattles);
    if (!contentBId) {
      collectedBattles[contentAId] = false;
      return null;
    }

    collectedBattles[contentBId] = true;
    return this.battleDict[this.buildKey(contentAId, contentBId)];
  }

  private getFirstBestContent(collectedBattles: any) {
    const sortedKeys = Object.keys(this.contentDict)
      .filter((k) => !collectedBattles[k])
      .sort((c1, c2) => {
        const totalC1 = this.contentDict[c1].filter(
          (k) => !collectedBattles[k],
        ).length;
        const totalC2 = this.contentDict[c2].filter(
          (k) => !collectedBattles[k],
        ).length;
        if (totalC1 === 1) {
          return -1;
        }
        if (totalC2 === 1) {
          return 1;
        }
        return totalC2 - totalC1;
      });

    if (
      sortedKeys.length === 0 ||
      this.contentDict[sortedKeys[0]].length === 0
    ) {
      return null;
    }

    return this.getRandomContent(sortedKeys, collectedBattles);
  }

  private getSecondBestContent(firstContent, collectedBattles: any) {
    const contents = this.contentDict[firstContent];
    const sortedContents = contents
      .filter((k) => !collectedBattles[k])
      .sort((c1, c2) => {
        const totalC1 = this.contentDict[c1].filter(
          (k) => !collectedBattles[k],
        ).length;
        const totalC2 = this.contentDict[c2].filter(
          (k) => !collectedBattles[k],
        ).length;
        if (totalC1 === 1) {
          return -1;
        }
        if (totalC2 === 1) {
          return 1;
        }
        return totalC2 - totalC1;
      });

    if (
      sortedContents.length === 0 ||
      this.contentDict[sortedContents[0]].length === 0
    ) {
      return null;
    }

    return this.getRandomContent(sortedContents, collectedBattles);
  }

  private getRandomContent(sortedContents, collectedBattles) {
    const sameMaxLength = [sortedContents[0]];

    for (let i = 1; i < sortedContents.length; i++) {
      if (
        this.contentDict[sortedContents[i]].filter((k) => !collectedBattles[k])
          .length ===
        this.contentDict[sortedContents[0]].filter((k) => !collectedBattles[k])
          .length
      ) {
        sameMaxLength.push(sortedContents[i]);
      }
    }

    // get index random in same length list
    const index = Math.floor(Math.random() * sameMaxLength.length);
    return sortedContents[index];
  }
}