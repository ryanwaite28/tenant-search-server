import * as express from 'express';

import * as GET from './methods/get';
import * as POST from './methods/post';
import * as PUT from './methods/put';
import * as DELETE from './methods/delete';
import { SessionRequired } from '../../chamber';


export const UsersController: express.Router = express.Router();

/** GET routes */

UsersController.get('/check_session', GET.check_session);
UsersController.get('/sign_out', GET.sign_out);


/** POST routes */

UsersController.post('/', POST.sign_up);

/** PUT routes */

UsersController.put('/', PUT.sign_in);
UsersController.put('/:id/settings', SessionRequired, PUT.update_profile_settings);
UsersController.put('/:id/icon', SessionRequired, PUT.update_profile_icon);

/** DELETE routes */

