import type {
  Account,
  AccountWithBalance,
  CreditCard,
  CreditCardSummary,
  CrochetOrder,
  Transaction,
} from "./types";

const PERSONAL_OUTFLOW = new Set([
  "expense",
  "card_payment",
  "goal_contribution",
]);

const PERSONAL_INFLOW = new Set(["income"]);

/** ¿La cuenta tiene saldo inicial configurado por la usuaria? */
export function isBalanceConfigured(account: Account): boolean {
  // 0 puede ser válido si la usuaria lo configuró; usamos notes/onboarding flag
  // Convención: accounts sin configurar tienen initial_balance = 0 y notes = '__unconfigured__'
  return account.notes !== "__unconfigured__";
}

export function computeAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  let balance = account.initial_balance;

  for (const tx of transactions) {
    if (tx.status !== "confirmed") continue;

    switch (tx.type) {
      case "income":
      case "crochet_income":
        if (tx.account_id === account.id) balance += tx.amount;
        break;
      case "expense":
      case "crochet_expense":
      case "goal_contribution":
        if (tx.account_id === account.id && account.type !== "credit_card") {
          balance -= tx.amount;
        }
        break;
      case "transfer":
        if (tx.account_id === account.id) balance -= tx.amount;
        if (tx.to_account_id === account.id) balance += tx.amount;
        break;
      case "card_payment":
        if (tx.account_id === account.id) balance -= tx.amount;
        break;
      default:
        break;
    }
  }

  return balance;
}

/** Deuda de tarjeta = gastos con tarjeta − pagos a tarjeta (sobre saldo inicial de deuda) */
export function computeCardDebt(
  account: Account,
  transactions: Transaction[]
): number {
  // initial_balance en tarjetas representa deuda inicial
  let debt = account.initial_balance;

  for (const tx of transactions) {
    if (tx.status !== "confirmed") continue;

    if (
      (tx.type === "expense" || tx.type === "crochet_expense") &&
      tx.account_id === account.id
    ) {
      debt += tx.amount;
    }
    if (tx.type === "card_payment" && tx.to_account_id === account.id) {
      debt -= tx.amount;
    }
  }

  return Math.max(0, debt);
}

export function enrichAccounts(
  accounts: Account[],
  transactions: Transaction[]
): AccountWithBalance[] {
  return accounts.map((account) => {
    if (account.type === "credit_card") {
      return {
        ...account,
        balance: computeCardDebt(account, transactions),
        balanceConfigured: isBalanceConfigured(account),
      };
    }
    return {
      ...account,
      balance: computeAccountBalance(account, transactions),
      balanceConfigured: isBalanceConfigured(account),
    };
  });
}

/**
 * Ajusta initial_balance para que el saldo calculado sea `desired`.
 * Así no se pierden los movimientos ya registrados.
 */
export function initialBalanceForDesired(
  account: Account,
  transactions: Transaction[],
  desired: number
): number {
  const current = computeAccountBalance(account, transactions);
  const netFromTxs = current - account.initial_balance;
  return Math.round(desired) - netFromTxs;
}

/** Entradas / salidas de una cuenta en un mes */
export function accountMonthFlow(
  accountId: string,
  transactions: Transaction[],
  year: number,
  month: number
): { in: number; out: number } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  let inflow = 0;
  let outflow = 0;

  for (const tx of transactions) {
    if (tx.status !== "confirmed") continue;
    if (tx.date < from || tx.date > to) continue;

    if (
      (tx.type === "income" || tx.type === "crochet_income") &&
      tx.account_id === accountId
    ) {
      inflow += tx.amount;
    } else if (
      (tx.type === "expense" ||
        tx.type === "crochet_expense" ||
        tx.type === "goal_contribution" ||
        tx.type === "card_payment") &&
      tx.account_id === accountId
    ) {
      outflow += tx.amount;
    } else if (tx.type === "transfer") {
      if (tx.to_account_id === accountId) inflow += tx.amount;
      if (tx.account_id === accountId) outflow += tx.amount;
    }
  }

  return { in: inflow, out: outflow };
}

