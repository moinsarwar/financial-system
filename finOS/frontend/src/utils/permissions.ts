export type Permission =
  | 'client.create'
  | 'application.create'
  | 'application.advance'
  | 'application.decide'
  | 'claim.create'
  | 'claim.advance'
  | 'claim.resolve'
  | 'document.upload'
  | 'activity.read_all';

const permissionMap: Record<
  Permission,
  string[]
> = {
  'client.create': [
    'operations_agent',
    'operations_manager',
    'administrator',
    'super_admin',
  ],
  'application.create': [
    'client',
    'operations_agent',
    'operations_manager',
    'administrator',
    'super_admin',
  ],
  'application.advance': [
    'operations_agent',
    'operations_manager',
    'administrator',
    'super_admin',
  ],
  'application.decide': [
    'operations_agent',
    'operations_manager',
    'underwriter',
    'administrator',
    'super_admin',
  ],
  'claim.create': [
    'client',
    'claims_agent',
    'operations_manager',
    'administrator',
    'super_admin',
  ],
  'claim.advance': [
    'claims_agent',
    'operations_manager',
    'administrator',
    'super_admin',
  ],
  'claim.resolve': [
    'claims_agent',
    'operations_manager',
    'administrator',
    'super_admin',
  ],
  'document.upload': [
    'client',
    'operations_agent',
    'operations_manager',
    'claims_agent',
    'underwriter',
    'compliance',
    'administrator',
    'super_admin',
  ],
  'activity.read_all': [
    'operations_manager',
    'compliance',
    'administrator',
    'super_admin',
  ],
};

export function can(
  userRole: string | undefined,
  permission: Permission,
): boolean {
  if (!userRole) {
    return false;
  }

  return permissionMap[permission].includes(
    userRole,
  );
}
