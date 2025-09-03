import { Test, TestingModule } from '@nestjs/testing';
import { LikeVideoService } from './like-video.service';

describe('LikeVideoService', () => {
  let service: LikeVideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LikeVideoService],
    }).compile();

    service = module.get<LikeVideoService>(LikeVideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
