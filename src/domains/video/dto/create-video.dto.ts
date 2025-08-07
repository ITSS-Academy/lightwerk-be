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

  @IsBoolean()
  @Type(() => Boolean)
  isPublic: boolean;
}

export class UploadVideoDto {
  @IsNotEmpty()
  @IsUUID()
  videoId: string;

  @IsNotEmpty()
  @IsString()
  videoName: string;
}
