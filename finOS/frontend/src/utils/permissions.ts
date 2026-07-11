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
  ],
  'application.create': [
    'client',
    'operations_agent',
    'operations_manager',
    'administrator',
  ],
  'application.advance': [
    'operations_agent',
    'operations_manager',
    'administrator',
  ],
  'application.decide': [
    'operations_agent',
    'operations_manager',
    'underwriter',
    'administrator',
  ],
  'claim.create': [
    'client',
    'claims_agent',
    'operations_manager',
    'administrator',
  ],
  'claim.advance': [
    'claims_agent',
    'operations_manager',
    'administrator',
  ],
  'claim.resolve': [
    'claims_agent',
    'operations_manager',
    'administrator',
  ],
  'document.upload': [
    'client',
    'operations_agent',
    'operations_manager',
    'claims_agent',
    'underwriter',
    'compliance',
    'administrator',
  ],
  'activity.read_all': [
    'operations_manager',
    'compliance',
    'administrator',
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
