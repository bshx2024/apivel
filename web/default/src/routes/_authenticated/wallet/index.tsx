/*
Copyright (C) 2023-2026 QuantumNous
AGPLv3 License
*/
import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Wallet } from '@/features/wallet'

const walletSearchSchema = z
  .object({
    show_history: z.union([z.boolean(), z.string()]).optional().catch(undefined),
    amount: z.union([z.number(), z.string()]).optional().catch(undefined),
    auto_pay: z.union([z.boolean(), z.string()]).optional().catch(undefined),
  })
  .passthrough()
  .catch({})

export const Route = createFileRoute('/_authenticated/wallet/')({
  component: RouteComponent,
  validateSearch: walletSearchSchema,
})

function RouteComponent() {
  const search = Route.useSearch()
  
  const rawAmount = search?.amount
  const rawShowHistory = search?.show_history
  const rawAutoPay = search?.auto_pay

  const parsedAmount =
    rawAmount !== undefined && rawAmount !== null && rawAmount !== ''
      ? Number(rawAmount)
      : undefined

  const isShowHistory = rawShowHistory === true || rawShowHistory === 'true'
  const isAutoPay = rawAutoPay === true || rawAutoPay === 'true'

  return (
    <Wallet
      initialShowHistory={isShowHistory}
      initialAmount={isNaN(parsedAmount as number) ? undefined : parsedAmount}
      autoPay={isAutoPay}
    />
  )
}
