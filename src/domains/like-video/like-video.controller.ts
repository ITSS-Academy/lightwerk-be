import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LikeVideoService } from './like-video.service';
import { CreateLikeVideoDto } from './dto/create-like-video.dto';
import { UpdateLikeVideoDto } from './dto/update-like-video.dto';

@Controller('like-video')
export class LikeVideoController {
  constructor(private readonly likeVideoService: LikeVideoService) {}

  @Post()
  create(@Body() createLikeVideoDto: CreateLikeVideoDto) {
    return this.likeVideoService.create(createLikeVideoDto);
  }

  @Get()
  findAll() {
    return this.likeVideoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likeVideoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLikeVideoDto: UpdateLikeVideoDto) {
    return this.likeVideoService.update(+id, updateLikeVideoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.likeVideoService.remove(+id);
  }
}
