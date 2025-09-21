import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoService } from "../aws/dynamo.service";

type ApplicationStatus =
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "On Hold";

export interface ApplicationItem {
  pk: string; // USER#<sub>
  sk: string; // APP#<appId>
  appId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedOn?: string; // ISO date
  notes?: string;
  resumeUrl?: string;
}

export interface CreateApplicationDto {
  company: string;
  role: string;
  status?: ApplicationStatus;
  appliedOn?: string;
  notes?: string;
  resumeUrl?: string;
}

export interface UpdateApplicationDto {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  appliedOn?: string;
  notes?: string;
  resumeUrl?: string;
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly dynamo: DynamoService) {}

  private userPk(userId: string) {
    return `USER#${userId}`;
  }

  private appSk(appId: string) {
    return `APP#${appId}`;
  }

  // ---------- READ LIST ----------
  async listForUser(userId: string): Promise<ApplicationItem[]> {
    const res = await this.dynamo.doc.send(
      new QueryCommand({
        TableName: this.dynamo.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": this.userPk(userId),
          ":sk": "APP#",
        },
      })
    );
    return (res.Items || []) as ApplicationItem[];
  }

  // ---------- SIMPLE STATS ----------
  async statsForUser(userId: string): Promise<Record<string, number>> {
    const items = await this.listForUser(userId);
    const counts: Record<string, number> = {};
    for (const it of items) counts[it.status] = (counts[it.status] || 0) + 1;
    counts.total = items.length;
    return counts;
  }

  // ---------- READ ONE ----------
  async getForUser(userId: string, appId: string): Promise<ApplicationItem> {
    const res = await this.dynamo.doc.send(
      new GetCommand({
        TableName: this.dynamo.tableName,
        Key: { pk: this.userPk(userId), sk: this.appSk(appId) },
      })
    );
    if (!res.Item) throw new NotFoundException("Application not found");
    return res.Item as ApplicationItem;
  }

  // ---------- CREATE ----------
  async createForUser(
    userId: string,
    dto: CreateApplicationDto
  ): Promise<ApplicationItem> {
    const appId = crypto.randomUUID();
    const item: ApplicationItem = {
      pk: this.userPk(userId),
      sk: this.appSk(appId),
      appId,
      company: dto.company,
      role: dto.role,
      status: (dto.status || "Applied") as ApplicationStatus,
      appliedOn: dto.appliedOn,
      notes: dto.notes,
      resumeUrl: dto.resumeUrl,
    };
    await this.dynamo.doc.send(
      new PutCommand({
        TableName: this.dynamo.tableName,
        Item: item,
        // Optional: prevent accidental overwrite if same key exists
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      })
    );
    return item;
  }

  // ---------- UPDATE (partial) ----------
  async updateForUser(
    userId: string,
    appId: string,
    dto: UpdateApplicationDto
  ): Promise<ApplicationItem> {
    // Build dynamic UpdateExpression safely using placeholders
    const setParts: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    const setField = (key: keyof UpdateApplicationDto, attrName?: string) => {
      const val = dto[key];
      if (typeof val === "undefined") return;
      const nameKey = `#${String(key)}`;
      const valueKey = `:${String(key)}`;
      names[nameKey] = attrName || (key as string);
      values[valueKey] = val;
      setParts.push(`${nameKey} = ${valueKey}`);
    };

    setField("company");
    setField("role");
    setField("status");
    setField("appliedOn");
    setField("notes");
    setField("resumeUrl");

    if (setParts.length === 0) {
      // Nothing to update; return current item
      return this.getForUser(userId, appId);
    }

    const res = await this.dynamo.doc.send(
      new UpdateCommand({
        TableName: this.dynamo.tableName,
        Key: { pk: this.userPk(userId), sk: this.appSk(appId) },
        UpdateExpression: `SET ${setParts.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
        // Optional: ensure the item exists
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      })
    );

    if (!res.Attributes) throw new NotFoundException("Application not found");
    return res.Attributes as ApplicationItem;
  }

  // ---------- DELETE ----------
  async deleteForUser(userId: string, appId: string): Promise<{ ok: true }> {
    await this.dynamo.doc.send(
      new DeleteCommand({
        TableName: this.dynamo.tableName,
        Key: { pk: this.userPk(userId), sk: this.appSk(appId) },
        // Optional: ensure the item exists
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      })
    );
    return { ok: true };
  }
}
