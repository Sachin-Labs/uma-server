const Attendance = require('../models/Attendance');
const Team = require('../models/Team');
const User = require('../models/User');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const { haversineDistance } = require('../utils/haversine');
const { createAuditLog } = require('../utils/auditLogger');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { WORK_MODES, WORK_TYPES, ATTENDANCE_STATUS, LEAVE_STATUS } = require('../config/constants');

class AttendanceService {
    /**
     * Check in for the day.
     */
    async checkIn(organisationId, userId, { lat, lng, workType }) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Check for company holiday
        const holiday = await Holiday.findOne({ organisationId, date: today });
        if (holiday) {
            throw new AppError(`Company holiday — ${holiday.title}. No check-in required.`, 400);
        }

        // 2. Check for approved leave
        const leave = await Leave.findOne({
            organisationId,
            userId,
            status: LEAVE_STATUS.APPROVED,
            startDate: { $lte: today },
            endDate: { $gte: today },
        });
        if (leave) {
            throw new AppError('Cannot check in — you have approved leave today.', 400);
        }

        // 3. Check for duplicate check-in (also caught by unique index)
        const existing = await Attendance.findOne({ organisationId, userId, date: today });
        if (existing) {
            throw new AppError('Already checked in today.', 400);
        }

        // 4. Get user and team
        const user = await User.findById(userId);
        if (!user || !user.teamId) {
            throw new AppError('User has no assigned team.', 400);
        }

        const team = await Team.findById(user.teamId);
        if (!team) {
            throw new AppError('Team not found.', 404);
        }

        // 5. Determine effective work mode
        const effectiveWorkMode = user.workModeOverride || team.workMode;

        let resolvedWorkType = workType;
        let distance = null;
        let locationValidated = false;

        // 6. Apply geo-fencing logic
        if (effectiveWorkMode === WORK_MODES.ONSITE) {
            resolvedWorkType = WORK_TYPES.OFFICE;
            if (!lat || !lng) {
                throw new AppError('Location is required for onsite check-in.', 400);
            }
            distance = haversineDistance(lat, lng, team.location.lat, team.location.lng);
            locationValidated = distance <= team.radius;
            if (!locationValidated) {
                throw new AppError(
                    `You are ${Math.round(distance)}m from office. Must be within ${team.radius}m.`,
                    400
                );
            }
        } else if (effectiveWorkMode === WORK_MODES.WFH) {
            resolvedWorkType = WORK_TYPES.WFH;
            locationValidated = true;
        } else if (effectiveWorkMode === WORK_MODES.HYBRID) {
            if (!resolvedWorkType) {
                throw new AppError('Please select OFFICE or WFH for hybrid mode.', 400);
            }
            if (resolvedWorkType === WORK_TYPES.OFFICE) {
                if (!lat || !lng) {
                    throw new AppError('Location is required for office check-in.', 400);
                }
                distance = haversineDistance(lat, lng, team.location.lat, team.location.lng);
                locationValidated = distance <= team.radius;
                if (!locationValidated) {
                    throw new AppError(
                        `You are ${Math.round(distance)}m from office. Must be within ${team.radius}m.`,
                        400
                    );
                }
            } else {
                locationValidated = true;
            }
        }

        // 7. Check WFH limit
        if (resolvedWorkType === WORK_TYPES.WFH) {
            const monthStart = today.substring(0, 7) + '-01';
            const monthEnd = today.substring(0, 7) + '-31';
            const maxWFH = user.workModeOverride === WORK_MODES.WFH
                ? 31
                : team.maxWFHDaysPerMonth;

            const wfhCount = await Attendance.countDocuments({
                organisationId,
                userId,
                workType: WORK_TYPES.WFH,
                date: { $gte: monthStart, $lte: monthEnd },
            });

            if (wfhCount >= maxWFH) {
                throw new AppError(`WFH limit reached (${maxWFH} days/month).`, 400);
            }
        }

        // 8. Calculate status (PRESENT or LATE)
        const now = new Date();
        const [officeHour, officeMin] = env.OFFICE_START_TIME.split(':').map(Number);
        const officeStart = new Date(now);
        officeStart.setHours(officeHour, officeMin, 0, 0);

        const status = now > officeStart ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;

        // 9. Create attendance
        const attendance = await Attendance.create({
            organisationId,
            userId,
            teamId: user.teamId,
            date: today,
            checkIn: now,
            workType: resolvedWorkType,
            locationAtCheckIn: lat && lng ? { lat, lng } : undefined,
            distanceAtCheckIn: distance,
            locationValidated,
            status,
        });

        await createAuditLog({
            organisationId,
            action: 'ATTENDANCE_CHECK_IN',
            performedBy: userId,
            entityType: 'Attendance',
            entityId: attendance._id,
            metadata: { workType: resolvedWorkType, status, distance },
        });

        return attendance;
    }

    /**
     * Check out for the day.
     */
    async checkOut(organisationId, userId) {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ organisationId, userId, date: today });

        if (!attendance) {
            throw new AppError('No check-in found for today.', 400);
        }
        if (attendance.checkOut) {
            throw new AppError('Already checked out today.', 400);
        }

        const now = new Date();
        const totalWorkingMinutes = Math.round((now - attendance.checkIn) / 60000);

        // If less than 4 hours, mark as HALF_DAY
        let status = attendance.status;
        if (totalWorkingMinutes < 240) {
            status = ATTENDANCE_STATUS.HALF_DAY;
        }

        attendance.checkOut = now;
        attendance.totalWorkingMinutes = totalWorkingMinutes;
        attendance.status = status;
        await attendance.save();

        return attendance;
    }

    /**
     * Get attendance history for an employee.
     */
    async getMyAttendance(organisationId, userId, { startDate, endDate, page = 1, limit = 20 } = {}) {
        const query = { organisationId, userId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const total = await Attendance.countDocuments(query);
        const records = await Attendance.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return { records, total, page: Number(page), totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get all attendance (HR/Admin view).
     */
    async getAllAttendance(organisationId, { startDate, endDate, teamId, userId, page = 1, limit = 50 } = {}) {
        const query = { organisationId };
        if (teamId) query.teamId = teamId;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const total = await Attendance.countDocuments(query);
        const records = await Attendance.find(query)
            .populate('userId', 'name email')
            .populate('teamId', 'name')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return { records, total, page: Number(page), totalPages: Math.ceil(total / limit) };
    }
}

module.exports = new AttendanceService();
