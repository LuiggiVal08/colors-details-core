const validAccessToken = (req, res, next) => {
    const token = req.headers.authorization;
    try {
        if (token) {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    res.status(401).json({ message: 'Invalid token' });
                } else {
                    req.user = user;
                    next();
                }
            });
        } else {
            res.status(401).json({ message: 'No token provided' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
export default validAccessToken;
