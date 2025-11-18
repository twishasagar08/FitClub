import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../services/users.service';
import { StepsService } from '../services/steps.service';

@Injectable()
export class StepSyncService {
  private readonly logger = new Logger(StepSyncService.name);

  constructor(
    private usersService: UsersService,
    private stepsService: StepsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncAllUsersSteps() {
    this.logger.log('Starting daily step sync for all users...');

    try {
      const users = await this.usersService.findAll();

      for (const user of users) {
        if (user.googleAccessToken) {
          try {
            await this.stepsService.syncFromGoogleFit(user.id);
            this.logger.log(`Successfully synced steps for user: ${user.name}`);
          } catch (error) {
            this.logger.error(
              `Failed to sync steps for user ${user.name}: ${error.message}`,
            );
          }
        } else {
          this.logger.warn(
            `Skipping user ${user.name} - no Google Fit access token`,
          );
        }
      }

      this.logger.log('Daily step sync completed');
    } catch (error) {
      this.logger.error(`Daily step sync failed: ${error.message}`);
    }
  }
}
