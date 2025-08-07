import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Video } from '../../video/entities/video.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @ManyToMany(() => Video, (video) => video.category, {
    onDelete: 'CASCADE',
  })
  videos: Video[];
}
