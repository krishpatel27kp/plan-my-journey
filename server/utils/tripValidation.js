/**
 * Validation utilities for Trips and TripStops
 * Enforces standard error shapes: { error: { code: "VALIDATION_ERROR", message: "..." } }
 */

function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  // Check standard YYYY-MM-DD format or ISO format
  const dateObj = new Date(trimmed);
  if (isNaN(dateObj.getTime())) return false;
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed);
}

function parseDate(dateStr) {
  return new Date(dateStr.trim()).getTime();
}

/**
 * Validate POST /api/trips payload
 * Required: title, startDate, endDate
 * Optional: budget (numeric >= 0), description, currency, coverImage
 */
function validateCreateTrip(body = {}) {
  const { title, startDate, endDate, budget, start_date, end_date } = body;
  const start = startDate || start_date;
  const end = endDate || end_date;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return {
      isValid: false,
      message: 'Title is required and cannot be empty'
    };
  }

  if (!start) {
    return {
      isValid: false,
      message: 'startDate is required'
    };
  }

  if (!isValidDate(start)) {
    return {
      isValid: false,
      message: 'startDate must be a valid date in YYYY-MM-DD format'
    };
  }

  if (!end) {
    return {
      isValid: false,
      message: 'endDate is required'
    };
  }

  if (!isValidDate(end)) {
    return {
      isValid: false,
      message: 'endDate must be a valid date in YYYY-MM-DD format'
    };
  }

  if (parseDate(start) > parseDate(end)) {
    return {
      isValid: false,
      message: 'startDate cannot be after endDate'
    };
  }

  if (budget !== undefined && budget !== null && budget !== '') {
    const numBudget = Number(budget);
    if (isNaN(numBudget) || typeof budget === 'boolean' || numBudget < 0) {
      return {
        isValid: false,
        message: 'budget must be a valid positive number'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate PUT /api/trips/:id payload
 */
function validateUpdateTrip(body = {}) {
  const { title, startDate, endDate, budget, start_date, end_date } = body;
  const start = startDate || start_date;
  const end = endDate || end_date;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return {
        isValid: false,
        message: 'Title cannot be empty'
      };
    }
  }

  if (start !== undefined) {
    if (!isValidDate(start)) {
      return {
        isValid: false,
        message: 'startDate must be a valid date in YYYY-MM-DD format'
      };
    }
  }

  if (end !== undefined) {
    if (!isValidDate(end)) {
      return {
        isValid: false,
        message: 'endDate must be a valid date in YYYY-MM-DD format'
      };
    }
  }

  if (start && end) {
    if (parseDate(start) > parseDate(end)) {
      return {
        isValid: false,
        message: 'startDate cannot be after endDate'
      };
    }
  }

  if (budget !== undefined && budget !== null && budget !== '') {
    const numBudget = Number(budget);
    if (isNaN(numBudget) || typeof budget === 'boolean' || numBudget < 0) {
      return {
        isValid: false,
        message: 'budget must be a valid positive number'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate POST /api/trips/:tripId/stops payload
 * Body: { cityId, startDate, endDate, stopOrder }
 */
function validateCreateStop(body = {}) {
  const { cityId, city_id, cityName, city_name } = body;
  const cId = cityId || city_id;
  const cName = cityName || city_name;

  // At least cityId OR cityName must be provided
  if ((!cId || typeof cId !== 'string' || cId.trim().length === 0) &&
      (!cName || typeof cName !== 'string' || cName.trim().length === 0)) {
    return {
      isValid: false,
      message: 'cityId or cityName is required'
    };
  }

  // startDate and endDate are optional for stops
  const start = body.startDate || body.start_date;
  const end = body.endDate || body.end_date;

  if (start && !isValidDate(start)) {
    return {
      isValid: false,
      message: 'startDate must be a valid date in YYYY-MM-DD format'
    };
  }

  if (end && !isValidDate(end)) {
    return {
      isValid: false,
      message: 'endDate must be a valid date in YYYY-MM-DD format'
    };
  }

  if (start && end && new Date(start) > new Date(end)) {
    return {
      isValid: false,
      message: 'endDate must be after or equal to startDate'
    };
  }

  return { isValid: true };
}

/**
 * Helper to generate standardized VALIDATION_ERROR response
 */
function sendValidationError(res, message) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message
    }
  });
}

/**
 * Helper to generate standardized NOT_FOUND response
 */
function sendNotFoundError(res, message = 'Trip not found') {
  return res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message
    }
  });
}

module.exports = {
  isValidDate,
  validateCreateTrip,
  validateUpdateTrip,
  validateCreateStop,
  sendValidationError,
  sendNotFoundError
};
