const response = (res, status, result = '') => {
    const descriptions = {
        200: 'Success',
        201: 'Created',
        400: 'Bad Request',
        401: 'Unauthorized',
        404: 'Not Found',
        500: 'Internal Server Error'
    };

    const desc = descriptions[status] || 'Unknown Status';

    const results = {
        status,
        description: desc,
        data: typeof result === 'object' ? result : { message: result }
    };

    return res.status(status).json(results);
};

module.exports = { response };
