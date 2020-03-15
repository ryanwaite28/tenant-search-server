import {
  Router
} from 'express';

import { UsersController } from './users/controller';
import { HomeListingsController } from './home-listings/controller';

export const MainController: Router = Router();

/** Mount Routers */

MainController.use(`/users`, UsersController);
MainController.use(`/home-listings`, HomeListingsController);
