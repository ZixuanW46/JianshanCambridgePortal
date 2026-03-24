import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { to, subject, type, name, decision, deadline } = await req.json();

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const recipients = (Array.isArray(to) ? to : [to])
            .filter((email): email is string => typeof email === 'string')
            .map((email) => email.trim())
            .filter((email, index, emails) => email.length > 0 && emails.indexOf(email) === index);

        if (recipients.length === 0 || recipients.some((email) => !emailRegex.test(email))) {
            return NextResponse.json({ error: 'Invalid or missing email address' }, { status: 400 });
        }

        if (!subject) {
            return NextResponse.json({ error: 'Missing subject' }, { status: 400 });
        }

        const templateMap: Record<string, string> = {
            submission: 'submission.html',
            round2_submission: 'round2-submission.html',
            round2: 'round2.html',
            decision_accepted: 'decision-accepted.html',
            decision_rejected: 'decision-rejected.html',
            decision_waitlisted: 'decision-waitlisted.html',
            decision_waitlist_promoted: 'decision-waitlist-promoted.html',
        };

        const templateFile = templateMap[type];
        if (!templateFile) {
            return NextResponse.json({ error: 'Unsupported email type' }, { status: 400 });
        }

        const templatePath = path.join(process.cwd(), 'lib/email-templates', templateFile);
        const template = fs.readFileSync(templatePath, 'utf8');
        const replacements: Record<string, string> = {
            '{{name}}': name || 'Applicant',
            '{{decision}}': decision || '',
            '{{deadline}}': deadline || '',
        };

        let html = template;
        Object.entries(replacements).forEach(([token, value]) => {
            html = html.replaceAll(token, value);
        });

        const { data, error } = await resend.emails.send({
            from: 'Jianshan Academy <noreply@jianshanacademy.com>',
            to: recipients,
            replyTo: 'camcapy@cambridgesu.co.uk',
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
