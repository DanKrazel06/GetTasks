import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Post('impersonate/:id')
  @HttpCode(HttpStatus.OK)
  impersonate(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.impersonate(id);
  }
}
