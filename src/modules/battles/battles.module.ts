import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattlesController } from './battles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlesRepository } from '@modules/battles/battles.repository';
import { ConfigModule } from '@nestjs/config';
import { VotesModule } from '@modules/votes/votes.module';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { VotesRepository } from '@modules/votes/votes.repository';

@Module({
  imports: [
    ConfigModule,
    FireBaseModule,
    VotesModule,
    TypeOrmModule.forFeature([BattlesRepository, VotesRepository]),
  ],
  controllers: [BattlesController],
  providers: [BattlesService],
  exports: [BattlesService],
})
export class BattlesModule {}
