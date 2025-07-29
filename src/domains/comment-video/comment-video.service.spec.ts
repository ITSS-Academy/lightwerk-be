import { Test, TestingModule } from '@nestjs/testing';
import { CommentVideoService } from './comment-video.service';

describe('CommentVideoService', () => {
  let service: CommentVideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentVideoService],
    }).compile();

    service = module.get<CommentVideoService>(CommentVideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
