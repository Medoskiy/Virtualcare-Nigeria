function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const messages = {
      email: 'An account with this email already exists',
      username: 'This username is already taken',
      mdcnNumber: 'This MDCN number is already registered'
    };
    return res.status(409).json({
      success: false,
      message: messages[field] || 'This value is already in use'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid session. Please log in again.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
}

module.exports = { errorHandler, notFoundHandler };
