import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { supabase } from '../../utils/supabase';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['authorization'];

    console.log('token', token);
    if (token) {
      try {
        const { data: user, error } = await supabase.auth.getUser(token);
        console.log('req.user', req.user);

        if (user && !error) {
          req.user = user.user || user;
          console.log('req.user', req.user);
        }
        if (error) {
          throw new Error('Invalid token');
        }
      } catch (e) {
        console.log('error', e);

        throw new UnauthorizedException('Invalid token');
      }
    }
    return true;
  }
}
