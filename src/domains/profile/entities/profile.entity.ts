import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LikeVideo } from '../../like-video/entities/like-video.entity';
import { CommentVideo } from '../../comment-video/entities/comment-video.entity';
import { Playlist } from '../../playlist/entities/playlist.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  username: string;

  @Column('text')
  email: string;

  @Column('text')
  avatarPath: string;

  @Column('text')
  coverPath: string;

  @Column('text')
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
}
