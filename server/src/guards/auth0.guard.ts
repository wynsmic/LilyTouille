import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedRequest {
  user?: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: any;
  };
}

@Injectable()
export class Auth0Guard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // In development mode without Auth0 configured, allow access with mock user
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    const hasAuth0Config =
      this.configService.get('AUTH0_DOMAIN') &&
      this.configService.get('AUTH0_AUDIENCE');

    if (isDevelopment && !hasAuth0Config) {
      // Mock user for development
      request.user = {
        sub: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        picture: 'https://via.placeholder.com/150',
      };
      return true;
    }

    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        audience: this.configService.get('AUTH0_AUDIENCE'),
        issuer: `https://${this.configService.get('AUTH0_DOMAIN')}/`,
        algorithms: ['RS256'],
      });

      // Attach user info to request
      request.user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        ...payload,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
