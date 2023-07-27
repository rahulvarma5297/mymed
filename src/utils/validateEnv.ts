import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
  });
};

export function parseNumber(value: string): number | false {
  const parsed = parseFloat(value);
  return !isNaN(parsed) ? parsed : false;
}

@ValidatorConstraint()
export class CoerceInteger implements ValidatorConstraintInterface {
  validate(value: string) {
    const parsed = +value;
    return !isNaN(parsed) && parsed >= 0;
  }

  defaultMessage() {
    return 'Value must be a positive integer';
  }
}
