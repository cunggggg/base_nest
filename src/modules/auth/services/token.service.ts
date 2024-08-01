import { UsersRepository } from '@modules/admin/access/users/users.repository';
import { Injectable, Logger } from '@nestjs/common';
import { UserStatus } from '@admin/access/users/user-status.enum';
import { UsersService } from '@admin/access/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InstagramHelper } from '@helpers';
import * as uuid from 'uuid';

import {
  RefreshTokenExpiredException,
  AccessTokenExpiredException,
  InvalidTokenException,
  InvalidTokenProviderException,
} from '@common/exeptions';
import { ValidateTokenResponseDto, JwtPayload, TokenDto } from '../dtos';
import { TokenError, TokenType } from '../enums';
import { JwtTokenPayload } from '@modules/auth/dtos/jwt-token-payload.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  /**
   * Generate Auth token(JWT) service for login user
   * @param payload {JwtTokenPayload}
   * @returns TokenDto Returns access and refresh tokens with expiry
   */
  public async generateJwtToken(payload: JwtTokenPayload): Promise<any> {
    const tokenType = this.configService.get('TOKEN_TYPE');
    let providerAccessToken = payload.token;
    let providerId;
    let username;

    // accept instagram & anonymous token only
    if (payload.provider !== 'instagram' && payload.provider !== 'anonymous') {
      throw new InvalidTokenProviderException(false);
    }

    if (payload.provider === 'instagram') {
      const userProvider = await InstagramHelper.verifyToken(payload.token);

      if (!userProvider.success) {
        if (userProvider.error && userProvider.error.code == 190) {
          throw new AccessTokenExpiredException();
        } else {
          throw new InvalidTokenProviderException();
        }
      }

      providerId = userProvider.id;
      username = await this.usersService.generateUniqueUsername(
        userProvider.username,
      );
      const longTokenProvider = await InstagramHelper.getLongToken(
        payload.token,
        this.configService,
      );

      if (!longTokenProvider.success) {
        if (longTokenProvider.error && longTokenProvider.error.code !== 452) {
          throw new InvalidTokenProviderException();
        }
      } else {
        providerAccessToken = longTokenProvider.access_token;
      }
    } else if (payload.provider === 'anonymous') {
      providerId = payload.token;
      username = await this.usersService.generateUsername();
    }

    let user = await this.usersService.getUserByProvider(
      providerId,
      payload.provider,
    );

    if (!user) {
      user = await this.usersService.createUser({
        provider: payload.provider,
        providerId: providerId,
        instagram:
          payload.provider === 'instagram'
            ? `https://www.instagram.com/${username}`
            : '',
        password: uuid.v4(),
        name: 'anonymous',
        username: username,
        roles: [],
        permissions: [],
      });
    }

    const jwtPayload = {
      id: user.id,
      username: user.username,
      provider: user.provider,
      token: providerAccessToken,
    };

    const accessToken = this.generateToken(jwtPayload);

    return {
      tokenType,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  /**
   * Generate Auth token(JWT) service for login user
   * @param payload {JwtPayload}
   * @returns TokenDto Returns access and refresh tokens with expiry
   */
  public generateAuthToken(payload: JwtPayload): TokenDto {
    const accessTokenExpires = this.configService.get(
      'ACCESS_TOKEN_EXPIRES_IN',
    );
    const refreshTokenExpires = this.configService.get(
      'REFRESH_TOKEN_EXPIRES_IN',
    );
    const tokenType = this.configService.get('TOKEN_TYPE');
    const accessToken = this.generateToken(payload, accessTokenExpires);
    const refreshToken = this.generateToken(payload, refreshTokenExpires);

    return {
      tokenType,
      accessToken,
      accessTokenExpires,
      refreshToken,
    };
  }

  /**
   * Generate Refresh token(JWT) service for generating new refresh and access tokens
   * @param token {JwtPayload}
   * @returns  Returns access and refresh tokens with expiry or error
   */
  public generateRefreshToken(token: string): TokenDto {
    const { id, username } = this.verifyToken(token, TokenType.RefreshToken);
    return this.generateAuthToken({ id, username });
  }

  /**
   * Verify JWT service
   * @param token JWT token
   * @param type {TokenType} "refresh" or "access"
   * @returns decrypted payload from JWT
   */
  public verifyToken(token: string, type: TokenType) {
    try {
      return this.jwtService.verify(token);
    } catch ({ name }) {
      if (
        name == TokenError.TokenExpiredError &&
        type == TokenType.AccessToken
      ) {
        throw new AccessTokenExpiredException();
      }
      if (
        name == TokenError.TokenExpiredError &&
        type == TokenType.RefreshToken
      ) {
        throw new RefreshTokenExpiredException();
      }
      throw new InvalidTokenException();
    }
  }

  /**
   * Verify JWT service
   * @param token JWT token
   * @param type {TokenType} "refresh" or "access"
   * @returns decrypted payload from JWT
   */
  public verifyJwtToken(token: string, type: TokenType) {
    try {
      return this.jwtService.verify(token);
    } catch ({ name }) {
      if (
        name == TokenError.TokenExpiredError &&
        type == TokenType.AccessToken
      ) {
        throw new AccessTokenExpiredException();
      }
      if (
        name == TokenError.TokenExpiredError &&
        type == TokenType.RefreshToken
      ) {
        throw new RefreshTokenExpiredException();
      }
      throw new InvalidTokenException();
    }
  }

  /**
   * Validate received JWT
   * @param token {string}
   * @returns valid: boolean
   */
  public async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    try {
      const { id } = this.jwtService.verify(token);
      const user = await this.usersRepository.findOne(id);
      if (
        !user ||
        user.status == UserStatus.Blocked ||
        user.status == UserStatus.Inactive
      ) {
        return { valid: false };
      }

      return { valid: !!id };
    } catch (error) {
      Logger.error('Validation token error', error);
      return { valid: false };
    }
  }

  /**
   * Generate JWT token
   * @private
   * @param payload {JwtPayload}
   * @param expiresIn {string}
   * @returns JWT
   */
  public generateToken(
    payload: JwtPayload | JwtTokenPayload,
    expiresIn: string = null,
  ): string {
    if (expiresIn) {
      return this.jwtService.sign(payload, { expiresIn });
    } else {
      return this.jwtService.sign(payload);
    }
  }
}
