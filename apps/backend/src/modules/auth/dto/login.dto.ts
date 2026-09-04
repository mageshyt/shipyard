import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
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
