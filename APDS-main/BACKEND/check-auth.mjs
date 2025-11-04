import jwt from "jsonwebtoken"

// middleware to check authentication using JWT
const checkauth = (req, res, next) => {
    try {
        // protection against session hijacking
        // try to read token from secure cookie first, fallback to header
        let token = null;
        if (req.cookies && req.cookies.session) {
            token = req.cookies.session;
        } else if (req.headers.authorization) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) throw new Error("No token provided");
        const decoded = jwt.verify(token, "this_secret_should_be_longer_than_it_is");

        // check IP and user agent match those in JWT to detect session hijacking
        if (decoded.ip && decoded.ip !== req.ip) {
            throw new Error("Session IP mismatch");
        }
        if (decoded.ua && decoded.ua !== req.headers["user-agent"]) {
            throw new Error("Session user-agent mismatch");
        }
       
        req.user = decoded; // attach user info
        next();
    } catch (error) {
        res.status(401).json({
            message: "token invalid"
        });
    }
};                          

export default checkauth;
