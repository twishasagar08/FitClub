import { Controller, Get } from '@nestjs/common';
import { LeaderboardService } from '../services/leaderboard.service';
import { User } from '../entities/user.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(): Promise<User[]> {
    return await this.leaderboardService.getLeaderboard();
  }
}
