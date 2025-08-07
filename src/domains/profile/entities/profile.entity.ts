import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LikeVideo } from '../../like-video/entities/like-video.entity';
import { CommentVideo } from '../../comment-video/entities/comment-video.entity';
import { Playlist } from '../../playlist/entities/playlist.entity';
import { Video } from '../../video/entities/video.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  username: string;

  @Column('text')
  email: string;

  @Column('text', { nullable: true })
  avatarPath: string;

  // @Column('text')
  // coverPath: string;

  @OneToMany(() => Video, (video) => video.profile)
  videos: Video[];

  @Column('text', { nullable: true })
  bio: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => LikeVideo, (like) => like.profile, { onDelete: 'CASCADE' })
  likes: LikeVideo[];

  @OneToMany(() => CommentVideo, (comment) => comment.profile, {
    onDelete: 'CASCADE',
  })
  comments: CommentVideo[];

  @OneToMany(() => Playlist, (playlist) => playlist.profile, { cascade: true })
  playlists: Playlist[];

  @ManyToMany(() => Video, (video) => video.profiles)
  historyVideos: Video[];
}
