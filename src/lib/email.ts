import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function sendInvitationEmail(to: string, inviteLink: string, landlordName: string) {
    // Graceful fallback if credentials are not configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not set. Logging invitation instead.');
        console.log(`[EMAIL SIMULATION] To: ${to}`);
        console.log(`[EMAIL SIMULATION] Subject: You have been invited to PropTraka`);
        console.log(`[EMAIL SIMULATION] Body: Hello! ${landlordName} has invited you to join PropTraka. Click here to set up your account: ${inviteLink}`);
        return; // Do not attempt sending
    }

    try {
        const info = await transporter.sendMail({
            from: `"PropTraka" <${process.env.GMAIL_USER}>`,
            to,
            subject: 'You have been invited to PropTraka',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Welcome to PropTraka!</h2>
          <p>Hello,</p>
          <p><strong>${landlordName}</strong> has invited you to join PropTraka to manage your tenancy.</p>
          <p>Click the button below to accept the invitation and set up your account:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} PropTraka. All rights reserved.</p>
        </div>
      `,
        });

    });
} catch (error) {
    console.error('Error sending email:', error);
    // Fallback log even if send fails, to avoid blocking flow during dev
    console.log(`[EMAIL FAILURE BACKUP] Link for ${to}: ${inviteLink}`);
    throw new Error('Failed to send invitation email.');
}
}
