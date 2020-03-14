import * as express from 'express';

import * as GET from './methods/get';
import * as POST from './methods/post';
import * as PUT from './methods/put';
import * as DELETE from './methods/delete';
import { SessionRequired } from '../../chamber';

export const UsersController: express.Router = express.Router();

/** GET routes */

UsersController.get('/check_session', GET.check_session);
UsersController.get('/sign_out', GET.sign_out);
UsersController.get('/:id/home-listings', GET.user_home_listings);
UsersController.get('/:id/home-listings/:home_listing_id', GET.user_home_listings);
UsersController.get('/:id/location-preferences', GET.user_location_preferences);
UsersController.get('/:id/location-preferences/:location_preference_id', GET.user_location_preferences);


/** POST routes */

UsersController.post('/', POST.sign_up);
UsersController.post('/:id/home-listings', SessionRequired, POST.create_home_listing);
UsersController.post('/:id/location-preferences', SessionRequired, POST.create_location_preference);

/** PUT routes */

UsersController.put('/', PUT.sign_in);
UsersController.put('/:id/settings', SessionRequired, PUT.update_profile_settings);
UsersController.put('/:id/icon', SessionRequired, PUT.update_profile_icon);
UsersController.put('/:id/home-listings/:home_listing_id', SessionRequired, PUT.update_home_listing);

/** DELETE routes */

UsersController.delete('/:id/location-preferences/:location_preference_id', DELETE.delete_location_preference);
UsersController.delete('/:id/home-listings/:home_listing_id', SessionRequired, DELETE.delete_home_listing);
