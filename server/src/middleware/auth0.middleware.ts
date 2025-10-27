import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: any;
  };
}

@Injectable()
export class Auth0Middleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

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
      req.user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        ...payload,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
