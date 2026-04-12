import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = winston.format;

/**
 * Custom log format for Winston logger.
 */
const logFormat = printf(({ level, message, timestamp }) => `\n[${level}]: ${timestamp} | ${message}`);
/**
 * Creates and configures a Winston logger instance.
 * @returns {winston.Logger} Configured Winston logger instance.
 */
const createLogger = () =>
    winston.createLogger({
        level: 'info',
        format: combine(
            colorize(), // Colorize logs in the console
            timestamp(), // Add timestamp to logs
            logFormat, // Use custom log format
        ),
        transports: [
            new winston.transports.Console(), // Log to console
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
            }), // Log errors to a file
            new winston.transports.File({ filename: 'logs/combined.log' }), // Log combined to a file
            new DailyRotateFile({
                filename: 'logs/application-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxFiles: '14d',
            }), // Daily rotating log
        ],
        exceptionHandlers: [
            new winston.transports.File({ filename: 'logs/exceptions.log' }), // Handle uncaught exceptions
        ],
        rejectionHandlers: [
            new winston.transports.File({ filename: 'logs/rejections.log' }), // Handle unhandled promise rejections
        ],
    });

const logger = createLogger();

export default logger;
