import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoService } from "../aws/dynamo.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationDto } from "./dto/update-application.dto";

const USER_ID = "demo-user"; // single-tenant demo

@Injectable()
export class ApplicationsService {
  constructor(private readonly dynamo: DynamoService) {}

  async create(dto: CreateApplicationDto) {
    const id = uuidv4();
    const item = {
      pk: `USER#${USER_ID}`,
      sk: `APP#${id}`,
      appId: id,
      company: dto.company,
      role: dto.role,
      status: dto.status,
      appliedOn: dto.appliedOn ?? new Date().toISOString().slice(0, 10),
      notes: dto.notes ?? "",
      resumeUrl: dto.resumeUrl ?? "",
    };

    await this.dynamo.doc.send(
      new PutCommand({
        TableName: this.dynamo.tableName,
        Item: item,
      })
    );
    return item;
  }

  async findAll() {
    // Query all items for the demo user
    const res = await this.dynamo.doc.send(
      new QueryCommand({
        TableName: this.dynamo.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${USER_ID}`,
          ":sk": "APP#",
        },
      })
    );
    return res.Items ?? [];
  }

  async findOne(id: string) {
    const res = await this.dynamo.doc.send(
      new GetCommand({
        TableName: this.dynamo.tableName,
        Key: {
          pk: `USER#${USER_ID}`,
          sk: `APP#${id}`,
        },
      })
    );
    if (!res.Item) throw new NotFoundException("Application not found");
    return res.Item;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    // Build update expression dynamically
    const updates: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    const add = (k: string, v: any) => {
      const n = `#${k}`;
      const m = `:${k}`;
      names[n] = k;
      values[m] = v;
      updates.push(`${n} = ${m}`);
    };

    Object.entries(dto).forEach(([k, v]) => {
      if (v !== undefined) add(k, v);
    });

    if (!updates.length) return this.findOne(id);

    const res = await this.dynamo.doc.send(
      new UpdateCommand({
        TableName: this.dynamo.tableName,
        Key: { pk: `USER#${USER_ID}`, sk: `APP#${id}` },
        UpdateExpression: "SET " + updates.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return res.Attributes;
  }

  async remove(id: string) {
    await this.dynamo.doc.send(
      new DeleteCommand({
        TableName: this.dynamo.tableName,
        Key: { pk: `USER#${USER_ID}`, sk: `APP#${id}` },
      })
    );
    return { ok: true };
  }

  async stats() {
    const items = await this.findAll();
    const counts: Record<string, number> = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };
    for (const it of items as any[]) {
      if (counts[it.status] !== undefined) counts[it.status]++;
    }
    return counts;
  }
}
