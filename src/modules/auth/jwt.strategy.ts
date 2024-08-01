import { UsersRepository } from '@modules/admin/access/users/users.repository';
import { UserStatus } from '@admin/access/users/user-status.enum';
import { UserEntity } from '@admin/access/users/user.entity';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtTokenPayload } from './dtos';
import { InstagramHelper } from '@helpers';

import {
  DisabledUserException,
  InvalidCredentialsException,
  AccessTokenExpiredException,
} from '@common/exeptions';
import { ErrorType } from '@common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UsersRepository)
    private userRepository: UsersRepository,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('TOKEN_SECRET'),
    });
  }

  async validate({
    id,
    token,
    provider,
  }: JwtTokenPayload): Promise<UserEntity> {
    if ('instagram' === provider) {
      const { success } = await InstagramHelper.verifyToken(token);
      if (!success) {
        throw new AccessTokenExpiredException();
      }
    }
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    if (user.status == UserStatus.Inactive) {
      throw new DisabledUserException(ErrorType.InactiveUser);
    }
    if (user.status == UserStatus.Blocked) {
      throw new DisabledUserException(ErrorType.BlockedUser);
    }
    return user;
  }
}
