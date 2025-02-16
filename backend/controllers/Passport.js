const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const Client = require("../models/Client");
const Traveler = require("../models/Traveler");
require('dotenv').config();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "process.env.GOOGLE_CALLBACK_URL",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await Client.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = await Traveler.findOne({ email: profile.emails[0].value });
        }

        if (user) {
          return done(null, user);
        }

        // Create a new user (default to client)
        const newUser = new Client({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: "google-auth", // Placeholder password
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
    let user = await Client.findById(id);
    if (!user) {
      user = await Traveler.findById(id);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await Client.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = await Traveler.findOne({ email: profile.emails[0].value });
        }

        if (user) {
          return done(null, user);
        }

        // Create a new user (default to client)
        const newUser = new Client({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: "facebook-auth", // Placeholder password
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);