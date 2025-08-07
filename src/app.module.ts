import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { AuthMiddleware } from './middlwares/auth/auth.middleware';
import { CommentVideoModule } from './domains/comment-video/comment-video.module';
import { CategoryModule } from './domains/category/category.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(AuthMiddleware).forRoutes('*');
//   }
// }
export class AppModule {}
