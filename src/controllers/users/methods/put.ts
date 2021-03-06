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
  getUserFullName,
  convertHomeListingLinksToList
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
} from '../../../models';
import { UploadedFile } from 'express-fileupload';
import { store_image } from '../../../cloudinary-manager';
import { send_email } from '../../../sendgrid-manager';
import { TenantRequest_Declined, TenantRequest_Accepted } from '../../../template-engine';

export async function sign_in(
  request: Request,
  response: Response,
) {
  if ((<IRequest> request).session.id) {
    const userObj = { ...(<IRequest> request).session.you };
    delete userObj.password;
    return response.status(400).json({
      error: true,
      message: 'Client already signed in',
      user: userObj,
    });
  }

  let email = request.body.email;
  const password = request.body.password;

  if (email) {
    email = email.toLowerCase();
  }
  if (!email) {
    return response.status(400).json({
      error: true,
      message: 'Email Address field is required'
    });
  }
  if (!password) {
    return response.status(400).json({ error: true, message: 'Password field is required' });
  }
  const check_account = await Users.findOne({
    where: { [Op.or]: [{ email }, { username: email }] }
  });
  if (!check_account) {
    return response.status(401).json({ error: true, message: 'Invalid credentials.' });
  }
  if (bcrypt.compareSync(password, (<any> check_account).dataValues.password) === false) {
    return response.status(401).json({ error: true, message: 'Invalid credentials.' });
  }
  const user = (<any> check_account).dataValues;
  (<IRequest> request).session.id = uniqueValue();
  (<IRequest> request).session.you = { ...user };
  (<IRequest> request).session.youModel = check_account;
  delete user.password;

  const session_token = await Tokens.findOne({
    where: (<any> {
      ip_address: request.ip,
      user_agent: request.get('user-agent'),
      user_id: user.id
    })
  });

  let jsonResponse;
  if (session_token) {
    jsonResponse = {
      online: true,
      user,
      token: (<any> session_token).dataValues.token,
      message: 'Signed In!'
    };
  } else {
    const new_token = generateToken(user.id);
    await Tokens.create({
      ip_address: request.ip,
      user_agent: request.get('user-agent'),
      user_id: user.id,
      token: new_token,
      device: (<IRequest> request).device.type
    });
    jsonResponse = {
      user,
      online: true,
      token: new_token,
      session_id: (<IRequest> request).session.id,
      message: 'Signed In!'
    };
  }

  return response.status(200).json(jsonResponse);
}

export function sign_out(
  request: Request,
  response: Response,
) {
  (<IRequest> request).session.reset();
  return response.status(200).json({
    online: false,
    successful: true,
    message: 'Signed out successfully!'
  });
}

