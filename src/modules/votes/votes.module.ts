import { forwardRef, Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesRepository } from '@modules/votes/votes.repository';
import { FireBaseModule } from '@modules/integration/fire-base/fire-base.module';
import { ContestsModule } from '@modules/contests/contests.module';

@Module({
  imports: [
    ConfigModule,
    FireBaseModule,
    forwardRef(() => ContestsModule),
    TypeOrmModule.forFeature([VotesRepository]),
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
