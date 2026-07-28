export type CompanyKey = 'insurance' | 'mortgage' | 'lending';

export interface RoleOption {
    value: string;
    label: string;
}

export interface CompanyConfig {
    label: string;
    roles: RoleOption[];
}

export const COMPANY_ROLE_MAP: Record<CompanyKey, CompanyConfig> = {
    insurance: {
        label: 'Innovative Insurance',
        roles: [
            { value: 'csr', label: 'CSR' },
            { value: 'admin', label: 'Admin' },
            { value: 'accounting', label: 'Accounting' },
            { value: 'superadmin', label: 'Super Admin' },
        ],
    },
    mortgage: {
        label: 'Moonstar Mortgage',
        roles: [
            { value: 'mortgage', label: 'Mortgage' },
        ],
    },
    lending: {
        label: 'Accurate Lending',
        roles: [
            { value: 'lending', label: 'Lending' },
        ],
    },
};

export const validateCompanyRole = (company: string, role: string): boolean => {
    if (!company || !role || !(company in COMPANY_ROLE_MAP)) {
        return false;
    }
    const config = COMPANY_ROLE_MAP[company as CompanyKey];
    return config.roles.some((r) => r.value === role);
};
