import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePlaylistDto {}

export class AddToPlaylistDto {
  @IsUUID()
  @IsNotEmpty()
  videoId: string;

  @IsUUID()
  @IsNotEmpty()
  playlistId: string;
}
