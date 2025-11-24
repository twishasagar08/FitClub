import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from '../services/users.service';
import { StepsService } from '../services/steps.service';
import { GoogleFitService } from '../services/google-fit.service';

@Injectable()
export class StepSyncService {
  private readonly logger = new Logger(StepSyncService.name);

  constructor(
    private usersService: UsersService,
    private stepsService: StepsService,
    private googleFitService: GoogleFitService,
  ) {}

  /**
   * Runs every midnight (00:00) to fetch yesterday's steps for all users
   * Cron expression: '0 0 * * *'
   * Format: minute hour day month weekday
   */
  @Cron('0 0 * * *')
  async syncAllUsersSteps() {
    this.logger.log('🚀 Starting daily step sync for all users...');
    this.logger.log(`Current time: ${new Date().toISOString()}`);

    try {
      // Fetch only users who have connected Google Fit (have refresh token)
      const users = await this.usersService.findUsersWithGoogleFit();

      this.logger.log(
        `Found ${users.length} users with Google Fit connected`,
      );

      if (users.length === 0) {
        this.logger.warn('No users with Google Fit to sync');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          this.logger.log(`Syncing steps for user: ${user.name} (${user.email})`);

          // Fetch yesterday's steps with automatic token refresh
          const steps = await this.googleFitService.fetchYesterdaySteps(user);

          this.logger.log(
            `Fetched ${steps} steps for user ${user.name}`,
          );

          // Save the step record for yesterday
          await this.stepsService.saveDailySteps(user.id, steps);

          this.logger.log(
            `✅ Successfully synced ${steps} steps for user: ${user.name}`,
          );
          successCount++;
        } catch (error) {
          this.logger.error(
            `❌ Failed to sync steps for user ${user.name} (${user.email}): ${error.message}`,
          );
          this.logger.error(`Error stack: ${error.stack}`);
          errorCount++;

          // Check if it's a token issue
          if (error.status === 401) {
            this.logger.error(
              `User ${user.name} may need to re-authenticate with Google`,
            );
          }
        }
      }

      this.logger.log('🎉 Daily step sync completed');
      this.logger.log(`Summary: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      this.logger.error(`❌ Daily step sync failed: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
    }
  }

  /**
   * Manual trigger for syncing all users (useful for testing)
   * Can be called from a controller endpoint
   */
  async manualSyncAllUsers() {
    this.logger.log('Manual sync triggered');
    await this.syncAllUsersSteps();
  }

  /**
   * Sync steps for a specific user
   */
  async syncUserSteps(userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);

    if (!user.googleRefreshToken) {
      throw new Error('User does not have Google Fit connected');
    }

    this.logger.log(`Manual sync for user: ${user.name}`);

    const steps = await this.googleFitService.fetchYesterdaySteps(user);
    await this.stepsService.saveDailySteps(user.id, steps);

    this.logger.log(`Successfully synced ${steps} steps for ${user.name}`);
  }
}
