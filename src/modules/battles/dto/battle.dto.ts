import { ApiProperty } from '@nestjs/swagger';
import { ContentResponseDto } from '@modules/contents/dto/content-response.dto';
import { ContestResponseDto } from '@modules/contests/dto/contest-response.dto';

export class BattleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  contest?: ContestResponseDto;

  @ApiProperty()
  contentA: ContentResponseDto;

  @ApiProperty()
  contentB: ContentResponseDto;
}
