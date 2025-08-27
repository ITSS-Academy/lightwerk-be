import { SetMetadata } from '@nestjs/common';

export const OWNER_CHECK_KEY = 'owner_check';

export interface OwnerCheckOptions {
  entity: 'video' | 'playlist' | 'profile';
  param: string;
}

export const OwnerCheck = (options: OwnerCheckOptions) =>
  SetMetadata(OWNER_CHECK_KEY, options);
