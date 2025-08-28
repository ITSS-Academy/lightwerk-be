import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistVideosController } from './playlist_videos.controller';
import { PlaylistVideosService } from './playlist_videos.service';

describe('PlaylistVideosController', () => {
  let controller: PlaylistVideosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistVideosController],
      providers: [PlaylistVideosService],
    }).compile();

    controller = module.get<PlaylistVideosController>(PlaylistVideosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
