import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Payment } from '../enrollments/entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5433),
      username: process.env.POSTGRES_USER ?? 'learnflow',
      password: process.env.POSTGRES_PASSWORD ?? 'learnflow',
      database: process.env.POSTGRES_DB ?? 'enrollment',
      entities: [Enrollment, Payment],
      // Demo convenience — a real deployment would use migrations.
      synchronize: true,
    }),
    EnrollmentsModule,
  ],
})
export class AppModule {}
