const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Customer = require('../models/customer');
const sendToken = require('../utils/jwtToken');

let cachedCertificates = null;
let certificatesExpireAt = 0;

async function getFirebaseCertificate(kid) {
    if (!cachedCertificates || Date.now() >= certificatesExpireAt) {
        const response = await fetch(
            'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
        );
        if (!response.ok) throw new Error('Unable to retrieve Firebase signing certificates.');
        cachedCertificates = await response.json();

        const cacheControl = response.headers.get('cache-control') || '';
        const maxAge = Number((cacheControl.match(/max-age=(\d+)/) || [])[1] || 3600);
        certificatesExpireAt = Date.now() + maxAge * 1000;
    }

    const certificate = cachedCertificates[kid];
    if (!certificate) {
        cachedCertificates = null;
        throw new Error('Firebase token signing key was not found.');
    }
    return certificate;
}

async function verifyFirebaseIdToken(idToken) {
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader?.header?.kid || decodedHeader.header.alg !== 'RS256') {
        throw new Error('Invalid Firebase ID token.');
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured on the server.');

    const certificate = await getFirebaseCertificate(decodedHeader.header.kid);
    return jwt.verify(idToken, certificate, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`
    });
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

        const decoded = await verifyFirebaseIdToken(idToken);
        const providerId = decoded.firebase?.sign_in_provider;
        if (!['google.com', 'facebook.com'].includes(providerId)) {
            return res.status(403).json({ success: false, message: 'Only Google and Facebook sign-in are supported.' });
        }

        const email = String(decoded.email || '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Your Google or Facebook account must provide an email address.'
            });
        }

        let user = await User.findOne({ email });

        if (user) {
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
                password: crypto.randomBytes(48).toString('hex'),
                authProvider: providerId === 'google.com' ? 'google' : 'facebook',
                emailVerified: true,
                avatar: {
                    public_id: `firebase-${decoded.sub}`,
                    url: photoURL
                }
            });

        }

        let userChanged = false;
        if (decoded.email_verified && !user.emailVerified) {
            user.emailVerified = true;
            userChanged = true;
        }
        if (user.authProvider !== (providerId === 'google.com' ? 'google' : 'facebook')) {
            user.authProvider = providerId === 'google.com' ? 'google' : 'facebook';
            userChanged = true;
        }
        if (userChanged) await user.save();

        await Customer.updateOne(
            { user: user._id },
            { $setOnInsert: { user: user._id } },
            { upsert: true }
        );

        return sendToken(user, 200, res);
    } catch (error) {
        console.error('Firebase sign-in failed:', error.message);
        return res.status(401).json({
            success: false,
            message: error.message.includes('FIREBASE_PROJECT_ID')
                ? error.message
                : 'Social sign-in failed. Please try again.'
        });
    }
};
