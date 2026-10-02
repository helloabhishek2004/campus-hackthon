import { NextResponse } from 'next/server';
import { approvalsOk } from '../../../lib/emergency/approvals';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Mock Approvers: Simulate that the current session has a responder and security head
        // In a real application, this is verified via the auth cookie.
        const approvers = [
            { id: 991, role: "responder" },
            { id: 992, role: "security_head" } // With this, campus_wide will be approved!
        ];

        const isApproved = approvalsOk(body.scope, approvers);

        if (!isApproved) {
            return NextResponse.json({ error: "Insufficient permissions for this scope. Security Head or multiple responders required." }, { status: 403 });
        }

        // Return a mock success response simulating the notifications fan-out!
        return NextResponse.json({ 
            success: true, 
            message: `ALERT SENT via SMS, Push, and Email to ${body.scope === 'campus_wide' ? 'ALL USERS' : 'TARGETED AUDIENCE'}!`,
            data: body 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
