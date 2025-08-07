import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { LikeVideo } from '../../like-video/entities/like-video.entity';
import { VideoStatus } from '../../../enums/video-status';
import { Playlist } from '../../playlist/entities/playlist.entity';
import { Profile } from '../../profile/entities/profile.entity';
import { CommentVideo } from '../../comment-video/entities/comment-video.entity';
import { Category } from '../../category/entities/category.entity';

@Entity()
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  thumbnailPath: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('text', { nullable: true })
  aspectRatio: string; //

  @Column({ type: 'enum', enum: VideoStatus })
  status: VideoStatus; //

  // public private fields
  @Column('boolean')
  isPublic: boolean;

  @Column('int8', { default: 0 })
  viewCount: number;

  @ManyToOne(() => Profile, (profile) => profile.videos, {
    onDelete: 'CASCADE',
    eager: true,
  })
  profile: Profile;

  @OneToMany(() => LikeVideo, (like) => like.video)
  likes: LikeVideo[];

  @OneToMany(() => CommentVideo, (comment) => comment.video)
  comments: CommentVideo[];

  @ManyToMany(() => Category, (category) => category.videos)
  @JoinTable({ name: 'video_categories' })
  category: Category;

  @ManyToMany(() => Playlist, (playlist) => playlist.videos, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({ name: 'video_playlists' })
  playlists: Playlist[];

  @ManyToMany(() => Profile, (profile) => profile.historyVideos, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({ name: 'history_videos' })
  profiles: Profile[];
}
