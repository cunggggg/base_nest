import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { CreateBattleDto } from './dto/create-battle.dto';
import { PaginationParams } from '@common/decorators';
import { PaginationRequest } from '@common/interfaces';
import { VotesService } from '@modules/votes/votes.service';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { UserEntity } from '@admin/access/users/user.entity';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { MuxHelper } from '@helpers';

@ApiTags('Battles')
@Controller('battles')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BattlesController {
  constructor(
    private readonly battlesService: BattlesService,
    private readonly votesService: VotesService,
    private readonly fireBaseService: FireBaseService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  create(@Body() createBattleDto: CreateBattleDto) {
    return this.battlesService.create(createBattleDto);
  }

  @Get()
  async discovery(
    @CurrentUser() user: UserEntity,
    @PaginationParams() pagination: PaginationRequest,
  ) {
    const result = await this.battlesService.explore(pagination, user.id);
    result.content.forEach((e) => {
      MuxHelper.appendSignedToken(e.contentA, this.configService);
      MuxHelper.appendSignedToken(e.contentB, this.configService);
    });
    return result;
  }

  @Post(':battleId/votes/:contentId')
  async voteVideo(
    @CurrentUser() user: UserEntity,
    @Param('battleId') battleId: string,
    @Param('contentId') contentId: string,
  ) {
    const battle = await this.battlesService.verifyBeforeVote(
      +battleId,
      +contentId,
    );

    await this.votesService.vote({
      userId: user.id,
      battleId: +battleId,
      contentId: +contentId,
    });

    this.fireBaseService.createVote(
      user.id,
      battle.contest.id,
      +battleId,
      +contentId,
      this.configService.get('FIREBASE_DATABASE_VOTE_ROOT'),
    );
  }
}
