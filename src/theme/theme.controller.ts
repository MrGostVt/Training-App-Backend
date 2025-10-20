import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { Access } from 'src/common/decorators/access.decorator';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';
import { ThemeDTO } from './dto/theme.dto';
import { User } from 'src/common/decorators/user.decorator';
import { GenerationPatternDTO } from '../common/dto/generation-pattern.dto';


@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Auth()
  @Access(AccessLevel.Admin)
  @Post('create')
  async create(@Body() theme: ThemeDTO){
    return await this.themeService.create(theme);
  }

  @Auth()
  @Access(AccessLevel.Default)
  @Post('get')
  async get(@User('passport') passport: string){
    return await this.themeService.get(passport);
  }
}
