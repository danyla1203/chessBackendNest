import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserModel } from './model';
import { AuthService } from 'src/auth';

@Injectable()
export class UserService {
  constructor(
    private readonly model: UserModel,
    private readonly authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const confirmation = await this.model.findConfirmation(createUserDto.email);
    if (!confirmation) throw new ConflictException('Confirm email first');

    const user = await this.model.findProfileByEmail(createUserDto.email);
    if (user) throw new ConflictException('User already exists');

    const userRecord = await this.model.createUser(createUserDto);

    return this.authService.createSession(
      userRecord.id,
      createUserDto.deviceId,
    );
  }

  profile(id: number) {
    return this.model.findProfile(id);
  }

  async games(id: number) {
    return { games: await this.model.findUserGames(id) };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.model.updateUser(id, updateUserDto.name);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