export async function update_profile_settings(
  request: Request,
  response: Response,
) {
  const you = (<IRequest> request).session.you;
  const bio = request.body.bio || '';
  const email = request.body.email;
  const phone = request.body.phone;
  const search_status = request.body.search_status;
  const credit_score = request.body.credit_score;
  const gross_income = request.body.gross_income;
  const net_income = request.body.net_income;
  const income_sources_count = request.body.income_sources_count && parseInt(request.body.income_sources_count, 10);
  const preferred_rent = request.body.preferred_rent && parseInt(request.body.preferred_rent, 10);
  const max_rent = request.body.max_rent && parseInt(request.body.max_rent, 10);


  if (bio.length > 250) {
    return response.status(400).json({ error: true, message: 'Bio cannot be longer than 250 characters' });
  }
  if (phone && !(/[0-9]{10,12}/).test(phone)) {
    return response.status(400).json({
      error: true,
      message: `Phone number must be a 10 digit number; "${phone}" is invalid/not accepted.`
    });
  }
  if (!email || !validateEmail(email)) {
    return response.status(400).json({ error: true, message: 'Email address field is required' });
  }
  if (email !== you.email) {
    const check_email = await Users.findOne({ where: { email } });
    if (check_email) {
      return response.status(401).json({ error: true, message: 'Email already in use' });
    }
  }
  if (!validateSearchStatus(search_status)) {
    return response.status(400).json({
      error: true,
      message: 'Search Status must be either "NOT_LOOKING", "PASSIVE" or "ACTIVE".'
    });
  }
  if (you.account_type === USER_ACCOUNT_TYPES.TENANT) {
    if (!validateNumber(credit_score) || (credit_score < 300 || credit_score > 850)) {
      return response.status(400).json({
        error: true,
        message: 'Credit score must be a number between 300 and 850.'
      });
    }
    if (!validateNumber(gross_income)) {
      return response.status(400).json({
        error: true,
        message: 'Gross must be a positive number.'
      });
    }
    if (!validateNumber(net_income)) {
      return response.status(400).json({
        error: true,
        message: 'Net income must be a positive number.'
      });
    }
    if (!validateNumber(income_sources_count)) {
      return response.status(400).json({
        error: true,
        message: 'Number of income sources must be a positive number.'
      });
    }
    if (preferred_rent && !validateNumber(preferred_rent)) {
      return response.status(400).json({
        error: true,
        message: 'Preferred rent must be a positive number.'
      });
    }
    if (max_rent && !validateNumber(max_rent)) {
      return response.status(400).json({
        error: true,
        message: 'Max rent must be a positive number.'
      });
    }
  }

  const updatesObj = {
    bio,
    email,
    phone,
    search_status,
    credit_score,
    gross_income,
    net_income,
    income_sources_count,
    preferred_rent,
    max_rent,
  };

  const updates = await Users.update(updatesObj, { where: { id: you.id } });
  Object.assign(you, updatesObj);
  const user = { ...you };
  delete user.password;
  const responseData = { user, updates, message: 'Settings updated successfully.' };
  return response.status(200).json(responseData);
}

export async function update_profile_icon(
  request: Request,
  response: Response,
) {
  try {
    const icon_file: UploadedFile | undefined = request.files && (<UploadedFile> request.files.icon);
    if (!icon_file) {
      return response.status(400).json({ error: true, message: 'No file was uploaded...' });
    }

    const type = icon_file.mimetype.split('/')[1];
    const isInvalidType = !allowed_images.includes(type);
    if (isInvalidType) {
      return response.status(400).json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
    }

    const results = await store_image(icon_file, (<IRequest> request).session.you.icon_id);
    if (!results.result) {
      return response.status(500).json({ error: true, message: 'Could not upload file...' });
    }
    const cloudinary_image_id = results.result.public_id;
    const cloudinary_image_link = results.result.secure_url;
    const updatesObj = { icon_id: cloudinary_image_id, icon_link: cloudinary_image_link };
    const whereClause = { where: { id: (<IRequest> request).session.you.id } };
    const updates = await Users.update(updatesObj, whereClause);

    Object.assign((<IRequest> request).session.you, updatesObj);
    const user = { ...(<IRequest> request).session.you };
    delete user.password;
    const responseData = { user, message: 'Icon updated successfully.' };
    return response.status(200).json(responseData);
  } catch (e) {
    console.log('error:', e);
    return response.status(500).json({ error: true, message: 'Could not upload file...' });
  }
}

