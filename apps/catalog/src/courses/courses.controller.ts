import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { SeedService } from './seed.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly seedService: SeedService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a course' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  findAll() {
    return this.coursesService.findAllCourses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course with its lessons' })
  async findOne(@Param('id') id: string) {
    const course = await this.coursesService.findCourseById(id);
    const lessons = await this.coursesService.findLessonsByCourse(id);
    return { ...course.toJSON(), lessons };
  }

  @Post(':id/lessons')
  @ApiOperation({
    summary: 'Add a lesson to a course (publishes lecture.created)',
  })
  addLesson(@Param('id') id: string, @Body() dto: CreateLessonDto) {
    return this.coursesService.addLesson(id, dto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed demo courses (dev only, idempotent)' })
  seed() {
    return this.seedService.seed();
  }
}
