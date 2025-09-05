import { Module } from '@nestjs/common';
import { LikeVideoService } from './like-video.service';
import { LikeVideoController } from './like-video.controller';

@Module({
  controllers: [LikeVideoController],
  providers: [LikeVideoService],
})
export class LikeVideoModule {

}
