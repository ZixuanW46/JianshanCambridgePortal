import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Verify the request is from an admin user
async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.admin) {
        throw new Error('Forbidden: Admin access required');
    }
    return decodedToken;
}

// GET: Get all applications (admin only)
export async function GET(req: NextRequest) {
    try {
        await verifyAdmin(req);
        const snapshot = await adminDb.collection('applications').get();
        const applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return NextResponse.json({ data: applications });
    } catch (error: any) {
        const status = error.message === 'Unauthorized' ? 401 : error.message.includes('Forbidden') ? 403 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}

// POST: Set admin claims for a user (super admin only)
export async function POST(req: NextRequest) {
    try {
        await verifyAdmin(req);
        const { targetUid, isAdmin } = await req.json();
        if (!targetUid) {
            return NextResponse.json({ error: 'Missing targetUid' }, { status: 400 });
        }
        await adminAuth.setCustomUserClaims(targetUid, { admin: !!isAdmin });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        const status = error.message === 'Unauthorized' ? 401 : error.message.includes('Forbidden') ? 403 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}
