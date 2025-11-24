import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(@Req() req) {
    // Initiates the Google OAuth2 flow
    // The AuthGuard will automatically use the strategy config with:
    // - prompt: 'select_account consent'
    // - accessType: 'offline'
    // This forces Google to show the account picker
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      const user = await this.authService.handleGoogleLogin(req.user);

      // Redirect to frontend dashboard with user info
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/dashboard?success=true&userId=${user.id}&name=${encodeURIComponent(user.name)}`,
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/dashboard?success=false&error=${encodeURIComponent(error.message)}`,
      );
    }
  }
}
