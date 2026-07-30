import { LandingNavbar } from "@/components/landing-navbar";
import { DiagnosticWizard } from "@/components/diagnostic-wizard";

export default function Home() {
    return (
        <div className="min-h-svh bg-background relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-[120px]" />
            </div>
            <LandingNavbar />
            <main className="pt-28 pb-24 relative">
                <DiagnosticWizard />
            </main>
        </div>
    );
}
