import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: homework, error: homeworkError } = await supabase
      .from('homework')
      .select('*, lesson:lessons(*)')
      .eq('due_date', tomorrowStr);

    if (homeworkError) {
      throw homeworkError;
    }

    if (!homework || homework.length === 0) {
      return NextResponse.json({ message: 'No homework due tomorrow', sent: 0 });
    }

    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student');

    if (studentsError) {
      throw studentsError;
    }

    const { data: submissions } = await supabase
      .from('homework_submissions')
      .select('homework_id, student_id');

    const submissionSet = new Set(
      submissions?.map(s => `${s.homework_id}-${s.student_id}`) || []
    );

    const notifications: { studentEmail: string; studentName: string; homeworkDescription: string; lessonTitle: string; dueDate: string }[] = [];

    for (const hw of homework) {
      for (const student of students || []) {
        const key = `${hw.id}-${student.id}`;
        if (!submissionSet.has(key)) {
          notifications.push({
            studentEmail: student.email,
            studentName: student.name,
            homeworkDescription: hw.description,
            lessonTitle: hw.lesson?.title || 'Unknown Lesson',
            dueDate: hw.due_date,
          });
        }
      }
    }

    if (process.env.RESEND_API_KEY) {
      for (const notification of notifications) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Sprout <notifications@tutorboard.app>',
              to: notification.studentEmail,
              subject: `Reminder: Homework due tomorrow - ${notification.homeworkDescription}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #3b82f6;">Homework Reminder</h2>
                  <p>Hi ${notification.studentName},</p>
                  <p>This is a friendly reminder that you have homework due tomorrow:</p>
                  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0; font-weight: bold;">${notification.homeworkDescription}</p>
                    <p style="margin: 8px 0 0; color: #6b7280;">Lesson: ${notification.lessonTitle}</p>
                    <p style="margin: 8px 0 0; color: #6b7280;">Due: ${new Date(notification.dueDate).toLocaleDateString()}</p>
                  </div>
                  <p>Don't forget to submit your work before the deadline!</p>
                  <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                    - The Sprout Team
                  </p>
                </div>
              `,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }
    }

    return NextResponse.json({ 
      message: 'Notifications processed', 
      sent: notifications.length,
      notifications: notifications.map(n => ({
        email: n.studentEmail,
        homework: n.homeworkDescription,
      })),
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger notifications',
    description: 'This endpoint sends email reminders to students with homework due tomorrow',
  });
}
