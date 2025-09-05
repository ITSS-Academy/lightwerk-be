import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { LikeVideoService } from './like-video.service';
import { CreateLikeVideoDto } from './dto/create-like-video.dto';
import { UpdateLikeVideoDto } from './dto/update-like-video.dto';

@Controller('like-video')
export class LikeVideoController {
  constructor(private readonly likeVideoService: LikeVideoService) {}

  @Post()
  create(@Body() createLikeVideoDto: CreateLikeVideoDto) {
    try {
      return this.likeVideoService.create(createLikeVideoDto);
    }
    catch (error) {
      throw new BadRequestException(error)
    }
  }


  @Get('get-likes-video/:videoId')
  findAll(
    @Param('videoId') videoId: string,
  ) {
    try {
      return this.likeVideoService.findAll(videoId);
    }
    catch (error) {
      throw new BadRequestException(error)
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likeVideoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLikeVideoDto: UpdateLikeVideoDto) {
    return this.likeVideoService.update(+id, updateLikeVideoDto);
  }

  @Delete(':profileId/:videoId')
  remove(
    @Param('profileId') profileId: string,
    @Param('videoId') videoId: string,
  ) {
    try {
      return this.likeVideoService.remove(profileId, videoId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}