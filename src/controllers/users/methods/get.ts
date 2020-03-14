import {
  uniqueValue
} from '../../../chamber';
import {
  Users,
  Tokens,
  UserLocationPreferences,
  HomeListings,
} from '../../../models';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import { Op } from 'sequelize';

export async function check_session(
  request: Request,
  response: Response,
) {
  try {
    if ((<any> request).session.id) {
      // const get_user = await Users.findOne({ where: { id: .id } });
      const user = { ...(<IRequest> request).session.you };
      delete user.password;
      const session_id = (<IRequest> request).session.id;
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

export async function user_location_preferences(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const location_preference_id = parseInt(request.params.location_preference_id, 10);
  const location_preferences = await UserLocationPreferences.findAll({
    where: (!location_preference_id ? { user_id } : { user_id, id: { [Op.lt]: location_preference_id } }),
    // include: [{
    //   model: Users,
    //   as: 'user',
    //   attributes: { exclude: ['password'] }
    // }],
    limit: 5,
    order: [['id', 'DESC']]
  });
  const user = await Users.findOne({ where: { id: user_id }, attributes: { exclude: ['password'] } });
  return response.status(200).json({ user, location_preferences });
}

export async function user_home_listings(
  request: Request,
  response: Response,
) {
  const owner_id = parseInt(request.params.id, 10);
  const home_listing_id = parseInt(request.params.home_listing_id, 10);
  const home_listings = await HomeListings.findAll({
    where: (!home_listing_id ? { owner_id } : { owner_id, id: { [Op.lt]: home_listing_id } }),
    // include: [{home_listing_id
    //   model: Users,
    //   as: 'user',
    //   attributes: { exclude: ['password'] }
    // }],
    limit: 5,
    order: [['id', 'DESC']]
  });
  const user = await Users.findOne({ where: { id: owner_id }, attributes: { exclude: ['password'] } });
  return response.status(200).json({ user, home_listings });
}
