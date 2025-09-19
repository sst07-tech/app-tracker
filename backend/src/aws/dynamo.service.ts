import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoService {
  public readonly doc: DynamoDBDocumentClient;
  public readonly tableName: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.tableName = process.env.DDB_TABLE || 'ApplyTrackrTable';
    const client = new DynamoDBClient({ region });
    this.doc = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true
      }
    });
  }
}
