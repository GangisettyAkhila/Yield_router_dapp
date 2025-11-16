module.exports = function rateLimit() {
  // Simple no-op / lightweight rate limiter placeholder
  // Replace with a proper limiter (express-rate-limit) if needed.
  return (req, res, next) => {
    next();
  };
};
