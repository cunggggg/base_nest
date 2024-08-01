import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ErrorType } from '@common/enums';
import {
  DisabledUserException,
  InvalidCredentialsException,
} from '@common/exeptions';
import { UserStatus } from '@admin/access/users/user-status.enum';
import { UserEntity } from '@admin/access/users/user.entity';
import { AuthCredentialsRequestDto, LoginResponseDto } from '../dtos';
import { UsersRepository } from '@modules/admin/access/users/users.repository';
import { TokenService } from './token.service';
import { HashHelper } from '@helpers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  /**
   * User authentication
   * @param authCredentialsDto {AuthCredentialsRequestDto}
   * @returns {Promise<LoginResponseDto>}
   */
  public async login({
    username,
    password,
  }: AuthCredentialsRequestDto): Promise<any> {
    const tokenType = this.configService.get('TOKEN_TYPE');
    const user: UserEntity = await this.usersRepository.findUserByUsername(
      username,
    );

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatch = await HashHelper.compare(password, user.password);

    if (!passwordMatch) {
      throw new InvalidCredentialsException();
    }
    if (user.status == UserStatus.Blocked) {
      throw new DisabledUserException(ErrorType.BlockedUser);
    }
    if (user.status == UserStatus.Inactive) {
      throw new DisabledUserException(ErrorType.InactiveUser);
    }

    const payload = {
      id: user.id,
      username: user.username,
      provider: 'local',
      token: null,
    };
    const accessToken = this.tokenService.generateToken(payload);

    return {
      tokenType,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
}
