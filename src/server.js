const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');

const startServer = async () => {
    await connectDB();

    app.listen(env.PORT, () => {
        logger.info(`SINA People Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
};

startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
});
