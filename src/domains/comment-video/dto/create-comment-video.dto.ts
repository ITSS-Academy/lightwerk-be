import { IsNotEmpty } from 'class-validator';

export class CreateCommentVideoDto {
  @IsNotEmpty()
  videoId: string;

  @IsNotEmpty()
  content: string;
}
