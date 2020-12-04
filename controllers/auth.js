const User = require('../models/user');
const jwt = require('jsonwebtoken');

// sendgrid setup
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


exports.signup = (req, res) => {
    const { name, email, password } = req.body;
    console.log('made it 1');
    User.findOne({ email }).exec((err, user) => {
        if(user) {
            return res.status(400).json({
                error: 'Email address already exists'
            })
        }
        const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '10m' });
        console.log('made it 2');
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
        console.log('made it 3', emailData);

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
