import { Request, Response } from 'express';
import { Router } from 'express';

// @ts-ignore
import * as GET from './methods/get';
// @ts-ignore
import * as POST from './methods/post';
// @ts-ignore
import * as PUT from './methods/put';
// @ts-ignore
import * as DELETE from './methods/delete';


export const PasswordResetRequestsController: Router = Router();

/** GET routes */



/** POST routes */

PasswordResetRequestsController.post('/submit_reset_password_request', POST.submit_reset_password_request);

/** PUT routes */

PasswordResetRequestsController.put('/submit_password_reset_code', PUT.submit_password_reset_code);

/** DELETE routes */

