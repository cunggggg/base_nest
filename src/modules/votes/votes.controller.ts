import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { UserEntity } from '@admin/access/users/user.entity';
import { DbSyncDto } from '@modules/votes/dto/db-sync.dto';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { ConfigService } from '@nestjs/config';
import { ContestsService } from '@modules/contests/contests.service';

@ApiTags('Admin')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('votes')
export class VotesController {
  constructor(
    private readonly fireBaseService: FireBaseService,
    private readonly configService: ConfigService,
    private readonly contestsService: ContestsService,
  ) {}

  @Post('/sync')
  async syncDBToFirebase(
    @CurrentUser() user: UserEntity,
    @Body() dbSyncDto: DbSyncDto,
  ) {
    if (!user.isSuperUser) {
      throw new ForbiddenException();
    }

    const vote = await this.contestsService.getContestsAndBuildVotesJson(
      dbSyncDto.all,
      dbSyncDto.contests,
    );

    this.fireBaseService.syncVote(
      vote,
      this.configService.get('FIREBASE_DATABASE_VOTE_ROOT'),
    );
  }
}
