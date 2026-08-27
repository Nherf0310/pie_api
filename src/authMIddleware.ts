import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret"; // Use a default secret for development

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // Get the token from the Authorization header
    const header = req.header('authorization');

    //Extract the token from the header (format 'Bearer <jwt>')
    const token = header && header.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)

        // attatch the decoded payload to the request object for use in subsequent middleware or route handlers
        req.user = decoded;    // Type assertion to JwtPayload

        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid token." });
    }}