export function enrichCreditCards(
  cards: CreditCard[],
  accounts: Account[],
  transactions: Transaction[]
): CreditCardSummary[] {
  return cards.map((card) => {
    const account = accounts.find((a) => a.id === card.account_id) ?? null;
    const debt = account ? computeCardDebt(account, transactions) : 0;
    const available =
      card.credit_limit != null ? Math.max(0, card.credit_limit - debt) : null;

    return {
      ...card,
      account,
      debt,
      available,
      debtConfigured: account ? isBalanceConfigured(account) : false,
    };
  });
}

export function personalAvailableBalance(
  accounts: AccountWithBalance[]
): { total: number; anyConfigured: boolean } {
  const personal = accounts.filter(
    (a) => a.type !== "credit_card" && a.is_active
  );
  const total = personal.reduce((sum, a) => sum + a.balance, 0);
  return { total, anyConfigured: personal.length > 0 };
}

export function sumByType(
  transactions: Transaction[],
  types: string[],
  opts?: { tag?: "personal" | "crochet"; from?: string; to?: string }
) {
  return transactions
    .filter((tx) => {
      if (tx.status !== "confirmed") return false;
      if (!types.includes(tx.type)) return false;
      if (opts?.tag && tx.tag !== opts.tag) return false;
      if (opts?.from && tx.date < opts.from) return false;
      if (opts?.to && tx.date > opts.to) return false;
      return true;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function monthPersonalIncome(
  transactions: Transaction[],
  from: string,
  to: string
) {
  return sumByType(transactions, [...PERSONAL_INFLOW], {
    tag: "personal",
    from,
    to,
  });
}

export function monthPersonalExpense(
  transactions: Transaction[],
  from: string,
  to: string
) {
  return sumByType(transactions, [...PERSONAL_OUTFLOW], {
    tag: "personal",
    from,
    to,
  });
}

export function expensesByCategory(
  transactions: Transaction[],
  from: string,
  to: string,
  tag: "personal" | "crochet" = "personal"
) {
  const map = new Map<string, { name: string; amount: number; color: string }>();

  for (const tx of transactions) {
    if (tx.status !== "confirmed") continue;
    if (tx.tag !== tag) continue;
    if (tx.type !== "expense" && tx.type !== "crochet_expense") continue;
    if (tx.date < from || tx.date > to) continue;

    const key = tx.category_id ?? "sin-categoria";
    const name = tx.category?.name ?? "Sin categoría";
    const color = tx.category?.color ?? "#D4A5A5";
    const prev = map.get(key) ?? { name, amount: 0, color };
    prev.amount += tx.amount;
    map.set(key, prev);
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function orderProfit(order: CrochetOrder): number {
  return (
    order.agreed_price -
    order.materials_cost -
    order.packaging_cost -
    order.shipping_cost -
    order.other_costs
  );
}

export function orderBalance(order: CrochetOrder): number {
  return Math.max(0, order.agreed_price - order.advance_received);
}

export function nextCardDate(day: number | null | undefined, from = new Date()) {
  if (!day) return null;
  const year = from.getFullYear();
  const month = from.getMonth();
  let candidate = new Date(year, month, Math.min(day, daysInMonth(year, month)));
  if (candidate < new Date(year, month, from.getDate())) {
    const nm = month + 1;
    const ny = nm > 11 ? year + 1 : year;
    const realMonth = nm % 12;
    candidate = new Date(
      ny,
      realMonth,
      Math.min(day, daysInMonth(ny, realMonth))
    );
  }
  return candidate;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function budgetHealth(
  spent: number,
  allocated: number
): "ok" | "near" | "over" | "empty" {
  if (allocated <= 0) return "empty";
  const ratio = spent / allocated;
  if (ratio > 1) return "over";
  if (ratio >= 0.85) return "near";
  return "ok";
}
