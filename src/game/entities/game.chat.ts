import { Client } from './Client';

export type Message = {
  id: number;
  text: string;
  author: {
    id: string;
    name: string;
  };
  date: Date;
};

export class GameChat {
  messages: Message[] = [];

  addMessage(message: string, { id, name }: Client) {
    const messageObj = {
      id: Math.floor(Math.random() * 100000),
      text: message,
      author: { id, name },
      date: new Date(),
    };
    this.messages.push(messageObj);
    return messageObj;
  }
}
