import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import {
  Users,
  HomeListings,
  UserLocationPreferences,
  HomeListingRequests
} from '../../../models';
import { Op } from 'sequelize';

export async function home_listing_by_id(
  request: Request,
  response: Response,
) {
  const id = parseInt(request.params.id, 10);
  const home_listing = await HomeListings.findOne({
    where: { id },
    include: [{
      model: Users,
      as: 'home_owner',
      attributes: { exclude: ['password'] }
    }]
  });
  return response.status(200).json({ home_listing });
}

export async function possible_tenants_by_state(
  request: Request,
  response: Response,
) {
  const home_listing_id = parseInt(request.params.id, 10);
  const homeListingModel = await HomeListings!.findOne({
    where: { id: home_listing_id },
    attributes: ['id', 'state']
  });
  if (!homeListingModel) {
    return response.status(404).json({
      error: true,
      message: `Could not find home listing by id: ${home_listing_id}`
    });
  }

  const user_id = parseInt(request.params.user_id, 10);
  const possible_tenants = await Users.findAll({
    where: (!user_id ? {  } : { id: { [Op.lt]: user_id } }),
    attributes: { exclude: ['password'] },
    include: [{
      model: UserLocationPreferences,
      as: 'location_preferences',
      where: {
        state: homeListingModel.state
      }
    }],
    limit: 5,
    order: [['id', 'DESC']]
  });
  return response.status(200).json({ possible_tenants });
}

export async function possible_tenants_by_state_and_city(
  request: Request,
  response: Response,
) {
  const home_listing_id = parseInt(request.params.id, 10);
  const homeListingModel = await HomeListings!.findOne({
    where: { id: home_listing_id },
    attributes: ['id', 'state', 'city']
  });
  if (!homeListingModel) {
    return response.status(404).json({
      error: true,
      message: `Could not find home listing by id: ${home_listing_id}`
    });
  }

  const user_id = parseInt(request.params.user_id, 10);
  const possible_tenants = await Users.findAll({
    where: (!user_id ? {  } : { id: { [Op.lt]: user_id } }),
    attributes: { exclude: ['password'] },
    include: [{
      model: UserLocationPreferences,
      as: 'location_preferences',
      where: {
        state: homeListingModel.state,
        city: homeListingModel.city,
      }
    }],
    limit: 5,
    order: [['id', 'DESC']]
  });
  return response.status(200).json({ possible_tenants });
}

export async function requests_by_home_listing_id(
  request: Request,
  response: Response,
) {
  const home_listing_id = parseInt(request.params.id, 10);
  const homeListingModel = await HomeListings!.findOne({
    where: { id: home_listing_id },
    attributes: ['id', 'state', 'city']
  });
  if (!homeListingModel) {
    return response.status(404).json({
      error: true,
      message: `Could not find home listing by id: ${home_listing_id}`
    });
  }

  const request_id = parseInt(request.params.request_id, 10);
  const home_listing_requests = await HomeListingRequests.findAll({
    where: { home_listing_id },
    // where: (!request_id ? { home_listing_id } : { home_listing_id, id: { [Op.lt]: request_id } }),
    include: [{
      model: Users,
      as: 'tenant',
      attributes: { exclude: ['password'] }
    }],
    // limit: 5,
    order: [['id', 'DESC']]
  });

  return response.status(200).json({ home_listing_requests });
}
