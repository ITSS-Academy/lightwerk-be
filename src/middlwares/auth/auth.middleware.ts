import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { supabase } from '../../utils/supabase';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const jwt = req.headers.authorization;
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(jwt);

    if (!user || error) {
      throw new UnauthorizedException('Unauthorized');
    }

    next();
  }
}
