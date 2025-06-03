const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple");
const Users = require("../models/Users")
const axios = require('axios');
const { generateOTP } = require("../utils/otp-generator");
const { sendEmail } = require("../utils/nodemailer");

require('dotenv').config();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        
        let user = await Users.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        const verificationCode = generateOTP();
        await sendEmail(profile.emails[0].value, "Verify Your Account", `Your verification code is: ${verificationCode}`);

        // Create a new user (default to client)
        const newUser = new Users({
          name: profile.displayName,
          email: profile.emails[0].value,
          phone_number: profile.phoneNumber || '',
          verificationCode,
          requiresVerification: true,
          password: "google-auth", // Placeholder password
        });
        console.log('newUser:', newUser);
        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

//Apple Oauth Strategy
passport.use(
  new AppleStrategy(
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

        if (user) { 
          return done(null, user);
        } 

        // Create a new user (default to client)
        const newUser = new Users({
          name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : 'Apple User',name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : 'Apple User',
          //name: profile.displayName,
          email: profile.emails[0].value,
          phone_number: profile.phoneNumber,
          password: "apple-auth", // Placeholder password
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // let user = await Client.findById(id);
    // if (!user) {
    //   user = await Traveler.findById(id);
    // }
    let user = await Users.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

function getOAuthRedirectUrl(provider) {
  const clientId = process.env.GOOGLE_CLIENT_ID; // or APPLE_CLIENT_ID
  const redirectUri = encodeURIComponent(`${process.env.BACKEND_URL}/api/auth/${provider}/callback`);

  if (provider === 'google') {
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=consent`;
  }

  if (provider === 'apple') {
    // Apple-specific logic (more complex, involves JWT etc.)
    return `https://appleid.apple.com/auth/authorize?...`; // needs proper values
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function exchangeCodeForProfile(provider, code) {
  if (provider === 'google') {
   
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // 2. Use access token to get user info
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return {
      email: profileResponse.data.email,
      name: profileResponse.data.name,
    };
  }

  if (provider === 'apple') {
    // Apple requires JWT token handling — do you want help with this part?
    throw new Error('Apple login not implemented yet.');
  }

  throw new Error(`Unsupported provider: ${provider}`);
}


module.exports = { getOAuthRedirectUrl, exchangeCodeForProfile };