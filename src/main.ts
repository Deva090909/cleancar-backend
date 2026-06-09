import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // CORS — allow frontend on Vercel + localhost
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://cleancar-v13-deploy-amit.vercel.app',
      'https://cleancar-frontend.vercel.app',
      'https://249carwashing.genxa.in',
      ...(process.env.FRONTEND_URLS?.split(',') ?? []),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-city-id'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global serializer
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CleanCar 360° ERP API')
      .setDescription('Backend for CleanCar 360° — Multi-role car wash ERP')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication & session management')
      .addTag('Employees', 'Employee CRUD, HR, payroll')
      .addTag('Customers', 'Customer management')
      .addTag('Leads', 'Lead pipeline & CRM')
      .addTag('Subscriptions', 'Subscription lifecycle')
      .addTag('Jobs', 'Washer job execution')
      .addTag('Attendance', 'Attendance tracking')
      .addTag('Payroll', 'Payroll runs & salary')
      .addTag('Finance', 'Revenue, MRR, ledger')
      .addTag('Inventory', 'Stock & cloth tracking')
      .addTag('Incentives', 'V6 pool-based incentives')
      .addTag('GST', 'GST compliance & reports')
      .addTag('Complaints', 'Customer complaints')
      .addTag('Plans', 'Plan tier management')
      .addTag('Notifications', 'Push & in-app notifications')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log('📖  Swagger UI: http://localhost:3000/api/docs');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀  CleanCar backend running on http://localhost:${port}/api/v1`);
}

bootstrap();
