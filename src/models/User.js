const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, EMPLOYMENT_STATUS, WORK_MODES } = require('../config/constants');

const userSchema = new mongoose.Schema({
    organisationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organisation',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        minlength: 6,
        select: false,
        default: null,
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.EMPLOYEE,
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    employmentStatus: {
        type: String,
        enum: Object.values(EMPLOYMENT_STATUS),
        default: EMPLOYMENT_STATUS.ACTIVE,
    },
    resignedAt: {
        type: Date,
        default: null,
    },
    workModeOverride: {
        type: String,
        enum: [...Object.values(WORK_MODES), null],
        default: null,
    },
    refreshToken: {
        type: String,
        default: null,
        select: false,
    },
    inviteToken: {
        type: String,
        default: null,
        select: false,
    },
    inviteTokenExpiry: {
        type: Date,
        default: null,
    },
    resetToken: {
        type: String,
        default: null,
        select: false,
    },
    resetTokenExpiry: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Compound unique index: same email can exist across different orgs
userSchema.index({ organisationId: 1, email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
