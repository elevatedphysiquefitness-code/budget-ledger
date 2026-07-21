import ProgressBar from "@/components/ledger/ProgressBar";
import { utilizationBucket, utilizationRatio } from "@/lib/computations/creditUtilization";

export default function UtilizationBar({ balance, limit }: { balance: number; limit: number }) {
  const ratio = utilizationRatio(balance, limit);
  const bucket = utilizationBucket(ratio);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted mb-1">
        <span>{(ratio * 100).toFixed(0)}% utilized</span>
        <span>{bucket === "red" ? "High" : bucket === "amber" ? "Moderate" : "Healthy"}</span>
      </div>
      <ProgressBar ratio={ratio} color={bucket} />
    </div>
  );
}
