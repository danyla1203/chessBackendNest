export enum Lobby {
  update = 'lobby:update',
}

export enum GameEnd {
  surrender = 'surrender',
  timeout = 'timeout',
  draw = 'draw',
  mate = 'mate',
  playerLeave = 'playerLeave',
}

export enum Game {
  pendingGame = 'game:pending-one',
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
  playerDiconnected = 'game:opponent-disconnected',
  playerReconected = 'game:player-reconnected',
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
