import { uniqueValue, generateToken, validateNumber, validateSearchStatus, validateEmail, allowed_images } from '../../../Chamber';
import * as bcrypt from 'bcrypt-nodejs';
import { Request, Response } from 'express';
import { IRequest } from '../../../interfaces/express-request.interface';
import { IResponse } from '../../../interfaces/express-response.interface';
import { Op, Model } from 'sequelize';
import {
  Users,
  Tokens,
  HomeListings,
} from '../../../models';
import { UploadedFile } from 'express-fileupload';
import { store_image } from '../../../cloudinary-manager';

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
  const bio = request.body.bio || '';
  const email = request.body.email;
  const search_status = request.body.search_status;
  const credit_score = request.body.credit_score;
  const gross_income = request.body.gross_income;
  const net_income = request.body.net_income;
  const income_sources_count = request.body.income_sources_count;

  if (bio.length > 250) {
    return response.status(400).json({ error: true, message: 'Bio cannot be longer than 250 characters' });
  }
  if (!email || !validateEmail(email)) {
    return response.status(400).json({ error: true, message: 'Email address field is required' });
  }
  if (email !== (<IRequest> request).session.you.email) {
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

  const updatesObj = {
    bio,
    email,
    search_status,
    credit_score,
    gross_income,
    net_income,
    income_sources_count,
  };

  const updates = await Users.update(updatesObj, { where: { id: (<IRequest> request).session.you.id } });
  Object.assign((<IRequest> request).session.you, updatesObj);
  const user = { ...(<IRequest> request).session.you };
  delete user.password;
  const responseData = { user, message: 'Settings updated successfully!' };
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
    const responseData = { user, message: 'Icon updated successfully!' };
    return response.status(200).json(responseData);
  } catch (e) {
    console.log('error:', e);
    return response.status(500).json({ error: true, message: 'Could not upload file...' });
  }
}

export async function update_home_listing(
  request: Request,
  response: Response,
) {
  const user_id = parseInt(request.params.id, 10);
  const home_listing_id = parseInt(request.params.home_listing_id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(401).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

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

  return response.status(200).json({
    updatesObj: homeModel.toJSON(),
    message: `Home listing updated successfully.`
  });
}
