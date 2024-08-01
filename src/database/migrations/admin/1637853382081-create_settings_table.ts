import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { commonFields } from '../common.fields';

const tableName = 'admin.settings';
export class createSettingsTable1637853382081 implements MigrationInterface {

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
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'value',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'type',
                    type: 'varchar',
                    length: '100',
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
