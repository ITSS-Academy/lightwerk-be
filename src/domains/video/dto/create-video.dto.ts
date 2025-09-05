import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVideoDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @Type(() => Boolean)
  @IsBoolean()
  isPublic: boolean;

  @IsUUID()
  categoryId: string;
}

export class UploadVideoDto {
  @IsNotEmpty()
  @IsUUID()
  videoId: string;

  @IsNotEmpty()
  @IsString()
  videoName: string;
}
