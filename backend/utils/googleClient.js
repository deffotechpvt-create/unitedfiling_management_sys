const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Define the required scopes for Google Calendar and basic profile
const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar'
];

/**
 * Generates an authentication URL for Google OAuth2
 */
const getAuthUrl = (state) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request offline access to get a refresh token
        prompt: 'consent', // Force consent screen to ensure refresh token is provided
        scope: scopes,
        state: state // Pass user ID to correlate callback
    });
};

module.exports = {
    oauth2Client,
    getAuthUrl
};
