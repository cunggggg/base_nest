import { ApiProperty } from '@nestjs/swagger';
import { ContentResponseDto } from '@modules/contents/dto/content-response.dto';

export class ContestBattleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  contentA: ContentResponseDto;

  @ApiProperty()
  contentB: ContentResponseDto;

  @ApiProperty()
  winner: number;

  @ApiProperty()
  votes: number;
}
