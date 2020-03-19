import {
  uniqueValue, generateResetPasswordCode
} from '../../../chamber';
import {
  Users,
  Tokens,
  UserLocationPreferences,
  HomeListings,
  HomeListingRequests,
  Notifications,
  ResetPasswordRequests
} from '../../../models';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import { Op } from 'sequelize';



export async function verify_account(
  request: Request,
  response: Response,
) {
  const uuid = request.params.verify_code;
  const user = await Users.findOne({ where: { uuid } });
  if (!user) {
    return response.status(400).json({
      error: true,
      message: `Invalid verification code.`
    });
  }

  if (user.get('account_verified') === true) {
    return response.status(400).json({
      error: true,
      message: `Already verified!`
    });
  }

  await Users.update({ account_verified: true }, { where: { uuid } });
  return response.status(200).json({
    message: `Account successfully verified!`
  });
}