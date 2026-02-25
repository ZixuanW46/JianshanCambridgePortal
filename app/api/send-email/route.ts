import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { to, subject, type, name, decision } = await req.json();

        if (!to || !subject) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let html = '';

        if (type === 'submission') {
            html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Application Received</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;">
<div style="width: 100%; max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);">
    <div style="background-color: #1f495b; background-image: linear-gradient(#1f495b, #1f495b); padding: 30px 0; text-align: center; border-bottom: 6px solid #E1B168;">
        <img src="https://i.postimg.cc/kGpxBnh7/Email-Logo.png" alt="Jianshan Academy" width="200" style="display: inline-block; max-width: 300px; height: auto; border: 0; outline: none; text-decoration: none; vertical-align: bottom;" />
    </div>
    <div style="padding: 40px 32px;">
        <div style="margin-bottom: 24px; text-align: left;">
            <span style="vertical-align: text-bottom; display: inline-block; padding: 6px 24px 6px 16px; border-radius: 9999px; background-color: #fff8eb; color: #E1B168; border: 1px solid #faeace; font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                <img src="https://i.postimg.cc/CMGdvCGQ/bell-ring.png" width="15" height="15" alt="notification" style="width: 15px; height: 15px; vertical-align: text-bottom; margin-right: 6px; border: 0; outline: none; display: inline-block;" />APPLICATION RECEIVED
            </span>
        </div>
        <h2 style="font-size: 24px; font-weight: bold; color: #111827; line-height: 1.4; margin-bottom: 24px; text-align: left; font-family: 'Lexend', sans-serif;">Your Tutor Application Has Been Received</h2>
        <div style="color: #4b5563; font-size: 16px; line-height: 1.8;">
            <p style="margin-bottom: 16px;">Dear ${name || 'Applicant'},</p>
            <p style="margin-bottom: 16px;">Thank you for applying to join the Jianshan Academy × Cambridge Summer Programme as a tutor. We truly appreciate the time and thought you have put into your application.</p>
            <p style="margin-bottom: 16px;">Your application will now be carefully reviewed by the Jianshan Academy admissions committee in collaboration with the CAMCapy Society at the University of Cambridge. Every application is read with care.</p>
            <p style="margin-bottom: 16px;">You will be notified of the outcome by email within <strong>15 working days</strong>. You may also log in to the portal at any time to check your application status.</p>
            <p>We look forward to the possibility of working with you this summer!</p>
        </div>
        <div style="margin-top: 40px; margin-bottom: 32px; padding: 30px 0; border-top: 1px dashed #e5e7eb; border-bottom: 1px dashed #e5e7eb; text-align: center;">
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px; margin-top: 0px">Keep an eye on your inbox or log in to track your progress</p>
            <a href="https://jianshanacademy.com" style="display: inline-block; background-color: #1f495b; background-image: linear-gradient(#1f495b, #1f495b); color: white; font-weight: bold; padding: 14px 36px; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(31, 73, 91, 0.3);">Log In to Portal</a>
        </div>
        <div style="text-align: center; font-size: 13px; color: #6b7280;">
            <p>If you have any questions, please contact us at <a style="color: #1f495b; text-decoration: underline;" href="mailto:camcapy@cambridgesu.co.uk">camcapy@cambridgesu.co.uk</a>.</p>
        </div>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 Jianshan Academy. All rights reserved.</p>
    </div>
</div>
</body>
</html>
`;
        } else if (type === 'decision') {
            html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Application Result</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;">
<div style="width: 100%; max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);">
    <div style="background-color: #1f495b; background-image: linear-gradient(#1f495b, #1f495b); padding: 30px 0; text-align: center; border-bottom: 6px solid #E1B168;">
        <img src="https://i.postimg.cc/kGpxBnh7/Email-Logo.png" alt="Jianshan Academy" width="200" style="display: inline-block; max-width: 300px; height: auto; border: 0; outline: none; text-decoration: none; vertical-align: bottom;" />
    </div>
    <div style="padding: 40px 32px;">
        <div style="margin-bottom: 24px; text-align: left;">
            <span style="vertical-align: text-bottom; display: inline-block; padding: 6px 16px; border-radius: 9999px; background-color: #fff8eb; color: #E1B168; border: 1px solid #faeace; font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                <img src="https://i.postimg.cc/CMGdvCGQ/bell-ring.png" width="15" height="15" alt="notification" style="width: 15px; height: 15px; vertical-align: text-bottom; margin-right: 6px; border: 0; outline: none; display: inline-block;" />NEW NOTIFICATION
            </span>
        </div>
        <h2 style="font-size: 24px; font-weight: bold; color: #111827; line-height: 1.4; margin-bottom: 24px; text-align: left; font-family: 'Lexend', sans-serif;">Your Application Decision Is Ready</h2>
        <div style="color: #4b5563; font-size: 16px; line-height: 1.8;">
            <p style="margin-bottom: 16px;">Dear ${name || 'Applicant'},</p>
            <p style="margin-bottom: 16px;">The Jianshan Academy admissions committee has completed its review of your tutor application, and a decision has been made.</p>
            <p>Thank you for your interest in joining the Cambridge Summer Programme as a tutor. Regardless of the outcome, we are grateful for the effort you invested in your application. Please click the button below to log in and view your detailed result and next steps.</p>
        </div>
        <div style="margin-top: 40px; margin-bottom: 32px; padding: 30px 0; border-top: 1px dashed #e5e7eb; border-bottom: 1px dashed #e5e7eb; text-align: center;">
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px; margin-top: 0px">Please log in within 48 hours of receiving this notification</p>
            <a href="https://jianshanacademy.com" style="display: inline-block; background-color: #1f495b; background-image: linear-gradient(#1f495b, #1f495b); color: white; font-weight: bold; padding: 14px 36px; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(31, 73, 91, 0.3);">View Your Decision</a>
        </div>
        <div style="text-align: center; font-size: 13px; color: #6b7280;">
            <p>If you experience any issues logging in, please contact us at <a style="color: #1f495b; text-decoration: underline;" href="mailto:camcapy@cambridgesu.co.uk">camcapy@cambridgesu.co.uk</a>.</p>
        </div>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 Jianshan Academy. All rights reserved.</p>
    </div>
</div>
</body>
</html>
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
