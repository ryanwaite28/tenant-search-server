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
import { PasswordReset_EMAIL, PasswordResetSuccess_EMAIL } from '../../../template-engine';
import { send_email } from '../../../sendgrid-manager';



export async function submit_password_reset_code(
  request: Request,
  response: Response,
) {
  try {
    if((<IRequest> request).session.id) {
      return response.status(403).json({ error: true, message: 'password reset cannot be requested during an sctive session' });
    }

    const code = request.body.code;
    if(!code) {
      return response.status(400).json({ error: true, message: 'reset code is required' });
    }

    const request_result = await ResetPasswordRequests.findOne({ where: { unique_value: code } });
    if (!request_result) {
      return response.status(404).json({ error: true, message: 'Invalid code, no reset request found by that value' });
    }
    if (request_result.dataValues.completed) {
      return response.status(403).json({ error: true, message: 'Code has already been used.' });
    }

    const user_result = await Users.findOne({ where: { id: request_result.dataValues.user_id } });
    if(!user_result) {
      return response.status(404).json({ error: true, message: 'error loading user from reset request...' });
    }

    const password = uniqueValue();
    const hash = bcrypt.hashSync(password);
    const update_result = await Users.update({ password: hash }, { where: { id: user_result.dataValues.id } });

    request_result.completed = true;
    const delete_result = await request_result.save();

    // send new password email
    const host: string = request.get('origin')!;
    const link = host.endsWith('/') ? (host + 'signin') : (host + '/signin');
    const email_subject = 'Tenant Search - Password reset successful!';
    const email_html = PasswordResetSuccess_EMAIL({ name: getUserFullName(user_result.dataValues), password, link });

    send_email('', user_result.dataValues.email, email_subject, email_html)
      .then(email_result => {
        console.log({ password_request: email_result });
      });

    return response.status(200).json({ message: 'The Password has been reset! Check your email.' });
  }
  catch(e) {
    console.log(e);
    return response.status(500).json({ e, error: true, message: 'Could not reset password...' });
  }
}