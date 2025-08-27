import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UploadedFiles,
  Query,
  Req,
  Res,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';
import { finished } from 'stream/promises';
import {
  convertAndUploadToSupabase,
  encodeHLSWithMultipleVideoStreams,
} from '../../utils/hls-converter';
import { CreateVideoDto, UploadVideoDto } from './dto/create-video.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UpdateVideoDto } from './dto/update-video.dto';
import { OwnerGuard } from '../../guards/owner/owner.guard';
import { OwnerCheck } from '../../guards/owner/owner-check.decorator';
import { OptionalAuthGuard } from '../../guards/optional-auth/optional-auth.guard';

@Controller('video')
export class VideoController {
  userId = '7bd0330f-b0e1-4ee7-aba0-fff2860e749d';

  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './public/assets/videos',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileName = `${file.fieldname}-${uniqueSuffix}.${file.originalname.split('.').pop()}`;
          cb(null, fileName);
        },
      }),
      // limits: {
      //   fileSize: 10 * 1024 * 1024,
      // }
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        videoId: { type: 'string' },
        videoName: { type: 'string' },
      },
    },
  })
  async create(
    @Body() uploadVideoDto: UploadVideoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    // const fileType = await fileTypeFromBuffer(file.buffer)

    const videoId = uploadVideoDto.videoId!;
    const nameDir = `public/assets/chunks/${videoId}`;

    if (!fs.existsSync(nameDir)) {
      fs.mkdirSync(nameDir);
    }

    fs.cpSync(files[0].path, `${nameDir}/${uploadVideoDto.videoName}`);

    fs.rmSync(files[0].path);

    res.status(200).json({
      message: 'Video file uploaded successfully',
      videoId: videoId,
    });
  }

  @Post('merge')
  @ApiConsumes('multipart/form-data')
  async merge(@Query('videoId') videoId: string, @Req() req: any) {
    const nameDir = `public/assets/chunks/${videoId}`;
    if (!fs.existsSync(nameDir)) {
      throw new BadRequestException('Video chunks directory does not exist');
    }

    // Ensure the directory exists
    const files = fs
      .readdirSync(nameDir)
      .filter((f) => f.endsWith('.mp4') || f.includes('.part'))
      .sort((a, b) => {
        const aIndex = parseInt(a.split('.part')[1] || '0', 10);
        const bIndex = parseInt(b.split('.part')[1] || '0', 10);
        return aIndex - bIndex;
      });

    if (files.length === 0) {
      throw new BadRequestException('No video chunks found to merge');
    }

    const originalFileName = files[0].split('.part')[0];
    const mergedFilePath = `public/assets/videos/${videoId}/${originalFileName}`;
    fs.mkdirSync(`public/assets/videos/${videoId}`, { recursive: true });

    const writeStream = fs.createWriteStream(mergedFilePath);

    for (const file of files) {
      const filePath = `${nameDir}/${file}`;
      const readStream = fs.createReadStream(`${filePath}`);
      readStream.pipe(writeStream, { end: false });
      await finished(readStream); // ensure one finishes before starting next
    }

    writeStream.end();

    // Clean up chunks directory
    fs.rmSync(nameDir, { recursive: true, force: true });

    // convert to HLS
    console.log(
      'mergedFilePath =',
      mergedFilePath,
      'exists =',
      fs.existsSync(mergedFilePath),
    );

    const userId = req.user.id;
    console.log(userId);

    const result = await this.videoService.uploadDefaultThumbnail(
      videoId,
      userId,
    );
    console.log('re', result);

    convertAndUploadToSupabase(videoId, mergedFilePath);

    return result;
  }

  @Post('create-info')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter(
        req: any,
        file: {
          fieldname: string;
          originalname: string;
          encoding: string;
          mimetype: string;
          size: number;
          destination: string;
          filename: string;
          path: string;
          buffer: Buffer;
        },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only JPEG and PNG files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        thumbnail: {
          type: 'string',
          format: 'binary',
        },
        title: { type: 'string' },
        description: { type: 'string' },
        isPublic: { type: 'boolean' },
        id: { type: 'string' },
      },
    },
  })
  async createVideoInfo(
    @Body() createVideoDto: CreateVideoDto,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Res() res: Response,
  ) {
    const videoData = await this.videoService.updateInfo(
      createVideoDto,
      thumbnail,
    );
    res.status(201).json(videoData);
  }

  @Get('/get-video/:videoId')
  @UseGuards(OptionalAuthGuard)
  async getVideo(@Param('videoId') videoId: string, @Req() req: any) {
    return await this.videoService.getVideo(videoId, req.user?.id);
  }

  @Get('likes/comments/:videoId')
  async getLikesAndComments(
    @Req() req: any,
    @Param('videoId') videoId: string,
  ) {
    const userId = req.user.id;
    console.log(userId);
    return await this.videoService.getLikesAndComments(videoId, this.userId);
  }

  @Get('comments/:videoId/:start/:limit')
  async getComments(
    @Param('videoId') videoId: string,
    @Param('start') start: number,
    @Param('limit') limit: number,
  ) {
    return await this.videoService.getComments(videoId, start, limit);
  }

  @Get('recommendations/:videoId')
  async getRecommendations(
    @Param('videoId') videoId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.videoService.getRecommendations(
      videoId,
      page,
      limit,
      this.userId,
    );
  }

  //get video info
  @Get('info/:videoId')
  async getVideoInfo(@Param('videoId') videoId: string) {
    return await this.videoService.getVideoInfo(videoId);
  }

  //get videos by following users
  @Get('following-videos')
  async getFollowingVideos(@Req() req: Request) {
    return await this.videoService.getVideosByFollowingProfile(this.userId);
  }

  // ==============================================
  @Get('user-videos/:userId')
  @UseGuards(OptionalAuthGuard)
  async getUserVideos(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: 'asc' | 'desc' = 'desc',
    @Req() req: any,
  ) {
    // Ensure orderBy is a string and valid, default to 'DESC'
    const order =
      typeof orderBy === 'string' &&
      ['asc', 'desc'].includes(orderBy.toLowerCase())
        ? (orderBy.toUpperCase() as 'ASC' | 'DESC')
        : 'DESC';
    console.log('order =', order, userId, page, limit, req.user?.id);

    return await this.videoService.getUserVideos(
      userId,
      page,
      limit,
      req.user?.id,
      order,
    );
  }

  @Get('trending')
  async getTrendingVideos(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.videoService.getTrendingVideos(page, limit);
  }

  @Get('latest')
  async getLatestVideos(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.videoService.getLatestVideos(page, limit);
  }

  @Get('category')
  async getVideosByCategory(
    @Query('categoryId') categoryId: string,
    @Query('page', new ParseIntPipe()) page: number,
    @Query('limit', new ParseIntPipe()) limit: number,
  ) {
    return await this.videoService.getVideosByCategory(categoryId, page, limit);
  }

  @Get('search')
  async searchVideos(
    @Query('query') query: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.videoService.searchVideos(query, page, limit);
  }

  @Put('update-info')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'video', param: 'id' })
  async updateVideoInfo(@Body() updateVideoDto: UpdateVideoDto) {
    return await this.videoService.updateVideoInfo(updateVideoDto);
  }

  @Delete(':videoId')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'video', param: 'videoId' })
  async deleteVideo(@Req() req: any, @Param('videoId') videoId: string) {
    const userId = req.user.id;
    console.log(userId);
    return await this.videoService.deleteVideo(videoId);
  }

  // @Post('merge')
  // async merge(
  //   @Query('videoId') videoId: string,
  // ) {
  //   const nameDir = `public/assets/chunks/${videoId}`;
  //   if (!fs.existsSync(nameDir)) {
  //     throw new BadRequestException('Video chunks directory does not exist');
  //   }
  //   const files = fs.readdirSync(nameDir);
  //   if (files.length === 0) {
  //     throw new BadRequestException('No video chunks found to merge');
  //   }
  //
  //   let startPos = 0;
  //   files.map(
  //     file => {
  //       const match = file.match(/^(.*)\.part\d+$/);
  //       if (!match) {
  //         throw new BadRequestException(`Invalid file format: ${file}`);
  //       }
  //       const originalFileName = match[1];
  //       const filePath = `${nameDir}/${file}`;
  //
  //       // create folder by videoId if not exists
  //       fs.mkdirSync(`public/assets/videos/${videoId}`, { recursive: true });
  //
  //       const streamFile = fs.createReadStream(filePath)
  //       streamFile.pipe(fs.createWriteStream(`public/assets/videos/${videoId}/${originalFileName}`,{
  //         start: startPos,
  //       }));
  //       startPos += fs.statSync(filePath).size;
  //     }
  //   )
  // }

  // @Get('stream')
  // stream(@Req() req: Request, @Res() res: Response) {
  //   const videoPath =
  //     'public/assets/videos/f1a80699-7df4-4d51-9fcf-732329bf002f/Phép Màu (Đàn Cá Gỗ OST) - Mounter x MAYDAYs, Minh Tốc _ Official MV.mp4';
  //
  //   if (!fs.existsSync(videoPath)) {
  //     throw new BadRequestException('Video file does not exist');
  //   }
  //
  //   const stat = fs.statSync(videoPath);
  //   const fileSize = stat.size;
  //   const range = req.headers.range;
  //
  //   if (!range) {
  //     res.writeHead(200, {
  //       'Content-Length': fileSize,
  //       'Content-Type': 'video/mp4',
  //     });
  //
  //     fs.createReadStream(videoPath).pipe(res);
  //   } else {
  //     const parts = range.replace(/bytes=/, '').split('-');
  //     const start = parseInt(parts[0], 10);
  //     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  //
  //     if (start >= fileSize || end >= fileSize) {
  //       res.status(416).send('Requested range not satisfiable');
  //       return;
  //     }
  //
  //     const chunkSize = end - start + 1;
  //     const file = fs.createReadStream(videoPath, { start, end });
  //
  //     res.writeHead(206, {
  //       'Content-Range': `bytes ${start}-${end}/${fileSize}`,
  //       'Accept-Ranges': 'bytes',
  //       'Content-Length': chunkSize,
  //       'Content-Type': 'video/mp4',
  //     });
  //
  //     file.pipe(res);
  //   }
  // }
}
