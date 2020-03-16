import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import {
  Users,
  HomeListings,
  UserLocationPreferences,
  HomeListingRequests,
  Notifications
} from '../../../models';
import { Op } from 'sequelize';
import { EVENT_TYPES, NOTIFICATION_TYPE, NOTIFICATION_TARGET_TYPE } from '../../../chamber';

export async function send_tenant_request(
  request: Request,
  response: Response,
) {
  const you = (<IRequest> request).session.you;
  const home_listing_id = parseInt(request.params.id, 10);
  const homeListingModel = await HomeListings.findOne({
    where: { id: home_listing_id },
    attributes: ['id', 'owner_id', 'state']
  });
  if (!homeListingModel) {
    return response.status(404).json({
      error: true,
      message: `Could not find home listing by id: ${home_listing_id}`
    });
  }
  if (homeListingModel.owner_id !== you.id) {
    return response.status(403).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

  const tenant_id = parseInt(request.params.user_id, 10);
  let tenant_request = await HomeListingRequests.findOne({
    where: { home_listing_id, tenant_id }
  });
  if (tenant_request) {
    return response.status(403).json({
      tenant_request,
      error: true,
      message: `This tenant request already exists.`
    });
  }

  tenant_request = await HomeListingRequests.create({
    home_owner_id: you.id,
    home_listing_id,
    tenant_id,
    accepted: null,
  });
  const newNotification = await Notifications.create({
    from_id: you.id,
    to_id: tenant_id,
    action: NOTIFICATION_TYPE.HOME_LISTING_REQUEST_SENT,
    target_type: NOTIFICATION_TARGET_TYPE.HOME_LISTING,
    target_id: home_listing_id,
  });
  (<IRequest> request).io.emit(EVENT_TYPES.HOME_LISTING_REQUEST_SENT, {
    for_id: tenant_id,
    newNotification,
    tenant_request,
    home_listing_id,
    home_request_id: tenant_request.id,
  });
  return response.status(200).json({
    tenant_request,
    message: `Tenant request sent successfully.`
  });
}