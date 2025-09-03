import { Module } from '@nestjs/common';
import { HistoryVideosService } from './history_videos.service';
import { HistoryVideosController } from './history_videos.controller';

@Module({
  controllers: [HistoryVideosController],
  providers: [HistoryVideosService],
})
export class HistoryVideosModule {}
