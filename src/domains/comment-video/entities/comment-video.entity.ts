import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Video } from '../../video/entities/video.entity';
import { Profile } from '../../profile/entities/profile.entity';

@Entity()
export class CommentVideo {
  @PrimaryColumn()
  videoId: number;

  @PrimaryColumn()
  profileId: number;

  @ManyToOne(() => Video, video => video.comments, { onDelete: 'CASCADE' })
  video: Video;

  @ManyToOne(() => Profile, profile => profile.comments, { onDelete: 'CASCADE' })
  profile: Profile;

  @Column('text')
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
