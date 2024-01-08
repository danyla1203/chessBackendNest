import { Test } from '@nestjs/testing';
import { GameService } from '../game.service';
import { GameList } from '../game.list';
import { GameModel } from '../model';
import { PrismaService } from '../../prisma.service';
import {
  generateClient,
  generateConfig,
  generateGameResult,
  generatePlayer,
  getFigureCellState,
} from './generators';
import { Config, Game } from '../entities/game';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { Client, Player } from '../entities';
import { TokenService } from '../../auth';
import { Anonymous } from '../entities/Anonymous';

jest.mock('../../auth');

describe('GameService (unit)', () => {
  let service: GameService;
  let model: GameModel;
  let list: GameList;
  let cl1: Client;
  let cl2: Client;
  let pl1: Player;
  let pl2: Player;
  let cnf: Config;
  let gm: Game;
  let tokenService: TokenService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameList,
        GameService,
        GameModel,
        PrismaService,
        TokenService,
      ],
    }).compile();
    service = moduleRef.get(GameService);
    tokenService = moduleRef.get(TokenService);
    model = moduleRef.get(GameModel);
    list = moduleRef.get(GameList);

    cl1 = generateClient(true, faker.number.int());
    cl2 = generateClient(true, faker.number.int());
    cnf = generateConfig('w');
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    gm = new Game(cl1, cnf, () => {});
    gm.addPlayer(cl2);
    pl1 = gm.players[0];
    pl2 = gm.players[1];
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('anonymousUser', () => {
    jest.spyOn(tokenService, 'anonymousToken').mockImplementationOnce(() => {
      return {
        token: 'string',
        exp: 'exp',
      };
    });
    const expected = new Anonymous('string', 'exp');
    expect(service.anonymousUser(12345)).toEqual(expected);
  });
  it('removeGameInLobby - should call list.removeGameFromLobbyByPlayer', () => {
    const cl = generateClient();
    const mock = jest.spyOn(list, 'removeGameFromLobbyByPlayer');
    service.removeGameInLobby(cl);
    expect(mock).toBeCalledWith(cl);
  });
  describe('injecableSaveGame', () => {
    let saveDrawMock;
    let saveGameWithWinnerMock;
    beforeEach(() => {
      saveDrawMock = jest.spyOn(model, 'saveDraw').mockImplementation();
      saveGameWithWinnerMock = jest
        .spyOn(model, 'saveGameWithWinner')
        .mockImplementation();
    });
    it('shouldnt save game if one of the players is unauthorized', () => {
      const pl1 = generatePlayer('w', false);
      const pl2 = generatePlayer('b', true);
      const result = generateGameResult();
      expect(
        service['injectableSaveGame'](pl1, pl2, result),
      ).resolves.toBeNull();
      expect(
        service['injectableSaveGame'](pl1, pl2, result, true),
      ).resolves.toBeNull();

      pl2.authorized = false;
      expect(
        service['injectableSaveGame'](pl1, pl2, result),
      ).resolves.toBeNull();
      expect(
        service['injectableSaveGame'](pl1, pl2, result, true),
      ).resolves.toBeNull();

      pl1.authorized = true;
      expect(
        service['injectableSaveGame'](pl1, pl2, result),
      ).resolves.toBeNull();
      expect(
        service['injectableSaveGame'](pl1, pl2, result, true),
      ).resolves.toBeNull();
    });
    it('if saving with winner method should call model.saveGameWithWinner', () => {
      const pl1 = generatePlayer('w', true);
      const pl2 = generatePlayer('b', true);
      const result = generateGameResult();
      service['injectableSaveGame'](pl1, pl2, result, true);

      expect(saveGameWithWinnerMock).toBeCalledWith({
        ...result,
        winner: pl1,
        looser: pl2,
      });
    });
    it('if saving draw method should call model.saveDraw', () => {
      const pl1 = generatePlayer('w', true);
      const pl2 = generatePlayer('b', true);
      const result = generateGameResult();
      service['injectableSaveGame'](pl1, pl2, result);

      expect(saveDrawMock).toBeCalledWith({
        ...result,
        pl1,
        pl2,
      });
    });
  });
  describe('createGame', () => {
    it('should create and return game entity, add it to lobby', () => {
      const pl = generateClient();
      const cnf = generateConfig();
      const addGameToLobbyMock = jest
        .spyOn(list, 'addGameToLobby')
        .mockImplementation();
      const gm = service.createGame(pl, cnf);
      expect(gm).toBeInstanceOf(Game);
      expect(addGameToLobbyMock).toBeCalledWith(gm);
    });
  });
  describe('connectToGame', () => {
    it('should throw not found if game isnt in lobby', () => {
      const cl = generateClient();
      jest.spyOn(list, 'findInLobby').mockImplementation(() => null);
      expect(() => service.connectToGame(cl, -1)).toThrow(
        new NotFoundException('Game not found'),
      );
    });
    it('should throw err if client already in game', () => {
      jest.spyOn(list, 'findInLobby').mockImplementation(() => gm);
      expect(() => service.connectToGame(cl1, gm.id)).toThrow(
        new ConflictException('You are already in game'),
      );
    });
    it('should add player and remove game from lobby on successfull connect', () => {
      gm.addPlayer = jest.fn();
      jest.spyOn(list, 'findInLobby').mockImplementation(() => gm);
      const remove = jest
        .spyOn(list, 'removeGameFromLobby')
        .mockImplementation();

      expect(service.connectToGame(cl2, gm.id)).toStrictEqual(gm);
      expect(gm.addPlayer).toBeCalledWith(cl2);
      expect(remove).toBeCalledWith(gm.id);
    });
  });
  describe('findGameById', () => {
    afterEach(() => {
      list.games = [];
    });
    it('should throw not found err if game not found', () => {
      expect(() => service.findGameById(-1)).toThrow(
        new NotFoundException('Game not found'),
      );
    });
    it('should return game', () => {
      list.games.push(gm);
      expect(service.findGameById(gm.id)).toStrictEqual(gm);
    });
  });
  describe('getActualGameState', () => {
    it('should return game of state in plain object format', () => {
      expect(service.getActualGameState(gm)).toStrictEqual(
        getFigureCellState(),
      );
    });
  });
  describe('surrender', () => {
    it('should call game.end with winner and return result', async () => {
      jest.spyOn(gm, 'endGame').mockImplementation();
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
      expect(service.surrender(gm.id, cl1)).resolves.toStrictEqual({
        winner: pl2,
        looser: pl1,
        game: gm,
      });
      expect(gm.endGame).toBeCalledWith(pl2, pl1);
    });
  });
  describe('purposeDraw', () => {
    beforeEach(() => {
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
    });
    afterEach(() => {
      gm.draw = {
        w: false,
        b: false,
      };
    });
    it('should throw Conflict err if draw already set by user', () => {
      gm.draw = {
        w: true,
        b: false,
      };
      expect(() => service.purposeDraw(gm.id, cl1)).toThrow(
        new ConflictException('Draw purpose already set'),
      );
    });
    it('purpose draw from client (white side)', () => {
      expect(service.purposeDraw(gm.id, cl1)).toStrictEqual({
        w: true,
        b: false,
      });
    });
    it('purpose draw from client (black side)', () => {
      expect(service.purposeDraw(gm.id, cl2)).toStrictEqual({
        w: false,
        b: true,
      });
    });
  });
  describe('acceptDraw', () => {
    it('should throw Conflic err if draw purpose wasnt send', async () => {
      gm.draw = { w: false, b: false };
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
      expect(service.acceptDraw(gm.id, cl2)).rejects.toThrow(
        new ConflictException('Draw purpose wasnt set'),
      );
    });
    it('should set draw purpose and end the game', async () => {
      gm.draw = { w: true, b: false };
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
      jest.spyOn(gm, 'setDrawPurposeFrom').mockImplementation();
      jest.spyOn(gm, 'endGameByDraw').mockImplementation();
      expect(service.acceptDraw(gm.id, cl1)).resolves.toStrictEqual({
        w: true,
        b: true,
      });
      expect(gm.endGameByDraw).toBeCalled();
    });
  });
  describe('reject draw', () => {
    it('should throw conflict err if draw purpose wasnt set', () => {
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
      expect(() => service.rejectDraw(gm.id)).toThrow(
        new ConflictException('Draw purpose wasnt set'),
      );
    });
    it('should reject draw and sent result', () => {
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
      jest.spyOn(gm, 'rejectDraw').mockImplementation();
      gm.draw = {
        w: true,
        b: false,
      };
      expect(service.rejectDraw(gm.id)).toStrictEqual({
        w: false,
        b: false,
      });
      expect(gm.rejectDraw).toBeCalled();
    });
  });
  describe('addTime', () => {
    beforeEach(() => {
      jest.spyOn(service, 'findGameById').mockImplementationOnce(() => gm);
    });
    it('should add time and return updated times', () => {
      const pl1Copy = { ...pl1 };
      const pl2Copy = { ...pl2 };
      expect(service.addTimeToAnotherPlayer(gm.id, cl1)).toStrictEqual({
        [pl1.side]: pl1Copy.time,
        [pl2.side]: pl2Copy.time + gm.config.timeIncrement,
      });
    });
  });
});
