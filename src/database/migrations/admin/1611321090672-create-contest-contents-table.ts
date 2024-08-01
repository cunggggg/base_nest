import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.contests_contents',
  contentsTableName = 'admin.contents',
  contestsTableName = 'admin.contests';

export class createContestsContentsTable1611321090672
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'contest_id',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'content_id',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
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
