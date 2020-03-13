import { Request } from 'express';
import { Server } from 'socket.io';

export interface IRequest extends Request {
  io: Server;
  session: { [key: string]: any };
  device: { [key: string]: any };
}
