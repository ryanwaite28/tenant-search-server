import * as Chamber from '../../../chamber';
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
import { EVENT_TYPES, NOTIFICATION_TYPE, NOTIFICATION_TARGET_TYPE, convertHomeListingLinksToList } from '../../../chamber';
import { TenantRequest_Canceled } from '../../../template-engine';
import { send_email } from '../../../sendgrid-manager';

export async function cancel_tenant_request(
  request: Request,
  response: Response,
) {
  const you = (<IRequest> request).session.you;
  const home_listing_id = parseInt(request.params.id, 10);
  const homeListingModel = await HomeListings.findOne({
    where: { id: home_listing_id },
    // attributes: ['id', 'owner_id', 'state']
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
  if (!tenant_request) {
    return response.status(403).json({
      error: true,
      message: `This tenant request does not exist.`
    });
  }
  const home_request_id = tenant_request.id;
  const home_request = tenant_request.toJSON();

  const delete_updates = await HomeListingRequests.destroy({
    where: { home_listing_id, tenant_id }
  });
  const newNotification = await Notifications.create({
    from_id: you.id,
    to_id: tenant_id,
    action: NOTIFICATION_TYPE.HOME_LISTING_REQUEST_CANCELED,
    target_type: NOTIFICATION_TARGET_TYPE.HOME_LISTING,
    target_id: home_listing_id,
  });
  (<IRequest> request).io.emit(`${tenant_id}:${EVENT_TYPES.HOME_LISTING_REQUEST_CANCELED}`, {
    event: EVENT_TYPES.HOME_LISTING_REQUEST_CANCELED,
    for_id: tenant_id,
    notification: {
      ...newNotification.toJSON(),
      from: you
    },
    home_request,
    home_listing: homeListingModel.toJSON(),
    home_listing_id,
    home_request_id,
  });

  /** Notify potential tenant that request was canceled */
  Users.findOne({ where: { id: tenant_id } })
    .then(async (tenant: any) => {
      try {
        const subject = 'Tenant Search - Tenant Request Canceled.';
        const home_listing = await HomeListings.findOne({ where: { id: home_listing_id } });
        const home_listing_data: any = home_listing!.toJSON();
        const html = TenantRequest_Canceled({
          name: Chamber.getUserFullName(you),
          home_listing: home_listing_data,
          links: convertHomeListingLinksToList(home_listing_data.links),
          home_owner_email: you.email, 
          home_owner_phone: you.phone
        });
        send_email('', tenant.dataValues.email, subject, html)
          .then(email_result => {
            console.log({ password_request: email_result });
          });
      } catch(e) {
        console.log({ e, message: `could not sent email...` });
      }
    });

  return response.status(200).json({
    delete_updates,
    message: `Tenant request canceled successfully.`
  });
}