import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { NetworkConnectionResponse } from '@workspace/types';

export class NetworkConnectionResponseDto implements NetworkConnectionResponse {
  @ApiProperty({ example: '14a61926d66e' })
  @Expose()
  networkId!: string;

  @ApiProperty({ example: 'abc123' })
  @Expose()
  containerId!: string;

  @ApiProperty({ enum: ['connected', 'disconnected'], example: 'connected' })
  @Expose()
  status!: 'connected' | 'disconnected';
}
