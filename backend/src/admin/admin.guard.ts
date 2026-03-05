import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth: string = req.headers.authorization ?? '';

    if (!auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token.');
    }

    const token = auth.slice(7);
    try {
      const payload = this.jwt.verify(token);
      if (payload.role !== 'ADMIN') {
        throw new ForbiddenException('Admin access only.');
      }
      req.user = payload;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
