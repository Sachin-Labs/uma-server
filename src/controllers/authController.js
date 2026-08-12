const authService = require('../services/authService');

const register = async (req, res, next) => {
    try {
        const { name, email, password, organisationName } = req.body;
        const result = await authService.initiateRegister({ name, email, password, organisationName });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyOtpAndRegister({ email, otp });
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user.userId);
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
};

const setPassword = async (req, res, next) => {
    try {
        const result = await authService.setPasswordFromInvite(req.body);
        res.status(200).json({ success: true, data: result, message: 'Password set successfully.' });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const result = await authService.requestPasswordReset(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.setPasswordFromReset(req.body);
        res.status(200).json({ success: true, data: result, message: 'Password reset successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, verifyOtp, login, refresh, logout, setPassword, forgotPassword, resetPassword };
