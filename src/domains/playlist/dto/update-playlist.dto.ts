import { PartialType } from '@nestjs/mapped-types';
import { CreatePlaylistDto } from './create-playlist.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdatePlaylistDto extends PartialType(CreatePlaylistDto) {
}

export class UpdateTitleDto {
  @IsUUID()
  playlistId: string;

  @IsNotEmpty()
  title: string;
}

export class ThumbnailDto {
  @IsNotEmpty()
  @IsUUID()
  playlistId: string;

}
