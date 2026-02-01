import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Test endpoint to verify email sending works
// Usage: POST /api/test-email with { email: "your@email.com" }
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Finzo <onboarding@resend.dev>',
      to: email,
      subject: '🎉 Finzo Email Test - It Works!',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #03DAC6; font-size: 28px; margin: 0 0 8px 0;">Finzo</h1>
              </div>
              <div style="background: #141414; border-radius: 16px; padding: 24px; border: 1px solid #252525;">
                <h2 style="color: #FFFFFF; font-size: 18px; margin: 0 0 16px 0;">
                  ✅ Email Notifications Working!
                </h2>
                <p style="color: #AAAAAA; font-size: 14px; line-height: 1.6; margin: 0;">
                  Great news! Your email notification system is set up correctly.
                  You'll receive payment reminders when recurring transactions are due.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send email', details: String(error) }, { status: 500 });
  }
}
