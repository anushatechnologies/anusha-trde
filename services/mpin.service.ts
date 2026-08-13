import { readSecure, writeSecure } from '../utils/storage';

const AUTH_MPIN_RECORDS_KEY = 'investapp.auth.mpin-records';

type MpinAccount = {
  email?: string;
  mobile?: string;
};

type StoredMpinRecord = {
  email: string;
  mobile: string;
  mpin: string;
  updatedAt: string;
};

const normalizeEmail = (value?: string) => value?.trim().toLowerCase() || '';
const normalizeMobile = (value?: string) => value?.trim() || '';

const matchesRecord = (record: StoredMpinRecord, account: MpinAccount) => {
  const email = normalizeEmail(account.email);
  const mobile = normalizeMobile(account.mobile);

  return (email && record.email === email) || (mobile && record.mobile === mobile);
};

const readRecords = async () => {
  return (await readSecure<StoredMpinRecord[]>(AUTH_MPIN_RECORDS_KEY)) ?? [];
};

export const mpinService = {
  saveMpinForAccount: async (account: MpinAccount & { mpin: string }) => {
    const email = normalizeEmail(account.email);
    const mobile = normalizeMobile(account.mobile);
    const mpin = account.mpin.trim();

    if (!mpin || (!email && !mobile)) {
      return;
    }

    const records = await readRecords();
    const nextRecord: StoredMpinRecord = {
      email,
      mobile,
      mpin,
      updatedAt: new Date().toISOString(),
    };

    const nextRecords = [...records.filter((record) => !matchesRecord(record, { email, mobile })), nextRecord];
    await writeSecure(AUTH_MPIN_RECORDS_KEY, nextRecords);
  },
  getMpinForAccount: async (account: MpinAccount) => {
    const records = await readRecords();
    const matched = records.find((record) => matchesRecord(record, account));
    return matched?.mpin ?? null;
  },
  hasMpinForAccount: async (account: MpinAccount) => {
    return Boolean(await mpinService.getMpinForAccount(account));
  },
  verifyMpinForAccount: async (account: MpinAccount, input: string) => {
    const storedMpin = await mpinService.getMpinForAccount(account);

    if (!storedMpin) {
      return false;
    }

    return storedMpin === input.trim();
  },
  hasAnyStoredMpin: async () => {
    const records = await readRecords();
    return records.length > 0;
  },
};
