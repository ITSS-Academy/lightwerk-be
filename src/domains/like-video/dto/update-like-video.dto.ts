import { PartialType } from '@nestjs/mapped-types';
import { CreateLikeVideoDto } from './create-like-video.dto';

export class UpdateLikeVideoDto extends PartialType(CreateLikeVideoDto) {}
