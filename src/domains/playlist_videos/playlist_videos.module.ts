import { Module } from '@nestjs/common';
import { PlaylistVideosService } from './playlist_videos.service';
import { PlaylistVideosController } from './playlist_videos.controller';

@Module({
  controllers: [PlaylistVideosController],
  providers: [PlaylistVideosService],
})
export class PlaylistVideosModule {}
