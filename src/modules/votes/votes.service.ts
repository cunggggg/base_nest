import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { DBErrorCode } from '@common/enums';
import { ForeignKeyConflictException } from '@common/exeptions';
import { TimeoutError } from 'rxjs';
import { AddVoteDto } from '@modules/votes/dto/add-vote.dto';
import { VoteMapper } from '@modules/votes/votes.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { VotesRepository } from '@modules/votes/votes.repository';
import { UserVotedException } from '@common/exeptions/user-voted.exception';

@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);

  constructor(
    @InjectRepository(VotesRepository)
    private votesRepository: VotesRepository,
  ) {}

  async vote(voteDto: AddVoteDto) {
    try {
      const voteEntity = await this.votesRepository.getByUserAndBattle(
        voteDto.userId,
        voteDto.battleId,
      );

      if (voteEntity) {
        throw new UserVotedException();
      }

      let entity = VoteMapper.toCreateEntity(voteDto);
      entity = await this.votesRepository.save(entity);

      return VoteMapper.toDto(entity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }

      if (error instanceof UserVotedException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
