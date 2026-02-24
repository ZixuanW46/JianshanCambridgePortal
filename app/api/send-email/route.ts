import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { to, subject, type, name, decision } = await req.json();

        if (!to || !subject) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let html = '';

        if (type === 'submission') {
            html = `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Cambridge Tutor Programme</h1>
                        <p style="color: #6b7280; font-size: 14px;">Jianshan Academy × CAMCapy</p>
                    </div>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
                        <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">Application Received</h2>
                        <p style="color: #374151; line-height: 1.6;">Dear ${name || 'Applicant'},</p>
                        <p style="color: #374151; line-height: 1.6;">
                            Thank you for submitting your application to the Cambridge Academic Mentoring Programme.
                            We have received your application and our team will review it shortly.
                        </p>
                        <p style="color: #374151; line-height: 1.6;">
                            You can check the status of your application at any time by logging into your portal account.
                        </p>
                        <p style="color: #374151; line-height: 1.6;">
                            We aim to respond within 15 working days.
                        </p>
                    </div>
                    <div style="text-align: center; color: #9ca3af; font-size: 12px;">
                        <p>Cambridge Tutor Programme | Jianshan Academy</p>
                    </div>
                </div>
            `;
        } else if (type === 'decision') {
            const statusMap: Record<string, { title: string; message: string }> = {
                accepted: {
                    title: '🎉 Congratulations!',
                    message: 'We are delighted to inform you that your application has been accepted! Please log into your portal to view the details and confirm your participation.',
                },
                rejected: {
                    title: 'Application Update',
                    message: 'After careful consideration, we regret to inform you that we are unable to offer you a position this time. We encourage you to apply again in the future.',
                },
                waitlisted: {
                    title: 'Waitlisted',
                    message: 'Your application has been placed on our waitlist. We will notify you if a position becomes available. Thank you for your patience.',
                },
            };
            const status = statusMap[decision || ''] || statusMap.rejected;
            html = `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Cambridge Tutor Programme</h1>
                        <p style="color: #6b7280; font-size: 14px;">Jianshan Academy × CAMCapy</p>
                    </div>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
                        <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">${status.title}</h2>
                        <p style="color: #374151; line-height: 1.6;">Dear ${name || 'Applicant'},</p>
                        <p style="color: #374151; line-height: 1.6;">${status.message}</p>
                    </div>
                    <div style="text-align: center; color: #9ca3af; font-size: 12px;">
                        <p>Cambridge Tutor Programme | Jianshan Academy</p>
                    </div>
                </div>
            `;
        }

        const { data, error } = await resend.emails.send({
            from: 'Cambridge Tutor Programme <noreply@jianshanacademy.com>',
            to: [to],
            subject,
            html,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Send email error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
