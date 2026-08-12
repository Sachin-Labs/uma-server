const userService = require('../services/userService');

const create = async (req, res, next) => {
    try {
        const user = await userService.create(req.user.organisationId, req.body, req.user.userId);
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const list = async (req, res, next) => {
    try {
        const result = await userService.list(req.user.organisationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const user = await userService.getById(req.user.organisationId, req.params.id);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const user = await userService.update(req.user.organisationId, req.params.id, req.body, req.user.userId);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const deactivate = async (req, res, next) => {
    try {
        const user = await userService.deactivate(
            req.user.organisationId, req.params.id, req.user.userId, req.body.status
        );
        res.json({ success: true, data: user, message: 'User deactivated.' });
    } catch (error) {
        next(error);
    }
};

const reactivate = async (req, res, next) => {
    try {
        const user = await userService.reactivate(req.user.organisationId, req.params.id, req.user.userId);
        res.json({ success: true, data: user, message: 'User reactivated.' });
    } catch (error) {
        next(error);
    }
};

const resendInvite = async (req, res, next) => {
    try {
        const result = await userService.resendInvite(req.user.organisationId, req.params.id, req.user.userId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, list, getById, update, deactivate, reactivate, resendInvite };
