import * as express from 'express';

import * as GET from './methods/get';
import * as POST from './methods/post';
import * as PUT from './methods/put';
import * as DELETE from './methods/delete';
import {
  SessionRequired,
  UserAuthorized,
} from '../../chamber';

export const UsersController: express.Router = express.Router();

/** GET routes */

UsersController.get('/check_session', GET.check_session);
UsersController.get('/sign_out', GET.sign_out);
UsersController.get('/:id/notifications', SessionRequired, UserAuthorized, GET.user_notifications);
UsersController.get('/:id/notifications/:notification_id', SessionRequired, UserAuthorized, GET.user_notifications);
UsersController.get('/:id/tenant-requests', GET.requests_by_home_owner_id);
UsersController.get('/:id/tenant-requests/:request_id', GET.requests_by_home_owner_id);
UsersController.get('/:id/home-listings-requests', GET.requests_by_tenant_id);
UsersController.get('/:id/home-listings-requests/:request_id', GET.requests_by_tenant_id);
UsersController.get('/:id/home-listings', GET.user_home_listings);
UsersController.get('/:id/home-listings/:home_listing_id', GET.user_home_listings);
UsersController.get('/:id/location-preferences', GET.user_location_preferences);
UsersController.get('/:id/location-preferences/:location_preference_id', GET.user_location_preferences);

/** POST routes */

UsersController.post('/', POST.sign_up);
UsersController.post('/:id/home-listings', SessionRequired, UserAuthorized, POST.create_home_listing);
UsersController.post('/:id/location-preferences', SessionRequired, UserAuthorized, POST.create_location_preference);

/** PUT routes */

UsersController.put('/', PUT.sign_in);
UsersController.put('/:id/settings', SessionRequired, UserAuthorized, PUT.update_profile_settings);
UsersController.put('/:id/icon', SessionRequired, UserAuthorized, PUT.update_profile_icon);
UsersController.put('/:id/password', SessionRequired, UserAuthorized, PUT.update_profile_password);
UsersController.put('/:id/home-listings/:home_listing_id', SessionRequired, UserAuthorized, PUT.update_home_listing);
UsersController.put('/:id/home-listings-requests/:request_id/accept', SessionRequired, UserAuthorized, PUT.accept_request);
UsersController.put('/:id/home-listings-requests/:request_id/decline', SessionRequired, UserAuthorized, PUT.decline_request);

/** DELETE routes */

UsersController.delete('/:id/location-preferences/:location_preference_id', SessionRequired, UserAuthorized, DELETE.delete_location_preference);
UsersController.delete('/:id/home-listings/:home_listing_id', SessionRequired, UserAuthorized, DELETE.delete_home_listing);
