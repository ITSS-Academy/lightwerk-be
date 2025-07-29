import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommentVideoService } from './comment-video.service';
import { CreateCommentVideoDto } from './dto/create-comment-video.dto';
import { UpdateCommentVideoDto } from './dto/update-comment-video.dto';

@Controller('comment-video')
export class CommentVideoController {
  constructor(private readonly commentVideoService: CommentVideoService) {}

  @Post()
  create(@Body() createCommentVideoDto: CreateCommentVideoDto) {
    return this.commentVideoService.create(createCommentVideoDto);
  }

  @Get()
  findAll() {
    return this.commentVideoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentVideoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentVideoDto: UpdateCommentVideoDto) {
    return this.commentVideoService.update(+id, updateCommentVideoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentVideoService.remove(+id);
  }
}
