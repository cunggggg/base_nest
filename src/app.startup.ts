import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ContestsService } from '@modules/contests/contests.service';
import { SettingsService } from '@modules/settings/settings.service';
import { CronJobType, SettingType } from '@modules/settings/type.enum';
import { CronjobHelper } from './helpers/cronjob.helper';
import { UsersService } from '@admin/access/users/users.service';

@Injectable()
export class AppStartupService implements OnModuleInit {
  private readonly logger = new Logger(AppStartupService.name);
  constructor(
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private contestsService: ContestsService,
    private usersService: UsersService,
    private settingsService: SettingsService,
  ) {}

  onModuleInit() {
    console.log(`The module has been initialised.`);
    const cron = CronjobHelper.getEnergyRechargeCronExpression(
      this.configService,
    );
    this.addEnergyRechargeJob(cron);

    this.settingsService
      .getSettingValue(SettingType.CRONJOB, CronJobType.VOTE_RESET)
      .then((cronTime) => {
        this.addContestVoteResetJob(cronTime);
      })
      .catch((ex) => {
        this.logger.error(ex.stack.toString());
      });
  }

  addContestVoteResetJob(cronTime) {
    const name = 'contestVoteResetJob';
    const job = new CronJob(cronTime, () => {
      this.logger.warn(`>>>>>>>>>>>>>>>>>>Job ${name} starting...`);
      this.contestsService.makeTopWinners().then((contestsDict) => {
        this.contestsService
          .pushNotificationsContestEnd(contestsDict)
          .then(() => {
            this.logger.warn(`>>>>>>>>>>>>>>>>>>Job ${name} finish.`);
          });
      });
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.warn(`job ${name} added with cronTime [${cronTime}]!`);
  }

  addEnergyRechargeJob(cronTime) {
    const name = 'energyRechargeJob';
    const job = new CronJob(cronTime, () => {
      this.logger.warn(`>>>>>>>>>>>>>>>>>>Job ${name} starting...`);
      this.usersService.rechargeAll().then(() => {
        this.logger.warn(`>>>>>>>>>>>>>>>>>>Job ${name} finish.`);
      });
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.warn(`job ${name} added with cronTime [${cronTime}]!`);
  }
}
