import { VideoService } from './video.service';
import { Request, Response } from 'express';
export declare class VideoController {
    private readonly videoService;
    constructor(videoService: VideoService);
    create(createVideoDto: any, files: Array<Express.Multer.File>): Promise<{
        message: string;
    }>;
    merge(videoId: string): Promise<{
        message: string;
        videoId: string;
        originalFileName: string;
        hlsPath: string;
    }>;
    stream(req: Request, res: Response): void;
}
