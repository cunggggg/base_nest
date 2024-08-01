export interface JwtTokenPayload {
  id?: string;
  username?: string;
  token: string;
  provider: string;
}
