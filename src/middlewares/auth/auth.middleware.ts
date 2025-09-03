import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { supabase } from '../../utils/supabase';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    try {
      const token = req.headers['authorization'];
      console.log(token);
      
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        throw new BadRequestException('Authentication failed');
      }

      req.user = user;

      next();
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
