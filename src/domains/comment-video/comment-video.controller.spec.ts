import { Test, TestingModule } from '@nestjs/testing';
import { CommentVideoController } from './comment-video.controller';
import { CommentVideoService } from './comment-video.service';

describe('CommentVideoController', () => {
  let controller: CommentVideoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentVideoController],
      providers: [CommentVideoService],
    }).compile();

    controller = module.get<CommentVideoController>(CommentVideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
