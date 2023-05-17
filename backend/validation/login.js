import { ExpressValidator, body } from "express-validator";

export const loginValidation = [
    body('email').isEmail(),
    body('password').isLength({min:5}),
  ];
