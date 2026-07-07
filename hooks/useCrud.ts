"use client"

import { useCallback, useEffect, useState } from "react"
import { getAll, createItem } from "@/services/base.service"

export function useCrud(table: string) {

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await getAll(table)
    setData(result || [])
    setLoading(false)
  }, [table])

  async function create(data: any) {
    await createItem(table, data)
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    create,
    reload: loadData
  }
}
