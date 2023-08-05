import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const PlayerSocket = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const socket = ctx.switchToHttp().getRequest();
    return {
      id: socket.id,
      name: socket.name,
      join: socket.join.bind(socket),
      emit: socket.emit.bind(socket),
    };
  },
);

export type Client = {
  id: string;
  name: string;
  join: (room: string) => void;
  emit: (event: string, data: any) => void;
};
