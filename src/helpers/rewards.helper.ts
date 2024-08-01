import { inflate } from 'zlib';

export class RewardsHelper {
  /**
   * get Xp Reward
   */
  public static getXpRewards(
    isWin: boolean,
    xpRewardsSetting: string[],
  ): number {
    const index = isWin ? 0 : 1;
    if (index < xpRewardsSetting.length) {
      return +xpRewardsSetting[index];
    }
    return 0;
  }

  /**
   * get Xp bonus Reward
   */
  public static getXpBonusRewards(
    isWin: boolean,
    xpRewardsSetting: string[],
  ): number {
    const index = isWin ? 2 : 3;
    if (index < xpRewardsSetting.length) {
      return +xpRewardsSetting[index];
    }
    return 0;
  }

  /**
   * get vote Reward
   */
  public static getWinRewards(rank: number, winRewards: string[]): number {
    if (rank - 1 < winRewards.length) {
      return +winRewards[rank - 1];
    }
    return 0;
  }

  /**
   * get vote Reward
   */
  public static getParticipantPrize(
    isCreator: boolean,
    prizes: string[],
  ): number {
    const index = isCreator ? 0 : 1;
    if (index < prizes.length) {
      return +prizes[index];
    }
    return 0;
  }
}
