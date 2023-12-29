import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { AuthGuard } from '../auth';
import { LoggerService } from '../tools/logger';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private logger: LoggerService,
  ) {}

  @Post('/signup')
  signUp(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Create user', 'UserController');
    return this.userService.create(createUserDto);
  }

  @Get('')
  @UseGuards(AuthGuard)
  findOne(@Request() req) {
    this.logger.log('Get user profile', 'UserController');
    return this.userService.profile(req.user.id);
  }

  @Get('/games')
  @UseGuards(AuthGuard)
  findGames(@Request() req) {
    this.logger.log('Get user games', 'UserController');
    return this.userService.games(req.user.id);
  }

  @Patch('')
  @UseGuards(AuthGuard)
  update(@Request() { user }, @Body() updateUserDto: UpdateUserDto) {
    this.logger.log('Update user profile', 'UserController');
    return this.userService.update(user.id, updateUserDto);
  }
}
