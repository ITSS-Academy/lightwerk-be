import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { VideoPlaylistDto, CreatePlaylistDto } from './dto/create-playlist.dto';
import {
  ThumbnailDto,
  UpdatePlaylistDto,
  UpdateTitleDto,
} from './dto/update-playlist.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { OwnerGuard } from '../../guards/owner/owner.guard';
import { OwnerCheck } from '../../guards/owner/owner-check.decorator';
import { OptionalAuthGuard } from '../../guards/optional-auth/optional-auth.guard';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() createPlaylistDto: CreatePlaylistDto,
    @Req() req: any,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    try {
      const userId = req.user?.id;
      return this.playlistService.create(createPlaylistDto, userId, thumbnail);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post('add-video')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'playlist', param: 'playlistId' })
  addTrack(@Body() addToPlaylistDto: VideoPlaylistDto) {
    try {
      const { playlistId, videoId } = addToPlaylistDto;
      return this.playlistService.addToPlaylist({ playlistId, videoId });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Delete('delete/:id')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'playlist', param: 'id' })
  delete(@Param('id') id: string) {
    try {
      return this.playlistService.remove(id);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Delete('remove-video')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'playlist', param: 'playlistId' })
  removeTrack(@Body() deleteTrackDto: VideoPlaylistDto) {
    try {
      const { playlistId, videoId } = deleteTrackDto;
      return this.playlistService.removeFromPlaylist(playlistId, videoId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Put('update-title')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'playlist', param: 'playlistId' })
  updateTitle(
    @Query()
    query: UpdateTitleDto,
  ) {
    try {
      return this.playlistService.updateTitle(query);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Put('update-thumbnail/:playlistId')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'playlist', param: 'playlistId' })
  @UseInterceptors(
    FileInterceptor('file', {
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
        // Validate thumbnail file type
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  updateThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Param() params: ThumbnailDto,
  ) {
    return this.playlistService.updateThumbnailWithFile(
      params.playlistId,
      file,
    );
  }

  @Put('update-info')
  @UseGuards(OwnerGuard)
  @OwnerCheck({ entity: 'playlist', param: 'playlistId' })
  @UseInterceptors(FileInterceptor('file'))
  async updateInfo(
    @UploadedFile() file: Express.Multer.File,
    @Query()
    params: {
      playlistId: string;
      title: string;
    },
  ) {
    if (!params.playlistId) {
      throw new BadRequestException('Playlist ID is required');
    }
    if (!file && !params.title) {
      throw new BadRequestException('Either file or title must be provided');
    }
    if (!file) {
      return this.playlistService.updateTitle(params);
    } else if (!params.title) {
      return this.playlistService.updateThumbnailWithFile(
        params.playlistId,
        file,
      );
    } else {
      const [resTitle, resThumbnail] = await Promise.all([
        this.playlistService.updateTitle(params),
        this.playlistService.updateThumbnailWithFile(params.playlistId, file),
      ]);
      return {
        title: resTitle,
        thumbnail: resThumbnail,
      };
    }
  }

  @Get('all-videos/:id')
  async getTracks(@Param('id') id: string) {
    try {
      return this.playlistService.getPlaylistWithVideosAndProfiles(id);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Get('all-playlists/:uid')
  @UseGuards(OptionalAuthGuard)
  async getPlaylist(@Param('uid') uid: string, @Req() req: any) {
    try {
      return this.playlistService.getAllPlaylists(uid, req.user?.id);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
