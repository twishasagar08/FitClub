import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StepRecord } from '../entities/step.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  googleAccessToken: string;

  @Column({ nullable: true })
  googleRefreshToken: string;

  @Column({ default: 0 })
  totalSteps: number;

  @OneToMany(() => StepRecord, (stepRecord) => stepRecord.user)
  stepRecords: StepRecord[];
}
