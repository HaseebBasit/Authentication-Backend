import jwt from "jsonwebtoken";

const checkAuthenticated = (req, res, next) => {
  try {
    const headerVal = req.headers?.authorization;

    if (!headerVal) {
      return res.status(401).json({
        status: false,
        message: "Token is required!"
      });
    }

    const token = headerVal.split(" ")[1]; // remove "Bearer "

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Token is required!"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // optional but useful
    next();

  } catch (error) {
    console.log("Token Error:", error.message);

    return res.status(401).json({
      status: false,
      message: "Invalid or expired token"
    });
  }
};

export { checkAuthenticated };