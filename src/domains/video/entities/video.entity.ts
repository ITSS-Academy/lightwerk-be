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
import { HistoryVideo } from '../../history_videos/entities/history_video.entity';
import { PlaylistVideo } from '../../playlist_videos/entities/playlist_video.entity';

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

  @Column('text', { nullable: true })
  width: string;

  @Column('text', { nullable: true })
  height: string;

  @Column({ type: 'enum', enum: VideoStatus })
  status: VideoStatus; //

  // public private fields
  @Column('boolean')
  isPublic: boolean;

  @Column('int', { default: 0 })
  viewCount: number;

  @Column('float', { nullable: true })
  duration: number;

  @ManyToOne(() => Profile, (profile) => profile.videos, {
    onDelete: 'CASCADE',
    eager: true,
  })
  profile: Profile;

  @OneToMany(() => LikeVideo, (like) => like.video)
  likes: LikeVideo[];

  @OneToMany(() => CommentVideo, (comment) => comment.video)
  comments: CommentVideo[];

  @ManyToOne(() => Category, (category) => category.videos)
  category: Category;

  @OneToMany(() => PlaylistVideo, (playlist) => playlist.video, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  playlists: PlaylistVideo[];

  @OneToMany(() => HistoryVideo, (history) => history.video, {
    cascade: true,
  })
  history: HistoryVideo[];
}
