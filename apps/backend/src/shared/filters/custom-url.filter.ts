import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsLocalOrPublicUrlConstraint
  implements ValidatorConstraintInterface
{
  validate(url: any): boolean {
    const regex =
      /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3}|[\w.-]+\.[a-z]{2,})/i;
    return typeof url === 'string' && regex.test(url);
  }

  defaultMessage(): string {
    return 'URL must be a valid http/https address';
  }
}

export function IsLocalOrPublicUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLocalOrPublicUrlConstraint,
    });
  };
}

const commonPasswords = [
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',

  '123456',
  '234567',
  '345678',
  '456789',
  '012345',
  '654321',
  '543210',
  '987654',
  '876543',
  '765432',

  '101010',
  '010101',
  '121212',
  '212121',
  '343434',
  '434343',
  '565656',
  '656565',
  '787878',
  '878787',
  '909090',
  '090909',
  '112233',
  '332211',
];

@ValidatorConstraint({ async: false })
export class IsNotCommonPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string) {
    return !commonPasswords.includes(password.toLowerCase());
  }

  defaultMessage() {
    return 'Password is too common or easily guessable';
  }
}

export function IsNotCommonPassword(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotCommonPasswordConstraint,
    });
  };
}
