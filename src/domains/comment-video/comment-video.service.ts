import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCommentVideoDto } from './dto/create-comment-video.dto';
import { UpdateCommentVideoDto } from './dto/update-comment-video.dto';
import { supabase } from '../../utils/supabase';

@Injectable()
export class CommentVideoService {
  //create a comment for a video
  async create(createCommentVideoDto: CreateCommentVideoDto, profileId: string) {
    const { data ,error } =  await supabase
      .from('comment_video')
      .insert({
        ...createCommentVideoDto,
        profileId: profileId,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error);
    }

    const { data: comments, error: commentsError } = await supabase
      .from('comment_video')
      .select('*,profile(*)', { count: 'exact' })
      .eq('videoId', createCommentVideoDto.videoId);

    if (commentsError) {
      throw new BadRequestException(commentsError);
    }

    return comments;
  }
  //get all comments for a videos
  async getAllComments(videoId: string) {
    const { data: comments, error: commentsError } = await supabase
      .from('comment_video')
      .select('*,profile(*)', { count: 'exact' })
      .eq('videoId', videoId)
      .order('createdAt', { ascending: false });

    if (commentsError) {
      throw new BadRequestException(commentsError);
    }

    return comments;
  }

  findAll() {
    return `This action returns all commentVideo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} commentVideo`;
  }

  update(id: number, updateCommentVideoDto: UpdateCommentVideoDto) {
    return `This action updates a #${id} commentVideo`;
  }

  remove(id: number) {
    return `This action removes a #${id} commentVideo`;
  }
}
