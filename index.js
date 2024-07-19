const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const axios = require("axios");

const app = express();

const PORT = 3005;

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  limit: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes).
});

// in all of the coming request we will call morgan and see the log in better format
app.use(morgan("combined"));
app.use(limiter);
// when we send more than 5 request under 2 min. then rate limiter will not allow
app.use("/bookingservice", async (req, res, next) => {
  // if we want to protect any incoming route, then simply put / instead of any specific route i.e bookingservice
  console.log(req.headers["x-access-token"]);
  // passing headers data in axios
  try {
    const response = await axios.get(
      "http://localhost:3002/api/v1/isAuthenticated",
      {
        headers: {
          "x-access-token": req.headers["x-access-token"],
        },
      }
    );
    console.log(response.data);
    // if its authenticate, then only allow to do booking
    if (response.data.success) {
      next();
    } else {
      return res.status(401).json({
        message: "Unauthorised user",
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorised user",
    });
  }
});
app.use(
  "/searchservice",
  createProxyMiddleware({
    target: "http://localhost:3001/",
    changeOrigin: true,
  })
);
app.use(
  "/authservice",
  createProxyMiddleware({
    target: "http://localhost:3002/",
    changeOrigin: true,
  })
);
app.use(
  "/bookingservice",
  createProxyMiddleware({
    target: "http://localhost:3003/",
    changeOrigin: true,
  })
);
app.use(
  "/reminderservice",
  createProxyMiddleware({
    target: "http://localhost:3004/",
    changeOrigin: true,
  })
);
app.get("/home", (req, res) => {
  return res.json({ message: "OK" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
