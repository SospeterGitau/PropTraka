'use server';

import { db, auth } from '@/firebase-admin'; // Ensure you have firebase-admin set up for server-side auth creation
import { Invitation, Tenant, UserSettings } from '@/lib/db-types';
import { sendInvitationEmail } from '@/lib/email';
import { Timestamp } from 'firebase-admin/firestore';
import { hash } from 'crypto'; // Or simple random token gen
import { randomBytes } from 'crypto';
import { getSession } from '@/lib/session';

// Helper to generate a secure token
function generateToken(): string {
    return randomBytes(32).toString('hex');
}

export async function createInvitation(tenantId: string) {
    try {
        const session = await getSession();
        if (!session || !session.uid) {
            throw new Error('Unauthorized');
        }

        const landlordId = session.uid;

        // 1. Fetch Tenant
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        if (!tenantDoc.exists) {
            throw new Error('Tenant not found');
        }
        const tenantData = tenantDoc.data() as Tenant;

        // Verify ownership
        if (tenantData.ownerId !== landlordId) {
            throw new Error('Unauthorized access to this tenant');
        }

        // Check if already invited or linked
        if (tenantData.authUserId) {
            return { success: false, message: 'Tenant already has an account.' };
        }

        // 2. Create Invitation Token
        const token = generateToken();
        const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        const invitationData: Invitation = {
            tenantId,
            email: tenantData.email,
            token,
            expiresAt: expiresAt as any, // Admin SDK Timestamp type casting
            used: false,
            ownerId: landlordId,
            createdAt: Timestamp.now() as any,
        };

        // 3. Save Invitation to DB
        await db.collection('invitations').add(invitationData);

        // 4. Update Tenant Status
        await db.collection('tenants').doc(tenantId).update({
            invitationStatus: 'Pending',
            updatedAt: Timestamp.now(),
        });

        // 5. Fetch Landlord Name (optional, nice to have)
        const userSettingsDoc = await db.collection('user_settings').doc(landlordId).get(); // Assuming 'user_settings' collection
        let landlordName = 'Your Landlord';
        if (userSettingsDoc.exists) {
            // Ideally we store name in AppUser, but fallback to something
            // For now, hardcode or fetch from profile if available.
            // Let's assume we pass "Your Landlord" for MVP or fetch AppUser if exists
        }

        // Construct Invite Link
        // In dev: http://localhost:9002/accept-invite?token=...
        // In prod: https://your-domain.com/accept-invite?token=...
        // We need a way to get the base URL. For server actions, use process.env or relative if client redirect.
        // Ideally user defines NEXT_PUBLIC_BASE_URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
        const inviteLink = `${baseUrl}/accept-invite?token=${token}`;

        // 6. Send Email
        await sendInvitationEmail(tenantData.email, inviteLink, landlordName);

        return { success: true, message: 'Invitation sent successfully.' };
    } catch (error) {
        console.error('Create Invitation Error:', error);
        return { success: false, message: 'Failed to create invitation.' };
    }
}

export async function validateInvitation(token: string) {
    try {
        const querySnapshot = await db.collection('invitations')
            .where('token', '==', token)
            .where('used', '==', false)
            .limit(1)
            .get();

        if (querySnapshot.empty) {
            return { valid: false, message: 'Invalid or used invitation.' };
        }

        const inviteDoc = querySnapshot.docs[0];
        const inviteData = inviteDoc.data() as Invitation;

        // Check expiration
        const now = Timestamp.now();
        if (inviteData.expiresAt.toMillis() < now.toMillis()) {
            return { valid: false, message: 'Invitation has expired.' };
        }

        // Fetch tenant details for display
        const tenantDoc = await db.collection('tenants').doc(inviteData.tenantId).get();
        const tenantData = tenantDoc.data() as Tenant;

        return {
            valid: true,
            data: {
                email: inviteData.email,
                name: `${tenantData.firstName} ${tenantData.lastName}`,
                tenantId: inviteData.tenantId,
                inviteId: inviteDoc.id
            }
        };
    } catch (error) {
        console.error('Validate Invitation Error:', error);
        return { valid: false, message: 'Error validating invitation.' };
    }
}

export async function acceptInvitation(token: string, password: string) {
    try {
        // 1. Validate again
        const validation = await validateInvitation(token);
        if (!validation.valid || !validation.data) {
            throw new Error(validation.message);
        }

        const { email, name, tenantId, inviteId } = validation.data;

        // 2. Create Firebase Auth User
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true // Assume trusted since they got the invite email
        });

        // 3. Create AppUser Document
        const appUserData = {
            id: userRecord.uid,
            email,
            displayName: name,
            role: 'Tenant',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await db.collection('users').doc(userRecord.uid).set(appUserData);

        // 4. Update Invitation as Used
        await db.collection('invitations').doc(inviteId).update({
            used: true
        });

        // 5. Update Tenant Record: Link authUser and set status
        await db.collection('tenants').doc(tenantId).update({
            authUserId: userRecord.uid,
            invitationStatus: 'Accepted',
            updatedAt: Timestamp.now()
        });

        return { success: true };

    } catch (error: any) {
        console.error('Accept Invitation Error:', error);
        return { success: false, message: error.message || 'Failed to accept invitation.' };
    }
}
