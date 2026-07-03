import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS Microservices' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Event-driven architecture with RabbitMQ.' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'instructor-1' })
  @IsString()
  instructorId!: string;

  @ApiProperty({ example: 'instructor@test.local' })
  @IsEmail()
  instructorEmail!: string;
}
