import {
  validateName,
  validateAccountType,
  validateEmail,
  validatePassword,
  generateToken,
  uniqueValue,
  capitalize,
  SEARCH_STATUS
} from '../../../chamber';
import * as bcrypt from 'bcrypt-nodejs';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import {
  Users, Tokens
} from '../../../models';

export async function sign_up(
  request: Request,
  response: Response,
) {
  if ((<any> request).session.id) {
    return response.status(400).json({ error: true, message: 'Client already signed in' });
  }

  const first_name = capitalize(request.body.first_name).trim();
  const middle_initial = request.body.middle_initial && (<string> request.body.middle_initial).toUpperCase().trim() || ''; // optional
  const last_name = capitalize(request.body.last_name).trim();
  const account_type = request.body.account_type;
  let email = request.body.email;
  let password = request.body.password;
  const confirmPassword = request.body.confirmPassword;
  const search_status = SEARCH_STATUS.NOT_LOOKING;

  if (email) { email = email.toLowerCase().replace(/\s/gi, ''); }

  if (!first_name) {
    return response.status(400).json({ error: true, message: 'First name field is required' });
  }
  if (!last_name) {
    return response.status(400).json({ error: true, message: 'Last name field is required' });
  }
  if (!account_type) {
    return response.status(400).json({ error: true, message: 'Account type field is required' });
  }
  if (!email) {
    return response.status(400).json({ error: true, message: 'Email address field is required' });
  }
  if (!password) {
    return response.status(400).json({ error: true, message: 'Password field is required' });
  }
  if (!confirmPassword) {
    return response.status(400).json({ error: true, message: 'Confirm password field is required' });
  }

  if (!validateName(first_name)) {
    return response.status(400).json({
      error: true,
      message: 'First name must be letters only and at least 2 characters long.'
    });
  }
  if (!validateName(last_name)) {
    return response.status(400).json({
      error: true,
      message: 'First name must be letters only and at least 2 characters long.'
    });
  }
  if (middle_initial && middle_initial.length > 1) {
    return response.status(400).json({
      error: true,
      message: 'Middle initial can only be 1 character long.'
    });
  }
  if (!validateAccountType(account_type)) {
    return response.status(400).json({
      error: true,
      message: 'Account Type must be either "TENANT" or "HOME_OWNER".'
    });
  }
  if (!validateEmail(email)) {
    return response.status(400).json({ error: true, message: 'Email is invalid. Check Format.' });
  }
  if (!validatePassword(password)) {
    return response.status(400).json({
      error: true,
      message: 'Password must be: at least 7 characters, upper and/or lower case alphanumeric'
    });
  }
  if (password !== confirmPassword) {
    return response.status(400).json({ error: true, message: 'Passwords must match' });
  }

  const check_email = await Users.findOne({ where: { email } });
  if (check_email) {
    return response.status(401).json({ error: true, message: 'Email already in use' });
  }

  /* Data Is Valid */

  password = bcrypt.hashSync(password);
  const createInfo = { first_name, middle_initial, last_name, account_type, search_status, email, password };
  const new_user = await Users.create(createInfo);
  const user = (<any> new_user).dataValues;
  const new_token = generateToken(user.id);
  Tokens.create({
    ip_address: request.ip,
    user_agent: request.get('user-agent'),
    user_id: user.id,
    token: new_token,
    device: (<any> request).device.type
  });
  (<any> request).session.id = uniqueValue();
  (<any> request).session.you = { ...user };
  (<any> request).session.youModel = new_user;
  delete user.password;

  /** Email Sign up and verify */
  // const host: string | undefined = request.get('host');
  // const uuid = user.uuid;
  // const verify_link = (<string> host).endsWith('/')
  //   ? (host + 'verify_user_email/' + uuid)
  //   : (host + '/verify_user_email/' + uuid);

  // const email_subject = 'Hot Spot - Signed Up!';
  // const email_html = templateEngine.SignedUp_EMAIL(request.session.you);
  // sendgrid_manager.send_email(null, user.email, email_subject, email_html);

  const responseData = { online: true, user, message: 'Signed Up!', token: new_token };
  return response.status(200).json(responseData);
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
