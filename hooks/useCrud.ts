"use client"

import { useState, useEffect } from "react"
import { getAll, createItem } from "@/services/base.service"

export function useCrud(table: string) {

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    const result = await getAll(table)
    setData(result || [])
    setLoading(false)
  }

  async function create(data: any) {
    await createItem(table, data)
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    data,
    loading,
    create,
    reload: loadData
  }
}