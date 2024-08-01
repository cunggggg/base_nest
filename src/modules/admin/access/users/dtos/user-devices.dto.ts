import { ApiProperty } from '@nestjs/swagger';

export class UserDevicesDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  devices: string[];
}
