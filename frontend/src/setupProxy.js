const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // LLM service (port 7001)
  app.use(
    '/api/llm',
    createProxyMiddleware({
      target: 'http://localhost:7001',
      changeOrigin: true
    })
  );

  // Client service (port 6001)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:6001',
      changeOrigin: true
    })
  );
};
