import { Request, Response } from 'express';
import {
  Router
} from 'express';

import { UsersController } from './users/controller';

export const MainController: Router = Router();

/** Mount Routers */

MainController.use(`/users`, UsersController);
