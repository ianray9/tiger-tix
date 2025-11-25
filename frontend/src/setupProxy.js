const { createProxyMiddleware } = require('http-proxy-middleware');

const llmURL = process.env.REACT_APP_LLM_URL;
const clientURL = process.env.REACT_APP_CLIENT_URL;


module.exports = function(app) {
  // LLM service (port 7001)
  app.use(
    '/api/llm',
    createProxyMiddleware({
      target: `${llmURL}`,
      changeOrigin: true
    })
  );

  // Client service (port 6001)
  app.use(
    '/api',
    createProxyMiddleware({
      target: `${clientURL}`,
      changeOrigin: true
    })
  );
};
