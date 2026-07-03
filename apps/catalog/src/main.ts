import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { QUEUES } from '@learn-flow/contracts';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // RabbitMQ consumer: payment.completed events land on the catalog queue.
  // Durable queue + manual ack so events survive broker/service restarts.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
      queue: QUEUES.CATALOG,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Catalog Service')
    .setDescription('Courses and lessons for the mini e-learning platform')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.startAllMicroservices();
  const port = process.env.CATALOG_PORT ?? 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Catalog service: http://localhost:${port}/api (docs at /api/docs)`,
  );
}

bootstrap();
