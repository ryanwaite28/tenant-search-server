
import * as nunjucks from 'nunjucks';
import * as path from 'path';

const htmlPath = path.join(__dirname, '../html');
export function installExpressApp(app: Express.Application) {
  nunjucks.configure(htmlPath, {
    autoescape: true,
    express: app
  });
}

/* --- Emails --- */

export function SignedUp_EMAIL(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/SignedUp.html', { data });
}

export function ContactUser_EMAIL(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/ContactUser.html', { data });
}

export function PasswordReset_EMAIL(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/PasswordReset.html', { data });
}

export function PasswordResetSuccess_EMAIL(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/PasswordResetSuccess.html', { data });
}



export function TenantRequest_Sent(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/RequestSent.html', { data });
}

export function TenantRequest_Canceled(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/RequestCanceled.html', { data });
}

export function TenantRequest_Accepted(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/RequestAccepted.html', { data });
}

export function TenantRequest_Declined(data: { [key: string]: any; }) {
  return nunjucks.render('templates/email/RequestDeclined.html', { data });
}