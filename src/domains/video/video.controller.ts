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

@Controller('video')
export class VideoController {
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
  async create(
    @Body() createVideoDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    // const fileType = await fileTypeFromBuffer(file.buffer)

    const videoId = createVideoDto.videoId!;
    const nameDir = `public/assets/chunks/${videoId}`;

    if (!fs.existsSync(nameDir)) {
      fs.mkdirSync(nameDir);
    }

    fs.cpSync(files[0].path, `${nameDir}/${createVideoDto.videoName}`);

    fs.rmSync(files[0].path);
    return await this.videoService.create(createVideoDto, files);
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

  @Post('merge')
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
  async merge(
    @Query('videoId') videoId: string,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Body() body: any,
  ) {
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
      const readStream = fs.createReadStream(filePath);
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
    convertAndUploadToSupabase(videoId, mergedFilePath);

    return {
      message: 'Video chunks merged successfully',
      videoId,
      originalFileName,
      hlsPath: path.join('public', 'assets', 'videos', videoId, 'master.m3u8'),
    };
  }

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
