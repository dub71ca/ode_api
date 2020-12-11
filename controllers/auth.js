const User = require('../models/user');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');

// sendgrid setup
const sgMail = require('@sendgrid/mail');
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
 
        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });
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
    });
};

exports.resetPassword = (req, res) => {
    
}