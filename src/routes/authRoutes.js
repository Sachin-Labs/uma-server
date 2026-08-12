const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, refresh, logout, setPassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { loginLimiter, registerLimiter, forgotLimiter } = require('../middlewares/rateLimiter');
const auth = require('../middlewares/auth');

router.post('/register', registerLimiter, register);
router.post('/verify-otp', registerLimiter, verifyOtp);
router.post('/login', loginLimiter, login);
router.post('/refresh', registerLimiter, refresh);
router.post('/logout', auth, logout);
router.post('/set-password', registerLimiter, setPassword);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', registerLimiter, resetPassword);

module.exports = router;
