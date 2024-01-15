export enum Lobby {
  update = 'lobby:update',
}
export enum Game {
  created = 'game:created',
  init = 'game:init-data',
  start = 'game:start',
  shah = 'game:shah',
  mate = 'game:mate',
  end = 'game:end',
  draw = 'game:draw',
  rejectDraw = 'game:draw_rejected',
  addTime = 'game:add-time',
  timeTick = 'game:time',
  strike = 'game:strike',
  boardUpdate = 'game:board-update',
  message = 'game:chat-message',
  surrender = 'game:surrender',
  drawPurpose = 'game:draw_purpose',
  playerLeave = 'game:opponent-leave',
}

export enum User {
  anonymousToken = 'user:anon-token',
}

/**
 *
 * @param id
 * @returns string: game:{id}
 */
export const room = (id: number) => `game:${id}`;
