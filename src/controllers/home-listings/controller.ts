import { Request, Response } from 'express';
import * as express from 'express';

// @ts-ignore
import * as GET from './methods/get';
// @ts-ignore
import * as POST from './methods/post';
// @ts-ignore
import * as PUT from './methods/put';
// @ts-ignore
import * as DELETE from './methods/delete';


export const HomeListingsController: express.Router = express.Router();

/** GET routes */

HomeListingsController.get('/:id', GET.home_listing_by_id);
HomeListingsController.get('/:id/location-preferences-by-state', GET.possible_tenants_by_state);
HomeListingsController.get('/:id/location-preferences-by-state/:location_preference_id', GET.possible_tenants_by_state);
HomeListingsController.get('/:id/location-preferences-by-state-and-city', GET.possible_tenants_by_state_and_city);
HomeListingsController.get('/:id/location-preferences-by-state-and-city/:location_preference_id', GET.possible_tenants_by_state_and_city);
HomeListingsController.get('/:id/requests', GET.requests_by_home_listing_id);
HomeListingsController.get('/:id/requests/:request_id', GET.requests_by_home_listing_id);

/** POST routes */



/** PUT routes */



/** DELETE routes */

