import { PartialType } from '@nestjs/swagger';
import { CreatePlaylistVideoDto } from './create-playlist_video.dto';

export class UpdatePlaylistVideoDto extends PartialType(CreatePlaylistVideoDto) {}
