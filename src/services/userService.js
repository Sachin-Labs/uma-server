const User = require('../models/User');
const Organisation = require('../models/Organisation');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../utils/auditLogger');
const emailService = require('../emails/emailService');
const env = require('../config/env');
const { ROLES, EMPLOYMENT_STATUS } = require('../config/constants');

class UserService {
    async create(organisationId, data, performedBy) {
        // HR can only create EMPLOYEE
        const performer = await User.findById(performedBy);
        if (performer.role === ROLES.HR && data.role && data.role !== ROLES.EMPLOYEE) {
            throw new AppError('HR can only create employees.', 403);
        }

        // Generate secure invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const user = await User.create({
            name: data.name,
            email: data.email,
            role: data.role || ROLES.EMPLOYEE,
            teamId: data.teamId || null,
            organisationId,
            inviteToken,
            inviteTokenExpiry,
            // No password — user will set it via invite link
        });

        // Send invite email
        const org = await Organisation.findById(organisationId);
        const setPasswordLink = `${env.CLIENT_URL}/set-password/${inviteToken}`;
        await emailService.sendInvite({
            to: data.email,
            organisationName: org?.name || 'Your Organisation',
            inviteLink: setPasswordLink,
        });

        await createAuditLog({
            organisationId,
            action: 'USER_INVITED',
            performedBy,
            entityType: 'User',
            entityId: user._id,
            metadata: { name: user.name, email: user.email, role: user.role },
        });

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
            isActive: user.isActive,
            employmentStatus: user.employmentStatus,
        };
    }

    async list(organisationId, { page = 1, limit = 20, search, teamId, role, isActive } = {}) {
        const query = { organisationId };
        if (teamId) query.teamId = teamId;
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .populate('teamId', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return { users, total, page: Number(page), totalPages: Math.ceil(total / limit) };
    }

    async getById(organisationId, userId) {
        const user = await User.findOne({ _id: userId, organisationId }).populate('teamId', 'name');
        if (!user) throw new AppError('User not found.', 404);
        return user;
    }

    async update(organisationId, userId, updates, performedBy) {
        const allowed = ['name', 'email', 'role', 'teamId', 'workModeOverride'];
        const filteredUpdates = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, organisationId },
            filteredUpdates,
            { new: true, runValidators: true }
        );
        if (!user) throw new AppError('User not found.', 404);

        await createAuditLog({
            organisationId,
            action: 'USER_UPDATED',
            performedBy,
            entityType: 'User',
            entityId: user._id,
            metadata: filteredUpdates,
        });

        return user;
    }

    async deactivate(organisationId, userId, performedBy, status = EMPLOYMENT_STATUS.TERMINATED) {
        // Prevent self-deactivation
        if (userId.toString() === performedBy.toString()) {
            throw new AppError('You cannot deactivate your own account.', 400);
        }

        // Check if user to be deactivated is Admin and performer is HR
        const userToDeactivate = await User.findOne({ _id: userId, organisationId });
        if (!userToDeactivate) throw new AppError('User not found.', 404);

        const performer = await User.findById(performedBy);
        if (performer.role === ROLES.HR && userToDeactivate.role === ROLES.ADMIN) {
            throw new AppError('HR cannot deactivate an Admin account.', 403);
        }

        userToDeactivate.isActive = false;
        userToDeactivate.employmentStatus = status;
        userToDeactivate.resignedAt = status === EMPLOYMENT_STATUS.RESIGNED ? new Date() : undefined;
        userToDeactivate.refreshToken = null;
        await userToDeactivate.save();

        await createAuditLog({
            organisationId,
            action: 'USER_DEACTIVATED',
            performedBy,
            entityType: 'User',
            entityId: userToDeactivate._id,
            metadata: { employmentStatus: status },
        });

        return userToDeactivate;
    }

    async reactivate(organisationId, userId, performedBy) {
        const user = await User.findOneAndUpdate(
            { _id: userId, organisationId },
            {
                isActive: true,
                employmentStatus: EMPLOYMENT_STATUS.ACTIVE,
                resignedAt: null,
            },
            { new: true }
        );
        if (!user) throw new AppError('User not found.', 404);

        await createAuditLog({
            organisationId,
            action: 'USER_REACTIVATED',
            performedBy,
            entityType: 'User',
            entityId: user._id,
        });

        return user;
    }

    async resendInvite(organisationId, userId, performedBy) {
        const user = await User.findOne({ _id: userId, organisationId }).select('+inviteToken +password');
        if (!user) throw new AppError('User not found.', 404);
        if (user.password) throw new AppError('User has already set their password.', 400);

        // Generate new invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        user.inviteToken = inviteToken;
        user.inviteTokenExpiry = inviteTokenExpiry;
        await user.save();

        const org = await Organisation.findById(organisationId);
        const setPasswordLink = `${env.CLIENT_URL}/set-password/${inviteToken}`;
        await emailService.sendInvite({
            to: user.email,
            organisationName: org?.name || 'Your Organisation',
            inviteLink: setPasswordLink,
        });

        return { message: 'Invite resent.' };
    }
}

module.exports = new UserService();
