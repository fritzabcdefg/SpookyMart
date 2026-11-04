const User = require('../models/user');
const Customer = require('../models/customer');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const sendToken = require('../utils/jwtToken');



exports.registerUser = async (req, res, next) => {
    let uploadedAvatar = null;
    let createdUser = null;
    let createdCustomer = null;

    try {
        const { name, email, password } = req.body;

        // Validate required registration fields.
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your name, email, and password.'
            });
        }

        // Avatar is required by the existing User model.
        if (!req.body.avatar) {
            return res.status(400).json({
                success: false,
                message: 'Please choose a profile picture.'
            });
        }

        // Parse optional JSON arrays from FormData.
        const parseOptionalArray = (value, fieldName) => {
            if (!value) return [];

            let parsed;

            try {
                parsed = typeof value === 'string'
                    ? JSON.parse(value)
                    : value;
            } catch (error) {
                throw new Error(`${fieldName} contains invalid JSON.`);
            }

            if (!Array.isArray(parsed)) {
                throw new Error(`${fieldName} must be an array.`);
            }

            return parsed;
        };

        const addresses = parseOptionalArray(
            req.body.addresses,
            'Addresses'
        );

        const paymentMethods = parseOptionalArray(
            req.body.paymentMethods,
            'Payment methods'
        );

        // Upload the Base64 avatar to Cloudinary.
        uploadedAvatar = await cloudinary.v2.uploader.upload(
            req.body.avatar,
            {
                folder: 'avatars',
                width: 150,
                crop: 'scale'
            }
        );

        // Create an account that remains locked until its email is verified.
        const verificationToken = crypto.randomBytes(32).toString('hex');
        createdUser = await User.create({
            name,
            email: email.trim().toLowerCase(),
            password,
            emailVerified: false,
            emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
            emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
            avatar: {
                public_id: uploadedAvatar.public_id,
                url: uploadedAvatar.secure_url
            }
        });

        // Accept only safe card metadata.
        // Never save a full card number or CVV.
        const safePaymentMethods = paymentMethods.map(method => ({
            label: method.label || 'My card',
            type: 'card',
            cardholderName: method.cardholderName,
            brand: method.brand,
            last4: String(method.last4 || ''),
            expiryMonth: Number(method.expiryMonth),
            expiryYear: Number(method.expiryYear),
            isDefault: method.isDefault === true
        }));

        // Create the customer record linked to the User.
        // Addresses and payment methods can be empty.
        createdCustomer = await Customer.create({
            user: createdUser._id,
            phoneNo: req.body.phoneNo || '',
            addresses,
            paymentMethods: safePaymentMethods
        });

        const verifyUrl = `${process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`}/api/v1/email/verify/${verificationToken}`;
        await sendEmail({
            email: createdUser.email,
            subject: 'Verify your SpookyMart email',
            html: `<p>Hi ${String(name).replace(/[<>]/g, '')},</p><p>Please verify your email address to activate your SpookyMart account.</p><p><a href="${verifyUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>`
        });

        return res.status(201).json({
            success: true,
            requiresEmailVerification: true,
            message: 'Registration successful. Please check your email to verify your account before logging in.'
        });

    } catch (error) {

        // Remove the customer record if it was created.
        if (createdCustomer) {
            await Customer.findByIdAndDelete(createdCustomer._id);
        }

        // Remove the incomplete user account.
        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id);
        }

        // Remove the uploaded avatar if registration failed.
        if (uploadedAvatar?.public_id) {
            await cloudinary.v2.uploader.destroy(
                uploadedAvatar.public_id
            );
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

exports.verifyEmail = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() }
        });
        if (!user) return res.status(400).send('This verification link is invalid or has expired. Please register again or request a new link.');
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=1`);
    } catch (error) {
        return res.status(500).send('Unable to verify your email. Please try again.');
    }
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please enter your email and password.'
        });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password.'
        });
    }
    if (!user.emailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email before logging in. Check your inbox for the verification link.'
        });
    }

    //To block inactive users from logging in
    if (user.isActive === false) {
        return res.status(403).json({
            success: false,
            message: 'This account is no longer active.'
        });
    }

    const activeUser = await User.findById(user._id);

    return sendToken(activeUser, 200, res);
};


exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${req.protocol}://localhost:5173/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })

    }
}

exports.resetPassword = async (req, res, next) => {
    console.log(req.params.token)
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    console.log(resetPasswordToken)
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    console.log(user)

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })

    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });

}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updateProfile = async (req, res, next) => {

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found.' });
    if (['google', 'facebook'].includes(currentUser.authProvider) && req.body.email?.trim().toLowerCase() !== currentUser.email) {
        return res.status(400).json({ message: 'This email is managed by your social sign-in provider and cannot be changed here.' });
    }
    const newUserData = {
        name: req.body.name,
        email: currentUser.authProvider === 'password' ? req.body.email : currentUser.email
    }

    // Update avatar
    if (req.body.avatar !== '') {
        let user = await User.findById(req.user.id)
        // console.log(user)
        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);
        // console.log("Res", res)
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })
    if (!user) {
        return res.status(401).json({ message: 'User Not Updated' })
    }

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    // const token = user.getJwtToken();

    // return res.status(201).json({
    //     success: true,
    //     user,
    //     token
    // });
    sendToken(user, 200, res)

}

exports.allUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}

exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // Remove avatar from cloudinary
    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
        success: true,
    })
}

exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

exports.updateUser = async (req, res, next) => {
    try {
        const { role, isActive } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user role.'
            });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Invalid account status.'
            });
        }

        if (
            req.user._id.toString() === req.params.id &&
            (!isActive || role !== 'admin')
        ) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account or remove your own admin role.'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        user.role = role;
        user.isActive = isActive;

        await user.save();

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.logout = async (req, res, next) => {
    // Cookie deletion MUST use the same scope/security attributes as jwtToken.js.
    // Otherwise the browser keeps the original httpOnly JWT and /me restores the session on refresh.
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    });
}