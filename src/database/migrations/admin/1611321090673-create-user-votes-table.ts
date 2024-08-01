import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.user_votes';
const battlesTableName = 'admin.contest_battles';
const contentsTableName = 'admin.contents';
const usersTableName = 'admin.users';

export class createUserVotesTable1611321090672
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
            name: 'battle_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'content_id',
            type: 'integer',
            isNullable: false,
          },
        ],
        uniques: [
          {
            columnNames: ['user_id', 'battle_id'],
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
            columnNames: ['battle_id'],
            referencedColumnNames: ['id'],
            referencedTableName: battlesTableName,
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
