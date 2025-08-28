import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlaylistVideosService } from './playlist_videos.service';
import { CreatePlaylistVideoDto } from './dto/create-playlist_video.dto';
import { UpdatePlaylistVideoDto } from './dto/update-playlist_video.dto';

@Controller('playlist-videos')
export class PlaylistVideosController {
  constructor(private readonly playlistVideosService: PlaylistVideosService) {}

  @Post()
  create(@Body() createPlaylistVideoDto: CreatePlaylistVideoDto) {
    return this.playlistVideosService.create(createPlaylistVideoDto);
  }

  @Get()
  findAll() {
    return this.playlistVideosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playlistVideosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaylistVideoDto: UpdatePlaylistVideoDto) {
    return this.playlistVideosService.update(+id, updatePlaylistVideoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playlistVideosService.remove(+id);
  }
}
