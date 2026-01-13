import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Send daily emails
    await EmailService.sendDailyEmails();

    return NextResponse.json({ 
      success: true, 
      message: 'Daily emails sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in daily emails cron job:', error);
    return NextResponse.json(
      { error: 'Failed to send daily emails' }, 
      { status: 500 }
    );
  }
}

// Allow GET for testing purposes
export async function GET() {
  try {
    await EmailService.sendDailyEmails();
    return NextResponse.json({ 
      success: true, 
      message: 'Test daily emails sent successfully' 
    });
  } catch (error) {
    console.error('Error in test daily emails:', error);
    return NextResponse.json(
      { error: 'Failed to send test daily emails' }, 
      { status: 500 }
    );
  }
}

