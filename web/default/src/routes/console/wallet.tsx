/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'

const walletSearchSchema = z.record(z.string(), z.unknown()).catch({})

export const Route = createFileRoute('/console/wallet')({
  validateSearch: walletSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/wallet',
      search: { show_history: true, ...search },
    })
  },
})
