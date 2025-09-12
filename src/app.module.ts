import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VideoModule } from './domains/video/video.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LikeVideoModule } from './domains/like-video/like-video.module';
import { ProfileModule } from './domains/profile/profile.module';
import { PlaylistModule } from './domains/playlist/playlist.module';
import { CommentVideoModule } from './domains/comment-video/comment-video.module';
import { CategoryModule } from './domains/category/category.module';
import { HistoryVideosModule } from './domains/history_videos/history_videos.module';
import { PlaylistVideosModule } from './domains/playlist_videos/playlist_videos.module';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') || '6543', 10),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    VideoModule,
    LikeVideoModule,
    ProfileModule,
    CommentVideoModule,
    PlaylistModule,
    CategoryModule,
    HistoryVideosModule,
    PlaylistVideosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {
    console.log('v1');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      {
        path: 'video/merge',
        method: RequestMethod.POST,
      },
      {
        path: 'video/likes/comments/*',
        method: RequestMethod.GET,
      },
      {
        path: 'video/recommendations-based-on-history',
        method: RequestMethod.GET,
      },
      {
        path: 'video/following-videos',
        method: RequestMethod.GET,
      },
      {
        path: 'video/*',
        method: RequestMethod.DELETE,
      },
      {
        path: 'video/update-info',
        method: RequestMethod.PUT,
      },
      {
        path: 'playlist/*',
        method: RequestMethod.POST,
      },
      {
        path: 'playlist/*',
        method: RequestMethod.DELETE,
      },
      {
        path: 'playlist/*',
        method: RequestMethod.PUT,
      },

      {
        path: 'like-video/*',
        method: RequestMethod.POST,
      },
      {
        path: 'like-video/*',
        method: RequestMethod.DELETE,
      },
      {
        path: 'comment-video/*',
        method: RequestMethod.POST,
      },
    );
  }
}

// export class AppModule {}
