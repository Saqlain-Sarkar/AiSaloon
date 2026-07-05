import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

@Module({
  controllers: [CustomersController, CrmController],
  providers: [CustomersService, CrmService],
  exports: [CustomersService, CrmService],
})
export class CrmModule {}