export async function update_profile_password(
  request: Request,
  response: Response,
) {
  try {
    const oldpassword = request.body.oldpassword;
    const password = request.body.password;
    const confirmPassword = request.body.confirmPassword;

    if (!oldpassword) {
      return response.status(400).json({
        error: true,
        message: `Old password field is required.`
      });
    }
    if (!password) {
      return response.status(400).json({
        error: true,
        message: `Password field is required.`
      });
    }
    if (!confirmPassword) {
      return response.status(400).json({
        error: true,
        message: `Confirm Password field is required.`
      });
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
    const checkOldPassword = bcrypt.compareSync(oldpassword, (<IRequest> request).session.you.password);
    if (checkOldPassword === false) {
      return response.status(401).json({ error: true, message: 'Old password is incorrect.' });
    }

    const hash = bcrypt.hashSync(password);
    const updatesObj = { password: hash };
    const whereClause = { where: { id: (<IRequest> request).session.you.id } };
    const updates = await Users.update(updatesObj, whereClause);

    Object.assign((<IRequest> request).session.you, updatesObj);
    const responseData = { updates, message: 'Password updated successfully.' };
    return response.status(200).json(responseData);
  } catch (e) {
    console.log('error:', e);
    return response.status(500).json({ e, error: true, message: 'Could not update password...' });
  }
}

export async function update_home_listing(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(403).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }
  const home_listing_id = parseInt(request.params.home_listing_id, 10);

  const {
    title,
    description,
    amenities,
    links,
    deposit,
    rent,
    lease_type,
    lease_duration,
  } = request.body;

  if (!title || title.length > 250) {
    return response.status(400).json({
      error: true,
      message: `Title is required: cannot exceed 250 characters`
    });
  }
  if (description && description.length > 500) {
    return response.status(400).json({
      error: true,
      message: `Description cannot exceed 500 characters`
    });
  }
  if (amenities && amenities.length > 500) {
    return response.status(400).json({
      error: true,
      message: `Amenities cannot exceed 500 characters`
    });
  }
  if (links && links.length > 1000) {
    return response.status(400).json({
      error: true,
      message: `Links cannot exceed 1000 characters`
    });
  }
  if (!deposit) {
    return response.status(400).json({
      error: true,
      message: `Deposit is required.`
    });
  }
  if (!rent) {
    return response.status(400).json({
      error: true,
      message: `Rent is required.`
    });
  }
  if (!lease_type) {
    return response.status(400).json({
      error: true,
      message: `Lease type is required.`
    });
  }
  if (!lease_duration) {
    return response.status(400).json({
      error: true,
      message: `Lease duration is required.`
    });
  }

  const homeModel = await HomeListings.findOne({ where: { id: home_listing_id } });
  if (!homeModel) {
    return response.status(404).json({
      error: true,
      message: `Could not find listing from id: ${home_listing_id}`
    });
  }
  if (homeModel.owner_id !== you.id) {
    return response.status(400).json({
      error: true,
      message: `You do not own this home listing data.`
    });
  }

  let icon_id = '';
  let icon_link = '';
  const picture_file: UploadedFile | undefined = request.files && (<UploadedFile> request.files.picture_file);
  console.log({ picture_file });
  if (picture_file) {
    const type = picture_file.mimetype.split('/')[1];
    const isInvalidType = !allowed_images.includes(type);
    if (isInvalidType) {
      return response.status(400).json({ error: true, message: 'Invalid file type: jpg, jpeg or png required...' });
    }
    const results = await store_image(picture_file, homeModel.icon_id);
    if (!results.result) {
      return response.status(500).json({ error: true, message: 'Could not upload file...' });
    }
    icon_id = results.result.public_id;
    icon_link = results.result.secure_url;
  }

  const updatesObj: any = {
    title,
    description,
    amenities,
    links,
    deposit,
    rent,
    lease_type,
    lease_duration,
  };
  if (icon_id && icon_link) {
    updatesObj.icon_id = icon_id;
    updatesObj.icon_link = icon_link;
  }
  /**  method 1: update via table */
  // const whereClause = { where: { id: home_listing_id, owner_id: you.id } };
  // const updates = await HomeListings.update(updatesObj, whereClause);
  /**  method 1: update via model */
  Object.assign(homeModel, updatesObj);
  await homeModel.save();

  const home_listing = homeModel.toJSON();

  (<IRequest> request).io.emit(EVENT_TYPES.HOME_LISTING_UPDATED, {
    event: EVENT_TYPES.HOME_LISTING_UPDATED,
    for_id: null,
    home_listing,
  });

  return response.status(200).json({
    home_listing,
    message: `Home listing updated successfully.`
  });
}

