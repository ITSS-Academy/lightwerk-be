import { Injectable } from '@nestjs/common';
import { CreateLikeVideoDto } from './dto/create-like-video.dto';
import { UpdateLikeVideoDto } from './dto/update-like-video.dto';

@Injectable()
export class LikeVideoService {
  create(createLikeVideoDto: CreateLikeVideoDto) {
    return 'This action adds a new likeVideo';
  }

  findAll() {
    return `This action returns all likeVideo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} likeVideo`;
  }

  update(id: number, updateLikeVideoDto: UpdateLikeVideoDto) {
    return `This action updates a #${id} likeVideo`;
  }

  remove(id: number) {
    return `This action removes a #${id} likeVideo`;
  }
}
