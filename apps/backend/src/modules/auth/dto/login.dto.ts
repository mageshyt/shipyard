import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import type { Login } from '@workspace/types';

export class LoginDto implements Login {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'magesh@gmail.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  password!: string;
}
