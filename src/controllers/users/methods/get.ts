import {
  uniqueValue, NOTIFICATION_TARGET_TYPE, 
} from '../../../chamber';
import {
  Users,
  Tokens,
  UserLocationPreferences,
  HomeListings,
  HomeListingRequests,
  Notifications,
  ResetPasswordRequests,
  MyModelStatic,
  IMyModel,
} from '../../../models';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import { Op } from 'sequelize';

/** Helper Methods */

const applyNotificationDetails = async (n: IMyModel) => {
  const notification: any = n.get({ plain: true });
  switch (notification.target_type) {
    case NOTIFICATION_TARGET_TYPE.HOME_LISTING: {
      const home_listing = await HomeListings.findOne({
        where: { id: notification.target_id }
      });
      notification.home_listing = home_listing;

      return notification;
    }
  }
};

/** --- */

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
  // const user = await Users.findOne({ where: { id: user_id }, attributes: { exclude: ['password'] } });
  return response.status(200).json({ location_preferences });
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
  // const user = await Users.findOne({ where: { id: owner_id }, attributes: { exclude: ['password'] } });
  return response.status(200).json({ home_listings });
}

export async function requests_by_home_owner_id(
  request: Request,
  response: Response,
) {
  const id = parseInt(request.params.id, 10);
  const request_id = parseInt(request.params.request_id, 10);
  const home_listing_requests = await HomeListingRequests.findAll({
    where: (!request_id ? { home_owner_id: id } : { home_owner_id: id, id: { [Op.lt]: request_id } }),
    include: [{
      model: HomeListings,
      as: 'home_listing',
    }, {
      model: Users,
      as: 'tenant',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [['id', 'DESC']]
  });
  return response.status(200).json({ home_listing_requests });
}

export async function requests_by_tenant_id(
  request: Request,
  response: Response,
) {
  const id = parseInt(request.params.id, 10);
  const request_id = parseInt(request.params.request_id, 10);
  const home_listing_requests = await HomeListingRequests.findAll({
    where: (!request_id ? { tenant_id: id } : { tenant_id: id, id: { [Op.lt]: request_id } }),
    include: [{
      model: HomeListings,
      as: 'home_listing',
      include: [{
        model: Users,
        as: 'home_owner',
        attributes: { exclude: ['password'] }
      }]
    }],
    limit: 5,
    order: [['id', 'DESC']]
  });
  return response.status(200).json({ home_listing_requests });
}

export async function user_notifications(
  request: Request,
  response: Response,
) {
  const you_id = parseInt(request.params.id, 10);
  const notification_id = parseInt(request.params.notification_id, 10);

  const notifications = await Notifications.findAll({
    where: (!notification_id ? { to_id: you_id } : { to_id: you_id, id: { [Op.lt]: notification_id } }),
    include: [{
      model: Users,
      as: 'from',
      attributes: { exclude: ['password'] }
    }],
    limit: 5,
    order: [['id', 'DESC']]
  });

  notifications.forEach(async (notification) => {
    await applyNotificationDetails(notification);
  });

  const newNotifications = await notifications.map((n) => applyNotificationDetails(n));
  Promise.all(newNotifications).then(values => {
    return response.status(200).json({ notifications: values });
  });
}
