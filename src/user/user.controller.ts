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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('')
  @UseGuards(AuthGuard)
  findOne(@Request() req) {
    return this.userService.profile(req.user.id);
  }

  @Get('/games')
  @UseGuards(AuthGuard)
  findGames(@Request() req) {
    return this.userService.games(req.user.id);
  }

  @Patch('')
  @UseGuards(AuthGuard)
  update(@Request() { user }, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(user.id, updateUserDto);
  }
}
