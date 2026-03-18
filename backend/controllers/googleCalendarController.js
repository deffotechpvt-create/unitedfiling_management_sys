const { google } = require('googleapis');
const { oauth2Client, getAuthUrl } = require('../utils/googleClient');
const User = require('../models/User');
const CalendarEvent = require('../models/CalendarEvent');
const Client = require('../models/Client');

/**
 * Helper to sync user's upcoming events to Google Calendar
 */
const syncUserEventsToGoogle = async (user, oauth2ClientInstance) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2ClientInstance });

        let filter = {};
        if (user.role === 'USER') {
            const client = await Client.findOne({ userId: user._id });
            if (!client) return; // No client profile
            filter = { client: client._id };
        } else if (user.role === 'ADMIN') {
            filter = { $or: [{ assignedTo: user._id }, { createdBy: user._id }] };
        }

        // Only sync upcoming/pending events to avoid cluttering past calendar
        filter.status = { $in: ['pending', 'in_progress', 'needs_action', 'waiting_for_client', 'overdue', 'delayed'] };

        // Exclude events already synced by this user
        filter['googleSyncHistory.user'] = { $ne: user._id };

        const events = await CalendarEvent.find(filter).populate('company', 'name');

        console.log(`[Google Sync] Syncing ${events.length} events for user ${user._id}`);
        for (const event of events) {
            const startDate = new Date(event.deadlineDate);
            const endDate = new Date(event.deadlineDate);
            endDate.setHours(endDate.getHours() + 1); // 1 hour event by default

            const resource = {
                summary: `[Compliance] ${event.title}`,
                description: `Company: ${event.company ? event.company.name : 'N/A'}\nService Type: ${event.serviceType}\nStatus: ${event.status}`,
                start: { dateTime: startDate.toISOString() },
                end: { dateTime: endDate.toISOString() },
                // 1-Day before Push Notification Reminder
                reminders: {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: 24 * 60 }]
                }
            };

            // Fire and forget insert
            await calendar.events.insert({
                calendarId: 'primary',
                resource,
            }).then(async (response) => {
                // Mark as synced and store the Google Event ID for future deletion
                await CalendarEvent.findByIdAndUpdate(event._id, {
                    $push: {
                        googleSyncHistory: {
                            user: user._id,
                            googleEventId: response.data.id
                        }
                    }
                });
            }).catch(e => console.error('Failed to sync singular event:', e.message));
        }
        return true;
    } catch (error) {
        console.error('Failed to sync events to Google:', error);
        return false;
    }
};

/**
 * Initiates the Google OAuth flow.
 * Returns the authentication URL explicitly.
 */
exports.googleAuth = async (req, res) => {
    try {
        // If user already has a refresh token, we skip auth and just sync!
        if (req.user.googleRefreshToken) {
            oauth2Client.setCredentials({
                access_token: req.user.googleAccessToken,
                refresh_token: req.user.googleRefreshToken
            });
            await syncUserEventsToGoogle(req.user, oauth2Client);
            return res.status(200).json({ url: null, synced: true });
        }

        // Pass the user ID as state so we know who authorized it in the callback
        const url = getAuthUrl(req.user._id.toString());
        // Option 1: Client directs browser to URL
        res.status(200).json({ url });
    } catch (error) {
        console.error('Google Auth Route Error:', error);
        res.status(500).json({ message: 'Error generating Google OAuth URL' });
    }
};

/**
 * Handles the Google OAuth callback.
 * Exchanges the code for tokens and saves them to the User model.
 */
