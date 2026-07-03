import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 'user-1' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 'test.user@test.local' })
  @IsEmail()
  userEmail!: string;

  @ApiProperty({ example: '665f1c2e8b3e4a0012345678' })
  @IsString()
  courseId!: string;

  @ApiProperty({ example: 49.99, description: 'Course price to charge' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Forces the mock payment to fail (demo hook)',
  })
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
