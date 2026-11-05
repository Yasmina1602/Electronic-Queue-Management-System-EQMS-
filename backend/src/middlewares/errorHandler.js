export function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Serverda ichki xatolik yuz berdi!';

  res.status(status).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

