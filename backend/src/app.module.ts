import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AuthModule, TasksModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
