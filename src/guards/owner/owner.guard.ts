import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNER_CHECK_KEY, OwnerCheckOptions } from './owner-check.decorator';
import { supabase } from '../../utils/supabase';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    const options = this.reflector.get<OwnerCheckOptions>(
      OWNER_CHECK_KEY,
      context.getHandler(),
    );
    if (!options) return false;
    console.log(
      `Checking ownership for entity: ${options.entity}, param: ${options.param}`,
    );

    // Support resourceId from params, query, or body
    let resourceId = req.params[options.param];
    if (!resourceId && req.query) resourceId = req.query[options.param];
    if (!resourceId && req.body) resourceId = req.body[options.param];

    if (!resourceId) return false;

    let tableName;
    let ownerField;
    if (options.entity === 'video') {
      tableName = 'video';
      ownerField = 'profileId';
    } else if (options.entity === 'playlist') {
      tableName = 'playlist';
      ownerField = 'profileId';
    } else {
      return false;
    }

    // Use Supabase to fetch the resource
    const { data: resource, error } = await supabase
      .from(tableName)
      .select(`${ownerField}`)
      .eq('id', resourceId)
      .single();
    if (error || !resource) return false;
    return resource[ownerField] === user.id;
  }
}
