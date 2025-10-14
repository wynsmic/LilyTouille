import { IsUrl } from 'class-validator';

export class ScrapeRequestDto {
  @IsUrl()
  url!: string;
}
