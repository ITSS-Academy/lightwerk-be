import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { supabase } from '../../utils/supabase';
import { extractThumbnail } from '../../utils/hls-converter';
import * as fs from 'fs';
import { VideoStatus } from '../../enums/video-status';

@Injectable()
export class VideoService {
  async uploadDefaultThumbnail(videoId: string, userId: string) {
    console.log(`Creating video with ID: ${videoId}`);

    //get dir to public/assets/videos/${videoId}/??.mp4

    const uploadedThumbnailLocalPath = await extractThumbnail(
      `public/assets/videos/${videoId}/${videoId}.mp4`,
      videoId,
    );

    // read thumbnail from disk
    const thumbnailBuffer = fs.readFileSync(uploadedThumbnailLocalPath);

    // Upload thumbnail to Supabase
    const newThumbnail = {
      buffer: thumbnailBuffer,
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(`${videoId}/thumbnail.jpg`, newThumbnail.buffer, {
        contentType: newThumbnail.mimetype,
        upsert: true,
      });

    if (error) throw new BadRequestException(error);

    const uploadedThumbnailPath = data.path;

    const { data: videoData, error: videoError } = await supabase
      .from('video')
      .insert({
        id: videoId,
        status: VideoStatus.EDITING,
        thumbnailPath: uploadedThumbnailPath,
        isPublic: false,
        profileId: userId,
      })
      .select();

    if (videoError) {
      console.log(videoError);
      throw new BadRequestException('Failed to create video entry');
    }

    console.log(videoData);

    return videoData[0];
  }

  async updateInfo(
    createVideoDto: CreateVideoDto,
    thumbnail: Express.Multer.File,
  ) {
    const { id, title, description, isPublic } = createVideoDto;

    let newThumbnailPath: null | string = null;
    if (thumbnail) {
      // Upload thumbnail to Supabase
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(`${id}/thumbnail.jpg`, thumbnail.buffer, {
          contentType: thumbnail.mimetype,
          upsert: true,
        });

      if (error) {
        console.error('Error uploading thumbnail:', error);
        throw new BadRequestException('Failed to upload thumbnail');
      }

      newThumbnailPath = data.path;
    }

    // get video from database
    const { data: existingVideo, error: videoError } = await supabase
      .from('video')
      .select()
      .eq('id', id)
      .single();
    if (videoError) {
      throw new BadRequestException('Failed to fetch video');
    }
    if (!existingVideo) {
      throw new BadRequestException('Video not found');
    }

    // get status from existing video
    const currentStatus = existingVideo.status;
    const newStatus =
      currentStatus === VideoStatus.EDITING
        ? VideoStatus.PROCESSING
        : VideoStatus.SUCCESS;

    const updatedVideo = newThumbnailPath
      ? {
          id,
          title,
          description,
          isPublic,
          thumbnailPath: newThumbnailPath,
          status: newStatus,
        }
      : {
          id,
          title,
          description,
          isPublic,
          status: newStatus,
        };

    // Update video information in the database
    const { data, error } = await supabase
      .from('video')
      .update(updatedVideo)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating video info:', error);
      throw new BadRequestException('Failed to update video info');
    }

    if (!data || data.length === 0) {
      throw new BadRequestException('Video not found');
    }

    return data[0];
  }

  async getVideo(videoId: string) {
    // https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/248e1cc9-c9ae-46cd-8e16-8da531b058f9/master.m3u8
    const { data, error } = await supabase
      .from('video')
      .select()
      .eq('id', videoId)
      .single();
    if (error) {
      console.error('Error fetching video:', error);
      throw new BadRequestException('Failed to fetch video');
    }

    if (!data) {
      throw new BadRequestException('Video not found');
    }
    const videoPath = `https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/${videoId}/master.m3u8`;

    if (
      data.status === VideoStatus.EDITING ||
      data.status === VideoStatus.PROCESSING
    ) {
      return {
        ...data,
        status:
          data.title == null || data.tile == ''
            ? VideoStatus.EDITING
            : data.status,
      };
    }

    const { error: updateError } = await supabase.rpc('increment_view_count', {
      video_id: videoId,
    });

    if (updateError) {
      console.error('Error updating view count:', updateError);
      throw new BadRequestException('Failed to update view count');
    }

    return {
      ...data,
      videoPath,
    };
  }

  async getLikesAndComments(videoId: string, userId: string) {
    // Get likes for the video
    const {
      data: likes,
      error: likesError,
      count: likesCount,
    } = await supabase
      .from('like_video')
      .select('*', { count: 'exact' })
      .eq('videoId', videoId);

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      throw new BadRequestException('Failed to fetch likes');
    }

    // Get comments for the video
    const {
      data: comments,
      error: commentsError,
      count: commentsCount,
    } = await supabase
      .from('comment_video')
      .select('*', { count: 'exact' })
      .limit(1)
      .order('createdAt', { ascending: false })
      .eq('videoId', videoId);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      throw new BadRequestException('Failed to fetch comments');
    }

    // check user isLiked
    const isLiked = likes.some((like) => like.profileId === userId);

    return {
      likesCount,
      isLiked,
      comments,
      commentsCount,
    };
  }

  async getComments(videoId: string, start: number, limit: number) {
    // Get comments for the video with pagination
    const { data, error, count } = await supabase
      .from('comment_video')
      .select('*', { count: 'exact' })
      .eq('videoId', videoId)
      .order('createdAt', { ascending: false })
      .range(start, start + limit - 1);

    if (error) {
      console.error('Error fetching comments:', error);
      throw new BadRequestException('Failed to fetch comments');
    }

    return {
      comments: data,
      totalCount: count,
    };
  }

  async getRecommendations(videoId: string) {
    // Get the video to find its categories
    const { data: videoData, error: videoError } = await supabase
      .from('video')
      .select('id, category(id)')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      throw new BadRequestException('Failed to fetch video');
    }

    if (!videoData || !videoData.category) {
      throw new BadRequestException('Video not found or has no category');
    }

    const categoryIds = videoData.category.map((cat) => cat.id);

    console.log(
      `Fetching recommendations for video ID: ${videoId} with categories: ${categoryIds}`,
    );

    // Get recommendations based on category
    const { data: recommendations, error: recError } = await supabase
      .from('video')
      .select('*')
      .in('category.id', categoryIds)
      .neq('id', videoId)
      .limit(10);

    if (recError) {
      console.error('Error fetching recommendations:', recError);
      throw new BadRequestException('Failed to fetch recommendations');
    }

    return recommendations;
  }

  async updateVideoInfo(updateVideoDto: UpdateVideoDto) {
    return Promise.resolve(undefined);
  }

  async deleteVideo(videoId: string) {
    return Promise.resolve(undefined);
  }

  async getFollowingVideos(userId: any) {
    return Promise.resolve(undefined);
  }

  async getUserVideos(userId: string, start: number, limit: number) {
    return Promise.resolve(undefined);
  }

  async searchVideos(query: string, start: number, limit: number) {
    return Promise.resolve(undefined);
  }

  async getVideosByCategory(categoryId: string, start: number, limit: number) {
    return Promise.resolve(undefined);
  }
}
