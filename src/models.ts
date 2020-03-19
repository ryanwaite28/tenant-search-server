import * as Sequelize from 'sequelize';
import {
  greatUniqueValue,
  LEASE_TYPES,
  USER_ACCOUNT_TYPES,
  generateResetPasswordCode
} from './chamber';

/**
 * @see: https://sequelize.org/master/manual/typescript
 */

export interface IMyModel extends Sequelize.Model {
  readonly id: number;
  [key: string]: any;
}

export type MyModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): IMyModel;
};

let sequelize: Sequelize.Sequelize;
let db_env: string;

if (process.env.DATABASE_URL) {
  db_env = 'Production';
  const opts: Sequelize.Options = {
    dialect: 'postgres',
    dialectOptions: {
      ssl: true
    }
  };
  sequelize = new Sequelize.Sequelize(process.env.DATABASE_URL, opts);
} else {
  db_env = 'Development';
  const opts: Sequelize.Options = {
    dialect: 'sqlite',
    storage: 'database.sqlite',
  };
  sequelize = new Sequelize.Sequelize('database', 'username', 'password', opts);
}

export const Users = <MyModelStatic> sequelize.define('users', {
  first_name:              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  middle_initial:          { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  last_name:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  displayname:             { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  username:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  email:                   { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  password:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  credit_score:            { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  gross_income:            { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  net_income:              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  income_sources_count:    { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  preferred_rent:          { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  max_rent:                { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  phone:                   { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
  account_type:            { type: Sequelize.STRING(250), allowNull: false },
  search_status:           { type: Sequelize.STRING(250), allowNull: false },
  bio:                     { type: Sequelize.STRING(250), allowNull: false, defaultValue: '' },
  tags:                    { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  link_text:               { type: Sequelize.STRING(250), allowNull: false, defaultValue: '' },
  link_href:               { type: Sequelize.STRING(250), allowNull: false, defaultValue: '' },
  icon_link:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  icon_id:                 { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  location:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  account_verified:        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:            { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                    { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true, indexes: [{ unique: true, fields: ['email', 'username', 'uuid'] }] });

export const UserLocationPreferences = <MyModelStatic> sequelize.define('user_location_preferences', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  city:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  state:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  zipcode:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  country:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  home_type:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true, indexes: [{ unique: true, fields: ['uuid'] }] });

export const UserFields = <MyModelStatic> sequelize.define('user_fields', {
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  name:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  type:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  value:           { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  uuid:            { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const Tokens = <MyModelStatic> sequelize.define('tokens', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  device:              { type: Sequelize.STRING(500), allowNull: false },
  token:               { type: Sequelize.STRING(500), allowNull: false, unique: true },
  ip_address:          { type: Sequelize.STRING(500), allowNull: false },
  user_agent:          { type: Sequelize.STRING(500), allowNull: false },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  date_last_used:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const ResetPasswordRequests = <MyModelStatic> sequelize.define('reset_password_requests', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  completed:           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 },
  unique_value:        { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const Blockings = <MyModelStatic> sequelize.define('blockings', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  blocks_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const Follows = <MyModelStatic> sequelize.define('follows', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  follows_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const FollowRequests = <MyModelStatic> sequelize.define('follow_requests', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  follows_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const UserRatings = <MyModelStatic> sequelize.define('user_reviews', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  writer_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  rating:              { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  summary:             { type: Sequelize.STRING(250), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, unique: true, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const Notifications = <MyModelStatic> sequelize.define('notifications', {
  from_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  to_id:               { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  action:              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  target_type:         { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  target_id:           { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  message:             { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  link:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  read:                { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  image_link:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const ContentSubscriptions = <MyModelStatic> sequelize.define('content_subscriptions', {
  user_id:                    { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  subscribes_to_id:           { type: Sequelize.INTEGER, allowNull: true, references: { model: Users, key: 'id' } },
  subscribe_content_type:     { type: Sequelize.STRING(500), allowNull: false },
  date_created:               { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                       { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const Conversations = <MyModelStatic> sequelize.define('conversations', {
  creator_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  title:               { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const ConversationMembers = <MyModelStatic> sequelize.define('conversation_members', {
  conversation_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: Conversations, key: 'id' } },
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  role:                { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const ConversationMessages = <MyModelStatic> sequelize.define('conversation_messages', {
  conversation_id:    { type: Sequelize.INTEGER, allowNull: false, references: { model: Conversations, key: 'id' } },
  user_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  body:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  seen:               { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const Messages = <MyModelStatic> sequelize.define('messages', {
  sender_id:              { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  recipient_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  content:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  opened:                 { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:           { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                   { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const AccountsReported = <MyModelStatic> sequelize.define('accounts_reported', {
  user_id:               { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  reporting_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  issue_type:            { type: Sequelize.STRING(250), allowNull: false },
  details:               { type: Sequelize.TEXT, allowNull: false },
  date_created:          { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                  { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });



export const HomeListings = <MyModelStatic> sequelize.define('home_listings', {
  owner_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  title:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  description:         { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  amenities:           { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  home_type:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  links:               { type: Sequelize.TEXT, allowNull: true, defaultValue: '' },
  deposit:             { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  rent:                { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  lease_type:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  lease_duration:      { type: Sequelize.INTEGER, allowNull: false },
  link_text:           { type: Sequelize.STRING(250), allowNull: false, defaultValue: '' },
  link_href:           { type: Sequelize.STRING(250), allowNull: false, defaultValue: '' },
  icon_link:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  icon_id:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  street:              { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  street_cont:         { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  city:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  state:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  zipcode:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  country:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  last_edited:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const HomeListingPictures = <MyModelStatic> sequelize.define('home_listing_pictures', {
  home_listing_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: HomeListings, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

export const HomeListingRequests = <MyModelStatic> sequelize.define('home_listing_requests', {
  home_listing_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: HomeListings, key: 'id' } },
  home_owner_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  tenant_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: Users, key: 'id' } },
  message:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  pre_approved:        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  accepted:            { type: Sequelize.BOOLEAN, allowNull: true },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, { freezeTableName: true, underscored: true });

/** Relationships */

Users.hasMany(UserLocationPreferences, { as: 'location_preferences', foreignKey: 'user_id', sourceKey: 'id' });
UserLocationPreferences.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Users.hasMany(UserFields, { as: 'fields', foreignKey: 'user_id', sourceKey: 'id' });
UserFields.belongsTo(Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

Users.hasMany(Notifications, { as: 'to_notifications', foreignKey: 'to_id', sourceKey: 'id' });
Notifications.belongsTo(Users, { as: 'to', foreignKey: 'to_id', targetKey: 'id' });
Users.hasMany(Notifications, { as: 'from_notifications', foreignKey: 'from_id', sourceKey: 'id' });
Notifications.belongsTo(Users, { as: 'from', foreignKey: 'from_id', targetKey: 'id' });

Users.hasMany(Messages, { as: 'sent', foreignKey: 'sender_id', sourceKey: 'id' });
Messages.belongsTo(Users, { as: 'sender', foreignKey: 'sender_id', targetKey: 'id' });
Users.hasMany(Messages, { as: 'received', foreignKey: 'recipient_id', sourceKey: 'id' });
Messages.belongsTo(Users, { as: 'receiver', foreignKey: 'recipient_id', targetKey: 'id' });

Users.hasMany(HomeListings, { as: 'home_listings', foreignKey: 'owner_id', sourceKey: 'id' });
HomeListings.belongsTo(Users, { as: 'home_owner', foreignKey: 'owner_id', targetKey: 'id' });

Users.hasMany(HomeListingRequests, { as: 'home_listing_requests', foreignKey: 'tenant_id', sourceKey: 'id' });
HomeListingRequests.belongsTo(Users, { as: 'tenant', foreignKey: 'tenant_id', targetKey: 'id' });
Users.hasMany(HomeListingRequests, { as: 'tenant_requests', foreignKey: 'home_owner_id', sourceKey: 'id' });
HomeListingRequests.belongsTo(Users, { as: 'home_owner', foreignKey: 'home_owner_id', targetKey: 'id' });

HomeListings.hasMany(HomeListingPictures, { as: 'pictures', foreignKey: 'home_listing_id', sourceKey: 'id' });
HomeListingPictures.belongsTo(HomeListings, { as: 'home_listing', foreignKey: 'home_listing_id', targetKey: 'id' });

HomeListings.hasMany(HomeListingRequests, { as: 'tenant_requests', foreignKey: 'home_listing_id', sourceKey: 'id' });
HomeListingRequests.belongsTo(HomeListings, { as: 'home_listing', foreignKey: 'home_listing_id', targetKey: 'id' });

/** Init Database */

sequelize.sync({ force: false })
  .then(() => { console.log('Database Initialized! ENV: ' + db_env); })
  .catch((error) => { console.log('Database Failed!', error); });
