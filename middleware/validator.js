import { body, validationResult } from 'express-validator';
import { ErrorHandler } from '../utils/utility.js';

const registerValidator = () => [
    body("name", "Please enter a first name").notEmpty(),
    body("userName", "Please enter a username").notEmpty(),
    body("password", "Please enter a password").notEmpty(),
  ];
  


// Define loginValidator correctly
const loginValidator = () => [
  body("userName", "Please enter a username").notEmpty(),
  body("password", "Please enter a password").notEmpty(),
];

// Define validatorHandler to handle validation errors
const validatorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorMessages = errors.array().map(error => error.msg).join(", ");
  return next(new ErrorHandler(errorMessages, 400));
};

export { loginValidator, registerValidator,validatorHandler };
