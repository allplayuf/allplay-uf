import { base44 } from '@/api/base44Client';

export const sendEmail = async (to, subject, content, title = "AllPlay UF") => {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #131816; color: #F4F7F5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #121715; border: 1px solid #223029; border-radius: 8px; overflow: hidden; }
          .header { background-color: #0F1513; padding: 20px; text-align: center; border-bottom: 1px solid #223029; }
          .logo { color: #2BA84A; font-size: 24px; font-weight: bold; text-decoration: none; }
          .content { padding: 30px; color: #EAF6EE; line-height: 1.6; }
          .button { display: inline-block; background-color: #2BA84A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #7B8A83; border-top: 1px solid #223029; background-color: #0F1513; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">AllPlay UF</span>
          </div>
          <div class="content">
            <h2 style="color: #2BA84A; margin-top: 0;">${title}</h2>
            ${content}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AllPlay UF. Alla rättigheter förbehållna.
            <br>
            <small>Du får detta mail för att du är registrerad på AllPlay UF.</small>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await base44.integrations.Core.SendEmail({
      to,
      subject,
      body: htmlBody,
      from_name: "AllPlay UF"
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};