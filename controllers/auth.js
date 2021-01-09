const User = require('../models/user');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');

// sendgrid setup
const sgMail = require('@sendgrid/mail');
const { result } = require('lodash');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


exports.signup = (req, res) => {
    const { name, email, password } = req.body;
    User.findOne({ email }).exec((err, user) => {
        if(user) {
            return res.status(400).json({
                error: 'Email address already exists'
            })
        }
        const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '10m' });
        const emailData ={
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Account activation link',
            html: `
                <p>Please use the following link to activate your account</p>
                <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
                <hr />
                <p>This email may contain sensitive information</>
                <p>${process.env.CLIENT_URL}</p>
            `
        }

        sgMail.send(emailData).then(sent => {
            console.log('SIGNUP EMAIL SENT');
            return res.json({
                message: `Email sent to ${email}. Follow instructions to activate`
            });
        })
        .catch(err => {
            console.log('SIGNUP EMAIL SENT ERROR', err)
            return res.json({
                message: err.message
            })
        })
    });
}

exports.accountActivation = (req, res) => {
    const { token } = req.body
    if(token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decodedToken) {
            if(err) {
                console.log('JWT VERIFY ACCOUNT ACTIVATION ERROR', err)
                return res.status(401).json({
                    error: 'Expired link. Try again'
                })
            }

            const { name, email, password } = jwt.decode(token);

            const user = new User({ name, email, password })

            user.save((err, success) => {
                if(err) {
                    console.log('SAVE USER IN ACCOUNT ACTIVATION ERROR', err)
                    return res.status(401).json({
                        error: 'Error saving user in database. Try signing up again.'
                    })
                }
                return res.json({
                    message: 'Signup/Activation success'
                });
            });
        });
    } else {
        return res.json({
            message: 'Something went wrong. Try again.'
        })
    }
}


exports.signin = (req, res) => {
    const { email, password } = req.body;

    // check for existing user
    User.findOne({email}).exec((err, user) => {
        if(err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            })
        }
        // authenticate
        if(!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email and password do not match'
            })
        }
        // generate token and send to client
        const token = jwt.sign({ _id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d' });
        const { _id, name, email, role } = user;

        return res.json({
            token,
            user: { _id, name, email, role }
        });
    });
}


// Middleware

exports.requireSignIn = expressJwt({
    secret: process.env.JWT_SECRET,  // black magic that will populate req.user - need to explore
    algorithms: ['HS256']
});

exports.adminMiddleware = (req, res, next) => {
    User.findById(req.user._id).exec((err, user) => {
        if(err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        if(user.role !== 'admin') {
            return res.status(400).json({
                error: 'Admin resource. Access denied'
            })
        }
        req.profile = user;
        next();
    });
};

exports.forgotPassword = (req, res) => {
    const {email} = req.body;

    User.findOne({ email }, (err, user) => {
        if(err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist'
            });
        }

        const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });
        const emailData ={
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Reset password link',
            html: `
                <p>Please use the following link to reset your password</p>
                <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
                <hr />
                <p>This email may contain sensitive information</>
                <p>${process.env.CLIENT_URL}</p>
            `
        };

        return User.updateOne({ email }, {resetPasswordLink: token}, (err, success) => {
            if(err) {
                console.log('RESET_PASSWORD_LINK_ERROE', err);
                return res.status(400).json({
                    error: 'Database connection error on user password forgotten'
                });
            } else {
                sgMail.send(emailData).then(sent => {
                    console.log('RESET_PASSWORD_EMAIL_SENT');
                    return res.json({
                        message: `Email sent to ${email}. Follow instructions to reset password`
                    });
                })
                .catch(err => {
                    //console.log('RESET_PASSWORD_EMAIL_SENT_ERROR', err)
                    return res.json({
                        message: err.message
                    });
                });
            };
        });
    });
};

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
            if (err) {
                return res.status(400).json({
                    error: 'Expired link. Try again'
                });
            }

            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(400).json({
                        error: 'Something went wrong. Try later'
                    });
                }

                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: 'Error resetting user password'
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
    const {idToken} = req.body;

    client.verifyIdToken({idToken, audience: process.env.GOOGLE_CLIENT_ID})
        .then(response => {
            const {email_verified, email} = response.payload;
            if(email_verified) {
                User.findOne({email}).exec((err, user) => {
                    if(user) {
                        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
                        const {_id, email, name, role} = user;
                        return res.json({
                            token, user: {_id, email, name, role}
                        });
                    } else {
                        let password = email + process.env.JWT_SECRET
                        user = new User({name, email, password})
                        user.save((err, data) => {
                            if(err) {
                                console.log('ERROR_GOOGLE_LOGIN_ON_USER_SAVE', err);
                                return res.status(400).json({
                                    error: 'User signup failed with Google'
                                });
                            }
                            const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
                            const {_id, email, name, role} = data;
                            return res.json({
                                token, user: {_id, email, name, role}
                            });
                        })
                    }
                })
            } else {
                return res.status(400).json({
                });
            }
        })
    .catch(error => {
        res.json({
            error: 'Google login failed. Try again later.'
        });
    })

};

exports.facebookLogin = (req, res) => {
    console.log("FACEBOOK_LOGIN_REQ_BODY", req.body);
    const {userID, accessToken} = req.body;

    const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id, name, email&access_token=${accessToken}`

    return(
        fetch(url, {
            method: 'GET',

        })
        .then(response => response.json())
        // .then(repsonse => console.log(response))
        .then(response => {
            const {email, name} = response;
            User.findOne({email}).exec((err, user) => {
                if(user) {
                    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
                    const {_id, email, name, role} = user;
                    return res.json({
                        token, user: {_id, email, name, role}
                    });
                } else {
                    let password = email + process.env.JWT_SECRET
                    user = new User({name, email, password})
                    user.save((err, data) => {
                        if(err) {
                            console.log('ERROR_FACEBOOK_LOGIN_ON_USER_SAVE', err);
                            return res.status(400).json({
                                error: 'User signup failed with Facebook'
                            });
                        }
                        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
                        const {_id, email, name, role} = data;
                        return res.json({
                            token, user: {_id, email, name, role}
                        });
                    });
                };
          });
        })
        .catch(error => {
            res.json({
                error: 'Facebook login failed. Try again later.'
            });
        })
    );
};