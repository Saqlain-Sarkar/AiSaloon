import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform<string, Record<string, any>> {
  transform(value: string): Record<string, any> {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }
  }
}
