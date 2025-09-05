import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Video } from '../../video/entities/video.entity';
import { Profile } from '../../profile/entities/profile.entity';

@Entity('history_videos')
export class HistoryVideo {
  // @PrimaryGeneratedColumn('uuid')
  // id: string;
  @PrimaryColumn()
  videoId: number;

  @PrimaryColumn()
  profileId: number;

  @ManyToOne(() => Video, (video) => video.likes, { onDelete: 'CASCADE' })
  video: Video;

  @ManyToOne(() => Profile, (profile) => profile.likes, { onDelete: 'CASCADE' })
  profile: Profile;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
