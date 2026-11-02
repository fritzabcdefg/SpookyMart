const crypto = require('crypto');
const admin = require('firebase-admin');
const User = require('../models/user');
const Customer = require('../models/customer');
const sendToken = require('../utils/jwtToken');

function getFirebaseAdmin() {
    if (admin.apps.length) return admin;

    const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountValue) {
        throw new Error('Firebase Admin is not configured on the server.');
    }

    const serviceAccount = JSON.parse(serviceAccountValue);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    return admin;
}

exports.firebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'A Firebase ID token is required.'
            });
        }

        const firebase = getFirebaseAdmin();
        const decoded = await firebase.auth().verifyIdToken(idToken);
        const email = String(decoded.email || '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Your Google or Facebook account must provide an email address.'
            });
        }

        let user = await User.findOne({ email });

        if (user) {
            // Do not allow an unverified social email to take over an existing account.
            if (!decoded.email_verified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please use a verified email address to connect to this account.'
                });
            }
            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: 'This account is no longer active.'
                });
            }
        } else {
            const name = String(decoded.name || email.split('@')[0]).slice(0, 30);
            const photoURL = decoded.picture || 'https://placehold.co/150x150?text=User';

            user = await User.create({
                name,
                email,
                // The account is authenticated by Firebase; this random password
                // prevents password-based login without exposing a generated secret.
                password: crypto.randomBytes(48).toString('hex'),
                avatar: {
                    public_id: `firebase-${decoded.uid}`,
                    url: photoURL
                }
            });

            await Customer.create({ user: user._id });
        }

        return sendToken(user, 200, res);
    } catch (error) {
        console.error('Firebase sign-in failed:', error.message);
        return res.status(401).json({
            success: false,
            message: error.message === 'Firebase Admin is not configured on the server.'
                ? error.message
                : 'Social sign-in failed. Please try again.'
        });
    }
};
