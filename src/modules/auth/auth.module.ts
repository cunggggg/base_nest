import { UsersRepository } from '../admin/access/users/users.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './services/token.service';
import { AuthService } from './services/auth.service';
import { UsersService } from '@admin/access/users/users.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UserXpLevelsRepository } from '@admin/access/users/user-xp-levels.repository';
import { SettingsRepository } from '@modules/settings/settings.repository';
import { XpLevelsRepository } from '@modules/xp-levels/xp-levels.repository';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UsersRepository,
      UserXpLevelsRepository,
      XpLevelsRepository,
      SettingsRepository,
    ]),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('TOKEN_SECRET'),
        signOptions: {
          expiresIn: config.get('ACCESS_TOKEN_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService, UsersService],
  exports: [JwtStrategy, PassportModule, TokenService, AuthService],
})
export class AuthModule {}
