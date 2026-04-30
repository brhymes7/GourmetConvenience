/**
 * One error handler keeps route files clean and prevents raw stack traces from
 * being sent to customers in production.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error('[server-error]', err);
  }

  res.status(statusCode).json({
    error: err.publicMessage || err.message || 'Something went wrong.',
    statusCode
  });
}
