import { BadRequestException, Injectable } from '@nestjs/common';
import { VideoPlaylistDto, CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto, UpdateTitleDto } from './dto/update-playlist.dto';
import { supabase } from '../../utils/supabase';

@Injectable()
export class PlaylistService {
  async create(
    createPlaylistDto: CreatePlaylistDto,
    userId: string,
    thumbnail?: Express.Multer.File,
  ) {
    let thumbnailPath =
      'https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/thumbnails/d5b95e26-f9fd-4448-b25d-c5c77c624b8f/thumbnail.jpg';

    const { data: playlistData, error: playlistError } = await supabase
      .from('playlist')
      .insert({
        title: createPlaylistDto.title,
        profileId: userId,
        isPublic: createPlaylistDto.isPublic,
      })
      .select();

    if (playlistError) {
      console.log(playlistError);
      throw new BadRequestException(playlistError);
    }

    const playlistId = playlistData[0].id;

    if (thumbnail) {
      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(`${playlistId}/${thumbnail.originalname}`, thumbnail.buffer, {
          contentType: thumbnail.mimetype,
        });

      if (error) {
        console.log(error);
        throw new BadRequestException('Failed to upload thumbnail');
      }

      // Update the playlist with the new thumbnail path
      thumbnailPath = data.path;

      const { error: updateError } = await supabase
        .from('playlist')
        .update({ thumbnailPath })
        .eq('id', playlistId);

      if (updateError) {
        console.log(updateError);
        throw new BadRequestException('Failed to update playlist thumbnail');
      }
    }

    return {
      ...playlistData[0],
      thumbnailPath,
    };
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

  async remove(id: string) {
    // Check if playlist exists
    const { data: existingData, error: existingError } = await supabase
      .from('playlist')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError) {
      throw new BadRequestException(existingError);
    }

    if (!existingData) {
      throw new BadRequestException('Playlist not found');
    }

    // Delete playlist
    const { error } = await supabase.from('playlist').delete().eq('id', id);
    if (error) {
      console.log(error);
      throw new BadRequestException('Failed to delete playlist');
    }

    return { message: 'Playlist deleted successfully' };
  }

  async addToPlaylist(addToPlaylistDto: VideoPlaylistDto) {
    //check if video added to playlist
    const { data: existingData, error: existingError } = await supabase
      .from('video_playlists')
      .select('*')
      .eq('videoId', addToPlaylistDto.videoId)
      .eq('playlistId', addToPlaylistDto.playlistId);

    if (existingError) {
      throw new BadRequestException(existingError);
    }

    if (existingData?.length != 0) {
      throw new BadRequestException('Video already added to this playlist');
    }

    const { data, error } = await supabase
      .from('video_playlists')
      .insert(addToPlaylistDto)
      .select();
    if (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async removeFromPlaylist(playlistId: string, videoId: string) {
    // Check if video exists in the playlist
    const { data: existingData, error: existingError } = await supabase
      .from('video_playlists')
      .select('*')
      .eq('videoId', videoId)
      .eq('playlistId', playlistId);
    if (existingError) {
      throw new BadRequestException(existingError);
    }

    if (!existingData || existingData.length === 0) {
      throw new BadRequestException('Video not found in the playlist');
    }

    // Remove video from playlist
    const { error } = await supabase
      .from('video_playlists')
      .delete()
      .eq('videoId', videoId)
      .eq('playlistId', playlistId);
    if (error) {
      console.log(error);
      throw new BadRequestException('Failed to remove video from playlist');
    }

    return { message: 'Video removed from playlist successfully' };
  }

  async updateTitle(params: UpdateTitleDto) {
    const { data, error } = await supabase
      .from('playlist')
      .update({ title: params.title })
      .eq('id', params.playlistId)
      .select();

    if (error) {
      console.log(error);
      throw new BadRequestException('Failed to update playlist title');
    }

    return data[0];
  }

  async updateThumbnailWithFile(playlistId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(`${playlistId}/${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.log(error);
      throw new BadRequestException('Failed to upload thumbnail');
    }

    // Update the playlist with the new thumbnail path
    const thumbnailPath = data.path;
    const { data: updatedPlaylist, error: updateError } = await supabase
      .from('playlist')
      .update({ thumbnailPath })
      .eq('id', playlistId)
      .select();

    if (updateError) {
      console.log(updateError);
      throw new BadRequestException('Failed to update playlist thumbnail');
    }

    return updatedPlaylist[0];
  }

  async getPlaylistWithVideosAndProfiles(playlistId: string) {
    // Get playlist details
    const { data: playlist, error: playlistError } = await supabase
      .from('playlist')
      .select('*, profile:profileId(*)')
      .eq('id', playlistId)
      .single();
    if (playlistError) {
      throw new BadRequestException('Playlist not found');
    }
    // Get all videos in the playlist, join with video and profile
    const { data: videos, error: videosError } = await supabase
      .from('video_playlists')
      .select('video:videoId(*, profile:profileId(*))')
      .eq('playlistId', playlistId);
    if (videosError) {
      throw new BadRequestException('Failed to fetch videos in playlist');
    }
    // videos is an array of { video: { ...video fields, profile: { ...profile fields } } }
    return {
      ...playlist,
      videos: videos.map((item) => item.video),
    };
  }

  async getAllPlaylists(userId: string, reqUid: string) {
    const isOwner = userId === reqUid;
    let data;
    if (isOwner) {
      const { data: playlists, error } = await supabase
        .from('playlist')
        .select('*')
        .eq('profileId', userId);
      if (error) {
        console.log(error);
        throw new BadRequestException('Failed to fetch playlists');
      }
      data = playlists;
    } else {
      const { data: playlists, error } = await supabase
        .from('playlist')
        .select('*')
        .eq('isPublic', true)
        .eq('profileId', userId);
      console.log(playlists);

      if (error) {
        console.log(error);
        throw new BadRequestException('Failed to fetch public playlists');
      }
      data = playlists;
    }

    return data;
  }
}
