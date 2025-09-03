import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Playlist } from '../../playlist/entities/playlist.entity';
import { Video } from '../../video/entities/video.entity';

@Entity('video_playlists')
export class PlaylistVideo {
  @PrimaryColumn('uuid')
  playlistId: string;

  @PrimaryColumn('uuid')
  videoId: string;

  @ManyToOne(() => Playlist, (playlist) => playlist.videos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlistId' })
  playlist: Playlist;

  @ManyToOne(() => Video, (Video) => Video.playlists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'videoId' })
  video: Video;

  // @Column({ type: 'int', nullable: true })
  // order: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  createAt: Date;
}
