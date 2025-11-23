import { sendEmail } from './emailService.js';

/**
 * Creates an in-app notification and optionally sends an email.
 * @param {object} base44 - The base44 client instance
 * @param {string} userId - The recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} link - URL to redirect to
 * @param {object} metadata - Additional data
 * @param {boolean} sendMail - Whether to send an email
 */
export const createNotification = async (base44, { userId, type, title, message, link, metadata, sendMail = true }) => {
  try {
    // 1. Create In-App Notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      type,
      title,
      message,
      link,
      metadata,
      is_read: false,
      created_at: new Date().toISOString()
    });

    // 2. Send Email (if requested)
    if (sendMail) {
      const user = await base44.asServiceRole.entities.User.get(userId);
      if (user && user.email) {
        const buttonHtml = link ? `<a href="${link.startsWith('http') ? link : `https://${process.env.BASE44_APP_ID}.base44.app${link}`}" class="button">Visa i appen</a>` : '';
        const emailContent = `
          <p>${message}</p>
          ${buttonHtml}
        `;
        await sendEmail(user.email, title, emailContent, title);
      }
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw, we don't want to break the main flow if notification fails
  }
};