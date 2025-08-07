import { BadRequestException, Injectable } from '@nestjs/common';
import { AddToPlaylistDto, CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { supabase } from '../../utils/supabase';

@Injectable()
export class PlaylistService {
  create(createPlaylistDto: CreatePlaylistDto) {
    return 'This action adds a new playlist';
  }

  findAll() {
    return `This action returns all playlist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} playlist`;
  }

  update(id: number, updatePlaylistDto: UpdatePlaylistDto) {
    return `This action updates a #${id} playlist`;
  }

  remove(id: number) {
    return `This action removes a #${id} playlist`;
  }

  async addToPlaylist(addToPlaylistDto: AddToPlaylistDto) {
    //check if video added to playlist
    const { data: existingData, error: existingError } = await supabase
      .from('video_playlists')
      .select('*')
      .eq('videoId', addToPlaylistDto.videoId)
      .eq('playlistId', addToPlaylistDto.playlistId)
      .single();
    if (existingError) {
      throw new BadRequestException(existingError);
    }

    if (existingData) {
      throw new BadRequestException('Video already added to this playlist');
    }

    const { data, error } = await supabase
      .from('video_playlists')
      .upsert(addToPlaylistDto);
    if (error) throw new BadRequestException(error);
    return data;
  }
}
