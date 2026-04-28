const express = require('express');
const { getDashboardStats } = require('./controller');
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

router.get('/dashboard', verifyToken, requirePermission('dashboard.view'), getDashboardStats);

module.exports = router;