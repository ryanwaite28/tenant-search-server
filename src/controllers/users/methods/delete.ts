import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import {
  UserLocationPreferences, HomeListings
} from '../../../models';
import { EVENT_TYPES } from '../../../chamber';

export async function delete_location_preference(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(401).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

  const location_preference_id = parseInt(request.params.location_preference_id, 10);
  if (!location_preference_id) {
    return response.status(400).json({
      error: true,
      message: `Location preference id is required.`
    });
  }

  const whereClause = { where: { id: location_preference_id, user_id: you.id } };
  const delete_status = await UserLocationPreferences.destroy(whereClause);
  return response.status(200).json({
    delete_status,
    message: `Location preference deleted successfully.`
  });
}

export async function delete_home_listing(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(401).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

  const home_listing_id = parseInt(request.params.home_listing_id, 10);
  if (!home_listing_id) {
    return response.status(400).json({
      error: true,
      message: `Home listing id is required.`
    });
  }

  const whereClause = { where: { id: home_listing_id, owner_id: you.id } };
  const delete_status = await HomeListings.destroy(whereClause);

  (<IRequest> request).io.emit(EVENT_TYPES.HOME_LISTING_DELETED, {
    for_id: null,
    home_listing_id,
  });

  return response.status(200).json({
    delete_status,
    message: `Home listing deleted successfully.`
  });
}
