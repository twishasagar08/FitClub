import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      order: { name: "ASC" },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateTotalSteps(userId: string, steps: number): Promise<User> {
    const user = await this.findOne(userId);
    user.totalSteps += steps;
    return await this.usersRepository.save(user);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async updateGoogleTokens(
    userId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<User> {
    const user = await this.findOne(userId);
    user.googleAccessToken = accessToken;
    user.googleRefreshToken = refreshToken;
    return await this.usersRepository.save(user);
  }

  /**
   * Finds all users who have connected their Google Fit account
   * (users with a valid refresh token)
   */
  async findUsersWithGoogleFit(): Promise<User[]> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .where('user.googleRefreshToken IS NOT NULL')
      .andWhere("user.googleRefreshToken != ''")
      .getMany();
  }

  /**
   * Updates only the Google access token for a user
   * Used after refreshing an expired token
   */
  async updateTokens(userId: string, newAccessToken: string): Promise<User> {
    const user = await this.findOne(userId);
    user.googleAccessToken = newAccessToken;
    return await this.usersRepository.save(user);
  }

  /**
   * Increments the user's total steps
   * Used when syncing daily steps
   */
  async addToTotalSteps(userId: string, steps: number): Promise<User> {
    const user = await this.findOne(userId);
    user.totalSteps += steps;
    return await this.usersRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return await this.usersRepository.save(user);
  }
}
