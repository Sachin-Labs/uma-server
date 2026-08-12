const ExcelJS = require('exceljs');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');

class ReportService {
    /**
     * Generate an Excel report buffer for attendance data.
     */
    async generateAttendanceReport(organisationId, { startDate, endDate, teamId, userId } = {}) {
        const query = { organisationId };
        if (teamId) query.teamId = teamId;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const records = await Attendance.find(query)
            .populate('userId', 'name email')
            .populate('teamId', 'name')
            .sort({ date: -1 })
            .lean();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SINA People';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Attendance Report');

        // Define columns
        sheet.columns = [
            { header: 'Employee Name', key: 'employeeName', width: 25 },
            { header: 'Employee Email', key: 'employeeEmail', width: 30 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Check-in', key: 'checkIn', width: 20 },
            { header: 'Check-out', key: 'checkOut', width: 20 },
            { header: 'Work Type', key: 'workType', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Working Hours', key: 'workingHours', width: 15 },
            { header: 'Distance (m)', key: 'distance', width: 15 },
            { header: 'Location Validated', key: 'locationValidated', width: 18 },
        ];

        // Style header row
        sheet.getRow(1).font = { bold: true, size: 12 };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A5F' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data rows
        for (const record of records) {
            const workingHours = record.totalWorkingMinutes
                ? `${Math.floor(record.totalWorkingMinutes / 60)}h ${record.totalWorkingMinutes % 60}m`
                : 'N/A';

            sheet.addRow({
                employeeName: record.userId?.name || 'Unknown',
                employeeEmail: record.userId?.email || 'Unknown',
                team: record.teamId?.name || 'Unassigned',
                date: record.date,
                checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A',
                checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'Missing',
                workType: record.workType,
                status: record.status,
                workingHours,
                distance: record.distanceAtCheckIn ? Math.round(record.distanceAtCheckIn) : 'N/A',
                locationValidated: record.locationValidated ? 'Yes' : 'No',
            });
        }

        await this._attachHolidaysSheet(workbook, organisationId, { startDate, endDate });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    /**
     * Build a holiday worksheet on the report for the given date range.
     */
    async _attachHolidaysSheet(workbook, organisationId, { startDate, endDate }) {
        const query = { organisationId };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const holidays = await Holiday.find(query).sort({ date: 1 }).lean();

        const sheet = workbook.addWorksheet('Holidays');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Title', key: 'title', width: 35 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E3A5F' },
        };

        if (holidays.length === 0) {
            sheet.addRow({ date: '(no holidays in range)', title: '' });
        } else {
            for (const holiday of holidays) {
                sheet.addRow({ date: holiday.date, title: holiday.title });
            }
        }
    }
}

module.exports = new ReportService();
