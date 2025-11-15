import { Controller, Get } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { User } from '../users/user.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(): Promise<User[]> {
    return await this.leaderboardService.getLeaderboard();
  }
}
