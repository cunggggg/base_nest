import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { commonFields } from '../common.fields';

const tableName = 'admin.xp_levels';

export class createXpLevelsTable1637848287090 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'level',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'xp',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'token_rewards',
            type: 'integer',
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
