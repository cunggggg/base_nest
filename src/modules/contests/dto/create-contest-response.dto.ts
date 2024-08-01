import { ApiProperty } from '@nestjs/swagger';

export class CreatedContestResponseDto {
  @ApiProperty()
  id: number;
}
