import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { supabase } from '../../utils/supabase';
import {
  extractThumbnail,
  getAspectRatioInfo,
  getDuration,
  getResolution,
} from '../../utils/hls-converter';
import * as fs from 'fs';
import { VideoStatus } from '../../enums/video-status';
import { InjectRepository } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
  ) {}

  async uploadDefaultThumbnail(videoId: string, userId: string) {
    console.log(`Creating video with ID: ${videoId}`);

    //get dir to public/assets/videos/${videoId}/??.mp4

    const inputPath = `public/assets/videos/${videoId}/${videoId}.mp4`;

    const [uploadedThumbnailLocalPath, resolution, duration] =
      await Promise.all([
        extractThumbnail(inputPath, videoId),
        getResolution(inputPath),
        getDuration(inputPath),
      ]);

    const asspectRatio = getAspectRatioInfo(
      resolution.width,
      resolution.height,
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
        width: resolution.width,
        height: resolution.height,
        duration: duration,
        aspectRatio: asspectRatio.fractionRatio,
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
          categoryId: createVideoDto.categoryId,
          thumbnailPath: newThumbnailPath,
          status: newStatus,
        }
      : {
          id,
          title,
          description,
          isPublic,
          categoryId: createVideoDto.categoryId,
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

  async getVideo(videoId: string, profileId?: string) {
    // https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/248e1cc9-c9ae-46cd-8e16-8da531b058f9/master.m3u8
    const { data, error } = await supabase
      .from('video')
      .select('*, profile!FK_553f97d797c91d51556037b99e5(*)')
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

    console.log(profileId);
    console.log('Fetching video and updating view count/history');
    // Always increment view count
    const [{ error: updateError }, { error: historyErr }] = await Promise.all([
      supabase.rpc('increment_view_count', {
        video_id: videoId,
      }),
      profileId
        ? supabase
            .from('history_videos')
            .upsert([{ profileId, videoId, createdAt: new Date() }])
        : Promise.resolve({ error: null }),
    ]);

    if (updateError) {
      console.error('Error updating view count:', updateError);
      throw new BadRequestException('Failed to update view count');
    }
    if (historyErr) {
      console.error('Error updating history:', historyErr);
      throw new BadRequestException('Failed to update history');
    }

    console.log(data);
    return {
      ...data,
      videoPath,
    };
  }

  async getLikesAndComments(videoId: string, userId: string | null) {
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
    let isLiked = false;
    if (userId) {
      isLiked = likes.some((like) => like.profileId === userId);
    }

    // check if video is saved in any playlist owned by the user (isSave)
    let isSave = false;
    if (userId) {
      // Join video_playlists with playlist and video, check playlist.ownerId === userId
      const { data: savedPlaylists, error: playlistError } = await supabase
        .from('video_playlists')
        .select('playlist(id, profileId), video(id)')
        .eq('videoId', videoId)
        .eq('playlist.profileId', userId);
      if (playlistError) {
        console.error('Error fetching saved playlists:', playlistError);
        throw new BadRequestException('Failed to fetch saved playlists');
      }
      isSave = Array.isArray(savedPlaylists) && savedPlaylists.length > 0;
    }

    return {
      likesCount,
      isLiked,
      isSave,
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

  async getRecommendations(
    videoId: string,
    page: number,
    limit: number,
    userId: string,
  ) {
    // Get the video to find its categories
    const { data: videoData, error: videoError } = await supabase
      .from('video')
      .select('id, categoryId')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      throw new BadRequestException('Failed to fetch video');
    }

    if (!videoData || !videoData.categoryId) {
      throw new BadRequestException('Video not found or has no category');
    }

    console.log(videoData.categoryId);
    console.log(
      `Fetching recommendations for video ID: ${videoId} with categories: ${videoData.categoryId}`,
    );

    // Get recommendations based on category
    const [
      { data: recommendations, error: recError },
      { data: historyVideo, error: historyErr },
    ] = await Promise.all([
      supabase.rpc('get_video_recommendations', {
        category_id: videoData.categoryId,
        exclude_video_id: videoId,
        page,
        page_size: limit,
      }),
      supabase
        .from('history_videos')
        .select('videoId')
        .eq('profileId', userId)
        .range(0, limit % 2)
        .order('createdAt', { ascending: false }),
    ]);

    if (recError || historyErr) {
      console.error('Error fetching recommendations:', recError, historyErr);
      throw new BadRequestException('Failed to fetch recommendations');
    }

    // Filter out videos that the user has already watched
    const watchedVideoIds = new Set(historyVideo.map((hv) => hv.videoId));
    console.log(recommendations);
    const filteredRecommendations = recommendations.videos.filter(
      (video) => !watchedVideoIds.has(video.video_id),
    );
    // promise all to get video info, owner info
    const videoDetailsPromises = filteredRecommendations.map(async (video) => {
      const { data: videoDetails, error: videoDetailsError } = await supabase
        .from('video')
        .select('*, profile!FK_553f97d797c91d51556037b99e5(*)')
        .eq('id', video.video_id)
        .single();

      if (videoDetailsError) {
        console.error('Error fetching video details:', videoDetailsError);
        throw new BadRequestException('Failed to fetch video details');
      }

      return {
        videos: videoDetails,
      };
    });
    const videoDetails = await Promise.all(videoDetailsPromises);
    console.log(videoDetails);
    // shuffle the video details for randomness
    const shuffledVideoDetails = this.shuffleArray(videoDetails);
    return {
      recommendations: shuffledVideoDetails.map((video) => video.videos),
      pagination: recommendations.pagination,
    };
  }

  shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async updateVideoInfo(updateVideoDto: UpdateVideoDto) {
    const { id, title, description, isPublic, categoryId } = updateVideoDto;

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

    const updatedVideo = {
      id,
      title,
      description,
      isPublic,
      categoryId,
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

  async deleteVideo(videoId: string) {
    // Helper function to recursively list all files under a directory in Supabase storage
    async function listAllFiles(prefix: string): Promise<string[]> {
      let files: string[] = [];
      const { data, error } = await supabase.storage
        .from('videos')
        .list(prefix, { limit: 1000 });
      if (error) {
        throw new BadRequestException('Failed to list files in storage');
      }
      if (!data) return files;
      for (const item of data) {
        if (item.metadata && item.metadata.size !== undefined) {
          // It's a file
          files.push(prefix ? `${prefix}/${item.name}` : item.name);
        } else if (item.name) {
          // It's a folder, recurse into it
          const subFiles = await listAllFiles(
            prefix ? `${prefix}/${item.name}` : item.name,
          );
          files = files.concat(subFiles);
        }
      }
      return files;
    }

    // List all files under the videoId directory (including all subfolders)
    const allFiles = await listAllFiles(videoId);

    // Delete all files from Supabase storage
    if (allFiles.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove(allFiles);
      if (storageError) {
        console.error('Error deleting video files from storage:', storageError);
        throw new BadRequestException(
          'Failed to delete video files from storage',
        );
      }
    }

    // Delete video record from database
    const { error: dbError } = await supabase
      .from('video')
      .delete()
      .eq('id', videoId)
      .select();

    if (dbError) {
      console.error('Error deleting video from database:', dbError);
      throw new BadRequestException('Failed to delete video from database');
    }

    return { message: 'Video and all related files deleted successfully' };
  }

  async getVideosByFollowingProfile(
    userId: string,
    page: number,
    limit: number,
  ) {
    // get the list of profiles that the user is following
    const { data: followingProfiles, error: followingError } = await supabase
      .from('profile_follows')
      .select('followingId')
      .eq('followerId', userId);

    if (followingError) {
      console.error('Error fetching following profiles:', followingError);
      throw new BadRequestException('Failed to fetch following profiles');
    }
    if (!followingProfiles || followingProfiles.length === 0) {
      return [];
    }

    const followingIds = followingProfiles.map(
      (profile) => profile.followingId,
    );

    console.log(followingIds);

    const [videos, count] = await this.videoRepo
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.profile', 'profile')
      .where('video.profileId IN (:...ids)', { ids: followingIds })
      .andWhere('video.isPublic = :isPublic', { isPublic: true })
      .andWhere('video.status = :status', { status: VideoStatus.SUCCESS })
      .orderBy('video.createdAt', 'DESC')
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    if (!videos || videos.length === 0) {
      return [];
    }
    return {
      videos: videos.map((video) => ({
        ...video,
        videoPath: `https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/${video.id}/master.m3u8`,
      })),
      pagination: {
        totalCount: count,
        page: page,
        limit: limit,
      },
    };
  }

  async getUserVideos(
    userId: string,
    page: number,
    limit: number,
    callerId: string,
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    try {
      const isOwner = callerId && callerId === userId;
      const query = this.videoRepo
        .createQueryBuilder('video')
        .where('video.profileId = :userId', { userId });

      if (!isOwner) {
        query
          .andWhere('video.isPublic = :isPublic', { isPublic: true })
          .andWhere('video.status = :status', { status: VideoStatus.SUCCESS });
      }

      const [data, count] = await query
        .orderBy('video.createdAt', order)
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      return {
        videos: data.map((video) => ({
          ...video,
        })),
        totalCount: count,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async searchVideos(query: string) {
    const { data: profiles, error: profileError } = await supabase
      .from('profile')
      .select('id')
      .ilike('username', `%${query}%`);

    if (profileError) {
      throw new BadRequestException('Failed to search profiles');
    }

    const { data, error } = await supabase
      .from('video')
      .select('*,profile!FK_553f97d797c91d51556037b99e5(*)', { count: 'exact' })
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('isPublic', true)
      .eq('status', VideoStatus.SUCCESS)
      .order('createdAt', { ascending: false });

    const {
      data: videosByProfile,
      error: videosByProfileError,
      count: videosByProfileCount,
    } = await supabase
      .from('video')
      .select('*,profile!FK_553f97d797c91d51556037b99e5(*)', { count: 'exact' })
      .in(
        'profileId',
        profiles.map((p) => p.id),
      )
      .eq('isPublic', true)
      .eq('status', VideoStatus.SUCCESS)
      .order('createdAt', { ascending: false });

    if (videosByProfileError) {
      throw new BadRequestException('Failed to search videos by profile');
    }

    if (error) {
      console.error('Error searching videos:', error);
      throw new BadRequestException('Failed to search videos');
    }

    return {
      videos: [...(data || []), ...(videosByProfile || [])],
      pagination: {
        totalCount: (data?.length || 0) + (videosByProfileCount || 0),
      },
    };
  }

  async getVideosByCategory(categoryId: string, page: number, limit: number) {
    const { data, error, count } = await supabase
      .from('video')
      .select('*', { count: 'exact' })
      .eq('categoryId', categoryId)
      .eq('isPublic', true)
      .eq('status', VideoStatus.SUCCESS)
      .order('createdAt', { ascending: false })
      .range(page, page + limit - 1);

    if (error) {
      console.error('Error fetching videos by category:', error);
      throw new BadRequestException('Failed to fetch videos by category');
    }

    return {
      videos: this.shuffleArray(data),
      pagination: {
        totalCount: count,
        page: page,
        limit: limit,
      },
    };
  }

  async getTrendingVideos(page: number, limit: number) {
    // Trending = (likes in 7d) * 3 + (comments in 7d) * 2 + (viewCount) * 1
    // Only videos that are public, SUCCESS, and created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      console.log('Fetching trending videos since:', sevenDaysAgo);

      const qb = this.videoRepo
        .createQueryBuilder('video')
        .leftJoinAndSelect('video.profile', 'profile')
        .leftJoin('video.likes', 'like', 'like.createdAt >= :sevenDaysAgo', {
          sevenDaysAgo,
        })
        .leftJoin(
          'video.comments',
          'comment',
          'comment.createdAt >= :sevenDaysAgo',
          { sevenDaysAgo },
        )
        .where('video.isPublic = :isPublic', { isPublic: true })
        .andWhere('video.status = :status', { status: VideoStatus.SUCCESS })
        .andWhere('video.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .select(['video', 'profile'])
        .addSelect('COUNT(DISTINCT like.profileId)', 'likeCount')
        .addSelect('COUNT(DISTINCT comment.id)', 'commentCount')
        .addSelect('video.viewCount', 'viewCount')
        .addSelect(
          '((COUNT(DISTINCT like.profileId) * 3) + (COUNT(DISTINCT comment.id) * 2) + video.viewCount)',
          'trendingscore',
        )
        .groupBy('video.id')
        .addGroupBy('profile.id')
        .addOrderBy('trendingscore', 'DESC')
        .addOrderBy('video.createdAt', 'DESC')
        .skip(page * limit)
        .take(limit);

      let data, count;
      try {
        [data, count] = await Promise.all([
          qb.getRawAndEntities(),
          this.videoRepo
            .createQueryBuilder('video')
            .where('video.isPublic = :isPublic', { isPublic: true })
            .andWhere('video.status = :status', { status: VideoStatus.SUCCESS })
            .andWhere('video.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
            .getCount(),
        ]);
      } catch (err) {
        console.error('Error executing trending videos query:', err);
      }

      console.log(data.raw);

      // data.raw: trendingScore, likeCount, commentCount, viewCount
      // data.entities: video entity
      const videos = data.entities.map((video, idx) => ({
        ...video,
        viewCount: Number(data.raw[idx].viewCount),
        likeCount: Number(data.raw[idx].likeCount),
        commentCount: Number(data.raw[idx].commentCount),
        trendingScore: Number(data.raw[idx].trendingscore),
        videoPath: `https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/${video.id}/master.m3u8`,
      }));

      return {
        videos,
        pagination: {
          totalCount: count,
          page,
          limit,
        },
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getLatestVideos(page: number, limit: number) {
    const { data, error, count } = await supabase
      .from('video')
      .select('*, profile!FK_553f97d797c91d51556037b99e5(*)', {
        count: 'exact',
      })
      .eq('isPublic', true)
      .eq('status', VideoStatus.SUCCESS)
      .order('createdAt', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error('Error fetching latest videos:', error);
      throw new BadRequestException('Failed to fetch latest videos');
    }
    return {
      videos: data.map((video) => ({
        ...video,
        videoPath: `https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/${video.id}/master.m3u8`,
      })),
      pagination: {
        totalCount: count,
        page,
        limit,
      },
    };
  }

  async getVideoInfo(videoId: string) {
    const { data, error } = await supabase
      .from('video')
      .select('*, category(*)')
      .eq('id', videoId)
      .single();
    if (error) {
      console.log(error);
      throw new BadRequestException('Failed to fetch video info');
    }
    if (!data) {
      throw new BadRequestException('Video not found');
    }

    if (data.status === VideoStatus.PROCESSING) {
      data.status =
        data.title == null || data.title == ''
          ? VideoStatus.EDITING
          : VideoStatus.PROCESSING;
    }
    return data;
  }

  async getRecommendationsBasedOnHistory(
    page: number,
    limit: number,
    userId: any,
  ) {
    // 1. Get user's watch history (most recent first)
    const { data: history, error: historyError } = await supabase
      .from('history_videos')
      .select('videoId')
      .eq('profileId', userId)
      .order('createdAt', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (historyError) {
      throw new BadRequestException('Failed to fetch user history');
    }
    if (!history || history.length === 0) {
      return { videos: [], pagination: { totalCount: 0, page, limit } };
    }
    const watchedVideoIds = history.map((h) => h.videoId);

    // 2. Get categories of watched videos
    const { data: watchedVideos, error: watchedVideosError } = await supabase
      .from('video')
      .select('id, categoryId')
      .in('id', watchedVideoIds);
    if (watchedVideosError) {
      throw new BadRequestException('Failed to fetch watched videos');
    }
    const categoryIds = [
      ...new Set(watchedVideos.map((v) => v.categoryId).filter(Boolean)),
    ];
    if (categoryIds.length === 0) {
      return { videos: [], pagination: { totalCount: 0, page, limit } };
    }

    // 3. Find other videos in those categories, not in watched, public, SUCCESS
    const {
      data: recVideos,
      error: recError,
      count,
    } = await supabase
      .from('video')
      .select('*, profile:profileId(*)', { count: 'exact' })
      .in('categoryId', categoryIds)
      .not('id', 'in', `(${watchedVideoIds.join(',')})`)
      .eq('isPublic', true)
      .eq('status', VideoStatus.SUCCESS)
      .order('createdAt', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (recError) {
      console.log(recError);
      throw new BadRequestException('Failed to fetch recommendations');
    }

    // 4. Add videoPath for each video
    const videos = (recVideos || []).map((video) => ({
      ...video,
      videoPath: `https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/${video.id}/master.m3u8`,
    }));

    return {
      videos: this.shuffleArray(videos),
      pagination: {
        totalCount: count,
        page,
        limit,
      },
    };
  }

  async getGeneralRecommendations(page: number, limit: number) {
    // Return latest public, SUCCESS videos with profile info
    const { data, error, count } = await supabase
      .from('video')
      .select('*, profile:profileId(*)', { count: 'exact' })
      .eq('isPublic', true)
      .eq('status', 'SUCCESS')
      .order('createdAt', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) {
      throw new BadRequestException('Failed to fetch general recommendations');
    }
    const videos = (data || []).map((video) => ({
      ...video,
      videoPath: `https://zkeqdgfyxlmcrmfehjde.supabase.co/storage/v1/object/public/videos/${video.id}/master.m3u8`,
    }));
    return {
      videos: this.shuffleArray(videos),
      pagination: {
        totalCount: count,
        page,
        limit,
      },
    };
  }
}
