import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { commonFields } from '../common.fields';

const tableName = 'admin.users';

export class createUsersTable1610321042350 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            isGenerated: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '30',
            isUnique: true,
          },
          {
            name: 'devices',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'provider_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'personal_link',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'instagram_link',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'tiktok_link',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'is_super_user',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'status',
            type: 'user_status',
            isNullable: false,
          },
          ...commonFields,
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(tableName, true);
  }
}
