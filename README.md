# Level 3 - hashing a password

- hash tables;
- dictionary attack;

### interesting websites:

 - https://www.passwordrandom.com
 - https://en.wikipedia.org/wiki/List_of_the_most_common_passwords
 - http://password-checker.online-domain-tools.com/


# level 4: Bcrypt.

bcrypt page:

https://www.npmjs.com/package/bcrypt


# Level 5: Passport:

## Use:
- passport
- passport-local
- passport-local-mongoose
- express-session (singular, not plural)

# OAuth

Install OAuth for Google:

npm install passport-google-oauth20

Usage
Create an Application
Before using passport-google-oauth20, you must register an application with Google. If you have not already done so, a new project can be created in the Google (https://console.cloud.google.com/apis/dashboard) Developers Console. Your application will be issued a client ID and client secret, which need to be provided to the strategy. You will also need to configure a redirect URI which matches the route in your application.

Codes added in this version.

### Create Google strategy:

```javascript

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

/* Authenticate Requests
Use passport.authenticate(), specifying the 'google' strategy, to authenticate requests.

For example, as route middleware in an Express application: */

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });



