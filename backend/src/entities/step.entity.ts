import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../entities/user.entity';

@Entity('step_records')
export class StepRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  steps: number;

  @ManyToOne(() => User, (user) => user.stepRecords)
  @JoinColumn({ name: 'userId' })
  user: User;
}
