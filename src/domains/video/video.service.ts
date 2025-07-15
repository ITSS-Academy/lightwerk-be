import { Injectable } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideoService {
  async create(createVideoDto: CreateVideoDto,
               files:Array<Express.Multer.File>) {
    console.log(createVideoDto);
    console.log(files);
    return {
      message: 'Video files uploaded successfully',
    }
  }

}
