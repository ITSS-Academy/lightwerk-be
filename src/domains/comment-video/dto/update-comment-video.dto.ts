import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentVideoDto } from './create-comment-video.dto';

export class UpdateCommentVideoDto extends PartialType(CreateCommentVideoDto) {}
