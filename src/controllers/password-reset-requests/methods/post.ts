import {
  uniqueValue,
  generateToken, 
  validateNumber, 
  validateSearchStatus, 
  validateEmail, 
  allowed_images, 
  USER_ACCOUNT_TYPES, 
  EVENT_TYPES, 
  NOTIFICATION_TYPE, 
  NOTIFICATION_TARGET_TYPE,
  validatePassword,
  getUserFullName
} from '../../../chamber';
import * as bcrypt from 'bcrypt-nodejs';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import { Op, Model } from 'sequelize';
import {
  Users,
  Tokens,
  HomeListings,
  HomeListingRequests,
  Notifications,
  ResetPasswordRequests,
} from '../../../models';
import { UploadedFile } from 'express-fileupload';
import { store_image } from '../../../cloudinary-manager';
import { PasswordReset_EMAIL } from '../../../template-engine';
import { send_email } from '../../../sendgrid-manager';



export async function submit_reset_password_request(
  request: Request,
  response: Response,
) {
  try {
    if((<IRequest> request).session.id) {
      return response.status(403).json({
        error: true,
        message: 'password reset cannot be requested during an sctive session'
      });
    }

    const email = (request.body.email || '').trim().toLowerCase();
    if(!email) {
      return response.status(400).json({
        error: true,
        message: 'Email is required'
      });
    }
    if(!validateEmail(email)) {
      return response.status(400).json({
        error: true,
        message: 'Email input is not in valid format'
      });
    }
    
    const user_result = await Users.findOne({ where: { email } });
    if (!user_result) {
      return response.status(404).json({
        error: true,
        message: 'No account found by that email'
      });
    }
    const user = user_result.dataValues;
    const name = getUserFullName(user);
    const host: string = request.get('origin')!;

    let request_result = await ResetPasswordRequests.findOne({ where: { user_id: user.id, completed: false } });
    if(request_result) {
      const unique_value = request_result.get('unique_value');
      const name = getUserFullName(user);
      // send a copy of the reset request email
      let link = host.endsWith('/') ? (host + 'password-reset') : (host + '/password-reset');
      let email_subject = 'Tenant Search - Password reset requested';
      const email_data = {
        link,
        unique_value,
        name,
      };
      console.log(email_data);
      let email_html = PasswordReset_EMAIL(email_data);
      const email_result = await send_email('', user.email, email_subject, email_html);

      return response.status(403).json({
        error: true,
        message: 'A password reset has already been requested for this email. A copy has been sent.'
      });
    }

    const new_reset_request = await ResetPasswordRequests.create({ user_id: user.id });
    // send reset request email
    const unique_value = new_reset_request.get('unique_value');
    let link = host.endsWith('/') ? (host + 'password-reset') : (host + '/password-reset');
    const email_data = {
      link,
      unique_value,
      name,
    };
    console.log(email_data);
    let email_subject = 'Tenant Search - Password reset requested';
    let email_html = PasswordReset_EMAIL({
      link,
      name: getUserFullName(user),
      unique_value: new_reset_request.dataValues.unique_value,
    });
    send_email('', user.email, email_subject, email_html).then(reset_request => {
      console.log({ reset_request });
    });

    return response.status(200).json({ message: 'A password reset request has been sent to the provided email!' });
  }
  catch(e) {
    console.log(e);
    return response.status(500).json({ error: e, message: 'Could not sumbit reset password request...' });
  }
}