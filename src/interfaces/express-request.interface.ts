import { Request } from 'express';
import { Server } from 'socket.io';
import { IUserModel } from './user-model.interface';

export interface IRequest extends Request {
  io: Server;
  session: {
    // id: string;
    // you: IUserModel;
    [key: string]: any;
  };
  device: { [key: string]: any; };
}
