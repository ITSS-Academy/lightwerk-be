import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';
import { LikeVideo } from '../../like-video/entities/like-video.entity';
import { CommentVideo } from '../../comment-video/entities/comment-video.entity';
import { VideoStatus } from '../../../enums/video-status';
import { Playlist } from '../../playlist/entities/playlist.entity';

@Entity()
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  thumbnailPath: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('text')
  aspectRatio: string;

  @Column({ type: 'enum', enum: VideoStatus })
  status: VideoStatus;

  @OneToMany(() => LikeVideo, (like) => like.video)
  likes: LikeVideo[];

  @OneToMany(() => CommentVideo, (comment) => comment.video)
  comments: CommentVideo[];

  @ManyToMany(() => Playlist, (playlist) => playlist.videos, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  playlists: Playlist[];
}
