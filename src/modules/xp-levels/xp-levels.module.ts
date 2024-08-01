import { XpLevelsController } from './xp-levels.controller';
import { XpLevelsService } from './xp-levels.service';
import { XpLevelsRepository } from './xp-levels.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      XpLevelsRepository,
    ]),
  ],
  controllers: [XpLevelsController],
  providers: [XpLevelsService],
  exports: [XpLevelsService],
})
export class XpLevelsModule {}
