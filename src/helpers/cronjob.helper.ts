import { ConfigService } from '@nestjs/config';
import * as parser from 'cron-parser';

export class CronjobHelper {
  /**
   * Get Energy Recharge Hour
   * @param config
   */
  public static getEnergyRechargeHours(config: ConfigService) {
    let rechargeTimes = config.get('ENERGY_RECHARGE_TIMES');

    if (!rechargeTimes || 24 % +rechargeTimes !== 0) {
      rechargeTimes = 6;
    }

    return 24 / rechargeTimes;
  }

  /**
   * Get Cron Expression
   * @param config
   */
  public static getEnergyRechargeCronExpression(config: ConfigService) {
    const hours = CronjobHelper.getEnergyRechargeHours(config);
    // return `0 */2 * * * *`;
    return `0 0 */${hours} * * *`;
  }

  /**
   * Get Next Time
   * @param config
   */
  public static getEnergyRechargeNextTime(config: ConfigService) {
    const cronExpression =
      CronjobHelper.getEnergyRechargeCronExpression(config);
    const rechargeTimeZone = config.get('ENERGY_RECHARGE_TIMEZONE');
    const interval = parser.parseExpression(cronExpression, {
      tz: rechargeTimeZone,
    });
    try {
      const time = interval.next() as any;
      if (!time) {
        return null;
      }
      const date = time.toDate() as Date;
      return date.getTime();
    } catch (err) {
      console.log('Error: ' + err.message);
      return null;
    }
  }
}
