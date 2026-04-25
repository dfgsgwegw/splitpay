import { Link } from "wouter";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Users,
  Zap,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetStatsForUser,
  useListSplitsForUser,
  getGetStatsForUserQueryKey,
  getListSplitsForUserQueryKey,
} from "@workspace/api-client-react";
import { formatUsdcDisplay, shortAddress, useAccount, ConnectButton } from "@/lib/web3";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { address, isConnected } = useAccount();
  const userAddress = address ?? "";

  const { data: stats, isLoading: statsLoading } = useGetStatsForUser(userAddress, {
    query: {
      queryKey: getGetStatsForUserQueryKey(userAddress),
      enabled: !!address && isConnected,
    },
  });

  const { data: recentSplits, isLoading: splitsLoading } = useListSplitsForUser(userAddress, {
    query: {
      queryKey: getListSplitsForUserQueryKey(userAddress),
      enabled: !!address && isConnected,
    },
  });

  const visibleSplits = recentSplits?.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8">
              <Zap className="w-3.5 h-3.5" />
              <span>Powered by USDC on Arc Network</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Split bills instantly <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-fuchsia-400">with one link.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Bills, group dinners, trips. Settle them on-chain in seconds. Create a split, share the link, and let your friends pay their share in USDC. No sign-ups, no fees, no hassle.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/create">
                <Button size="lg" className="h-14 px-8 text-base font-semibold w-full sm:w-auto shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]">
                  Create a split
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold w-full bg-white/5 border-white/10 hover:bg-white/10">
                  How it works
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personal Stats Section */}
      <section className="py-12 md:py-16 border-y border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6 md:mb-8 flex-wrap gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Your activity</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {isConnected
                  ? "Stats from splits you created or paid into"
                  : "Connect your wallet to see your personal stats"}
              </p>
            </div>
            {isConnected && address && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {shortAddress(address)}
              </div>
            )}
          </div>

          {!isConnected ? (
            <Card className="bg-white/[0.02] border-white/10 border-dashed">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 px-6">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Connect to see your stats</h3>
                    <p className="text-sm text-muted-foreground">Splits stay private to people involved.</p>
                  </div>
                </div>
                <ConnectButton />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                label="Total Volume"
                value={stats ? Number(formatUsdcDisplay(stats.totalVolume || "0", { withSymbol: false }).replace(/,/g, "")) : 0}
                suffix=" USDC"
                loading={statsLoading}
                icon={<TrendingUp className="w-5 h-5" />}
                gradientFrom="from-primary/20"
                gradientTo="to-fuchsia-500/10"
                iconColor="text-primary"
                decimals={2}
              />
              <StatCard
                label="Active Splits"
                value={stats?.activeSplits ?? 0}
                loading={statsLoading}
                icon={<Activity className="w-5 h-5" />}
                gradientFrom="from-emerald-500/20"
                gradientTo="to-cyan-500/10"
                iconColor="text-emerald-400"
              />
              <StatCard
                label="Total Splits"
                value={stats?.totalSplits ?? 0}
                loading={statsLoading}
                icon={<Users className="w-5 h-5" />}
                gradientFrom="from-blue-500/20"
                gradientTo="to-indigo-500/10"
                iconColor="text-blue-400"
              />
              <StatCard
                label="Payments Made"
                value={stats?.totalParticipantsPaid ?? 0}
                loading={statsLoading}
                icon={<CheckCircle2 className="w-5 h-5" />}
                gradientFrom="from-amber-500/20"
                gradientTo="to-orange-500/10"
                iconColor="text-amber-400"
              />
            </div>
          )}
        </div>
      </section>

      {/* Recent Splits Section */}
      {isConnected && (
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Your recent splits</h2>
              <Link href="/me" className="text-sm font-medium text-primary flex items-center hover:underline">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {splitsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
                ))
              ) : visibleSplits?.length ? (
                visibleSplits.map((split, i) => {
                  const isMine = address && split.creatorAddress.toLowerCase() === address.toLowerCase();
                  return (
                    <motion.div
                      key={split.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                    >
                      <Link href={`/split/${split.id}`}>
                        <Card className="h-full bg-white/[0.02] border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group hover:border-primary/50">
                          <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5" />
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Total</div>
                                <div className="font-bold text-lg text-foreground">{formatUsdcDisplay(split.totalAmount, { withSymbol: false })} <span className="text-xs text-primary">USDC</span></div>
                              </div>
                            </div>
                            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{split.title || "Untitled Split"}</h3>
                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                                {isMine ? "Created by you" : "You paid"}
                              </span>
                              <span className="text-primary font-medium">{split.paidCount}/{split.participantCount} paid</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-white/5 rounded-xl border border-white/5">
                  No splits yet. <Link href="/create" className="text-primary hover:underline">Create your first one</Link>.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white/[0.02] border-t border-white/5">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-primary">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create a split</h3>
              <p className="text-muted-foreground">Connect your wallet, enter the total amount, and choose how many people are paying.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-primary">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Share the link</h3>
              <p className="text-muted-foreground">Send the unique link to your friends. They don't need an account, just a wallet.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-primary">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get paid in USDC</h3>
              <p className="text-muted-foreground">Friends pay their share directly to the smart contract, which settles in real-time.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    return decimals
      ? latest.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.floor(latest).toLocaleString();
  });

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, {
        duration: 1.2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    return rounded.on("change", (latest) => {
      if (ref.current) ref.current.textContent = latest;
    });
  }, [rounded]);

  return <span ref={ref}>{decimals ? (0).toFixed(decimals) : "0"}</span>;
}

function StatCard({
  label,
  value,
  suffix,
  loading,
  icon,
  gradientFrom,
  gradientTo,
  iconColor,
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  loading?: boolean;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  decimals?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-br ${gradientFrom} ${gradientTo} p-4 md:p-5 backdrop-blur`}
    >
      {/* Decorative blob */}
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full ${gradientFrom} blur-2xl opacity-60 pointer-events-none`} />

      <div className="relative flex items-start justify-between mb-3 md:mb-4">
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>

      <div className="relative">
        <div className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </div>
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums leading-tight break-all">
          {loading ? (
            <Skeleton className="h-7 md:h-9 w-20 bg-white/10" />
          ) : (
            <>
              <AnimatedNumber value={value} decimals={decimals} />
              {suffix && <span className="text-xs md:text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
