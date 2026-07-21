"use client";

import { usePlaidLink } from "react-plaid-link";

export default function PlaidLinkButton({
  linkToken,
  onSuccess,
}: {
  linkToken: string;
  onSuccess: (publicToken: string, institutionName: string | null) => void;
}) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      onSuccess(publicToken, metadata.institution?.name ?? null);
    },
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-background disabled:opacity-50"
    >
      Connect bank account
    </button>
  );
}
