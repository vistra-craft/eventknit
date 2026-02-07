import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

/**
 * Validate request body against Joi schema
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false, // Don't strip - preserve all fields defined in schema (including optional ones)
      allowUnknown: true, // Allow unknown fields at root level, but schema validation will catch invalid nested fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError(errors.map((e) => e.message).join(', ')));
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false, // Don't strip - just validate
      allowUnknown: true, // Allow unknown fields to pass through
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError(errors.map((e) => e.message).join(', ')));
    }

    // Note: req.query is read-only in Express, so we can't modify it
    // The handlers will use req.query directly with the original parsed values
    next();
  };
};

/**
 * Validate URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: false, // Don't strip - just validate
      allowUnknown: true, // Allow unknown fields to pass through
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError(errors.map((e) => e.message).join(', ')));
    }

    // Note: req.params is read-only in Express, so we can't modify it
    // The handlers will use req.params directly with the original parsed values
    next();
  };
};







