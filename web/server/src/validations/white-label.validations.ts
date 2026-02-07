import Joi from 'joi';

export const createBrandingSchema = Joi.object({
  logoUrl: Joi.string().uri().optional(),
  logoLightUrl: Joi.string().uri().optional(),
  logoDarkUrl: Joi.string().uri().optional(),
  faviconUrl: Joi.string().uri().optional(),
  coverImageUrl: Joi.string().uri().optional(),
  primaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  accentColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  backgroundColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  textColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  linkColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  fontFamily: Joi.string().max(200).optional(),
  headingFont: Joi.string().max(200).optional(),
  brandName: Joi.string().max(200).optional(),
  tagline: Joi.string().max(500).optional(),
  supportEmail: Joi.string().email().optional(),
  supportPhone: Joi.string().max(50).optional(),
  websiteUrl: Joi.string().uri().optional(),
  emailHeaderImage: Joi.string().uri().optional(),
  emailFooterText: Joi.string().max(1000).optional(),
  emailSignature: Joi.string().max(5000).optional(),
  socialLinks: Joi.object().pattern(
    Joi.string(),
    Joi.string().uri(),
  ).optional(),
  metadata: Joi.object().optional(),
});

export const updateBrandingStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL').required(),
  rejectionReason: Joi.string().max(1000).optional(),
});

export const createCustomDomainSchema = Joi.object({
  domain: Joi.string()
    .pattern(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i)
    .required()
    .messages({
      'string.pattern.base': 'Invalid domain format',
    }),
  subdomain: Joi.string().max(100).optional(),
  isPrimary: Joi.boolean().optional(),
  cnameTarget: Joi.string().max(255).optional(),
  ipAddress: Joi.string().ip().optional(),
});

export const updateCustomDomainSchema = Joi.object({
  isPrimary: Joi.boolean().optional(),
  status: Joi.string().valid('PENDING', 'VERIFIED', 'FAILED', 'SUSPENDED').optional(),
  sslEnabled: Joi.boolean().optional(),
  sslCertificate: Joi.string().optional(),
  sslKey: Joi.string().optional(),
});

export const verifyCustomDomainSchema = Joi.object({
  status: Joi.string().valid('VERIFIED', 'FAILED', 'SUSPENDED').required(),
  failureReason: Joi.string().max(1000).optional(),
});
