const express = require('express');
const { getDashboardStats } = require('./controller');
const { verifyToken } = require('../auth/controller');

const router = express.Router();

router.get('/dashboard', verifyToken, getDashboardStats);

module.exports = router;