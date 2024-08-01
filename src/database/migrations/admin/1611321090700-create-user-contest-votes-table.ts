import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { commonFields } from '@database/migrations/common.fields';

const tableName = 'admin.user_contest_votes';
const contestsTableName = 'admin.contests';
const contentsTableName = 'admin.contents';
const usersTableName = 'admin.users';

export class createUserVotesTable1611321090700
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'integer',
            isGenerated: true,
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contest_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'content_id',
            type: 'integer',
            isNullable: false,
          },
          ...commonFields,
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: usersTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['contest_id'],
            referencedColumnNames: ['id'],
            referencedTableName: contestsTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['content_id'],
            referencedColumnNames: ['id'],
            referencedTableName: contentsTableName,
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //If table has foreingn keys, third parameter must to be true
    await queryRunner.dropTable(tableName, true, true);
  }
}
