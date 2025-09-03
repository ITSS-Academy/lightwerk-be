import { PartialType } from '@nestjs/swagger';
import { CreateHistoryVideoDto } from './create-history_video.dto';

export class UpdateHistoryVideoDto extends PartialType(CreateHistoryVideoDto) {}
