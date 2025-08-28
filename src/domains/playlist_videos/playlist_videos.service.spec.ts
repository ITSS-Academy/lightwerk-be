import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistVideosService } from './playlist_videos.service';

describe('PlaylistVideosService', () => {
  let service: PlaylistVideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaylistVideosService],
    }).compile();

    service = module.get<PlaylistVideosService>(PlaylistVideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
