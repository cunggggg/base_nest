import { ValidationPipe, Controller, Post, Body, Query } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthCredentialsRequestDto, LoginResponseDto } from './dtos';
import { TokenService, AuthService } from './services';
import { JwtTokenRequestDto } from '@modules/auth/dtos/jwt-token-request.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  @ApiOperation({ description: 'Create JWT token ' })
  @ApiOkResponse({ description: 'token successfully created!' })
  @ApiBadRequestResponse({ description: 'token invalid or provider invalid' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  @Post('/token')
  async getJwtToken(
    @Body(ValidationPipe) jwtTokenRequestDto: JwtTokenRequestDto,
  ): Promise<any> {
    const { token, provider } = jwtTokenRequestDto;
    return this.tokenService.generateJwtToken({ token, provider });
  }

  @ApiOperation({ description: 'User authentication' })
  @ApiOkResponse({ description: 'Successfully authenticated user' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  @Post('/login')
  login(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsRequestDto,
  ): Promise<LoginResponseDto> {
    return this.authService.login(authCredentialsDto);
  }

  // @ApiOperation({ description: 'Renew access in the application' })
  // @ApiOkResponse({ description: 'token successfully renewed' })
  // @ApiUnauthorizedResponse({ description: 'Refresh token invalid or expired' })
  // @ApiInternalServerErrorResponse({ description: 'Server error' })
  // @Post('/token/refresh')
  // async getNewToken(
  //   @Body(ValidationPipe) refreshTokenDto: RefreshTokenRequestDto,
  // ): Promise<TokenDto> {
  //   const { refreshToken } = refreshTokenDto;
  //   return this.tokenService.generateRefreshToken(refreshToken);
  // }
  //
  // @ApiOperation({ description: 'Validate token' })
  // @ApiOkResponse({ description: 'Validation was successful' })
  // @ApiInternalServerErrorResponse({ description: 'Server error' })
  // @Post('/token/validate')
  // async validateToken(
  //   @Body(ValidationPipe) validateToken: ValidateTokenRequestDto,
  // ): Promise<ValidateTokenResponseDto> {
  //   const { token } = validateToken;
  //   return this.tokenService.validateToken(token);
  // }
}
