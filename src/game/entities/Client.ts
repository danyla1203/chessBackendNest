import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const PlayerSocket = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const socket = ctx.switchToHttp().getRequest();
    return {
      id: socket.id,
      name: socket.name,
      join: socket.join.bind(socket),
      emit: socket.emit.bind(socket),
      toRoom: (room: string, event: string, data: any) =>
        socket.to(room).emit(event, data),
    };
  },
);

export type Client = {
  id: string;
  name: string;
  join: (room: string) => void;
  emit: (event: string, data: any) => void;
  toRoom: (room: string, event: string, data: any) => void;
};
