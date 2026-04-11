/**
 * Middleware xử lý lỗi toàn cục.
 */

export const errorHandler = (err, req, res, _next) => {
  console.error('Lỗi:', err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Đã xảy ra lỗi hệ thống',
    },
  });
};
