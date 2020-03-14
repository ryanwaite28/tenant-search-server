export interface IUserModel {
  id: number;
  first_name: string;
  middle_initial: string;
  last_name: string;
  displayname: string;
  username: string;
  email: string; // changable
  password: string; // changable
  credit_score: number; // changable
  gross_income: number; // changable
  net_income: number; // changable
  income_sources_count: number; // changable
  paypal: string;
  account_type: string;
  search_status: string; // changable
  bio: string; // changable
  tags: string;
  link_text: string;
  link_href: string;
  icon_link: string;
  icon_id: string;
  location: string;
  account_verified: boolean;
  date_created: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
}
