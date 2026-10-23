import jwt from "jsonwebtoken";

export const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "default_super_secret_jwt_key_12345",
    {
      expiresIn: "7d",
    }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};
