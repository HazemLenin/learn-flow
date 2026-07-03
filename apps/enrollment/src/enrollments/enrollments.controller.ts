import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Buy a course: creates enrollment, processes mock payment, returns final status',
  })
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(dto);
  }

  @Get()
  @ApiOperation({ summary: "List a user's enrollments" })
  @ApiQuery({ name: 'userId', example: 'user-1' })
  findByUser(@Query('userId') userId: string) {
    return this.enrollmentsService.findByUser(userId);
  }
}
