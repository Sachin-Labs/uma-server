const User = require('../models/User');
const Otp = require('../models/Otp');
const Organisation = require('../models/Organisation');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { createAuditLog } = require('../utils/auditLogger');
const AppError = require('../utils/AppError');
const emailService = require('../emails/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES, SUBSCRIPTION_PLANS } = require('../config/constants');
const env = require('../config/env');

class AuthService {
    /**
     * Step 1: Validate input, generate OTP, send to email.
     * Does NOT create the account yet.
     */
    async initiateRegister({ name, email, password, organisationName }) {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Email already registered.', 400);
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash password before storing in OTP record
        const hashedPassword = await bcrypt.hash(password, 10);

        // Upsert OTP record (replaces any existing OTP for this email)
        let otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            otpRecord = new Otp({ email });
        }

        otpRecord.otp = otp;
        otpRecord.name = name;
        otpRecord.password = hashedPassword;
        otpRecord.organisationName = organisationName;
        otpRecord.attempts = 0;
        otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await otpRecord.save();

        // Send OTP via emailService (respects EMAIL_PROVIDER: console/ethereal/smtp)
        await emailService.sendOtp({ to: email, otp });

        return { message: 'OTP sent to your email. Please verify to complete registration.' };
    }

    /**
     * Step 2: Verify OTP and create account.
     */
    async verifyOtpAndRegister({ email, otp }) {
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            throw new AppError('OTP expired or not found. Please register again.', 400);
        }

        // Check max attempts
        if (otpRecord.attempts >= 5) {
            await Otp.deleteOne({ email });
            throw new AppError('Too many failed attempts. Please register again.', 400);
        }

        // Verify OTP
        const isValid = await otpRecord.compareOtp(otp);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            const remaining = 5 - otpRecord.attempts;
            throw new AppError(
                `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                400
            );
        }

        // OTP is valid — create organisation and user
        const organisation = await Organisation.create({
            name: otpRecord.organisationName,
            subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
        });

        const user = await User.create({
            organisationId: organisation._id,
            name: otpRecord.name,
            email: otpRecord.email,
            password: otpRecord.password, // Already hashed
            role: ROLES.ADMIN,
        });

        // Skip the User model's pre-save hash since password is already hashed
        // We need to update directly to avoid double-hashing
        await User.updateOne({ _id: user._id }, { password: otpRecord.password });

        const tokenPayload = {
            userId: user._id,
            organisationId: organisation._id,
            role: user.role,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user.refreshToken = refreshToken;
        await User.updateOne({ _id: user._id }, { refreshToken });

        // Clean up OTP record
        await Otp.deleteOne({ email });

        await createAuditLog({
            organisationId: organisation._id,
            action: 'ORG_REGISTERED',
            performedBy: user._id,
            entityType: 'Organisation',
            entityId: organisation._id,
            metadata: { organisationName: organisation.name },
        });

        return {
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            organisation: { id: organisation._id, name: organisation.name },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Login user.
     */
    async login({ email, password }) {
        const user = await User.findOne({ email }).select('+password +refreshToken');
        if (!user) {
            throw new AppError('Invalid email or password.', 401);
        }

        if (!user.isActive) {
            throw new AppError('Account is deactivated. Contact your admin.', 403);
        }

        // Check if user has set password (invite flow)
        if (!user.password) {
            throw new AppError('Please set your password first. Check your email for the invite link.', 403);
        }

        // Check subscription expiry
        const org = await Organisation.findById(user.organisationId);
        if (org.subscriptionExpiry && new Date(org.subscriptionExpiry) < new Date()) {
            throw new AppError('Organisation subscription has expired. Contact admin.', 403);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new AppError('Invalid email or password.', 401);
        }

        const tokenPayload = {
            userId: user._id,
            organisationId: user.organisationId,
            role: user.role,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Rotate refresh token
        user.refreshToken = refreshToken;
        await user.save();

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organisationId: user.organisationId,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refresh access token.
     */
    async refreshToken(token) {
        if (!token) {
            throw new AppError('Refresh token required.', 401);
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            throw new AppError('Invalid or expired refresh token.', 401);
        }

        const user = await User.findById(decoded.userId).select('+refreshToken');
        if (!user || user.refreshToken !== token) {
            // Token reuse detected — invalidate all tokens
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
            throw new AppError('Token reuse detected. Please login again.', 401);
        }

        const tokenPayload = {
            userId: user._id,
            organisationId: user.organisationId,
            role: user.role,
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        user.refreshToken = newRefreshToken;
        await user.save();

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    /**
     * Logout — invalidate refresh token.
     */
    async logout(userId) {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
    }

    /**
     * Set password from invite token (public, no auth needed).
     */
    async setPasswordFromInvite({ token, password }) {
        if (!token || !password) {
            throw new AppError('Token and password are required.', 400);
        }
        if (password.length < 6) {
            throw new AppError('Password must be at least 6 characters.', 400);
        }

        const user = await User.findOne({
            inviteToken: token,
            inviteTokenExpiry: { $gt: new Date() },
        }).select('+inviteToken +password');

        if (!user) {
            throw new AppError('Invalid or expired invite link. Please ask your admin to resend the invite.', 400);
        }

        // Set password and clear invite token
        user.password = password; // pre-save hook will hash it
        user.inviteToken = null;
        user.inviteTokenExpiry = null;
        await user.save();

        // Auto-login after setting password
        const tokenPayload = {
            userId: user._id,
            organisationId: user.organisationId,
            role: user.role,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user.refreshToken = refreshToken;
        await User.updateOne({ _id: user._id }, { refreshToken });

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organisationId: user.organisationId,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Request a password reset link (public, no auth needed).
     * Always resolves successfully to avoid leaking whether an email is registered.
     */
    async requestPasswordReset({ email }) {
        const user = await User.findOne({ email }).select('+resetToken');
        if (!user) {
            return { message: 'If that email is registered, a reset link has been sent.' };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetLink = `${env.CLIENT_URL}/reset-password/${resetToken}`;
        await emailService.sendPasswordReset({ to: user.email, resetLink });

        return { message: 'If that email is registered, a reset link has been sent.' };
    }

    /**
     * Set a new password from a reset token (public, no auth needed), then auto-login.
     */
    async setPasswordFromReset({ token, password }) {
        if (!token || !password) {
            throw new AppError('Token and password are required.', 400);
        }
        if (password.length < 6) {
            throw new AppError('Password must be at least 6 characters.', 400);
        }

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
        }).select('+resetToken +password');

        if (!user) {
            throw new AppError('Invalid or expired reset link. Please request a new one.', 400);
        }

        user.password = password; // pre-save hook will hash it
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        const tokenPayload = {
            userId: user._id,
            organisationId: user.organisationId,
            role: user.role,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user.refreshToken = refreshToken;
        await User.updateOne({ _id: user._id }, { refreshToken });

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organisationId: user.organisationId,
            },
            accessToken,
            refreshToken,
        };
    }
}

module.exports = new AuthService();