export async function accept_request(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(403).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

  const request_id = parseInt(request.params.request_id, 10);
  const home_listing_request = await HomeListingRequests.findOne(
    { where: { id: request_id, tenant_id: user_id } }
  );
  if (!home_listing_request) {
    return response.status(404).json({
      error: true,
      message: `Could not find home listing request by id: ${request_id}.`
    });
  }
  home_listing_request.accepted = true;
  const updates = await home_listing_request.save();

  /** Notify home owner that request was accepted */
  Users.findOne({ where: { id: home_listing_request.home_owner_id } })
    .then(async (homeOwner: any) => {
      try {
        const subject = 'Tenant Search - Tenant Request Accepted.';
        const home_listing = await HomeListings.findOne({ where: { id: home_listing_request.home_listing_id } });
        const home_listing_data: any = home_listing!.get({ plain: true });
        const html = TenantRequest_Accepted({
          name: getUserFullName(you),
          home_listing: home_listing_data
        });
        send_email('', homeOwner.dataValues.email, subject, html)
          .then(email_result => {
            console.log({ password_request: email_result });
          });

        const newNotification = await Notifications.create({
          from_id: you.id,
          to_id: home_listing_request.home_owner_id,
          action: NOTIFICATION_TYPE.HOME_LISTING_REQUEST_ACCEPTED,
          target_type: NOTIFICATION_TARGET_TYPE.HOME_LISTING,
          target_id: home_listing_request.home_listing_id,
        });
        (<IRequest> request).io.emit(`${home_listing_request.home_owner_id}:${EVENT_TYPES.HOME_LISTING_REQUEST_ACCEPTED}`, {
          event: EVENT_TYPES.HOME_LISTING_REQUEST_ACCEPTED,
          for_id: home_listing_request.home_owner_id,
          home_listing: home_listing_data,
          links: convertHomeListingLinksToList(home_listing_data!.links),
          home_request_id: request_id,
          notification: {
            ...newNotification.toJSON(),
            from: you
          },
          home_listing_id: home_listing_request.home_listing_id,
          home_listing_request,
        });
      } catch(e) {
        console.log({ e, message: `could not sent email...` });
      }
    });

  return response.status(200).json({
    home_listing_request,
    accepted: true,
    message: `Request accepted.`
  });
}

export async function decline_request(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(403).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

  const request_id = parseInt(request.params.request_id, 10);
  const home_listing_request = await HomeListingRequests.findOne(
    { where: { id: request_id, tenant_id: user_id } }
  );
  if (!home_listing_request) {
    return response.status(404).json({
      error: true,
      message: `Could not find home listing request by id: ${request_id}.`
    });
  }
  home_listing_request.accepted = false;
  const updates = await home_listing_request.save();

  /** Notify home owner that request was declined */
  Users.findOne({ where: { id: home_listing_request.home_owner_id } })
    .then(async (homeOwner: any) => {
      try {
        const subject = 'Tenant Search - Tenant Request Declined.';
        const home_listing = await HomeListings.findOne({ where: { id: home_listing_request.home_listing_id } });
        const home_listing_data: any = home_listing!.get({ plain: true });
        const html = TenantRequest_Declined({
          name: getUserFullName(you),
          home_listing: home_listing_data
        });
        send_email('', homeOwner.dataValues.email, subject, html)
          .then(email_result => {
            console.log({ password_request: email_result });
          });
        const newNotification = await Notifications.create({
          from_id: you.id,
          to_id: home_listing_request.home_owner_id,
          action: NOTIFICATION_TYPE.HOME_LISTING_REQUEST_DECLINED,
          target_type: NOTIFICATION_TARGET_TYPE.HOME_LISTING,
          target_id: home_listing_request.home_listing_id,
        });
        (<IRequest> request).io.emit(`${home_listing_request.home_owner_id}:${EVENT_TYPES.HOME_LISTING_REQUEST_DECLINED}`, {
          event: EVENT_TYPES.HOME_LISTING_REQUEST_DECLINED,
          for_id: home_listing_request.home_owner_id,
          home_listing: home_listing_data,
          links: convertHomeListingLinksToList(home_listing_data!.links),
          home_request_id: request_id,
          notification: {
            ...newNotification.toJSON(),
            from: you
          },
          home_listing_id: home_listing_request.home_listing_id,
          home_listing_request,
        });
      } catch(e) {
        console.log({ e, message: `could not sent email...` });
      }
    });

  return response.status(200).json({
    home_listing_request,
    accepted: false,
    message: `Request declined.`
  });
}