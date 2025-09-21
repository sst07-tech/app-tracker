import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApplicationsService,
  CreateApplicationDto,
  UpdateApplicationDto,
} from "./applications.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  @Get()
  async list(@Req() req: any) {
    return this.svc.listForUser(req.user.sub);
  }

  @Get("stats")
  async stats(@Req() req: any) {
    return this.svc.statsForUser(req.user.sub);
  }

  @Get(":id")
  async getOne(@Req() req: any, @Param("id") id: string) {
    return this.svc.getForUser(req.user.sub, id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateApplicationDto) {
    return this.svc.createForUser(req.user.sub, dto);
  }

  @Patch(":id")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateApplicationDto
  ) {
    return this.svc.updateForUser(req.user.sub, id, dto);
  }

  @Delete(":id")
  async remove(@Req() req: any, @Param("id") id: string) {
    return this.svc.deleteForUser(req.user.sub, id);
  }
}
