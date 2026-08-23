const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth');
const { createReportSchema, validate } = require('../validations/report.validation');

router.post('/', protect, validate(createReportSchema), reportController.createReport);

module.exports = router;
