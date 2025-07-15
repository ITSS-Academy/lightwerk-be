import { CreateVideoDto } from './dto/create-video.dto';
export declare class VideoService {
    create(createVideoDto: CreateVideoDto, files: Array<Express.Multer.File>): Promise<{
        message: string;
    }>;
}
