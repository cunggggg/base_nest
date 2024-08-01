import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BattleSequencesService } from './battle-sequences.service';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { UserEntity } from '@admin/access/users/user.entity';
import { ConfigService } from '@nestjs/config';
import { ContestsService } from '@modules/contests/contests.service';
import { BattleSequenceStatus } from '@common/enums/battle-sequence-status.enum';
import { BattleHelper } from '../../helpers/battle.helper';
import { BattleGeneratorType } from '@common/enums/battle-generator-type.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MuxHelper } from '@helpers';
import { VoteBattleSequenceDto } from '@modules/battle-sequences/dto/vote-battle-sequence.dto';
import { BattlesService } from '@modules/battles/battles.service';
import { VotesService } from '@modules/votes/votes.service';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { UsersService } from '@admin/access/users/users.service';
import { BattleSequenceDto } from '@modules/battle-sequences/dto/battle-sequence.dto';

@ApiTags('Battle Sequences')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('battle-sequences')
export class BattleSequencesController {
  private readonly logger = new Logger(BattleSequencesController.name);

  constructor(
    private readonly battleSequencesService: BattleSequencesService,
    private readonly usersService: UsersService,
    private readonly contestsService: ContestsService,
    private readonly votesService: VotesService,
    private readonly battlesService: BattlesService,
    private readonly fireBaseService: FireBaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/generate')
  async getForVoting(
    @Query('contestId') contestId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.contestsService.verifyContestInVoting(+contestId);

    const battleSequences = await this.battleSequencesService.getInVotingFlow(
      user.id,
      +contestId,
    );

    let battleSequence = battleSequences.find(
      (b) => b.status === BattleSequenceStatus.IN_PROGRESS,
    );

    const totalSteps = +this.configService.get('BATTLE_SEQUENCE_STEP');

    if (battleSequence) {
      battleSequence.totalSteps = totalSteps;
      return this.appendSignedToken(battleSequence);
    }

    // Generate new battle sequence
    const allBattles = await this.contestsService.getBattlesByContestId(
      +contestId,
    );

    const usedBattles = [];
    battleSequences.forEach((bs) => {
      bs.battles.forEach((b) => {
        usedBattles.push(b.battle);
      });
    });

    const battles = BattleHelper.generateBattles(
      BattleGeneratorType.RANDOM_WITHOUT_UNIQUE_CONTESTANT,
      allBattles,
      usedBattles,
      totalSteps,
    );

    if (!battles || battles.length === 0) {
      return {
        battles: [],
      };
    }

    battleSequence = await this.battleSequencesService.generateNew(
      user.id,
      +contestId,
      battles,
    );
    battleSequence.totalSteps = totalSteps;

    return this.appendSignedToken(battleSequence);
  }

  @Post('/vote')
  async voteVideo(
    @CurrentUser() user: UserEntity,
    @Body() dto: VoteBattleSequenceDto,
  ) {
    this.logger.log(
      `>>>>>>>>sequence=${dto.battleSequenceId}, contentId=${dto.contentId}`,
    );

    const { isEndFlow, contestId, battleSequenceStep } =
      await this.battleSequencesService.vote(
        dto,
        user.id,
        +this.configService.get('BATTLE_SEQUENCE_STEP'),
      );

    // sync battle sequence vote
    if (isEndFlow) {
      let totalXps = 0;
      const battleSteps = await this.battleSequencesService.getBattleSteps(
        dto.battleSequenceId,
        user.id,
      );
      for (let i = 0; i < battleSteps.length; i += 1) {
        totalXps += battleSteps[i].xpReward + battleSteps[i].xpWatchingBonus;
        await this.votesService.vote({
          userId: user.id,
          battleId: battleSteps[i].battle.id,
          contentId: battleSteps[i].voteFor,
        });

        this.fireBaseService.createVote(
          user.id,
          contestId,
          battleSteps[i].battle.id,
          battleSteps[i].voteFor,
          this.configService.get('FIREBASE_DATABASE_VOTE_ROOT'),
        );
      }

      await this.usersService.addUserXp(user.id, totalXps, 0, 0);
    }

    return battleSequenceStep;
  }

  @Get('/:id/result')
  async getBattleSequenceResult(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
  ) {
    return await this.battleSequencesService.getResult(+id, user.id);
  }

  private appendSignedToken(battleSequence: BattleSequenceDto) {
    battleSequence.battles.sort((b1, b2) => {
      return b1.step - b2.step;
    });
    battleSequence.battles.forEach((e) => {
      MuxHelper.appendSignedToken(e.battle.contentA, this.configService);
      MuxHelper.appendSignedToken(e.battle.contentB, this.configService);
    });
    return battleSequence;
  }
}
