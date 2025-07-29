import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Video } from '../../video/entities/video.entity';

@Entity()
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  thumbnailPath: string;

  @ManyToOne(() => Profile, (profile) => profile.playlists)
  @JoinColumn()
  profile: Profile;

  @ManyToMany(() => Video, (video) => video.playlists)
  @JoinTable()
  videos: Video[];
}
