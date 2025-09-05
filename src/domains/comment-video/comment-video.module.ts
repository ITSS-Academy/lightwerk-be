import { Module } from '@nestjs/common';
import { CommentVideoService } from './comment-video.service';
import { CommentVideoController } from './comment-video.controller';

@Module({
  controllers: [CommentVideoController],
  providers: [CommentVideoService],
})
export class CommentVideoModule {}
