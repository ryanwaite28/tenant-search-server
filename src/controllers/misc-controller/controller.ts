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


export const MiscController: Router = Router();

/** GET routes */

MiscController.get('/verify-account/:verify_code', GET.verify_account);

/** POST routes */



/** PUT routes */



/** DELETE routes */

