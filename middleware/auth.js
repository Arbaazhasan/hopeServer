import jwt, { decode } from "jsonwebtoken";
import { User } from "../model/user.js";

export const isAuthonticated = async (req, res, next) => {

    const { token } = req.cookies;
    // console.log(token);

    if (!token) return res.status(400).json({
        success: false,
        message: "Login First !!!"
    });

    const decoded = jwt.verify(token, process.env.JWT_URI);

    req.user = await User.findById(decoded);

    next();

};