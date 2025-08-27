import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlaylistDto {
  @IsNotEmpty()
  title: string;

  @Type(() => Boolean)
  @IsBoolean()
  isPublic: boolean;
}

export class VideoPlaylistDto {
  @IsUUID()
  @IsNotEmpty()
  videoId: string;

  @IsUUID()
  @IsNotEmpty()
  playlistId: string;
}
