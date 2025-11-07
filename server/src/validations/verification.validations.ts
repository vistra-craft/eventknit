import Joi from 'joi';

export const verificationValidations = {
  identityVerification: Joi.object({
    firstName: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'First name is required',
      'any.required': 'First name is required',
    }),
    lastName: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required',
    }),
    dateOfBirth: Joi.date().required().messages({
      'any.required': 'Date of birth is required',
    }),
    address: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Address is required',
      'any.required': 'Address is required',
    }),
    city: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'City is required',
      'any.required': 'City is required',
    }),
    state: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'State is required',
      'any.required': 'State is required',
    }),
    zipCode: Joi.string().trim().min(1).max(20).required().messages({
      'string.empty': 'ZIP code is required',
      'any.required': 'ZIP code is required',
    }),
    country: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Country is required',
      'any.required': 'Country is required',
    }),
    idType: Joi.string()
      .valid('passport', 'drivers_license', 'national_id')
      .required()
      .messages({
        'any.only': 'ID type must be one of: passport, drivers_license, national_id',
        'any.required': 'ID type is required',
      }),
    idNumber: Joi.string().trim().min(1).max(50).required().messages({
      'string.empty': 'ID number is required',
      'any.required': 'ID number is required',
    }),
    idDocumentUrl: Joi.string().uri().required().messages({
      'string.uri': 'ID document URL must be a valid URL',
      'any.required': 'ID document URL is required',
    }),
  }),

  businessVerification: Joi.object({
    businessName: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Business name is required',
      'any.required': 'Business name is required',
    }),
    businessType: Joi.string()
      .valid('corporation', 'llc', 'partnership', 'sole-proprietorship', 'non-profit', 'other')
      .required()
      .messages({
        'any.only': 'Business type must be one of: corporation, llc, partnership, sole-proprietorship, non-profit, other',
        'any.required': 'Business type is required',
      }),
    taxId: Joi.string().trim().min(1).max(50).required().messages({
      'string.empty': 'Tax ID is required',
      'any.required': 'Tax ID is required',
    }),
    businessAddress: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Business address is required',
      'any.required': 'Business address is required',
    }),
    businessCity: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Business city is required',
      'any.required': 'Business city is required',
    }),
    businessState: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Business state is required',
      'any.required': 'Business state is required',
    }),
    businessZipCode: Joi.string().trim().min(1).max(20).required().messages({
      'string.empty': 'Business ZIP code is required',
      'any.required': 'Business ZIP code is required',
    }),
    businessCountry: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Business country is required',
      'any.required': 'Business country is required',
    }),
    businessLicenseUrl: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Business license URL must be a valid URL',
    }),
    taxDocumentUrl: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Tax document URL must be a valid URL',
    }),
  }),
};


