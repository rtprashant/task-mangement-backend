import jwt from "jsonwebtoken";
export const generateToken = (userId, email, roles) => {
    const accessToken = jwt.sign(
        { userId, email, roles },
        process.env.ACCESS_TOKEN_SECRET || "your-secret-key",
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || "15m" }
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret",
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || "7d" }
    );
    return { accessToken, refreshToken };
}