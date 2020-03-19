// @ts-ignore
import * as bcrypt from 'bcrypt';
// @ts-ignore
import { v1 as uuidv1 } from 'uuid';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import * as crypto from 'crypto';
// @ts-ignore
import { models } from './models';
import {
  Request,
  Response,
  NextFunction,
} from 'express';
import { CorsOptions } from 'cors';
import { IRequest } from './interfaces/express-request.interface';

export const APP_SECRET: string = 'f6evg7h8j9rrnhcw8e76@$#%RFG&*BF^&G*O(Pxjt67g8yu';
export const specialCaracters = ['!', '@', '#', '$', '%', '&', '+', ')', ']', '}', ':', ';', '?'];
export const codeCharacters = ['!', '@', '#', '$', '%', '&', '|', '*', ':', '-', '_', '+'];
export const allowed_images = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
export const algorithm = 'aes-256-ctr';
export const token_separator = '|';

export enum LEASE_TYPES {
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum USER_ACCOUNT_TYPES {
  TENANT = 'TENANT',
  HOME_OWNER = 'HOME_OWNER',
}

export enum HOME_TYPES {
  ANY = 'ANY',
  ROOM = 'ROOM',
  BASEMENT_FLOOR = 'BASEMENT_FLOOR',
  STUDIO = 'STUDIO',
  CONDO = 'CONDO',
  APARTMENT = 'APARTMENT',
  TOWN_HOME = 'TOWN_HOME',
  HOUSE = 'HOUSE',
}

export enum SEARCH_STATUS {
  NOT_LOOKING = 'NOT_LOOKING',
  PASSIVE = 'PASSIVE',
  ACTIVE = 'ACTIVE',
}

export enum NOTIFICATION_TYPE {
  NEW_HOME_LISTING = 'NEW_HOME_LISTING',
  HOME_LISTING_REQUEST_ACCEPTED = 'HOME_LISTING_REQUEST_ACCEPTED',
  HOME_LISTING_REQUEST_DECLINED = 'HOME_LISTING_REQUEST_DECLINED',
  HOME_LISTING_REQUEST_SENT = 'HOME_LISTING_REQUEST_SENT',
  HOME_LISTING_REQUEST_CANCELED = 'HOME_LISTING_REQUEST_CANCELED',
}

export enum NOTIFICATION_TARGET_TYPE {
  USER = 'USER',
  HOME_LISTING = 'HOME_LISTING',
  HOME_LISTING_REQUEST = 'HOME_LISTING_REQUEST',
}

export enum SUBSCRIPTION_TYPE {
  USER_LOCATION_PREFERENCES_UPDATED = 'USER_LOCATION_PREFERENCES_UPDATED'
}

export enum EVENT_TYPES {
  HOME_LISTING_UPDATED = 'HOME_LISTING_UPDATED',
  HOME_LISTING_DELETED = 'HOME_LISTING_DELETED',
  HOME_LISTING_REQUEST_ACCEPTED = 'HOME_LISTING_REQUEST_ACCEPTED',
  HOME_LISTING_REQUEST_DECLINED = 'HOME_LISTING_REQUEST_DECLINED',
  HOME_LISTING_REQUEST_SENT = 'HOME_LISTING_REQUEST_SENT',
  HOME_LISTING_REQUEST_CANCELED = 'HOME_LISTING_REQUEST_CANCELED',
}

/* --- */

export const numberRegex = /^[0-9]+/gi;

export function convertHomeListingLinksToList(links: string): string[] {
  const regex = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm;
  if (!links) {
    return [];
  }

  const splitter = links.split(',,');
  const list = splitter.filter((item) => regex.test(item));
  return list;
}

export function getUserFullName(user: any): string {
  if (user) {
    const { first_name, middle_initial, last_name } = user;
    const middle = middle_initial
      ? ` ${middle_initial}. `
      : ` `;

    const displayName = `${first_name}${middle}${last_name}`;
    return displayName;
  } else {
    throw new Error(`user arg had no value.`);
  }
}

export function addDays(dateObj: Date, number_of_days: number) {
  const dat = new Date(dateObj.valueOf());
  dat.setDate(dat.getDate() + number_of_days);
  return dat;
}

export function backDays(dateObj: Date, number_of_days: number) {
  const dat = new Date(dateObj.valueOf());
  dat.setDate(dat.getDate() - number_of_days);
  return dat;
}

export function validateEmail(email: string) {
  if (!email) { return false; }
  if (email.constructor !== String) { return false; }
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}

export function validateName(name: string) {
  if (!name) { return false; }
  if (name.constructor !== String) { return false; }
  const re = /^[a-zA-Z]{2,}$/;
  return re.test(name.toLowerCase());
}

export function validateNumber(num: any) {
  if (num === null || num === undefined) { return false; }
  if (typeof(num) !== 'number') { return false; }
  if (isNaN(num) || num === Infinity || num === -Infinity) { return false; }
  if (num < 0) { return false; }
  return true;
}

export function validateDisplayName(value: any): boolean {
  if (!value) { return false; }
  if (value.constructor !== String) { return false; }
  const re = /^[a-zA-Z\s\'\-\_\.]{2,50}$/;
  return re.test(value.toLowerCase());
}

export function validateUsername(value: any): boolean {
  if (!value) { return false; }
  if (value.constructor !== String) { return false; }
  const re = /^[a-zA-Z0-9\-\_]{2,50}$/;
  return re.test(value.toLowerCase());
}

export function validateAccountType(value: any): boolean {
  if (!value) { return false; }
  if (value.constructor !== String) { return false; }
  const isValid = value in USER_ACCOUNT_TYPES;
  return isValid;
}

export function validateSearchStatus(value: any): boolean {
  if (!value) { return false; }
  if (value.constructor !== String) { return false; }
  const isValid = value in SEARCH_STATUS;
  return isValid;
}

export function validateURL(value: any): boolean {
  if (!value) { return false; }
  if (value.constructor !== String) { return false; }
  const re = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  return re.test(value.toLowerCase());
}

export function validateInteger(value: any): boolean {
  if (!value) { return false; }
  if (value.constructor !== Number) { return false; }
  const re = /^[0-9]+$/;
  return re.test(value);
}

export function validatePassword(password: string) {
  if (!password) { return false; }
  if (password.constructor !== String) { return false; }

  const hasMoreThanSixCharacters = password.length > 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  return (
    hasMoreThanSixCharacters
    && (hasUpperCase || hasLowerCase)
    // && hasNumbers
  );
}

export function uniqueValue() {
  return String(Date.now()) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34);
}

export function greatUniqueValue() {
  return String(Date.now()) + '|' +
    Math.random().toString(36).substr(2, 34) + '|' +
    uuidv1() + '|' +
    uuidv4() + '|' +
    bcrypt.hashSync(APP_SECRET);
}

export function generateResetPasswordCode() {
  const code = Date.now() +
    '_' +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34) +
    '_' +
    uuidv1();
  console.log({ code });
  return code;
}

