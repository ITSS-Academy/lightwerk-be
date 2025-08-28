import { Injectable } from '@nestjs/common';
import { CreateHistoryVideoDto } from './dto/create-history_video.dto';
import { UpdateHistoryVideoDto } from './dto/update-history_video.dto';

@Injectable()
export class HistoryVideosService {
  create(createHistoryVideoDto: CreateHistoryVideoDto) {
    return 'This action adds a new historyVideo';
  }

  findAll() {
    return `This action returns all historyVideos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} historyVideo`;
  }

  update(id: number, updateHistoryVideoDto: UpdateHistoryVideoDto) {
    return `This action updates a #${id} historyVideo`;
  }

  remove(id: number) {
    return `This action removes a #${id} historyVideo`;
  }
}
