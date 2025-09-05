import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Video } from '../../video/entities/video.entity';
import { PlaylistVideo } from '../../playlist_videos/entities/playlist_video.entity';

@Entity()
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  thumbnailPath: string;

  @Column('boolean', { default: true })
  isPublic: boolean;

  @ManyToOne(() => Profile, (profile) => profile.playlists)
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => PlaylistVideo, (playlistVideo) => playlistVideo.playlist)
  videos: Video[];
}
