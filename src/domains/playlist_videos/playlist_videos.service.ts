import { Injectable } from '@nestjs/common';
import { CreatePlaylistVideoDto } from './dto/create-playlist_video.dto';
import { UpdatePlaylistVideoDto } from './dto/update-playlist_video.dto';

@Injectable()
export class PlaylistVideosService {
  create(createPlaylistVideoDto: CreatePlaylistVideoDto) {
    return 'This action adds a new playlistVideo';
  }

  findAll() {
    return `This action returns all playlistVideos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} playlistVideo`;
  }

  update(id: number, updatePlaylistVideoDto: UpdatePlaylistVideoDto) {
    return `This action updates a #${id} playlistVideo`;
  }

  remove(id: number) {
    return `This action removes a #${id} playlistVideo`;
  }
}
