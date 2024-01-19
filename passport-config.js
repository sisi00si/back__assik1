const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt")


function initialize(passport, getUserByUsername, getUserById) {
    const authenticateUsers = async (username, password, done) => {
        try {
            const user = await getUserByUsername(username);

            if (!user) {
                return done(null, false, { message: 'No user found with that username' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password Incorrect' });
            }
        } catch (error) {
            console.error(error);
            return done(error);
        }
    }



    passport.use(new LocalStrategy({usernameField: 'username'}, authenticateUsers))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })
}
module.exports = initialize