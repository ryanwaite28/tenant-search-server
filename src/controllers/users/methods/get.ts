import {
  uniqueValue
} from '../../../chamber';
import {
  Users,
  Tokens,
} from '../../../models';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';

export async function check_session(
  request: Request,
  response: Response,
) {
  try {
    if ((<any> request).session.id) {
      const get_user = await Users.findOne({ where: { id: (<any> request).session.you.id } });
      const user = (<any> get_user).dataValues;
      delete user.password;
      const session_id = (<any> request).session.id;
      return response.json({ online: true, session_id, user });
    } else {
      return response.json({ online: false });
    }
  } catch (e) {
    console.log('error: ', e);
    return response.json({ e, error: true });
  }
}

export function sign_out(
  request: Request,
  response: Response,
) {
  (<any> request).session.reset();
  return response.status(200).json({
    online: false,
    successful: true,
    message: 'Signed out successfully!'
  });
}
