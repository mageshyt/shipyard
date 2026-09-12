import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import type { CreateUser } from '@workspace/types';

export class CreateUserDto implements CreateUser {
  @ApiProperty({
    description: 'The name of the user',
    example: 'magesh',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  name!: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'magesh@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password!: string;
}
