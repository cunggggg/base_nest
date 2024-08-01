import { XpLevelsModule } from '@modules/xp-levels/xp-levels.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { defaultConnection } from '@config';
import { AdminModule } from '@admin/admin.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ContestsModule } from '@modules/contests/contests.module';
import { ContentsModule } from '@modules/contents/contents.module';
import { IntegrationModule } from '@modules/integration/integration.module';
import { BattlesModule } from '@modules/battles/battles.module';
import { FirebaseAdminModule } from '@tfarras/nestjs-firebase-admin';
import { VotesModule } from '@modules/votes/votes.module';
import { CronJobModule } from '@modules/cronjobs/cronjob.module';
import { MuxModule } from 'nestjs-mux';
import { ScheduleModule } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { AppStartupService } from './app.startup';
import { BattleSequencesModule } from '@modules/battle-sequences/battle-sequences.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { UsersModule } from '@admin/access/users/users.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: defaultConnection,
      inject: [ConfigService],
    }),
    FirebaseAdminModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        credential: admin.credential.cert(
          configService.get('FIREBASE_ADMIN_CONFIG'),
        ),
        databaseURL: configService.get('FIREBASE_DATABASE_URL'),
        storageBucket: configService.get('FIREBASE_STORAGE_BUCKET'),
      }),
      inject: [ConfigService],
    }),
    MuxModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        id: configService.get('MUX_ID_TOKEN'),
        secret: configService.get('MUX_SECRET_TOKEN'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AdminModule,
    UsersModule,
    AuthModule,
    ContestsModule,
    ContentsModule,
    IntegrationModule,
    BattlesModule,
    VotesModule,
    CronJobModule,
    BattleSequencesModule,
    SettingsModule,
    XpLevelsModule,
  ],
  providers: [AppStartupService],
})
export class AppModule {}
