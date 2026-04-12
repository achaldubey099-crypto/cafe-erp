const express = require('express');
const router = express.Router();
const { submitFeedback } = require('../controller/feedbackController');

router.post('/', submitFeedback);

module.exports = router;