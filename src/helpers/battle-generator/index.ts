import { BattleDto } from '@modules/battles/dto/battle.dto';

export abstract class BattleGenerator {
  readonly battleDict: any;
  readonly contentDict: any;

  constructor(
    readonly allBattles: BattleDto[],
    readonly usedBattles: BattleDto[],
    readonly total: number,
  ) {
    this.battleDict = this.buildDict(allBattles);

    this.contentDict = {};
    allBattles.forEach((b) => {
      if (!this.contentDict[b.contentA.id]) {
        this.contentDict[b.contentA.id] = [];
      }
      if (!this.contentDict[b.contentB.id]) {
        this.contentDict[b.contentB.id] = [];
      }

      this.contentDict[b.contentA.id].push(b.contentB.id);
      this.contentDict[b.contentB.id].push(b.contentA.id);
    });

    usedBattles.forEach((b) => {
      let index = this.contentDict[b.contentA.id].indexOf(b.contentB.id);
      if (index > -1) {
        this.contentDict[b.contentA.id].splice(index, 1);
      }

      index = this.contentDict[b.contentB.id].indexOf(b.contentA.id);
      if (index > -1) {
        this.contentDict[b.contentB.id].splice(index, 1);
      }
    });
  }

  private buildDict(battles: BattleDto[]): any {
    const dict = {};
    battles.forEach((b) => {
      dict[this.buildKey(b.contentA.id, b.contentB.id)] = b;
    });

    return dict;
  }

  protected buildKey(contentIdA: number, contentIdB: number): string {
    return contentIdA < contentIdB
      ? `${contentIdA}_${contentIdB}`
      : `${contentIdB}_${contentIdA}`;
  }

  /**
   * generate battles
   */
  public abstract generate(): BattleDto[];
}
