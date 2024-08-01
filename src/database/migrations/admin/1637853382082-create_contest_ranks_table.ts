import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { commonFields } from '../common.fields';

const tableName = 'admin.contest_ranks';
const contestsTableName = 'admin.contests';
const usersTableName = 'admin.users';

export class createContestRanksTable1637853382082
  implements MigrationInterface
{
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
            name: 'contest_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'rank',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'total_votes',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          ...commonFields,
        ],
        uniques: [
          {
            columnNames: ['contest_id', 'rank'],
          },
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
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(tableName, true);
  }
}
