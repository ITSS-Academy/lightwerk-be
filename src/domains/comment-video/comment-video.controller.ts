import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException, Req,
} from '@nestjs/common';
import { CommentVideoService } from './comment-video.service';
import { CreateCommentVideoDto } from './dto/create-comment-video.dto';
import { UpdateCommentVideoDto } from './dto/update-comment-video.dto';

@Controller('comment-video')
export class CommentVideoController {
  constructor(private readonly commentVideoService: CommentVideoService) {}

  @Post('create')
  create(@Body() createCommentVideoDto: CreateCommentVideoDto, @Req() req: any) {
    //create a comment for a video
    try {
      const uid = req.user.id;
      return this.commentVideoService.create(createCommentVideoDto, uid);
    }catch (error) {
      throw new BadRequestException(error)
    }
  }

  @Get('get-comments-video/:videoId')
  getAllComments(
    @Param('videoId') videoId: string,
  ) {
    try {
      return this.commentVideoService.getAllComments(videoId);
    }
    catch (error) {
      throw new BadRequestException(error)
    }
  }

  @Get()
  findAll() {
    try {
      return this.commentVideoService.findAll();
    }
    catch (error) {
      throw new BadRequestException(error)
    }
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