export function capitalize(str: string) {
  if (!str) {
    return '';
  }
  const Str = str.toLowerCase();
  return Str.charAt(0).toUpperCase() + Str.slice(1);
}

export function encrypt(text: string) {
  const cipher = crypto.createCipher(algorithm, APP_SECRET);
  let crypted = cipher.update(String(text), 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

export function decrypt(text: string) {
  const decipher = crypto.createDecipher(algorithm, APP_SECRET);
  let dec = decipher.update(String(text), 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

export function getRandomIndex(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateRandomString(num: number = 1) {
  let str = '';
  if (typeof (num) !== 'number') {
    num = 1;
  }
  for (let i = 0; i < num; i++) {
    str = str + Math.random().toString(36).substr(2, 34);
  }
  return str;
}

export function generateRandomSpecialString(num = 1) {
  let str = '';
  if (typeof (num) !== 'number') {
    num = 1;
  }
  for (let i = 0; i < num; i++) {
    str = str + Math.random().toString(36).substr(2, 34) + getRandomIndex(specialCaracters);
  }
  return str;
}

export function generateToken(user_id: number | string) {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const hash = encrypt(String(user_id));
  const randomstring = generateRandomSpecialString(15);

  const token = `${timestamp}${token_separator}${uuid}${token_separator}${hash}${token_separator}${randomstring}`;
  console.log('new token: ', token);
  return token;
}

export function CheckToken(request: Request, response: Response, next: NextFunction) {
  (async () => {
    let auth = request.get('Authorization');
    console.log('auth - ', auth);

    // check if token was sent in request header
    if (!auth) {
      return response.json({ error: true, message: 'No Authorization header was set or has no value' });
    }

    // check if token is in correct format
    auth = String(auth);
    const splitter = auth.split(token_separator);
    if (splitter.length !== 4) {
      console.log('splitter - ', splitter);
      return response.json({ error: true, message: 'Token format/structure is invalid' });
    }

    // check if date of token is valid
    const timestamp = new Date(splitter[0]);
    if (!(new Date(timestamp)).valueOf() === false) {
      return response.json({ error: true, message: 'Token date is invalid' });
    }

    // check the user_id of the token
    let user_id;
    try {
      user_id = parseInt(decrypt(splitter[2]), 10);
      if (!user_id) {
        return response.json({ error: true, message: 'Token auth is invalid' });
      }
    } catch (e) {
      console.log(e, 'user_id - ', user_id);
      return response.json({ error: true, message: 'Token auth is invalid' });
    }

    // check if token is in the database
    const token_record = await (models as any).Tokens
      .findOne({ where: {
        token: auth,
        user_agent: request.get('User-Agent'),
        device: (request as any).device.type }
      });
    if (!token_record) {
      return response.json({ error: true, message: 'Token does not exist' });
    }
    if (token_record.dataValues.user_id !== user_id) {
      return response.json({ error: true, message: 'Token not authorized' });
    }
    const user_record = await (models as any).Users.findOne({ where: { id: user_id } });
    if (!user_record) {
      return response.json({ error: true, message: 'Token does not match for any user' });
    }

    response.locals.auth = { user_id, user_record, token_record };
    return next();
  })();
}

export function SessionRequired(request: Request, response: Response, next: NextFunction) {
  console.log('auth called');
  (async () => {
    const sessionId = (<IRequest> request).session.id;
    if (!sessionId) {
      const auth = request.get('Authorization'); // user's token
      if (!auth) { return response.status(401).json({ error: true, message: 'No Authorization header...' }); }
      const token_record = await (models as any).Tokens.findOne({ where: { token: auth } });
      if (!token_record) { return response.status(401).json({ error: true, message: 'Auth token is invalid...' }); }
      const token = token_record.dataValues;
      if (token.user_agent !== request.get('user-agent')) {
        return response.status(401).json({ error: true, message: 'Token used from invalid client...' });
      }
      const get_user = await (models as any).Users.findOne({ where: { id: token.user_id } });
      const user = get_user.dataValues;
      delete user.password;
      response.locals.you = user;
      return next();
    } else {
      response.locals.you = (request as any).session.you;
      return next();
    }
  })();
}

export function UserAuthorized(request: Request, response: Response, next: NextFunction) {
  const user_id = parseInt(request.params.id, 10);
  const you = (<IRequest> request).session.you;
  if (user_id !== you.id) {
    return response.status(403).json({
      error: true,
      message: `You are not permitted to complete this action.`
    });
  }

  return next();
}

export const whitelist_domains = [
  // dev origins
  'http://localhost:8080',
  'http://localhost:7600',
  'http://localhost:9500',

  // prod origins
  'https://ryanwaite28.github.io',
  'http://rmw-tenant-search-client.herokuapp.com',
  'https://rmw-tenant-search-client.herokuapp.com',
];

export const corsOptions: CorsOptions = {
  // https://expressjs.com/en/resources/middleware/cors.html
  origin(origin: string | undefined, callback: any) {
    const originIsAllowed = whitelist_domains.includes((origin as string));
    // console.log({
    //   origin,
    //   callback,
    //   originIsAllowed,
    // });

    if (!origin) {
      callback(new Error(`Origin "${origin}" Not allowed by CORS`));
      return;
    }
    if (originIsAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin "${origin}" Not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
