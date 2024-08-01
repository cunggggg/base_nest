import { ContentEntity } from '@modules/contents/entities/content.entity';
import { UserEntity } from '@admin/access/users/user.entity';
import { UserVotesEntity } from '@modules/votes/entities/vote.entity';
import { VoteResponseDto } from '@modules/votes/dto/vote-response.dto';
import { AddVoteDto } from '@modules/votes/dto/add-vote.dto';
import { BattleEntity } from '@modules/battles/entities/battle.entity';

export class VoteMapper {
  public static async toDto(entity: UserVotesEntity): Promise<VoteResponseDto> {
    const dto = new VoteResponseDto();

    dto.battleId = entity.id;
    return dto;
  }

  public static toCreateEntity(dto: AddVoteDto): UserVotesEntity {
    const entity = new UserVotesEntity();
    entity.content = Promise.resolve(new ContentEntity({ id: dto.contentId }));
    entity.battle = Promise.resolve(new BattleEntity({ id: dto.battleId }));
    entity.user = Promise.resolve(new UserEntity({ id: dto.userId }));
    return entity;
  }
}
