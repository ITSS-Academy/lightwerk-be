import { Test, TestingModule } from '@nestjs/testing';
import { LikeVideoController } from './like-video.controller';
import { LikeVideoService } from './like-video.service';

describe('LikeVideoController', () => {
  let controller: LikeVideoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikeVideoController],
      providers: [LikeVideoService],
    }).compile();

    controller = module.get<LikeVideoController>(LikeVideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
