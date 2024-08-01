import { Factory, Seeder } from 'typeorm-seeding';
import { Connection, In } from 'typeorm';
import * as _ from 'lodash';
import { UserStatus } from '../../modules/admin/access/users/user-status.enum';
import { UserEntity } from '../../modules/admin/access/users/user.entity';
import { RoleEntity } from '../../modules/admin/access/roles/role.entity';
import { PermissionEntity } from '../../modules/admin/access/permissions/permission.entity';
import { HashHelper } from '../../helpers';

const adminUsers = [
  {
    provider: 'local',
    providerId: '1',
    password: 'Republik@123',
    username: 'admin',
    name: 'admin',
    isSuperUser: true,
    status: UserStatus.Active,
  },
];

const totalTestUsers = 15;

const defaultTestUsers = {
  provider: 'local',
  providerId: 'test_x',
  password: 'republik',
  username: 'republik_1',
  name: 'Republik Tester 1',
  isSuperUser: false,
  status: UserStatus.Active,
};

const rolePermissions = {
  Developer: [
    { slug: 'admin.access.users.read', description: 'Read users' },
    { slug: 'admin.access.users.create', description: 'Create users' },
    { slug: 'admin.access.users.update', description: 'Update users' },
    { slug: 'admin.access.roles.read', description: 'Read Roles' },
    { slug: 'admin.access.roles.create', description: 'Create Roles' },
    { slug: 'admin.access.roles.update', description: 'Update Roles' },
    { slug: 'admin.access.permissions.read', description: 'Read permissions' },
    {
      slug: 'admin.access.permissions.create',
      description: 'Create permissions',
    },
    {
      slug: 'admin.access.permissions.update',
      description: 'Update permissions',
    },
  ],
  Admin: [
    { slug: 'admin.access.users.read', description: 'Read users' },
    { slug: 'admin.access.users.create', description: 'Create users' },
    { slug: 'admin.access.users.update', description: 'Update users' },
    { slug: 'admin.access.roles.read', description: 'Read Roles' },
    { slug: 'admin.access.roles.create', description: 'Create Roles' },
    { slug: 'admin.access.roles.update', description: 'Update Roles' },
  ],
};

export default class CreateUsersSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const roleNames = Object.keys(rolePermissions);
    // Distinct permissions contained in all roles
    const permissions = _.uniqBy(
      roleNames.reduce((acc, roleName) => {
        return acc.concat(rolePermissions[roleName]);
      }, []),
      'slug',
    );
    // Getting slugs form permissions
    const permissionSlugs = permissions.map((p) => p.slug);
    // Getting existing permissions from the DB
    const existingPermissions = await connection.manager.find(
      PermissionEntity,
      { where: { slug: In(permissionSlugs) } },
    );
    // Mapping all permissions to permission entities
    const validPermissions = permissions.map((p) => {
      const existing = existingPermissions.find((e) => e.slug === p.slug);
      if (existing) {
        return existing;
      }
      return new PermissionEntity(p);
    });
    // Creating / updating permissions
    const savedPermissions = (
      await connection.manager.save(validPermissions)
    ).reduce((acc, p) => {
      return { ...acc, [p.slug]: p };
    }, {});

    // Creating roles
    const roles = roleNames.map((name) => {
      const permissions = Promise.resolve(
        rolePermissions[name].map((p) => savedPermissions[p.slug]),
      );
      return new RoleEntity({ name, permissions });
    });
    const savedRoles = await connection.manager.save(roles);
    //Creating users
    const entities = await Promise.all(
      adminUsers.map(async (u) => {
        const roles = Promise.resolve(savedRoles);
        const password = await HashHelper.encrypt(u.password);
        return new UserEntity({ ...u, password, roles });
      }),
    );
    await connection.manager.save(entities);

    //testing users
    const testUsers = [];
    for (let i = 1; i <= totalTestUsers; i++) {
      const roles = Promise.resolve([] as RoleEntity[]);
      const password = await HashHelper.encrypt(defaultTestUsers.password);
      const user = Object.assign({}, defaultTestUsers, {
        providerId: 'test_' + i,
        username: 'republik_' + i,
        name: 'Republik Testers ' + i,
      });

      testUsers.push(new UserEntity({ ...user, password, roles }));
    }

    await connection.manager.save(testUsers);
  }
}
