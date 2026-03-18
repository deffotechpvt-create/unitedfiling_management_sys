const { google } = require('googleapis');
const User = require('../models/User');

exports.removeEventsFromGoogle = async (events) => {
    try {
        const userEventMap = {};
        for (const event of events) {
            if (event.googleSyncHistory && event.googleSyncHistory.length > 0) {
                for (const history of event.googleSyncHistory) {
                    const uid = history.user.toString();
                    if (!userEventMap[uid]) userEventMap[uid] = [];
                    if (history.googleEventId) {
                        userEventMap[uid].push(history.googleEventId);
                    }
                }
            }
        }

        for (const [userId, googleEventIds] of Object.entries(userEventMap)) {
            try {
                const user = await User.findById(userId);
                if (!user || !user.googleRefreshToken) continue;

                const client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
                );
                client.setCredentials({
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken
                });

                const calendar = google.calendar({ version: 'v3', auth: client });

                for (const googleEventId of googleEventIds) {
                    await calendar.events.delete({
                        calendarId: 'primary',
                        eventId: googleEventId
                    }).catch(e => console.error(`Failed to delete event ${googleEventId} from Google Calendar for user ${userId}:`, e.message));
                }
                console.log(`[Google Sync] Successfully removed ${googleEventIds.length} events for user ${userId}`);
            } catch (error) {
                console.error(`Error processing Google Calendar cleanup for user ${userId}:`, error.message);
            }
        }
    } catch (globalError) {
        console.error('Fatal error in Google Calendar cleanup helper:', globalError);
    }
};

exports.updateEventInGoogle = async (eventDoc) => {
    try {
        if (!eventDoc.googleSyncHistory || eventDoc.googleSyncHistory.length === 0) return;

        // Make sure we have populated company data for the description
        await eventDoc.populate('company', 'name');

        for (const history of eventDoc.googleSyncHistory) {
            try {
                const user = await User.findById(history.user);
                if (!user || !user.googleRefreshToken) continue;

                const client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
                );
                client.setCredentials({
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken
                });

                const calendar = google.calendar({ version: 'v3', auth: client });

                const startDate = new Date(eventDoc.deadlineDate);
                const endDate = new Date(eventDoc.deadlineDate);
                endDate.setHours(endDate.getHours() + 1);

                await calendar.events.patch({
                    calendarId: 'primary',
                    eventId: history.googleEventId,
                    resource: {
                        summary: `[Compliance] ${eventDoc.title}`,
                        description: `Company: ${eventDoc.company ? eventDoc.company.name : 'N/A'}\nService Type: ${eventDoc.serviceType}\nStatus: ${eventDoc.status}\nStage: ${eventDoc.stage || 'N/A'}`,
                        start: { dateTime: startDate.toISOString() },
                        end: { dateTime: endDate.toISOString() },
                    }
                }).catch(e => console.error(`Failed to patch event ${history.googleEventId}:`, e.message));
            } catch (error) {
                console.error(`Error patching Google Calendar for user:`, error.message);
            }
        }
    } catch (globalError) {
        console.error('Fatal error in Google Calendar patch helper:', globalError);
    }
};

exports.insertEventInGoogle = async (eventDoc) => {
    try {
        const userIdsToSync = [];
        if (eventDoc.createdBy) userIdsToSync.push(eventDoc.createdBy.toString());
        if (eventDoc.assignedTo) userIdsToSync.push(eventDoc.assignedTo.toString());
        
        if (eventDoc.client) {
            const clientProfile = await require('../models/Client').findById(eventDoc.client);
            if (clientProfile && clientProfile.userId) {
                userIdsToSync.push(clientProfile.userId.toString());
            }
        }

        const uniqueUserIds = [...new Set(userIdsToSync)];
        if (uniqueUserIds.length === 0) return;

        await eventDoc.populate('company', 'name');

        const mongoose = require('mongoose');

        for (const uid of uniqueUserIds) {
            try {
                const user = await User.findById(uid);
                if (!user || !user.googleRefreshToken) continue;

                const client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
                );
                client.setCredentials({
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken
                });

                const calendar = google.calendar({ version: 'v3', auth: client });

                const startDate = new Date(eventDoc.deadlineDate);
                const endDate = new Date(eventDoc.deadlineDate);
                endDate.setHours(endDate.getHours() + 1);

                const resource = {
                    summary: `[Compliance] ${eventDoc.title}`,
                    description: `Company: ${eventDoc.company ? eventDoc.company.name : 'N/A'}\nService Type: ${eventDoc.serviceType}\nStatus: ${eventDoc.status}\nStage: ${eventDoc.stage || 'N/A'}`,
                    start: { dateTime: startDate.toISOString() },
                    end: { dateTime: endDate.toISOString() },
                    reminders: {
                        useDefault: false,
                        overrides: [{ method: 'popup', minutes: 24 * 60 }]
                    }
                };

                await calendar.events.insert({
                    calendarId: 'primary',
                    resource,
                }).then(async (response) => {
                    await mongoose.model('CalendarEvent').findByIdAndUpdate(eventDoc._id, { 
                        $push: { 
                            googleSyncHistory: { 
                                user: user._id, 
                                googleEventId: response.data.id 
                            } 
                        } 
                    });
                    console.log(`[Google Sync] 🔥 Instantly synced new event to user ${user.name}`);
                }).catch(e => console.error(`[Google Sync] Failed to instant-sync for user ${uid}:`, e.message));
            } catch (error) {
                console.error(`[Google Sync] Error syncing newly created event for user ${uid}:`, error.message);
            }
        }
    } catch (globalError) {
        console.error('[Google Sync] Fatal error in Google Calendar instant insert helper:', globalError);
    }
};
