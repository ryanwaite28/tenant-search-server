export function send_email(from: string, to: string, subject: string, html: string) {
  return new Promise((resolve, reject) => {
    const api_key = process.env.SENDGRID_API_KEY;
    if (!api_key) {
      const msgError = `Sendgrid credential is missing; mailing attempt canceled.`;
      console.log({ error: msgError });
      return reject({ error: msgError });
    }

    const senderEmail = from || process.env.SENDGRID_USERNAME;
    if (!senderEmail) {
      const msgError = `A 'from' email is missing.`;
      console.log({ error: msgError });
      return reject({ error: msgError });
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(api_key);

    const email = { from: senderEmail, to, subject, html };
    sgMail.send(email)
    .then((result: any) => {
      console.log('email sent ---');
      // console.log(result);
      return resolve({ error: false });
    })
    .catch((error: any) => {
      console.log('email failed ---');
      // console.log(error);
      return reject({ error });
    });
  });
}
