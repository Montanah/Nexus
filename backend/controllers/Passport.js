const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AppleStrategy = require("passport-apple");
const Client = require("../models/Client");
const Traveler = require("../models/Traveler");
const Users = require("../models/Users")

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
        
        let user = await Users.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        // Create a new user (default to client)
        const newUser = new Users({
          name: profile.displayName,
          email: profile.emails[0].value,
          phone_number: profile.phoneNumber,
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


// Facebook OAuth Strategy
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: process.env.FACEBOOK_CALLBACK_URL,
//       profileFields: ["id", "displayName", "email"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Check if user already exists
//         // let user = await Client.findOne({ email: profile.emails[0].value });
//         // if (!user) {
//         //   user = await Traveler.findOne({ email: profile.emails[0].value });
//         // }

//         let user = await Users.findOne({ email: profile.emails[0].value });

//         if (user) {
//           return done(null, user);
//         }

//         // Create a new user (default to client)
//         const newUser = new Users({
//           name: profile.displayName,
//           email: profile.emails[0].value,
//           password: "facebook-auth", // Placeholder password
//         });

//         await newUser.save();
//         done(null, newUser);
//       } catch (error) {
//         done(error, null);
//       }
//     }
//   )
// );

//APPLE ID
