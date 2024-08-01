import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.contest_claims';
const contestsTableName = 'admin.contests';
const usersTableName = 'admin.users';

export class createUserClaimsTable1637853382083
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
            name: 'participant_type',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'claimed',
            type: 'boolean',
            isNullable: false,
            default: false,
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
