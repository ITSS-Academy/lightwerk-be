"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoController = void 0;
const common_1 = require("@nestjs/common");
const video_service_1 = require("./video.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const fs = require("fs");
const path = require("path");
const promises_1 = require("stream/promises");
const hls_converter_1 = require("../../utils/hls-converter");
let VideoController = class VideoController {
    videoService;
    constructor(videoService) {
        this.videoService = videoService;
    }
    async create(createVideoDto, files) {
        const videoId = createVideoDto.videoId;
        const nameDir = `public/assets/chunks/${videoId}`;
        if (!fs.existsSync(nameDir)) {
            fs.mkdirSync(nameDir);
        }
        fs.cpSync(files[0].path, `${nameDir}/${createVideoDto.videoName}`);
        fs.rmSync(files[0].path);
        return await this.videoService.create(createVideoDto, files);
    }
    async merge(videoId) {
        const nameDir = `public/assets/chunks/${videoId}`;
        if (!fs.existsSync(nameDir)) {
            throw new common_1.BadRequestException('Video chunks directory does not exist');
        }
        const files = fs.readdirSync(nameDir)
            .filter(f => f.endsWith('.mp4') || f.includes('.part'))
            .sort((a, b) => {
            const aIndex = parseInt(a.split('.part')[1] || '0', 10);
            const bIndex = parseInt(b.split('.part')[1] || '0', 10);
            return aIndex - bIndex;
        });
        if (files.length === 0) {
            throw new common_1.BadRequestException('No video chunks found to merge');
        }
        const originalFileName = files[0].split('.part')[0];
        const mergedFilePath = `public/assets/videos/${videoId}/${originalFileName}`;
        fs.mkdirSync(`public/assets/videos/${videoId}`, { recursive: true });
        const writeStream = fs.createWriteStream(mergedFilePath);
        for (const file of files) {
            const filePath = `${nameDir}/${file}`;
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(writeStream, { end: false });
            await (0, promises_1.finished)(readStream);
        }
        writeStream.end();
        console.log('mergedFilePath =', mergedFilePath, 'exists =', fs.existsSync(mergedFilePath));
        await (0, hls_converter_1.encodeHLSWithMultipleVideoStreams)(mergedFilePath);
        return {
            message: 'Video chunks merged successfully',
            videoId,
            originalFileName,
            hlsPath: path.join('public', 'assets', 'videos', videoId, 'master.m3u8'),
        };
    }
    stream(req, res) {
        const videoPath = 'public/assets/videos/f1a80699-7df4-4d51-9fcf-732329bf002f/Phép Màu (Đàn Cá Gỗ OST) - Mounter x MAYDAYs, Minh Tốc _ Official MV.mp4';
        if (!fs.existsSync(videoPath)) {
            throw new common_1.BadRequestException('Video file does not exist');
        }
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (!range) {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });
            fs.createReadStream(videoPath).pipe(res);
        }
        else {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            if (start >= fileSize || end >= fileSize) {
                res.status(416).send('Requested range not satisfiable');
                return;
            }
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            });
            file.pipe(res);
        }
    }
};
exports.VideoController = VideoController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, {
        storage: (0, multer_1.diskStorage)({
            destination: './public/assets/videos',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileName = `${file.fieldname}-${uniqueSuffix}.${file.originalname.split('.').pop()}`;
                cb(null, fileName);
            }
        }),
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('merge'),
    __param(0, (0, common_1.Query)('videoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "merge", null);
__decorate([
    (0, common_1.Get)('stream'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VideoController.prototype, "stream", null);
exports.VideoController = VideoController = __decorate([
    (0, common_1.Controller)('video'),
    __metadata("design:paramtypes", [video_service_1.VideoService])
], VideoController);
//# sourceMappingURL=video.controller.js.map