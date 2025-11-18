import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateStepDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(0)
  steps: number;
}
