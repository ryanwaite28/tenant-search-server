import { IUserModel } from './user-model.interface';

export interface IHomeListingModel {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  amenities: string;
  home_type: string;
  links: string;
  deposit: number;
  rent: number;
  lease_type: string;
  lease_duration: number;
  link_text: string;
  link_href: string;
  icon_link: string;
  icon_id: string;
  street: string;
  street_cont: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  date_created: string;
  last_edited: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  //
  home_owner?: IUserModel;
  linksList?: string[];
}
