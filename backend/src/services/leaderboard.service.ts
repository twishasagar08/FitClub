import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getLeaderboard(): Promise<User[]> {
    return await this.usersRepository.find({
      order: { totalSteps: 'DESC' },
    });
  }
}
