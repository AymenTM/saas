'use client'

import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

export function usePermissions() {
  const { role } = useAuth()

  const isSuperAdmin = role === 'super_admin'
  const isCompanyAdmin = role === 'company_admin'
  const isEmployee = role === 'employee'

  const can = {
    // Data management (Park operations belong to company admin / employee)
    createCustomer: isCompanyAdmin,
    editCustomer: isCompanyAdmin,
    deleteCustomer: isCompanyAdmin,

    createVehicle: isCompanyAdmin,
    editVehicle: isCompanyAdmin,
    deleteVehicle: isCompanyAdmin,

    createSubscription: isCompanyAdmin,
    editSubscription: isCompanyAdmin,
    deleteSubscription: isCompanyAdmin,
    renewSubscription: isCompanyAdmin || isEmployee,
    cancelSubscription: isCompanyAdmin,

    viewPayments: isCompanyAdmin,
    createPayment: isCompanyAdmin,

    // Admin (Super Admin only manages companies & global users/roles)
    manageUsers: isSuperAdmin || isCompanyAdmin,
    manageCompanies: isSuperAdmin,
    viewAdminPanel: isSuperAdmin,
  }

  const hasRole = (requiredRole: UserRole) => {
    const hierarchy: UserRole[] = ['employee', 'company_admin', 'super_admin']
    if (!role) return false
    return hierarchy.indexOf(role) >= hierarchy.indexOf(requiredRole)
  }

  return { role, isSuperAdmin, isCompanyAdmin, isEmployee, can, hasRole }
}

