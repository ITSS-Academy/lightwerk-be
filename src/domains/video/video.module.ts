import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Profile } from '../profile/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Video, Profile])],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
