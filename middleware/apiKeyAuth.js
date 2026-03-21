const config = require('../config/database');

module.exports = (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'No API Key provided. Use X-API-KEY header or apiKey query parameter.'
            });
        }

        if (apiKey !== config.apiKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid API Key'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error in API Key authentication'
        });
    }
};
