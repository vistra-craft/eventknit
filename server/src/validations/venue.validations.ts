import Joi from 'joi';

export const createVenueSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().max(5000).optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  postalCode: Joi.string().max(20).optional(),
  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  venueType: Joi.string().max(100).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  defaultSeatMap: Joi.object().optional(),
});

export const updateVenueSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(5000).optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  postalCode: Joi.string().max(20).optional(),
  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  venueType: Joi.string().max(100).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  defaultSeatMap: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

export const createSeatMapSchema = Joi.object({
  venueId: Joi.string().uuid().optional(),
  name: Joi.string().max(200).optional(),
  layout: Joi.object({
    sections: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        type: Joi.string().optional(),
        rows: Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            label: Joi.string().required(),
            seats: Joi.array().items(
              Joi.object({
                id: Joi.string().optional(),
                label: Joi.string().required(),
                type: Joi.string().valid('STANDARD', 'VIP', 'PREMIUM', 'WHEELCHAIR', 'COMPANION', 'STANDING').optional(),
                price: Joi.number().optional(),
                x: Joi.number().optional(),
                y: Joi.number().optional(),
                angle: Joi.number().optional(),
                metadata: Joi.object().optional(),
              }),
            ).required(),
          }),
        ).required(),
      }),
    ).required(),
  }).required(),
  pricing: Joi.object().optional(),
  imageUrl: Joi.string().uri().optional(),
  width: Joi.number().integer().min(1).optional(),
  height: Joi.number().integer().min(1).optional(),
});

export const reserveSeatsSchema = Joi.object({
  seatIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  registrationId: Joi.string().uuid().required(),
  reservationTimeoutMinutes: Joi.number().integer().min(1).max(60).optional(),
});
