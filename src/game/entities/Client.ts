import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const PlayerSocket = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const socket = ctx.switchToHttp().getRequest();
    const player = {
      id: socket.id,
      authorized: socket.authorized,
      name: socket.name,
      userId: socket.userId,
      join: socket.join.bind(socket),
      emit: socket.emit.bind(socket),
      toRoom: (room: string, event: string, data: any) =>
        socket.to(room).emit(event, data),
    };
    if (socket.userId) player.userId = socket.userId;
    return player;
  },
);

export type Client = {
  id: string;
  name: string;
  authorized: boolean;
  userId?: number;
  join: (room: string) => void;
  emit: (event: string, data: any) => void;
  toRoom: (room: string, event: string, data: any) => void;
};
