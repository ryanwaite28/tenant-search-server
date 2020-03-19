import {
  Router
} from 'express';
import * as cors from 'cors';

import { corsOptions } from '../chamber';

import { UsersController } from './users/controller';
import { HomeListingsController } from './home-listings/controller';
import { PasswordResetRequestsController } from './password-reset-requests/controller';
import { MiscController } from './misc-controller/controller';

export const MainController: Router = Router();

/** Mount Routers */

MainController.options(`*`, cors(corsOptions));

MainController.use(`/`, cors(corsOptions), MiscController);
MainController.use(`/passwords`, cors(corsOptions), PasswordResetRequestsController);
MainController.use(`/users`, cors(corsOptions), UsersController);
MainController.use(`/home-listings`, cors(corsOptions), HomeListingsController);