exports.googleAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({ message: 'Authorization code is missing.' });
        }

        if (!state) {
            return res.status(400).json({ message: 'State (User ID) is missing.' });
        }

        // Find the user using the state parameter (which contains their ID)
        const user = await User.findById(state);
        if (!user) {
            return res.status(404).json({ message: 'User not found in system.' });
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Retrieve user info from Google
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // Update User model with Google tokens
        user.googleId = userInfo.data.id;
        user.googleAccessToken = tokens.access_token;

        // Refresh token is only sent on the first auth (or if prompt=consent is used)
        if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token; // IMPORTANT!
        }

        await user.save();

        // Auto-sync their events now that they are connected for the first time
        await syncUserEventsToGoogle(user, oauth2Client);

        res.redirect(`${'http://localhost:3000'}/calendar?googleSync=success`);
    } catch (error) {
        console.error('Google Auth Callback Error:', error);
        res.redirect(`${'http://localhost:3000'}/calendar?googleSync=error`);
    }
};

/**
 * Checks if the current user has an active Google Connection
 */
exports.googleSyncStatus = async (req, res) => {
    res.status(200).json({ connected: !!req.user.googleRefreshToken });
};

/**
 * Revokes Google access, deletes the synced user events, and wipes stored keys.
 */
exports.disconnectGoogle = async (req, res) => {
    try {
        if (!req.user.googleRefreshToken) {
            return res.status(400).json({ message: 'Not currently connected to Google Calendar.' });
        }

        // 1. Find all events that this specific user synced
        const syncedEvents = await CalendarEvent.find({ 'googleSyncHistory.user': req.user._id });

        // 2. Safely wipe all of them from Google Calendar utilizing our pre-built helper
        if (syncedEvents.length > 0) {
            const { removeEventsFromGoogle } = require('../utils/googleCalendarHelpers');
            await removeEventsFromGoogle(syncedEvents);
        }

        // 3. Remove the user's sync history entries from the database completely so the system forgets the sync
        await CalendarEvent.updateMany(
            { 'googleSyncHistory.user': req.user._id },
            { $pull: { googleSyncHistory: { user: req.user._id } } }
        );

        // 4. Inform Google to explicitly invalidate the tokens
        try {
            await oauth2Client.revokeToken(req.user.googleRefreshToken);
        } catch (e) {
            console.error('Google token revocation skipped (already invalid):', e.message);
        }

        // 5. Cleanse User DB fields
        req.user.googleId = undefined;
        req.user.googleAccessToken = undefined;
        req.user.googleRefreshToken = undefined;
        await req.user.save();

        res.status(200).json({ message: 'Successfully wiped synced events and disconnected your Google Calendar.' });
    } catch (error) {
        console.error('Failed to disconnect Google Calendar:', error);
        res.status(500).json({ message: 'Server error disconnecting Google Calendar' });
    }
};

/**
 * Google Calendar Webhook Push Notification Receiver (Bi-directional Sync Stub)
 * Note: Requires a public HTTPS domain verified in Google Cloud Console.
 * To actually activate this, you must first call `calendar.events.watch()` when syncing a user.
 */
exports.googleWebhookCallback = async (req, res) => {
    try {
        const channelId = req.headers['x-goog-channel-id'];
        const resourceId = req.headers['x-goog-resource-id'];
        const resourceState = req.headers['x-goog-resource-state']; // 'sync', 'exists', 'not_exists'

        console.log(`[Google Webhook] Received Ping: Channel=${channelId}, State=${resourceState}`);

        if (resourceState === 'sync') {
            return res.status(200).send('OK');
        }

        if (resourceState === 'exists') {
            // A calendar event was modified on Google Calendar directly.
            // Future Implementation for Production:
            // 1. Fetch User DB associated with this `channelId`
            // 2. Fetch changes via `calendar.events.list({ syncToken: user.googleSyncToken })`
            // 3. Find the local `CalendarEvent` utilizing the `googleEventId` mapping
            // 4. Update MongoDB `CalendarEvent.deadlineDate` locally.
            console.log(`[Google Webhook] Event Modified Warning on Channel: ${channelId}`);
        }

        // Always acknowledge cleanly to prevent Google from retrying the ping over and over
        res.status(200).send('OK');
    } catch (error) {
        console.error('[Google Webhook] Error processing ping:', error.message);
        res.status(500).send('Internal Server Error');
    }
};
