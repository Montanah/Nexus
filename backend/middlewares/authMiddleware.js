const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const redisClient = require("../middlewares/redisClient");

exports.authenticateClient = async (req, res, next) => {
    let token = req.cookies.accessToken;
    console.log('Received cookies:', req.cookies); // Log cookies
    console.log('Authorization header:', req.headers.authorization); // Log header
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({
          status: 'error',
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required'
        });
      }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        const storedToken = await redisClient.get(`authToken:${decoded.id}`);

        if (!storedToken || storedToken !== token) {
            return res.status(401).json({ message: "Unauthorized or session expired", code: "INVALIDATED_SESSION" });
        }
        //console.log('Received token:', token);
        //console.log('Stored token:', await redisClient.get(`authToken:${decoded.id}`));

        req.user = decoded; 
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: "Token expired",
                code: "TOKEN_EXPIRED",
                shouldRefresh: true
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: "Invalid token",
                code: "INVALID_TOKEN"
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({ 
            message: "Authentication failed",
            code: "AUTH_ERROR"
        });
    
    }
};


