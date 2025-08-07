import { PartialType } from '@nestjs/swagger';
import { CreateCommentVideoDto } from './create-comment-video.dto';

export class UpdateCommentVideoDto extends PartialType(CreateCommentVideoDto) {}
