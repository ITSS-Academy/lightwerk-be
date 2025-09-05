import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLikeVideoDto } from './dto/create-like-video.dto';
import { UpdateLikeVideoDto } from './dto/update-like-video.dto';
import { supabase } from '../../utils/supabase';

@Injectable()
export class LikeVideoService {

  async create(createLikeVideoDto: CreateLikeVideoDto) {
    const { data, error } = await supabase
      .from('like_video')
      .insert(createLikeVideoDto)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error);
    }

    const { count, error: countError } = await supabase
      .from('like_video')
      .select('*', { count: 'exact' })
      .eq('videoId', createLikeVideoDto.videoId);

    if (countError) {
      throw new BadRequestException(countError);
    }

    return {
      count: count,
    };
  }

  async findAll(videoId: string) {
    // select count of rows where video_id = videoId
    const { data, error, count } = await supabase
      .from('like_video')
      .select('*', { count: 'exact' })
      .eq('videoId', videoId);

    if (error) {
      throw new BadRequestException(error);
    }

    return {
      count: count,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} likeVideo`;
  }

  update(id: number, updateLikeVideoDto: UpdateLikeVideoDto) {
    return `This action updates a #${id} likeVideo`;
  }

  async remove(profileId: string, videoId: string) {
    const { error } = await supabase
      .from('like_video')
      .delete()
      .eq('profileId', profileId)
      .eq('videoId', videoId);

    if (error) {
      throw new BadRequestException(error);
    }


    const { count, error: countError } = await supabase
      .from('like_video')
      .select('*', { count: 'exact' })
      .eq('videoId', videoId);

    if (countError) {
      throw new BadRequestException(countError);
    }

    return {
      count: count,
    };
  }



}
