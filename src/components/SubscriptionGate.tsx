import { useState } from "react";
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePersistentState } from "@/lib/storage";

const DEFAULT_CODE = "999888";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = usePersistentState<boolean>("unlocked", false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (unlocked) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === DEFAULT_CODE) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Invalid subscription code. Contact your reseller for a valid key.");
    }
  };

  return (
    <main className="grid-canvas flex min-h-screen items-center justify-center px-4 py-16">
      <section className="panel w-full max-w-md p-8">
        <div className="brand-gradient mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Graphic Designer &amp; Branding for Pilot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workstation is licensed. Enter your subscription code to unlock the studio, the AI
          operator and the CorelDRAW X7 bridge.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <label htmlFor="code" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Subscription code
          </label>
          <div className="relative">
            <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              inputMode="numeric"
              autoComplete="off"
              className="h-12 pl-9 font-mono text-lg tracking-[0.4em]"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold">
            Unlock studio
          </Button>
        </form>

        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          Your licence, sessions and preferences stay on this device.
        </p>
      </section>
    </main>
  );
}
