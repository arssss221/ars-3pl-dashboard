import {
  employeeSeeds,
  getEmployeeDisplayName,
  getEmployeeInitials,
  getSelfieUrl,
  isArabicLanguage,
} from '../employees/employeeData';

const normalizeName = (name: string) => name.trim().toLowerCase();

export const getVehiclePersonEmployee = (name: string) => {
  const normalizedName = normalizeName(name);
  if (!normalizedName || normalizedName === 'unassigned') return undefined;

  return employeeSeeds.find((employee) =>
    [employee.fullName, employee.arabicName, employee.nickName].some(
      (candidate) => normalizeName(candidate) === normalizedName
    )
  );
};

export const getVehiclePersonDisplayName = (
  name: string,
  language?: string
) => {
  const employee = getVehiclePersonEmployee(name);
  if (employee) return getEmployeeDisplayName(employee, language);
  if (isArabicLanguage(language) && normalizeName(name) === 'unassigned') {
    return 'غير معين';
  }
  return name;
};

export const getVehiclePersonInitials = (name: string, language?: string) => {
  const employee = getVehiclePersonEmployee(name);
  if (employee) return getEmployeeInitials(employee, language);

  const displayName = getVehiclePersonDisplayName(name, language);
  if (isArabicLanguage(language)) return displayName.trim().charAt(0) || 'م';

  return (
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'NA'
  );
};

export const getVehiclePersonImageUrl = (
  name: string,
  fallbackImageUrl = ''
) => {
  const employee = getVehiclePersonEmployee(name);
  return (employee ? getSelfieUrl(employee) : null) ?? fallbackImageUrl;
};

export const getVehiclePersonSearchTokens = (name: string) => {
  const employee = getVehiclePersonEmployee(name);
  return [
    name,
    employee?.fullName,
    employee?.arabicName,
    employee?.nickName,
  ].filter(Boolean);
};
