import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.contest_battles';
const contentsTableName = 'admin.contents';
const contestsTableName = 'admin.contests';

export class createContestBattleTable1611321090671
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
            name: 'contest_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'content_a',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'content_b',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'winner',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['contest_id'],
            referencedColumnNames: ['id'],
            referencedTableName: contestsTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['content_a'],
            referencedColumnNames: ['id'],
            referencedTableName: contentsTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['content_b'],
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
