import { XpLevelDto } from '@modules/xp-levels/dto/xp-level.dto';
import { XpLevelsRepository } from './xp-levels.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class XpLevelsService {
  private readonly logger = new Logger(XpLevelsService.name);

  constructor(
    @InjectRepository(XpLevelsRepository)
    private xpLevelsRepository: XpLevelsRepository,
  ) {}

  public async explore() {
    const settings = await this.xpLevelsRepository.getExploreXpLevels();

    return settings;
  }

  async update(xpLevels: XpLevelDto[]) {
    const currentSettings = await this.xpLevelsRepository.find();

    const payloadSettings = currentSettings.map((item) => {
      return {
        ...item,
        ...xpLevels.find((i) => i.level === item.level),
      };
    });

    const newSettings = await this.xpLevelsRepository.save(payloadSettings);

    return newSettings;
  }
}
