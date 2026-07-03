import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { QUEUES } from '@learn-flow/contracts';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  // RabbitMQ consumer: lecture.created events land on the notification queue.
  // Durable queue + manual ack; the whole batch (all students + instructor
  // summary) completes before the message is acked → at-least-once delivery.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
      queue: QUEUES.NOTIFICATION,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription('Mock email notifications; log exposed for the demo UI')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.startAllMicroservices();
  const port = process.env.NOTIFICATION_PORT ?? 3003;
  await app.listen(port);
  Logger.log(
    `🚀 Notification service: http://localhost:${port}/api (docs at /api/docs)`,
  );
}

bootstrap();
