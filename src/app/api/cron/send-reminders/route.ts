import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
}

// Helper to get day suffix (1st, 2nd, 3rd, etc.)
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayDay = today.getDate();
    const tomorrowDay = todayDay + 1;
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Get all recurring transactions
    const transactionsSnapshot = await adminDb
      .collection('transactions')
      .where('isRecurring', '==', true)
      .get();

    // Group transactions by user
    const userTransactions: Map<string, {
      email: string;
      todayPayments: Array<{ description: string; amount: number }>;
      tomorrowPayments: Array<{ description: string; amount: number }>;
    }> = new Map();

    for (const doc of transactionsSnapshot.docs) {
      const transaction = doc.data();
      const transactionDate = transaction.date.toDate();
      const dayOfMonth = transactionDate.getDate();

      // Check if this month is excluded
      const excludedMonths = transaction.excludedMonths || [];
      if (excludedMonths.includes(currentMonth)) {
        continue;
      }

      // Check if user has email notifications enabled (default to true for now)
      // We'll add preferences later
      const userId = transaction.userId;

      // Get user email from the users collection or store it when they sign in
      // For now, we'll need to fetch it from a users collection

      const isToday = dayOfMonth === todayDay;
      const isTomorrow = dayOfMonth === tomorrowDay;

      if (!isToday && !isTomorrow) {
        continue;
      }

      if (!userTransactions.has(userId)) {
        // Try to get user email from users collection
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData?.email) {
          continue; // Skip if no email
        }

        // Check if notifications are enabled (default true)
        if (userData.emailNotifications === false) {
          continue;
        }

        userTransactions.set(userId, {
          email: userData.email,
          todayPayments: [],
          tomorrowPayments: [],
        });
      }

      const userEntry = userTransactions.get(userId)!;
      const paymentInfo = {
        description: transaction.description,
        amount: transaction.amount,
      };

      if (isToday) {
        userEntry.todayPayments.push(paymentInfo);
      } else {
        userEntry.tomorrowPayments.push(paymentInfo);
      }
    }

    // Send emails to each user
    const emailPromises: Promise<any>[] = [];

    for (const [userId, userData] of userTransactions) {
      if (userData.todayPayments.length === 0 && userData.tomorrowPayments.length === 0) {
        continue;
      }

      const emailHtml = generateEmailHtml(userData.todayPayments, userData.tomorrowPayments, today);

      emailPromises.push(
        resend.emails.send({
          from: process.env.EMAIL_FROM || 'Finzo <onboarding@resend.dev>',
          to: userData.email,
          subject: getEmailSubject(userData.todayPayments, userData.tomorrowPayments),
          html: emailHtml,
        })
      );
    }

    const results = await Promise.allSettled(emailPromises);
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      totalUsers: userTransactions.size,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}

function getEmailSubject(todayPayments: Array<any>, tomorrowPayments: Array<any>): string {
  if (todayPayments.length > 0 && tomorrowPayments.length > 0) {
    return `💰 Finzo: You have payments due today and tomorrow`;
  } else if (todayPayments.length > 0) {
    return `💰 Finzo: You have ${todayPayments.length} payment${todayPayments.length > 1 ? 's' : ''} due today`;
  } else {
    return `💰 Finzo: Reminder - ${tomorrowPayments.length} payment${tomorrowPayments.length > 1 ? 's' : ''} due tomorrow`;
  }
}

function generateEmailHtml(
  todayPayments: Array<{ description: string; amount: number }>,
  tomorrowPayments: Array<{ description: string; amount: number }>,
  today: Date
): string {
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let paymentsHtml = '';

  if (todayPayments.length > 0) {
    paymentsHtml += `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #CF6679; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">
          ⚠️ Due Today
        </h2>
        ${todayPayments.map(p => `
          <div style="background: #1E1E1E; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span style="color: #FFFFFF;">${p.description}</span>
            <span style="color: ${p.amount < 0 ? '#CF6679' : '#03DAC6'}; font-weight: 600;">
              ${p.amount < 0 ? '-' : '+'}${formatCurrency(p.amount)}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (tomorrowPayments.length > 0) {
    paymentsHtml += `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #FFB74D; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">
          📅 Due Tomorrow
        </h2>
        ${tomorrowPayments.map(p => `
          <div style="background: #1E1E1E; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span style="color: #FFFFFF;">${p.description}</span>
            <span style="color: ${p.amount < 0 ? '#CF6679' : '#03DAC6'}; font-weight: 600;">
              ${p.amount < 0 ? '-' : '+'}${formatCurrency(p.amount)}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #03DAC6; font-size: 28px; margin: 0 0 8px 0; font-weight: bold;">Finzo</h1>
            <p style="color: #666666; font-size: 14px; margin: 0;">${todayFormatted}</p>
          </div>

          <!-- Main Card -->
          <div style="background: #141414; border-radius: 16px; padding: 24px; border: 1px solid #252525;">
            <h2 style="color: #FFFFFF; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
              Payment Reminder
            </h2>

            ${paymentsHtml}

            <!-- CTA Button -->
            <a href="https://finzo.vercel.app/dashboard"
               style="display: block; background: #03DAC6; color: #000000; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 600; text-align: center; margin-top: 24px;">
              View in Finzo
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #444444; font-size: 12px; margin: 0;">
              You're receiving this because you have email notifications enabled in Finzo.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
