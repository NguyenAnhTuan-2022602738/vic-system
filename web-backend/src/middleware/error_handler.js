/**
 * Middleware xử lý lỗi toàn cục.
 */

export const errorHandler = (err, req, res, _next) => {
  // Log chi tiết lỗi để debug
  if (err.response) {
    // Lỗi từ phía AI Service trả về (Axios error)
    console.error('--- AI SERVICE ERROR ---');
    console.error('Status:', err.response.status);
    console.error('Data:', JSON.stringify(err.response.data, null, 2));
  } else {
    // Lỗi nội bộ Backend hoặc lỗi kết nối
    console.error('--- INTERNAL ERROR ---');
    console.error('Message:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
  }

  const statusCode = err.statusCode || (err.response ? err.response.status : 500);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Đã xảy ra lỗi hệ thống',
      details: err.response ? err.response.data : null
    },
  });
};
