import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.battle_sequences',
  userssTableName = 'admin.users',
  contestsTableName = 'admin.contests';

export class createBattleSequencesTable1611321090680
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
            name: 'current_step',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'contest_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'voted_user',
            type: 'uuid',
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
            columnNames: ['voted_user'],
            referencedColumnNames: ['id'],
            referencedTableName: userssTableName,
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
