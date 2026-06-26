const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg || 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

const validatePatientRegister = [
  body('name').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('surname').trim().notEmpty().withMessage('Surname is required').isLength({ max: 50 }),
  body('username').trim().notEmpty()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional({ checkFalsy: true })
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage('Enter a valid Nigerian number (e.g. 0801 234 5678)'),
  handleValidationErrors
];

const validateDoctorRegister = [
  body('name').trim().notEmpty().withMessage('First name is required'),
  body('surname').trim().notEmpty().withMessage('Surname is required'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('yearsOfExperience').optional().isInt({ min: 0, max: 60 }).withMessage('Enter valid years of experience'),
  body('mobileNo').optional({ checkFalsy: true })
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage('Enter a valid Nigerian phone number'),
  body('mdcnNumber').matches(/^MDN\/[A-Z]+\/\d{4}\/\d+$/)
    .withMessage('Enter a valid MDCN number (e.g. MDN/LUTH/2019/12345)'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

module.exports = { handleValidationErrors, validatePatientRegister, validateDoctorRegister };
