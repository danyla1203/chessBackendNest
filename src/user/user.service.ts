import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserModel } from './model';
import { AuthService, Tokens } from '../auth';

@Injectable()
export class UserService {
  constructor(
    private readonly model: UserModel,
    private readonly authService: AuthService,
  ) {}

  public async create(createUserDto: CreateUserDto): Promise<Tokens> {
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

  public profile(id: number) {
    return this.model.findProfile(id);
  }

  public async games(id: number) {
    return { games: await this.model.findUserGames(id) };
  }

  public update(id: number, updateUserDto: UpdateUserDto) {
    return this.model.updateUser(id, updateUserDto.name);
  }
}
