const express = require('express');
const router = express.Router();
const { submitFeedback, getOrderFeedback } = require('../controller/feedbackController');
const { protect } = require('../middleware/auth');

router.get('/order/:orderId', protect, getOrderFeedback);
router.post('/', protect, submitFeedback);

module.exports = router;
