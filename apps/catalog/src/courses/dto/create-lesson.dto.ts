import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Intro to message brokers' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Lesson body or markdown content.' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: 'https://videos.test.local/lesson-1' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  order!: number;
}
