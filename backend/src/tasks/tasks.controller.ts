import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findOpen() {
    return this.tasksService.findOpen();
  }

  @Get('mine')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.tasksService.findMine(user.sub);
  }

  @Get('posted')
  findPosted(@CurrentUser() user: JwtPayload) {
    return this.tasksService.findPosted(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: JwtPayload) {
    return this.tasksService.create(user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.delete(id, user.sub);
  }

  @Patch(':id/claim')
  claim(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.claim(id, user.sub);
  }

  @Patch(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.complete(id, user.sub);
  }
}
