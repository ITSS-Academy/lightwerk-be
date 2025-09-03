import { Test, TestingModule } from '@nestjs/testing';
import { HistoryVideosService } from './history_videos.service';

describe('HistoryVideosService', () => {
  let service: HistoryVideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryVideosService],
    }).compile();

    service = module.get<HistoryVideosService>(HistoryVideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
