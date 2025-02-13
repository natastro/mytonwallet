import { Account, AccountState, GlobalState } from '../types';
import { ApiToken, ApiTransaction } from '../../api/types';
import { selectAccount, selectAccountState, selectCurrentAccountState } from '../selectors';
import { TON_TOKEN_SLUG } from '../../config';
import { genRelatedAccountIds } from '../../util/account';

export function updateAuth(global: GlobalState, authUpdate: Partial<GlobalState['auth']>) {
  return {
    ...global,
    auth: {
      ...global.auth,
      ...authUpdate,
    },
  } as GlobalState;
}

export function updateAccounts(
  global: GlobalState,
  state: Partial<GlobalState['accounts']>,
) {
  return {
    ...global,
    accounts: {
      ...(global.accounts || { byId: {} }),
      ...state,
    },
  };
}

export function updateAccount(
  global: GlobalState,
  accountId: string,
  address: string,
  title: string = 'New Wallet',
) {
  const newAccountsById = genRelatedAccountIds(accountId).reduce((state, accId) => {
    state[accId] = {
      address,
      title,
    };
    return state;
  }, {} as Record<string, Account>);

  return {
    ...global,
    accounts: {
      ...global.accounts,
      byId: {
        ...global.accounts?.byId,
        ...newAccountsById,
      },
    },
  };
}

export function renameAccount(
  global: GlobalState,
  accountId: string,
  title: string = 'New Wallet',
) {
  const { address } = selectAccount(global, accountId)!;

  return updateAccount(global, accountId, address, title);
}

export function updateBalance(
  global: GlobalState, accountId: string, slug: string, balance: string,
): GlobalState | undefined {
  const { balances } = selectAccountState(global, accountId) || {};
  if (balances?.bySlug[slug] === balance) {
    return undefined;
  }

  return updateAccountState(global, accountId, {
    balances: {
      ...balances,
      bySlug: {
        ...balances?.bySlug,
        [slug]: balance,
      },
    },
  });
}

export function updateSendingLoading(global: GlobalState, isLoading: boolean): GlobalState {
  return {
    ...global,
    currentTransfer: {
      ...global.currentTransfer,
      isLoading,
    },
  };
}

export function updateTokens(global: GlobalState, tokens: Record<string, ApiToken>): GlobalState {
  if (!tokens[TON_TOKEN_SLUG].quote.price && global.tokenInfo?.bySlug[TON_TOKEN_SLUG]) {
    return global;
  }

  return {
    ...global,
    tokenInfo: {
      ...global.tokenInfo,
      bySlug: {
        ...(global.tokenInfo && global.tokenInfo.bySlug),
        ...tokens,
      },
    },
  };
}

export function updateTransaction(global: GlobalState, transaction: ApiTransaction): GlobalState {
  const { transactions } = selectCurrentAccountState(global) || {};

  return updateCurrentAccountState(global, {
    transactions: {
      ...transactions,
      byTxId: { ...transactions?.byTxId, [transaction.txId]: transaction },
      orderedTxIds: (transactions?.orderedTxIds || []).includes(transaction.txId)
        ? transactions?.orderedTxIds
        : [transaction.txId].concat(transactions?.orderedTxIds || []),
    },
  });
}

export function updateCurrentAccountState(global: GlobalState, partial: Partial<AccountState>): GlobalState {
  return updateAccountState(global, global.currentAccountId!, partial);
}

export function updateCurrentAccountsState(global: GlobalState, partial: Partial<AccountState>): GlobalState {
  for (const accountId of genRelatedAccountIds(global.currentAccountId!)) {
    global = updateAccountState(global, accountId, partial);
  }
  return global;
}

export function updateAccountState(
  global: GlobalState, accountId: string, partial: Partial<AccountState>,
): GlobalState {
  const accountState = selectAccountState(global, accountId);

  return {
    ...global,
    byAccountId: {
      ...global.byAccountId,
      [accountId]: {
        ...accountState,
        ...partial,
      },
    },
  };
}
