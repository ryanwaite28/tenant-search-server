import { IUserModel } from './user-model.interface';

export interface ILocationPreferenceModel {
  id: number;
  user_id: number;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  home_type: string;
  date_created: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  //
  user?: IUserModel;
}
