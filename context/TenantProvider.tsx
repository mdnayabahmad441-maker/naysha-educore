"use client"

import { createContext, useContext } from "react"
import { useTenant } from "@/hooks/useTenant"

const TenantContext = createContext<any>(null)

export function TenantProvider({ children }: any) {
  const school = useTenant()
  return (
    <TenantContext.Provider value={school}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext() {
  return useContext(TenantContext)
}