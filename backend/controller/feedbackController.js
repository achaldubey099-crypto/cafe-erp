let feedbacks = [];

exports.submitFeedback = (req, res) => {
    const { orderId, rating, comment } = req.body;

    const newFeedback = {
        id: feedbacks.length + 1,
        orderId,
        rating,
        comment
    };

    feedbacks.push(newFeedback);

    res.status(201).json({
        message: "Feedback submitted",
        feedback: newFeedback
    });
};