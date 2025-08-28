import { Test, TestingModule } from '@nestjs/testing';
import { HistoryVideosController } from './history_videos.controller';
import { HistoryVideosService } from './history_videos.service';

describe('HistoryVideosController', () => {
  let controller: HistoryVideosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryVideosController],
      providers: [HistoryVideosService],
    }).compile();

    controller = module.get<HistoryVideosController>(HistoryVideosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
