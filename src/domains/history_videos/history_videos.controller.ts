import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HistoryVideosService } from './history_videos.service';
import { CreateHistoryVideoDto } from './dto/create-history_video.dto';
import { UpdateHistoryVideoDto } from './dto/update-history_video.dto';

@Controller('history-videos')
export class HistoryVideosController {
  constructor(private readonly historyVideosService: HistoryVideosService) {}

  @Post()
  create(@Body() createHistoryVideoDto: CreateHistoryVideoDto) {
    return this.historyVideosService.create(createHistoryVideoDto);
  }

  @Get()
  findAll() {
    return this.historyVideosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyVideosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHistoryVideoDto: UpdateHistoryVideoDto) {
    return this.historyVideosService.update(+id, updateHistoryVideoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyVideosService.remove(+id);
  }
}
