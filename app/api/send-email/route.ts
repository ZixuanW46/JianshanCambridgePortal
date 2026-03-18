import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { to, subject, type, name, decision } = await req.json();

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!to || !emailRegex.test(to)) {
            return NextResponse.json({ error: 'Invalid or missing email address' }, { status: 400 });
        }

        if (!subject) {
            return NextResponse.json({ error: 'Missing subject' }, { status: 400 });
        }

        let html = '';

        if (type === 'submission') {
            const templatePath = path.join(process.cwd(), 'lib/email-templates/submission.html');
            const template = fs.readFileSync(templatePath, 'utf8');
            html = template.replace('{{name}}', name || 'Applicant');
        } else if (type === 'decision') {
            const templatePath = path.join(process.cwd(), 'lib/email-templates/decision.html');
            const template = fs.readFileSync(templatePath, 'utf8');
            html = template.replace('{{name}}', name || 'Applicant');
        } else if (type === 'round2') {
            const templatePath = path.join(process.cwd(), 'lib/email-templates/round2.html');
            const template = fs.readFileSync(templatePath, 'utf8');
            html = template.replace('{{name}}', name || 'Applicant');
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
