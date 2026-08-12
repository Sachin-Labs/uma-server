const Organisation = require('../models/Organisation');
const AppError = require('../utils/AppError');

class OrganisationService {
    async getOrganisation(organisationId) {
        const org = await Organisation.findById(organisationId);
        if (!org) throw new AppError('Organisation not found.', 404);
        return org;
    }

    async updateOrganisation(organisationId, updates) {
        const allowed = ['name', 'officeLocation', 'officeHours'];
        const filteredUpdates = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
        }

        const org = await Organisation.findByIdAndUpdate(organisationId, filteredUpdates, {
            new: true,
            runValidators: true,
        });
        if (!org) throw new AppError('Organisation not found.', 404);
        return org;
    }
}

module.exports = new OrganisationService();
