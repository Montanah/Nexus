const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple");
const Users = require("../models/Users")
const axios = require('axios');
const { generateOTP } = require("../utils/otp-generator");
const { sendEmail } = require("../utils/nodemailer");

require('dotenv').config();

// Google OAuth Strategy for LOGIN (existing users)
passport.use('google-login', new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL_LOGIN, //"/api/auth/google/callback",
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const state = req.query.state || '';
      let user = await Users.findOne({ email: profile.emails[0].value });

      if (!user) {
        return done(null, false, { message: 'No account found with this email' });
      }

      return done(null, { ...user.toObject(), provider: 'google', state });
    } catch (error) {
      return done(error, null);
    }
  }
));

// Google OAuth Strategy for SIGNUP (new users)
passport.use('google-signup', new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/signup/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // For signup flow, we don't create users here - just pass profile data
      const userProfile = {
        email: profile.emails[0].value,
        name: profile.displayName,
        provider: 'google',
        providerId: profile.id
      };

      return done(null, userProfile);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Apple OAuth Strategy for LOGIN
passport.use('apple-login', new AppleStrategy(
  {
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    keyFilePath: process.env.APPLE_KEY_FILE_PATH,
    callbackURL: process.env.APPLE_CALLBACK_URL,
    scope: ["name", "email"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await Users.findOne({ email: profile.emails[0].value });

      if (!user) {
        return done(null, false, { message: 'No account found with this email' });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Apple OAuth Strategy for SIGNUP
passport.use('apple-signup', new AppleStrategy(
  {
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    keyFilePath: process.env.APPLE_KEY_FILE_PATH,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/apple/signup/callback`,
    scope: ["name", "email"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userProfile = {
        email: profile.emails[0].value,
        name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : 'Apple User',
        provider: 'apple',
        providerId: profile.id
      };

      return done(null, userProfile);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id || user.email); // Handle both user objects and profile objects
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await Users.findById(id);
    if (!user) {
      user = await Users.findOne({ email: id }); // Fallback for email-based lookup
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Updated OAuth redirect URL generator
function getOAuthRedirectUrl(provider, flow = 'login', role = '') {
  const clientId = provider === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.APPLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.BACKEND_URL}/api/auth/${provider}/${flow}/callback`);
  
  // Add state parameter to track the flow
  const state = encodeURIComponent(`${provider}_${flow}_${Date.now()}_${role}`);

  if (provider === 'google') {
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;
  }

  if (provider === 'apple') {
    return `https://appleid.apple.com/auth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=name%20email&` +
      `response_mode=form_post&` +
      `state=${encodeURIComponent(state)}`;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

// Updated exchange function with proper redirect URI
async function exchangeCodeForProfile(provider, code, flow = 'signup') {
  if (provider === 'google') {
    const redirectUri = `${process.env.BACKEND_URL}/api/auth/google/${flow}/callback`;
    
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return {
      email: profileResponse.data.email,
      name: profileResponse.data.name,
      provider: 'google',
      providerId: profileResponse.data.id
    };
  }

  if (provider === 'apple') {
    // Apple JWT token handling would go here
    // For now, throw an error to indicate it needs implementation
    throw new Error('Apple login implementation needed - requires JWT token handling');
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

module.exports = { getOAuthRedirectUrl, exchangeCodeForProfile };