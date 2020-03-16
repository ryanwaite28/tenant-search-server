import {
  Router
} from 'express';
import * as cors from 'cors';

import { corsOptions } from '../chamber';
import { UsersController } from './users/controller';
import { HomeListingsController } from './home-listings/controller';

export const MainController: Router = Router();

/** Mount Routers */

MainController.options('*', cors(corsOptions));
MainController.use('/', cors(corsOptions));

MainController.use(`/users`, UsersController);
MainController.use(`/home-listings`, HomeListingsController);
