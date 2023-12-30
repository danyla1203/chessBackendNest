export enum Lobby {
  update = 'lobby:update',
}
export enum Game {
  created = 'game:created',
  init = 'game:init-data',
  start = 'game:start',
  shah = 'game:shah',
  mate = 'game:mate',
  draw = 'game:draw',
  rejectDraw = 'game:draw_rejected',
  addTime = 'game:time',
  strike = 'game:strike',
  boardUpdate = 'game:board-update',
  message = 'game:chate-message',
  surrender = 'game:surrender',
  drawPurpose = 'game:draw_purpose',
}
/**
 *
 * @param id
 * @returns string: game:{id}
 */
export const room = (id: number) => `game:${id}`;
