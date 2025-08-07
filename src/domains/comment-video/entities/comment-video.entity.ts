import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Video } from '../../video/entities/video.entity';

@Entity()
export class CommentVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.comments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  profile: Profile;

  @ManyToOne(() => Video, (video) => video.comments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  video: Video;

  @Column('text')
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
